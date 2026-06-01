import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import { BrandHeader, BrandFooter } from './_shared'

interface ReauthenticationEmailProps { token: string }

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de verificação</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <Heading style={h1}>Código de verificação</Heading>
        <Text style={text}>Use o código abaixo para confirmar sua identidade:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>O código expira em breve. Se você não solicitou, ignore este email.</Text>
        <BrandFooter />
      </Container>
    </Body>
  </Html>
)
export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0a1d3a', margin: '0 0 20px', textAlign: 'center' as const }
const text = { fontSize: '14px', color: '#444', lineHeight: '1.6', margin: '0 0 18px', textAlign: 'center' as const }
const codeStyle = {
  fontFamily: 'Courier, monospace', fontSize: '32px', fontWeight: 'bold' as const,
  color: '#0a1d3a', backgroundColor: '#f3f6fb', padding: '16px 24px', borderRadius: '8px',
  letterSpacing: '8px', textAlign: 'center' as const, margin: '0 auto 30px', display: 'block',
}
const footer = { fontSize: '12px', color: '#999', margin: '24px 0 0', textAlign: 'center' as const }
