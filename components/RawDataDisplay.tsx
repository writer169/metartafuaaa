import React from 'react';

interface RawDataDisplayProps {
  title: string;
  data: string | undefined;
  timestamp: string | undefined;
}

export const RawDataDisplay: React.FC<RawDataDisplayProps> = ({ title, data, timestamp }) => {
  if (!data) return null;

  return (
    <div className="mt-6">
      <div className="flex justify-between items-end mb-2">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{title}</h4>
        <span className="text-xs text-slate-500 font-mono">{timestamp}</span>
      </div>
      <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 font-mono text-sm text-emerald-400 overflow-x-auto whitespace-pre-wrap shadow-inner">
        {data}
      </div>
    </div>
  );
};