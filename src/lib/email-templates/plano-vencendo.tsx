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

interface PlanoVencendoProps {
  nome?: string;
  plano?: string;
  diasRestantes?: number;
  renovarUrl?: string;
}

export function PlanoVencendoEmail({
  nome = "Aluno(a)",
  plano = "Pro",
  diasRestantes = 3,
  renovarUrl = "https://nota1000enem.online/planos",
}: PlanoVencendoProps) {
  const planoLabel = plano.charAt(0).toUpperCase() + plano.slice(1).toLowerCase();
  return (
    <Html>
      <Head />
      <Preview>{`Seu plano ${planoLabel} vence em ${diasRestantes} dia${diasRestantes === 1 ? "" : "s"} — renove agora`}</Preview>
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
          <Heading style={{ fontSize: "24px", margin: "0 0 8px", color: "#ffffff" }}>
            ⏰ {nome}, seu plano vence em {diasRestantes} dia
            {diasRestantes === 1 ? "" : "s"}
          </Heading>
          <Text style={{ fontSize: "16px", lineHeight: "24px", color: "#c7d0f0" }}>
            Seu plano <strong>{planoLabel}</strong> está prestes a expirar.
            Renove agora para não perder o acesso às correções de redação por
            IA, simulados, vídeo aulas e ao seu plano de estudos.
          </Text>
          <Text style={{ fontSize: "14px", color: "#8a96bd", marginTop: "8px" }}>
            Depois do vencimento, sua conta volta automaticamente ao plano
            gratuito até que você renove.
          </Text>
          <Section style={{ textAlign: "center", margin: "28px 0" }}>
            <Link
              href={renovarUrl}
              style={{
                background: "linear-gradient(90deg,#dc2626,#ef4444,#7f1d1d)",
                color: "#ffffff",
                padding: "14px 28px",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "16px",
                display: "inline-block",
              }}
            >
              Renovar agora
            </Link>
          </Section>
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
  component: PlanoVencendoEmail,
  subject: ({ diasRestantes = 3, plano = "Pro" }: PlanoVencendoProps) =>
    `⏰ Seu plano ${plano} vence em ${diasRestantes} dia${diasRestantes === 1 ? "" : "s"}`,
  displayName: "Plano Vencendo (3 dias antes)",
  previewData: {
    nome: "João",
    plano: "Pro",
    diasRestantes: 3,
    renovarUrl: "https://nota1000enem.online/planos",
  },
} satisfies TemplateEntry;
