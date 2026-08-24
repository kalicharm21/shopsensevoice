import { PantryItem, ShoppingList, ShoppingPlan, Category } from '../types';

export interface ExtendedIntentItem {
  name: string;
  normalizedName: string | null;
  quantity: number;
  unit: string;
  brand: string | null;
  category: Category;
  maxPrice: number | null;
}

export interface ExtendedIntentResponse {
  intent: 'ADD_ITEMS' | 'REMOVE_ITEMS' | 'SEARCH' | 'CREATE_PLAN' | 'DEALS' | 'UNKNOWN';
  confidence: number;
  clarificationRequired: boolean;
  feedbackMessage?: string;
  responseMessage?: string;
  items?: ExtendedIntentItem[];
  entities?: Record<string, any>;
  searchFilters?: { query?: string; maxPrice?: number } | null;
  planRequest?: { mealName?: string; people?: number; budget?: number } | null;
}

function normalizeIntentType(actionOrIntent: string): ExtendedIntentResponse['intent'] {
  const upper = (actionOrIntent || '').toUpperCase();
  switch (upper) {
    case 'ADD':
    case 'ADD_ITEMS':
      return 'ADD_ITEMS';
    case 'ADD_BUNDLE':
    case 'CREATE_PLAN':
      return 'CREATE_PLAN';
    case 'REMOVE':
    case 'REMOVE_ITEMS':
      return 'REMOVE_ITEMS';
    case 'SEARCH':
      return 'SEARCH';
    case 'GET_DEALS':
    case 'DEALS':
      return 'DEALS';
    default:
      return 'UNKNOWN';
  }
}

export async function parseIntentWithAI(
  query: string,
  context?: {
    language?: 'en-IN' | 'hi-IN';
    pantry?: PantryItem[];
    activeListId?: string;
    existingLists?: ShoppingList[];
  }
): Promise<ExtendedIntentResponse> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return {
      intent: 'UNKNOWN',
      confidence: 0,
      clarificationRequired: false,
      feedbackMessage: 'Please say or type a grocery command.',
      responseMessage: 'Please say or type a grocery command.',
      items: []
    };
  }

  try {
    const res = await fetch('/api/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        transcript: cleanQuery,
        query: cleanQuery,
        language: context?.language || 'en-IN',
        purchaseHistory: context?.pantry || [],
        currentCart: context?.existingLists || []
      })
    });

    if (!res.ok) {
      throw new Error(`API responded with HTTP status ${res.status}`);
    }

    const data = await res.json();

    // Map items to ExtendedIntentItem structure
    const mappedItems: ExtendedIntentItem[] = Array.isArray(data.items)
      ? data.items.map((i: any) => ({
          name: i.name || cleanQuery,
          normalizedName: i.normalizedName || null,
          quantity: Number(i.quantity) || 1,
          unit: i.unit || 'pack',
          brand: i.brand || null,
          category: (i.category || 'Pantry') as Category,
          maxPrice: i.price ? Number(i.price) : null
        }))
      : [];

    const feedback = data.feedbackMessage || data.responseMessage || data.ai_response_text || 'Processed your request.';
    const normalizedIntent = normalizeIntentType(data.intent || data.action || 'UNKNOWN');

    return {
      intent: normalizedIntent,
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.95,
      clarificationRequired: Boolean(data.clarificationRequired),
      feedbackMessage: feedback,
      responseMessage: feedback,
      items: mappedItems,
      entities: data.entities || {},
      searchFilters: data.searchFilters || (data.search_results ? { query: cleanQuery } : null),
      planRequest: data.planRequest || null
    };
  } catch (err) {
    console.warn('Groq NLP API request failed, executing local heuristic fallback:', err);
    
    // Deterministic fallback for simple add commands
    const isAddCommand = /^(add|buy|get|need|daalo|kharido)/i.test(cleanQuery);
    const fallbackItemName = cleanQuery.replace(/^(add|buy|get|need|daalo|kharido)\s+/i, '').trim();

    return {
      intent: isAddCommand ? 'ADD_ITEMS' : 'UNKNOWN',
      confidence: 0.7,
      clarificationRequired: false,
      feedbackMessage: isAddCommand 
        ? `Added ${fallbackItemName || 'item'} to your list.` 
        : `I've noted: "${cleanQuery}"`,
      responseMessage: isAddCommand 
        ? `Added ${fallbackItemName || 'item'} to your list.` 
        : `I've noted: "${cleanQuery}"`,
      items: isAddCommand && fallbackItemName ? [
        {
          name: fallbackItemName,
          normalizedName: null,
          quantity: 1,
          unit: 'pack',
          brand: null,
          category: 'Pantry',
          maxPrice: 60
        }
      ] : []
    };
  }
}