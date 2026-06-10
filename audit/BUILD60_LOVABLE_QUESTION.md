# Lovable-Frage vor Item #1A Verifikation

Wortlaut zum 1:1-Senden an Lovable-Chat:

---

Vor Item #1A Browser-Verifikation: zwei Klärungen nötig.

1. Gibt es im Soulvay-Projekt eine separate Lovable-Sandbox-Preview-URL mit eigener Test-DB, oder ist nur Production via soulvay.com verfügbar?

2. Gibt es einen Entitlement-Simulator im Dev-Build (URL-Query, Settings-Toggle, Hidden-Sequence), der Free/Premium-State togglen kann ohne echte RevenueCat-Subscription? Wenn ja: wie aktivieren? Wenn nein: was ist der schnellste Weg, einen Test-Account temporär als Premium zu markieren ohne echte Stripe-Zahlung?

Diese Informationen brauche ich für Item #1A Browser-Verifikation (Tests 2.A–2.E aus BUILD60_ITEM_01A_VERIFICATION.md). Aktuell blockiert die Verifikation weil keine saubere Free-User-Sicht möglich ist.

---

**Erwartete Antwort-Typen**:
- 1A: "Ja, Sandbox unter URL X" → Weg B funktioniert, ideal
- 1B: "Nur Production" → Test-Accounts mit `+test60free@`/`+test60premium@` in Production, mit Aufräum-Disziplin
- 2A: "URL-Query `?dev=premium`" o.ä. → kein Test-Account-Anlage nötig, in 2 Min testbar
- 2B: "Supabase-Direkt-Update auf `subscriptions`-Tabelle" → User aktiviert manuell
- 2C: "Stripe Test-Mode-Subscription" → komplexer, erst nach Sandbox-Klärung

**Wenn Lovable geantwortet hat**: Antwort an mich weiterleiten, dann plane ich Item-#1A-Verifikation entsprechend.
