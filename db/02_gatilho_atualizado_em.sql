-- MVP 1 - Relatorio de Adequacao de Imoveis (saasCONSTRUCT)
-- Script 02: gatilho que atualiza "atualizado_em" a cada alteracao
-- Executar depois do script 01, conectado ao banco mvp1_adequacao.

BEGIN;

CREATE OR REPLACE FUNCTION mvp1.set_atualizado_em()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.atualizado_em := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER tg_imovel_atualizado_em
    BEFORE UPDATE ON mvp1.imovel
    FOR EACH ROW EXECUTE FUNCTION mvp1.set_atualizado_em();

CREATE TRIGGER tg_plano_acao_atualizado_em
    BEFORE UPDATE ON mvp1.plano_acao
    FOR EACH ROW EXECUTE FUNCTION mvp1.set_atualizado_em();

CREATE TRIGGER tg_item_plano_atualizado_em
    BEFORE UPDATE ON mvp1.item_plano
    FOR EACH ROW EXECUTE FUNCTION mvp1.set_atualizado_em();

COMMIT;
