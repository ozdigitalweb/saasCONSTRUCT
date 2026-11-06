-- MVP 1 - Relatorio de Adequacao de Imoveis (saasCONSTRUCT)
-- Script 00: criar o banco e o usuario da aplicacao
-- Executar conectado ao banco "postgres" como superusuario (ou usuario com CREATEDB e CREATEROLE).
-- Este script NAO pode rodar dentro de uma transacao (CREATE DATABASE).

-- Usuario da aplicacao. Defina uma senha segura para producao:
CREATE ROLE mvp1_app LOGIN;
ALTER ROLE mvp1_app PASSWORD 'mvp1_senha_segura';

CREATE DATABASE mvp1_adequacao
    WITH OWNER = mvp1_app
         ENCODING = 'UTF8'
         TEMPLATE = template0;

COMMENT ON DATABASE mvp1_adequacao IS 'MVP 1 - Relatorio de Adequacao de Imoveis';
