import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Link, Preview, Text } from '@react-email/components'
import { BrandHeader, BrandFooter } from './_shared'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ siteName, oldEmail, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme a alteração de email no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <Heading style={h1}>Confirme a alteração de email</Heading>
        <Text style={text}>
          Você pediu para alterar seu email no {siteName} de{' '}
          <Link href={`mailto:${oldEmail}`} style={link}>{oldEmail}</Link>{' '}para{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Text style={text}>Clique no botão abaixo para confirmar:</Text>
        <Button style={button} href={confirmationUrl}>Confirmar alteração</Button>
        <Text style={footer}>Se você não pediu essa alteração, proteja sua conta imediatamente.</Text>
        <BrandFooter />
      </Container>
    </Body>
  </Html>
)
export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0a1d3a', margin: '0 0 20px', textAlign: 'center' as const }
const text = { fontSize: '14px', color: '#444', lineHeight: '1.6', margin: '0 0 18px' }
const link = { color: '#1a5fb4', textDecoration: 'underline' }
const button = { backgroundColor: '#1a5fb4', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', margin: '8px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '24px 0 0' }
