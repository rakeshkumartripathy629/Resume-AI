import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { getLlm } from './llm';
import { JobRequirementsSchema, type JobRequirements } from './schemas';
import {
  CompactTailoredResumeSchema,
  KeywordExtractionSchema,
  type CompactTailoredResume,
  type KeywordExtraction,
  type ATSAnalysis,
  computeAtsAnalysis,
  injectMissingKeywords,
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
  keywordData: Annotation<KeywordExtraction | null>({
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
        const delay = 10000 * attempt;
        console.warn(JSON.stringify({ level: 'warn', service: 'agent-service', msg: `${label} rate-limited (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms` }));
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// ── Node 1: Extract Requirements + Keywords ─────────────────────────────────

async function extractRequirementsNode(
  state: TailorState
): Promise<Partial<TailorState>> {
  const llm = getLlm();

  // Two structured outputs from one LLM call — parse sequentially
  const requirements = await withNodeRetry(async () => {
    const reqLlm = llm.withStructuredOutput(JobRequirementsSchema);
    return reqLlm.invoke([
      ['system', 'Extract job requirements. Normalize tool names. Be precise.'],
      ['human', state.jobDescription.slice(0, 2500)],
    ]);
  }, 'extract_requirements');

  const keywordData = await withNodeRetry(async () => {
    const kwLlm = llm.withStructuredOutput(KeywordExtractionSchema);
    return kwLlm.invoke([
      ['system', 'Extract ALL keywords from this job description that an ATS system would scan for. Be exhaustive.'],
      ['human', state.jobDescription.slice(0, 2500)],
    ]);
  }, 'extract_keywords');

  return { requirements, keywordData };
}

// ── Node 2: Tailor Resume (with mandatory keyword list) ────────────────────

async function tailorResumeNode(state: TailorState): Promise<Partial<TailorState>> {
  await sleep(30000);

  // Build mandatory keyword list for the LLM
  const mandatoryKws = [
    ...(state.keywordData?.mustIncludeKeywords ?? []),
    ...(state.keywordData?.coreSkills ?? []),
    ...(state.requirements?.hardSkills ?? []),
  ];
  const uniqueKws = [...new Set(mandatoryKws)].slice(0, 25);

  const tailoredResume = await withNodeRetry(async () => {
    const llm = getLlm().withStructuredOutput(CompactTailoredResumeSchema);
    return llm.invoke([
      [
        'system',
        'You are an ATS resume optimizer. Your #1 goal is MAXIMUM keyword coverage while keeping the resume truthful.\n\n' +
        `MANDATORY KEYWORDS that MUST appear in the resume (in skills, experience bullets, or summary):\n${uniqueKws.join(', ')}\n\n` +
        'RULES:\n' +
        '1. NEVER fabricate companies, roles, projects, or metrics.\n' +
        '2. ALL mandatory keywords MUST appear naturally in the resume.\n' +
        '3. Put mandatory keywords at the TOP of the skills array.\n' +
        '4. Weave keywords into experience bullets where relevant.\n' +
        '5. Use strong action verbs. Preserve real numbers.\n' +
        '6. Only include projects/certifications from the original resume.\n' +
        '7. Professional summary must include 2-3 core keywords.',
      ],
      [
        'human',
        `RESUME:\n${state.resumeText.slice(0, 2500)}\n\n` +
        `JOB DESCRIPTION:\n${state.jobDescription.slice(0, 1500)}\n\n` +
        `JOB TITLE: ${state.requirements?.roleTitle}\n` +
        `CORE SKILLS: ${state.keywordData?.coreSkills?.join(', ')}\n\n` +
        'Generate tailored resume with ALL mandatory keywords included.',
      ],
    ]);
  }, 'tailor_resume');
  return { tailoredResume };
}

// ── Post-Processing: Inject Any Missing Keywords ────────────────────────────

function postProcessNode(state: TailorState): Partial<TailorState> {
  if (!state.tailoredResume || !state.requirements) return {};

  // First ATS pass
  let atsAnalysis = computeAtsAnalysis(
    state.tailoredResume,
    state.requirements,
    state.jobDescription,
    state.keywordData ?? undefined
  );

  // If missing keywords, inject them and re-score
  if (atsAnalysis.missingKeywords.length > 0) {
    const injected = injectMissingKeywords(
      state.tailoredResume,
      atsAnalysis.missingKeywords,
      state.requirements
    );

    // Re-score after injection
    atsAnalysis = computeAtsAnalysis(
      injected,
      state.requirements,
      state.jobDescription,
      state.keywordData ?? undefined
    );

    return { tailoredResume: injected, atsAnalysis };
  }

  return { atsAnalysis };
}

// ── Graph Assembly ──────────────────────────────────────────────────────────

const workflow = new StateGraph(TailorGraphState)
  .addNode('extract_requirements', extractRequirementsNode)
  .addNode('tailor_resume', tailorResumeNode)
  .addNode('post_process', postProcessNode)
  .addEdge(START, 'extract_requirements')
  .addEdge('extract_requirements', 'tailor_resume')
  .addEdge('tailor_resume', 'post_process')
  .addEdge('post_process', END);

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
  if (!finalState.atsAnalysis) {
    throw new Error('Post-processing failed');
  }

  const fullResume = compactToFull(finalState.tailoredResume);

  return {
    tailoredResume: finalState.tailoredResume,
    atsAnalysis: finalState.atsAnalysis,
    fullResume,
  };
}
