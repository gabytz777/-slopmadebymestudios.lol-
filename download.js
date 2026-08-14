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
      if (releaseTag) releaseTag.textContent = (release && release.tag_name) || "v0.0.4-hotfix.2";
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

  const requestChooser = document.getElementById("request-chooser");
  const bugForm = document.getElementById("bug-form");
  const feedbackForm = document.getElementById("feedback-form");

  const showForm = (which) => {
    if (requestChooser) requestChooser.classList.add("hidden");
    if (bugForm) bugForm.classList.toggle("hidden", which !== "bug");
    if (feedbackForm) feedbackForm.classList.toggle("hidden", which !== "feedback");
  };

  document.querySelectorAll("[data-form]").forEach((btn) => {
    btn.addEventListener("click", () => showForm(btn.getAttribute("data-form")));
  });
  document.querySelectorAll("[data-form-back]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (bugForm) bugForm.classList.add("hidden");
      if (feedbackForm) feedbackForm.classList.add("hidden");
      if (requestChooser) requestChooser.classList.remove("hidden");
    });
  });

  const openIssueWithTemplate = (template, title) => {
    const url = `https://github.com/gabytz777/vib-MC/issues/new?template=${template}&title=${encodeURIComponent(title)}`;
    window.open(url, "_blank", "noopener");
  };

  if (bugForm) {
    const bugTitle = document.getElementById("bug-title");
    const bugWhat = document.getElementById("bug-what");
    const bugSteps = document.getElementById("bug-steps");
    const bugVersion = document.getElementById("bug-version");
    const bugLog = document.getElementById("bug-log");

    bugForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = (bugTitle && bugTitle.value.trim()) || "bug report";
      openIssueWithTemplate("bug_report.yml", title);
    });
  }

  if (feedbackForm) {
    const fbTitle = document.getElementById("fb-title");
    const fbWant = document.getElementById("fb-want");
    const fbWhy = document.getElementById("fb-why");
    const fbExtra = document.getElementById("fb-extra");

    feedbackForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = (fbTitle && fbTitle.value.trim()) || "feedback";
      openIssueWithTemplate("feedback.yml", title);
    });
  }

  // ---- plugin blueprint (scratch-style) ----
  const bpName = document.getElementById("bp-name");
  const bpPkg = document.getElementById("bp-package");
  const bpVersion = document.getElementById("bp-version");
  const bpDescription = document.getElementById("bp-description");
  const bpCommands = document.getElementById("bp-commands");
  const bpListeners = document.getElementById("bp-listeners");
  const bpDownload = document.getElementById("bp-download");

  if (bpName && bpCommands && bpListeners && bpDownload) {
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
    const jq = (s) => JSON.stringify(s);
    const msg = (s) => jq(jq(s)); // JSON text as a Java string literal: "{\"text\":\"...\"}"

    let lastName = "MyPlugin";
    let lastPkg = "com.example";
    let lastCls = "MyPlugin";
    let ymlText = "";
    let javaText = "";

    const addCommandUnit = (action, name, value) => {
      const unit = document.createElement("div");
      unit.className = "sb-unit";
      const actBlock = action === "gamemode"
        ? `<div class="sb-block sb-act"><span>set game mode to <select class="sb-oval"><option value="creative">creative</option><option value="survival">survival</option></select></span></div>`
        : `<div class="sb-block sb-act"><span>say <input class="sb-oval" type="text" value="${esc(value)}" placeholder="hello!"></span></div>`;
      unit.innerHTML = `
        <div class="sb-unit-blocks">
          <div class="sb-block sb-cmd sb-hat"><span>when player runs <span class="sb-prefix">/</span><input class="sb-oval" type="text" value="${esc(name)}" placeholder="hello"></span></div>
          ${actBlock}
        </div>
        <button type="button" class="sb-remove" aria-label="remove">✕</button>`;
      unit.querySelector(".sb-remove").addEventListener("click", () => unit.remove());
      if (action === "gamemode") {
        unit.querySelector("select").value = value === "survival" ? "survival" : "creative";
      }
      bpCommands.appendChild(unit);
    };

    const addListenerUnit = (event, action, value) => {
      const unit = document.createElement("div");
      unit.className = "sb-unit";
      const actBlock = action === "cancel"
        ? `<div class="sb-block sb-cancel"><span>cancel the chat</span></div>`
        : `<div class="sb-block sb-act"><span>say <input class="sb-oval" type="text" value="${esc(value)}" placeholder="hello!"></span></div>`;
      unit.innerHTML = `
        <div class="sb-unit-blocks">
          <div class="sb-block sb-lsn sb-hat"><span>when player <select class="sb-oval"><option value="join">joins</option><option value="quit">quits</option><option value="chat">chats</option></select></span></div>
          ${actBlock}
        </div>
        <button type="button" class="sb-remove" aria-label="remove">✕</button>`;
      unit.querySelector(".sb-remove").addEventListener("click", () => unit.remove());
      unit.querySelector(".sb-lsn select").value = event;
      bpListeners.appendChild(unit);
    };

    const refresh = () => {
      const cmds = [];
      bpCommands.querySelectorAll(":scope > .sb-unit").forEach((unit) => {
        const name = unit.querySelector(".sb-cmd .sb-oval").value.trim()
          .replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
        if (!name) return;
        const act = unit.querySelector(".sb-act");
        if (act && act.querySelector("select")) {
          cmds.push({ name, action: "gamemode", value: act.querySelector("select").value });
        } else {
          cmds.push({ name, action: "say", value: act ? act.querySelector("input").value.trim() : "" });
        }
      });
      const lst = [];
      bpListeners.querySelectorAll(":scope > .sb-unit").forEach((unit) => {
        const event = unit.querySelector(".sb-lsn select").value;
        if (unit.querySelector(".sb-cancel")) {
          lst.push({ event, action: "cancel", value: "" });
        } else {
          const act = unit.querySelector(".sb-act");
          lst.push({ event, action: "say", value: act ? act.querySelector("input").value.trim() : "" });
        }
      });

      const rawName = (bpName.value.trim() || "MyPlugin").replace(/[^a-zA-Z0-9_-]/g, "");
      const cls = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : "MyPlugin";
      const pkg = (bpPkg.value.trim() || "com.example")
        .replace(/[^a-zA-Z0-9.]/g, "").replace(/^\.+|\.+$/g, "");
      const version = bpVersion.value.trim() || "1.0.0";
      const desc = bpDescription.value.trim();

      lastName = rawName || "MyPlugin";
      lastPkg = pkg || "com.example";
      lastCls = cls;

      const ymlLines = [`name=${rawName || "MyPlugin"}`, `version=${version}`, `main=${pkg}.${cls}`];
      if (desc) ymlLines.push(`description=${desc.replace(/\r?\n/g, " ")}`);
      ymlText = ymlLines.join("\n") + "\n";

      const imports = new Set([
        "net.vibmc.command.Command",
        "net.vibmc.command.CommandSender",
        "net.vibmc.plugin.VibMCPlugin",
      ]);
      if (cmds.some((c) => c.action === "gamemode")) {
        imports.add("net.vibmc.entity.PlayerEntity");
        imports.add("net.vibmc.player.GameMode");
      }
      if (lst.length) {
        imports.add("net.vibmc.plugin.EventHandler");
        imports.add("net.vibmc.plugin.Listener");
      }
      lst.forEach((l) => {
        if (l.event === "join") imports.add("net.vibmc.plugin.event.PlayerJoinEvent");
        if (l.event === "quit") imports.add("net.vibmc.plugin.event.PlayerQuitEvent");
        if (l.event === "chat") imports.add("net.vibmc.plugin.event.ChatEvent");
      });

      const parts = [`package ${pkg};`, ""];
      [...imports].sort().forEach((i) => parts.push(`import ${i};`));
      parts.push("", `public class ${cls} extends VibMCPlugin {`, "    @Override", "    public void onEnable() {");

      cmds.forEach((c) => {
        const body = [];
        if (c.action === "gamemode") {
          body.push("if (!sender.isPlayer()) {");
          body.push(`    sender.sendMessage(${msg("Only players can use /" + c.name)});`);
          body.push("    return false;");
          body.push("}");
          body.push("PlayerEntity player = sender.getPlayer();");
          body.push(`player.setGameMode(GameMode.${c.value === "survival" ? "SURVIVAL" : "CREATIVE"});`);
          body.push(`player.sendMessage(${msg("Gamemode updated")});`);
        } else {
          body.push(`sender.sendMessage(${msg(c.value || "Hello!")});`);
        }
        body.push("return true;");
        parts.push(
          `        getCommandManager().register(new Command(${jq(c.name)}, ${jq("Custom command /" + c.name)}, ${jq("/" + c.name)}, null) {`,
          "            @Override",
          "            public boolean execute(CommandSender sender, String[] args) {",
          ...body.map((l) => "                " + l),
          "            }",
          "        });"
        );
      });

      const lsnDefs = [];
      lst.forEach((l, i) => {
        const suffix = i === 0 ? "" : String(i + 1);
        const lsnCls = { join: "JoinListener", quit: "QuitListener", chat: "ChatListener" }[l.event] + suffix;
        const evtCls = { join: "PlayerJoinEvent", quit: "PlayerQuitEvent", chat: "ChatEvent" }[l.event];
        const method = { join: "onJoin", quit: "onQuit", chat: "onChat" }[l.event];
        parts.push(`        getPluginManager().registerEvents(new ${lsnCls}(), this);`);
        const def = [
          `    private static class ${lsnCls} implements Listener {`,
          "        @EventHandler",
          `        public void ${method}(${evtCls} event) {`,
        ];
        if (l.event === "chat" && l.action === "cancel") {
          def.push("            event.setCancelled(true);");
        } else {
          def.push(`            event.getPlayer().sendMessage(${msg(l.value || "Hi!")});`);
        }
        def.push("        }", "    }");
        lsnDefs.push(def.join("\n"));
      });

      parts.push("    }");
      lsnDefs.forEach((d) => parts.push("", d));
      parts.push("}");
      javaText = parts.join("\n") + "\n";
    };

    document.querySelectorAll("[data-piece]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const piece = btn.getAttribute("data-piece");
        if (piece === "cmd-say") addCommandUnit("say", "hello", "Hello from MyPlugin!");
        if (piece === "cmd-gm") addCommandUnit("gamemode", "gmc", "creative");
        if (piece === "lsn-join") addListenerUnit("join", "say", "Welcome to the vibe!");
        if (piece === "lsn-quit") addListenerUnit("quit", "say", "Goodbye!");
        if (piece === "lsn-cancel") addListenerUnit("chat", "cancel", "");
        refresh();
      });
    });

    [bpName, bpPkg, bpVersion, bpDescription].forEach((el) => {
      el.addEventListener("input", refresh);
    });
    bpCommands.addEventListener("input", refresh);
    bpCommands.addEventListener("change", refresh);
    bpListeners.addEventListener("input", refresh);
    bpListeners.addEventListener("change", refresh);

    addCommandUnit("say", "hello", "Hello from MyPlugin!");
    addListenerUnit("join", "say", "Welcome to the vibe!");
    refresh();

    // minimal zip writer (store method, no dependencies)
    const crcTable = (() => {
      const t = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
        t[i] = c >>> 0;
      }
      return t;
    })();
    const crc32 = (bytes) => {
      let c = 0xFFFFFFFF;
      for (let i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
      return (c ^ 0xFFFFFFFF) >>> 0;
    };
    const dosDateTime = () => {
      const d = new Date();
      return {
        time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
        date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
      };
    };
    const makeZip = (files) => {
      const { time, date } = dosDateTime();
      const parts = [];
      const central = [];
      let offset = 0;
      for (const f of files) {
        const nameBytes = utf8(f.name);
        const crc = crc32(f.data);
        const size = f.data.length;
        const local = new Uint8Array(30);
        const dv = new DataView(local.buffer);
        dv.setUint32(0, 0x04034b50, true);
        dv.setUint16(4, 20, true);
        dv.setUint16(6, 0x0800, true);
        dv.setUint16(8, 0, true);
        dv.setUint16(10, time, true);
        dv.setUint16(12, date, true);
        dv.setUint32(14, crc, true);
        dv.setUint32(18, size, true);
        dv.setUint32(22, size, true);
        dv.setUint16(26, nameBytes.length, true);
        dv.setUint16(28, 0, true);
        parts.push(local, nameBytes, f.data);
        const cen = new Uint8Array(46);
        const cdv = new DataView(cen.buffer);
        cdv.setUint32(0, 0x02014b50, true);
        cdv.setUint16(4, 20, true);
        cdv.setUint16(6, 20, true);
        cdv.setUint16(8, 0x0800, true);
        cdv.setUint16(10, 0, true);
        cdv.setUint16(12, time, true);
        cdv.setUint16(14, date, true);
        cdv.setUint32(16, crc, true);
        cdv.setUint32(20, size, true);
        cdv.setUint32(24, size, true);
        cdv.setUint16(28, nameBytes.length, true);
        cdv.setUint32(42, offset, true);
        central.push(cen, nameBytes);
        offset += local.length + nameBytes.length + size;
      }
      const centralSize = central.reduce((n, b) => n + b.length, 0);
      const eocd = new Uint8Array(22);
      const ev = new DataView(eocd.buffer);
      ev.setUint32(0, 0x06054b50, true);
      ev.setUint16(8, files.length, true);
      ev.setUint16(10, files.length, true);
      ev.setUint32(12, centralSize, true);
      ev.setUint32(16, offset, true);
      return new Blob([...parts, ...central, eocd], { type: "application/zip" });
    };
    const utf8 = (s) => new TextEncoder().encode(s);

    bpDownload.addEventListener("click", () => {
      const pkgPath = lastPkg.split(".").join("/");
      const bat = `@echo off\r\nrem requires a JDK 8+ (javac/jar on PATH)\r\nif not exist vib-mc.jar (\r\n  echo Downloading vib-mc.jar...\r\n  powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://github.com/gabytz777/vib-MC/releases/latest/download/vib-mc.jar' -OutFile 'vib-mc.jar'"\r\n)\r\njavac -cp vib-mc.jar -d out src\\${pkgPath}\\${lastCls}.java\r\nif errorlevel 1 (\r\n  echo Compile failed - fix the errors above, or update the paths in this script\r\n  pause\r\n  exit /b 1\r\n)\r\njar cf ${lastCls}.jar -C out . plugin.yml\r\necho built ${lastCls}.jar - drop it in plugins/ and restart the server\r\npause\r\n`;
      const sh = `#!/bin/sh\n# requires a JDK 8+ (javac/jar on PATH)\nif [ ! -f vib-mc.jar ]; then\n  echo "Downloading vib-mc.jar..."\n  curl -L -o vib-mc.jar https://github.com/gabytz777/vib-MC/releases/latest/download/vib-mc.jar\nfi\njavac -cp vib-mc.jar -d out src/${pkgPath}/${lastCls}.java || { echo "Compile failed"; exit 1; }\njar cf ${lastCls}.jar -C out . plugin.yml\necho "built ${lastCls}.jar - drop it in plugins/ and restart the server"\n`;
      const readme = `vib-MC plugin blueprint\n========================\n\nFiles:\n  plugin.yml                    - plugin descriptor (Properties format)\n  src/${pkgPath}/${lastCls}.java  - main plugin class\n  build.bat / build.sh          - build scripts\n\nBuild:\n  Windows:   double-click build.bat\n  Linux/Mac: sh build.sh\n\nThe scripts download the latest vib-MC jar automatically if vib-mc.jar\nis not in this folder.\n\nRequires: a JDK 8+ (javac and jar on your PATH).\nOutput: ${lastCls}.jar -> copy into <server>/plugins/ and restart the server.\n`;
      const files = [
        { name: "plugin.yml", data: utf8(ymlText) },
        { name: `src/${pkgPath}/${lastCls}.java`, data: utf8(javaText) },
        { name: "build.bat", data: utf8(bat) },
        { name: "build.sh", data: utf8(sh) },
        { name: "README.txt", data: utf8(readme) },
      ];
      const blob = makeZip(files);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${lastName}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
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