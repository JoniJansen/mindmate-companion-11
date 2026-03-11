/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface WeeklyRecapEmailProps {
  displayName?: string
  weekRange: string
  summaryBullets: string[]
  patterns: string[]
  suggestedNextStep?: string
  siteUrl: string
}

const logoUrl = 'https://djnbvnufmegiursvqbhp.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const WeeklyRecapEmail = ({
  displayName,
  weekRange,
  summaryBullets = [],
  patterns = [],
  suggestedNextStep,
  siteUrl,
}: WeeklyRecapEmailProps) => {
  const greeting = displayName ? `Hi ${displayName},` : 'Hi,'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your SOULVAY weekly reflection — {weekRange}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={logoUrl} alt="SOULVAY" width="120" height="auto" style={logo} />
          <Heading style={h1}>{greeting}</Heading>
          <Text style={text}>
            Here's a quiet look back at your week ({weekRange}).
          </Text>

          {summaryBullets.length > 0 && (
            <>
              <Text style={sectionTitle}>What came up</Text>
              {summaryBullets.map((bullet, i) => (
                <Text key={i} style={listItem}>• {bullet}</Text>
              ))}
            </>
          )}

          {patterns.length > 0 && (
            <>
              <Hr style={hr} />
              <Text style={sectionTitle}>Patterns noticed</Text>
              {patterns.map((pattern, i) => (
                <Text key={i} style={listItem}>🔄 {pattern}</Text>
              ))}
            </>
          )}

          {suggestedNextStep && (
            <>
              <Hr style={hr} />
              <Text style={sectionTitle}>A gentle suggestion</Text>
              <Text style={text}>{suggestedNextStep}</Text>
            </>
          )}

          <Hr style={hr} />
          <Text style={footer}>
            This recap was generated from your reflections this week. No one else sees this.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default WeeklyRecapEmail

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
const sectionTitle = {
  fontSize: '16px',
  fontWeight: '600' as const,
  color: 'hsl(150, 8%, 15%)',
  margin: '0 0 8px',
}
const listItem = {
  fontSize: '15px',
  color: 'hsl(150, 6%, 46%)',
  lineHeight: '1.6',
  margin: '0 0 6px',
  paddingLeft: '4px',
}
const hr = {
  borderColor: 'hsl(140, 6%, 93%)',
  margin: '20px 0',
}
const footer = {
  fontSize: '12px',
  color: '#999999',
  margin: '16px 0 0',
  fontStyle: 'italic' as const,
}
