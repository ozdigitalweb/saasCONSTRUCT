import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ImoveisView } from './components/ImoveisView';
import { ImovelDetailModal } from './components/ImovelDetailModal';
import { PlanosView } from './components/PlanosView';
import { ChecklistView } from './components/ChecklistView';
import { RelatoriosView } from './components/RelatoriosView';
import { VpsDeployView } from './components/VpsDeployView';
import { ConfirmModal } from './components/ConfirmModal';
import { api } from './services/api';
import { Imovel, Checklist, DbStatus } from './types';
import { CheckCircle2, AlertCircle, FileDown } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('imoveis');
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [selectedImovel, setSelectedImovel] = useState<Imovel | null>(null);
  const [activeChecklistId, setActiveChecklistId] = useState<number | null>(null);
  const [preselectedImovelId, setPreselectedImovelId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState<boolean>(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string; actionUrl?: string; actionLabel?: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success', actionUrl?: string, actionLabel?: string) => {
    setToastMessage({ text, type, actionUrl, actionLabel });
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  // Load properties with detailed relations
  const loadData = useCallback(async () => {
    try {
      const [list, health] = await Promise.all([
        api.listarImoveis(),
        api.getHealth().catch(() => null),
      ]);

      if (health) setDbStatus(health);

      // Fetch detailed relations for each property to have full plans & checklists
      const detailedList = await Promise.all(
        list.map(async (im) => {
          try {
            return await api.obterImovel(im.id);
          } catch {
            return im;
          }
        })
      );

      setImoveis(detailedList);

      // Auto-select first checklist if none selected
      if (!activeChecklistId) {
        for (const im of detailedList) {
          for (const p of im.planos || []) {
            if (p.checklist) {
              setActiveChecklistId(p.checklist.id);
              break;
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeChecklistId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Collect all checklists from loaded properties
  const allChecklists: Checklist[] = [];
  imoveis.forEach((im) => {
    (im.planos || []).forEach((p) => {
      if (p.checklist) {
        allChecklists.push({
          ...p.checklist,
          plano: {
            id: p.id,
            imovel_id: im.id,
            nome_montador: p.nome_montador,
            whatsapp_montador: p.whatsapp_montador,
            imovel_identificacao: im.identificacao,
            imovel_endereco: im.endereco,
            imovel_cidade: im.cidade,
            imovel_estado: im.estado,
            imovel_cliente: im.nome_cliente,
          },
        });
      }
    });
  });

  // Calculate pending items for notification badge
  let pendingItemsCount = 0;
  allChecklists.forEach((c) => {
    (c.itens || []).forEach((i) => {
      if (i.status === 'nao_feito') pendingItemsCount++;
    });
  });

  // Handlers
  const handleCreateImovel = async (dados: {
    identificacao: string;
    endereco: string;
    cidade: string;
    estado: string;
    nome_cliente: string;
  }) => {
    const novo = await api.criarImovel(dados);
    await loadData();
    showToast(`Imóvel "${novo.identificacao}" cadastrado com sucesso (UC01)!`);
  };

  const handleEditImovel = async (
    id: number,
    dados: {
      identificacao: string;
      endereco: string;
      cidade: string;
      estado: string;
      nome_cliente: string;
    }
  ) => {
    const atualizado = await api.alterarImovel(id, dados);
    await loadData();
    showToast(`Imóvel "${atualizado.identificacao}" atualizado com sucesso (UC03)!`);
  };

  const handleDeleteImovel = async (id: number) => {
    await api.excluirImovel(id);
    await loadData();
    showToast('Imóvel excluído com sucesso (UC04).');
  };

  const handleCreatePlano = async (dados: {
    imovel_id: number;
    nome_montador: string;
    whatsapp_montador: string;
    itens: {
      descricao: string;
      ambiente: string;
      ferramentas_necessarias: string;
      data_prevista: string;
    }[];
  }) => {
    const plano = await api.criarPlano(dados);
    await loadData();
    showToast(`Plano de Ação #${plano.id} criado com sucesso (UC05)!`);
    setPreselectedImovelId(null);
  };

  const handleDeletePlano = async (id: number) => {
    await api.excluirPlano(id);
    await loadData();
    showToast('Plano de ação excluído com sucesso (UC08).');
  };

  const handleGenerateChecklist = async (planoId: number) => {
    const chk = await api.gerarChecklist(planoId);
    await loadData();
    setActiveChecklistId(chk.id);
    setActiveTab('checklist');
    showToast(`Checklist #${chk.id} gerado com sucesso a partir do Plano #${planoId} (UC09)!`);
  };

  const handleToggleChecklistItem = async (itemId: number, newStatus: 'feito' | 'nao_feito') => {
    // Optimistic UI update
    setImoveis((prev) =>
      prev.map((im) => {
        const planos = (im.planos || []).map((p) => {
          if (!p.checklist || !p.checklist.itens) return p;
          const itens = p.checklist.itens.map((it) => {
            if (it.id === itemId) {
              return {
                ...it,
                status: newStatus,
                marcado_em: newStatus === 'feito' ? new Date().toISOString() : null,
              };
            }
            return it;
          });
          return { ...p, checklist: { ...p.checklist, itens } };
        });
        return { ...im, planos };
      })
    );

    // Backend sync
    await api.marcarItemChecklist(itemId, newStatus);
  };

  const handleGenerateReport = async (checklistId: number) => {
    setIsGeneratingReport(true);
    try {
      const rel = await api.gerarRelatorio(checklistId);
      await loadData();
      showToast(
        `Relatório em PDF #${rel.id} gerado com sucesso (UC12)!`,
        'success',
        rel.download_url,
        'Baixar PDF Agora'
      );
    } catch (err: any) {
      showToast(err.message || 'Erro ao gerar relatório em PDF.', 'error');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleResetSeed = () => {
    setIsConfirmResetOpen(true);
  };

  const executeResetSeed = async () => {
    setIsConfirmResetOpen(false);
    setIsResetting(true);
    try {
      const res = await api.resetSeed();
      await loadData();
      showToast(res.message);
    } catch (err: any) {
      showToast('Erro ao restaurar dados.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-200">
      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-lg text-xs"
      >
        Pular para o conteúdo principal
      </a>

      {/* Top Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dbStatus={dbStatus}
        onResetSeed={handleResetSeed}
        isResetting={isResetting}
      />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed top-16 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 ${
              toastMessage.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800'
                : 'bg-red-600 text-white border-red-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-white shrink-0 mt-0.5" />
            )}
            <div className="text-xs flex-1">
              <p className="font-medium leading-relaxed">{toastMessage.text}</p>
              {toastMessage.actionUrl && (
                <a
                  href={toastMessage.actionUrl}
                  download
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors shadow-xs"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  {toastMessage.actionLabel || 'Baixar Arquivo'}
                </a>
              )}
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-24 md:pb-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-3">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium">
              Conectando aos dados do saasCONSTRUCT...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'imoveis' && (
              <ImoveisView
                imoveis={imoveis}
                onSelectImovel={(im) => setSelectedImovel(im)}
                onCreateImovel={handleCreateImovel}
                onEditImovel={handleEditImovel}
                onDeleteImovel={handleDeleteImovel}
                onOpenCreatePlan={(imId) => {
                  setPreselectedImovelId(imId);
                  setActiveTab('planos');
                }}
              />
            )}

            {activeTab === 'planos' && (
              <PlanosView
                imoveis={imoveis}
                onGenerateChecklist={handleGenerateChecklist}
                onCreatePlano={handleCreatePlano}
                onDeletePlano={handleDeletePlano}
                onSelectPlanoChecklist={(chkId) => {
                  setActiveChecklistId(chkId);
                  setActiveTab('checklist');
                }}
                preselectedImovelId={preselectedImovelId}
              />
            )}

            {activeTab === 'checklist' && (
              <ChecklistView
                checklists={allChecklists}
                activeChecklistId={activeChecklistId}
                onSelectChecklist={(id) => setActiveChecklistId(id)}
                onToggleItem={handleToggleChecklistItem}
                onGenerateReport={handleGenerateReport}
                isGeneratingReport={isGeneratingReport}
                imoveis={imoveis}
              />
            )}

            {activeTab === 'relatorios' && (
              <RelatoriosView
                imoveis={imoveis}
                onNavigateToChecklist={(chkId) => {
                  setActiveChecklistId(chkId);
                  setActiveTab('checklist');
                }}
              />
            )}

            {activeTab === 'vps' && (
              <VpsDeployView
                dbStatus={dbStatus}
                onRefreshHealth={loadData}
              />
            )}
          </>
        )}
      </main>

      {/* Detailed Modal for Imóvel (UC02) */}
      {selectedImovel && (
        <ImovelDetailModal
          imovel={selectedImovel}
          onClose={() => setSelectedImovel(null)}
          onOpenCreatePlan={(imId) => {
            setPreselectedImovelId(imId);
            setActiveTab('planos');
          }}
          onNavigateToChecklist={(chkId) => {
            setActiveChecklistId(chkId);
            setActiveTab('checklist');
          }}
        />
      )}

      {/* Mobile Ergonomic Bottom Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingChecklistCount={pendingItemsCount}
      />

      {/* Confirmation Modal for Reset Seed */}
      <ConfirmModal
        isOpen={isConfirmResetOpen}
        title="Restaurar Banco de Dados de Teste"
        message="Deseja restaurar a base de dados para o estado inicial com os 15 imóveis fictícios do Script 03? Os dados inseridos manualmente nesta sessão serão resetados."
        confirmLabel="Restaurar Dados"
        isDestructive={false}
        onConfirm={executeResetSeed}
        onCancel={() => setIsConfirmResetOpen(false)}
      />
    </div>
  );
}
