## Stage 0 — Repo and native shell

Goal: empty repo becomes a runnable **Expo dev build** (not Expo Go) with the folders and hooks you will extend in Stage 1.

- Initialise monolith app: React Native, Expo, TypeScript, custom development client.
- Layout: `src/domain/`, `src/data/`, `src/screens/`, `src/components/`, `src/integrations/`, `src/portability/`, `modules/` for native extensions when needed.
- Navigation skeleton: tab or stack placeholders for Log, Today, History, Plan, Data.
- Encrypted SQLite (SQLCipher via supported Expo integration): open/close DB, migration v1, prove encryption is on in the built binary.
- Device-bound encryption key: generate per install, store in platform secure storage, wire into SQLCipher.
- `LICENSE` + in-app **Open source notices** stub (SQLCipher attribution required).
- Domain test runner in CI (typecheck, lint, unit tests only); synthetic fixtures only.

**Done when:** dev client installs on a device/emulator, empty encrypted DB opens, navigation shell renders, CI runs domain tests.

---

## Stage 1 — First usable diary (offline, no account)

Goal: manual sleep ledger with naps, explainable shortfall, full export/restore—all local.

### Domain and time

- Core types: sleep observation, user correction, effective sleep session, sleep-need setting, derived shortfall result.
- All intervals as UTC instants; keep IANA zone, offset, and original local times when entered.
- DST-safe parsing and duration math; property tests for Australian edge cases (Sydney, Adelaide, Lord Howe, date-line travel).
- Overlap reconciliation for manual + nap intervals only (no imports yet).

### Persistence

- Repositories for observations, effective sessions, settings, derived results.
- Schema migrations; handle corrupt/partial writes without silent data loss.
- Sensitive settings in encrypted storage; document backup/key-loss behaviour in code comments or `docs/threat-model.md`.

### Log screen

- Manual start/end for night sleep.
- Nap timer and retrospective nap entry (same data model, nap flag).
- Awake intervals inside a session; confirm/correct flow; corrections stored separately with revision history.

### Today screen

- Last night effective sleep, estimated shortfall vs selected need, coverage/confidence.
- Tap-through **explanation**: window, clipped sessions, assumptions, algorithm version on stored results.
- Quick nap entry shortcut.
- Copy: estimated shortfall relative to selected need—not a medical measurement.

### History screen

- Timeline of effective sessions and naps; source = manual; notes; edit trail.

### Sleep need

- User-editable hours-per-24h with effective dates; versioned in DB.

### Shortfall engine

- Rolling window (e.g. 14×24h elapsed hours); clip sessions to window; floor at zero; missing days ≠ zero sleep; partial-data labels.
- Persist model id/version on every derived result.

### Data & settings (diary scope)

- Edit sleep need.
- Export unencrypted CSV + versioned JSON (complete dataset, optional date filter).
- Password-based encrypted backup (restorable without original device key).
- Import with validation, dedupe rules, schema migration, clear errors.
- Warn before unencrypted export; **Delete all local data** (including keys; clips N/A until Stage 4).

### Accessibility

- Dynamic type / large text on Log, Today, History; screen reader labels on shortfall and key numbers.

**Done when:** full diary works offline; export → wipe → import restores canonical data; timezone/overlap tests pass.

---

## Stage 2 — Health import, plan, reminders

Goal: optional health sync, merged timeline, scenarios, nudges—manual mode still complete if permissions denied.

### Health import (single integration surface)

- Read-only sleep sessions from **Health Connect** and **HealthKit** via small native adapters behind one TypeScript `HealthSleepProvider` interface.
- Map platform records → sleep observations (nights + naps); preserve source app, source record id, import metadata.
- Refresh on app open; no writeback to Samsung/Apple health apps.
- Settings: enable integration, request permissions, show last sync time.

### Reconciliation

- Merge imports with manual data: interval-level dedupe, no blind overlap sums.
- Source precedence: user correction → preferred import source → (later) phone suggestion.
- User-configurable source priority list.
- Handle upstream edits/deletes; stage-level vs start/end-only records where platform provides them.
- Missing record → unknown sleep, not zero.

### Today & History updates

- Show data sources and gaps on sessions; missing-data indicators on shortfall when coverage is thin.

### Plan screen (forecasts v1)

- User adds hypothetical future nights/naps → projected shortfall scenarios.
- Label clearly as conditional scenarios, not biological predictions.
- Empty **Travel** section placeholder.

### Reminders

- User-scheduled local reminders (bedtime/wind-down); best-effort scheduling, documented as non-exact.

### Data & settings (integrations)

- Integration toggles, source priorities, export/import unchanged, deletion controls.

**Done when:** Samsung/Apple sleep can populate timeline with dedupe; forecasts and reminders work; denying health permission leaves Stage 1 diary intact.

---

## Stage 3 — Phone-based sleep suggestions (optional passive detection)

Goal: editable proposed sleep windows on supported platforms; never auto-authoritative.

- **Proposal pipeline:** infer candidate sleep intervals from device signals (Android: usage/inactivity heuristics; iOS: only APIs you verify are allowed—feature degrades gracefully where not available).
- Label every proposal: low/medium/high confidence; always require user confirm or edit before it affects effective timeline.
- **Calibration:** adjust proposal timing from recent user-confirmed sessions when enough history exists; do not infer sleep need from chronic restriction.
- **Timing hints (Plan):** suggest likely sleep/wake times from recent confirmed pattern with stated uncertainty bands.
- Retention policy: minimal raw signal storage; no permanent “apps opened” archive.
- Evaluate accuracy vs simple schedule baseline before marketing copy; document method in `docs/algorithms/`.

**Done when:** confirmed sessions can train proposals; proposals never silently overwrite imports or manual logs.

---

## Stage 4 — Free snore tracking

Goal: user-started overnight sessions, on-device detection, timeline + export—all free.

### Session UX

- Start/stop overnight snore session from Log or dedicated entry; mic permission and visible recording state.
- Prominent stop and delete-all for session audio/metadata.

### Capture and detection

- Native overnight recording lifecycle (foreground/background rules handled in adapter, not JS timers).
- Chunk audio in memory; run **open-licence** model (weights + preprocessing + inference in repo); publish model card and evaluation notes.
- Merge chunk scores → snore events with confidence; default discard raw audio after processing.
- Optional encrypted review clips with expiry (explicit opt-in).

### Corrections and history

- User labels: snore, speech, music, noise.
- Snore events on History timeline; link to session coverage gaps.
- Export: event CSV/JSON with model version and coverage; optional separate audio bundle.

### Privacy copy

- Wellness-only wording; not apnoea screening.
- Short note that others in the room may be recorded; no silent upload of audio.

### Data & settings

- Snore defaults (retain clips or not); included in delete-all and backup scope.

**Done when:** overnight session produces reviewable timeline and exportable events on real hardware; battery/interruption behaviour documented in `docs/build-and-test/`.

---

## Stage 5 — Travel and flights

Goal: log and plan sleep across timezones without conflating shortfall with jet lag science.

### Trip model

- Trip + flight legs: departure/arrival instants and zones, layovers, optional airport ids.
- Manual itinerary entry (no flight API required).

### Logging

- Record sleep and naps during legs; continuous UTC timeline with **home** and **destination** local views.

### Plan (travel scenarios)

- Destination bed/wake intentions; conditional shortfall scenarios across timezone changes.
- Preserve elapsed durations across DST, layovers, and date-line cases.
- Separate labels for sleep shortfall vs circadian misalignment; no unvalidated “shift one hour per day” claims unless you later add a researched model.

**Done when:** travel fixtures pass in domain tests; Plan shows coherent scenarios for multi-leg trips.

---

## Screens vs stages

| Screen | First usable | Full feature set |
| --- | --- | --- |
| **Log** | Stage 1 — manual sleep, naps | Stage 4 — snore session |
| **Today** | Stage 1 — shortfall + explanation | Stage 2 — sources + gaps |
| **History** | Stage 1 — timeline + edits | Stage 4 — snore events |
| **Plan** | Stage 2 — conditional forecasts | Stage 5 — travel scenarios |
| **Data & settings** | Stage 1 — need, export, delete | Stage 2+ — integrations; Stage 4 — snore prefs |

---

## Not in this plan (defer)

Sleep-stage classification, custom wearables, smart alarm, cloud sync, AI chatbot, health writeback, full two-process circadian model, store submission checklists (track separately when you ship).

---

## Pre-launch (when Stages 1–2 are stable)

App name **Snooze**; verify store/trademark/domain vs competitor **OpenSleep**. Privacy policy and store disclosures when you cut a release build—not blockers for Stage 1 coding.
