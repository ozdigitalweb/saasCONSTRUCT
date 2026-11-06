import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  FileDown,
  Clock,
  Sparkles,
  Home,
  User,
  Wrench,
  Calendar,
  CheckCheck,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { Checklist, ItemChecklist, Imovel } from '../types';

interface ChecklistViewProps {
  checklists: Checklist[];
  activeChecklistId: number | null;
  onSelectChecklist: (id: number) => void;
  onToggleItem: (itemId: number, newStatus: 'feito' | 'nao_feito') => Promise<void>;
  onGenerateReport: (checklistId: number) => Promise<void>;
  isGeneratingReport: boolean;
  imoveis: Imovel[];
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  checklists,
  activeChecklistId,
  onSelectChecklist,
  onToggleItem,
  onGenerateReport,
  isGeneratingReport,
  imoveis,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If no checklist is selected, pick the first one
  const currentChecklist = checklists.find((c) => c.id === activeChecklistId) || checklists[0];

  if (!currentChecklist || checklists.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <Clock className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Nenhum checklist gerado ainda</h2>
          <p className="text-xs text-slate-500 mt-1">
            O checklist resumido é gerado a partir de um plano de ação (UC09). Acesse a aba "Planos" e clique em "Gerar Checklist".
          </p>
        </div>
      </div>
    );
  }

  const itens = currentChecklist.itens || [];
  const total = itens.length;
  const feitos = itens.filter((i) => i.status === 'feito').length;
  const pendentes = total - feitos;
  const porcentagem = total > 0 ? Math.round((feitos / total) * 100) : 0;

  const filteredItens = itens.filter((it) => {
    if (filter === 'pending') return it.status === 'nao_feito';
    if (filter === 'done') return it.status === 'feito';
    return true;
  });

  const handleToggle = async (it: ItemChecklist) => {
    const nextStatus = it.status === 'feito' ? 'nao_feito' : 'feito';
    setUpdatingItemId(it.id);
    setErrorMessage(null);
    try {
      await onToggleItem(it.id, nextStatus);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao alterar status do item.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleMarkAll = async (status: 'feito' | 'nao_feito') => {
    for (const it of itens) {
      if (it.status !== status) {
        await onToggleItem(it.id, status);
      }
    }
  };

  const planoInfo = currentChecklist.plano;

  return (
    <div className="space-y-4 pb-20">
      {/* Selector of checklists */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Checklist de Montagem (UC10 & UC11)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Marque os itens como feitos ou não feitos conforme o retorno do montador.
          </p>
        </div>

        {checklists.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Imóvel:</span>
            <select
              value={currentChecklist.id}
              onChange={(e) => onSelectChecklist(Number(e.target.value))}
              className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            >
              {checklists.map((c) => (
                <option key={c.id} value={c.id}>
                  Checklist #{c.id} - {c.plano?.imovel_identificacao || `Plano #${c.plano_id}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center justify-between gap-2 border border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-800 text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Progress & Info Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        {/* Info row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500">
                CHECKLIST #{currentChecklist.id} · MODELO RESUMIDO
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {planoInfo?.imovel_identificacao || 'Imóvel'}
            </h2>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
              <span>Cliente: <strong className="text-slate-700">{planoInfo?.imovel_cliente}</strong></span>
              <span>·</span>
              <span>Montador: <strong className="text-slate-700">{planoInfo?.nome_montador}</strong> ({planoInfo?.whatsapp_montador})</span>
            </div>
          </div>

          {/* Quick Mark All Buttons for test speed */}
          <div className="flex items-center gap-1.5 self-start sm:self-center">
            <button
              onClick={() => handleMarkAll('feito')}
              title="Marcar todos como feitos para teste rápido"
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium hover:bg-emerald-100 transition-colors flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar Todos
            </button>
            <button
              onClick={() => handleMarkAll('nao_feito')}
              title="Resetar para não feito"
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Resetar
            </button>
          </div>
        </div>

        {/* Progress bar with stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-600">
              Progresso da Montagem:{' '}
              <strong className="text-slate-900 font-bold tabular-nums">
                {feitos} de {total} itens concluídos
              </strong>
            </span>
            <span className="font-bold text-slate-900 tabular-nums text-sm">
              {porcentagem}%
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-slate-900 rounded-full transition-all duration-300"
              style={{ width: `${porcentagem}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              ✓ {feitos} {feitos === 1 ? 'concluído' : 'concluídos'}
            </span>
            <span className="text-amber-700 font-semibold flex items-center gap-1">
              ○ {pendentes} {pendentes === 1 ? 'pendente' : 'pendentes'}
            </span>
            <span>Gerado em {new Date(currentChecklist.gerado_em).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({total})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === 'pending'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pendentes ({pendentes})
          </button>
          <button
            onClick={() => setFilter('done')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === 'done'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Feitos ({feitos})
          </button>
        </div>

        {/* Generate PDF Trigger */}
        <button
          onClick={() => onGenerateReport(currentChecklist.id)}
          disabled={isGeneratingReport}
          className="touch-target inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition-colors"
        >
          <FileDown className="w-4 h-4 text-white" />
          <span>{isGeneratingReport ? 'Gerando PDF...' : 'Gerar Relatório em PDF (UC12)'}</span>
        </button>
      </div>

      {/* Tap List of Checklist Items (UC11) */}
      <div className="space-y-2">
        {filteredItens.map((it, idx) => {
          const isDone = it.status === 'feito';
          const isUpdating = updatingItemId === it.id;

          return (
            <div
              key={it.id}
              onClick={() => handleToggle(it)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  handleToggle(it);
                }
              }}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                isDone
                  ? 'bg-white border-emerald-200 hover:border-emerald-300'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              } ${isUpdating ? 'opacity-60' : ''}`}
            >
              {/* Left Slot: Large 44px touch toggle icon */}
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(it);
                  }}
                  className={`touch-target rounded-full p-1 transition-transform active:scale-90 ${
                    isDone ? 'text-emerald-600' : 'text-slate-300 hover:text-slate-400'
                  }`}
                  aria-label={isDone ? 'Marcar como não feito' : 'Marcar como feito'}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-7 h-7 fill-emerald-50" />
                  ) : (
                    <Circle className="w-7 h-7" />
                  )}
                </button>

                {/* Middle Slot: Furniture description & context */}
                <div className="min-w-0">
                  <h4
                    className={`text-sm font-semibold leading-snug truncate ${
                      isDone ? 'text-slate-800 line-through decoration-slate-300' : 'text-slate-900'
                    }`}
                  >
                    {it.descricao}
                  </h4>
                  <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-medium text-slate-700">{it.ambiente}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Wrench className="w-3 h-3 text-slate-400" />
                      {it.ferramentas_necessarias}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {it.data_prevista ? it.data_prevista.split('T')[0] : 'Data n/d'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Slot: Status Badge & Timestamp */}
              <div className="text-right shrink-0">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-md inline-block ${
                    isDone
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isDone ? 'FEITO' : 'NÃO FEITO'}
                </span>
                {isDone && it.marcado_em && (
                  <span className="block text-[10px] text-slate-400 mt-1 font-mono">
                    {new Date(it.marcado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredItens.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          Nenhum item com este filtro.
        </div>
      )}

      {/* Sticky Bottom Bar for Mobile Ergonomics (UC12 Trigger) */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-900 tabular-nums">{porcentagem}%</span>
          <span className="text-slate-500">concluído</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-700 font-medium">{pendentes} pendentes</span>
        </div>

        <button
          onClick={() => onGenerateReport(currentChecklist.id)}
          disabled={isGeneratingReport}
          className="touch-target px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-2 shadow-sm transition-transform active:scale-95"
        >
          <FileDown className="w-4 h-4" />
          <span>{isGeneratingReport ? 'Gerando Relatório...' : 'Gerar Relatório em PDF (UC12)'}</span>
        </button>
      </div>
    </div>
  );
};
