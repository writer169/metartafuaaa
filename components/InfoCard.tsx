import React from 'react';

interface InfoCardProps {
  label: string;
  value: string | number | undefined;
  unit?: string;
  icon: React.ReactNode;
  subValue?: string;
  colorClass?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({ label, value, unit, icon, subValue, colorClass = "text-sky-400" }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 flex items-center space-x-4 hover:bg-slate-800/70 transition-colors">
      <div className={`p-3 rounded-lg bg-slate-700/50 ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{label}</p>
        <div className="flex items-baseline space-x-1">
          <h3 className="text-2xl font-bold text-white">
            {value !== undefined ? value : '--'}
          </h3>
          {unit && <span className="text-sm text-slate-400 font-medium">{unit}</span>}
        </div>
        {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
      </div>
    </div>
  );
};