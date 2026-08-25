import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { getLlm } from './llm';
import {
  JobRequirementsSchema,
  MatchAnalysisSchema,
  ScoreResultSchema,
  type JobRequirements,
  type MatchAnalysis,
  type ScoreResult,
} from './schemas';

const GraphState = Annotation.Root({
  resumeText: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  jobDescription: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  requirements: Annotation<JobRequirements | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
  analysis: Annotation<MatchAnalysis | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
  result: Annotation<ScoreResult | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
});

type GraphStateType = typeof GraphState.State;

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
        const delay = 5000 * attempt;
        console.warn(JSON.stringify({ level: 'warn', service: 'agent-service', msg: `${label} rate-limited (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms` }));
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// ── Node 1: Extract Requirements (small input: JD only) ────────────────────

async function extractRequirementsNode(
  state: GraphStateType
): Promise<Partial<GraphStateType>> {
  const requirements = await withNodeRetry(async () => {
    const llm = getLlm().withStructuredOutput(JobRequirementsSchema);
    return llm.invoke([
      [
        'system',
        'You are an expert technical recruiter. Extract the true requirements from a job posting. ' +
          'Be precise: only include skills/keywords the posting actually mentions or clearly implies. ' +
          'Normalize tool names (e.g. "React.js" -> "React").',
      ],
      ['human', `Job description:\n\n${state.jobDescription.slice(0, 3000)}`],
    ]);
  }, 'extract_requirements');
  return { requirements };
}

// ── Node 2: Analyze Match (medium input: trim both JD and resume) ──────────

async function analyzeMatchNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  await sleep(5000);

  const analysis = await withNodeRetry(async () => {
    const llm = getLlm().withStructuredOutput(MatchAnalysisSchema);
    return llm.invoke([
      [
        'system',
        'You are a meticulous ATS (applicant tracking system). Compare the candidate resume against ' +
          'the job requirements. List exactly which required skills and keywords are present vs missing. ' +
          'Check whether achievements include numbers/metrics. Note formatting problems only if real.',
      ],
      [
        'human',
        `Extracted requirements:\n${JSON.stringify(state.requirements, null, 2)}\n\n` +
          `Job description:\n${state.jobDescription.slice(0, 1500)}\n\n` +
          `Candidate resume:\n${state.resumeText.slice(0, 3000)}`,
      ],
    ]);
  }, 'analyze_match');
  return { analysis };
}

// ── Node 3: Generate Report (small input: rely on analysis data) ────────────

async function generateReportNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  await sleep(5000);

  const result = await withNodeRetry(async () => {
    const llm = getLlm().withStructuredOutput(ScoreResultSchema);
    return llm.invoke([
      [
        'system',
        'You are a senior technical recruiter producing the final resume scorecard. ' +
          'Ground every category score in the provided analysis data — do not invent facts. ' +
          'Calibrate scores honestly: keywordMatch should track keyword coverage closely; ' +
          'experienceImpact rewards quantified achievements; formattingClarity penalizes listed issues. ' +
          'Improvements must be specific and actionable (what to add/change, where). ' +
          'overallScore is a weighted blend of the four categories (keywords 30%, skills 30%, impact 25%, formatting 15%). ' +
          'verdict thresholds: >=80 strong_match, >=65 good, >=45 needs_work, else poor.',
      ],
      [
        'human',
        `Requirements:\n${JSON.stringify(state.requirements, null, 2)}\n\n` +
          `Match analysis:\n${JSON.stringify(state.analysis, null, 2)}\n\n` +
          `Job description:\n${state.jobDescription.slice(0, 1000)}\n\n` +
          `Resume:\n${state.resumeText.slice(0, 2000)}`,
      ],
    ]);
  }, 'generate_report');
  return { result };
}

const workflow = new StateGraph(GraphState)
  .addNode('extract_requirements', extractRequirementsNode)
  .addNode('analyze_match', analyzeMatchNode)
  .addNode('generate_report', generateReportNode)
  .addEdge(START, 'extract_requirements')
  .addEdge('extract_requirements', 'analyze_match')
  .addEdge('analyze_match', 'generate_report')
  .addEdge('generate_report', END);

export const scoringGraph = workflow.compile();

export async function runResumeScoring(
  resumeText: string,
  jobDescription: string
): Promise<ScoreResult> {
  const finalState = await scoringGraph.invoke({ resumeText, jobDescription });
  if (!finalState.result) {
    throw new Error('Scoring graph produced no result');
  }
  return finalState.result;
}
