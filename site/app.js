(() => {
  "use strict";

  const repository = "Hlushok/lampaua-app";
  const releasesUrl = `https://github.com/${repository}/releases/latest`;
  const releaseApiUrl = `https://api.github.com/repos/${repository}/releases/latest`;
  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const siteNavigation = document.querySelector(".site-nav");
  const fallbackRelease = {
    version: "v1.4.0",
    file: "lampaua-release-v1.4.0.apk",
    size: 60444063,
    publishedAt: "2026-10-31",
    digest: "34e77410507f7ed4c839e845993cc91237f9b8f442ab7e59ebdc0ac439ccecc2",
    releaseUrl: `https://github.com/${repository}/releases/tag/v1.4.0`,
    downloadUrl: `https://github.com/${repository}/releases/download/v1.4.0/lampaua-release-v1.4.0.apk`,
  };

  const setMenuOpen = (open) => {
    if (!header || !menuToggle) return;
    header.dataset.menuOpen = String(open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Закрити меню" : "Відкрити меню");
  };

  if (header && menuToggle && siteNavigation) {
    menuToggle.addEventListener("click", () => {
      setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
    });

    siteNavigation.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenuOpen(false);
    });

    document.addEventListener("click", (event) => {
      if (menuToggle.getAttribute("aria-expanded") === "true" && !header.contains(event.target)) {
        setMenuOpen(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
        setMenuOpen(false);
        menuToggle.focus();
      }
    });

    window.matchMedia("(min-width: 768px)").addEventListener("change", (event) => {
      if (event.matches) setMenuOpen(false);
    });
  }

  const setText = (selector, value) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
  };

  const setHref = (selector, url) => {
    document.querySelectorAll(selector).forEach((link) => {
      link.href = url;
    });
  };

  const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return "—";
    return new Intl.NumberFormat("uk-UA", {
      style: "unit",
      unit: "megabyte",
      maximumFractionDigits: 1,
    }).format(bytes / 1_000_000);
  };

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("uk-UA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const applyRelease = (release) => {
    setText("[data-release-version]", release.version || "Актуальна");
    setText("[data-release-file]", release.file || "lampaua-release.apk");
    setText("[data-release-size]", formatBytes(release.size));
    setText("[data-release-date]", formatDate(release.publishedAt));
    setText("[data-release-digest]", release.digest || "—");

    setHref('[data-download="latest"]', release.downloadUrl || releasesUrl);
    setHref("[data-release-url]", release.releaseUrl || releasesUrl);
  };

  const loadCurrentRelease = async () => {
    applyRelease(fallbackRelease);

    try {
      const response = await fetch(releaseApiUrl, {
        headers: { Accept: "application/vnd.github+json" },
      });

      if (!response.ok) throw new Error(`GitHub returned ${response.status}`);

      const release = await response.json();
      const assets = Array.isArray(release.assets) ? release.assets : [];
      const primaryApk = assets.find((asset) => /^lampaua-release-v.+\.apk$/i.test(asset.name || ""));

      applyRelease({
        version: release.tag_name || fallbackRelease.version,
        file: primaryApk?.name || fallbackRelease.file,
        size: primaryApk?.size || fallbackRelease.size,
        publishedAt: release.published_at || fallbackRelease.publishedAt,
        digest: typeof primaryApk?.digest === "string"
          ? primaryApk.digest.replace(/^sha256:/i, "")
          : fallbackRelease.digest,
        releaseUrl: release.html_url || fallbackRelease.releaseUrl,
        downloadUrl: primaryApk?.browser_download_url || fallbackRelease.downloadUrl,
      });
    } catch (error) {
      applyRelease(fallbackRelease);
    }
  };

  loadCurrentRelease();
})();
