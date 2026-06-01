import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'
import { BrandHeader, BrandFooter } from './_shared'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu email no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <Heading style={h1}>Bem-vindo ao Nota 1000 ENEM! 🎓</Heading>
        <Text style={text}>
          Obrigado por se cadastrar no{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          ! Falta só um passo para começar a estudar.
        </Text>
        <Text style={text}>
          Confirme seu email (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) clicando no botão abaixo:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmar email
        </Button>
        <Text style={footer}>
          Se você não criou esta conta, pode ignorar este email com segurança.
        </Text>
        <BrandFooter />
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0a1d3a', margin: '0 0 20px', textAlign: 'center' as const }
const text = { fontSize: '14px', color: '#444', lineHeight: '1.6', margin: '0 0 18px' }
const link = { color: '#1a5fb4', textDecoration: 'underline' }
const button = {
  backgroundColor: '#1a5fb4',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '8px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '8px 0',
}
const footer = { fontSize: '12px', color: '#999', margin: '24px 0 0' }
