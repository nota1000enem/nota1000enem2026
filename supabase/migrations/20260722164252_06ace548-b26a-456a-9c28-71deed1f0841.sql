-- Import ENEM 2024 and 2025 official exams as simulados #1 and #2
-- Existing simulados pushed down by 2 slots
BEGIN;
UPDATE public.simulados SET ordem = ordem + 2;
DELETE FROM public.questoes_simulado WHERE simulado_id IN ('e2e2e2e2-2025-4025-2025-000000002025','e2e2e2e2-2024-4024-2024-000000002024');
DELETE FROM public.simulados WHERE id IN ('e2e2e2e2-2025-4025-2025-000000002025','e2e2e2e2-2024-4024-2024-000000002024');
COMMIT;