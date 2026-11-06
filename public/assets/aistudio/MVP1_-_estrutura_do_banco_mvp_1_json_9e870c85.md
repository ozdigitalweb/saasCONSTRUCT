```json
{
  "documento": {
    "titulo": "MVP 1 - Scripts de Criação do Banco (PostgreSQL)",
    "data": "16 de out. de 2026",
    "autor": "@Wolf",
    "objetivo_e_como_executar": {
      "descricao": "Estes scripts criam o banco PostgreSQL do MVP 1: seis tabelas, uma para cada classe do documento \"MVP 1 - Classes e Dependências\". Os quatro scripts foram executados do zero num PostgreSQL 16, sem erro, e as regras de bloqueio foram testadas.",
      "observacao": "Os nomes de tabelas e colunas, os tipos e as regras de exclusão são propostas para validação do dev e do DBA. Os campos e a ordem de dependência vêm do que foi decidido.",
      "ordem_execucao": [
        {
          "ordem": 1,
          "script": "00_criar_banco_e_usuario.sql",
          "o_que_faz": "Cria o usuário mvp1_app e o banco mvp1_adequacao",
          "banco_alvo": "postgres",
          "obrigatorio": true
        },
        {
          "ordem": 2,
          "script": "01_criar_tabelas.sql",
          "o_que_faz": "Cria o schema mvp1, as seis tabelas, restrições, índices e permissões",
          "banco_alvo": "mvp1_adequacao",
          "obrigatorio": true
        },
        {
          "ordem": 3,
          "script": "02_gatilho_atualizado_em.sql",
          "o_que_faz": "Atualiza atualizado_em a cada alteração",
          "banco_alvo": "mvp1_adequacao",
          "obrigatorio": true
        },
        {
          "ordem": 4,
          "script": "03_dados_de_teste_opcional.sql",
          "o_que_faz": "Insere 15 imóveis fictícios",
          "banco_alvo": "mvp1_adequacao",
          "obrigatorio": false
        }
      ],
      "exemplo_execucao": [
        "psql -d postgres        -f 00_criar_banco_e_usuario.sql",
        "psql -d mvp1_adequacao  -f 01_criar_tabelas.sql",
        "psql -d mvp1_adequacao  -f 02_gatilho_atualizado_em.sql",
        "psql -d mvp1_adequacao  -f 03_dados_de_teste_opcional.sql"
      ]
    },
    "scripts": [
      {
        "id": "00",
        "nome": "Script 00: banco e usuário",
        "arquivo": "00_criar_banco_e_usuario.sql",
        "instrucoes": "Execute conectado ao banco postgres, como superusuário ou com os privilégios CREATEDB e CREATEROLE. Não rode dentro de uma transação. A senha do mvp1_app não fica no script: defina-a depois, fora do controle de versão.",
        "sql": "-- MVP 1 - Relatorio de Adequacao de Imoveis\n-- Script 00: criar o banco e o usuario da aplicacao\n-- Executar conectado ao banco \"postgres\" como superusuario (ou usuario com CREATEDB e CREATEROLE).\n-- Este script NAO pode rodar dentro de uma transacao (CREATE DATABASE).\n\n-- Usuario da aplicacao. A senha NAO fica no script: defina-a em seguida,\n-- fora do controle de versao, com:  ALTER ROLE mvp1_app PASSWORD '<definir>';\nCREATE ROLE mvp1_app LOGIN;\n\nCREATE DATABASE mvp1_adequacao\n    WITH OWNER = mvp1_app\n         ENCODING = 'UTF8'\n         TEMPLATE = template0;\n\nCOMMENT ON DATABASE mvp1_adequacao IS 'MVP 1 - Relatorio de Adequacao de Imoveis';"
      },
      {
        "id": "01",
        "nome": "Script 01: tabelas",
        "arquivo": "01_criar_tabelas.sql",
        "instrucoes": "Execute conectado ao banco mvp1_adequacao. As tabelas são criadas na ordem de dependência e tudo roda numa transação: se algo falhar, nada fica pela metade. Todas as chaves são geradas pelo banco.",
        "sql": "-- MVP 1 - Relatorio de Adequacao de Imoveis\n-- Script 01: tabelas, chaves, restricoes e indices\n-- Executar conectado ao banco mvp1_adequacao (ex.: psql -d mvp1_adequacao -f 01_criar_tabelas.sql).\n-- Ordem de criacao = ordem de dependencia: imovel > plano_acao > item_plano > checklist > item_checklist > relatorio.\n\nBEGIN;\n\nCREATE SCHEMA IF NOT EXISTS mvp1 AUTHORIZATION mvp1_app;\nSET LOCAL search_path TO mvp1;\n\n-- ---------------------------------------------------------------\n-- Imovel\n-- \"nome_cliente\" guarda o nome de quem comprou o imovel e recebe o relatorio\n-- (na entrevista, o campo se chamava \"nome do investidor\").\n-- ---------------------------------------------------------------\nCREATE TABLE imovel (\n    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n    identificacao   VARCHAR(120) NOT NULL,\n    endereco        VARCHAR(255) NOT NULL,\n    cidade          VARCHAR(100) NOT NULL,\n    estado          CHAR(2)      NOT NULL,\n    nome_cliente    VARCHAR(150) NOT NULL,\n    criado_em       TIMESTAMPTZ  NOT NULL DEFAULT now(),\n    atualizado_em   TIMESTAMPTZ  NOT NULL DEFAULT now(),\n    CONSTRAINT ck_imovel_estado CHECK (estado ~ '^[A-Z]{2}$'),\n    CONSTRAINT ck_imovel_identificacao CHECK (btrim(identificacao) <> ''),\n    CONSTRAINT ck_imovel_nome_cliente CHECK (btrim(nome_cliente) <> '')\n);\nCOMMENT ON TABLE  imovel IS 'Imovel cadastrado pela Karol ou pelo consultor (UC01 a UC04).';\nCOMMENT ON COLUMN imovel.nome_cliente IS 'Cliente da Karol: quem comprou o imovel e recebe o relatorio.';\n\n-- ---------------------------------------------------------------\n-- Plano de Acao\n-- Excluir um imovel que ja tem plano e BLOQUEADO (RESTRICT) ate a decisao do dev (pendencia 1).\n-- ---------------------------------------------------------------\nCREATE TABLE plano_acao (\n    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n    imovel_id             BIGINT       NOT NULL REFERENCES imovel (id) ON DELETE RESTRICT,\n    nome_montador         VARCHAR(150) NOT NULL,\n    whatsapp_montador     VARCHAR(20)  NOT NULL,\n    criado_em             TIMESTAMPTZ  NOT NULL DEFAULT now(),\n    atualizado_em         TIMESTAMPTZ  NOT NULL DEFAULT now(),\n    CONSTRAINT ck_plano_whatsapp CHECK (whatsapp_montador ~ '^[0-9+() -]{8,20}$'),\n    CONSTRAINT ck_plano_montador CHECK (btrim(nome_montador) <> '')\n);\nCREATE INDEX ix_plano_acao_imovel ON plano_acao (imovel_id);\nCOMMENT ON TABLE plano_acao IS 'Plano de acao da montagem dos moveis planejados de um imovel (UC05 a UC08).';\n\n-- ---------------------------------------------------------------\n-- Item do Plano\n-- Excluir o plano exclui os itens (CASCADE), exceto se ja houver checklist (ver item_checklist).\n-- ---------------------------------------------------------------\nCREATE TABLE item_plano (\n    id                        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n    plano_id                  BIGINT       NOT NULL REFERENCES plano_acao (id) ON DELETE CASCADE,\n    descricao                 VARCHAR(255) NOT NULL,\n    ambiente                  VARCHAR(100) NOT NULL,\n    ferramentas_necessarias   VARCHAR(255) NOT NULL,\n    data_prevista             DATE         NOT NULL,\n    criado_em                 TIMESTAMPTZ  NOT NULL DEFAULT now(),\n    atualizado_em             TIMESTAMPTZ  NOT NULL DEFAULT now(),\n    CONSTRAINT ck_item_plano_descricao CHECK (btrim(descricao) <> '')\n);\nCREATE INDEX ix_item_plano_plano ON item_plano (plano_id);\nCOMMENT ON TABLE item_plano IS 'Item do plano de acao. O campo \"posicao onde o movel fica\" nao existe no MVP 1.';\n\n-- ---------------------------------------------------------------\n-- Checklist (gerado pelo sistema a partir do plano; nao e cadastrado pelo usuario)\n-- ---------------------------------------------------------------\nCREATE TABLE checklist (\n    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n    plano_id    BIGINT      NOT NULL REFERENCES plano_acao (id) ON DELETE RESTRICT,\n    modelo      VARCHAR(20) NOT NULL DEFAULT 'resumido',\n    gerado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),\n    CONSTRAINT ck_checklist_modelo CHECK (modelo IN ('resumido'))\n);\nCREATE INDEX ix_checklist_plano ON checklist (plano_id);\nCOMMENT ON TABLE checklist IS 'Checklist resumido gerado a partir do plano (UC09, UC10). O modelo detalhado fica para o MVP 2.';\n\n-- ---------------------------------------------------------------\n-- Item do Checklist\n-- RESTRICT em item_plano_id: nao se remove item do plano que ja tem checklist (pendencia 3).\n-- ---------------------------------------------------------------\nCREATE TABLE item_checklist (\n    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n    checklist_id     BIGINT      NOT NULL REFERENCES checklist (id)  ON DELETE CASCADE,\n    item_plano_id    BIGINT      NOT NULL REFERENCES item_plano (id) ON DELETE RESTRICT,\n    status           VARCHAR(10) NOT NULL DEFAULT 'nao_feito',\n    marcado_em       TIMESTAMPTZ,\n    CONSTRAINT ck_item_checklist_status CHECK (status IN ('feito', 'nao_feito')),\n    CONSTRAINT uq_item_checklist UNIQUE (checklist_id, item_plano_id)\n);\nCREATE INDEX ix_item_checklist_item_plano ON item_checklist (item_plano_id);\nCOMMENT ON TABLE item_checklist IS 'Marcacao de cada item: feito ou nao feito (UC11).';\n\n-- ---------------------------------------------------------------\n-- Relatorio\n-- arquivo_pdf guarda o PDF gerado (pendencia 4: se o dev preferir refazer a cada download,\n-- tornar a coluna anulavel ou remove-la).\n-- ---------------------------------------------------------------\nCREATE TABLE relatorio (\n    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n    imovel_id      BIGINT      NOT NULL REFERENCES imovel (id)    ON DELETE RESTRICT,\n    checklist_id   BIGINT      NOT NULL REFERENCES checklist (id) ON DELETE RESTRICT,\n    gerado_em      TIMESTAMPTZ NOT NULL DEFAULT now(),\n    arquivo_pdf    BYTEA       NOT NULL\n);\nCREATE INDEX ix_relatorio_imovel    ON relatorio (imovel_id);\nCREATE INDEX ix_relatorio_checklist ON relatorio (checklist_id);\nCOMMENT ON TABLE relatorio IS 'Relatorio em PDF gerado a partir do checklist (UC12, UC13).';\n\n-- ---------------------------------------------------------------\n-- Permissoes do usuario da aplicacao (as tabelas pertencem a quem executa o script).\n-- Chaves identity nao exigem permissao extra nas sequencias.\n-- ---------------------------------------------------------------\nGRANT USAGE ON SCHEMA mvp1 TO mvp1_app;\nGRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA mvp1 TO mvp1_app;\n\nCOMMIT;"
      },
      {
        "id": "02",
        "nome": "Script 02: gatilho de alteração",
        "arquivo": "02_gatilho_atualizado_em.sql",
        "instrucoes": "Execute depois do script 01. A cada UPDATE em imóvel, plano de ação ou item do plano, o banco grava a data e hora da alteração em atualizado_em, sem a aplicação precisar lembrar de fazê-lo.",
        "sql": "-- MVP 1 - Relatorio de Adequacao de Imoveis\n-- Script 02: gatilho que atualiza \"atualizado_em\" a cada alteracao\n-- Executar depois do script 01, conectado ao banco mvp1_adequacao.\n\nBEGIN;\n\nCREATE OR REPLACE FUNCTION mvp1.set_atualizado_em()\nRETURNS trigger\nLANGUAGE plpgsql\nAS $$\nBEGIN\n    NEW.atualizado_em := now();\n    RETURN NEW;\nEND;\n$$;\n\nCREATE TRIGGER tg_imovel_atualizado_em\n    BEFORE UPDATE ON mvp1.imovel\n    FOR EACH ROW EXECUTE FUNCTION mvp1.set_atualizado_em();\n\nCREATE TRIGGER tg_plano_acao_atualizado_em\n    BEFORE UPDATE ON mvp1.plano_acao\n    FOR EACH ROW EXECUTE FUNCTION mvp1.set_atualizado_em();\n\nCREATE TRIGGER tg_item_plano_atualizado_em\n    BEFORE UPDATE ON mvp1.item_plano\n    FOR EACH ROW EXECUTE FUNCTION mvp1.set_atualizado_em();\n\nCOMMIT;"
      },
      {
        "id": "03",
        "nome": "Script 03 (opcional): dados de teste",
        "arquivo": "03_dados_de_teste_opcional.sql",
        "instrucoes": "Insere os 15 imóveis fictícios do critério de validação do MVP 1. Nenhum imóvel, endereço ou cliente é real, em conformidade com a LGPD. Os planos e checklists ficam para o consultor cadastrar pelo sistema.",
        "sql": "-- MVP 1 - Relatorio de Adequacao de Imoveis\n-- Script 03 (OPCIONAL): 15 imoveis ficticios para os testes\n-- Todos os dados sao ficticios, em conformidade com a LGPD: nenhum imovel, endereco ou cliente e real.\n-- Executar depois dos scripts 01 e 02, conectado ao banco mvp1_adequacao.\n-- Para repetir o teste do zero, execute antes: TRUNCATE mvp1.imovel RESTART IDENTITY CASCADE;\n\nBEGIN;\n\nINSERT INTO mvp1.imovel (identificacao, endereco, cidade, estado, nome_cliente)\nSELECT\n    'TESTE ' || lpad(n::text, 2, '0'),\n    'Rua Ficticia ' || n || ', apto ' || (100 + n),\n    'Cidade de Teste',\n    'SP',\n    'Cliente Ficticio ' || lpad(n::text, 2, '0')\nFROM generate_series(1, 15) AS n;\n\nCOMMIT;"
      }
    ],
    "regras_assumidas_e_pendencias": {
      "descricao": "O que os scripts fazem hoje onde o dev ainda não decidiu. Cada item é uma pendência do documento de classes.",
      "pendencias": [
        {
          "id": 1,
          "decisao_em_aberto": "Excluir imóvel que já tem plano",
          "o_que_o_script_assume": "Bloqueia (RESTRICT)",
          "para_mudar": "Trocar por CASCADE em plano_acao.imovel_id"
        },
        {
          "id": 2,
          "decisao_em_aberto": "Excluir plano que já tem checklist",
          "o_que_o_script_assume": "Bloqueia; sem checklist, os itens saem junto",
          "para_mudar": "Trocar por CASCADE em checklist.plano_id"
        },
        {
          "id": 3,
          "decisao_em_aberto": "Alterar o plano depois do checklist",
          "o_que_o_script_assume": "Bloqueia remover item que já tem checklist",
          "para_mudar": "Trocar por CASCADE em item_checklist.item_plano_id"
        },
        {
          "id": 4,
          "decisao_em_aberto": "Relatório já gerado",
          "o_que_o_script_assume": "Guarda o PDF no banco (BYTEA NOT NULL)",
          "para_mudar": "Tornar a coluna anulável ou removê-la"
        },
        {
          "id": 5,
          "decisao_em_aberto": "Tipos e chaves",
          "o_que_o_script_assume": "Chave BIGINT gerada pelo banco; UF com 2 letras maiúsculas; WhatsApp com 8 a 20 caracteres entre dígitos, +, (), espaço e -",
          "para_mudar": "DBA ajusta os tipos e as restrições"
        }
      ],
      "observacoes_adicionais": "Ainda sem decisão, e por isso sem restrição no banco: um imóvel pode ter mais de um plano, e um plano pode ter mais de um checklist."
    },
    "testes_e_validacoes": {
      "ambiente": "PostgreSQL 16 limpo, executado como superusuário e conexões de fluxo/recusas como mvp1_app",
      "resultados": [
        "Os scripts 00 a 03 rodam em sequência sem erro e criam as seis tabelas e os 15 imóveis.",
        "O fluxo completo funciona: plano, itens, checklist, marcação de item e relatório.",
        "O gatilho atualiza atualizado_em.",
        "O banco recusa: excluir imóvel com plano, UF em minúscula, status fora de 'feito' e 'nao_feito', item repetido no mesmo checklist, remover item que já tem checklist e WhatsApp inválido."
      ]
    },
    "proximos_passos": [
      "Dev (Krautein): responder as pendências 1 a 4.",
      "Wolf e DBA: validar nomes, tipos e restrições (pendência 5).",
      "DBA: definir a política de senha e de cópia de segurança do usuário mvp1_app e do banco."
    ]
  }
}
```