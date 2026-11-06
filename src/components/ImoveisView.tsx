import React, { useState, useMemo } from 'react';
import { Search, Plus, Home, MapPin, User, ChevronRight, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { Imovel } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface ImoveisViewProps {
  imoveis: Imovel[];
  onSelectImovel: (imovel: Imovel) => void;
  onCreateImovel: (dados: {
    identificacao: string;
    endereco: string;
    cidade: string;
    estado: string;
    nome_cliente: string;
  }) => Promise<void>;
  onEditImovel: (
    id: number,
    dados: {
      identificacao: string;
      endereco: string;
      cidade: string;
      estado: string;
      nome_cliente: string;
    }
  ) => Promise<void>;
  onDeleteImovel: (id: number) => Promise<void>;
  onOpenCreatePlan: (imovelId: number) => void;
}

export const ImoveisView: React.FC<ImoveisViewProps> = ({
  imoveis,
  onSelectImovel,
  onCreateImovel,
  onEditImovel,
  onDeleteImovel,
  onOpenCreatePlan,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingImovel, setEditingImovel] = useState<Imovel | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    identificacao: '',
    endereco: '',
    cidade: '',
    estado: 'SP',
    nome_cliente: '',
  });

  const filteredImoveis = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return imoveis;
    return imoveis.filter(
      (im) =>
        im.identificacao.toLowerCase().includes(term) ||
        im.nome_cliente.toLowerCase().includes(term) ||
        im.endereco.toLowerCase().includes(term) ||
        im.cidade.toLowerCase().includes(term)
    );
  }, [imoveis, searchTerm]);

  const handleOpenCreate = () => {
    setFormData({
      identificacao: `TESTE ${String(imoveis.length + 1).padStart(2, '0')}`,
      endereco: `Rua Nova Fictícia ${imoveis.length + 1}, apto 10${imoveis.length + 1}`,
      cidade: 'São Paulo',
      estado: 'SP',
      nome_cliente: `Cliente Fictício ${String(imoveis.length + 1).padStart(2, '0')}`,
    });
    setErrorMessage(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (imovel: Imovel, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingImovel(imovel);
    setFormData({
      identificacao: imovel.identificacao,
      endereco: imovel.endereco,
      cidade: imovel.cidade,
      estado: imovel.estado,
      nome_cliente: imovel.nome_cliente,
    });
    setErrorMessage(null);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await onCreateImovel(formData);
      setIsCreateOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao cadastrar imóvel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImovel) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await onEditImovel(editingImovel.id, formData);
      setEditingImovel(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao atualizar imóvel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const handleExecuteDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setDeletingId(id);
    try {
      await onDeleteImovel(id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Não foi possível excluir o imóvel.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Metrics strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Imóveis em Adequação
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            15 imóveis fictícios do plano de validação da Karol e do Santos (LGPD compliant).
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="touch-target inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Imóvel (UC01)
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por identificação, cliente ou endereço..."
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all placeholder:text-slate-400"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1"
          >
            Limpar
          </button>
        )}
      </div>

      {/* List of Imóveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredImoveis.map((im) => {
          return (
            <div
              key={im.id}
              onClick={() => onSelectImovel(im)}
              className="group bg-white rounded-2xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-mono text-slate-500">#{String(im.id).padStart(2, '0')}</span>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">
                        {im.identificacao}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenEdit(im, e)}
                      title="Editar Imóvel (UC03)"
                      className="touch-target p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      aria-label="Editar Imóvel"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleRequestDelete(im.id, e)}
                      disabled={deletingId === im.id}
                      title="Excluir Imóvel (UC04)"
                      className="touch-target p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Excluir Imóvel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Info row */}
                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-800 truncate">
                      {im.nome_cliente}
                    </span>
                    <span className="text-slate-400 text-[10px]">(Comprador)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{im.endereco} · {im.cidade}/{im.estado}</span>
                  </div>
                </div>
              </div>

              {/* Bottom action trigger */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Ver detalhes & planos
                </span>
                <span className="font-semibold text-slate-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Acessar <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredImoveis.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-sm font-medium text-slate-700">Nenhum imóvel encontrado.</p>
          <p className="text-xs text-slate-500 mt-1">Tente ajustar o termo da busca ou cadastre um novo imóvel.</p>
        </div>
      )}

      {/* Modal: Cadastrar Imóvel (UC01) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Cadastrar Novo Imóvel (UC01)</h2>
            <p className="text-xs text-slate-500 mt-1">
              Todos os 5 campos são obrigatórios conforme regras do MVP 1.
            </p>

            {errorMessage && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitCreate} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Identificação do Imóvel *
                </label>
                <input
                  type="text"
                  required
                  value={formData.identificacao}
                  onChange={(e) => setFormData({ ...formData, identificacao: e.target.value })}
                  placeholder="Ex: APTO 502 - EDIFÍCIO HORIZONTE"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome do Cliente (Comprador que receberá o PDF) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome_cliente}
                  onChange={(e) => setFormData({ ...formData, nome_cliente: e.target.value })}
                  placeholder="Ex: Mariana Castro Silva"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Endereço *
                </label>
                <input
                  type="text"
                  required
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Ex: Rua das Palmeiras, 340, apto 502"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    placeholder="Ex: Campinas"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Estado (UF) *
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    required
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                    placeholder="SP"
                    className="w-full h-10 px-3 uppercase text-center rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
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
                  className="touch-target px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  {isSubmitting ? 'Salvando...' : 'Gravar Imóvel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Alterar Imóvel (UC03) */}
      {editingImovel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Alterar Imóvel #{editingImovel.id} (UC03)</h2>
            <p className="text-xs text-slate-500 mt-1">
              Edite as informações cadastrais do imóvel.
            </p>

            {errorMessage && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitEdit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Identificação do Imóvel *
                </label>
                <input
                  type="text"
                  required
                  value={formData.identificacao}
                  onChange={(e) => setFormData({ ...formData, identificacao: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome do Cliente (Comprador) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome_cliente}
                  onChange={(e) => setFormData({ ...formData, nome_cliente: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Endereço *
                </label>
                <input
                  type="text"
                  required
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Estado (UF) *
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    required
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                    className="w-full h-10 px-3 uppercase text-center rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingImovel(null)}
                  className="touch-target px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="touch-target px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Imóvel Exclude (UC04) */}
      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Excluir Imóvel"
        message="Deseja realmente excluir este imóvel? De acordo com a regra de integridade do MVP 1 (RESTRICT), caso existam planos de ação ou relatórios vinculados, a exclusão será bloqueada."
        confirmLabel="Excluir Imóvel"
        isDestructive={true}
        onConfirm={handleExecuteDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};
