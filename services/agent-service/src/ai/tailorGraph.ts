import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { getLlm } from './llm';
import {
  JobRequirementsSchema,
  MatchAnalysisSchema,
  type JobRequirements,
  type MatchAnalysis,
} from './schemas';
import {
  TailoredResumeSchema,
  type TailoredResume,
  type ATSAnalysis,
} from './tailorSchemas';

// ── Graph State ─────────────────────────────────────────────────────────────

const TailorGraphState = Annotation.Root({
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
  tailoredResume: Annotation<TailoredResume | null>({
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

// ── Node 1: Extract Requirements ────────────────────────────────────────────

async function extractRequirementsNode(
  state: TailorState
): Promise<Partial<TailorState>> {
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

// ── Node 2: Analyze Match ───────────────────────────────────────────────────

async function analyzeMatchNode(state: TailorState): Promise<Partial<TailorState>> {
  await sleep(5000);

  const analysis = await withNodeRetry(async () => {
    const llm = getLlm().withStructuredOutput(MatchAnalysisSchema);
    return llm.invoke([
      [
        'system',
        'You are a meticulous ATS. Compare the candidate resume against ' +
          'the job requirements. List exactly which required skills and keywords are present vs missing. ' +
          'Check whether achievements include numbers/metrics. Note formatting problems only if real.',
      ],
      [
        'human',
        `Requirements:\n${JSON.stringify(state.requirements, null, 2)}\n\n` +
          `Job description:\n${state.jobDescription.slice(0, 1500)}\n\n` +
          `Candidate resume:\n${state.resumeText.slice(0, 3000)}`,
      ],
    ]);
  }, 'analyze_match');
  return { analysis };
}

// ── Node 3: Generate Tailored Resume ────────────────────────────────────────

async function tailorResumeNode(state: TailorState): Promise<Partial<TailorState>> {
  await sleep(5000);

  const tailoredResume = await withNodeRetry(async () => {
    const llm = getLlm().withStructuredOutput(TailoredResumeSchema);
    return llm.invoke([
      [
        'system',
        'You are an expert ATS resume optimizer. Tailor the candidate resume ' +
          'to maximize truthful alignment with the job description.\n\n' +
          'RULES:\n' +
          '1. NEVER fabricate companies, roles, projects, skills, certifications, or metrics not in the original.\n' +
          '2. Only restructure and improve wording of existing information.\n' +
          '3. Naturally incorporate keywords from the JD where the candidate has genuine experience.\n' +
          '4. Use strong action verbs for experience bullets.\n' +
          '5. Preserve real numbers/metrics from the original resume.\n' +
          '6. Prioritize JD-relevant skills at the top of the skills list.\n' +
          '7. Write a professional summary that aligns with the target role without lying.\n' +
          '8. Only include sections (projects, certifications) that exist in the original resume.\n\n' +
          'OUTPUT: Return ONLY the tailored resume content (contact, summary, skills, experience, education, projects, certifications).',
      ],
      [
        'human',
        `Original resume:\n${state.resumeText.slice(0, 4000)}\n\n` +
          `Job description:\n${state.jobDescription.slice(0, 2000)}\n\n` +
          `Requirements:\n${JSON.stringify(state.requirements, null, 2)}\n\n` +
          `Match analysis:\n${JSON.stringify(state.analysis, null, 2)}\n\n` +
          'Generate the tailored resume.',
      ],
    ]);
  }, 'tailor_resume');
  return { tailoredResume };
}

// ── Algorithmic ATS Analysis (no LLM call) ──────────────────────────────────

function computeAtsAnalysis(
  tailoredResume: TailoredResume,
  requirements: JobRequirements,
  analysis: MatchAnalysis
): ATSAnalysis {
  const resumeLower = [
    tailoredResume.summary,
    ...tailoredResume.skills,
    ...tailoredResume.experience.flatMap((e) => [...e.bullets, e.role]),
    ...tailoredResume.projects.map((p) => `${p.name} ${p.description} ${p.tech.join(' ')}`),
    ...tailoredResume.certifications.map((c) => `${c.name} ${c.issuer}`),
  ].join(' ').toLowerCase();

  // Keyword matching
  const allKeywords = [...requirements.keywords, ...requirements.hardSkills, ...requirements.softSkills];
  const matchedKeywords = allKeywords.filter((kw) => resumeLower.includes(kw.toLowerCase()));
  const missingKeywords = allKeywords
    .filter((kw) => !resumeLower.includes(kw.toLowerCase()))
    .map((kw) => ({
      keyword: kw,
      reason: `Keyword "${kw}" not found in tailored resume`,
    }));

  const keywordMatch = allKeywords.length > 0
    ? Math.round((matchedKeywords.length / allKeywords.length) * 100)
    : 80;

  // Required skills
  const matchedRequired = requirements.hardSkills.filter((s) => resumeLower.includes(s.toLowerCase()));
  const requiredSkills = requirements.hardSkills.length > 0
    ? Math.round((matchedRequired.length / requirements.hardSkills.length) * 100)
    : 80;

  // Preferred skills (soft skills)
  const matchedPreferred = requirements.softSkills.filter((s) => resumeLower.includes(s.toLowerCase()));
  const preferredSkills = requirements.softSkills.length > 0
    ? Math.round((matchedPreferred.length / requirements.softSkills.length) * 100)
    : 70;

  // Experience relevance — check if role titles relate to the JD
  const roleWords = tailoredResume.experience.map((e) => e.role.toLowerCase()).join(' ');
  const jdTitle = requirements.roleTitle.toLowerCase();
  const titleWords = jdTitle.split(/\s+/);
  const titleMatches = titleWords.filter((w) => w.length > 2 && roleWords.includes(w));
  const experienceRelevance = Math.min(100, 50 + (titleMatches.length * 15) +
    (tailoredResume.experience.length > 0 ? 20 : 0) +
    (analysis.hasQuantifiedAchievements ? 15 : 0));

  // Job title alignment
  const jobTitleAlignment = titleWords.length > 0
    ? Math.round((titleMatches.length / titleWords.length) * 100)
    : 60;

  // Achievement relevance — check for action verbs and metrics
  const allBullets = tailoredResume.experience.flatMap((e) => e.bullets);
  const actionVerbs = ['led', 'built', 'designed', 'implemented', 'developed', 'launched', 'reduced', 'increased', 'improved', 'optimized', 'created', 'managed', 'delivered', 'achieved', 'drove', 'established', 'spearheaded', 'orchestrated', 'migrated', 'automated'];
  const bulletsWithVerbs = allBullets.filter((b) => actionVerbs.some((v) => b.toLowerCase().startsWith(v)));
  const bulletsWithNumbers = allBullets.filter((b) => /\d+/.test(b));
  const achievementRelevance = allBullets.length > 0
    ? Math.round(((bulletsWithVerbs.length * 0.5 + bulletsWithNumbers.length * 0.5) / allBullets.length) * 100)
    : 60;

  // ATS formatting — check structure completeness
  const hasContact = !!(tailoredResume.contact.fullName && tailoredResume.contact.email);
  const hasSummary = tailoredResume.summary.length > 30;
  const hasSkills = tailoredResume.skills.length >= 3;
  const hasExperience = tailoredResume.experience.length > 0;
  const hasEducation = tailoredResume.education.length > 0;
  const formatScore = [hasContact, hasSummary, hasSkills, hasExperience, hasEducation].filter(Boolean).length;
  const atsFormatting = Math.round((formatScore / 5) * 100);

  // Resume completeness
  const resumeCompleteness = Math.round(
    (hasContact ? 15 : 0) +
    (hasSummary ? 15 : 0) +
    (hasSkills ? 20 : 0) +
    (hasExperience ? 25 : 0) +
    (hasEducation ? 15 : 0) +
    (tailoredResume.projects.length > 0 ? 5 : 0) +
    (tailoredResume.certifications.length > 0 ? 5 : 0)
  );

  // Overall score — weighted blend
  const overallScore = Math.round(
    keywordMatch * 0.25 +
    requiredSkills * 0.25 +
    experienceRelevance * 0.20 +
    achievementRelevance * 0.15 +
    atsFormatting * 0.08 +
    resumeCompleteness * 0.07
  );

  // Recommendations
  const recommendations: string[] = [];
  if (keywordMatch < 70) recommendations.push(`Add more JD keywords — only ${matchedKeywords.length}/${allKeywords.length} matched`);
  if (!analysis.hasQuantifiedAchievements) recommendations.push('Add quantified achievements with specific numbers/metrics');
  if (allBullets.length < 5) recommendations.push('Add more achievement bullets to experience sections');
  if (missingKeywords.length > 5) recommendations.push(`Consider adding these keywords: ${missingKeywords.slice(0, 3).map((k) => k.keyword).join(', ')}`);
  if (tailoredResume.skills.length < 5) recommendations.push('Add more relevant skills to the skills section');
  if (!hasSummary || tailoredResume.summary.length < 50) recommendations.push('Write a stronger professional summary (2-4 sentences)');

  return {
    overallScore: Math.min(100, overallScore),
    breakdown: {
      keywordMatch,
      requiredSkills,
      preferredSkills,
      experienceRelevance,
      jobTitleAlignment,
      achievementRelevance,
      atsFormatting,
      resumeCompleteness,
    },
    matchedKeywords: matchedKeywords.slice(0, 25),
    missingKeywords: missingKeywords.slice(0, 10),
    recommendations: recommendations.slice(0, 5),
  };
}

// ── Graph Assembly ──────────────────────────────────────────────────────────

const workflow = new StateGraph(TailorGraphState)
  .addNode('extract_requirements', extractRequirementsNode)
  .addNode('analyze_match', analyzeMatchNode)
  .addNode('tailor_resume', tailorResumeNode)
  .addEdge(START, 'extract_requirements')
  .addEdge('extract_requirements', 'analyze_match')
  .addEdge('analyze_match', 'tailor_resume')
  .addEdge('tailor_resume', END);

const tailorGraph = workflow.compile();

const GRAPH_TIMEOUT_MS = 120_000;

export async function runResumeTailoring(
  resumeText: string,
  jobDescription: string
): Promise<{ tailoredResume: TailoredResume; atsAnalysis: ATSAnalysis }> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Tailoring timed out after 2 minutes')), GRAPH_TIMEOUT_MS)
  );

  const graphPromise = tailorGraph.invoke({ resumeText, jobDescription });

  const finalState = await Promise.race([graphPromise, timeoutPromise]);

  if (!finalState.tailoredResume) {
    throw new Error('Tailoring graph produced no resume');
  }
  if (!finalState.requirements || !finalState.analysis) {
    throw new Error('Tailoring graph missing analysis data');
  }

  // Compute ATS analysis algorithmically — no 4th LLM call needed
  const atsAnalysis = computeAtsAnalysis(
    finalState.tailoredResume,
    finalState.requirements,
    finalState.analysis
  );

  return {
    tailoredResume: finalState.tailoredResume,
    atsAnalysis,
  };
}
