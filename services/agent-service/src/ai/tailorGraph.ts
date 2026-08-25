import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { getLlm } from './llm';
import { JobRequirementsSchema, type JobRequirements } from './schemas';
import {
  CompactTailoredResumeSchema,
  type CompactTailoredResume,
  type ATSAnalysis,
  computeAtsAnalysis,
  compactToFull,
} from './tailorSchemas';

// ── Graph State ─────────────────────────────────────────────────────────────

const TailorGraphState = Annotation.Root({
  resumeText: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  jobDescription: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  requirements: Annotation<JobRequirements | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
  tailoredResume: Annotation<CompactTailoredResume | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
  atsAnalysis: Annotation<ATSAnalysis | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
});

type TailorState = typeof TailorGraphState.State;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withNodeRetry<T>(fn: () => Promise<T>, label: string, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      const isRateLimit = msg.includes('429') || msg.includes('rate limit') || msg.includes('tokens per minute');
      if (isRateLimit && attempt < maxAttempts) {
        const delay = 8000 * attempt;
        console.warn(JSON.stringify({ level: 'warn', service: 'agent-service', msg: `${label} rate-limited (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms` }));
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// ── Node 1: Extract Requirements (JD only, small) ──────────────────────────

async function extractRequirementsNode(
  state: TailorState
): Promise<Partial<TailorState>> {
  const requirements = await withNodeRetry(async () => {
    const llm = getLlm().withStructuredOutput(JobRequirementsSchema);
    return llm.invoke([
      [
        'system',
        'Extract job requirements from a posting. Normalize tool names. Return structured output.',
      ],
      ['human', state.jobDescription.slice(0, 2000)],
    ]);
  }, 'extract_requirements');
  return { requirements };
}

// ── Node 2: Generate Tailored Resume (compact, small) ───────────────────────

async function tailorResumeNode(state: TailorState): Promise<Partial<TailorState>> {
  await sleep(30000);

  const tailoredResume = await withNodeRetry(async () => {
    const llm = getLlm().withStructuredOutput(CompactTailoredResumeSchema);
    return llm.invoke([
      [
        'system',
        'You are an ATS resume optimizer. Tailor the resume to match the job.\n' +
        'RULES:\n' +
        '- NEVER fabricate companies, roles, projects, skills, or metrics.\n' +
        '- Only restructure existing information with better wording.\n' +
        '- Use strong action verbs. Preserve real numbers.\n' +
        '- Prioritize JD-relevant skills at top.\n' +
        '- Only include projects/certifications from original resume.',
      ],
      [
        'human',
        `RESUME:\n${state.resumeText.slice(0, 2000)}\n\n` +
        `JOB:\n${state.jobDescription.slice(0, 1500)}\n\n` +
        `REQUIREMENTS:\n${JSON.stringify(state.requirements)}\n\n` +
        'Generate tailored resume.',
      ],
    ]);
  }, 'tailor_resume');
  return { tailoredResume };
}

// ── Graph Assembly ──────────────────────────────────────────────────────────

const workflow = new StateGraph(TailorGraphState)
  .addNode('extract_requirements', extractRequirementsNode)
  .addNode('tailor_resume', tailorResumeNode)
  .addEdge(START, 'extract_requirements')
  .addEdge('extract_requirements', 'tailor_resume')
  .addEdge('tailor_resume', END);

const tailorGraph = workflow.compile();

const GRAPH_TIMEOUT_MS = 120_000;

export async function runResumeTailoring(
  resumeText: string,
  jobDescription: string
): Promise<{ tailoredResume: CompactTailoredResume; atsAnalysis: ATSAnalysis; fullResume: ReturnType<typeof compactToFull> }> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Tailoring timed out after 2 minutes')), GRAPH_TIMEOUT_MS)
  );

  const graphPromise = tailorGraph.invoke({ resumeText, jobDescription });

  const finalState = await Promise.race([graphPromise, timeoutPromise]);

  if (!finalState.tailoredResume) {
    throw new Error('Tailoring graph produced no resume');
  }
  if (!finalState.requirements) {
    throw new Error('Tailoring graph missing requirements');
  }

  // Compute ATS analysis algorithmically — zero LLM tokens
  const atsAnalysis = computeAtsAnalysis(
    finalState.tailoredResume,
    finalState.requirements,
    jobDescription
  );

  const fullResume = compactToFull(finalState.tailoredResume);

  return {
    tailoredResume: finalState.tailoredResume,
    atsAnalysis,
    fullResume,
  };
}
