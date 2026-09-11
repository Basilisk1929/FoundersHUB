/**
 * Centralized Google Gemini AI Client for FoundersHub
 * Supports multi-model fallback (1.5-flash -> 2.0-flash -> 1.5-pro),
 * multi-turn chat history, system instructions, and token streaming.
 */

export interface GeminiMessage {
  role: 'user' | 'model' | 'assistant' | 'system';
  content: string;
}

export interface GeminiOptions {
  systemPrompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
  history?: GeminiMessage[];
}

export function getGeminiApiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY
  )?.trim();
}

const MODELS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro'
];

/**
 * Calls Gemini with automatic model fallback and rich error logging.
 */
export async function callGemini(
  prompt: string,
  options: GeminiOptions = {}
): Promise<{ text: string; modelUsed: string } | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return null;
  }

  const { systemPrompt, temperature = 0.7, maxOutputTokens = 1200, history = [] } = options;

  // Build contents array supporting multi-turn conversation
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  // Add previous turns
  for (const h of history) {
    if (!h.content?.trim()) continue;
    const role = h.role === 'assistant' || h.role === 'model' ? 'model' : 'user';
    contents.push({
      role,
      parts: [{ text: h.content }]
    });
  }

  // Add current user prompt
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  for (const model of MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload: any = {
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens
        }
      };

      if (systemPrompt) {
        payload.systemInstruction = {
          parts: [{ text: systemPrompt }]
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Gemini] Model ${model} returned ${res.status}: ${errText.slice(0, 150)}`);
        continue; // Try next model
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim().length > 0) {
        return { text: text.trim(), modelUsed: model };
      }
    } catch (err: any) {
      console.warn(`[Gemini] Network error calling ${model}:`, err?.message || err);
    }
  }

  return null;
}
