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

## Android encrypted database verification

SQLCipher requires a custom development or release build; Expo Go cannot verify it. The `expo-sqlite` config plugin enables SQLCipher. If native plugin settings change, regenerate the Android project only after preserving any manual native changes, then rebuild. A JavaScript reload alone cannot change the native SQLite library.

To run the disposable Android integration check, build and install a development client on the intended Android device, then start Metro with:

```sh
EXPO_PUBLIC_SQLCIPHER_TEST=1 npx expo start --dev-client
```

Open that server in the development client. Phase 1 creates a separate test database and SecureStore keys, checks SQLCipher and the database migrations, and writes a marker. Fully stop the app process and reopen it against the same server for phase 2. A `PHASE 2 PASS` message confirms that the stored key and marker survived restart, migration did not repeat, the missing-key guard rejected replacement, and fresh unkeyed and wrong-key connections could not read the database. The fixture is removed after phase 2. The test never uses the production database or its key. If a check fails, preserve the test fixture for diagnosis; do not clear the app's data as a troubleshooting shortcut. Restart Metro without the test environment variable to run the normal app.

For an independent check, copy the closed disposable fixture after phase 1 from a debuggable build and attempt to read it with ordinary SQLite; it should fail with `file is not a database`. A `cipher_version` result alone proves SQLCipher is present in the binary, not that a specific database is encrypted. Repeat verification for each native build configuration that needs assurance.

The current Expo SecureStore Android backup rules include shared preferences except SecureStore and do not include the SQLite file directory. Consequently the device-bound key and database are not available as a recoverable pair after uninstall or transfer; backup and recovery are not implemented. If backup rules change, preserve this exclusion or implement an explicit secure recovery design. Missing or invalid keys fail without deleting the database. The open-source notices stub is retained in the project but is not currently exposed in the app.
