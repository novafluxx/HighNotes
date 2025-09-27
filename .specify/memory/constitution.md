<!--
Sync Impact Report
Version change: 0.0.0 → 1.0.0
Modified principles: (initial adoption)
Added sections: Core Principles, Quality & Performance Standards, Development Workflow & Quality Gates, Governance
Removed sections: (none)
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (version + gates updated)
  - .specify/templates/spec-template.md ✅ (already aligned; no constitution-specific conflicts)
  - .specify/templates/tasks-template.md ✅ (already aligned; TDD & ordering consistent)
Follow-up TODOs: (none)
-->

# High Notes Constitution

## Core Principles

### 1. Offline-First Reliability
The product MUST function with full create/edit/delete note capability while completely offline. All
mutations queue in IndexedDB (FIFO) and are replayed automatically upon connectivity return. No user
action may be permanently blocked by transient network loss; UI must provide clear pending / synced
state. Temporary IDs (`local-*`) MUST be transparently upgraded to server IDs without breaking
references.
Rationale: Core differentiation is seamless note taking anywhere; network fragility must never cause
data loss or user confusion.

### 2. Data Integrity & Security
All note content MUST be sanitized client-side before enqueue and server-side in the `save-note`
edge function prior to persistence. Only authenticated users may read/write their own notes; cross-
user access is strictly prohibited. Sensitive operations (account deletion) MUST verify authorization
on the server. Real IDs and temporary IDs MUST be validated for correct ownership before mutation.
Rationale: Protecting user data and preventing XSS / injection maintains trust and platform safety.

### 3. Realtime Consistency & Minimal Latency
The app MUST subscribe to `notes:{userId}` realtime channels after auth and reflect INSERT / UPDATE /
DELETE events idempotently. Realtime updates must reconcile with any queued offline operations
without duplications or regressions (last-write-wins based on server timestamp). UI state MUST update
under 250ms from event receipt on a typical broadband connection.
Rationale: Instant cross-device feedback is a primary quality signal for collaborative note apps.

### 4. Simplicity & Lean Surface Area
Code and data models MUST remain minimal: introduce new fields, tables, or abstractions only with a
documented user-facing benefit. Avoid premature generalization. Remove unused code within the same
PR when obsoleted. Prefer native framework / library features over custom wrappers unless they
reduce complexity measurably (review justifies in PR description).
Rationale: A small, understandable codebase accelerates iteration and reduces defect risk.

### 5. Test-First & Observability
All non-trivial logic (queue processing, ID remapping, sanitization, realtime reconciliation) MUST
have automated tests created before or alongside implementation (Red-Green-Refactor discipline). Any
bug fix requires a regression test. Structured logging (at least: operation type, note id, queue size
after mutation) MUST exist in edge functions. Client errors relevant to sync MUST surface concise
diagnostics in dev tools (console) without leaking sensitive data.
Rationale: Predictable delivery and resilience depend on catching regressions early and making issues
diagnosable.

## Quality & Performance Standards

1. Performance: Initial interactive load (cold PWA start after SW install) SHOULD complete core note
list render under 1500ms on a mid-range mobile device; subsequent navigations under 400ms.
2. Offline Queue: Processing MUST back off exponentially on repeated failures (network / 5xx), but
never drop entries; permanent failures (4xx) MUST mark entries terminal and notify user.
3. Data Model Changes: Any DB schema change MUST regenerate `types/database.types.ts` in same PR.
4. Accessibility: Interactive elements MUST have accessible names; color contrast MUST meet WCAG AA.
5. Security: Sanitization logic changes MUST be mirrored client + server; divergence is a blocker.
6. Error Boundaries: A failed realtime subscription MUST degrade to periodic fetch without crashing.
7. Size Discipline: Avoid bundling large, unused editor extensions; measure bundle diff in PR when
adding deps > 30kB gzipped.

## Development Workflow & Quality Gates

1. Branch Naming: `feat/`, `fix/`, `chore/`, `docs/` prefixes; one logical change per PR.
2. Mandatory CI Gates: typecheck, lint, unit tests, (future) e2e smoke, build. All MUST pass before
merge; no force merges.
3. Review Checklist (enforced by humans + automation where possible):
	- Offline-first preserved? (no new network-only dependency in hot path)
	- Tests added/updated?
	- Sanitization unchanged or updated coherently client + server?
	- Simplicity: any removable code removed?
	- Realtime reconciliation unaffected (ID mapping considered)?
4. Edge Function Changes: MUST include a local or staging invocation example in PR description.
5. DB Changes: Migration file + regenerated types MUST appear together; failing that → reject.
6. Commit Style: Conventional commits (e.g., `feat: add bulk delete`).
7. Task Generation: Larger features MUST originate from a spec + plan using templates; ad-hoc large
PRs are disallowed.
8. Monitoring (Future): When backend metrics introduced, add latency + failure rate dashboards before
scaling features dependent on them.

## Governance

1. Authority: This constitution supersedes ad-hoc preferences. Conflicts resolve in favor of the most
direct user value while preserving Principles 1–5.
2. Amendment Process: Submit PR with a dedicated section "Constitution Amendment" describing change,
impact, and version bump classification (MAJOR/MINOR/PATCH). Two approvals required.
3. Versioning Policy: Semantic-like semantics for governance:
	- MAJOR: Remove/redefine a principle or materially weaken a guarantee.
	- MINOR: Add a new principle, section, or strengthen a guarantee.
	- PATCH: Clarifications / wording / non-behavioral tightening.
4. Date Rules: `Ratified` remains original adoption date; `Last Amended` updates only when effective
text changes occur.
5. Compliance Review: At least quarterly (or before major architectural shifts) run a focused audit
against each principle; log outcomes and remediation tasks.
6. Deviation Handling: Temporary justified deviations MUST include an issue link and expiration date;
undocumented deviations MUST block release.
7. Tooling Alignment: Templates (`plan`, `spec`, `tasks`) MUST reflect current principles within 48h
of amendment; otherwise follow-up issue auto-created.

**Version**: 1.0.0 | **Ratified**: 2025-09-27 | **Last Amended**: 2025-09-27