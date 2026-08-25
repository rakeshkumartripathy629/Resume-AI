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

async function extractRequirementsNode(
  state: GraphStateType
): Promise<Partial<GraphStateType>> {
  const llm = getLlm().withStructuredOutput(JobRequirementsSchema);
  const requirements = await llm.invoke([
    [
      'system',
      'You are an expert technical recruiter. Extract the true requirements from a job posting. ' +
        'Be precise: only include skills/keywords the posting actually mentions or clearly implies. ' +
        'Normalize tool names (e.g. "React.js" -> "React").',
    ],
    ['human', `Job description:\n\n${state.jobDescription.slice(0, 8000)}`],
  ]);
  return { requirements };
}

async function analyzeMatchNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const { resumeText, jobDescription, requirements } = state;
  const llm = getLlm().withStructuredOutput(MatchAnalysisSchema);
  const analysis = await llm.invoke([
    [
      'system',
      'You are a meticulous ATS (applicant tracking system). Compare the candidate resume against ' +
        'the job requirements. List exactly which required skills and keywords are present vs missing. ' +
        'Check whether achievements include numbers/metrics. Note formatting problems only if real.',
    ],
    [
      'human',
      `Extracted requirements:\n${JSON.stringify(requirements, null, 2)}\n\n` +
        `Job description:\n${jobDescription.slice(0, 4000)}\n\n` +
        `Candidate resume:\n${resumeText.slice(0, 12000)}`,
    ],
  ]);
  return { analysis };
}

async function generateReportNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const { resumeText, jobDescription, requirements, analysis } = state;
  const llm = getLlm().withStructuredOutput(ScoreResultSchema);
  const result = await llm.invoke([
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
      `Requirements:\n${JSON.stringify(requirements, null, 2)}\n\n` +
        `Match analysis:\n${JSON.stringify(analysis, null, 2)}\n\n` +
        `Job description:\n${jobDescription.slice(0, 3000)}\n\n` +
        `Resume:\n${resumeText.slice(0, 8000)}`,
    ],
  ]);
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
