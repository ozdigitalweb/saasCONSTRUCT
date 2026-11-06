# saasCONSTRUCT · MVP 1: conhecimento completo da conversa

Exportado em 20/10/2026. Base: documentos de 16/10/2026 (@Wolf) e o protótipo gerado nesta conversa.

## 1. Resumo do projeto

O MVP 1 é um sistema simples para a Karol, que entrega apartamentos com móveis planejados, registrar se a montagem foi feita e entregar ao cliente um relatório em PDF. Hoje esse controle acontece fora de um sistema. O MVP 1 testa se dá para substituí-lo com o mínimo de funcionalidade.

O escopo cobre só o fluxo principal: cadastrar o imóvel e o plano de ação da montagem dos móveis planejados, gerar o checklist resumido (feito ou não feito) e gerar o relatório em PDF.

**Critério de sucesso:** relatório gerado sem erro para cada um dos 15 imóveis de teste, e aprovado pela Karol ao compará-lo com os que ela usa hoje (validação soberana).

## 2. Atores

Só dois atores usam o sistema, com o mesmo acesso total. Não há login nem aprovação.

| Ator | Usa o sistema? | Papel |
| --- | --- | --- |
| Karol | Sim | Usuária principal; valida o relatório |
| Consultor (Santos) | Sim | Cadastra os 15 imóveis fictícios, executa e registra os testes |
| Montador | Não | Recebe o plano por fora; o que ele fez chega à Karol ou ao consultor fora do sistema |
| Cliente da Karol | Não | Quem comprou o imóvel; recebe o PDF enviado manualmente pela Karol |
| Investidor da Karol | Não | Financia a Karol; não aparece no sistema |

Atenção: o campo que a entrevista chamou de "nome do investidor" guarda, na verdade, o **nome do cliente** (quem comprou o imóvel).

## 3. Fluxo e dependências

1. **Imóvel** não depende de nada.
2. **Plano de Ação** precisa de um Imóvel e tem um ou mais **Itens do Plano**. Um plano real tem cerca de 100 itens.
3. **Checklist** é gerado pelo sistema a partir de um Plano, com um **Item do Checklist** "não feito" para cada Item do Plano.
4. **Relatório** é gerado a partir do Checklist, com os dados do Imóvel e do Plano.

As leituras vão sempre de cima para baixo na cadeia (Relatório lê Checklist, Plano e Imóvel; Checklist lê Plano; Plano lê Imóvel), o que evita dependência circular. Só a tela de consulta do imóvel (UC02) olha no sentido contrário, e apenas junta dados já gravados.

## 4. Casos de uso (13)

| Código | Caso de uso | Status |
| --- | --- | --- |
| UC01 | Cadastrar imóvel | Decidido |
| UC02 | Consultar imóveis | Decidido |
| UC03 | Alterar imóvel | Decidido |
| UC04 | Excluir imóvel | Decidido (regra de cascata a validar) |
| UC05 | Cadastrar plano de ação | Decidido |
| UC06 | Consultar plano de ação | Decidido |
| UC07 | Alterar plano de ação | Decidido (refazer checklist a validar) |
| UC08 | Excluir plano de ação | Decidido (regra a validar) |
| UC09 | Gerar checklist resumido | Decidido |
| UC10 | Consultar checklist | Decidido |
| UC11 | Marcar item como feito ou não feito | Decidido |
| UC12 | Gerar relatório em PDF | Decidido |
| UC13 | Consultar e baixar relatório | Proposta |

Pontos relevantes:
- UC01: cinco campos (identificação, endereço, cidade, estado, nome do cliente); proposta de todos obrigatórios. Imóveis do MVP 1 são fictícios (LGPD).
- UC05: pré-condição de imóvel cadastrado. Campos do plano: imóvel, nome e WhatsApp do montador. Campos do item: descrição, ambiente, ferramentas necessárias, data prevista. O campo "posição onde o móvel fica" **não existe** no MVP 1. O sistema não envia o plano ao montador; o WhatsApp é só dado cadastral.
- UC09: exige plano com pelo menos um item. Só existe o modelo resumido.
- UC11: grava status e data/hora; o usuário pode voltar atrás (proposta). Sem foto, observação ou assinatura.
- UC12: pode ser gerado com itens pendentes (proposta); o PDF mostra o que ficou pendente. O sistema não envia o PDF a ninguém.
- Alterar e excluir entraram no MVP 1 por decisão de 16/10.

## 5. Classes (6)

| Classe | Campos principais |
| --- | --- |
| Imóvel | id, identificação, endereço, cidade, estado (UF), nome do cliente |
| Plano de Ação | id, imóvel, nome do montador, WhatsApp do montador |
| Item do Plano | id, plano, descrição, ambiente, ferramentas necessárias, data prevista |
| Checklist | id, plano, modelo ("resumido"), gerado em |
| Item do Checklist | id, checklist, item do plano, status (feito/não feito, começa "não feito"), marcado em |
| Relatório | id, imóvel, checklist, gerado em, arquivo PDF |

Métodos propostos (o dev pode renomear): Imóvel `criar/listar/obter/alterar/excluir`; Plano `criar/obter/alterar/excluir`; Checklist `gerarDe(plano)/obter`; Item do Checklist `marcar`; Relatório `gerarDe(checklist)/listar/baixar`.

Nunca acontece no MVP 1: envio por WhatsApp, contato com o montador, pagamento de prestador, validação de pagamento do cliente.

## 6. Banco de dados (PostgreSQL)

Quatro scripts, executados do zero num PostgreSQL 16 sem erro (segundo o documento de @Wolf):

| Ordem | Script | Faz |
| --- | --- | --- |
| 1 | `00_criar_banco_e_usuario.sql` | Cria o usuário `mvp1_app` e o banco `mvp1_adequacao` |
| 2 | `01_criar_tabelas.sql` | Schema `mvp1`, seis tabelas, restrições, índices e permissões |
| 3 | `02_gatilho_atualizado_em.sql` | Gatilho que atualiza `atualizado_em` |
| 4 | `03_dados_de_teste_opcional.sql` | 15 imóveis fictícios |

Tabelas: `imovel`, `plano_acao`, `item_plano`, `checklist`, `item_checklist`, `relatorio`. Chaves BIGINT geradas pelo banco. Restrições: UF com 2 letras maiúsculas; WhatsApp com 8 a 20 caracteres entre dígitos, `+`, `()`, espaço e `-`; status só `feito` ou `nao_feito`; item único por checklist. A senha do `mvp1_app` não fica no script.

Ainda sem restrição no banco: um imóvel pode ter mais de um plano, e um plano pode ter mais de um checklist.

## 7. Pendências em aberto

| # | Decisão | Quem decide | Assumido hoje (scripts e protótipo) |
| --- | --- | --- | --- |
| 1 | Excluir imóvel que já tem plano | Dev (Krautein) | Bloqueia (RESTRICT) |
| 2 | Excluir plano que já tem checklist | Dev (Krautein) | Bloqueia; sem checklist, os itens saem junto |
| 3 | Alterar plano depois do checklist | Dev e consultoria | Bloqueia |
| 4 | Relatório já gerado | Dev (Krautein) | Guarda o PDF fixo no banco (BYTEA) |
| 5 | Tipos dos campos e chaves | Wolf e DBA | BIGINT, UF, telefone como acima |
| 6 | Data do protótipo do MVP 1 | Dev (Krautein) | Sem data |

Outras tarefas: consultoria transformar cada caso de uso em cenários de teste no modelo MÓDULO, CENÁRIO, ERRO, SOLICITO; DBA definir política de senha e de cópia de segurança.

## 8. Fora do escopo (roadmap)

| Item | Quando entra |
| --- | --- |
| Fotos e mídias; checklist detalhado com observação; cadastro de prestador | MVP 2 |
| Assinatura digital; indicar prestadores aptos a receber pagamento | MVP 3 |
| Envio do PDF ao cliente | MVP 4 |
| Log de uso; inventário de ferramentas e almoxarifado | MVP 5 |
| Acesso do montador, login, WhatsApp, notificações, outros blocos da planilha | Sem data |

## 9. Decisões tomadas nesta conversa

- Protótipo em **React + TypeScript**, **HTML e CSS**, banco **PostgreSQL**.
- Backend em **Node.js usando a biblioteca `pg`** (acrescentei Express e TypeScript; PDF com PDFKit).
- Instrução de trabalho: não executar nada até o comando explícito; a execução começou depois que a stack foi confirmada.

## 10. Protótipo gerado (`mvp1-prototipo.zip`)

**Estado: gerado, mas não executado nem testado** (o ambiente de geração não tinha rede nem PostgreSQL).

```
mvp1-prototipo/
├── README.md
├── db/            (scripts 00 a 03, sem alteração)
├── backend/       Node + TypeScript + Express + pg + PDFKit
│   └── src/ db.ts, pdf.ts, routes.ts, server.ts
└── frontend/      React + TypeScript + Vite, CSS puro
    └── src/ App.tsx, api.ts, types.ts, styles.css, pages/
        (ImoveisPage, ImovelPage, PlanoFormPage, PlanoPage, ChecklistPage)
```

### API

| Classe | Rotas |
| --- | --- |
| Imóvel | GET/POST `/api/imoveis`; GET/PUT/DELETE `/api/imoveis/:id` |
| Plano | POST `/api/planos`; GET/PUT/DELETE `/api/planos/:id` |
| Checklist | POST `/api/planos/:id/checklist`; GET `/api/checklists/:id`; PATCH `/api/checklist-itens/:id` |
| Relatório | POST `/api/checklists/:id/relatorio`; GET `/api/relatorios/:id/pdf` |

Erros de chave estrangeira viram resposta 409 com mensagem em português; validações de campo viram 400.

### Regras provisórias implementadas

1. Excluir imóvel com plano ou relatório: bloqueado.
2. Excluir plano com checklist: bloqueado.
3. Alterar plano com checklist gerado: bloqueado (409).
4. PDF gerado uma vez e guardado no banco; baixar não refaz.
5. Um plano tem no máximo um checklist (regra só da aplicação; **foi a única decisão acrescentada além dos scripts**).

### Como rodar

```
# Banco
psql -d postgres        -f db/00_criar_banco_e_usuario.sql
psql -d postgres        -c "ALTER ROLE mvp1_app PASSWORD 'SUA_SENHA'"
psql -d mvp1_adequacao  -f db/01_criar_tabelas.sql
psql -d mvp1_adequacao  -f db/02_gatilho_atualizado_em.sql
psql -d mvp1_adequacao  -f db/03_dados_de_teste_opcional.sql

# Backend (porta 3001)
cd backend && cp .env.example .env   # ajustar DATABASE_URL
npm install && npm run dev

# Frontend (porta 5173)
cd frontend && npm install && npm run dev
```

## 11. Próximos passos

- Rodar o protótipo, reportar erros e corrigir.
- Opcional: script que cadastre os 15 planos e checklists de teste de uma vez (hoje só os 15 imóveis são criados pelo script 03).
- Dev (Krautein): validar nomes, tipos, métodos e responder as pendências 1 a 4 e a data do protótipo.
- Wolf: alinhar as seis classes com o DBA.
- Consultoria: montar os cenários de teste no modelo MÓDULO, CENÁRIO, ERRO, SOLICITO.
- Dev: produzir `MVP 1.0 - DOC_TECNICA_DEV_Classes_e_Dependencias.pdf`.
