import * as React from 'react'
import { Img, Section, Text } from '@react-email/components'

export const LOGO_URL =
  'https://nota1000enem.online/__l5e/assets-v1/57a726f7-1152-4ab2-81de-891e2b61a236/nota1000-logo.png'

export const BrandHeader = () => (
  <Section style={{ textAlign: 'center', padding: '24px 0 8px' }}>
    <Img
      src={LOGO_URL}
      alt="Nota 1000 ENEM"
      width="96"
      height="96"
      style={{
        display: 'block',
        margin: '0 auto',
        borderRadius: '20px',
      }}
    />
  </Section>
)

export const BrandFooter = () => (
  <Section style={{ textAlign: 'center', padding: '24px 0 8px', borderTop: '1px solid #eaeaea', marginTop: '32px' }}>
    <Text style={{ fontSize: '12px', color: '#888', margin: '4px 0' }}>
      Nota 1000 ENEM — Plataforma de preparação para o ENEM
    </Text>
    <Text style={{ fontSize: '12px', color: '#888', margin: '4px 0' }}>
      <a href="https://nota1000enem.online" style={{ color: '#1a5fb4' }}>nota1000enem.online</a>
    </Text>
  </Section>
)
