import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { STORE_CATALOG, HEALTHY_SUBSTITUTES_MAP } from '@/lib/catalogData';

export const dynamic = 'force-dynamic';

const CHAT_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b'
];

export async function POST(req: Request) {
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || 'dummy-key-for-build',
    });

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

    // 1. Multi-Turn Context Stitching
    let effectiveQuery = transcriptText;
    if (pendingItemContext) {
      if (/^\d+$/.test(transcriptText)) {
        effectiveQuery = `Add ${transcriptText} pieces of ${pendingItemContext}`;
      } else if (!transcriptText.toLowerCase().includes(pendingItemContext.toLowerCase())) {
        effectiveQuery = `Add ${transcriptText} ${pendingItemContext}`;
      }
    }

    // 2. Ambiguity Detection
    const isPantryQuery = /pantry/i.test(effectiveQuery);
    const isBareSingleItem = /^(add|buy|get|need|daalo|kharido)\s+([a-zA-Z\s]+)$/i.test(effectiveQuery);
    const hasUnitsOrNumbers = /\d+|kg|kilo|litre|liter|packet|pack|bunch|dozen|gm|gram|bottle|can|box|pieces|piece/i.test(effectiveQuery);
    const isRecipeQuery = /ingredients|recipe|for making|bnani hai|dinner for|lunch for|dish|food/i.test(effectiveQuery);

    if (!pendingItemContext && isBareSingleItem && !hasUnitsOrNumbers && !isRecipeQuery && !isPantryQuery) {
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

    // 3. Groq Prompt
    const systemPrompt = `You are a high-intelligence Voice Shopping Assistant for Indian grocery, recipes, household items, deals, and pantry restocks in INR (₹).

Context:
- Current Month: ${currentMonth}
- Current Cart: ${JSON.stringify(currentCart)}
- Current Pantry Inventory: ${JSON.stringify(purchaseHistory)}
- Language: ${language}

PANTRY-AWARE INVENTORY RULES:
1. When user requests adding items or ingredients for recipes/meals, CROSS-CHECK "Current Pantry Inventory".
2. If an item is ALREADY AVAILABLE in the pantry with good remaining stock (>25% or status 'good'), do NOT blindly add it:
   - If all requested items are in the pantry, set action="PANTRY_EXISTS", put them in "pantry_found", and ask: "You already have [items] in your pantry. Shall we still add them to the list?"
   - If some items are in the pantry and others are missing, populate "items" ONLY with the missing items to buy, put existing ones in "pantry_found", and state which ones are already in the pantry.
3. "ADD_PANTRY": User specifies adding or stocking items directly in their pantry inventory.
4. "ADD_BUNDLE": Recipe decomposition for ANY dish.
5. "ADD": Explicit command to add grocery products to the shopping cart.
6. "REMOVE", "UPDATE_QUANTITY", "SEARCH", "GET_DEALS", "GET_SEASONAL", "GET_RUNNING_LOW", "SET_BUDGET", "INFO".

Output STRICT raw valid JSON only. Do not wrap in markdown backticks and never output <think> tags.

JSON Schema:
{
  "action": "ADD" | "ADD_PANTRY" | "ADD_BUNDLE" | "PANTRY_EXISTS" | "REMOVE" | "UPDATE_QUANTITY" | "SEARCH" | "GET_SEASONAL" | "GET_RUNNING_LOW" | "GET_SUBSTITUTE" | "GET_DEALS" | "SET_BUDGET" | "INFO",
  "clarificationRequired": false,
  "items": [
    { "name": string, "quantity": number, "unit": string, "price": number, "category": string, "image": string, "brand": string | null }
  ],
  "pantry_found": [
    { "name": string, "quantity": number, "unit": string, "status": string }
  ],
  "update_target": { "name": string, "quantity": number, "unit": string } | null,
  "search_filter": { "query": string | null, "max_price": number | null } | null,
  "suggestions": [
    {
      "type": "sale_deal" | "seasonal" | "restock_alert" | "substitute",
      "reason": string,
      "discountBadge": string | null,
      "item": { "name": string, "price": number, "originalPrice": number | null, "unit": string, "category": string, "image": string }
    }
  ],
  "budget_limit": number | null,
  "ai_response_text": string
}`;

    let rawText = '';
    for (const model of CHAT_MODELS) {
      try {
        const response = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Parse input: "${effectiveQuery}"` },
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
      const isPantry = /pantry/i.test(effectiveQuery);
      const qtyMatch = effectiveQuery.match(/(\d+(?:\.\d+)?)/);
      const parsedQty = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
      const itemName = pendingItemContext || effectiveQuery.replace(/\d+/g, '').replace(/add|kg|kilo|pack|piece|pieces|litre|to pantry|in pantry|pantry/gi, '').trim() || 'Item';

      parsed = {
        action: isPantry ? 'ADD_PANTRY' : 'ADD',
        clarificationRequired: false,
        items: [{
          name: itemName.charAt(0).toUpperCase() + itemName.slice(1),
          quantity: parsedQty,
          unit: effectiveQuery.includes('kg') ? 'kg' : effectiveQuery.includes('litre') ? 'litre' : 'pack',
          price: 60 * parsedQty,
          category: 'Pantry',
          image: '🛒',
          brand: null
        }],
        pantry_found: [],
        ai_response_text: isPantry 
          ? `Added ${parsedQty} ${itemName} to your pantry.` 
          : `Added ${parsedQty} ${itemName} to your list.`
      };
    }

    if (parsed.action === 'GET_DEALS' || /discount|offer|deal|saving/i.test(effectiveQuery)) {
      const discountedProducts = STORE_CATALOG.filter(p => p.discountBadge);
      parsed.action = 'GET_DEALS';
      parsed.suggestions = discountedProducts.map(p => ({
        type: 'sale_deal',
        reason: `${p.discountBadge} on ${p.brand}`,
        discountBadge: p.discountBadge,
        item: {
          name: p.name,
          price: p.price,
          originalPrice: p.originalPrice || null,
          unit: p.unit,
          category: p.category,
          image: p.image
        }
      }));
      parsed.ai_response_text = `Here are today's top grocery deals! You can save on ${discountedProducts[0]?.name || 'cooking essentials'}.`;
    }

    if (parsed.action === 'SEARCH' && parsed.search_filter) {
      const q = (parsed.search_filter.query || '').toLowerCase();
      const maxPrice = parsed.search_filter.max_price;

      const matches = STORE_CATALOG.filter(p => {
        const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.tags.some(t => t.includes(q)) || p.brand.toLowerCase().includes(q);
        const matchesPrice = maxPrice ? p.price <= maxPrice : true;
        return matchesQuery && matchesPrice;
      });

      parsed.search_results = matches;
      if (matches.length > 0) {
        parsed.items = matches.slice(0, 1).map(p => ({
          name: p.name,
          quantity: 1,
          unit: p.unit,
          price: p.price,
          category: p.category,
          image: p.image,
          brand: p.brand
        }));
        parsed.ai_response_text = `Found ${matches.length} matching products. Added ${matches[0].name} for ₹${matches[0].price}.`;
      } else {
        parsed.ai_response_text = `No items found matching "${q}" within ₹${maxPrice || 'unlimited'}.`;
      }
    }

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
      confidence: 0.96,
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
      pantry_found: [],
      ai_response_text: "I couldn't process that command. Please try again with a specific grocery item."
    });
  }
}