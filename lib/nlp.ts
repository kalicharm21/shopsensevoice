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

export async function parseIntentWithAI(
  query: string,
  _context?: {
    language?: 'en-IN' | 'hi-IN';
    pantry?: PantryItem[];
    activeListId?: string;
    existingLists?: ShoppingList[];
  }
): Promise<ExtendedIntentResponse> {
  try {
    const res = await fetch('/api/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    if (!res.ok) throw new Error('API response failed');
    return await res.json();
  } catch {
    return {
      intent: 'UNKNOWN',
      confidence: 0.5,
      clarificationRequired: false,
      feedbackMessage: 'Added item with local fallback.',
      responseMessage: 'Added item with local fallback.'
    };
  }
}