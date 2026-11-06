# saasCONSTRUCT · MVP 1
### Sistema de Gestão de Adequação, Montagem de Móveis Planejados e Emissão de Relatórios em PDF

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

---

## 📌 1. Visão Geral do Projeto

O **saasCONSTRUCT (MVP 1)** é um sistema construído sob a metodologia **Mobile-First UX**, alta acessibilidade (**WCAG AA**) e navegação fluida em smartphones, tablets e desktops.

### O Problema que Resolve
A **Karol** entrega apartamentos com móveis planejados instalados e precisa registrar se a montagem foi concluída com sucesso e entregar ao cliente (comprador) um relatório formal de adequação em PDF. Anteriormente, esse controle ocorria de forma dispersa via mensagens e anotações.

### Critério de Sucesso do MVP 1
Geração sem erros do **Relatório em PDF** para cada um dos **15 imóveis fictícios de teste** (em conformidade com a **LGPD**), aprovado pela Karol através de sua **validação soberana**.

---

## 👥 2. Atores do Sistema

No MVP 1 não há sistema de login complexo nem hierarquia de permissões restritivas:

| Ator | Usa o Sistema? | Papel no MVP 1 |
| :--- | :---: | :--- |
| **Karol** | **Sim** | Usuária principal; cadastra imóveis/planos, marca itens do checklist e valida soberanamente o relatório. |
| **Consultor (Santos)** | **Sim** | Cadastra/audita os 15 imóveis fictícios, executa os cenários de teste e valida o fluxo técnico. |
| **Montador** | Não | Recebe o plano por fora (WhatsApp informado é dado cadastral). O retorno do trabalho é lançado pela Karol/Santos. |
| **Cliente da Karol** | Não | Comprador do imóvel; recebe o PDF enviado manualmente pela Karol após a geração no sistema. |
| **Investidor** | Não | Financia as operações; não interage com o sistema no MVP 1. |

> **Nota:** O campo anteriormente denominado "nome do investidor" foi corrigido para **`nome_cliente`** (quem comprou o imóvel e recebe o relatório).

---

## 🔄 3. Fluxo de Dependências & Ciclo de Vida

As entidades seguem uma ordem estrita de criação para garantir a integridade dos dados:

```
[ 1. Imóvel ]
     │ (1:N)
     ▼
[ 2. Plano de Ação ] ──▶ [ 2.1 Itens do Plano ]
     │ (1:1 no MVP 1)
     ▼
[ 3. Checklist Resumido ] ──▶ [ 3.1 Itens do Checklist ('feito' | 'nao_feito') ]
     │
     ▼
[ 4. Relatório em PDF ] (Contém dados do Imóvel, Montador, Checklist e Termo)
```

1. **Imóvel** não depende de nenhuma entidade.
2. **Plano de Ação** exige um imóvel existente e possui um ou mais **Itens do Plano** (descrição, ambiente, ferramentas necessárias, data prevista).
3. **Checklist Resumido** é gerado automaticamente pelo sistema a partir do Plano (inicia todos os itens com status `nao_feito`).
4. **Relatório** junta os dados do Imóvel, Plano e Checklist, gera o documento binário PDF e armazena no banco de dados.

---

## 📋 4. Casos de Uso Implementados (UC01 a UC13)

| Código | Caso de Uso | Método HTTP & Rota | Descrição e Regras de Negócio |
| :--- | :--- | :--- | :--- |
| **UC01** | Cadastrar Imóvel | `POST /api/imoveis` | Cadastra identificação, endereço, cidade, estado (UF 2 letras) e nome do cliente. |
| **UC02** | Consultar Imóveis | `GET /api/imoveis`<br>`GET /api/imoveis/:id` | Lista todos os imóveis ou obtém visão 360º de um imóvel com seus planos, checklists e relatórios. |
| **UC03** | Alterar Imóvel | `PUT /api/imoveis/:id` | Atualiza dados cadastrais. Não altera relatórios já emitidos. |
| **UC04** | Excluir Imóvel | `DELETE /api/imoveis/:id` | Exclui o imóvel. Bloqueado com erro `409 Conflict` se houver planos ou relatórios (`RESTRICT`). |
| **UC05** | Cadastrar Plano de Ação | `POST /api/planos` | Cria plano com nome e WhatsApp do montador e lista de móveis com ferramentas e datas previstas. |
| **UC06** | Consultar Plano de Ação | `GET /api/planos/:id` | Visualiza o plano, todos os seus móveis e status do checklist vinculado. |
| **UC07** | Alterar Plano de Ação | `PUT /api/planos/:id` | Permite alterar dados e itens. Bloqueado (`409`) se o checklist já tiver sido gerado. |
| **UC08** | Excluir Plano de Ação | `DELETE /api/planos/:id` | Exclui o plano e seus itens (`CASCADE`). Bloqueado se houver checklist gerado (`RESTRICT`). |
| **UC09** | Gerar Checklist Resumido | `POST /api/planos/:id/checklist` | Gera checklist a partir dos itens do plano, todos iniciando como `nao_feito`. |
| **UC10** | Consultar Checklist | `GET /api/checklists/:id` | Exibe o checklist com total de itens, concluídos, pendentes e taxa de conclusão (%) com números tabulares. |
| **UC11** | Marcar Item como Feito/Não Feito | `PATCH /api/checklist-itens/:id` | Alterna status instantaneamente via toque mobile com feedback tátil e grava carimbo de data/hora `marcado_em`. |
| **UC12** | Gerar Relatório em PDF | `POST /api/checklists/:id/relatorio` | Gera documento PDF formatado com dados do imóvel, montador, tabela de móveis e termo de validação soberana. |
| **UC13** | Consultar e Baixar PDF | `GET /api/relatorios/:id/pdf` | Efetua o download do binário PDF arquivado sem necessidade de recalcular. |

---

## 🗄️ 5. Banco de Dados (PostgreSQL 16)

Os scripts oficiais de criação e teste encontram-se no diretório `/db`:

| Arquivo | Função |
| :--- | :--- |
| `db/00_criar_banco_e_usuario.sql` | Cria o role `mvp1_app` e a base `mvp1_adequacao`. |
| `db/01_criar_tabelas.sql` | Cria o schema `mvp1`, as 6 tabelas, chaves primárias `BIGINT GENERATED ALWAYS AS IDENTITY`, índices e regras de integridade. |
| `db/02_gatilho_atualizado_em.sql` | Cria função e triggers que atualizam a coluna `atualizado_em` automaticamente a cada `UPDATE`. |
| `db/03_dados_de_teste_opcional.sql` | Insere os 15 imóveis fictícios do plano de teste da Karol e Santos (LGPD). |

### Tabelas do Schema `mvp1`
1. **`imovel`**: `id`, `identificacao`, `endereco`, `cidade`, `estado (CHAR(2))`, `nome_cliente`, `criado_em`, `atualizado_em`.
2. **`plano_acao`**: `id`, `imovel_id (FK)`, `nome_montador`, `whatsapp_montador`, `criado_em`, `atualizado_em`.
3. **`item_plano`**: `id`, `plano_id (FK CASCADE)`, `descricao`, `ambiente`, `ferramentas_necessarias`, `data_prevista (DATE)`, `criado_em`, `atualizado_em`.
4. **`checklist`**: `id`, `plano_id (FK RESTRICT)`, `modelo (DEFAULT 'resumido')`, `gerado_em`.
5. **`item_checklist`**: `id`, `checklist_id (FK CASCADE)`, `item_plano_id (FK RESTRICT)`, `status ('feito' | 'nao_feito')`, `marcado_em`. Restrição única `(checklist_id, item_plano_id)`.
6. **`relatorio`**: `id`, `imovel_id (FK RESTRICT)`, `checklist_id (FK RESTRICT)`, `gerado_em`, `arquivo_pdf (BYTEA)`.

---

## 📱 6. Ergonomia & Mobile-First UX

O aplicativo foi projetado seguindo rigorosas diretrizes de experiência do usuário:
- **Thumb Zone Navigation**: Barra de navegação inferior fixa para operação com apenas um polegar em smartphones, com suporte a safe-areas de tela (`pb-safe`).
- **Alvos de Toque Conformes**: Todos os botões, checkboxes e seletores possuem área de toque $\ge 44\text{px}$ (ou $\ge 48\text{px}$ para CTAs principais).
- **Sem Modais Nativos Bloqueantes**: Não utiliza `window.alert` ou `window.confirm`, usando o componente integrado `<ConfirmModal />` para navegação fluida em iFrames e webviews.
- **Hierarquia Visual sem "AI Slop"**: Tipografia combinada (*Plus Jakarta Sans* e *DM Sans*), números tabulares (`tabular-nums`) e metadados com separadores tipográficos limpos (`·`).
- **Respostas Otimistas**: Ações como marcar itens do checklist atualizam a interface em $< 50\text{ms}$ enquanto sincronizam com o backend em segundo plano.

---

## 🚀 7. Como Executar em Desenvolvimento

### Pré-requisitos
- Node.js 20+ ou 22+
- npm 10+
- *(Opcional)* PostgreSQL 16 local ou remoto (se não informado, o sistema utiliza o emulador em memória pré-populado com os 15 imóveis).

### Instalação e Execução
```bash
# 1. Clonar repositório
git clone <url-do-repositorio> saasconstruct
cd saasconstruct

# 2. Instalar dependências
npm install

# 3. Iniciar servidor Full-Stack (Backend Express + Frontend Vite)
npm run dev
```

Acesse: **`http://localhost:3000`**

---

## 🌐 8. Deploy no seu VPS Particular (Produção)

Você pode implantar o sistema no seu VPS (Ubuntu, Debian, etc.) de duas formas:

### 🔹 Método A: Docker Compose (Recomendado - 1 Comando)

1. **Acessar sua VPS via SSH:**
   ```bash
   ssh root@SEU_IP_VPS
   ```

2. **Clonar o repositório na VPS:**
   ```bash
   git clone <url-do-repositorio> saasconstruct
   cd saasconstruct
   ```

3. **Executar o script automatizado:**
   ```bash
   chmod +x deploy-vps.sh
   ./deploy-vps.sh
   ```
   *Ou diretamente via Docker:*
   ```bash
   docker-compose up -d --build
   ```

Isso subirá:
- **`saasconstruct_db`**: PostgreSQL 16 com volume persistente e scripts `01` a `03` executados automaticamente.
- **`saasconstruct_app`**: Aplicação Node.js Express + React SPA na porta 3000.

---

### 🔹 Método B: Instalação Nativa no Linux (Node.js + PostgreSQL + PM2 + Nginx)

1. **Instalar pacotes básicos no servidor:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y postgresql postgresql-contrib curl git nginx certbot python3-certbot-nginx
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

2. **Executar os Scripts SQL no PostgreSQL:**
   ```bash
   sudo -u postgres psql -f db/00_criar_banco_e_usuario.sql
   sudo -u postgres psql -d postgres -c "ALTER ROLE mvp1_app PASSWORD 'SUA_SENHA_SEGURA';"
   sudo -u postgres psql -d mvp1_adequacao -f db/01_criar_tabelas.sql
   sudo -u postgres psql -d mvp1_adequacao -f db/02_gatilho_atualizado_em.sql
   sudo -u postgres psql -d mvp1_adequacao -f db/03_dados_de_teste_opcional.sql
   ```

3. **Configurar variáveis de ambiente (`.env`):**
   ```bash
   cat <<EOF > .env
   PORT=3000
   NODE_ENV=production
   DATABASE_URL=postgresql://mvp1_app:SUA_SENHA_SEGURA@localhost:5432/mvp1_adequacao
   EOF
   ```

4. **Compilar e Iniciar com PM2:**
   ```bash
   npm install
   npm run build
   sudo npm install -g pm2
   pm2 start "npx tsx server.ts" --name saasconstruct
   pm2 save
   pm2 startup
   ```

5. **Configurar Nginx com HTTPS (Let's Encrypt):**
   Crie `/etc/nginx/sites-available/saasconstruct`:
   ```nginx
   server {
       listen 80;
       server_name seudominio.com.br;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
   Ative o site e emita o certificado SSL:
   ```bash
   sudo ln -s /etc/nginx/sites-available/saasconstruct /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d seudominio.com.br
   ```

---

## 📂 9. Estrutura do Projeto

```
saasconstruct/
├── db/
│   ├── 00_criar_banco_e_usuario.sql     # Criação de usuário e database PostgreSQL
│   ├── 01_criar_tabelas.sql             # Schema mvp1 e as 6 tabelas com chaves identity
│   ├── 02_gatilho_atualizado_em.sql     # Triggers de atualização automática de data/hora
│   ├── 03_dados_de_teste_opcional.sql   # 15 imóveis fictícios do plano de validação
│   └── README_DEPLOY_VPS.md             # Guia complementar de deploy em VPS
├── src/
│   ├── components/
│   │   ├── BottomNav.tsx                # Navegação inferior mobile (Thumb-Zone)
│   │   ├── ChecklistView.tsx            # Checklist resumido com progresso e marcação (UC10/UC11)
│   │   ├── ConfirmModal.tsx             # Modal de confirmação acessível (substitui window.confirm)
│   │   ├── Header.tsx                   # Top bar contract (Marca, Tabs, Indicador de Banco)
│   │   ├── ImoveisView.tsx              # Gestão de imóveis, busca e filtros (UC01 a UC04)
│   │   ├── ImovelDetailModal.tsx        # Visão detalhada do imóvel, planos e relatórios (UC02)
│   │   ├── PlanosView.tsx               # Cadastro e listagem de planos com kits rápidos (UC05 a UC08)
│   │   ├── RelatoriosView.tsx           # Histórico e download dos relatórios em PDF (UC13)
│   │   └── VpsDeployView.tsx            # Painel interativo de status e comandos para VPS
│   ├── server/
│   │   ├── db.ts                        # Camada de banco PostgreSQL (pg.Pool) com fallback em memória
│   │   └── pdf.ts                       # Geração do relatório executivo formal em PDF (jsPDF)
│   ├── services/
│   │   └── api.ts                       # Cliente HTTP frontend tipado com tratamento de erros
│   ├── App.tsx                          # Componente raiz, estados globais e toasts
│   ├── index.css                        # Estilos globais Tailwind v4, safe areas e alvos de toque
│   ├── main.tsx                         # Entry point do React
│   └── types.ts                         # Definições de tipos TypeScript do domínio
├── Dockerfile                           # Dockerfile multi-stage otimizado para produção
├── docker-compose.yml                   # Orquestração do app + PostgreSQL 16
├── deploy-vps.sh                        # Script automatizado de deploy na VPS
├── server.ts                            # Servidor Express Full-Stack (porta 3000, host 0.0.0.0)
├── vite.config.ts                       # Configuração do Vite com Tailwind v4 e React plugin
├── package.json                         # Dependências e scripts de execução
└── tsconfig.json                        # Configurações do compilador TypeScript
```

---

## 🔮 10. Roadmap (Versões Futuras)

| Versão | Itens Previstos |
| :---: | :--- |
| **MVP 2** | Anexo de fotos e mídias das montagens; checklist detalhado com observações por item; cadastro formal de prestadores de serviço. |
| **MVP 3** | Assinatura digital da Karol e do cliente no relatório; indicação de prestadores aptos a receber pagamento. |
| **MVP 4** | Envio automático do PDF do relatório diretamente para o cliente via WhatsApp/E-mail. |
| **MVP 5** | Log completo de auditoria; almoxarifado e controle de inventário de ferramentas dos montadores. |

---

## 📄 Licença

Este projeto é desenvolvido para fins de adequação técnica de imóveis e validação sob licença privada. Todos os dados presentes no modo de teste são fictícios e aderentes à LGPD.
