# Data Protection Impact Assessment (DPIA) — Art. 35 GDPR

**Project**: Soulvay — AI Mental Wellness Platform  
**Controller**: Jonathan Jansen, Petersbergstraße 11, 53604 Bad Honnef, Germany  
**Assessment Date**: March 2026  
**Assessor**: Jonathan Jansen (Data Controller)  
**Review Cycle**: Annual or upon significant processing changes

---

## 1. Necessity Assessment

This DPIA is conducted on a **precautionary basis**. While Soulvay's position is that self-reported mood values and general reflective content do not constitute "health data" under Art. 9 GDPR, the emotional nature of the data warrants enhanced scrutiny.

**Triggers for this DPIA:**
- Processing of emotional and wellness-related data at scale
- Use of AI/ML for automated analysis of user input
- Real-time voice processing with third-party provider
- Potential for users to disclose health-related information voluntarily

---

## 2. Processing Description

### 2.1 AI Chat Processing
| Aspect | Detail |
|--------|--------|
| Data | User messages, AI responses, conversation metadata |
| Processor | Google (Gemini API) |
| Method | Real-time API calls; no training on user data |
| Storage | Conversations stored in Supabase with RLS |
| Purpose | Emotional reflection, supportive dialogue |

### 2.2 Voice Conversation Processing
| Aspect | Detail |
|--------|--------|
| Data | Audio streams (user speech), synthesized responses |
| Processor | ElevenLabs (WebRTC) |
| Method | Real-time streaming; audio NOT stored post-session |
| Storage | Session metadata only (duration, timestamps) |
| Purpose | Voice-based emotional support interaction |

### 2.3 Pattern Detection
| Aspect | Detail |
|--------|--------|
| Data | Aggregated chat history, mood check-ins |
| Processor | Google (Gemini API) |
| Method | Periodic analysis for recurring themes |
| Storage | Pattern descriptions in emotional_patterns table |
| Purpose | Non-diagnostic emotional awareness |

### 2.4 Crisis Detection
| Aspect | Detail |
|--------|--------|
| Data | Chat message content |
| Method | Server-side regex with severity grading and proximity-based negation |
| Action | Surface crisis resources (hotlines, professional help links) |
| Limitation | No automated emergency contact; no diagnosis |

---

## 3. Risk Assessment

### 3.1 Risk: Misinterpretation of AI Responses as Professional Advice
| Factor | Assessment |
|--------|-----------|
| Likelihood | Medium |
| Impact | High |
| Mitigations | Multiple disclaimers (onboarding, Terms, chat interface), explicit "not medical advice" notices, crisis resource surfacing |
| Residual Risk | Low |

### 3.2 Risk: Unauthorized Access to Emotional Data
| Factor | Assessment |
|--------|-----------|
| Likelihood | Low |
| Impact | High |
| Mitigations | RLS on all tables, JWT authentication, 2FA support, encrypted storage, no admin plaintext access |
| Residual Risk | Low |

### 3.3 Risk: Third-Party Processor Data Breach
| Factor | Assessment |
|--------|-----------|
| Likelihood | Low |
| Impact | High |
| Mitigations | SCCs/DPF with all processors, transient audio processing (ElevenLabs), no personal data in AI prompts beyond session context, regular processor review |
| Residual Risk | Low-Medium |

### 3.4 Risk: Profiling or Automated Decision-Making
| Factor | Assessment |
|--------|-----------|
| Likelihood | Low |
| Impact | Medium |
| Mitigations | No legally significant automated decisions (Art. 22), pattern detection is observational only, non-diagnostic language enforced, users can delete all data |
| Residual Risk | Low |

### 3.5 Risk: Minor (Under 16) Using the Platform
| Factor | Assessment |
|--------|-----------|
| Likelihood | Low |
| Impact | High |
| Mitigations | Age requirement (16+) in Terms, immediate account deletion upon detection, no child-targeted content or marketing |
| Residual Risk | Low |

### 3.6 Risk: Voice Data Retained by Processor
| Factor | Assessment |
|--------|-----------|
| Likelihood | Very Low |
| Impact | High |
| Mitigations | ElevenLabs contractual obligation for transient processing only, no audio stored post-session, SCCs in place, WebRTC encryption |
| Residual Risk | Low |

---

## 4. Data Minimization Assessment

| Data Category | Necessary? | Minimized? |
|--------------|-----------|-----------|
| Email address | Yes (auth) | Yes — single identifier |
| Display name | Optional | Yes — user-controlled |
| Chat messages | Yes (core service) | Yes — only user's conversations |
| Mood values | Yes (core feature) | Yes — simple integer + optional tags |
| Journal content | Yes (core feature) | Yes — user-authored only |
| Voice audio | Yes (voice mode) | Yes — transient, not stored |
| Payment data | No (delegated) | Yes — processed by Stripe/Apple only |

---

## 5. Data Subject Rights Implementation

| Right | Implementation Status |
|-------|---------------------|
| Access (Art. 15) | ✅ Data export (JSON/CSV) via Settings |
| Rectification (Art. 16) | ✅ Profile editing via Settings |
| Erasure (Art. 17) | ✅ Account deletion via Settings + edge function (all tables) |
| Portability (Art. 20) | ✅ Full JSON export including all data categories |
| Object (Art. 21) | ✅ Cookie settings, email unsubscribe |
| Restrict (Art. 18) | ✅ Contact controller at service@soulvay.com |
| Withdraw consent (Art. 7(3)) | ✅ Cookie consent panel, email preferences |

---

## 6. Conclusion & Decision

**Overall Risk Level**: LOW-MEDIUM

The processing is lawful and proportionate. Enhanced safeguards (encryption, RLS, transient audio processing, comprehensive disclaimers, easy deletion) adequately mitigate the identified risks.

**Decision**: Processing may proceed with the implemented safeguards. Annual review scheduled.

**Next Review**: March 2027

---

## 7. Approval

| Role | Name | Date |
|------|------|------|
| Data Controller | Jonathan Jansen | March 2026 |
