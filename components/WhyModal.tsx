import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  EyeOff 
} from 'lucide-react';
import { Recommendation } from '../types';

interface WhyModalProps {
  recommendation: Recommendation | null;
  onClose: () => void;
}

export const WhyModal: React.FC<WhyModalProps> = ({
  recommendation,
  onClose
}) => {
  if (!recommendation) return null;

  const { product, explanation, reason, confidence } = recommendation;
  const dataUsed = explanation?.dataUsed || ['Purchase history', 'Pantry stock level'];
  const dataNotUsed = explanation?.dataNotUsed || ['Third-party ad tracker', 'Paid sponsorships', 'Private audio recordings'];

  return (
    <div 
      id="why-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        id="why-modal-card"
        className="w-full max-w-lg bg-white rounded-3xl border border-black/5 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 bg-[#FAF9F6]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E2E8CE] flex items-center justify-center text-[#708271]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif italic text-[#353535]">AI Decision Transparency</h3>
              <p className="text-[11px] opacity-60 text-[#353535]">Why ShopSense recommended this product</p>
            </div>
          </div>
          <button
            id="why-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-60 text-[#353535] hover:opacity-100 hover:bg-[#E2E8CE]/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <div className="flex items-center space-x-3.5 p-3.5 rounded-2xl bg-[#FAF9F6] border border-black/5">
            <img 
              referrerPolicy="no-referrer"
              src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80'} 
              alt={product.name} 
              className="w-14 h-14 rounded-xl object-cover border border-black/5 shrink-0 bg-white" 
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A373]">
                {recommendation.recommendationType.replace(/_/g, ' ')}
              </span>
              <h4 className="text-sm font-serif italic text-[#353535] truncate">{product.name}</h4>
              <p className="text-xs opacity-60 text-[#353535]">₹{product.price} {product.brand ? `• ${product.brand}` : ''}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E2E8CE] text-[#708271]">
                {Math.round(confidence * 100)}% Confidence
              </span>
            </div>
          </div>

          <div className="p-4 bg-[#E2E8CE]/40 border border-[#708271]/20 rounded-2xl">
            <h5 className="text-xs font-semibold text-[#708271] mb-1 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#708271]" />
              <span>Core Recommendation Signal</span>
            </h5>
            <p className="text-xs text-[#353535] leading-relaxed">
              {reason}
            </p>
          </div>

          {explanation && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-black/5">
                <div className="flex items-center space-x-1.5 text-[11px] font-semibold opacity-60 text-[#353535] mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[#708271]" />
                  <span>Purchase Frequency</span>
                </div>
                <p className="text-base font-serif italic text-[#353535]">Every ~{explanation.usualIntervalDays} days</p>
                <p className="text-[10px] opacity-60 text-[#353535] mt-0.5">Last bought {explanation.daysSinceLastPurchase} days ago</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-black/5">
                <div className="flex items-center space-x-1.5 text-[11px] font-semibold opacity-60 text-[#353535] mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-[#D4A373]" />
                  <span>Price Benchmark</span>
                </div>
                <p className="text-base font-serif italic text-[#353535]">{explanation.typicalPriceRange}</p>
                <p className="text-[10px] opacity-60 text-[#353535] mt-0.5">Verified store average</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h5 className="text-xs font-bold text-[#353535] tracking-wide uppercase">
              Data & Privacy Audit
            </h5>

            <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-black/5 space-y-1.5">
              <p className="text-[11px] font-semibold text-[#708271] flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#708271]" />
                <span>Data points used to generate this pick:</span>
              </p>
              <ul className="space-y-1 pl-5 list-disc text-xs text-[#353535]">
                {dataUsed.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-black/5 space-y-1.5">
              <p className="text-[11px] font-semibold opacity-60 text-[#353535] flex items-center space-x-1.5">
                <EyeOff className="w-3.5 h-3.5 text-[#D4A373]" />
                <span>Data explicitly excluded / never tracked:</span>
              </p>
              <ul className="space-y-1 pl-5 list-disc text-xs opacity-60 text-[#353535]">
                {dataNotUsed.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-black/5 bg-[#FAF9F6] flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs opacity-60 text-[#353535]">
            <ShieldCheck className="w-4 h-4 text-[#708271]" />
            <span>Zero sponsored bias</span>
          </div>
          <button
            id="why-modal-understand-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#353535] text-white text-xs font-medium hover:bg-black transition-colors shadow-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};