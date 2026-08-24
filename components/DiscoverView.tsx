import React, { useState } from 'react';
import { 
  HelpCircle, 
  Plus, 
  Check, 
  Sparkles,
  TrendingDown
} from 'lucide-react';
import { Recommendation, Product } from '../types';

interface DiscoverViewProps {
  recommendations: Recommendation[];
  onOpenWhy: (rec: Recommendation) => void;
  onAddToList: (product: Product, reason?: string) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  recommendations = [],
  onOpenWhy,
  onAddToList
}) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const filterTabs = [
    { id: 'ALL', label: 'All AI Picks' },
    { id: 'RUNNING_LOW', label: 'Replenishment Predictions' },
    { id: 'BETTER_ALTERNATIVE', label: 'Better Alternatives & Swaps' },
    { id: 'SEASONAL', label: 'Seasonal Produce' },
    { id: 'FREQUENTLY_BOUGHT_TOGETHER', label: 'Frequently Paired' }
  ];

  const filteredRecs = recommendations.filter(r => {
    if (selectedType === 'ALL') return true;
    return r.recommendationType === selectedType;
  });

  const handleAddWithFeedback = (recId: string, product: Product, reason?: string) => {
    onAddToList(product, reason);
    setAddedIds(prev => ({ ...prev, [recId]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [recId]: false }));
    }, 1800);
  };

  return (
    <div id="discover-view-container" className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-bold text-[#708271] uppercase tracking-[0.2em] opacity-80">
            Explainable AI Engine
          </span>
          <h1 className="text-3xl font-serif italic text-[#353535]">
            Discover & Smart Recommendations
          </h1>
          <p className="text-xs opacity-60 text-[#353535] mt-0.5">
            Personalized suggestions with complete algorithmic transparency. Every pick explains why.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            id={`discover-tab-${tab.id}`}
            onClick={() => setSelectedType(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
              selectedType === tab.id
                ? 'bg-[#353535] text-white shadow-xs'
                : 'bg-white text-[#353535]/70 border border-black/5 hover:border-[#708271]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredRecs.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-black/5 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] text-[#708271] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-[#353535]">No Recommendations in this Category</h3>
          <p className="text-xs opacity-60 text-[#353535] max-w-sm mx-auto">
            As you shop and update your pantry, smart substitutions and replenishment alerts will calibrate automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filteredRecs.map((rec) => {
            const { product, confidence, reason, originalProduct, savings } = rec;
            const isAdded = addedIds[rec.id];

            return (
              <div
                key={rec.id}
                id={`discover-rec-card-${rec.id}`}
                className="p-5 rounded-3xl bg-white border border-black/5 shadow-xs hover:border-[#708271] transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="relative">
                    <img 
                      referrerPolicy="no-referrer"
                      src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80'} 
                      alt={product.name} 
                      className="w-full h-36 rounded-2xl object-cover border border-black/5 bg-[#FAF9F6]"
                    />
                    <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/95 backdrop-blur-xs text-[#708271] shadow-xs">
                      {Math.round(confidence * 100)}% Confidence
                    </span>
                    {savings && savings > 0 && (
                      <span className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#708271] text-white shadow-xs flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        Save ₹{savings}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A373]">
                      {rec.recommendationType.replace(/_/g, ' ')}
                    </span>
                    <h3 className="text-base font-serif italic text-[#353535] mt-0.5 truncate">{product.name}</h3>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-xs font-bold text-[#708271]">₹{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-[11px] line-through opacity-40 text-[#353535]">₹{product.originalPrice}</span>
                      )}
                      <span className="text-[11px] opacity-60 text-[#353535]">({product.packageSize || product.unit})</span>
                    </div>
                  </div>

                  {originalProduct && (
                    <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/50 text-[11px] text-emerald-900">
                      <span className="font-semibold">Replaces: </span>
                      {originalProduct.name} (₹{originalProduct.price}) → Save ₹{savings}
                    </div>
                  )}

                  <p className="text-xs opacity-60 text-[#353535] line-clamp-3 leading-relaxed">
                    {reason}
                  </p>
                </div>

                <div className="pt-3 border-t border-black/5 flex items-center justify-between">
                  <button
                    id={`discover-why-btn-${rec.id}`}
                    onClick={() => onOpenWhy(rec)}
                    className="flex items-center space-x-1.5 text-xs opacity-70 hover:opacity-100 text-[#353535] font-medium transition-opacity"
                  >
                    <HelpCircle className="w-4 h-4 text-[#D4A373]" />
                    <span>Why?</span>
                  </button>

                  <button
                    id={`discover-add-btn-${rec.id}`}
                    onClick={() => handleAddWithFeedback(rec.id, product, reason)}
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold active:scale-95 transition-all shadow-xs ${
                      isAdded 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-[#708271] text-white hover:bg-[#5e705f]'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added ✓</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to List</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};