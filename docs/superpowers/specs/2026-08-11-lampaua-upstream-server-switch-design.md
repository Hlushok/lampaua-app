# LampaUa Upstream Update and Server Switch Design

## Goal

Update the native LAMPA Android source to the latest upstream release available on 2026-08-11 and restore server switching for users, but only between the two approved LampaUa server addresses.

## Current Context

- Release repository root: `D:\opt\lampaua-app`
- Native Android source: `D:\opt\lampaua-app\native\LAMPA`
- Current published app release context: `v1.2.0`
- Local native source is based on upstream `lampa-app/LAMPA` `v1.12.5`.
- Upstream `lampa-app/LAMPA` has newer releases through `v1.12.9`.
- Current app package must remain `com.lampaua.app` so users can update over the existing app.
- Current default server is `https://kinohub.uk/`.
- Legacy server is `http://lampaua.mooo.com/`.

## User-Facing Behavior

On fresh install, LampaUa App opens `https://kinohub.uk/`.

In the app menu, the user can change the server, but only by choosing one of:

- `https://kinohub.uk/`
- `http://lampaua.mooo.com/`

The user can switch between these two addresses repeatedly. Arbitrary URL entry stays unavailable.

If a previously installed app has an unsupported saved URL, the app falls back to `https://kinohub.uk/`.

## Architecture

Keep the existing native Android app structure and upstream merge workflow.

Use the existing `BuildConfig.defaultAppUrl` as the primary default URL and add a small LampaUa-specific allowlist for server choices in app preferences/UI code. The allowlist should live close to existing URL preference logic so startup migration, menu switching, and URL validation use the same source of truth.

Restore the menu entry for server switching, but route it to a choice dialog rather than the old free-text input dialog.

## Upstream Update Strategy

Use the existing `tools\update-lampaua-native-source.ps1 -Apply` workflow or equivalent git steps:

1. Fetch upstream `origin/main` inside `native\LAMPA`.
2. Preserve local LampaUa customizations.
3. Fast-forward or merge upstream changes.
4. Restore and resolve LampaUa customizations.
5. Rebuild the release APK.

Local customizations that must survive the upstream update:

- `applicationId "com.lampaua.app"`
- app label `LampaUa`
- search provider authority `com.lampaua.app.atvsearch`
- generated LampaUa icon and TV banner assets
- release signing config behavior
- version override support through `lampauaVersionCode` and `lampauaVersionName`
- UA Player bridge behavior added for `v1.2.0`
- default server `https://kinohub.uk/`
- controlled server switcher for the two approved URLs

## Error Handling

If the saved URL is empty, missing, legacy, or unsupported, startup should normalize it to `https://kinohub.uk/`.

If the user opens the server switcher and selects the current server, reload the current URL or close without changing state. If the user selects the other server, save it, update `LAMPA_URL`, add it to URL history if that mechanism remains useful, and load it.

If upstream merge conflicts occur, resolve them in `native\LAMPA` without discarding local LampaUa changes.

## Testing

Minimum verification before release:

- Build `FullRelease` APK with the local release script.
- Verify package, label, version code, and version name with `aapt dump badging`.
- Verify APK signature with `apksigner verify --verbose`.
- Confirm generated release `BuildConfig.defaultAppUrl` is `https://kinohub.uk/`.
- Confirm source contains only the two approved selectable server URLs for LampaUa server switching.
- Run a targeted source check that arbitrary URL input is not available from the menu.

## Out of Scope

- Do not create two separate Android apps.
- Do not allow arbitrary server addresses.
- Do not rename package `com.lampaua.app`.
- Do not remove Android System WebView or make Crosswalk primary on modern devices.
- Do not publish a GitHub Release until the APK build and verification pass.
