import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Groq - OpenAI-compatible API, free tier, fast inference
const useGroq = !!process.env.GROQ_API_KEY;
const groqClient = useGroq
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })
  : null;

// Gemini - fallback when Groq key not set
const useGemini = !!process.env.GEMINI_API_KEY;
const genAI = useGemini ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY!) : null;

if (!useGroq && !useGemini) {
  throw new Error('Set either GROQ_API_KEY (recommended, free tier) or GEMINI_API_KEY in .env');
}

export const PROMPT_VERSION = '1.0';

function logGeneration(model: string, type: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[MedScribe AI]', type, 'model:', model);
  }
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  throw new Error('Server-side transcription not implemented. Use Web Speech API in the browser.');
}

async function generateWithGroq(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<string> {
  if (!groqClient) throw new Error('GROQ_API_KEY is not set');
  // Groq models: Llama and Mixtral, free tier friendly
  const models = [
    'llama-3.3-70b-versatile',
    'llama-3.1-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
    'llama3-70b-8192',
    'llama3-8b-8192',
  ];
  let lastError: Error | null = null;
  for (const model of models) {
    try {
      const completion = await groqClient.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: maxTokens,
      });
      const text = completion.choices[0]?.message?.content;
      if (!text) throw new Error('Empty response from Groq');
      logGeneration(model, 'groq');
      return text;
    } catch (err: any) {
      lastError = err;
      const msg = err?.message ?? '';
      if (msg.includes('404') || msg.includes('429') || msg.includes('quota') || msg.includes('rate')) continue;
      throw err;
    }
  }
  throw lastError || new Error('Groq API failed. Check GROQ_API_KEY and try again.');
}

async function generateWithGemini(
  fullPrompt: string,
  maxTokens: number,
  modelsToTry: string[]
): Promise<string> {
  if (!genAI) throw new Error('GEMINI_API_KEY is not set');
  let lastError: Error | null = null;
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(fullPrompt, {
        generationConfig: { temperature: 0.3, maxOutputTokens: maxTokens },
      });
      const text = result.response.text();
      if (!text) throw new Error('Empty response');
      logGeneration(modelName, 'gemini');
      return text;
    } catch (err: any) {
      lastError = err;
      const msg = err?.message ?? '';
      if (msg.includes('404') || msg.includes('429') || msg.includes('quota')) continue;
      throw err;
    }
  }
  if (lastError?.message?.includes('429')) {
    throw new Error('Gemini quota exceeded. Wait a few minutes or use Groq (set GROQ_API_KEY).');
  }
  throw lastError || new Error('No Gemini model available.');
}

function getTemplatePrompt(template?: string): string {
  const templates: Record<string, string> = {
    cardiology: 'This is a cardiology case. Focus on cardiovascular examination, cardiac history, and cardiac-specific findings.',
    surgery: 'This is a surgical case. Focus on surgical history, pre-operative assessment, and surgical findings.',
    pediatrics: 'This is a pediatric case. Use age-appropriate terminology and focus on pediatric-specific considerations.',
    orthopedics: 'This is an orthopedic case. Focus on musculoskeletal examination, range of motion, and orthopedic findings.',
    neurology: 'This is a neurology case. Focus on neurological examination, mental status, and neurological findings.',
    general: 'This is a general medicine case. Use standard medical documentation format.',
  };
  return template && templates[template]
    ? `Specialty Template: ${templates[template]}`
    : 'Use standard medical documentation format.';
}

const patientInfoBlock = (p: { name: string; age: number | null; gender: string | null; medicalRecordNumber?: string }) =>
  `Patient: ${p.name}, Age: ${p.age ?? 'N/A'}, Gender: ${p.gender ?? 'N/A'}${p.medicalRecordNumber ? `, MRN: ${p.medicalRecordNumber}` : ''}`;

export async function generateDischargeSummary(
  transcript: string,
  patientInfo: {
    name: string;
    age: number | null;
    gender: string | null;
    medicalRecordNumber?: string;
  },
  template?: string,
  options?: { includeIcd10?: boolean; customTemplateInstruction?: string }
): Promise<string> {
  const includeIcd10 = options?.includeIcd10 ?? false;
  const templatePrompt = options?.customTemplateInstruction ?? getTemplatePrompt(template);
  const userPrompt = `Generate a professional discharge summary.

${patientInfoBlock(patientInfo)}

${templatePrompt}

Consultation transcript:
${transcript}

Include: Patient Demographics, Chief Complaint, History of Present Illness, Past Medical History (if mentioned), Physical Examination, Assessment/Diagnosis, Treatment Provided, Medications (if any), Discharge Instructions, Follow-up Plan. Be professional, accurate, and complete. No placeholders.${includeIcd10 ? ' At the end, add a section "ICD-10 Codes (suggested):" with relevant codes where applicable.' : ''}`;

  const systemPrompt = 'You are a medical documentation specialist. Output only the discharge summary text, well-structured and ready for medical records.';

  if (useGroq && groqClient) {
    return generateWithGroq(systemPrompt, userPrompt, 2000);
  }
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}\n\nDischarge Summary:`;
  return generateWithGemini(fullPrompt, 2000, [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.0-pro',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-2.0-flash',
  ]);
}

export async function generateCaseSheet(
  transcript: string,
  patientInfo: {
    name: string;
    age: number | null;
    gender: string | null;
    medicalRecordNumber?: string;
  },
  template?: string,
  options?: { includeIcd10?: boolean; customTemplateInstruction?: string }
): Promise<string> {
  const includeIcd10 = options?.includeIcd10 ?? false;
  const templatePrompt = options?.customTemplateInstruction ?? getTemplatePrompt(template);
  const userPrompt = `Generate a professional case sheet.

${patientInfoBlock(patientInfo)}

${templatePrompt}

Consultation transcript:
${transcript}

Include: Patient Demographics, Chief Complaint, History of Present Illness, Past Medical History, Family/Social History (if mentioned), Review of Systems, Physical Examination (detailed), Vital Signs, Lab/Diagnostic findings (if mentioned), Assessment/Diagnosis, Plan/Treatment, Medications, Follow-up. Be professional, accurate, and complete. No placeholders.${includeIcd10 ? ' At the end, add a section "ICD-10 Codes (suggested):" with relevant codes where applicable.' : ''}`;

  const systemPrompt = 'You are a medical documentation specialist. Output only the case sheet text, well-structured and ready for medical records.';

  if (useGroq && groqClient) {
    return generateWithGroq(systemPrompt, userPrompt, 2500);
  }
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}\n\nCase Sheet:`;
  return generateWithGemini(fullPrompt, 2500, [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.0-pro',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-2.0-flash',
  ]);
}

/** Regenerate discharge summary from existing content (edit & refine with AI). */
export async function regenerateDischargeSummary(
  patientInfo: { name: string; age: number | null; gender: string | null; medicalRecordNumber?: string },
  currentContent: string,
  template?: string
): Promise<string> {
  const templatePrompt = getTemplatePrompt(template);
  const userPrompt = `Revise and improve this discharge summary. Keep it professional and complete. Do not add placeholders.

${patientInfoBlock(patientInfo)}

${templatePrompt}

Current discharge summary:
${currentContent}

Output the revised discharge summary only, with the same structure (Patient Demographics, Chief Complaint, HPI, etc.). Fix any errors, improve clarity, and ensure medical accuracy.`;

  const systemPrompt = 'You are a medical documentation specialist. Output only the revised discharge summary text.';
  if (useGroq && groqClient) return generateWithGroq(systemPrompt, userPrompt, 2500);
  return generateWithGemini(`${systemPrompt}\n\n${userPrompt}\n\nRevised Summary:`, 2500, [
    'gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.0-pro', 'gemini-1.5-pro', 'gemini-pro', 'gemini-2.0-flash',
  ]);
}

/** Regenerate case sheet from existing content (edit & refine with AI). */
export async function regenerateCaseSheet(
  patientInfo: { name: string; age: number | null; gender: string | null; medicalRecordNumber?: string },
  currentContent: string,
  template?: string
): Promise<string> {
  const templatePrompt = getTemplatePrompt(template);
  const userPrompt = `Revise and improve this case sheet. Keep it professional and complete. Do not add placeholders.

${patientInfoBlock(patientInfo)}

${templatePrompt}

Current case sheet:
${currentContent}

Output the revised case sheet only, with the same structure. Fix any errors, improve clarity, and ensure medical accuracy.`;

  const systemPrompt = 'You are a medical documentation specialist. Output only the revised case sheet text.';
  if (useGroq && groqClient) return generateWithGroq(systemPrompt, userPrompt, 3000);
  return generateWithGemini(`${systemPrompt}\n\n${userPrompt}\n\nRevised Case Sheet:`, 3000, [
    'gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.0-pro', 'gemini-1.5-pro', 'gemini-pro', 'gemini-2.0-flash',
  ]);
}
