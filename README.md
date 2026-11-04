# Snooze

Snooze is a free, open-source sleep diary and planning project in development.

**Intended use:** General wellness and personal sleep journaling. Snooze is not intended to diagnose, treat, or monitor a medical condition. Its future estimates are not measurements of biological sleep need.

## Setup

Install Node.js 24, npm, and the native tools required by [Expo's local development builds](https://docs.expo.dev/guides/local-app-development/): Android Studio and an Android SDK for Android, or Xcode and CocoaPods for iOS on macOS. Then run:

```sh
npm ci
npm run lint
npm run typecheck
npm test -- --ci
```

## Run a development build

The app uses a custom development client, not Expo Go. On a configured Android emulator/device or iOS simulator, respectively:

```sh
npm run android
npm run ios
```

These commands generate native projects and compile/install a development build locally. Physical iOS devices require appropriate Apple signing; see Expo's documentation. Once the build is installed, start Metro with `npm start` and open the app. Rebuild after changing native dependencies or native configuration. The `development` and `development-simulator` profiles in `eas.json` are optional cloud-build alternatives; EAS setup and platform credentials may be required.

The display name, URL scheme and application identifiers are provisional; replace them before distribution. See [naming and licensing](docs/foundation-review.md). Never commit signing credentials, personal sleep data or audio recordings. Tests must use synthetic fixtures.

## Structure

`src/domain` contains platform-independent logic; `data`, `integrations`, `portability`, and `screens` reserve boundaries for later work. `modules` is reserved for native modules. The [project guide](Snooze-Project-Guide.md) and [implementation plan](plan.md) describe future stages, not completed features.

## Stage 0 database verification

SQLCipher requires a custom development build; Expo Go cannot verify it. After changing native plugins, regenerate the corresponding native project with `npx expo prebuild --platform ios` or `npx expo prebuild --platform android`, then rebuild with `npm run ios` or `npm run android` and start Metro with `npm start`. Prebuild can regenerate native directories; preserve any manual native changes first. On a simulator or device, open Today and confirm the “Encrypted DB: OK” status includes a SQLCipher version. The app checks `PRAGMA cipher_version` and reads the keyed database before displaying this status. Visit Data → Open source notices to check the attribution stub. If opening fails, the app displays an error and does not erase the database. A device-bound Secure Store key may not survive transfer or restore; backup and recovery are not implemented yet. This smoke test does not independently prove that an unkeyed connection cannot read the file.
