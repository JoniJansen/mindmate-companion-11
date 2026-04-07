# Record of Processing Activities (Art. 30 GDPR / DSGVO)

**Controller**: Soulvay — Jonathan Jansen, Petersbergstraße 11, 53604 Bad Honnef, Germany  
**Contact**: service@soulvay.com | +49 176 44680467  
**Last Updated**: March 2026  
**DPO Status**: Not required (< 250 employees, no large-scale Art. 9 processing)

---

## Processing Activity Register

### 1. User Account Management
| Field | Details |
|-------|---------|
| Purpose | User registration, authentication, profile management |
| Categories of Data Subjects | Registered users (16+) |
| Personal Data Categories | Email, display name, hashed password, language preference |
| Legal Basis | Art. 6(1)(b) GDPR — contract performance |
| Recipients | Supabase (hosting/auth) |
| International Transfer | USA — SCCs with Supabase Inc. |
| Retention | Active account duration; deleted within 30 days of account deletion |
| Security Measures | TLS 1.2+, bcrypt password hashing, RLS policies, 2FA support |

### 2. AI Chat Conversations
| Field | Details |
|-------|---------|
| Purpose | Providing AI companion interactions for emotional reflection |
| Categories of Data Subjects | Registered users |
| Personal Data Categories | Chat messages, conversation metadata, timestamps |
| Legal Basis | Art. 6(1)(b) GDPR — contract performance |
| Recipients | Google (Gemini API — real-time processing), Supabase (storage) |
| International Transfer | USA — EU-US DPF + SCCs (Google); SCCs (Supabase) |
| Retention | Active account duration; deleted with account |
| Security Measures | RLS per user_id, encrypted transit, no plaintext admin access |

### 3. Voice Conversations (Face-to-Face Mode)
| Field | Details |
|-------|---------|
| Purpose | Real-time AI voice interaction for emotional support |
| Categories of Data Subjects | Users who activate voice mode |
| Personal Data Categories | Audio streams (transient), voice session metadata |
| Legal Basis | Art. 6(1)(b) GDPR — contract performance |
| Recipients | ElevenLabs (voice synthesis — transient processing) |
| International Transfer | USA — SCCs with ElevenLabs Inc. |
| Retention | Audio: not stored after session. Metadata: account lifetime |
| Security Measures | WebRTC encryption, session-scoped tokens, no audio recording |

### 4. Journal Entries
| Field | Details |
|-------|---------|
| Purpose | Personal reflection and journaling feature |
| Categories of Data Subjects | Registered users |
| Personal Data Categories | Journal text, titles, mood tags, timestamps, source |
| Legal Basis | Art. 6(1)(b) GDPR — contract performance |
| Recipients | Supabase (storage) |
| International Transfer | USA — SCCs with Supabase Inc. |
| Retention | Active account duration; deleted with account |
| Security Measures | RLS per user_id, encrypted at rest |

### 5. Mood Tracking
| Field | Details |
|-------|---------|
| Purpose | Emotional awareness via mood check-ins |
| Categories of Data Subjects | Registered users |
| Personal Data Categories | Mood values (1-5), feeling tags, optional notes, timestamps |
| Legal Basis | Art. 6(1)(b) GDPR — contract performance |
| Recipients | Supabase (storage) |
| International Transfer | USA — SCCs with Supabase Inc. |
| Retention | Active account duration; deleted with account |
| Security Measures | RLS per user_id, encrypted at rest |

### 6. AI Pattern Detection & Insights
| Field | Details |
|-------|---------|
| Purpose | Identifying emotional patterns and generating non-diagnostic insights |
| Categories of Data Subjects | Registered users |
| Personal Data Categories | Pattern descriptions, confidence scores, memory context |
| Legal Basis | Art. 6(1)(b) GDPR — contract performance |
| Recipients | Google (Gemini — real-time analysis), Supabase (storage) |
| International Transfer | USA — EU-US DPF + SCCs (Google); SCCs (Supabase) |
| Retention | Active account duration; deleted with account |
| Security Measures | RLS per user_id, non-diagnostic wording enforced |

### 7. Subscription & Payment Processing
| Field | Details |
|-------|---------|
| Purpose | Subscription management and payment processing |
| Categories of Data Subjects | Paying subscribers |
| Personal Data Categories | Subscription status, plan type, period dates, Stripe/Apple IDs |
| Legal Basis | Art. 6(1)(b) GDPR — contract performance |
| Recipients | Stripe (web), Apple/RevenueCat (mobile) |
| International Transfer | USA — EU-US DPF (Stripe); SCCs (RevenueCat) |
| Retention | Active subscription + 10 years (§ 147 AO, § 257 HGB) |
| Security Measures | No credit card data stored; PCI-compliant processors |

### 8. Transactional Email
| Field | Details |
|-------|---------|
| Purpose | Account notifications, password resets, weekly recaps |
| Categories of Data Subjects | Registered users with email |
| Personal Data Categories | Email address, template type, delivery status |
| Legal Basis | Art. 6(1)(b) GDPR — contract performance |
| Recipients | Resend (email delivery) |
| International Transfer | USA — SCCs with Resend Inc. |
| Retention | Send logs: 90 days; unsubscribe tokens: indefinite |
| Security Measures | DKIM/SPF authentication, queue-based processing |

### 9. Crisis Detection (Automated)
| Field | Details |
|-------|---------|
| Purpose | Safety mechanism to surface crisis resources when indicators detected |
| Categories of Data Subjects | Users engaging in chat |
| Personal Data Categories | Chat content (analyzed in real-time), crisis event metadata |
| Legal Basis | Art. 6(1)(f) GDPR — legitimate interest (user safety) |
| Recipients | None (processed server-side only) |
| International Transfer | N/A |
| Retention | Crisis event log: account lifetime |
| Security Measures | Regex-based detection with negation filtering, no external sharing |

### 10. Cookie Consent Management
| Field | Details |
|-------|---------|
| Purpose | Managing user preferences for analytics/marketing cookies |
| Categories of Data Subjects | All website visitors |
| Personal Data Categories | Consent preferences, timestamp |
| Legal Basis | Art. 6(1)(a) GDPR — consent |
| Recipients | None (localStorage only) |
| International Transfer | N/A |
| Retention | Until consent withdrawn or cookies cleared |
| Security Measures | Client-side storage only |

### 11. Activity Logging
| Field | Details |
|-------|---------|
| Purpose | Streak tracking, usage analytics for premium features |
| Categories of Data Subjects | Registered users |
| Personal Data Categories | Activity type, date, user_id |
| Legal Basis | Art. 6(1)(b) GDPR — contract performance |
| Recipients | Supabase (storage) |
| International Transfer | USA — SCCs with Supabase Inc. |
| Retention | Active account duration; deleted with account |
| Security Measures | RLS per user_id |

### 12. Companion Profile Management
| Field | Details |
|-------|---------|
| Purpose | Storing user's AI companion preferences and bond level |
| Categories of Data Subjects | Registered users |
| Personal Data Categories | Companion name, archetype, personality, bond level |
| Legal Basis | Art. 6(1)(b) GDPR — contract performance |
| Recipients | Supabase (storage) |
| International Transfer | USA — SCCs with Supabase Inc. |
| Retention | Active account duration; deleted with account |
| Security Measures | RLS per user_id |

---

## Technical and Organizational Measures (Art. 32 GDPR)

- TLS 1.2+ for all data in transit
- Encryption at rest (AES-256 via Supabase/AWS)
- Row-Level Security (RLS) enforced on all 15+ tables
- JWT-based authentication with server-side validation
- 2FA support (TOTP)
- Leaked password protection enabled
- Role-based access control (admin/moderator/user)
- Automated backup rotation
- Incident response: 72-hour notification commitment (Art. 33)
- Regular security assessments
