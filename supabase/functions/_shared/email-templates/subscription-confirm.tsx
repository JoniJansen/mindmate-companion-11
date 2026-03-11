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

interface SubscriptionConfirmEmailProps {
  displayName?: string
  planName: string
  periodEnd?: string
  siteUrl: string
}

const logoUrl = 'https://djnbvnufmegiursvqbhp.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const SubscriptionConfirmEmail = ({
  displayName,
  planName,
  periodEnd,
  siteUrl,
}: SubscriptionConfirmEmailProps) => {
  const greeting = displayName ? `Hi ${displayName},` : 'Hi,'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your SOULVAY {planName} subscription is active</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={logoUrl} alt="SOULVAY" width="120" height="auto" style={logo} />
          <Heading style={h1}>{greeting}</Heading>
          <Text style={text}>
            Thank you for subscribing to <strong>SOULVAY {planName}</strong>. Your subscription is now active.
          </Text>
          <Text style={detailBox}>
            <strong>Plan:</strong> {planName}<br />
            {periodEnd && <><strong>Next renewal:</strong> {periodEnd}<br /></>}
          </Text>
          <Text style={text}>
            You now have full access to unlimited conversations, advanced insights, and all premium features.
          </Text>
          <Hr style={hr} />
          <Button style={button} href={siteUrl}>
            Open SOULVAY
          </Button>
          <Text style={footer}>
            You can manage your subscription anytime in the app settings.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default SubscriptionConfirmEmail

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
const detailBox = {
  fontSize: '15px',
  color: 'hsl(150, 8%, 15%)',
  lineHeight: '1.8',
  margin: '0 0 16px',
  padding: '16px',
  backgroundColor: 'hsl(148, 18%, 93%)',
  borderRadius: '8px',
}
const hr = {
  borderColor: 'hsl(140, 6%, 93%)',
  margin: '20px 0',
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
  fontSize: '12px',
  color: '#999999',
  margin: '24px 0 0',
  fontStyle: 'italic' as const,
}
