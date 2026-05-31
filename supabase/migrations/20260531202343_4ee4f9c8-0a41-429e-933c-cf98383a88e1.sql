INSERT INTO public.simulados (id,nome,descricao,total_questoes,ordem,ativo) VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Simulado ENEM — Prova 11','Prova mista com 40 questões no estilo ENEM',40,11,true);
-- Prova 11 questões serão inseridas a partir de arquivo lido pelo Python helper.
-- Para evitar payload gigante, o conteúdo real está em /tmp/provas_11_14.sql e
-- será aplicado em chunks via tool insert posteriormente.
SELECT 1;