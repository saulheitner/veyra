// ==UserScript==
// @name         Veyra Visual Addon
// @namespace    https://github.com/Daregon-sh/veyra
// @version      2.17.3
// @downloadURL  https://raw.githubusercontent.com/Daregon-sh/veyra/refs/heads/codes/Veyra%20Visual%20Addon.js
// @updateURL    https://raw.githubusercontent.com/Daregon-sh/veyra/refs/heads/codes/Veyra%20Visual%20Addon.js
// @description  sidebars visual integration
// @author       Daregon
// @match        https://demonicscans.org/*
// @grant        GM_xmlhttpRequest
// @connect      demonicscans.org
// @license MIT
// ==/UserScript==

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

/* ============================
   Veyra Visual Addon — Feature Flags + Control Panel
   (paste near top of file, after the userscript header)
============================ */
(function() {

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

    const FLAGS_KEY = 'VV:featureFlags:v1';

    // Toggleable features (keys must be stable)

    /* --- Add this helper near the top of the panel IIFE --- */
    function detectWaveEnhancedControls() {
        // 1) DOM anchors often provided by “Wave Enhanced Controls”
        const hasFilterContainer = !!document.getElementById('wave-addon-monster-filter-container'); // used by your dropdown enhancer
        const hasAutoHuntPanel = !!document.getElementById('wave-addon-auto-hunt-controls'); // used by your autohunt collapse enhancer

        // 2) Optional global signals if that script exposes any (keep conservative)
        const knownGlobals = [
            'WaveEnhancedControls', // hypothetical namespace
            '__waveAddonReady', // hypothetical ready flag
        ];
        const hasGlobal = knownGlobals.some(k => typeof window[k] !== 'undefined');

        return hasFilterContainer || hasAutoHuntPanel || hasGlobal;
    }

    /* --- Update your FEATURES array --- */
    const FEATURES = [{
            key: 'modifySideNav',
            label: 'Sidebar overhaul'
        },
        {key: 'top_hp_mp',        label: 'Top HP/MP bar'},
        {key: 'quest_modal',      label: 'Quest window modal'},
        {key: 'reduce_cards',     label: 'Reduce monster cards size'},
        {key: 'modMonsterCards',  label: 'Monster card: DMG / EXP/DMG / EXP gained'},
        {key: 'multiForge',       label: 'forge multiple items at a time'},
        {key: 'loot_summary',     label: 'Loot Summary module'},
        {key: 'dungeon_dmg_pills',label: 'Dungeon mobs — Damage dealt pill'},
        {key: 'dungeon_pvp_match',label: 'Dungeon PvP — Match Collapser'},
        {key: 'cube_dung_leaderb',label: 'Cube Dungeon — combined leaderboard'},
        {key: 'army_damage_dealt',label: 'Shadow army — Damage dealt pill'},
        {key: 'pvp_hp_bar',       label: 'PvP HP Bar'},
        {key: 'qol_revamp',       label: 'Modified QoL Section'},
        {key: 'boss_spawn_alert', label: 'Boss spawn popup alert' },
        {key: 'custom_auto_farm', label: 'Custom Auto Farm' },


        // { key: 'membersInRed',         label: 'Highlight guild members in red' },

        // 🔒 These two are hidden unless Wave Enhanced Controls is detected
        {key: 'mob_filter_dropdown',label: 'Compress monster filter to dropdown',hiddenUnless: 'waveEnhanced'},
        {key: 'autohunt_collapse',  label: 'Collapse AutoHunt',hiddenUnless: 'waveEnhanced'},
    ];

    // Defaults = ON
    const DEFAULTS = FEATURES.reduce((acc, f) => (acc[f.key] = true, acc), {});

    function loadFlags() {
        try {
            const raw = localStorage.getItem(FLAGS_KEY);
            const obj = raw ? JSON.parse(raw) : {};
            // fill any new keys with defaults
            return {
                ...DEFAULTS,
                ...obj
            };
        } catch {
            return {
                ...DEFAULTS
            };
        }
    }

    function saveFlags(next) {
        localStorage.setItem(FLAGS_KEY, JSON.stringify(next));
    }

    function isOn(key) {
        const flags = loadFlags();
        return !!flags[key];
    }

    function setFlag(key, val) {
        const flags = loadFlags();
        flags[key] = !!val;
        saveFlags(flags);
    }

    function setAll(val) {
        const flags = loadFlags();
        for (const k of Object.keys(flags)) flags[k] = !!val;
        saveFlags(flags);
    }

    // Quick helper a module can call at the very top:
    //   if (!vv.isOn('top_hp_mp')) return;
    window.vv = window.vv || {};
    window.vv.isOn = isOn;

    /* ---------- Panel UI ---------- */
    function injectStylesOnce() {
        if (document.getElementById('vv-flags-style')) return;
        const css = `
      #vv-flags-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);
        display:none;align-items:center;justify-content:center;z-index:2147483000;}
      #vv-flags-overlay.show{display:flex;}
      #vv-flags{background:#1a1b25;border:1px solid #2b2d44;border-radius:12px;
        width:min(440px,92vw);max-height:85vh;overflow:auto;padding:14px;color:#d5d9f5;
        box-shadow:0 16px 40px rgba(0,0,0,.5);font:13px/1.4 system-ui,Segoe UI,Roboto,Arial;}
      #vv-flags h3{margin:0 0 10px 0;font-size:16px}
      .vv-row{display:flex;align-items:center;gap:10px;padding:6px 8px;border-radius:8px}
      .vv-row:hover{background:rgba(255,255,255,0.04)}
      .vv-spread{display:flex;justify-content:space-between;align-items:center;gap:8px}
      .vv-btn{padding:8px 12px;border-radius:8px;border:1px solid #3a3f63;background:#2f3a56;color:#fff;cursor:pointer}
      .vv-btn.secondary{background:#2a2a40;border-color:#444}
      .vv-btn.danger{background:#8b2c2c;border-color:#a33737}
      .vv-footer{display:flex;justify-content:space-between;gap:8px;margin-top:10px}
      .vv-tag{font-size:11px;color:#aab2f5;}
      .vv-reload{margin-left:auto;font-size:12px;opacity:.9}
      .vv-switch{inline-size:42px;block-size:22px;background:#3a3f63;border-radius:999px;position:relative;cursor:pointer;border:1px solid #2b2d44}
      .vv-switch[data-on="1"]{background:#2ecc71}
      .vv-knob{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .15s}
      .vv-switch[data-on="1"] .vv-knob{left:22px}

/* Default: hidden everywhere */
.vv-open-btn {
  position: fixed;
  bottom: 17px;
  right: 230px;
  z-index: 10001;
  width: 45px;
  padding: 10px 10px;
  border-radius: 12px;
  border: 1px solid #2f324d;
  background: #24263a;
  color: #d5d9f5;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0,0,0,.35);
  user-select: none;
  display: none; /* hide by default */
}

/* Desktop/Laptop only: fine pointer + hover, and a bit of width */
@media (hover: hover) and (pointer: fine) and (min-width: 992px) {
  .vv-open-btn { display: inline-flex; align-items: center; justify-content: center;}
}

    `.trim();
        const style = document.createElement('style');
        style.id = 'vv-flags-style';
        style.textContent = css;
        document.head.appendChild(style);
    }

    function openPanel() {
        injectStylesOnce();
        let overlay = document.getElementById('vv-flags-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'vv-flags-overlay';
            overlay.innerHTML = `<div id="vv-flags" role="dialog" aria-modal="true" aria-label="Veyra Addon Controls"></div>`;
            document.body.appendChild(overlay);
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closePanel();
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closePanel();
            });
        }
        const box = overlay.querySelector('#vv-flags');
        box.innerHTML = ''; // rebuild each time from storage
        const h = document.createElement('h3');
        h.textContent = '🧩 Veyra Addon Controls';
        const hint = document.createElement('div');
        hint.className = 'vv-tag';
        hint.textContent = 'Toggles are saved instantly. Most changes apply after reload.';
        const list = document.createElement('div');

        const flags = loadFlags();

        const waveDetected = detectWaveEnhancedControls();
        // Filter features that require Wave Enhanced Controls
        const visibleFeatures = FEATURES.filter(f => {
            if (f.hiddenUnless === 'waveEnhanced') return waveDetected;
            return true;
        });

        for (const f of visibleFeatures) {

            const row = document.createElement('div');
            row.className = 'vv-row vv-spread';

            const label = document.createElement('div');
            label.textContent = f.label;

            const sw = document.createElement('div');
            sw.className = 'vv-switch';
            sw.dataset.on = flags[f.key] ? '1' : '0';
            sw.setAttribute('role', 'switch');
            sw.setAttribute('aria-checked', flags[f.key] ? 'true' : 'false');
            sw.title = flags[f.key] ? 'On' : 'Off';

            const knob = document.createElement('div');
            knob.className = 'vv-knob';
            sw.appendChild(knob);
            sw.addEventListener('click', () => {
                const now = sw.dataset.on === '1';
                setFlag(f.key, !now);
                sw.dataset.on = !now ? '1' : '0';
                sw.setAttribute('aria-checked', !now ? 'true' : 'false');
                reloadNote.style.display = '';
            });

            row.append(label, sw);
            list.appendChild(row);
        }

        const footer = document.createElement('div');
        footer.className = 'vv-footer';
        const leftBtns = document.createElement('div');
        const btnAllOn = document.createElement('button');
        btnAllOn.className = 'vv-btn secondary';
        btnAllOn.textContent = 'Enable all';
        btnAllOn.onclick = () => {
            setAll(true);
            openPanel();
        };
        const btnAllOff = document.createElement('button');
        btnAllOff.className = 'vv-btn danger';
        btnAllOff.textContent = 'Disable all';
        btnAllOff.onclick = () => {
            setAll(false);
            openPanel();
        };
        leftBtns.append(btnAllOn, btnAllOff);

        const rightBtns = document.createElement('div');
        const reloadNote = document.createElement('span');
        reloadNote.className = 'vv-reload';
        reloadNote.textContent = 'Reload to apply.';
        reloadNote.style.display = 'none';
        const btnReload = document.createElement('button');
        btnReload.className = 'vv-btn';
        btnReload.textContent = 'Reload now';
        btnReload.onclick = () => location.reload();

        rightBtns.append(reloadNote, btnReload);
        footer.append(leftBtns, rightBtns);

        box.append(h, hint, list, footer);
        overlay.classList.add('show');
    }

    function closePanel() {
        document.getElementById('vv-flags-overlay')?.classList.remove('show');
    }

    // Expose for other code / menu commands
    window.vv.openControls = openPanel;

    // Launcher button (floating). Also, if your sidebar exists, we’ll add a link there too.
    function mountOpeners() {
        injectStylesOnce();
        // Floating button
        if (!document.getElementById('vv-open-btn')) {
            const b = document.createElement('button');
            b.id = 'vv-open-btn';
            b.className = 'vv-open-btn';
            b.type = 'button';
            b.textContent = '🧩';
            b.onclick = openPanel;
            document.body.appendChild(b);
        }
        // Sidebar link (when .side-nav is ready)
        const trySidebar = () => {
            const nav = document.querySelector('.side-nav');
            if (!nav) return;
            if (document.getElementById('vv-side-controls')) return;
            const a = document.createElement('a');
            a.id = 'vv-side-controls';
            a.href = '#';
            a.className = 'side-nav-settings';
            a.textContent = '🧩 Addon Controls';
            a.onclick = (e) => {
                e.preventDefault();
                openPanel();
            };
            nav.appendChild(a);
        };
        trySidebar();
        const obs = new MutationObserver(trySidebar);
        obs.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mountOpeners, {
            once: true
        });
    } else {
        mountOpeners();
    }
})();

window.addEventListener('load', () => {

    ['.side-drawer', '#battleDrawer', '#qsDrawer'].forEach(selector => {
        const el = document.querySelector(selector);
        if (el) {
            el.style.zIndex = '100051';
        } else {
            console.warn(`[ZIndex Modifier] Element not found for selector: ${selector}`);
        }
    });


    const style = document.createElement('style');
    style.textContent = `
.extract-btn {
    all: unset;
    box-sizing: border-box;
    width: 100%;
    padding: 10px 16px;

    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    font-weight: 600;
    font-size: 14px;
    letter-spacing: 0.2px;
    color: #eaf3ff;

    border-radius: 8px;
    cursor: pointer;

    background:
        linear-gradient(180deg, rgba(35,64,86,.6), rgba(18,31,43,.9)),
        radial-gradient(circle at top, rgba(90,160,255,.25), transparent 60%);
    border: 1px solid rgba(120,180,255,.35);

    box-shadow:
        inset 0 0 0 1px rgba(255,255,255,.05),
        0 0 12px rgba(80,140,255,.25);

    transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease;
}



.extract-btn:hover {
    transform: translateY(-1px);
    box-shadow:
        inset 0 0 0 1px rgba(255,255,255,.08),
        0 0 16px rgba(100,170,255,.45);
}

.extract-btn:active {
    transform: translateY(0);
    box-shadow: inset 0 0 6px rgba(0,0,0,.6);
}

.extract-btn[disabled] {
    opacity: .55;
    cursor: not-allowed;
}

.extract-btn .icon {
    font-size: 13px;
    opacity: .9;
}
.shadow-modal {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
}

.shadow-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,.75);
}

.shadow-box {
    position: relative;
    background: radial-gradient(circle at top, #1c1532, #0b0a14);
    border-radius: 14px;
    padding: 24px;
    color: #fff;
    width: 420px;
    box-shadow: 0 0 50px #6f4cff55;
}

.shadow-box h2 {
    margin: 0 0 8px;
}

.shadow-rank {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 999px;
    background: #2c244a;
    margin-bottom: 12px;
}

.shadow-body {
    display: flex;
    gap: 14px;
}

.shadow-body img {
    width: 120px;
    border-radius: 10px;
}

.shadow-stats div {
    display: flex;
    justify-content: space-between;
    gap: 10px;
}

.shadow-close {
    position: absolute;
    top: 8px;
    right: 10px;
    background: none;
    border: none;
    color: #fff;
    font-size: 20px;
    cursor: pointer;
}
.shadow-modal.error .shadow-box {
    background:
        radial-gradient(circle at top, rgba(120,40,40,.35), transparent 60%),
        linear-gradient(180deg, #1a0f14, #0b0a12);
    border: 1px solid rgba(255,90,90,.35);
    box-shadow: 0 0 40px rgba(255,60,60,.25);
}

.shadow-tag {
    font-size: 11px;
    letter-spacing: 1.2px;
    font-weight: 700;
    color: #ff6a6a;
    margin-bottom: 6px;
}

.error-main {
    margin: 10px 0;
    font-size: 14px;
}

.error-flavor {
    margin-top: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    background: rgba(0,0,0,.35);
    font-size: 12px;
    color: #c9c9c9;
}

    .highlightSelfMark {
      border: 2px solid gold;
      box-shadow: 0 0 10px rgba(255, 215, 0, 0.7);
      background-color: rgba(255, 250, 205, 0.4); /* light golden */
    }

    .stage.table-mode .nodeTableView{
      scrollbar-width: none;
    }
    .side {
      overflow-y: scroll;
      scrollbar-width: none;
    }

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

function initOrderPanel() {
    const navOrder = document.createElement('div');
    navOrder.id = "nav-order-panel"
    navOrder.innerHTML = `
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
    (function() {
        if (!vv.isOn('modifySideNav')) return;
        // existing code...
    })();
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
        appendCustomItemOnce('/shadow_army.php', '☠', 'Shadow Army');
        // REMOVED: appendCustomItemOnce('/legendary_forge.php', '🔥', 'Legendary Forge');

        // ------------------------------
        // 2) Read prefs from localStorage (unchanged)
        // ------------------------------
        const {
            order,
            disabled
        } = loadPrefs();
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

            const target = anchor.parentElement?.classList?.contains('side-nav-flex') ?
                anchor.parentElement :
                anchor;

            switch (where) {
                case 'before':
                    target.before(el);
                    break;
                case 'after':
                    target.after(el);
                    break;
                case 'prepend':
                    target.prepend(el);
                    break;
                case 'append':
                    target.append(el);
                    break;
                default:
                    target.after(el);
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
        const pvpSectionHTML = `
      <div style="margin-left: 15px; padding: 6px; background: rgba(30, 30, 46, 0.5); border-radius: 4px; border-left: 2px solid #9f5ae5;">
        <a style="text-decoration: none; color:white;" href="/colosseum.php">
		  <span class="side-icon">🏟️</span>
          <span class="side-label">Colosseum</span>
        </a>
      </div>
    `;

        // MERCHANT — Black merchant
        const merchantSectionHTML = `
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
                    e.preventDefault(); // <-- BLOCK NAVIGATION
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
        const placements = [{
                id: 'game-expanded',
                className: 'upgrade-section',
                html: gameSectionHTML,
                anchorHref: '/game_dash.php',
                where: 'after'
            },
            {
                id: 'guild-expanded',
                className: 'upgrade-section',
                html: guildSectionHTML,
                anchorHref: '/guild_dash.php',
                where: 'after'
            },
            {
                id: 'battle-pass-expanded',
                className: 'upgrade-section',
                html: '',
                anchorHref: '/battle_pass.php',
                where: 'after'
            },
            {
                id: 'quest-expanded',
                className: 'upgrade-section',
                html: '',
                anchorHref: '/adventurers_guild.php',
                where: 'after'
            },
            {
                id: 'stats-expanded',
                className: 'upgrade-section',
                html: statsSectionHTML,
                anchorHref: '/stats.php',
                where: 'after'
            },
            {
                id: 'pvp-expanded',
                className: 'upgrade-section',
                html: pvpSectionHTML,
                anchorHref: '/pvp.php',
                where: 'after'
            },
            {
                id: 'merchant-expanded',
                className: 'upgrade-section',
                html: merchantSectionHTML,
                anchorHref: '/merchant.php',
                where: 'after'
            },
            {
                id: 'blacksmith-expanded',
                className: 'upgrade-section',
                html: artisansSectionHTML,
                anchorHref: '/blacksmith.php',
                where: 'after'
            },
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
                    JSON.stringify({
                        ts: Date.now(),
                        data
                    })
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

            const resp = await fetch('/weekly.php', {
                credentials: 'same-origin'
            });
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

            const data = {
                rankText,
                damageText
            };
            setCachedWeekly(data);
            return data;
        }

        /**
         * Update the small card:
         *  - Append "Ranking #XX" to .small-level (idempotent / replace if exists)
         *  - Insert/update a sibling div under it with the damage text
         */
        function updateSmallUserMeta({
            rankText,
            damageText
        }) {
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
(() => {
    if (!vv?.isOn?.('multiForge')) return;

    const DELAY = 300;
    const RUN_LABEL_DEFAULT = 'Forge x times';

    // ---------- Helpers ----------
    const getCard = (form) => form.closest('.card') || form;

    const selectReqQtyNodes = (form) => {
        // Requirements live under the card, not inside the form
        const card = getCard(form);
        return card.querySelectorAll('.req .qty');
    };

    const hasAnyBad = (form) => {
        const card = getCard(form);
        return !!card.querySelector('.qty.bad');
    };

    // Bullet-proof max-forge calculator for strings like "30899/100"
    const computeMaxForges = (form) => {
        const qtyNodes = selectReqQtyNodes(form);
        if (!qtyNodes.length) return 0;

        let maxForges = Infinity;

        for (const q of qtyNodes) {
            // Combine all text under .qty (handles nested spans)
            let raw = q.textContent.trim();
            // Keep only digits and slash
            raw = raw.replace(/[^0-9/]/g, '');
            const parts = raw.split('/');

            if (parts.length !== 2) return 0;

            const have = parseInt(parts[0], 10);
            const need = parseInt(parts[1], 10);

            if (!Number.isFinite(have) || !Number.isFinite(need) || need <= 0) {
                return 0;
            }

            const possible = Math.floor(have / need);
            maxForges = Math.min(maxForges, possible);
        }

        return Number.isFinite(maxForges) && maxForges >= 0 ? maxForges : 0;
    };

    // Create or reuse the multi-forge UI on a form
    const ensureUI = (form) => {
        // Hide original single-forge button if present
        const forgeBtn = form.querySelector('.forge-btn');
        if (forgeBtn) forgeBtn.style.display = 'none';

        // Reuse existing controls if they exist (from a prior run)
        let box = form.querySelector('.forge-times-box');
        let runBtn = Array.from(form.querySelectorAll('button[type="button"]'))
            .find(b => /forge/i.test(b.textContent || '') && !/stop/i.test(b.textContent || ''));
        let stopBtn = Array.from(form.querySelectorAll('button[type="button"]'))
            .find(b => /stop/i.test(b.textContent || ''));

        // Create if missing
        if (!box) {
            box = document.createElement('input');
            box.type = 'number';
            box.min = '1';
            box.placeholder = 'Times';
            box.className = 'forge-times-box';
            box.style.cssText = `
        width:70px;
        padding:8px 12px;
        background:#333;
        border:1px solid #333;
        border-radius:8px;
        color:#fff;
        font-size:12px;
        font-family:inherit;
        box-shadow:0 6px 18px rgba(0,0,0,.6);
        margin-right:6px;
      `;
            form.appendChild(box);
        }

        if (!runBtn) {
            runBtn = document.createElement('button');
            runBtn.type = 'button';
            runBtn.textContent = RUN_LABEL_DEFAULT;
            runBtn.style.cssText = `
        flex:1;
        background:var(--accent);
        color:#111;
        border:none;
        border-radius:10px;
        padding:10px 12px;
        font-weight:700;
        cursor:pointer;
        transition:filter .2s ease, transform .05s ease-in-out;
      `;
            form.appendChild(runBtn);
        }

        if (!stopBtn) {
            stopBtn = document.createElement('button');
            stopBtn.type = 'button';
            stopBtn.textContent = 'Stop';
            stopBtn.style.cssText = `
        margin-left:4px;
        padding:10px 12px;
        border-radius:10px;
        border:none;
        cursor:pointer;
        display:none;
      `;
            form.appendChild(stopBtn);
        }

        // Button press affordance
        runBtn.onmousedown = () => runBtn.style.transform = 'scale(.97)';
        runBtn.onmouseup = () => runBtn.style.transform = '';
        runBtn.onmouseleave = () => runBtn.style.transform = '';

        // Hidden live region for polite announcements
        let srLive = form.querySelector('[aria-live="polite"][aria-atomic="true"]');
        if (!srLive) {
            srLive = document.createElement('div');
            srLive.setAttribute('aria-live', 'polite');
            srLive.setAttribute('aria-atomic', 'true');
            srLive.style.cssText = 'position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden;';
            form.appendChild(srLive);
        }

        return {
            box,
            runBtn,
            stopBtn,
            srLive
        };
    };

    // Update ARIA, input max, and enabled/disabled states based on requirements
    const refreshEligibility = (form, ui) => {
        const {
            box,
            runBtn
        } = ui;

        if (hasAnyBad(form)) {
            runBtn.disabled = true;
            box.disabled = true;
            box.removeAttribute('max');

            box.setAttribute('aria-label', 'Cannot forge: missing materials');
            box.setAttribute('title', 'Cannot forge: missing materials');

            runBtn.textContent = 'Missing materials';
            runBtn.style.filter = 'grayscale(1)';
            runBtn.style.cursor = 'not-allowed';
            return {
                eligible: false,
                maxForges: 0
            };
        }

        const maxForges = computeMaxForges(form);

        runBtn.disabled = false;
        box.disabled = false;
        runBtn.style.filter = '';
        runBtn.style.cursor = 'pointer';
        if (!/Forging /.test(runBtn.textContent)) {
            runBtn.textContent = RUN_LABEL_DEFAULT;
        }

        box.setAttribute('aria-label', `Maximum possible forges: ${maxForges}`);
        box.setAttribute('title', `Max: ${maxForges}`);
        // Constrain the input (at least 1)
        box.setAttribute('max', String(Math.max(1, maxForges)));

        // Clamp current value if it exceeds max
        const v = parseInt(box.value || '0', 10);
        if (Number.isFinite(v) && v > maxForges) {
            box.value = String(maxForges);
        }

        return {
            eligible: maxForges > 0,
            maxForges
        };
    };

    const setCountdownLabel = (btn, remaining) => {
        btn.textContent = `Forging ${remaining}`;
    };
    const resetRunBtnLabel = (btn) => {
        btn.textContent = RUN_LABEL_DEFAULT;
    };

    // ---------- Main ----------
    document.querySelectorAll('.forge form').forEach(form => {
        const ui = ensureUI(form);

        // Initial eligibility & ARIA update
        let {
            eligible,
            maxForges
        } = refreshEligibility(form, ui);

        const card = getCard(form);

        // FIX: Observe ONLY the requirements container, not the entire card, to avoid feedback loop
        const reqRoot = card.querySelector('.req') || card;

        // Avoid rebinding observers if script runs multiple times
        if (!reqRoot.dataset.mfObserved) {
            reqRoot.dataset.mfObserved = '1';

            // FIX: Debounce + pause observer during UI updates
            let updateScheduled = false;
            const mo = new MutationObserver(() => {
                if (updateScheduled) return;
                updateScheduled = true;
                requestAnimationFrame(() => {
                    updateScheduled = false;

                    // Temporarily stop observing while we mutate the DOM (prevents feedback)
                    mo.disconnect(); // FIX: pause
                    try {
                        const r = refreshEligibility(form, ui);
                        const changed = (r.eligible !== eligible) || (r.maxForges !== maxForges);
                        eligible = r.eligible;
                        maxForges = r.maxForges;
                        if (changed) {
                            ui.srLive.textContent = eligible ?
                                `Maximum possible forges updated to ${maxForges}` :
                                'Forging is not available due to missing materials';
                        }
                    } finally {
                        // Reattach to reqRoot only
                        mo.observe(reqRoot, {
                            subtree: true,
                            childList: true,
                            characterData: true
                        });
                    }
                });
            });

            mo.observe(reqRoot, {
                subtree: true,
                childList: true,
                characterData: true
            });
        }

        // Avoid rebinding if this script runs multiple times
        if (ui.runBtn.dataset.mfBound === '1') return;
        ui.runBtn.dataset.mfBound = '1';

        let stop = false;

        ui.stopBtn.onclick = () => {
            stop = true;
            ui.stopBtn.style.display = 'none';
        };

        ui.runBtn.onclick = async () => {
            // Recompute right before running
            ({
                eligible,
                maxForges
            } = refreshEligibility(form, ui));
            if (!eligible || maxForges <= 0) {
                alert('Missing or invalid materials.');
                return;
            }

            let TIMES = parseInt(ui.box.value, 10);
            if (!Number.isFinite(TIMES) || TIMES < 1) {
                alert('Enter a valid number');
                return;
            }

            if (TIMES > maxForges) {
                TIMES = maxForges;
                ui.box.value = String(TIMES);
                ui.srLive.textContent = `Clamped to maximum possible forges: ${TIMES}`;
            }

            const url = form.action;

            stop = false;
            ui.runBtn.disabled = true;
            ui.box.disabled = true;
            ui.stopBtn.style.display = '';

            setCountdownLabel(ui.runBtn, TIMES);

            for (let i = 0; i < TIMES; i++) {
                if (stop) break;

                try {
                    // FIX (optional): rebuild FormData each iteration in case the form changes after POST
                    const formData = new FormData(form); // moved inside loop
                    const res = await fetch(url, {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin',
                    });
                    // Consume response to completion to avoid hanging streams
                    await res.text();
                } catch (e) {
                    console.error('Forge failed', e);
                    break;
                }

                const remaining = TIMES - (i + 1);
                setCountdownLabel(ui.runBtn, remaining);

                if (remaining > 0) {
                    await new Promise(r => setTimeout(r, DELAY));
                }
            }

            ui.runBtn.disabled = false;
            ui.box.disabled = false;
            ui.stopBtn.style.display = 'none';

            if (stop) {
                ui.runBtn.textContent = 'Stopped';
                ui.srLive.textContent = 'Forge stopped by user';
            } else {
                resetRunBtnLabel(ui.runBtn);
                ui.srLive.textContent = 'Forge run complete';
            }

            // BIG VISIBLE MESSAGE + refresh
            // FIX: add ID so we don't inject duplicate styles on repeat runs
            let style = document.getElementById('mf-keyframes');
            if (!style) {
                style = document.createElement('style');
                style.id = 'mf-keyframes';
                style.textContent = `
          @keyframes fadeIn{from{opacity:0}to{opacity:1}}
          @keyframes pop{from{transform:scale(.85)}to{transform:scale(1)}}
        `;
                document.head.appendChild(style);
            }

            const overlay = document.createElement('div');
            overlay.style.cssText = `
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.75);
        backdrop-filter:blur(4px);
        z-index:999999;
        display:flex;
        align-items:center;
        justify-content:center;
        animation:fadeIn .25s ease;
      `;

            const panel = document.createElement('div');
            panel.textContent = stop ?
                'Forge stopped ✔ Refreshing...' :
                'Forge run complete ✔ Refreshing...';
            panel.style.cssText = `
        background:linear-gradient(145deg,#1f1f1f,#2c2c2c);
        color:#fff;
        font-size:22px;
        font-weight:700;
        padding:30px 46px;
        border-radius:16px;
        box-shadow:0 0 40px rgba(0,0,0,.8);
        text-align:center;
        border:1px solid rgba(255,255,255,.08);
        animation:pop .25s ease;
        cursor:pointer;
      `;

            overlay.appendChild(panel);
            document.body.appendChild(overlay);

            const refresh = () => location.reload();
            overlay.onclick = refresh;
            setTimeout(refresh, 2000);
        };
    });
})();

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

function modMonsterCards() {
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

    // --- Replace Loot button with inline Claim button ---
const replaceLootButton = (card, monsterId) => {
    const lootBtn = card.querySelector('button.join-btn');
    if (!lootBtn || lootBtn.__claimReplaced) return;

    const anchor = lootBtn.closest('a');
    if (anchor) anchor.removeAttribute('href');

    // Container so buttons stack vertically
    const btnWrap = document.createElement('div');
    btnWrap.style.display = 'flex';
    btnWrap.style.flexDirection = 'column';
    btnWrap.style.gap = '6px';

    /* ======================
       🎁 CLAIM BUTTON
    ====================== */
    const claimBtn = document.createElement('button');
    claimBtn.className = 'join-btn';
    claimBtn.textContent = '🎁 Claim';
    claimBtn.__busy = false;

    claimBtn.onclick = async (e) => {
        e.preventDefault();
        if (claimBtn.__busy) return;

        claimBtn.__busy = true;
        claimBtn.disabled = true;
        claimBtn.textContent = 'Claiming…';

        try {
            const res = await fetch('/loot.php', {
                method: 'POST',
                headers: {'Content-Type':'application/x-www-form-urlencoded'},
                credentials: 'same-origin',
                body: `monster_id=${encodeURIComponent(monsterId)}`
            });

            const text = await res.text();
            if (/success|claimed|looted/i.test(text)) {
                claimBtn.textContent = '✅ Claimed';
            } else {
                throw new Error(text);
            }
        } catch (err) {
            alert('Loot failed.');
            claimBtn.textContent = '🎁 Claim';
            claimBtn.disabled = false;
            claimBtn.__busy = false;
        }
    };

    /* ======================
       🜂 EXTRACT SHADOW BUTTON
    ====================== */
   const extractBtn = document.createElement('button');
extractBtn.className = 'extract-btn';
extractBtn.innerHTML = `<span class="icon">☠</span> Extraction`;
extractBtn.__busy = false;

extractBtn.onclick = async (e) => {
    e.preventDefault();
    if (extractBtn.__busy) return;

    extractBtn.__busy = true;
    extractBtn.disabled = true;
    extractBtn.innerHTML = `<span class="icon">⏳</span> Extracting`;

    try {
        const res = await fetch(`/battle.php?id=${monsterId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            credentials: 'same-origin',
            body: 'action=extract_shadow'
        });

        const data = await res.json();

        // ❌ NO throw here
        if (!data.ok) {
            showExtractionErrorModal(data.message || 'Extraction failed.');
            extractBtn.disabled = false;
            extractBtn.__busy = false;
            extractBtn.innerHTML = `<span class="icon">☠</span> Extraction`;
            return;
        }

        // ✅ Success
        showShadowModal(data.shadow, data.message);
        extractBtn.innerHTML = `<span class="icon">✔</span> Extracted`;

    } catch (err) {
        console.error('Network / parsing error:', err);
        showExtractionErrorModal('A network error occurred. Please try again.');
        extractBtn.disabled = false;
        extractBtn.__busy = false;
        extractBtn.innerHTML = `<span class="icon">☠</span> Extraction`;
    }
};



    btnWrap.append(claimBtn, extractBtn);
    lootBtn.replaceWith(btnWrap);
    lootBtn.__claimReplaced = true;
};
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
            const expGainedRaw = (Number.isFinite(damageVal) && Number.isFinite(expPerDmgVal)) ?
                (damageVal * expPerDmgVal) :
                NaN;

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
            replaceLootButton(card, mId);
        } catch (err) {
            console.error('Failed to update monster card', {
                mId,
                err
            });
        }
    });



}

function showShadowModal(shadow, message) {
    const modal = document.createElement('div');
    modal.className = 'shadow-modal';
    modal.innerHTML = `
        <div class="shadow-backdrop"></div>
        <div class="shadow-box">
            <button class="shadow-close">×</button>

            <h2>Extraction Successful</h2>
            <p>${message}</p>

            <h3>${shadow.name}</h3>
            <div class="shadow-rank">${shadow.rank}</div>

            <div class="shadow-body">
                <img src="${shadow.image}" alt="">
                <div class="shadow-stats">
                    <div><strong>Attack</strong><span>${shadow.attack}</span></div>
                    <div><strong>Defense</strong><span>${shadow.defense}</span></div>
                    <div><strong>Health</strong><span>${shadow.health.toLocaleString()}</span></div>
                    <div><strong>Leads</strong><span>${shadow.lead_capacity}</span></div>
                </div>
            </div>

            <div class="shadow-footer">
                Extra copies: ${shadow.extra_copies_now}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('.shadow-close').onclick =
    modal.querySelector('.shadow-backdrop').onclick = () => modal.remove();
}

function showExtractionErrorModal(message) {
    const modal = document.createElement('div');
    modal.className = 'shadow-modal error';

    modal.innerHTML = `
        <div class="shadow-backdrop"></div>
        <div class="shadow-box error-box">
            <button class="shadow-close">×</button>

            <div class="shadow-tag">SHADOW REJECTION</div>
            <h2>Extraction Failed</h2>

            <p class="error-main">${message}</p>

            <div class="error-flavor">
                The darkness did not answer your call. Strengthen your extraction skill,
                preserve your daily attempts, and try again on a valid corpse.
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.shadow-close').onclick =
    modal.querySelector('.shadow-backdrop').onclick = () => modal.remove();
}

////insta join via picture click
(function() {
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
        try {
            json = JSON.parse(raw);
        } catch {}

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

        return {
            ok,
            already,
            raw,
            json,
            status: res.status
        };
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

    obs.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();

////reduce cards size
(function() {
    if (!vv.isOn('reduce_cards')) return;
    'use strict';

    if (!location.pathname.includes('/active_wave.php')) return;

    const style = document.createElement('style');
    style.textContent = `
    .monster-container{
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
    }

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

        btn.textContent = stats.classList.contains('collapsed') ?
            '▶ Stats' :
            '▼ Stats';
    });

    const observer = new MutationObserver(addCollapseButtons);
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

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
    if (!vv.isOn('loot_summary')) return;
    'use strict';
    if (window.__VV_LOOT_LOADED__) {
        console.warn("VV_LOOT loaded twice");
        return;
    }
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
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: "monster_id=" + encodeURIComponent(monster_id),
                credentials: "include"
            });

            const raw = await res.text();

            if (res.status === 403) {
                // Captcha / forbidden type page
                return {
                    ok: false,
                    already: false,
                    raw,
                    data: null,
                    status: 403
                };
            }

            let data = null;
            try {
                data = JSON.parse(raw);
            } catch {}

            const ok = (data?.status === "success") || /success|looted|claimed/i.test(raw);
            const already = /already\s+claimed/i.test(raw);

            return {
                ok,
                already,
                raw,
                data,
                status: res.status
            };
        } catch (err) {
            console.error("Loot request failed:", monster_id, err);
            return {
                ok: false,
                already: false,
                raw: "",
                data: null,
                status: 0
            };
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
        const expEl = document.getElementById("vv-loot-exp");
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

                const {
                    ok,
                    already,
                    raw,
                    data,
                    status
                } = await postLootRequest(id);

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
                    expEl && (expEl.textContent = gdLootSummary.exp.toLocaleString());
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

        const workers = Array.from({
            length: Math.max(1, concurrency)
        }, () => worker());
        await Promise.all(workers);

        if (progEl) progEl.textContent = "Done.";
        return {
            ...gdLootSummary
        };
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
    window.monsterExpList = window.monsterExpList || []; // Array<{monsterId, finalExpCeil:number|null}>

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
        if (hasComma && hasDot) token = token.replace(/,/g, ''); // 1,234.56
        else if (hasComma && !hasDot) {
            const commaCount = (token.match(/,/g) || []).length;
            token = (commaCount === 1) ? token.replace(',', '.') : token.replace(/,/g, '');
        }
        token = token.replace(/\s+/g, '');
        const n = Number.parseFloat(token);
        return Number.isFinite(n) ? n : NaN;
    };

    const formatInt = (n) =>
        Number.isFinite(n) ?
        Math.trunc(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') :
        '—';

    const norm = (s) => (s || '')
        .replace(/[\u00A0\u2007\u202F]/g, ' ')
        .trim()
        .toLowerCase();

    // === AUTO LEVEL LOOP (persists across refresh) ===================
    const AUTO_KEY = 'vv_auto_level_state';

    function loadAutoState() {
        try {
            return JSON.parse(localStorage.getItem(AUTO_KEY) || 'null');
        } catch {
            return null;
        }
    }

    function saveAutoState(s) {
        localStorage.setItem(AUTO_KEY, JSON.stringify(s));
    }

    function clearAutoState() {
        localStorage.removeItem(AUTO_KEY);
    }

    function isAutoActive() {
        const s = loadAutoState();
        return !!(s && s.active);
    }

    function setRunButtonState({
        running,
        text
    }) {
        const runBtn = document.querySelector('#run-exp-plan-btn');
        if (!runBtn) return;
        runBtn.dataset.running = running ? '1' : '0';
        runBtn.disabled = !!running;
        if (text) runBtn.textContent = text;
    }

    function setStopButtonState({
        visible
    }) {
        const stopBtn = document.querySelector('#stop-exp-plan-btn');
        if (!stopBtn) return;
        stopBtn.style.display = visible ? 'inline-block' : 'none';
    }

    async function runAutoCycleOnce() {
        // Build exp map/list from current visible cards
        await updateMonsterExpData();

        // Build plan (you can swap to 'desc' if you prefer highest-EXP-first)
        const plan = buildExpPlan({
            strategy: 'asIs'
        });
        renderExpPlan(plan);

        // Nothing to loot? Stop the loop gracefully.
        const ids = plan.selected.map(x => x.monsterId);
        if (!ids.length) {
            const panel = document.querySelector('#exp-plan-progress');
            if (panel) panel.textContent = 'No slain monsters found to loot on this page.';
            clearAutoState();
            setRunButtonState({
                running: false,
                text: 'Loot to next level'
            });
            setStopButtonState({
                visible: false
            });
            return {
                leveled: false,
                nothingToDo: true
            };
        }

        const stopAt = Number.isFinite(plan.needed) ? Math.ceil(plan.needed) : null;

        // Loot this batch with stopAtExp to honor the "to next level" promise
        const summary = await window.VV_LOOT.lootMonsterIds(ids, {
            concurrency: 5,
            stopAtExp: stopAt,
            perLootDelayMs: 90
        });

        // If we reached or exceeded the needed EXP for this cycle, we’re done.
        const reached = Number.isFinite(stopAt) && summary.exp >= stopAt;

        return {
            leveled: reached,
            summary
        };
    }

    async function startOrContinueAutoLevel() {
        // Mark auto as active in storage so a refresh resumes.
        const current = loadAutoState();
        if (!current || !current.active) {
            const {
                needed
            } = readExpNeededFromTopBar();
            saveAutoState({
                active: true,
                sessionId: Date.now(),
                goalAtStart: Number.isFinite(needed) ? needed : null,
                cumulativeExp: 0,
                lastRun: Date.now()
            });
        }

        setRunButtonState({
            running: true,
            text: 'Auto running…'
        });
        setStopButtonState({
            visible: true
        });

        try {
            const one = await runAutoCycleOnce();

            // If no work, stop. If leveled, stop. Otherwise reload to continue.
            if (one.nothingToDo) {
                // Do nothing — we already stopped above.
                return;
            }

            const state = loadAutoState();
            if (state && one.summary && Number.isFinite(one.summary.exp)) {
                state.cumulativeExp = (state.cumulativeExp || 0) + (one.summary.exp || 0);
                state.lastRun = Date.now();
                saveAutoState(state);
            }

            if (one.leveled) {
                // Reached target — clear and optionally reload to update UI.
                clearAutoState();
                setRunButtonState({
                    running: false,
                    text: 'loot to next level'
                });
                setStopButtonState({
                    visible: false
                });

                // Small delay so user can read the modal, then refresh UI EXP bar.
                setTimeout(() => window.location.reload(), 3000);
            } else {
                // Not enough — keep the session active and refresh to pick up the next 200.
                setTimeout(() => window.location.reload(), 3000);
            }
        } catch (err) {
            console.error('[AutoLevel] Cycle error:', err);
            // On error, disable loop so it doesn’t hard-refresh endlessly.
            clearAutoState();
            setRunButtonState({
                running: false,
                text: 'loot to next level'
            });
            setStopButtonState({
                visible: false
            });
        }
    }

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
        const needed = (Number.isFinite(currentExp) && Number.isFinite(maxExp)) ?
            Math.max(0, maxExp - currentExp) :
            NaN;

        return {
            currentExp,
            maxExp,
            needed,
            raw
        };
    }

    // ----------------------------
    // Build monsterExpMap/list from dead monster cards
    // IMPORTANT: awaitable (Promise.allSettled)
    // ----------------------------
    async function updateMonsterExpData() {
        const cards = document.querySelectorAll('.monster-card[data-dead="1"][data-monster-id]');
        if (!cards.length) return {
            ok: true,
            count: 0
        };

        // Read level from DOM (NO FETCH)
        const lvlText = document.querySelector('.gtb-level')?.textContent || '';
        const lvlVal = parseNumeric(lvlText);

        const href = window.location.href;

        const tasks = Array.from(cards).map(async (card) => {
            const mId = card.dataset.monsterId;
            if (!mId) return null;

            if (isExcludedFromLootPlan(card)) {
                return null;
            }

            try {
                const res = await fetch(`/battle.php?id=${encodeURIComponent(mId)}`, {
                    credentials: 'same-origin'
                });
                if (!res.ok) throw new Error(`Fetch failed (HTTP ${res.status})`);

                const html = await res.text();
                const doc = new DOMParser().parseFromString(html, 'text/html');

                // Damage
                const damageText = doc.querySelector('#yourDamageValue')?.textContent?.trim() || '';
                const damageVal = parseNumeric(damageText);

                // EXP/DMG from 2nd .stat-line, 3rd .stat-block (fallback scan)
                let expPerDmgText = '';
                (function() {
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
                const expRaw = (Number.isFinite(damageVal) && Number.isFinite(expPerDmgVal)) ?
                    (damageVal * expPerDmgVal) :
                    NaN;

                // Wave/level multiplier rules (same as you had)
                let multiplier = 1;
                if (href.includes('wave=3') && Number.isFinite(lvlVal) && lvlVal > 200) multiplier = 0.75;
                else if (href.includes('wave=5') && Number.isFinite(lvlVal) && lvlVal > 1000) multiplier = 0.75;
                else if (href.includes('wave=8') && Number.isFinite(lvlVal) && lvlVal > 3500) multiplier = 0.50;

                const adjusted = Number.isFinite(expRaw) ? expRaw * multiplier : NaN;
                const finalExpCeil = Number.isFinite(adjusted) ? Math.ceil(adjusted) : NaN;

                const entry = {
                    monsterId: mId,
                    finalExpCeil: Number.isFinite(finalExpCeil) ? finalExpCeil : null
                };

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
                const entry = {
                    monsterId: mId,
                    finalExpCeil: null
                };
                if (idx >= 0) window.monsterExpList[idx] = entry;
                else window.monsterExpList.push(entry);
                return entry;
            }
        });

        await Promise.allSettled(tasks);
        return {
            ok: true,
            count: cards.length
        };
    }

    // ----------------------------
    // Build plan: sum until total > needed
    // strategy: "desc" (default) | "asIs" | "asc"
    // ----------------------------
    function buildExpPlan({
        strategy = 'desc'
    } = {}) {
        const {
            currentExp,
            maxExp,
            needed
        } = readExpNeededFromTopBar();

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
            return {
                currentExp,
                maxExp,
                needed,
                selected: [],
                totalFromSelected: 0,
                exceeds: false
            };
        }
        if (needed <= 0) {
            return {
                currentExp,
                maxExp,
                needed: 0,
                selected: [],
                totalFromSelected: 0,
                exceeds: true
            };
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
        for (const {
                monsterId,
                finalExpCeil
            }
            of plan.selected) {
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

    async function loadIframeFastNoCss(iframe, url, {
        timeoutMs = 20000
    } = {}) {
        // 1) Fetch battle HTML ourselves (same-origin cookies included)
        const res = await fetch(url, {
            credentials: 'same-origin'
        });
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

    async function clickLootAndWait(iframe, {
        timeoutMs = 20000
    } = {}) {
        const doc = iframe.contentDocument;
        if (!doc) return {
            ok: false,
            reason: 'no iframe document'
        };

        const btn = doc.querySelector('#loot-button');
        if (!btn) return {
            ok: false,
            reason: 'loot-button not found'
        };

        const initialText = (btn.textContent || '').trim().toLowerCase();

        let loadedAgain = false;
        const onLoad = () => {
            loadedAgain = true;
        };
        iframe.addEventListener('load', onLoad);

        let mutated = false;
        const mo = new MutationObserver(() => {
            mutated = true;
        });
        mo.observe(doc.documentElement, {
            subtree: true,
            childList: true,
            attributes: true
        });

        try {
            btn.click();

            const start = Date.now();
            while (Date.now() - start < timeoutMs) {
                if (loadedAgain) return {
                    ok: true,
                    mode: 'reload'
                };

                const d = iframe.contentDocument;
                if (!d) return {
                    ok: true,
                    mode: 'doc-lost'
                };

                const b2 = d.querySelector('#loot-button');
                if (!b2) return {
                    ok: true,
                    mode: 'button-gone'
                };

                const text2 = (b2.textContent || '').trim().toLowerCase();
                const disabled = b2.disabled || b2.getAttribute('aria-disabled') === 'true';

                if (disabled) return {
                    ok: true,
                    mode: 'disabled'
                };
                if (initialText && text2 && text2 !== initialText) return {
                    ok: true,
                    mode: 'text-changed'
                };

                if (mutated) mutated = false;
                await sleep(150);
            }
            return {
                ok: false,
                reason: 'loot wait timeout'
            };
        } finally {
            iframe.removeEventListener('load', onLoad);
            mo.disconnect();
        }
    }

    async function lootMonsterByIdIframe(monsterId) {
        const iframe = getOrCreateLootIframe();
        const url = `/battle.php?id=${encodeURIComponent(monsterId)}`;

        try {
            await loadIframeFastNoCss(iframe, url, {
                timeoutMs: 300
            });
            const lootBtn = await waitForSelectorInIframe(iframe, '#loot-button', 180);
            if (!lootBtn) {
                return {
                    ok: false,
                    monsterId,
                    step: 'find',
                    reason: 'loot-button not present (already claimed / not slain)'
                };
            }
            const clicked = await clickLootAndWait(iframe, {
                timeoutMs: 300
            });
            if (!clicked.ok) {
                return {
                    ok: false,
                    monsterId,
                    step: 'click',
                    reason: clicked.reason
                };
            }
            return {
                ok: true,
                monsterId,
                step: 'done',
                mode: clicked.mode
            };
        } catch (e) {
            return {
                ok: false,
                monsterId,
                step: 'exception',
                reason: String(e?.message || e)
            };
        }
    }

    async function runPlannedLootOnly(planSelected, {
        delayMs = 800
    } = {}) {
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

            const {
                monsterId
            } = planSelected[i];
            if (progressEl) progressEl.textContent = `Looting planned ${i + 1}/${planSelected.length} — Monster ${monsterId}...`;

            const r = await lootMonsterByIdIframe(monsterId);
            results.push(r);

            if (progressEl) {
                progressEl.textContent = r.ok ?
                    `✅ Looted ${monsterId} (${i + 1}/${planSelected.length})` :
                    `⚠️ Failed ${monsterId} [${r.step}] ${r.reason}`;
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

        const stopBtn = document.createElement('button');
        stopBtn.id = 'stop-exp-plan-btn';
        stopBtn.type = 'button';
        stopBtn.textContent = 'Stop';
        stopBtn.style.cssText = lootStyle + `
    margin-left: 6px;
    background: #8b2c2c;
    border-color: #a33737;
    display: none;
  `;

        lootBtn.insertAdjacentElement('afterend', runBtn);
        runBtn.insertAdjacentElement('afterend', stopBtn);

        runBtn.addEventListener('click', async () => {
            if (runBtn.dataset.running === '1') return; // prevent double clicks
            // Start (or resume) the auto-level session
            await startOrContinueAutoLevel();
        });

        stopBtn.addEventListener('click', () => {
            clearAutoState();
            setRunButtonState({
                running: false,
                text: 'Loot to next level'
            });
            setStopButtonState({
                visible: false
            });
        });

        // If a session was left active before refresh, auto-resume it.
        if (isAutoActive()) {
            // Slight delay lets the page settle and cards render
            setTimeout(() => startOrContinueAutoLevel(), 500);
        }
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

if (vv.isOn('quest_modal')) {
    injectQuestModalStyles();
    ensureQuestModal();
}

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
    const titles = ['Shadowbridge Warrens', 'Castle of the Fallen Prince', 'The Polyhedral Crucible'];

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
    const questsContainer = document.getElementById('quest-expanded');
    if (!questsContainer) return;

    questsContainer.innerHTML =
        '<div style="text-align: center; padding: 15px; color: #6c7086; font-size: 11px;">Loading quests...</div>';

    fetch('https://demonicscans.org/adventurers_guild.php', {
        credentials: 'include',
        mode: 'same-origin'
    })
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const availableQuests = [];
            const activeQuests = [];

            // -------------------------
            // EXTRACT AVAILABLE QUESTS
            // -------------------------
            const availableQuestElements = doc.querySelectorAll('.quest-list .quest-row');
            availableQuestElements.forEach(questEl => {
                const progress = questEl.querySelector('.quest-progress')?.textContent?.trim();
                const hasProgress = progress && progress.includes('Progress:');

                if (!hasProgress) {
                    const title = questEl.querySelector('.quest-main-title')?.textContent?.trim();
                    const description = questEl.querySelector('.quest-main-desc')?.textContent?.trim();
                    const reward = questEl.querySelector('.quest-reward')?.textContent?.trim();

                    // Extract timer from native page
                    const cooldownTimer = questEl.querySelector('.quest-cooldown-timer');
                    let cooldownTS = null;
                    if (cooldownTimer) {
                        cooldownTS = cooldownTimer.getAttribute('data-cooldown-ts');
                    }

                    const acceptBtn = questEl.querySelector('.quest-accept-btn');
                    let questId = null;
                    if (acceptBtn) {
                        const onclickStr = acceptBtn.getAttribute('onclick') || '';
                        const match = onclickStr.match(/acceptQuest\((\d+)/);
                        if (match) questId = match[1];
                    }

                    if (title && !availableQuests.find(q => q.title === title)) {
                        availableQuests.push({
                            title,
                            description: description || 'No description available',
                            reward: reward || 'No reward specified',
                            questId,
                            cooldownTS,
                            type: 'available'
                        });
                    }
                }
            });

            // -------------------------
            // EXTRACT ACTIVE QUESTS
            // -------------------------
            const activeQuestElements = doc.querySelectorAll('.quest-list .quest-row');
            activeQuestElements.forEach(questEl => {
                const progress = questEl.querySelector('.quest-progress')?.textContent?.trim();
                const hasProgress = progress && progress.includes('Progress:');

                if (hasProgress) {
                    const title = questEl.querySelector('.quest-main-title')?.textContent?.trim();
                    const description = questEl.querySelector('.quest-main-desc')?.textContent?.trim();
                    const timeLeft = questEl.querySelector('.quest-time')?.textContent?.trim();

                    const giveUpBtn = questEl.querySelector('.quest-giveup-btn');
                    const finishBtn = questEl.querySelector('.quest-finish-btn');
                    const donateBtn = questEl.querySelector('.quest-donate-btn');

                    let questId = null;
                    let actionType = null;
                    let actionLabel = null;
                    let itemId = null;

                    if (donateBtn) {
                        const match = donateBtn.getAttribute('onclick')
                            .match(/donateGatherItem\((\d+),\s*(\d+)/);
                        if (match) {
                            questId = match[1];
                            itemId = match[2];
                            actionType = 'donate';
                            actionLabel = 'Donate';
                        }
                    } else if (finishBtn) {
                        const match = finishBtn.getAttribute('onclick')
                            .match(/finishQuest\((\d+)/);
                        if (match) {
                            questId = match[1];
                            actionType = 'finish';
                            actionLabel = 'Finish quest';
                        }
                    } else if (giveUpBtn) {
                        const match = giveUpBtn.getAttribute('onclick')
                            .match(/giveUpQuest\((\d+)/);
                        if (match) {
                            questId = match[1];
                            actionType = 'giveUp';
                            actionLabel = 'Give up';
                        }
                    }

                    if (title && !activeQuests.find(q => q.title === title)) {
                        activeQuests.push({
                            title,
                            progress,
                            timeLeft,
                            questId,
                            itemId,
                            actionType,
                            actionLabel,
                            type: 'active'
                        });
                    }
                }
            });

            // -------------------------------------
            // BUILD SIDEBAR HTML
            // -------------------------------------
            let questsHTML = '';

            // Available Quests
            availableQuests.forEach(quest => {
                questsHTML += `
                <div class="sidebar-quest tm-clickable"
                     data-q-title="${escapeHtml(quest.title)}"
                     data-q-type="Available"
                     data-q-description="${escapeHtml(quest.description)}"
                     data-q-reward="${escapeHtml(quest.reward)}"
                     style="margin-bottom: 8px; padding: 6px; background: rgba(30,30,46,0.5);
                     border-radius: 4px; border-left: 2px solid #89b4fa;">

                    <div class="quest-title" style="font-weight: bold; color: #cdd6f4; font-size: 10px;">
                        ${quest.title}
                    </div>
                    <div class="quest-details" style="color:#6c7086; font-size:9px;">
                        ${quest.description}
                    </div>
                    <div class="quest-reward" style="color:#a6e3a1; font-size:9px;">
                        Reward: ${quest.reward}
                    </div>

                    ${quest.questId ? `
                        <button class="quest-accept-btn"
                                type="button"
                                data-quest-id="${quest.questId}"
                                style="background:#89b4fa; color:white; border:none; border-radius:3px;
                                padding:2px 6px; font-size:9px; cursor:pointer;">
                            Accept quest
                        </button>` : ''}

                    ${quest.cooldownTS ? `
                        <div class="sidebar-cooldown-timer"
                             data-cooldown-ts="${quest.cooldownTS}"
                             style="color:#fab387; font-size:9px; margin-top:4px;">
                            Loading timer...
                        </div>
                    ` : ''}
                </div>`;
            });

            // Active quests
            if (activeQuests.length > 0) {
                questsHTML += `
                <div><div style="font-weight:bold; color:#f9e2af; margin-bottom:8px; font-size:11px;">
                    ⚡ Active Quests
                </div></div>
                `;

                activeQuests.forEach(quest => {
                    questsHTML += `
                    <div class="sidebar-quest tm-clickable"
                         data-q-title="${escapeHtml(quest.title)}"
                         data-q-type="Active"
                         data-q-progress="${escapeHtml(quest.progress)}"
                         data-q-time="${escapeHtml(quest.timeLeft)}"
                         style="margin-bottom:8px; padding:6px; background:rgba(30,30,46,0.5);
                         border-radius:4px; border-left:2px solid #f9e2af;">

                        <div class="quest-title" style="font-weight:bold; color:#cdd6f4; font-size:10px;">
                            ${quest.title}
                        </div>
                        <div class="quest-progress" style="color:#6c7086; font-size:9px;">
                            ${quest.progress}
                        </div>
                        <div class="quest-time" style="color:#eba0ac; font-size:9px;">
                            ${quest.timeLeft}
                        </div>

                        ${quest.questId && quest.actionType ? `
                            <button class="quest-${quest.actionType}-btn"
                                    type="button"
                                    data-quest-id="${quest.questId}"
                                    data-action-type="${quest.actionType}"
                                    ${quest.itemId ? `data-item-id="${quest.itemId}"` : ''}
                                    style="background:${quest.actionType === 'giveUp'
                                        ? '#f38ba8' : quest.actionType === 'donate'
                                        ? '#fab387' : '#a6e3a1'};
                                    color:white; border:none; border-radius:3px;
                                    padding:2px 6px; font-size:9px; cursor:pointer; margin-top:2px;">
                                ${quest.actionLabel}
                            </button>`
                        : ''}
                    </div>`;
                });
            }

            questsContainer.innerHTML = questsHTML;

            // Clicking quest card opens modal
            questsContainer.addEventListener('click', e => {
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

            // -------------------------------
            // ADD BUTTON EVENT HANDLERS
            // -------------------------------
            questsContainer.querySelectorAll(`
                .quest-giveUp-btn,
                .quest-finish-btn,
                .quest-accept-btn,
                .quest-donate-btn
            `).forEach(btn => {
                btn.addEventListener('click', function () {
                    const questId = this.dataset.questId;
                    const actionType = this.classList.contains('quest-accept-btn')
                        ? 'accept'
                        : this.classList.contains('quest-giveUp-btn')
                            ? 'giveUp'
                            : this.classList.contains('quest-donate-btn')
                                ? 'donate'
                                : 'finish';

                    if (actionType === 'accept') {
                        sidebarAcceptQuest(questId, this);
                    } else if (actionType === 'donate') {
                        sidebarDonateQuest(questId, this.dataset.itemId, this);
                    } else {
                        sidebarQuestAction(actionType, questId, this);
                    }
                });
            });

            // ----------------------------------------------------
            // START COOLDOWN TIMER ENGINE (NEW)
            // ----------------------------------------------------
            startSidebarCooldownTimers();
        })
        .catch(error => {
            console.error('Error fetching adventurers guild quests:', error);
            questsContainer.innerHTML = `
                <div style="text-align:center; padding:15px; color:#f38ba8; font-size:11px;">
                    Failed to load quests
                </div>`;
        });
}

// -------------------------------------------
// LIVE SIDEBAR COOLDOWN TIMER ENGINE
// -------------------------------------------
function startSidebarCooldownTimers() {
    const timerEls = document.querySelectorAll('.sidebar-cooldown-timer');
    if (timerEls.length === 0) return;

    function updateTimers() {
        const now = Math.floor(Date.now() / 1000);

        timerEls.forEach(el => {
            const ts = parseInt(el.dataset.cooldownTs);
            const remaining = ts - now;

            if (remaining <= 0) {
                el.textContent = "READY";
                el.style.color = "#a6e3a1";
                return;
            }

            const d = Math.floor(remaining / 86400);
            const h = Math.floor((remaining % 86400) / 3600);
            const m = Math.floor((remaining % 3600) / 60);
            const s = remaining % 60;

            el.textContent =
                `Available in ${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        });
    }

    updateTimers();
    setInterval(updateTimers, 1000);
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
            credentials: 'include',
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

                // 🔥 Log cooldown when sidebar finishes the quest
                if (actionType === "finish") {
                    const title = btn.closest(".sidebar-quest")
                        ?.querySelector(".quest-title")
                        ?.innerText.trim();

                    const store = loadCooldowns();
                    store[questId] = {
                        name: title || ("Quest " + questId),
                        completedAt: Date.now(),
                        availableAt: Date.now() + COOLDOWN_MS
                    };
                    saveCooldowns(store);
                    console.log("Cooldown logged from SIDEBAR:", questId, title);
                }

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


    setTimeout(initAdventurersGuildQuests, 500);

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
        if (!vv.isOn('quest_modal')) return;
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
            if (!vv.isOn('quest_modal')) return;
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
}];

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
        if (vv.isOn('modifySideNav')) modifySideNav();
        modBlacksmith();
        modForge();
        if (vv.isOn('modMonsterCards')) modMonsterCards();
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
    '/shadow_army.php',
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
const DEFAULT_DISABLED = []; // none disabled by default
const DEFAULT_CLICKS_DISABLED = true; // sidebar clicks disabled while ordering (default)

function getNav() {
    return document.querySelector('.side-nav');
}

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
        } catch {
            /* fall back to defaults */
        }
    }
    return {
        order,
        disabled,
        clicksDisabled
    };
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
    const {
        order,
        disabled,
        clicksDisabled
    } = loadPrefs();
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
function initNavOrderUI({
    onSave,
    onReset
}) {
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
    panel.addEventListener('click', (e) => {
        if (e.target === panel) closeOrderPanel();
    });

    hideAllBtn.addEventListener('click', () => {
        document.querySelectorAll('#nav-order-list .enable-toggle').forEach(cb => {
            cb.checked = false;
            cb.dispatchEvent(new Event('change'));
        });
    });
    showAllBtn.addEventListener('click', () => {
        document.querySelectorAll('#nav-order-list .enable-toggle').forEach(cb => {
            cb.checked = true;
            cb.dispatchEvent(new Event('change'));
        });
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
        const prefs = {
            order: mergedDefaultOrder,
            disabled: DEFAULT_DISABLED,
            clicksDisabled: DEFAULT_CLICKS_DISABLED
        };
        savePrefs(prefs);
        closeOrderPanel();
        onReset?.(prefs);
    });
}

//top hp/mp bar
(function() {
    if (!vv.isOn('top_hp_mp')) return;

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
        wrap.className = 'res-bar';

        const inner = document.createElement('div');
        inner.className = `res-fill ${kind === 'hp' ? 'stamina' : 'mana'}`;
        inner.style.width = `${Math.max(0, Math.min(100, percent))}%`;

        wrap.appendChild(inner);
        return wrap;
    }

    function tryReadHpMpFromCurrentPage() {
        const nodes = document.querySelectorAll('.battle-card.player-card .hp-text');
        if (nodes && nodes.length) {
            return Array.from(nodes).map((n) => n.textContent.trim());
        }
        return null;
    }

    /* STEP 1: GET PLAYER HP / MP
    =============================== */
    const ACTIVE_WAVE_URL = '/active_wave.php?gate=3&wave=3';

    async function getPlayerStats() {
        const local = tryReadHpMpFromCurrentPage();
        if (local && local.length) return local;

        try {
            const res = await fetch(ACTIVE_WAVE_URL, {
                credentials: 'include'
            });
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

        const isBattlePage = location.pathname.includes('/battle.php');

        const topbar = document.querySelector('.game-topbar');
        if (!topbar) return;

        let wrapper = topbar.querySelector('.topbar-hp-wrapper');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'topbar-hp-wrapper';
            topbar.appendChild(wrapper);
        }

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

        const texts = await getPlayerStats();
        if (!texts) return;

        const hpText = texts.find((t) => /hp/i.test(t));
        const mpText = texts.find((t) => /mp|mana/i.test(t));

        wrapper.innerHTML = '';

        /* ---- HP ---- */
        if (hpText) {
            const hp = parseCurrentMax(hpText);
            wrapper.appendChild(
                createNativeBar('hp', hp && hp.max > 0 ? (hp.current / hp.max) * 100 : 0)
            );

            const hpLine = document.createElement('div');
            hpLine.className = 'hp-text';
            hpLine.textContent = isBattlePage ?
                `${hpText.replace(/^HP\s*/i, '')} HP` :
                `💚 ${hpText.replace(/^HP\s*/i, '')} HP`;

            wrapper.appendChild(hpLine);
        } else {
            wrapper.appendChild(createNativeBar('hp', 0));
            const hpLine = document.createElement('div');
            hpLine.className = 'hp-text';
            hpLine.textContent = 'HP —';
            wrapper.appendChild(hpLine);
        }

        /* ---- MP ---- */
        if (mpText) {
            const mp = parseCurrentMax(mpText);
            wrapper.appendChild(
                createNativeBar('mp', mp && mp.max > 0 ? (mp.current / mp.max) * 100 : 0)
            );

            const mpLine = document.createElement('div');
            mpLine.className = 'hp-text';
            mpLine.textContent = isBattlePage ?
                `${mpText.replace(/^MP\s*/i, '')} MP` :
                `💠 ${mpText.replace(/^MP\s*/i, '')} MP`;

            wrapper.appendChild(mpLine);
        } else {
            wrapper.appendChild(createNativeBar('mp', 0));
            const mpLine = document.createElement('div');
            mpLine.className = 'hp-text';
            mpLine.textContent = 'MP —';
            wrapper.appendChild(mpLine);
        }
    }

    /* STEP 3: BACK BUTTON SPACING
    =============================== */
    function adjustBackButtonSpacing(root = document) {
        const normalize = (s) => (s || '').replace(/\s+/g, ' ').trim();

        const candidates = root.querySelectorAll('button, .btn, [role="button"]');

        for (const el of candidates) {
            const txt = normalize(el.textContent);
            if (txt === '⬅ Back' || txt === '⬅ Back to wave') {
                let hostDiv = el.closest('div');
                if (!hostDiv) continue;

                if (!hostDiv.dataset.backMtApplied) {
                    hostDiv.style.marginTop = '20px';
                    hostDiv.dataset.backMtApplied = '1';
                }
            }
        }
    }

    /* START
    =============================== */
    (async () => {
        await syncHpToTopbar();
        adjustBackButtonSpacing(document);
    })();

    if (!window.__hpSyncWired) {
        window.__hpSyncWired = true;

        const CLICK_REFRESH_DELAY = 250;

        const scheduleRefresh = () => {

            let attempts = 0;
            const maxAttempts = 10; // tries for up to ~500ms
            const interval = 50; // check every 50ms

            const oldTexts = (() => {
                const local = tryReadHpMpFromCurrentPage();
                return local ? local.join('|') : null;
            })();

            const check = async () => {
                attempts++;

                const now = tryReadHpMpFromCurrentPage();
                const joined = now ? now.join('|') : null;

                // Stop when values actually changed
                if (joined && joined !== oldTexts) {
                    await syncHpToTopbar();
                    adjustBackButtonSpacing(document);
                    return;
                }

                // Retry for up to maxAttempts
                if (attempts < maxAttempts) {
                    setTimeout(check, interval);
                } else {
                    // final fallback if values never changed
                    await syncHpToTopbar();
                    adjustBackButtonSpacing(document);
                }
            };

            setTimeout(check, interval);
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

// to hide instajoin btn
(function() {
    'use strict';

    function hideAll() {
        document.querySelectorAll('.btn.gd-instant-join')
            .forEach(btn => btn.style.display = 'none');
    }

    hideAll();

    const obs = new MutationObserver(hideAll);
    obs.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();

//quest window modal

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
        if (!value) {
            el.innerHTML = '';
            return;
        }
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
(function() {
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
            monsterCard.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            joinBtn.click();
            return {
                ok: true,
                mode: 'join'
            };
        }

        // 2) Fallback continue-btn (already joined)
        const contBtn = monsterCard.querySelector('.continue-btn');
        if (contBtn) {
            monsterCard.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            contBtn.click();
            return {
                ok: true,
                mode: 'continue'
            };
        }

        return {
            ok: false,
            mode: null
        };
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
                setTimeout(() => {
                    btn.disabled = false;
                }, 1200);
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
    obs.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
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
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
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
(function() {
    if (!vv.isOn('dungeon_dmg_pills')) return;
    'use strict';

    /** ---------- Config ---------- */
    const CONCURRENCY = 6; // max parallel requests
    const CACHE_TTL_MS = 0; // cache life
    const MIN_JITTER = 40; // ms
    const MAX_JITTER = 140; // ms

    /** ---------- Utils ---------- */
    const sleep = (ms) => new Promise(res => setTimeout(res, ms));
    const jitter = () => MIN_JITTER + Math.random() * (MAX_JITTER - MIN_JITTER);

    function getInstanceIdFromPage() {
        try {
            return new URL(location.href).searchParams.get('instance_id') || '';
        } catch {
            return '';
        }
    }

    function safeUrlParam(href, key) {
        try {
            return new URL(href, location.origin).searchParams.get(key);
        } catch {
            return null;
        }
    }

    function fetchHtml(url) {
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest === 'function') {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    anonymous: false,
                    onload: (resp) => {
                        if (resp.status >= 200 && resp.status < 300) resolve(resp.responseText);
                        else reject(new Error(`HTTP ${resp.status}`));
                    },
                    onerror: reject,
                    ontimeout: () => reject(new Error('Timeout')),
                });
            } else {
                fetch(url, {
                        credentials: 'include'
                    })
                    .then(r => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
                    .then(resolve, reject);
            }
        });
    }

    function parseDamageFromBattleHTML(html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const el = doc.querySelector('#yourDamageValue');
        return el ? el.textContent.trim() : null;
    }

    function createDamagePill(initialText) {
        const pill = document.createElement('div');
        pill.className = 'statpill';
        pill.title = 'Damage dealt';
        // Minimal inline style to look okay anywhere
        pill.style.cssText = 'display:inline-flex;gap:6px;align-items:center;margin-left:6px;';

        const icon = document.createElement('span');
        icon.textContent = '⚔️';

        const k = document.createElement('span');
        k.className = 'k';
        k.style.opacity = '0.75';
        k.textContent = 'dmg';

        const v = document.createElement('span');
        v.className = 'v';
        v.textContent = initialText;

        pill.append(icon, k, v);
        return pill;
    }

    function extractDgmidFromMon(monEl) {
        // Prefer clean checkbox
        const ck = monEl.querySelector('input.wave-addon-pick-monster[data-mid]');
        if (ck?.dataset?.mid) return ck.dataset.mid;

        // Fallback: any link that has dgmid
        const a = monEl.querySelector('a[href*="dgmid="]');
        if (a) {
            const val = safeUrlParam(a.href, 'dgmid');
            if (val) return val;
            const raw = a.getAttribute('href') || '';
            const m = raw.match(/[?&]dgmid=(\d+)/);
            if (m) return m[1];
        }
        return null;
    }

    function extractInstanceIdFromMon(monEl) {
        const a = monEl.querySelector('a[href*="instance_id="]');
        if (a) {
            const val = safeUrlParam(a.href, 'instance_id');
            if (val) return val;
            const raw = a.getAttribute('href') || '';
            const m = raw.match(/[?&]instance_id=(\d+)/);
            if (m) return m[1];
        }
        return null;
    }

    /** ---------- Cache (sessionStorage + in-memory) ---------- */
    const memCache = new Map(); // key -> { val, ts }

    function cacheKey(dgmid, instanceId) {
        return `dmg:${dgmid}:${instanceId}`;
    }

    function cacheGet(dgmid, instanceId) {
        const key = cacheKey(dgmid, instanceId);
        const now = Date.now();

        // in-memory
        const mem = memCache.get(key);
        if (mem && now - mem.ts < CACHE_TTL_MS) return mem.val;

        // sessionStorage
        try {
            const raw = sessionStorage.getItem(key);
            if (raw) {
                const obj = JSON.parse(raw);
                if (now - obj.ts < CACHE_TTL_MS) {
                    memCache.set(key, obj);
                    return obj.val;
                }
            }
        } catch {}
        return null;
    }

    function cacheSet(dgmid, instanceId, val) {
        const key = cacheKey(dgmid, instanceId);
        const entry = {
            val,
            ts: Date.now()
        };
        memCache.set(key, entry);
        try {
            sessionStorage.setItem(key, JSON.stringify(entry));
        } catch {}
    }

    /** ---------- Request de-duplication ---------- */
    const inFlight = new Map(); // url -> Promise<string>

    function fetchBattlePageOnce(url) {
        if (inFlight.has(url)) return inFlight.get(url);
        const p = fetchHtml(url)
            .finally(() => inFlight.delete(url));
        inFlight.set(url, p);
        return p;
    }

    /** ---------- Concurrency pool ---------- */
    async function runWithLimit(items, limit, worker) {
        const results = new Array(items.length);
        let i = 0;
        const runners = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
            while (i < items.length) {
                const idx = i++;
                try {
                    results[idx] = await worker(items[idx], idx);
                } catch (e) {
                    results[idx] = e;
                }
            }
        });
        await Promise.all(runners);
        return results;
    }

    /** ---------- Main per-card processing ---------- */
    const processed = new WeakSet();

    function ensureDamagePill(monEl, initial = '…') {
        let pill = monEl.querySelector('.statrow .statpill[title="Damage dealt"]');
        if (pill) return pill;

        const row = monEl.querySelector('.statrow');
        if (!row) return null;

        pill = createDamagePill(initial);
        row.appendChild(pill);
        return pill;
    }

    function buildBattleUrl(dgmid, instanceId) {
        return `https://demonicscans.org/battle.php?dgmid=${encodeURIComponent(dgmid)}&instance_id=${encodeURIComponent(instanceId)}`;
    }

    function collectMonsters() {
        const pageInstanceId = getInstanceIdFromPage();
        const mons = Array.from(document.querySelectorAll('div.mon'));
        const jobs = [];

        for (const monEl of mons) {
            if (processed.has(monEl)) continue;
            processed.add(monEl);

            const statRow = monEl.querySelector('.statrow');
            if (!statRow) continue;

            const dgmid = extractDgmidFromMon(monEl);
            const instanceId = pageInstanceId || extractInstanceIdFromMon(monEl) || '';

            const pill = ensureDamagePill(monEl, dgmid && instanceId ? '…' : '—');

            if (!dgmid || !instanceId || !pill) continue;

            jobs.push({
                monEl,
                pill,
                dgmid,
                instanceId,
                url: buildBattleUrl(dgmid, instanceId)
            });
        }
        return jobs;
    }

    async function processJob(job) {
        const {
            pill,
            dgmid,
            instanceId,
            url
        } = job;

        // Cache hit?
        const cached = cacheGet(dgmid, instanceId);
        if (cached) {
            const v = pill.querySelector('.v');
            if (v) v.textContent = cached;
            return;
        }

        // Small randomized jitter so we don't hammer in a perfect burst
        await sleep(jitter());

        try {
            const html = await fetchBattlePageOnce(url);
            const dmg = parseDamageFromBattleHTML(html) || '—';
            cacheSet(dgmid, instanceId, dmg);
            const v = pill.querySelector('.v');
            if (v) v.textContent = dmg;
        } catch {
            const v = pill.querySelector('.v');
            if (v) v.textContent = '—';
            // soft backoff: avoid immediate retries; cache negative for a short time
            cacheSet(dgmid, instanceId, '—');
        }
    }

    async function processAllParallel() {
        const jobs = collectMonsters();
        if (jobs.length === 0) return;

        await runWithLimit(jobs, CONCURRENCY, processJob);
    }

    function setupObserver() {
        const obs = new MutationObserver(() => {
            // Gather only new, unprocessed monsters and schedule them
            const jobs = collectMonsters();
            if (jobs.length === 0) return;
            runWithLimit(jobs, CONCURRENCY, processJob).catch(() => {});
        });
        obs.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    (async () => {
        await processAllParallel();
        setupObserver();
    })();

})();

//dungeon loot/loot all
(function() {
    'use strict';

    /* =========================================================
       CONFIG — tweak selectors here if your markup changes
       ========================================================= */
    const SELECTORS = {
        // Each monster row container
        monsterRow: '.mon',

        // Dead detection
        deadClassOnRow: 'dead', // <div class="mon dead">
        deadPillSel: '.pill', // also check any pill for text 'dead'

        // Not-looted detection
        notLootedPillSel: '.pill-warn', // <span class="pill pill-warn">not looted</span>
        anyPillSel: '.pill, .pill-warn', // fallback: text contains "not looted"

        // Pull IDs from "View/Fight" anchor
        anchorToId: 'a.btn[href*="dgmid="], a[href*="dgmid="]',

        // Per-row button placement (after the LAST <a class="btn"> within the row)
        actionLinksSel: 'a.btn',

        // Loot All button host (append as last child)
        lootAllContainerQuery: '.panel .row'
    };

    // Pacing & batch size for Loot All
    const AUTO_LOOT_DELAY_MS = 30;
    const LOOT_ALL_CONCURRENCY = 15;

    /* =========================================================
       Utility: Toast (brief notifications)
       ========================================================= */
    function toast(message, type = 'info') {
        const box = document.createElement('div');
        box.className = `tm-toast-${type}`;
        box.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 2147483647;
      padding: 12px 16px; border-radius: 8px; color: #fff; font-size: 14px;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
      box-shadow: 0 6px 20px rgba(0,0,0,.25);
    `;
        box.textContent = message;
        document.body.appendChild(box);
        setTimeout(() => box.remove(), 3000);
    }

    /* =========================================================
       Parse helpers
       ========================================================= */
    function normalize(text) {
        return (text || '').trim().toLowerCase();
    }

    function getInstanceId() {
        // 1) From page URL
        try {
            const p = new URLSearchParams(location.search);
            const iid = p.get('instance_id');
            if (iid) return iid;
        } catch {}
        // 2) Fallback: from any link in the page
        const a = document.querySelector('a.btn[href*="instance_id="], a[href*="instance_id="]');
        if (a) {
            const href = a.getAttribute('href') || '';
            const m = href.match(/[?&]instance_id=(\d+)/);
            if (m) return m[1];
        }
        return null;
    }

    function getInstanceIdFromRow(row) {
        const a = row.querySelector('a.btn[href*="instance_id="], a[href*="instance_id="]');
        if (!a) return null;
        const href = a.getAttribute('href') || '';
        const m = href.match(/[?&]instance_id=(\d+)/);
        return m ? m[1] : null;
    }

    function getMonsterIdFromRow(row) {
        const a = row.querySelector(SELECTORS.anchorToId);
        if (!a) return null;
        const href = a.getAttribute('href') || '';
        const m = href.match(/[?&]dgmid=(\d+)/);
        return m ? m[1] : null;
    }

    function isRowDead(row) {
        if (row.classList.contains(SELECTORS.deadClassOnRow)) return true;
        const pills = row.querySelectorAll(SELECTORS.deadPillSel);
        return [...pills].some(p => /\bdead\b/i.test((p.textContent || '').trim()));
    }

    function isRowNotLooted(row) {
        if (row.querySelector(SELECTORS.notLootedPillSel)) return true;
        const pills = row.querySelectorAll(SELECTORS.anyPillSel);
        return [...pills].some(p => /not\s*looted/i.test((p.textContent || '').trim()));
    }

    function isRowLootable(row) {
        // Only show on DEAD + NOT LOOTED
        return isRowDead(row) && isRowNotLooted(row);
    }

    /* =========================================================
       Summary modal + items grid (reused for per-row & Loot All)
       ========================================================= */
    const ITEM_TIER_COLORS = {
        COMMON: '#7f8c8d',
        UNCOMMON: '#2ecc71',
        RARE: '#9b59b6',
        EPIC: '#e67e22',
        LEGENDARY: '#f1c40f'
    };
    const DEFAULT_TIER_COLOR = '#ffffff';

    const lootState = {
        items: {}, // ITEM_ID -> { name, image, tier, count }
        exp: 0,
        gold: 0,
        mobs: 0,
        zeroMobs: 0,
        failed: 0
    };

    function resetLootState() {
        lootState.items = {};
        lootState.exp = 0;
        lootState.gold = 0;
        lootState.mobs = 0;
        lootState.zeroMobs = 0;
        lootState.failed = 0;
    }

    function showLootModal(headerText) {
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
      <h2 style="margin:0 0 12px 0;">${headerText || '🎁 Loot Gained'}</h2>
      <div id="vv-loot-progress" style="font-size:12px;color:#c7c7d8;margin-bottom:10px;">
        Initializing...
      </div>
      <div id="vv-loot-items" style="display:grid;grid-template-columns:repeat(auto-fill,96px);
                  gap:12px;justify-content:center;"></div>
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
        const itemId = String(item.ITEM_ID ?? '').trim();
        if (!itemId) return;

        const rec = lootState.items[itemId];
        const currentCount = rec?.count ?? 0;
        const color = ITEM_TIER_COLORS[item.TIER] || DEFAULT_TIER_COLOR;

        let slot = itemsWrap.querySelector(`[data-item-id="${CSS.escape(itemId)}"]`);
        if (!slot) {
            slot = document.createElement('div');
            slot.dataset.itemId = itemId;
            slot.style.cssText = `
        width:96px; display:flex; flex-direction:column;
        align-items:center; text-align:center; box-sizing:border-box;
      `;

            const imgWrap = document.createElement('div');
            imgWrap.style.cssText = 'position:relative;width:64px;height:64px;';

            const img = document.createElement('img');
            img.src = item.IMAGE_URL;
            img.alt = item.NAME || '';
            img.style.cssText = `
        width:64px;height:64px;border-radius:4px;
        border:2px solid ${color}; display:block;
      `;

            const badge = document.createElement('span');
            badge.className = 'vv-item-count';
            badge.textContent = `x${currentCount}`;
            badge.style.cssText = `
        position:absolute; right:-6px; bottom:-6px;
        background:rgba(0,0,0,0.75); color:white; font-size:12px; font-weight:bold;
        padding:1px 6px; border-radius:6px; line-height:1.2;
      `;

            imgWrap.appendChild(img);
            imgWrap.appendChild(badge);

            const textWrap = document.createElement('div');
            textWrap.style.cssText = 'margin-top:6px;width:100%;line-height:1.1;';

            const nameDiv = document.createElement('div');
            nameDiv.textContent = item.NAME || 'Unknown';
            nameDiv.style.cssText = `
        font-size:13px;font-weight:bold;color:white;
        overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
      `;

            const tierDiv = document.createElement('div');
            tierDiv.textContent = item.TIER || '';
            tierDiv.style.cssText = `
        font-size:10px;font-weight:bold;color:${color};margin-top:2px;
      `;

            textWrap.appendChild(nameDiv);
            textWrap.appendChild(tierDiv);

            slot.appendChild(imgWrap);
            slot.appendChild(textWrap);

            itemsWrap.appendChild(slot);
            return;
        }
        const countEl = slot.querySelector('.vv-item-count');
        if (countEl) countEl.textContent = `x${currentCount}`;

        const img = slot.querySelector('img');
        if (img) img.style.borderColor = color;
    }

    function parseExpFromRaw(raw) {
        const m = String(raw || '').match(/([0-9][0-9,\.]*)\s*EXP/i);
        return m ? Number(m[1].replace(/[^0-9]/g, '')) : 0;
    }

    /* =========================================================
       Transports (Dungeon-first, then Legacy)
       ========================================================= */
    function isLootSuccess({
        json,
        text
    }) {
        if (json?.success === 'success' || json?.status === 'success') return true;
        if (/looted|claimed|success/i.test(String(text || ''))) return true;
        return false;
    }

    function isLootAlready({
        json,
        text
    }) {
        if (String(json?.status || '').toLowerCase() === 'already') return true;
        if (/already\s+claimed/i.test(String(text || ''))) return true;
        return false;
    }

    async function postDungeonLoot(dgmid, instanceId) {
        try {
            const body = `dgmid=${encodeURIComponent(dgmid)}&instance_id=${encodeURIComponent(instanceId)}`;
            const res = await fetch('dungeon_loot.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body,
                credentials: 'include',
                referrer: location.href
            });
            const raw = await res.text();
            let data = null;
            try {
                data = JSON.parse(raw);
            } catch {}
            const ok = isLootSuccess({
                json: data,
                text: raw
            });
            const already = isLootAlready({
                json: data,
                text: raw
            });
            // rewards
            const expGain = Number(data?.rewards?.exp || 0) || parseExpFromRaw(raw);
            const goldGain = Number(data?.rewards?.gold || 0) || 0;
            const items = Array.isArray(data?.items) ? data.items : [];
            return {
                ok,
                already,
                expGain,
                goldGain,
                items,
                status: res.status,
                raw,
                data
            };
        } catch (err) {
            return {
                ok: false,
                already: false,
                expGain: 0,
                goldGain: 0,
                items: [],
                status: 0,
                raw: '',
                data: null
            };
        }
    }

    async function postLegacyLoot(monsterId) {
        try {
            const body = `monster_id=${encodeURIComponent(monsterId)}`;
            const res = await fetch('loot.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body,
                credentials: 'include',
                referrer: location.href
            });
            const raw = await res.text();
            let data = null;
            try {
                data = JSON.parse(raw);
            } catch {}
            const ok = isLootSuccess({
                json: data,
                text: raw
            });
            const already = isLootAlready({
                json: data,
                text: raw
            });
            const expGain = parseExpFromRaw(raw);
            const goldGain = Number(data?.rewards?.gold || 0) || 0;
            const items = Array.isArray(data?.items) ? data.items : [];
            return {
                ok,
                already,
                expGain,
                goldGain,
                items,
                status: res.status,
                raw,
                data
            };
        } catch (err) {
            return {
                ok: false,
                already: false,
                expGain: 0,
                goldGain: 0,
                items: [],
                status: 0,
                raw: '',
                data: null
            };
        }
    }

    /* =========================================================
       Unified modal looter (uses dungeon first if instance_id is present)
       ========================================================= */
    async function lootMonsterIds(monsterIds, opts = {}) {
        const {
            concurrency = LOOT_ALL_CONCURRENCY,
                perLootDelayMs = AUTO_LOOT_DELAY_MS,
                instanceId = null,
                header = '🎁 Loot Gained'
        } = opts;

        resetLootState();
        showLootModal(header);

        const mobsEl = document.getElementById('vv-loot-mobs');
        const zeroEl = document.getElementById('vv-loot-zero');
        const expEl = document.getElementById('vv-loot-exp');
        const goldEl = document.getElementById('vv-loot-gold');
        const failEl = document.getElementById('vv-loot-failed');
        const itemsEl = document.getElementById('vv-loot-items');
        const progEl = document.getElementById('vv-loot-progress');

        const queue = monsterIds.map(String);
        let totalAttempts = 0;

        const updateProgress = () => {
            if (!progEl) return;
            progEl.textContent = `Looting... ${totalAttempts}/${monsterIds.length}`;
        };

        updateProgress();

        const useDungeon = !!instanceId;

        async function worker() {
            while (queue.length) {
                const id = queue.shift();
                if (!id) return;

                totalAttempts++;
                updateProgress();

                const r = useDungeon ? await postDungeonLoot(id, instanceId) : await postLegacyLoot(id);

                if (!(r.ok || r.already)) {
                    lootState.failed++;
                    if (failEl) failEl.textContent = lootState.failed.toLocaleString();
                    await new Promise(res => setTimeout(res, perLootDelayMs));
                    continue;
                }

                if (r.expGain > 0) {
                    lootState.mobs++;
                    lootState.exp += r.expGain;
                    if (mobsEl) mobsEl.textContent = lootState.mobs.toLocaleString();
                    if (expEl) expEl.textContent = lootState.exp.toLocaleString();
                } else {
                    lootState.zeroMobs++;
                    if (zeroEl) zeroEl.textContent = lootState.zeroMobs.toLocaleString();
                }

                if (r.goldGain > 0) {
                    lootState.gold += r.goldGain;
                    if (goldEl) goldEl.textContent = lootState.gold.toLocaleString();
                }

                if (Array.isArray(r.items)) {
                    for (const item of r.items) {
                        const key = String(item.ITEM_ID ?? '').trim();
                        if (key) {
                            if (!lootState.items[key]) {
                                lootState.items[key] = {
                                    name: item.NAME,
                                    image: item.IMAGE_URL,
                                    tier: item.TIER,
                                    count: 0
                                };
                            }
                            lootState.items[key].count += 1;
                        }
                        if (itemsEl) upsertItemSlot(itemsEl, item);
                    }
                }

                await new Promise(res => setTimeout(res, perLootDelayMs));
            }
        }

        const workers = Array.from({
            length: Math.max(1, concurrency)
        }, () => worker());
        await Promise.all(workers);

        if (progEl) progEl.textContent = 'Done.';
        return {
            ...lootState
        };
    }

    /* =========================================================
       Per-row UI placement & behavior
       ========================================================= */
    function placeAfterLastActionLink(row, btnEl) {
        const links = row.querySelectorAll(SELECTORS.actionLinksSel);
        if (links.length) {
            const last = links[links.length - 1];
            btnEl.style.marginLeft = '8px';
            last.insertAdjacentElement('afterend', btnEl);
            return true;
        }
        return false;
    }

    function markRowAsLooted(row) {
        // Change pill “not looted” -> “looted”
        const pills = row.querySelectorAll('.pill, .pill-warn');
        for (const p of pills) {
            const t = normalize(p.textContent);
            if (/not\s*looted/.test(t)) {
                p.textContent = 'looted';
                p.classList.remove('pill-warn');
            }
        }
        // Replace a Loot button (if present) with a passive pill
        const lootBtn = row.querySelector('.tm-loot-btn');
        if (lootBtn) {
            const done = document.createElement('span');
            done.className = 'pill';
            done.textContent = '💰 Looted';
            lootBtn.replaceWith(done);
        }
    }

    function createLootButtonForRow(row) {
        if (!isRowLootable(row)) return null;

        const monsterId = getMonsterIdFromRow(row);
        if (!monsterId) return null;

        // Avoid duplicates
        if (row.querySelector('.tm-loot-btn')) return null;

        // Use <a class="btn"> to match native styling
        const btn = document.createElement('a');
        btn.href = "#";
        btn.className = "btn tm-loot-btn"; // inherits all native styles
        btn.textContent = "💰 Loot";

        // Match native spacing with proper margin
        btn.style.marginLeft = "6px";

        btn.addEventListener("click", async (e) => {
            e.preventDefault();
            btn.style.pointerEvents = "none";
            const iid = getInstanceIdFromRow(row) || getInstanceId() || null;

            try {
                await lootMonsterIds([monsterId], {
                    concurrency: 1,
                    perLootDelayMs: 0,
                    instanceId: iid,
                    header: "🎁 Loot Result"
                });
                markRowAsLooted(row);
            } catch (err) {
                console.error(err);
                toast("Per-row loot failed. See console.", "error");
            } finally {
                // We do NOT re-enable pointerEvents because button gets replaced with pill
                setTimeout(updateLootAllVisibility, 120);
            }
        });

        // Insert after last <a.btn>
        const placed = placeAfterLastActionLink(row, btn);
        if (!placed) row.appendChild(btn);

        return btn;
    }

    function addLootButtonsToAllRows() {
        document.querySelectorAll(SELECTORS.monsterRow).forEach(row => createLootButtonForRow(row));
        updateLootAllVisibility();
    }

    /* =========================================================
       Loot All button behavior (append to first .panel .row)
       ========================================================= */
    let lootAllBtn = null;

    function ensureLootAllButton() {
        if (lootAllBtn && lootAllBtn.isConnected) return lootAllBtn;

        const container = document.querySelector(SELECTORS.lootAllContainerQuery);
        if (!container) return null;

        lootAllBtn = document.createElement('button');
        lootAllBtn.id = 'tm-loot-all-btn';
        lootAllBtn.textContent = '💰 Loot All';
        lootAllBtn.style.cssText = `
      display:none; /* toggled by updateLootAllVisibility */
      margin-left: 8px;
      padding:8px 12px;border:0;border-radius:10px;cursor:pointer;
      background:rgb(40 65 200);color:#fff;font:700 13px/1.2 system-ui;
      box-shadow:0 6px 16px rgba(0,0,0,.25);
      align-self:center;
    `;
        lootAllBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            lootAllBtn.disabled = true;
            try {
                // Gather all current lootable rows (or simply read IDs from buttons)
                const rows = [...document.querySelectorAll(SELECTORS.monsterRow)];
                const eligible = rows.filter(isRowLootable).map(r => ({
                    r,
                    id: getMonsterIdFromRow(r)
                })).filter(x => !!x.id);

                if (!eligible.length) {
                    toast('No dead & not-looted monsters found.', 'info');
                    updateLootAllVisibility();
                    return;
                }

                const ids = eligible.map(x => x.id);
                const iid = getInstanceId() || null;

                await lootMonsterIds(ids, {
                    concurrency: LOOT_ALL_CONCURRENCY,
                    perLootDelayMs: AUTO_LOOT_DELAY_MS,
                    instanceId: iid,
                    header: '⚔️ Loot All'
                });

                // Mark rows as looted
                for (const {
                        r
                    }
                    of eligible) markRowAsLooted(r);
            } catch (e2) {
                console.error(e2);
                toast('Batch loot failed. See console.', 'error');
            } finally {
                lootAllBtn.disabled = false;
                setTimeout(updateLootAllVisibility, 150);
            }
        });

        container.appendChild(lootAllBtn); // append as last child
        return lootAllBtn;
    }

    function updateLootAllVisibility() {
        const btn = ensureLootAllButton();
        if (!btn) return;
        // Show if at least one per-row loot button exists
        const anyLootBtn = !!document.querySelector('.tm-loot-btn');
        btn.style.display = anyLootBtn ? 'inline-flex' : 'none';
    }

    /* =========================================================
       Observe & init
       ========================================================= */
    let debounceTimer = null;

    function observeForNewRows() {
        const obs = new MutationObserver(() => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                addLootButtonsToAllRows();
                updateLootAllVisibility();
            }, 120);
        });
        obs.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function init() {
        if (!/^\/guild_dungeon_location\.php/i.test(location.pathname)) return;

        addLootButtonsToAllRows();
        ensureLootAllButton();
        updateLootAllVisibility();
        observeForNewRows();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

//pet exp calculation
(function() {
    'use strict';

    // Restrict execution to pets.php
    if (!/pets\.php$/.test(window.location.pathname)) return;

    // Treat values (only S and M now)
    const TREAT_VALUES = {
        S: 300,
        M: 9000
    };

    // Helper to format numbers with commas
    function formatNumber(num) {
        return num.toLocaleString();
    }

    // Create modal container once
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.background = '#222';
    modal.style.color = '#cfd3ef';
    modal.style.padding = '10px';
    modal.style.borderRadius = '6px';
    modal.style.boxShadow = '0 0 8px rgba(0,0,0,0.5)';
    modal.style.zIndex = '9999';
    modal.style.display = 'none';
    document.body.appendChild(modal);

    // Process each pet slot
    document.querySelectorAll('.slot-box').forEach(slot => {
        const currentExpEl = slot.querySelector('.exp-current');
        const requiredExpEl = slot.querySelector('.exp-required');

        if (!currentExpEl || !requiredExpEl) return;

        const currentExp = parseInt(currentExpEl.textContent.replace(/,/g, ''), 10);
        const requiredExp = parseInt(requiredExpEl.textContent.replace(/,/g, ''), 10);

        if (isNaN(currentExp) || isNaN(requiredExp)) return;

        const expNeeded = requiredExp - currentExp;
        const treatsNeeded = Math.ceil(expNeeded / TREAT_VALUES.S);

        // Create hoverable display element
        const infoDiv = document.createElement('div');
        infoDiv.className = 'exp-info';
        infoDiv.style.marginTop = '4px';
        infoDiv.style.fontSize = '12px';
        infoDiv.style.color = '#cfd3ef';
        infoDiv.style.cursor = 'pointer';
        infoDiv.textContent = `EXP needed: ${formatNumber(expNeeded)} | Treats: ${treatsNeeded}`;

        // On hover, show modal with progressive M+S breakdowns
        infoDiv.addEventListener('mouseenter', e => {
            const combos = [];

            // Pure S
            combos.push(`S only: ${Math.ceil(expNeeded / TREAT_VALUES.S)} S`);

            // Pure M
            const maxM = Math.floor(expNeeded / TREAT_VALUES.M);
            if (maxM > 0) combos.push(`M only: ${Math.ceil(expNeeded / TREAT_VALUES.M)} M`);

            // Progressive breakdown: max M down to 0
            for (let mCount = maxM; mCount >= 1; mCount--) {
                const remainingExp = expNeeded - mCount * TREAT_VALUES.M;
                const sCount = Math.ceil(remainingExp / TREAT_VALUES.S);
                combos.push(`${mCount} M + ${sCount} S`);
            }

            modal.innerHTML = `<strong>EXP needed: ${formatNumber(expNeeded)}</strong><br><br>` + combos.join('<br>');
            modal.style.display = 'block';

            // Position modal near cursor
            modal.style.top = (e.clientY + 15) + 'px';
            modal.style.left = (e.clientX + 15) + 'px';
        });

        infoDiv.addEventListener('mouseleave', () => {
            modal.style.display = 'none';
        });

        // Insert right under exp-top
        const expTop = slot.querySelector('.exp-top');
        if (expTop) {
            expTop.insertAdjacentElement('afterend', infoDiv);
        }
    });
})();

//compress thedude's monster filter to dropdown
(function() {
    if (!vv.isOn('mob_filter_dropdown')) return;
    'use strict';

    // ===== CONFIG =====
    const CONTAINER_ID = 'wave-addon-monster-filter-container';
    const LIST_ID = 'wave-addon-mob-filter';
    const THEME = {
        bg: 'rgba(17, 20, 35, 0.95)',
        border: 'rgba(87, 103, 160, 0.35)',
        text: 'rgb(230, 233, 255)',
        hover: 'rgba(255, 255, 255, 0.06)',
        accent: 'rgb(142, 160, 255)',
        shadow: '0 8px 24px rgba(0,0,0,0.35)'
    };

    // Global one-shot guard
    if (window.__mobFilterDropdownInit) return;
    window.__mobFilterDropdownInit = true;

    // ===== UTIL: wait for an element =====
    function waitForEl(selector, timeout = 15000) {
        return new Promise((resolve, reject) => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);

            const obs = new MutationObserver(() => {
                const e = document.querySelector(selector);
                if (e) {
                    obs.disconnect();
                    resolve(e);
                }
            });

            obs.observe(document.documentElement || document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                obs.disconnect();
                reject(new Error(`Timeout waiting for ${selector}`));
            }, timeout);
        });
    }

    // ===== STYLE INJECTION =====
    function injectStyles() {
        if (document.getElementById('mob-filter-dropdown-styles')) return;
        const css = `
      .mob-dd {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 220px;
      }
      .mob-dd__btn {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        background: ${THEME.bg};
        color: ${THEME.text};
        border: 1px solid ${THEME.border};
        border-radius: 8px;
        padding: 8px 10px;
        font-size: 13px;
        cursor: pointer;
        user-select: none;
        box-shadow: ${THEME.shadow};
        transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
      }
      .mob-dd__btn:hover {
        background: ${THEME.hover};
        border-color: ${THEME.accent};
        box-shadow: 0 10px 28px rgba(0,0,0,0.4);
      }
      .mob-dd__btn .mob-dd__label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        opacity: 0.95;
      }
      .mob-dd__btn .mob-dd__count {
        font-size: 12px;
        color: ${THEME.accent};
        background: rgba(142,160,255,0.12);
        border: 1px solid rgba(142,160,255,0.25);
        padding: 2px 6px;
        border-radius: 999px;
      }
      .mob-dd__btn .mob-dd__chev {
        width: 10px;
        height: 10px;
        transform: rotate(0deg);
        transition: transform 0.15s ease;
        opacity: 0.85;
      }
      .mob-dd__btn[aria-expanded="true"] .mob-dd__chev {
        transform: rotate(180deg);
      }
      .mob-dd__panel {
        /* Default in-DOM styling (when not portaled). JS overrides when opened. */
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        z-index: 9999;
        display: none;
        background: ${THEME.bg};
        border: 1px solid ${THEME.border};
        border-radius: 10px;
        padding: 8px;
        width: 100%;
        max-height: 280px;
        overflow: auto;
        box-shadow: ${THEME.shadow};
      }
      .mob-dd__panel.is-open {
        display: block;
      }
      .mob-dd__panel label:hover {
        background: ${THEME.hover} !important;
      }
      .mob-dd__tools {
        position: sticky;
        top: -8px;
        background: linear-gradient(180deg, ${THEME.bg} 70%, transparent);
        padding: 6px 4px 2px;
        display: flex;
        gap: 6px;
        z-index: 1;
      }
      .mob-dd__chip {
        font-size: 11px;
        color: ${THEME.text};
        border: 1px solid ${THEME.border};
        border-radius: 999px;
        padding: 3px 8px;
        cursor: pointer;
        background: rgba(255,255,255,0.04);
        transition: background 0.15s, border-color 0.15s;
        user-select: none;
      }
      .mob-dd__chip:hover {
        background: ${THEME.hover};
        border-color: ${THEME.accent};
      }
    `.trim();
        const style = document.createElement('style');
        style.id = 'mob-filter-dropdown-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    function createChevron() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('class', 'mob-dd__chev');
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('fill', THEME.text);
        p.setAttribute('d', 'M7 10l5 5 5-5z');
        svg.appendChild(p);
        return svg;
    }

    // ===== PORTAL HELPERS =====
    function positionPanelToButton(panel, btn) {
        const rect = btn.getBoundingClientRect();
        const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

        // Desired left based on button
        let left = rect.left;
        const panelWidth = rect.width;
        const padding = 8; // viewport side padding

        // Clamp horizontally into viewport
        if (left + panelWidth > vw - padding) {
            left = vw - padding - panelWidth;
        }
        if (left < padding) left = padding;

        panel.style.position = 'fixed';
        panel.style.top = `${rect.bottom + 6}px`; // keep your 6px gap
        panel.style.left = `${left}px`;
        panel.style.width = `${panelWidth}px`;
        panel.style.maxHeight = '280px';
        panel.style.overflow = 'auto';
        panel.style.zIndex = '2147483647'; // top-most
    }

    function enhanceAsDropdown(container, list) {
        // If already enhanced, do nothing (prevents duplicates)
        if (container.querySelector('.mob-dd')) return;

        // Build wrapper
        const ddWrap = document.createElement('div');
        ddWrap.className = 'mob-dd';

        // Button
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mob-dd__btn';
        btn.setAttribute('aria-haspopup', 'listbox');
        btn.setAttribute('aria-expanded', 'false');

        const labelSpan = document.createElement('span');
        labelSpan.className = 'mob-dd__label';
        labelSpan.textContent = 'Filter Monsters';
        labelSpan.style.opacity = '0.8';

        const countSpan = document.createElement('span');
        countSpan.className = 'mob-dd__count';
        countSpan.textContent = '0 selected';

        btn.append(labelSpan, countSpan, createChevron());

        // Panel
        const panel = document.createElement('div');
        panel.className = 'mob-dd__panel';
        panel.setAttribute('role', 'listbox');
        panel.setAttribute('aria-multiselectable', 'true');

        // Tools (optional)
        const tools = document.createElement('div');
        tools.className = 'mob-dd__tools';
        const chipAll = document.createElement('span');
        chipAll.className = 'mob-dd__chip';
        chipAll.textContent = 'Select All';
        const chipNone = document.createElement('span');
        chipNone.className = 'mob-dd__chip';
        chipNone.textContent = 'Clear';
        tools.append(chipAll, chipNone);
        panel.appendChild(tools);

        // Move the existing checkbox labels into the panel (not cloning!)
        list.style.display = 'flex';
        list.style.flexDirection = 'column';
        list.style.gap = '8px';
        panel.appendChild(list);

        // Insert
        container.style.gap = '8px';
        container.appendChild(ddWrap);
        ddWrap.appendChild(btn);
        ddWrap.appendChild(panel);

        // Update count helper
        function updateCount() {
            const inputs = panel.querySelectorAll('input[type="checkbox"]');
            let checked = 0;
            inputs.forEach(i => {
                if (i.checked) checked++;
            });
            countSpan.textContent = `${checked} selected`;
        }
        updateCount();

        // ===== PORTAL STATE (placeholder + listeners) =====
        const originalParent = ddWrap; // panel starts as child of ddWrap
        const placeholder = document.createComment('mob-dd__panel-placeholder');

        function onReposition() {
            positionPanelToButton(panel, btn);
        }

        function openPanel() {
            panel.classList.add('is-open');
            btn.setAttribute('aria-expanded', 'true');

            // Move panel to body (portal) if not already there
            if (panel.parentNode !== document.body) {
                originalParent.replaceChild(placeholder, panel);
                document.body.appendChild(panel);
            }

            // Position by the trigger button
            positionPanelToButton(panel, btn);

            // Keep aligned on scroll/resize
            window.addEventListener('scroll', onReposition, {
                passive: true
            });
            window.addEventListener('resize', onReposition);

            // OPTIONAL: If your layout mutates a lot and you need to keep the position synced,
            // you can enable a lightweight MutationObserver here.
            // (Commented out by default to avoid overhead.)
            // if (!openPanel._mo) {
            //   openPanel._mo = new MutationObserver(onReposition);
            //   openPanel._mo.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
            // }

            // Preserve your original "Wave enhanced controls" logic if available
            if (typeof detectWaveEnhancedControls === 'function' && !detectWaveEnhancedControls()) {
                const mo = new MutationObserver(() => {
                    if (detectWaveEnhancedControls()) {
                        mo.disconnect();
                        // Re-open to re-render if your flow requires it
                        // (We ensure panel remains open and positioned)
                        onReposition();
                    }
                });
                mo.observe(document.documentElement, {
                    childList: true,
                    subtree: true
                });
            }
        }

        function closePanel() {
            panel.classList.remove('is-open');
            btn.setAttribute('aria-expanded', 'false');

            window.removeEventListener('scroll', onReposition);
            window.removeEventListener('resize', onReposition);

            if (openPanel._mo) {
                openPanel._mo.disconnect();
                openPanel._mo = null;
            }

            // Move back into original component tree so DOM structure/tab order are restored
            if (panel.parentNode === document.body) {
                document.body.removeChild(panel);
                originalParent.replaceChild(panel, placeholder);
            }

            // Clear any inline styles set during portaling (optional)
            panel.style.position = '';
            panel.style.top = '';
            panel.style.left = '';
            panel.style.width = '';
            panel.style.maxHeight = '';
            panel.style.overflow = '';
            panel.style.zIndex = '';
        }

        function togglePanel() {
            const isOpen = panel.classList.contains('is-open');
            if (isOpen) closePanel();
            else openPanel();
        }

        // Toggle
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePanel();
        });

        // Close on outside click (works even when panel is portaled)
        document.addEventListener('click', (e) => {
            if (!ddWrap.contains(e.target) && !panel.contains(e.target)) {
                closePanel();
            }
        });

        // Keyboard support
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                togglePanel();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                openPanel();
                const firstInput = panel.querySelector('input[type="checkbox"]');
                firstInput?.focus();
            }
        });

        panel.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closePanel();
                btn.focus();
            }
        });

        // Listen for changes to keep count synced
        panel.addEventListener('change', (e) => {
            if (e.target && e.target.matches('input[type="checkbox"]')) {
                updateCount();
            }
        });

        // Select all / clear
        chipAll.addEventListener('click', () => {
            panel.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                if (!cb.checked) {
                    cb.checked = true;
                    cb.dispatchEvent(new Event('change', {
                        bubbles: true
                    }));
                }
            });
            updateCount();
        });
        chipNone.addEventListener('click', () => {
            panel.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                if (cb.checked) {
                    cb.checked = false;
                    cb.dispatchEvent(new Event('change', {
                        bubbles: true
                    }));
                }
            });
            updateCount();
        });

        // Keep badge in sync if external code toggles .checked
        const mo = new MutationObserver(updateCount);
        panel.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            mo.observe(cb, {
                attributes: true,
                attributeFilter: ['checked']
            });
        });
    }

    let bootObserver; // so we can disconnect after success

    async function init() {
        try {
            const container = await waitForEl(`#${CONTAINER_ID}`);
            const list = await waitForEl(`#${LIST_ID}`);

            // If already enhanced (e.g., by a previous run), stop
            if (container.querySelector('.mob-dd')) {
                if (bootObserver) bootObserver.disconnect();
                return;
            }

            injectStyles();
            enhanceAsDropdown(container, list);

            // After successful enhancement, stop the boot observer
            if (bootObserver) bootObserver.disconnect();
        } catch (err) {
            // Silent fail if target not present
        }
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, {
            once: true
        });
    } else {
        init();
    }

    // In case the target is mounted dynamically later
    bootObserver = new MutationObserver(() => {
        const container = document.getElementById(CONTAINER_ID);
        const list = document.getElementById(LIST_ID);
        // Only init if both exist and not yet enhanced
        if (container && list && !container.querySelector('.mob-dd')) {
            init();
        }
    });
    bootObserver.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true
    });
})();

//collapse button for the dude's panels
(function() {
    if (!vv.isOn('autohunt_collapse')) return;
    'use strict';

    // ===== CONFIG =====
    const PANEL_ID = 'wave-addon-auto-hunt-controls';
    const STORAGE_KEY = '__wave_auto_hunt_collapsed';

    // One-shot guard (avoid duplicates across SPA loads or double injection)
    if (window.__waveAutoHuntCollapseInit) return;
    window.__waveAutoHuntCollapseInit = true;

    // ===== UTIL: wait for element =====
    function waitForEl(selector, timeout = 15000) {
        return new Promise((resolve, reject) => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);

            const obs = new MutationObserver(() => {
                const found = document.querySelector(selector);
                if (found) {
                    obs.disconnect();
                    resolve(found);
                }
            });
            obs.observe(document.documentElement || document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                obs.disconnect();
                reject(new Error(`Timeout waiting for ${selector}`));
            }, timeout);
        });
    }

    // ===== STYLE INJECTION =====
    function injectStyles() {
        if (document.getElementById('wave-auto-hunt-collapse-styles')) return;
        const style = document.createElement('style');
        style.id = 'wave-auto-hunt-collapse-styles';
        style.textContent = `
      /* Positioning context for the top-right button */
      #${PANEL_ID} {
        position: relative;
      }
      /* Top-right button */
      .wave-ah__collapse-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        border-radius: 6px;
        border: 1px solid rgba(87, 103, 160, 0.35);
        background: rgba(17, 20, 35, 0.75);
        color: rgb(230, 233, 255);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
        outline: none;
        box-shadow: 0 6px 18px rgba(0,0,0,0.25);
        transition: background 0.15s, border-color 0.15s, transform 0.15s;
        user-select: none;
      }
      .wave-ah__collapse-btn:hover {
        background: rgba(255,255,255,0.06);
        border-color: rgb(142,160,255);
      }
      .wave-ah__collapse-btn:active {
        transform: translateY(1px);
      }
      .wave-ah__collapse-btn svg {
        width: 14px;
        height: 14px;
        opacity: 0.9;
      }
      /* Collapsible content container (we add/wrap this dynamically) */
      .wave-ah__content {
        overflow: clip; /* modern safe overflow for masked corners */
        transition: height 180ms ease;
      }
      /* Hidden state: height is animated to 0 */
      #${PANEL_ID}.is-collapsed .wave-ah__content {
        height: 0 !important;
      }
      /* Optional: subtle dim on header row when collapsed */
      #${PANEL_ID}.is-collapsed .wave-ah__header-row {
        opacity: 0.92;
      }
      /* Make sure the header row keeps its spacing when button overlays */
      #${PANEL_ID} .wave-ah__header-row {
        padding-right: 28px; /* space to the right so content doesn't hide behind the button */
      }
    `.trim();
        document.head.appendChild(style);
    }

    function createChevronIcon(direction = 'up') {
        // 'up' arrow (collapse); rotate for expand
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('fill', 'currentColor');
        // Up chevron
        path.setAttribute('d', 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z');
        svg.appendChild(path);
        if (direction === 'down') {
            svg.style.transform = 'rotate(180deg)';
        }
        return svg;
    }

    function enhance(panel) {
        // Idempotency inside the panel
        if (panel.querySelector('.wave-ah__collapse-btn')) return;

        // Identify header row (first child row with the toggle and label)
        // Your HTML: first child is a row with the main checkbox + label + (Ctrl+B)
        const children = Array.from(panel.children);
        if (children.length === 0) return;

        const headerRow = children[0];
        headerRow.classList.add('wave-ah__header-row');

        // Wrap the rest of the rows in a collapsible container
        const contentWrap = document.createElement('div');
        contentWrap.className = 'wave-ah__content';

        // Move all children after header into contentWrap
        for (let i = 1; i < children.length; i++) {
            contentWrap.appendChild(children[i]); // moves, doesn't clone
        }
        panel.appendChild(contentWrap);

        // Create the top-right collapse button
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'wave-ah__collapse-btn';
        btn.setAttribute('aria-label', 'Collapse Auto Hunt');
        btn.setAttribute('title', 'Collapse/Expand');

        const icon = createChevronIcon('up'); // Up by default = "collapse"
        btn.appendChild(icon);
        panel.appendChild(btn);

        // Measure and set content height for smooth animation
        function setContentHeightToAuto() {
            // Temporarily set to auto to measure scrollHeight
            contentWrap.style.height = 'auto';
            const h = contentWrap.scrollHeight;
            contentWrap.style.height = `${h}px`;
        }

        // Initialize height after first layout
        requestAnimationFrame(() => {
            setContentHeightToAuto();
        });

        // Toggle logic + persistence
        const isCollapsedStored = localStorage.getItem(STORAGE_KEY) === '1';
        if (isCollapsedStored) {
            panel.classList.add('is-collapsed');
            icon.style.transform = 'rotate(180deg)'; // show "down" when collapsed
            // Set initial height to 0 for collapsed state
            contentWrap.style.height = '0px';
            btn.setAttribute('aria-label', 'Expand Auto Hunt');
        } else {
            setContentHeightToAuto();
        }

        function collapse() {
            // Animate to 0
            const current = contentWrap.getBoundingClientRect().height;
            contentWrap.style.height = `${current}px`; // set fixed start
            // next frame, transition to 0
            requestAnimationFrame(() => {
                contentWrap.style.height = '0px';
                panel.classList.add('is-collapsed');
                icon.style.transform = 'rotate(180deg)'; // down
                btn.setAttribute('aria-label', 'Expand Auto Hunt');
                localStorage.setItem(STORAGE_KEY, '1');
            });
        }

        function expand() {
            // Measure scrollHeight and animate to that value
            const target = contentWrap.scrollHeight;
            contentWrap.style.height = `${target}px`;
            panel.classList.remove('is-collapsed');
            icon.style.transform = ''; // up
            btn.setAttribute('aria-label', 'Collapse Auto Hunt');
            localStorage.setItem(STORAGE_KEY, '0');

            // After transition, set to 'auto' to handle dynamic content growth
            const onEnd = () => {
                if (!panel.classList.contains('is-collapsed')) {
                    contentWrap.style.height = 'auto';
                }
                contentWrap.removeEventListener('transitionend', onEnd);
            };
            contentWrap.addEventListener('transitionend', onEnd);
        }

        function toggle() {
            if (panel.classList.contains('is-collapsed')) {
                expand();
            } else {
                collapse();
            }
        }

        // Click + keyboard
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggle();
        });
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
            }
        });

        // If content changes size while expanded, re-fit height
        const ro = new ResizeObserver(() => {
            if (!panel.classList.contains('is-collapsed')) {
                setContentHeightToAuto();
            }
        });
        ro.observe(contentWrap);
    }

    async function init() {
        try {
            await waitForEl(`#${PANEL_ID}`);
            injectStyles();
            const panel = document.getElementById(PANEL_ID);
            if (!panel) return;
            enhance(panel);
        } catch (e) {
            // silent fail
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, {
            once: true
        });
    } else {
        init();
    }

    // Safety net: if the panel is mounted later in a SPA
    const bootObserver = new MutationObserver(() => {
        const panel = document.getElementById(PANEL_ID);
        if (panel && !panel.querySelector('.wave-ah__collapse-btn')) {
            injectStyles();
            enhance(panel);
            // If you know this panel won’t get re-mounted, you can disconnect:
            // bootObserver.disconnect();
        }
    });
    bootObserver.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true
    });
})();

//Guild members in red
(function() {
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
            "/inventory.php",
            "/blacksmith.php",
            "/stats.php",
            "/achievements.php",


        ];

        // If any target is present in the path or full URL → exception
        return targets.some(t => path.includes(t) || href.includes(t));
    }


    if (isExceptionPage()) return;
    //if (!vv.isOn('membersInRed')) return;
    'use strict';

    const GUILD_URL = '/guild_members.php';

    // ==== Styles ==============================================================
    function ensureStyles() {
        if (document.getElementById('guild-highlight-style')) return;
        const style = document.createElement('style');
        style.id = 'guild-highlight-style';
        style.textContent = `
      /* Red tag we prepend when missing */
      .guild-ahab-tag {
        color: red;
        font-weight: 700;
      }
      /* Red letters "AHAB" when present in existing text */
      .guild-ahab {
        color: red;
        font-weight: 700;
      }
      /* Container to mark processed chunks so we don't double-process */
      .guild-hl { }
    `;
        document.head.appendChild(style);
    }

    // ==== Utilities ===========================================================
    // Normalize for quick test only (replacement uses original text)
    function normalizeForMatch(s) {
        if (!s) return s;
        return s
            .replace(/\u00A0/g, ' ') // NBSP -> space
            .replace(/[\u200B-\u200D]/g, ''); // remove zero-width chars
    }

    // Remove noise from display name from the guild list
    function sanitizeDisplayName(raw) {
        let s = (raw || '');
        // Remove trailing "(you)"
        s = s.replace(/\s*\(you\)\s*$/i, '');
        // OPTIONAL: remove any trailing parenthetical note
        // s = s.replace(/\s*\([^)]*\)\s*$/i, '');
        return s.trim().replace(/\s+/g, ' ');
    }

    // Fetch first <a> text inside each <tr> in <tbody> from /guild_members.php
    async function fetchGuildMemberNames() {
        const res = await fetch(GUILD_URL, {
            credentials: 'same-origin',
            cache: 'no-store'
        });
        if (!res.ok) throw new Error(`Failed to fetch ${GUILD_URL}: ${res.status}`);
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const namesSet = new Set();
        doc.querySelectorAll('tbody tr').forEach(tr => {
            const a = tr.querySelector('a');
            if (a) {
                const name = sanitizeDisplayName(a.textContent);
                if (name) namesSet.add(name);
            }
        });

        return Array.from(namesSet);
    }

    // Regex helpers
    function escapeRegExp(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function supportsLookbehind() {
        try {
            return /(?<=a)b/u.test('ab');
        } catch {
            return false;
        }
    }

    // Build a whitespace-flexible username core and allow tag on either side:
    //   [TAG] username
    //   username [TAG]
    //   [TAG]username
    //   username[TAG]
    function buildCoreNamePattern(sanitizedName) {
        // Strip one leading or trailing [ ... ] tag from the *source* to get canonical username
        const username = sanitizedName
            .replace(/^\s*\[[^\]]+\]\s*/, '') // leading tag
            .replace(/\s*\[[^\]]+\]\s*$/, '') // trailing tag
            .trim();

        const escapedUser = escapeRegExp(username);
        const userFlexible = escapedUser.replace(/ +/g, '\\s+');

        const tagPat = '\\[[^\\]]+\\]'; // any [ ... ]

        // Optional tag before and/or after username; spaces around are optional
        return `(?:${tagPat}\\s*)?${userFlexible}(?:\\s*${tagPat})?`;
    }

    // Add token boundaries so we don't match inside other words (Ocean ≠ Oceanic)
    function applyTokenBoundaries(pattern, useLB) {
        const notWord = '[^\\p{L}\\p{N}_]'; // letters/digits/_ are "word"
        const left = useLB ? `(?<=^|${notWord})` : `(^|${notWord})`;
        const right = `(?=$|${notWord})`;
        return useLB ?
            `${left}(?:${pattern})${right}` :
            `${left}(${pattern})${right}`; // capture left boundary to reinsert in replacement
    }

    function buildRegexes(names) {
        if (!names || names.length === 0) return null;

        const useLB = supportsLookbehind();
        const cores = names.map(buildCoreNamePattern).sort((a, b) => b.length - a.length);
        const bounded = cores.map(p => applyTokenBoundaries(p, useLB));
        const union = '(' + bounded.join('|') + ')';

        return {
            mode: useLB ? 'lookbehind' : 'fallback',
            test: new RegExp(union, 'iu'),
            replace: new RegExp(union, 'giu')
        };
    }

    // Skip non-content or already-processed areas
    function shouldSkipElement(el) {
        if (!(el instanceof Element)) return false;
        const tag = el.tagName;
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE', 'INPUT'].includes(tag)) return true;
        if (el.closest('.guild-hl')) return true; // whole block already processed
        if (el.closest('.guild-ahab, .guild-ahab-tag')) return true; // any inner parts already marked
        return false;
    }

    // Decorate a matched chunk:
    // - If it already contains "AHAB" (any case), color just those letters red.
    // - Else, prepend a red "[AHAB]" plus a space, then the original chunk.
    function decorateInsert(core) {
        if (/AHAB/i.test(core)) {
            return `<span class="guild-hl">${
        core.replace(/AHAB/gi, m => `<span class="guild-ahab">${m}</span>`)
      }</span>`;
        }
        // No "AHAB" found: prepend red [AHAB]
        return `<span class="guild-hl"><span class="guild-ahab-tag">[AHAB]</span> ${core}</span>`;
    }

    // Perform highlighting/insertion in a node
    function highlightNode(node, re) {
        if (!re) return;

        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.nodeValue;
            if (!text) return;

            const testText = normalizeForMatch(text);
            if (!re.test.test(testText)) return;

            const wrapper = document.createElement('span');

            if (re.mode === 'lookbehind') {
                // Boundaries are zero-width: replace exact match
                wrapper.innerHTML = text.replace(re.replace, match => decorateInsert(match));
            } else {
                // Fallback (no lookbehind): union includes left boundary inside the overall match.
                wrapper.innerHTML = text.replace(re.replace, function() {
                    const args = Array.from(arguments);
                    const whole = args[0];
                    const offset = args[args.length - 2];

                    // If the match starts with a non-word boundary char, keep it outside our decorated block.
                    let leadingBoundary = '';
                    let core = whole;
                    if (core.length > 0 && !/[\p{L}\p{N}_]/u.test(core[0])) {
                        leadingBoundary = core[0];
                        core = core.slice(1);
                    }
                    return leadingBoundary + decorateInsert(core);
                });
            }

            if (node.parentNode) node.parentNode.replaceChild(wrapper, node);

        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node;
            if (shouldSkipElement(el)) return;

            const children = Array.from(el.childNodes);
            for (const child of children) highlightNode(child, re);
        }
    }

    // ==== Init ================================================================
    async function init() {
        try {
            ensureStyles();

            const names = await fetchGuildMemberNames();
            if (!names.length) {
                console.warn('Guild highlighter: no names found at', GUILD_URL);
                return;
            }

            const re = buildRegexes(names);

            // Initial pass
            highlightNode(document.body, re);

            // Watch future DOM updates
            const observer = new MutationObserver(mutations => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
                                highlightNode(node, re);
                            }
                        });
                    } else if (mutation.type === 'characterData') {
                        highlightNode(mutation.target, re);
                    }
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: false
            });

        } catch (err) {
            console.error('Guild highlighter error:', err);
        }
    }

    init();
})();

//live timer for dungeon pvp
(function() {
    'use strict';

    // Try to find the warning div
    function start() {
        const warn = document.querySelector(".warn");
        if (!warn) return;

        const text = warn.textContent;
        const match = text.match(/(\d{2}):(\d{2}):(\d{2})/);
        if (!match) return;

        let hours = parseInt(match[1], 10);
        let minutes = parseInt(match[2], 10);
        let seconds = parseInt(match[3], 10);

        // Convert to total seconds
        let total = hours * 3600 + minutes * 60 + seconds;

        // Create a new span to update
        const span = document.createElement("span");
        span.style.fontWeight = "bold";

        // Replace the time in the message with span
        warn.innerHTML = warn.innerHTML.replace(/(\d{2}:\d{2}:\d{2})/, `<span id="liveTimer"></span>`);
        const timer = document.querySelector("#liveTimer");

        function update() {
            if (total <= 0) {
                timer.textContent = "00:00:00";
                clearInterval(interval);
                return;
            }

            total--;

            const h = String(Math.floor(total / 3600)).padStart(2, "0");
            const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
            const s = String(total % 60).padStart(2, "0");

            timer.textContent = `${h}:${m}:${s}`;
        }

        update(); // initial display
        const interval = setInterval(update, 1000);
    }

    // Allow page to finish loading dynamic content
    setTimeout(start, 500);
})();

//dungeon pvp match collapser
(function() {
if (!vv.isOn('dungeon_pvp_match')) return;

    // Run once DOM is ready
function init() {

    document.querySelectorAll('.match').forEach(match => {

        // Mark as collapsed by default
        match.dataset.collapsed = "1";

        // Auto-collapse on page load
        toggleMatch(match, true);

        // Add click listeners to badges
        match.querySelectorAll('.badge').forEach(badge => {

            badge.style.cursor = "pointer";

            badge.addEventListener('click', () => {

                const collapsed = match.dataset.collapsed === "1";
                match.dataset.collapsed = collapsed ? "0" : "1";

                toggleMatch(match, !collapsed);
            });

        });
    });

    applyStatusOrder();
    highlightSelfMarked();
    copyRewardsToTop();

}
    // Hide everything except matchTop + meta
function toggleMatch(match, collapse) {

    const keep = ['.matchTop', '.meta','.slots'];

    // Adjust container height
    match.style.minHeight = collapse ? "120px" : "330px";

    Array.from(match.children).forEach(child => {

        const shouldKeep = keep.some(sel => child.matches(sel));

        if (shouldKeep) {
            child.style.display = "";
        } else {
            child.style.display = collapse ? "none" : "";
        }
    });
}
    // Wait until the .match elements exist
    function waitForMatches() {
        const exists = document.querySelector('.match');
        if (exists) init();
        else setTimeout(waitForMatches, 300);
    }
    waitForMatches();

function copyRewardsToTop() {
    document.querySelectorAll('.match').forEach(match => {

        const rewardItems = match.querySelectorAll('.rewardItem');
        if (!rewardItems.length) return;

        const rewards = [];

        rewardItems.forEach(item => {
            const name = item.querySelector('.rewardName')?.textContent.trim();
            const qty  = item.querySelector('.rewardQty')?.textContent.trim();
            if (name && qty) rewards.push(`${name} ${qty}`);
        });

        if (!rewards.length) return;

        // Create or reuse reward summary container
        let rewardSummary = match.querySelector('.rewardSummary');
        if (!rewardSummary) {
            rewardSummary = document.createElement('div');
            rewardSummary.className = 'rewardSummary';
            rewardSummary.style.fontSize = '12px';
            rewardSummary.style.opacity = '0.9';
            rewardSummary.style.marginTop = '4px';

            // Insert under title inside matchTop
            const matchTop = match.querySelector('.meta');
            matchTop.appendChild(rewardSummary);
        }

        rewardSummary.textContent = `Rewards: ${rewards.join(', ')}`;
    });
}

function applyStatusOrder() {
    const orderMap = {
        open: 2,
        live: 3,
        cleared: 4
    };

    document.querySelectorAll('.match').forEach(match => {
        const badge = match.querySelector('.badge');
        const slots = match.querySelector('.slots .slot.selfMark');

        // If selfMark present → go to top
        if (slots) {
            match.style.order = 1;   // highest priority
            return;
        }

        // Otherwise use regular status order
        if (badge) {
            const status = badge.textContent.trim().toLowerCase();
            match.style.order = orderMap[status] || 99;
        }
    });
}

    function highlightSelfMarked() {
    document.querySelectorAll('.match').forEach(match => {

        // This finds .selfMark even if deeply nested
        const hasSelfMark = match.querySelector('.slots .slot .selfMark');

        if (hasSelfMark) {
            match.classList.add('highlightSelfMark');
        } else {
            match.classList.remove('highlightSelfMark');
        }
    });
}

})();

//cube dg scroll + filter
(function () {
    'use strict';

    /* -------------------------------------------
       Inject DARK THEME STYLES to match Crucible
    ------------------------------------------- */
    function injectStyles() {
        const style = document.createElement("style");
        style.textContent = `

        /* --- FILTER ROW --- */
        .filterRow th {
            background: rgba(255, 255, 255, 0.03);
            padding: 6px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }

        /* --- SELECT DROPDOWNS --- */
        .filterRow select {
            width: 100%;
            padding: 4px 6px;
            border-radius: 6px;
            background: rgba(23, 28, 45, 0.9);
            color: #d0d8e8;
            border: 1px solid rgba(120, 160, 255, 0.25);
            font-size: 12px;
            outline: none;
        }

        .filterRow select:hover {
            border-color: rgba(160, 200, 255, 0.45);
        }

        .filterRow select:focus {
            border-color: rgba(190, 220, 255, 0.75);
            box-shadow: 0 0 6px rgba(100, 150, 255, 0.4);
        }

        /* --- HEADER SORTING ARROWS --- */
        th.sort-asc::after {
            content: " ▲";
            color: #9ec9ff;
        }
        th.sort-desc::after {
            content: " ▼";
            color: #9ec9ff;
        }

        /* --- MAKE HEADER MATCH THE THEME --- */
        .nodeTable th {
            cursor: pointer;
            background: rgba(255, 255, 255, 0.03);
            color: #e0e6f0;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.05em;
        }

        /* --- ROW HOVER --- */
        .nodeTable tbody tr:hover {
            background: rgba(255, 255, 255, 0.04) !important;
        }

        `;
        document.head.appendChild(style);
    }

    /* -------------------------------------------
       SORT + FILTER main function
    ------------------------------------------- */
    function enhanceTable() {
        const table = document.querySelector(".nodeTable");
        if (!table) return;

        const thead = table.querySelector("thead");
        const headers = thead.querySelectorAll("th");

        /* -------------------------------------------
           BUILD FILTER ROW
        ------------------------------------------- */
        const filterRow = document.createElement("tr");
        filterRow.classList.add("filterRow");

        headers.forEach((th, colIndex) => {
            const filterCell = document.createElement("th");
            const select = document.createElement("select");

            select.innerHTML = `<option value="">(All)</option>`;

            // Collect unique values
            const columnValues = new Set();
            table.querySelectorAll("tbody tr").forEach(row => {
                const cell = row.children[colIndex];
                if (!cell) return;

                const text = cell.innerText.trim();
                if (text.length > 0) columnValues.add(text);
            });

            [...columnValues]
                .sort()
                .forEach(value => {
                    const opt = document.createElement("option");
                    opt.value = value;
                    opt.textContent = value;
                    select.appendChild(opt);
                });

            select.addEventListener("change", applyFilters);

            filterCell.appendChild(select);
            filterRow.appendChild(filterCell);
        });

        thead.appendChild(filterRow);

        /* -------------------------------------------
           SORTING
        ------------------------------------------- */
        headers.forEach((th, index) => {
            th.addEventListener("click", () => {
                const tbody = table.querySelector("tbody");
                const rows = Array.from(tbody.querySelectorAll("tr"));

                const currentSort = th.dataset.sort || "none";
                const newSort = currentSort === "asc" ? "desc" : "asc";

                headers.forEach(h => h.removeAttribute("data-sort"));
                th.dataset.sort = newSort;

                rows.sort((a, b) => {
                    const aText = a.children[index]?.innerText.trim().toLowerCase() || "";
                    const bText = b.children[index]?.innerText.trim().toLowerCase() || "";

                    const aNum = parseFloat(aText);
                    const bNum = parseFloat(bText);

                    const numeric = !isNaN(aNum) && !isNaN(bNum);

                    if (numeric) {
                        return newSort === "asc" ? aNum - bNum : bNum - aNum;
                    }

                    return newSort === "asc"
                        ? aText.localeCompare(bText)
                        : bText.localeCompare(aText);
                });

                tbody.innerHTML = "";
                rows.forEach(row => tbody.appendChild(row));

                applyFilters();
            });
        });

        /* -------------------------------------------
           FILTER FUNCTION
        ------------------------------------------- */
        function applyFilters() {
            const tbody = table.querySelector("tbody");
            const rows = [...tbody.querySelectorAll("tr")];
            const selectors = filterRow.querySelectorAll("select");

            rows.forEach(row => {
                let visible = true;

                selectors.forEach((select, i) => {
                    const filterValue = select.value;
                    const cellValue = row.children[i]?.innerText.trim() || "";

                    if (filterValue && cellValue !== filterValue) {
                        visible = false;
                    }
                });

                row.style.display = visible ? "" : "none";
            });
        }
    }

    /* -------------------------------------------
       MutationObserver waits for the table
    ------------------------------------------- */
    const observer = new MutationObserver(() => {
        const table = document.querySelector(".nodeTable");
        if (table) {
            injectStyles();
            enhanceTable();
            observer.disconnect();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();

//Cube dungeon Leaderboard
(function () {
    if (!vv.isOn('cube_dung_leaderb')) return;
    'use strict';

    if (!/guild_dungeon_cube\.php/.test(window.location.pathname)) return;

    // ---------------- GLOBAL STORES ----------------
    window.players = {};       // PvE damage
    window.mobs = {};          // PvE mob structure
    window.pvpWins = {};       // PvP wins
    window.armyKills = {};     // Army kills
    window.pvpSigils = {};   // { playerName: sigilCount }

    window.sigilsDone = false;
    window.pveDone = false;
    window.pvpDone = false;
    window.armyDone = false;

    const dungeonId = new URL(window.location.href).searchParams.get("id") || "default";
    const instanceId = new URL(window.location.href).searchParams.get("instance_id") || dungeonId;

    const CACHE_KEY = `dungeon_scan_cache_${dungeonId}`;
    const CACHE_CONFIG_KEY = `dungeon_cache_config_${dungeonId}`;

    // ======================================================================
    // NORMALIZATION
    // ======================================================================
    function normalizeName(raw) {
        return raw.replace(/\s+/g, " ").trim();
    }

    function getAside() {
        return document.querySelector("aside.panel.side.side-focus");
    }

    function getCacheDuration() {
        const conf = JSON.parse(localStorage.getItem(CACHE_CONFIG_KEY) || "{}");
        return conf.durationHours ? conf.durationHours * 3600000 : 12 * 3600000;
    }

    function saveCache() {
        try {
            const data = {
                savedAt: Date.now(),
                players: window.players,
                mobs: window.mobs
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch { }
    }

    function loadCache() {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (!data.savedAt) return null;
            if (Date.now() - data.savedAt > getCacheDuration()) return null;
            return data;
        } catch {
            return null;
        }
    }

    // ======================================================================
    // PROGRESS BAR + ETA SYSTEM
    // ======================================================================

    window.__pendingPvE = 0;
    window.__pendingPvPRuns = 0;
    window.__pendingArmyRequests = 0;
    window.__totalWorkUnits = 0;
    window.__completedWorkUnits = 0;

    let avgRequestTime = 0;
    let totalMeasuredRequests = 0;

    function recordRequestTime(ms) {
        totalMeasuredRequests++;
        avgRequestTime = ((avgRequestTime * (totalMeasuredRequests - 1)) + ms) / totalMeasuredRequests;
    }

    function updateProgress() {
        const bar = document.getElementById("pve_progress_bar");
        const etaBox = document.getElementById("pve_loading_eta");
        if (!bar || !etaBox) return;

        const pct = window.__completedWorkUnits / window.__totalWorkUnits;
        bar.style.width = `${Math.min(100, pct * 100)}%`;


        let remainingUnits = window.__totalWorkUnits - window.__completedWorkUnits;
        if (remainingUnits < 0) remainingUnits = 0;  // clamp

        const etaMs = remainingUnits * avgRequestTime;


       if (remainingUnits === 0) {
    etaBox.textContent = `done`;
} else {
    etaBox.textContent =
        `~ ${etaMs < 1000 ? Math.round(etaMs) + 'ms' : (etaMs / 1000).toFixed(1) + 's'} remaining`;
}
    }

    // ======================================================================
    // FINAL LEADERBOARD RENDERER
    // ======================================================================
    function buildMergedLeaderboard() {
        if (!window.pveDone || !window.pvpDone || !window.armyDone || !window.sigilsDone) return;


        const aside = getAside();
        if (!aside) return;

        const oldLoading = document.getElementById("pve_loading_box");
        if (oldLoading) oldLoading.remove();

        const oldBox = document.getElementById("merged_final_box");
        if (oldBox) oldBox.remove();

        // ---------------- MERGE EVERYTHING ----------------
        const merged = {};

        // PvE damage
        for (const [pname, pdata] of Object.entries(window.players)) {
            let total = 0;
            for (const mobName of Object.keys(pdata.mobs)) {
                const insts = window.mobs[mobName]?.instances || {};
                for (const inst of Object.values(insts)) {
                    if (inst.players[pname]) total += inst.players[pname];
                }
            }

            const norm = normalizeName(pname);

            merged[norm] = {
                name: norm,
                pveDamage: total,
                armyKills: window.armyKills[norm] || 0,
                pvpWins: 0,
                sigils: window.pvpSigils[norm] || 0
            };
        }

        // PvP wins
        for (const [pname, wins] of Object.entries(window.pvpWins)) {
            const norm = normalizeName(pname);
            if (!merged[norm]) {
                merged[norm] = {
                    name: norm,
                    pveDamage: 0,
                    armyKills: window.armyKills[norm] || 0,
                    pvpWins: wins,
                    sigils: window.pvpSigils[norm] || 0

                };
            } else {
                merged[norm].pvpWins = wins;
                merged[norm].sigils = window.pvpSigils[norm] || 0;
            }
        }

        // Army-only participants
        for (const [pname, kills] of Object.entries(window.armyKills)) {
            const norm = normalizeName(pname);
            if (!merged[norm]) {
                merged[norm] = {
                    name: norm,
                    pveDamage: 0,
                    armyKills: kills,
                    pvpWins: 0,
                    sigils: window.pvpSigils[norm] || 0
                };
            } else {
                merged[norm].armyKills = kills;
                merged[norm].sigils = window.pvpSigils[norm] || 0;

            }
        }

        // Sort by PvE damage
        const sorted = Object.values(merged)
            .sort((a, b) => b.pveDamage - a.pveDamage);

        // Build UI
        const box = document.createElement("div");
        box.className = "box";
        box.id = "merged_final_box";

        box.innerHTML = `
            <div class="k">
                Combined Leaderboard
                <button id="force_rescan"
                    style="
                        float:right;
                        padding:4px 7px;
                        border-radius:6px;
                        background:#ff6b6b;
                        color:#000;
                        font-weight:700;
                        border:none;
                        cursor:pointer;
                    ">
                    Rescan
                </button>
            </div>

            <div class="list" id="combinedList"
                style="width:100%; display:flex; flex-direction:column; gap:10px; padding:6px 0;">
            </div>
        `;

        const listDiv = box.querySelector("#combinedList");

        sorted.forEach((p, idx) => {
const card = document.createElement("div");
card.style.cssText = `
    width: 100%;
    background: rgba(255,255,255,0.06);
    padding: 10px 12px;
    border-radius: 10px;
    display: block;
    box-sizing: border-box;
`;

const text = document.createElement("div");
text.innerHTML = `
    <strong>#${idx + 1} — ${p.name}</strong><br>
    <small>
      ${p.pveDamage.toLocaleString()} damage /
      ${p.armyKills} army kills /
      ${p.pvpWins} PvP wins /
      🏅 ${p.sigils} sigils
    </small>
`;

card.appendChild(text);
listDiv.appendChild(card);
        });

        // Insert as SECOND .box
        const boxes = aside.querySelectorAll(".box");
        if (boxes.length > 0) {
            boxes[0].insertAdjacentElement("afterend", box);
        } else {
            aside.appendChild(box);
        }

        document.getElementById("force_rescan").onclick = () => {
            localStorage.removeItem(CACHE_KEY);
            location.reload();
        };
    }

    // ======================================================================
    // PVE CRAWLER
    // ======================================================================
    function startPVE() {
        const cached = loadCache();
        if (cached) {
            window.players = cached.players;
            window.mobs = cached.mobs;
            window.pveDone = true;
            //buildMergedLeaderboard();
            return;
        }

        // Display loading box
        const aside = getAside();
        const loading = document.createElement("div");
        loading.className = "box";
        loading.id = "pve_loading_box";
        loading.innerHTML = `
            <div class="k">Combined Leaderboard</div>
            <p style="padding:10px;color:#ccc;">
                ⏳ Scanning… <span id="pve_loading_eta"></span>
                <div id="pve_progress_container"
                    style="
                        margin-top:8px;
                        width:100%;
                        height:8px;
                        background:#1e1e1e;
                        border-radius:4px;
                        overflow:hidden;
                    ">
                    <div id="pve_progress_bar"
                        style="
                            width:0%;
                            height:100%;
                            background:#ff6b6b;
                            transition:width 0.2s ease-out;
                        ">
                    </div>
                </div>
            </p>
        `;
        aside.insertAdjacentElement("afterbegin", loading);

        const players = window.players;
        const mobs = window.mobs;

        const mobQueue = [];
        let totalLocations = 0;
        let processedLocations = 0;
        let activeRequests = 0;

        const urls = [11, 12, 13, 14].map(
            id => `/guild_dungeon_location.php?instance_id=${instanceId}&location_id=${id}`
        );

        totalLocations = urls.length;

        // Set estimated workloads
        const estimatedPvEMobs = 25;
        const estimatedPvE = 4 + estimatedPvEMobs;
        const estimatedPvP = 3;
        const estimatedArmy = 3 + 4 + 4 + 1;
        const estimatedSigils = 3;

        window.__totalWorkUnits = estimatedPvE + estimatedPvP + estimatedArmy+ estimatedSigils;

        function crawlMob() {
            if (mobQueue.length === 0) {
                if (activeRequests === 0) finishPVE();
                return;
            }

            const job = mobQueue.shift();
            window.__pendingPvE++;
            const t0 = performance.now();
            activeRequests++;

            GM_xmlhttpRequest({
                method: "GET",
                url: job.url,

                onload: res => {
                    recordRequestTime(performance.now() - t0);
                    window.__pendingPvE--;
                    window.__completedWorkUnits++;
                    updateProgress();

                    activeRequests--;
                    const doc = new DOMParser().parseFromString(res.responseText, "text/html");
                    const rows = [...doc.querySelectorAll(".lb-row")];

                    rows.forEach(r => {
                        const link = r.querySelector(".lb-name a");
                        const dmgEl = r.querySelector(".lb-dmg");
                        if (!link) return;

                        const dmg = parseInt((dmgEl?.textContent ?? "0").replace(/\D/g, "")) || 0;
                        if (dmg <= 0) return;

                        const pname = normalizeName(link.textContent);

                        if (!players[pname]) players[pname] = { mobs: {} };
                        players[pname].mobs[job.mobName] = 1;

                        mobs[job.mobName].instances[job.mobId].players[pname] = dmg;
                    });

                    setTimeout(crawlMob, 0);
                },

                onerror: () => {
                    window.__pendingPvE--;
                    window.__completedWorkUnits++;
                    updateProgress();

                    activeRequests--;
                    setTimeout(crawlMob, 0);
                }
            });
        }

        function finishPVE() {
            saveCache();
            window.pveDone = true;
            buildMergedLeaderboard();
        }

        // Fetch dungeon location pages
        urls.forEach(url => {
            window.__pendingPvE++;
            const t0 = performance.now();

            GM_xmlhttpRequest({
                method: "GET",
                url,

                onload: res => {
                    recordRequestTime(performance.now() - t0);
                    window.__pendingPvE--;
                    window.__completedWorkUnits++;
                    updateProgress();

                    processedLocations++;

                    const doc = new DOMParser().parseFromString(res.responseText, "text/html");
                    const monDivs = [...doc.querySelectorAll(".mon")];

                    monDivs.forEach(mon => {
                        let name = mon.querySelector("div[style*='font-weight']")
                            ?.textContent.trim() ?? "Unknown Mob";
                        name = name.replace(/\(.*?\)/, "").trim();

                        const link = mon.querySelector('a.btn[href*="battle.php"]');
                        if (!link) return;

                        const mobId = link.href.match(/dgmid=(\d+)/)?.[1] ||
                            Math.random().toString(36).slice(2);

                        mobQueue.push({ url: link.href, mobName: name, mobId });

                        if (!mobs[name]) mobs[name] = { instances: {} };
                        mobs[name].instances[mobId] = { url: link.href, players: {} };
                    });

                    if (processedLocations >= totalLocations) {
                        for (let i = 0; i < 4; i++) crawlMob();
                    }
                },

                onerror: () => {
                    window.__pendingPvE--;
                    window.__completedWorkUnits++;
                    updateProgress();

                    processedLocations++;
                    if (processedLocations >= totalLocations) {
                        for (let i = 0; i < 4; i++) crawlMob();
                    }
                }
            });
        });
    }

    // ======================================================================
    // PVP CRAWLER
    // ======================================================================
    function startPVP() {
        window.pvpWins = {};
        let completed = 0;

        [7, 8, 9].forEach(nodeId => {
            window.__pendingPvPRuns++;
            const t0 = performance.now();

            GM_xmlhttpRequest({
                method: "GET",
                url: `/pvp_style_node.php?instance_id=${instanceId}&source=cube&node_id=${nodeId}`,

                onload: res => {
                    recordRequestTime(performance.now() - t0);
                    window.__pendingPvPRuns--;
                    window.__completedWorkUnits++;
                    updateProgress();

                    completed++;

                    const doc = new DOMParser().parseFromString(res.responseText, "text/html");
                    const slots = doc.querySelectorAll(".slot .name");

                    slots.forEach(s => {
                        const pname = normalizeName(s.textContent);
                        window.pvpWins[pname] = (window.pvpWins[pname] || 0) + 1;
                    });

                    if (completed >= 3) {
                        window.pvpDone = true;
                        buildMergedLeaderboard();
                    }
                },

                onerror: () => {
                    window.__pendingPvPRuns--;
                    window.__completedWorkUnits++;
                    updateProgress();

                    completed++;
                    if (completed >= 3) {
                        window.pvpDone = true;
                        buildMergedLeaderboard();
                    }
                }
            });
        });
    }

    function startSIGILS() {
    const nodes = [7, 8, 9];
    window.pvpSigils = {};
    let completed = 0;

    nodes.forEach(nodeId => {
        const t0 = performance.now();

        GM_xmlhttpRequest({
            method: "GET",
            url: `/pvp_style_node.php?source=cube&instance_id=${instanceId}&node_id=${nodeId}`,

            onload: res => {
                recordRequestTime(performance.now() - t0);
                window.__completedWorkUnits++;
                updateProgress();

                const doc = new DOMParser().parseFromString(res.responseText, "text/html");

                doc.querySelectorAll(".match").forEach(match => {
                    let sigils = 0;

                    match.querySelectorAll(".rewardItem").forEach(item => {
                        if (
                            item.querySelector(".rewardName")?.textContent.trim() === "Crucible Sigil"
                        ) {
                            sigils = parseInt(
                                item.querySelector(".rewardQty")?.textContent.replace(/\D/g, "") || "0",
                                10
                            );
                        }
                    });

                    match.querySelectorAll(".slots .name").forEach(el => {
                        const name = normalizeName(el.textContent);
                        if (!name) return;

                        window.pvpSigils[name] =
                            (window.pvpSigils[name] || 0) + sigils;
                    });
                });

                completed++;
                if (completed >= nodes.length) {
                    window.sigilsDone = true;
                    buildMergedLeaderboard();
                }
            },

            onerror: () => {
                window.__completedWorkUnits++;
                updateProgress();

                completed++;
                if (completed >= nodes.length) {
                    window.sigilsDone = true;
                    buildMergedLeaderboard();
                }
            }
        });
    });
}
    // ======================================================================
    // ARMY CRAWLER (contributors mode)
    // ======================================================================
    function startARMY() {
        window.armyKills = {};
        const nodes = [5, 6, 11];
        let completedNodes = 0;

        nodes.forEach(nodeId => {

            // STEP 1: state → get match count
            window.__pendingArmyRequests++;
            const t0state = performance.now();

            GM_xmlhttpRequest({
                method: "POST",
                url: `/guild_dungeon_cube_army_action.php`,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "Origin": "https://demonicscans.org",
                    "Referer": `https://demonicscans.org/guild_dungeon_cube_army_enter.php?instance_id=${instanceId}&node_id=${nodeId}`
                },
                data: `action=state&instance_id=${instanceId}&node_id=${nodeId}`,

                onload: res => {
                    recordRequestTime(performance.now() - t0state);
                    window.__pendingArmyRequests--;
                    window.__completedWorkUnits++;
                    updateProgress();

                    let json;
                    try {
                        json = JSON.parse(res.responseText);
                    } catch (e) {
                        console.error("Army STATE parse error:", e, res.responseText);
                        finishNode();
                        return;
                    }

                    const required = json.required_matches || 0;
                    if (required === 0) {
                        finishNode();
                        return;
                    }

                    let completedMatches = 0;

                    // STEP 2: contributors
                    for (let m = 1; m <= required; m++) {
                        window.__pendingArmyRequests++;
                        const t0m = performance.now();

                        GM_xmlhttpRequest({
                            method: "POST",
                            url: `/guild_dungeon_cube_army_action.php`,
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                                "Origin": "https://demonicscans.org",
                                "Referer": `https://demonicscans.org/guild_dungeon_cube_army_enter.php?instance_id=${instanceId}&node_id=${nodeId}`
                            },
                            data: `action=contributors&instance_id=${instanceId}&node_id=${nodeId}&match_no=${m}`,

                            onload: r2 => {
                                recordRequestTime(performance.now() - t0m);
                                window.__pendingArmyRequests--;
                                window.__completedWorkUnits++;
                                updateProgress();

                                completedMatches++;

                                let json2;
                                try {
                                    json2 = JSON.parse(r2.responseText);
                                } catch (err) {
                                    console.error("Army CONTRIBUTORS parse", err, r2.responseText);
                                    if (completedMatches >= required) finishNode();
                                    return;
                                }

                                const attackers = json2?.board?.attackers || [];
                                attackers.forEach(a => {
                                    const pname = normalizeName(a.username);
                                    const kills = a.enemy_units_killed || 0;
                                    window.armyKills[pname] =
                                        (window.armyKills[pname] || 0) + kills;
                                });

                                if (completedMatches >= required) finishNode();
                            },

                            onerror: () => {
                                window.__pendingArmyRequests--;
                                window.__completedWorkUnits++;
                                updateProgress();

                                completedMatches++;
                                if (completedMatches >= required) finishNode();
                            }
                        });
                    }
                },

                onerror: () => {
                    window.__pendingArmyRequests--;
                    window.__completedWorkUnits++;
                    updateProgress();

                    finishNode();
                }
            });

            function finishNode() {
                completedNodes++;
                if (completedNodes >= nodes.length) {
                    window.armyDone = true;
                    buildMergedLeaderboard();
                }
            }
        });
    }

    // ======================================================================
    // START EVERYTHING
    // ======================================================================
    startPVE();
    startPVP();
    startARMY();
    startSIGILS();

})();

//Dungeons dropdown site map
(function () {
    'use strict';

    const url = new URL(window.location.href);
    const instance_id = url.searchParams.get("instance_id");
    if (!instance_id) return;

    const locID = Number(url.searchParams.get("location_id"));

    /* -----------------------------------------
       CATEGORY DETECTION
    ----------------------------------------- */

    const CategoryC_Normal = [1, 2, 3, 4, 5];
    const CategoryB_Hard   = [6, 7, 8, 9, 10];
    const CategoryA_PvE    = [11, 12, 13, 14];

    function isCategoryA() {
        return (
            // PvE (IDs 11–14)
            (location.pathname.includes("guild_dungeon_location.php") && CategoryA_PvE.includes(locID)) ||

            // PvP & Army
            location.pathname.includes("pvp_style_node.php") ||
            location.pathname.includes("guild_dungeon_cube_army_enter.php") ||

            // Shop & Forge
            location.pathname.includes("guild_dungeon_cube_shop.php") ||
            location.pathname.includes("guild_dungeon_cube_forge.php")
        );
    }

    function isCategoryB() {
        return location.pathname.includes("guild_dungeon_location.php") &&
               CategoryB_Hard.includes(locID);
    }

    function isCategoryC() {
        return location.pathname.includes("guild_dungeon_location.php") &&
               CategoryC_Normal.includes(locID);
    }

    /* -----------------------------------------
       PLACEHOLDER LOGIC
    ----------------------------------------- */
    function getPlaceholder() {

        // --- Categories C and B and PvE (Category A part) share same placeholder ---
        if (location.pathname.includes("guild_dungeon_location.php")) {
            return document.querySelector(".wrap .row .h");
        }

        // --- PvP & Army ---
        if (location.pathname.includes("pvp_style_node.php") ||
            location.pathname.includes("guild_dungeon_cube_army_enter.php")) {
            return document.querySelector(".wrap .topbar .left .title h1");
        }

        // --- Shop & Forge ---
        if (location.pathname.includes("guild_dungeon_cube_shop.php") ||
            location.pathname.includes("guild_dungeon_cube_forge.php")) {
            return document.querySelector(".wrap .panel .row h1");
        }

        return null;
    }

    /* -----------------------------------------
       MENU BUILDERS
    ----------------------------------------- */

    // CATEGORY A
    function buildMenuA(originalText) {
        return `
        <div class="siteMapDropdown">
            <button class="dropdownToggle">${originalText} ▼</button>
            <div class="dropdownMenu">

                <strong>PvE</strong>
                <a href="/guild_dungeon_location.php?instance_id=${instance_id}&location_id=11">Gate Prism</a>
                <a href="/guild_dungeon_location.php?instance_id=${instance_id}&location_id=12">Ash Lane</a>
                <a href="/guild_dungeon_location.php?instance_id=${instance_id}&location_id=13">Crown Lens</a>
                <a href="/guild_dungeon_location.php?instance_id=${instance_id}&location_id=14">Crown of Calibration</a>

                <strong>PvPE</strong>
                <a href="/pvp_style_node.php?source=cube&instance_id=${instance_id}&node_id=7">Ring Ward Trial</a>
                <a href="/pvp_style_node.php?source=cube&instance_id=${instance_id}&node_id=8">Duel Heart Trial</a>
                <a href="/pvp_style_node.php?source=cube&instance_id=${instance_id}&node_id=9">Tyrant Conclave</a>

                <strong>Army</strong>
                <a href="/guild_dungeon_cube_army_enter.php?instance_id=${instance_id}&node_id=5">Moonfang Ambush</a>
                <a href="/guild_dungeon_cube_army_enter.php?instance_id=${instance_id}&node_id=6">Thornhost Phalanx</a>
                <a href="/guild_dungeon_cube_army_enter.php?instance_id=${instance_id}&node_id=11">Abyssal Muster</a>

                <strong>Forge</strong>
                <a href="/guild_dungeon_cube_forge.php?instance_id=${instance_id}&node_id=13">Quiet Anvil</a>

                <strong>Shop</strong>
                <a href="/guild_dungeon_cube_shop.php?instance_id=${instance_id}&node_id=4">Relay Kiln Exchange</a>

            </div>
        </div>
        `;
    }

    // CATEGORY B (HARD MODE)
    function buildMenuB(originalText) {
        return `
        <div class="siteMapDropdown">
            <button class="dropdownToggle">${originalText} ▼</button>
            <div class="dropdownMenu">

                <strong>Hard Mode</strong>
                <a href="/guild_dungeon_location.php?instance_id=${instance_id}&location_id=6">The Vizier's Conspiracy Hall</a>
                <a href="/guild_dungeon_location.php?instance_id=${instance_id}&location_id=7">Hall of the Bloodbound</a>
                <a href="/guild_dungeon_location.php?instance_id=${instance_id}&location_id=8">Room of Beasts</a>
                <a href="/guild_dungeon_location.php?instance_id=${instance_id}&location_id=9">Room of the Dead Crown</a>
                <a href="/guild_dungeon_location.php?instance_id=${instance_id}&location_id=10">The True Heir Throne Boss</a>

            </div>
        </div>
        `;
    }

    // CATEGORY C (NORMAL MODE 1–5)
    function buildMenuC(originalText) {
        return `
        <div class="siteMapDropdown">
            <button class="dropdownToggle">${originalText} ▼</button>
            <div class="dropdownMenu">

                <strong>Normal Mode</strong>
                <a href="/guild_dungeon_location.php?instance_id=${instance_id}&location_id=1">Brood Pits</a>
                <a href="/guild_dungeon_location.php?instance_id=${instance_id}&location_id=2">Plunder Warrens</a>
                <a href="/guild_dungeon_location.php?instance_id=${instance_id}&location_id=3">Shattered Stone Causeways</a>
                <a href="/guild_dungeon_location.php?instance_id=${instance_id}&location_id=4">Territory Center</a>
                <a href="/guild_dungeon_location.php?instance_id=${instance_id}&location_id=5">Boss Room</a>

            </div>
        </div>
        `;
    }

    /* -----------------------------------------
       STYLES
    ----------------------------------------- */
    function injectStyles() {
        const css = `
        .siteMapDropdown { position: relative; display: inline-block; }
        .dropdownToggle {
            background: none; border: none;
            font-size: 26px; font-weight: bold;
            cursor: pointer; color: white;
            padding: 0; margin-top: 15px;
        }
        .dropdownMenu {
            display: none;
            position: absolute;
            background: #1a1a1a;
            border: 1px solid #333;
            padding: 10px 14px;
            min-width: 260px;
            z-index: 999;
            border-radius: 4px;
        }
        .dropdownMenu a {
            display: block;
            color: #ccc;
            padding: 4px 0;
            text-decoration: none;
        }
        .dropdownMenu strong { display: block; margin-top: 10px; color: #fff; }
        .dropdownMenu a:hover { color: white; }
        `;
        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
    }

    /* -----------------------------------------
       EVENTS
    ----------------------------------------- */
    function attachEvents() {
        const toggle = document.querySelector(".dropdownToggle");
        const menu = document.querySelector(".dropdownMenu");
        const wrap = document.querySelector(".siteMapDropdown");

        toggle.addEventListener("click", () => {
            menu.style.display = (menu.style.display === "block" ? "none" : "block");
        });

        document.addEventListener("click", (e) => {
            if (!wrap.contains(e.target)) {
                menu.style.display = "none";
            }
        });
    }

    /* -----------------------------------------
       INIT
    ----------------------------------------- */
    function init() {
        const placeholder = getPlaceholder();
        if (!placeholder) return requestAnimationFrame(init);

        const originalText = placeholder.textContent.trim();
        const wrapper = document.createElement("div");

        if (isCategoryB())       wrapper.innerHTML = buildMenuB(originalText);
        else if (isCategoryC())  wrapper.innerHTML = buildMenuC(originalText);
        else if (isCategoryA())  wrapper.innerHTML = buildMenuA(originalText);
        else return;

        placeholder.replaceWith(wrapper);
        injectStyles();
        attachEvents();
    }

    init();

})();

//Army damage dealt
(function () {
    if (!vv.isOn('army_damage_dealt')) return;
    'use strict';
    if (!/shadow_army_live_battle\.php$/.test(window.location.pathname)) return;
    const CONTRIBUTORS_URL =
        "https://demonicscans.org/guild_dungeon_cube_army_action.php";

    const STATE_URL =
        "https://demonicscans.org/shadow_army_live_battle.php";

    /* ======================
       Helpers
    ====================== */

    function getMyUserId() {
        const m = document.cookie.match(/(?:^|;\s*)demon=(\d+)/);
        return m ? Number(m[1]) : null;
    }

    function getInstanceAndNode() {
        const btn = document.querySelector('a.btn[href*="instance_id"]');
        if (!btn) return null;

        const u = new URL(btn.href, location.origin);
        return {
            instanceId: u.searchParams.get("instance_id"),
            nodeId: u.searchParams.get("node_id")
        };
    }

    function waitForElement(selector, cb) {
        const el = document.querySelector(selector);
        if (el) cb(el);
        else setTimeout(() => waitForElement(selector, cb), 200);
    }

    /* ======================
       UI
    ====================== */

    function injectUI() {
        const pill = document.querySelector(".top-actions .status-pill");
        if (!pill || document.getElementById("myDamageTracker")) return;

        const box = document.createElement("div");
        box.id = "myDamageTracker";
        box.style.cssText = `
            margin-left:10px;
            padding:4px 10px;
            background:#222;
            color:#0f0;
            border-radius:6px;
            font-size:14px;
            font-weight:bold;
        `;
        box.innerText = "Total dmg dealt: ...";
        pill.parentNode.appendChild(box);
    }

    /* ======================
       Determine active match
    ====================== */

    async function getActiveMatchNo(battleId) {
        const payload = new URLSearchParams({
            action: "get_state",
            battle_id: battleId
        });

        const res = await fetch(STATE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            body: payload
        });

        const data = await res.json();
        if (!data.ok) return 1;

        // This field tells us which match you're engaged in
        return data.state.viewer.other_active_match_no || 1;
    }

    /* ======================
       Contributors fetch
    ====================== */

    async function fetchMyDamage(instanceId, nodeId, matchNo, myUserId) {
        const payload = new URLSearchParams({
            action: "contributors",
            instance_id: instanceId,
            node_id: String(nodeId),
            match_no: String(matchNo)
        });

        const res = await fetch(CONTRIBUTORS_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            body: payload
        });

        const data = await res.json();
        if (!data.ok) return 0;

        const me = data.board.attackers.find(
            a => a.user_id === myUserId
        );

        return me ? me.damage_dealt : 0;
    }

    /* ======================
       Main loop
    ====================== */

    async function startScanner() {
        const ids = getInstanceAndNode();
        const myUserId = getMyUserId();

        if (!ids || !myUserId) {
            console.warn("Missing instance/node/user.");
            return;
        }

        waitForElement(".status-pill", injectUI);

        console.log(
            "Scanner started:",
            "instance", ids.instanceId,
            "node", ids.nodeId
        );

        let cachedMatchNo = null;

        setInterval(async () => {
            // Derive battle_id from instance (same mapping UI uses)
            const battleId = ids.instanceId;

            cachedMatchNo =
                cachedMatchNo ??
                await getActiveMatchNo(battleId);

            const dmg = await fetchMyDamage(
                ids.instanceId,
                ids.nodeId,
                cachedMatchNo,
                myUserId
            );

            const box = document.getElementById("myDamageTracker");
            if (box) {
                box.innerText =
                    `Total dmg dealt: ${dmg.toLocaleString()}`;

                box.style.color =
                    dmg > 990000 ? "#ff3b3b" : "#0f0";
            }

        }, 1000);
    }

    waitForElement('a.btn[href*="instance_id"]', startScanner);
})();

//PVP HP Bar
(function () {
    if (!vv.isOn('pvp_hp_bar')) return;
    'use strict';

    // Wait until hpText is present in DOM
    const waitForDOM = setInterval(() => {
        if (document.querySelector(".hpText")) {
            clearInterval(waitForDOM);
            initHPBar();
        }
    }, 300);


    function initHPBar() {

        // --- Floating Bar UI ---
        const bar = document.createElement("div");
        bar.id = "floatingHPBar";
      bar.innerHTML = `
    <div class="hp-side left">
        <span class="label">YOU</span>
        <div class="hpBar">
            <div class="hpFill" id="allyFill"></div>
        </div>
        <span class="hpPercent" id="allyPercent"></span>
        <span class="hpText" id="allyText"></span>
    </div>

    <div class="hp-side right">
        <span class="label">ENEMY</span>
        <div class="hpBar enemy">
            <div class="hpFill enemyFill" id="enemyFill"></div>
        </div>
        <span class="hpPercent" id="enemyPercent"></span>
        <span class="hpText" id="enemyText"></span>
    </div>
`;

        document.body.appendChild(bar);

        // CSS stays exactly like your first version
const style = document.createElement("style");
        style.textContent = `
            #floatingHPBar {
                position: fixed;
                top: 78px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 32px;                  /* slightly smaller gap */
                z-index: 99999;
                background: rgba(0,0,0,.45);
                border: 1px solid rgba(255,255,255,.15);
                padding: 4px 14px;          /* reduced height */
                border-radius: 10px;        /* slightly smaller corners */
                backdrop-filter: blur(8px);
            }


    #floatingHPBar .hp-side {
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 1;
    }

    /* Force fixed height rows */
    #floatingHPBar .label {
        font-size: 11px;
        height: 13px;
        display: flex;
        align-items: center;
        margin-bottom: 2px;
        opacity: .8;
    }

    #floatingHPBar .hpBar {
        width: 150px;
        height: 9px;
        margin: 0;
    }

    #floatingHPBar .hpPercent {
        font-size: 10px;
        height: 12px;
        display: flex;
        align-items: center;
        margin-top: 2px;
        opacity: .75;
    }

    #floatingHPBar .hpText {
        font-size: 10px;
        height: 12px;
        display: flex;
        align-items: center;
        margin-top: 2px;
        opacity: .9;
    }


            #floatingHPBar .hpFill {
                height: 100%;
                width: 0;
                background: linear-gradient(90deg, rgba(34,197,94,.95), rgba(0,242,255,.55));
                transition: width .25s ease;
            }

            #floatingHPBar .enemy .hpFill {
                background: linear-gradient(90deg, rgba(255,107,107,.95), rgba(255,209,102,.6));
            }



        `;
        document.head.appendChild(style);

        setInterval(updateFloatingHP, 500);
    }



    // --- MAIN HP READER (DOM-based, correct parsing) ---
    function updateFloatingHP() {

        function readSide(selector) {
            let totalHP = 0;
            let totalMax = 0;

            document.querySelectorAll(selector).forEach(node => {
                const spans = node.querySelectorAll("span");
                if (spans.length === 2) {
                    const currRaw = spans[0].textContent.replace("HP", "").trim();
                    const maxRaw  = spans[1].textContent.trim();

                    const curr = Number(currRaw.replace(/,/g, ""));
                    const max  = Number(maxRaw.replace(/,/g, ""));

                    if (!isNaN(curr)) totalHP += curr;
                    if (!isNaN(max))  totalMax += max;
                }
            });

            return { totalHP, totalMax };
        }

        // Read ally and enemy from DOM
        const ally  = readSide("#allyFormation  .hpText");
        const enemy = readSide("#enemyFormation .hpText");

        // Update YOU
        if (ally.totalMax > 0) {
    const pct = (ally.totalHP / ally.totalMax) * 100;

    document.getElementById("allyFill").style.width = pct + "%";
    document.getElementById("allyText").textContent =
        ally.totalHP.toLocaleString() + " / " + ally.totalMax.toLocaleString();

    document.getElementById("allyPercent").textContent =
        pct.toFixed(1) + "%";
}
        // Update ENEMY
        if (enemy.totalMax > 0) {
            const pct = (enemy.totalHP / enemy.totalMax) * 100;

            document.getElementById("enemyFill").style.width = pct + "%";
            document.getElementById("enemyText").textContent =
                enemy.totalHP.toLocaleString() + " / " + enemy.totalMax.toLocaleString();

            document.getElementById("enemyPercent").textContent =
                pct.toFixed(1) + "%";
        }
    }

})();

//QoL Revamp
(function () {
    if (!vv.isOn('qol_revamp')) return;
  "use strict";
let QOL_ABORTED = false;
if (document.getElementById("wave-addon-filter-panel")) {
  console.log("[QoL] Wave Addon detected — aborting early.");
  QOL_ABORTED = true;
  return;
}

const ATK_SKILLS = {
  1:   { skillId: 0,  label: "Slash" },
  10:  { skillId: -1, label: "Power Slash" },
  50:  { skillId: -2, label: "Heroic Slash" },
  100: { skillId: -3, label: "Ultimate Slash" },
  200: { skillId: -4, label: "Legendary Slash" },
  1000:{ skillId: -5, label: "World Breaker Slash" }
};

const observer = new MutationObserver(() => {
  if (document.getElementById("wave-addon-filter-panel")) {
    console.log("[QoL] Wave Addon detected late — aborting QoL.");
    QOL_ABORTED = true;
    observer.disconnect();
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

const style = document.createElement("style");
style.textContent = `
  .qol-btn {

    display:inline-flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:2px;

    padding:7px 12px;
    font-size:13px;
    font-weight:500;
    color:#e8edff;

    background:#1e2235;
    border:1px solid #303a60;
    border-radius:6px;

    cursor:pointer;
    user-select:none;
    white-space:normal;
    text-align:center;

   transition:
      background 0.15s ease,
      border-color 0.15s ease,
      transform 0.05s ease,
      opacity 0.15s ease;
  }

  .qol-btn:hover:not(:disabled) {
    background:#262b46;
    border-color:#3c4a7a;
  }

  .qol-btn:active:not(:disabled) {
    transform:translateY(1px);
  }

  .qol-btn:disabled {
    opacity:0.55;
    cursor:not-allowed;
  }

 .qol-btn.primary {
    background:#2d7bff;
    border-color:#2d7bff;
    color:#ffffff;
  }

  .qol-btn.primary:hover:not(:disabled) {
    background:#3b86ff;
    border-color:#3b86ff;
  }

.qol-btn.secondary {
    background:#1e2235;
    border-color:#303a60;
    color:#cdd4ff;
  }

@media (max-width: 640px) {

  /* Stack dropdown + status vertically */
  .qol-filter-row {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  /* Status filters go UNDER dropdown */
  .qol-status-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;

    border-radius: 6px;
  }

  /* Make status labels easier to tap */
  .qol-status-filters label {
    padding: 4px 6px;
    font-size: 13px;
  }
}



`;
document.head.appendChild(style);
  /* ===================== Utilities ===================== */


  const sleep = ms => new Promise(r => setTimeout(r, ms));
function notifyStatusAndReload(statusBar, message, delay = 2000) {
  if (statusBar) {
    statusBar.textContent = message;
  }

  setTimeout(() => {
    location.reload();
  }, delay);
}
    function getLargeStaminaPotionInvId() {
        const cards = document.querySelectorAll(".potion-card");
        for (const card of cards) {
            const nameEl = card.querySelector(".potion-name span");
            if (!nameEl) continue;

            if (nameEl.textContent.trim().toLowerCase() === "large stamina potion") {
                return card.dataset.invId;
            }
        }
        return null;
    }

    async function useLargeStaminaPotion() {
        const invId = getLargeStaminaPotionInvId();
        if (!invId) {
            console.warn("[QoL] No Large Stamina Potion found.");
            return false;
        }

        const form = new URLSearchParams();
        form.append("inv_id", invId);

        const res = await fetch("/use_item.php", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: form.toString()
        });

        if (!res.ok) return false;

        console.log("[QoL] Large Stamina Potion used");
        return true;
    }

    function getFullHpPotionInvId() {
        const cards = document.querySelectorAll(".potion-card");
        for (const card of cards) {
            const nameEl = card.querySelector(".potion-name span");
            if (!nameEl) continue;

            if (nameEl.textContent.trim().toLowerCase() === "full hp potion") {
                return card.dataset.invId;
            }
        }
        return null;
    }

    async function useFullHpPotion() {
        const invId = getFullHpPotionInvId();
        if (!invId) {
            console.warn("[QoL] No Full HP Potion found.");
            return false;
        }

        const form = new URLSearchParams();
        form.append("inv_id", invId);

        const res = await fetch("/user_heal_potion.php", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: form.toString()
        });

        if (!res.ok) return false;

        let data;
        try {
            data = await res.json();
        } catch {
            return false;
        }

        // Some responses don’t return HP, so we just trust success
        console.log("[QoL] Full HP Potion used");
        return true;
    }

    function updateHpBar(userHpAfter) {
        const wrapper = document.querySelector(".topbar-hp-wrapper");
        if (!wrapper) return;

        const hpText = wrapper.querySelector(".hp-text");
        const hpFill = wrapper.querySelector(".res-fill.stamina");

        if (!hpText || !hpFill) return;

        // Extract max HP from text: "💚 51,077 / 570,000 HP"
        const match = hpText.textContent.match(/\/\s*([\d,]+)\s*HP/i);
        if (!match) return;

        const maxHp = parseInt(match[1].replace(/,/g, ""), 10);
        if (!maxHp || maxHp <= 0) return;

        const percent = Math.max(0, Math.min(100, (userHpAfter / maxHp) * 100));

        hpFill.style.width = percent.toFixed(2) + "%";
        hpText.textContent =
            `💚 ${userHpAfter.toLocaleString()} / ${maxHp.toLocaleString()} HP`;
    }

    function getMonsterName(card) {
        return (card.dataset.name || "").toLowerCase();
    }

    function getMonsterHp(card) {
  const hpValueEl = card.querySelector(
    '.stat-row .stat-label'
  )?.parentElement.querySelector('.stat-value');

  if (!hpValueEl) return null;

  // Example text: "45,017,289 / 100,000,000"
  const text = hpValueEl.textContent.replace(/\s+/g, " ").trim();
  const match = text.match(/([\d,]+)\s*\/\s*([\d,]+)/);

  if (!match) return null;

  return {
    current: parseInt(match[1].replace(/,/g, ""), 10),
    max: parseInt(match[2].replace(/,/g, ""), 10)
  };
}

    function getUserId() {
        const m = document.cookie.match(/(?:^|;\s*)demon=(\d+)/);
        return m ? m[1] : null;
    }

    function getWaveStorageKey() {
        try {
            const url = new URL(location.href);
            const page = url.pathname.replace(/^\/+/, "").replace(/\.php$/, "");
            const wave = url.searchParams.get("wave") || "nowave";
            const gate = url.searchParams.get("gate");
            const event = url.searchParams.get("event");
            const scope = gate ? `gate${gate}` : event ? `event${event}` : "default";
            return `tm_monster_filter_${page}_wave${wave}_${scope}`;
        } catch {
            return "tm_monster_filter_fallback";
        }
    }
    // ===================== Wave Section (Alive / Dead) =====================
function getWaveSection() {
  const card = document.querySelector(".monster-card");
  if (!card) return "dead";

  return card.dataset.dead === "1" ? "dead" : "alive";
}

const waveSection = getWaveSection();


const BASE_STORAGE_KEY = getWaveStorageKey();

// ✅ alive / dead separation
const STORAGE_KEY = `${BASE_STORAGE_KEY}_${waveSection}`;
const STATUS_STORAGE_KEY = `${BASE_STORAGE_KEY}_status_${waveSection}`;
    const isDungeon = location.pathname.includes("guild_dungeon_location.php");
    const instanceId = isDungeon
    ? new URL(location.href).searchParams.get("instance_id")
    : null;
    function getAtkStorageKey() {
        try {
            const url = new URL(location.href);
            const page = url.pathname.replace(/^\/+/, "").replace(/\.php$/, "");
            const wave = url.searchParams.get("wave") || "nowave";
            const gate = url.searchParams.get("gate");
            const event = url.searchParams.get("event");
            const scope = gate ? `gate${gate}` : event ? `event${event}` : "default";
            return `tm_qol_atklist_${page}_wave${wave}_${scope}`;
        } catch {
            return "tm_qol_atklist_fallback";
        }
    }

    const ATK_STORAGE_KEY = getAtkStorageKey();

    const AUTO_STAM_POTION_KEY = "tm_qol_auto_stamina_potion";

let autoUseStaminaPotion =
  JSON.parse(localStorage.getItem(AUTO_STAM_POTION_KEY) ?? "true");

    /* ===================== Join / Attack ===================== */
    async function joinWaveMonster(mid) {
        const userId = getUserId();
        if (!userId) return false;
        const form = new FormData();
        form.append("monster_id", mid);
        form.append("user_id", userId);
        const res = await fetch("user_join_battle.php", {
            method: "POST",
            credentials: "include",
            body: form
        });
        const txt = (await res.text()).toLowerCase();
        return txt.includes("successfully") || txt.includes("already");
    }

    async function joinDungeonMonster(mid) {
        const form = new FormData();
        form.append("dgmid", mid);
        form.append("instance_id", instanceId);
        const res = await fetch("dungeon_join_battle.php", {
            method: "POST",
            credentials: "include",
            body: form
        });
        const txt = (await res.text()).toLowerCase();
        return txt.includes("successfully") || txt.includes("already");
    }

    let lastKnownStamina = null;

    async function attackMonster(mid, staminaCost, retry = false) {
        const form = new FormData();

        if (isDungeon) {
            form.append("dgmid", mid);
            form.append("instance_id", instanceId);
        } else {
            form.append("monster_id", mid);
        }


        const skill = ATK_SKILLS[staminaCost];
        if (!skill) {
            throw new Error("Unknown stamina cost: " + staminaCost);
        }

        form.append("skill_id", skill.skillId);
        form.append("stamina_cost", staminaCost);

        const res = await fetch("damage.php", {
            method: "POST",
            credentials: "include",
            body: form
        });

        // ✅ Handle server / edge failures FIRST
if (!res.ok) {
  // 429: rate limiting
  if (res.status === 429) {
    throw new Error("RATE_LIMIT");
  }

  // 520 / 502 / 503 / 504: server hiccup
  if (res.status >= 500) {
    console.warn(`[QoL] Server error ${res.status} — temporary failure`);
    throw new Error("SERVER_OVERLOAD");
  }
}

// ✅ Only parse JSON after we know response is OK
let data;
try {
  data = await res.json();
} catch {
  throw new Error("BAD_JSON");
}

        /* ===================== STAMINA ERROR HANDLING ===================== */
 if (!res.ok && data?.message?.toLowerCase().includes("not enough stamina")) {
  if (!autoUseStaminaPotion) {
    console.warn("[QoL] Not enough stamina — auto-use disabled");
    throw new Error("Not enough stamina (auto-use disabled)");
  }

  if (retry) {
    throw new Error("Stamina potion failed or no potion left");
  }

  console.warn("[QoL] Server says: Not enough stamina — using potion");

  const healed = await useLargeStaminaPotion();
  if (!healed) {
    throw new Error("Out of stamina and no potion available");
  }

  await sleep(400);
  return attackMonster(mid, staminaCost, true);
}

        /* ===================== HP FAILSAFE ===================== */
        if (data?.retaliation?.user_hp_after != null) {
            updateHpBar(data.retaliation.user_hp_after);

            if (data.retaliation.user_hp_after <= 0) {
                console.warn("[QoL] HP depleted — using potion");

                const healed = await useFullHpPotion();
                if (!healed) {
                    throw new Error("Out of HP and no potion available");
                }

                await sleep(400);
            }
        }

        /* ===================== STAMINA TRACKING ===================== */
        if (typeof data.stamina === "number") {
            lastKnownStamina = data.stamina;
            //updateStaminaBar(data.stamina);
        }

        if (data.status !== "success") {
            const msg = (data.message || "").toLowerCase();

            // ✅ Soft-skip dead monsters
            if (msg.includes("already dead")) {
                console.warn(`[QoL] Skipping dead monster ${mid}`);
                return false;
            }

            throw new Error(data.message || "Attack failed");
        }

        return true;
    }
    /* ===================== Init ===================== */
    function init(attempt = 0) {

  if (QOL_ABORTED) return;

    const cards = [...document.querySelectorAll(".monster-container .monster-card ")];
    const fNameSel = document.querySelector("#fNameSel");
    const qolTop = document.querySelector(".qol-top");
    const selectActions = document.querySelector(".qol-select-actions");
    const qolAttacks = document.querySelector(".qol-attacks");

    if (!cards.length || !fNameSel || !qolTop || !selectActions || !qolAttacks) {
      if (attempt < 30) return setTimeout(() => init(attempt + 1), 300);
      return;
    }

    /* ===================== Disable Native Filters ===================== */
    ["fJoined", "fUnjoined", "fCapNotReached"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.closest("label")?.style.setProperty("display", "none");
    });

    fNameSel.style.display = "none";

    /* ===================== Filter State ===================== */
      const filterState = Object.assign(
          { joined: true, unjoined: true, cap: false },
          JSON.parse(localStorage.getItem(STATUS_STORAGE_KEY) || "{}")
      );
// ===================== Dead Section Rule =====================
if (waveSection === "dead") {
  filterState.joined = true;      // ✅ force joined ON
  filterState.unjoined = false;   // ✅ dead mobs are never unjoined
}

    /* ===================== DROPDOWN ===================== */
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "position:relative;display:inline-block;z-index:99999;";

    const dropBtn = document.createElement("button");
    dropBtn.innerHTML = `
      <span>Filter Monsters</span>
      <span id="monster-count"
        style="background:#171c2f;border:1px solid #303a60;
        padding:2px 6px;border-radius:12px;
        font-size:12px;color:#8aa2ff;">0 selected</span>
        <span style="font-size:12px;">⏷</span>
    `;
    dropBtn.style.cssText =
      "padding:8px 14px;background:#1e2235;color:#cdd4ff;" +
      "border:1px solid #303a60;border-radius:6px;" +
      "font-size:14px;width:260px;display:flex;justify-content:space-between;";

    const panel = document.createElement("div");
    panel.style.cssText =
      "position:absolute;top:100%;left:0;margin-top:-1px;width:260px;" +
      "background:#0f121d;border:1px solid #303a60;border-radius:6px;" +
      "padding:10px;display:none;max-height:200px;overflow-y:auto;";

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:10px;margin-bottom:10px;";

    const btnSelectAll = document.createElement("button");
    btnSelectAll.textContent = "Select All";
    const btnClear = document.createElement("button");
    btnClear.textContent = "Clear";
    actions.append(btnSelectAll, btnClear);
    panel.appendChild(actions);

    const list = document.createElement("div");
    const names = [...new Set(cards.map(c => c.dataset.name?.toLowerCase()))].filter(Boolean);

    names.forEach(name => {
      const lbl = document.createElement("label");
      lbl.style.cssText = "display:flex;gap:8px;padding:4px 0;color:#cdd4ff;";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = name;
      cb.onchange = () => applyAllFilters({ persist: true });
      lbl.append(cb, name.replace(/\b\w/g, x => x.toUpperCase()));
      list.appendChild(lbl);
    });

    panel.appendChild(list);
    wrapper.append(dropBtn, panel);
    //fNameSel.after(wrapper);

    dropBtn.onclick = e => {
      e.stopPropagation();
      panel.style.display = panel.style.display === "block" ? "none" : "block";
    };


// ✅ Close dropdown when mouse leaves panel
panel.addEventListener("mouseleave", () => {
  panel.style.display = "none";
  //dropdownOpen = false;
});

        const filterRow = document.createElement("div");
        filterRow.className = "qol-filter-row";
        filterRow.style.cssText = `
  display:flex;
  align-items:flex-start;
  gap:16px;
`;
    /* ===================== Custom Status Filters ===================== */
    const statusFilters = document.createElement("div");
    statusFilters.style.cssText =
      "display:flex;gap:16px;margin-top:8px;color:#cdd4ff;font-size:13px;";
statusFilters.className = "qol-status-filters";
    function makeStatus(label, key, def) {
      const l = document.createElement("label");
      l.style.cssText = "display:flex;gap:6px;cursor:pointer;";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = filterState[key];
      cb.onchange = () => {
          filterState[key] = cb.checked;
          localStorage.setItem(
              STATUS_STORAGE_KEY,
              JSON.stringify(filterState)
          );
          applyAllFilters();

      };
      l.append(cb, " " + label);
      return l;
    }

    statusFilters.append(
      makeStatus("Joined", "joined", true),
      makeStatus("Unjoined", "unjoined", true),
      makeStatus("CAP not reached", "cap", false)
    );

   // wrapper.after(statusFilters);
filterRow.append(wrapper, statusFilters);
fNameSel.after(filterRow);

        const SORT_STORAGE_KEY = STORAGE_KEY + "_sort";

const sortSelect = document.createElement("select");
sortSelect.className = "qol-btn secondary";
sortSelect.style.minWidth = "180px";
sortSelect.innerHTML = `
  <option value="name">Sort: Name (A–Z)</option>
  <option value="hpDesc">Sort: HP (High → Low)</option>
  <option value="hpAsc">Sort: HP (Low → High)</option>
`;

sortSelect.value =
  localStorage.getItem(SORT_STORAGE_KEY) || "name";

sortSelect.onchange = () => {
  localStorage.setItem(SORT_STORAGE_KEY, sortSelect.value);
  applySort();
};

filterRow.appendChild(sortSelect);


        function makeToggle(label, valueGetter, valueSetter) {
  const l = document.createElement("label");
  l.style.cssText =
    "display:flex;gap:6px;cursor:pointer;align-items:center;color:#cdd4ff;font-size:13px;";

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = valueGetter();

  cb.onchange = () => valueSetter(cb.checked);

  l.append(cb, label);
  return l;
}



    /* ===================== Unified Filter ===================== */
function applyAllFilters({ persist = true } = {}) {
  const selected =
    [...list.querySelectorAll("input:checked")].map(cb => cb.value);

  // ✅ CRITICAL GUARD:
  // do NOT overwrite saved filters when nothing is selected
  if (persist && selected.length === 0) {
    console.warn("[QoL] Empty selection — preserving stored filters");
  } else if (persist) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
  }

      document.getElementById("monster-count").textContent =
        `${selected.length} selected`;

      cards.forEach(card => {
        const name = card.dataset.name?.toLowerCase();

          const passName = selected.length > 0 && selected.includes(name);
          const passJoin =(filterState.joined && card.dataset.joined === "1") ||
          (filterState.unjoined && card.dataset.unjoined === "1");
        const passCap =
          !filterState.cap || card.dataset.capnotreached === "1";

        card.style.display =
          passName && passJoin && passCap ? "" : "none";
      });
        applySort();
    }

    function applySort() {
  const mode = sortSelect.value;

  const visibleCards = cards
    .filter(c => c.style.display !== "none");

  visibleCards.sort((a, b) => {
    if (mode === "name") {
      return getMonsterName(a)
        .localeCompare(getMonsterName(b));
    }

    const hpA = getMonsterHp(a);
    const hpB = getMonsterHp(b);

    const valA = hpA ? hpA.current : 0;
    const valB = hpB ? hpB.current : 0;

    if (mode === "hpDesc") {
      return valB - valA;
    }

    if (mode === "hpAsc") {
      return valA - valB;
    }

    return 0;
  });

  // Re-append in sorted order
  const parent = visibleCards[0]?.parentNode;
  if (!parent) return;

  visibleCards.forEach(card => parent.appendChild(card));
}


    btnSelectAll.onclick = () => {
      list.querySelectorAll("input").forEach(cb => cb.checked = true);
      applyAllFilters({ persist: true });
    };
    btnClear.onclick = () => {
      list.querySelectorAll("input").forEach(cb => cb.checked = false);
      applyAllFilters({ persist: true });
    };


const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

list.querySelectorAll("input").forEach(cb => {
  cb.checked = saved.includes(cb.value);
});

// ✅ restore only — do NOT persist
applyAllFilters({ persist: false });


    /* ===================== Custom Monster Selection ===================== */
      let selectedMonsterIds = JSON.parse(
          localStorage.getItem(ATK_STORAGE_KEY) || "[]"
      );

      function syncPicks() {
          document.querySelectorAll(".qol-pick").forEach(cb => {
              cb.checked = selectedMonsterIds.includes(cb.dataset.mid);
          });

          localStorage.setItem(
              ATK_STORAGE_KEY,
              JSON.stringify(selectedMonsterIds)
          );

          statusBar.textContent = `✅ ${selectedMonsterIds.length} monsters selected`;
      }

    cards.forEach(card => {
      const wrap = card.querySelector(".pickWrap");
      const native = card.querySelector(".pickMonster");
      if (!wrap || !native) return;

        native.disabled = true;
        native.style.display = "none";
wrap.style.padding = "0";
wrap.style.margin = "0";
wrap.style.height = "auto";


      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "qol-pick";
      cb.dataset.mid = card.dataset.monsterId;
      cb.onchange = () => {
        if (cb.checked) selectedMonsterIds.push(cb.dataset.mid);
        else selectedMonsterIds = selectedMonsterIds.filter(i => i !== cb.dataset.mid);
        syncPicks();
      };
      wrap.appendChild(cb);
    });

    /* ===================== Status Bar ===================== */
    const statusBar = document.createElement("div");
    statusBar.style.cssText =
      "margin-top:10px;padding:6px 10px;background:#171c2f;" +
      "border:1px solid #303a60;color:#8aa2ff;font-size:13px;border-radius:6px;";
    qolTop.appendChild(statusBar);

    /* ===================== Select Actions ===================== */
    const newWrap = selectActions.cloneNode(false);
    selectActions.replaceWith(newWrap);

    const btnSV = document.createElement("button");
    btnSV.className = "qol-btn secondary";
    btnSV.textContent = "✅ Select visible";
    btnSV.onclick = () => {
      selectedMonsterIds = cards
        .filter(c => c.style.display !== "none")
        .map(c => c.dataset.monsterId);
      syncPicks();
    };

    const btnCLR = document.createElement("button");
    btnCLR.className = "qol-btn secondary";
    btnCLR.textContent = "🧹 Clear";
    btnCLR.onclick = () => {
      selectedMonsterIds = [];
      localStorage.removeItem(ATK_STORAGE_KEY);
      syncPicks();
    };

    const stamToggleWrap = document.createElement("label");
stamToggleWrap.style.cssText = `
  display:flex;
  align-items:center;
  gap:6px;
  margin-left:0px;
  padding:6px 10px;
  background:#1e2235;
  border:1px solid #303a60;
  border-radius:6px;
  color:#cdd4ff;
  font-size:13px;
  cursor:pointer;
`;

const stamToggle = document.createElement("input");
stamToggle.type = "checkbox";
stamToggle.checked = autoUseStaminaPotion;

stamToggle.onchange = () => {
  autoUseStaminaPotion = stamToggle.checked;
  localStorage.setItem(
    AUTO_STAM_POTION_KEY,
    JSON.stringify(autoUseStaminaPotion)
  );
};

stamToggleWrap.append(
  stamToggle,
  "Auto‑use stamina potions"
);

    newWrap.append(btnSV, btnCLR, stamToggleWrap);

    /* ===================== Attack Buttons ===================== */
    const attackWrap = document.createElement("div");
    attackWrap.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;";
    attackWrap.style.cssText += "align-items:stretch;";
    qolAttacks.replaceWith(attackWrap);

    [1, 10, 50, 100, 200].forEach(stam => {
      const btn = document.createElement("button");
      btn.className = "qol-btn primary";
      btn.style.minWidth = "165px";
      btn.innerHTML = `⚡ ${ATK_SKILLS[stam].label}<span style="opacity:.8">(${stam})</span>`;

      btn.onclick = async () => {

  if (QOL_ABORTED) return;

            if (!selectedMonsterIds.length) return;
            btn.disabled = true;

            for (let i = 0; i < selectedMonsterIds.length; i++) {
                const id = selectedMonsterIds[i];
                statusBar.textContent =
                    `⏳ Attacking ${i + 1}/${selectedMonsterIds.length}`;
                isDungeon ? await joinDungeonMonster(id) : await joinWaveMonster(id);
                await sleep(150);
               try {
  await attackMonster(id, stam);
} catch (err) {
  if (
    err?.message?.includes("Not enough stamina") ||
    err?.message?.includes("auto-use disabled")
  ) {
    notifyStatusAndReload(
      statusBar,
      "⚠️ Not enough stamina — auto‑use disabled",
      2500
    );
    return; // ✅ stop processing further monsters
  }

  throw err; // preserve other errors
}

await sleep(500);

            }

            statusBar.textContent = "✅ Done — refreshing…";

            // ✅ small delay so user sees status
            setTimeout(() => {
                location.reload();
            }, 800);
        };


        attackWrap.appendChild(btn);
    });

    syncPicks();
  }

  window.addEventListener("load", () => setTimeout(init, 200));

    if (location.pathname.includes("guild_dungeon_location.php")) {
  initGuildDungeonQoL();
}

function initGuildDungeonQoL(attempt = 0) {

  if (QOL_ABORTED) return;

  if (!location.pathname.includes("guild_dungeon_location.php")) return;

  const grid = document.querySelector(".grid");
  if (!grid) {
    if (attempt < 25) return setTimeout(() => initGuildDungeonQoL(attempt + 1), 300);
    return;
  }

  /* ===================== Instance / Storage ===================== */
    const url = new URL(location.href);
    const instanceId = url.searchParams.get("instance_id") || "unknown";
    const locationId = url.searchParams.get("location_id") || "unknown";

    const ATK_STORAGE_KEY =
          `tm_qol_dungeon_atk_${instanceId}_loc${locationId}`;
    const FILTER_STORAGE_KEY =
          `tm_qol_dungeon_filters_loc${locationId}`;

    /* ===================== Helpers ===================== */

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function getDungeonMonsterName(card) {
    const titleDiv = card.querySelector('div[style*="font-weight:700"]');
    if (!titleDiv) return null;

    return [...titleDiv.childNodes]
      .filter(n => n.nodeType === Node.TEXT_NODE)
      .map(n => n.textContent.trim())
      .join(" ") || null;
  }

  async function joinDungeonMonster(mid) {
    const form = new FormData();
    form.append("dgmid", mid);
    form.append("instance_id", instanceId);
    await fetch("dungeon_join_battle.php", {
      method: "POST",
      credentials: "include",
      body: form
    });
  }

let lastKnownStamina = null;

async function attackMonster(mid, staminaCost, retry = false) {
  const form = new FormData();

  if (isDungeon) {
    form.append("dgmid", mid);
    form.append("instance_id", instanceId);
  } else {
    form.append("monster_id", mid);
  }

const skill = ATK_SKILLS[staminaCost];
if (!skill) {
  throw new Error("Unknown stamina cost: " + staminaCost);
}

form.append("skill_id", skill.skillId);
form.append("stamina_cost", staminaCost);

  const res = await fetch("damage.php", {
    method: "POST",
    credentials: "include",
    body: form
  });

// ✅ Handle server / edge failures FIRST
if (!res.ok) {
  // 429: rate limiting
  if (res.status === 429) {
    throw new Error("RATE_LIMIT");
  }

  // 520 / 502 / 503 / 504: server hiccup
  if (res.status >= 500) {
    console.warn(`[QoL] Server error ${res.status} — temporary failure`);
    throw new Error("SERVER_OVERLOAD");
  }
}

// ✅ Only parse JSON after we know response is OK
let data;
try {
  data = await res.json();
} catch {
  throw new Error("BAD_JSON");
}

  /* ===================== STAMINA ERROR HANDLING ===================== */
if (!res.ok && data?.message?.toLowerCase().includes("not enough stamina")) {
  if (!autoUseStaminaPotion) {
    console.warn("[QoL] Not enough stamina — auto-use disabled");
    throw new Error("Not enough stamina (auto-use disabled)");
  }

  if (retry) {
    throw new Error("Stamina potion failed or no potion left");
  }

  console.warn("[QoL] Server says: Not enough stamina — using potion");

  const healed = await useLargeStaminaPotion();
  if (!healed) {
    throw new Error("Out of stamina and no potion available");
  }

  await sleep(400);
  return attackMonster(mid, staminaCost, true);
}

  /* ===================== HP FAILSAFE ===================== */
  if (data?.retaliation?.user_hp_after != null) {
    updateHpBar(data.retaliation.user_hp_after);

    if (data.retaliation.user_hp_after <= 0) {
      console.warn("[QoL] HP depleted — using potion");

      const healed = await useFullHpPotion();
      if (!healed) {
        throw new Error("Out of HP and no potion available");
      }

      await sleep(400);
    }
  }

  /* ===================== STAMINA TRACKING ===================== */
  if (typeof data.stamina === "number") {
    lastKnownStamina = data.stamina;
    //updateStaminaBar(data.stamina);
  }

if (data.status !== "success") {
  const msg = (data.message || "").toLowerCase();

  // ✅ Soft-skip dead monsters (dungeon cleanup)
  if (msg.includes("already dead")) {
    console.warn(`[QoL] Skipping dead monster ${mid}`);
    return false;
  }

  throw new Error(data.message || "Attack failed");
}

  return true;
}
  /* ===================== Panel Target ===================== */
  const leftPanels = document.querySelectorAll(".grid > div:first-child .panel");
  const monstersPanel = leftPanels[1];
  if (!monstersPanel) return;

  const header = monstersPanel.querySelector(".h");
  const cards = [...monstersPanel.querySelectorAll(".mon")];
  if (!cards.length) return;

  cards.forEach(card => {
    const name = getDungeonMonsterName(card);
    if (name) card.dataset.name = name.toLowerCase();
  });

  /* ===================== Root ===================== */
  const qolRoot = document.createElement("div");
  qolRoot.style.cssText = `
    margin-top:10px;
    padding:10px;
    background:#0f121d;
    border:1px solid #303a60;
    border-radius:8px;
  `;

  qolRoot.innerHTML = `
    <div class="qol-filter-row"></div>
    <div class="qol-select-actions" style="margin-top:10px"></div>
    <div class="qol-attacks" style="margin-top:10px"></div>
    <div class="qol-status" style="margin-top:10px"></div>
  `;

  header.after(qolRoot);

  const filterRow = qolRoot.querySelector(".qol-filter-row");
  const selectActions = qolRoot.querySelector(".qol-select-actions");
  const qolAttacks = qolRoot.querySelector(".qol-attacks");
  const statusWrap = qolRoot.querySelector(".qol-status");

  filterRow.style.cssText = `
    display:flex;
    align-items:flex-start;
    gap:16px;
  `;

  /* ===================== State ===================== */
  let selectedMonsterIds = JSON.parse(localStorage.getItem(ATK_STORAGE_KEY) || "[]");

  const filterState = JSON.parse(
    localStorage.getItem(FILTER_STORAGE_KEY) ||
    JSON.stringify({ joined: true, unjoined: true, hideDead: true, names: [] })

  );

  /* ===================== Dropdown ===================== */
  const dropdownWrap = document.createElement("div");
  dropdownWrap.style.position = "relative";

  const dropBtn = document.createElement("button");
  dropBtn.className = "qol-btn secondary";
  dropBtn.style.cssText = "width:260px;display:flex;gap:8px;white-space:nowrap;flex-direction: row;";
  dropBtn.innerHTML = `
  <span style="flex:1;overflow:hidden;text-overflow:ellipsis;">
    Filter Monsters
  </span>
  <span id="dg-count"
    style="background:#171c2f;border:1px solid #303a60;
    padding:2px 6px;border-radius:12px;
    font-size:12px;color:#8aa2ff;">
    ${filterState.names.length}
  </span>
  <span style="font-size:12px;opacity:.8;">⏷</span>
`;


  const panel = document.createElement("div");
  panel.style.cssText = `
    display:none;
    position:absolute;
    top:100%;
    left:0;
    margin-top:6px;
    background:#0f121d;
    border:1px solid #303a60;
    border-radius:6px;
    padding:8px;
    max-height:260px;
    width:260px;
    overflow-y:auto;
    z-index:5;
  `;

    const normalizeName = name =>
  name.trim().toLowerCase();

const nameSet = new Map();

cards.forEach(card => {
  if (!card.dataset.name) return;

  const raw = card.dataset.name;
  const key = normalizeName(raw);

  if (!nameSet.has(key)) {
    nameSet.set(key, {
      key,
      label: raw.replace(/\b\w/g, c => c.toUpperCase())
    });
  }
});

const names = [...nameSet.values()];
names.forEach(({ key, label }) => {
  const lbl = document.createElement("label");
  lbl.style.cssText =
    "display:flex;gap:6px;color:#cdd4ff;font-size:13px;";

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.value = key; // ✅ normalized string
  cb.checked = filterState.names.includes(key);
  cb.onchange = applyFilters;

  lbl.append(cb, label);
  panel.appendChild(lbl);
});


  let dropdownOpen = false;

  dropBtn.onclick = e => {
    e.stopPropagation();
    dropdownOpen = !dropdownOpen;
    panel.style.display = dropdownOpen ? "block" : "none";
  };

  panel.addEventListener("mousedown", e => e.stopPropagation());
  panel.addEventListener("mouseleave", () => {
    panel.style.display = "none";
    dropdownOpen = false;
  });

  dropdownWrap.append(dropBtn, panel);
  filterRow.appendChild(dropdownWrap);

   /* ===================== Status Filters ===================== */
  const statusFilters = document.createElement("div");

statusFilters.style.cssText = `
  display:flex;
  flex-wrap:wrap;
  gap:8px 12px;
  align-items:center;
  max-width:100%;
`;


  function makeStatus(label, key) {
    const l = document.createElement("label");
    l.style.cssText = `
  display:flex;
  gap:6px;
  cursor:pointer;
  white-space:normal;
  align-items:center;
`;

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = filterState[key];
    cb.onchange = () => {
      filterState[key] = cb.checked;
      applyFilters();
    };
    l.append(cb, label);
    return l;
  }

  statusFilters.append(
    makeStatus("Joined", "joined"),
    makeStatus("Unjoined", "unjoined"),
    makeStatus("Hide dead monsters", "hideDead")  );

  filterRow.appendChild(statusFilters);

  /* ===================== Status Bar (BOTTOM) ===================== */



  const statusBar = document.createElement("div");
  statusBar.style.cssText =
    "padding:6px 10px;background:#12162a;border:1px solid #303a60;" +
    "color:#8aa2ff;font-size:13px;border-radius:6px;";
  statusWrap.appendChild(statusBar);

  function syncPicks() {
    document.querySelectorAll(".qol-pick").forEach(cb => {
      cb.checked = selectedMonsterIds.includes(cb.dataset.mid);
    });
    localStorage.setItem(ATK_STORAGE_KEY, JSON.stringify(selectedMonsterIds));
    statusBar.textContent = `✅ ${selectedMonsterIds.length} monsters selected`;
  }

  /* ===================== Apply Filters ===================== */
    function getDungeonJoinState(card) {
  const pill = card.querySelector(".pill");
  if (!pill) {
    return { joined: false, unjoined: true };
  }

  const text = pill.textContent.trim().toLowerCase();

  if (text === "joined") {
    return { joined: true, unjoined: false };
  }

  if (text === "not joined") {
    return { joined: false, unjoined: true };
  }

  // fallback safety
  return { joined: false, unjoined: true };
}

    function isDeadMonster(card) {
        // Fast path: class-based marker
        if (card.classList.contains("dead")) return true;

        // Fallback: pill text
        return [...card.querySelectorAll(".pill")]
            .some(p => p.textContent.trim().toLowerCase() === "dead");
    }

function applyFilters() {
  filterState.names = [...panel.querySelectorAll("input:checked")]
    .map(cb => cb.value);

  localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filterState));

  document.getElementById("dg-count").textContent =
    `${filterState.names.length} selected`;

  cards.forEach(card => {
    const name = normalizeName(card.dataset.name || "");

    const { joined, unjoined } = getDungeonJoinState(card);


    const deadOk =
            !filterState.hideDead || !isDeadMonster(card);


    const pass =
            (filterState.names.length > 0 &&
             filterState.names.includes(name)) &&
            ((filterState.joined && joined) ||
             (filterState.unjoined && unjoined)) &&
            deadOk;

    card.style.display = pass ? "" : "none";
  });
}

  /* ===================== Inject Checkboxes ===================== */
  cards.forEach(card => {
    const mid = card.querySelector('a[href*="dgmid="]')
      ?.href.match(/dgmid=(\d+)/)?.[1];
    if (!mid) return;

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "qol-pick";
    cb.dataset.mid = mid;
    cb.style.cssText =
      "position:absolute;top:8px;left:8px;z-index:5;transform:scale(1.2);";

    cb.onchange = () => {
      if (cb.checked) {
        if (!selectedMonsterIds.includes(mid)) selectedMonsterIds.push(mid);
      } else {
        selectedMonsterIds = selectedMonsterIds.filter(i => i !== mid);
      }
      syncPicks();
    };

    card.style.position = "relative";
    card.appendChild(cb);
  });

  /* ===================== Actions ===================== */
  const btnSV = document.createElement("button");
  btnSV.className = "qol-btn secondary";
  btnSV.textContent = "✅ Select visible";
  btnSV.onclick = () => {
    selectedMonsterIds = cards
      .filter(c => c.style.display !== "none")
      .map(c => c.querySelector('a[href*="dgmid="]')
        ?.href.match(/dgmid=(\d+)/)?.[1])
      .filter(Boolean);
    syncPicks();
  };

  const btnCLR = document.createElement("button");
  btnCLR.className = "qol-btn secondary";
  btnCLR.textContent = "🧹 Clear";
  btnCLR.onclick = () => {
    selectedMonsterIds = [];
    localStorage.removeItem(ATK_STORAGE_KEY);
    syncPicks();
  };
const stamToggleWrap = document.createElement("label");
stamToggleWrap.style.cssText = `
  display:flex;
  align-items:center;
  gap:6px;
  margin-left:0px;
  padding:6px 10px;
  background:#1e2235;
  border:1px solid #303a60;
  border-radius:6px;
  color:#cdd4ff;
  font-size:13px;
  cursor:pointer;
  width: 203px;
`;

const stamToggle = document.createElement("input");
stamToggle.type = "checkbox";
stamToggle.checked = autoUseStaminaPotion;

stamToggle.onchange = () => {
  autoUseStaminaPotion = stamToggle.checked;
  localStorage.setItem(
    AUTO_STAM_POTION_KEY,
    JSON.stringify(autoUseStaminaPotion)
  );
};

stamToggleWrap.append(
  stamToggle,
  "Auto‑use stamina potions"
);
  selectActions.append(btnSV, btnCLR, stamToggleWrap);

  /* ===================== Attack Buttons ===================== */
  const atkWrap = document.createElement("div");
  atkWrap.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;";
  qolAttacks.appendChild(atkWrap);

  [1, 10, 50, 100, 200, 1000].forEach(stam => {
    const b = document.createElement("button");
    b.className = "qol-btn primary";
    b.style.minWidth = "210px";
    b.innerHTML = `<span style="opacity:.75;font-size:12px">⚡ ${ATK_SKILLS[stam].label} (${stam}) </span>`;


      b.onclick = async () => {
          if (!selectedMonsterIds.length) return;
          b.disabled = true;
          b.textContent = "⏳ Working…";

          for (let i = 0; i < selectedMonsterIds.length; i++) {

  if (QOL_ABORTED) break;

              statusBar.textContent = `⏳ Attacking ${i + 1}/${selectedMonsterIds.length}`;
              await joinDungeonMonster(selectedMonsterIds[i]);
              await sleep(150);
            try {
  await attackMonster(selectedMonsterIds[i], stam);
} catch (err) {
  if (
    err?.message?.includes("Not enough stamina") ||
    err?.message?.includes("auto-use disabled")
  ) {
    notifyStatusAndReload(
      statusBar,
      "⚠️ Not enough stamina — auto‑use disabled",
      2500
    );
    return;
  }

  throw err;
}

await sleep(500);
          }

          statusBar.textContent = "✅ Done — refreshing…";

          setTimeout(() => {
              location.reload();
          }, 800);
      };

    atkWrap.appendChild(b);
  });

  applyFilters();
  syncPicks();
}

})();

//bosses spawn timer
(function () {
  'use strict';

  console.log('[BossTimers] v11.0 – IST server time + Local time + Alerts');


/* ================= TEST MODE ================= */

// Set to 0 to disable test mode
const TEST_TIME_OFFSET_MINUTES = 0; // ⏩ simulate local time +x min


/* ================= DISPLAY OVERRIDES ================= */

function getDisplayGateWave(gate, wave) {
  if (gate === 3 && wave === 8) {
    return { gate: 1, wave: 3 };
  }
  if (gate === 5 && wave === 9) {
    return { gate: 2, wave: 1 };
  }
  return { gate, wave };
}

  /* ================= CONFIG ================= */

  const gatesConfig = [
    { gate: 3, wave: 8 },
    { gate: 5, wave: 9 }
  ];

  /* ================= ALERT SYSTEM ================= */

const ALERT_STORAGE_KEY = 'BossTimers_alerted_v1';

function loadAlertedBosses() {
  try {
    return new Set(JSON.parse(localStorage.getItem(ALERT_STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveAlertedBosses(set) {
  localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify([...set]));
}

const alertedBosses = loadAlertedBosses();  const scheduledBosses = [];

  function showBossAlert(boss) {

  if (window.vv && typeof window.vv.isOn === 'function') {
    if (!vv.isOn('boss_spawn_alert')) return;
  }

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.75);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: #111827;
      padding: 18px 22px;
      border-radius: 12px;
      max-width: 320px;
      text-align: center;
      font-family: system-ui;
      color: #fff;
      box-shadow: 0 0 20px rgba(0,0,0,.5);
    `;

    modal.innerHTML = `
      <div style="font-size:14px; color:#a78bfa; margin-bottom:6px;">
        Boss Spawned
      </div>
      <div style="font-size:18px; font-weight:600;">
        ${boss.name}
      </div>
      <div style="margin-top:8px; font-size:12px; color:#88ff88;">

${(() => {
        const d = getDisplayGateWave(boss.gate, boss.wave);
        return `Gate ${d.gate} • Wave ${d.wave}`;
    })()}

      </div>
      <button style="
        margin-top:14px;
        padding:6px 14px;
        border-radius:6px;
        border:none;
        background:#4f46e5;
        color:white;
        cursor:pointer;
      ">OK</button>
    `;

    modal.querySelector('button').onclick = () => overlay.remove();
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

 function startAlertWatcher() {
  const testOffsetSeconds = TEST_TIME_OFFSET_MINUTES * 60;

  console.log(
    '[BossTimers] Alert test offset:',
    TEST_TIME_OFFSET_MINUTES
      ? `+${TEST_TIME_OFFSET_MINUTES} minutes`
      : 'OFF'
  );

  setInterval(() => {
    // ⏱️ Simulated "now"
    const now = (Date.now() / 1000) + testOffsetSeconds;

    scheduledBosses.forEach(boss => {
      if (now >= boss.spawnTs && !alertedBosses.has(boss.id)) {
          alertedBosses.add(boss.id);
          saveAlertedBosses(alertedBosses);
          showBossAlert(boss);
      }
    });
  }, 1000);
}
  /* ================= TIME HELPERS ================= */

  function parseDuration(str) {
    if (!str) return 0;
    const n = parseFloat(str);
    if (str.endsWith('h')) return n * 3600;
    if (str.endsWith('m')) return n * 60;
    if (str.endsWith('d')) return n * 86400;
    return 0;
  }

  // ✅ SERVER TIME — IST (New Delhi)
  function formatServerIST(ts) {
    if (!ts || ts < 1e9) return '—';

    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(ts * 1000));
  }

  // ✅ LOCAL TIME — browser timezone
  function formatLocalTime(ts) {
    if (!ts || ts < 1e9) return '—';

    return new Intl.DateTimeFormat('en-GB', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(ts * 1000));
  }

  /* ================= FETCH ================= */

  function fetchBossData(gate, wave) {
    const url = `https://demonicscans.org/active_wave.php?gate=${gate}&wave=${wave}`;

    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        onload: res => {
          const doc = new DOMParser().parseFromString(res.responseText, 'text/html');
          const cards = doc.querySelectorAll('.auto-summon-card');
          const bosses = [];

          cards.forEach(card => {
            const alive = card.dataset.alive === '1';
            const nextTs = parseInt(card.dataset.nextTs || 0);
            const name = card.querySelector('.auto-summon-name')?.textContent.trim();
            const sub = card.querySelector('.auto-summon-sub')?.textContent || '';

            if (!name) return;

            const cycle = parseDuration(sub.match(/Cycle:.*?(\\d+[hmd])/i)?.[1]);
            const autoDie = parseDuration(sub.match(/Auto-die:.*?(\\d+[hmd])/i)?.[1]);

            const spawnTs = alive ? nextTs - cycle : nextTs;
            const deathTs = spawnTs + autoDie;

            const bossId = `${gate}-${wave}-${name}-${spawnTs}`;

            bosses.push({
              gate,
              wave,
              name,
              alive,
              spawnTs,
              serverSpawn: formatServerIST(spawnTs),
              serverDeath: formatServerIST(deathTs),
              localSpawn: formatLocalTime(spawnTs),
              localDeath: formatLocalTime(deathTs),
              id: bossId
            });

            // 🔔 Schedule alert (future spawns only)
            if (!alive && spawnTs > Date.now() / 1000) {
              scheduledBosses.push({
                gate,
                wave,
                name,
                spawnTs,
                id: bossId
              });
            }
          });

          resolve(bosses);
        },
        onerror: reject
      });
    });
  }

  /* ================= INJECT ================= */

  function inject(bosses) {
    const menu = document.querySelector('#game-expanded');
    if (!menu) return;

    menu.querySelectorAll('.submenu-items a[href*="active_wave.php"]').forEach(link => {
      if (link.dataset.bossInjected) return;

      const url = new URL(link.href);
      const gate = Number(url.searchParams.get('gate'));
      const wave = Number(url.searchParams.get('wave'));

      const matches = bosses.filter(b => b.gate === gate && b.wave === wave);
      if (!matches.length) return;

      const box = document.createElement('div');
      box.style.marginTop = '6px';
      box.style.paddingTop = '6px';
      box.style.borderTop = '1px solid rgba(255,255,255,0.25)';
      box.style.fontSize = '11px';

      matches.forEach(b => {
        const row = document.createElement('div');
        row.style.marginTop = '6px';
        row.innerHTML = `
         ${(() => {
            const d = getDisplayGateWave(b.gate, b.wave);
            return `
    <span style="color:#a78bfa;">${b.name}</span><br>
    <span style="color:#bbb;">Gate ${d.gate} • Wave ${d.wave}</span><br>
    <span style="color:#ffd966;">Server:</span> ${b.serverSpawn}<br>
    <span style="color:#88ff88;">Local:</span> ${b.localSpawn}
    ${b.alive ? '<span style="color:#4caf50;"> (NOW)</span>' : ''}
  `;
        })()}
        `;
        box.appendChild(row);
      });

      link.parentElement.appendChild(box);
      link.dataset.bossInjected = 'true';
    });
  }

  /* ================= WAIT FOR MENU ================= */

  function waitForMenu(bosses) {
    const obs = new MutationObserver(() => {
      if (document.querySelector('#game-expanded')) {
        obs.disconnect();
        inject(bosses);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  /* ================= START ================= */

  startAlertWatcher();

  Promise.all(gatesConfig.map(g => fetchBossData(g.gate, g.wave)))
    .then(res => waitForMenu(res.flat()))
    .catch(err => console.error('[BossTimers] Error:', err));

})();

//event npc auto dialog
(function () {
    if (!/event_page\.php$/.test(window.location.pathname)) return;
  'use strict';

  const CFG = {
    tickMs: 170,
    actionCooldownMs: 400,
    npcSelector: '.eventNpc',
    overlaySelector: '#dlgOverlay',
    dialogueRootSelector: '.dlgBar',
    choicesSelector: '#dlgChoices button',
    actionsSelector: '#dlgActions .btn'
  };

  const state = {
    running: false,
    currentNpcKey: '',
    currentNpcName: '',
    lastProcessedKey: '',
    lastProcessedName: '',
    lastQuestGiverKey: '',
    lastNpcCount: 0,
    processedThisPass: new Set(),
    passNo: 1,
    finishMode: false,
    success: false,
    uiMinimized: false,
    session: null,
    lastActionAt: 0
  };

  const ui = {
    root: null,
    mini: null,
    status: null,
    runBtn: null,
    resetBtn: null
  };

  const npcMemory = Object.create(null);
  const elementIds = new WeakMap();
  let nextElementId = 1;
  let intervalId = null;
  let observer = null;

  function getElementId(el) {
    if (!el) return '';
    if (!elementIds.has(el)) elementIds.set(el, `npc-${nextElementId++}`);
    return elementIds.get(el);
  }

  function isVisible(el) {
    if (!el || !(el instanceof Element)) return false;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function textOf(el) {
    return (el?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function overlay() {
    return document.querySelector(CFG.overlaySelector);
  }

  function dialogueRoot() {
    return document.querySelector(CFG.dialogueRootSelector) || overlay();
  }

  function overlayOpen() {
    const ov = overlay();
    return !!ov && (ov.classList.contains('isOpen') || isVisible(ov));
  }

  function getDialogueText() {
    const root = dialogueRoot();
    if (!root) return '';
    return [
      root.querySelector('#dlgQuestBadge'),
      root.querySelector('#dlgName'),
      root.querySelector('#dlgText')
    ].filter(Boolean).map(textOf).filter(Boolean).join(' | ');
  }

  function allNPCs() {
    return [...document.querySelectorAll(CFG.npcSelector)].filter(isVisible);
  }

  function getNpcName(npc) {
    if (!npc) return '';

    const img = npc.querySelector('img');

    const candidates = [
      npc.getAttribute('data-name'),
      npc.dataset?.name,
      npc.getAttribute('data-npc-name'),
      npc.dataset?.npcName,
      npc.getAttribute('aria-label'),
      npc.getAttribute('title'),
      img?.alt,
      npc.querySelector('.npcName')?.textContent,
      npc.querySelector('.name')?.textContent,
      npc.querySelector('.label')?.textContent,
      textOf(npc)
    ];

    for (let s of candidates) {
      s = (s || '').replace(/\s+/g, ' ').trim();
      if (s) return s;
    }

    return `NPC ${getElementId(npc)}`;
  }

  function npcKey(npc) {
    if (!npc) return '';

    const r = npc.getBoundingClientRect();
    const name = getNpcName(npc);
    const id = getElementId(npc);

    return [
      name,
      npc.getAttribute('data-id') || '',
      npc.getAttribute('data-npc-id') || '',
      npc.dataset?.id || '',
      id,
      Math.round(r.left),
      Math.round(r.top),
      Math.round(r.width),
      Math.round(r.height)
    ].join('|');
  }

  function resolveNpcByKey(key) {
    if (!key) return null;
    return allNPCs().find(npc => npcKey(npc) === key) || null;
  }

  function getMemory(key) {
    if (!npcMemory[key]) {
      npcMemory[key] = {
        type: 'unknown',   // unknown | quest | nonQuest
        tempDone: false,
        visits: 0,
        questSeen: false
      };
    }
    return npcMemory[key];
  }

  function sessionReset(npc = null) {
    state.session = {
      npcKey: npc ? npcKey(npc) : '',
      step: 0,
      uniqueSignatures: new Set(),
      sawNext: false,
      sawAccept: false,
      sawClaim: false,
      sawQuestAction: false,
      closeOnly: false,
      lastSig: '',
      sameSigCount: 0,
      buttons: []
    };
  }

  function getClickableButtonsInDialogue() {
    const root = dialogueRoot();
    if (!root) return [];

    const buttons = [
      ...root.querySelectorAll('button'),
      ...root.querySelectorAll(CFG.choicesSelector),
      ...root.querySelectorAll(CFG.actionsSelector)
    ];

    return buttons.filter(el => el instanceof HTMLElement && isVisible(el) && !el.disabled);
  }

  function findButtonByText(regex) {
    return getClickableButtonsInDialogue().find(btn => regex.test(textOf(btn)));
  }

  function findExactButton(id) {
    const root = dialogueRoot();
    if (!root) return null;
    const el = root.querySelector(`#${CSS.escape(id)}`);
    if (el && isVisible(el) && !el.disabled) return el;
    return null;
  }

  function dialogueSignature() {
    const text = getDialogueText();
    const buttons = getClickableButtonsInDialogue()
      .map(btn => textOf(btn).toLowerCase())
      .sort()
      .join(' | ');
    return `${text} :: ${buttons}`;
  }

  function recordDialogueState() {
    if (!state.session) sessionReset();

    const sig = dialogueSignature();
    if (sig) {
      if (sig !== state.session.lastSig) {
        state.session.step += 1;
        state.session.lastSig = sig;
        state.session.sameSigCount = 0;
      } else {
        state.session.sameSigCount += 1;
      }
      state.session.uniqueSignatures.add(sig);
    }

    const buttons = getClickableButtonsInDialogue();
    state.session.buttons = buttons;

    const texts = buttons.map(textOf).map(t => t.toLowerCase());

    state.session.sawNext ||= texts.some(t => /\bnext\b|\bcontinue\b|\bmore\b/.test(t));
    state.session.sawAccept ||= texts.some(t => /^(accept|yes|ok|okay)$/.test(t) || /\baccept\b/.test(t));
    state.session.sawClaim ||= texts.some(t => /\bclaim\b/.test(t));

    state.session.sawQuestAction ||= (
      state.session.sawNext ||
      state.session.sawAccept ||
      state.session.sawClaim ||
      texts.some(t => /\breward\b|\bturn in\b|\bturnin\b|\bproceed\b/.test(t))
    );

    state.session.closeOnly =
      buttons.length <= 1 ||
      buttons.every(btn => /^(close|done|finish|exit)$/i.test(textOf(btn)));
  }

  function dispatchClick(el) {
    if (!el) return false;

    try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch {}
    try { el.focus({ preventScroll: true }); } catch {}

    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;

    const x = Math.floor(r.left + r.width / 2);
    const y = Math.floor(r.top + r.height / 2);

    const mouseOpts = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX: x,
      clientY: y,
      screenX: x,
      screenY: y,
      buttons: 1,
      detail: 1
    };

    try {
      el.dispatchEvent(new PointerEvent('pointerdown', {
        ...mouseOpts,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true
      }));
      el.dispatchEvent(new MouseEvent('mousedown', mouseOpts));
      el.dispatchEvent(new PointerEvent('pointerup', {
        ...mouseOpts,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
        buttons: 0
      }));
      el.dispatchEvent(new MouseEvent('mouseup', { ...mouseOpts, buttons: 0 }));
      el.dispatchEvent(new MouseEvent('click', { ...mouseOpts, buttons: 0 }));
    } catch {}

    try {
      if (typeof el.click === 'function') el.click();
    } catch {}

    return true;
  }

  function dispatchEscape() {
    const opts = {
      bubbles: true,
      cancelable: true,
      composed: true,
      key: 'Escape',
      code: 'Escape',
      which: 27,
      keyCode: 27
    };

    try { document.dispatchEvent(new KeyboardEvent('keydown', opts)); } catch {}
    try { document.dispatchEvent(new KeyboardEvent('keyup', opts)); } catch {}
  }

  function hideUiTemporarily(fn) {
    const root = ui.root;
    const mini = ui.mini;

    const rootDisplay = root ? root.style.display : '';
    const miniDisplay = mini ? mini.style.display : '';

    if (root) root.style.display = 'none';
    if (mini) mini.style.display = 'none';

    try {
      return fn();
    } finally {
      requestAnimationFrame(() => {
        if (root) root.style.display = rootDisplay;
        if (mini) mini.style.display = miniDisplay;
      });
    }
  }

  function humanClick(el) {
    if (!el) return false;
    state.lastActionAt = Date.now();
    return hideUiTemporarily(() => dispatchClick(el));
  }

  function forceCloseDialogue() {
    const backdrop = document.querySelector('#dlgBackdrop');
    const candidates = [
      findExactButton('dlgNext'),
      findExactButton('dlgSkip'),
      findButtonByText(/^(next|continue|skip)$/i),
      findButtonByText(/^(claim)$/i),
      findButtonByText(/^(accept|yes|ok|okay)$/i),
      findButtonByText(/^(close|done|finish|exit)$/i),
      backdrop
    ].filter(Boolean);

    for (const el of candidates) {
      if (humanClick(el)) return true;
    }

    dispatchEscape();
    return false;
  }

  function clickDialogueForward() {
    if (!overlayOpen()) return false;

    recordDialogueState();

    const exactNext = findExactButton('dlgNext');
    if (exactNext && humanClick(exactNext)) return true;

    const skipBtn = findExactButton('dlgSkip');
    if (skipBtn && humanClick(skipBtn)) return true;

    const nextLike = findButtonByText(/^(next|continue)$/i);
    if (nextLike && humanClick(nextLike)) return true;

    const claimBtn = findButtonByText(/^(claim)$/i);
    if (claimBtn && humanClick(claimBtn)) return true;

    const acceptBtn = findButtonByText(/^(accept|yes|ok|okay)$/i);
    if (acceptBtn && humanClick(acceptBtn)) return true;

    const closeBtn = findButtonByText(/^(close|done|finish|exit)$/i);
    if (closeBtn && humanClick(closeBtn)) return true;

    if (state.session?.closeOnly || state.session?.sameSigCount >= 1) {
      return forceCloseDialogue();
    }

    return false;
  }

  function openNpc(npc) {
    if (!npc) return false;

    const key = npcKey(npc);
    const name = getNpcName(npc);

    if (state.currentNpcKey === key && overlayOpen()) return false;

    state.currentNpcKey = key;
    state.currentNpcName = name;
    sessionReset(npc);
    state.lastActionAt = Date.now();
    return humanClick(npc);
  }

  function markTempDone(key) {
    if (!key) return;
    const mem = getMemory(key);
    mem.tempDone = true;
  }

  function allVisibleDone() {
    const visible = allNPCs();
    if (!visible.length) return false;
    return visible.every(npc => getMemory(npcKey(npc)).tempDone);
  }

  function pickNextNpc() {
    const visible = allNPCs();
    if (!visible.length) return null;

    const unseen = visible.filter(npc => !state.processedThisPass.has(npcKey(npc)));
    const pool = unseen.length ? unseen : visible;

    if (!unseen.length) {
      state.processedThisPass.clear();
      state.passNo += 1;
    }

    const inPool = predicate => pool.find(npc => predicate(getMemory(npcKey(npc)))) || null;

    const unknown = inPool(mem => mem.type === 'unknown');
    if (unknown) return unknown;

    const questPending = inPool(mem => mem.type === 'quest' && !mem.tempDone);
    if (questPending) return questPending;

    const nonQuestPending = inPool(mem => mem.type === 'nonQuest' && !mem.tempDone);
    if (nonQuestPending) return nonQuestPending;

    return null;
  }

  function handleDialogueClosed() {
    const key = state.currentNpcKey || state.session?.npcKey || '';
    if (!key) return;

    const npc = resolveNpcByKey(key);
    const mem = getMemory(key);

    mem.visits += 1;

    const sawQuestAction = !!state.session?.sawQuestAction;
    const stepCount = state.session?.step || 0;
    const closeOnly = !!state.session?.closeOnly;

    if (sawQuestAction) {
      mem.type = 'quest';
      mem.questSeen = true;
      mem.tempDone = false;
      state.lastQuestGiverKey = key;
    } else if (closeOnly || stepCount <= 1) {
      mem.type = 'nonQuest';
      mem.tempDone = true;
    } else {
      if (mem.type !== 'quest') mem.type = 'nonQuest';
      mem.tempDone = true;
    }

    state.lastProcessedKey = key;
    state.lastProcessedName = getNpcName(npc);
    state.processedThisPass.add(key);
    state.currentNpcKey = '';
    state.currentNpcName = '';
  }

  function setSuccess(message = 'Success') {
    state.running = false;
    state.finishMode = true;
    state.success = true;

    if (ui.root) ui.root.style.display = 'block';
    if (ui.mini) ui.mini.style.display = 'block';
    state.uiMinimized = false;

    refreshStatus(message);
  }

  function rebuildNpcState({ keepAnchor = true } = {}) {
    const visible = allNPCs();
    state.lastNpcCount = visible.length;

    if (!keepAnchor) return;

    const anchorKey = state.currentNpcKey || state.lastProcessedKey || state.lastQuestGiverKey || '';
    if (anchorKey) {
      const stillThere = visible.some(npc => npcKey(npc) === anchorKey);
      if (!stillThere) {
        state.currentNpcKey = '';
        state.currentNpcName = '';
      }
    }
  }

  function rescanNpcs({ keepPosition = true } = {}) {
    rebuildNpcState({ keepAnchor: keepPosition });

    if (allVisibleDone()) {
      setSuccess('Success • everything is temporarily done');
      return;
    }

    state.processedThisPass = new Set([...state.processedThisPass].filter(key => {
      return !!resolveNpcByKey(key);
    }));

    state.idleTicks = 0;
    refreshStatus('NPC list rescanned');
  }

  function refreshStatus(extra = '') {
    if (!ui.status) return;

    const visible = allNPCs();
    const total = visible.length;
    const tempDone = visible.filter(npc => getMemory(npcKey(npc)).tempDone).length;
    const questPending = visible.filter(npc => {
      const mem = getMemory(npcKey(npc));
      return mem.type === 'quest' && !mem.tempDone;
    }).length;

    const mode = state.success ? 'Success' : (state.running ? 'Running' : 'Stopped');
    const visibility = state.uiMinimized ? 'Minimized' : 'Expanded';
    const activeName = state.currentNpcName || state.lastProcessedName || '—';

    ui.status.textContent = [
      mode,
      visibility,
      `${tempDone}/${total || 0} temp done`,
      `${questPending} quest pending`,
      `Pass ${state.passNo}`,
      `NPC ${activeName}`,
      extra || ''
    ].filter(Boolean).join(' • ');

    if (ui.runBtn) {
      ui.runBtn.textContent = state.running ? 'Stop' : 'Start';
      ui.runBtn.style.background = state.running ? '#ef4444' : '#3b82f6';
    }

    if (ui.mini) {
      ui.mini.textContent = state.uiMinimized ? (state.running ? 'NPC ●' : 'NPC') : 'Minimize';
    }
  }

  function setMiniMode(minimized) {
    state.uiMinimized = minimized;
    if (ui.root) ui.root.style.display = minimized ? 'none' : 'block';
    if (ui.mini) ui.mini.style.display = 'block';
    refreshStatus();
  }

  function fullReset() {
    for (const k in npcMemory) delete npcMemory[k];
    state.processedThisPass.clear();
    state.passNo = 1;
    state.finishMode = false;
    state.success = false;
    state.currentNpcKey = '';
    state.currentNpcName = '';
    state.lastProcessedKey = '';
    state.lastProcessedName = '';
    state.lastQuestGiverKey = '';
    state.lastNpcCount = 0;
    state.idleTicks = 0;
    state.lastActionAt = 0;
    sessionReset();
  }

  function setRunning(on) {
    if (on && state.success) {
      fullReset();
      state.running = true;
      rescanNpcs({ keepPosition: false });
      setMiniMode(true);
      refreshStatus('Restarted');
      return;
    }

    state.running = on;
    state.finishMode = false;
    state.success = false;
    state.currentNpcKey = '';
    state.currentNpcName = '';
    state.lastProcessedKey = '';
    state.lastProcessedName = '';
    state.lastQuestGiverKey = '';
    state.idleTicks = 0;
    state.lastActionAt = 0;

    if (on) {
      state.processedThisPass.clear();
      rescanNpcs({ keepPosition: false });
      setMiniMode(true);
      refreshStatus('Started');
    } else {
      setMiniMode(false);
      refreshStatus('Stopped');
    }
  }

  function tick() {
    if (!state.running) return;
    if (Date.now() - state.lastActionAt < CFG.actionCooldownMs) return;

    const currentCount = allNPCs().length;
    if (currentCount !== state.lastNpcCount) {
      state.lastNpcCount = currentCount;
      rescanNpcs({ keepPosition: true });
      refreshStatus('NPCs updated');
      return;
    }

    if (overlayOpen()) {
      const clicked = clickDialogueForward();
      if (!clicked) state.idleTicks += 1;
      else state.idleTicks = 0;

      if (!overlayOpen()) {
        handleDialogueClosed();

        if (state.success || state.finishMode) return;

        if (allVisibleDone()) {
          setSuccess('Success • everything is temporarily done');
          return;
        }

        refreshStatus();
      } else if (state.session?.sameSigCount >= 1) {
        forceCloseDialogue();
      }

      return;
    }

    if (state.finishMode || state.success) return;

    if (!state.processedThisPass.size && !state.currentNpcKey) {
      state.lastNpcCount = currentCount;
    }

    const npc = pickNextNpc();

    if (!npc) {
      if (allVisibleDone()) {
        setSuccess('Success • everything is temporarily done');
      } else {
        state.processedThisPass.clear();
        state.passNo += 1;
        refreshStatus('New pass');
      }
      return;
    }

    const key = npcKey(npc);
    const name = getNpcName(npc);

    const opened = openNpc(npc);
    if (!opened) {
      state.processedThisPass.add(key);
      state.idleTicks += 1;
    } else {
      state.idleTicks = 0;
      refreshStatus(`Opening ${name}`);
    }
  }

  function makeUI() {
    const root = document.createElement('div');
    root.id = 'autoNpcQuestUi';
    root.style.cssText = `
      position: fixed;
      right: 14px;
      bottom: 14px;
      z-index: 999999;
      width: 260px;
      background: rgba(18,18,22,.92);
      color: #fff;
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 16px;
      box-shadow: 0 14px 40px rgba(0,0,0,.35);
      backdrop-filter: blur(10px);
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      overflow: hidden;
    `;

    root.innerHTML = `
      <div style="padding:12px 12px 10px; border-bottom:1px solid rgba(255,255,255,.08);">
        <div style="font-weight:700; font-size:14px;">NPC Quest Runner</div>
        <div id="autoNpcQuestStatus" style="font-size:12px; opacity:.8; margin-top:4px; line-height:1.35;">Stopped</div>
      </div>

      <div style="padding:12px; display:grid; gap:10px;">
        <button id="autoNpcQuestRunBtn" style="
          width:100%; padding:10px 12px; border:0; border-radius:12px;
          background:#3b82f6; color:#fff; font-weight:700; cursor:pointer;
        ">Start</button>

        <button id="autoNpcQuestResetBtn" style="
          width:100%; padding:9px 12px; border:0; border-radius:12px;
          background:#2a2a32; color:#fff; cursor:pointer;
        ">Rescan NPCs</button>
      </div>
    `;

    document.body.appendChild(root);

    ui.root = root;
    ui.status = root.querySelector('#autoNpcQuestStatus');
    ui.runBtn = root.querySelector('#autoNpcQuestRunBtn');
    ui.resetBtn = root.querySelector('#autoNpcQuestResetBtn');

    ui.runBtn.addEventListener('click', () => setRunning(!state.running));
    ui.resetBtn.addEventListener('click', () => rescanNpcs({ keepPosition: true }));

    const mini = document.createElement('button');
    mini.textContent = 'NPC';
    mini.style.cssText = `
      position: fixed;
      right: 14px;
      bottom: 286px;
      z-index: 999999;
      padding: 8px 10px;
      border: 0;
      border-radius: 999px;
      background: rgba(18,18,22,.92);
      color: #fff;
      box-shadow: 0 10px 24px rgba(0,0,0,.3);
      cursor: pointer;
      font-weight: 700;
    `;
    mini.addEventListener('click', () => setMiniMode(!state.uiMinimized));
    document.body.appendChild(mini);
    ui.mini = mini;

    refreshStatus('Ready');
  }

  function start() {
    makeUI();
    sessionReset();
    rebuildNpcState({ keepAnchor: false });
    setMiniMode(true);

    intervalId = setInterval(tick, CFG.tickMs);

    observer = new MutationObserver(() => {
      if (state.running) tick();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function cleanup() {
    if (intervalId) clearInterval(intervalId);
    if (observer) observer.disconnect();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  window.addEventListener('beforeunload', cleanup, { passive: true });
})();

//Custom dungeon auto farm
(function() {
     if (!vv.isOn('custom_auto_farm')) return;
    'use strict';

    /* =====================================================================
       LOGIC / ENGINE
    ===================================================================== */

    function createCAFLogic() {

        /* ================== STATE ================== */

        const normalizeName = s => (s || '').trim().toLowerCase();
        const STAMINA_POTION_EXP_LIMIT = 0.80; // 80%
        const STAMINA_POTION_RESTORE = 5000;

        const selectedMonsters = new Set();
        const monsterCaps = new Map(); // dgmid -> cap
        const monsterPenalties = new Map(); // name -> skip count
        const monsterPenaltyRemaining = new Map(); // name -> remaining number of times to skip THAT monster
        const monsterPlayerCaps = new Map(); // name -> custom cap
        const monsterDamageTracker = new Map(); // dgmid -> damage
        // 🧠 Learned attack damage (rolling average)
        const learnedAttackDamage = new Map(); // atkId -> { avg: number, count: number }
        // Tracks last known total damage per monster
        const monsterLastDamage = new Map();   // dgmid -> last total damage

        const LEARNING_HITS_REQUIRED = 3;

        let selectedAttack = 'slash';
        let allowStaminaPotion = false;
        let allowHpPotion = false;

        // ✅ UI compatibility
        let damageMode = 'exp';// 'exp' | 'global' | 'monster'
        let playerDamageValue = 0;
        let avgDamagePerStamina = null;

        let running = false;
        let paused = false;
        let skipRemaining = 0;

        const CAP_EPSILON = 10_000;
        // 🟡 Soft cap configuration
        //const SOFT_CAP_RATIO = 0.90;     // 90% of cap
        //const SOFT_CAP_BUFFER = 2000;  // extra safety buffer


        const ATTACKS = [{
                id: 'slash',
                stamina: 1,
                skill: 0
            },
            {
                id: 'power',
                stamina: 10,
                skill: -1
            },
            {
                id: 'heroic',
                stamina: 50,
                skill: -2
            },
            {
                id: 'ultimate',
                stamina: 100,
                skill: -3
            },
            {
                id: 'legendary',
                stamina: 200,
                skill: -4
            }
        ];


        const INSTANCE_ID = new URLSearchParams(location.search).get('instance_id');
        const LOCATION_ID = new URLSearchParams(location.search).get('location_id');





        /* ================== HELPERS ================== */
        const STORAGE_KEY = `caf:location:${LOCATION_ID}`;

        function saveState() {
            const state = {
                selectedAttack,
                damageMode,
                playerDamageValue,
                allowStaminaPotion,
                allowHpPotion,
                selectedMonsters: [...selectedMonsters],
                monsterPenalties: [...monsterPenalties.entries()],
                monsterPlayerCaps: [...monsterPlayerCaps.entries()],

            };

            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }

        function loadState() {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;

            try {
                const state = JSON.parse(raw);

                if (state.selectedAttack) selectedAttack = state.selectedAttack;
                if (state.damageMode) damageMode = state.damageMode;
                if (typeof state.playerDamageValue === 'number')
                    playerDamageValue = state.playerDamageValue;

                allowStaminaPotion = !!state.allowStaminaPotion;
                allowHpPotion = !!state.allowHpPotion;

                selectedMonsters.clear();
                (state.selectedMonsters || []).forEach(m =>
                    selectedMonsters.add(normalizeName(m))
                );

                monsterPenalties.clear();
                (state.monsterPenalties || []).forEach(([name, val]) =>
                    monsterPenalties.set(name, val)
                );

                monsterPlayerCaps.clear();
                (state.monsterPlayerCaps || []).forEach(([name, val]) =>
                   monsterPlayerCaps.set(name, Number(val) || 0)
                );


            } catch (e) {
                console.warn('[CAF] Failed to load saved state', e);
            }
        }

        const sleep = ms => new Promise(r => setTimeout(r, ms));

        function setStatus(msg) {
            const bar = document.getElementById('caf-status-bar');
            if (bar) bar.textContent = msg;
        }

        let cachedMaxHp = null;

        function getMaxHpOnce() {
            if (cachedMaxHp !== null) return cachedMaxHp;

            const text = document.querySelector('.topbar-hp-wrapper .hp-text')?.textContent;
            const match = text?.match(/\/\s*([\d,]+)/);

            if (match) {
                cachedMaxHp = Number(match[1].replace(/,/g, ''));
            }

            return cachedMaxHp;
        }

        function getExpPercent() {
            const expText = document.querySelector('.gtb-exp-top span:last-child')?.textContent;
            if (!expText) return 0;

            const match = expText.match(/([\d,]+)\s*\/\s*([\d,]+)/);
            if (!match) return 0;

            const cur = Number(match[1].replace(/,/g, ''));
            const max = Number(match[2].replace(/,/g, ''));
            return max ? cur / max : 0;
        }

        function getCurrentStamina() {
            const el = document.getElementById('stamina_span');
            return el ? Number(el.textContent.replace(/[^\d]/g, '')) || 0 : 0;
        }

        function getMyDamage(result) {
            const uid = document.cookie.match(/demon=(\d+)/)?.[1];
            return result?.leaderboard?.find(e => String(e.ID) === uid)?.DAMAGE_DEALT ?? 0;
        }

        function hasDamageStopped(prev, curr) {
            return typeof prev === 'number' &&
                typeof curr === 'number' &&
                curr <= prev;
        }

        function downgradeAtkSmart(atkId, stamina) {
            const ordered = [...ATTACKS].sort((a, b) => b.stamina - a.stamina);
            const start = ordered.findIndex(a => a.id === atkId);
            if (start === -1) return null;
            for (let i = start; i < ordered.length; i++) {
                if (stamina >= ordered[i].stamina) return ordered[i];
            }
            return null;
        }

        function updateHpUI(currentHp, maxHp) {
            if (typeof currentHp !== 'number' || typeof maxHp !== 'number') return;

            const wrapper = document.querySelector('.topbar-hp-wrapper');
            if (!wrapper) return;

            // Update text
            const hpText = wrapper.querySelector('.hp-text');
            if (hpText) {
                hpText.textContent = `💚 ${currentHp.toLocaleString()} / ${maxHp.toLocaleString()} HP`;
            }

            // Update bar fill
            const fill = [...wrapper.querySelectorAll('.res-fill')]
            .find(el => !el.classList.contains('mana'));

            if (fill) {
                const percent = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
                fill.style.width = `${percent}%`;
            }
        }

        function updateStaminaUI(currentStamina) {
            if (typeof currentStamina !== 'number') return;

            const staminaSpan = document.getElementById('stamina_span');
            if (staminaSpan) {
                staminaSpan.textContent = currentStamina.toLocaleString();
            }
        }

        function applyLocalStaminaRestore(amount) {
            const span = document.getElementById('stamina_span');
            if (!span) return;

            const text = span.textContent.replace(/[^\d]/g, '');
            const current = Number(text) || 0;

            // Try to read max stamina from DOM
            const parentText = span.parentElement?.textContent || '';
            const maxMatch = parentText.match(/\/\s*([\d,]+)/);
            const max = maxMatch ? Number(maxMatch[1].replace(/,/g, '')) : Infinity;

            const next = Math.min(current + amount, max);

            span.textContent = next.toLocaleString();
        }

        function getDamageFromMonsterCard(card) {
            const dmgEl = card.querySelector('.statpill .k')?.textContent?.trim() === 'dmg'
            ? card.querySelector('.statpill .v')
            : [...card.querySelectorAll('.statpill')]
            .find(p => p.querySelector('.k')?.textContent?.trim() === 'dmg')
            ?.querySelector('.v');

            if (!dmgEl) return null;

            return Number(dmgEl.textContent.replace(/[^\d]/g, '')) || 0;
        }

        async function waitForStamina(min = 1, timeoutMs = 30000) {
            const start = Date.now();

            while (Date.now() - start < timeoutMs) {
                const stam = getCurrentStamina();
                if (stam >= min) return true;
                await sleep(1000);
            }

            return false; // timed out
        }

        function updateMonsterCardDamage(card, damage) {
            if (!card || typeof damage !== 'number') return;

            const dmgEl = card.querySelector('.statpill .k')?.textContent?.trim() === 'dmg'
            ? card.querySelector('.statpill .v')
            : [...card.querySelectorAll('.statpill')]
            .find(p => p.querySelector('.k')?.textContent?.trim() === 'dmg')
            ?.querySelector('.v');

            if (!dmgEl) return;

            dmgEl.textContent = damage.toLocaleString();
        }

        function getEstimatedAttackDamage(atkId) {
            const entry = learnedAttackDamage.get(atkId);

            // ✅ Slash is always safe-ish, even before learning
            if (atkId === 'slash') {
                if (!entry || entry.count < 2) return 1_000_000; // 1M conservative
                return entry.avg;
            }

            // ❗ Other attacks: unknown = dangerous
            if (!entry || entry.count < 3) return Infinity;

            return entry.avg;
        }

        function isAttackLearned(atkId) {
            const entry = learnedAttackDamage.get(atkId);
            return entry && entry.count >= LEARNING_HITS_REQUIRED;
        }

        function applyLocalExpGain(xpDelta) {
            if (typeof xpDelta !== 'number' || xpDelta <= 0) return;

            const expWrap = document.querySelector('.gtb-exp');
            if (!expWrap) return;

            const valueSpan = expWrap.querySelector('.gtb-exp-top span:last-child');
            const fill = expWrap.querySelector('.gtb-exp-fill');

            if (!valueSpan || !fill) return;

            // Parse "current / max"
            const match = valueSpan.textContent.match(/([\d,]+)\s*\/\s*([\d,]+)/);
            if (!match) return;

            let current = Number(match[1].replace(/,/g, '')) || 0;
            const max = Number(match[2].replace(/,/g, '')) || 0;
            if (!max) return;

            // Apply XP gain
            current = Math.min(current + xpDelta, max);

            // Update text
            valueSpan.textContent =
                `${current.toLocaleString()} / ${max.toLocaleString()}`;

            // Update bar
            const percent = Math.max(0, Math.min(100, (current / max) * 100));
            fill.style.width = `${percent.toFixed(2)}%`;
        }

        function expectedAttackDamage(atk) {
            // conservative fallback before learning
            if (avgDamagePerStamina === null) {
                return atk.stamina * 1_000_000; // 1M per stamina safety
            }

            // add variance buffer (crits, rng)
            return avgDamagePerStamina * atk.stamina * 1.15;
        }

        function chooseBestAttackForCap(remainingCap, stamina, cap) {
           // ✅ Allow small overshoot near cap (0.1%)
           const tolerance = cap * 0.001;

           const ordered = [...ATTACKS]
           .filter(a => a.stamina <= stamina)
           .sort((a, b) => b.stamina - a.stamina);

           for (const atk of ordered) {
               const est = expectedAttackDamage(atk);

               // ✅ THIS is where tolerance belongs
               if (est <= remainingCap + tolerance) {
                   return atk;
               }
           }

           // ✅ Fallback: slash only if nothing fits
           return ATTACKS.find(a => a.id === 'slash');
       }

        function updateDamagePerStamina(deltaDamage, staminaCost) {
            if (staminaCost <= 0 || deltaDamage <= 0) return;

            const dps = deltaDamage / staminaCost;

            if (avgDamagePerStamina === null) {
                avgDamagePerStamina = dps;
            } else {
                // smooth exponential average
                avgDamagePerStamina = avgDamagePerStamina * 0.85 + dps * 0.15;
            }
        }

        /* ================== EXP CAP FETCH ================== */

        async function fetchMonsterCap(dgmid) {
            if (monsterCaps.has(dgmid)) {
                return monsterCaps.get(dgmid);
            }

            setStatus('📊 Fetching EXP cap...');

            const html = await fetch(
                `/battle.php?dgmid=${dgmid}&instance_id=${INSTANCE_ID}`, {
                    credentials: 'include'
                }
            ).then(r => r.text());

            const doc = new DOMParser().parseFromString(html, 'text/html');

            const block = [...doc.querySelectorAll('.stat-block')]
                .find(b => b.querySelector('.label')?.textContent.trim() === 'EXP Cap');

            const cap =
                Number(
                    block?.querySelector('div')
                    ?.textContent.match(/([\d,]+)/)?.[1]
                    ?.replace(/,/g, '')
                ) || null;

            monsterCaps.set(dgmid, cap);
            return cap;
        }

        async function fetchMonsterCapAndDamage(dgmid) {
            setStatus('📊 Fetching EXP cap & damage…');

            const html = await fetch(
                `/battle.php?dgmid=${dgmid}&instance_id=${INSTANCE_ID}`,
                { credentials: 'include' }
            ).then(r => r.text());

            const doc = new DOMParser().parseFromString(html, 'text/html');

            // ✅ EXP CAP
            const capBlock = [...doc.querySelectorAll('.stat-block')]
            .find(b => b.querySelector('.label')?.textContent.trim() === 'EXP Cap');

            const cap =
                  Number(
                      capBlock?.querySelector('div')
                      ?.textContent.match(/([\d,]+)/)?.[1]
                      ?.replace(/,/g, '')
                  ) || null;

            // ✅ YOUR DAMAGE (authoritative)
            const dmgText =
                  doc.querySelector('#yourDamageValue')?.textContent;

            const damage =
                  dmgText ? Number(dmgText.replace(/[^\d]/g, '')) : 0;

            return { cap, damage };
        }

        /* ================== POTIONS ================== */

        function getPotionInvId(name) {
            return [...document.querySelectorAll('.potion-card')]
                .find(c =>
                    c.querySelector('.potion-name span')
                    ?.textContent.trim().toLowerCase() === name
                )?.dataset.invId || null;
        }

        async function useStaminaPotion() {
            if (!allowStaminaPotion) {
                setStatus('⛔ Stamina potion disabled by user');
                return false;
            }

            const invId = getPotionInvId('large stamina potion');
            if (!invId) {
                setStatus('⛔ No stamina potions left');
                return false;
            }

            setStatus('🔋 Using stamina potion...');
            await fetch('/use_item.php', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    inv_id: invId
                }).toString()
            });

           await sleep(1200);

            // ✅ Manually sync DOM with known potion effect
            applyLocalStaminaRestore(STAMINA_POTION_RESTORE);

            const newStamina = getCurrentStamina();
            updateStaminaUI(newStamina);

            setStatus('✅ Stamina restored. Resuming...');
            return newStamina > 0;
        }

        async function useHpPotion() {
            if (!allowHpPotion) {
                setStatus('⛔ HP potion disabled by user');
                return false;
            }

            const invId = getPotionInvId('full hp potion');
            if (!invId) {
                setStatus('⛔ No HP potions left');
                return false;
            }

            setStatus('❤️ Using HP potion...');
            await fetch('/user_heal_potion.php', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    inv_id: invId
                }).toString()
            });

            await sleep(800);
            setStatus('❤️ HP restored. Resuming...');
            return true;

            const hpText = document.querySelector('.topbar-hp-wrapper .hp-text');
            const match = hpText?.textContent.match(/([\d,]+)\s*\/\s*([\d,]+)/);

            if (match) {
                const currentHp = Number(match[1].replace(/,/g, ''));
                const maxHp = Number(match[2].replace(/,/g, ''));
                updateHpUI(currentHp, maxHp);
            }
        }

        /* ================== JOIN ================== */

        async function joinDungeonBattle(dgmid) {
            const user_id = document.cookie.match(/demon=(\d+)/)?.[1];
            if (!INSTANCE_ID || !user_id) return false;

            const res = await fetch('/dungeon_join_battle.php', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    instance_id: INSTANCE_ID,
                    dgmid,
                    user_id
                }).toString()
            });

            const text = await res.text();
            if (text.toLowerCase().includes('success')) {
                await sleep(600);
                return true;
            }
            return false;
        }

        async function attackMonster(dgmid, atk) {
            const form = new FormData();
            form.append('dgmid', dgmid);
            form.append('instance_id', INSTANCE_ID);
            form.append('skill_id', atk.skill);
            form.append('stamina_cost', atk.stamina);

            const res = await fetch('damage.php', {
                method: 'POST',
                credentials: 'include',
                body: form
            });

            const text = await res.text();

            // ✅ Try to parse JSON if possible
            try {
                return JSON.parse(text);
            } catch {
                // ✅ Normalize non‑JSON server errors (like HTTP 400)
                return {
                    status: 'error',
                    message: text
                };
            }
        }


        /* ================== MAIN LOOP ================== */

        async function run() {
            if (running) return;
            running = true;
            paused = false;
            skipRemaining = 0;
            // Initialize per-run penalty counters (IMPORTANT)
            monsterPenaltyRemaining.clear();
            for (const [name, value] of monsterPenalties.entries()) {
                monsterPenaltyRemaining.set(name, value);
            }

            setStatus('▶️ Starting auto farm...');

            const cards = [...document.querySelectorAll('.mon[data-name]')]
                .filter(c => selectedMonsters.has(normalizeName(c.dataset.name)));

            const totalMonsters = cards.length;

            for (let i = 0; i < cards.length; i++) {
                if (paused) break;

                const card = cards[i];
                const monsterName = card.dataset.name;
                const monsterIndex = i + 1;

                /* ================== PENALTY SKIP ================== */

                const monsterKey = normalizeName(monsterName);
                const remainingPenalty =
                    monsterPenaltyRemaining.get(monsterKey) || 0;

                if (remainingPenalty > 0) {
                    monsterPenaltyRemaining.set(monsterKey, remainingPenalty - 1);

                    setStatus(
                        `⚠️ Skipping penalized ${monsterName} ` +
                        `(${monsterIndex}/${totalMonsters}) – ` +
                        `${remainingPenalty - 1} left`
                    );

                    continue;
                }


                /* ================== JOIN BATTLE ================== */

                const dgmid =
                    card.querySelector('.qol-pick')?.dataset.mid ||
                    card.querySelector('a[href*="dgmid="]')
                    ?.href.match(/dgmid=(\d+)/)?.[1];

                if (!dgmid) continue;
                if (!await joinDungeonBattle(dgmid)) continue;
                let initialMonsterDamage = 0;



                /* ================== DETERMINE CAP ================== */

               let cap = null;



                if (damageMode === 'exp') {
                    const data = await fetchMonsterCapAndDamage(dgmid);
                    cap = data.cap;
                    initialMonsterDamage = data.damage;
                }

                else if (damageMode === 'global') {
                    cap = playerDamageValue > 0 ? playerDamageValue : null;
                    initialMonsterDamage = 0;
                }

                else if (damageMode === 'monster') {
                    const key = normalizeName(monsterName);
                    const customCap = monsterPlayerCaps.get(key);
                    cap = customCap > 0 ? customCap : null;
                    initialMonsterDamage = 0;
                }

                monsterDamageTracker.set(dgmid, initialMonsterDamage);
                monsterLastDamage.set(dgmid, initialMonsterDamage);
               // else if (damageMode === 'global') {
               //     cap = playerDamageValue > 0 ? playerDamageValue : null;
               // }

               // else if (damageMode === 'monster') {
               //     const key = normalizeName(monsterName);
               //     const customCap = monsterPlayerCaps.get(key);
               //     cap = customCap > 0 ? customCap : null;
               // }



                // ✅ PRE-ATTACK CAP FAILSAFE (card-based)
                if (typeof cap === 'number') {
                    const cardDamage = getDamageFromMonsterCard(card);

                    if (typeof cardDamage === 'number' && cardDamage >= cap) {
                        setStatus(
                            `✅ ${monsterName} already capped ` +
                            `(${cardDamage.toLocaleString()} / ${cap.toLocaleString()}) – skipping`
                        );
                        continue; // ⏭️ skip this monster entirely
                    }
                }
                let damage = 0;
                let lastDamage = -1;
                let prevDamage = damage;


                /* ================== ATTACK LOOP ================== */

                let finalSlashUsed = false;
                while (!paused) {
                    lastDamage = damage;

                    // ✅ Read authoritative damage from monster card (predictive)
                    const currentDamage = monsterDamageTracker.get(dgmid) ?? damage;
                    // ✅ Soft-cap math based on EXP cap
                    const learned = isAttackLearned(selectedAttack);

                    const rawEstimate = getEstimatedAttackDamage(selectedAttack);
                    const estimatedNextHit =
                          Number.isFinite(rawEstimate) ? rawEstimate * 1.15 : Infinity;

                    // ✅ Allow big attacks during learning phase
                    const willOvercap =
                          learned &&
                          typeof cap === 'number' &&
                          currentDamage + estimatedNextHit >= cap;


                    const stamina = getCurrentStamina();
                    const remainingCap =
                          typeof cap === 'number' ? cap - currentDamage : Infinity;

                    // ✅ Only engage smart cap logic when NEAR cap
                    const NEAR_CAP_RATIO = 0.25; // 25%

                    let atk;

                    if (
                        typeof cap === 'number' &&
                        remainingCap <= cap * NEAR_CAP_RATIO
                    ) {
                        atk = chooseBestAttackForCap(
                            remainingCap,
                            stamina,
                            cap
                        );
                    } else {
                        const baseAttack =
                              ATTACKS.find(a => a.id === selectedAttack) || ATTACKS[0];

                        atk = downgradeAtkSmart(baseAttack.id, stamina);
                    }


                    /* --- Local stamina exhaustion --- */
                    if (!atk) {
                        // ✅ Do NOT use stamina potion here
                        // ✅ Let the server be the authority
                        atk = ATTACKS[0]; // slash (1 stamina)
                    }

                // ✅ HARD STOP before overcapping
               const slashEst = getEstimatedAttackDamage('slash');

                    const slashLearned = isAttackLearned('slash');

                    if (
                        slashLearned &&
                        typeof cap === 'number' &&
                        currentDamage + slashEst >= cap
                    ) {
                        setStatus(`✅ Stopping safely – even slash would overcap`);
                        break;
                    }
                    const result = await attackMonster(dgmid, atk);
                    if (typeof result?.stamina === 'number') {
                        updateStaminaUI(result.stamina);
                    }


                    /* --- Server death error (no retaliation object) --- */
                    if (
                        result?.status === 'error' &&
                        typeof result.message === 'string' &&
                        result.message.toLowerCase().includes('dead')
                    ) {
                        setStatus(
                            `❤️ You died on ${monsterName} ` +
                            `(${monsterIndex}/${totalMonsters})`
                        );
                        if (!await useHpPotion()) break;
                        continue;
                    }

                    /* --- Server stamina error --- */
                   const staminaError =
                         typeof result?.message === 'string' &&
                         result.message.toLowerCase().includes('not enough stamina');

                    if (staminaError) {
                        const expPercent = getExpPercent();

                        // 🧠 FAILSAFE: do NOT waste stamina potions near level up
                        if (expPercent >= STAMINA_POTION_EXP_LIMIT) {
                            setStatus(`🧠 EXP ${Math.floor(expPercent * 100)}% – saving stamina potion`	);

                            const ok = await waitForStamina(1);
                            if (!ok) {
                                setStatus('⛔ Stamina did not recover – exiting fight');
                                break;
                            }

                            continue; // retry attack
                        }

                        // Try potion first
                        const used = await useStaminaPotion();

                        if (used) {
                            continue; // retry attack after potion
                        }

                        // No potion → wait instead of exiting
                        setStatus('⏳ Waiting for stamina…');

                        const ok = await waitForStamina(1);
                        if (!ok) {
                            setStatus('⛔ Stamina did not recover – exiting fight');
                            break;
                        }

                        continue;
                    }

                    /* --- HP retaliation (null-safe) --- */
                    const hpAfter = result?.retaliation?.user_hp_after;

                    // Update HP bar if server gives us HP info
                   if (typeof hpAfter === 'number') {
                       const maxHp = getMaxHpOnce();
                       if (maxHp) {
                           updateHpUI(hpAfter, maxHp);
                       }
                   }

                    if (typeof hpAfter === 'number' && hpAfter <= 0) {
                        setStatus(
                            `❤️ Using HP potion on ${monsterName} ` +
                            `(${monsterIndex}/${totalMonsters})`
                        );
                        if (!await useHpPotion()) break;
                        continue;
                    }

                    const total = getMyDamage(result);
                    damage = Math.max(0, total - initialMonsterDamage);
                    monsterDamageTracker.set(dgmid, damage);
                    // ✅ Apply EXP locally using server delta
                    if (typeof result?.xp_delta === 'number') {
                        applyLocalExpGain(result.xp_delta);
                    }

                    // 🧠 Learn actual damage from this attack
                    const prev = monsterLastDamage.get(dgmid) ?? 0;
                    const delta = damage - prev;

                    monsterLastDamage.set(dgmid, damage);

                    // ✅ Learn damage per stamina (global)
                    if (delta > 0 && atk?.stamina) {
                        updateDamagePerStamina(delta, atk.stamina);
                    }




                    /* ================== STATUS ================== */

                    setStatus(
                        `⚔️ Attacking ${monsterName} ` +
                        `(${monsterIndex}/${totalMonsters}) – ` +
                        `${damage.toLocaleString()} / ${cap?.toLocaleString() ?? '∞'}`
                    );

                    /* ================== EXIT CONDITIONS ================== */

                    if (typeof cap === 'number' && damage >= cap) {
                        setStatus(
                            `✅ Cap reached on ${monsterName} ` +
                            `(${monsterIndex}/${totalMonsters}). Moving on…`
                        );
                        break;
                    }


                    if (hasDamageStopped(lastDamage, damage)) {
                        setStatus(
                            `✅ ${monsterName} defeated ` +
                            `(${monsterIndex}/${totalMonsters}). Moving on…`
                        );
                        break;
                    }

                    await sleep(300);
                }
            }

            running = false;

            if (!paused) {
                setStatus('🏁 Run completed – refreshing...');

                // ✅ Refresh page after 2 seconds
                setTimeout(() => {
                    location.reload();
                }, 2000);
            }
        }
        loadState();

        /* ================== PUBLIC API ================== */

        return {
            ATTACKS,
            start: run,
            pause: () => {
                paused = true;
                setStatus('⏸️ Paused');
            },

            setAttack: id => {
                selectedAttack = id;
                saveState();
            },

            setDamageMode: m => {
                damageMode = m;
                saveState();
            },

            setPlayerDamage: v => {
                playerDamageValue = Number(v) || 0;
                saveState();
            },

            toggleMonster: (n, v) => {
                v ? selectedMonsters.add(normalizeName(n)) :
                    selectedMonsters.delete(normalizeName(n));
                saveState();
            },

            setMonsterPenalty: (n, v) => {
                monsterPenalties.set(normalizeName(n), Number(v) || 0);
                saveState();
            },

            setMonsterPlayerCap: (name, value) => {
                const v = Number(value) || 0;
                if (v > 0) {
                    monsterPlayerCaps.set(normalizeName(name), v);
                } else {
                    monsterPlayerCaps.delete(normalizeName(name));
                }
                saveState();
            },

            setUseStaminaPotion: v => {
                allowStaminaPotion = !!v;
                saveState();
            },

            setUseHpPotion: v => {
                allowHpPotion = !!v;
                saveState();
            },

            clearMonsterPenalties: () => monsterPenalties.clear(),

            /* ✅ ADD THESE GETTERS BELOW */

            getSelectedMonsters: () => [...selectedMonsters],
            getSelectedAttack: () => selectedAttack,
            getDamageMode: () => damageMode,
            getPlayerDamage: () => playerDamageValue,
            getMonsterPenalties: () => new Map(monsterPenalties),
            getMonsterPlayerCaps: () => new Map(monsterPlayerCaps),
            isStaminaPotionAllowed: () => allowStaminaPotion,
            isHpPotionAllowed: () => allowHpPotion
        };
    }

    /* =====================================================================
       UI Interface
    ===================================================================== */

    function createCAFUI(caf) {

        const normalize = s => (s || '').trim().toLowerCase();

        function findWrapper() {
            return [...document.querySelectorAll('div')]
                .find(d =>
                    d.style?.background?.includes('15, 18, 29') &&
                    d.querySelector('.qol-status') &&
                    d.querySelector('.qol-filter-row')
                );
        }

        function injectUI() {
            const wrapper = findWrapper();
            if (!wrapper || document.getElementById('custom-auto-farm')) return false;

            const root = document.createElement('div');
            root.id = 'custom-auto-farm';
            root.style.marginTop = '10px';

            root.innerHTML = `
<div style="background:#12162a;border:1px solid #303a60;border-radius:8px;overflow:hidden;">

  <!-- HEADER (clickable) -->
  <div id="caf-header"
       style="
         padding:8px 10px;
         font-weight:600;
         display:flex;
         justify-content:space-between;
         align-items:center;
         cursor:pointer;
         background:#0f121d;
       ">
    <span>⚙️ Custom Auto Farm</span>
    <span id="caf-toggle-icon" style="transition:transform .2s;">▼</span>
  </div>

  <!-- COLLAPSIBLE CONTENT -->
  <div id="caf-content" style="padding:10px;">

    <!-- EVERYTHING THAT WAS ALREADY INSIDE GOES HERE -->

<div class="caf-dd-wrap" style="position:relative;margin-bottom:10px;">
  <button id="caf-monster-btn" class="qol-btn secondary" style="width:260px">
    🎯 Select Monsters
  </button>
  <div id="caf-monster-dropdown"
       style="display:none;position:absolute;top:100%;
              background:#0f121d;border:1px solid #303a60;
              padding:8px;width:260px;z-index:10;">
  </div>
</div>


<div class="caf-dd-wrap" style="position:relative;margin-bottom:10px;">
  <button id="caf-attack-btn" class="qol-btn secondary" style="width:260px">
    ⚔️ Select Attack
  </button>
  <div id="caf-attack-dropdown"
       style="display:none;position:absolute;top:100%;
              background:#0f121d;border:1px solid #303a60;
              padding:8px;width:260px;z-index:10;">

      ${caf.ATTACKS.map(a =>
        `<label style="display:flex;gap:6px;font-size:13px;">
          <input type="radio" name="caf-attack" data-attack="${a.id}" ${a.id==='slash'?'checked':''}>
          ${a.label} (${a.stamina})
        </label>`
      ).join('')}
    </div>
  </div>

 <div style="margin-bottom:10px;font-size:13px;">
  <div style="font-weight:600;margin-bottom:6px;">
    Damage per mob
  </div>

  <label>
  <input type="radio" name="caf-dmg" value="exp">
  EXP Cap
</label>

<label style="margin-left:12px">
  <input type="radio" name="caf-dmg" value="global">
  Global Choice
</label>

<label style="margin-left:12px">
  <input type="radio" name="caf-dmg" value="monster">
  Per Monster Cap
</label>

  <input id="caf-player-dmg"
         type="number"
         style="display:none;margin-top:6px;width:100%;">

         <div id="caf-monster-cap-section"
     style="display:none;margin-bottom:10px;font-size:13px;">
  <div style="font-weight:600;font-size:13px;margin-bottom:6px;">
    🎯 Per Monster Caps
  </div>

  <div id="caf-monster-caps"
       style="display:flex;flex-direction:column;gap:8px;flex-wrap: wrap;align-content: flex-start;">
  </div>
</div>
</div>
<div style="margin-bottom:10px;font-size:13px;">
  <div style="font-weight:600;font-size:13px;margin-bottom:6px;">
    🧪 Potion Usage
  </div>

  <label style="display:block;">
    <input type="checkbox" id="caf-use-lsp">
    Use unlimited LSP
  </label>

  <label style="display:block;margin-top:4px;">
    <input type="checkbox" id="caf-use-hp">
    Use unlimited HP Pot
  </label>
</div>

    <div style="margin-bottom:10px;">
      <div style="font-weight:600;font-size:13px;margin-bottom:6px;">
        ⚠️ Monster Penalties
      </div>
      <div id="caf-penalties"
           style="display:flex;flex-direction:column;gap:8px;flex-wrap: wrap;align-content: flex-start;">
      </div>
    </div>

  <div style="display:flex;gap:8px;">
    <button id="caf-start" class="qol-btn primary">▶ Start</button>
    <button id="caf-pause" class="qol-btn secondary">⏸ Pause</button>
  </div>
  <div id="caf-status-wrap" style="margin-top:10px;"></div>
</div>
  </div>
</div>
`;

            wrapper.querySelector('.qol-status').after(root);
            // Create status bar
            const statusWrap = root.querySelector('#caf-status-wrap');
            const statusBar = document.createElement('div');

            statusBar.id = 'caf-status-bar';
            statusBar.textContent = 'Idle';

            statusBar.style.cssText =
                'padding:6px 10px;' +
                'background:#12162a;' +
                'border:1px solid #303a60;' +
                'color:#8aa2ff;' +
                'font-size:13px;' +
                'border-radius:6px;';

            statusWrap.appendChild(statusBar);


            // Collapse by default
            const content = root.querySelector('#caf-content');
            const icon = root.querySelector('#caf-toggle-icon');

            if (content && icon) {
                content.style.display = 'none';
                icon.style.transform = 'rotate(-90deg)';
            }

            populateMonsters();
            populatePenaltyInputs();
            populateMonsterCaps();

            // Restore UI from CAF state

            const selected = new Set(caf.getSelectedMonsters());

            document.querySelectorAll('[data-monster]').forEach(cb => {
                cb.checked = selected.has(cb.dataset.monster);
            });

            // restore attack
            const atk = document.querySelector(
                `[data-attack="${caf.getSelectedAttack()}"]`
            );
            if (atk) atk.checked = true;

            // restore damage mode
            document.querySelectorAll('[name="caf-dmg"]').forEach(r => {
                r.checked = r.value === caf.getDamageMode();
            });
            updateDamageModeUI(caf.getDamageMode());

            // ✅ Restore global player cap visibility on load
            document.getElementById('caf-player-dmg').style.display =
                caf.getDamageMode() === 'player' ? 'block' : 'none';

            // restore player damage
            document.getElementById('caf-player-dmg').value =
                caf.getPlayerDamage();

            // restore potion checkboxes
            document.getElementById('caf-use-lsp').checked =
                caf.isStaminaPotionAllowed();

            document.getElementById('caf-use-hp').checked =
                caf.isHpPotionAllowed();

            // restore penalties
            const penalties = caf.getMonsterPenalties();
            document.querySelectorAll('[data-penalty]').forEach(inp => {
                inp.value = penalties.get(inp.dataset.penalty) || 0;
            });

            // restore per-monster player caps
            const caps = caf.getMonsterPlayerCaps();
            document.querySelectorAll('[data-player-cap]').forEach(inp => {
                inp.value = caps.get(inp.dataset.playerCap) || '';
            });

            const lspCheckbox = root.querySelector('#caf-use-lsp');
            const hpCheckbox = root.querySelector('#caf-use-hp');

            // ✅ React to changes
            lspCheckbox.addEventListener('change', e => {
                caf.setUseStaminaPotion(e.target.checked);
            });

            hpCheckbox.addEventListener('change', e => {
                caf.setUseHpPotion(e.target.checked);
            });

            return true;
        }

        function enableCollapse() {
            const header = document.getElementById('caf-header');
            const content = document.getElementById('caf-content');
            const icon = document.getElementById('caf-toggle-icon');

            if (!header || !content) return;

            header.addEventListener('click', () => {
                const collapsed = content.style.display === 'none';

                content.style.display = collapsed ? 'block' : 'none';
                icon.style.transform = collapsed ? 'rotate(0deg)' : 'rotate(-90deg)';
            });
        }

        function enableDropdownMouseLeave() {
            document.querySelectorAll('.caf-dd-wrap').forEach(wrap => {
                wrap.addEventListener('mouseleave', () => {
                    setTimeout(() => {
                        const dd = wrap.querySelector('div[id$="-dropdown"]');
                        if (dd) dd.style.display = 'none';
                    }, 100);
                });
            });
        }

        function updateDamageModeUI(mode) {
            // Global cap input
            document.getElementById('caf-player-dmg').style.display =
                mode === 'global' ? 'block' : 'none';

            // Per-monster caps section
            document.getElementById('caf-monster-cap-section').style.display =
                mode === 'monster' ? 'block' : 'none';
        }

        function populateMonsters() {
            const dd = document.getElementById('caf-monster-dropdown');
            const names = [...new Set(
                [...document.querySelectorAll('.mon[data-name]')]
                .map(m => normalize(m.dataset.name))
            )];

            dd.innerHTML = names.map(n => `
      <label style="font-size:13px;display:flex;gap:6px;align-items:center;">
        <input type="checkbox" data-monster="${n}">
        ${n.replace(/\b\w/g,c=>c.toUpperCase())}
      </label>
    `).join('');
        }

        function populatePenaltyInputs() {
            const wrap = document.getElementById('caf-penalties');
            if (!wrap) return;

            const monsters = [...new Set(
                [...document.querySelectorAll('.mon[data-name]')]
                .map(m => normalize(m.dataset.name))
            )];

         wrap.innerHTML = monsters.map(name => `
  <div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;align-items:center;">
    <span style="flex:1;">
      ${name.replace(/\b\w/g, c => c.toUpperCase())}
    </span>

    <input type="number"
           min="0"
           value="0"
           data-penalty="${name}"
           title="Penalty skips"
           style="width:64px;text-align:center;">
  </div>
`).join('');

        }

        function populateMonsterCaps() {
            const wrap = document.getElementById('caf-monster-caps');
            if (!wrap) return;

            const monsters = [...new Set(
                [...document.querySelectorAll('.mon[data-name]')]
                .map(m => normalize(m.dataset.name))
            )];

            wrap.innerHTML = monsters.map(name => `
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;">
      <span style="flex:1;">
        ${name.replace(/\b\w/g, c => c.toUpperCase())}
      </span>

      <input type="number"
             min="0"
             placeholder="Cap"
             data-player-cap="${name}"
             class="caf-player-cap"
             style="width:96px;text-align:center;">
    </div>
  `).join('');
        }

        document.addEventListener('click', e => {
            if (e.target.id === 'caf-start') {
                caf.start();
                const sb = document.getElementById('caf-status-bar');
                if (sb) sb.textContent = 'Running auto farm...';
            }

            if (e.target.id === 'caf-pause') {
                caf.pause();
                const sb = document.getElementById('caf-status-bar');
                if (sb) sb.textContent = 'Paused';
            }


            if (e.target.id === 'caf-monster-btn')
                document.getElementById('caf-monster-dropdown').style.display = 'block';

            if (e.target.id === 'caf-attack-btn')
                document.getElementById('caf-attack-dropdown').style.display = 'block';

            if (e.target.matches('[data-monster]'))
                caf.toggleMonster(e.target.dataset.monster, e.target.checked);

            if (e.target.matches('[data-attack]'))
                caf.setAttack(e.target.dataset.attack);

          if (e.target.name === 'caf-dmg') {
              caf.setDamageMode(e.target.value);
              updateDamageModeUI(e.target.value);
          }

        });

        document.addEventListener('input', e => {
            if (e.target.id === 'caf-player-dmg')
                caf.setPlayerDamage(Number(e.target.value));
        });

        document.addEventListener('input', e => {
            if (e.target.matches('[data-penalty]')) {
                const name = e.target.dataset.penalty;
                const value = Number(e.target.value) || 0;

                caf.setMonsterPenalty(name, value);
            }
        });

        document.addEventListener('input', e => {
            if (e.target.matches('[data-player-cap]')) {
                const name = e.target.dataset.playerCap;
                const value = Number(e.target.value) || 0;

                caf.setMonsterPlayerCap(name, value);
            }
        });

        const wait = setInterval(() => {

            if (injectUI()) {
                enableDropdownMouseLeave();
                enableCollapse();
                clearInterval(wait);
            }

            ;
        }, 300);
    }

    /* ===================================================================== */

    const caf = createCAFLogic();
    createCAFUI(caf);

})();



