import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { getLlm } from './llm';
import {
  GapAnalysisSchema,
  RoadmapPhasesSchema,
  type FullRoadmap,
  type GapAnalysis,
  type RoadmapPhasesResult,
} from './schemas';

interface RoadmapInput {
  targetRole: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  currentSkills: string[];
}

const RoadmapState = Annotation.Root({
  input: Annotation<RoadmapInput>({ reducer: (_, b) => b, default: () => ({ targetRole: '', experienceLevel: 'beginner', currentSkills: [] }) }),
  gapAnalysis: Annotation<GapAnalysis | null>({ reducer: (_, b) => b, default: () => null }),
  phasesResult: Annotation<RoadmapPhasesResult | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
});

async function gapAnalysisNode(state: typeof RoadmapState.State): Promise<Partial<typeof RoadmapState.State>> {
  const llm = getLlm().withStructuredOutput(GapAnalysisSchema);
  const { targetRole, currentSkills } = state.input;
  const gapAnalysis = await llm.invoke([
    [
      'system',
      `You are a senior career coach for tech roles. Analyze the skill gap between the candidate's current skills and the target role.
missingSkills must be ordered by learning priority (foundations first).
notes should be encouraging but honest, 2-3 sentences.`,
    ],
    [
      'human',
      `Target role: ${targetRole}\nCurrent skills: ${
        currentSkills.length ? currentSkills.join(', ') : '(none listed)'
      }`,
    ],
  ]);
  return { gapAnalysis };
}

async function generatePhasesNode(state: typeof RoadmapState.State): Promise<Partial<typeof RoadmapState.State>> {
  const llm = getLlm().withStructuredOutput(RoadmapPhasesSchema);
  const { targetRole, experienceLevel } = state.input;
  const missing = state.gapAnalysis?.missingSkills ?? [];
  const phasesResult = await llm.invoke([
    [
      'system',
      `You design realistic learning roadmaps. Create 4-5 sequential phases that take the candidate from their current level to job-ready for the target role.
Experience level: ${experienceLevel}. Calibrate depth and duration accordingly (beginner ~6-9 months total, intermediate ~3-5, advanced ~2-3).
Every phase MUST build on the previous one and cover the missing skills in priority order:
${missing.map((s, i) => `${i + 1}. ${s}`).join('\n') || '(derive from the role)'}
Each phase needs at least one hands-on milestone and at least one resource.`,
    ],
    ['human', `Target role: ${targetRole}`],
  ]);
  return { phasesResult };
}

const roadmapGraph = new StateGraph(RoadmapState)
  .addNode('gap_analysis', gapAnalysisNode)
  .addNode('generate_phases', generatePhasesNode)
  .addEdge(START, 'gap_analysis')
  .addEdge('gap_analysis', 'generate_phases')
  .addEdge('generate_phases', END)
  .compile();

export async function runRoadmap(input: RoadmapInput): Promise<FullRoadmap> {
  const final = await roadmapGraph.invoke({ input });
  if (!final.gapAnalysis || !final.phasesResult) {
    throw new Error('Roadmap generation produced no result');
  }
  return { gapAnalysis: final.gapAnalysis, phases: final.phasesResult.phases };
}
