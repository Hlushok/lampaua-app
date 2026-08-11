# LampaUa Upstream Server Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update LampaUa App to current upstream LAMPA and let users switch only between `https://kinohub.uk/` and `http://lampaua.mooo.com/`.

**Architecture:** Preserve upstream Android app structure and reapply LampaUa customizations after updating `native\LAMPA`. Centralize server allowlist in `Prefs.kt`, use it on startup, and expose a menu dialog that selects from the allowlist instead of arbitrary URL input.

**Tech Stack:** Android Gradle project, Kotlin, Gradle wrapper, PowerShell release scripts, GitHub Releases.

## Global Constraints

- Keep Android package `com.lampaua.app`.
- Fresh install default server is `https://kinohub.uk/`.
- The only alternate selectable server is `http://lampaua.mooo.com/`.
- Do not allow arbitrary URL entry from the menu.
- Keep Android System WebView primary on modern devices; do not make Crosswalk primary.
- Preserve UA Player bridge behavior from `v1.2.0`.
- Build release APK with `tools\build-lampaua-native-apk.ps1 -Variant FullRelease`.

---

### Task 1: Update Native Upstream Source

**Files:**
- Modify: `native/LAMPA` git working tree
- Verify: `native/LAMPA/app/build.gradle`
- Verify: `native/LAMPA/app/src/main/java/top/rootu/lampa/MainActivity.kt`
- Verify: `native/LAMPA/app/src/main/java/top/rootu/lampa/PlayerStateManager.kt`

**Interfaces:**
- Consumes: existing local LampaUa native customizations.
- Produces: native source based on latest `lampa-app/LAMPA` upstream with local changes restored.

- [ ] **Step 1: Inspect current upstream delta**

Run:

```powershell
git -c safe.directory=D:/opt/lampaua-app/native/LAMPA -C native\LAMPA fetch origin main
git -c safe.directory=D:/opt/lampaua-app/native/LAMPA -C native\LAMPA log --oneline HEAD..origin/main
```

Expected: upstream commits from `v1.12.5` through latest available release.

- [ ] **Step 2: Apply upstream update with local customizations preserved**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File D:\opt\lampaua-app\tools\update-lampaua-native-source.ps1 -Apply
```

Expected: source updates or reports conflicts. If conflicts occur, resolve them in `native\LAMPA`.

- [ ] **Step 3: Verify local customizations still exist**

Run:

```powershell
rg -n "com\.lampaua\.app|LampaUa|https://kinohub\.uk|com\.lampaua\.app\.atvsearch|com\.lampaua\.player" native\LAMPA\app
```

Expected: package, app label, default URL, search authority, and UA Player bridge references are present.

---

### Task 2: Add Server Allowlist and Startup Normalization

**Files:**
- Modify: `native/LAMPA/app/src/main/java/top/rootu/lampa/helpers/Prefs.kt`

**Interfaces:**
- Produces: `Prefs.APPROVED_APP_URLS: List<String>`.
- Produces: `String?.isApprovedAppUrl(): Boolean`.
- Produces: `Context.appUrl` getter that returns `BuildConfig.defaultAppUrl` for empty or unsupported saved URLs.

- [ ] **Step 1: Add approved URLs**

Add this inside `object Prefs` near `APP_URL`:

```kotlin
private const val KINOHUB_APP_URL = "https://kinohub.uk/"
private const val LAMPAUA_LEGACY_APP_URL = "http://lampaua.mooo.com/"
val APPROVED_APP_URLS = listOf(KINOHUB_APP_URL, LAMPAUA_LEGACY_APP_URL)
```

- [ ] **Step 2: Normalize `appUrl`**

Change `Context.appUrl` getter to:

```kotlin
get() {
    val savedUrl = appPrefs.getString(APP_URL, null)
    if (!savedUrl.isApprovedAppUrl()) {
        appPrefs.edit().putString(APP_URL, BuildConfig.defaultAppUrl).apply()
        return BuildConfig.defaultAppUrl
    }
    return savedUrl ?: BuildConfig.defaultAppUrl
}
```

- [ ] **Step 3: Add URL helper**

Add:

```kotlin
fun String?.isApprovedAppUrl(): Boolean {
    val normalized = this?.trim()?.trimEnd('/') ?: return false
    return APPROVED_APP_URLS.any {
        normalized.equals(it.trimEnd('/'), ignoreCase = true)
    }
}
```

---

### Task 3: Replace Forced URL Lock With Approved Server Selection

**Files:**
- Modify: `native/LAMPA/app/src/main/java/top/rootu/lampa/MainActivity.kt`
- Modify: `native/LAMPA/app/src/main/res/values/strings.xml`
- Modify: `native/LAMPA/app/src/main/res/values-uk/strings.xml`

**Interfaces:**
- Consumes: `Prefs.APPROVED_APP_URLS`.
- Consumes: `Prefs.isApprovedAppUrl`.
- Produces: menu action `showServerChoiceDialog`.

- [ ] **Step 1: Import allowlist helpers**

Add imports:

```kotlin
import top.rootu.lampa.helpers.Prefs.APPROVED_APP_URLS
import top.rootu.lampa.helpers.Prefs.isApprovedAppUrl
```

- [ ] **Step 2: Replace forced default method**

Replace `enforceDefaultLampaUrl()` with:

```kotlin
private fun enforceApprovedLampaUrl() {
    if (!appUrl.isApprovedAppUrl()) {
        appUrl = BuildConfig.defaultAppUrl
    }
    LAMPA_URL = appUrl
}
```

Call `enforceApprovedLampaUrl()` from `onCreate()` and any server-switch entry point.

- [ ] **Step 3: Restore menu item for server choice**

Add a menu item after update/close:

```kotlin
MenuItem(
    title = getString(R.string.change_url_title),
    action = "showServerChoiceDialog",
    icon = R.drawable.round_link_24
)
```

Handle action:

```kotlin
"showServerChoiceDialog" -> {
    App.toast(R.string.change_note)
    showServerChoiceDialog()
}
```

- [ ] **Step 4: Add server choice dialog**

Add:

```kotlin
private fun showServerChoiceDialog() {
    enforceApprovedLampaUrl()
    val titles = APPROVED_APP_URLS
    val selectedIndex = APPROVED_APP_URLS.indexOfFirst {
        it.trimEnd('/').equals(LAMPA_URL.trimEnd('/'), ignoreCase = true)
    }.coerceAtLeast(0)

    val dialog = AlertDialog.Builder(this).apply {
        setTitle(getString(R.string.change_url_title))
        setSingleChoiceItems(titles.toTypedArray(), selectedIndex) { dialog, which ->
            dialog.dismiss()
            val selectedUrl = APPROVED_APP_URLS[which]
            if (!selectedUrl.trimEnd('/').equals(LAMPA_URL.trimEnd('/'), ignoreCase = true)) {
                appUrl = selectedUrl
                LAMPA_URL = selectedUrl
                addUrlHistory(selectedUrl)
            }
            browser?.loadUrl(LAMPA_URL)
        }
    }.create()
    showFullScreenDialog(dialog)
}
```

- [ ] **Step 5: Keep arbitrary input unavailable**

Keep `showUrlInputDialogDisabled()` private and do not wire it to the menu.

---

### Task 4: Build and Verify Release APK

**Files:**
- Output: `dist/lampaua-release.apk`
- Output: `dist/lampaua-release-v<version>.apk`

**Interfaces:**
- Consumes: updated native source.
- Produces: signed release APK.

- [ ] **Step 1: Build release APK**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File D:\opt\lampaua-app\tools\build-lampaua-native-apk.ps1 -Variant FullRelease
```

Expected: `BUILD SUCCESSFUL` and two APK files in `dist`.

- [ ] **Step 2: Verify badging**

Run:

```powershell
$sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$aapt = Get-ChildItem (Join-Path $sdk 'build-tools') -Recurse -Filter aapt.exe | Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
& $aapt dump badging D:\opt\lampaua-app\dist\lampaua-release.apk | Select-String "package:|application-label:'"
```

Expected: package `com.lampaua.app`, label `LampaUa`.

- [ ] **Step 3: Verify signature**

Run:

```powershell
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
$sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$apksigner = Get-ChildItem (Join-Path $sdk 'build-tools') -Recurse -Filter apksigner.bat | Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
& $apksigner verify --verbose D:\opt\lampaua-app\dist\lampaua-release.apk
```

Expected: v1 and v2 signature verification are true.

---

### Task 5: Prepare Public Release Metadata

**Files:**
- Modify: `README.md`
- Create: `release-notes-v<version>.md`
- Modify: `tools/LAMPAUA_APK_README.md`

**Interfaces:**
- Consumes: final APK version and SHA-256.
- Produces: public release notes and updated private build notes.

- [ ] **Step 1: Compute SHA-256**

Run:

```powershell
Get-FileHash -Algorithm SHA256 D:\opt\lampaua-app\dist\lampaua-release-v<version>.apk
```

- [ ] **Step 2: Update README**

Set current APK link to:

```markdown
[lampaua-release-v<version>.apk](https://github.com/Hlushok/lampaua-app/releases/download/v<version>/lampaua-release-v<version>.apk)
```

- [ ] **Step 3: Create release notes**

Include:

- upstream LAMPA update through latest release;
- server switcher between `https://kinohub.uk/` and `http://lampaua.mooo.com/`;
- no arbitrary server entry;
- APK install/update instructions;
- APK SHA-256.

- [ ] **Step 4: Commit public metadata**

Run:

```powershell
git add README.md release-notes-v<version>.md
git commit -m "Prepare LampaUa App v<version> release"
```

---

### Task 6: Publish GitHub Release

**Files:**
- Upload: `dist/lampaua-release-v<version>.apk`

**Interfaces:**
- Consumes: committed release notes and signed APK.
- Produces: GitHub Release `v<version>`.

- [ ] **Step 1: Push release metadata**

Run:

```powershell
git push
```

- [ ] **Step 2: Create release**

Run:

```powershell
gh release create v<version> D:\opt\lampaua-app\dist\lampaua-release-v<version>.apk --repo Hlushok/lampaua-app --title "LampaUa App v<version>" --notes-file D:\opt\lampaua-app\release-notes-v<version>.md
```

- [ ] **Step 3: Verify release asset**

Run:

```powershell
gh release view v<version> --repo Hlushok/lampaua-app --json tagName,name,isDraft,isPrerelease,publishedAt,url,assets
```

Expected: release is not draft, not prerelease, APK asset exists, SHA-256 digest matches local APK.

## Self-Review

- Spec coverage: tasks cover upstream update, server allowlist, menu switcher, build verification, metadata, and publication.
- Placeholder scan: `<version>` is intentionally a release variable determined after build versioning; no implementation placeholder remains.
- Type consistency: `APPROVED_APP_URLS` and `isApprovedAppUrl` are defined in Task 2 and consumed in Task 3.
