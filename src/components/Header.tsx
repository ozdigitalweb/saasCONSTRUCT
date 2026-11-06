import React from 'react';
import { Database, RefreshCw, Server, CheckCircle2, AlertCircle } from 'lucide-react';
import { DbStatus } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dbStatus: DbStatus | null;
  onResetSeed: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  dbStatus,
  onResetSeed,
  isResetting,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            SC
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-slate-900 leading-none">
              saasCONSTRUCT
            </span>
            <span className="text-[11px] text-slate-500 font-medium tracking-wide mt-0.5">
              Adequação de Móveis · MVP 1
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('imoveis')}
            className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'imoveis'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Imóveis ({dbStatus?.totalImoveis ?? 15})
          </button>
          <button
            onClick={() => setActiveTab('planos')}
            className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'planos'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Planos de Ação
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'checklist'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Checklist Resumido
          </button>
          <button
            onClick={() => setActiveTab('relatorios')}
            className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'relatorios'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Relatórios em PDF
          </button>
          <button
            onClick={() => setActiveTab('vps')}
            className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'vps'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            PostgreSQL & VPS
          </button>
        </nav>

        {/* Zone 3: Primary Action & Quick Info */}
        <div className="flex items-center gap-2">
          {/* Engine indicator */}
          <button
            onClick={() => setActiveTab('vps')}
            title={dbStatus?.connected ? 'Conectado ao PostgreSQL 16' : 'Emulador local com dados do Script 03'}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-slate-600" />
            <span className="truncate max-w-[140px]">
              {dbStatus?.connected ? 'PostgreSQL Ativo' : 'Banco Script 03'}
            </span>
            {dbStatus?.connected ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            )}
          </button>

          {/* Quick Reset Test Data for Karol/Santos */}
          <button
            onClick={onResetSeed}
            disabled={isResetting}
            title="Restaurar os 15 imóveis fictícios do Script 03 para testes"
            className="touch-target p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Restaurar dados de teste"
          >
            <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin text-slate-900' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
