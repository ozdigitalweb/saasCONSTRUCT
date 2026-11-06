# Guia de Deploy no VPS Particular (saasCONSTRUCT - MVP 1)

Este guia contém todas as instruções para você colocar o **saasCONSTRUCT MVP 1** no ar no seu servidor VPS particular (DigitalOcean, Hetzner, AWS EC2, Linode, Contabo, etc.).

---

## 🚀 Método 1: Deploy com Docker Compose (Mais Fácil e Rápido)

### 1. Conectar na sua VPS
```bash
ssh root@SEU_IP_VPS
```

### 2. Clonar ou copiar o projeto para a VPS
```bash
git clone <seu-repositorio> saasconstruct
cd saasconstruct
```

### 3. Executar o script de deploy automatizado
```bash
chmod +x deploy-vps.sh
./deploy-vps.sh
```
Ou diretamente:
```bash
docker-compose up -d --build
```

Os contêineres serão iniciados:
- **saasconstruct_db**: PostgreSQL 16 com schema `mvp1` e os scripts 01 a 03 executados automaticamente.
- **saasconstruct_app**: Backend Node.js Express + React frontend na porta 3000.

---

## 🛠️ Método 2: Deploy Direto no Sistema (Node.js + PostgreSQL Nativo)

### 1. Instalar PostgreSQL 16 e Node.js 20
```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib curl git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Executar os 4 Scripts SQL no PostgreSQL
```bash
sudo -u postgres psql -f db/00_criar_banco_e_usuario.sql
sudo -u postgres psql -d postgres -c "ALTER ROLE mvp1_app PASSWORD 'SUA_SENHA_SEGURA';"
sudo -u postgres psql -d mvp1_adequacao -f db/01_criar_tabelas.sql
sudo -u postgres psql -d mvp1_adequacao -f db/02_gatilho_atualizado_em.sql
sudo -u postgres psql -d mvp1_adequacao -f db/03_dados_de_teste_opcional.sql
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://mvp1_app:SUA_SENHA_SEGURA@localhost:5432/mvp1_adequacao
```

### 4. Instalar Dependências e Fazer Build
```bash
npm install
npm run build
```

### 5. Executar em Produção com PM2
```bash
sudo npm install -g pm2
pm2 start "npx tsx server.ts" --name saasconstruct
pm2 save
pm2 startup
```

---

## 🔒 Configuração de Domínio e SSL (Nginx + Let's Encrypt)

- **Domínio Final de Produção**: `saascon.oz.com.br`

```nginx
server {
    server_name saascon.oz.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Para gerar certificado SSL grátis:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d saascon.oz.com.br
```
