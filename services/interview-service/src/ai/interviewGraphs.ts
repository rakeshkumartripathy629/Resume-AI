import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { getLlm } from './llm';
import {
  AnswerEvaluationSchema,
  InterviewReportSchema,
  QuestionPlanSchema,
  type AnswerEvaluation,
  type InterviewReportResult,
  type QuestionPlan,
} from './schemas';

/* ---------------- plan graph ---------------- */

const PlanState = Annotation.Root({
  role: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  difficulty: Annotation<string>({ reducer: (_, b) => b, default: () => 'medium' }),
  jdText: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  questionCount: Annotation<number>({ reducer: (_, b) => b, default: () => 6 }),
  plan: Annotation<QuestionPlan | null>({ reducer: (_, b) => b, default: () => null }),
});

async function generateQuestionsNode(state: typeof PlanState.State): Promise<Partial<typeof PlanState.State>> {
  const llm = getLlm().withStructuredOutput(QuestionPlanSchema);
  const mix =
    state.questionCount <= 4
      ? '2 technical + 1 behavioral + 1 situational'
      : `${Math.ceil(state.questionCount * 0.5)} technical + ${Math.floor(
          state.questionCount * 0.25
        )} behavioral + remaining situational`;
  const plan = await llm.invoke([
    [
      'system',
      `You are a senior technical interviewer. Design an interview for the target role and difficulty.
Difficulty guide — easy: fundamentals; medium: practical depth + tradeoffs; hard: system design, edge cases, leadership.
Produce exactly ${state.questionCount} questions with this mix: ${mix}.
Questions must be specific to the role (and job description when provided), open-ended, and answerable in 1-3 minutes.`,
    ],
    [
      'human',
      `Target role: ${state.role}\nDifficulty: ${state.difficulty}` +
        (state.jdText ? `\n\nJob description:\n${state.jdText.slice(0, 5000)}` : ''),
    ],
  ]);
  return { plan };
}

const planGraph = new StateGraph(PlanState)
  .addNode('generate_questions', generateQuestionsNode)
  .addEdge(START, 'generate_questions')
  .addEdge('generate_questions', END)
  .compile();

export async function runQuestionPlan(params: {
  role: string;
  difficulty: string;
  jdText: string;
  questionCount: number;
}): Promise<QuestionPlan> {
  const final = await planGraph.invoke(params);
  if (!final.plan) throw new Error('Question planning produced no result');
  return final.plan;
}

/* ---------------- evaluate graph ---------------- */

const EvalState = Annotation.Root({
  role: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  difficulty: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  jdText: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  question: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  questionType: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  answer: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  evaluation: Annotation<AnswerEvaluation | null>({ reducer: (_, b) => b, default: () => null }),
});

async function evaluateAnswerNode(state: typeof EvalState.State): Promise<Partial<typeof EvalState.State>> {
  const llm = getLlm().withStructuredOutput(AnswerEvaluationSchema);
  const evaluation = await llm.invoke([
    [
      'system',
      `You are a supportive but honest technical interviewer evaluating a candidate's spoken-style answer.
Score out of 10: relevance to the question, correctness/depth, structure, concrete examples.
Be fair to short answers — do not demand essays, but note missing substance.
modelAnswerHint should teach the candidate what a strong answer covers.`,
    ],
    [
      'human',
      `Role: ${state.role} (${state.difficulty})\nQuestion (${state.questionType}): ${state.question}\n\nCandidate answer:\n${state.answer}` +
        (state.jdText ? `\n\nJob context:\n${state.jdText.slice(0, 2500)}` : ''),
    ],
  ]);
  return { evaluation };
}

const evalGraph = new StateGraph(EvalState)
  .addNode('evaluate_answer', evaluateAnswerNode)
  .addEdge(START, 'evaluate_answer')
  .addEdge('evaluate_answer', END)
  .compile();

export async function runAnswerEvaluation(params: {
  role: string;
  difficulty: string;
  jdText: string;
  question: string;
  questionType: string;
  answer: string;
}): Promise<AnswerEvaluation> {
  const final = await evalGraph.invoke(params);
  if (!final.evaluation) throw new Error('Evaluation produced no result');
  return final.evaluation;
}

/* ---------------- report graph ---------------- */

interface ReportInput {
  role: string;
  difficulty: string;
  questions: { text: string; type: string }[];
  answers: { questionIndex: number; text: string }[];
  evaluations: { questionIndex: number; score: number; feedbackHint: string }[];
}

const ReportState = Annotation.Root({
  input: Annotation<ReportInput>({ reducer: (_, b) => b, default: () => ({ questions: [], answers: [], evaluations: [], role: '', difficulty: '' }) }),
  report: Annotation<InterviewReportResult | null>({ reducer: (_, b) => b, default: () => null }),
});

async function generateReportNode(state: typeof ReportState.State): Promise<Partial<typeof ReportState.State>> {
  const llm = getLlm().withStructuredOutput(InterviewReportSchema);
  const report = await llm.invoke([
    [
      'system',
      `You are producing a final mock-interview performance report.
overallScore is 0-100 anchored on average per-question scores (each out of 10), adjusted for question difficulty mix.
band: >=80 excellent, >=65 good, >=50 average, else needs_improvement.
competencyScores are 0-100 each, grounded in per-question evidence:
- technical: correctness/depth on technical questions
- communication: clarity, structure, conciseness across all answers
- problemSolving: approach, tradeoffs, reasoning
- confidence: directness, hedging language, ownership
strengths/improvements must cite specific question numbers where relevant.`,
    ],
    ['human', `Interview data:\n${JSON.stringify(state.input, null, 2).slice(0, 12000)}`],
  ]);
  return { report };
}

const reportGraph = new StateGraph(ReportState)
  .addNode('generate_report', generateReportNode)
  .addEdge(START, 'generate_report')
  .addEdge('generate_report', END)
  .compile();

export async function runInterviewReport(input: ReportInput): Promise<InterviewReportResult> {
  const final = await reportGraph.invoke({ input });
  if (!final.report) throw new Error('Report generation produced no result');
  return final.report;
}
