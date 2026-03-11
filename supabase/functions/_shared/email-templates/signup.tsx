/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

const logoUrl = 'https://djnbvnufmegiursvqbhp.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to SOULVAY — your quiet space awaits</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={logoUrl} alt="SOULVAY" width="120" height="auto" style={logo} />
        <Heading style={h1}>Welcome to SOULVAY</Heading>
        <Text style={text}>
          We're glad you're here. SOULVAY is your private space for reflection — a calm companion that listens without judgment.
        </Text>
        <Text style={text}>
          Please confirm your email address ({recipient}) to get started:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm Email
        </Button>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
  margin: '0 0 24px',
}
const link = { color: 'inherit', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(152, 32%, 36%)',
  color: 'hsl(0, 0%, 99%)',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '8px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
