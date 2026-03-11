/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface WelcomeEmailProps {
  displayName?: string
  siteUrl: string
}

const logoUrl = 'https://djnbvnufmegiursvqbhp.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const WelcomeEmail = ({
  displayName,
  siteUrl,
}: WelcomeEmailProps) => {
  const greeting = displayName ? `Hi ${displayName},` : 'Welcome,'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Welcome to SOULVAY — your quiet space for reflection</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={logoUrl} alt="SOULVAY" width="120" height="auto" style={logo} />
          <Heading style={h1}>{greeting}</Heading>
          <Text style={text}>
            We're glad you're here. SOULVAY is your private space for reflection — a calm, intelligent companion that listens without judgment and helps you understand yourself a little better.
          </Text>
          <Text style={text}>
            Here's what you can do:
          </Text>
          <Text style={listItem}>💬 <strong>Talk it out</strong> — Share what's on your mind in a judgment-free conversation</Text>
          <Text style={listItem}>📓 <strong>Journal</strong> — Write freely and notice emotional patterns over time</Text>
          <Text style={listItem}>🧘 <strong>Toolbox</strong> — Access grounding exercises when you need a moment of calm</Text>
          <Hr style={hr} />
          <Button style={button} href={siteUrl}>
            Open SOULVAY
          </Button>
          <Text style={footer}>
            No pressure. No streaks. Just a calm space you return to when you need it.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default WelcomeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '480px', margin: '0 auto' }
const logo = { marginBottom: '24px' }
const h1 = {
  fontSize: '22px',
  fontWeight: '600' as const,
  color: 'hsl(150, 8%, 15%)',
  margin: '0 0 16px',
}
const text = {
  fontSize: '15px',
  color: 'hsl(150, 6%, 46%)',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const listItem = {
  fontSize: '15px',
  color: 'hsl(150, 6%, 46%)',
  lineHeight: '1.6',
  margin: '0 0 8px',
  paddingLeft: '4px',
}
const hr = {
  borderColor: 'hsl(140, 6%, 93%)',
  margin: '24px 0',
}
const button = {
  backgroundColor: 'hsl(152, 32%, 36%)',
  color: 'hsl(0, 0%, 99%)',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '8px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const footer = {
  fontSize: '13px',
  color: '#999999',
  margin: '24px 0 0',
  fontStyle: 'italic' as const,
}
