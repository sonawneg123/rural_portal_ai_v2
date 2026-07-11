// src/config/groq.js
// ─────────────────────────────────────────────────────────────────
// Groq AI integration — official groq-sdk
// Model: llama3-8b-8192  (fast, free tier available)
// Docs:  https://console.groq.com/docs
// ─────────────────────────────────────────────────────────────────
const Groq   = require('groq-sdk');
const logger = require('./logger');

const groq  = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = process.env.GROQ_MODEL || 'llama3-8b-8192';

/* ─────────────────────────────────────────────────────────────
   1. generateProblemAnalysis
   Called on every new problem submission.
   Returns: { summary, severity_score, tags, responsible_dept }
───────────────────────────────────────────────────────────── */
async function generateProblemAnalysis(title, description, category, location) {
  try {
    const system = `You are an AI assistant for India's Rural Area Problems Portal.
Analyse citizen-submitted rural problem reports and return structured JSON.

Respond ONLY with valid JSON matching this exact schema:
{
  "summary": "<2-3 sentence formal summary for government officials>",
  "severity_score": <integer 1-10>,
  "tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>"],
  "responsible_dept": "<department name>",
  "estimated_resolution_days": <integer>
}

Severity guide: 1-3 = minor inconvenience, 4-6 = moderate impact, 7-8 = serious / many affected, 9-10 = life-threatening / emergency.
Do NOT include markdown, backticks, or any text outside the JSON object.`;

    const user = `Title: ${title}
Category: ${category}
Location: ${location}
Description: ${description}`;

    const res = await groq.chat.completions.create({
      model:       MODEL,
      messages:    [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: 0.2,
      max_tokens:  350,
      response_format: { type: 'json_object' },
    });

    const raw    = res.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);

    logger.info(`Groq analysis done: "${title}" → severity ${parsed.severity_score}`);

    return {
      summary:                   (parsed.summary || '').trim(),
      severity_score:            Math.min(10, Math.max(1, parseInt(parsed.severity_score) || 5)),
      tags:                      (parsed.tags || []).slice(0, 4).join(','),
      responsible_dept:          (parsed.responsible_dept || '').trim(),
      estimated_resolution_days: parseInt(parsed.estimated_resolution_days) || null,
    };
  } catch (err) {
    logger.error('Groq analysis error:', err.message);
    return { summary: null, severity_score: null, tags: '', responsible_dept: null, estimated_resolution_days: null };
  }
}

/* ─────────────────────────────────────────────────────────────
   2. generateAdminInsight
   Called by admin to get action suggestion for a specific problem.
   Returns: string
───────────────────────────────────────────────────────────── */
async function generateAdminInsight(problem) {
  try {
    const prompt = `You are a rural governance advisor for Indian government officials.

Problem report:
Title: ${problem.title}
Category: ${problem.category}
Location: ${problem.district}, ${problem.state}
Status: ${problem.status}
Severity score: ${problem.ai_severity_score}/10
Upvotes: ${problem.upvotes}
Work updates: ${problem.work_updates_count || 0}
Description: ${problem.description}

In exactly 2 sentences, recommend the single most effective action the local government should take right now. Be specific, practical, and reference the location if helpful. Do not start with "I" or preamble.`;

    const res = await groq.chat.completions.create({
      model:       MODEL,
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.35,
      max_tokens:  140,
    });

    return res.choices[0]?.message?.content?.trim() || null;
  } catch (err) {
    logger.error('Groq insight error:', err.message);
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────
   3. analyseWorkUpdate
   Called when a citizen submits a work progress update.
   Examines description + estimated completion %.
   Returns: { analysis, estimated_completion_pct }
───────────────────────────────────────────────────────────── */
async function analyseWorkUpdate(description, userEstimatePct) {
  try {
    const prompt = `You are a construction and public works progress verification assistant.

A citizen has submitted the following work progress update for a rural infrastructure repair:
Description: "${description}"
${userEstimatePct ? `Citizen's estimated completion: ${userEstimatePct}%` : ''}

Respond ONLY with valid JSON:
{
  "analysis": "<1-2 sentence professional assessment of the work shown>",
  "estimated_completion_pct": <integer 0-100>,
  "quality_assessment": "<brief quality note>"
}`;

    const res = await groq.chat.completions.create({
      model:       MODEL,
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.25,
      max_tokens:  200,
      response_format: { type: 'json_object' },
    });

    const raw    = res.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);

    return {
      analysis:               (parsed.analysis || '').trim(),
      estimated_completion_pct: Math.min(100, Math.max(0, parseInt(parsed.estimated_completion_pct) || 0)),
      quality_assessment:     (parsed.quality_assessment || '').trim(),
    };
  } catch (err) {
    logger.error('Groq work-update analysis error:', err.message);
    return { analysis: null, estimated_completion_pct: null, quality_assessment: null };
  }
}

module.exports = { generateProblemAnalysis, generateAdminInsight, analyseWorkUpdate };
