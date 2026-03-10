// ==UserScript==
// @name         Pets Links dock
// @namespace    https://github.com/Daregon-sh/veyra
// @version      2.1.2
// @downloadURL  https://raw.githubusercontent.com/Daregon-sh/veyra/refs/heads/codes/Pets%20Links%20dock.js
// @updateURL    https://raw.githubusercontent.com/Daregon-sh/veyra/refs/heads/codes/Pets%20Links%20dock.js
// @description  Compact floating pet dock.
// @author       Daregon
// @match        https://demonicscans.org/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    function isExceptionPage() {
    // Normalize URL for robust matching
    const href = (window.location && window.location.href || "").toLowerCase();
    const path = (window.location && window.location.pathname || "").toLowerCase();

    // Match on pathname first (safer), then fallback to href
    const targets = [
        "/bookmark.php",
        "/title/",
        "/manga/",
        "/index.php",
    ];

    // If any target is present in the path or full URL → exception
    return targets.some(t => path.includes(t) || href.includes(t));
}

    if (isExceptionPage()) return;
  'use strict';

  // -----------------------
  // Config / constants
  // -----------------------
  const DOCK_Z_INDEX = 9999;
  const DOCK_WIDTH_PX = 145;      // compact width requested
  const PETPAIR_SIZE_PX = 76;     // main thumbnail size
  const LINKED_SIZE_PX = 40;      // linked thumbnail size
  const API_PATH = '/pet_links_ajax.php?pet_inv_id=';
  const CONCURRENT_FETCHES = 4;

  // Keys for persistence
  const DOCK_POS_KEY = 'petLinksDockPos';
  const DOCK_COLLAPSE_KEY = 'petLinksDockCollapsed';
  const PET_IDS_KEY = 'petInvIds';

  // -----------------------
  // small GM wrappers (fallback to localStorage)
  // -----------------------
  async function gmGet(key, fallback = null) {
    try {
      if (typeof GM_getValue === 'function') {
        const v = GM_getValue(key);
        return v === undefined ? fallback : v;
      }
    } catch (e) { /* ignore */ }
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  async function gmSet(key, value) {
    try {
      if (typeof GM_setValue === 'function') {
        GM_setValue(key, value);
        return;
      }
    } catch (e) { /* ignore */ }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* ignore */ }
  }

  // -----------------------
  // Styles (compact + external tooltip container)
  // -----------------------
  const style = document.createElement('style');
  style.textContent = `
    #petLinksDock{
      position: fixed;
      left: 18px;
      top: 50%;
      transform: translateY(-50%);
      z-index: ${DOCK_Z_INDEX};
      width: ${DOCK_WIDTH_PX}px;
      padding: 8px;
      border-radius: 12px;
      background: rgba(20, 22, 37, 0.72);
      border: 1px solid rgba(43, 46, 73, 0.85);
      box-shadow: 0 10px 28px rgba(0,0,0,.45);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #fff;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      user-select: none;
      touch-action: none;
    }
    #petLinksDockHeader{
      display:flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-weight: 800;
      font-size: 12px;
      padding: 0 2px 6px 2px;
      border-bottom: 1px solid rgba(43, 46, 73, 0.8);
      margin-bottom: 8px;
      cursor: move;
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
    #petdockBody{ padding-top:6px; }
    #petdockMsg{
      color: #ffcc66;
      font-size: 11px;
      line-height: 1.2;
      padding: 4px 2px 8px 2px;
      min-height: 16px;
    }
    #petLinksDockList{
      display:flex;
      flex-direction: column;
      gap: 10px;
      max-height: 80vh;
      overflow: auto;
      border: none;
      scrollbar-width: none;
      -ms-overflow-style: none;
      padding-right: 2px;
      padding-bottom: 6px;
      align-items: flex-start;
    }
    #petLinksDockList::-webkit-scrollbar{ width: 0; height: 0; }
    .petPair{
      position: relative;
      width: ${PETPAIR_SIZE_PX}px;
      height: ${PETPAIR_SIZE_PX}px;
      margin-left: 6px;
      flex: 0 0 auto;
    }
    .petPair .main{
      width: ${PETPAIR_SIZE_PX}px;
      height: ${PETPAIR_SIZE_PX}px;
      border-radius: 50%;
      object-fit: cover;
      display: block;
      border: 2px solid rgba(43, 46, 73, 0.95);
      box-shadow: 0 6px 16px rgba(0,0,0,.35);
      background: #0f1120;
      cursor: pointer;
    }
    .petPair .linked{
      position: absolute;
      right: -10px;
      bottom: -6px;
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
      right: -45px;
      bottom: -6px;
      width: ${LINKED_SIZE_PX}px;
      height: ${LINKED_SIZE_PX}px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(43, 46, 73, 0.95);
      box-shadow: 0 6px 16px rgba(0,0,0,.35);
      background: #0f1120;
    }
    .petIdItem{
      font-size: 12px;
      font-weight: 600;
      padding: 4px 6px;
      border-radius: 6px;
      background: rgba(43,46,73,.55);
    }

    /* external tooltip container (initially hidden) */
    #petLinksDockTooltip{
      position: fixed;
      z-index: ${DOCK_Z_INDEX + 2};
      display: none;
      min-width: 180px;
      max-width: 360px;
      background: rgba(10,12,20,.98);
      border: 1px solid rgba(43,46,73,.95);
      color: #dfe3ff;
      padding: 10px;
      border-radius: 8px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.6);
      font-size: 13px;
      pointer-events: none;
    }
    #petLinksDockTooltip .title { font-weight: 800; margin-bottom: 6px; }
    #petLinksDockTooltip .meta { color: #bfc6ff; }
    #petLinksDockTooltip .effect { color: #ffdca3; margin-top: 6px; }
  `;
  document.head.appendChild(style);

  // -----------------------
  // Create tooltip element (external)
  // -----------------------
  function ensureTooltip() {
    let tip = document.getElementById('petLinksDockTooltip');
    if (tip) return tip;
    tip = document.createElement('div');
    tip.id = 'petLinksDockTooltip';
    tip.innerHTML = `<div class="title"></div><div class="meta"></div><div class="effect"></div>`;
    document.body.appendChild(tip);
    return tip;
  }

  // -----------------------
  // Dock UI + drag + collapse (reference implementation)
  // -----------------------
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
      // ignore toggle clicks
      if (e.target && e.target.id === "petDockToggle") return;

      dragging = true;
      handle.setPointerCapture?.(e.pointerId);

      const rect = dock.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;

      // lock to pixel coords so removing transform doesn't jump
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

      // persist position (debounce not necessary but fine)
      await gmSet(DOCK_POS_KEY, { left: newLeft, top: newTop });
    });

    window.addEventListener("pointerup", () => {
      if (!dragging) return;
      dragging = false;
      handle.style.cursor = "grab";
    });
  }

  // -----------------------
  // Scrape IDs from first .grid
  // -----------------------
async function scrapePetIdsFromPetsPage() {
  try {
    const res = await fetch('/pets.php', { credentials: 'same-origin' });
    const html = await res.text();

    const doc = new DOMParser().parseFromString(html, 'text/html');

    // ✅ get ONLY first grid
    const firstGrid = doc.querySelector('.grid');
    if (!firstGrid) return [];

    return [...firstGrid.querySelectorAll('.slot-box[data-pet-inv-id]')]
      .map(el => el.getAttribute('data-pet-inv-id'))
      .filter(Boolean)
      .map(s => s.trim());

  } catch (err) {
    console.error('Failed fetching pets.php:', err);
    return [];
  }
}

  // -----------------------
  // Fetch pet links data
  // -----------------------
  async function fetchPetLinks(invId) {
    const url = API_PATH + encodeURIComponent(invId);
    try {
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('fetchPetLinks error', invId, err);
      return { status: 'error', error: String(err) };
    }
  }

  function absoluteUrl(path) {
    if (!path) return path;
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith('/')) path = path.slice(1);
    return location.origin + '/' + path;
  }

  function createPetPairElement(data) {
    if (!data || data.status !== 'success' || !data.pet) {
      const errDiv = document.createElement('div');
      errDiv.className = 'petIdItem';
      errDiv.textContent = 'Error loading';
      return errDiv;
    }

    const pet = data.pet;
    const links = Array.isArray(data.links) ? data.links : [];

    const pair = document.createElement('div');
    pair.className = 'petPair';

    // remove native title/aria tooltip: do NOT set title or aria-label on pair or images
    // store info in data- attributes for external tooltip
    pair.dataset.petName = pet.name || '';
    pair.dataset.petEffect = pet.total_effect_text || '';
    pair.dataset.petAtk = pet.updated_attack != null ? String(pet.updated_attack) : '';
    pair.dataset.petDef = pet.updated_defense != null ? String(pet.updated_defense) : '';

    const main = document.createElement('img');
    main.className = 'main';
    main.src = absoluteUrl(pet.img || '');
    main.alt = pet.name || `pet-${pet.inv_id || ''}`;
    main.dataset.invId = pet.inv_id || '';
    // ensure no title attribute
    main.removeAttribute('title');
    pair.appendChild(main);

    if (links[0]) {
      const l1 = document.createElement('img');
      l1.className = 'linked';
      l1.src = absoluteUrl(links[0].img || '');
      l1.alt = links[0].name || '';
      l1.dataset.invId = links[0].inv_id || '';
      // store link stats for tooltip if desired
      l1.dataset.linkName = links[0].name || '';
      l1.dataset.linkAtk = links[0].add_attack != null ? String(links[0].add_attack) : '';
      l1.dataset.linkDef = links[0].add_defense != null ? String(links[0].add_defense) : '';
      pair.appendChild(l1);
    }
    if (links[1]) {
      const l2 = document.createElement('img');
      l2.className = 'linked2';
      l2.src = absoluteUrl(links[1].img || '');
      l2.alt = links[1].name || '';
      l2.dataset.invId = links[1].inv_id || '';
      l2.dataset.linkName = links[1].name || '';
      l2.dataset.linkAtk = links[1].add_attack != null ? String(links[1].add_attack) : '';
      l2.dataset.linkDef = links[1].add_defense != null ? String(links[1].add_defense) : '';
      pair.appendChild(l2);
    }

    // show external tooltip on hover/focus
    const tip = ensureTooltip();
    pair.addEventListener('mouseenter', () => showExternalTooltip(pair, tip));
    pair.addEventListener('mousemove', () => showExternalTooltip(pair, tip));
    pair.addEventListener('mouseleave', () => hideExternalTooltip(tip));
    pair.addEventListener('focus', () => showExternalTooltip(pair, tip));
    pair.addEventListener('blur', () => hideExternalTooltip(tip));

    main.addEventListener('click', (e) => {
      e.stopPropagation();
      showDetailsModal(data);
    });

    return pair;
  }

  // -----------------------
  // External tooltip positioning & content
  // -----------------------
  function showExternalTooltip(pairEl, tipEl) {
    if (!pairEl || !tipEl) return;
    const name = pairEl.dataset.petName || '';
    const effect = pairEl.dataset.petEffect || '';
    const atk = pairEl.dataset.petAtk || '';
    const def = pairEl.dataset.petDef || '';

    tipEl.querySelector('.title').textContent = name;
    const metaParts = [];
    if (atk) metaParts.push(`ATK ${atk}`);
    if (def) metaParts.push(`DEF ${def}`);
    tipEl.querySelector('.meta').textContent = metaParts.join(' | ');
    tipEl.querySelector('.effect').textContent = effect;

    // compute position: prefer to the right of the dock; if not enough space, place left
    const dockRect = document.getElementById('petLinksDock')?.getBoundingClientRect() || { right: 0, left: 0 };
    const pairRect = pairEl.getBoundingClientRect();

    // measure tip size by temporarily showing offscreen
    tipEl.style.display = 'block';
    tipEl.style.left = '-9999px';
    tipEl.style.top = '-9999px';
    const tipRect = tipEl.getBoundingClientRect();
    const margin = 8;

    // default place to the right of the dock
    let left = Math.round(dockRect.right + margin);
    let top = Math.round(pairRect.top + (pairRect.height - tipRect.height) / 2);

    // clamp vertically
    const vh = window.innerHeight;
    if (top + tipRect.height + 8 > vh) top = Math.max(8, vh - tipRect.height - 8);
    if (top < 8) top = 8;

    // if not enough space on right, place to left of dock
    const vw = window.innerWidth;
    if (left + tipRect.width + 8 > vw) {
      left = Math.round(dockRect.left - tipRect.width - margin);
      if (left < 8) left = 8;
    }

    tipEl.style.left = `${left}px`;
    tipEl.style.top = `${top}px`;
    tipEl.style.display = 'block';
  }

  function hideExternalTooltip(tipEl) {
    if (!tipEl) return;
    tipEl.style.display = 'none';
  }

  // -----------------------
  // Simple details modal (overlay closable by clicking outside)
  // -----------------------
  function showDetailsModal(data) {
    let overlay = document.getElementById('petLinksDetailsOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'petLinksDetailsOverlay';
      overlay.style.position = 'fixed';
      overlay.style.left = '0';
      overlay.style.top = '0';
      overlay.style.right = '0';
      overlay.style.bottom = '0';
      overlay.style.background = 'rgba(0,0,0,0.6)';
      overlay.style.zIndex = DOCK_Z_INDEX + 50;
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = '';

    // close when clicking outside the box
    overlay.addEventListener('click', (ev) => {
      if (ev.target === overlay) overlay.remove();
    });

    const box = document.createElement('div');
    box.style.maxWidth = '720px';
    box.style.width = '90%';
    box.style.borderRadius = '12px';
    box.style.padding = '16px';
    box.style.background = 'linear-gradient(180deg, rgba(18,20,32,0.98), rgba(12,14,24,0.98))';
    box.style.border = '1px solid rgba(60,64,96,0.9)';
    box.style.color = '#e6e9ff';
    box.style.boxShadow = '0 20px 60px rgba(0,0,0,0.6)';
    overlay.appendChild(box);

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '12px';
    const title = document.createElement('div');
    title.style.fontWeight = '900';
    title.style.fontSize = '16px';
    title.textContent = (data.pet && data.pet.name) ? data.pet.name : 'Pet Details';
    header.appendChild(title);
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.borderRadius = '8px';
    closeBtn.style.padding = '6px 10px';
    closeBtn.style.background = 'rgba(30,32,48,0.9)';
    closeBtn.style.border = '1px solid rgba(60,64,96,0.9)';
    closeBtn.addEventListener('click', () => overlay.remove());
    header.appendChild(closeBtn);
    box.appendChild(header);

    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.gap = '12px';
    content.style.alignItems = 'flex-start';

    const left = document.createElement('div');
    const mainImg = document.createElement('img');
    mainImg.src = absoluteUrl((data.pet && data.pet.img) || '');
    mainImg.alt = (data.pet && data.pet.name) || '';
    mainImg.style.width = '160px';
    mainImg.style.height = '160px';
    mainImg.style.objectFit = 'cover';
    mainImg.style.borderRadius = '12px';
    mainImg.style.border = '1px solid rgba(60,64,96,0.9)';
    left.appendChild(mainImg);
    content.appendChild(left);

    const right = document.createElement('div');
    right.style.flex = '1';
    right.style.fontSize = '13px';

    if (data.pet) {
      const p = data.pet;
      const lines = [];
      if (p.inv_id) lines.push(`Inv ID: ${p.inv_id}`);
      if (p.pet_id) lines.push(`Pet ID: ${p.pet_id}`);
      if (p.updated_attack != null) lines.push(`ATK: ${p.updated_attack}`);
      if (p.updated_defense != null) lines.push(`DEF: ${p.updated_defense}`);
      if (p.total_effect_text) lines.push(`Effect: ${p.total_effect_text}`);
      right.innerHTML = lines.map(l => `<div style="margin-bottom:6px">${l}</div>`).join('');
    }

    if (Array.isArray(data.links) && data.links.length) {
      const linksTitle = document.createElement('div');
      linksTitle.style.marginTop = '8px';
      linksTitle.style.fontWeight = '800';
      linksTitle.textContent = 'Linked Pets';
      right.appendChild(linksTitle);

      data.links.forEach(link => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '8px';
        row.style.marginTop = '8px';

        const img = document.createElement('img');
        img.src = absoluteUrl(link.img || '');
        img.alt = link.name || '';
        img.style.width = '48px';
        img.style.height = '48px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.border = '1px solid rgba(60,64,96,0.9)';
        row.appendChild(img);

        const info = document.createElement('div');
        info.style.fontSize = '13px';

        // include add_attack and add_defense for links
        const linkLines = [];
        if (link.name) linkLines.push(`<div style="font-weight:800">${link.name}</div>`);
        const linkStats = [];
        if (link.add_attack != null) linkStats.push(`+ATK ${link.add_attack}`);
        if (link.add_defense != null) linkStats.push(`+DEF ${link.add_defense}`);
        if (link.share_pct_label) linkStats.push(`${link.share_pct_label}`);
        if (linkStats.length) linkLines.push(`<div style="color:#bfc6ff; margin-top:4px">${linkStats.join(' | ')}</div>`);
        if (link.effect_text) linkLines.push(`<div style="color:#bfc6ff; margin-top:6px">${link.effect_text}</div>`);

        info.innerHTML = linkLines.join('');
        row.appendChild(info);

        right.appendChild(row);
      });
    }

    content.appendChild(right);
    box.appendChild(content);
  }

  // -----------------------
  // Render flow
  // -----------------------
  async function renderIdsAsImages(ids) {
    const listEl = document.getElementById('petLinksDockList');
    const msgEl = document.getElementById('petdockMsg');
    if (!listEl || !msgEl) return;

    listEl.innerHTML = '';
    if (!ids || !ids.length) {
      msgEl.textContent = 'No pets found';
      return;
    }

    msgEl.textContent = `Loading ${ids.length} pets…`;

    const queue = ids.slice();
    const workers = new Array(CONCURRENT_FETCHES).fill(null).map(async () => {
      while (queue.length) {
        const id = queue.shift();
        if (!id) continue;
        const placeholder = document.createElement('div');
        placeholder.className = 'petIdItem';
        placeholder.textContent = `#${id}`;
        listEl.appendChild(placeholder);

        const data = await fetchPetLinks(id);
        const el = createPetPairElement(data);
        listEl.replaceChild(el, placeholder);

        await new Promise(r => setTimeout(r, 60));
      }
    });

    await Promise.all(workers);
    msgEl.textContent = `Loaded ${ids.length} pets`;
    try { await gmSet(PET_IDS_KEY, ids); } catch (e) { /* ignore */ }
  }

  // -----------------------
  // Init
  // -----------------------
  (async function init() {
    ensureDock();
    ensureTooltip();
    await restoreDockState();

    // gather ids
    let ids = await scrapePetIdsFromPetsPage();
    if (!ids.length) {
      const fallback = await gmGet(PET_IDS_KEY, []);
      if (Array.isArray(fallback) && fallback.length) ids = fallback;
    }

    if (!ids.length) {
      const msgEl = document.getElementById('petdockMsg');
      if (msgEl) msgEl.textContent = 'No pet ids found on page or in localStorage';
      return;
    }

    await renderIdsAsImages(ids);
  })();

  // -----------------------
  // Expose refresh
  // -----------------------
  window.__petLinksDock = {
    refresh: async () => {
      const ids = await scrapePetIdsFromPetsPage();
      if (ids.length) {
        await renderIdsAsImages(ids);
      } else {
        const fallback = await gmGet(PET_IDS_KEY, []);
        await renderIdsAsImages(fallback || []);
      }
    }
  };

})();

// Call this on stats.php
async function injectStatsCards() {
  const API = '/pet_links_ajax.php?pet_inv_id=';
  const CONCURRENCY = 4;

  // helper: fetch JSON for a pet inv id
  async function fetchPet(invId) {
    try {
      const res = await fetch(API + encodeURIComponent(invId), { credentials: 'same-origin' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (err) {
      console.warn('fetchPet error', invId, err);
      return { status: 'error', error: String(err) };
    }
  }

  // helper: scrape ids from first .grid
  function scrapeIds() {
    const grid = document.querySelector('.grid');
    if (!grid) return [];
    const nodes = Array.from(grid.querySelectorAll('.slot-box'));
    const ids = nodes.map(n => n.getAttribute('data-pet-inv-id')).filter(Boolean).map(s => s.trim());
    if (ids.length) return ids;
    // fallback to localStorage.petInvIds if present
    try {
      const raw = localStorage.getItem('petInvIds');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch (e) { /* ignore */ }
    return [];
  }

  // helper: create a .card element with the requested format and values
  function makeCard(title, attack, defense) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${escapeHtml(title)}</h3>
      <div class="row"><span>ATTACK</span><span class="v-attack">${attack}</span></div>
      <div class="row"><span>DEFENSE</span><span class="v-defense">${defense}</span></div>
    `;
    return card;
  }

  // helper: create totals card (PETS Attack / PETS Defense)
  function makeTotalsCard(totalAtk, totalDef) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>📊 Aggregated Totals</h3>
      <div class="row"><span>PETS ATTACK</span><span class="v-attack-total">${totalAtk}</span></div>
      <div class="row"><span>PETS DEFENSE</span><span class="v-defense-total">${totalDef}</span></div>
    `;
    return card;
  }

  // helper: create effects card listing only effects (no pet names)
  function makeEffectsCard(effectsList) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<h3>✨ Pets Effects</h3>`;
    const container = document.createElement('div');
    container.style.marginTop = '6px';
    container.style.fontSize = '13px';
    container.style.color = '#cfd3ef';

    if (!effectsList.length) {
      const none = document.createElement('div');
      none.style.color = '#9aa0be';
      none.textContent = 'No effects';
      container.appendChild(none);
    } else {
      effectsList.forEach(eff => {
        const effLine = document.createElement('div');
        effLine.style.marginTop = '6px';
        effLine.style.color = '#ffdca3';
        effLine.textContent = eff;
        container.appendChild(effLine);
      });
    }

    card.appendChild(container);
    return card;
  }

  // simple HTML escape for pet names
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

// find render container (still needed to place cards)
const grid = document.querySelector('.grid');
if (!grid) return;


// ---- always fetch pets from pets.php ----
async function fetchIdsFromPetsPage() {
  try {
    const res = await fetch('/pets.php', { credentials: 'same-origin' });
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // first grid that actually contains pets
    const grids = [...doc.querySelectorAll('.grid')];
    const petGrid = grids.find(g => g.querySelector('[data-pet-inv-id]'));
    if (!petGrid) return [];

    return [...petGrid.querySelectorAll('[data-pet-inv-id]')]
      .map(el => el.dataset.petInvId)
      .filter(Boolean);

  } catch (err) {
    console.warn('Failed fetching pets.php', err);
    return [];
  }
}

const ids = await fetchIdsFromPetsPage();

if (!ids.length) return;
  if (!ids.length) {
    // nothing to do
    return;
  }

  // concurrency worker queue
  const queue = ids.slice();
  const results = []; // will hold {inv_id, json}
  const workers = new Array(CONCURRENCY).fill(null).map(async () => {
    while (queue.length) {
      const id = queue.shift();
      if (!id) continue;
      const json = await fetchPet(id);
      results.push({ inv_id: id, json });
      // small delay to be polite
      await new Promise(r => setTimeout(r, 40));
    }
  });
  await Promise.all(workers);

  // For each result, compute main atk/def and append a .card for the main pet
  let totalMainAtk = 0;
  let totalMainDef = 0;

  // collect effects (strings) for the effects card (no pet names)
  const effectsCollection = [];

  for (const item of results) {
    const data = item.json;
    if (!data || data.status !== 'success' || !data.pet) {
      // create a card showing error
      const errCard = document.createElement('div');
      errCard.className = 'card';
      errCard.innerHTML = `<h3>⚠️ Pet ${escapeHtml(item.inv_id)}</h3><div class="row"><span>Error</span><span>${escapeHtml(data && data.error ? data.error : 'no data')}</span></div>`;
      grid.appendChild(errCard);
      continue;
    }

    const pet = data.pet;

    // main pet stats only (ignore links for aggregation)
    const mainAtk = Number(pet.updated_attack || 0);
    const mainDef = Number(pet.updated_defense || 0);

    totalMainAtk += mainAtk;
    totalMainDef += mainDef;

    // create card with pet name as header and only attack/defense rows
    const card = makeCard(pet.name || `Pet ${pet.inv_id || item.inv_id}`, mainAtk, mainDef);

    // collect effects: include pet.total_effect_text and each link.effect_text (if present)
    if (pet.total_effect_text) effectsCollection.push(String(pet.total_effect_text));
    const links = Array.isArray(data.links) ? data.links : [];
    links.forEach(l => {
      if (l.effect_text) effectsCollection.push(String(l.effect_text));
    });

    // Optionally append a small summary of links (non-intrusive) — keep but do not include their stats in aggregation
    if (links.length) {
      const linksWrap = document.createElement('div');
      linksWrap.style.marginTop = '8px';
      linksWrap.style.fontSize = '12px';
      linksWrap.style.color = '#cfd3ef';
      linksWrap.innerHTML = `<strong>Links</strong>`;
      links.forEach(l => {
        const line = document.createElement('div');
        line.style.display = 'flex';
        line.style.justifyContent = 'space-between';
        line.style.gap = '8px';
        line.style.marginTop = '4px';
        const name = document.createElement('span');
        name.textContent = l.name || `#${l.inv_id || ''}`;
        const stats = document.createElement('span');
        const atk = l.add_attack != null ? `+${l.add_attack}` : '+0';
        const def = l.add_defense != null ? `+${l.add_defense}` : '+0';
        stats.textContent = `${atk} / ${def}`;
        line.appendChild(name);
        line.appendChild(stats);
        linksWrap.appendChild(line);
      });
      card.appendChild(linksWrap);
    }

    grid.appendChild(card);
  }

  // deduplicate effects while preserving order
  const seen = new Set();
  const uniqueEffects = [];
  for (const eff of effectsCollection) {
    const trimmed = String(eff || '').trim();
    if (!trimmed) continue;
    if (!seen.has(trimmed)) {
      seen.add(trimmed);
      uniqueEffects.push(trimmed);
    }
  }

  // Append or update the second .card in .grid with aggregated totals (main pets only)
  const cards = Array.from(grid.querySelectorAll('.card'));
  if (cards.length >= 2) {
    // update second card: replace or upsert rows for totals
    const second = cards[1];

    // remove any previously inserted total rows with our classes to avoid duplicates
    const existingAtk = second.querySelector('.v-attack-total');
    const existingDef = second.querySelector('.v-defense-total');

    if (existingAtk) {
      existingAtk.textContent = String(totalMainAtk);
    } else {
      const r = document.createElement('div');
      r.className = 'row';
      r.innerHTML = `<span>PETS ATTACK</span><span class="v-attack-total">${totalMainAtk}</span>`;
      second.appendChild(r);
    }

    if (existingDef) {
      existingDef.textContent = String(totalMainDef);
    } else {
      const r = document.createElement('div');
      r.className = 'row';
      r.innerHTML = `<span>PETS DEFENSE</span><span class="v-defense-total">${totalMainDef}</span>`;
      second.appendChild(r);
    }
  } else {
    // create a second card with totals and append
    const totalsCard = makeTotalsCard(totalMainAtk, totalMainDef);
    grid.appendChild(totalsCard);
  }

  // Append an additional card listing only the effects (no pet names)
  const effectsCard = makeEffectsCard(uniqueEffects);
  grid.appendChild(effectsCard);
}

// Example: run automatically when on stats.php
if (location.pathname && location.pathname.includes('stats.php')) {
  // small delay to allow page grid to render
  setTimeout(() => {
    injectStatsCards().catch(err => console.error('injectStatsCards error', err));
  }, 300);
}
