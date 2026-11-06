import React from 'react';
import { FileText, Download, CheckCircle2, Clock, User, Home, ArrowRight } from 'lucide-react';
import { Imovel, Relatorio } from '../types';
import { api } from '../services/api';

interface RelatoriosViewProps {
  imoveis: Imovel[];
  onNavigateToChecklist: (checklistId: number) => void;
}

export const RelatoriosView: React.FC<RelatoriosViewProps> = ({
  imoveis,
  onNavigateToChecklist,
}) => {
  // Aggregate all reports across all properties
  const allRelatorios: { rel: Relatorio; imovel: Imovel }[] = [];
  imoveis.forEach((im) => {
    (im.relatorios || []).forEach((r) => {
      allRelatorios.push({ rel: r, imovel: im });
    });
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Relatórios em PDF Gerados (UC13)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Documentos oficiais de adequação e montagem de móveis planejados para entrega ao cliente (validação da Karol).
        </p>
      </div>

      {allRelatorios.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Nenhum relatório emitido ainda</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Para gerar um relatório oficial em PDF, acesse a aba "Checklist" e clique no botão "Gerar Relatório em PDF (UC12)".
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {allRelatorios.map(({ rel, imovel }) => {
            const pdfUrl = api.getRelatorioPdfUrl(rel.id);

            return (
              <div
                key={rel.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                        PDF
                      </div>
                      <div>
                        <span className="text-[11px] font-mono text-slate-400">RELATÓRIO #{rel.id}</span>
                        <h3 className="font-bold text-slate-900 text-sm">
                          {imovel.identificacao}
                        </h3>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(rel.gerado_em).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Cliente: <strong className="text-slate-800">{imovel.nome_cliente}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{imovel.endereco} - {imovel.cidade}/{imovel.estado}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onNavigateToChecklist(rel.checklist_id)}
                    className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
                  >
                    Ver Checklist #{rel.checklist_id} <ArrowRight className="w-3 h-3" />
                  </button>

                  <a
                    href={pdfUrl}
                    download={`relatorio_imovel_${imovel.identificacao.replace(/\s+/g, '_')}.pdf`}
                    className="touch-target px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar PDF (UC13)
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
