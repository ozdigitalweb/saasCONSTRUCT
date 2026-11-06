import pg from 'pg';

export interface Imovel {
  id: number;
  identificacao: string;
  endereco: string;
  cidade: string;
  estado: string;
  nome_cliente: string;
  criado_em: string;
  atualizado_em: string;
}

export interface ItemPlano {
  id: number;
  plano_id: number;
  descricao: string;
  ambiente: string;
  ferramentas_necessarias: string;
  data_prevista: string;
  criado_em: string;
  atualizado_em: string;
}

export interface PlanoAcao {
  id: number;
  imovel_id: number;
  nome_montador: string;
  whatsapp_montador: string;
  criado_em: string;
  atualizado_em: string;
  itens?: ItemPlano[];
}

export interface ItemChecklist {
  id: number;
  checklist_id: number;
  item_plano_id: number;
  status: 'feito' | 'nao_feito';
  marcado_em: string | null;
  // Join fields for convenience
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
}

export interface Relatorio {
  id: number;
  imovel_id: number;
  checklist_id: number;
  gerado_em: string;
  arquivo_pdf?: Buffer | string; // Buffer in postgres or base64
}

// 15 initial test properties from Script 03 (LGPD compliant test data)
const INITIAL_IMOVEIS: Omit<Imovel, 'id' | 'criado_em' | 'atualizado_em'>[] = Array.from({ length: 15 }, (_, i) => {
  const n = i + 1;
  const pad = String(n).padStart(2, '0');
  return {
    identificacao: `TESTE ${pad}`,
    endereco: `Rua Ficticia ${n}, apto ${100 + n}`,
    cidade: 'Cidade de Teste',
    estado: 'SP',
    nome_cliente: `Cliente Ficticio ${pad}`,
  };
});

// Seed sample plans for the first 3 properties so Karol & Santos have immediately testable workflows
const INITIAL_SAMPLE_PLANS: {
  imovelIndex: number;
  nome_montador: string;
  whatsapp_montador: string;
  itens: { descricao: string; ambiente: string; ferramentas_necessarias: string; data_prevista: string }[];
}[] = [
  {
    imovelIndex: 0, // TESTE 01
    nome_montador: 'Carlos Eduardo Montador',
    whatsapp_montador: '(11) 98765-4321',
    itens: [
      { descricao: 'Armários aéreos da cozinha', ambiente: 'Cozinha', ferramentas_necessarias: 'Parafusadeira, Broca 8mm, Nível a laser', data_prevista: '2026-11-05' },
      { descricao: 'Bancada e gabinete da pia', ambiente: 'Cozinha', ferramentas_necessarias: 'Chave Philips, Silicone, Trena', data_prevista: '2026-11-05' },
      { descricao: 'Guarda-roupa planejado 3 portas de correr', ambiente: 'Quarto Casal', ferramentas_necessarias: 'Parafusadeira, Martelo de borracha, Nível', data_prevista: '2026-11-06' },
      { descricao: 'Painel ripado de TV com nicho inferior', ambiente: 'Sala de Estar', ferramentas_necessarias: 'Broca de vídea, Bucha UX 10, Nível a laser', data_prevista: '2026-11-07' },
      { descricao: 'Gabinete suspenso com espelheira', ambiente: 'Banheiro Social', ferramentas_necessarias: 'Broca diamantada, Parafusadeira, Silicone fungicida', data_prevista: '2026-11-08' }
    ]
  },
  {
    imovelIndex: 1, // TESTE 02
    nome_montador: 'Marcos Vinicius Marcenaria',
    whatsapp_montador: '+55 11 91234-5678',
    itens: [
      { descricao: 'Módulos superiores com porta basculante', ambiente: 'Cozinha', ferramentas_necessarias: 'Pistão a gás, Nível, Parafusadeira', data_prevista: '2026-11-09' },
      { descricao: 'Bancada home office com passa-fios', ambiente: 'Home Office', ferramentas_necessarias: 'Serra copo 60mm, Furadeira, Chave Allen', data_prevista: '2026-11-10' },
      { descricao: 'Prateleiras decorativas em L', ambiente: 'Sala', ferramentas_necessarias: 'Suporte invisível, Nível', data_prevista: '2026-11-10' }
    ]
  }
];

// Memory store fallback for preview & development sandbox
class MemoryStore {
  private nextId = 100;
  imoveis: Imovel[] = [];
  planos: PlanoAcao[] = [];
  itensPlano: ItemPlano[] = [];
  checklists: Checklist[] = [];
  itensChecklist: ItemChecklist[] = [];
  relatorios: (Relatorio & { pdfBase64: string })[] = [];

  constructor() {
    this.resetSeed();
  }

  resetSeed() {
    this.imoveis = [];
    this.planos = [];
    this.itensPlano = [];
    this.checklists = [];
    this.itensChecklist = [];
    this.relatorios = [];
    this.nextId = 1;

    const now = new Date().toISOString();
    // Insert 15 mock properties
    for (const item of INITIAL_IMOVEIS) {
      const id = this.nextId++;
      this.imoveis.push({
        id,
        ...item,
        criado_em: now,
        atualizado_em: now,
      });
    }

    // Insert sample plans and initial checklist for TESTE 01
    for (const sample of INITIAL_SAMPLE_PLANS) {
      const targetImovel = this.imoveis[sample.imovelIndex];
      if (!targetImovel) continue;

      const planoId = this.nextId++;
      const plano: PlanoAcao = {
        id: planoId,
        imovel_id: targetImovel.id,
        nome_montador: sample.nome_montador,
        whatsapp_montador: sample.whatsapp_montador,
        criado_em: now,
        atualizado_em: now,
      };
      this.planos.push(plano);

      const createdItensPlano: ItemPlano[] = [];
      for (const it of sample.itens) {
        const itemId = this.nextId++;
        const itemPlano: ItemPlano = {
          id: itemId,
          plano_id: planoId,
          ...it,
          criado_em: now,
          atualizado_em: now,
        };
        this.itensPlano.push(itemPlano);
        createdItensPlano.push(itemPlano);
      }

      // If it's TESTE 01, also auto-generate checklist with 3 done and 2 pending items
      if (sample.imovelIndex === 0) {
        const checklistId = this.nextId++;
        this.checklists.push({
          id: checklistId,
          plano_id: planoId,
          modelo: 'resumido',
          gerado_em: now,
        });

        createdItensPlano.forEach((ip, idx) => {
          const itemChecklistId = this.nextId++;
          const isDone = idx < 3; // First 3 marked as done for realistic demonstration
          this.itensChecklist.push({
            id: itemChecklistId,
            checklist_id: checklistId,
            item_plano_id: ip.id,
            status: isDone ? 'feito' : 'nao_feito',
            marcado_em: isDone ? new Date(Date.now() - (idx + 1) * 3600000).toISOString() : null,
          });
        });
      }
    }
  }
}

export const memoryStore = new MemoryStore();

// PostgreSQL connection pool (configured via process.env.DATABASE_URL)
let pool: pg.Pool | null = null;
let isPostgresReady = false;

export async function initDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('[DB] DATABASE_URL não definida. Usando armazenamento em memória preparado com os 15 imóveis fictícios do Script 03.');
    return;
  }

  try {
    pool = new pg.Pool({
      connectionString: dbUrl,
      connectionTimeoutMillis: 3000,
      ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
    });

    const client = await pool.connect();
    const res = await client.query('SELECT NOW() as now, current_database() as db');
    client.release();
    isPostgresReady = true;
    console.log(`[DB] Conectado ao PostgreSQL com sucesso: ${res.rows[0].db} em ${res.rows[0].now}`);
  } catch (err: any) {
    console.warn(`[DB] Não foi possível conectar ao PostgreSQL (${err.message}). Usando armazenamento em memória local.`);
    pool = null;
    isPostgresReady = false;
  }
}

export function getDbStatus() {
  return {
    engine: isPostgresReady ? 'PostgreSQL' : 'Armazenamento em Memória (Emulador de Script 01-03)',
    connected: isPostgresReady,
    totalImoveis: memoryStore.imoveis.length,
    totalPlanos: memoryStore.planos.length,
    totalChecklists: memoryStore.checklists.length,
    totalRelatorios: memoryStore.relatorios.length,
  };
}

// ==========================================
// UC01 - UC04: Imóvel Service
// ==========================================
export async function listarImoveis(): Promise<Imovel[]> {
  if (isPostgresReady && pool) {
    const res = await pool.query('SELECT * FROM mvp1.imovel ORDER BY id ASC');
    return res.rows;
  }
  return [...memoryStore.imoveis].sort((a, b) => a.id - b.id);
}

export async function obterImovel(id: number) {
  if (isPostgresReady && pool) {
    const resImovel = await pool.query('SELECT * FROM mvp1.imovel WHERE id = $1', [id]);
    if (resImovel.rows.length === 0) return null;
    const imovel = resImovel.rows[0];

    const resPlanos = await pool.query('SELECT * FROM mvp1.plano_acao WHERE imovel_id = $1 ORDER BY id DESC', [id]);
    const planos = resPlanos.rows;

    for (const p of planos) {
      const resItens = await pool.query('SELECT * FROM mvp1.item_plano WHERE plano_id = $1 ORDER BY id ASC', [p.id]);
      p.itens = resItens.rows;
      const resChecklist = await pool.query('SELECT * FROM mvp1.checklist WHERE plano_id = $1 ORDER BY id DESC LIMIT 1', [p.id]);
      if (resChecklist.rows.length > 0) {
        const chk = resChecklist.rows[0];
        const resItensChk = await pool.query(`
          SELECT ic.*, ip.descricao, ip.ambiente, ip.ferramentas_necessarias, ip.data_prevista
          FROM mvp1.item_checklist ic
          JOIN mvp1.item_plano ip ON ip.id = ic.item_plano_id
          WHERE ic.checklist_id = $1
          ORDER BY ic.id ASC
        `, [chk.id]);
        chk.itens = resItensChk.rows;
        p.checklist = chk;
      }
    }

    const resRelatorios = await pool.query('SELECT id, imovel_id, checklist_id, gerado_em FROM mvp1.relatorio WHERE imovel_id = $1 ORDER BY id DESC', [id]);

    return {
      ...imovel,
      planos,
      relatorios: resRelatorios.rows,
    };
  }

  const imovel = memoryStore.imoveis.find((im) => im.id === id);
  if (!imovel) return null;

  const planos = memoryStore.planos
    .filter((p) => p.imovel_id === id)
    .map((p) => {
      const itens = memoryStore.itensPlano.filter((ip) => ip.plano_id === p.id);
      const chk = memoryStore.checklists.find((c) => c.plano_id === p.id);
      let checklist = undefined;
      if (chk) {
        const itensChk = memoryStore.itensChecklist
          .filter((ic) => ic.checklist_id === chk.id)
          .map((ic) => {
            const ip = memoryStore.itensPlano.find((item) => item.id === ic.item_plano_id);
            return {
              ...ic,
              descricao: ip?.descricao,
              ambiente: ip?.ambiente,
              ferramentas_necessarias: ip?.ferramentas_necessarias,
              data_prevista: ip?.data_prevista,
            };
          });
        checklist = { ...chk, itens: itensChk };
      }
      return { ...p, itens, checklist };
    });

  const relatorios = memoryStore.relatorios
    .filter((r) => r.imovel_id === id)
    .map((r) => ({ id: r.id, imovel_id: r.imovel_id, checklist_id: r.checklist_id, gerado_em: r.gerado_em }));

  return {
    ...imovel,
    planos,
    relatorios,
  };
}

export async function criarImovel(dados: {
  identificacao: string;
  endereco: string;
  cidade: string;
  estado: string;
  nome_cliente: string;
}): Promise<Imovel> {
  const uf = dados.estado.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(uf)) {
    throw new Error('Estado (UF) deve ter exatamente 2 letras maiúsculas (ex: SP, RJ, MG).');
  }
  if (!dados.identificacao.trim()) throw new Error('Identificação do imóvel é obrigatória.');
  if (!dados.endereco.trim()) throw new Error('Endereço é obrigatório.');
  if (!dados.cidade.trim()) throw new Error('Cidade é obrigatória.');
  if (!dados.nome_cliente.trim()) throw new Error('Nome do cliente é obrigatório.');

  if (isPostgresReady && pool) {
    const res = await pool.query(
      `INSERT INTO mvp1.imovel (identificacao, endereco, cidade, estado, nome_cliente)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [dados.identificacao.trim(), dados.endereco.trim(), dados.cidade.trim(), uf, dados.nome_cliente.trim()]
    );
    return res.rows[0];
  }

  const now = new Date().toISOString();
  const novo: Imovel = {
    id: memoryStore.imoveis.length ? Math.max(...memoryStore.imoveis.map((i) => i.id)) + 1 : 1,
    identificacao: dados.identificacao.trim(),
    endereco: dados.endereco.trim(),
    cidade: dados.cidade.trim(),
    estado: uf,
    nome_cliente: dados.nome_cliente.trim(),
    criado_em: now,
    atualizado_em: now,
  };
  memoryStore.imoveis.push(novo);
  return novo;
}

export async function alterarImovel(id: number, dados: {
  identificacao: string;
  endereco: string;
  cidade: string;
  estado: string;
  nome_cliente: string;
}): Promise<Imovel> {
  const uf = dados.estado.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(uf)) {
    throw new Error('Estado (UF) deve ter exatamente 2 letras maiúsculas.');
  }

  if (isPostgresReady && pool) {
    const res = await pool.query(
      `UPDATE mvp1.imovel
       SET identificacao = $1, endereco = $2, cidade = $3, estado = $4, nome_cliente = $5
       WHERE id = $6 RETURNING *`,
      [dados.identificacao.trim(), dados.endereco.trim(), dados.cidade.trim(), uf, dados.nome_cliente.trim(), id]
    );
    if (res.rows.length === 0) throw new Error('Imóvel não encontrado.');
    return res.rows[0];
  }

  const idx = memoryStore.imoveis.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error('Imóvel não encontrado.');

  const updated: Imovel = {
    ...memoryStore.imoveis[idx],
    identificacao: dados.identificacao.trim(),
    endereco: dados.endereco.trim(),
    cidade: dados.cidade.trim(),
    estado: uf,
    nome_cliente: dados.nome_cliente.trim(),
    atualizado_em: new Date().toISOString(),
  };
  memoryStore.imoveis[idx] = updated;
  return updated;
}

export async function excluirImovel(id: number): Promise<void> {
  if (isPostgresReady && pool) {
    try {
      await pool.query('DELETE FROM mvp1.imovel WHERE id = $1', [id]);
    } catch (err: any) {
      if (err.code === '23503') {
        throw new Error('Não é possível excluir o imóvel pois existem planos de ação ou relatórios vinculados a ele (regra RESTRICT).');
      }
      throw err;
    }
    return;
  }

  // Check foreign key restrictions
  const hasPlanos = memoryStore.planos.some((p) => p.imovel_id === id);
  const hasRelatorios = memoryStore.relatorios.some((r) => r.imovel_id === id);
  if (hasPlanos || hasRelatorios) {
    throw new Error('Não é possível excluir o imóvel pois existem planos de ação ou relatórios vinculados a ele (regra RESTRICT).');
  }

  memoryStore.imoveis = memoryStore.imoveis.filter((i) => i.id !== id);
}

// ==========================================
// UC05 - UC08: Plano de Ação Service
// ==========================================
export async function criarPlano(dados: {
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
  if (!dados.nome_montador.trim()) throw new Error('Nome do montador é obrigatório.');
  if (!/^[0-9+() -]{8,20}$/.test(dados.whatsapp_montador.trim())) {
    throw new Error('WhatsApp do montador inválido. Deve conter entre 8 e 20 caracteres.');
  }
  if (!dados.itens || dados.itens.length === 0) {
    throw new Error('O plano de ação deve ter pelo menos um item.');
  }

  if (isPostgresReady && pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const resPlano = await client.query(
        `INSERT INTO mvp1.plano_acao (imovel_id, nome_montador, whatsapp_montador)
         VALUES ($1, $2, $3) RETURNING *`,
        [dados.imovel_id, dados.nome_montador.trim(), dados.whatsapp_montador.trim()]
      );
      const plano = resPlano.rows[0];

      const createdItens: ItemPlano[] = [];
      for (const it of dados.itens) {
        const resItem = await client.query(
          `INSERT INTO mvp1.item_plano (plano_id, descricao, ambiente, ferramentas_necessarias, data_prevista)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [plano.id, it.descricao.trim(), it.ambiente.trim(), it.ferramentas_necessarias.trim(), it.data_prevista]
        );
        createdItens.push(resItem.rows[0]);
      }

      await client.query('COMMIT');
      plano.itens = createdItens;
      return plano;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  const imovelExiste = memoryStore.imoveis.some((im) => im.id === dados.imovel_id);
  if (!imovelExiste) throw new Error('Imóvel não encontrado.');

  const now = new Date().toISOString();
  const planoId = memoryStore.planos.length ? Math.max(...memoryStore.planos.map((p) => p.id)) + 1 : 1;
  const novoPlano: PlanoAcao = {
    id: planoId,
    imovel_id: dados.imovel_id,
    nome_montador: dados.nome_montador.trim(),
    whatsapp_montador: dados.whatsapp_montador.trim(),
    criado_em: now,
    atualizado_em: now,
  };
  memoryStore.planos.push(novoPlano);

  let nextItemId = memoryStore.itensPlano.length ? Math.max(...memoryStore.itensPlano.map((i) => i.id)) + 1 : 1;
  const createdItens: ItemPlano[] = [];

  for (const it of dados.itens) {
    const itemPlano: ItemPlano = {
      id: nextItemId++,
      plano_id: planoId,
      descricao: it.descricao.trim(),
      ambiente: it.ambiente.trim(),
      ferramentas_necessarias: it.ferramentas_necessarias.trim(),
      data_prevista: it.data_prevista,
      criado_em: now,
      atualizado_em: now,
    };
    memoryStore.itensPlano.push(itemPlano);
    createdItens.push(itemPlano);
  }

  novoPlano.itens = createdItens;
  return novoPlano;
}

export async function obterPlano(id: number) {
  if (isPostgresReady && pool) {
    const resPlano = await pool.query('SELECT * FROM mvp1.plano_acao WHERE id = $1', [id]);
    if (resPlano.rows.length === 0) return null;
    const plano = resPlano.rows[0];

    const resItens = await pool.query('SELECT * FROM mvp1.item_plano WHERE plano_id = $1 ORDER BY id ASC', [id]);
    plano.itens = resItens.rows;

    const resChecklist = await pool.query('SELECT * FROM mvp1.checklist WHERE plano_id = $1 ORDER BY id DESC LIMIT 1', [id]);
    if (resChecklist.rows.length > 0) {
      plano.checklist = resChecklist.rows[0];
    }
    return plano;
  }

  const plano = memoryStore.planos.find((p) => p.id === id);
  if (!plano) return null;
  const itens = memoryStore.itensPlano.filter((i) => i.plano_id === id);
  const checklist = memoryStore.checklists.find((c) => c.plano_id === id);
  return { ...plano, itens, checklist };
}

export async function alterarPlano(id: number, dados: {
  nome_montador: string;
  whatsapp_montador: string;
  itens: {
    id?: number;
    descricao: string;
    ambiente: string;
    ferramentas_necessarias: string;
    data_prevista: string;
  }[];
}) {
  if (isPostgresReady && pool) {
    // Check if checklist exists (rule 3: blocked if checklist exists)
    const chk = await pool.query('SELECT id FROM mvp1.checklist WHERE plano_id = $1', [id]);
    if (chk.rows.length > 0) {
      throw new Error('Não é possível alterar o plano de ação pois o checklist já foi gerado (regra de integridade do MVP 1).');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE mvp1.plano_acao SET nome_montador = $1, whatsapp_montador = $2 WHERE id = $3`,
        [dados.nome_montador.trim(), dados.whatsapp_montador.trim(), id]
      );
      // Delete old items and insert updated ones
      await client.query('DELETE FROM mvp1.item_plano WHERE plano_id = $1', [id]);
      for (const it of dados.itens) {
        await client.query(
          `INSERT INTO mvp1.item_plano (plano_id, descricao, ambiente, ferramentas_necessarias, data_prevista)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, it.descricao.trim(), it.ambiente.trim(), it.ferramentas_necessarias.trim(), it.data_prevista]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    return obterPlano(id);
  }

  const hasChecklist = memoryStore.checklists.some((c) => c.plano_id === id);
  if (hasChecklist) {
    throw new Error('Não é possível alterar o plano de ação pois o checklist já foi gerado (regra de integridade do MVP 1).');
  }

  const pIndex = memoryStore.planos.findIndex((p) => p.id === id);
  if (pIndex === -1) throw new Error('Plano de ação não encontrado.');

  memoryStore.planos[pIndex].nome_montador = dados.nome_montador.trim();
  memoryStore.planos[pIndex].whatsapp_montador = dados.whatsapp_montador.trim();
  memoryStore.planos[pIndex].atualizado_em = new Date().toISOString();

  // Replace items
  memoryStore.itensPlano = memoryStore.itensPlano.filter((i) => i.plano_id !== id);
  let nextId = memoryStore.itensPlano.length ? Math.max(...memoryStore.itensPlano.map((i) => i.id)) + 1 : 1;
  for (const it of dados.itens) {
    memoryStore.itensPlano.push({
      id: nextId++,
      plano_id: id,
      descricao: it.descricao.trim(),
      ambiente: it.ambiente.trim(),
      ferramentas_necessarias: it.ferramentas_necessarias.trim(),
      data_prevista: it.data_prevista,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    });
  }

  return obterPlano(id);
}

export async function excluirPlano(id: number): Promise<void> {
  if (isPostgresReady && pool) {
    try {
      await pool.query('DELETE FROM mvp1.plano_acao WHERE id = $1', [id]);
    } catch (err: any) {
      if (err.code === '23503') {
        throw new Error('Não é possível excluir o plano pois há um checklist vinculado a ele (regra RESTRICT).');
      }
      throw err;
    }
    return;
  }

  const hasChecklist = memoryStore.checklists.some((c) => c.plano_id === id);
  if (hasChecklist) {
    throw new Error('Não é possível excluir o plano pois há um checklist vinculado a ele (regra RESTRICT).');
  }

  memoryStore.itensPlano = memoryStore.itensPlano.filter((i) => i.plano_id !== id);
  memoryStore.planos = memoryStore.planos.filter((p) => p.id !== id);
}

// ==========================================
// UC09 - UC11: Checklist Service
// ==========================================
export async function gerarChecklist(planoId: number): Promise<Checklist> {
  if (isPostgresReady && pool) {
    // Check if checklist already exists for this plan (rule: max 1 checklist per plan)
    const existing = await pool.query('SELECT * FROM mvp1.checklist WHERE plano_id = $1', [planoId]);
    if (existing.rows.length > 0) {
      throw new Error('Este plano de ação já possui um checklist gerado.');
    }

    const resItensPlano = await pool.query('SELECT * FROM mvp1.item_plano WHERE plano_id = $1', [planoId]);
    if (resItensPlano.rows.length === 0) {
      throw new Error('O plano de ação deve ter pelo menos um item para gerar o checklist.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const resChk = await client.query(
        `INSERT INTO mvp1.checklist (plano_id, modelo) VALUES ($1, 'resumido') RETURNING *`,
        [planoId]
      );
      const chk = resChk.rows[0];

      const createdItensChk: ItemChecklist[] = [];
      for (const ip of resItensPlano.rows) {
        const resItem = await client.query(
          `INSERT INTO mvp1.item_checklist (checklist_id, item_plano_id, status)
           VALUES ($1, $2, 'nao_feito') RETURNING *`,
          [chk.id, ip.id]
        );
        createdItensChk.push({
          ...resItem.rows[0],
          descricao: ip.descricao,
          ambiente: ip.ambiente,
          ferramentas_necessarias: ip.ferramentas_necessarias,
          data_prevista: ip.data_prevista,
        });
      }

      await client.query('COMMIT');
      chk.itens = createdItensChk;
      return chk;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  const existing = memoryStore.checklists.find((c) => c.plano_id === planoId);
  if (existing) {
    throw new Error('Este plano de ação já possui um checklist gerado.');
  }

  const itensPlano = memoryStore.itensPlano.filter((i) => i.plano_id === planoId);
  if (itensPlano.length === 0) {
    throw new Error('O plano de ação deve ter pelo menos um item para gerar o checklist.');
  }

  const now = new Date().toISOString();
  const chkId = memoryStore.checklists.length ? Math.max(...memoryStore.checklists.map((c) => c.id)) + 1 : 1;
  const novoChecklist: Checklist = {
    id: chkId,
    plano_id: planoId,
    modelo: 'resumido',
    gerado_em: now,
  };
  memoryStore.checklists.push(novoChecklist);

  let nextChkItemId = memoryStore.itensChecklist.length ? Math.max(...memoryStore.itensChecklist.map((i) => i.id)) + 1 : 1;
  const createdItens: ItemChecklist[] = [];

  for (const ip of itensPlano) {
    const itemChk: ItemChecklist = {
      id: nextChkItemId++,
      checklist_id: chkId,
      item_plano_id: ip.id,
      status: 'nao_feito',
      marcado_em: null,
      descricao: ip.descricao,
      ambiente: ip.ambiente,
      ferramentas_necessarias: ip.ferramentas_necessarias,
      data_prevista: ip.data_prevista,
    };
    memoryStore.itensChecklist.push(itemChk);
    createdItens.push(itemChk);
  }

  novoChecklist.itens = createdItens;
  return novoChecklist;
}

export async function obterChecklist(id: number) {
  if (isPostgresReady && pool) {
    const resChk = await pool.query('SELECT * FROM mvp1.checklist WHERE id = $1', [id]);
    if (resChk.rows.length === 0) return null;
    const checklist = resChk.rows[0];

    const resItens = await pool.query(`
      SELECT ic.*, ip.descricao, ip.ambiente, ip.ferramentas_necessarias, ip.data_prevista
      FROM mvp1.item_checklist ic
      JOIN mvp1.item_plano ip ON ip.id = ic.item_plano_id
      WHERE ic.checklist_id = $1
      ORDER BY ic.id ASC
    `, [id]);
    checklist.itens = resItens.rows;

    const resPlano = await pool.query(`
      SELECT p.*, i.identificacao as imovel_identificacao, i.endereco as imovel_endereco,
             i.cidade as imovel_cidade, i.estado as imovel_estado, i.nome_cliente as imovel_cliente
      FROM mvp1.plano_acao p
      JOIN mvp1.imovel i ON i.id = p.imovel_id
      WHERE p.id = $1
    `, [checklist.plano_id]);
    checklist.plano = resPlano.rows[0];

    return checklist;
  }

  const checklist = memoryStore.checklists.find((c) => c.id === id);
  if (!checklist) return null;

  const itens = memoryStore.itensChecklist
    .filter((ic) => ic.checklist_id === id)
    .map((ic) => {
      const ip = memoryStore.itensPlano.find((i) => i.id === ic.item_plano_id);
      return {
        ...ic,
        descricao: ip?.descricao,
        ambiente: ip?.ambiente,
        ferramentas_necessarias: ip?.ferramentas_necessarias,
        data_prevista: ip?.data_prevista,
      };
    });

  const plano = memoryStore.planos.find((p) => p.id === checklist.plano_id);
  const imovel = plano ? memoryStore.imoveis.find((i) => i.id === plano.imovel_id) : undefined;

  return {
    ...checklist,
    itens,
    plano: plano ? {
      ...plano,
      imovel_identificacao: imovel?.identificacao,
      imovel_endereco: imovel?.endereco,
      imovel_cidade: imovel?.cidade,
      imovel_estado: imovel?.estado,
      imovel_cliente: imovel?.nome_cliente,
    } : null,
  };
}

export async function marcarItemChecklist(itemId: number, status: 'feito' | 'nao_feito') {
  if (status !== 'feito' && status !== 'nao_feito') {
    throw new Error("Status deve ser 'feito' ou 'nao_feito'.");
  }

  const agora = new Date().toISOString();

  if (isPostgresReady && pool) {
    const res = await pool.query(
      `UPDATE mvp1.item_checklist
       SET status = $1, marcado_em = $2
       WHERE id = $3 RETURNING *`,
      [status, status === 'feito' ? agora : null, itemId]
    );
    if (res.rows.length === 0) throw new Error('Item do checklist não encontrado.');
    return res.rows[0];
  }

  const idx = memoryStore.itensChecklist.findIndex((i) => i.id === itemId);
  if (idx === -1) throw new Error('Item do checklist não encontrado.');

  memoryStore.itensChecklist[idx].status = status;
  memoryStore.itensChecklist[idx].marcado_em = status === 'feito' ? agora : null;

  return memoryStore.itensChecklist[idx];
}

// ==========================================
// UC12 - UC13: Relatório Service
// ==========================================
export async function salvarRelatorio(imovelId: number, checklistId: number, pdfBuffer: Buffer): Promise<number> {
  if (isPostgresReady && pool) {
    const res = await pool.query(
      `INSERT INTO mvp1.relatorio (imovel_id, checklist_id, arquivo_pdf)
       VALUES ($1, $2, $3) RETURNING id`,
      [imovelId, checklistId, pdfBuffer]
    );
    return res.rows[0].id;
  }

  const relId = memoryStore.relatorios.length ? Math.max(...memoryStore.relatorios.map((r) => r.id)) + 1 : 1;
  memoryStore.relatorios.push({
    id: relId,
    imovel_id: imovelId,
    checklist_id: checklistId,
    gerado_em: new Date().toISOString(),
    pdfBase64: pdfBuffer.toString('base64'),
  });
  return relId;
}

export async function obterRelatorioPdf(id: number): Promise<{ buffer: Buffer; imovelId: number } | null> {
  if (isPostgresReady && pool) {
    const res = await pool.query('SELECT imovel_id, arquivo_pdf FROM mvp1.relatorio WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return {
      buffer: res.rows[0].arquivo_pdf,
      imovelId: res.rows[0].imovel_id,
    };
  }

  const rel = memoryStore.relatorios.find((r) => r.id === id);
  if (!rel) return null;
  return {
    buffer: Buffer.from(rel.pdfBase64, 'base64'),
    imovelId: rel.imovel_id,
  };
}
