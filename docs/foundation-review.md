# Foundation review

## Working name

Snooze is provisional. A web search on 3 November 2026 found [Snooze Sleep System](https://apps.apple.com/au/app/snooze-sleep-system/id6808773942), an existing sleep wellness and tracking app, and [Snooze](https://reidapps.co.uk/apps/snooze/support), a sleep-training app. These are material naming conflicts, not a trademark determination. Check trademarks, app stores and domains in target markets and select a distinctive name before release. `dev.snooze.foundation` and `snooze-dev` are placeholders, not verified ownership or availability.

## Licence and distribution

The application's own code is intended to use MIT. Third-party dependencies retain their own licences and notices; licensing the app does not relicense them. Review the installed dependency inventory and applicable notices before distributing binaries, and repeat the review when dependencies, native modules, models or distribution channels change. Model weights, datasets and bundled assets need independent provenance and licence checks. App-store signing and platform terms also apply independently of the app licence.

### Initial dependency audit (3 November 2026)

The `package-lock.json` `packages` entries are the versioned inventory, including transitive and platform-optional packages. Every entry declares a licence in its package metadata. Declared licences include MIT, ISC, Apache-2.0, BSD, Blue Oak, Unlicense, 0BSD and MIT-0. Exceptions needing attention are `lightningcss` and platform binaries (MPL-2.0, file-level obligations if distributed), `caniuse-lite` (CC-BY-4.0 attribution), `argparse` (Python-2.0), and `node-forge` (BSD-3-Clause OR GPL-2.0; the BSD option is available). These declarations are not a substitute for inspecting each package's licence and bundled notices in the eventual distribution. Generated native dependencies, platform SDK terms, production binary contents and model assets have not been audited; a release notice bundle and distribution review remain open. No dependency metadata identified an immediate obstacle to MIT licensing of Snooze's own code.

`npm audit` reported 1 low and 37 moderate dependency advisories on this date, largely affecting the development toolchain. Review and update dependencies before release; do not apply a forced major-version change without checking Expo compatibility.
