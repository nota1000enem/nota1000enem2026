import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Link, Preview, Text } from '@react-email/components'
import { BrandHeader, BrandFooter } from './_shared'

interface InviteEmailProps { siteName: string; siteUrl: string; confirmationUrl: string }

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Você foi convidado para o {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <Heading style={h1}>Você foi convidado</Heading>
        <Text style={text}>
          Você foi convidado para participar do{' '}
          <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>.
          Clique no botão abaixo para aceitar e criar sua conta.
        </Text>
        <Button style={button} href={confirmationUrl}>Aceitar convite</Button>
        <Text style={footer}>Se você não esperava este convite, pode ignorar este email com segurança.</Text>
        <BrandFooter />
      </Container>
    </Body>
  </Html>
)
export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0a1d3a', margin: '0 0 20px', textAlign: 'center' as const }
const text = { fontSize: '14px', color: '#444', lineHeight: '1.6', margin: '0 0 18px' }
const link = { color: '#1a5fb4', textDecoration: 'underline' }
const button = { backgroundColor: '#1a5fb4', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', margin: '8px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '24px 0 0' }
