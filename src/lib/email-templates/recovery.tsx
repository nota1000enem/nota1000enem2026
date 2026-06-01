import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import { BrandHeader, BrandFooter } from './_shared'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Redefina sua senha no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <Heading style={h1}>Redefina sua senha</Heading>
        <Text style={text}>
          Recebemos um pedido para redefinir sua senha do {siteName}. Clique no botão abaixo para escolher uma nova senha.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Redefinir senha
        </Button>
        <Text style={footer}>
          Se você não pediu a redefinição, ignore este email — sua senha continuará a mesma.
        </Text>
        <BrandFooter />
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0a1d3a', margin: '0 0 20px', textAlign: 'center' as const }
const text = { fontSize: '14px', color: '#444', lineHeight: '1.6', margin: '0 0 18px' }
const button = {
  backgroundColor: '#1a5fb4', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const,
  borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', margin: '8px 0',
}
const footer = { fontSize: '12px', color: '#999', margin: '24px 0 0' }
