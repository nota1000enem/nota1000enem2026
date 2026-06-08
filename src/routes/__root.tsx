import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { TelegramFab } from "@/components/telegram-fab";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nota 1000 ENEM – Correção de Redação com IA" },
      {
        name: "description",
        content:
          "Plataforma de preparação para o ENEM: correção de redação por IA, simulados, banco de questões e vídeo aulas. Treine para a nota 1000.",
      },
      { name: "author", content: "Nota 1000 ENEM" },
      { property: "og:site_name", content: "Nota 1000 ENEM" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:title", content: "Nota 1000 ENEM – Correção de Redação com IA" },
      {
        property: "og:description",
        content:
          "Correção de redação ENEM por IA, simulados, banco de questões e vídeo aulas. Treine para a nota 1000.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Nota 1000 ENEM – Correção de Redação com IA" },
      {
        name: "twitter:description",
        content:
          "Correção de redação ENEM por IA, simulados, banco de questões e vídeo aulas. Treine para a nota 1000.",
      },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/xvSin4UK0fNHvOIZHbyfLrJYcW42/social-images/social-1780448932539-840enem2026.png.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/xvSin4UK0fNHvOIZHbyfLrJYcW42/social-images/social-1780448932539-840enem2026.png.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/logo-nota1000.png" },
      { rel: "apple-touch-icon", href: "/logo-nota1000.png" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "Nota 1000 ENEM",
          url: "https://nota1000enem.online",
          description:
            "Plataforma de preparação para o ENEM com correção de redação por IA, simulados, banco de questões e vídeo aulas.",
          inLanguage: "pt-BR",
          areaServed: "BR",
          sameAs: ["https://t.me/+wr3mUBagkQkyODYx"],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Nota 1000 ENEM",
          url: "https://nota1000enem.online",
          inLanguage: "pt-BR",
        }),
      },
      // Meta Pixel — ID 1547784333801355. Dispara PageView automaticamente em toda
      // navegação SPA via src/lib/meta-pixel.ts (eventos adicionais: Lead, CompleteRegistration,
      // InitiateCheckout, Purchase). Mantém a tag <noscript> abaixo para usuários sem JS.
      {
        children: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1547784333801355');fbq('track','PageView');`,
      },
      // Google Tag Manager
      {
        children: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-M35ZCDHC');`,
      },
      // Google Ads (gtag.js) — AW-18200763979
      { src: "https://www.googletagmanager.com/gtag/js?id=AW-18200763979", async: true },
      {
        children: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'AW-18200763979');`,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-M35ZCDHC"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
        {/* Meta Pixel — fallback noscript */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1547784333801355&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  // Dispara PageView do Meta Pixel a cada navegação SPA (o primeiro PageView
  // já é enviado pelo snippet no <head>).
  useEffect(() => {
    const unsub = router.subscribe("onResolved", () => {
      try {
        // @ts-ignore — fbq é injetado pelo snippet do Pixel
        window.fbq?.("track", "PageView");
      } catch {}
    });
    return () => unsub();
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      <main id="main-content">
        <Outlet />
      </main>
      <TelegramFab />
    </QueryClientProvider>
  );
}
