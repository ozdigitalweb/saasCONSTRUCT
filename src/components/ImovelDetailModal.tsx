import React from 'react';
import { X, Home, User, MapPin, ClipboardList, CheckSquare, FileText, Plus, Download } from 'lucide-react';
import { Imovel } from '../types';
import { api } from '../services/api';

interface ImovelDetailModalProps {
  imovel: Imovel | null;
  onClose: () => void;
  onOpenCreatePlan: (imovelId: number) => void;
  onNavigateToChecklist: (checklistId: number) => void;
}

export const ImovelDetailModal: React.FC<ImovelDetailModalProps> = ({
  imovel,
  onClose,
  onOpenCreatePlan,
  onNavigateToChecklist,
}) => {
  if (!imovel) return null;

  const planos = imovel.planos || [];
  const relatorios = imovel.relatorios || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
              #{imovel.id}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {imovel.identificacao}
              </h2>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>{imovel.cidade}/{imovel.estado}</span>
                <span>·</span>
                <span>Cadastrado em {new Date(imovel.criado_em).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="touch-target p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Cliente (Comprador)</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm mt-0.5">
              <User className="w-4 h-4 text-slate-500" />
              <span>{imovel.nome_cliente}</span>
            </div>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Endereço</span>
            <div className="flex items-center gap-1.5 font-medium text-slate-800 text-sm mt-0.5">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span className="truncate">{imovel.endereco}</span>
            </div>
          </div>
        </div>

        {/* Section: Planos de Ação (UC06) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <ClipboardList className="w-4 h-4 text-slate-700" />
              <span>Planos de Ação de Móveis Planejados</span>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenCreatePlan(imovel.id);
              }}
              className="touch-target text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Plano
            </button>
          </div>

          {planos.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
              Nenhum plano de ação cadastrado para este imóvel ainda.
            </div>
          ) : (
            <div className="space-y-2">
              {planos.map((p) => {
                const itensCount = p.itens?.length || 0;
                const hasChecklist = !!p.checklist;
                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">
                        Plano #{p.id} · Montador: {p.nome_montador}
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        WhatsApp: {p.whatsapp_montador} · {itensCount} {itensCount === 1 ? 'móvel' : 'móveis planejados'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasChecklist ? (
                        <button
                          onClick={() => {
                            onClose();
                            onNavigateToChecklist(p.checklist!.id);
                          }}
                          className="touch-target px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-semibold text-xs flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
                        >
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                          Ver Checklist
                        </button>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded-md text-[11px] font-medium">
                          Checklist pendente
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section: Relatórios Gerados (UC13) */}
        {relatorios.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <FileText className="w-4 h-4 text-slate-700" />
              <span>Relatórios em PDF Gerados (UC13)</span>
            </div>

            <div className="space-y-1.5">
              {relatorios.map((rel) => (
                <div
                  key={rel.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800">
                      Relatório #{rel.id} · Emitido em {new Date(rel.gerado_em).toLocaleString('pt-BR')}
                    </span>
                    <p className="text-slate-500 text-[11px]">Checklist #{rel.checklist_id}</p>
                  </div>

                  <a
                    href={api.getRelatorioPdfUrl(rel.id)}
                    download
                    className="touch-target px-3 py-1.5 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar PDF
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="touch-target px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
