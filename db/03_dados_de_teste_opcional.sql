-- MVP 1 - Relatorio de Adequacao de Imoveis (saasCONSTRUCT)
-- Script 03 (OPCIONAL): 15 imoveis ficticios para os testes da Karol e do Consultor
-- Todos os dados sao ficticios, em conformidade com a LGPD: nenhum imovel, endereco ou cliente e real.
-- Executar depois dos scripts 01 e 02, conectado ao banco mvp1_adequacao.

BEGIN;

INSERT INTO mvp1.imovel (identificacao, endereco, cidade, estado, nome_cliente)
SELECT
    'TESTE ' || lpad(n::text, 2, '0'),
    'Rua Ficticia ' || n || ', apto ' || (100 + n),
    'Cidade de Teste',
    'SP',
    'Cliente Ficticio ' || lpad(n::text, 2, '0')
FROM generate_series(1, 15) AS n;

COMMIT;
