(() => {
  "use strict";

  const REPO = "gabytz777/vib-MC";
  const API = `https://api.github.com/repos/${REPO}/releases`;

  const downloadBtns = [
    document.getElementById("download-btn"),
    document.getElementById("download-btn-cta"),
  ].filter(Boolean);
  const downloadLabel = document.getElementById("download-label");
  const releaseTag = document.getElementById("release-tag");
  const releaseDate = document.getElementById("release-date");
  const releaseSize = document.getElementById("release-size");
  const releaseNotes = document.getElementById("release-notes");
  const versionStable = document.getElementById("version-stable");

  const fmtSize = (bytes) => {
    if (!Number.isFinite(bytes)) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} kB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fmtDate = (iso) => {
    if (!iso) return "-";
    return new Date(iso).toISOString().slice(0, 10);
  };

  const firstJar = (release) => {
    const assets = release.assets || [];
    return assets.find((a) => a.name === "vib-mc.jar") || assets.find((a) => a.name.endsWith(".jar")) || null;
  };

  const notesExcerpt = (body) => {
    if (!body) return "";
    const text = body.replace(/^#+\s*/gm, "").replace(/\*\*/g, "").trim();
    return text.slice(0, 140) + (text.length > 140 ? "..." : "");
  };

  const applyRelease = (release, jar, kind) => {
    const href = jar ? jar.browser_download_url : null;
    if (kind === "stable") {
      downloadBtns.forEach((btn) => {
        if (href && btn) {
          btn.href = href;
          btn.removeAttribute("data-fallback");
        }
      });
      if (downloadLabel && release) {
        downloadLabel.textContent = `Download ${release.tag_name}`;
      }
      if (releaseTag) releaseTag.textContent = (release && release.tag_name) || "v0.0.4";
      if (releaseDate) releaseDate.textContent = fmtDate(release && release.published_at);
      if (releaseSize) releaseSize.textContent = fmtSize(jar && jar.size);
      if (releaseNotes) releaseNotes.textContent = notesExcerpt(release && release.body);
    }
  };

  window.fetch(API)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((releases) => {
      if (!Array.isArray(releases) || releases.length === 0) throw new Error("no releases");
      const stable = releases.find((rel) => !rel.prerelease && !rel.draft) || releases[0];

      applyRelease(stable, firstJar(stable), "stable");
    })
    .catch(() => {
      downloadBtns.forEach((btn) => {
        const fallback = btn && btn.getAttribute("data-fallback-url");
        if (fallback) btn.href = fallback;
      });
      applyRelease(null, null, "stable");
    });

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  };

  const copyBtn = document.getElementById("copy-btn");
  const copyLabel = document.getElementById("copy-label");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      await copyText("gradle build\njava -jar build/libs/vib-mc.jar");
      if (copyLabel) {
        const prev = copyLabel.textContent;
        copyLabel.textContent = "copied ✓";
        window.setTimeout(() => { copyLabel.textContent = prev; }, 1600);
      }
    });
  }

  document.querySelectorAll(".copy-cmd").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const cmd = btn.textContent.trim();
      await copyText(cmd);
      const prev = btn.textContent;
      btn.textContent = "copied ✓";
      window.setTimeout(() => { btn.textContent = prev; }, 1200);
    });
  });

  const bugForm = document.getElementById("bug-form");
  if (bugForm) {
    const bugTitle = document.getElementById("bug-title");
    const bugWhat = document.getElementById("bug-what");
    const bugSteps = document.getElementById("bug-steps");
    const bugVersion = document.getElementById("bug-version");
    const bugLog = document.getElementById("bug-log");

    bugForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = (bugTitle && bugTitle.value.trim()) || "bug report";
      const body = [
        "# What's the issue?",
        (bugWhat && bugWhat.value.trim()) || "",
        "",
        "# How did it occur?",
        (bugSteps && bugSteps.value.trim()) || "",
        "",
        "# Version & log",
        `Release: ${(bugVersion && bugVersion.value.trim()) || "unknown"}`,
        `Log: ${(bugLog && bugLog.value.trim()) || "not provided"}`,
      ].join("\n");
      const url = `https://github.com/gabytz777/vib-MC/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
      window.open(url, "_blank", "noopener");
    });
  }

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!prefersReduced && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
  }
})();