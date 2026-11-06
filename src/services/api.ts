import { Imovel, PlanoAcao, Checklist, ItemChecklist, Relatorio, DbStatus } from '../types';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido na requisição.' }));
    throw new Error(errorData.error || `Erro HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Health & Database
  async getHealth(): Promise<DbStatus> {
    const res = await fetch('/api/health');
    return handleResponse<DbStatus>(res);
  },

  async resetSeed(): Promise<{ message: string }> {
    const res = await fetch('/api/test/reset-seed', { method: 'POST' });
    return handleResponse<{ message: string }>(res);
  },

  // Imóveis (UC01 - UC04)
  async listarImoveis(): Promise<Imovel[]> {
    const res = await fetch('/api/imoveis');
    return handleResponse<Imovel[]>(res);
  },

  async obterImovel(id: number): Promise<Imovel> {
    const res = await fetch(`/api/imoveis/${id}`);
    return handleResponse<Imovel>(res);
  },

  async criarImovel(dados: {
    identificacao: string;
    endereco: string;
    cidade: string;
    estado: string;
    nome_cliente: string;
  }): Promise<Imovel> {
    const res = await fetch('/api/imoveis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return handleResponse<Imovel>(res);
  },

  async alterarImovel(
    id: number,
    dados: {
      identificacao: string;
      endereco: string;
      cidade: string;
      estado: string;
      nome_cliente: string;
    }
  ): Promise<Imovel> {
    const res = await fetch(`/api/imoveis/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return handleResponse<Imovel>(res);
  },

  async excluirImovel(id: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/imoveis/${id}`, { method: 'DELETE' });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  // Planos de Ação (UC05 - UC08)
  async criarPlano(dados: {
    imovel_id: number;
    nome_montador: string;
    whatsapp_montador: string;
    itens: {
      descricao: string;
      ambiente: string;
      ferramentas_necessarias: string;
      data_prevista: string;
    }[];
  }): Promise<PlanoAcao> {
    const res = await fetch('/api/planos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return handleResponse<PlanoAcao>(res);
  },

  async obterPlano(id: number): Promise<PlanoAcao> {
    const res = await fetch(`/api/planos/${id}`);
    return handleResponse<PlanoAcao>(res);
  },

  async alterarPlano(
    id: number,
    dados: {
      nome_montador: string;
      whatsapp_montador: string;
      itens: {
        id?: number;
        descricao: string;
        ambiente: string;
        ferramentas_necessarias: string;
        data_prevista: string;
      }[];
    }
  ): Promise<PlanoAcao> {
    const res = await fetch(`/api/planos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return handleResponse<PlanoAcao>(res);
  },

  async excluirPlano(id: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/planos/${id}`, { method: 'DELETE' });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  // Checklists (UC09 - UC11)
  async gerarChecklist(planoId: number): Promise<Checklist> {
    const res = await fetch(`/api/planos/${planoId}/checklist`, { method: 'POST' });
    return handleResponse<Checklist>(res);
  },

  async obterChecklist(id: number): Promise<Checklist> {
    const res = await fetch(`/api/checklists/${id}`);
    return handleResponse<Checklist>(res);
  },

  async marcarItemChecklist(itemId: number, status: 'feito' | 'nao_feito'): Promise<ItemChecklist> {
    const res = await fetch(`/api/checklist-itens/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return handleResponse<ItemChecklist>(res);
  },

  // Relatório (UC12 - UC13)
  async gerarRelatorio(checklistId: number): Promise<Relatorio & { download_url: string; message: string }> {
    const res = await fetch(`/api/checklists/${checklistId}/relatorio`, { method: 'POST' });
    return handleResponse<Relatorio & { download_url: string; message: string }>(res);
  },

  getRelatorioPdfUrl(relatorioId: number): string {
    return `/api/relatorios/${relatorioId}/pdf`;
  },
};
