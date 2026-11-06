import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  initDatabase,
  getDbStatus,
  listarImoveis,
  obterImovel,
  criarImovel,
  alterarImovel,
  excluirImovel,
  criarPlano,
  obterPlano,
  alterarPlano,
  excluirPlano,
  gerarChecklist,
  obterChecklist,
  marcarItemChecklist,
  salvarRelatorio,
  obterRelatorioPdf,
  memoryStore,
} from './src/server/db.js';
import { gerarPdfRelatorio } from './src/server/pdf.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Parse command line arguments (--port, --host) or default strictly to port 3000 and host 0.0.0.0.
// Do not blindly use process.env.PORT in dev because Cloud Run sets PORT=8080 which conflicts with port 3000.
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const portFromArgs = portIndex !== -1 && args[portIndex + 1] ? Number(args[portIndex + 1]) : null;
const hostIndex = args.indexOf('--host');
const hostFromArgs = hostIndex !== -1 && args[hostIndex + 1] ? args[hostIndex + 1] : null;

const PORT = portFromArgs || 3000;
const HOST = hostFromArgs || '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize DB layer
initDatabase().catch((err) => {
  console.error('[SERVER] Falha ao inicializar banco de dados:', err);
});

// ==============================================================================
// 1. Health & Database Status
// ==============================================================================
app.get('/api/health', (req, res) => {
  const status = getDbStatus();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ...status,
  });
});

app.post('/api/test/reset-seed', (req, res) => {
  memoryStore.resetSeed();
  res.json({ message: 'Base de dados de teste restaurada para os 15 imóveis do Script 03 com sucesso.' });
});

// ==============================================================================
// 2. Imóvel: UC01 a UC04
// ==============================================================================
app.get('/api/imoveis', async (req, res) => {
  try {
    const imoveis = await listarImoveis();
    res.json(imoveis);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/imoveis/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });
    const imovel = await obterImovel(id);
    if (!imovel) return res.status(404).json({ error: 'Imóvel não encontrado.' });
    res.json(imovel);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/imoveis', async (req, res) => {
  try {
    const { identificacao, endereco, cidade, estado, nome_cliente } = req.body;
    if (!identificacao || !endereco || !cidade || !estado || !nome_cliente) {
      return res.status(400).json({ error: 'Todos os 5 campos são obrigatórios (identificação, endereço, cidade, estado e nome do cliente).' });
    }
    const novo = await criarImovel({ identificacao, endereco, cidade, estado, nome_cliente });
    res.status(201).json(novo);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/imoveis/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });
    const { identificacao, endereco, cidade, estado, nome_cliente } = req.body;
    if (!identificacao || !endereco || !cidade || !estado || !nome_cliente) {
      return res.status(400).json({ error: 'Todos os 5 campos são obrigatórios.' });
    }
    const atualizado = await alterarImovel(id, { identificacao, endereco, cidade, estado, nome_cliente });
    res.json(atualizado);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/imoveis/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });
    await excluirImovel(id);
    res.json({ success: true, message: 'Imóvel excluído com sucesso.' });
  } catch (err: any) {
    res.status(409).json({ error: err.message });
  }
});

// ==============================================================================
// 3. Plano de Ação: UC05 a UC08
// ==============================================================================
app.post('/api/planos', async (req, res) => {
  try {
    const { imovel_id, nome_montador, whatsapp_montador, itens } = req.body;
    if (!imovel_id || !nome_montador || !whatsapp_montador) {
      return res.status(400).json({ error: 'Imóvel, nome do montador e WhatsApp são obrigatórios.' });
    }
    if (!Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ error: 'O plano de ação deve conter pelo menos um item.' });
    }
    const plano = await criarPlano({ imovel_id: Number(imovel_id), nome_montador, whatsapp_montador, itens });
    res.status(201).json(plano);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/planos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });
    const plano = await obterPlano(id);
    if (!plano) return res.status(404).json({ error: 'Plano de ação não encontrado.' });
    res.json(plano);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/planos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });
    const { nome_montador, whatsapp_montador, itens } = req.body;
    if (!nome_montador || !whatsapp_montador || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ error: 'Campos do montador e lista de itens são obrigatórios.' });
    }
    const plano = await alterarPlano(id, { nome_montador, whatsapp_montador, itens });
    res.json(plano);
  } catch (err: any) {
    res.status(409).json({ error: err.message });
  }
});

app.delete('/api/planos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });
    await excluirPlano(id);
    res.json({ success: true, message: 'Plano de ação excluído com sucesso.' });
  } catch (err: any) {
    res.status(409).json({ error: err.message });
  }
});

// ==============================================================================
// 4. Checklist: UC09 a UC11
// ==============================================================================
app.post('/api/planos/:id/checklist', async (req, res) => {
  try {
    const planoId = Number(req.params.id);
    if (isNaN(planoId)) return res.status(400).json({ error: 'ID inválido.' });
    const checklist = await gerarChecklist(planoId);
    res.status(201).json(checklist);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/checklists/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });
    const checklist = await obterChecklist(id);
    if (!checklist) return res.status(404).json({ error: 'Checklist não encontrado.' });
    res.json(checklist);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/checklist-itens/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });
    const { status } = req.body;
    if (status !== 'feito' && status !== 'nao_feito') {
      return res.status(400).json({ error: "Status deve ser 'feito' ou 'nao_feito'." });
    }
    const item = await marcarItemChecklist(id, status);
    res.json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==============================================================================
// 5. Relatório: UC12 e UC13
// ==============================================================================
app.post('/api/checklists/:id/relatorio', async (req, res) => {
  try {
    const checklistId = Number(req.params.id);
    if (isNaN(checklistId)) return res.status(400).json({ error: 'ID inválido.' });

    const checklist = await obterChecklist(checklistId);
    if (!checklist) return res.status(404).json({ error: 'Checklist não encontrado.' });

    const plano = await obterPlano(checklist.plano_id);
    if (!plano) return res.status(404).json({ error: 'Plano não encontrado.' });

    const imovel = await obterImovel(plano.imovel_id);
    if (!imovel) return res.status(404).json({ error: 'Imóvel não encontrado.' });

    const pdfBuffer = gerarPdfRelatorio(imovel, plano, checklist);
    const relatorioId = await salvarRelatorio(imovel.id, checklist.id, pdfBuffer);

    res.status(201).json({
      id: relatorioId,
      imovel_id: imovel.id,
      checklist_id: checklist.id,
      gerado_em: new Date().toISOString(),
      download_url: `/api/relatorios/${relatorioId}/pdf`,
      message: 'Relatório em PDF gerado com sucesso.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/relatorios/:id/pdf', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

    const relatorio = await obterRelatorioPdf(id);
    if (!relatorio || !relatorio.buffer) {
      return res.status(404).json({ error: 'Relatório em PDF não encontrado.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio_adequacao_imovel_${relatorio.imovelId}.pdf"`);
    res.send(relatorio.buffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// Vite Dev Server / Static Production Server
// ==============================================================================
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback to index.html for any SPA non-API GET requests
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const fs = await import('fs');
        const indexPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[SERVER] saasCONSTRUCT rodando em http://${HOST}:${PORT} (modo ${isProduction ? 'produção' : 'desenvolvimento'})`);
  });
}

startServer().catch((err) => {
  console.error('[SERVER] Erro fatal ao iniciar o servidor:', err);
});
