# Edge Function Spec — `operator-review-ai`
**Version 1.0 — May 2026**
**Runtime:** Supabase Edge Functions (Deno)
**Trigger:** Automatic on operator onboarding completion
**Auth:** Service role only — never called client-side

---

## Purpose

Runs a multi-layer automated review of every new operator application immediately after they complete the onboarding flow (Stripe Connect + document uploads). Produces a scored recommendation for the FOAM ops queue — either auto-approving clean applications or surfacing a pre-analyzed flagged record for human review.

The goal is to eliminate human review for straightforward applications entirely, and reduce review time for flagged ones from 14 minutes to under 3.

---

## Trigger Conditions

Fires on **either** of these events:

1. Stripe `account.updated` webhook where `charges_enabled = true` and `payouts_enabled = true` — meaning Stripe Connect onboarding is fully complete
2. Direct call from the operator onboarding completion edge function once all required fields are populated on `detailer_profiles`

**Pre-conditions checked before running:**
- `detailer_profiles.approval_status = 'pending'`
- `detailer_profiles.badge_verified = true` (Stripe identity confirmed)
- `detailer_profiles.stripe_account_id` is not null
- Function has not already run for this operator (`ai_reviewed_at` is null)

If any pre-condition fails, function exits without writing results. Stripe identity must pass before AI review runs.

---

## Input

```typescript
interface OperatorReviewInput {
  detailer_id: string           // UUID — detailer_profiles.id
  business_name: string
  operation_type: 'mobile' | 'fixed' | 'hybrid'
  service_radius?: number       // mobile only
  location_address?: string     // fixed/hybrid only
  stripe_account_id: string
  insurance_doc_url?: string    // Supabase Storage path
  license_doc_url?: string      // Supabase Storage path
  portfolio_photo_urls: string[] // array of storage paths
  service_count: number         // count of active service_packages rows
  subscription_tier: string
  background_check_status: string
  phone: string
  email: string
  user_id: string
}
```

---

## Checks Pipeline

The function runs 5 checks in parallel where possible. Each check returns a structured result. All results are aggregated into a final score and flag list.

---

### Check 1 — Stripe Identity (Deterministic)

**Source:** `detailer_profiles.badge_verified`

```typescript
{
  check: 'stripe_identity',
  passed: boolean,       // true if badge_verified = true
  detail: string,        // 'Stripe identity verification passed' | 'Failed'
  weight: 0.30           // 30% of total score
}
```

This check is binary and blocking. If `badge_verified = false`, the function exits — identity verification is a hard requirement. There is no partial score for a failed identity check.

---

### Check 2 — Insurance Document Name Match (Claude Vision)

**Source:** `detailer_profiles.insurance_doc_url` → Supabase Storage

**Flow:**
1. Download insurance document from Storage using service role
2. Convert to base64
3. Send to Claude claude-sonnet-4-20250514 with vision prompt (see below)
4. Parse response JSON
5. Write `insurance_name_match`, `insurance_extracted_name`, `insurance_checked_at` to `detailer_profiles`

**Claude Vision Prompt:**
```
You are reviewing a general liability insurance certificate uploaded by a business operator applying to a platform called FOAM.

The operator's registered business name is: "{business_name}"

Examine this document and extract:
1. The name of the insured party as it appears on the certificate
2. Whether that name reasonably matches the registered business name provided

When assessing a match, consider: trade name vs legal name variations, abbreviations, sole proprietor naming conventions (personal name + DBA), and LLC/Inc suffix differences. A high-confidence match means you are confident these refer to the same business entity.

Respond ONLY with valid JSON, no preamble, no markdown:
{
  "extracted_name": "exact name as written on certificate",
  "match_confidence": 0.0-1.0,
  "is_match": true | false,
  "reasoning": "one sentence explanation",
  "flag": true | false
}

flag = true means this requires human review before approval.
```

**Result mapping:**
```typescript
{
  check: 'insurance_name',
  passed: response.is_match && response.match_confidence >= 0.80,
  flag: response.flag,
  detail: response.reasoning,
  extracted_name: response.extracted_name,
  confidence: response.match_confidence,
  weight: 0.20
}
```

**If no document uploaded:**
```typescript
{ check: 'insurance_name', passed: false, flag: true,
  detail: 'No insurance document uploaded', weight: 0.20 }
```

---

### Check 3 — Portfolio Quality (Claude Vision)

**Source:** `detailer_profiles` portfolio photos from Supabase Storage

**Flow:**
1. Fetch up to 5 portfolio photo URLs
2. If fewer than 3 photos: immediate warn flag, skip vision analysis
3. If 3+ photos: send all (max 5) to Claude in a single request

**Minimum count check:**
```typescript
if (portfolioUrls.length < 3) {
  return {
    check: 'portfolio_quality',
    passed: false,
    flag: true,
    detail: `Only ${portfolioUrls.length} photo(s) uploaded. Minimum 3 required.`,
    score: 0.0,
    weight: 0.20
  }
}
```

**Claude Vision Prompt (multi-image):**
```
You are reviewing portfolio photos submitted by a mobile auto detailing operator applying to a marketplace platform.

Evaluate these photos and assess:
1. Are these photos of detailed/cleaned vehicles? (not stock photos, not unrelated subjects)
2. Does the work quality appear professional enough to represent a paid service?
3. Are there any red flags? (stock imagery, unrelated content, inappropriate content, heavily filtered)

Respond ONLY with valid JSON:
{
  "quality_score": 0.0-1.0,
  "passes_review": true | false,
  "photos_are_automotive": true | false,
  "appears_professional": true | false,
  "flags": ["description of any specific issues found"],
  "summary": "one sentence overall assessment"
}

quality_score below 0.65 = flag for human review.
passes_review = false if photos appear to be stock imagery or unrelated to auto detailing.
```

**Result mapping:**
```typescript
{
  check: 'portfolio_quality',
  passed: response.passes_review && response.quality_score >= 0.65,
  flag: response.quality_score < 0.65 || !response.passes_review,
  score: response.quality_score,
  detail: response.summary,
  weight: 0.20
}
```

---

### Check 4 — Duplicate Account Detection (SQL)

**Source:** Supabase database query

```sql
SELECT dp.id, dp.business_name, dp.approval_status, u.phone, u.email
FROM detailer_profiles dp
JOIN users u ON u.id = dp.user_id
WHERE dp.id != $detailer_id
  AND (
    u.phone = $phone
    OR u.email = $email
    OR (
      dp.home_base_lat IS NOT NULL
      AND dp.home_base_lng IS NOT NULL
      AND ST_Distance(
        ST_MakePoint(dp.home_base_lng, dp.home_base_lat)::geography,
        ST_MakePoint($lng, $lat)::geography
      ) < 800  -- 800 meters
      AND dp.business_name ILIKE $business_name_fuzzy
    )
  )
LIMIT 5;
```

**Result mapping:**
```typescript
{
  check: 'duplicate_detection',
  passed: matches.length === 0,
  flag: matches.length > 0,
  detail: matches.length > 0
    ? `${matches.length} potential duplicate account(s) detected`
    : 'No duplicate accounts found',
  matches: matches.map(m => ({ id: m.id, business_name: m.business_name, status: m.approval_status })),
  weight: 0.15
}
```

---

### Check 5 — Profile Completeness (Deterministic)

Validates all required fields are populated for the operator's type.

**Required fields by operation type:**
```typescript
const requiredFields = {
  mobile: ['business_name', 'bio', 'service_radius', 'home_base_lat', 'home_base_lng'],
  fixed: ['business_name', 'bio', 'location_address', 'location_lat', 'location_lng',
          'location_hours', 'bay_count'],
  hybrid: ['business_name', 'bio', 'service_radius', 'home_base_lat', 'home_base_lng',
           'location_address', 'location_lat', 'location_lng', 'location_hours', 'bay_count']
}

const requiredCounts = {
  service_packages: 1,    // minimum 1 active service
  portfolio_photos: 3     // minimum 3 photos
}
```

**Result mapping:**
```typescript
{
  check: 'profile_completeness',
  passed: missingFields.length === 0 && service_count >= 1,
  flag: missingFields.length > 0,
  detail: missingFields.length > 0
    ? `Missing required fields: ${missingFields.join(', ')}`
    : 'All required fields complete',
  missing_fields: missingFields,
  weight: 0.15
}
```

---

## Scoring & Decision Logic

### Composite Score Calculation

```typescript
const weights = {
  stripe_identity:     0.30,
  insurance_name:      0.20,
  portfolio_quality:   0.20,
  duplicate_detection: 0.15,
  profile_completeness: 0.15
}

// Each check contributes weight * (passed ? 1.0 : 0.0)
// Exception: stripe_identity fail = hard exit (no score computed)
const composite_score = checks.reduce((acc, check) => {
  return acc + (weights[check.check] * (check.passed ? 1.0 : 0.0))
}, 0.0)
```

### Decision Thresholds

| Score | Flags | Decision |
|-------|-------|----------|
| ≥ 0.85 | 0 | `auto_approve` — operator approved automatically |
| ≥ 0.85 | ≥ 1 | `needs_review` — high score but flags present |
| 0.65–0.84 | any | `needs_review` — borderline, human required |
| < 0.65 | any | `needs_review` — low confidence, human required |
| Any | duplicate detected | `needs_review` — always human review |
| Any | stripe_identity failed | Exit — no review created |

### Auto-Approve Path

If `auto_approve = true`:
1. Set `detailer_profiles.approval_status = 'approved'`
2. Set `detailer_profiles.approved_at = now()`
3. Set `detailer_profiles.ai_auto_approve_eligible = true`
4. Write `reviewed_by = null` (system action)
5. Fire `operator-approved` notification edge function → "You're live." push to operator
6. Write to `ops_audit_log`: action = `'operator_approved'`, payload includes `{method: 'auto', ai_score: score}`

### Needs-Review Path

If `needs_review = true`:
1. Set `detailer_profiles.approval_status = 'flagged'` if any flags present, else keep `'pending'`
2. Write all AI results to `detailer_profiles` (score, flags, extracted names)
3. Operator lands in the FOAM ops review queue with pre-populated AI analysis
4. No notification sent to operator — they stay in pending state

---

## Output Written to `detailer_profiles`

```typescript
await supabase
  .from('detailer_profiles')
  .update({
    ai_review_score: composite_score,
    ai_flags: allFlags,              // array of flag objects from all checks
    ai_auto_approve_eligible: auto_approve,
    ai_reviewed_at: new Date().toISOString(),
    insurance_name_match: insuranceCheck.is_match ?? null,
    insurance_extracted_name: insuranceCheck.extracted_name ?? null,
    insurance_checked_at: new Date().toISOString(),
    // approval_status updated only on auto-approve path
    ...(auto_approve && {
      approval_status: 'approved',
      approved_at: new Date().toISOString()
    }),
    ...(!auto_approve && anyFlags && {
      approval_status: 'flagged'
    })
  })
  .eq('id', detailer_id)
```

---

## Flag Object Schema

Every flag written to `ai_flags` follows this shape:

```typescript
interface AIFlag {
  type: string
    // 'insurance_name_mismatch' | 'portfolio_quality_low' | 'portfolio_insufficient'
    // | 'duplicate_account' | 'profile_incomplete' | 'background_check_pending'
  severity: 'danger' | 'warn'
    // danger = blocking (human must resolve before approval)
    // warn = advisory (human should review but can approve)
  detail: string      // human-readable description for the ops queue UI
  field?: string      // which detailer_profiles field is affected
  check: string       // which check produced this flag
}
```

**Example flags array:**
```json
[
  {
    "type": "insurance_name_mismatch",
    "severity": "danger",
    "detail": "Certificate name 'James Auto Spa' does not match registered business name 'James Detailing LLC'. Manual verification required before approval.",
    "field": "insurance_doc_url",
    "check": "insurance_name"
  },
  {
    "type": "background_check_pending",
    "severity": "warn",
    "detail": "Checkr background check is still processing. Clear before approving.",
    "field": "background_check_status",
    "check": "background_check"
  }
]
```

---

## Checkr Integration

Background checks run in parallel with the AI review — not inside this function. A separate `checkr-webhook` edge function handles Checkr callbacks and updates `detailer_profiles.background_check_status`.

**The `operator-review-ai` function reads `background_check_status`** and adds a warn flag if it's not `'clear'`:

```typescript
if (background_check_status !== 'clear') {
  flags.push({
    type: 'background_check_pending',
    severity: 'warn',
    detail: background_check_status === 'pending'
      ? 'Checkr background check is still processing. Verify before approving.'
      : `Background check status: ${background_check_status}. Review Checkr report.`,
    field: 'background_check_status',
    check: 'background_check'
  })
}
```

A background check in `review_required` or `failed` state sets severity to `danger`.

---

## Anthropic API Call Pattern

```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': Deno.env.get('ANTHROPIC_API_KEY'),
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'application/pdf',  // or image/jpeg, image/png
            data: base64DocumentData
          }
        },
        {
          type: 'text',
          text: INSURANCE_VISION_PROMPT.replace('{business_name}', business_name)
        }
      ]
    }]
  })
})

const data = await response.json()
const content = data.content[0].text
const parsed = JSON.parse(content)
```

**Always wrap in try/catch.** If Claude API call fails, the insurance check defaults to `passed: false, flag: true` with detail "Document review unavailable — requires manual check." The operator lands in the human review queue rather than being blocked indefinitely.

---

## Error Handling

| Error | Behavior |
|-------|----------|
| Claude API unavailable | Flag insurance check as needs-review; continue with other checks |
| Storage document not found | Flag as missing document; continue |
| DB write fails | Retry once with exponential backoff; log to Supabase logs |
| Stripe API unavailable | Function exits — `badge_verified` is required pre-condition |
| Duplicate detection query timeout | Flag as needs-review; continue |
| Any unhandled exception | Log error, set `approval_status = 'pending'` (default state) — operator still lands in human queue |

---

## Environment Variables Required

```
ANTHROPIC_API_KEY          — Claude API key
SUPABASE_URL               — Project URL
SUPABASE_SERVICE_ROLE_KEY  — Service role for storage access and DB writes
CHECKR_API_KEY             — For initiating checks (separate checkr-initiate function)
```

---

## Deployment Notes

- **Register as a webhook handler** in Stripe Dashboard for `account.updated` events
- **Idempotency:** Check `ai_reviewed_at IS NULL` before running — Stripe may send duplicate webhooks
- **Timeout:** Set Deno function timeout to 30 seconds — vision API calls can take 5–10s
- **Parallel execution:** Run checks 2–5 concurrently with `Promise.allSettled()` — only Check 1 must precede the others
- **Rate limits:** Claude API rate limits apply. At launch scale (<100 operators/day) this is not a concern. Monitor at 500+ operators/month.

---

## Ops Queue Integration

The FOAM Ops Review Queue reads these fields from `detailer_profiles` to power the UI:

| UI Element | Source Field |
|------------|-------------|
| Flag alert banner | `ai_flags[]` where severity = 'danger' or 'warn' |
| Verification checklist — Insurance | `insurance_name_match`, `insurance_extracted_name` |
| Verification checklist — Background | `background_check_status` |
| Verification checklist — License | `business_license_status` |
| AI confidence indicator (future) | `ai_review_score` |
| Auto-approved badge (future) | `ai_auto_approve_eligible` |
| "Flagged Review" status badge | `approval_status = 'flagged'` |

---

*Cross-reference: DATA_MODEL.md (detailer_profiles schema), ARCHITECTURE.md (edge function table), FOAM_OPS_UXPILOT_PROMPT_LIGHT_v2.md (ops queue UI spec)*
*Last updated: May 2026*
