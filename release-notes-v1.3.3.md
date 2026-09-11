<div align="center">

# LampaUa App v1.3.3

Android-додаток для користувачів сервісу **LampaUa / KinoHub**.

[![Завантажити APK](https://img.shields.io/badge/Android_APK-Завантажити-2ea44f?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Hlushok/lampaua-app/releases/download/v1.3.3/lampaua-release-v1.3.3.apk)

**Файл:** `lampaua-release-v1.3.3.apk`

</div>

## Що змінилось

- Оновлено рідну Android-обгортку LAMPA до upstream-релізу `v1.13.0`.
- Додано upstream-виправлення порівняння версій, щоб релізи типу `1.12.10` коректно визначались новішими за `1.12.9`.
- Додано upstream-покращення для Telegram/market/intent посилань, Kodi M3U playback, client request headers та вимикання screensaver під час зовнішнього плеєра.
- Збережено LampaUa package `com.lampaua.app`, назву `LampaUa`, стартову адресу `https://kinohub.uk/`, інтеграцію з UA Player і наш self-update через `Hlushok/lampaua-app`.
- Виправлено compatibility-помилки Android lint для `minSdk=16` без підняття мінімальної версії Android.

## Встановлення

1. Завантажте APK.
2. Встановіть його поверх попередньої версії LampaUa App.
3. Починаючи з `v1.3.2`, наступні опубліковані APK можуть з'являтися через вбудований updater.

## Файл релізу

| Android APK | Розмір | SHA-256 |
|---|---:|---|
| `lampaua-release-v1.3.3.apk` | 58 МБ | `1C8EDB4DB50A5078CAB049172B78E4725B62484B2B482E6A4A3405937F4A4473` |

APK універсальний і містить архітектури `arm64-v8a`, `armeabi-v7a`, `x86` та `x86_64`.
