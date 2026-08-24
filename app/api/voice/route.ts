import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const CHAT_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b'
];

const HEALTHY_SUBSTITUTES_MAP: Record<
  string,
  { name: string; price: number; unit: string; category: string; image: string; reason: string }
> = {
  sugar: { name: 'Organic Jaggery Powder', price: 65, unit: 'kg', category: 'Pantry', image: '🍯', reason: 'Unrefined, mineral-rich natural sweetener' },
  'white sugar': { name: 'Organic Jaggery Powder', price: 65, unit: 'kg', category: 'Pantry', image: '🍯', reason: 'Low-glycemic unrefined sweetener' },
  milk: { name: 'Unsweetened Almond Milk', price: 140, unit: 'litre', category: 'Dairy', image: '🥛', reason: 'Lactose-free, gut-friendly plant milk' },
  'dairy milk': { name: 'Unsweetened Oat Milk', price: 155, unit: 'litre', category: 'Dairy', image: '🥛', reason: 'Creamy plant-based dairy alternative' },
  butter: { name: 'Cold-Pressed Olive Oil', price: 290, unit: 'bottle', category: 'Pantry', image: '🫒', reason: 'Heart-healthy monounsaturated fats' },
  bread: { name: 'Artisan Sourdough Loaf', price: 85, unit: 'loaf', category: 'Bakery', image: '🍞', reason: 'Naturally fermented and gut-friendly' },
  'white bread': { name: '100% Whole Wheat Bread', price: 55, unit: 'loaf', category: 'Bakery', image: '🍞', reason: 'Higher fiber with zero refined flour' },
  rice: { name: 'Organic Brown Rice', price: 110, unit: 'kg', category: 'Pantry', image: '🌾', reason: 'High-fiber complex carbohydrate' },
  oil: { name: 'Cold-Pressed Mustard Oil', price: 180, unit: 'litre', category: 'Pantry', image: '🥥', reason: 'Unrefined, nutrient-dense cooking oil' },
  maida: { name: 'Organic Multigrain Atta', price: 75, unit: 'kg', category: 'Pantry', image: '🌾', reason: 'Zero refined flour, rich in dietary fiber' },
  cola: { name: 'Sparkling Kombucha', price: 95, unit: 'bottle', category: 'Beverages', image: '🍵', reason: 'Probiotic-rich refreshing beverage' },
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawTranscript = body.transcript || body.query || '';
    const pendingItemContext = (body.pendingItemContext || '').trim();
    const currentCart = body.currentCart || [];
    const purchaseHistory = body.purchaseHistory || [];
    const language = body.language || 'en-IN';

    if (!rawTranscript || typeof rawTranscript !== 'string' || !rawTranscript.trim()) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
    }

    const transcriptText = rawTranscript.trim();
    const currentMonth = new Date().toLocaleString('en-IN', { month: 'long' });

    // 1. Resolve Multi-Turn Context
    let effectiveQuery = transcriptText;
    if (pendingItemContext) {
      if (/^\d+$/.test(transcriptText)) {
        effectiveQuery = `Add ${transcriptText} pieces of ${pendingItemContext}`;
      } else if (!transcriptText.toLowerCase().includes(pendingItemContext.toLowerCase())) {
        effectiveQuery = `Add ${transcriptText} ${pendingItemContext}`;
      }
    }

    // 2. Ambiguity Detection (Only on Turn 1 when no pending context exists)
    const isBareSingleItem = /^(add|buy|get|need|daalo|kharido)\s+([a-zA-Z\s]+)$/i.test(effectiveQuery);
    const hasUnitsOrNumbers = /\d+|kg|kilo|litre|liter|packet|pack|bunch|dozen|gm|gram|bottle|can|box|pieces|piece/i.test(effectiveQuery);
    const isRecipeQuery = /ingredients|recipe|for making|bnani hai|dinner for|lunch for|dish|food/i.test(effectiveQuery);

    if (!pendingItemContext && isBareSingleItem && !hasUnitsOrNumbers && !isRecipeQuery) {
      const extractedItem = effectiveQuery.replace(/^(add|buy|get|need|daalo|kharido)\s+/i, '').trim();
      if (extractedItem && extractedItem.split(/\s+/).length <= 2) {
        return NextResponse.json({
          action: 'CLARIFY',
          intent: 'UNKNOWN',
          confidence: 0.95,
          clarificationRequired: true,
          pendingContext: extractedItem,
          ai_response_text: `How many kgs or pieces of ${extractedItem} would you like?`,
          feedbackMessage: `How many kgs or pieces of ${extractedItem} would you like?`,
          responseMessage: `How many kgs or pieces of ${extractedItem} would you like?`,
          items: []
        });
      }
    }

    // 3. Groq Universal Parsing & Decomposition Prompt
    const systemPrompt = `You are a high-intelligence Voice Shopping Assistant for Indian grocery, recipes, household items, deals, and pantry restocks in INR (₹).
Decompose culinary queries (e.g., "ingredients for Pav Bhaji", "Biryani for 4", "Pasta dinner") into 4-6 required grocery items with realistic units (kg, pack, bottle), estimated INR prices, and categories.
Parse multi-item additions and numerical quantity updates cleanly.
Output STRICT raw valid JSON only. Do not wrap in markdown backticks and never output <think> tags.

Context:
- Current Month: ${currentMonth}
- Current Cart: ${JSON.stringify(currentCart)}
- User History: ${JSON.stringify(purchaseHistory)}
- Language: ${language}

JSON Schema:
{
  "action": "ADD" | "ADD_BUNDLE" | "REMOVE" | "UPDATE_QUANTITY" | "SEARCH" | "GET_SEASONAL" | "GET_RUNNING_LOW" | "GET_SUBSTITUTE" | "GET_DEALS" | "SET_BUDGET" | "INFO",
  "clarificationRequired": false,
  "items": [
    { "name": string, "quantity": number, "unit": string, "price": number, "category": string, "image": string, "brand": string | null }
  ],
  "update_target": { "name": string, "quantity": number, "unit": string } | null,
  "search_results": [],
  "suggestions": [],
  "budget_limit": null,
  "ai_response_text": string
}`;

    let rawText = '';
    for (const model of CHAT_MODELS) {
      try {
        const response = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Parse user input: "${effectiveQuery}"` },
          ],
          model,
          temperature: 0.1,
          max_tokens: 1200,
        });
        rawText = response.choices[0]?.message?.content?.trim() || '';
        if (rawText) break;
      } catch (err: any) {
        console.warn(`Groq model ${model} failover:`, err?.message);
      }
    }

    let parsed: any;
    try {
      let cleaned = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    } catch {
      const qtyMatch = effectiveQuery.match(/(\d+(?:\.\d+)?)/);
      const parsedQty = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
      const itemName = pendingItemContext || effectiveQuery.replace(/\d+/g, '').replace(/add|kg|kilo|pack|piece|pieces|litre/gi, '').trim() || 'Item';

      parsed = {
        action: 'ADD',
        clarificationRequired: false,
        items: [{
          name: itemName.charAt(0).toUpperCase() + itemName.slice(1),
          quantity: parsedQty,
          unit: effectiveQuery.includes('kg') ? 'kg' : effectiveQuery.includes('litre') ? 'litre' : 'pack',
          price: 60 * parsedQty,
          category: 'Produce',
          image: '🛒',
          brand: null
        }],
        ai_response_text: `Added ${parsedQty} ${itemName} to your list.`
      };
    }

    // Attach substitute suggestions if applicable
    if ((parsed.action === 'ADD' || parsed.action === 'ADD_BUNDLE') && Array.isArray(parsed.items)) {
      parsed.items = parsed.items.map((item: any) => {
        if (!item.substituteSuggestion && item.name) {
          const lower = item.name.toLowerCase();
          for (const [key, sub] of Object.entries(HEALTHY_SUBSTITUTES_MAP)) {
            if (lower.includes(key)) {
              return { ...item, substituteSuggestion: sub };
            }
          }
        }
        return item;
      });
    }

    return NextResponse.json({
      ...parsed,
      intent: parsed.action || 'ADD',
      confidence: 0.95,
      clarificationRequired: false,
      feedbackMessage: parsed.ai_response_text || 'Processed your request.',
      responseMessage: parsed.ai_response_text || 'Processed your request.'
    });
  } catch (error: any) {
    console.error('Groq Execution Pipeline Error:', error);
    return NextResponse.json({
      action: 'INFO',
      intent: 'INFO',
      clarificationRequired: false,
      items: [],
      ai_response_text: "I couldn't process that command. Please try again."
    });
  }
}