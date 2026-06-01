-- Shift existing prova 1 e 2 para 19 e 20
UPDATE public.simulados SET ordem = 19, nome = 'Simulado ENEM — Prova 19', descricao = 'Prova 19 — 50 questões' WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE public.simulados SET ordem = 20, nome = 'Simulado ENEM — Prova 20', descricao = 'Prova 20 — 50 questões' WHERE id = '22222222-2222-2222-2222-222222222222';