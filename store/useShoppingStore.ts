import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ShoppingList, PantryItem, Recommendation, ShoppingPlan, AIActivity, Category } from '@/types';

export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: Category;
  price: number;
  brand?: string;
  image?: string;
  substituteSuggestion?: any;
}

export interface SuggestionItem {
  type: string;
  reason: string;
  discountBadge?: string | null;
  item: {
    name: string;
    price: number;
    originalPrice?: number | null;
    unit: string;
    category: string;
    image: string;
  };
}

interface ShoppingStoreState {
  items: CartItem[];
  savedItems: CartItem[];
  shoppingLists: ShoppingList[];
  activeListId: string;
  pantryItems: PantryItem[];
  activeSuggestions: SuggestionItem[];
  recommendations: Recommendation[];
  activities: AIActivity[];
  activePlan: ShoppingPlan | null;
  budgetLimit: number | null;
  
  // Cart Actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantityById: (id: string, delta: number) => void;
  saveForLater: (id: string) => void;
  moveToCart: (id: string) => void;
  swapItem: (id: string, substitute: any) => void;
  setBudgetLimit: (limit: number | null) => void;
  clearSuggestions: () => void;
  checkoutCart: () => void;

  // List Actions
  setActiveListId: (id: string) => void;
  createList: (title: string, budget?: number) => void;
  deleteList: (id: string) => void;
  addItemToList: (listId: string, item: any) => void;
  deleteItemFromList: (listId: string, itemId: string) => void;
  toggleItem: (listId: string, itemId: string) => void;
  moveCompletedToPantry: (listId: string) => void;

  // Pantry Actions
  savePantryItem: (item: PantryItem) => void;
  deletePantryItem: (id: string) => void;
  autoRestockLow: (low: PantryItem[]) => void;
  checkAndTriggerDepletionAlerts: () => void;
  setActivePlan: (plan: ShoppingPlan | null) => void;
}

export const useShoppingStore = create<ShoppingStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      savedItems: [],
      shoppingLists: [
        {
          id: 'list-1',
          title: 'Weekly Groceries',
          budget: 1500,
          items: [
            { id: 'i-1', name: 'Farm Fresh Potatoes', category: 'Produce', quantity: 2, unit: 'kg', estimatedPrice: 80, completed: false, brand: 'Organic' },
            { id: 'i-2', name: 'Amul Taaza Milk', category: 'Dairy', quantity: 2, unit: 'litre', estimatedPrice: 108, completed: true, brand: 'Amul' }
          ]
        }
      ],
      activeListId: 'list-1',
      pantryItems: [
        { id: 'p-1', name: 'Whole Dairy Milk', category: 'Dairy', quantity: 1, unit: 'bottle', estimatedRemaining: 20, status: 'critically_low', predictedRunoutDate: 'Tomorrow', averageConsumptionRate: 'Every 2 days' },
        { id: 'p-2', name: 'Fresh Spinach', category: 'Produce', quantity: 1, unit: 'bunch', estimatedRemaining: 80, status: 'expiring_soon', predictedRunoutDate: 'In 2 days', averageConsumptionRate: 'Cook within 48 hrs' },
        { id: 'p-3', name: 'Basmati Rice', category: 'Pantry', quantity: 5, unit: 'kg', estimatedRemaining: 75, status: 'good', predictedRunoutDate: 'In 3 weeks', averageConsumptionRate: '1 kg/week' }
      ],
      activeSuggestions: [],
      recommendations: [
        {
          id: 'rec-1',
          recommendationType: 'RUNNING_LOW',
          confidence: 0.95,
          reason: 'Milk consumption rate indicates your supply is 80% depleted.',
          product: { id: 'prod-milk', name: 'Amul Toned Milk', price: 54, unit: 'litre', category: 'Dairy', image: '🥛' },
          explanation: { usualIntervalDays: 3, daysSinceLastPurchase: 3, typicalPriceRange: '₹50 - ₹58' }
        },
        {
          id: 'rec-2',
          recommendationType: 'BETTER_ALTERNATIVE',
          confidence: 0.91,
          reason: 'Unsweetened Almond Milk has 60% fewer calories with zero lactose.',
          product: { id: 'prod-almond', name: 'Almond Milk', price: 140, unit: 'litre', category: 'Dairy', image: '🥛' },
          originalProduct: { name: 'Full Cream Milk', price: 70, category: 'Dairy' },
          savings: 15
        }
      ],
      activities: [
        {
          id: 'act-1',
          timestamp: Date.now() - 3600000,
          type: 'plan',
          title: 'Pav Bhaji Cooking Plan',
          description: 'Decomposed 4 servings with fresh produce and pantry spices.',
          confidence: 0.96,
          dataUsed: ['Pantry Stock', 'Seasonal Catalog']
        }
      ],
      activePlan: {
        id: 'plan-1',
        title: 'Pav Bhaji Dinner for 4',
        people: 4,
        budget: 800,
        estimatedTotal: 380,
        aiExplanation: 'Prioritized seasonal potatoes and tomatoes while applying pantry spices.',
        neededItems: [
          { name: 'Farm Fresh Potatoes', quantity: 2, unit: 'kg', estimatedPrice: 80, category: 'Produce' },
          { name: 'Fresh Tomatoes', quantity: 1, unit: 'kg', estimatedPrice: 35, category: 'Produce' },
          { name: 'Fresh Pav Buns', quantity: 2, unit: 'packs', estimatedPrice: 60, category: 'Bakery' },
          { name: 'Butter', quantity: 1, unit: 'pack', estimatedPrice: 56, category: 'Dairy' }
        ],
        alreadyHave: [
          { name: 'Pav Bhaji Masala', reason: 'Found in Pantry' },
          { name: 'Salt', reason: 'Well Stocked' }
        ]
      },
      budgetLimit: 2000,

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.name.toLowerCase() === item.name.toLowerCase());
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === existing.id ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i
              )
            };
          }
          return {
            items: [...state.items, { ...item, id: `cart-${Date.now()}-${Math.random()}` }]
          };
        });
      },

      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
      },

      updateQuantityById: (id, delta) => {
        set((state) => ({
          items: state.items
            .map((i) => (i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
            .filter((i) => i.quantity > 0)
        }));
      },

      saveForLater: (id) => {
        const item = get().items.find((i) => i.id === id);
        if (!item) return;
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
          savedItems: [...state.savedItems, item]
        }));
      },

      moveToCart: (id) => {
        const item = get().savedItems.find((i) => i.id === id);
        if (!item) return;
        set((state) => ({
          savedItems: state.savedItems.filter((i) => i.id !== id),
          items: [...state.items, item]
        }));
      },

      swapItem: (id, substitute) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  name: substitute.name,
                  price: substitute.price,
                  unit: substitute.unit,
                  category: substitute.category,
                  substituteSuggestion: undefined
                }
              : i
          )
        }));
      },

      setBudgetLimit: (limit) => set({ budgetLimit: limit }),
      clearSuggestions: () => set({ activeSuggestions: [] }),

      checkoutCart: () => {
        const currentItems = get().items;
        if (currentItems.length === 0) return;

        // Move items to pantry after checkout
        const newPantry = currentItems.map((item) => ({
          id: `pantry-${Date.now()}-${item.id}`,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          estimatedRemaining: 100,
          status: 'good' as const,
          lastUpdated: Date.now(),
          averageConsumptionRate: 'Purchased recently'
        }));

        set((state) => ({
          items: [],
          pantryItems: [...newPantry, ...state.pantryItems],
          activities: [
            {
              id: `act-${Date.now()}`,
              timestamp: Date.now(),
              type: 'voice',
              title: 'Checkout Completed',
              description: `Purchased ${currentItems.length} grocery items. Restocked pantry inventory.`,
              confidence: 1.0,
              dataUsed: ['Current Cart', 'Pantry Engine']
            },
            ...state.activities
          ]
        }));
      },

      setActiveListId: (id) => set({ activeListId: id }),

      createList: (title, budget) => {
        const newList: ShoppingList = {
          id: `list-${Date.now()}`,
          title,
          budget: budget || 1500,
          items: []
        };
        set((state) => ({
          shoppingLists: [...state.shoppingLists, newList],
          activeListId: newList.id
        }));
      },

      deleteList: (id) => {
        set((state) => ({
          shoppingLists: state.shoppingLists.filter((l) => l.id !== id)
        }));
      },

      addItemToList: (listId, item) => {
        set((state) => ({
          shoppingLists: state.shoppingLists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  items: [
                    ...l.items,
                    {
                      ...item,
                      id: `item-${Date.now()}-${Math.random()}`,
                      completed: false
                    }
                  ]
                }
              : l
          )
        }));
      },

      deleteItemFromList: (listId, itemId) => {
        set((state) => ({
          shoppingLists: state.shoppingLists.map((l) =>
            l.id === listId
              ? { ...l, items: l.items.filter((i) => i.id !== itemId) }
              : l
          )
        }));
      },

      toggleItem: (listId, itemId) => {
        set((state) => ({
          shoppingLists: state.shoppingLists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  items: l.items.map((i) =>
                    i.id === itemId ? { ...i, completed: !i.completed } : i
                  )
                }
              : l
          )
        }));
      },

      moveCompletedToPantry: (listId) => {
        const target = get().shoppingLists.find((l) => l.id === listId);
        if (!target) return;
        const completed = target.items.filter((i) => i.completed);
        if (completed.length === 0) return;

        const newPantry = completed.map((c) => ({
          id: `pantry-${Date.now()}-${c.id}`,
          name: c.name,
          category: c.category,
          quantity: c.quantity,
          unit: c.unit,
          estimatedRemaining: 100,
          status: 'good' as const,
          lastUpdated: Date.now(),
          averageConsumptionRate: 'Moved from shopping list'
        }));

        set((state) => ({
          pantryItems: [...newPantry, ...state.pantryItems],
          shoppingLists: state.shoppingLists.map((l) =>
            l.id === listId
              ? { ...l, items: l.items.filter((i) => !i.completed) }
              : l
          )
        }));
      },

      savePantryItem: (item) => {
        set((state) => {
          const exists = state.pantryItems.some((p) => p.id === item.id);
          return {
            pantryItems: exists
              ? state.pantryItems.map((p) => (p.id === item.id ? item : p))
              : [item, ...state.pantryItems]
          };
        });
      },

      deletePantryItem: (id) => {
        set((state) => ({
          pantryItems: state.pantryItems.filter((p) => p.id !== id)
        }));
      },

      autoRestockLow: (low) => {
        low.forEach((item) => {
          get().addItem({
            name: item.name,
            quantity: 1,
            unit: item.unit,
            category: item.category,
            price: 60
          });
        });
      },

      checkAndTriggerDepletionAlerts: () => {
        // Runs purchase interval check
      },

      setActivePlan: (plan) => set({ activePlan: plan })
    }),
    {
      name: 'shopsense-storage-prod'
    }
  )
);