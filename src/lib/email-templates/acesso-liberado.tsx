import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface AcessoLiberadoProps {
  nome?: string;
  plano?: string;
  loginUrl?: string;
}

export function AcessoLiberadoEmail({
  nome = "Aluno(a)",
  plano = "Premium",
  loginUrl = "https://nota1000enem.online/dashboard",
}: AcessoLiberadoProps) {
  return (
    <Html>
      <Head />
      <Preview>Seu acesso ao Nota 1000 ENEM foi liberado! 🚀</Preview>
      <Body
        style={{
          backgroundColor: "#0b1020",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          padding: "24px 0",
          margin: 0,
        }}
      >
        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            background: "#111a36",
            borderRadius: "16px",
            padding: "32px",
            color: "#e6ecff",
          }}
        >
          <Heading
            style={{
              fontSize: "26px",
              margin: "0 0 8px",
              color: "#ffffff",
            }}
          >
            🎉 Acesso liberado, {nome}!
          </Heading>
          <Text style={{ fontSize: "16px", lineHeight: "24px", color: "#c7d0f0" }}>
            Sua compra do plano <strong>{plano}</strong> foi confirmada com
            sucesso. Você já pode acessar todo o conteúdo: questões, simulados,
            videoaulas, PDFs e o corretor de redação com IA.
          </Text>
          <Section style={{ textAlign: "center", margin: "28px 0" }}>
            <Link
              href={loginUrl}
              style={{
                background:
                  "linear-gradient(90deg,#3b82f6,#06b6d4,#8b5cf6)",
                color: "#ffffff",
                padding: "14px 28px",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "16px",
                display: "inline-block",
              }}
            >
              Entrar no painel
            </Link>
          </Section>
          <Text style={{ fontSize: "14px", color: "#8a96bd" }}>
            Dica: comece pelo simulado diagnóstico e depois envie sua primeira
            redação para o corretor IA — ele aponta exatamente o que melhorar
            em cada competência.
          </Text>
          <Text
            style={{
              fontSize: "12px",
              color: "#6b7494",
              marginTop: "32px",
              borderTop: "1px solid #1e294d",
              paddingTop: "16px",
            }}
          >
            Nota 1000 ENEM · suporte@nota1000enem.online
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: AcessoLiberadoEmail,
  subject: ({ plano }: AcessoLiberadoProps) =>
    `🎉 Acesso liberado — Plano ${plano ?? "Premium"} · Nota 1000 ENEM`,
  displayName: "Acesso Liberado (pós-compra)",
  previewData: {
    nome: "João",
    plano: "Pro",
    loginUrl: "https://nota1000enem.online/dashboard",
  },
} satisfies TemplateEntry;
