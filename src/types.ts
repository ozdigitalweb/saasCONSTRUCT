export interface Imovel {
  id: number;
  identificacao: string;
  endereco: string;
  cidade: string;
  estado: string;
  nome_cliente: string;
  criado_em: string;
  atualizado_em: string;
  planos?: PlanoAcao[];
  relatorios?: { id: number; imovel_id: number; checklist_id: number; gerado_em: string }[];
}

export interface ItemPlano {
  id: number;
  plano_id: number;
  descricao: string;
  ambiente: string;
  ferramentas_necessarias: string;
  data_prevista: string;
  criado_em?: string;
  atualizado_em?: string;
}

export interface PlanoAcao {
  id: number;
  imovel_id: number;
  nome_montador: string;
  whatsapp_montador: string;
  criado_em: string;
  atualizado_em: string;
  itens?: ItemPlano[];
  checklist?: Checklist;
}

export interface ItemChecklist {
  id: number;
  checklist_id: number;
  item_plano_id: number;
  status: 'feito' | 'nao_feito';
  marcado_em: string | null;
  descricao?: string;
  ambiente?: string;
  ferramentas_necessarias?: string;
  data_prevista?: string;
}

export interface Checklist {
  id: number;
  plano_id: number;
  modelo: string;
  gerado_em: string;
  itens?: ItemChecklist[];
  plano?: {
    id: number;
    imovel_id: number;
    nome_montador: string;
    whatsapp_montador: string;
    imovel_identificacao?: string;
    imovel_endereco?: string;
    imovel_cidade?: string;
    imovel_estado?: string;
    imovel_cliente?: string;
  };
}

export interface Relatorio {
  id: number;
  imovel_id: number;
  checklist_id: number;
  gerado_em: string;
  download_url?: string;
}

export interface DbStatus {
  status: string;
  timestamp: string;
  engine: string;
  connected: boolean;
  totalImoveis: number;
  totalPlanos: number;
  totalChecklists: number;
  totalRelatorios: number;
}
