export type Category = 
  | 'Produce' 
  | 'Dairy' 
  | 'Pantry' 
  | 'Bakery' 
  | 'Meat & Seafood' 
  | 'Snacks' 
  | 'Beverages' 
  | 'Household' 
  | 'Personal Care';

export interface Product {
  id?: string;
  name: string;
  price: number;
  originalPrice?: number;
  unit?: string;
  packageSize?: string;
  category: Category;
  brand?: string | null;
  image?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  brand?: string | null;
  image?: string;
  completed: boolean;
  source?: 'manual' | 'plan' | 'voice' | 'recommendation';
  createdAt?: number;
  updatedAt?: number;
  substituteSuggestion?: {
    name: string;
    price: number;
    unit?: string;
    reason?: string;
  };
}

export interface ShoppingList {
  id: string;
  title: string;
  budget?: number;
  items: ShoppingItem[];
  createdAt?: number;
}

export interface PantryItem {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  estimatedRemaining: number;
  status: 'good' | 'expiring_soon' | 'running_low' | 'critically_low';
  lastUpdated?: number;
  predictedRunoutDate?: string;
  averageConsumptionRate?: string;
  image?: string;
}

export interface RecommendationExplanation {
  dataUsed?: string[];
  dataNotUsed?: string[];
  usualIntervalDays?: number;
  daysSinceLastPurchase?: number;
  typicalPriceRange?: string;
}

export interface Recommendation {
  id: string;
  recommendationType: 'RUNNING_LOW' | 'BETTER_ALTERNATIVE' | 'SEASONAL' | 'FREQUENTLY_BOUGHT_TOGETHER';
  confidence: number;
  reason: string;
  product: Product;
  originalProduct?: Product;
  savings?: number;
  explanation?: RecommendationExplanation;
}

export interface ShoppingPlanItem {
  name: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  category?: Category;
  reason?: string;
  image?: string;
}

export interface ShoppingPlan {
  id: string;
  title: string;
  people: number;
  budget: number;
  estimatedTotal: number;
  aiExplanation?: string;
  neededItems: ShoppingPlanItem[];
  alreadyHave?: { name: string; reason: string }[];
  smartSubstitutions?: { reason: string; savings: number }[];
}

export interface AIActivity {
  id: string;
  timestamp: number;
  type: 'plan' | 'substitute' | 'replenish' | 'voice' | string;
  title: string;
  description: string;
  confidence?: number;
  dataUsed?: string[];
}

export interface UserProfile {
  id: string;
  displayName: string;
  email?: string;
  photoURL?: string;
}