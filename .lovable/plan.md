# Cara de App em todas as páginas

Objetivo: qualquer página do site abrir e parecer um aplicativo nativo — navegação inferior fixa, header compacto, cards arredondados, feedback de toque, respiro generoso, transições suaves. Nada de "site" tradicional.

## O que muda

### 1. Bottom Navigation fixa (mobile)
- Barra inferior fixa em todas as páginas no mobile (`< 768px`), estilo Instagram/Spotify.
- 5 itens principais com ícone + label pequeno:
  - Início (`/`)
  - Redação (`/redacao`)
  - Simulados (`/questoes`)
  - Ranking (`/ranking`)
  - Perfil (`/perfil` se logado, `/auth` se não)
- Item ativo destacado (ícone preenchido + cor primária + pequena barra em cima).
- Efeito de "pressão" ao tocar (scale 0.92).
- Safe-area do iOS respeitado (`env(safe-area-inset-bottom)`).
- Some no desktop (`md:hidden`).

### 2. Header estilo app
- Header já encolhe ao rolar (feito). Vou reforçar:
  - No mobile, altura menor, logo compacto, botão de menu redondo.
  - No desktop, mantém como está.
- Espaço extra no fim da página (`pb-24 md:pb-0`) para o conteúdo não ficar embaixo da bottom nav.

### 3. Polimento visual global (todas as páginas, não só Home)
- Promover o "app-like" atualmente escopado em `.home-app` para um wrapper global aplicado no `__root.tsx`:
  - Cards mais arredondados (1.5–1.75rem)
  - Imagens com bordas suaves
  - Botões com feedback de pressão (scale ao clicar)
  - CTAs mais arredondados no mobile
  - Ritmo vertical maior entre seções
- Ativa em qualquer rota, exceto onde quebraria (ex.: player fullscreen).

### 4. Transições de página
- Fade + slide suave ao trocar de rota (via `<Outlet />` com wrapper animado leve — CSS puro, sem lib pesada).

### 5. Ajustes finos
- Scroll suave em toda a página.
- Tap highlight removido (`-webkit-tap-highlight-color: transparent`).
- `overscroll-behavior: contain` no body para evitar bounce estranho.
- Fontes já são modernas (Orbitron display + Space Grotesk body), mantidas.

## O que NÃO muda
- Conteúdo, copy, H1, ofertas, preços, planos, SEO, meta tags: intocados.
- Estrutura de rotas: intocada.
- Player de /aulas: fica pra outro turno (já combinado antes).
- Dashboard pós-login: fica pra outro turno.

## Arquivos afetados
- Novo: `src/components/bottom-nav.tsx` — barra inferior mobile-only.
- Editado: `src/routes/__root.tsx` — inclui BottomNav + classe global `app-shell` + `pb-24 md:pb-0` no wrapper.
- Editado: `src/styles.css` — promover `.home-app` para `.app-shell` (aplicado no root), adicionar CSS da bottom nav, tap-highlight, safe-area.
- Editado: `src/routes/index.tsx` — remover classe `home-app` (agora vem do root).

## Riscos e mitigação
- Bottom nav pode cobrir botões fixos existentes → adiciono `pb-24 md:pb-0` no container principal e reviso rodapés flutuantes (FAB Telegram já existe: ajusto `bottom` no mobile).
- Estilos globais podem afetar páginas admin/checkout → mantenho radius/press só em botões/imagens/cards, sem tocar em layout.
