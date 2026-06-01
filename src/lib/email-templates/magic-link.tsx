import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import { BrandHeader, BrandFooter } from './_shared'

interface MagicLinkEmailProps { siteName: string; confirmationUrl: string }

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu link de acesso ao {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <Heading style={h1}>Seu link de acesso</Heading>
        <Text style={text}>Clique no botão abaixo para entrar no {siteName}. Este link expira em breve.</Text>
        <Button style={button} href={confirmationUrl}>Entrar</Button>
        <Text style={footer}>Se você não solicitou este link, ignore este email.</Text>
        <BrandFooter />
      </Container>
    </Body>
  </Html>
)
export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0a1d3a', margin: '0 0 20px', textAlign: 'center' as const }
const text = { fontSize: '14px', color: '#444', lineHeight: '1.6', margin: '0 0 18px' }
const button = { backgroundColor: '#1a5fb4', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', margin: '8px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '24px 0 0' }
