# Third-Party Processor Register (Art. 28 GDPR)

**Controller**: Soulvay — Jonathan Jansen  
**Last Updated**: March 2026  
**Review Cycle**: Annual

---

## Processor Overview

| # | Processor | Country | Purpose | DPA Status | Transfer Safeguard | Data Categories |
|---|-----------|---------|---------|------------|-------------------|-----------------|
| 1 | Google (Alphabet Inc.) | USA | AI chat responses (Gemini API) | Required | EU-US DPF + SCCs | Chat messages (real-time) |
| 2 | Supabase Inc. | USA | Database, auth, storage, edge functions | Required | SCCs | All user data |
| 3 | ElevenLabs Inc. | USA | Voice synthesis (Face-to-Face mode) | Required | SCCs | Audio streams (transient) |
| 4 | Stripe Inc. | USA | Web payment processing | Independent controller | EU-US DPF | Payment data |
| 5 | Apple Inc. | USA | iOS in-app purchases | Independent controller | SCCs | Purchase data |
| 6 | RevenueCat Inc. | USA | Subscription management (mobile) | Required | SCCs | Subscription metadata |
| 7 | Resend Inc. | USA | Transactional email delivery | Required | SCCs | Email addresses, template data |

---

## Detailed Processor Information

### 1. Google (Alphabet Inc.)
- **Service**: Gemini 3 Flash Preview (AI language model)
- **Data Access**: Chat messages submitted in real-time API calls
- **Retention by Processor**: Per Google's API data retention policy (not used for model training with API)
- **DPA**: Google Cloud Data Processing Addendum
- **Transfer Mechanism**: EU-US Data Privacy Framework + Standard Contractual Clauses
- **Sub-processors**: Google Cloud Platform infrastructure
- **Last Review**: March 2026

### 2. Supabase Inc.
- **Service**: PostgreSQL database hosting, authentication, file storage, edge function runtime
- **Data Access**: Full access to stored user data (encrypted at rest)
- **Retention by Processor**: As directed by controller
- **DPA**: Supabase Data Processing Agreement
- **Transfer Mechanism**: Standard Contractual Clauses
- **Sub-processors**: AWS (us-east-1)
- **Last Review**: March 2026

### 3. ElevenLabs Inc.
- **Service**: AI voice synthesis for real-time voice conversations
- **Data Access**: Audio streams during active voice sessions only
- **Retention by Processor**: Transient — no storage after session ends
- **DPA**: ElevenLabs Data Processing Agreement
- **Transfer Mechanism**: Standard Contractual Clauses
- **Sub-processors**: Cloud infrastructure providers
- **Last Review**: March 2026

### 4. Stripe Inc.
- **Service**: Payment processing for web-based subscriptions
- **Data Access**: Payment card data, billing information (independent controller)
- **Retention by Processor**: Per Stripe's privacy policy and PCI requirements
- **Legal Role**: Independent data controller for payment data
- **Transfer Mechanism**: EU-US Data Privacy Framework
- **PCI DSS**: Level 1 certified
- **Last Review**: March 2026

### 5. Apple Inc.
- **Service**: App Store, in-app purchase processing
- **Data Access**: Purchase data, Apple ID information (independent controller)
- **Retention by Processor**: Per Apple's privacy policy
- **Legal Role**: Independent data controller for purchase data
- **Transfer Mechanism**: Standard Contractual Clauses
- **Last Review**: March 2026

### 6. RevenueCat Inc.
- **Service**: Cross-platform subscription management and entitlement tracking
- **Data Access**: App user IDs, subscription status, purchase events
- **Retention by Processor**: As directed by controller
- **DPA**: RevenueCat Data Processing Agreement
- **Transfer Mechanism**: Standard Contractual Clauses
- **Last Review**: March 2026

### 7. Resend Inc.
- **Service**: Transactional email delivery
- **Data Access**: Recipient email addresses, email content, delivery metadata
- **Retention by Processor**: As per Resend's data retention policy
- **DPA**: Resend Data Processing Agreement
- **Transfer Mechanism**: Standard Contractual Clauses
- **Last Review**: March 2026

---

## DPA Action Items

| Processor | DPA Signed? | Action Required |
|-----------|------------|-----------------|
| Google | ☐ Verify | Confirm Google Cloud DPA covers Gemini API usage |
| Supabase | ☐ Verify | Confirm Supabase DPA is current |
| ElevenLabs | ☐ Verify | Confirm transient processing clause in DPA |
| Stripe | N/A (controller) | N/A — independent controller |
| Apple | N/A (controller) | N/A — independent controller |
| RevenueCat | ☐ Verify | Confirm RevenueCat DPA covers webhook data |
| Resend | ☐ Verify | Confirm Resend DPA is current |

---

## Annual Review Schedule

- **Next Review**: March 2027
- **Review Scope**: Verify all DPAs are current, assess new sub-processors, confirm transfer safeguards remain valid, evaluate processor adequacy
