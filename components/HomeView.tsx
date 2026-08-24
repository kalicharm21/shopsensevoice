import React, { useMemo } from 'react';
import { 
  Mic, 
  AlertTriangle, 
  Clock, 
  ScanLine, 
  Sliders, 
  Package 
} from 'lucide-react';
import { 
  ShoppingList, 
  PantryItem, 
  Recommendation, 
  ShoppingPlan, 
  UserProfile 
} from '../types';

interface HomeViewProps {
  user: UserProfile | null;
  activePlan: ShoppingPlan | null;
  shoppingLists: ShoppingList[];
  pantryItems: PantryItem[];
  recommendations: Recommendation[];
  onOpenVoice: () => void;
  onOpenPlan: (plan: ShoppingPlan) => void;
  onOpenWhy: (rec: Recommendation) => void;
  onAddToList: (item: Partial<ShoppingList['items'][number]>) => void;
  onNavigateTab: (tab: string) => void;
  onOpenReceiptScanner: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  activePlan,
  shoppingLists,
  pantryItems,
  recommendations,
  onOpenVoice,
  onOpenPlan,
  onOpenWhy,
  onAddToList,
  onNavigateTab,
  onOpenReceiptScanner
}) => {
  const expiringSoon = useMemo(
    () => pantryItems.filter(i => i.status === 'expiring_soon'),
    [pantryItems]
  );
  
  const runningLow = useMemo(
    () => pantryItems.filter(i => i.status === 'running_low' || i.status === 'critically_low'),
    [pantryItems]
  );

  const primaryList = shoppingLists[0] || null;
  const currentListItems = primaryList?.items || [];
  const currentListTotal = useMemo(
    () => currentListItems.reduce((s, i) => s + (i.estimatedPrice || 0), 0),
    [currentListItems]
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const promptSuggestions = [
    '"Pasta dinner for 4"',
    '"Plan budget under ₹800"',
    '"Camping this weekend"',
    '"Healthy breakfast for the week"'
  ];

  return (
    <div id="home-view-container" className="space-y-10 max-w-6xl mx-auto pb-16">
      <div className="flex items-center justify-between pt-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-40 text-[#353535]">
          Intent-Driven Shopping Companion
        </span>
        <div className="flex items-center gap-2">
          <button
            id="home-scan-receipt-btn"
            onClick={onOpenReceiptScanner}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-black/5 text-xs font-semibold text-[#353535] hover:bg-[#FAF9F6] shadow-xs transition-colors"
          >
            <ScanLine className="w-3.5 h-3.5 text-[#708271]" />
            <span>Scan Receipt</span>
          </button>
          <button
            id="home-budget-opt-btn"
            onClick={() => onNavigateTab('discover')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E2E8CE] text-[#708271] text-xs font-bold hover:bg-[#d6ddbd] transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>AI Optimizer</span>
          </button>
        </div>
      </div>

      <section className="flex flex-col items-center justify-center text-center py-4 sm:py-6">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif italic mb-2 text-[#353535] tracking-tight">
          {greeting}, {user?.displayName?.split(' ')[0] || 'there'}
        </h2>
        <p className="text-base sm:text-lg opacity-60 mb-8 text-[#353535] font-sans">
          What are we shopping for tonight?
        </p>
        
        <div className="relative group cursor-pointer" onClick={onOpenVoice}>
          <div className="absolute -inset-4 bg-[#708271]/5 rounded-full blur-xl group-hover:bg-[#708271]/15 transition-all duration-300" />
          <button 
            id="hero-voice-button"
            className="relative w-24 h-24 bg-[#708271] hover:bg-[#5e705f] active:scale-95 transition-all rounded-full flex items-center justify-center shadow-xl shadow-[#708271]/25 border-4 border-[#FAF9F6]"
            aria-label="Activate Voice Companion"
          >
            <Mic className="w-9 h-9 text-white" />
          </button>
          <p className="mt-5 text-xs font-bold opacity-40 uppercase tracking-widest text-[#353535]">
            Tap to speak
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mt-8 max-w-2xl">
          {promptSuggestions.map((prompt, idx) => (
            <span
              key={idx}
              onClick={onOpenVoice}
              className="px-4 py-2 bg-white hover:bg-[#E2E8CE]/60 hover:text-[#708271] rounded-full border border-black/5 text-xs font-medium cursor-pointer text-[#353535] shadow-xs transition-all select-none active:scale-95"
            >
              {prompt}
            </span>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-black/5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-5">
              <h3 className="text-xs uppercase tracking-widest font-bold opacity-40 text-[#353535]">Tonight's Plan</h3>
              {activePlan && (
                <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-md">
                  ACTIVE
                </span>
              )}
            </div>

            {activePlan ? (
              <>
                <p className="text-2xl font-serif text-[#353535] mb-1 leading-snug">
                  {activePlan.title}
                </p>
                <p className="text-xs opacity-60 text-[#353535] mb-5">
                  Using {activePlan.alreadyHave?.length || 0} existing pantry items • {activePlan.people} servings
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-medium text-[#353535]/80">Estimated Budget</span>
                    <span className="text-lg font-bold text-[#353535]">
                      ₹{activePlan.estimatedTotal} <span className="text-xs font-normal opacity-50">/ ₹{activePlan.budget}</span>
                    </span>
                  </div>

                  <div className="w-full h-2 bg-[#FAF9F6] border border-black/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#708271] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (activePlan.estimatedTotal / (activePlan.budget || 1)) * 100)}%` }}
                    />
                  </div>

                  {activePlan.alreadyHave && activePlan.alreadyHave.length > 0 && (
                    <div className="p-3 bg-[#FAF9F6] rounded-2xl border border-black/5 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-800">
                        <span>✓ In Pantry ({activePlan.alreadyHave.length})</span>
                        <span className="text-neutral-500 font-normal">Ready to use</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {activePlan.alreadyHave.slice(0, 3).map((item, i) => (
                          <span key={i} className="px-2 py-0.5 bg-white rounded-md text-[11px] border border-black/5 text-[#353535]">
                            {item.name}
                          </span>
                        ))}
                        {activePlan.alreadyHave.length > 3 && (
                          <span className="text-[10px] opacity-60 self-center">+{activePlan.alreadyHave.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-xs opacity-60">
                No active cooking plan set. Tap above to plan tonight's dinner.
              </div>
            )}
          </div>

          {activePlan && (
            <button 
              id="home-view-plan-details-btn"
              onClick={() => onOpenPlan(activePlan)}
              className="w-full py-3 bg-[#E2E8CE] text-[#708271] rounded-xl text-sm font-bold mt-6 hover:bg-[#d6ddbd] transition-colors"
            >
              View Plan Details
            </button>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-black/5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs uppercase tracking-widest font-bold opacity-40 text-[#353535]">You might need</h3>
            <button 
              onClick={() => onNavigateTab('discover')}
              className="text-xs font-semibold text-[#708271] hover:underline"
            >
              Discover
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {recommendations.slice(0, 3).map((rec) => (
              <div 
                key={rec.id}
                id={`home-rec-card-${rec.id}`}
                className="p-3.5 bg-[#FAF9F6] rounded-2xl flex items-center gap-3.5 border border-black/5 hover:border-[#708271]/30 transition-all"
              >
                <div className="w-11 h-11 bg-[#708271]/10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                  {rec.product.image ? (
                    <img 
                      referrerPolicy="no-referrer" 
                      src={rec.product.image} 
                      alt={rec.product.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">🌿</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-[#353535] truncate">{rec.product.name}</p>
                    <span className="text-xs font-semibold text-[#708271] ml-1">₹{rec.product.price}</span>
                  </div>
                  <p className="text-[10px] text-[#353535] opacity-60 truncate">
                    {rec.reason || 'Usually replenished every 5 days'}
                  </p>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <button 
                    id={`home-add-rec-${rec.id}`}
                    onClick={() => onAddToList({
                      name: rec.product.name,
                      category: rec.product.category,
                      quantity: 1,
                      unit: rec.product.unit,
                      estimatedPrice: rec.product.price,
                      brand: rec.product.brand,
                      image: rec.product.image
                    })}
                    className="px-3 py-1.5 bg-[#708271] hover:bg-[#5e705f] text-white text-xs rounded-lg font-bold transition-colors shadow-xs active:scale-95"
                  >
                    + Add
                  </button>
                  <button
                    onClick={() => onOpenWhy(rec)}
                    className="text-[9px] text-[#353535] opacity-50 hover:opacity-100 text-center"
                  >
                    Why?
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-black/5 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs uppercase tracking-widest font-bold opacity-40 text-[#353535]">Current List</h3>
              <span className="text-xs font-medium text-[#708271]">
                {primaryList?.title || 'Groceries'}
              </span>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {currentListItems.length === 0 ? (
                <p className="text-xs opacity-50 py-8 text-center">Your shopping list is currently empty.</p>
              ) : (
                currentListItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-1.5 border-b border-black/5 text-sm">
                    <span className="text-[#353535] truncate max-w-[180px]">
                      <span className="opacity-40 mr-1.5 font-mono text-xs">{item.quantity}x</span>
                      {item.name}
                    </span>
                    <span className="text-sm font-semibold text-[#353535] shrink-0">₹{item.estimatedPrice}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-5 mt-4 border-t border-black/5">
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-xs font-bold opacity-60 uppercase tracking-wider">{currentListItems.length} Items</span>
              <span className="text-base font-bold text-[#353535]">Total ₹{currentListTotal}</span>
            </div>
            <button 
              id="home-go-shopping-btn"
              onClick={() => onNavigateTab('lists')}
              className="w-full py-3.5 bg-[#353535] hover:bg-black text-white rounded-xl text-sm font-bold transition-colors shadow-xs active:scale-95"
            >
              Go Shopping
            </button>
          </div>
        </div>
      </div>

      {(expiringSoon.length > 0 || runningLow.length > 0) && (
        <section id="home-pantry-alerts" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#708271]" />
              <h3 className="text-xs uppercase tracking-widest font-bold opacity-60 text-[#353535]">
                Pantry Freshness & Runout Watch
              </h3>
            </div>
            <button 
              onClick={() => onNavigateTab('pantry')}
              className="text-xs font-semibold text-[#708271] hover:underline"
            >
              Open Pantry ({pantryItems.length})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expiringSoon.map((item) => (
              <div 
                key={item.id}
                className="p-4 bg-white rounded-2xl border border-black/5 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#D4A373]/15 text-[#D4A373] flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-[#353535] truncate">{item.name}</p>
                      <span className="text-[9px] font-bold text-[#D4A373] bg-[#D4A373]/10 px-1.5 py-0.5 rounded">
                        Expiring {item.predictedRunoutDate || 'Soon'}
                      </span>
                    </div>
                    <p className="text-[10px] opacity-60 text-[#353535] truncate">{item.averageConsumptionRate}</p>
                  </div>
                </div>
                <button
                  onClick={onOpenVoice}
                  className="px-2.5 py-1.5 bg-[#FAF9F6] border border-black/10 text-xs font-semibold rounded-lg hover:bg-[#E2E8CE] text-[#708271] transition-colors shrink-0"
                >
                  Recipe Idea
                </button>
              </div>
            ))}

            {runningLow.slice(0, 2).map((item) => (
              <div 
                key={item.id}
                className="p-4 bg-white rounded-2xl border border-black/5 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-red-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#353535] truncate">{item.name}</p>
                    <p className="text-[10px] opacity-60 text-[#353535] truncate">
                      {item.estimatedRemaining}% left • {item.averageConsumptionRate}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onAddToList({
                    name: item.name,
                    category: item.category,
                    quantity: 1,
                    unit: item.unit
                  })}
                  className="px-3 py-1.5 bg-[#708271] hover:bg-[#5e705f] text-white rounded-lg text-xs font-bold shrink-0 shadow-xs transition-colors"
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};