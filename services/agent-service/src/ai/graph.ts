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

// ── Node 1: Extract Requirements (JD only) ─────────────────────────────────

async function extractRequirementsNode(
  state: GraphStateType
): Promise<Partial<GraphStateType>> {
  const requirements = await withNodeRetry(async () => {
    const llm = getLlm().withStructuredOutput(JobRequirementsSchema);
    return llm.invoke([
      ['system', 'Extract job requirements from a posting. Normalize tool names. Return structured output.'],
      ['human', state.jobDescription.slice(0, 2000)],
    ]);
  }, 'extract_requirements');
  return { requirements };
}

// ── Node 2: Analyze Match ───────────────────────────────────────────────────

async function analyzeMatchNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  await sleep(30000);

  const analysis = await withNodeRetry(async () => {
    const llm = getLlm().withStructuredOutput(MatchAnalysisSchema);
    return llm.invoke([
      ['system', 'Compare candidate resume against job requirements. List present vs missing skills. Check for quantified achievements.'],
      [
        'human',
        `Requirements:\n${JSON.stringify(state.requirements)}\n\n` +
        `Resume:\n${state.resumeText.slice(0, 2000)}`,
      ],
    ]);
  }, 'analyze_match');
  return { analysis };
}

// ── Node 3: Generate Report ─────────────────────────────────────────────────

async function generateReportNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  await sleep(30000);

  const result = await withNodeRetry(async () => {
    const llm = getLlm().withStructuredOutput(ScoreResultSchema);
    return llm.invoke([
      ['system', 'Produce a resume scorecard. Ground scores in analysis data. Keywords 30%, skills 30%, impact 25%, formatting 15%. Verdict: >=80 strong, >=65 good, >=45 needs_work, else poor. Improvements must be actionable.'],
      [
        'human',
        `Requirements:\n${JSON.stringify(state.requirements)}\n\n` +
        `Analysis:\n${JSON.stringify(state.analysis)}\n\n` +
        `Resume:\n${state.resumeText.slice(0, 1500)}`,
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
