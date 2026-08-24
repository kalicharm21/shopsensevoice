import React from 'react';
import { 
  Sparkles, 
  Clock, 
  Layers, 
  TrendingDown, 
  RefreshCw, 
  Mic, 
  FileText 
} from 'lucide-react';
import { AIActivity } from '../types';

interface ActivityViewProps {
  activities: AIActivity[];
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  activities = []
}) => {
  const getPipelineBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'plan':
        return { bg: 'bg-[#E2E8CE]', text: 'text-[#708271]', icon: Layers };
      case 'substitute':
        return { bg: 'bg-emerald-50', text: 'text-emerald-800', icon: TrendingDown };
      case 'replenish':
        return { bg: 'bg-amber-50', text: 'text-[#D4A373]', icon: RefreshCw };
      case 'voice':
        return { bg: 'bg-sky-50', text: 'text-sky-800', icon: Mic };
      default:
        return { bg: 'bg-[#FAF9F6]', text: 'text-[#708271]', icon: Sparkles };
    }
  };

  return (
    <div id="activity-view-container" className="max-w-5xl mx-auto space-y-6 pb-12">
      <div>
        <span className="text-[11px] font-bold text-[#708271] uppercase tracking-[0.2em] opacity-80">
          Algorithmic Transparency
        </span>
        <h1 className="text-3xl font-serif italic text-[#353535]">
          AI Decision History & Audit Log
        </h1>
        <p className="text-xs opacity-60 text-[#353535] mt-0.5">
          Real-time record of all automated decisions, reasoning pipelines, and data sources accessed.
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-black/5 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] text-[#708271] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-[#353535]">No Activity Logged Yet</h3>
          <p className="text-xs opacity-60 text-[#353535] max-w-sm mx-auto">
            Automated recommendations, voice actions, and meal plan calculations will appear here with complete algorithmic auditing.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((act) => {
            const dateStr = new Date(act.timestamp).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            const badge = getPipelineBadge(act.type);
            const IconComponent = badge.icon;

            return (
              <div
                key={act.id}
                id={`activity-card-${act.id}`}
                className="p-5 rounded-3xl bg-white border border-black/5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-9 h-9 rounded-2xl ${badge.bg} flex items-center justify-center ${badge.text}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-serif italic text-[#353535]">{act.title}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${badge.text}`}>
                        Pipeline: {act.type.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs opacity-60 text-[#353535]">
                    {typeof act.confidence === 'number' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E2E8CE] text-[#708271] text-[10px] font-bold">
                        {Math.round(act.confidence * 100)}% Confidence
                      </span>
                    )}
                    <span className="text-[11px] flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-[#708271]" />
                      <span>{dateStr}</span>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#353535] leading-relaxed">
                  {act.description}
                </p>

                {(act.dataUsed && act.dataUsed.length > 0) && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold opacity-60 text-[#353535] mr-1">Data Used:</span>
                    {act.dataUsed.map((dataPoint, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2.5 py-0.5 bg-[#FAF9F6] border border-black/5 rounded-lg text-[#353535]"
                      >
                        ✓ {dataPoint}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};