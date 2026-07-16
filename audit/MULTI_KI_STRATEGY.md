# Soulvay — Multi-KI-Selector Strategie

*Stand: Juli 2026. Product-Idee des Users: User können ihre bevorzugte KI wählen (Claude, ChatGPT, Gemini + Ausweich-Optionen). Doc dokumentiert Analyse + Empfehlung, damit wir bei späterer Umsetzung nicht neu diskutieren müssen.*

## Grundidee

Aktuell: Gemini als einzige KI.
Ziel: User können unter mehreren KIs wählen — jede hat eigenen Charakter (empathisch vs. strukturiert vs. schnell).

## Datenschutz-Rating pro Anbieter

Kontext: Mental-Health-App mit deutschen Usern → Nachrichten sind Gesundheitsdaten (Art. 9 DSGVO, besondere Kategorie). Als Anbieter haften wir für DSGVO-Compliance auch bei User-Choice.

| KI | Herkunft | Kernrisiken | Score |
|---|---|---|---|
| **Mistral Large** | 🇫🇷 EU | EU-nativ, GDPR-native, Open-weights (self-hosting Option). Stark bei Datenschutz | **9-10/10** |
| **Claude** (Anthropic) | 🇺🇸 US | Zero-retention API, Constitutional AI (safety-first), SOC 2, GDPR-DPA, EU-region-control | **9/10** |
| **Aleph Alpha** (Luminous) | 🇩🇪 DE | Deutsche Firma, BSI-compliant, on-prem verfügbar. Aber: Modell-Quality schwächer als Frontier-Modelle | **10/10 Datenschutz**, **6/10 Quality** |
| **GPT-4o / GPT-5** (OpenAI) | 🇺🇸 US | API mit Zero-Retention möglich, reputational baggage, Consumer-ChatGPT trainiert auf Chats (API NICHT) | **7/10** (API-Mode only) |
| **Gemini** (Google) | 🇺🇸 US | EU-Datenverarbeitung möglich, Alphabet's Ad-Business = mixed signals, weniger transparente API-Policies | **6/10** |
| **Meta LLaMA** (via Groq/Together) | 🇺🇸 US | Open-weights (self-hostable), aber Meta-Origin = Baggage. Abhängig vom Hosting-Provider | **7/10** |
| **DeepSeek** | 🇨🇳 CN | **NO-GO für DE-Mental-Health.** China's National Intelligence Law verpflichtet zur Daten-Herausgabe. Datensouveränität nicht gegeben. User-Consent hilft juristisch nicht bei Art. 9 DSGVO. | **1-2/10** |

## Empfehlung — welche 4 Modelle für Soulvay

Nicht 5+, sondern 4 klar differenzierte Optionen:

| Slot | Modell | Positionierung |
|---|---|---|
| **Standard (frei)** | Gemini (aktuell) | Bereits integriert, ausgewogen, günstig |
| **Empathisch-warm** | Claude Sonnet 5 oder Haiku 4.5 | Safety-first Training → ideal für Mental-Health / Krisen-Gespräche. Meine ehrliche Meinung: das beste Modell für "sitting-with-you"-Gespräche |
| **Strukturiert-analytisch** | GPT-4o / GPT-5 | Bekannt, User wollen es. Gut für lösungsorientierte Sessions (Journaling-Reflection, Übungs-Anleitung) |
| **Privacy-Champion (Premium)** | Mistral Large | EU-native — starker Marketing-Punkt für DE-Markt ("Deine Daten bleiben in Europa") |

**Explizit nicht empfohlen:**
- ❌ **DeepSeek** — Datenschutz-Risiko nicht tragbar für Mental-Health-App
- ⚠️ **Aleph Alpha** — zu schwach für Prime-User-Experience (aber ideal für spätere B2B-Version für Behörden)

## Cost-Modell — kritischer Punkt

Grobe API-Preise (Stand Sommer 2026, ändern sich):

| Modell | ca. Input $ / Mio Token | Notiz |
|---|---|---|
| Gemini | 0.35 - 3.50 | Sehr günstig, aktueller Standard |
| Mistral Large | 2 - 6 | |
| Claude Sonnet | 3 - 15 | |
| GPT-4o | 5 - 15 | |

Wenn Model-Selector für Free-User verfügbar wird, **explodieren die Kosten**. Deshalb:

→ **Model-Selector = Premium-Feature.** Free bleibt bei Gemini.
→ Premium-User bekommen die 4 Optionen als Value-Add.

Das setzt voraus dass **Elite-Audit #6 (Premium serverseitig gaten)** erledigt ist — sonst kann Free-User den Selector via cURL umgehen.

## Kritischer Sicherheits-Punkt: Krisen-Detection

**Krisen-Detection darf NICHT modellabhängig sein.** Wenn ein User Suizidalität äußert und das gewählte Modell nicht angemessen reagiert, haften wir. Deshalb:

→ **Krisen-Filter läuft server-seitig VOR dem LLM-Call** — unabhängig vom gewählten Modell.
→ Bei positivem Filter: gescriptete Krisen-Response (nicht das LLM), Crisis-Line-Info aus Safety.tsx.

Soulvay hat vermutlich schon einen solchen Filter — bei Multi-Provider muss er zentral (im Backend, VOR dem Provider-Split) sitzen, nicht im Prompt.

## Provider-Abstraktion (Technik)

Aktuell: `supabase/functions/chat/index.ts` (oder ähnlich) ruft Gemini direkt auf.

Ziel:
```typescript
// _shared/llm.ts
interface LLMProvider {
  name: 'gemini' | 'claude' | 'gpt' | 'mistral';
  chat(messages: Message[], opts: ChatOpts): Promise<Response>;
}

async function chatWithLLM(
  userId: string,
  provider: LLMProvider['name'],
  messages: Message[],
  opts: ChatOpts,
): Promise<Response> {
  // 1. Server-side crisis filter (provider-independent)
  if (isCrisis(messages)) return CRISIS_RESPONSE;

  // 2. Premium check (per Elite-Audit #6)
  if (provider !== 'gemini') await requirePremium(userId);

  // 3. Dispatch
  const llm = getProvider(provider);
  try {
    return await llm.chat(messages, opts);
  } catch (err) {
    // Fallback to Gemini if selected provider fails
    return getProvider('gemini').chat(messages, opts);
  }
}
```

Prompts pro Provider variieren — Claude reagiert anders auf System-Prompts als Gemini. Ein zentrales `promptForProvider(provider, template)` Mapping fängt das ab.

## Compliance-Anforderungen pro Provider

Für jeden zusätzlichen Provider:

- ✅ **DPA (Data Processing Agreement)** unterschreiben
- ✅ **Standardvertragsklauseln (SCCs)** falls US-Provider
- ✅ **Privacy Policy Update** — Provider auflisten, Datenflüsse dokumentieren
- ✅ **Consent-Flow im UI** bei Provider-Wechsel:
  > *"Du wechselst zu Claude (Anthropic, USA). Deine Nachrichten werden an US-Server übertragen. Datenverarbeitung nach SCCs. [Details] [Ich stimme zu]"*
- ✅ **Data-Export/Löschung** muss weiterhin funktionieren (auch bei Provider-Wechsel)

## Phased Rollout (empfohlen)

Nicht "alle 4 auf einmal", sondern:

**Phase 1** (~3-5 Tage): Provider-Abstraction-Layer
- Backend-Refactor: `chatWithLLM()` Interface
- Gemini hinter Interface stellen (kein User-facing Change)
- Krisen-Filter in Interface einbauen (zentral)

**Phase 2** (~3-5 Tage): Claude als 2. Provider (Premium-only)
- Model-Selector-UI in Settings (nur Premium)
- Consent-Flow bei erstmaligem Wechsel
- DPA + Privacy-Policy-Update
- Fallback-Chain testen

**Phase 3** (~3-5 Tage): GPT-4/5 hinzufügen
- Gleiche Infrastruktur, andere Provider-Config
- Prompt-Tuning für GPT

**Phase 4** (~3-5 Tage): Mistral als "Privacy Champion"
- Marketing-Kommunikation: "Deutsche Datenschutz-Wahl"
- EU-Datenverarbeitung als Feature hervorheben

**Total**: ca. 2-4 Wochen nebenbei.

## Voraussetzungen (Elite-Audit-Backlog)

Multi-KI kann sinnvoll erst NACH diesen Elite-Audit-Items starten:

- ✅ **#1 Test-Suite + CI** — jedes Multi-KI-Feature muss testbar sein
- ⏳ **#6 Premium serverseitig gaten** — Model-Selector ist Premium-Feature → Foundation muss stimmen
- ⏳ **#7 Chat re-render** — Bei Provider-Wechsel würde jedes Component-Update das Chat komplett neu rendern → erst Chat-Perf fixen
- ⏳ Subscription-DB-Fix — Server-Buchhaltung für Premium muss stimmen

## Nächster konkreter Schritt

Nach Elite-Audit #6 (Premium-Gate) machen wir Phase 1 (Provider-Abstraction) als eigene Session. Bis dahin: dieses Doc als Reference.
