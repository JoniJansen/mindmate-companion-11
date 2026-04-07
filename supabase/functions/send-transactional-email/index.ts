import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { sendLovableEmail } from 'npm:@lovable.dev/email-js'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { WelcomeEmail } from '../_shared/email-templates/welcome.tsx'
import { WeeklyRecapEmail } from '../_shared/email-templates/weekly-recap.tsx'
import { SubscriptionConfirmEmail } from '../_shared/email-templates/subscription-confirm.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const SITE_NAME = 'SOULVAY'
const SENDER_DOMAIN = 'notify.soulvay.com'
const FROM_DOMAIN = 'soulvay.com'
const SITE_URL = 'https://soulvay.com'

// Template registry — add more transactional templates here
const TEMPLATES: Record<string, { subject: string; component: React.ComponentType<any> }> = {
  welcome: {
    subject: 'Welcome to SOULVAY — your quiet space awaits',
    component: WelcomeEmail,
  },
  'weekly-recap': {
    subject: 'Your SOULVAY weekly reflection',
    component: WeeklyRecapEmail,
  },
  'subscription-confirm': {
    subject: 'Your SOULVAY subscription is active',
    component: SubscriptionConfirmEmail,
  },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!apiKey || !supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Authenticate: require a valid user session
  const authHeader = req.headers.get('Authorization')
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  let userId: string | null = null
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    userId = user?.id ?? null
  }

  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let body: { template: string; data?: Record<string, any> }
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const templateConfig = TEMPLATES[body.template]
  if (!templateConfig) {
    return new Response(
      JSON.stringify({ error: `Unknown template: ${body.template}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get user email from auth
  const { data: { user } } = await supabase.auth.admin.getUserById(userId)
  if (!user?.email) {
    return new Response(
      JSON.stringify({ error: 'User email not found' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const templateProps = {
    siteUrl: SITE_URL,
    ...body.data,
  }

  const html = await renderAsync(React.createElement(templateConfig.component, templateProps))
  const text = await renderAsync(React.createElement(templateConfig.component, templateProps), {
    plainText: true,
  })

  const messageId = crypto.randomUUID()

  try {
    // Send directly via Lovable Email API (transactional emails don't have a platform run_id)
    await sendLovableEmail(
      {
        to: user.email,
        from: `${SITE_NAME} <hello@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: templateConfig.subject,
        html,
        text,
        purpose: 'transactional',
        label: body.template,
        idempotency_key: messageId,
      },
      { apiKey, sendUrl: Deno.env.get('LOVABLE_SEND_URL') }
    )

    // Log success
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: body.template,
      recipient_email: user.email,
      status: 'sent',
    })

    console.log('Transactional email sent', { template: body.template, email: user.email })

    return new Response(
      JSON.stringify({ success: true, sent: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Failed to send transactional email', { error: errorMsg, template: body.template })

    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: body.template,
      recipient_email: user.email,
      status: 'failed',
      error_message: errorMsg.slice(0, 1000),
    })

    return new Response(
      JSON.stringify({ error: 'Failed to send email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
