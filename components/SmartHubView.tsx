import React from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  Leaf, 
  ArrowLeftRight, 
  Plus, 
  Search,
  ShoppingCart
} from 'lucide-react';
import { PantryItem, Product, ShoppingItem } from '../types';

interface SmartHubViewProps {
  pantry: PantryItem[];
  catalog: Product[];
  onAddSuggestionToList: (item: Partial<ShoppingItem>) => void;
  onOpenVoiceSearch: (query: string) => void;
}

export const SmartHubView: React.FC<SmartHubViewProps> = ({
  pantry,
  catalog,
  onAddSuggestionToList,
  onOpenVoiceSearch
}) => {
  const lowStockPantry = pantry.filter(p => (p.estimatedRemaining ?? 100) <= 30);
  const seasonalDeals = catalog.filter(c => c.category === 'Produce' || c.price < 150).slice(0, 4);

  const substitutes = [
    { original: 'Whole Dairy Milk', replacement: 'Almond Milk (Unsweetened)', reason: 'Lactose-free & lower calories', price: 180 },
    { original: 'Refined Sugar', replacement: 'Organic Jaggery Powder', reason: 'Healthier glycemic index', price: 95 },
    { original: 'Refined Sunflower Oil', replacement: 'Cold Pressed Mustard Oil', reason: 'Better fatty acid profile', price: 210 }
  ];

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-[#708271]/20 to-[#E2E8CE]/40 p-6 rounded-3xl border border-[#708271]/20 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#708271] font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>AI Predictive Assistant</span>
          </div>
          <h2 className="text-xl font-serif italic text-[#353535] mt-1">Smart Recommendations & Insights</h2>
          <p className="text-xs text-[#353535]/70 mt-0.5">Automated suggestions based on pantry depletion, seasonality, and health alternatives.</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-bold text-[#353535]">Running Low in Pantry</h3>
        </div>

        {lowStockPantry.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lowStockPantry.map(item => (
              <div key={item.id} className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-amber-950">{item.name}</h4>
                  <p className="text-[11px] text-amber-800">Only ~{item.estimatedRemaining}% left in pantry</p>
                </div>
                <button
                  onClick={() => onAddSuggestionToList({ name: item.name, quantity: 1, unit: item.unit || 'pack', category: item.category as any })}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-black/5 text-xs text-[#353535]/70">
            All pantry inventory is currently well-stocked.
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-[#708271]" />
          <h3 className="text-sm font-bold text-[#353535]">Seasonal & Best Value Picks</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {seasonalDeals.map(prod => (
            <div key={prod.id} className="p-3.5 bg-white border border-black/10 rounded-2xl flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#708271]">{prod.category}</span>
                <h4 className="font-bold text-xs text-[#353535] mt-0.5">{prod.name}</h4>
                <p className="text-xs font-semibold text-[#708271] mt-1">₹{prod.price}</p>
              </div>
              <button
                onClick={() => onAddSuggestionToList({ name: prod.name, quantity: 1, unit: 'pack', estimatedPrice: prod.price, category: prod.category as any })}
                className="w-full py-1.5 bg-[#FAF9F6] hover:bg-[#E2E8CE] text-[#353535] border border-black/5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Add to List
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-[#353535]">Smart Dietary & Cost Substitutes</h3>
        </div>

        <div className="space-y-2">
          {substitutes.map((sub, idx) => (
            <div key={idx} className="p-4 bg-white border border-black/10 rounded-2xl flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="line-through text-neutral-400">{sub.original}</span>
                  <span className="text-neutral-400">→</span>
                  <span className="font-bold text-[#353535] text-blue-900">{sub.replacement}</span>
                  <span className="font-semibold text-xs text-[#708271]">₹{sub.price}</span>
                </div>
                <p className="text-[11px] text-neutral-500">{sub.reason}</p>
              </div>
              <button
                onClick={() => onAddSuggestionToList({ name: sub.replacement, quantity: 1, unit: 'pack', estimatedPrice: sub.price, category: 'Dairy' })}
                className="px-3 py-1.5 bg-[#708271] text-white rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Swap & Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};