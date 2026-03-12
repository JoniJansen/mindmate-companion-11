# Data Retention Policy

**Controller**: Soulvay — Jonathan Jansen  
**Last Updated**: March 2026  
**Legal Basis**: Art. 5(1)(e) GDPR — Storage Limitation

---

## Retention Schedule

| Data Category | Retention Period | Legal Basis | Deletion Method |
|--------------|-----------------|-------------|-----------------|
| User account (email, profile) | Active account lifetime | Art. 6(1)(b) | Account deletion via Settings or edge function |
| Chat conversations & messages | Active account lifetime | Art. 6(1)(b) | Cascade delete with account |
| Journal entries | Active account lifetime | Art. 6(1)(b) | Cascade delete with account |
| Mood check-ins | Active account lifetime | Art. 6(1)(b) | Cascade delete with account |
| Weekly recaps | Active account lifetime | Art. 6(1)(b) | Cascade delete with account |
| AI memories & patterns | Active account lifetime | Art. 6(1)(b) | Cascade delete with account |
| Session insights | Active account lifetime | Art. 6(1)(b) | Cascade delete with account |
| Companion profiles | Active account lifetime | Art. 6(1)(b) | Cascade delete with account |
| Voice session metadata | Active account lifetime | Art. 6(1)(b) | Cascade delete with account |
| Voice audio streams | **Not stored** (transient) | N/A | Discarded after session |
| Activity log | Active account lifetime | Art. 6(1)(b) | Cascade delete with account |
| Subscription records | 10 years post-relationship | Art. 6(1)(c) — § 147 AO, § 257 HGB | Manual purge after retention |
| Payment card data | **Not stored** by Soulvay | N/A | Managed by Stripe/Apple |
| Email send logs | 90 days | Art. 6(1)(f) | Automated purge |
| Cookie consent | Until withdrawn/cleared | Art. 6(1)(a) | User action (browser) |
| Anonymized analytics | Indefinite | Recital 26 GDPR | N/A (not personal data) |

---

## Account Deletion Process

1. User initiates deletion via Settings > Account > Delete Account
2. User types "DELETE" to confirm
3. Edge function (`delete-account`) executes:
   - Deletes chat_messages (via conversation FK lookup)
   - Deletes all rows from: conversations, session_insights, emotional_patterns, user_memories, companion_profiles, voice_sessions, daily_chat_usage, user_activity_log, user_roles, mood_checkins, journal_entries, weekly_recaps, subscriptions
   - Deletes avatar files from storage
   - Deletes profile record
   - Deletes auth.users record
4. All personal data removed within **30 days** (including backup rotation)
5. Tax-relevant subscription records retained per legal obligation

---

## Alternative Deletion: Email Request

Users may request deletion by emailing service@soulvay.com. The controller will verify identity and execute deletion within one month (Art. 12(3) GDPR).
