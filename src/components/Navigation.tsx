import React from 'react';
import { Plus, Database, FileSpreadsheet, Scale, Calculator } from 'lucide-react';

interface NavigationProps {
  currentTab: 'wizard' | 'database' | 'parameters' | 'mora' | 'receipt';
  onSelectTab: (tab: 'wizard' | 'database' | 'parameters' | 'mora' | 'receipt') => void;
  onNewSettlement: () => void;
  expedientesCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  onNewSettlement,
  expedientesCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs print-hide">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('wizard')}
              className="flex items-center gap-2.5 text-left focus:outline-hidden group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-700 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-800 transition-colors">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap block">
                  PetroFiniquito
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: 4-5 single-line clean text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => onSelectTab('wizard')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                currentTab === 'wizard'
                  ? 'border-blue-700 text-blue-700 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Asistente Liquidación</span>
            </button>

            <button
              onClick={() => onSelectTab('database')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                currentTab === 'database'
                  ? 'border-blue-700 text-blue-700 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Expedientes ({expedientesCount})</span>
            </button>

            <button
              onClick={() => onSelectTab('parameters')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                currentTab === 'parameters'
                  ? 'border-blue-700 text-blue-700 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Parámetros & BCV</span>
            </button>

            <button
              onClick={() => onSelectTab('mora')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                currentTab === 'mora'
                  ? 'border-blue-700 text-blue-700 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Auditoría de Mora</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onNewSettlement}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 transition-colors whitespace-nowrap shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Liquidación</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
