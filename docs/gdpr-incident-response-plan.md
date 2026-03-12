# Data Breach Incident Response Plan

**Controller**: Soulvay — Jonathan Jansen  
**Last Updated**: March 2026  
**Legal Reference**: Art. 33 & 34 GDPR

---

## 1. Scope

This plan covers any personal data breach as defined by Art. 4(12) GDPR: a breach of security leading to the accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to, personal data.

---

## 2. Response Timeline

| Timeframe | Action |
|-----------|--------|
| 0–1 hours | Detect and contain breach; assess scope |
| 1–24 hours | Classify severity; identify affected data subjects |
| 24–48 hours | Prepare supervisory authority notification |
| ≤ 72 hours | **Notify supervisory authority** (LDI NRW) if risk to data subjects |
| Without undue delay | **Notify affected data subjects** if high risk (Art. 34) |

---

## 3. Severity Classification

| Level | Description | Notification Required |
|-------|-------------|----------------------|
| Low | Accidental internal access; no external exposure | Internal log only |
| Medium | Data exposed to unauthorized party; limited scope | Supervisory authority (Art. 33) |
| High | Sensitive data (wellness, auth) exposed at scale | Supervisory authority + data subjects (Art. 33 + 34) |
| Critical | Full database breach or authentication compromise | Supervisory authority + data subjects + law enforcement |

---

## 4. Supervisory Authority Contact

**Landesbeauftragte für Datenschutz und Informationsfreiheit NRW (LDI NRW)**  
Postfach 20 04 44, 40102 Düsseldorf  
https://www.ldi.nrw.de  
Breach notification: https://www.ldi.nrw.de/datenpanne-melden

---

## 5. Incident Log

All incidents must be documented with:
- Date and time of discovery
- Nature of the breach
- Categories and approximate number of data subjects affected
- Categories of personal data affected
- Likely consequences
- Measures taken to address the breach
- Measures taken to mitigate adverse effects

---

## 6. Containment Procedures

1. **Revoke compromised credentials** (API keys, database passwords)
2. **Rotate Supabase service role key** if backend compromise suspected
3. **Invalidate all user sessions** if authentication breach
4. **Enable enhanced logging** for forensic analysis
5. **Isolate affected systems** from production

---

## 7. Communication Templates

### Supervisory Authority Notification (Art. 33)
> On [DATE], Soulvay became aware of a personal data breach affecting approximately [NUMBER] data subjects. The breach involved [DESCRIPTION]. We have taken the following measures: [MEASURES]. The likely consequences are [CONSEQUENCES]. Contact: Jonathan Jansen, service@soulvay.com, +49 176 44680467.

### Data Subject Notification (Art. 34)
> We are writing to inform you of a data security incident that may have affected your Soulvay account. [DESCRIPTION]. We recommend [RECOMMENDATIONS]. We have taken [MEASURES] to prevent recurrence. For questions: service@soulvay.com.

---

## 8. Post-Incident Review

Within 14 days of resolution:
- Root cause analysis
- Update security measures
- Update this plan if needed
- Brief data controller on lessons learned
