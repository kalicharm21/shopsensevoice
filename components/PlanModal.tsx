import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Users, 
  Wallet, 
  Check, 
  CheckCircle2, 
  Share2, 
  ShoppingBag 
} from 'lucide-react';
import { ShoppingPlan, PantryItem } from '../types';

interface PlanModalProps {
  plan: ShoppingPlan | null;
  isOpen: boolean;
  onClose: () => void;
  pantry: PantryItem[];
  onAddPlanToList: (plan: ShoppingPlan, listTitle?: string) => void;
}

export const PlanModal: React.FC<PlanModalProps> = ({
  plan: initialPlan,
  isOpen,
  onClose,
  onAddPlanToList
}) => {
  if (!isOpen || !initialPlan) return null;

  const [currentServings, setCurrentServings] = useState(initialPlan.people || 4);
  const [currentBudget, setCurrentBudget] = useState(initialPlan.budget || 800);
  const [copied, setCopied] = useState(false);

  const scale = useMemo(() => {
    return currentServings / (initialPlan.people || 4);
  }, [currentServings, initialPlan.people]);
  
  const scaledNeededItems = useMemo(() => {
    return (initialPlan.neededItems || []).map(item => ({
      ...item,
      quantity: Math.round(item.quantity * scale * 10) / 10,
      estimatedPrice: Math.round(item.estimatedPrice * scale)
    }));
  }, [initialPlan.neededItems, scale]);

  const totalCost = useMemo(() => {
    return scaledNeededItems.reduce((sum, item) => sum + item.estimatedPrice, 0);
  }, [scaledNeededItems]);

  const isUnderBudget = totalCost <= currentBudget;
  const budgetDelta = Math.abs(currentBudget - totalCost);

  const handleCreateList = () => {
    const updatedPlan: ShoppingPlan = {
      ...initialPlan,
      people: currentServings,
      budget: currentBudget,
      estimatedTotal: totalCost,
      neededItems: scaledNeededItems
    };
    onAddPlanToList(updatedPlan, initialPlan.title);
    onClose();
  };

  const handleCopyPlan = () => {
    const text = `ShopSense Plan: ${initialPlan.title}\nServings: ${currentServings} | Estimated: ₹${totalCost}\n\nNeeded Items:\n` +
      scaledNeededItems.map(i => `- ${i.name} (${i.quantity} ${i.unit}) ~₹${i.estimatedPrice}`).join('\n') +
      `\n\nAlready in Pantry:\n` +
      (initialPlan.alreadyHave || []).map(i => `✓ ${i.name}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      id="plan-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        id="plan-modal-card"
        className="w-full max-w-2xl bg-white rounded-3xl border border-black/5 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 bg-[#FAF9F6]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#708271] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#708271]">
                Intent-Aware Shopping Plan
              </span>
              <h3 className="text-base font-serif italic text-[#353535]">{initialPlan.title}</h3>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              id="plan-modal-share-btn"
              onClick={handleCopyPlan}
              className="p-1.5 rounded-lg opacity-60 text-[#353535] hover:opacity-100 hover:bg-[#E2E8CE]/40 transition-colors"
              title="Copy Plan"
            >
              {copied ? <Check className="w-4 h-4 text-[#708271]" /> : <Share2 className="w-4 h-4 text-[#353535]" />}
            </button>
            <button
              id="plan-modal-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg opacity-60 text-[#353535] hover:opacity-100 hover:bg-[#E2E8CE]/40 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAF9F6] border border-black/5">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#353535] mb-2">
                <span className="flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-[#708271]" />
                  <span>Household Servings:</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-white font-bold border border-black/5 text-[#708271]">
                  {currentServings} People
                </span>
              </div>
              <input
                id="plan-servings-slider"
                type="range"
                min="1"
                max="12"
                value={currentServings}
                onChange={(e) => setCurrentServings(parseInt(e.target.value, 10))}
                className="w-full accent-[#708271] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] opacity-60 text-[#353535] mt-1">
                <span>1 Person</span>
                <span>4 (Standard)</span>
                <span>12 (Party)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#353535] mb-2">
                <span className="flex items-center space-x-1.5">
                  <Wallet className="w-4 h-4 text-[#D4A373]" />
                  <span>Target Budget Cap:</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-white font-bold border border-black/5 text-[#D4A373]">
                  ₹{currentBudget}
                </span>
              </div>
              <input
                id="plan-budget-slider"
                type="range"
                min="300"
                max="3000"
                step="50"
                value={currentBudget}
                onChange={(e) => setCurrentBudget(parseInt(e.target.value, 10))}
                className="w-full accent-[#D4A373] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] opacity-60 text-[#353535] mt-1">
                <span>₹300</span>
                <span>₹1,500</span>
                <span>₹3,000</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-black/5 bg-white space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-60 text-[#353535]">Calculated Basket Cost</p>
                <p className="text-xl font-serif italic text-[#353535]">₹{totalCost}</p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                  isUnderBudget 
                    ? 'bg-[#E2E8CE] text-[#708271]' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isUnderBudget ? `₹${budgetDelta} under budget` : `₹${budgetDelta} over target`}
                </span>
                <p className="text-[10px] opacity-60 text-[#353535] mt-0.5">Budget limit: ₹{currentBudget}</p>
              </div>
            </div>

            <div className="w-full h-2 rounded-full bg-[#FAF9F6] overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  isUnderBudget ? 'bg-[#708271]' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, (totalCost / currentBudget) * 100)}%` }}
              />
            </div>
          </div>

          {initialPlan.smartSubstitutions && initialPlan.smartSubstitutions.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-[#E2E8CE]/40 border border-[#708271]/20 flex items-start space-x-3">
              <Sparkles className="w-4 h-4 text-[#708271] shrink-0 mt-0.5" />
              <div className="text-xs text-[#353535]">
                <p className="font-semibold text-[#708271]">AI Smart Substitution Applied:</p>
                <p className="mt-0.5 opacity-80">
                  {initialPlan.smartSubstitutions[0].reason} (Saving ₹{initialPlan.smartSubstitutions[0].savings}).
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#353535]">
                  1. Needed Items to Buy ({scaledNeededItems.length})
                </h4>
                <span className="text-xs font-semibold text-[#708271]">
                  Subtotal: ₹{totalCost}
                </span>
              </div>

              <div className="space-y-2">
                {scaledNeededItems.map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF9F6] border border-black/5 hover:border-[#708271]/40 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {item.image && (
                        <img 
                          referrerPolicy="no-referrer"
                          src={item.image} 
                          alt={item.name} 
                          className="w-10 h-10 rounded-xl object-cover border border-black/5 shrink-0" 
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-serif italic text-[#353535] truncate">{item.name}</p>
                        <p className="text-[11px] opacity-60 text-[#353535] truncate">{item.quantity} {item.unit} • {item.reason || item.category}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-3">
                      <p className="text-xs font-bold text-[#353535]">₹{item.estimatedPrice}</p>
                      <span className="text-[10px] text-[#708271] bg-[#E2E8CE] px-2 py-0.5 rounded-md">
                        Add to list
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {(initialPlan.alreadyHave && initialPlan.alreadyHave.length > 0) && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider opacity-60 text-[#353535] mb-2 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#708271]" />
                  <span>2. Already in Pantry ({initialPlan.alreadyHave.length} Items Detected)</span>
                </h4>

                <div className="space-y-1.5">
                  {initialPlan.alreadyHave.map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-black/5 opacity-80"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-[#E2E8CE] text-[#708271] flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#353535] line-through truncate">{item.name}</p>
                          <p className="text-[10px] opacity-60 text-[#353535] truncate">{item.reason}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-[#708271] bg-[#E2E8CE] px-2 py-0.5 rounded-md shrink-0">
                        Pantry Stocked ✓
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-black/5 text-xs opacity-80 text-[#353535] space-y-1">
            <p className="font-semibold opacity-100 text-[#353535] flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-[#708271]" />
              <span>AI Plan Logic & Optimization:</span>
            </p>
            <p className="leading-relaxed">
              {initialPlan.aiExplanation}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-black/5 bg-[#FAF9F6] flex items-center justify-between gap-3">
          <button
            id="plan-modal-cancel-btn"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-medium opacity-60 text-[#353535] hover:opacity-100 hover:bg-[#E2E8CE]/40 transition-colors"
          >
            Close
          </button>

          <button
            id="plan-modal-add-list-btn"
            onClick={handleCreateList}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-[#708271] text-white text-xs font-semibold hover:bg-[#5e705f] active:scale-[0.98] shadow-sm transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add {scaledNeededItems.length} Items to Shopping List (₹{totalCost})</span>
          </button>
        </div>
      </div>
    </div>
  );
};