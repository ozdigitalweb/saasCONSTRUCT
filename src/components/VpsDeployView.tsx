import React, { useState } from 'react';
import { Server, Database, Terminal, Copy, Check, ExternalLink, ShieldCheck, FileCode, CheckCircle2 } from 'lucide-react';
import { DbStatus } from '../types';

interface VpsDeployViewProps {
  dbStatus: DbStatus | null;
  onRefreshHealth: () => void;
}

export const VpsDeployView: React.FC<VpsDeployViewProps> = ({ dbStatus, onRefreshHealth }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'docker' | 'native' | 'sql' | 'env'>('docker');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const dockerCommand = `# 1. No seu servidor VPS (Ubuntu/Debian):
git clone <seu-repo> saasconstruct
cd saasconstruct

# 2. Executar script automatizado de deploy:
chmod +x deploy-vps.sh
./deploy-vps.sh

# Ou diretamente via Docker Compose:
docker-compose up -d --build`;

  const envTemplate = `# Configuração de Produção para seu VPS Particular
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://mvp1_app:SUA_SENHA_SEGURA@localhost:5432/mvp1_adequacao
APP_URL=http://SEU_IP_VPS:3000`;

  const sql00 = `-- Script 00: Criar Banco e Usuário no PostgreSQL
CREATE ROLE mvp1_app LOGIN;
ALTER ROLE mvp1_app PASSWORD 'SUA_SENHA_SEGURA';

CREATE DATABASE mvp1_adequacao
    WITH OWNER = mvp1_app
         ENCODING = 'UTF8'
         TEMPLATE = template0;`;

  const sqlExecutionCommands = `# Como rodar os 4 scripts no PostgreSQL 16 da sua VPS:
psql -d postgres -f db/00_criar_banco_e_usuario.sql
psql -d postgres -c "ALTER ROLE mvp1_app PASSWORD 'SUA_SENHA_SEGURA';"
psql -d mvp1_adequacao -f db/01_criar_tabelas.sql
psql -d mvp1_adequacao -f db/02_gatilho_atualizado_em.sql
psql -d mvp1_adequacao -f db/03_dados_de_teste_opcional.sql`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Server className="w-6 h-6 text-slate-800" />
          Deploy no VPS Particular & Banco PostgreSQL
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Tudo pronto para rodar no seu servidor VPS particular com PostgreSQL 16, Node.js e Docker.
        </p>
      </div>

      {/* Live Status Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
              dbStatus?.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Motor de Dados em Execução:
              </span>
              <h2 className="text-base font-bold text-slate-900">
                {dbStatus?.engine || 'Carregando status...'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshHealth}
              className="touch-target px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Testar Conexão Novamente
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Imóveis Fictícios</span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">
              {dbStatus?.totalImoveis ?? 15}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Planos de Ação</span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">
              {dbStatus?.totalPlanos ?? 0}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Checklists</span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">
              {dbStatus?.totalChecklists ?? 0}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Relatórios PDF</span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">
              {dbStatus?.totalRelatorios ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs for Deploy Method */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('docker')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            activeTab === 'docker' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Docker Compose (Recomendado)
        </button>
        <button
          onClick={() => setActiveTab('sql')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            activeTab === 'sql' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Scripts SQL (00 a 03)
        </button>
        <button
          onClick={() => setActiveTab('env')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            activeTab === 'env' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Variáveis .env
        </button>
        <button
          onClick={() => setActiveTab('native')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            activeTab === 'native' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Instalação Nativa (PM2 + Nginx)
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'docker' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Deploy com Docker & Docker Compose</h3>
              <p className="text-xs text-slate-500">
                O arquivo <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">docker-compose.yml</code> e <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">deploy-vps.sh</code> já foram gerados na raiz do projeto.
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(dockerCommand, 'docker')}
              className="touch-target px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-medium flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
            >
              {copiedKey === 'docker' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'docker' ? 'Copiado!' : 'Copiar Comandos'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto whitespace-pre">
            {dockerCommand}
          </pre>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-semibold text-slate-800 block">O que o Docker Compose executa:</span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li>Sobe container com <strong>PostgreSQL 16</strong> oficial.</li>
              <li>Executa automaticamente os scripts 01 (tabelas), 02 (gatilhos) e 03 (15 imóveis fictícios).</li>
              <li>Constrói e roda o aplicativo React + Node.js Express na porta 3000.</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'sql' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Scripts SQL do PostgreSQL</h3>
              <p className="text-xs text-slate-500">
                Salvos na pasta <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">/db</code> do projeto.
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(sqlExecutionCommands, 'sql')}
              className="touch-target px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-medium flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
            >
              {copiedKey === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'sql' ? 'Copiado!' : 'Copiar Comandos psql'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto whitespace-pre">
            {sqlExecutionCommands}
          </pre>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-800 block">00_criar_banco_e_usuario.sql</span>
              <p className="text-slate-500 text-[11px] mt-0.5">Cria o usuário <code>mvp1_app</code> e o banco <code>mvp1_adequacao</code>.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-800 block">01_criar_tabelas.sql</span>
              <p className="text-slate-500 text-[11px] mt-0.5">Schema <code>mvp1</code> e as 6 tabelas: <code>imovel</code>, <code>plano_acao</code>, <code>item_plano</code>, <code>checklist</code>, <code>item_checklist</code>, <code>relatorio</code>.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-800 block">02_gatilho_atualizado_em.sql</span>
              <p className="text-slate-500 text-[11px] mt-0.5">Gatilho que atualiza o timestamp <code>atualizado_em</code> a cada alteração.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-800 block">03_dados_de_teste_opcional.sql</span>
              <p className="text-slate-500 text-[11px] mt-0.5">15 imóveis fictícios para validação da Karol e Santos (LGPD).</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'env' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Arquivo .env na VPS</h3>
              <p className="text-xs text-slate-500">Crie o arquivo <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">.env</code> na raiz da sua VPS com sua string de conexão.</p>
            </div>
            <button
              onClick={() => copyToClipboard(envTemplate, 'env')}
              className="touch-target px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-medium flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
            >
              {copiedKey === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'env' ? 'Copiado!' : 'Copiar .env'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto whitespace-pre">
            {envTemplate}
          </pre>
        </div>
      )}

      {activeTab === 'native' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 text-xs text-slate-700">
          <h3 className="font-bold text-slate-900 text-sm">Deploy Nativo com Node.js + PM2 + Nginx</h3>
          <p className="text-slate-500">
            Passo a passo completo salvo no arquivo <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">db/README_DEPLOY_VPS.md</code>.
          </p>

          <ol className="list-decimal list-inside space-y-2 pt-2">
            <li><strong>Instalar Node.js 20 e PostgreSQL 16:</strong> <code>sudo apt install -y postgresql nodejs</code></li>
            <li><strong>Executar os scripts SQL:</strong> vide aba "Scripts SQL".</li>
            <li><strong>Build de produção:</strong> <code>npm run build</code></li>
            <li><strong>Iniciar processo com PM2:</strong> <code>pm2 start "npx tsx server.ts" --name saasconstruct</code></li>
            <li><strong>Configurar Nginx com SSL grátis Certbot:</strong> para servir via HTTPS na porta 443.</li>
          </ol>
        </div>
      )}
    </div>
  );
};
