import React, { useState } from 'react';
import { Plus, ClipboardList, User, Phone, Trash2, CheckSquare, Sparkles, AlertCircle, Calendar, Wrench, Edit2 } from 'lucide-react';
import { Imovel, PlanoAcao } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface PlanosViewProps {
  imoveis: Imovel[];
  onGenerateChecklist: (planoId: number) => Promise<void>;
  onCreatePlano: (dados: {
    imovel_id: number;
    nome_montador: string;
    whatsapp_montador: string;
    itens: {
      descricao: string;
      ambiente: string;
      ferramentas_necessarias: string;
      data_prevista: string;
    }[];
  }) => Promise<void>;
  onDeletePlano: (id: number) => Promise<void>;
  onSelectPlanoChecklist: (checklistId: number) => void;
  preselectedImovelId?: number | null;
}

const TEMPLATES = [
  {
    name: 'Kit Cozinha Planejada (3 itens)',
    itens: [
      { descricao: 'Armários aéreos com portas basculantes', ambiente: 'Cozinha', ferramentas_necessarias: 'Parafusadeira, Broca 8mm, Nível laser', data_prevista: '2026-11-05' },
      { descricao: 'Bancada e balcão inferior para pia', ambiente: 'Cozinha', ferramentas_necessarias: 'Chave Philips, Silicone PU, Trena', data_prevista: '2026-11-05' },
      { descricao: 'Torre quente para forno e micro-ondas', ambiente: 'Cozinha', ferramentas_necessarias: 'Parafusadeira, Chave Allen, Nível', data_prevista: '2026-11-06' },
    ],
  },
  {
    name: 'Kit Quarto Casal (2 itens)',
    itens: [
      { descricao: 'Guarda-roupa planejado 3 portas de correr', ambiente: 'Quarto Casal', ferramentas_necessarias: 'Parafusadeira, Nível laser, Martelo borracha', data_prevista: '2026-11-07' },
      { descricao: 'Cabeceira ripada estofada com mesinhas', ambiente: 'Quarto Casal', ferramentas_necessarias: 'Furadeira, Bucha 8mm, Chave de fenda', data_prevista: '2026-11-07' },
    ],
  },
  {
    name: 'Kit Sala & Home Office (2 itens)',
    itens: [
      { descricao: 'Painel ripado de TV com nicho suspenso', ambiente: 'Sala de Estar', ferramentas_necessarias: 'Broca vídea 10mm, Nível laser', data_prevista: '2026-11-08' },
      { descricao: 'Bancada de estudos e prateleiras', ambiente: 'Home Office', ferramentas_necessarias: 'Parafusadeira, Serra copo, Nível', data_prevista: '2026-11-08' },
    ],
  },
];

export const PlanosView: React.FC<PlanosViewProps> = ({
  imoveis,
  onGenerateChecklist,
  onCreatePlano,
  onDeletePlano,
  onSelectPlanoChecklist,
  preselectedImovelId,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(!!preselectedImovelId);
  const [imovelId, setImovelId] = useState<number>(preselectedImovelId || (imoveis[0]?.id ?? 1));
  const [nomeMontador, setNomeMontador] = useState('Carlos Eduardo Montador');
  const [whatsappMontador, setWhatsappMontador] = useState('(11) 98765-4321');
  const [itens, setItens] = useState([
    {
      descricao: 'Armários planejados superiores da cozinha',
      ambiente: 'Cozinha',
      ferramentas_necessarias: 'Parafusadeira, Nível laser, Broca 8mm',
      data_prevista: new Date().toISOString().split('T')[0],
    },
    {
      descricao: 'Balcão inferior para cuba e cooktop',
      ambiente: 'Cozinha',
      ferramentas_necessarias: 'Chave philips, Silicone, Trena',
      data_prevista: new Date().toISOString().split('T')[0],
    },
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatingPlanoId, setGeneratingPlanoId] = useState<number | null>(null);

  // Collect all plans from imoveis
  const allPlanos: { plano: PlanoAcao; imovel: Imovel }[] = [];
  imoveis.forEach((im) => {
    (im.planos || []).forEach((p) => {
      allPlanos.push({ plano: p, imovel: im });
    });
  });

  const handleAddItem = () => {
    setItens([
      ...itens,
      {
        descricao: '',
        ambiente: 'Cozinha',
        ferramentas_necessarias: 'Parafusadeira, Nível',
        data_prevista: new Date().toISOString().split('T')[0],
      },
    ]);
  };

  const [confirmDeletePlanoId, setConfirmDeletePlanoId] = useState<number | null>(null);

  const handleRemoveItem = (index: number) => {
    if (itens.length <= 1) {
      setErrorMessage('O plano de ação deve ter pelo menos um item.');
      return;
    }
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleApplyTemplate = (templateItens: typeof itens) => {
    setItens([...templateItens]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!nomeMontador.trim()) {
      setErrorMessage('Nome do montador é obrigatório.');
      return;
    }
    if (!/^[0-9+() -]{8,20}$/.test(whatsappMontador.trim())) {
      setErrorMessage('WhatsApp inválido (deve conter de 8 a 20 caracteres).');
      return;
    }
    for (let i = 0; i < itens.length; i++) {
      if (!itens[i].descricao.trim()) {
        setErrorMessage(`Preencha a descrição do item #${i + 1}.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onCreatePlano({
        imovel_id: imovelId,
        nome_montador: nomeMontador,
        whatsapp_montador: whatsappMontador,
        itens,
      });
      setIsCreateOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao cadastrar plano.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerate = async (planoId: number) => {
    setGeneratingPlanoId(planoId);
    try {
      await onGenerateChecklist(planoId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao gerar checklist.');
    } finally {
      setGeneratingPlanoId(null);
    }
  };

  const handleRequestDelete = (planoId: number) => {
    setConfirmDeletePlanoId(planoId);
  };

  const handleExecuteDeletePlano = async () => {
    if (!confirmDeletePlanoId) return;
    const id = confirmDeletePlanoId;
    setConfirmDeletePlanoId(null);
    try {
      await onDeletePlano(id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao excluir plano.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Planos de Ação (Móveis Planejados)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cadastre os móveis planejados, ferramentas necessárias e gere o checklist de montagem (UC05 a UC09).
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMessage(null);
            setIsCreateOpen(true);
          }}
          className="touch-target inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Plano de Ação (UC05)
        </button>
      </div>

      {/* Plan list */}
      {allPlanos.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Nenhum plano cadastrado ainda</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Selecione um dos 15 imóveis fictícios e cadastre a lista de móveis planejados com as ferramentas necessárias.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="touch-target px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-medium inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Criar Primeiro Plano
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {allPlanos.map(({ plano, imovel }) => {
            const hasChecklist = !!plano.checklist;
            const itensCount = plano.itens?.length || 0;

            return (
              <div
                key={plano.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">PLANO #{plano.id}</span>
                      <span className="text-slate-300">·</span>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {imovel.identificacao}
                      </h3>
                      <span className="text-xs text-slate-500">({imovel.cidade}/{imovel.estado})</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Montador: <strong className="text-slate-800">{plano.nome_montador}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {plano.whatsapp_montador}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {hasChecklist ? (
                      <button
                        onClick={() => onSelectPlanoChecklist(plano.checklist!.id)}
                        className="touch-target px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-medium text-xs flex items-center gap-1.5 hover:bg-slate-800 transition-colors shadow-xs"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        Acessar Checklist
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGenerate(plano.id)}
                        disabled={generatingPlanoId === plano.id}
                        className="touch-target px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        {generatingPlanoId === plano.id ? 'Gerando...' : 'Gerar Checklist (UC09)'}
                      </button>
                    )}

                    <button
                      onClick={() => handleRequestDelete(plano.id)}
                      title="Excluir Plano (UC08)"
                      className="touch-target p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      aria-label="Excluir Plano"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Items preview table */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Móveis Planejados ({itensCount} itens):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(plano.itens || []).map((it, idx) => (
                      <div
                        key={it.id || idx}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex flex-col justify-between"
                      >
                        <div className="font-medium text-slate-800 leading-snug">
                          {it.descricao}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2">
                          <span className="font-medium text-slate-700">{it.ambiente}</span>
                          <span>·</span>
                          <span className="truncate max-w-[150px]">{it.ferramentas_necessarias}</span>
                          <span>·</span>
                          <span>Prev: {it.data_prevista}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Cadastrar Plano de Ação (UC05) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto">
            <h2 className="text-lg font-bold text-slate-900">Cadastrar Plano de Ação (UC05)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Defina o imóvel, os dados do montador e a relação de móveis planejados.
            </p>

            {errorMessage && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Select Imóvel */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Selecione o Imóvel *
                </label>
                <select
                  value={imovelId}
                  onChange={(e) => setImovelId(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium"
                >
                  {imoveis.map((im) => (
                    <option key={im.id} value={im.id}>
                      #{im.id} - {im.identificacao} · {im.nome_cliente} ({im.cidade}/{im.estado})
                    </option>
                  ))}
                </select>
              </div>

              {/* Montador Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nome do Montador *
                  </label>
                  <input
                    type="text"
                    required
                    value={nomeMontador}
                    onChange={(e) => setNomeMontador(e.target.value)}
                    placeholder="Ex: Carlos Eduardo Silva"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    WhatsApp do Montador *
                  </label>
                  <input
                    type="text"
                    required
                    value={whatsappMontador}
                    onChange={(e) => setWhatsappMontador(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Template Presets Bar */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Kits Rápidos de Teste (Poupar Digitação)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl.itens)}
                      className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
                    >
                      + {tpl.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Itens do Plano ({itens.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="touch-target text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Móvel
                  </button>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {itens.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">Móvel #{idx + 1}</span>
                        {itens.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded"
                            title="Remover item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            required
                            placeholder="Descrição (ex: Armários aéreos da cozinha)"
                            value={item.descricao}
                            onChange={(e) => {
                              const newItens = [...itens];
                              newItens[idx].descricao = e.target.value;
                              setItens(newItens);
                            }}
                            className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            required
                            placeholder="Ambiente (ex: Cozinha, Quarto)"
                            value={item.ambiente}
                            onChange={(e) => {
                              const newItens = [...itens];
                              newItens[idx].ambiente = e.target.value;
                              setItens(newItens);
                            }}
                            className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs"
                          />
                        </div>
                        <div>
                          <input
                            type="date"
                            required
                            value={item.data_prevista}
                            onChange={(e) => {
                              const newItens = [...itens];
                              newItens[idx].data_prevista = e.target.value;
                              setItens(newItens);
                            }}
                            className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            required
                            placeholder="Ferramentas (ex: Parafusadeira, Broca 8mm, Nível)"
                            value={item.ferramentas_necessarias}
                            onChange={(e) => {
                              const newItens = [...itens];
                              newItens[idx].ferramentas_necessarias = e.target.value;
                              setItens(newItens);
                            }}
                            className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="touch-target px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="touch-target px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-sm"
                >
                  {isSubmitting ? 'Gravando...' : 'Gravar Plano & Itens (UC05)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Plano Exclude (UC08) */}
      <ConfirmModal
        isOpen={confirmDeletePlanoId !== null}
        title="Excluir Plano de Ação"
        message="Deseja realmente excluir este plano de ação e seus itens? De acordo com a regra de integridade do MVP 1 (RESTRICT), caso já exista um checklist gerado para este plano, a exclusão será bloqueada."
        confirmLabel="Excluir Plano"
        isDestructive={true}
        onConfirm={handleExecuteDeletePlano}
        onCancel={() => setConfirmDeletePlanoId(null)}
      />
    </div>
  );
};
