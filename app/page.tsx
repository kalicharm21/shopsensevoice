'use client';

import React, { useState, useEffect } from 'react';
import { useShoppingStore } from '@/store/useShoppingStore';
import { Navbar } from '@/components/Navbar';
import { HomeView } from '@/components/HomeView';
import { ListsView } from '@/components/ListsView';
import { PantryView } from '@/components/PantryView';
import { DiscoverView } from '@/components/DiscoverView';
import { SmartHubView } from '@/components/SmartHubView';
import { ActivityView } from '@/components/ActivityView';
import { VoiceModal } from '@/components/VoiceModal';
import { WhyModal } from '@/components/WhyModal';
import { PlanModal } from '@/components/PlanModal';
import { STORE_CATALOG } from '@/lib/catalogData';
import { DEMO_PRODUCTS } from '@/data/products';
import { 
  ShoppingList, 
  PantryItem, 
  Recommendation, 
  ShoppingPlan, 
  AIActivity, 
  UserProfile 
} from '@/types';

export default function ShopSenseApp() {
  const { 
    items, 
    checkAndTriggerDepletionAlerts, 
    addItem 
  } = useShoppingStore();

  const [activeTab, setActiveTab] = useState<string>('home');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedWhyRec, setSelectedWhyRec] = useState<Recommendation | null>(null);

  const [user] = useState<UserProfile>({
    id: 'u-1',
    displayName: 'Ishaan Mittal',
    photoURL: ''
  });

  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([
    {
      id: 'list-1',
      title: 'Weekly Groceries',
      budget: 1500,
      items: [
        { id: 'i-1', name: 'Farm Fresh Potatoes', category: 'Produce', quantity: 2, unit: 'kg', estimatedPrice: 80, completed: false, brand: 'Fresh' },
        { id: 'i-2', name: 'Toned Milk', category: 'Dairy', quantity: 2, unit: 'litre', estimatedPrice: 108, completed: true, brand: 'Amul' }
      ]
    }
  ]);
  const [activeListId, setActiveListId] = useState<string>('list-1');

  const [pantryItems, setPantryItems] = useState<PantryItem[]>([
    { id: 'p-1', name: 'Whole Dairy Milk', category: 'Dairy', quantity: 1, unit: 'bottle', estimatedRemaining: 20, status: 'critically_low', predictedRunoutDate: 'Tomorrow', averageConsumptionRate: 'Every 2 days' },
    { id: 'p-2', name: 'Fresh Spinach', category: 'Produce', quantity: 1, unit: 'bunch', estimatedRemaining: 80, status: 'expiring_soon', predictedRunoutDate: 'In 2 days', averageConsumptionRate: 'Cook within 48 hrs' },
    { id: 'p-3', name: 'Basmati Rice', category: 'Pantry', quantity: 5, unit: 'kg', estimatedRemaining: 75, status: 'good', predictedRunoutDate: 'In 3 weeks', averageConsumptionRate: '1 kg/week' }
  ]);

  const [activePlan, setActivePlan] = useState<ShoppingPlan | null>({
    id: 'plan-1',
    title: 'Pav Bhaji Dinner for 4',
    people: 4,
    budget: 800,
    estimatedTotal: 380,
    aiExplanation: 'Prioritized seasonal potatoes and tomatoes while applying pantry bread and spices.',
    neededItems: [
      { name: 'Farm Fresh Potatoes', quantity: 2, unit: 'kg', estimatedPrice: 80, category: 'Produce' },
      { name: 'Fresh Tomatoes', quantity: 1, unit: 'kg', estimatedPrice: 35, category: 'Produce' },
      { name: 'Whole Wheat Pav Buns', quantity: 2, unit: 'packs', estimatedPrice: 60, category: 'Bakery' },
      { name: 'Butter', quantity: 1, unit: 'pack', estimatedPrice: 56, category: 'Dairy' }
    ],
    alreadyHave: [
      { name: 'Pav Bhaji Masala', reason: 'Found in Pantry' },
      { name: 'Salt', reason: 'Well Stocked' }
    ],
    smartSubstitutions: [
      { reason: 'Whole Wheat Pav instead of white bread', savings: 15 }
    ]
  });

  const [recommendations] = useState<Recommendation[]>([
    {
      id: 'rec-1',
      recommendationType: 'RUNNING_LOW',
      confidence: 0.95,
      reason: 'Milk consumption rate indicates your supply is 80% depleted.',
      product: DEMO_PRODUCTS[6] || { id: 'p-6', name: 'Amul Taaza Milk', price: 54, unit: 'litre', category: 'Dairy', image: '🥛' },
      explanation: {
        usualIntervalDays: 3,
        daysSinceLastPurchase: 3,
        typicalPriceRange: '₹50 - ₹58'
      }
    },
    {
      id: 'rec-2',
      recommendationType: 'BETTER_ALTERNATIVE',
      confidence: 0.91,
      reason: 'Unsweetened Almond Milk has 60% fewer calories with zero lactose.',
      product: DEMO_PRODUCTS[0] || { id: 'p-0', name: 'Almond Milk', price: 140, unit: 'litre', category: 'Dairy', image: '🥛' },
      originalProduct: { name: 'Full Cream Milk', price: 85, category: 'Dairy' },
      savings: 15
    },
    {
      id: 'rec-3',
      recommendationType: 'SEASONAL',
      confidence: 0.88,
      reason: 'Cold-pressed mustard oil is locally sourced and on seasonal discount.',
      product: DEMO_PRODUCTS[4] || { id: 'p-4', name: 'Cold-Pressed Mustard Oil', price: 180, unit: 'litre', category: 'Pantry', image: '🥥' },
      savings: 50
    }
  ]);

  const [activities, setActivities] = useState<AIActivity[]>([
    {
      id: 'act-1',
      timestamp: Date.now() - 3600000,
      type: 'plan',
      title: 'Generated Pav Bhaji Cooking Plan',
      description: 'Decomposed recipe for 4 servings, cross-referenced pantry ingredients, and budgeted ₹380.',
      confidence: 0.96,
      dataUsed: ['Pantry Stock', 'Local Store Catalog', 'Standard Recipe Ratios']
    },
    {
      id: 'act-2',
      timestamp: Date.now() - 7200000,
      type: 'replenish',
      title: 'Pantry Depletion Alert: Milk',
      description: 'Detected purchase frequency threshold reached (~3 days cycle).',
      confidence: 0.94,
      dataUsed: ['Purchase History', 'Cycle Estimator']
    }
  ]);

  useEffect(() => {
    if (typeof checkAndTriggerDepletionAlerts === 'function') {
      checkAndTriggerDepletionAlerts();
    }
  }, [checkAndTriggerDepletionAlerts]);

  const activeList = shoppingLists.find((l) => l.id === activeListId) || shoppingLists[0] || null;
  const activeCatalog = STORE_CATALOG && STORE_CATALOG.length > 0 ? STORE_CATALOG : DEMO_PRODUCTS;

  return (
    <main className="min-h-screen w-full bg-[#FAF9F6] text-[#353535] antialiased overflow-x-hidden flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        currentTab={activeTab}
        onNavigate={setActiveTab}
        onOpenVoice={() => setIsVoiceModalOpen(true)}
        user={user}
        activeListsCount={shoppingLists.length}
        unreadRecommendationsCount={recommendations.length}
      />

      {/* Main View Port */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
        {/* VIEW 1: HOME */}
        {activeTab === 'home' && (
          <HomeView
            user={user}
            activePlan={activePlan}
            shoppingLists={shoppingLists}
            pantryItems={pantryItems}
            recommendations={recommendations}
            onOpenVoice={() => setIsVoiceModalOpen(true)}
            onOpenPlan={(plan) => {
              setActivePlan(plan);
              setIsPlanModalOpen(true);
            }}
            onOpenWhy={(rec) => setSelectedWhyRec(rec)}
            onAddToList={(item) => {
              if (activeList) {
                setShoppingLists(prev => prev.map(l => l.id === activeList.id ? {
                  ...l,
                  items: [...l.items, {
                    id: `item-${Date.now()}`,
                    name: item.name || 'New Item',
                    category: item.category || 'Pantry',
                    quantity: item.quantity || 1,
                    unit: item.unit || 'pack',
                    estimatedPrice: item.estimatedPrice || 50,
                    completed: false,
                    source: 'manual'
                  }]
                } : l));
              }
              setActiveTab('lists');
            }}
            onNavigateTab={setActiveTab}
            onOpenReceiptScanner={() => alert('Receipt scanner ready!')}
          />
        )}

        {/* VIEW 2: SHOPPING LISTS */}
        {activeTab === 'lists' && (
          <ListsView
            lists={shoppingLists}
            activeListId={activeListId}
            onSelectList={setActiveListId}
            onCreateList={(title, budget) => {
              const newList: ShoppingList = { id: `list-${Date.now()}`, title, budget, items: [] };
              setShoppingLists(prev => [...prev, newList]);
              setActiveListId(newList.id);
            }}
            onDeleteList={(id) => setShoppingLists(prev => prev.filter(l => l.id !== id))}
            onToggleItem={(listId, itemId) => {
              setShoppingLists(prev => prev.map(l => l.id === listId ? {
                ...l,
                items: l.items.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i)
              } : l));
            }}
            onAddItem={(listId, item) => {
              setShoppingLists(prev => prev.map(l => l.id === listId ? {
                ...l,
                items: [...l.items, { ...item, id: `item-${Date.now()}` }]
              } : l));
            }}
            onDeleteItem={(listId, itemId) => {
              setShoppingLists(prev => prev.map(l => l.id === listId ? {
                ...l,
                items: l.items.filter(i => i.id !== itemId)
              } : l));
            }}
            onOpenVoice={() => setIsVoiceModalOpen(true)}
            onMoveCompletedToPantry={(listId) => {
              const target = shoppingLists.find(l => l.id === listId);
              if (!target) return;
              const completed = target.items.filter(i => i.completed);
              setPantryItems(prev => [
                ...prev,
                ...completed.map(c => ({
                  id: `pantry-${Date.now()}-${c.id}`,
                  name: c.name,
                  category: c.category,
                  quantity: c.quantity,
                  unit: c.unit,
                  estimatedRemaining: 100,
                  status: 'good' as const
                }))
              ]);
              setShoppingLists(prev => prev.map(l => l.id === listId ? {
                ...l,
                items: l.items.filter(i => !i.completed)
              } : l));
            }}
          />
        )}

        {/* VIEW 3: PANTRY TRACKER */}
        {activeTab === 'pantry' && (
          <PantryView
            items={pantryItems}
            onSaveItem={(saved) => {
              setPantryItems(prev => {
                const exists = prev.some(i => i.id === saved.id);
                return exists ? prev.map(i => i.id === saved.id ? saved : i) : [saved, ...prev];
              });
            }}
            onDeleteItem={(id) => setPantryItems(prev => prev.filter(i => i.id !== id))}
            onAutoRestockLow={(low) => {
              if (activeList) {
                setShoppingLists(prev => prev.map(l => l.id === activeList.id ? {
                  ...l,
                  items: [
                    ...l.items,
                    ...low.map(item => ({
                      id: `item-${Date.now()}-${item.id}`,
                      name: item.name,
                      category: item.category,
                      quantity: item.quantity,
                      unit: item.unit,
                      estimatedPrice: 60,
                      completed: false,
                      source: 'recommendation' as const
                    }))
                  ]
                } : l));
                setActiveTab('lists');
              }
            }}
            onOpenVoice={() => setIsVoiceModalOpen(true)}
          />
        )}

        {/* VIEW 4: DISCOVER & RECOMMENDATIONS */}
        {activeTab === 'discover' && (
          <DiscoverView
            recommendations={recommendations}
            onOpenWhy={(rec) => setSelectedWhyRec(rec)}
            onAddToList={(product) => {
              if (activeList) {
                setShoppingLists(prev => prev.map(l => l.id === activeList.id ? {
                  ...l,
                  items: [...l.items, {
                    id: `item-${Date.now()}`,
                    name: product.name,
                    category: product.category,
                    quantity: 1,
                    unit: product.unit || 'pack',
                    estimatedPrice: product.price,
                    completed: false,
                    source: 'recommendation' as const
                  }]
                } : l));
                setActiveTab('lists');
              }
            }}
          />
        )}

        {/* VIEW 5: SMART HUB & LIVE DEALS */}
        {activeTab === 'search' && (
          <SmartHubView
            pantry={pantryItems}
            catalog={activeCatalog as any}
            onAddSuggestionToList={(item) => {
              if (activeList) {
                setShoppingLists(prev => prev.map(l => l.id === activeList.id ? {
                  ...l,
                  items: [...l.items, {
                    id: `item-${Date.now()}`,
                    name: item.name || 'Item',
                    category: item.category || 'Pantry',
                    quantity: item.quantity || 1,
                    unit: item.unit || 'pack',
                    estimatedPrice: item.estimatedPrice || 60,
                    completed: false,
                    source: 'manual' as const
                  }]
                } : l));
                setActiveTab('lists');
              }
            }}
            onOpenVoiceSearch={() => setIsVoiceModalOpen(true)}
          />
        )}

        {/* VIEW 6: AUDIT LOG */}
        {activeTab === 'activity' && (
          <ActivityView activities={activities} />
        )}
      </div>

      {/* Voice Assistant Modal */}
      <VoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        pantry={pantryItems}
        activeList={activeList}
        existingLists={shoppingLists}
        onApplyIntent={(res) => {
          if (res.items && res.items.length > 0) {
            const isPantryIntent = (res as any).action === 'ADD_PANTRY' || res.intent === ('ADD_PANTRY' as any);

            if (isPantryIntent) {
              // Add to Pantry Inventory
              const newPantryEntries: PantryItem[] = res.items.map((item) => ({
                id: `pantry-${Date.now()}-${Math.random()}`,
                name: item.name,
                category: item.category || 'Pantry',
                quantity: item.quantity || 1,
                unit: item.unit || 'pack',
                estimatedRemaining: 100,
                status: 'good',
                lastUpdated: Date.now(),
                averageConsumptionRate: 'Stocked via Voice'
              }));

              setPantryItems((prev) => [...newPantryEntries, ...prev]);
              
              setActivities((prev) => [
                {
                  id: `act-${Date.now()}`,
                  timestamp: Date.now(),
                  type: 'voice',
                  title: 'Stocked Items in Pantry',
                  description: `Voice assistant added ${res.items!.length} item(s) directly to your pantry.`,
                  confidence: res.confidence || 0.95,
                  dataUsed: ['Voice Parser', 'Pantry Inventory']
                },
                ...prev
              ]);

              setActiveTab('pantry');
            } else {
              // Add to Active Shopping List & Store Cart
              if (activeList) {
                setShoppingLists((prev) =>
                  prev.map((l) =>
                    l.id === activeList.id
                      ? {
                          ...l,
                          items: [
                            ...l.items,
                            ...res.items!.map((item) => ({
                              id: `voice-item-${Date.now()}-${Math.random()}`,
                              name: item.name,
                              category: item.category || 'Pantry',
                              quantity: item.quantity || 1,
                              unit: item.unit || 'pack',
                              estimatedPrice: item.maxPrice || 60,
                              brand: item.brand,
                              completed: false,
                              source: 'voice' as const,
                            })),
                          ],
                        }
                      : l
                  )
                );
              }

              res.items.forEach((item) =>
                addItem({
                  name: item.name,
                  quantity: item.quantity || 1,
                  unit: item.unit || 'pack',
                  category: item.category || 'Pantry',
                  price: item.maxPrice || 60,
                  brand: item.brand || undefined,
                })
              );

              setActivities((prev) => [
                {
                  id: `act-${Date.now()}`,
                  timestamp: Date.now(),
                  type: 'voice',
                  title: 'Voice Cart Addition',
                  description: `Added ${res.items!.length} item(s) to ${activeList?.title || 'shopping list'}.`,
                  confidence: res.confidence || 0.95,
                  dataUsed: ['Voice Transcript', 'Grocery Classifier']
                },
                ...prev
              ]);

              setActiveTab('lists');
            }
          }
        }}
      />

      {/* Why Modal */}
      <WhyModal
        recommendation={selectedWhyRec}
        onClose={() => setSelectedWhyRec(null)}
      />

      {/* Plan Modal */}
      <PlanModal
        plan={activePlan}
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        pantry={pantryItems}
        onAddPlanToList={(plan) => {
          if (activeList) {
            setShoppingLists(prev => prev.map(l => l.id === activeList.id ? {
              ...l,
              items: [
                ...l.items,
                ...plan.neededItems.map(item => ({
                  id: `plan-item-${Date.now()}-${Math.random()}`,
                  name: item.name,
                  category: item.category || 'Pantry',
                  quantity: item.quantity,
                  unit: item.unit,
                  estimatedPrice: item.estimatedPrice,
                  completed: false,
                  source: 'plan' as const
                }))
              ]
            } : l));
            setActiveTab('lists');
          }
        }}
      />
    </main>
  );
}