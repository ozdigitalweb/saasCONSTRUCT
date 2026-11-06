-- MVP 1 - Relatorio de Adequacao de Imoveis (saasCONSTRUCT)
-- Script 01: tabelas, chaves, restricoes e indices
-- Executar conectado ao banco mvp1_adequacao (ex.: psql -d mvp1_adequacao -f 01_criar_tabelas.sql).
-- Ordem de criacao = ordem de dependencia: imovel > plano_acao > item_plano > checklist > item_checklist > relatorio.

BEGIN;

CREATE SCHEMA IF NOT EXISTS mvp1 AUTHORIZATION mvp1_app;
SET LOCAL search_path TO mvp1;

-- ---------------------------------------------------------------
-- Imovel
-- "nome_cliente" guarda o nome de quem comprou o imovel e recebe o relatorio
-- (na entrevista, o campo se chamava "nome do investidor").
-- ---------------------------------------------------------------
CREATE TABLE imovel (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    identificacao   VARCHAR(120) NOT NULL,
    endereco        VARCHAR(255) NOT NULL,
    cidade          VARCHAR(100) NOT NULL,
    estado          CHAR(2)      NOT NULL,
    nome_cliente    VARCHAR(150) NOT NULL,
    criado_em       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    atualizado_em   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_imovel_estado CHECK (estado ~ '^[A-Z]{2}$'),
    CONSTRAINT ck_imovel_identificacao CHECK (btrim(identificacao) <> ''),
    CONSTRAINT ck_imovel_nome_cliente CHECK (btrim(nome_cliente) <> '')
);
COMMENT ON TABLE  imovel IS 'Imovel cadastrado pela Karol ou pelo consultor (UC01 a UC04).';
COMMENT ON COLUMN imovel.nome_cliente IS 'Cliente da Karol: quem comprou o imovel e recebe o relatorio.';

-- ---------------------------------------------------------------
-- Plano de Acao
-- Excluir um imovel que ja tem plano e BLOQUEADO (RESTRICT) ate a decisao do dev (pendencia 1).
-- ---------------------------------------------------------------
CREATE TABLE plano_acao (
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    imovel_id             BIGINT       NOT NULL REFERENCES imovel (id) ON DELETE RESTRICT,
    nome_montador         VARCHAR(150) NOT NULL,
    whatsapp_montador     VARCHAR(20)  NOT NULL,
    criado_em             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    atualizado_em         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_plano_whatsapp CHECK (whatsapp_montador ~ '^[0-9+() -]{8,20}$'),
    CONSTRAINT ck_plano_montador CHECK (btrim(nome_montador) <> '')
);
CREATE INDEX ix_plano_acao_imovel ON plano_acao (imovel_id);
COMMENT ON TABLE plano_acao IS 'Plano de acao da montagem dos moveis planejados de um imovel (UC05 a UC08).';

-- ---------------------------------------------------------------
-- Item do Plano
-- Excluir o plano exclui os itens (CASCADE), exceto se ja houver checklist (ver item_checklist).
-- ---------------------------------------------------------------
CREATE TABLE item_plano (
    id                        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    plano_id                  BIGINT       NOT NULL REFERENCES plano_acao (id) ON DELETE CASCADE,
    descricao                 VARCHAR(255) NOT NULL,
    ambiente                  VARCHAR(100) NOT NULL,
    ferramentas_necessarias   VARCHAR(255) NOT NULL,
    data_prevista             DATE         NOT NULL,
    criado_em                 TIMESTAMPTZ  NOT NULL DEFAULT now(),
    atualizado_em             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_item_plano_descricao CHECK (btrim(descricao) <> '')
);
CREATE INDEX ix_item_plano_plano ON item_plano (plano_id);
COMMENT ON TABLE item_plano IS 'Item do plano de acao. O campo "posicao onde o movel fica" nao existe no MVP 1.';

-- ---------------------------------------------------------------
-- Checklist (gerado pelo sistema a partir do plano; nao e cadastrado pelo usuario)
-- ---------------------------------------------------------------
CREATE TABLE checklist (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    plano_id    BIGINT      NOT NULL REFERENCES plano_acao (id) ON DELETE RESTRICT,
    modelo      VARCHAR(20) NOT NULL DEFAULT 'resumido',
    gerado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_checklist_modelo CHECK (modelo IN ('resumido'))
);
CREATE INDEX ix_checklist_plano ON checklist (plano_id);
COMMENT ON TABLE checklist IS 'Checklist resumido gerado a partir do plano (UC09, UC10). O modelo detalhado fica para o MVP 2.';

-- ---------------------------------------------------------------
-- Item do Checklist
-- RESTRICT em item_plano_id: nao se remove item do plano que ja tem checklist (pendencia 3).
-- ---------------------------------------------------------------
CREATE TABLE item_checklist (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    checklist_id     BIGINT      NOT NULL REFERENCES checklist (id)  ON DELETE CASCADE,
    item_plano_id    BIGINT      NOT NULL REFERENCES item_plano (id) ON DELETE RESTRICT,
    status           VARCHAR(10) NOT NULL DEFAULT 'nao_feito',
    marcado_em       TIMESTAMPTZ,
    CONSTRAINT ck_item_checklist_status CHECK (status IN ('feito', 'nao_feito')),
    CONSTRAINT uq_item_checklist UNIQUE (checklist_id, item_plano_id)
);
CREATE INDEX ix_item_checklist_item_plano ON item_checklist (item_plano_id);
COMMENT ON TABLE item_checklist IS 'Marcacao de cada item: feito ou nao feito (UC11).';

-- ---------------------------------------------------------------
-- Relatorio
-- arquivo_pdf guarda o PDF gerado (BYTEA).
-- ---------------------------------------------------------------
CREATE TABLE relatorio (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    imovel_id      BIGINT      NOT NULL REFERENCES imovel (id)    ON DELETE RESTRICT,
    checklist_id   BIGINT      NOT NULL REFERENCES checklist (id) ON DELETE RESTRICT,
    gerado_em      TIMESTAMPTZ NOT NULL DEFAULT now(),
    arquivo_pdf    BYTEA       NOT NULL
);
CREATE INDEX ix_relatorio_imovel    ON relatorio (imovel_id);
CREATE INDEX ix_relatorio_checklist ON relatorio (checklist_id);
COMMENT ON TABLE relatorio IS 'Relatorio em PDF gerado a partir do checklist (UC12, UC13).';

-- ---------------------------------------------------------------
-- Permissoes do usuario da aplicacao
-- ---------------------------------------------------------------
GRANT USAGE ON SCHEMA mvp1 TO mvp1_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA mvp1 TO mvp1_app;

COMMIT;
