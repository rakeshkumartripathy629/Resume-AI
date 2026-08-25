import {
  type JobRequirements,
  type ScoreResult,
} from './schemas';

// ── Algorithmic JD Requirements Extraction ──────────────────────────────────

const COMMON_HARD_SKILLS = [
  'javascript','typescript','react','node.js','nodejs','python','java','c++','c#','go','golang','rust',
  'ruby','php','swift','kotlin','scala','r','matlab','sql','nosql','mongodb','postgresql','mysql',
  'redis','elasticsearch','dynamodb','cassandra','firebase','supabase',
  'aws','azure','gcp','google cloud','docker','kubernetes','k8s','terraform','ansible','jenkins',
  'ci/cd','github actions','circleci','travis',
  'html','css','sass','scss','tailwind','bootstrap','figma','sketch','adobe xd',
  'graphql','rest','restful','api','grpc','websocket',
  'git','github','gitlab','bitbucket',
  'machine learning','ml','ai','artificial intelligence','deep learning','nlp','computer vision',
  'tensorflow','pytorch','keras','scikit-learn','pandas','numpy',
  'agile','scrum','kanban','jira','confluence',
  'microservices','serverless','lambda','cloud functions',
  'linux','bash','shell scripting','powershell',
  'webpack','vite','babel','esbuild','rollup','next.js','nextjs','nuxt','vue','angular','svelte',
  'express','fastify','nestjs','django','flask','spring','rails','laravel',
  'testing','jest','mocha','cypress','playwright','selenium','pytest','junit',
  'redis','rabbitmq','kafka','aws sqs','celery',
  'nginx','apache','负载均衡','load balancer',
  'security','owasp','xss','csrf','cors','authentication','authorization','oauth','jwt',
  'ssr','csr','spa','pwa','responsive design','mobile first',
  'system design','data structures','algorithms','dsa','oop','design patterns',
];

const COMMON_SOFT_SKILLS = [
  'communication','teamwork','leadership','problem solving','problem-solving',
  'critical thinking','creativity','adaptability','time management','collaboration',
  'mentoring','stakeholder management','presentation','negotiation','analytical',
  'self-motivated','detail oriented','detail-oriented','fast learner','proactive',
];

export function extractAlgorithmicRequirements(jdText: string): JobRequirements {
  const lower = jdText.toLowerCase();

  // Extract role title — first meaningful line
  const lines = jdText.split('\n').map((l) => l.trim()).filter(Boolean);
  let roleTitle = lines[0]?.slice(0, 80) || 'Software Developer';
  // Clean up common prefixes
  roleTitle = roleTitle.replace(/^(hiring|we are looking for|job title[:\s]*|position[:\s]*)/i, '').trim();

  // Detect seniority
  let seniority = 'mid';
  if (/\b(senior|sr\.?|lead|principal|staff)\b/i.test(lower)) seniority = 'senior';
  else if (/\b(junior|jr\.?|entry|intern|graduate|fresher)\b/i.test(lower)) seniority = 'junior';

  // Extract skills by matching against known lists
  const matchedHard = COMMON_HARD_SKILLS.filter((s) => lower.includes(s.toLowerCase()));
  const matchedSoft = COMMON_SOFT_SKILLS.filter((s) => lower.includes(s.toLowerCase()));

  // Extract keywords — look for quoted items, bullets, or capitalized words
  const keywords: string[] = [];
  const kwMatches = jdText.match(/["']([A-Za-z0-9#+.]+)["']/g);
  if (kwMatches) {
    keywords.push(...kwMatches.map((m) => m.replace(/['"]/g, '')).slice(0, 10));
  }

  // Also grab capitalized tech-looking words not in common lists
  const techWords = jdText.match(/\b[A-Z][A-Za-z+#.]{2,20}\b/g) ?? [];
  const knownLower = [...COMMON_HARD_SKILLS, ...COMMON_SOFT_SKILLS].map((k) => k.toLowerCase());
  for (const w of techWords) {
    if (!knownLower.includes(w.toLowerCase()) && !keywords.some((k) => k.toLowerCase() === w.toLowerCase())) {
      keywords.push(w);
    }
  }

  return {
    roleTitle,
    seniority,
    hardSkills: matchedHard.slice(0, 10),
    softSkills: matchedSoft.slice(0, 5),
    keywords: [...new Set(keywords)].slice(0, 15),
  };
}

export function extractAlgorithmicKeywords(jdText: string): { mustIncludeKeywords: string[]; coreSkills: string[]; niceToHave: string[] } {
  const lower = jdText.toLowerCase();
  const requirements = extractAlgorithmicRequirements(jdText);

  // mustInclude = hard skills + keywords from JD
  const mustIncludeKeywords = [...new Set([...requirements.hardSkills, ...requirements.keywords])].slice(0, 20);

  // coreSkills = top hard skills
  const coreSkills = requirements.hardSkills.slice(0, 8);

  // niceToHave = soft skills
  const niceToHave = requirements.softSkills.slice(0, 5);

  return { mustIncludeKeywords, coreSkills, niceToHave };
}

// ── Algorithmic Match Analysis ──────────────────────────────────────────────

function analyzeMatch(resumeText: string, requirements: JobRequirements): {
  matchedSkills: string[];
  missingSkills: string[];
  hasQuantifiedAchievements: boolean;
  evidenceNotes: string;
  keywordMatchPct: number;
  skillsRelevance: number;
  experienceImpact: number;
  formattingClarity: number;
} {
  const lower = resumeText.toLowerCase();

  // Skill matching
  const matchedSkills = requirements.hardSkills.filter((s) => lower.includes(s.toLowerCase()));
  const missingSkills = requirements.hardSkills.filter((s) => !lower.includes(s.toLowerCase()));

  // Quantified achievements
  const hasQuantifiedAchievements = /\d+%|\d+x|\$\d+|\d+ (million|billion|thousand|lakh|crore)|\d{1,3}(,\d{3})+/.test(resumeText);
  const hasActionVerbs = /\b(led|built|designed|implemented|developed|launched|reduced|increased|improved|optimized|created|managed|delivered|achieved|drove|automated|migrated|spearheaded|engineered|architected|delivered|mentored|guided|coordinated|spearheaded)\b/i.test(resumeText);

  // Keyword match percentage
  const allKeywords = [...requirements.hardSkills, ...requirements.keywords];
  const matchedKw = allKeywords.filter((k) => lower.includes(k.toLowerCase()));
  const keywordMatchPct = allKeywords.length > 0 ? Math.round((matchedKw.length / allKeywords.length) * 100) : 50;

  // Skills relevance
  const skillsRelevance = requirements.hardSkills.length > 0
    ? Math.round((matchedSkills.length / requirements.hardSkills.length) * 100)
    : 50;

  // Experience impact — score based on achievements, bullets, job entries
  const bulletCount = (resumeText.match(/^[\s]*[-•*]\s/gm) || []).length;
  const jobEntries = (resumeText.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*\d{4}\b/gi) || []).length;
  const experienceImpact = Math.min(100, Math.round(
    (matchedSkills.length * 8) +
    (hasQuantifiedAchievements ? 20 : 0) +
    (hasActionVerbs ? 15 : 0) +
    Math.min(25, bulletCount * 3) +
    Math.min(15, jobEntries * 5)
  ));

  // Formatting clarity
  const hasContact = /[\w.+-]+@[\w-]+\.[\w.]+/.test(resumeText);
  const hasPhone = /[\+]?[\d\s\-\(\)]{7,}/.test(resumeText);
  const hasEducation = /\b(b\.?tech|m\.?tech|b\.?sc|m\.?sc|bachelor|master|mba|phd|degree|university|college)\b/i.test(resumeText);
  const hasSkillsSection = /\b(skills|technologies|tech stack|tools)\s*[:\-]/i.test(resumeText);
  const formattingClarity = Math.round(
    (hasContact ? 25 : 0) +
    (hasPhone ? 15 : 0) +
    (hasEducation ? 20 : 0) +
    (hasSkillsSection ? 20 : 0) +
    (hasActionVerbs ? 20 : 0)
  );

  const evidenceNotes = [
    matchedSkills.length > 0 ? `Matched ${matchedSkills.length} skills: ${matchedSkills.slice(0, 5).join(', ')}` : 'No matching skills found',
    missingSkills.length > 0 ? `Missing: ${missingSkills.slice(0, 5).join(', ')}` : 'All required skills present',
    hasQuantifiedAchievements ? 'Has quantified achievements' : 'No quantified achievements found',
    hasActionVerbs ? 'Strong action verbs detected' : 'Weak action verbs',
  ].join('. ');

  return { matchedSkills, missingSkills, hasQuantifiedAchievements, evidenceNotes, keywordMatchPct, skillsRelevance, experienceImpact, formattingClarity };
}

// ── Score Calculation ───────────────────────────────────────────────────────

function calculateScore(
  matchData: ReturnType<typeof analyzeMatch>,
  resumeText: string,
  requirements: JobRequirements
): ScoreResult {
  const { keywordMatchPct, skillsRelevance, experienceImpact, formattingClarity, matchedSkills, missingSkills, hasQuantifiedAchievements } = matchData;

  // Weighted overall: keywords 30%, skills 30%, impact 25%, formatting 15%
  const overallScore = Math.round(
    keywordMatchPct * 0.30 +
    skillsRelevance * 0.30 +
    experienceImpact * 0.25 +
    formattingClarity * 0.15
  );

  // Verdict
  let verdict: ScoreResult['verdict'] = 'poor';
  if (overallScore >= 80) verdict = 'strong_match';
  else if (overallScore >= 65) verdict = 'good';
  else if (overallScore >= 45) verdict = 'needs_work';

  // Strengths
  const strengths: string[] = [];
  if (matchedSkills.length >= 3) strengths.push(`Strong technical skill match (${matchedSkills.length}/${requirements.hardSkills.length} required skills)`);
  if (hasQuantifiedAchievements) strengths.push('Includes quantified achievements with measurable impact');
  if (keywordMatchPct >= 70) strengths.push(`High keyword alignment (${keywordMatchPct}%) with job description`);
  if (experienceImpact >= 60) strengths.push('Demonstrates impactful work experience with relevant technologies');
  if (formattingClarity >= 60) strengths.push('Well-formatted resume with clear sections');
  if (strengths.length === 0) strengths.push('Shows potential for the target role');

  // Improvements
  const improvements: string[] = [];
  if (missingSkills.length > 0) improvements.push(`Add these missing skills: ${missingSkills.slice(0, 4).join(', ')}`);
  if (!matchData.hasQuantifiedAchievements) improvements.push('Add quantified achievements (e.g., "reduced load time by 40%")');
  if (keywordMatchPct < 50) improvements.push('Include more keywords from the job description naturally in your resume');
  if (skillsRelevance < 50) improvements.push('Highlight experience with the core technologies mentioned in the job posting');
  if (formattingClarity < 50) improvements.push('Improve resume structure: add contact info, skills section, and clear job entries');
  if (improvements.length === 0) improvements.push('Tailor your resume summary to directly address this specific role');

  // Summary
  const summary = overallScore >= 65
    ? `Your resume ${overallScore >= 80 ? 'strongly' : 'reasonably'} matches this ${requirements.roleTitle} position with a ${overallScore}% ATS compatibility score. ${matchedSkills.length} of ${requirements.hardSkills.length} required skills are present. ${hasQuantifiedAchievements ? 'Quantified achievements strengthen your application.' : 'Adding metrics would improve impact.'}`
    : `Your resume needs significant improvements for this ${requirements.roleTitle} role (score: ${overallScore}%). ${missingSkills.length} key skills are missing. ${keywordMatchPct < 50 ? 'Keyword alignment with the JD is low.' : 'Consider restructuring your experience to better highlight relevant work.'}`;

  // Missing keywords
  const missingKeywords = [...missingSkills, ...requirements.keywords.filter((k) => !resumeText.toLowerCase().includes(k.toLowerCase()))].slice(0, 10);

  return {
    overallScore,
    categoryScores: {
      keywordMatch: keywordMatchPct,
      skillsRelevance,
      experienceImpact,
      formattingClarity,
    },
    summary,
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 5),
    missingKeywords,
    verdict,
  };
}

// ── Main Entry Point ────────────────────────────────────────────────────────

export async function runResumeScoring(
  resumeText: string,
  jobDescription: string
): Promise<ScoreResult> {
  // Step 1: Extract requirements (algorithmic)
  const requirements = extractAlgorithmicRequirements(jobDescription);

  // Step 2: Analyze match (algorithmic)
  const matchData = analyzeMatch(resumeText, requirements);

  // Step 3: Calculate score (algorithmic)
  const result = calculateScore(matchData, resumeText, requirements);

  return result;
}
