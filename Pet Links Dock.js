// ==UserScript==
// @name         Pet Links Dock
// @namespace    https://github.com/Daregon-sh/veyra
// @version      1.8.1
// @downloadURL  https://raw.githubusercontent.com/Daregon-sh/veyra/refs/heads/codes/Pet%20Links%20Dock.js
// @updateURL    https://raw.githubusercontent.com/Daregon-sh/veyra/refs/heads/codes/Pet%20Links%20Dock.js
// @description  Draggable dock. Per-set local cache with in-modal management. Linked pets extraction + stat contributions + background refresh. Works from multiple pages, fetches from /pets.php. Closes /pets.php when done.
// @match        https://demonicscans.org/*
// @run-at       document-idle
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_openInTab
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  "use strict";

  // =========================
  // Exception pages
  // =========================
  function isExceptionPage() {
    const href = (window.location && window.location.href || "").toLowerCase();
    const path = (window.location && window.location.pathname || "").toLowerCase();
    const targets = [
      "/bookmarks.php",
      "/lastupdates.php",
      "/title/",
      "/manga/",
      "/index.php",
    ];
    return targets.some(t => path.includes(t) || href.includes(t));
  }

  // =========================
  // CONFIG
  // =========================
  const ORIGIN = "https://demonicscans.org";
  const PETS_PATH = "/pets.php";

  const OPEN_PETS_TAB_ACTIVE = true;    // focus /pets.php (helps with CF)
  const ATTACK_DELAY_MS = 500;

  // Selectors
  const SET_BTN_SELECTOR = ".qs-set-btn.qs-set-pets";
  const ATTACK_BTN_SELECTOR = ".qs-modal-btn.qs-modal-attack";

  // Collector pacing
  const COLLECT_TIMEOUT_MS = 2500;
  const PER_PET_DELAY_MS = 60;

  // Dock visuals
  const DOCK_Z_INDEX = 10000;
  const DOCK_WIDTH_PX = 143;
  const LINKED_SIZE_PX = 40;

  const POLL_INTERVAL_MS = 500;
  const POLL_TIMEOUT_MS = 60000;

  // Storage keys (v3)
  const CACHE_KEY      = "petdock_cache_v3";
  const LABEL_KEY      = "petdock_label_v3";
  const PENDING_KEY    = "petdock_pending_label_v3";
  const STATUS_KEY     = "petdock_status_v3";
  const LAST_NONCE_KEY = "petdock_last_nonce_v3";

  // Resume/progress keys (used in /pets.php)
  const PROGRESS_KEY   = "petdock_progress_v3";
  const RUNNING_KEY    = "petdock_running_v3";

  // Dock state keys
  const DOCK_POS_KEY       = "petdock_pos_v3";       // { left, top }
  const DOCK_COLLAPSE_KEY  = "petdock_collapse_v3";  // boolean

  // Two-step enforcement (Set -> Attack)
  const SEQUENCE_WINDOW_MS = 15 * 1000;

  // Per-set local cache (images list)
  const LOCAL_CACHE_BUCKET = "petdock_local_by_set_v1";
  const LOCAL_CACHE_TTL_MS = 0; // no expiry

  const DEBUG_HILITE = false;
  const W = (typeof unsafeWindow !== "undefined") ? unsafeWindow : window;

  // Extra GM storage for inventory index (NOT localStorage)
  const INV_INDEX_KEY = "petdock_inventory_index_v1";

  // Power scaling exclusions when used as LINK pets
  const POWER_EXCLUDED_IDS = new Set(["71043", "64279"]);

  let refreshInProgress = false;
  let lastRenderedCapturedAt = 0;

  // =========================
  // MENU COMMANDS
  // =========================
  if (typeof GM_registerMenuCommand === "function") {
    GM_registerMenuCommand("PetDock: Clear cache (v3)", async () => {
      await gmSet(CACHE_KEY, null);
      await gmSet(PROGRESS_KEY, null);
      await gmSet(RUNNING_KEY, null);
      await gmSet(LAST_NONCE_KEY, "");
      await gmSet(LABEL_KEY, "");
      await gmSet(PENDING_KEY, null);
      await gmSet(STATUS_KEY, null);
      alert("PetDock v3 cache cleared. Click Set → Attack again.");
      renderFromCache();
    });

    GM_registerMenuCommand("PetDock: Clear local per-set cache", () => {
      try { localStorage.removeItem(LOCAL_CACHE_BUCKET); } catch {}
      alert("PetDock per-set local cache cleared.");
    });

    GM_registerMenuCommand("PetDock: Refresh inventory index now", async () => {
      try {
        const tab = await openPetsForVerify();
        setStatus({ state: "waiting", msg: "Verify opened in background." });
        setTimeout(() => { try { tab?.close?.(); } catch {} }, 1500);
      } catch (e) {
        alert("Could not open /pets.php for verify. Try clicking Attack once.");
      }
    });
  }

  // =========================
  // BOOT DOCK
  // =========================
  if (!isExceptionPage()) {
    injectDockCss();
    ensureDock();
    restoreDockState();
    renderFromCache();
    installAttackModalObserver();

    // Allow clicking any grid pet image (if present) -> details modal
    document.addEventListener("click", onGridImageClick, true);
  }

  if (typeof GM_addValueChangeListener === "function") {
    GM_addValueChangeListener(CACHE_KEY, () => {
      refreshInProgress = false;
      renderFromCache();
    });
    GM_addValueChangeListener(LABEL_KEY, () => renderFromCache());
    GM_addValueChangeListener(PENDING_KEY, () => renderPending());
    GM_addValueChangeListener(STATUS_KEY, () => renderStatus());
  }

  // =========================
  // STEP 1: Set button
  // =========================
  document.addEventListener("click", async (e) => {
    if (isExceptionPage()) return;
    const btn = e.target.closest(SET_BTN_SELECTOR);
    if (!btn) return;

    const applyType = cleanText(btn.getAttribute("data-apply-type") || "");
    if (applyType && applyType.toLowerCase() !== "pets") return;

    const label = cleanText(btn.querySelector("span.qs-set-number")?.textContent || "");
    const setNum = cleanText(btn.getAttribute("data-set-number") || "");
    const setName = cleanText(btn.getAttribute("data-set-name") || "");
    const setKey = computeSetKey(setNum, setName);

    await gmSet(PENDING_KEY, { label, setNum, setName, setKey, at: Date.now() });

    if (label) setMsg(`<b>${escapeHtml(label)}</b>`);
  }, true);

  // =========================
  // STEP 2: Attack button
  // =========================
  document.addEventListener("click", async (e) => {
    if (isExceptionPage()) return;

    const btn = e.target.closest(ATTACK_BTN_SELECTOR);
    if (!btn) return;
    if (refreshInProgress) return;

    const pending = await gmGet(PENDING_KEY, null);
    const now = Date.now();
    if (!pending || !pending.setKey || (now - Number(pending.at || 0) > SEQUENCE_WINDOW_MS)) {
      setStatus({ state: "error", msg: "Click the desired Set first, then Attack." });
      return;
    }

    refreshInProgress = true;

    const label = cleanText(pending.label || "");
    const setKey = pending.setKey;
    await gmSet(LABEL_KEY, label);

    // 1) Try per-set localStorage cache
    const cached = getCachedBySetKey(setKey);
    if (cached && cached.payload && isLocalCacheFresh(cached)) {
      await gmSet(CACHE_KEY, cached.payload);
      setMsg(label ? `<b>${escapeHtml(label)}</b>` : "");
      setStatus({ state: "done", msg: "Loaded from local cache." });
      refreshInProgress = false;
      renderFromCache();

      // Background verify (update index; may close itself)
      setTimeout(() => { try { openPetsForVerify(setKey); } catch {} }, 100);
      return;
    }

    // 2) Open /pets.php for fresh collection
    setMsg(label ? `<b>${escapeHtml(label)}</b><br>Refreshing…` : `Refreshing…`);
    setStatus({ state: "starting", msg: `Waiting ${ATTACK_DELAY_MS}ms…` });

    const beforeCache = await gmGet(CACHE_KEY, null);
    const beforeAt = Number(beforeCache?.capturedAt || lastRenderedCapturedAt || 0);

    try {
      await sleep(ATTACK_DELAY_MS);
      const tabHandle = await openPetsAndCollect(label, setKey);
      pollUntilPublished(beforeAt, tabHandle);
    } catch (err) {
      console.error(err);
      setStatus({ state: "error", msg: `Refresh error: ${String(err.message || err)}` });
      refreshInProgress = false;
    }
  }, true);

  // Auto-collect/verify on /pets.php
  maybeWorkOnPetsTab();

  // =========================
  // Open /pets.php and return tab handle
  // =========================
  async function openPetsAndCollect(label, setKey) {
    const nonce = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const url =
      `${ORIGIN}${PETS_PATH}` +
      `?petdockCollect=${encodeURIComponent(nonce)}` +
      `&petdockLabel=${encodeURIComponent(label || "")}` +
      `&petdockSetKey=${encodeURIComponent(setKey || "")}`;

    let tabHandle = null;
    if (typeof GM_openInTab === "function") {
      tabHandle = GM_openInTab(url, { active: OPEN_PETS_TAB_ACTIVE, insert: true, setParent: true });
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }

    setStatus({ state: "waiting", msg: "Collecting in /pets.php…" });
    return tabHandle;
  }

  // =========================
  // Background verify tab opener
  // =========================
  function openPetsForVerify(setKey) {
    const url =
      `${ORIGIN}${PETS_PATH}` +
      `?petdockVerify=1` +
      `&petdockSetKey=${encodeURIComponent(setKey || "")}`;
    if (typeof GM_openInTab === "function") {
      return GM_openInTab(url, { active: false, insert: true, setParent: true });
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
      return null;
    }
  }

  // =========================
  // Poll for publish; close /pets.php from origin
  // =========================
  function pollUntilPublished(beforeAt, tabHandle) {
    const start = Date.now();

    const timer = setInterval(async () => {
      const cache = await gmGet(CACHE_KEY, null);
      const nowAt = Number(cache?.capturedAt || 0);

      if (nowAt && nowAt > beforeAt) {
        clearInterval(timer);
        // Close collector tab (origin-side)
        try { tabHandle?.close?.(); } catch {}
        refreshInProgress = false;
        renderFromCache();
        try { window.focus?.(); } catch {}
        return;
      }

      if (Date.now() - start > POLL_TIMEOUT_MS) {
        clearInterval(timer);
        try { tabHandle?.close?.(); } catch {}
        refreshInProgress = false;
        setStatus({ state: "error", msg: "Timed out waiting for /pets.php to finish collecting." });
      }
    }, POLL_INTERVAL_MS);
  }

  // =========================
  // /pets.php auto-collect OR verify
  // =========================
  async function maybeWorkOnPetsTab() {
    if (isExceptionPage()) return;
    if (!location.pathname.endsWith(PETS_PATH)) return;

    const qs = new URLSearchParams(location.search);
    const token = qs.get("petdockCollect");
    const verify = qs.get("petdockVerify");
    const labelFromUrl = cleanText(qs.get("petdockLabel") || "");
    const setKeyFromUrl = cleanText(qs.get("petdockSetKey") || "");

    // ---------- VERIFY ----------
    if (verify) {
      try {
        if (/just a moment/i.test(document.title || "")) {
          setStatus({ state: "challenge", msg: "Cloudflare check detected during verify." });
          return;
        }
        const invMaps = buildPetInventoryIndexFromPage();
        await gmSet(INV_INDEX_KEY, invMaps);

        if (setKeyFromUrl) {
          const cached = getCachedBySetKey(setKeyFromUrl);
          if (cached && cached.payload && cached.payload.pairs) {
            const updated = applyInventoryVerificationToCachedPayload(cached.payload, invMaps);
            if (updated.changedCount > 0) {
              putCachedBySetKey(setKeyFromUrl, { payload: updated.payload, label: await gmGet(LABEL_KEY, "") });
              setStatus({ state: "done", msg: `Verified & updated ${updated.changedCount} change(s) for this set.` });
            } else {
              setStatus({ state: "done", msg: `Verified: no changes.` });
            }
          }
        }
      } catch (err) {
        console.error(err);
        setStatus({ state: "error", msg: `Verify error: ${String(err.message || err)}` });
      } finally {
        // Self-close verify tabs
        setTimeout(() => { try { window.close(); } catch {} }, 600);
      }
      return;
    }

    // ---------- COLLECT ----------
    if (!token) return;

    const last = await gmGet(LAST_NONCE_KEY, "");
    if (last === token) return;
    await gmSet(LAST_NONCE_KEY, token);

    if (/just a moment/i.test(document.title || "")) {
      setStatus({ state: "challenge", msg: "Cloudflare check detected. Complete it, then click Attack again." });
      return;
    }

    await gmSet(RUNNING_KEY, token);
    if (labelFromUrl) await gmSet(LABEL_KEY, labelFromUrl);

    await waitUntilVisible();

    try {
      setStatus({ state: "collecting", msg: "Collecting pets (keep this tab focused)..." });

      const payload = await collectPairsOnPetsPage_FirstGridOnly_Resumable(token);

      await gmSet(CACHE_KEY, payload);
      if (setKeyFromUrl) {
        putCachedBySetKey(setKeyFromUrl, { payload, label: labelFromUrl });
      }
      await gmSet(PROGRESS_KEY, null);
      await gmSet(RUNNING_KEY, null);

      setStatus({ state: "done", msg: `Saved ${Object.keys(payload.pairs).length} pets` });

      // NOTE: Self-close collector tab as a fallback (origin also closes it)
      setTimeout(() => { try { window.close(); } catch {} }, 700);

    } catch (err) {
      console.error(err);
      setStatus({ state: "error", msg: `Collector error: ${String(err.message || err)}` });
    }
  }

  // =========================
  // Collector: FIRST GRID ONLY + resumable + robust linked parsing
  // =========================
  async function collectPairsOnPetsPage_FirstGridOnly_Resumable(token) {
    const ok = await waitFor(() => typeof W.openLinksModal === "function", 20000);
    if (!ok) throw new Error("openLinksModal not available on /pets.php yet.");

    const grids = document.querySelectorAll(".grid");
    const firstGrid = grids && grids.length ? grids[0] : null;
    if (!firstGrid) throw new Error("First .grid not found on /pets.php.");

    const ids = Array.from(firstGrid.querySelectorAll('.slot-box[data-pet-inv-id]'))
      .map(el => el.getAttribute("data-pet-inv-id"))
      .filter(Boolean);
    const petIds = Array.from(new Set(ids));
    if (!petIds.length) throw new Error("No pets found in first grid.");

    const petIdsHash = petIds.join("\n");

    // Resume support
    const progress = await gmGet(PROGRESS_KEY, null);
    let startIndex = 0;
    let pairs = {};
    if (progress && progress.token === token && progress.petIdsHash === petIdsHash) {
      startIndex = Number(progress.index || 0);
      pairs = progress.pairs || {};
    } else {
      await gmSet(PROGRESS_KEY, { token, petIdsHash, index: 0, pairs: {}, updatedAt: Date.now() });
      startIndex = 0;
      pairs = {};
    }

    // Build & publish inventory index (for modal later)
    const invMaps = buildPetInventoryIndexFromPage();
    await gmSet(INV_INDEX_KEY, invMaps);

    // Modal scraping
    async function waitForModalData(timeoutMs = COLLECT_TIMEOUT_MS) {
      const start = performance.now();

      while (performance.now() - start < timeoutMs) {
        const body = document.querySelector("#linksModalBody");
        if (!body) {
          await new Promise(r => requestAnimationFrame(r));
          continue;
        }

        let mainImgEl =
          body.querySelector("img[style*='width:110px']") ||
          body.querySelector("img[style*='height:110px']");
        if (!mainImgEl) {
          const firstRow = Array.from(body.querySelectorAll("div"))
            .find(d =>
              /display\s*:\s*flex/i.test(d.getAttribute("style") || "") &&
              /align-items\s*:\s*flex-start/i.test(d.getAttribute("style") || "")
            );
          if (firstRow) mainImgEl = firstRow.querySelector("img");
        }
        const mainSrc = mainImgEl?.getAttribute("src") || null;
        let mainName = truncate(mainImgEl?.getAttribute("alt") || "", 80);
        if (!mainName) mainName = truncate(extractMainNameFromModal(body), 80);

        const linkedThumbs = Array.from(
          body.querySelectorAll("img[style*='width:44px'][style*='height:44px']")
        );
        const linked1El = linkedThumbs[0] || null;
        const linked2El = linkedThumbs[1] || null;

        const linked1Src = linked1El?.getAttribute("src") || null;
        const linked2Src = linked2El?.getAttribute("src") || null;

        const divs = Array.from(body.querySelectorAll("div"));
        const link1Div = divs.find(d => /Link\s*1\s*[–—-]/i.test(d.textContent || ""));
        const linkedName = link1Div
          ? truncate(((link1Div.textContent || "").match(/Link\s*1\s*[–—-]\s*(.*?)(?:\s*\(|$)/i) || ["",""])[1], 80)
          : "";
        const link2Div = divs.find(d => /Link\s*2\s*[–—-]/i.test(d.textContent || ""));
        const linkedName2 = link2Div
          ? truncate(((link2Div.textContent || "").match(/Link\s*2\s*[–—-]\s*(.*?)(?:\s*\(|$)/i) || ["",""])[1], 80)
          : "";

        if (DEBUG_HILITE) {
          try {
            if (mainImgEl) mainImgEl.style.outline = "2px solid #26c281";
            if (linked1El) linked1El.style.outline = "2px solid #00cfff";
            if (linked2El) linked2El.style.outline = "2px solid #b066ff";
          } catch {}
        }

        if (mainSrc) {
          const toAbs = (src) => new URL(src, location.href).href;
          return {
            main: toAbs(mainSrc),
            linked: linked1Src ? toAbs(linked1Src) : null,
            linked2: linked2Src ? toAbs(linked2Src) : null,
            mainName,
            linkedName,
            linkedName2
          };
        }
        await new Promise(r => requestAnimationFrame(r));
      }
      return null;
    }

    const snapshotFromInvEntry = (ent) => {
      if (!ent) return null;
      return {
        id: String(ent.id),
        race: cleanText(ent.race || ""),
        atk: Number.isFinite(ent.atk) ? ent.atk : 0,
        def: Number.isFinite(ent.def) ? ent.def : 0,
        powerValue: Number.isFinite(ent.powerValue) ? ent.powerValue : null,
        name: cleanText(ent.name || "")
      };
    };

    for (let i = startIndex; i < petIds.length; i++) {
      if (document.hidden) {
        setStatus({ state: "paused", msg: `Paused at ${i}/${petIds.length}. Focus /pets.php to continue.` });
        await waitUntilVisible();
        setStatus({ state: "collecting", msg: "Resuming…" });
      }

      const petId = petIds[i];
      setStatus({ state: "collecting", msg: `Collecting ${i + 1}/${petIds.length}` });

      W.openLinksModal(Number(petId));
      const data = await waitForModalData(COLLECT_TIMEOUT_MS);

      if (typeof W.closeLinksModal === "function") {
        W.closeLinksModal();
      } else {
        const modal = document.querySelector("#linksModal");
        if (modal) modal.style.display = "none";
      }

      if (data?.main) {
        let linked1Id = null, linked2Id = null;
        try {
          if (data.linked || data.linkedName) {
            linked1Id = findPetIdForImageOrName(data.linked, data.linkedName, invMaps);
          }
          if (data.linked2 || data.linkedName2) {
            linked2Id = findPetIdForImageOrName(data.linked2, data.linkedName2, invMaps);
          }
        } catch {}

        const mainEnt = invMaps.index[petId];
        const l1Ent = linked1Id ? invMaps.index[linked1Id] : null;
        const l2Ent = linked2Id ? invMaps.index[linked2Id] : null;

        pairs[petId] = {
          ...data,
          linked1Id: linked1Id || null,
          linked2Id: linked2Id || null,
          mainStats: snapshotFromInvEntry(mainEnt),
          link1Stats: snapshotFromInvEntry(l1Ent),
          link2Stats: snapshotFromInvEntry(l2Ent)
        };
      }

      await gmSet(PROGRESS_KEY, {
        token,
        petIdsHash,
        index: i + 1,
        pairs,
        updatedAt: Date.now()
      });

      await sleep(PER_PET_DELAY_MS);
    }

    return { capturedAt: Date.now(), pairs, meta: { totalPets: petIds.length } };
  }

  // =========================
  // Verify: apply current index to cached payload
  // =========================
  function applyInventoryVerificationToCachedPayload(payload, invMaps) {
    if (!payload || !payload.pairs || !invMaps || !invMaps.index) {
      return { changedCount: 0, payload };
    }
    const pairs = payload.pairs;
    let changed = 0;

    const same = (a, b) => {
      if (!a && !b) return true;
      if (!a || !b) return false;
      return (
        String(a.id || "") === String(b.id || "") &&
        cleanText(a.race || "") === cleanText(b.race || "") &&
        Number(a.atk || 0) === Number(b.atk || 0) &&
        Number(a.def || 0) === Number(b.def || 0) &&
        (a.powerValue == null ? b.powerValue == null : Number(a.powerValue) === Number(b.powerValue)) &&
        cleanText(a.name || "") === cleanText(b.name || "")
      );
    };

    const snap = (ent) => {
      if (!ent) return null;
      return {
        id: String(ent.id),
        race: cleanText(ent.race || ""),
        atk: Number.isFinite(ent.atk) ? ent.atk : 0,
        def: Number.isFinite(ent.def) ? ent.def : 0,
        powerValue: Number.isFinite(ent.powerValue) ? ent.powerValue : null,
        name: cleanText(ent.name || "")
      };
    };

    for (const [mainId, pair] of Object.entries(pairs)) {
      const mainNow = invMaps.index[mainId];
      const l1Now = pair.linked1Id ? invMaps.index[pair.linked1Id] : null;
      const l2Now = pair.linked2Id ? invMaps.index[pair.linked2Id] : null;

      const mainNew = snap(mainNow);
      const l1New = snap(l1Now);
      const l2New = snap(l2Now);

      if (!same(pair.mainStats, mainNew)) { pair.mainStats = mainNew; changed++; }
      if (!same(pair.link1Stats, l1New)) { pair.link1Stats = l1New; changed++; }
      if (!same(pair.link2Stats, l2New)) { pair.link2Stats = l2New; changed++; }
    }

    const newPayload = { ...payload, capturedAt: Date.now(), pairs };
    return { changedCount: changed, payload: newPayload };
  }

  // =========================
  // Name extraction (STRICT + CLEAN)
  // =========================
  function extractMainNameFromModal(modalBody) {
    const el = modalBody.querySelector(
      'div[style*="font-weight:800"][style*="font-size:16px"],' +
      'div[style*="font-weight: 800"][style*="font-size: 16px"]'
    );
    const t = cleanText(el?.textContent || "");
    return looksLikeJunk(t) ? "" : t;
  }
  function extractLinkedNameFromModal(modalBody) {
    const divs = Array.from(modalBody.querySelectorAll("div"));
    const lineEl = divs.find(d => /^Link\s*\d+\s*[—-]\s*/i.test(cleanText(d.textContent || "")));
    if (!lineEl) return "";
    const t = cleanText(lineEl.textContent || "");
    const m = t.match(/^Link\s*\d+\s*[—-]\s*(.*?)(?:\s*\(|$)/i);
    const name = cleanText(m ? m[1] : "");
    return looksLikeJunk(name) ? "" : name;
  }
  function looksLikeJunk(t) {
    if (!t) return true;
    const bad = ["ATK", "DEF", "Effect", "Linked Effects", "Contributes", "Unlink", "PVE", "PVP"];
    const hits = bad.filter(w => t.includes(w)).length;
    return hits >= 2 || t.length > 120;
  }

  // =========================
  // Render dock (click -> details modal)
  // =========================
  async function renderFromCache() {
    if (isExceptionPage()) return;
    const dockList = document.getElementById("petLinksDockList");
    const statusEl = document.getElementById("petLinksDockStatus");
    if (!dockList || !statusEl) return;

    dockList.innerHTML = "";

    const cache = await gmGet(CACHE_KEY, null);
    const label = await gmGet(LABEL_KEY, "");

    if (!cache?.pairs) {
      statusEl.textContent = "—";
      setMsg(label ? `<b>${escapeHtml(label)}</b>` : "");
      return;
    }

    lastRenderedCapturedAt = Number(cache.capturedAt || lastRenderedCapturedAt || 0);

    const entries = Object.entries(cache.pairs);
    statusEl.textContent = String(entries.length);

    const frag = document.createDocumentFragment();

    for (const [petId, pair] of entries) {
      const wrap = document.createElement("div");
      wrap.className = "petPair";

      const names = [
        cleanText(pair.mainName || ""),
        cleanText(pair.linkedName || ""),
        cleanText(pair.linkedName2 || "")
      ].filter(Boolean);
      wrap.title = names.join(" + ");

      const main = document.createElement("img");
      main.className = "main";
      main.src = pair.main;
      main.alt = "";
      wrap.appendChild(main);

      // Click → details
      main.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          const invMaps = await gmGet(INV_INDEX_KEY, null);
          if (!invMaps || !invMaps.index) {
            showDetailsModal(`<h3>Details unavailable</h3><div class="meta">Open <b>/pets.php</b> and click <b>Attack</b> once to refresh the cache, then try again.</div>`);
            return;
          }
          renderPetDetailsModal(petId, pair, invMaps);
        } catch (err) {
          showDetailsModal(`<h3>Error</h3><div class="meta">${escapeHtml(String(err.message || err))}</div>`);
        }
      });

      if (pair.linked) {
        const linked1 = document.createElement("img");
        linked1.className = "linked";
        linked1.src = pair.linked;
        linked1.alt = "";
        wrap.appendChild(linked1);
      }
      if (pair.linked2) {
        const linked2 = document.createElement("img");
        linked2.className = "linked2";
        linked2.src = pair.linked2;
        linked2.alt = "";
        wrap.appendChild(linked2);
      }

      frag.appendChild(wrap);
    }

    dockList.appendChild(frag);

    if (label) setMsg(`<b>${escapeHtml(label)}</b>`);
    else setMsg("");
  }

  async function renderPending() {
    if (isExceptionPage()) return;
    const pending = await gmGet(PENDING_KEY, null);
    const label = cleanText(pending?.label || "");
    if (label) setMsg(`<b>${escapeHtml(label)}</b>`);
  }

  async function renderStatus() {
    if (isExceptionPage()) return;
    const s = await gmGet(STATUS_KEY, null);
    if (!s) return;
    if (s.state === "challenge" || s.state === "error") {
      setMsg(`<b>${escapeHtml(s.msg || "")}</b>`);
    }
  }

  // =========================
  // In-modal Tools
  // =========================
  function installAttackModalObserver() {
    const ensure = () => ensureModalCacheTools();
    const obs = new MutationObserver(ensure);
    obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
    ensure();
  }

  async function ensureModalCacheTools() {
    const attackBtn = document.querySelector(ATTACK_BTN_SELECTOR);
    if (!attackBtn) return;
    if (document.getElementById("petdockSetCacheTools")) return;

    const wrap = document.createElement("div");
    wrap.id = "petdockSetCacheTools";
    wrap.style.display = "flex";
    wrap.style.flexWrap = "wrap";
    wrap.style.gap = "6px";
    wrap.style.marginTop = "8px";

    const mkBtn = (txt) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = txt;
      b.style.border = "1px solid rgba(43,46,73,.95)";
      b.style.background = "rgba(17,19,32,.9)";
      b.style.color = "#fff";
      b.style.fontWeight = "700";
      b.style.fontSize = "12px";
      b.style.padding = "4px 8px";
      b.style.borderRadius = "8px";
      b.style.cursor = "pointer";
      return b;
    };

    const clearThisBtn = mkBtn("🗑 Clear cached for this set");
    const manageBtn = mkBtn("Manage cached sets...");

    const panel = document.createElement("div");
    panel.id = "petdockManageCachePanel";
    panel.style.display = "none";
    panel.style.position = "relative";
    panel.style.width = "100%";
    panel.style.marginTop = "6px";
    panel.style.padding = "8px";
    panel.style.borderRadius = "10px";
    panel.style.background = "rgba(20,22,37,0.72)";
    panel.style.border = "1px solid rgba(43,46,73,0.85)";
    panel.style.maxHeight = "220px";
    panel.style.overflow = "auto";

    const list = document.createElement("div");
    list.id = "petdockManageCacheList";
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "6px";
    panel.appendChild(list);

    clearThisBtn.addEventListener("click", async () => {
      const pending = await gmGet(PENDING_KEY, null);
      if (!pending?.setKey) {
        alert("Select a Set first (click a Pets Set button), then open this modal.");
        return;
      }
      const setKey = pending.setKey;
      const cached = getCachedBySetKey(setKey);
      if (!cached) {
        alert("No cached data found for this set.");
        return;
      }
      if (!confirm(`Delete cached data for:\n${pending.setName || pending.label || setKey}?`)) return;
      delCachedBySetKey(setKey);
      alert("Cached data cleared for this set.");
      if (panel.style.display !== "none") {
        populateManageList(list);
      }
    });

    manageBtn.addEventListener("click", () => {
      const visible = panel.style.display !== "none";
      if (visible) panel.style.display = "none";
      else { populateManageList(list); panel.style.display = "block"; }
    });

    wrap.appendChild(clearThisBtn);
    wrap.appendChild(manageBtn);
    wrap.appendChild(panel);

    const attachPoint = attackBtn.parentElement || attackBtn;
    attachPoint.insertAdjacentElement("afterend", wrap);
  }

  function populateManageList(container) {
    container.innerHTML = "";

    const entries = listCachedSetEntries();
    if (!entries.length) {
      const empty = document.createElement("div");
      empty.textContent = "No cached sets.";
      empty.style.color = "#9aa0be";
      empty.style.fontSize = "12px";
      container.appendChild(empty);
      return;
    }

    for (const e of entries) {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.justifyContent = "space-between";
      row.style.gap = "8px";
      row.style.padding = "4px 6px";
      row.style.border = "1px solid rgba(43,46,73,.55)";
      row.style.borderRadius = "8px";
      row.style.background = "rgba(17,19,32,.5)";

      const left = document.createElement("div");
      left.style.display = "flex";
      left.style.flexDirection = "column";
      left.style.gap = "2px";

      const title = document.createElement("div");
      title.textContent = e.label || e.setKey;
      title.style.fontSize = "12px";
      title.style.fontWeight = "700";
      title.style.color = "#fff";

      const meta = document.createElement("div");
      const date = e.savedAt ? new Date(e.savedAt).toLocaleString() : "unknown";
      const cnt = (typeof e.count === "number") ? `, ${e.count} imgs` : "";
      meta.textContent = `key: ${e.setKey}${cnt} – saved: ${date}`;
      meta.style.fontSize = "11px";
      meta.style.color = "#9aa0be";

      left.appendChild(title);
      left.appendChild(meta);

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.textContent = "✖";
      delBtn.style.border = "1px solid rgba(120,40,40,.9)";
      delBtn.style.background = "rgba(90,20,20,.95)";
      delBtn.style.color = "#fff";
      delBtn.style.fontWeight = "900";
      delBtn.style.fontSize = "12px";
      delBtn.style.width = "28px";
      delBtn.style.height = "24px";
      delBtn.style.borderRadius = "6px";
      delBtn.style.cursor = "pointer";
      delBtn.title = "Delete this cached set";

      delBtn.addEventListener("click", () => {
        if (!confirm(`Delete cached data for:\n${e.label || e.setKey}?`)) return;
        delCachedBySetKey(e.setKey);
        row.remove();
        if (!listCachedSetEntries().length) populateManageList(container);
      });

      row.appendChild(left);
      row.appendChild(delBtn);
      container.appendChild(row);
    }
  }

  // =========================
  // DOCK UI + DRAG + COLLAPSE
  // =========================
  function ensureDock() {
    if (document.getElementById("petLinksDock")) return;

    const dock = document.createElement("div");
    dock.id = "petLinksDock";
    dock.setAttribute("aria-label", "Pet links images dock");
    dock.innerHTML = `
      <div id="petLinksDockHeader">
        <span>Pet Links</span>
        <div style="display:flex; gap:6px; align-items:center;">
          <span id="petLinksDockStatus">—</span>
          <button id="petDockToggle" type="button" aria-label="Collapse dock">▾</button>
        </div>
      </div>
      <div id="petdockBody">
        <div id="petdockMsg"></div>
        <div id="petLinksDockList"></div>
      </div>
    `;
    document.body.appendChild(dock);

    dock.querySelector("#petDockToggle")?.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const collapsed = !!(await gmGet(DOCK_COLLAPSE_KEY, false));
      await gmSet(DOCK_COLLAPSE_KEY, !collapsed);
      applyCollapsedState(!collapsed);
    });

    makeDockDraggable(dock, dock.querySelector("#petLinksDockHeader"));
  }

  async function restoreDockState() {
    const dock = document.getElementById("petLinksDock");
    if (!dock) return;

    const pos = await gmGet(DOCK_POS_KEY, null);
    if (pos && Number.isFinite(pos.left) && Number.isFinite(pos.top)) {
      dock.style.left = `${pos.left}px`;
      dock.style.top = `${pos.top}px`;
      dock.style.transform = `none`;
    }

    const collapsed = !!(await gmGet(DOCK_COLLAPSE_KEY, false));
    applyCollapsedState(collapsed);
  }

  function applyCollapsedState(collapsed) {
    const dock = document.getElementById("petLinksDock");
    const body = document.getElementById("petdockBody");
    const toggle = document.getElementById("petDockToggle");
    if (!dock || !body || !toggle) return;

    body.style.display = collapsed ? "none" : "block";
    toggle.textContent = collapsed ? "▸" : "▾";
    toggle.setAttribute("aria-label", collapsed ? "Expand dock" : "Collapse dock");
  }

  function makeDockDraggable(dock, handle) {
    if (!dock || !handle) return;

    handle.style.cursor = "grab";
    let dragging = false;
    let startX = 0, startY = 0;
    let startLeft = 0, startTop = 0;

    handle.addEventListener("pointerdown", (e) => {
      if (e.target && e.target.id === "petDockToggle") return;

      dragging = true;
      handle.setPointerCapture?.(e.pointerId);

      const rect = dock.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;

      dock.style.transform = "none";
      dock.style.left = `${rect.left}px`;
      dock.style.top = `${rect.top}px`;

      handle.style.cursor = "grabbing";
      e.preventDefault();
    });

    window.addEventListener("pointermove", async (e) => {
      if (!dragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let newLeft = startLeft + dx;
      let newTop = startTop + dy;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const rect = dock.getBoundingClientRect();
      newLeft = Math.max(0, Math.min(vw - rect.width, newLeft));
      newTop = Math.max(0, Math.min(vh - rect.height, newTop));

      dock.style.left = `${newLeft}px`;
      dock.style.top = `${newTop}px`;

      await gmSet(DOCK_POS_KEY, { left: newLeft, top: newTop });
    });

    window.addEventListener("pointerup", () => {
      if (!dragging) return;
      dragging = false;
      handle.style.cursor = "grab";
    });
  }

  function injectDockCss() {
    if (document.getElementById("petLinksDockStyle")) return;

    const style = document.createElement("style");
    style.id = "petLinksDockStyle";
    style.textContent = `
      #petLinksDock{
        position: fixed;
        left: 18px;
        top: 50%;
        transform: translateY(-50%);
        z-index: ${DOCK_Z_INDEX};
        width: ${DOCK_WIDTH_PX}px;
        padding: 10px;
        border-radius: 14px;
        background: rgba(20, 22, 37, 0.72);
        border: 1px solid rgba(43, 46, 73, 0.85);
        box-shadow: 0 10px 28px rgba(0,0,0,.45);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: #fff;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        user-select: none;
      }
      #petLinksDockHeader{
        display:flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-weight: 800;
        font-size: 12px;
        padding: 0 2px 8px 2px;
        border-bottom: 1px solid rgba(43, 46, 73, 0.8);
        margin-bottom: 10px;
      }
      #petLinksDockStatus{
        font-weight: 700;
        font-size: 11px;
        color: #9aa0be;
        white-space: nowrap;
      }
      #petDockToggle{
        border: 1px solid rgba(43,46,73,.95);
        background: rgba(17, 19, 32, .9);
        color: #fff;
        font-weight: 900;
        font-size: 12px;
        width: 22px;
        height: 18px;
        border-radius: 8px;
        cursor: pointer;
      }
      #petdockMsg{
        color: #ffcc66;
        font-size: 12px;
        line-height: 1.2;
        padding: 6px 2px 10px 2px;
        min-height: 18px;
      }
      #petLinksDockList{
        display:flex;
        flex-direction: column;
        gap: 12px;
        max-height: 80vh;
        overflow: auto;
        border: none;
        scrollbar-width: none;
        -ms-overflow-style: none;
        padding-right: 2px;
        padding-bottom: 8px;
      }
      #petLinksDockList::-webkit-scrollbar{ width: 0; height: 0; }
      .petPair{
        position: relative;
        width: 76px;
        height: 76px;
        margin-left: 6px;
      }
      .petPair .main{
        width: 76px;
        height: 76px;
        border-radius: 50%;
        object-fit: cover;
        display: block;
        border: 2px solid rgba(43, 46, 73, 0.95);
        box-shadow: 0 6px 16px rgba(0,0,0,.35);
        background: #0f1120;
      }
      .petPair .linked{
        position: absolute;
        right: -8px;
        bottom: -8px;
        width: ${LINKED_SIZE_PX}px;
        height: ${LINKED_SIZE_PX}px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(43, 46, 73, 0.95);
        box-shadow: 0 6px 16px rgba(0,0,0,.35);
        background: #0f1120;
      }
      .petPair .linked2{
        position: absolute;
        right: -40px;
        bottom: -8px;
        width: ${LINKED_SIZE_PX}px;
        height: ${LINKED_SIZE_PX}px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(43, 46, 73, 0.95);
        box-shadow: 0 6px 16px rgba(0,0,0,.35);
        background: #0f1120;
      }
    `;
    document.head.appendChild(style);
  }

  // =========================
  // Helpers
  // =========================
  function setMsg(html) {
    const el = document.getElementById("petdockMsg");
    if (el) el.innerHTML = html;
  }
  function setStatus(obj) { gmSet(STATUS_KEY, { ...obj, at: Date.now() }); }
  function cleanText(s) { return (s || "").replace(/\s+/g, " ").trim(); }
  function truncate(s, maxLen = 80) { s = cleanText(s); return s.length > maxLen ? s.slice(0, maxLen - 1) + "…" : s; }
  function escapeHtml(s) {
    return String(s).replace(/[&<>\"']/g, c => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[c]));
  }
  function waitFor(checkFn, timeoutMs = 8000) {
    return new Promise(resolve => {
      const start = performance.now();
      (function tick() {
        if (checkFn()) return resolve(true);
        if (performance.now() - start > timeoutMs) return resolve(false);
        requestAnimationFrame(tick);
      })();
    });
  }
  function waitUntilVisible() {
    if (!document.hidden) return Promise.resolve();
    return new Promise(resolve => {
      const onVis = () => {
        if (!document.hidden) {
          document.removeEventListener("visibilitychange", onVis);
          window.removeEventListener("focus", onVis);
          resolve();
        }
      };
      document.addEventListener("visibilitychange", onVis);
      window.addEventListener("focus", onVis);
    });
  }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  async function gmGet(key, def) {
    try {
      const v = GM_getValue(key, def);
      return (v && typeof v.then === "function") ? await v : v;
    } catch { return def; }
  }
  async function gmSet(key, val) {
    try {
      const r = GM_setValue(key, val);
      if (r && typeof r.then === "function") await r;
    } catch {}
  }

  // ===== Per-set local cache helpers =====
  function computeSetKey(setNum, setName) {
    const n = cleanText(setNum || "");
    const nm = cleanText((setName || "").toLowerCase());
    return `${n}::${nm}`;
  }
  function lsReadMap() {
    try {
      const raw = localStorage.getItem(LOCAL_CACHE_BUCKET);
      if (!raw) return {};
      const obj = JSON.parse(raw);
      return (obj && typeof obj === "object") ? obj : {};
    } catch { return {}; }
  }
  function lsWriteMap(map) {
    try { localStorage.setItem(LOCAL_CACHE_BUCKET, JSON.stringify(map || {})); } catch {}
  }
  function getCachedBySetKey(setKey) {
    if (!setKey) return null;
    const map = lsReadMap();
    return map[setKey] || null;
  }
  function isLocalCacheFresh(entry) {
    if (!entry) return false;
    if (!LOCAL_CACHE_TTL_MS || LOCAL_CACHE_TTL_MS <= 0) return true;
    const age = Date.now() - Number(entry.savedAt || 0);
    return age >= 0 && age <= LOCAL_CACHE_TTL_MS;
  }
  function putCachedBySetKey(setKey, data) {
    if (!setKey) return;
    const map = lsReadMap();
    map[setKey] = {
      payload: data?.payload || null,
      label: cleanText(data?.label || ""),
      savedAt: Date.now()
    };
    lsWriteMap(map);
  }
  function delCachedBySetKey(setKey) {
    if (!setKey) return;
    const map = lsReadMap();
    if (map[setKey]) { delete map[setKey]; lsWriteMap(map); }
  }
  function listCachedSetEntries() {
    const map = lsReadMap();
    const out = [];
    for (const [setKey, entry] of Object.entries(map)) {
      out.push({
        setKey,
        label: entry?.label || setKey,
        savedAt: Number(entry?.savedAt || 0),
        count: entry?.payload?.pairs ? Object.keys(entry.payload.pairs).length : undefined
      });
    }
    out.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    return out;
  }

  // ---------- Numeric + inventory helpers ----------
  function extractFirstNumber(s) {
    const m = String(s || "").replace(/[,_]/g,"").match(/-?\d+(?:\.\d+)?/);
    return m ? Number(m[0]) : null;
  }
  function toInt(s) {
    const n = extractFirstNumber(s);
    return Number.isFinite(n) ? Math.round(n) : 0;
  }
  function buildPetInventoryIndexFromPage() {
    const boxes = document.querySelectorAll('.slot-box[data-pet-inv-id]');
    const index = {};
    const byFile = new Map();
    const byName = new Map();

    for (const box of boxes) {
      const id = box.getAttribute('data-pet-inv-id');
      const imgEl = box.querySelector('.pet-img-wrap img');
      const src = imgEl?.getAttribute('src') || "";
      const alt = cleanText(imgEl?.getAttribute('alt') || "");
      const race = cleanText(box.querySelector('.pet-race b')?.textContent || "");
      const atk = toInt(box.querySelector('.pet-atk')?.textContent || "0");
      const def = toInt(box.querySelector('.pet-def')?.textContent || "0");
      const powerText = cleanText(box.querySelector('.pet-power')?.textContent || "");
      const powerValue = extractFirstNumber(powerText);
      const absSrc = src ? new URL(src, location.href).href : "";
      const filename = absSrc.split('/').pop() || "";

      index[id] = { id, name: alt, race, atk, def, powerText, powerValue, imgSrc: absSrc, filename };
      if (filename && !byFile.has(filename)) byFile.set(filename, id);
      if (alt && !byName.has(alt.toLowerCase())) byName.set(alt.toLowerCase(), id);
    }
    return { index, byFile, byName };
  }
  function findPetIdForImageOrName(src, name, maps) {
    if (!src && !name) return null;
    const filename = src ? new URL(src, location.href).pathname.split('/').pop() : "";
    if (filename && maps.byFile.has(filename)) return maps.byFile.get(filename);
    const key = (name || "").toLowerCase().trim();
    if (key && maps.byName.has(key)) return maps.byName.get(key);
    if (filename) {
      for (const [id, ent] of Object.entries(maps.index)) {
        if ((ent.filename && ent.filename === filename) || (ent.imgSrc && ent.imgSrc.endsWith(filename))) return id;
      }
    }
    return null;
  }

  // ---------- Contributions + details modal ----------
  function linkFactor(isSameRace, isLink1) { return isSameRace ? (isLink1 ? 0.60 : 0.35) : (isLink1 ? 0.50 : 0.25); }

  function ensureDetailsModalCss() {
    if (document.getElementById("petdockDetailStyle")) return;
    const style = document.createElement("style");
    style.id = "petdockDetailStyle";
    style.textContent = `
      #petdockDetailMask {
        position: fixed; inset: 0; background: rgba(0,0,0,.45);
        display: none; z-index: ${DOCK_Z_INDEX + 1};
      }
      #petdockDetail {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
        min-width: 320px; max-width: 520px;
        background: rgba(20,22,37,0.95); border:1px solid rgba(43,46,73,.9);
        border-radius: 12px; color: #fff; font-family: inherit; padding: 14px;
        box-shadow: 0 18px 40px rgba(0,0,0,.5); z-index: ${DOCK_Z_INDEX + 2};
      }
      #petdockDetail h3 { margin: 0 0 8px; font-size: 14px; font-weight: 800; }
      #petdockDetail .meta { color:#cfd3ef; font-size:12px; margin-bottom:10px; }
      #petdockDetail .row { display:grid; grid-template-columns: 1fr auto; gap:8px; align-items:center; padding:6px 0; border-top:1px solid rgba(43,46,73,.5); }
      #petdockDetail .row:first-of-type { border-top:none; }
      #petdockDetail .lbl { font-weight:700; font-size:12px; color:#9aa0be; }
      #petdockDetail .v { font-size:13px; }
      #petdockDetail .sub { color:#9aa0be; font-size:11px; }
      #petdockDetail .contrib { color:#ffcc66; font-weight:700; }
      #petdockDetail .warn { color:#f28b82; font-weight:700; }
      #petdockDetail .btnbar { margin-top:10px; display:flex; justify-content:flex-end; gap:8px; }
      #petdockDetail .btn { border:1px solid rgba(43,46,73,.95); background:rgba(17,19,32,.9); color:#fff; border-radius:8px; padding:6px 10px; font-weight:700; cursor:pointer; }
    `;
    document.head.appendChild(style);
  }
  function ensureDetailsModalShell() {
    if (document.getElementById("petdockDetailMask")) return;
    const mask = document.createElement("div");
    mask.id = "petdockDetailMask";
    const modal = document.createElement("div");
    modal.id = "petdockDetail";
    mask.appendChild(modal);
    document.body.appendChild(mask);
    mask.addEventListener("click", (e) => { if (e.target === mask) mask.style.display = "none"; });
  }
  function showDetailsModal(html) {
    ensureDetailsModalCss();
    ensureDetailsModalShell();
    const mask = document.getElementById("petdockDetailMask");
    const box = document.getElementById("petdockDetail");
    box.innerHTML = html + `<div class="btnbar"><button class="btn" type="button" id="petdockDetailClose">Close</button></div>`;
    mask.style.display = "block";
    box.querySelector("#petdockDetailClose")?.addEventListener("click", () => (mask.style.display = "none"));
  }
  function fmtPctOrVal(v) { if (v == null || !Number.isFinite(v)) return "—"; const s = Math.abs(v) % 1 ? v.toFixed(2) : String(Math.round(v)); return s; }

  function renderPetDetailsModal(mainId, pair, invIndex) {
    const idx = invIndex?.index || {};
    const main = idx[mainId];
    const l1 = pair.linked1Id ? idx[pair.linked1Id] : null;
    const l2 = pair.linked2Id ? idx[pair.linked2Id] : null;

    const name = cleanText(pair.mainName || main?.name || "Main Pet");
    const same1 = (main && l1) ? (cleanText(main.race).toLowerCase() === cleanText(l1.race).toLowerCase()) : false;
    const same2 = (main && l2) ? (cleanText(main.race).toLowerCase() === cleanText(l2.race).toLowerCase()) : false;

    const f1 = linkFactor(same1, true);
    const f2 = linkFactor(same2, false);

    const l1AtkC = l1 ? Math.round(l1.atk * f1) : null;
    const l1DefC = l1 ? Math.round(l1.def * f1) : null;
    const l2AtkC = l2 ? Math.round(l2.atk * f2) : null;
    const l2DefC = l2 ? Math.round(l2.def * f2) : null;

      const totalAtk =
            (main?.atk ?? 0) +
            (l1AtkC ?? 0) +
            (l2AtkC ?? 0);

      const totalDef =
            (main?.def ?? 0) +
            (l1DefC ?? 0) +
            (l2DefC ?? 0);

    // Power: scale numeric unless link pet is in the excluded IDs
    const l1PowerC = (l1 && !POWER_EXCLUDED_IDS.has(String(l1.id))) && Number.isFinite(l1.powerValue) ? (l1.powerValue * f1) : null;
    const l2PowerC = (l2 && !POWER_EXCLUDED_IDS.has(String(l2.id))) && Number.isFinite(l2.powerValue) ? (l2.powerValue * f2) : null;

    const l1PowerNote = (l1 && POWER_EXCLUDED_IDS.has(String(l1.id))) ? `<span class="warn">excluded</span>` : "";
    const l2PowerNote = (l2 && POWER_EXCLUDED_IDS.has(String(l2.id))) ? `<span class="warn">excluded</span>` : "";

    const html = `
      <h3>${escapeHtml(name)}</h3>
      <div class="meta">
        ${main ? `Race: <b>${escapeHtml(main.race || "—")}</b><br>
        ATK ${main.atk ?? "—"}  → <span class="contrib">+${totalAtk.toLocaleString() ?? "—"}</span> •
        DEF ${main.def ?? "—"}  → <span class="contrib">+${totalDef.toLocaleString() ?? "—"}</span><br>
        Power: ${escapeHtml(main.powerText || "—")}` : "Main pet not found in inventory index."}
      </div>

      <div class="row">
        <div>
          <div class="lbl">Link 1${l1 ? "" : " (not found)"}</div>
          <div class="v">
            ${l1 ? `${escapeHtml(l1.name)} — Race: <b>${escapeHtml(l1.race || "—")}</b>
            <span class="sub">(${same1 ? "same race, 60%" : "diff race, 50%"})</span><br>
            ATK ${l1.atk} → <span class="contrib">+${l1AtkC ?? "—"}</span> •
            DEF ${l1.def} → <span class="contrib">+${l1DefC ?? "—"}</span><br>
            Power: ${escapeHtml(l1.powerText || "—")}
            ${Number.isFinite(l1PowerC) ? `→ <span class="contrib">+${fmtPctOrVal(l1PowerC)}</span>` : l1PowerNote || ""}`
            : "—"}
          </div>
        </div>
      </div>

      <div class="row">
        <div>
          <div class="lbl">Link 2${l2 ? "" : " (not found)"}</div>
          <div class="v">
            ${l2 ? `${escapeHtml(l2.name)} — Race: <b>${escapeHtml(l2.race || "—")}</b>
            <span class="sub">(${same2 ? "same race, 35%" : "diff race, 25%"})</span><br>
            ATK ${l2.atk} → <span class="contrib">+${l2AtkC ?? "—"}</span> •
            DEF ${l2.def} → <span class="contrib">+${l2DefC ?? "—"}</span><br>
            Power: ${escapeHtml(l2.powerText || "—")}
            ${Number.isFinite(l2PowerC) ? `→ <span class="contrib">+${fmtPctOrVal(l2PowerC)}</span>` : l2PowerNote || ""}`
            : "—"}
          </div>
        </div>
      </div>
    `;
    showDetailsModal(html);
  }

  // Enable opening details by clicking grid images (if pair/index exist)
  async function onGridImageClick(e) {
    const img = e.target && e.target.closest(".grid .slot-box .pet-img-wrap img");
    if (!img) return;
    const slot = img.closest(".slot-box");
    if (!slot) return;
    const petId = slot.getAttribute("data-pet-inv-id");
    if (!petId) return;

    const cache = await gmGet(CACHE_KEY, null);
    const pair = cache?.pairs?.[petId];
    if (!pair) return;

    const invMaps = await gmGet(INV_INDEX_KEY, null);
    if (!invMaps || !invMaps.index) return;

    renderPetDetailsModal(petId, pair, invMaps);
  }
})();
