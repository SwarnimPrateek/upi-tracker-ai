"use server";

import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client on the server.
// It will look for process.env.GEMINI_API_KEY when configured.
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured. Please add it to your .env.local file.');
  }
  return new GoogleGenAI({ apiKey });
};

export interface ExtractedTransaction {
  merchant: string | null;
  amount: number | null;
  date: string | null; // YYYY-MM-DD
  reference_number: string | null;
  category: 'Food' | 'Shopping' | 'Bills' | 'Travel' | 'Others';
}

/**
 * Server Action: Extract transaction details from a Base64 encoded screenshot.
 */
export async function extractTransactionFromImage(base64Image: string): Promise<{
  success: boolean;
  error?: string;
  data?: ExtractedTransaction[];
}> {
  try {
    const ai = getGeminiClient();

    // Check if image data is format URL (e.g. data:image/png;base64,iVBORw...)
    const match = base64Image.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    let mimeType = 'image/png';
    let data = base64Image;

    if (match) {
      mimeType = match[1];
      data = match[2];
    }

    const prompt = `Extract all transaction details from this UPI screenshot. It could contain one or multiple transactions (e.g. a transaction list or history page). Return strictly a JSON array of transaction objects matching the requested schema. Schema: Array<{ merchant: string | null, amount: number | null, date: 'YYYY-MM-DD' | null, reference_number: string | null, category: 'Food' | 'Shopping' | 'Bills' | 'Travel' | 'Others' }>`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              merchant: { type: 'string', nullable: true },
              amount: { type: 'number', nullable: true },
              date: { type: 'string', nullable: true, description: 'Transaction date in YYYY-MM-DD format' },
              reference_number: { type: 'string', nullable: true, description: 'UPI reference number or unique transaction ID' },
              category: { 
                type: 'string', 
                enum: ['Food', 'Shopping', 'Bills', 'Travel', 'Others'] 
              }
            },
            required: ['merchant', 'amount', 'date', 'reference_number', 'category']
          }
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      return { success: false, error: 'Empty response returned from Gemini API.' };
    }

    const parsedData = JSON.parse(responseText.trim()) as ExtractedTransaction[];
    return { success: true, data: parsedData };

  } catch (error: any) {
    console.error('Error in extractTransactionFromImage Server Action:', error);
    return { success: false, error: error?.message || 'Failed to analyze screenshot' };
  }
}

/**
 * Server Action: Analyze transaction history against a user's voice query.
 */
export async function processVoiceQuery(
  transcript: string,
  transactionsData: any[]
): Promise<{
  success: boolean;
  error?: string;
  text?: string;
}> {
  try {
    const ai = getGeminiClient();

    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const dataString = JSON.stringify(transactionsData);

    const prompt = `You are an AI financial assistant for a premium UPI expense tracker. You are given a user's natural language query (transcribed from voice) and a JSON array of their transaction history.
User Query: "${transcript}"
Current Date Context: ${currentDate}
Transaction Data (JSON): ${dataString}

Analyze the data to answer the query accurately. 
Constraints:
- Respond with a short, conversational, and direct answer (under 2 sentences).
- The response MUST be readable aloud by a Text-to-Speech engine.
- Avoid markdown, bold asterisks (**), hashtags, bullet points, list formatting, and code blocks.
- If the user asks about categories, sum or filter accordingly.
- Keep the language natural and clear. E.g. "You have spent a total of 1500 rupees on Food this month across 3 transactions."`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
    });

    const text = response.text;
    if (!text) {
      return { success: false, error: 'Empty response from voice analysis agent.' };
    }

    return { success: true, text: text.trim() };

  } catch (error: any) {
    console.error('Error in processVoiceQuery Server Action:', error);
    return { success: false, error: error?.message || 'Failed to process voice query' };
  }
}
