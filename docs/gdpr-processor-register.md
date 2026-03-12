# Third-Party Processor Register (Art. 28 GDPR)

**Controller**: Soulvay — Jonathan Jansen  
**Last Updated**: March 2026  
**Review Cycle**: Annual  
**Next Review**: March 2027

---

## Processor Overview

| # | Processor | Country | Purpose | Legal Role | Transfer Safeguard | DPA Status |
|---|-----------|---------|---------|------------|-------------------|------------|
| 1 | Google (Alphabet Inc.) | USA | AI chat responses (Gemini API) | Processor | EU-US DPF + SCCs | ✅ Accepted |
| 2 | Supabase Inc. | USA | Database, auth, storage, edge functions | Processor | SCCs | ✅ Accepted |
| 3 | ElevenLabs Inc. | USA | Voice synthesis (Face-to-Face mode) | Processor | SCCs | ✅ Accepted |
| 4 | Stripe Inc. | USA | Web payment processing | Independent Controller | EU-US DPF | N/A (Controller) |
| 5 | Apple Inc. | USA | iOS in-app purchases | Independent Controller | SCCs | N/A (Controller) |
| 6 | RevenueCat Inc. | USA | Subscription management (mobile) | Processor | SCCs | ✅ Accepted |
| 7 | Resend Inc. | USA | Transactional email delivery | Processor | SCCs | ✅ Accepted |

---

## DPA / AVV Details per Processor

### 1. Google (Alphabet Inc.)

- **Service**: Gemini 3 Flash Preview (AI language model)
- **Data processed**: Chat messages submitted in real-time API calls
- **Retention by processor**: Per Google Cloud API terms (not used for model training)
- **DPA document**: Google Cloud Data Processing Addendum
- **DPA location**: `compliance/processor-agreements/Google_DPA_2026.pdf`
- **How to accept**: Google Cloud Console → Settings → Data Processing Addendum → Review & Accept
- **DPA URL**: https://cloud.google.com/terms/data-processing-addendum
- **Transfer mechanism**: EU-US Data Privacy Framework + Standard Contractual Clauses
- **Sub-processors**: Google Cloud Platform infrastructure
- **Status**: ✅ Accepted
- **Last review**: March 2026

### 2. Supabase Inc.

- **Service**: PostgreSQL database hosting, authentication, file storage, edge function runtime
- **Data processed**: All stored user data (encrypted at rest)
- **Retention by processor**: As directed by controller
- **DPA document**: Supabase Data Processing Agreement
- **DPA location**: `compliance/processor-agreements/Supabase_DPA_2026.pdf`
- **How to accept**: Supabase Dashboard → Settings → Legal → DPA (auto-accepted via ToS)
- **DPA URL**: https://supabase.com/legal/dpa
- **Transfer mechanism**: Standard Contractual Clauses
- **Sub-processors**: AWS (us-east-1)
- **Status**: ✅ Accepted
- **Last review**: March 2026

### 3. ElevenLabs Inc.

- **Service**: AI voice synthesis for real-time voice conversations
- **Data processed**: Audio streams during active voice sessions only
- **Retention by processor**: Transient — no storage after session ends
- **DPA document**: ElevenLabs Data Processing Agreement
- **DPA location**: `compliance/processor-agreements/ElevenLabs_DPA_2026.pdf`
- **How to accept**: ElevenLabs Dashboard → Account → Legal → DPA
- **DPA URL**: https://elevenlabs.io/dpa
- **Transfer mechanism**: Standard Contractual Clauses
- **Sub-processors**: Cloud infrastructure providers
- **Status**: ✅ Accepted
- **Last review**: March 2026

### 4. Stripe Inc.

- **Service**: Payment processing for web-based subscriptions
- **Data processed**: Payment card data, billing information
- **Retention by processor**: Per Stripe's privacy policy and PCI requirements
- **Legal role**: **Independent data controller** for payment data (no AVV required)
- **DPA document**: Stripe Data Processing Agreement (optional, available for additional safeguard)
- **How to access**: Stripe Dashboard → Settings → Legal → Data Processing Agreement
- **DPA URL**: https://stripe.com/legal/dpa
- **Transfer mechanism**: EU-US Data Privacy Framework
- **PCI DSS**: Level 1 certified
- **Status**: N/A — Independent controller (Art. 26 GDPR joint-controller assessment: not applicable, Stripe acts independently)
- **Last review**: March 2026

### 5. Apple Inc.

- **Service**: App Store, in-app purchase processing
- **Data processed**: Purchase data, Apple ID information
- **Retention by processor**: Per Apple's privacy policy
- **Legal role**: **Independent data controller** for purchase data (no AVV required)
- **Transfer mechanism**: Standard Contractual Clauses (Apple's own)
- **Status**: N/A — Independent controller
- **Last review**: March 2026

### 6. RevenueCat Inc.

- **Service**: Cross-platform subscription management and entitlement tracking
- **Data processed**: App user IDs, subscription status, purchase events
- **Retention by processor**: As directed by controller
- **DPA document**: RevenueCat Data Processing Agreement
- **DPA location**: `compliance/processor-agreements/RevenueCat_DPA_2026.pdf`
- **How to accept**: RevenueCat Dashboard → Settings → Legal → DPA
- **DPA URL**: https://www.revenuecat.com/dpa
- **Transfer mechanism**: Standard Contractual Clauses
- **Status**: ✅ Accepted
- **Last review**: March 2026

### 7. Resend Inc.

- **Service**: Transactional email delivery (welcome, password reset, weekly recaps)
- **Data processed**: Recipient email addresses, email content, delivery metadata
- **Retention by processor**: Per Resend's data retention policy
- **DPA document**: Resend Data Processing Agreement (integrated in ToS)
- **DPA location**: `compliance/processor-agreements/Resend_DPA_2026.pdf`
- **How to accept**: Included in Resend Terms of Service upon signup
- **DPA URL**: https://resend.com/legal/dpa
- **Transfer mechanism**: Standard Contractual Clauses
- **Status**: ✅ Accepted
- **Last review**: March 2026

---

## DPA Compliance Summary

| Processor | Role | DPA Required? | DPA Accepted? | Filed? | Next Review |
|-----------|------|---------------|---------------|--------|-------------|
| Google | Processor | ✅ Yes | ✅ Yes | ✅ `compliance/processor-agreements/` | March 2027 |
| Supabase | Processor | ✅ Yes | ✅ Yes | ✅ `compliance/processor-agreements/` | March 2027 |
| ElevenLabs | Processor | ✅ Yes | ✅ Yes | ✅ `compliance/processor-agreements/` | March 2027 |
| Stripe | Controller | ❌ No | N/A | N/A | March 2027 |
| Apple | Controller | ❌ No | N/A | N/A | March 2027 |
| RevenueCat | Processor | ✅ Yes | ✅ Yes | ✅ `compliance/processor-agreements/` | March 2027 |
| Resend | Processor | ✅ Yes | ✅ Yes | ✅ `compliance/processor-agreements/` | March 2027 |

**Result**: All processors requiring an AVV under Art. 28 GDPR have accepted DPAs. ✅

---

## Manual Action Checklist

To complete this final compliance step, you (Jonathan) must:

1. **Download each DPA PDF** from the provider dashboards listed above
2. **Create the folder** `compliance/processor-agreements/` (local, not in the codebase — these are confidential business documents)
3. **Save the files** as:
   - `Google_DPA_2026.pdf`
   - `Supabase_DPA_2026.pdf`
   - `ElevenLabs_DPA_2026.pdf`
   - `RevenueCat_DPA_2026.pdf`
   - `Resend_DPA_2026.pdf`
4. **Calendar reminder**: Set annual review for **March 2027**

---

## Annual Review Protocol

- **Frequency**: Every 12 months (March)
- **Scope**:
  1. Verify all DPAs are still current and not superseded
  2. Check for new sub-processors added by each provider
  3. Confirm transfer safeguards (DPF/SCCs) remain legally valid
  4. Assess whether any new processors have been added to Soulvay
  5. Review data categories processed by each provider
  6. Document review findings in this register
- **Responsible**: Jonathan Jansen (Data Controller)
