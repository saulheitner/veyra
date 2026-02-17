// ==UserScript==
// @name         Veyra Visual Addon
// @namespace    https://github.com/Daregon-sh/veyra
// @version      1.6.1
// @downloadURL  https://raw.githubusercontent.com/Daregon-sh/veyra/refs/heads/codes/Veyra%20Visual%20Addon.js
// @updateURL    https://raw.githubusercontent.com/Daregon-sh/veyra/refs/heads/codes/Veyra%20Visual%20Addon.js
// @description  sidebars visual integration
// @author       Daregon
// @match        https://demonicscans.org/*
// @license MIT
// ==/UserScript==

window.addEventListener('load', () => {

    ['.side-drawer', '#battleDrawer'].forEach(selector => {
        const el = document.querySelector(selector);
        if (el) {
            el.style.zIndex = '100051';
        } else {
            console.warn(`[ZIndex Modifier] Element not found for selector: ${selector}`);
        }
    });


    const style = document.createElement('style');
    style.textContent = `

    #battleDrawer {
      overflow-y: scroll;
    }

    #battleDrawer::-webkit-scrollbar {
      width: 4px;
    }

    #battleDrawer::-webkit-scrollbar-thumb {
      background: #2b2d44;
      border-radius: 3px;
    }

    #battleDrawer::-webkit-scrollbar-track {
      background: #0f1017;
    }

	.stats-wrapper {
	  display: flex;
	  flex-direction: column;
	}

	.stats-submenu {
	  margin-left: 20px;
	  display: flex;
	  flex-direction: column;
	}
	 .expand-btn {
	    color: #d5d9f5;
		background: #1a1b25;
		border: 1px solid #2b2d44;
		border-radius: 0 10px 10px 0;
		padding: 9px 10px;
		font-size: 13px;
		font-weight: 600;
		line-height: 1.3;
		margin: 0 0 8px 0;
		box-shadow: 0 4px 12px rgba(0, 0, 0, .4);
		transition: background .12s ease, box-shadow .12s ease;
	 }

	 .upgrade-btn {
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #e0e0e0;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        min-width: 24px;
      }

      .expand-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }

	  .side-stat-pill{
		display: inline-block;
		width: 4ch;
		text-align: right;
		font-size: 13px;
	  }
	   *::before, *::after {
		box-sizing: border-box;
      }
	  .stat-upgrade-row{
		  display:flex;
	  }
	  .upgrade-section{
		  font-family: monospace;
		  font-size: 15px;
		  padding-bottom:8px;
		  display: none;
	 }
	 .upgrade-section.expanded{
		 display:block;

	 }
	 .quest-section{
		  font-family: monospace;
		  font-size: 15px;
		  padding-bottom:8px;
		  display: none;
	 }
	 .quest-section.expanded{
		 display:block;

	 }
	 .side-label{
		     min-width: 35px;
	 }
	  .sidebar-quest-panel {
        padding: 10px;
        background: rgba(49, 50, 68, 0.3);
        border-radius: 6px;
        margin-top: 10px;
      }

      .sidebar-quest {
        margin-bottom: 10px;
        padding: 8px;
        background: rgba(30, 30, 46, 0.5);
        border-radius: 5px;
        border-left: 3px solid #89b4fa;
        transition: all 0.2s ease;
      }

      .sidebar-quest:hover {
        background: rgba(30, 30, 46, 0.7);
        border-left-color: #f9e2af;
      }

      .sidebar-quest.completed {
        border-left-color: #a6e3a1;
        opacity: 0.7;
      }

      .quest-title {
        font-weight: bold;
        color: #cdd6f4;
        font-size: 11px;
        margin-bottom: 4px;
      }

      .sidebar-quest.completed .quest-title {
        color: #a6e3a1;
      }

      .quest-details {
        color: #6c7086;
        font-size: 9px;
        margin-bottom: 5px;
      }

      .quest-progress-bar {
        background: #313244;
        border-radius: 3px;
        height: 5px;
        overflow: hidden;
        margin-bottom: 4px;
      }

      .quest-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #22c55e, #16a34a);
        transition: width 0.3s ease;
        border-radius: 3px;
      }

      .sidebar-quest.completed .quest-progress-fill {
        background: linear-gradient(90deg, #a6e3a1, #94e2d5);
      }

      .quest-status {
        color: #a6adc8;
        font-size: 9px;
        text-align: right;
      }

      .sidebar-quest.completed .quest-status {
        color: #a6e3a1;
      }

      .loading-text, .quest-empty, .quest-error {
        text-align: center;
        padding: 15px;
        color: #6c7086;
        font-size: 11px;
        font-style: italic;
      }

      .quest-error {
        color: #f38ba8;
      }

 #nav-order-panel {
    position: fixed;
    inset: 0;
    z-index: 200000;
    display: none;
    background: rgba(0,0,0,0.45);
  }
  #nav-order-panel.open { display: block; }

  /* Panel */
  #nav-order-panel .panel {
    position: absolute;
    right: 40%;
    bottom: 80px;
    width: 360px;
    max-height: 72vh;
    overflow: hidden;
    background: #1e1e2e;
    color: #fff;
    border: 1px solid #3a3a55;
    border-radius: 12px;
    box-shadow: 0 16px 40px rgba(0,0,0,0.5);
    display: flex;
    flex-direction: column;
  }
  #nav-order-panel .panel-header {
    padding: 10px 12px;
    border-bottom: 1px solid #333a;
    display: flex; align-items: center; justify-content: space-between;
    gap: 8px;
  }
  #nav-order-panel .header-left { display: flex; flex-direction: column; gap: 8px; }
  #nav-order-panel .clicks-toggle {
    display: flex; align-items: center; gap: 8px; font-size: 12px; opacity: 0.85;
  }
  #nav-order-panel .panel-body { padding: 10px 12px; overflow: auto; }
  #nav-order-panel .panel-footer {
    padding: 10px 12px; border-top: 1px solid #333a;
    display: flex; gap: 8px; justify-content: space-between; align-items: center;
  }

  /* Reorder list */
  #nav-order-list { list-style: none; margin: 0; padding: 0; }
  .order-item {
    display: grid;
    grid-template-columns: 24px 1fr auto;
    align-items: center; gap: 8px;
    padding: 8px 10px; margin-bottom: 8px;
    background: #2a2a40;
    border: 1px solid #3a3a55; border-radius: 8px;
    user-select: none;
  }
  .order-item.drag-over { outline: 2px dashed #e59f5a; }
  .order-item .drag-handle { font-size: 16px; cursor: grab; }
  .order-item .title { display: flex; flex-direction: column; }
  .order-item .label { font-weight: 600; }
  .order-item .href { opacity: 0.7; font-size: 12px; }
  .order-item .toggle { display: flex; align-items: center; gap: 6px; font-size: 12px; }

  /* Buttons */
  .order-btn { padding: 8px 10px; border-radius: 8px; border: 1px solid #444; cursor: pointer; }
  .order-btn.primary { background: #3b82f6; border-color: #3b82f6; color: #fff; }
  .order-btn.secondary { background: #2a2a40; color: #fff; }
  .order-btn.danger { background: #ef4444; color: #fff; border-color: #ef4444; }

  /* Disable clicks class (applied to .side-nav while panel open if toggled) */
  .side-nav.nav-clicks-disabled,
  .side-nav.nav-clicks-disabled * {
    pointer-events: none !important;
  }
  .side-nav.nav-clicks-disabled { opacity: 0.9; }
  .side-nav-settings{
	display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: #d5d9f5;
    background: #1a1b25;
    border: 1px solid #2b2d44;
    border-radius: 10px;
    padding: 9px 10px;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
    margin-bottom: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, .4);
    transition: background .12s ease, box-shadow .12s ease;
}

 `;
    document.head.appendChild(style);
});

function initOrderPanel(){
    const navOrder = document.createElement('div');
    navOrder.id="nav-order-panel"
    navOrder.innerHTML= `
 <div class="panel" role="dialog" aria-label="Customize Navigation Order">
    <div class="panel-header">
      <div class="header-left">
        <strong>Customize Navigation</strong>
        <label class="clicks-toggle" title="Prevent accidental navigation while ordering">
          <input type="checkbox" id="nav-clicks-disabled">
          Disable sidebar clicks while ordering
        </label>
      </div>
      <button class="order-btn secondary" id="nav-order-close" >✖</button>
    </div>
    <div class="panel-body">
      <ul id="nav-order-list"></ul>
    </div>
    <div class="panel-footer">
      <div style="display:flex; gap:8px;">
        <button class="order-btn secondary" id="nav-order-hide-all">Hide all</button>
        <button class="order-btn secondary" id="nav-order-show-all">Show all</button>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="order-btn danger" id="nav-order-reset">Reset</button>
        <button class="order-btn primary" id="nav-order-save">Save</button>
      </div>
    </div>
  </div>
 `;
    document.body.appendChild(navOrder);
}
initOrderPanel();


function modifySideNav() {
    // ------------------------------
    // Prevent re-entrant rebuilds
    // ------------------------------
    const nav = document.querySelector('.side-nav');
    if (!nav) return;
    if (nav.dataset.rebuilding === '1') return;
    nav.dataset.rebuilding = '1';

    try {
        // ------------------------------
        // User meta → link to player (unchanged)
        // ------------------------------
        const userMeta = document.querySelector('.small-user-meta');
        const img = document.querySelector('.small-ava img');
        if (img && userMeta) {
            const src = img.getAttribute('src');
            const match = src.match(/user_(\d+)_/);
            if (match) {
                const pid = match[1];
                const url = `/player.php?pid=${pid}`;
                const link = document.createElement('a');
                link.href = url;
                link.style.display = 'block';
                link.style.textDecoration = 'none';
                link.appendChild(userMeta.cloneNode(true));
                userMeta.replaceWith(link);
            }
        }

        // ------------------------------
        // 0) De-duplicate existing anchors by href
        // ------------------------------
        (function dedupeNavItemsByHref(navEl) {
            const seen = new Set();
            navEl.querySelectorAll('.side-nav-item').forEach(a => {
                const href = a.getAttribute('href') || '';
                if (seen.has(href)) {
                    a.remove();
                } else {
                    seen.add(href);
                }
            });
        })(nav);

        // ------------------------------
        // 1) Base setup — upsert custom items
        //    (REMOVED Legendary Forge top-level per request)
        // ------------------------------
        function appendCustomItemOnce(href, icon, label) {
            const existing = nav.querySelector(`.side-nav-item[href="${href}"]`);
            if (!existing) {
                const el = createItem(href, icon, label); // your global helper
                el.dataset.custom = '1';
                nav.append(el);
            }
        }

        appendCustomItemOnce('/adventurers_guild.php', '🏛️', 'Adventurers Guild');
        appendCustomItemOnce('/classes.php', '📜', 'Classes');
        // REMOVED: appendCustomItemOnce('/legendary_forge.php', '🔥', 'Legendary Forge');

        // ------------------------------
        // 2) Read prefs from localStorage (unchanged)
        // ------------------------------
        const { order, disabled } = loadPrefs();
        const orderIndex = new Map(order.map((h, i) => [h, i]));
        const disabledSet = new Set(disabled);

        // Collect existing nav anchors (exclude the settings launcher)
        const items = Array.from(nav.querySelectorAll('.side-nav-item'))
        .filter(a => a.id !== 'nav-order-btn');

        // ------------------------------
        // 3) Reorder & filter hidden (unchanged)
        // ------------------------------
        const sortedAnchors = [...items]
        .sort((a, b) => {
            const ah = a.getAttribute('href');
            const bh = b.getAttribute('href');
            const ai = orderIndex.has(ah) ? orderIndex.get(ah) : Number.POSITIVE_INFINITY;
            const bi = orderIndex.has(bh) ? orderIndex.get(bh) : Number.POSITIVE_INFINITY;
            return ai - bi;
        })
        .filter(a => !disabledSet.has(a.getAttribute('href')));

        const frag = document.createDocumentFragment();
        sortedAnchors.forEach(n => frag.appendChild(n));
        nav.replaceChildren(frag);

        const hiddenSet = disabledSet;

        // ------------------------------
        // 4) Helpers for sections/placement (wrapper-aware)
        // ------------------------------
        function ensureSection(id, className = 'upgrade-section', html = '') {
            let el = document.getElementById(id);
            if (!el) {
                el = document.createElement('div');
                el.id = id;
            }
            el.className = className; // your CSS controls show/hide via .expanded
            if (html) el.innerHTML = html;
            return el;
        }

        /**
     * Place `el` relative to the anchor (or its wrapper if already wrapped).
     * where: 'before' | 'after' | 'prepend' | 'append'
     * Skips placement if the anchor is hidden or missing.
     */
        function placeRelativeTo(href, el, where = 'after') {
            if (hiddenSet.has(href)) return null;
            const anchor = nav.querySelector(`.side-nav-item[href="${href}"]`);
            if (!anchor) return null;

            const target = anchor.parentElement?.classList?.contains('side-nav-flex')
            ? anchor.parentElement
            : anchor;

            switch (where) {
                case 'before': target.before(el); break;
                case 'after': target.after(el); break;
                case 'prepend': target.prepend(el); break;
                case 'append': target.append(el); break;
                default: target.after(el);
            }
            return el;
        }

        // ------------------------------
        // 5) Build HTML for the new/updated sections
        // ------------------------------
        // GAME — two groups: Grakthar (current waves) + Olympus (alt wave 1)
        const gameSectionHTML = `
      <div class="submenu-group" style="margin-left: 10px; margin-top: 4px;">
        <div class="submenu-title" style="font-weight:600; color:#e6e6e6; margin-bottom:4px;">Grakthar</div>
        <div class="submenu-items">
          <div style="font-size:12px;margin-left: 15px; padding: 6px; background: rgba(30, 30, 46, 0.5); border-radius: 4px; border-left: 2px solid #e59f5a;">
		  <a style="text-decoration: none; color:white;" href="/active_wave.php?gate=3&wave=3">
              <span class="side-icon">⚔️</span>
              <span class="side-label">Wave 1 </span>
              <span class="side-icon">🧌 👹 🛡️</span>
            </a>
          </div>
          <div style="font-size:12px;margin-left: 15px; margin-top:6px; padding: 6px; background: rgba(30, 30, 46, 0.5); border-radius: 4px; border-left: 2px solid #e59f5a;">
            <a style="text-decoration: none; color:white;" href="/active_wave.php?gate=3&wave=5">
              <span class="side-icon">⚔️</span>
              <span class="side-label">Wave 2 </span>
              <span class="side-icon">👹 🦖 🛡️</span>
            </a>
          </div>
          <div style="font-size:12px;margin-left: 15px; margin-top:6px; padding: 6px; background: rgba(30, 30, 46, 0.5); border-radius: 4px; border-left: 2px solid #e59f5a;">
            <a style="text-decoration: none; color:white;" href="/active_wave.php?gate=3&wave=8">
              <span class="side-icon">⚔️</span>
              <span class="side-label">Wave 3 </span>
              <span class="side-icon">🦖 🐉 🛡️</span>
            </a>
          </div>
        </div>
      </div>

      <div class="submenu-group" style="margin-left: 10px; margin-top: 10px;">
        <div class="submenu-title" style="font-weight:600; color:#e6e6e6; margin-bottom:4px;">Olympus</div>
        <div class="submenu-items">
          <div style="font-size:12px;margin-left: 15px; padding: 6px; background: rgba(30, 30, 46, 0.5); border-radius: 4px; border-left: 2px solid #e59f5a;">
            <a style="text-decoration: none; color:white;" href="/active_wave.php?gate=5&wave=9">
              <span class="side-icon">⚔️</span>
              <span class="side-label">Wave 1 </span>
              <span class="side-icon">⚡️ 🔱 🛡️</span>
            </a>
          </div>
        </div>
      </div>
    `;

      // GUILD — two groups: Guild Dungeon + Guild War
      const guildSectionHTML = `
      <div class="submenu-group" style="margin-left: 10px; margin-top: 10px;">
        <div class="submenu-title" style="font-weight:600; color:#e6e6e6; margin-bottom:4px;">Guild War</div>
        <div class="submenu-items">
          <div style="margin-left: 6px; padding: 6px; background: rgba(30, 30, 46, 0.5); border-radius: 4px; border-left: 2px solid #5aa4e5;font-size:9px">
            <a style="text-decoration: none; color:white;" href="/world_map.php">
              <span class="side-icon">🗺️</span>
              <span class="side-label">Territory War</span>
            </a>
          </div>
        </div>
      </div>
	  <div class="submenu-group" style="margin-left: 10px; margin-top: 4px;">
        <div class="submenu-title" style="font-weight:600; color:#e6e6e6; margin-bottom:4px;">Guild Dungeon</div>
        <div id="guild-dungeon-slot" class="submenu-items"></div>
      </div>
    `;

      // PVP — Colosseum
      const pvpSectionHTML =`
      <div style="margin-left: 15px; padding: 6px; background: rgba(30, 30, 46, 0.5); border-radius: 4px; border-left: 2px solid #9f5ae5;">
        <a style="text-decoration: none; color:white;" href="/colosseum.php">
		  <span class="side-icon">🏟️</span>
          <span class="side-label">Colosseum</span>
        </a>
      </div>
    `;

      // MERCHANT — Black merchant
      const merchantSectionHTML =`
      <div style="margin-left: 15px; padding: 6px; background: rgba(30, 30, 46, 0.5); border-radius: 4px; border-left: 2px solid #0f0f0f;">
        <a style="text-decoration: none; color:white;" href="black_merchant.php">
		  <span class="side-icon">⛃</span>
          <span class="side-label">Black merchant</span>
        </a>
      </div>
    `;

      // STATS — keep your existing pills/buttons
      const statsSectionHTML = `
      <div class="stat-upgrade-row" data-stat="attack">
        <div class="stat-info">
          <span>⚔️ Atk:</span>
          <span class="side-stat-pill" style="padding-right: 8px;" id="sidebar-attack-alloc">0000</span>
        </div>
        <div class="upgrade-controls">
          <button class="upgrade-btn" draggable="false">+1</button>
          <button class="upgrade-btn" draggable="false">+5</button>
        </div>
      </div>

      <div class="stat-upgrade-row" data-stat="defense">
        <div class="stat-info">
          <span>🛡️ Def:</span>
          <span class="side-stat-pill" style="padding-right: 8px;" id="sidebar-defense-alloc">0000</span>
        </div>
        <div class="upgrade-controls">
          <button class="upgrade-btn" draggable="false">+1</button>
          <button class="upgrade-btn" draggable="false">+5</button>
        </div>
      </div>

      <div class="stat-upgrade-row" data-stat="stamina">
        <div class="stat-info">
          <span>⚡ Stm:</span>
          <span class="side-stat-pill" style="padding-right: 8px;" id="sidebar-stamina-alloc">0000</span>
        </div>
        <div class="upgrade-controls">
          <button class="upgrade-btn" draggable="false">+1</button>
          <button class="upgrade-btn" draggable="false">+5</button>
        </div>
      </div>
    `;

      // BLACKSMITH → Artisans Guild section (3 links)
      const artisansSectionHTML = `
      <div style="margin-left: 15px; padding: 6px; background: rgba(30, 30, 46, 0.5); border-radius: 4px; border-left: 2px solid #e59f5a;">
        <a style="text-decoration: none; color:white;" href="/blacksmith.php">
          <span class="side-icon">⚒️</span>
          <span class="side-label">Blacksmith</span>
        </a>
      </div>
      <div style="margin-left: 15px; margin-top:6px; padding: 6px; background: rgba(30, 30, 46, 0.5); border-radius: 4px; border-left: 2px solid #e59f5a;">
        <a style="text-decoration: none; color:white;" href="/legendary_forge.php">
          <span class="side-icon">🔥</span>
          <span class="side-label">Legendary Forge</span>
        </a>
      </div>
      <div style="margin-left: 15px; margin-top:6px; padding: 6px; background: rgba(30, 30, 46, 0.5); border-radius: 4px; border-left: 2px solid #e59f5a;">
        <a style="text-decoration: none; color:white;" href="/legendary_decraft.php">
          <span class="side-icon">🪓</span>
          <span class="side-label">Decraft Altar</span>
        </a>
      </div>
    `;


      // ------------------------------
      // 6) Wrap anchors FIRST so sections are adjacent to wrappers
      // ------------------------------
      const sharedStyle = {
          width: '156px',
          borderRadius: '10px 0 0 10px',
      };

      function wrapWithExpandButton(anchor) {
          if (!anchor) return;
          Object.assign(anchor.style, sharedStyle);
          if (anchor.parentElement?.classList?.contains('side-nav-flex')) return;

          const wrapper = document.createElement('div');
          wrapper.className = 'side-nav-flex';
          anchor.replaceWith(wrapper);
          wrapper.appendChild(anchor);
          wrapper.appendChild(createExpandBtn());

          Object.assign(wrapper.style, {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
          });
      }

      [
          '/guild_dash.php',
          '/game_dash.php',
          '/stats.php',
          '/battle_pass.php',
          '/adventurers_guild.php',
          '/pvp.php',
          '/merchant.php',
          '/blacksmith.php', // keep real href for order/disable, but we will block navigation
      ]
          .filter(href => !hiddenSet.has(href))
          .forEach(href => {
          wrapWithExpandButton(nav.querySelector(`.side-nav-item[href="${href}"]`));
      });

      // ------------------------------
      // 6.1) Rebrand Blacksmith → "Artisans Guild" but KEEP href
      //      and BLOCK navigation; make header toggle the submenu.
      // ------------------------------
      (function rebrandBlacksmithAsHeader() {
          if (hiddenSet.has('/blacksmith.php')) return;
          const smithItem = nav.querySelector('.side-nav-item[href="/blacksmith.php"]');
          if (!smithItem) return;

          // Rename label
          const labelSpan = smithItem.querySelector('.side-label');
          if (labelSpan) {
              labelSpan.textContent = 'Artisans Guild';
          } else {
              smithItem.textContent = 'Artisans Guild';
          }

          // Make it look/behave like a group header (but keep href for ordering)
          smithItem.setAttribute('role', 'button');
          smithItem.setAttribute('aria-haspopup', 'true');
          smithItem.setAttribute('tabindex', '0');
          smithItem.style.cursor = 'pointer';

          // Toggle adjacent section (just like + button), block navigation
          const wrapper = smithItem.closest('.side-nav-flex');
          const section = wrapper?.nextElementSibling;

          function toggleSection() {
              if (!section || !section.classList.contains('upgrade-section')) return;
              const btn = wrapper.querySelector('.expand-btn');
              const willExpand = !section.classList.contains('expanded');
              section.classList.toggle('expanded', willExpand);
              if (btn) {
                  btn.textContent = willExpand ? '-' : '+';
                  btn.setAttribute('aria-expanded', String(willExpand));
              }
          }

          // Idempotent wiring
          if (smithItem.dataset.wired !== '1') {
              smithItem.addEventListener('click', (e) => {
                  e.preventDefault();   // <-- BLOCK NAVIGATION
                  e.stopPropagation();
                  toggleSection();
              });
              smithItem.addEventListener('keydown', (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault(); // <-- BLOCK NAVIGATION
                      toggleSection();
                  }
              });
              smithItem.dataset.wired = '1';
          }
      })();

      // ------------------------------
      // 7) Place sections AFTER wrappers so expand buttons work
      // ------------------------------
      const placements = [
          { id: 'game-expanded',         className: 'upgrade-section', html: gameSectionHTML,     anchorHref: '/game_dash.php',         where: 'after' },
          { id: 'guild-expanded',        className: 'upgrade-section', html: guildSectionHTML,    anchorHref: '/guild_dash.php',        where: 'after' },
          { id: 'battle-pass-expanded',  className: 'upgrade-section', html: '',                  anchorHref: '/battle_pass.php',       where: 'after' },
          { id: 'quest-expanded',        className: 'upgrade-section', html: '',                  anchorHref: '/adventurers_guild.php', where: 'after' },
          { id: 'stats-expanded',        className: 'upgrade-section', html: statsSectionHTML,    anchorHref: '/stats.php',             where: 'after' },
          { id: 'pvp-expanded',          className: 'upgrade-section', html: pvpSectionHTML,      anchorHref: '/pvp.php',               where: 'after' },
          { id: 'merchant-expanded',     className: 'upgrade-section', html: merchantSectionHTML, anchorHref: '/merchant.php',          where: 'after' },
          { id: 'blacksmith-expanded',   className: 'upgrade-section', html: artisansSectionHTML, anchorHref: '/blacksmith.php',        where: 'after' },
      ];

      placements.forEach(p => {
          if (hiddenSet.has(p.anchorHref)) return;
          const el = ensureSection(p.id, p.className, p.html);
          placeRelativeTo(p.anchorHref, el, p.where);
      });

      // ------------------------------
      // 8) Stats pill in Stats link (unchanged)
      // ------------------------------
      if (!hiddenSet.has('/stats.php')) {
          const statsItem = nav.querySelector('.side-nav-item[href="/stats.php"]');
          if (statsItem && !document.getElementById('stats-menu-text')) {
              const statsMenuText = document.createElement('span');
              statsMenuText.id = 'stats-menu-text';
              statsMenuText.innerHTML = `
          <span class="side-stat-pill" id="sidebar-points">-</span> 🔵
        `;
          statsItem.appendChild(statsMenuText);
      }
    }

      // ------------------------------
      // 9) Settings launcher (unchanged, idempotent)
      // ------------------------------
      let settingsLink = document.getElementById('nav-order-btn');
      if (!settingsLink) {
          settingsLink = document.createElement('a');
          settingsLink.id = 'nav-order-btn';
          settingsLink.className = 'side-nav-settings';
          settingsLink.setAttribute('role', 'button');
          settingsLink.setAttribute('aria-label', 'Customize Sidebar Navigation');
          settingsLink.textContent = '⚙️ Sidebar Settings';
          settingsLink.href = '#';

          settingsLink.addEventListener('click', (e) => {
              e.preventDefault();
              const panel = document.getElementById('nav-order-panel');
              if (!panel) {
                  console.warn('Panel not found — did you call initOrderPanel()?');
                  return;
              }
              if (panel.classList.contains('open')) {
                  closeOrderPanel();
              } else {
                  openOrderPanel();
              }
          });
      }
      nav.appendChild(settingsLink);

      // Wire the order UI once (guarded by your init function)
      initNavOrderUI({
          onSave: (prefs) => {
              modifySideNav();
              console.log('Saved nav prefs:', prefs);
          },
          onReset: (prefs) => {
              modifySideNav();
              console.log('Reset nav prefs:', prefs);
          }
      });

      if (!document.getElementById('nav-order-panel')) {
          initOrderPanel();
      }
  } finally {
      // release rebuild lock
      nav.dataset.rebuilding = '';
  }


    // ------------------------------
// 10) Weekly ranking → inject into small-user meta
// ------------------------------
(function initWeeklyRankingInjection() {
  const CACHE_KEY = 'weekly_rank_summary_v1';
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Try to get cached { rankText, damageText } from sessionStorage
   */
  function getCachedWeekly() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || !obj.ts) return null;
      if (Date.now() - obj.ts > CACHE_TTL_MS) return null;
      return obj.data || null;
    } catch {
      return null;
    }
  }

  /**
   * Put { rankText, damageText } in cache
   */
  function setCachedWeekly(data) {
    try {
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ ts: Date.now(), data })
      );
    } catch {}
  }

  /**
   * Fetch /weekly.php and parse the two spans under #quick-rank-display:
   *  - First span → rankText (e.g., "#59")
   *  - Second span → damageText (e.g., "408,177,650,902 damage")
   */
  async function fetchWeeklySummary() {
    const cached = getCachedWeekly();
    if (cached) return cached;

    const resp = await fetch('/weekly.php', { credentials: 'same-origin' });
    if (!resp.ok) throw new Error(`weekly.php HTTP ${resp.status}`);
    const html = await resp.text();

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const anchor = doc.querySelector('#quick-rank-display');
    if (!anchor) throw new Error('quick-rank-display not found');

    // Find the two spans inside the ranking row. Be defensive in selection
    const spanCandidates = anchor.querySelectorAll('span');
    if (!spanCandidates || spanCandidates.length === 0) {
      throw new Error('No spans found under quick-rank-display');
    }

    // Rank = first span that looks like "#<number>"
    let rankText = null;
    let rankSpanIndex = -1;
    for (let i = 0; i < spanCandidates.length; i++) {
      const t = (spanCandidates[i].textContent || '').trim();
      if (/^#\d+$/i.test(t)) {
        rankText = t;
        rankSpanIndex = i;
        break;
      }
    }
    // Damage = next span after rank, or fallback to any span containing 'damage'
    let damageText = null;
    if (rankSpanIndex >= 0 && spanCandidates[rankSpanIndex + 1]) {
      damageText = (spanCandidates[rankSpanIndex + 1].textContent || '').trim();
    }
    if (!damageText) {
      for (const sp of spanCandidates) {
        const t = (sp.textContent || '').trim();
        if (/damage/i.test(t)) {
          damageText = t;
          break;
        }
      }
    }

    // Normalize damage text (remove leading bullets)
    if (damageText) {
      damageText = damageText.replace(/^[•\s]+/, '').trim();
    }

    const data = { rankText, damageText };
    setCachedWeekly(data);
    return data;
  }

  /**
   * Update the small card:
   *  - Append "Ranking #XX" to .small-level (idempotent / replace if exists)
   *  - Insert/update a sibling div under it with the damage text
   */
  function updateSmallUserMeta({ rankText, damageText }) {
    const levelEl = document.querySelector('.small-user .small-user-meta .small-level');
    if (!levelEl) return; // nothing to do

    // Remove any previous " Ranking #NNN" suffix to keep idempotent
    const prev = (levelEl.textContent || '').replace(/\s*Ranking\s*#\d+\s*$/i, '').trim();

    if (rankText) {
      levelEl.textContent = `${prev} Ranking ${rankText}`;
    } else {
      levelEl.textContent = prev; // no rank available
    }

    // Upsert damage line just under .small-level
    const parent = levelEl.parentElement;
    if (!parent) return;

    let dmgEl = parent.querySelector('#weekly-damage');
    const damageString = damageText || ''; // e.g. "408,177,650,902 damage"

    if (!dmgEl) {
      dmgEl = document.createElement('div');
      dmgEl.id = 'weekly-damage';
      // optional: subtle styling; tweak as you like
      dmgEl.style.fontSize = '11px';
      dmgEl.style.color = '#89b4fa';
      dmgEl.style.marginTop = '2px';
      levelEl.insertAdjacentElement('afterend', dmgEl);
    }
    dmgEl.textContent = damageString;
  }

  // Kick it off (fire-and-forget so modifySideNav doesn't need to be async)
  fetchWeeklySummary()
    .then(updateSmallUserMeta)
    .catch((err) => {
      // Non-fatal; keep sidebar working even if weekly fails
      console.warn('[weekly] Unable to inject weekly rank:', err);
    });
})();

    // keep your existing bootstraps
    initSidebarQuestWidget();
    initAdventurersGuildQuests();
    initStatAllocationButtons();
}


function modBlacksmith() {
    if (window.location.href.includes('blacksmith.php')) {

        const topbar = document.querySelector('.topbar');
        const recipeGrid = document.querySelector('.recipe-grid');
        if (!topbar || !recipeGrid) return;

        const names = Array.from(recipeGrid.querySelectorAll('.result-name'))
        .map(el => el.textContent.trim())
        .filter(Boolean);

        // Updated logic for extracting set name
        const firstWordOf = (raw) => {
            const cleaned = raw.replace(/^\[[^\]]*]\s*/, ''); // remove leading [TAG]
            const beforeComma = cleaned.split(',')[0].trim(); // take part before comma

            // Special case: Ring of the Eternal Harvest
            if (/^Ring of the Eternal Harvest$/i.test(beforeComma)) {
                return 'Ring of the Eternal Harvest'; // keep full name
            }

            // Special case: Fangbinder Amulet → Emerald
            if (/^Fangbinder Amulet$/i.test(beforeComma)) {
                return 'Emerald';
            }

            const m = beforeComma.match(/^\S+/); // first non-space sequence
            return m ? m[0] : '';
        };

        const setGear = new Set(names.map(firstWordOf).filter(Boolean));

        // ---- Create group container ----
        const group = document.createElement('div');
        group.className = 'gear-dropdown-group';
        group.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 8px;
    `;

      // Label
      const label = document.createElement('label');
      const select = document.createElement('select');
      const selectId = 'gear-dropdown';
      label.htmlFor = selectId;
      label.textContent = 'Forging Sets';
      label.style.cssText = `
      color: rgb(255, 255, 255);
      font-size: 16px;
      font-family: inherit;
    `;

      // Dropdown styling
      select.id = selectId;
      select.className = 'gear-dropdown';
      select.title = 'Filter gear by first word';
      select.setAttribute('aria-label', 'Filter gear');
      select.style.cssText = `
      padding: 8px 12px;
      background: rgb(51, 51, 51);
      border: 1px solid rgb(51,51,51);
      border-radius: 8px;
      color: rgb(255, 255, 255);
      font-size: 16px;
      font-family: inherit;
      cursor: pointer;
      min-width: 180px;
      box-shadow: rgba(0, 0, 0, 0.6) 0px 6px 18px;
    `;

      // "All gear" option
      const allOption = document.createElement('option');
      allOption.value = '';
      allOption.textContent = 'All gear';
      select.appendChild(allOption);

      // Add options with rules applied
      for (const val of Array.from(setGear).sort((a, b) => a.localeCompare(b))) {
          const opt = document.createElement('option');
          opt.value = val;

          // Apply naming rules
          if (val === 'Ring of the Eternal Harvest') {
              opt.textContent = val; // keep full name, no "set"
          } else {
              opt.textContent = `${val} set`; // add "set"
          }

          select.appendChild(opt);
      }

      group.appendChild(label);
      group.appendChild(select);
      topbar.insertBefore(group, topbar.children[1] || null);

      // ---- Filtering behavior ----
      const cards = Array.from(recipeGrid.querySelectorAll('.card'));

      const applyFilter = (value) => {
          cards.forEach(card => {
              const nameEl = card.querySelector('.result-name');
              const name = nameEl ? nameEl.textContent.trim() : '';
              const shouldShow = !value || new RegExp(`\\b${value}\\b`, 'i').test(name);
              card.style.display = shouldShow ? '' : 'none';
          });
      };

      select.addEventListener('change', () => {
          let filterValue = select.value;

          // If Fangbinder Amulet is part of Emerald set, filter by Emerald
          if (filterValue === 'Emerald') {
              filterValue = 'Fangbinder Amulet|Emerald'; // match either
          }

          applyFilter(filterValue);
      });

      applyFilter('');
  }
};

function modForge() {
    if (window.location.href.includes('legendary_forge.php')) {

        const topbar = document.querySelector('.topbar');
        const recipeGrid = document.querySelector('.grid');
        if (!topbar || !recipeGrid) return;

        const names = Array.from(recipeGrid.querySelectorAll('.name'))
        .map(el => el.textContent.trim())
        .filter(Boolean);

        // Updated logic for extracting set name
        const firstWordOf = (raw) => {
            const cleaned = raw.replace(/^\[[^\]]*]\s*/, ''); // remove leading [TAG]
            const beforeComma = cleaned.split(',')[0].trim(); // take part before comma

            // Special case: Ring of the Eternal Harvest
            if (/^Ring of the Eternal Harvest$/i.test(beforeComma)) {
                return 'Ring of the Eternal Harvest'; // keep full name
            }

            const m = beforeComma.match(/^\S+/); // first non-space sequence
            return m ? m[0] : '';
        };

        const setGear = new Set(names.map(firstWordOf).filter(Boolean));

        // ---- Create group container ----
        const group = document.createElement('div');
        group.className = 'gear-dropdown-group';
        group.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 8px;
    `;

      // Label
      const label = document.createElement('label');
      const select = document.createElement('select');
      const selectId = 'gear-dropdown';
      label.htmlFor = selectId;
      label.textContent = 'Forging Sets';
      label.style.cssText = `
      color: rgb(255, 255, 255);
      font-size: 16px;
      font-family: inherit;
    `;

      // Dropdown styling
      select.id = selectId;
      select.className = 'gear-dropdown';
      select.title = 'Filter gear by first word';
      select.setAttribute('aria-label', 'Filter gear');
      select.style.cssText = `
      padding: 8px 12px;
      background: rgb(51, 51, 51);
      border: 1px solid rgb(51,51,51);
      border-radius: 8px;
      color: rgb(255, 255, 255);
      font-size: 16px;
      font-family: inherit;
      cursor: pointer;
      min-width: 180px;
      box-shadow: rgba(0, 0, 0, 0.6) 0px 6px 18px;
    `;

      // "All gear" option
      const allOption = document.createElement('option');
      allOption.value = '';
      allOption.textContent = 'All gear';
      select.appendChild(allOption);

      // Add options with rules applied
      for (const val of Array.from(setGear).sort((a, b) => a.localeCompare(b))) {
          const opt = document.createElement('option');
          opt.value = val;

          // Apply naming rules
          if (val === 'Ring of the Eternal Harvest') {
              opt.textContent = val; // keep full name, no "set"
          } else {
              opt.textContent = `${val} set`; // add "set"
          }

          select.appendChild(opt);
      }

      group.appendChild(label);
      group.appendChild(select);
      topbar.insertBefore(group, topbar.children[1] || null);

      // ---- Filtering behavior ----
      const cards = Array.from(recipeGrid.querySelectorAll('.cardWrap'));

      const applyFilter = (value) => {
          cards.forEach(card => {
              const nameEl = card.querySelector('.name');
              const name = nameEl ? nameEl.textContent.trim() : '';
              const shouldShow = !value || new RegExp(`\\b${value}\\b`, 'i').test(name);
              card.style.display = shouldShow ? '' : 'none';
          });
      };

      select.addEventListener('change', () => {
          let filterValue = select.value;


          applyFilter(filterValue);
      });

      applyFilter('');
  }
};

//monstercards and loot section

////insta join via picture click
(function () {
  'use strict';

  const JOIN_ENDPOINT = '/user_join_battle.php';

  // ----------------------------
  // Helpers
  // ----------------------------
  function getMonsterIdFromCard(card) {
    return card.getAttribute('data-monster-id') || card.dataset.monsterId || null;
  }

  function removeSelectSpan(card) {
    const span = card.querySelector('label.pickWrap span');
    if (span) span.remove(); // or: span.textContent = '';
  }

  function isMobAlreadyJoined(card) {
    if (card?.dataset?.joined !== undefined) return card.dataset.joined === "1";
    try {
      for (const pill of card.querySelectorAll(".pill")) {
        const text = (pill.textContent || "").trim().toLowerCase();
        if (text === "joined") return true;
      }
      for (const el of card.querySelectorAll("a, button")) {
        const txt = (el.textContent || "").trim();
        if (/continue\s+the\s+battle|\bcontinue\b|\bjoined\b/i.test(txt)) return true;
      }
    } catch {}
    return false;
  }

  /**
   * Try hard to find the logged-in user's ID on the page.
   * Add/adjust selectors here if your site stores it somewhere specific.
   */
  function getUserId() {
    // 1) Common globals
    try {
      const uw = (typeof unsafeWindow !== "undefined") ? unsafeWindow : window;

      // common names
      const candidates = [
        uw.user_id, uw.userId, uw.userid,
        window.user_id, window.userId, window.userid
      ].filter(v => v !== undefined && v !== null);

      for (const v of candidates) {
        const n = String(v).trim();
        if (/^\d+$/.test(n)) return n;
      }
    } catch {}

    // 2) Common DOM locations (hidden inputs, data attributes)
    const selectors = [
      'input[name="user_id"]',
      'input#user_id',
      '[data-user-id]',
      'meta[name="user_id"]',
      'meta[name="user-id"]'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (!el) continue;

      let val = null;
      if (el.tagName === 'META') val = el.getAttribute('content');
      else if (el instanceof HTMLInputElement) val = el.value;
      else val = el.getAttribute('data-user-id');

      val = (val || '').trim();
      if (/^\d+$/.test(val)) return val;
    }

    // 3) As a last resort, try to pull from page text (optional, conservative)
    // If your page exposes it in JS like: "user_id = 12345"
    try {
      const html = document.documentElement.innerHTML;
      const m = html.match(/\buser_id\b\s*[:=]\s*["']?(\d{1,20})["']?/i);
      if (m && m[1]) return m[1];
    } catch {}

    return null;
  }

  async function postJoin(monsterId, userId) {
    const body = new URLSearchParams();
    body.set('monster_id', String(monsterId));
    body.set('user_id', String(userId));

    const res = await fetch(JOIN_ENDPOINT, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: body.toString()
    });

    const raw = await res.text();

    // Try JSON parse
    let json = null;
    try { json = JSON.parse(raw); } catch {}

    // Determine success
    const t = (raw || '').toLowerCase();
    const okByJson =
      json && (json.success === true || json.status === "success" || json.ok === true);

    const alreadyByJson =
      json && (json.already === true || json.already_joined === true);

    const okByText =
      t.includes('success') ||
      t.includes('successfully') ||
      t.includes('you have joined') ||
      (t.includes('joined') && !t.includes('not joined'));

    const alreadyByText =
      t.includes('already') && (t.includes('joined') || t.includes('in battle') || t.includes('in the battle'));

    const invalidByText =
      t.includes('invalid') || t.includes('error') || t.includes('failed');

    const ok = res.ok && (okByJson || okByText || alreadyByJson || alreadyByText) && !invalidByText;
    const already = alreadyByJson || alreadyByText;

    return { ok, already, raw, json, status: res.status };
  }

  function bindImage(card) {
    const img = card.querySelector('img.monster-img');
    if (!img || img.dataset.tmBound) return;

    const monsterId = getMonsterIdFromCard(card);
    if (!monsterId) return;

    img.dataset.tmBound = '1';
    img.style.cursor = 'pointer';
    img.title = 'Click to join';

    img.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // If already joined, just go to battle page
      if (isMobAlreadyJoined(card)) {
        location.assign(`battle.php?id=${encodeURIComponent(monsterId)}`);
        return;
      }

      // Optional: skip dead monsters if your markup uses data-dead="1"
      if (card.dataset?.dead === "1") return;

      const userId = getUserId();
      if (!userId) {
        alert("Could not find user_id on this page. Tell me where it appears (global var, hidden input, meta tag, etc.) and I’ll hook it.");
        return;
      }

      const prevOpacity = img.style.opacity;
      img.style.opacity = '0.6';

      try {
        const result = await postJoin(monsterId, userId);

        if (!result.ok) {
          console.log('[TM join failed]', result);
          alert('Join failed (server rejected). Check console for response.');
          img.style.opacity = prevOpacity;
          return;
        }

        // Join OK (or already joined) -> go to battle page
        location.assign(`battle.php?id=${encodeURIComponent(monsterId)}`);
      } catch (err) {
        console.error('[TM join error]', err);
        img.style.opacity = prevOpacity;
        alert('Join request errored. See console.');
      }
    });
  }

  function processCard(card) {
    removeSelectSpan(card);
    bindImage(card);
  }

  // Process current cards
  document.querySelectorAll('.monster-card').forEach(processCard);

  // Process dynamically added cards
  const obs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches('.monster-card')) processCard(node);
        node.querySelectorAll?.('.monster-card')?.forEach(processCard);
      }
    }
  });

  obs.observe(document.documentElement, { childList: true, subtree: true });
})();

////reduce cards size
(function () {
  'use strict';

  if (!location.pathname.includes('/active_wave.php')) return;

      const style = document.createElement('style');
    style.textContent = `
    .monster-card{width:150px;}
    h3{margin:0;}
    .stat-value{font-size: 10px;}
    .monster-stats {
      position: relative;
    }

    .toggle-stats {
      width: 100%;
      background: none;
      border: none;
      color: #ccc;
      font-size: 12px;
      cursor: pointer;
      padding: 4px 0;
      margin-bottom: 4px;
    }

    .monster-stats.collapsed .stat-row {
      display: none;
      height: 30px;
    }
  `;
    document.head.appendChild(style);

function addCollapseButtons() {
  document.querySelectorAll('.monster-stats:not([data-collapse-ready])')
    .forEach(stats => {
      const card = stats.closest('.monster-card');

      // 🚫 Skip dead monsters
      if (card && card.dataset.dead === '1') return;

      stats.setAttribute('data-collapse-ready', '1');
      stats.classList.add('collapsed');

      const btn = document.createElement('button');
      btn.className = 'toggle-stats';
      btn.type = 'button';
      btn.textContent = '▶ Stats';

      stats.prepend(btn);
    });
}


    document.addEventListener('click', e => {
    const btn = e.target.closest('.toggle-stats');
    if (!btn) return;

    const stats = btn.closest('.monster-stats');
    stats.classList.toggle('collapsed');

    btn.textContent = stats.classList.contains('collapsed')
      ? '▶ Stats'
      : '▼ Stats';
  });

  const observer = new MutationObserver(addCollapseButtons);
  observer.observe(document.body, { childList: true, subtree: true });

  addCollapseButtons();
})();

////autoloot
const LOOT_PLAN_EXCLUDE_TAGS = new Set([
    'general',
    'baron',
    'drakzareth',
    'oceanus',
    'poseidon',
    ]);

function isElementDisplayNone(el) {
  // Walk up the DOM tree; if any ancestor is display:none, it's effectively hidden
  for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
    const style = window.getComputedStyle(node);
    if (style.display === 'none') return true;
  }
  return false;
}

function isExcludedFromLootPlan(card) {
  if (!card) return false;

  // NEW: exclude hidden cards (display:none)
  if (isElementDisplayNone(card)) return true;

  const rawName = card.dataset.name;
  if (!rawName) return false;

  const name = rawName.toLowerCase();

  for (const tag of LOOT_PLAN_EXCLUDE_TAGS) {
    if (name.includes(tag)) return true;
  }
  return false;
}


function modMonsterCards(){
    const cards = document.querySelectorAll('.monster-card[data-dead="1"][data-monster-id]');

    // Robust numeric parser (handles commas, spaces, decimal comma, zero-width, units)
    const parseNumeric = (t) => {
        if (t == null) return NaN;
        const normalized = String(t)
        .replace(/[\u00A0\u2007\u202F]/g, ' ')
        .replace(/[\u200B-\u200D\uFEFF]/g, '');
        const m = normalized.match(/[-+]?\d[\d.,]*(?:[eE][-+]?\d+)?/);
        if (!m) return NaN;
        let token = m[0].trim();
        const hasComma = token.includes(',');
        const hasDot = token.includes('.');
        if (hasComma && hasDot) {
            token = token.replace(/,/g, ''); // "1,234.56"
        } else if (hasComma && !hasDot) {
            const commaCount = (token.match(/,/g) || []).length;
            token = (commaCount === 1) ? token.replace(',', '.') : token.replace(/,/g, '');
        }
        token = token.replace(/\s+/g, '');
        const n = Number.parseFloat(token);
        return Number.isFinite(n) ? n : NaN;
    };

    // Format integers with thousands separators
    const formatInt = (n) => {
        if (!Number.isFinite(n)) return '';
        const s = Math.trunc(n).toString();
        return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    // Helper: normalize label text
    const norm = (s) => (s || '')
    .replace(/[\u00A0\u2007\u202F]/g, ' ')
    .trim()
    .toLowerCase();

    // --- Read level from local DOM (NO FETCH) ---
    const lvlText = document.querySelector('.gtb-level')?.textContent || ''; // e.g., "LV 1054"
    const lvlVal = parseNumeric(lvlText); // → 1054

    cards.forEach(async (card) => {
        const mId = card.dataset.monsterId;
        if (!mId) return;

        try {
            const res = await fetch(`/battle.php?id=${encodeURIComponent(mId)}`, {
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error(`Fetch failed for mId=${mId} (HTTP ${res.status})`);
            const html = await res.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // 1) Damage done
            const damageText = doc.querySelector('#yourDamageValue')?.textContent?.trim() || '';
            const damageVal = parseNumeric(damageText);

            // 2) EXP / DMG: Use the 3rd .stat-block in the 2nd .stat-line
            let expPerDmgText = '';
            (function getExpPerDmgFromSecondLine() {
                const lines = doc.querySelectorAll('.stat-line');
                const secondLine = lines[1]; // zero-based: this is the 2nd .stat-line
                if (!secondLine) return;

                const blocks = secondLine.querySelectorAll('.stat-block');
                const thirdBlock = blocks[2]; // zero-based: this is the 3rd .stat-block

                // Prefer the 3rd block if its label is "EXP / DMG"
                if (thirdBlock) {
                    const labelEl = thirdBlock.querySelector('.label, span.label');
                    if (norm(labelEl?.textContent) === 'exp / dmg') {
                        expPerDmgText = thirdBlock.querySelector('strong')?.textContent?.trim() || '';
                    }
                }

                // Fallback: scan the second line for any block labeled "EXP / DMG"
                if (!expPerDmgText && blocks.length) {
                    for (const b of blocks) {
                        const lbl = b.querySelector('.label, span.label');
                        if (norm(lbl?.textContent) === 'exp / dmg') {
                            expPerDmgText = b.querySelector('strong')?.textContent?.trim() || '';
                            if (expPerDmgText) break;
                        }
                    }
                }
            })();

            const expPerDmgVal = parseNumeric(expPerDmgText);

            // 3) Base EXP gained
            const expGainedRaw = (Number.isFinite(damageVal) && Number.isFinite(expPerDmgVal))
            ? (damageVal * expPerDmgVal)
            : NaN;

            // 4) Conditional adjustment based on URL wave and level from .gtb-level (NO fetch for level)
            const href = window.location.href;
            let multiplier = 1;
            if (href.includes('wave=3') && Number.isFinite(lvlVal) && lvlVal > 200) {
                multiplier = 0.75;
            } else if (href.includes('wave=5') && Number.isFinite(lvlVal) && lvlVal > 1000) {
                multiplier = 0.75;
            } else if (href.includes('wave=8') && Number.isFinite(lvlVal) && lvlVal > 3500) {
                multiplier = 0.50;
            }

            const adjustedExp = Number.isFinite(expGainedRaw) ? expGainedRaw * multiplier : NaN;

            // 5) Round UP (ceil) and show without decimals
            const finalExpCeil = Number.isFinite(adjustedExp) ? Math.ceil(adjustedExp) : NaN;

            // --- Update DOM ---

            // A) HP row → "damage done" and damage text (original formatting)
            const hpIcon = card.querySelector('.stat-row .stat-icon.hp');
            const hpRow = hpIcon ? hpIcon.closest('.stat-row') : null;
            if (hpRow) {
                const labelEl = hpRow.querySelector('.stat-label');
                const valueEl = hpRow.querySelector('.stat-value');
                if (labelEl) labelEl.textContent = 'damage done';
                if (valueEl && damageText) valueEl.textContent = damageText;
                const hpFill = card.querySelector('.hp-bar .hp-fill');
                if (hpFill) hpFill.style.width = '0%';
            }

            // B) Second .stat-main (ATK/DEF row) → convert to structured format like others
            const statRows = card.querySelectorAll('.stat-row');
            const atkDefRow = statRows[1]; // 0: HP, 1: ATK/DEF, 2: Players Joined
            if (atkDefRow) {
                const secondMain = atkDefRow.querySelector('.stat-main');
                if (secondMain) {
                    const valueToShow = expPerDmgText || (Number.isFinite(expPerDmgVal) ? String(expPerDmgVal) : '');
                    // Rebuild the content to match the standard structure:
                    secondMain.innerHTML = `
            <div class="stat-label">EXP /DMG</div>
            <div class="stat-value">${valueToShow || '—'}</div>
          `;
        }
      }

        // C) Third .stat-main (Players Joined row) → "EXP Gained" with conditional adjustment and ceil
        const joinedRow = statRows[2];
        if (joinedRow) {
            const labelEl = joinedRow.querySelector('.stat-label');
            const valueEl = joinedRow.querySelector('.stat-value');
            if (labelEl) labelEl.textContent = 'EXP Gained';
            if (valueEl) {
                const showExp = Number.isFinite(finalExpCeil) ? formatInt(finalExpCeil) : '—';
                // Keep chip styling if you prefer:
                // valueEl.innerHTML = `<span class="mini-chip party-chip">${showExp}</span>`;
                valueEl.textContent = showExp;
            }
        }

    } catch (err) {
        console.error('Failed to update monster card', { mId, err });
    }
  });
}

/* =========================================================
   EXP PLAN MODULE (Clean Slate)
   - Builds monsterExpMap/list from slain monster cards
   - Calculates EXP needed from .gtb-exp-top
   - Selects monsters until total > needed
   - Shows plan + highlights cards + total EXP
   - Inserts buttons next to #btnLootX
   - Loots ONLY planned monsters via hidden iframe click on #loot-button
   ========================================================= */

/* =========================================================
   LOOT SUMMARY MODULE (Direct loot.php + modal)
   - Can loot a list of monsterIds
   - Tracks items/gold/exp/mobs/zeroExp
   ========================================================= */
(function LOOT_SUMMARY_MODULE() {
  'use strict';
if (window.__VV_LOOT_LOADED__) { console.warn("VV_LOOT loaded twice"); return; }
window.__VV_LOOT_LOADED__ = true;

  // Tier colors (same idea as your bot)
  const ITEM_TIER_COLORS = {
    COMMON: '#7f8c8d',
    UNCOMMON: '#2ecc71',
    RARE: '#9b59b6',
    EPIC: '#e67e22',
    LEGENDARY: '#f1c40f'
  };
  const DEFAULT_TIER_COLOR = "#ffffff";

  // Global-ish state so EXP plan module can call it
  window.VV_LOOT = window.VV_LOOT || {};

  const gdLootSummary = {
    items: {}, // ITEM_ID -> { name, image, tier, count }
    exp: 0,
    gold: 0,
    mobs: 0,
    zeroMobs: 0,
    failed: 0
  };


    function addLootItem(item) {
  const id = String(item.ITEM_ID ?? '').trim();
  if (!id) return;

  if (!gdLootSummary.items[id]) {
    gdLootSummary.items[id] = {
      name: item.NAME,
      image: item.IMAGE_URL,
      tier: item.TIER,
      count: 0
    };
  }

  // ✅ always increment (whether it was new or existing)
  gdLootSummary.items[id].count += 1;
}

    function resetLootSummary() {
    gdLootSummary.items = {};
    gdLootSummary.exp = 0;
    gdLootSummary.gold = 0;
    gdLootSummary.mobs = 0;
    gdLootSummary.zeroMobs = 0;
    gdLootSummary.failed = 0;
  }

  function showLootSummaryModal() {
    document.getElementById('vv-loot-modal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'vv-loot-modal';
    modal.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,0.6);
      z-index:100000;display:flex;align-items:center;justify-content:center;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      background:#2a2a3d;border-radius:12px;padding:20px;
      max-width:92%;width:440px;text-align:center;color:white;
      overflow-y:auto;overflow-x:hidden;max-height:82%;
      box-shadow:0 10px 40px rgba(0,0,0,.45);
      font-family:Arial,sans-serif;
    `;

    box.innerHTML = `
      <h2 style="margin:0 0 12px 0;">🎁 Loot Gained</h2>

      <div id="vv-loot-progress" style="font-size:12px;color:#c7c7d8;margin-bottom:10px;">
        Initializing...
      </div>

      <div id="vv-loot-items"
           style="display:grid;grid-template-columns:repeat(auto-fill,96px);
                  gap:12px;justify-content:center;">
      </div>

      <div style="margin-top:10px;font-weight:bold;font-size:13px;line-height:1.5;">
        🧟 Successful Mobs: <b id="vv-loot-mobs">0</b><br>
        🧟 Zero EXP Mobs: <b id="vv-loot-zero">0</b><br>
        ❌ Failed: <b id="vv-loot-failed">0</b><br>
        💠 EXP: <span id="vv-loot-exp">0</span>
        &nbsp;&nbsp;💰 Gold: <span id="vv-loot-gold">0</span>
      </div>

      <button id="vv-loot-close" class="btn"
              style="margin-top:12px;padding:8px 14px;border-radius:8px;
                     background-color:#444;color:white;border:none;
                     cursor:pointer;font-weight:bold;">
        Close
      </button>
    `;

    modal.appendChild(box);
    document.body.appendChild(modal);

    document.getElementById('vv-loot-close').onclick = () => modal.remove();
  }

    function upsertItemSlot(itemsWrap, item) {
  const itemId = String(item.ITEM_ID ?? "").trim();
  if (!itemId) return;

  const rec = gdLootSummary.items[itemId];
  const currentCount = rec?.count ?? 0;
  const color = ITEM_TIER_COLORS[item.TIER] || DEFAULT_TIER_COLOR;

  // Find existing slot
  let slot = itemsWrap.querySelector(`[data-item-id="${CSS.escape(itemId)}"]`);

  // Create slot if missing
  if (!slot) {
    slot = document.createElement("div");
    slot.dataset.itemId = itemId;
    slot.style.cssText = `
      width:96px;
      display:flex;
      flex-direction:column;
      align-items:center;
      text-align:center;
      font-family:Arial,sans-serif;
      box-sizing:border-box;
    `;

    // Wrapper for image + badge
    const imgWrap = document.createElement("div");
    imgWrap.style.cssText = "position:relative;width:64px;height:64px;";

    const img = document.createElement("img");
    img.src = item.IMAGE_URL;
    img.alt = item.NAME || "";
    img.style.cssText = `
      width:64px;height:64px;border-radius:4px;
      border:2px solid ${color};
      display:block;
    `;

    const badge = document.createElement("span");
    badge.className = "vv-item-count";
    badge.textContent = `x${currentCount}`;
    badge.style.cssText = `
      position:absolute;
      right:-6px;
      bottom:-6px;
      background:rgba(0,0,0,0.75);
      color:white;
      font-size:12px;
      font-weight:bold;
      padding:1px 6px;
      border-radius:6px;
      line-height:1.2;
    `;

    imgWrap.appendChild(img);
    imgWrap.appendChild(badge);

    // Text block
    const textWrap = document.createElement("div");
    textWrap.style.cssText = "margin-top:6px;width:100%;line-height:1.1;";

    const nameDiv = document.createElement("div");
    nameDiv.textContent = item.NAME || "Unknown";
    nameDiv.style.cssText = `
      font-size:13px;font-weight:bold;color:white;
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
    `;

    const tierDiv = document.createElement("div");
    tierDiv.textContent = item.TIER || "";
    tierDiv.style.cssText = `
      font-size:10px;font-weight:bold;
      color:${color};
      margin-top:2px;
    `;

    textWrap.appendChild(nameDiv);
    textWrap.appendChild(tierDiv);

    slot.appendChild(imgWrap);
    slot.appendChild(textWrap);

    itemsWrap.appendChild(slot);
    return;
  }

  // Update existing slot
  const countEl = slot.querySelector(".vv-item-count");
  if (countEl) countEl.textContent = `x${currentCount}`;

  const img = slot.querySelector("img");
  if (img) img.style.borderColor = color;
}


    async function postLootRequest(monster_id) {
    try {
      const res = await fetch("loot.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "monster_id=" + encodeURIComponent(monster_id),
        credentials: "include"
      });

      const raw = await res.text();

      if (res.status === 403) {
        // Captcha / forbidden type page
        return { ok: false, already: false, raw, data: null, status: 403 };
      }

      let data = null;
      try { data = JSON.parse(raw); } catch {}

      const ok = (data?.status === "success") || /success|looted|claimed/i.test(raw);
      const already = /already\s+claimed/i.test(raw);

      return { ok, already, raw, data, status: res.status };
    } catch (err) {
      console.error("Loot request failed:", monster_id, err);
      return { ok: false, already: false, raw: "", data: null, status: 0 };
    }
  }

  function parseExpFromRaw(raw) {
    // Matches "... 12,345 EXP" in plaintext responses
    const m = raw.match(/([0-9][0-9,\.]*)\s*EXP/i);
    return m ? Number(m[1].replace(/[^0-9]/g, "")) : 0;
  }

  // Main public API: loot a list of monster IDs
  async function lootMonsterIds(monsterIds, opts = {}) {
    const {
      concurrency = 5,
      stopAtExp = null, // number | null
      perLootDelayMs = 80
    } = opts;

    resetLootSummary();
    showLootSummaryModal();

    const mobsEl = document.getElementById("vv-loot-mobs");
    const zeroEl = document.getElementById("vv-loot-zero");
    const expEl  = document.getElementById("vv-loot-exp");
    const goldEl = document.getElementById("vv-loot-gold");
    const failEl = document.getElementById("vv-loot-failed");
    const itemsWrap = document.getElementById("vv-loot-items");
    const progEl = document.getElementById("vv-loot-progress");

    const queue = monsterIds.map(String);
    let totalLootedAttempts = 0;

    const updateProgress = () => {
      if (!progEl) return;
      progEl.textContent =
        `Looting... ${totalLootedAttempts} / ${monsterIds.length}` +
        (stopAtExp ? ` | EXP target: ${Math.min(gdLootSummary.exp, stopAtExp).toLocaleString()} / ${stopAtExp.toLocaleString()}` : "");
    };

    updateProgress();

    async function worker() {
      while (queue.length) {
        if (stopAtExp && gdLootSummary.exp >= stopAtExp) return;

        const id = queue.shift();
        if (!id) return;

        totalLootedAttempts++;
        updateProgress();

        const { ok, already, raw, data, status } = await postLootRequest(id);

        if (status === 403) {
          // Stop hard: captcha/forbidden; continuing just hammers
          gdLootSummary.failed++;
          failEl && (failEl.textContent = gdLootSummary.failed.toLocaleString());
          if (progEl) progEl.textContent = "Stopped: 403 Forbidden (captcha/blocked).";
          return;
        }

        if (!(ok || already)) {
          gdLootSummary.failed++;
          failEl && (failEl.textContent = gdLootSummary.failed.toLocaleString());
          await new Promise(r => setTimeout(r, perLootDelayMs));
          continue;
        }

        const expGain = parseExpFromRaw(raw);
        if (expGain > 0) {
          gdLootSummary.mobs++;
          gdLootSummary.exp += expGain;
          mobsEl && (mobsEl.textContent = gdLootSummary.mobs.toLocaleString());
          expEl  && (expEl.textContent  = gdLootSummary.exp.toLocaleString());
        } else {
          gdLootSummary.zeroMobs++;
          zeroEl && (zeroEl.textContent = gdLootSummary.zeroMobs.toLocaleString());
        }

        if (data?.rewards?.gold) {
          gdLootSummary.gold += Number(data.rewards.gold) || 0;
          goldEl && (goldEl.textContent = gdLootSummary.gold.toLocaleString());
        }

        if (Array.isArray(data?.items)) {
          data.items.forEach(item => {
            addLootItem(item);
              const rawId = item.ITEM_ID;
              const id = String(rawId);
              console.log("RAW ID:", rawId, "AS STRING:", JSON.stringify(id), "LEN:", id.length);

            console.log("ITEM", item.ITEM_ID, item.NAME, "COUNT", gdLootSummary.items[String(item.ITEM_ID).trim()].count);
            if (itemsWrap) upsertItemSlot(itemsWrap, item);
          });
        }

        await new Promise(r => setTimeout(r, perLootDelayMs));
      }
    }

    const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
    await Promise.all(workers);

    if (progEl) progEl.textContent = "Done.";
    return { ...gdLootSummary };
  }

  // Expose API
  window.VV_LOOT.lootMonsterIds = lootMonsterIds;

})();

(function EXP_PLAN_MODULE() {
    'use strict';

    // ----------------------------
    // Global stores (minimal)
    // ----------------------------
    window.monsterExpMap = window.monsterExpMap || new Map(); // Map<monsterId, finalExpCeil|null>
    window.monsterExpList = window.monsterExpList || [];      // Array<{monsterId, finalExpCeil:number|null}>

    // Namespace for debugging
    window.VV_EXPPLAN = window.VV_EXPPLAN || {};

    // ----------------------------
    // Utils
    // ----------------------------
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const parseNumeric = (t) => {
        if (t == null) return NaN;
        const normalized = String(t)
        .replace(/[\u00A0\u2007\u202F]/g, ' ')
        .replace(/[\u200B-\u200D\uFEFF]/g, '');
        const m = normalized.match(/[-+]?\d[\d.,]*(?:[eE][-+]?\d+)?/);
        if (!m) return NaN;
        let token = m[0].trim();
        const hasComma = token.includes(',');
        const hasDot = token.includes('.');
        if (hasComma && hasDot) token = token.replace(/,/g, '');      // 1,234.56
        else if (hasComma && !hasDot) {
            const commaCount = (token.match(/,/g) || []).length;
            token = (commaCount === 1) ? token.replace(',', '.') : token.replace(/,/g, '');
        }
        token = token.replace(/\s+/g, '');
        const n = Number.parseFloat(token);
        return Number.isFinite(n) ? n : NaN;
    };

    const formatInt = (n) =>
    Number.isFinite(n)
    ? Math.trunc(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    : '—';

    const norm = (s) => (s || '')
    .replace(/[\u00A0\u2007\u202F]/g, ' ')
    .trim()
    .toLowerCase();

    // ----------------------------
    // EXP Needed from top bar
    // .gtb-exp-top span:last-of-type => "current / max"
    // ----------------------------
    function readExpNeededFromTopBar() {
        const top = document.querySelector('.gtb-exp-top');
        const span = top?.querySelector('span:last-of-type');
        const raw = span?.textContent?.trim() || '';
        const parts = raw.split('/').map(s => s.trim());

        const currentExp = parseNumeric(parts[0]);
        const maxExp = parseNumeric(parts[1]);
        const needed = (Number.isFinite(currentExp) && Number.isFinite(maxExp))
        ? Math.max(0, maxExp - currentExp)
        : NaN;

        return { currentExp, maxExp, needed, raw };
    }

    // ----------------------------
    // Build monsterExpMap/list from dead monster cards
    // IMPORTANT: awaitable (Promise.allSettled)
    // ----------------------------
    async function updateMonsterExpData() {
        const cards = document.querySelectorAll('.monster-card[data-dead="1"][data-monster-id]');
        if (!cards.length) return { ok: true, count: 0 };

        // Read level from DOM (NO FETCH)
        const lvlText = document.querySelector('.gtb-level')?.textContent || '';
        const lvlVal = parseNumeric(lvlText);

        const href = window.location.href;

        const tasks = Array.from(cards).map(async (card) => {
            const mId = card.dataset.monsterId;
            if (!mId) return null;

            if(isExcludedFromLootPlan(card)){
                return null;
            }

            try {
                const res = await fetch(`/battle.php?id=${encodeURIComponent(mId)}`, { credentials: 'same-origin' });
                if (!res.ok) throw new Error(`Fetch failed (HTTP ${res.status})`);

                const html = await res.text();
                const doc = new DOMParser().parseFromString(html, 'text/html');

                // Damage
                const damageText = doc.querySelector('#yourDamageValue')?.textContent?.trim() || '';
                const damageVal = parseNumeric(damageText);

                // EXP/DMG from 2nd .stat-line, 3rd .stat-block (fallback scan)
                let expPerDmgText = '';
                (function () {
                    const lines = doc.querySelectorAll('.stat-line');
                    const secondLine = lines[1];
                    if (!secondLine) return;

                    const blocks = secondLine.querySelectorAll('.stat-block');
                    const thirdBlock = blocks[2];

                    if (thirdBlock) {
                        const labelEl = thirdBlock.querySelector('.label, span.label');
                        if (norm(labelEl?.textContent) === 'exp / dmg') {
                            expPerDmgText = thirdBlock.querySelector('strong')?.textContent?.trim() || '';
                        }
                    }

                    if (!expPerDmgText && blocks.length) {
                        for (const b of blocks) {
                            const lbl = b.querySelector('.label, span.label');
                            if (norm(lbl?.textContent) === 'exp / dmg') {
                                expPerDmgText = b.querySelector('strong')?.textContent?.trim() || '';
                                if (expPerDmgText) break;
                            }
                        }
                    }
                })();

                const expPerDmgVal = parseNumeric(expPerDmgText);

                // Base EXP
                const expRaw = (Number.isFinite(damageVal) && Number.isFinite(expPerDmgVal))
                ? (damageVal * expPerDmgVal)
                : NaN;

                // Wave/level multiplier rules (same as you had)
                let multiplier = 1;
                if (href.includes('wave=3') && Number.isFinite(lvlVal) && lvlVal > 200) multiplier = 0.75;
                else if (href.includes('wave=5') && Number.isFinite(lvlVal) && lvlVal > 1000) multiplier = 0.75;
                else if (href.includes('wave=8') && Number.isFinite(lvlVal) && lvlVal > 3500) multiplier = 0.50;

                const adjusted = Number.isFinite(expRaw) ? expRaw * multiplier : NaN;
                const finalExpCeil = Number.isFinite(adjusted) ? Math.ceil(adjusted) : NaN;

                const entry = { monsterId: mId, finalExpCeil: Number.isFinite(finalExpCeil) ? finalExpCeil : null };

                // Store (map + list)
                window.monsterExpMap.set(mId, entry.finalExpCeil);
                const idx = window.monsterExpList.findIndex(x => x.monsterId === mId);
                if (idx >= 0) window.monsterExpList[idx] = entry;
                else window.monsterExpList.push(entry);

                // Optional: mark card for debugging
                card.dataset.finalExp = entry.finalExpCeil ?? '';

                return entry;
            } catch (err) {
                console.warn('[EXP Plan] Failed monster fetch/parse', mId, err);
                window.monsterExpMap.set(mId, null);
                const idx = window.monsterExpList.findIndex(x => x.monsterId === mId);
                const entry = { monsterId: mId, finalExpCeil: null };
                if (idx >= 0) window.monsterExpList[idx] = entry;
                else window.monsterExpList.push(entry);
                return entry;
            }
        });

        await Promise.allSettled(tasks);
        return { ok: true, count: cards.length };
    }

    // ----------------------------
    // Build plan: sum until total > needed
    // strategy: "desc" (default) | "asIs" | "asc"
    // ----------------------------
    function buildExpPlan({ strategy = 'desc' } = {}) {
        const { currentExp, maxExp, needed } = readExpNeededFromTopBar();

        const list = Array.isArray(window.monsterExpList) ? window.monsterExpList.slice() : [];
        const cleaned = list
        .map(x => ({
            monsterId: String(x.monsterId),
            finalExpCeil: Number.isFinite(x.finalExpCeil) ? x.finalExpCeil : 0
        }))
        .filter(x => x.monsterId);

        if (strategy === 'desc') cleaned.sort((a, b) => b.finalExpCeil - a.finalExpCeil);
        else if (strategy === 'asc') cleaned.sort((a, b) => a.finalExpCeil - b.finalExpCeil);

        if (!Number.isFinite(needed)) {
            return { currentExp, maxExp, needed, selected: [], totalFromSelected: 0, exceeds: false };
        }
        if (needed <= 0) {
            return { currentExp, maxExp, needed: 0, selected: [], totalFromSelected: 0, exceeds: true };
        }

        const selected = [];
        let total = 0;

        for (const m of cleaned) {
            selected.push(m);
            total += m.finalExpCeil;
            if (total > needed) break; // must exceed by one monster
        }

        return {
            currentExp,
            maxExp,
            needed,
            selected,
            totalFromSelected: total,
            exceeds: total > needed
        };
    }

    // ----------------------------
    // UI helpers (highlight + panel)
    // ----------------------------
    function clearExpPlanUI() {
        document.querySelectorAll('.exp-plan-selected').forEach(el => el.classList.remove('exp-plan-selected'));
        document.querySelectorAll('.exp-plan-badge').forEach(el => el.remove());
        document.querySelector('#exp-plan-panel')?.remove();
    }

    function renderExpPlan(plan) {
        clearExpPlanUI();

        // Highlight planned cards
        for (const { monsterId, finalExpCeil } of plan.selected) {
            const card = document.querySelector(`.monster-card[data-monster-id="${CSS.escape(monsterId)}"]`);
            if (!card) continue;

            card.classList.add('exp-plan-selected');
            card.style.position = card.style.position || 'relative';

            const badge = document.createElement('div');
            badge.className = 'exp-plan-badge';
            badge.textContent = `+${formatInt(finalExpCeil)} EXP`;
            badge.style.cssText = `
        position:absolute; top:6px; right:6px;
        background:#2e7d32; color:#fff; font-weight:700;
        padding:2px 6px; border-radius:6px; font-size:12px;
        box-shadow:0 1px 3px rgba(0,0,0,.25);
        z-index: 999;
      `;
        card.appendChild(badge);
    }

      // Panel
      const panel = document.createElement('div');
      panel.id = 'exp-plan-panel';
      panel.style.cssText = `
      position: fixed;
      bottom: 16px;
      right: 16px;
      width: 340px;
      background: rgba(20,20,20,.95);
      color: #fff;
      border: 1px solid rgba(255,255,255,.15);
      border-radius: 10px;
      padding: 12px;
      z-index: 999999;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      box-shadow: 0 6px 18px rgba(0,0,0,.35);
      display:none;
    `;

      const count = plan.selected.length;
      const needed = Number.isFinite(plan.needed) ? formatInt(plan.needed) : '—';
      const total = Number.isFinite(plan.totalFromSelected) ? formatInt(plan.totalFromSelected) : '—';

      panel.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
        <div style="font-weight:800; font-size:14px;">EXP Plan</div>
        <button id="exp-plan-close" style="
          background: transparent; color: #fff; border: 1px solid rgba(255,255,255,.25);
          border-radius: 8px; padding: 2px 8px; cursor: pointer;
        ">✕</button>
      </div>

      <div style="margin-top:8px; font-size:13px; line-height:1.55;">
        <div><b>EXP Needed:</b> ${needed}</div>
        <div><b>Monsters Selected:</b> ${count}</div>
        <div style="margin-top:6px; padding:6px; background:#1b5e20; border-radius:6px;">
          <b>Total EXP from selected:</b>
          <span style="color:#a5d6a7; font-weight:800; font-size:14px;">${total}</span>
        </div>
        <div style="margin-top:8px;">
          <b>Status:</b> ${plan.exceeds ? '<span style="color:#81c784;">✅ Threshold exceeded</span>' : '<span style="color:#ef9a9a;">⚠️ Not enough EXP</span>'}
        </div>
      </div>

      <div style="margin-top:10px; max-height:160px; overflow:auto; font-size:12px; border-top: 1px solid rgba(255,255,255,.12); padding-top:8px;">
        ${plan.selected.map((m, i) =>
                            `<div>${i + 1}. <code>${m.monsterId}</code> — <b>${formatInt(m.finalExpCeil)}</b></div>`
        ).join('')}
      </div>

      <div id="exp-plan-progress" style="
        margin-top:10px;
        font-size:12px;
        color:#cfd8dc;
        border-top: 1px solid rgba(255,255,255,.12);
        padding-top: 8px;
      "></div>
    `;

      document.body.appendChild(panel);
      panel.querySelector('#exp-plan-close')?.addEventListener('click', clearExpPlanUI);
  }

    function injectExpPlanStylesOnce() {
        if (document.getElementById('exp-plan-style')) return;
        const style = document.createElement('style');
        style.id = 'exp-plan-style';
        style.textContent = `
      .exp-plan-selected {
        outline: 2px solid #2e7d32 !important;
        box-shadow: 0 0 0 4px rgba(46,125,50,.2) !important;
      }
      #run-exp-plan-btn:hover, #clear-exp-plan-btn:hover {
        filter: brightness(1.08);
      }
      #run-exp-plan-btn:active, #clear-exp-plan-btn:active {
        transform: translateY(1px);
      }
    `;
      document.head.appendChild(style);
  }

    // ----------------------------
    // Looting (JS-driven #loot-button) via hidden iframe
    // ----------------------------
    function getOrCreateLootIframe() {
        let iframe = document.querySelector('#exp-plan-loot-iframe');
        if (iframe) return iframe;

        iframe = document.createElement('iframe');
        iframe.id = 'exp-plan-loot-iframe';
        iframe.style.cssText = `
      position: fixed;
      width: 1px; height: 1px;
      left: -9999px; top: -9999px;
      opacity: 0;
      pointer-events: none;
      border: 0;
      z-index: -1;
    `;
      document.body.appendChild(iframe);
      return iframe;
  }

    async function loadIframeFastNoCss(iframe, url, { timeoutMs = 20000 } = {}) {
        // 1) Fetch battle HTML ourselves (same-origin cookies included)
        const res = await fetch(url, { credentials: 'same-origin' });
        if (!res.ok) throw new Error(`Failed to fetch ${url} (HTTP ${res.status})`);
        let html = await res.text();

        // 2) Remove *all* stylesheet links (including the missing /style.css)
        // This avoids 404 delays and speeds up render.
        html = html.replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>\s*/gi, '');

        // Optional speed boost: remove images (doesn't affect loot button)
        html = html.replace(/<img\b[^>]*>\s*/gi, '');

        // 3) Ensure relative script/src URLs still resolve correctly
        // by injecting a <base> tag in <head>.
        const baseTag = `${location.origin}/`;
        if (/<head\b[^>]*>/i.test(html)) {
            html = html.replace(/<head\b[^>]*>/i, (m) => `${m}\n${baseTag}\n`);
        } else {
            html = `${baseTag}\n${html}`;
        }

        // 4) Load about:blank (same-origin) and write modified HTML
        await new Promise((resolve) => {
            const onLoad = () => {
                iframe.removeEventListener('load', onLoad);
                resolve();
            };
            iframe.addEventListener('load', onLoad);
            iframe.src = 'about:blank';
        });

        const doc = iframe.contentDocument;
        if (!doc) throw new Error('No iframe document');

        doc.open();
        doc.write(html);
        doc.close();

        // 5) Wait until body exists (don’t wait for external subresources)
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            if (iframe.contentDocument?.body) return true;
            await new Promise(r => setTimeout(r, 30));
        }
        throw new Error(`Timeout injecting HTML into iframe for ${url}`);
    }

    async function waitForSelectorInIframe(iframe, selector, timeoutMs = 12000) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            const doc = iframe.contentDocument;
            const el = doc?.querySelector(selector);
            if (el) return el;
            await sleep(150);
        }
        return null;
    }

    async function clickLootAndWait(iframe, { timeoutMs = 20000 } = {}) {
        const doc = iframe.contentDocument;
        if (!doc) return { ok: false, reason: 'no iframe document' };

        const btn = doc.querySelector('#loot-button');
        if (!btn) return { ok: false, reason: 'loot-button not found' };

        const initialText = (btn.textContent || '').trim().toLowerCase();

        let loadedAgain = false;
        const onLoad = () => { loadedAgain = true; };
        iframe.addEventListener('load', onLoad);

        let mutated = false;
        const mo = new MutationObserver(() => { mutated = true; });
        mo.observe(doc.documentElement, { subtree: true, childList: true, attributes: true });

        try {
            btn.click();

            const start = Date.now();
            while (Date.now() - start < timeoutMs) {
                if (loadedAgain) return { ok: true, mode: 'reload' };

                const d = iframe.contentDocument;
                if (!d) return { ok: true, mode: 'doc-lost' };

                const b2 = d.querySelector('#loot-button');
                if (!b2) return { ok: true, mode: 'button-gone' };

                const text2 = (b2.textContent || '').trim().toLowerCase();
                const disabled = b2.disabled || b2.getAttribute('aria-disabled') === 'true';

                if (disabled) return { ok: true, mode: 'disabled' };
                if (initialText && text2 && text2 !== initialText) return { ok: true, mode: 'text-changed' };

                if (mutated) mutated = false;
                await sleep(150);
            }
            return { ok: false, reason: 'loot wait timeout' };
        } finally {
            iframe.removeEventListener('load', onLoad);
            mo.disconnect();
        }
    }

    async function lootMonsterByIdIframe(monsterId) {
        const iframe = getOrCreateLootIframe();
        const url = `/battle.php?id=${encodeURIComponent(monsterId)}`;

        try {
            await loadIframeFastNoCss(iframe, url, { timeoutMs: 300 });
            const lootBtn = await waitForSelectorInIframe(iframe, '#loot-button', 180);
            if (!lootBtn) {
                return { ok: false, monsterId, step: 'find', reason: 'loot-button not present (already claimed / not slain)' };
            }
            const clicked = await clickLootAndWait(iframe, { timeoutMs: 300 });
            if (!clicked.ok) {
                return { ok: false, monsterId, step: 'click', reason: clicked.reason };
            }
            return { ok: true, monsterId, step: 'done', mode: clicked.mode };
        } catch (e) {
            return { ok: false, monsterId, step: 'exception', reason: String(e?.message || e) };
        }
    }

    async function runPlannedLootOnly(planSelected, { delayMs = 800 } = {}) {
        const panel = document.querySelector('#exp-plan-panel');
        const progressEl = panel?.querySelector('#exp-plan-progress');

        const results = [];
        for (let i = 0; i < planSelected.length; i++) {
            const statusLabel = document.querySelector('#exp-plan-status-label');
if (statusLabel) {
  statusLabel.style.display = 'inline';
  statusLabel.style.color = '#cfd8dc';
  statusLabel.textContent = `Looting: ${i + 1} / ${planSelected.length}`;
}

            const { monsterId } = planSelected[i];
            if (progressEl) progressEl.textContent = `Looting planned ${i + 1}/${planSelected.length} — Monster ${monsterId}...`;

            const r = await lootMonsterByIdIframe(monsterId);
            results.push(r);

            if (progressEl) {
                progressEl.textContent = r.ok
                    ? `✅ Looted ${monsterId} (${i + 1}/${planSelected.length})`
          : `⚠️ Failed ${monsterId} [${r.step}] ${r.reason}`;
      }

        await sleep(delayMs);
    }

      if (progressEl) {
          const okCount = results.filter(x => x.ok).length;
          progressEl.textContent = `Done looting planned monsters. Success: ${okCount}/${results.length}`;
      }
        const statusLabel = document.querySelector('#exp-plan-status-label');
if (statusLabel) {
  statusLabel.style.color = '#81c784';
  statusLabel.textContent = `✓ Plan completed (${planSelected.length} / ${planSelected.length})`;
}
      return results;
      //setTimeout(() => {window.location.reload();}, 500);
  }

    // ----------------------------
    // Buttons next to #btnLootX (styled like it)
    // ----------------------------
    function addExpPlanButtons() {
        if (document.querySelector('#run-exp-plan-btn')) return;

        const lootBtn = document.querySelector('#btnLootX') || document.querySelector('#multiLootButton');
        if (!lootBtn || !lootBtn.parentNode) return;

        injectExpPlanStylesOnce();

        const lootStyle = `
      background: #333;
      border: none;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 13px;
      line-height: 1.2;
      color: #fff;
      cursor: pointer;
      box-shadow: 0 6px 18px rgba(0, 0, 0, .6);
      border: 1px solid #2b2d44;
      white-space: nowrap;
      vertical-align: middle;
    `;

      const runBtn = document.createElement('button');
      runBtn.id = 'run-exp-plan-btn';
      runBtn.type = 'button';
      runBtn.textContent = 'loot to next level';
      runBtn.style.cssText = lootStyle + `
      margin-left: 8px;
      background: #2f3a56;
      border-color: #3a3f63;
    `;

      const clearBtn = document.createElement('button');
      clearBtn.id = 'clear-exp-plan-btn';
      clearBtn.type = 'button';
      clearBtn.textContent = 'Clear';
      clearBtn.style.cssText = lootStyle + `
      margin-left: 6px;
      background: #3b3b3b;
      display:none;
    `;
      const statusLabel = document.createElement('span');
      statusLabel.id = 'exp-plan-status-label';
      statusLabel.textContent = '';
      statusLabel.style.cssText = `
      margin-left: 8px;
      font-size: 12px;
      color: #81c784;
      font-weight: 600;
      display: none;
      vertical-align: middle;
    `;
      lootBtn.insertAdjacentElement('afterend', runBtn);
      //runBtn.insertAdjacentElement('afterend', clearBtn);
      //runBtn.insertAdjacentElement('afterend', statusLabel);

      clearBtn.addEventListener('click', clearExpPlanUI);

      runBtn.addEventListener('click', async () => {
          const statusLabel = document.querySelector('#exp-plan-status-label');
          if (statusLabel) {
              statusLabel.style.display = 'inline';
              statusLabel.style.color = '#cfd8dc';
              statusLabel.textContent = 'Starting...';
          }
          // Prevent double clicks
          if (runBtn.dataset.running === '1') return;
          runBtn.dataset.running = '1';
          runBtn.textContent = 'Running...';

          try {
              // 1) Build exp map/list
              await updateMonsterExpData();

              // 2) Build plan and show it

              const plan = buildExpPlan({ strategy: 'asIs' });
              renderExpPlan(plan);

              const zeroExpPlanned = plan.selected.filter(m => !m.finalExpCeil || m.finalExpCeil === 0).length;

              // Optional: if plan doesn't exceed, do not loot
              // if (!plan.exceeds) return;

              // 3) Loot ONLY planned monsters (direct loot.php + summary)
              const ids = plan.selected.map(x => x.monsterId);
              await window.VV_LOOT.lootMonsterIds(ids, {
                  concurrency: 5,
                  // optional: stop once we reach needed EXP (keeps the "to next level" promise)
                  stopAtExp: Number.isFinite(plan.needed) ? Math.ceil(plan.needed) : null,
                  perLootDelayMs: 90
              });

// optional reload after a short delay
//setTimeout(() => window.location.reload(), 800);

          } catch (e) {
              console.error('[EXP Plan] Run failed', e);
          } finally {
              runBtn.dataset.running = '0';
              runBtn.textContent = 'Loot to next level';
          }
      });

      // Expose helpers for console usage
      window.VV_EXPPLAN.updateMonsterExpData = updateMonsterExpData;
      window.VV_EXPPLAN.buildExpPlan = buildExpPlan;
      window.VV_EXPPLAN.renderExpPlan = renderExpPlan;
      window.VV_EXPPLAN.runPlannedLootOnly = runPlannedLootOnly;
      window.VV_EXPPLAN.clear = clearExpPlanUI;
  }

    // Retry-init because page is dynamic
    (function initButtons() {
        let tries = 0;
        const t = setInterval(() => {
            addExpPlanButtons();
            tries++;
            if (document.querySelector('#run-exp-plan-btn') || tries > 80) clearInterval(t);
        }, 250);
    })();

})();

// end monster card section

injectQuestModalStyles();
ensureQuestModal();

// Guild sidebar section
async function fetchDungeonLink(titleText, dashUrl = 'guild_dash.php') {
    try {
        const res = await fetch(dashUrl, {
            credentials: 'include'
        }); // include cookies/session
        if (!res.ok) throw new Error(`HTTP ${res.status} when fetching ${dashUrl}`);

        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        // XPath: find the title div by text, then go to 2nd following div and pick its first <a>
        const xpath = `//div[normalize-space(.)='${titleText}']/following-sibling::div[2]/a[1]`;
        const anchor = doc.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        return anchor ? anchor.getAttribute('href') : null;
    } catch (err) {
        console.error('Failed to fetch/parse guild_dash.php:', err);
        return null;
    }
}

function waitForElement(selector, {
    root = document,
    timeout = 10000
} = {}) {
    return new Promise((resolve, reject) => {
        const existing = root.querySelector(selector);
        if (existing) {
            resolve(existing);
            return;
        }

        const obs = new MutationObserver(() => {
            const el = root.querySelector(selector);
            if (el) {
                obs.disconnect();
                resolve(el);
            }
        });

        obs.observe(root.documentElement || root, {
            childList: true,
            subtree: true
        });

        if (timeout > 0) {
            setTimeout(() => {
                obs.disconnect();
                reject(new Error(`Timeout waiting for element: ${selector}`));
            }, timeout);
        }
    });
}

async function createDungeonCards() {
    const titles = ['Shadowbridge Warrens', 'Castle of the Fallen Prince'];

    let container;
    try {
        container = await waitForElement('#guild-expanded', {
            timeout: 15000
        });
    } catch (err) {
        console.warn(err.message);
        return;
    }

    for (const title of titles) {
        const href = await fetchDungeonLink(title);
        if (!href) {
            console.warn(`No link found for "${title}"`);
            continue;
        }

        // Avoid duplicates if run multiple times
        if (container.querySelector(`a[href="${href}"]`)) continue;

        // Build the card safely (no innerHTML injection for dynamic values)
        const card = document.createElement('div');
        card.className = 'dlcard';
        card.style.marginLeft = '15px';
        card.style.padding = '6px';
        card.style.background = 'rgba(30, 30, 46, 0.5)';
        card.style.borderRadius = '4px';
        card.style.borderLeft = '2px solid #e59f5a';
        card.style.marginBottom = '6px';

        const link = document.createElement('a');
        link.style.textDecoration = 'none';
        link.style.color = 'white';
        link.href = href;

        const icon = document.createElement('span');
        icon.className = 'side-icon';
        icon.style.fontSize = '10px';
        icon.textContent = '⚔️';

        const label = document.createElement('span');
        label.className = 'side-label';
        label.style.fontSize = '9px';
        label.style.marginLeft = '6px';
        label.textContent = title;

        link.appendChild(icon);
        link.appendChild(label);
        card.appendChild(link);
        container.appendChild(card);
    }
}

createDungeonCards();

//  End Guild sidebar section

// Adventurers sidebar section
function initAdventurersGuildQuests() {
    // Fetch and populate adventurers guild quests in sidebar
    const questsContainer = document.getElementById('quest-expanded');
    if (!questsContainer) return;

    // Show loading state
    questsContainer.innerHTML = '<div style="text-align: center; padding: 15px; color: #6c7086; font-size: 11px;">Loading quests...</div>';

    // Fetch adventures page
    fetch('https://demonicscans.org/adventurers_guild.php', {
        credentials: 'include',
        mode: 'same-origin'
    })
        .then(response => response.text())
        .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extract available quests - updated selectors to match actual HTML structure
        const availableQuests = [];
        const availableQuestElements = doc.querySelectorAll('.quest-list .quest-row');
        availableQuestElements.forEach(questEl => {
            // Check if this is an active quest by looking for progress indicators
            const progress = questEl.querySelector('.quest-progress')?.textContent?.trim();
            const hasProgress = progress && progress.includes('Progress:');

            // Only add to available quests if it doesn't have progress (not active)
            if (!hasProgress) {
                const title = questEl.querySelector('.quest-main-title')?.textContent?.trim();
                const description = questEl.querySelector('.quest-main-desc')?.textContent?.trim();
                const reward = questEl.querySelector('.quest-reward')?.textContent?.trim();

                // Extract quest ID from accept button
                const acceptBtn = questEl.querySelector('.quest-accept-btn');
                let questId = null;
                if (acceptBtn) {
                    const onclickStr = acceptBtn.getAttribute('onclick') || '';
                    const match = onclickStr.match(/acceptQuest\((\d+)/);
                    if (match) {
                        questId = match[1];
                    }
                }

                if (title) {
                    // Check if this quest is already in the array to prevent duplicates
                    const existingQuest = availableQuests.find(q => q.title === title);
                    if (!existingQuest) {
                        availableQuests.push({
                            title: title,
                            description: description || 'No description available',
                            reward: reward || 'No reward specified',
                            questId: questId,
                            type: 'available'
                        });
                    }
                }
            }
        });

        // Extract active quests - look for active quest section
        const activeQuests = [];
        const activeQuestElements = doc.querySelectorAll('.quest-list .quest-row');
        activeQuestElements.forEach(questEl => {
            // Check if this is an active quest by looking for progress or specific indicators
            const progress = questEl.querySelector('.quest-progress')?.textContent?.trim();
            const hasProgress = progress && progress.includes('Progress:');

            if (hasProgress) {
                const title = questEl.querySelector('.quest-main-title')?.textContent?.trim();
                const description = questEl.querySelector('.quest-main-desc')?.textContent?.trim();
                const timeLeft = questEl.querySelector('.quest-time')?.textContent?.trim();

                // Extract quest action from give up, finish, or donate button
                // Prioritize donate button over give up button
                const giveUpBtn = questEl.querySelector('.quest-giveup-btn');
                const finishBtn = questEl.querySelector('.quest-finish-btn');
                const donateBtn = questEl.querySelector('.quest-donate-btn');
                let questId = null;
                let actionType = null;
                let actionLabel = null;
                let itemId = null;

                if (donateBtn) {
                    const onclickStr = donateBtn.getAttribute('onclick') || '';
                    const match = onclickStr.match(/donateGatherItem\((\d+),\s*(\d+)/);
                    if (match) {
                        questId = match[1];
                        itemId = match[2];
                        actionType = 'donate';
                        actionLabel = 'Donate';
                    }
                } else if (finishBtn) {
                    const onclickStr = finishBtn.getAttribute('onclick') || '';
                    const match = onclickStr.match(/finishQuest\((\d+)/);
                    if (match) {
                        questId = match[1];
                        actionType = 'finish';
                        actionLabel = 'Finish quest';
                    }
                } else if (giveUpBtn) {
                    const onclickStr = giveUpBtn.getAttribute('onclick') || '';
                    const match = onclickStr.match(/giveUpQuest\((\d+)/);
                    if (match) {
                        questId = match[1];
                        actionType = 'giveUp';
                        actionLabel = 'Give up';
                    }
                }

                if (title) {
                    // Check if this quest is already in the array to prevent duplicates
                    const existingQuest = activeQuests.find(q => q.title === title);
                    if (!existingQuest) {
                        activeQuests.push({
                            title: title,
                            progress: progress || 'In progress',
                            timeLeft: timeLeft || 'Unknown time remaining',
                            questId: questId,
                            itemId: itemId,
                            actionType: actionType,
                            actionLabel: actionLabel,
                            type: 'active'
                        });
                    }
                }
            }
        });

        // Build HTML for quests
        let questsHTML = '';

        if (availableQuests.length > 0) {
            availableQuests.forEach(quest => {
                questsHTML += `

        <div class="sidebar-quest tm-clickable"
             data-q-title="${escapeHtml(quest.title)}"
             data-q-type="Available"
             data-q-description="${escapeHtml(quest.description)}"
             data-q-reward="${escapeHtml(quest.reward)}"
             style
        ="margin-bottom: 8px; padding: 6px; background: rgba(30, 30, 46, 0.5); border-radius: 4px; border-left: 2px solid #89b4fa;">
            <div class="quest-title" style="font-weight: bold; color: #cdd6f4; font-size: 10px; margin-bottom: 3px;">${quest.title}</div>
            <div class="quest-details" style="color: #6c7086; font-size: 9px; margin-bottom: 2px;">${quest.description}</div>
            <div class="quest-reward" style="color: #a6e3a1; font-size: 9px; margin-bottom: 4px;">Reward: ${quest.reward}</div>
            ${quest.questId ? `<button class="quest-accept-btn" type="button" data-quest-id="${quest.questId}" style="background: #89b4fa; color: white; border: none; border-radius: 3px; padding: 2px 6px; font-size: 9px; cursor: pointer;">Accept quest</button>` : ''}
          </div>
        `;
                });
                questsHTML += '</div>';
            }

        if (activeQuests.length > 0) {
            questsHTML += '<div><div style="font-weight: bold; color: #f9e2af; margin-bottom: 8px; font-size: 11px;">⚡ Active Quests</div>';
            activeQuests.forEach(quest => {
                questsHTML += `

<div class="sidebar-quest tm-clickable"
     data-q-title="${escapeHtml(quest.title)}"
     data-q-type="Active"
     data-q-progress="${escapeHtml(quest.progress)}"
     data-q-time="${escapeHtml(quest.timeLeft)}"
     style
="margin-bottom: 8px; padding: 6px; background: rgba(30, 30, 46, 0.5); border-radius: 4px; border-left: 2px solid #f9e2af;">
            <div class="quest-title" style="font-weight: bold; color: #cdd6f4; font-size: 10px; margin-bottom: 3px;">${quest.title}</div>
            <div class="quest-progress" style="color: #6c7086; font-size: 9px; margin-bottom: 2px;">${quest.progress}</div>
            <div class="quest-time" style="color: #eba0ac; font-size: 9px; margin-bottom: 4px;">${quest.timeLeft}</div>
            ${quest.questId && quest.actionType ? `<button class="quest-${quest.actionType}-btn" type="button" data-quest-id="${quest.questId}" data-action-type="${quest.actionType}" ${quest.itemId ? `data-item-id="${quest.itemId}"` : ''} style="background: ${quest.actionType === 'giveUp' ? '#f38ba8' : quest.actionType === 'donate' ? '#fab387' : '#a6e3a1'}; color: white; border: none; border-radius: 3px; padding: 2px 6px; font-size: 9px; cursor: pointer; margin-top: 2px;">${quest.actionLabel}</button>` : ''}
          </div>
        `;
                });
                questsHTML += '</div>';
            }

        if (availableQuests.length === 0 && activeQuests.length === 0) {
            questsHTML = '<div style="text-align: center; padding: 15px; color: #6c7086; font-size: 11px; font-style: italic;">No quests found</div>';
        }

        questsContainer.innerHTML = questsHTML;
questsContainer.addEventListener('click', (e) => {
  // If user clicked a button, let the button handler run
  if (e.target.closest('button')) return;

  const card = e.target.closest('.sidebar-quest');
  if (!card) return;

  openQuestModal({
    title: card.dataset.qTitle,
    type: card.dataset.qType,
    description: card.dataset.qDescription,
    reward: card.dataset.qReward,
    progress: card.dataset.qProgress,
    timeLeft: card.dataset.qTime
  });
});


        // Add event listeners to quest action buttons
        const questButtons = questsContainer.querySelectorAll('.quest-giveUp-btn, .quest-finish-btn, .quest-accept-btn, .quest-donate-btn');
        questButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const questId = this.getAttribute('data-quest-id');
                const actionType = this.classList.contains('quest-accept-btn') ? 'accept' :
                this.classList.contains('quest-giveUp-btn') ? 'giveUp' :
                this.classList.contains('quest-donate-btn') ? 'donate' : 'finish';
                if (actionType === 'accept') {
                    sidebarAcceptQuest(questId, this);
                } else if (actionType === 'donate') {
                    const itemId = this.getAttribute('data-item-id');
                    sidebarDonateQuest(questId, itemId, this);
                } else {
                    sidebarQuestAction(actionType, questId, this);
                }
            });
        });
    })
        .catch(error => {
        console.error('Error fetching adventurers guild quests:', error);
        questsContainer.innerHTML = '<div style="text-align: center; padding: 15px; color: #f38ba8; font-size: 11px;">Failed to load quests</div>';
    });
}

function sidebarDonateQuest(questId, itemId, btn) {
    // Create quantity input popup
    const existingPopup = document.getElementById('quest-donate-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    const popup = document.createElement('div');
    popup.id = 'quest-donate-popup';
    popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(30, 30, 46, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 20px;
    z-index: 10000;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    min-width: 250px;
    text-align: center;
  `;

    popup.innerHTML = `
    <div style="color: #cdd6f4; font-size: 14px; margin-bottom: 15px; font-weight: bold;">Donate Items</div>
    <div style="color: #6c7086; font-size: 12px; margin-bottom: 15px;">Enter quantity to donate:</div>
    <input type="number" id="donate-quantity" min="1" max="999" value="1" style="width: 80px; padding: 5px; border: 1px solid #45475a; border-radius: 4px; background: #1e1e2e; color: #cdd6f4; text-align: center; margin-bottom: 15px;">
    <div>
      <button id="donate-confirm-btn" style="background: #fab387; color: white; border: none; border-radius: 4px; padding: 8px 16px; margin-right: 8px; cursor: pointer;">Donate</button>
      <button id="donate-cancel-btn" style="background: #6c7086; color: white; border: none; border-radius: 4px; padding: 8px 16px; cursor: pointer;">Cancel</button>
    </div>
  `;

    document.body.appendChild(popup);

    // Focus on input
    const quantityInput = document.getElementById('donate-quantity');
    quantityInput.focus();
    quantityInput.select();

    // Handle confirm button
    document.getElementById('donate-confirm-btn').addEventListener('click', function() {
        const quantity = parseInt(quantityInput.value);
        if (quantity > 0) {
            performSidebarDonate(questId, itemId, quantity, btn);
            popup.remove();
        }
    });

    // Handle cancel button
    document.getElementById('donate-cancel-btn').addEventListener('click', function() {
        popup.remove();
    });

    // Handle Enter key
    quantityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const quantity = parseInt(quantityInput.value);
            if (quantity > 0) {
                performSidebarDonate(questId, itemId, quantity, btn);
                popup.remove();
            }
        }
    });

    // Handle Escape key
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            popup.remove();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

function performSidebarDonate(questId, itemId, quantity, originalBtn) {
    if (!confirm(`Donate ${quantity} item(s) towards your quest? You must own more than this amount.`)) return;

    originalBtn.disabled = true;
    originalBtn.textContent = `Donating... (0/${quantity})`;

    let donatedCount = 0;
    let failedCount = 0;

    // Function to send a single donation request
    const sendDonationRequest = () => {
        return fetch('/adventurers_donate_gather.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                quest_id: questId,
                item_id: itemId
            })
        })
            .then(r => r.json())
            .then(data => {
            if (data && data.status === 'ok') {
                donatedCount++;
                originalBtn.textContent = `Donating... (${donatedCount}/${quantity})`;
                return true;
            } else {
                failedCount++;
                console.error('Donation failed:', data?.message);
                return false;
            }
        })
            .catch(error => {
            failedCount++;
            console.error('Donation error:', error);
            return false;
        });
    };

    // Send requests sequentially
    const donateSequentially = async () => {
        for (let i = 0; i < quantity; i++) {
            const success = await sendDonationRequest();
            if (!success) {
                // If a donation fails, stop the process
                break;
            }

            // Small delay between requests to avoid overwhelming the server
            if (i < quantity - 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        // Show final result
        if (failedCount === 0) {
            alert(`Successfully donated ${donatedCount} item(s) towards your quest!`);
        } else if (donatedCount > 0) {
            alert(`Partially successful: donated ${donatedCount} item(s), but ${failedCount} failed.`);
        } else {
            alert('Failed to donate any items. Please try again.');
        }

        // Refresh the sidebar quests
        initAdventurersGuildQuests();
    };

    // Start the donation process
    donateSequentially().catch(error => {
        console.error('Donation process error:', error);
        alert('An error occurred during the donation process.');
        originalBtn.disabled = false;
        originalBtn.textContent = 'Donate';
    });
}

function sidebarQuestAction(actionType, questId, btn) {
    const confirmMessages = {
        giveUp: "Abandon this quest? Progress will be lost.",
        finish: "Turn in this quest at the Adventurer's Guild?"
    };

    if (!confirm(confirmMessages[actionType])) return;
    btn.disabled = true;
    btn.textContent = 'Processing...';

    const endpoints = {
        giveUp: '/adventurers_giveup_quest.php',
        finish: '/adventurers_finish_quest.php'
    };

    fetch(endpoints[actionType], {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            quest_id: questId
        })
    })
        .then(r => r.json())
        .then(data => {
        if (data && data.status === 'ok') {
            showNotification(data.message || `Quest ${actionType === 'giveUp' ? 'abandoned' : 'finished'}!`, 'success');
            // Refresh the sidebar quests content
            initAdventurersGuildQuests();
        } else {
            showNotification((data && data.message) ? data.message : `Could not ${actionType} quest.`, 'error');
            btn.disabled = false;
            btn.textContent = actionType === 'giveUp' ? 'Give up' : 'Finish quest';
        }
    })
        .catch(() => {
        showNotification(`Server error while ${actionType === 'giveUp' ? 'abandoning' : 'finishing'} quest.`, 'error');
        btn.disabled = false;
        btn.textContent = actionType === 'giveUp' ? 'Give up' : 'Finish quest';
    });
}

function sidebarAcceptQuest(questId, btn) {
    if (!confirm("Accept this quest?")) return;
    btn.disabled = true;
    btn.textContent = 'Accepting...';

    fetch('/adventurers_accept_quest.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            quest_id: questId
        })
    })
        .then(r => r.json())
        .then(data => {
        if (data && data.status === 'ok') {
            showNotification(data.message || 'Quest accepted!', 'success');
            // Refresh the sidebar quests content
            initAdventurersGuildQuests();
        } else {
            showNotification((data && data.message) ? data.message : 'Could not accept quest.', 'error');
            btn.disabled = false;
            btn.textContent = 'Accept quest';
        }
    })
        .catch(() => {
        showNotification('Server error while accepting quest.', 'error');
        btn.disabled = false;
        btn.textContent = 'Accept quest';
    });
}

// end adventurers section

// Battle pass section

async function fetchQuestData() {
    try {
        const response = await fetch('https://demonicscans.org/battle_pass.php');
        const html = await response.text();
        return parseQuestData(html);
    } catch (error) {
        console.error('Failed to fetch quest data:', error);
        return null;
    }
}

function parseQuestData(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Find the card containing the daily quests
    const cards = doc.querySelectorAll('.card');
    let questCard = null;
    for (const card of cards) {
        const titleEl = card.querySelector('.title');
        if (titleEl && titleEl.textContent.includes('Daily Quests')) {
            questCard = card;
            break;
        }
    }
    if (!questCard) return null;

    const title = questCard.querySelector('.title')?.textContent?.trim() || 'Daily Quests';
    const quests = [];

    const questElements = questCard.querySelectorAll('.quest');
    questElements.forEach(questEl => {
        const name = questEl.querySelector('div:first-child strong')?.textContent?.trim() || '';
        const details = questEl.querySelector('.muted')?.textContent?.trim() || '';
        const progressBar = questEl.querySelector('.progress div');
        const progressText = questEl.querySelector('.muted:last-child')?.textContent?.trim() || '';

        const progressWidth = progressBar?.style?.width || '0%';

        quests.push({
            name,
            details,
            progress: progressWidth,
            progressText
        });
    });

    return {
        title,
        quests
    };
}

// Sidebar Quest Widget Functions
function initSidebarQuestWidget() {
    // Quest panel is now embedded in the Battle Pass expandable section
    // Data loading is handled by the expand button click handler
    updateSidebarQuestPanel();

}

async function updateSidebarQuestPanel() {
    const questData = await fetchQuestData();
    const content = document.getElementById('battle-pass-expanded');

    if (!content) return;

    if (!questData || !questData.quests.length) {
        content.innerHTML = '<div style="text-align: center; padding: 15px; color: #6c7086; font-size: 11px;">Unable to load quests</div>';
        return;
    }

    let html = `<div style="font-weight: bold; margin-bottom: 8px; color: #f38ba8; font-size: 11px;">${questData.title}</div>`;

    questData.quests.forEach(quest => {
        const isCompleted = quest.progressText.includes('✅ Completed');
        const borderColor = isCompleted ? '#a6e3a1' : '#89b4fa';
        html += `

<div class="sidebar-quest tm-clickable"
     data-q-title="${escapeHtml(quest.name)}"
     data-q-type="Daily Quest"
     data-q-description="${escapeHtml(quest.details)}"
     data-q-progress="${escapeHtml(quest.progressText)}"
     style="margin-bottom: 8px; padding: 6px; background: rgba(30, 30, 46, 0.5); border-radius: 4px; border-left: 2px solid ${borderColor};">

          <div class="quest-title" style="font-weight: bold; color: #cdd6f4; font-size: 10px; margin-bottom: 3px;">${quest.name}</div>
          <div class="quest-details" style="color: #6c7086; font-size: 9px; margin-bottom: 3px;">${quest.details}</div>
          <div style="background: #313244; border-radius: 3px; height: 4px; overflow: hidden; margin-bottom: 3px;">
            <div style="height: 100%; background: linear-gradient(90deg, #22c55e, #16a34a); width: ${quest.progress}; transition: width 0.3s ease;"></div>
          </div>
          <div style="color: #6c7086; font-size: 9px;">${quest.progressText}</div>
        </div>
      `;
    });

    content.innerHTML = html;

content.addEventListener('click', (e) => {
  const card = e.target.closest('.sidebar-quest');
  if (!card) return;

  openQuestModal({
    title: card.dataset.qTitle,
    type: card.dataset.qType,
    description: card.dataset.qDescription,
    progress: card.dataset.qProgress
  });
});
if (!content.dataset.tmModalBound) {
  content.dataset.tmModalBound = "1";
  content.addEventListener('click', (e) => {
    const card = e.target.closest('.sidebar-quest');
    if (!card) return;

    openQuestModal({
      title: card.dataset.qTitle,
      type: card.dataset.qType,
      description: card.dataset.qDescription,
      progress: card.dataset.qProgress
    });
  });
}


}

// End battle pass section

// Stats section

function initStatAllocationButtons() {

    // Add programmatic event listeners for stat upgrade buttons
    const upgradeControls = document.querySelectorAll('.upgrade-controls');
    upgradeControls.forEach(controls => {
        const plus1Btn = controls.querySelector('button:first-child');
        const plus5Btn = controls.querySelector('button:last-child');

        if (plus1Btn) {
            plus1Btn.addEventListener('click', () => {
                const statRow = controls.closest('.stat-upgrade-row');
                const stat = statRow?.dataset.stat || 'attack';
                sidebarAlloc(stat, 1);
            });
        }

        if (plus5Btn) {
            plus5Btn.addEventListener('click', () => {
                const statRow = controls.closest('.stat-upgrade-row');
                const stat = statRow?.dataset.stat || 'attack';
                sidebarAlloc(stat, 5);
            });
        }
    });

}

function fetchAndUpdateSidebarStats() {
    // Try to get stats from the current page first (if on stats page)
    if (window.location.pathname.includes('stats.php')) {
        const points = document.getElementById('v-points')?.textContent || '0';
        const attack = document.getElementById('v-attack')?.textContent || '0';
        const defense = document.getElementById('v-defense')?.textContent || '0';
        const stamina = document.getElementById('v-stamina')?.textContent || '0';

        if (points !== '0' || attack !== '0' || defense !== '0' || stamina !== '0') {
            updateSidebarStats({
                STAT_POINTS: points,
                ATTACK: attack,
                DEFENSE: defense,
                STAMINA: stamina
            });
            return;
        }
    }

    // If not on stats page or no data found, try to fetch from stats page
    fetch('stats.php')
        .then(response => response.text())
        .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const points = doc.getElementById('v-points')?.textContent || '0';
        const attack = doc.getElementById('v-attack')?.textContent || '0';
        const defense = doc.getElementById('v-defense')?.textContent || '0';
        const stamina = doc.getElementById('v-stamina')?.textContent || '0';

        updateSidebarStats({
            STAT_POINTS: points,
            ATTACK: attack,
            DEFENSE: defense,
            STAMINA: stamina
        });
    })
        .catch(err => {
        console.error('Stats fetch error:', err);
        // Fallback: try to get from any existing elements on current page
        const points = document.getElementById('v-points')?.textContent || '0';
        const attack = document.getElementById('v-attack')?.textContent || '0';
        const defense = document.getElementById('v-defense')?.textContent || '0';
        const stamina = document.getElementById('v-stamina')?.textContent || '0';

        if (points !== '0' || attack !== '0' || defense !== '0' || stamina !== '0') {
            updateSidebarStats({
                STAT_POINTS: points,
                ATTACK: attack,
                DEFENSE: defense,
                STAMINA: stamina
            });
        }
    });
}

function updateSidebarStats(userData) {
    const sidebarPoints = document.getElementById('sidebar-points');

    const sidebarAttackAlloc = document.getElementById('sidebar-attack-alloc');
    const sidebarDefenseAlloc = document.getElementById('sidebar-defense-alloc');
    const sidebarStaminaAlloc = document.getElementById('sidebar-stamina-alloc');

    if (sidebarPoints) sidebarPoints.textContent = userData.STAT_POINTS || userData.stat_points || 0;

    if (sidebarAttackAlloc) sidebarAttackAlloc.textContent = userData.ATTACK || userData.attack || 0;
    if (sidebarDefenseAlloc) sidebarDefenseAlloc.textContent = userData.DEFENSE || userData.defense || 0;
    if (sidebarStaminaAlloc) sidebarStaminaAlloc.textContent = userData.STAMINA || userData.MAX_STAMINA || userData.stamina || 0;
}

function sidebarAlloc(stat, amount) {
    const pointsElement = document.getElementById('sidebar-points');
    const currentPoints = parseInt(pointsElement?.textContent || '0');

    if (currentPoints < amount) {
        showNotification(`Not enough points! You need ${amount} points but only have ${currentPoints}.`, 'error');
        return;
    }

    // Map our stat names to what the server expects
    const statMapping = {
        'attack': 'attack',
        'defense': 'defense',
        'stamina': 'stamina'
    };

    const serverStat = statMapping[stat] || stat;
    const body = `action=allocate&stat=${encodeURIComponent(serverStat)}&amount=${encodeURIComponent(amount)}`;

    // Disable all upgrade buttons temporarily
    document.querySelectorAll('.upgrade-btn').forEach(btn => btn.disabled = true);

    fetch('stats_ajax.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
    })
        .then(async r => {
        const txt = await r.text();
        try {
            const json = JSON.parse(txt);
            if (json.error) {
                throw new Error(json.error);
            }
            return {
                okHTTP: r.ok,
                json,
                raw: txt
            };
        } catch (parseError) {
            // If not JSON or has error, try to parse as plain text
            if (r.ok && txt.includes('STAT_POINTS')) {
                const stats = {};
                const lines = txt.split('\n');
                lines.forEach(line => {
                    if (line.includes('STAT_POINTS')) stats.STAT_POINTS = line.split('=')[1]?.trim();
                    if (line.includes('ATTACK')) stats.ATTACK = line.split('=')[1]?.trim();
                    if (line.includes('DEFENSE')) stats.DEFENSE = line.split('=')[1]?.trim();
                    if (line.includes('STAMINA')) stats.STAMINA = line.split('=')[1]?.trim();
                });
                return {
                    okHTTP: r.ok,
                    json: {
                        ok: true,
                        user: stats
                    },
                    raw: txt
                };
            }
            throw new Error(`Bad response (${r.status}): ${txt}`);
        }
    })
        .then(pack => {
        if (!pack.okHTTP) {
            showNotification(`HTTP Error: ${pack.raw}`, 'error');
            return;
        }

        const res = pack.json;
        if (!res.ok) {
            showNotification(res.msg || res.error || 'Allocation failed', 'error');
            return;
        }

        const u = res.user;
        updateSidebarStats(u);

        // Also update main stats page if we're on it
        if (window.location.pathname.includes('stats')) {
            const mainPoints = document.getElementById('v-points');
            const mainAttack = document.getElementById('v-attack');
            const mainDefense = document.getElementById('v-defense');
            const mainStamina = document.getElementById('v-stamina');

            if (mainPoints) mainPoints.textContent = u.STAT_POINTS || u.stat_points || 0;
            if (mainAttack) mainAttack.textContent = u.ATTACK || u.attack || 0;
            if (mainDefense) mainDefense.textContent = u.DEFENSE || u.defense || 0;
            if (mainStamina) mainStamina.textContent = u.STAMINA || u.MAX_STAMINA || u.stamina || 0;
        }

        showNotification(`Successfully upgraded ${stat} by ${amount}!`, 'success');
    })
        .catch(err => {
        console.error(err);
        showNotification(err.message || 'Network error occurred', 'error');
    })
        .finally(() => {
        // Re-enable upgrade buttons
        document.querySelectorAll('.upgrade-btn').forEach(btn => btn.disabled = false);
        // Refresh stats after allocation
        setTimeout(fetchAndUpdateSidebarStats, 500);
    });
}

// End stats section

// Potions section
const POTIONS = [{
    key: 'exp',
    name: 'Exp Potion S',
    icon: 'https://demonicscans.org/images/items/1758633119_10_exp_potion.webp',
    multi: false,
    hasTimer: false
}
                ];


async function initAddPotions() {
    const container = document.getElementById('battleDrawer');

    for (const potCfg of POTIONS) {
        try {
            const item = await findConsumableByName(potCfg.name);
            if (!item) {
                console.warn(`[initAddPotions] Potion not found for key: ${potCfg.key}`);
                continue;
            }

            const card = document.createElement('div');
            card.className = 'potion-card';
            card.setAttribute('data-inv-id', item.invId || '');
            card.setAttribute('data-item-id', item.itemId || '');

            card.innerHTML = `
        <img src=${potCfg.icon}>
        <div class="potion-main">
          <div class="potion-name">
            <span>${item.itemName ?? potCfg.name}</span>
            <span class="qtyleft">
              x<span class="potion-qty-left" id="pqty_${item.invId}">${item.quantity ?? 0}</span>
            </span>
          </div>
          <div class="potion-desc">${item.desc ?? ''}</div>

          <div class="potion-actions">
            <input type="number"
                   min="1"
                   max="${item.quantity ?? 0}"
                   value="1"
                   id="puse_${item.invId}" ${potCfg.multi === false ? 'readonly' : ''}>
            <button class="potion-use-btn"
                    data-inv="${item.invId}"
                    data-item="${item.itemId}"
                    data-name="${item.itemName ?? potCfg.name}"
                    data-max="${item.quantity ?? 0}"
                    type="button">Use</button>
          </div>
        </div>
      `;

            if (container) {
                container.appendChild(card);
            } else {
                return;
            }
        } catch (err) {
            console.error(`[initAddPotions] Failed for key "${potCfg.key}":`, err);
        }
    }
}

async function findConsumableByName(name) {
    try {
        const res = await fetch('/inventory.php', {
            credentials: 'same-origin'
        });
        if (!res.ok) return null;

        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        // Locate a slot whose image alt matches or includes the name
        const slots = Array.from(doc.querySelectorAll('.slot-box'));
        const target =
              slots.find(s => {
                  const img = s.querySelector('img');
                  return img && img.alt && img.alt.trim().toLowerCase() === name.toLowerCase();
              }) ||
              slots.find(s => {
                  const img = s.querySelector('img');
                  return img && img.alt && img.alt.toLowerCase().includes(name.toLowerCase());
              });

        if (!target) return null;

        // --- Parse the useItem(...) call if present ---
        const useBtn = target.querySelector('button.btn[onclick], button.btn');
        let invId = null;
        let itemId = null;
        let itemNameFromOnclick = null;
        let qtyFromOnclick = null;

        if (useBtn) {
            const onclick = (useBtn.getAttribute('onclick') || '').trim();

            // Match: useItem( <invId>, <itemId>, '<name>', <qty> )
            // Allow spaces/newlines; name can be single or double quoted.
            const m = onclick.match(
                /useItem\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*(['"])(.*?)\3\s*,\s*([0-9]+)\s*\)/i
            );

            if (m) {
                invId = m[1];
                itemId = m[2];
                itemNameFromOnclick = m[4];
                qtyFromOnclick = parseInt(m[5], 10);
            } else {
                // Fallbacks if format differs
                // inv_id=### kind of variants
                const mInv = onclick.match(/inv[_-]?id\s*=\s*([0-9]+)/i);
                if (mInv) invId = mInv[1];
                const mItem = onclick.match(/item[_-]?id\s*=\s*([0-9]+)/i);
                if (mItem) itemId = mItem[1];
                const mQty = onclick.match(/qty\s*=\s*([0-9]+)/i);
                if (mQty) qtyFromOnclick = parseInt(mQty[1], 10);
            }
        }

        // --- Fallback invId via data attributes if needed ---
        if (!invId) {
            if (target.dataset && target.dataset.itemId) {
                invId = target.dataset.itemId;
            } else {
                const attr = target.getAttribute('data-item-id') ||
                      target.getAttribute('data-item-id-raw') || '';
                if (attr) {
                    const first = attr.split(',')[0].trim();
                    if (/^\d+$/.test(first)) invId = first;
                }
            }
        }

        // --- Extract data-desc from the info button ---
        let desc = null;
        let infoName = null;
        const infoBtn = target.querySelector('button.info-btn');
        if (infoBtn) {
            desc = infoBtn.getAttribute('data-desc') || null;
            infoName = infoBtn.getAttribute('data-name') || null;
        }

        // --- Quantity detection fallbacks ---
        let qty = 0;

        // Prefer qty from onclick if parsed
        if (Number.isInteger(qtyFromOnclick)) {
            qty = qtyFromOnclick;
        } else {
            // Look for explicit "x###" text in any child
            const text = target.textContent || '';
            const m2 = text.match(/x\s*([0-9]{1,6})/i);
            if (m2) {
                qty = parseInt(m2[1].replace(/[^\d]/g, ''), 10);
            }
            // Fallback: input max attribute (like "max=163")
            if (!qty) {
                const qtyInput = target.querySelector('input[type="number"]');
                if (qtyInput) {
                    const max = qtyInput.getAttribute('max');
                    if (max) qty = parseInt(max, 10);
                    if (!qty) {
                        const val = qtyInput.value || qtyInput.getAttribute('value');
                        if (val) qty = parseInt(val, 10);
                    }
                }
            }
        }

        // Prefer the onclick's item name if present; otherwise the image alt
        const img = target.querySelector('img');
        const itemName =
              itemNameFromOnclick ||
              (img && img.alt ? img.alt.trim() : infoName || null);

        return {
            invId: invId ? String(invId) : null, // 1st arg of useItem(...)
            itemId: itemId ? String(itemId) : null, // 2nd arg of useItem(...)
            itemName: itemName || null, // 3rd arg of useItem(...)
            quantity: Number.isInteger(qty) ? qty : 0, // 4th arg or fallback
            desc: desc || null // from info-btn data-desc
        };
    } catch (e) {
        console.error('findConsumableByName error', e);
        return null;
    }
}

initAddPotions();

// End potions section

/* HELPERS
  =============================== */
function createItem(href, icon, label) {
    const a = document.createElement('a');
    a.className = 'side-nav-item';
    a.href = href;
    a.innerHTML = `
      <span class="side-icon">${icon}</span>
      <span class="side-label">${label}</span>
    `;
    return a;
}

function createExpandBtn() {
    const btn = document.createElement('button');
    btn.className = 'expand-btn';
    btn.type = 'button';
    btn.textContent = '+';

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const section = btn.parentElement?.nextElementSibling;
        if (!section) return;

        section.classList.toggle('expanded');
        btn.textContent = section.classList.contains('expanded') ? '-' : '+';
    });

    return btn;
}

function showNotification(msg, bgColor = '#2ecc71') {
    const existing = document.getElementById('notification');
    if (existing) existing.remove();
    const note = document.createElement('div');
    note.id = 'notification';
    note.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 12px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      font-size: 15px;
      z-index: 10050;
      max-width: 400px;
      word-wrap: break-word;
    `;
    note.innerHTML = msg;
    document.body.appendChild(note);
    setTimeout(() => note.remove(), 3000);
}

// Run once DOM is ready
const observer = new MutationObserver(() => {
    if (document.querySelector('.side-nav')) {
        //initOrderUIRoot();
        modifySideNav();
        modBlacksmith();
        modForge();
        modMonsterCards();
        fetchAndUpdateSidebarStats();
        observer.disconnect();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});


//sidebar customization
const ORDER_KEY = 'sideNavOrder:v2';
const LEGACY_KEY = 'sideNavOrder:v1'; // old array-only key (if you used earlier version)
const DEFAULT_ORDER = [
    '/game_dash.php',
    '/guild_dash.php',
    '/battle_pass.php',
    '/adventurers_guild.php',
    '/stats.php',
    '/pvp.php',
    '/inventory.php',
    '/pets.php',
    '/merchant.php',
    '/blacksmith.php',
    '/legendary_forge.php',
    '/collections.php',
    '/achievements.php',
    '/classes.php',
    '/weekly.php',

];
const DEFAULT_DISABLED = [];            // none disabled by default
const DEFAULT_CLICKS_DISABLED = true;   // sidebar clicks disabled while ordering (default)

function getNav() { return document.querySelector('.side-nav'); }


function getCurrentAnchors() {
    const nav = getNav();
    if (!nav) return [];
    // Exclude the settings launcher from the orderable items
    return Array.from(nav.querySelectorAll('.side-nav-item'))
        .filter(a => a.id !== 'nav-order-btn');
}
function getCurrentHrefs() {
    return getCurrentAnchors().map(a => a.getAttribute('href'));
}


// Merge saved/default order with what actually exists now
function mergeOrder(order, currentHrefs) {
    const set = new Set(currentHrefs);
    const cleaned = order.filter(h => set.has(h));
    const extras = currentHrefs.filter(h => !cleaned.includes(h));
    return [...cleaned, ...extras];
}

// Load full prefs (order, disabled, clicksDisabled) with legacy migration
function loadPrefs() {
    const current = getCurrentHrefs();
    let order = mergeOrder(DEFAULT_ORDER, current);
    let disabled = DEFAULT_DISABLED.filter(h => current.includes(h));
    let clicksDisabled = DEFAULT_CLICKS_DISABLED;

    const raw = localStorage.getItem(ORDER_KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                // Legacy: only order
                order = mergeOrder(parsed, current);
            } else if (parsed && typeof parsed === 'object') {
                if (Array.isArray(parsed.order)) order = mergeOrder(parsed.order, current);
                if (Array.isArray(parsed.disabled)) disabled = parsed.disabled.filter(h => current.includes(h));
                if (typeof parsed.clicksDisabled === 'boolean') clicksDisabled = parsed.clicksDisabled;
            }
        } catch { /* fall back to defaults */ }
    }
    return { order, disabled, clicksDisabled };
}
function savePrefs(prefs) {
    localStorage.setItem(ORDER_KEY, JSON.stringify(prefs));
    // remove legacy key once we save v2
    localStorage.removeItem(LEGACY_KEY);
}

// Populate the list (draggable + enable/disable checkboxes)
function populateOrderList() {
    const list = document.getElementById('nav-order-list');
    const clicksToggle = document.getElementById('nav-clicks-disabled');
    const { order, disabled, clicksDisabled } = loadPrefs();
    const disabledSet = new Set(disabled);

    list.innerHTML = '';
    clicksToggle.checked = !!clicksDisabled;

    // Build a label map from current anchors
    const anchors = getCurrentAnchors();
    const labelByHref = new Map(
        anchors.map(a => {
            const labelNode = a.querySelector('.side-label');
            const label = labelNode ? labelNode.textContent.trim() : (a.textContent || '').trim();
            return [a.getAttribute('href'), label || a.getAttribute('href')];
        })
    );

    order.forEach(href => {
        const li = document.createElement('li');
        li.className = 'order-item';
        li.draggable = true;
        li.dataset.href = href;
        const enabled = !disabledSet.has(href);

        li.innerHTML = `
        <span class="drag-handle" title="Drag to reorder">⠿</span>
        <div class="title">
          <span class="label">${labelByHref.get(href) || href}</span>
          <span class="href">${href}</span>
        </div>
        <label class="toggle" title="Enable/disable this menu item">
          <input type="checkbox" class="enable-toggle" ${enabled ? 'checked' : ''}>
          ${enabled ? 'Enabled' : 'Disabled'}
        </label>
      `;
        attachDragHandlers(li);
        // Live label update on toggle
        const checkbox = li.querySelector('.enable-toggle');
        const toggleLabel = li.querySelector('.toggle');
        checkbox.addEventListener('change', () => {
            toggleLabel.lastChild.textContent = checkbox.checked ? 'Enabled' : 'Disabled';
        });

        list.appendChild(li);
    });
}

// Drag & drop handlers
function attachDragHandlers(li) {
    li.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', li.dataset.href);
        li.classList.add('dragging');
    });
    li.addEventListener('dragend', () => {
        li.classList.remove('dragging');
    });
    li.addEventListener('dragover', e => {
        e.preventDefault();
        li.classList.add('drag-over');
    });
    li.addEventListener('dragleave', () => {
        li.classList.remove('drag-over');
    });
    li.addEventListener('drop', e => {
        e.preventDefault();
        li.classList.remove('drag-over');
        const draggedHref = e.dataTransfer.getData('text/plain');
        const list = document.getElementById('nav-order-list');
        const items = Array.from(list.querySelectorAll('.order-item'));
        const draggedEl = items.find(x => x.dataset.href === draggedHref);
        if (!draggedEl || draggedEl === li) return;

        // Insert before/after based on pointer Y
        const rect = li.getBoundingClientRect();
        const placeBefore = e.clientY < rect.top + rect.height / 2;
        if (placeBefore) list.insertBefore(draggedEl, li);
        else list.insertBefore(draggedEl, li.nextSibling);
    });
}

// Read order + disabled from UI
function readOrderFromList() {
    const items = Array.from(document.querySelectorAll('#nav-order-list .order-item'));
    return items.map(li => li.dataset.href);
}
function readDisabledFromList() {
    const items = Array.from(document.querySelectorAll('#nav-order-list .order-item'));
    return items
        .filter(li => !li.querySelector('.enable-toggle').checked)
        .map(li => li.dataset.href);
}

// Panel open/close + sidebar click disabling
function openOrderPanel() {
    const panel = document.getElementById('nav-order-panel');
    populateOrderList();
    panel.classList.add('open');
    //panel.setAttribute('aria-hidden', 'false');

    // Apply clicks-disabled state to sidebar
    const nav = getNav();
    const clicksToggle = document.getElementById('nav-clicks-disabled');
    if (nav && clicksToggle.checked) nav.classList.add('nav-clicks-disabled');
}
function closeOrderPanel() {
    const panel = document.getElementById('nav-order-panel');
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');

    // Always restore clicks on close
    const nav = getNav();
    if (nav) nav.classList.remove('nav-clicks-disabled');
}

// Init UI (idempotent)
function initNavOrderUI({ onSave, onReset }) {
    const btn = document.getElementById('nav-order-btn');
    const panel = document.getElementById('nav-order-panel');
    const closeBtn = document.getElementById('nav-order-close');
    const saveBtn = document.getElementById('nav-order-save');
    const resetBtn = document.getElementById('nav-order-reset');
    const hideAllBtn = document.getElementById('nav-order-hide-all');
    const showAllBtn = document.getElementById('nav-order-show-all');
    const clicksToggle = document.getElementById('nav-clicks-disabled');

    if (btn.dataset.__wired === '1') return;
    btn.dataset.__wired = '1';

    btn.addEventListener('click', openOrderPanel);
    closeBtn.addEventListener('click', closeOrderPanel);
    panel.addEventListener('click', (e) => { if (e.target === panel) closeOrderPanel(); });

    hideAllBtn.addEventListener('click', () => {
        document.querySelectorAll('#nav-order-list .enable-toggle').forEach(cb => { cb.checked = false; cb.dispatchEvent(new Event('change')); });
    });
    showAllBtn.addEventListener('click', () => {
        document.querySelectorAll('#nav-order-list .enable-toggle').forEach(cb => { cb.checked = true; cb.dispatchEvent(new Event('change')); });
    });

    // Live apply/remove click disabling while panel open
    clicksToggle.addEventListener('change', () => {
        const nav = getNav();
        if (!nav) return;
        if (panel.classList.contains('open')) {
            nav.classList.toggle('nav-clicks-disabled', clicksToggle.checked);
        }
    });

    // Save: persist and rebuild
    saveBtn.addEventListener('click', () => {
        const prefs = {
            order: readOrderFromList(),
            disabled: readDisabledFromList(),
            clicksDisabled: !!document.getElementById('nav-clicks-disabled').checked,
        };
        savePrefs(prefs);
        closeOrderPanel();
        onSave?.(prefs);
    });

    // Reset: clear storage and rebuild with defaults merged with current
    resetBtn.addEventListener('click', () => {
        localStorage.removeItem(ORDER_KEY);
        localStorage.removeItem(LEGACY_KEY);
        const mergedDefaultOrder = mergeOrder(DEFAULT_ORDER, getCurrentHrefs());
        const prefs = { order: mergedDefaultOrder, disabled: DEFAULT_DISABLED, clicksDisabled: DEFAULT_CLICKS_DISABLED };
        savePrefs(prefs);
        closeOrderPanel();
        onReset?.(prefs);
    });
}
//initNavOrderUI();

//top hp/mp bar
(function () {
    /* STYLE INJECTION
  =============================== */
    if (!document.getElementById('topbar-hp-style')) {
        const style = document.createElement('style');
        style.id = 'topbar-hp-style';
        style.textContent = `
      .topbar-hp-wrapper {
        max-width: 1100px;
        margin: 0 auto;
        padding: 4px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        color: #f1f1f1;
        font-family: Arial, sans-serif;
      }

      .topbar-hp-wrapper .hp-text {
        white-space: nowrap;
        line-height: 0.8;
        font-size: 0.8em;
      }
      .res-fill {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        width: 0%;
        border-radius: 999px;
        transition: width .6s cubic-bezier(.2, .8, .2, 1);
      }
      .res-fill.mana {
        background: linear-gradient(90deg, rgba(80, 200, 255, .25), rgba(80, 200, 255, .95));
        box-shadow: 0 0 14px rgba(80, 200, 255, .35);
      }
      .res-fill.stamina {
        background: linear-gradient(90deg, rgba(80, 255, 140, .25), rgba(80, 255, 140, .95));
        box-shadow: 0 0 14px rgba(80, 255, 140, .35);
      }
      .res-bar {
        position: relative;
        flex: 1 1 auto;
        height: 18px;
        border-radius: 999px;
        overflow: hidden;
        background: linear-gradient(180deg, #22263a, #171929);
        border: 1px solid #2b2d44;
        box-shadow: inset 0 2px 6px rgba(0, 0, 0, .6), 0 4px 14px rgba(0, 0, 0, .45);
      }
    `;
        document.head.appendChild(style);
    }

    /* HELPERS
  =============================== */
    function parseCurrentMax(text) {
        const match = text.match(/([\d,]+)\s*\/\s*([\d,]+)/);
        if (!match) return null;

        return {
            current: parseInt(match[1].replace(/,/g, ''), 10),
            max: parseInt(match[2].replace(/,/g, ''), 10),
        };
    }

    // kind: 'hp' | 'mp'
    function createNativeBar(kind, percent) {
        const wrap = document.createElement('div');
        wrap.className = 'res-bar'; // native wrapper

        const inner = document.createElement('div');
        // The site snippet shows: <div class="res-fill stamina|mana" style="width: ...;"></div>
        inner.className = `res-fill ${kind === 'hp' ? 'stamina' : 'mana'}`;
        inner.style.width = `${Math.max(0, Math.min(100, percent))}%`;

        wrap.appendChild(inner);
        return wrap;
    }

    function tryReadHpMpFromCurrentPage() {
        // Example: on battle pages or other pages that already render these lines
        const nodes = document.querySelectorAll('.battle-card.player-card .hp-text');
        if (nodes && nodes.length) {
            return Array.from(nodes).map((n) => n.textContent.trim());
        }
        return null;
    }

    /* STEP 1: GET PLAYER HP / MP FROM ACTIVE WAVE
  =============================== */

    const ACTIVE_WAVE_URL = '/active_wave.php?gate=3&wave=3';

    async function getPlayerStats() {
        // 0) Prefer a local read if the current page already has HP/MP lines
        const local = tryReadHpMpFromCurrentPage();
        if (local && local.length) return local;

        // 1) Fetch to active wave: parse .player-resources
        try {
            const res = await fetch(ACTIVE_WAVE_URL, { credentials: 'include' });
            if (!res.ok) return null;

            const html = await res.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');

            const container = doc.querySelector('.player-resources');
            if (!container) return null;

            const rows = Array.from(container.querySelectorAll('.res-row'));
            if (!rows.length) return null;

            let hpLine = null;
            let mpLine = null;

            for (const row of rows) {
                const labelRaw = row.querySelector('.res-label')?.textContent || '';
                const label = labelRaw.trim().toLowerCase();
                const meta = row.querySelector('.res-meta')?.textContent?.trim();
                if (!meta) continue;

                if (label.includes('hp')) {
                    hpLine = `HP ${meta}`;
                } else if (label.includes('mana')) {
                    mpLine = `MP ${meta}`;
                }
            }

            const lines = [];
            if (hpLine) lines.push(hpLine);
            if (mpLine) lines.push(mpLine);

            return lines.length ? lines : null;
        } catch (_) {
            return null;
        }
    }

    /* STEP 2: RENDER TO TOPBAR
  =============================== */

    async function syncHpToTopbar() {
        const topbar = document.querySelector('.game-topbar');
        if (!topbar) return;

        let wrapper = topbar.querySelector('.topbar-hp-wrapper');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'topbar-hp-wrapper';
            topbar.appendChild(wrapper);
        }

        // If empty, show a very light placeholder immediately using native bars
        const renderPlaceholderIfEmpty = () => {
            if (wrapper.hasChildNodes()) return;

            const hpSkel = createNativeBar('hp', 0);
            const mpSkel = createNativeBar('mp', 0);

            const hpText = document.createElement('div');
            hpText.className = 'hp-text';
            hpText.textContent = 'HP —';

            const mpText = document.createElement('div');
            mpText.className = 'hp-text';
            mpText.textContent = 'MP —';

            wrapper.append(hpSkel, hpText, mpSkel, mpText);
        };

        renderPlaceholderIfEmpty();

        // Single-source player stats (local first, then active wave)
        const texts = await getPlayerStats();
        if (!texts) {
            // Keep placeholder; nothing to update
            return;
        }

        // Locate lines by keywords
        const hpText = texts.find((t) => /hp/i.test(t));
        const mpText = texts.find((t) => /mp|mana/i.test(t));

        wrapper.innerHTML = '';

        // HP
        if (hpText) {
            const hp = parseCurrentMax(hpText);
            if (hp && hp.max > 0) {
                wrapper.appendChild(createNativeBar('hp', (hp.current / hp.max) * 100));
            } else {
                wrapper.appendChild(createNativeBar('hp', 0));
            }
            const hpLine = document.createElement('div');
            hpLine.className = 'hp-text';
            hpLine.textContent = `💚 ${hpText.replace(/^HP\s*/i, '')} HP`;
            wrapper.appendChild(hpLine);
        } else {
            wrapper.appendChild(createNativeBar('hp', 0));
            const hpLine = document.createElement('div');
            hpLine.className = 'hp-text';
            hpLine.textContent = 'HP —';
            wrapper.appendChild(hpLine);
        }

        // MP
        if (mpText) {
            const mp = parseCurrentMax(mpText);
            if (mp && mp.max > 0) {
                wrapper.appendChild(createNativeBar('mp', (mp.current / mp.max) * 100));
            } else {
                wrapper.appendChild(createNativeBar('mp', 0));
            }
            const mpLine = document.createElement('div');
            mpLine.className = 'hp-text';
            mpLine.textContent = `💠 ${mpText.replace(/^MP\s*/i, '')} MP`;
            wrapper.appendChild(mpLine);
        } else {
            wrapper.appendChild(createNativeBar('mp', 0));
            const mpLine = document.createElement('div');
            mpLine.className = 'hp-text';
            mpLine.textContent = 'MP —';
            wrapper.appendChild(mpLine);
        }
    }

    /* STEP 3 (NEW): Bump space above container with the "⬅ Back" button
  =============================== */
    function adjustBackButtonSpacing(root = document) {
        // Normalize function to compare text without excessive whitespace
        const normalize = (s) => (s || '').replace(/\s+/g, ' ').trim();

        const candidates = root.querySelectorAll('button, .btn, [role="button"]');

        for (const el of candidates) {
            const txt = normalize(el.textContent);
            if (txt === '⬅ Back' || txt === '⬅ Back to wave') {
                // Find the nearest wrapping div that contains this button
                let hostDiv = el.closest('div');
                if (!hostDiv) continue;

                // Prevent repeatedly adding the margin
                if (!hostDiv.dataset.backMtApplied) {
                    hostDiv.style.marginTop = '20px';
                    hostDiv.dataset.backMtApplied = '1';
                }
            }
        }
    }

    /* START
  =============================== */
    // Run once at load
    (async () => {
        await syncHpToTopbar();
        adjustBackButtonSpacing(document);
    })();

    // Refresh after button-like actions
    if (!window.__hpSyncWired) {
        window.__hpSyncWired = true;

        const CLICK_REFRESH_DELAY = 250;

        const scheduleRefresh = () => {
            setTimeout(() => {
                try {
                    const p = (async () => {
                        await syncHpToTopbar();
                        // Re-apply spacing in case the DOM changed
                        adjustBackButtonSpacing(document);
                    })();
                    if (p && typeof p.catch === 'function') p.catch(() => {});
                } catch (_) {}
            }, CLICK_REFRESH_DELAY);
        };

        document.addEventListener(
            'click',
            (e) => {
                const target = e.target;
                if (!target) return;
                const btnLike = target.closest('button, .btn, [role="button"], .side-nav-item');
                if (!btnLike) return;
                scheduleRefresh();
            },
            true
        );

        document.addEventListener(
            'keydown',
            (e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                const target = e.target;
                if (!target) return;
                const roleBtn = target.closest('[role="button"]');
                if (!roleBtn) return;
                scheduleRefresh();
            },
            true
        );
    }
})();

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
//// ✅ URL exceptions for woobs.init()
//  if (isExceptionPage()) return true;

// to hide instajoin btn
(function () {
  'use strict';

  function hideAll() {
    document.querySelectorAll('.btn.gd-instant-join')
      .forEach(btn => btn.style.display = 'none');
  }

  hideAll();

  const obs = new MutationObserver(hideAll);
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();

//quest windown modal

//// Call once (recommended near script start)
function injectQuestModalStyles() {
  const css = `
  /* ===== Modal overlay ===== */
  #tm-quest-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.55);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 999999;
  }

  #tm-quest-modal-overlay.show {
    display: flex;
  }

  /* allow scrolling if content is tall */
  #tm-quest-modal {
    max-width: min(820px, 92vw);
    width: 760px;
    max-height: 85vh;
    overflow: auto;
  }

  /* ===== OUTER GLOW FRAME ===== */
  #tm-quest-modal .hud-outer {
    position: relative;
    width: 100%;
    padding: 6px;
    background: linear-gradient(90deg, #63e6ff, #9a7cff);
    clip-path: polygon(
      24px 0,
      calc(100% - 24px) 0,
      100% 24px,
      100% calc(100% - 24px),
      calc(100% - 24px) 100%,
      24px 100%,
      0 calc(100% - 24px),
      0 24px
    );
    box-shadow:
      0 0 18px rgba(120, 220, 255, 0.6),
      inset 0 0 12px rgba(255,255,255,0.15);
  }

  /* ===== SECOND RAIL ===== */
  #tm-quest-modal .hud-mid {
    width: 100%;
    height: 100%;
    padding: 4px;
    background: linear-gradient(180deg, #6bdcff, #7a8bff);
    clip-path: inherit;
  }

  /* ===== INNER TECH BORDER ===== */
  #tm-quest-modal .hud-inner {
    width: 100%;
    height: 100%;
    padding: 14px 14px 18px;
    background: linear-gradient(
      180deg,
      rgba(80,120,160,0.85),
      rgba(40,70,110,0.85)
    );
    clip-path: inherit;
    position: relative;
  }

  #tm-quest-modal .hud-inner::before {
    content: "";
    position: absolute;
    inset: 6px;
    border: 1px solid rgba(160,220,255,0.45);
    clip-path: inherit;
    pointer-events: none;
  }

  /* ===== CONTENT ===== */
  #tm-quest-modal .hud-content {
    color: #c8f6ff;
    font-family: "Segoe UI", Arial, sans-serif;
    text-shadow: 0 0 8px rgba(120,220,255,0.6);
  }

  #tm-quest-modal .tm-modal-title {
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 10px;
    letter-spacing: 0.5px;
  }

  #tm-quest-modal .tm-modal-row {
    font-size: 13px;
    line-height: 1.35;
    margin: 6px 0;
    color: rgba(200, 246, 255, 0.92);
  }

  #tm-quest-modal .tm-modal-label {
    color: rgba(255,255,255,0.75);
    margin-right: 6px;
    font-weight: 600;
  }

  #tm-quest-modal .tm-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 14px;
  }

  #tm-quest-modal .tm-close-btn {
    background: rgba(255,255,255,0.12);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.20);
    border-radius: 6px;
    padding: 7px 10px;
    cursor: pointer;
  }

  #tm-quest-modal .tm-close-btn:hover {
    background: rgba(255,255,255,0.18);
  }

  /* Make cards feel clickable */
  .sidebar-quest.tm-clickable {
    cursor: pointer;
    transition: transform .08s ease, box-shadow .08s ease;
  }
  .sidebar-quest.tm-clickable:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(0,0,0,.25);
  }
  `;
  if (typeof GM_addStyle === "function") GM_addStyle(css);
  else {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }
}

function ensureQuestModal() {
  if (document.getElementById('tm-quest-modal-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'tm-quest-modal-overlay';
  overlay.innerHTML = `
    <div id="tm-quest-modal" role="dialog" aria-modal="true">
      <div class="hud-outer">
        <div class="hud-mid">
          <div class="hud-inner">
            <div class="hud-content">
              <h2 class="tm-modal-title" id="tm-modal-title">Quest</h2>

              <div class="tm-modal-row" id="tm-modal-type"></div>
              <div class="tm-modal-row" id="tm-modal-desc"></div>
              <div class="tm-modal-row" id="tm-modal-reward"></div>
              <div class="tm-modal-row" id="tm-modal-progress"></div>
              <div class="tm-modal-row" id="tm-modal-time"></div>

              <div class="tm-modal-actions">
                <button class="tm-close-btn" id="tm-modal-close">Close</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close when clicking outside modal
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeQuestModal();
  });

  // Close button
  overlay.querySelector('#tm-modal-close').addEventListener('click', closeQuestModal);

  // ESC close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeQuestModal();
  });
}

function openQuestModal(data) {
  ensureQuestModal();

  const overlay = document.getElementById('tm-quest-modal-overlay');
  const setRow = (id, label, value) => {
    const el = document.getElementById(id);
    if (!value) { el.innerHTML = ''; return; }
    el.innerHTML = `<span class="tm-modal-label">${label}</span>${escapeHtml(value)}`;
  };

  document.getElementById('tm-modal-title').textContent = data.title || 'Quest';

  setRow('tm-modal-type', 'Type:', data.type);
  setRow('tm-modal-desc', 'Details:', data.description || data.details);
  setRow('tm-modal-reward', 'Reward:', data.reward);
  setRow('tm-modal-progress', 'Progress:', data.progress);
  setRow('tm-modal-time', 'Time Left:', data.timeLeft);

  overlay.classList.add('show');
}

function closeQuestModal() {
  const overlay = document.getElementById('tm-quest-modal-overlay');
  if (overlay) overlay.classList.remove('show');
}

//// Basic HTML escaping for safety
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

//join timed mobs from the top of the page
(function () {
  'use strict';

  /********************
   * Helpers
   ********************/
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();

  function isCurrentlyAlive(statusEl) {
    // Only show button if the status text includes "Currently alive"
    // (Handles emoji like ✅ and extra whitespace)
    const t = norm(statusEl?.textContent);
    return t.includes('currently alive');
  }

  function findMatchingMonsterCardByName(autoSummonName) {
    const target = norm(autoSummonName);
    if (!target) return null;

    // Match .monster-card[data-name="..."]
    const cards = document.querySelectorAll('.monster-card[data-name]');
    for (const card of cards) {
      const dn = norm(card.getAttribute('data-name'));
      if (dn === target) return card;
    }
    return null;
  }

  function clickJoinOrContinue(monsterCard) {
    if (!monsterCard) return false;

    // 1) Prefer join-btn (not joined yet)
    const joinBtn = monsterCard.querySelector('.join-btn');
    if (joinBtn) {
      monsterCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      joinBtn.click();
      return { ok: true, mode: 'join' };
    }

    // 2) Fallback continue-btn (already joined)
    const contBtn = monsterCard.querySelector('.continue-btn');
    if (contBtn) {
      monsterCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      contBtn.click();
      return { ok: true, mode: 'continue' };
    }

    return { ok: false, mode: null };
  }

  function injectStylesOnce() {
    if (document.getElementById('tm-summon-join-style')) return;

    const style = document.createElement('style');
    style.id = 'tm-summon-join-style';
    style.textContent = `
      .tm-summon-action-wrap{
        display:inline-flex;
        align-items:center;
        margin-left:10px;
      }
      .tm-summon-action-btn{
        padding:4px 10px;
        font-size:12px;
        border-radius:8px;
        border:1px solid rgba(255,255,255,.25);
        background:#2ecc71;
        color:#0b1a10;
        cursor:pointer;
        font-weight:700;
        line-height:1.2;
        user-select:none;
      }
      .tm-summon-action-btn:hover{ filter:brightness(1.06); }
      .tm-summon-action-btn:active{ transform:translateY(1px); }
      .tm-summon-action-btn[disabled]{ opacity:.55; cursor:not-allowed; }
    `;
    document.head.appendChild(style);
  }

  function enhance() {
    injectStylesOnce();

    const autoCards = document.querySelectorAll('.auto-summon-card');
    for (const autoCard of autoCards) {
      const nameEl = autoCard.querySelector('.auto-summon-name');
      const statusEl = autoCard.querySelector('.auto-summon-status');

      if (!nameEl || !statusEl) continue;

      // Filter: only if status says "Currently alive"
      if (!isCurrentlyAlive(statusEl)) continue;

      // Avoid duplicates
      if (autoCard.querySelector('.tm-summon-action-btn')) continue;

      const autoName = nameEl.textContent;
      const monsterCard = findMatchingMonsterCardByName(autoName);
      if (!monsterCard) continue;

      // Build button and insert next to status
      const wrap = document.createElement('span');
      wrap.className = 'tm-summon-action-wrap';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tm-summon-action-btn';
      btn.textContent = 'Join';

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        btn.disabled = true;

        const res = clickJoinOrContinue(monsterCard);
        if (!res.ok) {
          console.warn('[TM] No .join-btn or .continue-btn found for:', autoName);
          btn.disabled = false;
          return;
        }

        // Optional: update label depending on what was clicked
        btn.textContent = (res.mode === 'continue') ? 'Continue' : 'Join';

        // Re-enable after a short delay (in case UI updates)
        setTimeout(() => { btn.disabled = false; }, 1200);
      });

      wrap.appendChild(btn);
      statusEl.insertAdjacentElement('afterend', wrap);
    }
  }

  /********************
   * Run + Observe
   ********************/
  let t = null;
  const schedule = () => {
    clearTimeout(t);
    t = setTimeout(enhance, 120);
  };

  schedule();

  const obs = new MutationObserver(schedule);
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();

//go top
(function() {
    'use strict';

    // Create button
    const btn = document.createElement("div");
    btn.innerHTML = "↑"; // You can change this (e.g., "TOP")
    btn.id = "tm-scroll-top-btn";

    // Add styles
    Object.assign(btn.style, {
        position: "fixed",
        left: "65px",
        bottom: "14px",
        zIndex: "10050",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "46px",
        height: "46px",
        borderRadius: "50%",
        background: "#2a2b3a",
        color: "#fff",
        border: "1px solid #2b2d44",
        boxShadow: "0 8px 24px rgba(0, 0, 0, .35)",
        cursor: "pointer",
        fontSize: "20px",
        lineHeight: "1",
        fontWeight: "700",
        userSelect: "none"
    });

    // Hide until scroll happens
    btn.style.opacity = "0";
    btn.style.transition = "opacity 0.3s";

    // Scroll action
    btn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Show/hide on scroll
    window.addEventListener("scroll", () => {
        if (window.scrollY > 200) {
            btn.style.opacity = "1";
        } else {
            btn.style.opacity = "0";
        }
    });

    document.body.appendChild(btn);
})();

//dungeon mobs damage dealt


(function () {
  'use strict';

  /** Utility: sleep */
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  /** Get instance_id from current URL (fallback to link if missing) */
  function getInstanceIdFromPage() {
    const url = new URL(window.location.href);
    const iid = url.searchParams.get('instance_id');
    return iid || '';
  }

  /** Fetch HTML text from URL using GM_xmlhttpRequest (with cookies); fallback to fetch */
  function fetchHtml(url) {
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest === 'function') {
        GM_xmlhttpRequest({
          method: 'GET',
          url,
          // By default Tampermonkey sends cookies for same-origin. Ensure not anonymous.
          anonymous: false,
          onload: (resp) => {
            if (resp.status >= 200 && resp.status < 300) {
              resolve(resp.responseText);
            } else {
              reject(new Error(`HTTP ${resp.status}: ${url}`));
            }
          },
          onerror: (err) => reject(err),
          ontimeout: () => reject(new Error(`Timeout: ${url}`)),
        });
      } else {
        // Fallback
        fetch(url, { credentials: 'include' })
          .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}: ${url}`))))
          .then(resolve)
          .catch(reject);
      }
    });
  }

  /** Parse damage from battle page HTML */
  function parseDamageValue(htmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const dmgEl = doc.querySelector('#yourDamageValue');
    if (!dmgEl) return null;
    return dmgEl.textContent.trim();
  }

  /** Create the stat pill node */
  function createDamagePill(damageText) {
    const pill = document.createElement('div');
    pill.className = 'statpill';
    pill.title = 'damage dealt';

    const spanIcon = document.createElement('span');
    spanIcon.className = 'icon';
    spanIcon.textContent = '⚔️';

    const spanK = document.createElement('span');
    spanK.className = 'k';
    spanK.textContent = 'dmg';

    const spanV = document.createElement('span');
    spanV.className = 'v';
    spanV.textContent = damageText ?? '—';

    pill.appendChild(spanIcon);
    pill.appendChild(spanK);
    pill.appendChild(spanV);
    return pill;
  }

  /** Extract dgmid from a .mon element */
  function getDgmidFromMon(monEl) {
    // Prefer the checkbox (if present) since it's a clean number
    const checkbox = monEl.querySelector('input.wave-addon-pick-monster[data-mid]');
    if (checkbox && checkbox.dataset.mid) return checkbox.dataset.mid;

    // Fallback: parse from Fight button link
    const fightA = monEl.querySelector('a.btn.btn-danger.auto-button[href]');
    if (fightA) {
      try {
        const u = new URL(fightA.href, window.location.origin);
        const v = u.searchParams.get('dgmid');
        if (v) return v;
      } catch (_) {}
      // If href is relative or encoded weirdly, try getAttribute raw and coerce
      const raw = fightA.getAttribute('href') || '';
      const match = raw.match(/[?&]dgmid=(\d+)/);
      if (match) return match[1];
    }
    return null;
  }

  /** Extract instance_id from mon link if page param missing */
  function getInstanceIdFromMon(monEl) {
    const fightA = monEl.querySelector('a.btn.btn-danger.auto-button[href]');
    if (fightA) {
      try {
        const u = new URL(fightA.href, window.location.origin);
        const v = u.searchParams.get('instance_id');
        if (v) return v;
      } catch (_) {}
      const raw = fightA.getAttribute('href') || '';
      const match = raw.match(/[?&]instance_id=(\d+)/);
      if (match) return match[1];
    }
    return null;
  }

  /** Ensure we only process each .mon once */
  const processed = new WeakSet();

  async function processMon(monEl, pageInstanceId) {
    if (processed.has(monEl)) return;
    processed.add(monEl);

    const statRow = monEl.querySelector('.statrow');
    if (!statRow) return; // nothing to append to

    // Prevent duplicates if script reruns
    const already = statRow.querySelector('.statpill[title="damage dealt"]');
    if (already) return;

    const dgmid = getDgmidFromMon(monEl);
    if (!dgmid) {
      // Append a placeholder pill if no dgmid found
      statRow.appendChild(createDamagePill('—'));
      return;
    }

    let instanceId = pageInstanceId || getInstanceIdFromMon(monEl) || '';
    if (!instanceId) instanceId = getInstanceIdFromMon(monEl) || '';

    // As a final fallback, try to read from current page again
    if (!instanceId) instanceId = getInstanceIdFromPage() || '';

    if (!instanceId) {
      statRow.appendChild(createDamagePill('—'));
      return;
    }

    const battleUrl = `https://demonicscans.org/battle.php?dgmid=${encodeURIComponent(dgmid)}&instance_id=${encodeURIComponent(instanceId)}`;

    // Add an immediate placeholder to avoid layout shifts, then update
    const pill = createDamagePill('…');
    statRow.appendChild(pill);

    try {
      // Gentle pacing to avoid hammering
      await sleep(80 + Math.random() * 120);

      const html = await fetchHtml(battleUrl);
      const dmg = parseDamageValue(html) || '—';

      const vEl = pill.querySelector('.v');
      if (vEl) vEl.textContent = dmg;
    } catch (e) {
      const vEl = pill.querySelector('.v');
      if (vEl) vEl.textContent = '—';
      // Optional: console.error(e);
    }
  }

  async function processAll() {
    const pageInstanceId = getInstanceIdFromPage();
    const mons = Array.from(document.querySelectorAll('div.mon'));
    // Sequential to keep it light on the server; you can parallelize if needed
    for (const mon of mons) {
      // eslint-disable-next-line no-await-in-loop
      await processMon(mon, pageInstanceId);
    }
  }

  function setupObserver() {
    const root = document.body;
    const mo = new MutationObserver((muts) => {
      let found = false;
      for (const m of muts) {
        for (const n of m.addedNodes || []) {
          if (!(n instanceof HTMLElement)) continue;
          if (n.matches && n.matches('div.mon')) {
            found = true;
            processMon(n, getInstanceIdFromPage());
          } else {
            const mons = n.querySelectorAll ? n.querySelectorAll('div.mon') : [];
            if (mons.length) {
              found = true;
              mons.forEach((el) => processMon(el, getInstanceIdFromPage()));
            }
          }
        }
      }
      // If many nodes are added without direct .mon, a fallback can be used
      if (!found) {
        // no-op
      }
    });
    mo.observe(root, { childList: true, subtree: true });
  }

  // Kickoff
  (async () => {
    await processAll();
    setupObserver();
  })();
})();


