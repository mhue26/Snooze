# Open Sleep — Product Research and Project Guide

**Working title:** Open Sleep; name and availability have not been checked.  
**Research date:** 3 November 2026.  
**Status:** Research and proposed implementation plan; no application or classifier has been built or validated.

> A free, fully open-source, cross-platform sleep diary and planner—with encrypted local data, transparent sleep-debt estimates, naps, travel support, free snore tracking and complete export.

## 1. Product commitments

The intended product supports **Android and iOS**. Google Play is one distribution channel, not the product boundary.

- All user features remain free: sleep history, forecasts, naps, flight/travel features, snore detection, audio review when enabled, and export/import.
- Publish the application code, calculation algorithms, native integrations, build instructions, export schemas and tests under explicit open-source licences.
- Any bundled detection model must have redistributable weights and an appropriate open licence. Publish preprocessing, inference code, model version and evaluation methods. A public app repository with an inaccessible proprietary classifier is insufficient.
- Process sleep data and audio on-device. Core functionality must work offline without an account or a mandatory backend.
- Encrypt sensitive app-owned data at rest. Do not embed advertising, tracking or automatic health-data-upload SDKs.
- Make complete data export and restoration first-class features, without a paywall.
- Clearly distinguish observations, user corrections, algorithmic estimates and future scenarios.

**Open-source boundary:** The app and its own logic can be fully open source while integrating with platform facilities such as Apple HealthKit and Android Health Connect. That does not make the operating system, app stores or Samsung Health open source. Keep integrations optional so manual logging, planning and export remain useful independently. Do not promise an entirely open-source iOS operating environment.

**Licensing decision:** Select the application licence after reviewing dependency and distribution compatibility. Permissive licences such as MIT or Apache-2.0 prioritise reuse; copyleft licences prioritise keeping covered derivatives open. Audit the actual licence text before copying existing projects. Do not choose a licence solely because a competitor uses it.

## 2. Competitive landscape

Features below are drawn from product documentation and repositories, not hands-on testing. Documented claims do not establish detection accuracy, app maturity or equivalent functionality across Android and iOS. An unverified feature is not necessarily absent.

| Product | Documented overlap | Openness, cost and portability | Implication |
| --- | --- | --- | --- |
| **RISE** | Sleep-debt and sleep-need estimates, energy schedules, phone/wearable detection, manual edits, naps and adjustment following timezone changes. Android wearable imports can use Health Connect. | Proprietary subscription product; no permanent free plan. A comprehensive self-service export flow was not verified in this research. | Closest reference for the daily debt/planning experience. Naps and basic travel adaptation are not unique. [S1–S5] |
| **Sleep as Android** | Sleep tracking, deficit, naps, regularity, smart alarms, Health Connect and jet-lag prevention. | Documents privacy controls and manual ZIP/CSV backups. Not a fully free, open-source equivalent. | Strong established Android competitor. Privacy and export alone do not establish a unique position. [S6–S9] |
| **Samsung Health** | Sleep records and analysis; sleep synchronisation with Health Connect. | Proprietary; provides personal-data download. | Initial integration target because it is the user's existing workflow. Build useful analysis on top of it. [S10–S11] |
| **Sleep Cycle** | Sleep tracking, goals, trends and smart alarms. | Proprietary; privacy policy provides for in-app CSV export. | Complete, well-documented portability must go beyond merely having a CSV button. [S12–S13] |
| **Timeshifter** | Flight-specific plans for sleep, naps and light exposure, with optional caffeine/melatonin guidance. | First plan free; published pricing at research time: US$9.99 per plan or US$24.99/year. | Strong specialist competitor for later travel planning. Recheck pricing before making comparisons publicly. [S14] |
| **Plees Tracker** | Simple manual start/stop sleep logging, daily averages and CSV import/export. | Free and open source; inspect the licence file before reuse. | Useful example of a small, focused diary rather than an extensive sensing platform. [S15] |
| **Somn** | Repository advertises manual editing, running debt, local analysis, optional Health Connect, CSV/JSON export and encrypted NAS backups. | Open source; advertises no account, advertising or analytics. | Substantial overlap with the privacy/export proposition. Evaluate actual builds and model quality before deciding whether to contribute, reuse or build independently. [S16] |
| **OpenSleep** | Advertises phone-based tracking, on-device analysis and Health Connect integration. | Advertises public source, no account and free tracking, with a paid on-device coach. | Shows that on-device, source-available offerings already exist. Review the actual source/model licences before treating it as a fully open alternative. [S17] |

### Opportunity assessment

This is a credible personal and portfolio project, but not an empty category. Avoid claiming that no private or open-source sleep tracker exists.

The strongest proposition is an **explainable sleep ledger and planner** combining:

1. Transparent sleep-shortfall calculations, with assumptions and uncertainty visible.
2. Excellent, lossless export and restoration.
3. Encrypted local storage and offline use.
4. Reliable interoperability with existing health records.
5. Correct handling of naps, flights, timezones and date-line crossings.
6. Free on-device snore detection, with an open and evaluated detector.

The value is the combination and quality of execution. Free snore tracking adds appeal but still requires competitor and accuracy validation before any uniqueness claim.

## 3. User experience and scope

### Primary workflow

1. Choose an initial sleep-need assumption and optional health-data integration.
2. Import sleep records or enter sleep and naps manually.
3. Confirm or correct suggested sleep intervals.
4. See recorded sleep, estimated shortfall, data coverage and an explanation of the calculation.
5. Explore conditional scenarios for upcoming nights and naps.
6. Start an optional overnight snore session.
7. Add a trip and record sleep during flight legs.
8. Export or restore all data at any time.

### Suggested screens

| Screen | Contents |
| --- | --- |
| **Today** | Last night's effective sleep, estimated shortfall, coverage/confidence, quick nap entry and next action. |
| **Log** | Manual start/end entry, nap timer, awake intervals, suggested-session confirmation and corrections. |
| **History** | Timeline, trends, sources, notes, edits and snore-session details. |
| **Plan** | Conditional sleep/nap forecasts and, later, flight/travel planning. |
| **Data and settings** | Integrations, source priorities, sleep-need assumption, encryption/backup settings, export/import, deletion and model explanations. |

Use clear wording such as “estimated shortfall relative to your selected need”. Do not present a calculated number as a direct biological measurement.

## 4. Delivery stages

| Stage | Deliverable | Acceptance criteria |
| --- | --- | --- |
| **0: Integration feasibility** | Small Android/iOS development builds testing local encrypted storage, health-record access and an overnight microphone session. | Verify the hardest native dependencies and lifecycle behaviour before investing in the full UI. Record any platform limitations. |
| **1: First usable diary** | Manual sleep and nap entry, editable sleep-need assumption, history, transparent shortfall calculation, encrypted storage and CSV/JSON export plus restore. | Works offline without an account; export/import preserves the intended data; timezone and overlap tests pass. |
| **2: Publishable core MVP** | Health Connect and HealthKit adapters, source selection, deduplication, missing-data indicators, conditional forecasts and basic reminders. | Permission denial/revocation does not break manual mode; no duplicate counting; explanations and restoration work on both platforms. |
| **3: Phone-based suggestions** | Optional Android usage-based suggestions and local calibration from confirmed records. | Suggestions are labelled and editable; measured accuracy beats a simple schedule baseline. iOS capabilities are assessed separately. |
| **4: Free snore tracking** | User-started overnight capture, local detection, event timeline, optional encrypted clips, deletion controls and export. | Validate overnight reliability, battery use, background behaviour and false detections on both platforms. All features are free. |
| **5: Travel support** | Flight legs, in-flight naps, home/destination views and travel scenarios; later, a separate circadian model. | Daylight-saving, layover, date-line and timezone-change cases preserve elapsed durations. Any advice states assumptions. |

These stages are implementation order, not future paywalls. Snore tracking remains a committed feature even if released after the core diary.

Do not initially build sleep-stage classification, custom wearable software, a smart alarm, cloud sync or an AI chatbot. None is required to establish the central value.

## 5. Sleep data ingestion and reconciliation

### Samsung Health and Android

Use **Samsung Health → Health Connect → app**. Samsung documents synchronisation of sleep with Health Connect. Android's `SleepSessionRecord` represents nightly sleep and daytime naps. Verify actual Samsung records on the target phone: available stages, naps, offsets and sync delays may differ. [S10, S18]

Begin with read-only sleep access. Request only data needed for visible features. Health Connect has a default historical access window relative to the initial permission grant; longer history and background reading require separate permissions and feature checks. Refresh on opening the app rather than depending solely on background execution. [S19–S20]

### iOS

Provide a separate HealthKit adapter for permitted sleep records. Before implementation, verify current Apple documentation for sleep categories, authorisation behaviour, background delivery, entitlements and publishing requirements. This is a planned integration, not a verified assumption of one-to-one Health Connect parity.

### Reconciliation rules

- Store imported observations separately from the effective sleep timeline.
- Preserve source application, source record ID, original timestamps and import metadata.
- Default source precedence can favour a user-confirmed correction, then the preferred imported source, then a phone-derived suggestion. Allow the user to inspect and change priorities.
- Never sum overlapping records blindly. Deduplicate repeated imports and reconcile partial overlaps at interval level.
- Handle upstream edits and deletions; corrections should remain auditable.
- Keep changes local by default. Do not silently overwrite Samsung Health or Apple Health records.
- A stage-bearing record can distinguish time in bed from estimated asleep time. A start/end-only record cannot establish exact sleep onset or awake periods. Preserve that distinction.
- A missing record means unknown sleep, not no sleep.
- Avoid import/export feedback loops if health-data writeback is added later.

## 6. Phone-based sleep suggestions

### Android approaches

| Approach | Benefit | Limitation |
| --- | --- | --- |
| **Usage events** | Your own inspectable algorithm can use screen-interaction events and inactivity windows. | Relevant APIs require usage access; phone inactivity does not prove sleep. [S21] |
| **Google Sleep API** | Provides inferred sleep segments/classification based on signals including movement and surrounding brightness. | Requires Google Play services and activity-recognition access; the underlying inference is not your own fully inspectable detector. Keep optional or omit from a strict open-inference build. [S22] |

Start with a simple heuristic: identify plausible inactivity intervals, compare them with recent confirmed timing, and propose a low/medium/high-confidence interval. Retain only the necessary signals, not a permanent history of which apps someone opens.

Example: “Possible sleep: 12:35 am–8:10 am. Confirm or edit.”

Account for reading, television, leaving the phone elsewhere, charging, travel and overnight awakenings. A phone-based proposal should never automatically become an unquestionable measurement.

### Cross-platform limitation

Do not assume that iOS exposes an Android-equivalent stream of other-app usage events. Scope and verify allowed iOS APIs separately. Cross-platform parity can be achieved for the diary, forecasts, exports and user-started snore sessions without identical passive detection methods.

## 7. Sleep-debt calculation and predictive modelling

### Keep three concepts distinct

| Concept | Meaning |
| --- | --- |
| **Sleep shortfall** | Recorded sleep compared with an assumed need over a defined period. |
| **Homeostatic sleep pressure** | A model of pressure increasing with wakefulness and decreasing during sleep. |
| **Circadian alignment** | An estimate of internal daily timing relative to the local schedule. |

Research supports cumulative impairment from restricted sleep, but exact biological debt cannot be read directly from phone inactivity or sleep duration. Recovery and vulnerability vary between people. [S23–S25]

### MVP calculation

For a complete rolling window with a constant assumed need:

```text
estimated_shortfall_hours = max(
    0,
    assumed_need_hours_per_24h * window_duration_hours / 24
    - total_effective_sleep_hours_within_window
)
```

Use a precisely defined interval, such as the preceding 14 × 24 elapsed hours, and clip sleep sessions to its boundaries. Local-day charts are a separate presentation layer. If the assumed need varies across the window, integrate the applicable need over each interval rather than applying today's value to everything without explanation.

Fourteen days is a product choice, not a universal physiological law. RISE also uses a rolling 14-night window and describes recent-night weighting; the simple formula above does not reproduce RISE's proprietary model. [S5]

Rules:

- Include naps and night sleep once, after overlap reconciliation.
- Keep assumed need user-adjustable. Habitual average sleep does not establish physiological need.
- Show recorded coverage and uncertainty. If substantial data are missing, withhold the full-window headline or clearly mark a partial-data result; do not insert zero sleep.
- Explain that old shortfall can leave the rolling window without proving complete biological recovery.
- Prevent unlimited “banked sleep” claims. The displayed floor at zero is bookkeeping, not proof that oversleep can offset any later deficit.
- Version the algorithm and preserve the assumptions behind historical derived results.
- Provide a per-session/per-day explanation of how the result was produced.

### Prediction progression

1. **Conditional forecasts:** Calculate what would happen under user-entered future nights and naps. This is useful prediction without machine learning.
2. **Timing forecasts:** Use robust recent confirmed sleep timing to suggest likely onset/wake intervals, with uncertainty.
3. **Local personalisation:** Train or calibrate small models from confirmed records if sufficient data exist. Do not infer sleep need merely by reproducing a chronically restricted schedule.
4. **Research model:** Consider a published two-process model for separate sleep-pressure/circadian estimates. Validate it rather than presenting a generic curve as personalised physiology. [S26]

Use chronological holdouts for validation. Compare against simple schedule baselines; report onset/wake-time error, duration error, missed sessions and confidence calibration. Wearable and manual labels also have uncertainty. Do not claim clinical accuracy from agreement with one consumer tracker.

## 8. Naps

- Support both retrospective entry and a start/stop timer.
- Store naps as ordinary sleep intervals with an optional user-facing nap label, not in an unrelated data silo.
- Include naps in the same reconciled timeline and export schema as night sleep.
- Distinguish intended nap duration from confirmed estimated sleep duration.
- Allow naps during flights and across timezone changes.
- Offer conditional planning before introducing precise claims about ideal timing or recovery.

RISE already counts naps towards its sleep estimate and debt, so this is an essential capability rather than a unique feature. [S2]

## 9. Flights, timezones and jet lag

Build timezone correctness into the initial data model. Add circadian advice after the basic diary is reliable.

### Storage rules

- Store actual sleep start/end as UTC instants and calculate durations from those instants.
- Preserve available original local times, UTC offsets and IANA timezone IDs, such as `America/New_York` or `Australia/Sydney`.
- A UTC offset alone does not encode future daylight-saving rules.
- Health imports may not provide a full zone ID. Preserve known offsets and mark inferred/unknown zones rather than fabricating precision.
- A phone timezone change must never alter how long a recorded sleep lasted.
- Treat ambiguous or nonexistent local times during daylight-saving transitions explicitly.

### Flight model

Capture each leg's departure/arrival instants, departure/arrival zones, optional airport identifiers, layovers and actual sleep intervals. Allow planned destination bed/wake times and whether the traveller intends a full shift or a short-trip strategy. Manual itinerary entry avoids requiring a commercial flight API in the MVP.

Travel views should show actual sleep on a continuous timeline plus home/destination local representations. Keep estimated sleep shortfall and estimated circadian misalignment separate: adequate sleep duration does not eliminate jet lag.

Timeshifter already offers specialist itinerary-based advice, while RISE describes gradual schedule adjustment after travel. Do not implement a universal “one day per hour” rule as a validated individual prediction. Precise light-exposure and melatonin schedules require additional evidence and validation. [S3, S14]

## 10. Free snore tracking

All detection, history, optional clips and export remain free. The feature is optional and user-started.

### Proposed pipeline

1. Obtain microphone permission with a clear explanation and recording indicator.
2. Capture audio through a platform-specific recording adapter.
3. Process short windows in memory: preprocessing, candidate detection and local classification.
4. Merge adjacent detections into events and record confidence.
5. Discard raw audio by default.
6. If explicitly enabled, retain short encrypted review clips with configurable expiry.
7. Display a timeline and export metadata independently of audio.

### User-facing outputs

| Output | Definition |
| --- | --- |
| Event timeline | Start/end times of detected snore-like audio. |
| Estimated duration | Time classified as snoring, using a documented merging/window policy. |
| Confidence | Detector output or calibrated confidence, clearly distinguished from clinical certainty. |
| Optional clips | Short recordings for user review, encrypted and subject to retention controls. |
| Corrections | User labels such as snoring, speech, music or background noise. |
| Export | Event times, durations, model version, confidence and recording coverage; audio exported separately. |

Do not label uncalibrated microphone amplitude as clinical sound-pressure levels. If a proportion is shown, state whether its denominator is valid recording time or estimated sleep time.

### Model requirements and validation

Evaluate candidate open audio models and simpler baselines before selecting a runtime or promising accuracy. Prefer a small model that runs efficiently on both platforms. Publish weights, licence, preprocessing, inference code, thresholds and an evaluation report. Document training-data provenance and limitations; do not redistribute restricted or private recordings.

Test precision/recall, event-level errors, false positives per hour, recording coverage, battery consumption, thermal behaviour and representative older devices. Include fans, speech, music, coughs, pets, a snoring partner, different rooms and phone placements. A microphone may not identify which person produced the sound.

### Recording lifecycle and privacy

Overnight audio requires native platform lifecycle support, not a JavaScript timer kept alive all night. Prototype current Android foreground-service/microphone requirements and iOS audio-session/background-mode behaviour early. Verify interruptions, screen lock, calls, permission revocation, process termination, low storage and unplugged operation. Current platform documentation and review requirements must be checked before implementation.

Audio may capture partners or conversations. Default to event metadata only; make recording status, clip retention and delete-all controls prominent. Diagnostic uploads must never silently include audio.

Snore detection cannot establish sleep stages or diagnose sleep apnoea. Avoid presenting it as a medical screening or treatment feature without appropriate evidence and a separate regulatory assessment.

## 11. Technology options and recommendation

| Option | Strength | Trade-off for this project | Assessment |
| --- | --- | --- | --- |
| **React Native + Expo + TypeScript** | Shared Android/iOS UI and domain logic; reuses existing JavaScript skills. | Native code or audited community modules are needed for health access, usage events and overnight audio. | **Recommended for this cross-platform project.** |
| **React Native without Expo** | Full direct control over native projects. | More setup and maintenance. | Use if a concrete dependency makes Expo's workflow unhelpful. |
| **Flutter + Dart** | Strong shared UI and testing ecosystem. | New language; health/audio integrations still depend on plugins or native platform channels. | Credible alternative, with no decisive advantage for the user's current skills. |
| **Kotlin + Jetpack Compose** | Direct Android API access and a cohesive Android codebase. | Does not by itself deliver the iOS product. | Good Android-only choice, not the final cross-platform recommendation. |
| **Kotlin Multiplatform / Compose Multiplatform** | Can share domain logic and potentially UI across platforms. | Additional platform/build learning and native integration complexity. | Viable if Kotlin becomes a deliberate learning goal. |
| **Separate Kotlin and Swift apps** | Maximum native platform control. | Two UI implementations and more duplicated integration/testing effort. | Strong technically, expensive for a solo MVP. |
| **Ionic/Capacitor + React** | Extensive web-code reuse. | Native plugins still required; web layer does not simplify overnight audio. | Suitable for a diary prototype, less attractive for the complete scope. |
| **PWA** | Fast web deployment and a simple calculator demo. | Ordinary browser APIs do not provide the required full native integrations. | Companion tool only. |
| **.NET MAUI** | Useful for an existing C#/.NET developer. | Another ecosystem to learn without a clear project-specific benefit. | Not preferred here. |
| **Java + XML** | Established native Android approach. | Android-only and less attractive than Kotlin/Compose for a new app. | Mainly relevant to existing codebases. |

React Native and Expo core are MIT-licensed. Expo supports custom native code through development builds; local production builds can use native tooling. Expo's hosted services are optional, not a required backend for the application. [S27–S30]

**Do not depend on Expo Go for the full project.** Health integrations, custom recording support and SQLCipher require the appropriate native development build. Expo documents SQLCipher support and explicitly states it is unavailable in Expo Go. Verify that encryption is enabled in the actual binary; a key pragma alone is insufficient. [S31]

Flutter's platform-channel model remains a legitimate alternative. Native Compose is Android's recommended modern UI toolkit, but the earlier Android-only recommendation is superseded by the cross-platform requirement. [S32–S33]

## 12. Proposed cross-platform architecture

Use a single app repository with shared TypeScript logic and small, explicit native adapters. Avoid a backend in the initial product.

| Layer | Proposed implementation |
| --- | --- |
| UI | React Native with Expo; navigation and accessible reusable components. |
| Domain engine | Pure TypeScript interval reconciliation, shortfall calculations, forecasts, nap handling and travel logic. No Android/iOS calls in calculation functions. |
| Data access | Repository interfaces for observations, effective sessions, trips, audio events, settings and exports. |
| Persistence | SQLite with SQLCipher through a verified supported integration. Keep sensitive preferences in encrypted storage too. |
| Key protection | Platform-protected storage: Android Keystore and appropriate iOS Keychain protection. Audit wrapper semantics, accessibility and backup behaviour. |
| Health adapters | Android Health Connect; iOS HealthKit. Validate current API access and licence compatibility. |
| Usage adapter | Android usage-event access, optional. Separate iOS feasibility assessment. |
| Audio adapters | Native recording/lifecycle handling plus a cross-platform-compatible local inference runtime. Keep long-running capture outside JS scheduling. |
| Scheduling | Native facilities for permitted deferred work and local reminders. WorkManager may serve the Android implementation; do not promise exact execution times. |
| Portability | Versioned JSON, CSV datasets, optional audio bundle and independently restorable encrypted backup. |
| Testing | Domain unit/property tests, storage/migration tests, native integration tests and physical-device overnight checks. |

### Suggested repository organisation

```text
src/
  screens/
  components/
  domain/
    intervals/
    reconciliation/
    shortfall/
    forecasting/
    travel/
  data/
    repositories/
    database/
    migrations/
  integrations/
    health/
    usage/
    audio/
  portability/
  settings/
modules/
  platform-health/
  platform-audio/
  android-usage/
models/
  model-cards/
docs/
  algorithms/
  export-schema/
  build-and-test/
tests/
  fixtures/
```

This is an organisational suggestion, not a requirement to create a complex multi-package workspace. Keep the first implementation small.

### Core entities

| Entity | Important fields |
| --- | --- |
| Sleep observation | ID, source/source record ID, UTC start/end, known offsets/zones, optional stages, confidence, imported/modified timestamps. |
| User correction | Target observation/session, edited intervals, confirmation state, timestamp and revision information. |
| Effective sleep session | Reconciled intervals, contributing sources, night/nap label, calculation provenance and quality flags. |
| Need setting | Hours per 24 hours, effective date, user confirmation and version. |
| Derived result | Model ID/version, input IDs or snapshot reference, assumptions, coverage, shortfall and generation time. |
| Trip and flight leg | Departure/arrival instants and zones, layovers, planned destination schedule and optional airport identifiers. |
| Audio session | Recording interval, valid coverage, detector version, capture settings and interruption metadata. |
| Snore event/clip | UTC start/end, score, user label, optional encrypted clip reference and expiry. |

## 13. Security and complete export

### Encryption design

Generate a random per-installation database key. Protect it using platform key facilities; do not hardcode keys or use a shared application secret. SQLCipher encrypts the database; Keystore/Keychain protects key material. Android Keystore keys can be non-exportable and usage-restricted. [S34–S35]

Define the threat model: protection of stored app data and backups, not guaranteed protection against a fully compromised device or someone using an unlocked authorised session.

- Encrypt sensitive tables, notes, derived results and retained audio.
- Use maintained authenticated-encryption libraries for files and portable backups.
- Keep health data out of debug logs, analytics, crash payloads and notification previews.
- Configure operating-system cloud backup and device transfer explicitly; exclude unrecoverable device-key-bound blobs or design a tested recovery flow.
- Check how user-authentication-bound keys interact with recording while the screen is locked. Strong protection settings must not silently break overnight capture.
- Test key invalidation and loss without silently creating a new empty database that looks like lost history.
- App encryption protects this app's copies, not Samsung Health's or platform health-store copies.

### Export formats

| Format | Requirements |
| --- | --- |
| **CSV** | Spreadsheet/Python-friendly tables for sessions, naps, snore events, trips and optional summaries. Include UTC and original local representations, source, confidence and confirmation state. |
| **Versioned JSON** | Lossless data, corrections, relevant settings, model versions and travel records. Document schema and compatibility rules. |
| **Encrypted backup** | Restore on another device with a password/recovery secret independent of the original phone's non-exportable key. Use a maintained password-based encryption design. |
| **Optional audio bundle** | Explicitly selected clips, with a metadata manifest and clear encryption choice. Never include clips unexpectedly in a routine CSV export. |

Offer date filters and an unfiltered complete export. Document units and timestamp formats. Preserve unknown values rather than substituting misleading defaults. Apply CSV escaping and mitigate spreadsheet-formula interpretation for user-entered text fields.

Warn at the point of creating an unencrypted export that it contains sensitive information. Do not block portability behind repeated prompts. Provide atomic import, validation, duplicate handling, schema migrations and useful errors for malformed or newer files.

Export/import round trips must preserve canonical data. Derived summaries can be recomputed, but retain the model metadata necessary to explain historical results. Deleting all local app data should also remove retained clips and relevant keys, with any external exports clearly outside that operation.

## 14. Development and testing

### Local development

- Use the MacBook for shared TypeScript work, Android Studio/Android SDK tooling and Xcode for iOS work.
- Build custom Expo development clients for each platform. Rebuild after native dependency/configuration changes; ordinary JavaScript changes can iterate faster.
- Test Android on the Samsung phone as well as an emulator. Use an iOS simulator for UI work, then a physical iPhone for health permissions and overnight audio validation.
- Development installs do not require publishing to Google Play. Verify current Apple signing/device-testing requirements separately.
- Keep fixtures synthetic and version-controlled. Do not commit personal sleep history, audio, signing secrets, database keys or backup passwords.
- Use CI for calculations, formatting, type checks and feasible build/integration checks. Keep distribution credentials private and documented separately.

### Meaningful test matrix

| Area | Cases |
| --- | --- |
| Time | Midnight crossings, daylight-saving repeats/gaps, date-line travel, changing phone zones, partial-window sessions and multi-leg flights. |
| Reconciliation | Duplicate sources, partial overlaps, repeated sync, upstream edits/deletions, late wearable data and local corrections. |
| Models | Naps, missing days, changed assumed need, zero-floor behaviour, rolling-window boundaries, forecasts and version upgrades. |
| Storage | Encrypted open/close, migrations, malformed data, interrupted writes, key invalidation and insufficient storage. |
| Portability | Complete round trip, wrong backup password, corrupted archive, fresh-device restore, import duplicates and unsupported schema versions. |
| Permissions | Denied, partially granted and revoked health/microphone/usage permissions; manual operation remains functional. |
| Overnight audio | Screen lock, calls, interruptions, process death, battery saver, thermal constraints and recording coverage gaps. |
| Detection quality | Background noise, speech, partners, placement differences, low-end hardware and false positives. |
| UI/accessibility | Large text, screen reader labels, accessible charts, timezone entry and understandable uncertainty. |

Google's Health Connect Toolbox can insert and read test records for Android integration testing. It does not replace checking real Samsung synchronisation. [S36]

## 15. Publishing and distribution

### Android

At the research date:

- Google Play registration costs US$25 once. [S37]
- New personal developer accounts created after 13 November 2023 generally require a closed test with at least 12 testers continuously opted in for 14 days before applying for production access. [S38]
- Complete Data safety, the health-app declaration and applicable Health Connect permissions/disclosures. Prepare a privacy policy and accurate wellness claims. [S39–S40]
- Check current target-SDK, foreground-service, microphone, signing and release requirements immediately before submission.

Publish source and optionally signed Android release binaries independently of Google Play. Assess F-Droid eligibility if desired; proprietary optional dependencies may require separate build variants and repository-policy review.

### iOS

Plan App Store distribution and document source builds. Verify current developer membership costs, signing requirements, privacy disclosures, HealthKit entitlements, microphone/background-audio rules and model/runtime compatibility before committing to a release date. These details were not fully researched in the initial Android-led survey.

Being open source does not remove app-store policies or platform signing requirements. Keep public build instructions complete without exposing signing credentials.

## 16. Decisions and unresolved research

| Decision | Current direction / next step |
| --- | --- |
| Platforms | Android and iOS; do not narrow to Android-only. |
| Price | All features free, including snore tracking and export. |
| Stack | React Native + Expo + TypeScript, with native adapters and custom development builds. |
| Backend | None required for core product. |
| Storage | Encrypted local database and clips; independently recoverable encrypted backup. |
| Sleep model | Explainable shortfall bookkeeping first; conditional forecasts before personalised physiological claims. |
| Existing tracker | Samsung Health through Health Connect first; HealthKit separately validated. |
| Passive detection | Optional Android suggestions; iOS capability investigation remains open. |
| Snore model | Not selected. Licence, weights, dataset provenance, performance and runtime must be evaluated. |
| Travel | Timezone-correct records immediately; circadian advice later. |
| App licence | Not selected. Review dependency and distribution compatibility. |
| Branding | Working title only; check naming conflicts, including existing OpenSleep branding, before launch. |

Recommended first concrete milestone: **an encrypted cross-platform manual diary with naps, an explainable shortfall calculation and a complete export/restore cycle**, preceded by small feasibility checks for health integration and overnight audio.

## 17. Sources

Primary product documentation, repositories, platform documentation and original research used in the preceding discussion. Links and policies can change. Competitor pricing and features should be rechecked before publication. Proposed architecture and product decisions are recommendations, not claims that a build has already been tested.

- **S1:** [RISE — How does RISE track my sleep?](https://help.risescience.com/hc/en-us/articles/40624579537303-How-does-RISE-track-my-sleep)
- **S2:** [RISE — How do naps affect my sleep debt?](https://help.risescience.com/hc/en-us/articles/40621805049495-How-do-naps-affect-my-sleep-debt)
- **S3:** [RISE — Energy schedule after travelling](https://help.risescience.com/hc/en-us/articles/40610618075543-Why-does-my-RISE-Energy-Schedule-look-wrong-after-traveling)
- **S4:** [RISE — Can I use RISE for free?](https://help.risescience.com/hc/en-us/articles/4405177919895-Can-I-use-RISE-for-free)
- **S5:** [RISE — Why did my sleep debt go up even though I slept well?](https://help.risescience.com/hc/en-us/articles/40610367729687-Why-did-my-sleep-debt-go-up-even-though-I-slept-well)
- **S6:** [Sleep as Android — Google Play listing](https://play.google.com/store/apps/details?id=com.urbandroid.sleep)
- **S7:** [Sleep as Android — Privacy](https://sleep.urbandroid.org/docs/general/privacy.html)
- **S8:** [Sleep as Android — Backup and export](https://sleep.urbandroid.org/docs/services/backup_data.html)
- **S9:** [Sleep as Android — Jet-lag prevention](https://sleep.urbandroid.org/docs/sleep/jetlag.html)
- **S10:** [Samsung Developer — Health Connect FAQ](https://developer.samsung.com/health/health-connect-faq.html)
- **S11:** [Samsung — Download or erase personal Samsung Health data](https://www.samsung.com/us/support/answer/ANS10001379/)
- **S12:** [Sleep Cycle — Privacy policy and portability](https://sleepcycle.com/privacy-policy/en-v2)
- **S13:** [Sleep Cycle — Sleep Goal](https://sleepcycle.com/sleep-talk/sleep-goal)
- **S14:** [Timeshifter — Jet Lag app](https://www.timeshifter.com/jet-lag-app)
- **S15:** [Plees Tracker — Repository](https://github.com/vmiklos/plees-tracker)
- **S16:** [Somn — Repository](https://github.com/Vic-41148/somn)
- **S17:** [OpenSleep — Product website](https://www.opensleep.tech/)
- **S18:** [Android Developers — Track sleep sessions](https://developer.android.com/health-and-fitness/health-connect/features/sleep-sessions)
- **S19:** [Android Developers — Read Health Connect data](https://developer.android.com/health-and-fitness/health-connect/read-data)
- **S20:** [Android Developers Blog — Background and historical reads](https://android-developers.googleblog.com/2025/03/health-connect-jetpack-sdk-now-in-beta.html)
- **S21:** [Android Developers — UsageStatsManager](https://developer.android.com/reference/android/app/usage/UsageStatsManager)
- **S22:** [Google for Developers — Sleep API](https://developers.google.com/location-context/sleep)
- **S23:** [Van Dongen et al. (2003) — The cumulative cost of additional wakefulness](https://pubmed.ncbi.nlm.nih.gov/12683469/)
- **S24:** [Van Dongen et al. (2003) — Sleep debt: theoretical and empirical issues](https://onlinelibrary.wiley.com/doi/abs/10.1046/j.1446-9235.2003.00006.x)
- **S25:** [Belenky et al. (2003) — Performance degradation and restoration during restriction and recovery](https://pubmed.ncbi.nlm.nih.gov/12603781/)
- **S26:** [Van Dongen and Dinges (2003) — Homeostatic and circadian processes](https://pubmed.ncbi.nlm.nih.gov/12941057/)
- **S27:** [React Native — Repository and licence](https://github.com/react/react-native)
- **S28:** [Expo — Repository and licence](https://github.com/expo/expo)
- **S29:** [Expo — Introduction to development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- **S30:** [Expo — Local app build overview](https://docs.expo.dev/guides/local-app-overview/)
- **S31:** [Expo — SQLite and SQLCipher](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **S32:** [Flutter — Platform channels](https://docs.flutter.dev/platform-integration/platform-channels)
- **S33:** [Android Developers — Jetpack Compose](https://developer.android.com/compose)
- **S34:** [SQLCipher for Android — Repository and Room integration](https://github.com/sqlcipher/sqlcipher-android)
- **S35:** [Android Developers — Keystore](https://developer.android.com/privacy-and-security/keystore)
- **S36:** [Android Developers — Health Connect Toolbox](https://developer.android.com/health-and-fitness/health-connect/test/health-connect-toolbox)
- **S37:** [Google Play — Get started with Play Console](https://support.google.com/googleplay/android-developer/answer/6112435)
- **S38:** [Google Play — Testing requirements for new personal accounts](https://support.google.com/googleplay/android-developer/answer/14151465)
- **S39:** [Android Developers — Publish your health app](https://developer.android.com/health-and-fitness/health-connect/publish)
- **S40:** [Google Play — Health apps declaration](https://support.google.com/googleplay/android-developer/answer/14738291)

## 18. Australian launch context

**Added 3 November 2026.** The developer is usually based in Australia. This section supplements the global product/architecture plan with Australian market, privacy, recording and regulatory considerations. It is a research-based planning assessment, not a definitive determination that a particular release is compliant.

### 18.1 Market and positioning

Australia is not a separate empty market: RISE and SnoreLab have Australian App Store listings. Compete on the product commitments rather than on being locally available. [A1–A2]

SnoreLab is an especially relevant competitor omitted from the initial comparison. Its own FAQ says detection works on-device without internet and recordings stay local unless optional backup is enabled. Local processing alone therefore does not differentiate this project. The same FAQ says export requires Premium, free playback is limited, and after the first five sessions its free version cannot run on consecutive days. [A3]

The stronger proposed distinction is **free ongoing snore tracking, free complete export, openly inspectable detection and calculations, encrypted local storage, and integration with sleep/nap/travel planning**. Confirm competitor behaviour in installed Australian Android/iOS builds before making public comparison claims.

Australian App Store pages display multiple in-app-purchase products, including historical/promotional variants. Do not treat a listed price as the single currently offered subscription or compare mismatched billing periods. Prefer checking actual Australian checkout screens when producing a pricing comparison. This project remains free; store distribution still has developer costs.

### 18.2 TGA boundary: consumer wellness versus medical claims

The TGA's general health/wellness software exclusion, item 14B, expressly includes non-invasive sleep monitoring. Its scope depends on intended use and claims, including whether the product is for clinical practice or serious-disease purposes. The developer must assess applicability before Australian supply. [A4]

**Assessment:** A consumer sleep diary, transparent shortfall estimate and snore-sound timeline appear compatible with a wellness positioning, subject to the actual implementation and claims. Apnoea screening, disease-risk predictions or treatment recommendations need a separate regulatory assessment. A disclaimer alone cannot establish exclusion.

| Feature | Proposed release wording | Claims requiring further assessment |
| --- | --- | --- |
| Sleep shortfall | Estimated shortfall relative to your chosen sleep need. | Diagnoses a sleep disorder or measures exact physiological impairment. |
| Snore detection | Identifies sounds that may be snoring; accuracy depends on recording conditions. | Detects sleep apnoea, excludes disease or proves breathing is normal. |
| Forecasts | Shows scenarios based on recorded sleep and stated assumptions. | Certifies fitness to drive, operate machinery or undertake safety-critical work. |
| Travel planning | Organises sleep and naps across timezones. | Disease-treatment or personalised medication claims. |

The wording in the right column is a list of proposed exclusions from this release, not an assertion that every such claim follows the same legal classification. Reassess if adding clinical workflows, breathing-disturbance scoring, health-professional dashboards or medication scheduling.

### 18.3 Australian privacy obligations

Do not assume the usual small-business turnover exemption resolves privacy law. OAIC states that organisations providing a health service and holding health information are covered even when small. Recording health to assess or improve it can be a health service. Whether this developer's entirely local architecture meets the relevant collection/holding tests requires analysis of actual possession, control and data flows. [A5]

Being free and open source does not itself settle that analysis. In particular, a support email, uploaded diagnostic bundle, optional crash service or model-training submission could give the developer information even if ordinary sleep records never leave the phone. Design to Australian Privacy Principle standards from the start rather than relying on an untested exemption.

For a NSW-based operation, also assess the Health Records and Information Privacy Act 2002 and applicable Health Privacy Principles. NSW IPC identifies obligations for private health service providers. Other state/territory laws may matter depending on operation and users; a NSW review is not an Australia-wide legal conclusion. [A6]

Practical implementation:

- Publish a plain-language policy naming the operator and explaining local processing, microphone use, integrations, retention, support communications and complaints/contact details.
- Explain each sensitive-data permission at the feature where it is needed. Operating-system permission alone is not a complete privacy notice.
- Keep health integration and microphone use optional; manual logging must remain functional.
- Implement local access, correction, deletion and complete export.
- Keep analytics and health/audio diagnostics disabled by design; do not collect information speculatively.
- Document a small privacy impact/data-flow assessment, including libraries, backups, crash logs and user-selected sharing destinations.
- Make “we do not receive your sleep records or audio” the verifiable promise if accurate. Do not claim “the app collects no data” while it reads and stores sensitive information locally.

OAIC's developer guidance supports minimisation, specific sound permission, encryption, deletion and transparency. [A7]

### 18.4 Overseas processing and backups

Australian privacy law does not generally ban overseas cloud storage. APP 8 can impose conditions and accountability for cross-border disclosure; some tightly controlled outsourcing arrangements are characterised differently. Australian hosting is therefore not a universal compliance shortcut. [A8]

For this project, the cleanest architecture remains no developer-operated health-data server. Explicitly configure OS backup/device transfer. An export selected by the user can reach their own overseas cloud or email provider; explain the boundary rather than promising that exported data can never leave Australia. Keep public code hosting separate from production data: never put users' health records or recordings in public issues.

### 18.5 Snore tracking and Australian recording laws

Snoring itself is not automatically a private conversation. However, ambient overnight microphones can capture speech from partners, housemates or visitors. NSW's Surveillance Devices Act 2007, particularly sections 7 and 11, regulates certain listening-device uses and later communication/publication, subject to exceptions. [A9]

Implementation recommendations:

- Make sessions deliberately user-started, with an obvious active state and stop control.
- Explain that others in the room may be captured; provide guidance to obtain their agreement before recording.
- Default to transient local processing and event metadata; retained clips require an explicit opt-in.
- Offer short retention and immediate deletion of clips.
- Never present speech filtering or “we do not save the whole night” as proof that recording law is satisfied: the underlying use of the microphone also matters.
- Review relevant state/territory laws before an Australia-wide launch. A consent checkbox is not a substitute for that assessment.

This is a product-design implication of the recording risk, not a finding that every snore session is prohibited.

### 18.6 Australian time handling and travel tests

Australia's half-hour offsets and mixed daylight-saving rules make it an excellent test market. NSW Government documents central time at UTC+9:30, Lord Howe standard time at UTC+10:30 and a 30-minute Lord Howe daylight-saving shift. Queensland, NT and WA do not observe daylight saving. [A10]

| Test | Required behaviour |
| --- | --- |
| Sydney ↔ Brisbane | Correctly handle different local offsets during Sydney daylight saving. |
| Adelaide ↔ Darwin | Respect half-hour offsets and differing daylight-saving observance. |
| Lord Howe transition | Handle a 30-minute clock change without assuming every transition is one hour. |
| Broken Hill | Use its own IANA zone rules rather than assigning Sydney time because it is in NSW. |
| Sydney ↔ Los Angeles | Preserve elapsed sleep across date-line travel and flight legs. |
| NSW clock-change night | Calculate durations using instants, not naive subtraction of displayed local times. |

Use IANA IDs such as `Australia/Sydney`, `Australia/Brisbane`, `Australia/Adelaide`, `Australia/Darwin`, `Australia/Lord_Howe` and `Australia/Broken_Hill`. Format dates using the user's locale and include explicit offsets in export. These are proposed engineering requirements based on the documented time rules.

### 18.7 Publishing from Australia

No architecture change is required merely because the developer is Australian. React Native/Expo, native health adapters and encrypted local storage remain the proposed stack. Publishing an Australian-first release does not imply that worldwide availability has been approved or researched.

Google Play's US$25 registration fee and relevant new-personal-account testing requirements remain the global planning baseline; verify the amount charged during Australian enrolment. [S37–S38]

Apple's published programme fee is US$99 annually, with local pricing where available. Check the Australian enrolment amount rather than assuming an exchange-rate conversion. An individual/sole-proprietor enrolment lists the developer's personal legal name as seller; organisation enrolment has additional legal-entity requirements. Do not form a company solely on the assumption that a brand name can be used for an individual account. [A11]

Open source and a free download do not eliminate developer membership, signing or store-policy obligations. Australian availability also does not establish compliance for overseas markets.

### 18.8 Revised Australian launch priorities

1. Retain the cross-platform, fully free/open-source commitments and the existing phased roadmap.
2. Prototype encrypted storage, health imports and an overnight audio session on real Australian-configured devices.
3. Record an intended-use statement and an assessment of the relevant TGA exclusion before public release.
4. Assess federal/NSW privacy applicability against actual data flows; publish accurate notices and controls.
5. Review recording-law implications before releasing retained snore clips.
6. Add Australian timezone edge cases to automated tests immediately.
7. Compare installed Australian RISE/SnoreLab offerings, especially export restrictions and recording limits.

The Australian angle strengthens the privacy and travel story, but the central proposition remains global: a transparent, portable, free sleep toolkit rather than a geographically exclusive competitor.

### Australian research sources

- **A1:** [RISE — Australian App Store](https://apps.apple.com/au/app/rise-energy-sleep-tracker/id1453884781)
- **A2:** [SnoreLab — Australian App Store](https://apps.apple.com/au/app/snorelab-record-your-snoring/id529443604)
- **A3:** [SnoreLab — Official FAQ, free/Premium limits, export and local detection](https://www.snorelab.com/faq-app)
- **A4:** [TGA — General health or wellness software exclusion](https://www.tga.gov.au/resources/guidance/understanding-general-health-or-wellness-software-exclusion)
- **A5:** [OAIC — What is a health service provider?](https://www.oaic.gov.au/privacy/your-privacy-rights/health-information/what-is-a-health-service-provider)
- **A6:** [NSW IPC — Private healthcare providers and health privacy](https://www.ipc.nsw.gov.au/healthcare-providers)
- **A7:** [OAIC — Mobile app developer privacy guide](https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/more-guidance/mobile-privacy-a-better-practice-guide-for-mobile-app-developers)
- **A8:** [OAIC — Sending personal information overseas](https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/handling-personal-information/sending-personal-information-overseas)
- **A9:** [NSW — Surveillance Devices Act 2007](https://legislation.nsw.gov.au/view/html/inforce/current/act-2007-64)
- **A10:** [NSW Government — Time definitions and regulation](https://dcj.nsw.gov.au/about-us/daylight-saving/definitions-of-time-and-how-time-is-regulated.html)
- **A11:** [Apple Developer — Programme enrolment, seller identity and membership fees](https://developer.apple.com/help/account/membership/program-enrollment)
