# Soulvay Compliance Folder Structure

This directory contains all internal compliance documentation required under GDPR and applicable EU/German law.

**Controller**: Soulvay — Jonathan Jansen  
**Last Updated**: March 2026

---

## Folder Structure

```
compliance/
├── README.md                      ← This file
├── processor-agreements/          ← Signed/accepted DPA/AVV PDFs (Art. 28 GDPR)
├── gdpr-documents/                ← Internal GDPR documentation (Art. 30, 35, 33)
└── legal-pages/                   ← Archived snapshots of public legal pages
```

---

## Contents

### `/processor-agreements/` — Data Processing Agreements (Art. 28 GDPR)

Store accepted DPA/AVV PDFs from all processors here:

| File | Provider | Status |
|------|----------|--------|
| `Google_DPA_2026.pdf` | Google (Gemini AI) | ☐ Download from [Google Cloud DPA](https://cloud.google.com/terms/data-processing-addendum) |
| `Supabase_DPA_2026.pdf` | Supabase (Database) | ☐ Download from [Supabase DPA](https://supabase.com/legal/dpa) |
| `ElevenLabs_DPA_2026.pdf` | ElevenLabs (Voice AI) | ☐ Download from [ElevenLabs DPA](https://elevenlabs.io/dpa) |
| `RevenueCat_DPA_2026.pdf` | RevenueCat (Subscriptions) | ☐ Download from [RevenueCat DPA](https://www.revenuecat.com/dpa) |
| `Resend_DPA_2026.pdf` | Resend (Email) | ☐ Download from [Resend DPA](https://resend.com/legal/dpa) |

> Stripe and Apple act as independent controllers — no AVV required.

### `/gdpr-documents/` — Internal GDPR Documentation

Source documents are maintained in `docs/`:

| Document | GDPR Article | Source |
|----------|-------------|--------|
| Record of Processing Activities | Art. 30 | `docs/gdpr-record-of-processing-activities.md` |
| Data Protection Impact Assessment | Art. 35 | `docs/gdpr-data-protection-impact-assessment.md` |
| Processor Register | Art. 28 | `docs/gdpr-processor-register.md` |
| Incident Response Plan | Art. 33/34 | `docs/gdpr-incident-response-plan.md` |
| Data Retention Policy | Art. 5(1)(e) | `docs/gdpr-data-retention-policy.md` |

### `/legal-pages/` — Public Legal Page Snapshots

Archive dated snapshots of public-facing legal pages for audit trail:

| File | Page | Current Version |
|------|------|-----------------|
| `terms_2026-03.pdf` | Terms of Service | March 2026 |
| `privacy_2026-03.pdf` | Privacy Policy | March 2026 |
| `impressum_2026-03.pdf` | Impressum | March 2026 |
| `cancellation_2026-03.pdf` | Cancellation Policy | March 2026 |

> Tip: Save as PDF from the browser when updating legal pages.

---

## Annual Review

- **Next Review**: March 2027
- **Responsible**: Jonathan Jansen
- **Checklist**:
  - [ ] All DPAs still current
  - [ ] Sub-processor lists reviewed
  - [ ] Transfer safeguards (DPF/SCCs) valid
  - [ ] No new processors added without DPA
  - [ ] Legal pages snapshots archived
  - [ ] ROPA updated
  - [ ] DPIA reviewed
