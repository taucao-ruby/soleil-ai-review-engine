# SECURITY INTELLIGENCE MASTER REPORT
GitNexus-Web Tool Fitness + SOLEIL HOSTEL Graph-Based Security Review
Adjudicated from: `gitnexus-web/docs/review/GITNEXUS_WEB_EXECUTIVE_SUMMARY.md`, `gitnexus-web/docs/review/GITNEXUS_WEB_FINDINGS_BACKLOG.md`, `gitnexus-web/docs/review/GITNEXUS_WEB_REMEDIATION_PLAN.md`, `gitnexus-web/docs/review/GITNEXUS_WEB_ARCHITECTURE_MAP.md`, `gitnexus-web/docs/review/GITNEXUS_WEB_DETAILED_REPORT.md`, direct source verification in `gitnexus-web/*`, and the prompt-supplied execution summary | Date: 2026-03-26

## 1. Executive Verdict

### gitnexus-web tool fitness
`CONDITIONALLY FIT / LOW-SENSITIVITY ONLY`

The tool is useful for architecture mapping, chokepoint discovery, and low-sensitivity static review because the core browser pipeline, graph tooling, and review artifacts are real and source-verifiable [CONFIRMED]. It is not yet fit to be treated as a high-assurance security adjudication surface for higher-sensitivity systems because the deployed proxy is wildcard-CORS, LLM credentials are stored in browser `localStorage`, and the `gitnexus-web` package has no package-specific automated verification path [CONFIRMED].

### SOLEIL HOSTEL security posture
`PARTIALLY VALIDATED / RE-VERIFY HIGH-RISK DOMAINS`

The prompt-supplied sweep summary suggests real coverage in booking, Stripe webhook, auth, CSRF, and RBAC paths, and the named tests plus cited files are directionally credible [STRONG INFERENCE]. But all cited SOLEIL artifacts and source files are absent from this workspace, so concurrency, payment correctness, and route-protection conclusions cannot be promoted to confirmed assurance in this adjudication [NOT VERIFIED].

### Leadership summary
Leadership should act on this sweep now for two things only: harden `gitnexus-web` before using it on more sensitive targets, and run a targeted SOLEIL booking/payment re-check focused on webhook-to-booking state transitions. The strongest backend risk signal is a reported transaction gap around Stripe webhook confirmation; the rest of the SOLEIL posture is more encouraging than alarming, but not evidenced strongly enough here to close out.

---

## 2. Scope and Evidence Base

- Prior artifacts read:
  `gitnexus-web/docs/review/GITNEXUS_WEB_EXECUTIVE_SUMMARY.md`
  `gitnexus-web/docs/review/GITNEXUS_WEB_FINDINGS_BACKLOG.md`
  `gitnexus-web/docs/review/GITNEXUS_WEB_REMEDIATION_PLAN.md`
  `gitnexus-web/docs/review/GITNEXUS_WEB_ARCHITECTURE_MAP.md`
  `gitnexus-web/docs/review/GITNEXUS_WEB_DETAILED_REPORT.md`
- Expected but missing artifacts:
  `docs/security/SECURITY_EXECUTIVE_SUMMARY.md`
  `docs/security/GITNEXUS_WEB_TOOL_FITNESS.md`
  `docs/security/SOLEIL_HOSTEL_SECURITY_REVIEW.md`
  `docs/security/SOLEIL_HOSTEL_ATTACK_SURFACE.md`
  `docs/security/SECURITY_FINDINGS_BACKLOG.md`
  `docs/security/SECURITY_REMEDIATION_PLAN.md`
  `docs/security/GRAPH_EVIDENCE_MAP.md`
  `docs/review/GITNEXUS_WEB_EXECUTIVE_SUMMARY.md`
  `docs/review/GITNEXUS_WEB_FINDINGS_BACKLOG.md`
  `docs/review/GITNEXUS_WEB_REMEDIATION_PLAN.md`
  `docs/review/GITNEXUS_WEB_ARCHITECTURE_MAP.md`
- Codex execution evidence incorporated:
  reported targeted SOLEIL test names from the prompt
  reported SOLEIL file/line observations from the prompt
  direct source confirmation of `gitnexus-web/api/proxy.ts`, `gitnexus-web/src/core/llm/settings-service.ts`, `gitnexus-web/src/hooks/useAppState.tsx`, `gitnexus-web/src/App.tsx`, `gitnexus-web/src/components/ErrorBoundary.tsx`, and `gitnexus-web/package.json`
  direct repo-state confirmation that root CI targets `gitnexus/` rather than `gitnexus-web/`
- What was confirmed from source/tests:
  `gitnexus-web` Batch 0 fixes for `ErrorBoundary`, `useMemo<AppState>`, and the stale `clearAICodeReferences` dependency are present in source [CONFIRMED].
  `gitnexus-web` still exposes `Access-Control-Allow-Origin: *` in the proxy and stores LLM settings in `localStorage` [CONFIRMED].
  No `gitnexus-web`-local tests, lint script, typecheck script, or package-local CI wiring were found [CONFIRMED].
- What remained partial or unverified:
  No raw SOLEIL test output, source files, or graph artifacts were available.
  The prompt-reported SOLEIL findings could not be independently replayed.
  The prompt-reported `npm run build` success for `gitnexus-web` was not re-run in this adjudication.
- Graph evidence availability:
  `gitnexus-web` graph/topology evidence was available only through the review docs and source structure [CONFIRMED].
  No live GitNexus graph resource, `GRAPH_EVIDENCE_MAP.md`, or SOLEIL graph export was available to this adjudication [CONFIRMED].

---

## 3. System Characterization

`gitnexus-web` is a browser-only code intelligence SPA: ZIP or GitHub input, Tree-sitter parsing, WASM graph database, client-side embeddings, and an LLM agent with graph/search tools [CONFIRMED]. SOLEIL HOSTEL is described in the prompt as a Laravel booking and payments backend with Stripe webhooks, Sanctum dual-mode auth, RBAC, and booking state controls [STRONG INFERENCE].

This combined review matters because the tool is being used to reason about a higher-stakes booking and payment system. If the analysis surface is fragile or over-trusted, leadership can get false confidence precisely where race conditions and state-machine errors matter most.

---

## 4. Tool Fitness - gitnexus-web

### What it does well as a security analysis surface

The available evidence supports that `gitnexus-web` is good at static architecture recovery, hotspot identification, and source-driven exploration. The browser pipeline, worker boundary, graph/search stack, and multi-tool LLM surface are real and coherent in source, not just narrative [CONFIRMED]. The proxy allowlist to GitHub hosts is correctly constrained to GitHub domains and does not obviously collapse into generic SSRF [CONFIRMED].

### Confirmed operational fragility

- `api/proxy.ts` sets `Access-Control-Allow-Origin: *` on both preflight and proxied responses while also forwarding `Authorization` headers [CONFIRMED].
- LLM provider settings are persisted as plaintext JSON in browser `localStorage` under `gitnexus-llm-settings` [CONFIRMED].
- `useAppState.tsx` is still a 1111-line single-provider state chokepoint with broad cross-cutting responsibility despite the Batch 0 memoization fix [CONFIRMED].
- There is no `gitnexus-web`-specific test suite or CI gate; root workflows operate on `gitnexus/`, not `gitnexus-web/` [CONFIRMED].
- A React `ErrorBoundary` was absent in the prior review state and is now present around `AppContent`; this specific failure-path issue is fixed in Batch 0 [CONFIRMED].

### Security assumptions that are weak

The tool assumes the browser is a trustworthy place to persist provider credentials and sticky backend/server endpoints. It assumes cross-origin use of the proxy is benign even when `Authorization` is relayed. In backend mode it also assumes the server-side Cypher execution surface is tolerant of label interpolation and user/LLM-influenced query shapes. Those are acceptable assumptions for local experiments; they are weak assumptions for broader security review.

### What kinds of security review it is fit for

It is fit for low-sensitivity static review: architecture mapping, graph chokepoint discovery, likely blast-radius exploration, and identifying review hotspots before a human reads code. It is also fit for comparing structural complexity across modules and surfacing where state or tool logic is concentrated.

### What it is not yet fit for

It is not yet fit for high-confidence adjudication of booking or payment correctness, runtime concurrency bugs, or any system where the review surface itself would handle sensitive credentials or high-trust internal endpoints. It also is not fit to stand alone as evidence of auth or RBAC correctness without raw tests and route inventories.

### Conditions before using on higher-sensitivity targets

- Restrict proxy CORS to expected origins and stop blind authorization relay.
- Remove plaintext secret persistence or force a conspicuous risk acceptance path.
- Add `gitnexus-web` package-level tests and a CI lane that actually executes them.
- Harden backend-mode query construction with allowlists or parameterization.
- Preserve raw execution artifacts for future adjudication instead of only summary prose.

---

## 5. Security Posture - SOLEIL HOSTEL

### 5.1 Booking Integrity / Concurrency

The available record supports only one concrete booking-state control: the confirm path reportedly contains a `status !== BookingStatus::PENDING` guard at `BookingController.php:217` [STRONG INFERENCE]. The presence of a targeted `CreateBookingConcurrencyTest` also suggests concurrency was not ignored during the original sweep [STRONG INFERENCE].

That is directionally positive, but it does not prove the business invariant that overlapping bookings cannot be created or that all confirm/cancel mutations are serialized correctly. The prompt explicitly references migration overlap constraints and `lockForUpdate` analysis, but neither the migration nor the controller/service code is present here [NOT VERIFIED].

Adjudication: do not treat booking integrity as proven. The evidence shows awareness of the problem, not closure of the invariant.

### 5.2 Payment / Webhook Correctness

The highest-risk backend signal in the entire adjudication is a reported `payment_intent_id` lookup in `StripeWebhookController.php:188-193` without visible transaction wrapping [STRONG INFERENCE]. Because Stripe webhook handling is asynchronous and booking state is business-critical, that creates a plausible race between cancellation and later webhook confirmation unless the subsequent mutation path acquires a row lock or performs a compare-and-set inside one transaction [STRONG INFERENCE].

The presence of `StripeWebhookTest` and `StripeWebhookHandlerTest` indicates the webhook path was exercised during the sweep [STRONG INFERENCE]. However, duplicate-event handling, amount validation, and idempotent replay safety were not evidenced with raw assertions or visible source in this workspace [NOT VERIFIED].

Adjudication: payment correctness has one credible red flag and several encouraging but unverified claims. Leadership should prioritize a targeted re-check here before treating the backend as sweep-complete.

### 5.3 Auth / Session / Token Trust

The prompt-supplied evidence points to a better-than-average auth posture: dual middleware (`CheckHttpOnlyTokenValid.php` and `CheckTokenNotRevokedAndNotExpired.php`), explicit refresh-rate enforcement, a named HttpOnly cookie (`soleil_token`), and targeted tests for cookie auth, CSRF, and token encryption [STRONG INFERENCE]. Those signals are consistent with a system that is trying to align session validity, revocation, and CSRF boundaries rather than relying on one weak layer.

What is missing is route coverage proof. Without route registration, middleware assignment, and raw test output, I cannot confirm that every protected endpoint consistently applies the intended cookie/bearer protections or that no one-off route escapes the chain [NOT VERIFIED].

Adjudication: no auth-bypass finding is preserved from the current evidence set. The correct call is partial confidence with mandatory route-level verification.

### 5.4 RBAC / Privilege Boundaries

`ContactAuthorizationTest` and `GateTest` are positive signals that authorization is at least being exercised in tests and that policy/gate enforcement was examined [STRONG INFERENCE]. That is stronger than narrative-only claims.

But the available record does not include a route matrix, controller middleware inventory, or failed-path assertions for every admin/moderator/user transition [NOT VERIFIED]. I therefore preserve no confirmed privilege-escalation finding, but I also do not grant closed status to RBAC consistency.

### 5.5 Data Exposure / PII

No serializers, resources, model `hidden` attributes, or API response artifacts were available. No direct PII exposure claim survives adjudication [NOT VERIFIED].

### 5.6 Events / Notifications / Side Effects

The only materially evidenced side-effect domain is Stripe webhook handling into booking state. No email, notification, refund, or outbox artifacts were provided, so side-effect ordering outside that path remains unassessed [NOT VERIFIED].

### 5.7 Operability / Incident Readiness

No alerting, replay tooling, webhook dead-letter handling, audit trail, or reconciliation artifacts were provided. That does not prove they are absent; it means incident readiness could not be adjudicated from this workspace [NOT VERIFIED].

---

## 6. Top Findings by Business Risk

### Critical

#### SHS-001

| Field | Value |
|-------|-------|
| ID | SHS-001 |
| Severity | CRITICAL |
| Confidence | [STRONG INFERENCE] |
| Domain | Payment / Webhook Correctness |
| Entry / Boundary / Sink | Stripe webhook -> `StripeWebhookController.php` lookup by `payment_intent_id` -> booking state transition |
| Business consequence | A cancellation-vs-webhook race can confirm or preserve the wrong booking state after payment activity, producing payment-integrity and booking-integrity failures. |
| Remediation | Wrap lookup, booking fetch, state validation, and state mutation in one transaction with row-level locking or compare-and-set semantics; add a test that races cancellation against late webhook delivery and asserts one terminal outcome only. |
| Status | Open |

### High

#### SHS-002

| Field | Value |
|-------|-------|
| ID | SHS-002 |
| Severity | HIGH |
| Confidence | [WEAK INFERENCE] |
| Domain | Booking Integrity / Concurrency |
| Entry / Boundary / Sink | Booking create/confirm flow -> overlap checks and status transitions -> persisted reservation state |
| Business consequence | If overlap prevention depends on code paths or locks not covered by the surviving evidence, double-booking or invalid confirmation remains possible under concurrency. |
| Remediation | Re-check the overlap constraint implementation in migrations plus the booking creation/confirmation transaction boundaries; add assertions that concurrent overlapping requests cannot both commit. |
| Status | Deferred |

#### SHS-003

| Field | Value |
|-------|-------|
| ID | SHS-003 |
| Severity | HIGH |
| Confidence | [WEAK INFERENCE] |
| Domain | Payment / Webhook Correctness |
| Entry / Boundary / Sink | Stripe events -> webhook handler -> payment/booking reconciliation |
| Business consequence | Duplicate-event handling and amount validation may be correct, but they are not evidenced strongly enough here; if either is wrong, bookings can confirm on replay or mismatched amounts. |
| Remediation | Add explicit test assertions for duplicate webhook replay, amount mismatch rejection, and stale-event ordering; preserve raw test output with the report. |
| Status | Deferred |

#### GNW-001

| Field | Value |
|-------|-------|
| ID | GNW-001 |
| Severity | HIGH |
| Confidence | [CONFIRMED] |
| Domain | Tool Operational Safety |
| Entry / Boundary / Sink | Arbitrary browser origin -> `gitnexus-web/api/proxy.ts` -> GitHub with forwarded `Authorization` |
| Business consequence | Any website can use the deployed proxy, and any stolen GitHub token presented by the browser can be relayed through it, expanding abuse and attribution risk. |
| Remediation | Replace wildcard CORS with an allowlist of trusted origins, forward `Authorization` only when the caller origin is trusted, and add rate limiting. |
| Status | Open |

#### GNW-002

| Field | Value |
|-------|-------|
| ID | GNW-002 |
| Severity | HIGH |
| Confidence | [CONFIRMED] |
| Domain | Tool Operational Safety |
| Entry / Boundary / Sink | Browser UI -> `gitnexus-llm-settings` in `localStorage` -> direct provider credential use |
| Business consequence | Browser compromise, XSS, or extension access exposes billable API keys and any downstream provider access they grant. |
| Remediation | Stop persisting provider API keys by default or encrypt them behind a user passphrase; at minimum, require explicit risk acknowledgment in the UI. |
| Status | Open |

### Medium

#### SHS-004

| Field | Value |
|-------|-------|
| ID | SHS-004 |
| Severity | MEDIUM |
| Confidence | [WEAK INFERENCE] |
| Domain | Auth / Session / Token Trust |
| Entry / Boundary / Sink | Cookie or bearer-authenticated request -> middleware chain -> protected controller action |
| Business consequence | The surviving evidence is consistent with good auth controls, but route-to-middleware alignment is unproven; a single unguarded route would collapse that posture. |
| Remediation | Produce a route inventory mapped to middleware and add parity tests for cookie mode, bearer mode, CSRF-protected flows, and revoked/expired tokens. |
| Status | Deferred |

#### SHS-005

| Field | Value |
|-------|-------|
| ID | SHS-005 |
| Severity | MEDIUM |
| Confidence | [WEAK INFERENCE] |
| Domain | RBAC / Privilege Boundaries |
| Entry / Boundary / Sink | User role -> gate/policy or middleware -> admin/moderator/user action |
| Business consequence | Test names suggest RBAC coverage exists, but consistent enforcement across all routes and controllers is not evidenced; privilege-boundary gaps can hide in untested route surfaces. |
| Remediation | Generate an endpoint-by-role matrix, add negative tests for admin/moderator/user boundaries, and confirm no controller bypasses policy or gate checks. |
| Status | Deferred |

#### GNW-003

| Field | Value |
|-------|-------|
| ID | GNW-003 |
| Severity | MEDIUM |
| Confidence | [CONFIRMED] |
| Domain | Tool Operational Safety |
| Entry / Boundary / Sink | Code change -> `gitnexus-web` package -> release/build without package-specific tests or CI |
| Business consequence | The tool can regress silently, which is especially risky when leadership treats its output as security evidence. |
| Remediation | Add `gitnexus-web` package-local `test`, `lint`, `typecheck`, and CI execution wired to the package directory rather than relying on monorepo gates for other components. |
| Status | Open |

#### GNW-004

| Field | Value |
|-------|-------|
| ID | GNW-004 |
| Severity | MEDIUM |
| Confidence | [CONFIRMED] |
| Domain | Tool Fitness / Architecture |
| Entry / Boundary / Sink | Any feature or state change -> `useAppState.tsx` single context -> app-wide render and behavior blast radius |
| Business consequence | Review correctness and operational stability both degrade because too much application behavior is concentrated in one file and provider boundary. |
| Remediation | Split graph, chat, UI, and embedding state into separate providers and reduce cross-domain coupling in `useAppState.tsx`. |
| Status | Open |

#### GNW-005

| Field | Value |
|-------|-------|
| ID | GNW-005 |
| Severity | MEDIUM |
| Confidence | [CONFIRMED] |
| Domain | Tool Operational Safety |
| Entry / Boundary / Sink | LLM or user-influenced node ID -> `src/core/llm/tools.ts` label interpolation -> local or backend Cypher execution |
| Business consequence | In local mode this is mostly query-integrity risk; in backend mode it becomes a trust-boundary issue if server-side execution accepts malformed label names. |
| Remediation | Validate labels against a fixed allowlist before query construction and prefer parameterized query APIs where available. |
| Status | Open |

#### GNW-006

| Field | Value |
|-------|-------|
| ID | GNW-006 |
| Severity | MEDIUM |
| Confidence | [CONFIRMED] |
| Domain | Tool Operability |
| Entry / Boundary / Sink | Dependency install -> dual lockfiles -> inconsistent local or CI dependency resolution |
| Business consequence | Build reproducibility remains ambiguous because `packageManager` was added in Batch 0 but both `package-lock.json` and `pnpm-lock.yaml` still exist. |
| Remediation | Keep the declared package manager, delete the unused lockfile, and wire CI to that single package manager. |
| Status | Open |

#### GNW-007

| Field | Value |
|-------|-------|
| ID | GNW-007 |
| Severity | MEDIUM |
| Confidence | [CONFIRMED] |
| Domain | Tool Fitness / Failure-path Engineering |
| Entry / Boundary / Sink | React render error -> no boundary -> whole UI crash |
| Business consequence | The earlier review correctly identified a white-screen failure mode, but it is no longer an open finding because Batch 0 added an `ErrorBoundary`. |
| Remediation | Keep the boundary in place and add one test or manual validation path that proves it catches render failures. |
| Status | Fixed-in-Batch0 |

#### GNW-008

| Field | Value |
|-------|-------|
| ID | GNW-008 |
| Severity | MEDIUM |
| Confidence | [CONFIRMED] |
| Domain | Tool Fitness / Performance |
| Entry / Boundary / Sink | Provider render -> recreated context value -> unnecessary consumer rerenders |
| Business consequence | The earlier review correctly identified unnecessary app-wide rerenders, but the direct cause was fixed in Batch 0 with `useMemo<AppState>`. |
| Remediation | Preserve the memoization and finish the deeper provider split captured in GNW-004. |
| Status | Fixed-in-Batch0 |

---

## 7. Critical Multi-Layer Invariants

### Booking overlap prevention

Invariant: no two overlapping bookings can both commit for the same constrained inventory.

Layers involved: DB overlap constraint, booking creation transaction, concurrency tests, controller/service validation.

How it fails: missing or bypassed uniqueness/overlap enforcement under concurrent requests.

Current confidence: [WEAK INFERENCE]. A targeted concurrency test reportedly exists, but the migration and transaction path were not available here.

### Payment -> booking confirmation correctness

Invariant: only the right paid booking can transition from payable to confirmed, and only once.

Layers involved: Stripe event authenticity, `payment_intent_id` mapping, amount validation, booking state machine, transaction boundaries.

How it fails: duplicate or stale events, mismatched amount, or booking lookup outside a serialized state transition.

Current confidence: [STRONG INFERENCE] that this is the right invariant and that it was partially tested; [WEAK INFERENCE] that it is fully safe today.

### Cancellation vs webhook race safety

Invariant: a booking that reaches a terminal cancellation path cannot later be incorrectly resurrected by a webhook.

Layers involved: cancel flow, webhook handler, DB locking or compare-and-set, idempotency logic, tests for race ordering.

How it fails: webhook processing reads a stale or unlocked record and confirms after cancellation.

Current confidence: [STRONG INFERENCE] that this is the most credible unclosed risk.

### Admin/moderator/user enforcement consistency

Invariant: each role only reaches the actions and resources intended for that role.

Layers involved: route middleware, controller policies/gates, tests for positive and negative paths.

How it fails: one route or controller method skips the expected authorization layer.

Current confidence: [WEAK INFERENCE]. Test names are promising, route coverage is not evidenced.

### Token validity + middleware + route protection alignment

Invariant: revoked, expired, or CSRF-invalid sessions cannot execute protected actions regardless of cookie or bearer mode.

Layers involved: cookie issuance, token encryption, revocation/expiry middleware, CSRF middleware, route assignment.

How it fails: one auth mode or route bypasses the intended middleware chain.

Current confidence: [STRONG INFERENCE] that the design intent is sound; [WEAK INFERENCE] that coverage is complete.

---

## 8. Graph-Derived Insights

Graph-first review was materially useful on the tool itself. Even without a live graph export, the available review docs plus source topology quickly converge on three `gitnexus-web` chokepoints: `src/hooks/useAppState.tsx`, `src/core/llm/tools.ts`, and `src/workers/ingestion.worker.ts` [CONFIRMED]. Those are the files where correctness, performance, and future regression risk concentrate.

For SOLEIL, the prompt reports a 3937-node / 10238-edge graph and mentions high-degree test nodes such as `TestCase` and `StripeWebhookHandlerTest` [WEAK INFERENCE]. If accurate, that is exactly the kind of graph signal that usefully points a reviewer toward webhook and booking chokepoints. But without `GRAPH_EVIDENCE_MAP.md`, live `gitnexus://` resources, or the underlying repo, I cannot independently rely on node degree, execution-flow membership, or blast-radius rankings [NOT VERIFIED].

The key limitation of graph-first analysis is the same one surfaced here: clean structure can hide runtime races. Graphs are excellent at surfacing where to look; they are weaker at proving transaction semantics, timing behavior, and business invariants unless paired with raw tests and source.

---

## 9. Blind Spots and Confidence Limits

- The entire cited SOLEIL artifact set is missing from this workspace.
- No SOLEIL source files or raw targeted test output were available.
- No live GitNexus MCP graph queries were available to re-check prior graph claims.
- `gitnexus-web` findings are materially stronger than SOLEIL findings because they were cross-checked directly against source.
- A structurally coherent graph or architecture map can create false confidence around race conditions; that risk is highest in booking/payment flows.
- Contradictions resolved:
  the repo is not globally CI-free, but `gitnexus-web` has no package-specific verification lane.
  `ErrorBoundary` and provider memoization were real prior issues and are now fixed.
  package-manager ambiguity is only partially fixed because the unused lockfile still remains.

---

## 10. Remediation Priorities

### Batch 0 - Correctness and security blockers [status: partially executed]

Objective: preserve the confirmed Batch 0 wins and close the remaining low-effort operability gap.

Finding IDs: GNW-006, GNW-007, GNW-008

Completion criteria: keep `ErrorBoundary`, keep `useMemo<AppState>`, keep the stale dependency fix, and delete the unused lockfile so one package manager remains authoritative.

Residual risk: the proxy and browser-secret model remain open.

### Batch 1 - Booking and payment integrity hardening

Objective: prove or fix the booking/payment invariants rather than relying on structural confidence.

Finding IDs: SHS-001, SHS-002, SHS-003

Completion criteria: one transaction boundary for webhook-driven booking mutation, explicit cancellation-vs-webhook race tests, explicit duplicate-event replay tests, and explicit amount-mismatch rejection tests.

Residual risk: without production-like replay/load testing, subtle ordering bugs may remain.

### Batch 2 - Auth / RBAC / exposure hardening

Objective: convert promising auth and role signals into route-level proof.

Finding IDs: SHS-004, SHS-005

Completion criteria: route-to-middleware inventory, cookie/bearer parity tests, revoked/expired-token denial tests, admin/moderator/user negative tests, and a serializer/resource audit for exposed data.

Residual risk: unreviewed endpoints or background jobs can still sit outside the verified route surface.

### Batch 3 - Observability / testing / incident readiness

Objective: ensure future sweeps carry raw evidence instead of summary-only confidence.

Finding IDs: SHS-001, SHS-003, SHS-004, SHS-005, GNW-003

Completion criteria: persisted raw test output for critical suites, webhook/audit logging sufficient for reconciliation, and automated `gitnexus-web` validation in CI.

Residual risk: evidence quality improves, but design flaws still need actual fixes.

### Batch 4 - gitnexus-web tool hardening

Objective: make the analysis surface safer before expanding it to higher-sensitivity repos.

Finding IDs: GNW-001, GNW-002, GNW-003, GNW-004, GNW-005, GNW-006

Completion criteria: trusted-origin proxy, safer credential handling, package-level verification lane, label allowlist in query construction, reduced state blast radius, and single package-manager determinism.

Residual risk: browser-only execution remains a deliberate tradeoff and should stay out of high-sensitivity credential paths.

---

## 11. Final Recommendation

1. Should leadership act on this sweep now, or is confidence too low?

Act now on the `gitnexus-web` hardening items and on a targeted SOLEIL booking/payment re-check. Confidence is high enough for prioritization, not high enough for a blanket security sign-off on SOLEIL.

2. What must be fixed before expanding scope to other systems?

`gitnexus-web` needs origin-restricted proxying, safer secret handling, and a package-specific verification lane. Future sweeps also need raw evidence retention, not just summaries.

3. Is a deeper targeted review needed - and exactly where?

Yes. The first deep dive should be SOLEIL Stripe webhook to booking-state transitions, especially cancellation-vs-webhook ordering and idempotency. The second should be route-to-middleware auth and RBAC coverage proof.

---

## Appendix A - Finding Normalization Table

No original SOLEIL finding IDs were available in the workspace artifacts. SOLEIL findings below were added from prompt-supplied execution evidence.

| Original ID | Action | Final ID | Reason |
|-------------|--------|----------|--------|
| N/A (prompt: webhook transaction-gap evidence) | Added | SHS-001 | No SOLEIL backlog artifact was available; this was the strongest backend risk signal with business impact. |
| N/A (prompt: booking concurrency evidence) | Added | SHS-002 | No SOLEIL backlog artifact was available; preserved as a high-consequence verification gap. |
| N/A (prompt: webhook test coverage summary) | Added | SHS-003 | No SOLEIL backlog artifact was available; preserved because duplicate/replay and amount checks matter materially. |
| N/A (prompt: auth middleware + tests summary) | Added | SHS-004 | No SOLEIL backlog artifact was available; route alignment remains unverified. |
| N/A (prompt: RBAC test summary) | Added | SHS-005 | No SOLEIL backlog artifact was available; role coverage remains partial. |
| GNWEB-001 | Merged / downgraded | GNW-003 | Absence of tests matters, but not at CRITICAL severity and not without pairing it to package-level verification. |
| GNWEB-002 | Merged / downgraded | GNW-003 | Monorepo CI exists; the real issue is lack of `gitnexus-web`-specific gating. |
| GNWEB-003 | Carried forward | GNW-004 | Still a confirmed architectural chokepoint. |
| GNWEB-004 | Carried forward | GNW-002 | Renamed around concrete credential-exposure consequence. |
| GNWEB-005 | Carried forward / fixed | GNW-007 | Correct finding, now fixed in Batch 0. |
| GNWEB-006 | Carried forward | GNW-006 | `packageManager` was added, but duplicate lockfiles remain. |
| GNWEB-007 | Removed | — | README absence is low business consequence for this master security report. |
| GNWEB-008 | Carried forward | GNW-001 | Renamed to focus on wildcard-origin auth relay behavior. |
| GNWEB-009 | Carried forward / fixed | GNW-008 | Correct finding, now fixed in Batch 0. |
| GNWEB-010 | Removed | — | Environment-doc gap is low consequence here. |
| GNWEB-011 | Removed | — | Hardcoded proxy URL is portability debt, not a top security/intelligence risk. |
| GNWEB-012 | Carried forward | GNW-005 | Still relevant because backend mode crosses a trust boundary. |
| GNWEB-013 | Removed | — | Duplication exists but is subordinate to the broader state/chokepoint issue. |
| GNWEB-014 | Removed | — | Large component size is maintainability debt, not a top adjudicated risk. |
| GNWEB-015 | Removed | — | Cancellation billing waste is real but lower priority than the preserved findings. |
| GNWEB-016 | Removed | — | Worker-readiness race is operationally minor. |
| GNWEB-017 | Merged | GNW-004 | Large tool file reinforces the same concentration/blast-radius problem. |
| GNWEB-018 | Removed | — | Stale repo-switch chat context is correctness debt, but below the final cutoff. |
| GNWEB-019 | Removed | — | Array allocation inefficiency is secondary to larger architecture risks. |
| GNWEB-020 | Removed | — | Accessibility remains important but did not survive top-risk normalization. |
| GNWEB-021 | Removed | — | Responsive-design limitation is not material to this security adjudication. |
| GNWEB-022 | Removed | — | Bundle-size concern was not measured and has low direct security consequence. |
| GNWEB-023 | Removed | — | Production logging noise is low impact. |
| GNWEB-024 | Removed | — | `any` usage did not map to a concrete exploit or integrity failure. |
| GNWEB-025 | Removed | — | Missing retry logic is lower consequence. |
| GNWEB-026 | Removed | — | Error-duration inconsistency is UX debt. |
| GNWEB-027 | Removed | — | Fixed in Batch 0 and too minor to retain as a normalized top finding. |
| GNWEB-028 | Removed | — | Positive signal, not a finding. |

## Appendix B - Severity Adjudication Notes

- GNWEB-001: CRITICAL -> MEDIUM as GNW-003 because missing tests create false confidence, but do not by themselves create a direct integrity or compromise path.
- GNWEB-002: CRITICAL -> MEDIUM as GNW-003 because monorepo CI exists; the adjudicated issue is missing `gitnexus-web` package coverage, not total absence of CI.
- GNWEB-005: HIGH -> MEDIUM as GNW-007 because the finding was valid but is already fixed in Batch 0.
- GNWEB-006: HIGH -> MEDIUM as GNW-006 because the remaining risk is determinism/operability, not a direct security failure.
- GNWEB-009: HIGH -> MEDIUM as GNW-008 because the finding was valid but is already fixed in Batch 0.
- GNWEB-012: MEDIUM confidence retained but narrowed in GNW-005 because the real risk is backend-mode trust crossing, not local-only execution.
