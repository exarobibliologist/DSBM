// ==UserScript==
// @name            DeviantArt Super Badge Manager
// @namespace       https://www.deviantart.com/
// @description     Unified, throttled manager for mass-sending Llamas and Cakes.
// @version         1.0.8
// @match           *://*.deviantart.com/*
// @grant           GM_getValue
// @grant           GM_setValue
// @run-at          document-end
// ==/UserScript==

(() => {
    'use strict';

    // --- GLOBAL STATE ---
    let requestQueue = [];
    let isProcessingQueue = false;
    let csrfTokenCache = null;
    let csrfTokenCacheTime = 0;
    
    const memoryCache = new Map();
    const sessionCakesGiven = new Set(); // Tracks cakes given only during this specific page session
    
    const CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000;
    const CSRF_CACHE_DURATION = 30 * 60 * 1000;
    const BATCH_LIMIT = 50;

    let stats = { pending: 0, sent: 0, spam: 0, error: 0 };

    // --- BASE64 ASSETS ---
    const IMG = {
        GIVE_CAKE: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAASCAYAAABb0P4QAAAACXBIWXMAAAsTAAALEwEAmpwYAAACB0lEQVQ4jZ2SvU9TYRSHn/e2t/QDSqoGlosuJXa6TBJ2/wMTIgziZkJMUBdjU0ycNHYyJH6wslgYmujg5ubg4kAHJYEm8jGgCdpAb7W2vcfh9r60QG+Nv+QmJ+fjec895yAiiAh22hJAAPF9//MdGyC17QWx01ZP4OGrK30fMybGx2RifEzstAVAaWsP30eHjpYnJWpf4Gh5sst/UuHS1h617QXt8O34paVTySoTh1IQDsJ+sZ22+Pj+GlNXi6eSZm6MyNS5BBuf7pD5vMjdIKCIKIDOX1zf3FWdsHz+Ma4Lt4rveHA/x+zcqM59vfJNdQJVeyEopQTATlsa6MPKuwUMJdx8dpm13A6ppKUBD7NFlFIaroEnNTs3KvmnS3z5+gIAM2RiKCGWiDEQNaFdNxi9qGsWs6v0BN6esWX63hB/3DDlzSoAw0MJwmYoYILtpfSSYSj2dw6Zv/4EgJ+VGqmk6QVDCQDcxg8Aqo5DYe1NMLBLzTKpQcCF/e9VRs4bGKE4tGoA1J2K10QQIzJwdlgpPNgZ6tmhoRSq5dkvV3P9+qde/UWcTG+gK0Ik5i1gfvoRrlvviovbRBnH5f80w0bTbbdrQmND+5uN39qORLxH644D9NlyzWlq++CgwnAy6hWZUT1Dt70UX33PBmDlbTYoTWv9Q6v3YYN33OAtyA3I8/W8UFJ/ASNLIgCpZsHzAAAAAElFTkSuQmCC',
        CAKE_SUCCESS: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAASCAYAAABIB77kAAAACXBIWXMAAAsTAAALEwEAmpwYAAADPUlEQVQ4jb2VX2hTVxzHP+f23pi0iaJmUWhnSil3oWEOnEif6qoyxrQFJ9OMzT3sYVuZoPvHyBQ3NnFTtr2NofNh+FLdwzbH/j20KKHqkDmYoyVcY2i11ZhiF5akWpPe48NtTpPeDPog+8GFc373/H6f3/d3zrlXSCn5P02r58wf2/BQq2g1orLViEoAvR7MuzZI/tgGGXjtkngYsN9+OsNIwqLViEoXEEBEGuHK4hJuCvaqbuTu5QD4s5CoKXQkYTH4SwKYU1iR2xmbpHNFE8nLe4mMHGDfIkA93dtc79b5u2QFPFoaFpX8o6VhIcJ6h5L81tF3OTf6Jq9+d5bjz3UTj+9XSfpP3lZVbwr2yp7ubYTNFjq6TKbGHWWZdBaAMWucVCrNxasXXGr1hZLHbvZj/f4Y2c0/8NHh7WphbHdICuHE9nR/rGCBR5oAmBrPsbotRCadJWy2cOT7T9nx+E7W+btkNVTEdofkxf4gAMcTQYwGA01IfE0+lngNmLs2fu8aBT8QP80HL55XsPxk8T9VDiYHSN79QwH1FfdX8c1QgPu2zrWrBQCWBZrQDXvBzvytRtt3dvDU1qe5fOk8+ckiW3t3APBPaRKAE/ETau2jgTVEfOtlBaoDaJogc/1f+nZ94gTmplm+1HAiGhwVdmkKgEKxyKlvz3Du569rlFXbmDWuxmazyY3kdTV3X4vyNZb7ARsy2QKhlRpaQyPMTgMwU3QA1aChX98DILrlHeVLpdJYExbPbnyGweR8eg3As6TuBwchcGB1LJPOqofMLQCGBz5zrUul0jVzXRMCMetMvjq93xWw0GYKd2kkUqeCW0Rf+lxBKurCZguDyYF5oC0lHl8DAH3Pf4htz9TkkXYZoc13vrKH1fs0ZgWI9fkBeOGJl7EmLMxmk7DZwvtfHKw9pQCl8tyJ1AwozTe8XLqnxh6PU9RMsahUVNuht+HJYGeNstVtIVcjdIDpYlk57tzJsWyp13lpeNUe2nOHpmLWhOVKZjabtLe3Kdgre16vUaeAmub4Tv4YdyWpZ38NzXIj7wFgc2QL7e1tADUgwAUDEFJK3oitlQCaENiL+CF/eeqKShTxrXcF1ANV7AE+IV3JRMqolgAAAABJRU5ErkJggg==',
        CAKE_ALREADY: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAACXBIWXMAAAsTAAALEwEAmpwYAAAArklEQVQYlX2KsQ6CMAAFX4EKQaIQF50hcXFyILhL4m/pb3VwJTg5GSY+QbElJZUWF3HklhvuCLtegobXjLdVqrWG7yZlFMb56XgWAOA0vGatvGeuS6GUwvN9y/r+wwAcAMDibZVSSuF5HmzbBiEEL/5I8cPRWkMphdHGGBhjxg7Ld5NSCAEhBKSU6LoOi/m2/A9RGOfLYF8o5Zi+n5lVmBab9S4fBzIMA6awJiuAL+XrUQXvWcEAAAAAAElFTkSuQmCC',
        CAKE_ENOUGH: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAACXBIWXMAAAsTAAALEwEAmpwYAAAArklEQVQYlX2KsQ6CMAAFX4EKQaIQF50hcXFyILhL4m/pb3VwJTg5GSY+QbElJZUWF3HklhvuCLtegobXjLdVqrWG7yZlFMb56XgWAOA0vGatvGeuS6GUwvN9y/r+wwAcAMDibZVSSuF5HmzbBiEEL/5I8cPRWkMphdHGGBhjxg7Ld5NSCAEhBKSU6LoOi/m2/A9RGOfLYF8o5Zi+n5lVmBab9S4fBzIMA6awJiuAL+XrUQXvWcEAAAAAAElFTkSuQmCC',
        CAKE_ERROR: 'data:image/gif;base64,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',
        GIVE_LLAMA: 'data:image/gif;base64,R0lGODlhDwASAPQaAO6oQy4kHAAAAJRPC0onDfbhbl0yEO+pQtGBKdGMJcJaKpVgLrFtJ+qwNFkrFuqpJvjGROOKJFUyEmNjPNWUNOzJYnx8Sl0xDXFFLnV1Pv///wAAAAAAAAAAAAAAAAAAACH5BAUAABoALAAAAAAPABIAQAWJoKYFgiCKhKGl5ym9EjEgh9qOWWAF466VgUKAhIIYCoSbZKFgLhYJgGoYFAxRjUIjKQK2CIzBgSuSVCKICBiBSNRuAQfGMQgMHLyu8EQ4UPp/AgWDgyYrFw0GZEF5KAMFEGQ3jjQ2LhWYFWsJD2QDTk9PCW4DLQNNqAsPB6VwEwGvI7GTVDxUGiEAOw==',
        LLAMA_SUCCESS: 'data:image/gif;base64,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',
        LLAMA_ALREADY: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAmElEQVR4Aa2OxUHFQBCGvxXctQl62jbCBS0lR/qhBC7x5MXXcCrgH/cR8eVme3rTz1FKg7P4zZwesXMvHl9XAP1ZVCcHidzZJowz0cekLVqAWwCJVEbubqOO92FLgxQIrQw/0NGt+GEmWkeYlg/rCc7zC/l501YdtmjxTY/vR+K0pH8bPh9q6w1OCIP3H0Wbnl1c30PO/+AdWxpL8w9v1MsAAAAASUVORK5CYII=',
        LLAMA_ENOUGH: 'data:image/gif;base64,R0lGODlhDwASAPQYALAUFHNzc97KzIeHh8K2qu3t7fn5+cgmJuXl5WNjY+95eXh4ePr6+rscHKsPDz09PexiYvOenjc3Nzs7O+7u7s/PzwAAAPTt5QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAUAABgALAAAAAAPABIAAAV4ICaOYxBgJqkGhcC64oHJJcIgJ9YoQESjE8Qj14AoFL+A4MHIYRyQH4pwcz5XFwJOtSIICgPuYDwIeMGqgWFtCFwEl4tT/Za/4WjRoB7vX/J6dXBxFFYYA3CJcYAjEgQVBAQJkRZcFgmXlZmWCxadGJ6VlhakoKUhADs=',
        LLAMA_ERROR: 'data:image/gif;base64,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',
        UNKNOWN: 'data:image/gif;base64,R0lGODlhDAASAPABAJOpjwAAACH5BAUAAAEALAAAAAAMABIAAAImjA8QeWi62nNyKVZvzFTC7XXJSH2g1Zho5aglC44yFmnaZJ+ypRQAOw==',
        SPAM: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAVCAMAAACE9bUqAAAAe1BMVEUAMmb0zTM4DRCcX0HOt4ifSyxmAADMmWZlOCSojjDMiGGPPSFlAADVs5vElXfUp6oAAC5KR0NPNTyeSi6fgHYgH0+dX0Cbg4AAMWaZZmara2a4dG4/QFLHik9jCQ13Tkw6KUUAADMILVRLEhbMj22KSSgsDg0tR2YAKmIz6elIAAAAj0lEQVR4AX3LBRrDMAxDYSdlGDMz3P+Es6tF4/1lva+S/SL/OeeaS+y014JFOKJIgE9cOAhfXB3GafPLR4HuKI7jdqkStdnuBPa9WB0RBonpo1xihZ1QXgMMURAiM45gci8rfAaz+WIppqZ1bdJUbwz4JpQWUAWh5MHB+xMLdk9nb7TkgBU6SsuVO2eU7JcbjM8Lv+nDU0gAAAAASUVORK5CYII='
    };

    const UI_TITLES = {
        llama: { give: 'Give a Llama', already: 'Already gave a Llama', enough: 'Has Llamas enough for love', spam: 'Giving Llamas too quickly!', error: 'Error giving Llama.', unknown: 'Llama status unknown' },
        cake: { give: 'Give a Cake', already: 'Already gave a Cake', enough: 'Has Cakes enough for love (max 20)', spam: 'Giving Cakes too quickly!', error: 'Error giving Cake.', unknown: 'Cake status unknown' }
    };

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    const randomDelay = (min, max) => delay(Math.floor(Math.random() * (max - min + 1) + min));

    // --- CSS INJECTION ---
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .super-badge-widget { display: inline-flex; align-items: center; gap: 4px; margin-left: 6px; }
            span.s-badge { display: inline-block; pointer-events: all; image-rendering: pixelated; width: 18px; height: 18px; vertical-align: middle; cursor: default; transition: .3s all; }
            
            /* Llama Isolated States (already and success now use the exact same image to remain permanently visible) */
            span.s-llama-give { background: url(${IMG.GIVE_LLAMA}) center no-repeat; cursor: pointer; }
            span.s-llama-success, span.s-llama-already { background: url(${IMG.LLAMA_SUCCESS}) center no-repeat; width: 26px; margin: 0; }
            span.s-llama-enough { background: url(${IMG.LLAMA_ENOUGH}) center no-repeat; }
            span.s-llama-error { background: url(${IMG.LLAMA_ERROR}) center no-repeat; cursor: pointer; }
            
            /* Cake Isolated States */
            span.s-cake-give { background: url(${IMG.GIVE_CAKE}) center no-repeat; cursor: pointer; width: 20px; }
            span.s-cake-success { background: url(${IMG.CAKE_SUCCESS}) center no-repeat; width: 28px; }
            span.s-cake-already { background: url(${IMG.CAKE_ALREADY}) center no-repeat; width: 8px; margin: 0; }
            span.s-cake-enough { background: url(${IMG.CAKE_ENOUGH}) center no-repeat; width: 8px; margin: 0; }
            span.s-cake-error { background: url(${IMG.CAKE_ERROR}) center no-repeat; cursor: pointer; width: 20px; }
            
            /* Shared Utility States */
            span.s-badge-unknown { background: url(${IMG.UNKNOWN}) center no-repeat; cursor: help; }
            span.s-badge-spam { background: url(${IMG.SPAM}) center no-repeat; cursor: pointer; width: 25px; }
            
            /* Floating Panel */
            #super-badge-panel { position: fixed; bottom: 24px; right: 24px; background: #1e1e24; color: #e5e5e5; border: 1px solid #333; border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4); z-index: 99999; font-family: sans-serif; overflow: hidden; width: 50px; height: 50px; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); display: flex; flex-direction: column; }
            #super-badge-panel:hover { width: 320px; height: 180px; background: #25262c; }
            #sbp-header { display: flex; align-items: center; padding: 10px; cursor: pointer; min-height: 50px; box-sizing: border-box; }
            #sbp-icon { width: 30px; height: 30px; fill: #00E5FF; flex-shrink: 0; }
            #sbp-title { font-weight: 600; font-size: 16px; margin-left: 12px; white-space: nowrap; opacity: 0; transition: opacity 0.2s; }
            #super-badge-panel:hover #sbp-title { opacity: 1; }
            #sbp-content { padding: 0 16px 16px 16px; opacity: 0; transition: opacity 0.2s; display: flex; flex-direction: column; gap: 10px; }
            #super-badge-panel:hover #sbp-content { opacity: 1; transition-delay: 0.1s; }
            .sbp-stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; background: #17181c; padding: 10px; border-radius: 8px; }
            .sbp-stat-grid div { display: flex; justify-content: space-between; }
            .sbp-stat-val { font-weight: bold; color: #00E5FF; }
            #sbp-action-btn { background: #00E5FF; color: #000; border: none; padding: 8px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: background 0.2s; }
            #sbp-action-btn:hover { background: #00b3cc; }
        `;
        document.head.appendChild(style);
    }

    // --- PANEL STATS UPDATER ---
    function updatePanelStats(type, count = 1) {
        if (type === 'reset') {
            stats = { pending: requestQueue.length, sent: 0, spam: 0, error: 0 };
        } else if (type === 'pending') {
            stats.pending = requestQueue.length;
        } else if (stats[type] !== undefined) {
            stats[type] += count;
        }

        document.getElementById('sbp-stat-pending').textContent = stats.pending;
        document.getElementById('sbp-stat-sent').textContent = stats.sent;
        document.getElementById('sbp-stat-spam').textContent = stats.spam;
        document.getElementById('sbp-stat-error').textContent = stats.error;
    }

    // --- UI INJECTION ---
    function createFloatingPanel() {
        const panel = document.createElement('div');
        panel.id = 'super-badge-panel';
        panel.innerHTML = `
            <div id="sbp-header">
                <svg id="sbp-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C7.5 2 4 5.5 4 10c0 1.5.4 2.9 1 4.1v5.4c0 .8.7 1.5 1.5 1.5h1.2c.7 0 1.3-.5 1.5-1.2L10 17h4l.8 2.8c.2.7.8 1.2 1.5 1.2h1.2c.8 0 1.5-.7 1.5-1.5v-5.4c.6-1.2 1-2.6 1-4.1 0-4.5-3.5-8-8-8zm-3 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                    <path d="M9 9.5m-1 0a1 1 0 1 0 2 0 1 1 0 1 0 -2 0"/>
                    <path d="M15 9.5m-1 0a1 1 0 1 0 2 0 1 1 0 1 0 -2 0"/>
                </svg>
                <div id="sbp-title">Super Badge Queue</div>
            </div>
            <div id="sbp-content">
                <div class="sbp-stat-grid">
                    <div><span>Pending:</span> <span id="sbp-stat-pending" class="sbp-stat-val">0</span></div>
                    <div><span>Sent:</span> <span id="sbp-stat-sent" class="sbp-stat-val">0</span></div>
                    <div><span>Spam Hits:</span> <span id="sbp-stat-spam" class="sbp-stat-val">0</span></div>
                    <div><span>Errors:</span> <span id="sbp-stat-error" class="sbp-stat-val">0</span></div>
                </div>
                <button id="sbp-action-btn">Mass Send Available Badges</button>
            </div>
        `;
        document.body.appendChild(panel);
        document.getElementById('sbp-action-btn').addEventListener('click', populateAndStartQueue);
    }

    function handleSingleClick(e) {
        const btn = e.currentTarget;
        const devName = btn.dataset.devname;
        const devNameReg = btn.dataset.devnamereg;
        const type = btn.dataset.type;
        
        // Prevent manual spam for cakes already given this session
        if (type === 'cake' && sessionCakesGiven.has(devName)) return;

        if (btn.className.includes('-give') || btn.className.includes('-error') || btn.className.includes('-spam')) {
            let alreadyInQueue = false;
            for (let i = 0; i < requestQueue.length; i++) {
                if (requestQueue[i].devName === devName && requestQueue[i].type === type) {
                    alreadyInQueue = true;
                    break;
                }
            }

            if (!alreadyInQueue) {
                requestQueue.push({ devName: devName, devNameReg: devNameReg, type: type });
                updatePanelStats('pending');
                
                if (!isProcessingQueue) {
                    processQueue();
                }
            }
        }
    }

    function createSuperWidget(devName, devNameReg) {
        const container = document.createElement('span');
        container.className = 'super-badge-widget';

        const llamaBtn = document.createElement('span');
        llamaBtn.className = 's-badge s-badge-unknown'; 
        llamaBtn.dataset.devname = devName;
        llamaBtn.dataset.devnamereg = devNameReg;
        llamaBtn.dataset.type = 'llama';
        llamaBtn.addEventListener('click', handleSingleClick); 

        const cakeBtn = document.createElement('span');
        cakeBtn.className = 's-badge s-badge-unknown';
        cakeBtn.dataset.devname = devName;
        cakeBtn.dataset.devnamereg = devNameReg;
        cakeBtn.dataset.type = 'cake';
        cakeBtn.addEventListener('click', handleSingleClick); 

        container.appendChild(llamaBtn);
        container.appendChild(cakeBtn);
        return container;
    }

    // --- CACHE & DATA MGMT ---
    function getCachedStatus(devName) {
        let cached = null;
        if (memoryCache.has(devName)) {
            cached = memoryCache.get(devName);
        } else {
            const raw = window.localStorage.getItem(`sb-status-${devName}`);
            if (raw) {
                try {
                    const data = JSON.parse(raw);
                    if ((data.llama !== 'give' && data.cake !== 'give') || (Date.now() - data.timestamp < CACHE_EXPIRY)) {
                        memoryCache.set(devName, data);
                        cached = data;
                    }
                } catch(e) {}
            }
        }
        
        // Clone object to inject session state without mutating local storage
        if (cached) {
            const returnData = { ...cached };
            if (sessionCakesGiven.has(devName) && returnData.cake === 'give') {
                returnData.cake = 'already'; // Spoof UI for this page lifecycle
            }
            return returnData;
        }
        return null; 
    }

    function saveCachedStatus(devName, llamaStatus, cakeStatus) {
        const data = { llama: llamaStatus, cake: cakeStatus, timestamp: Date.now() };
        memoryCache.set(devName, data);
        window.localStorage.setItem(`sb-status-${devName}`, JSON.stringify(data));
    }

    function updateWidgetUI(devName, llamaStatus, cakeStatus) {
        const llamaBtns = document.querySelectorAll(`span.s-badge[data-devname="${devName}"][data-type="llama"]`);
        const cakeBtns = document.querySelectorAll(`span.s-badge[data-devname="${devName}"][data-type="cake"]`);

        for (let i = 0; i < llamaBtns.length; i++) {
            if (['unknown', 'spam'].includes(llamaStatus)) {
                llamaBtns[i].className = `s-badge s-badge-${llamaStatus}`;
            } else {
                llamaBtns[i].className = `s-badge s-llama-${llamaStatus}`;
            }
            llamaBtns[i].title = UI_TITLES.llama[llamaStatus] || UI_TITLES.llama.unknown;
        }
        
        for (let j = 0; j < cakeBtns.length; j++) {
            if (['unknown', 'spam'].includes(cakeStatus)) {
                cakeBtns[j].className = `s-badge s-badge-${cakeStatus}`;
            } else {
                cakeBtns[j].className = `s-badge s-cake-${cakeStatus}`;
            }
            cakeBtns[j].title = UI_TITLES.cake[cakeStatus] || UI_TITLES.cake.unknown;
        }
    }

    // --- NETWORK ---
    async function getGlobalCsrfToken() {
        const now = Date.now();
        if (csrfTokenCache && (now - csrfTokenCacheTime) < CSRF_CACHE_DURATION) return csrfTokenCache;
        
        let token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (!token) {
            try {
                const res = await fetch('https://www.deviantart.com/', { credentials: 'include', cache: 'no-store' });
                const text = await res.text();
                const match = text.match(/window\.__CSRF_TOKEN__\s*=\s*'([^']+)'/);
                if (match) token = match[1];
            } catch (e) {}
        }
        if (token) {
            csrfTokenCache = token;
            csrfTokenCacheTime = now;
        }
        return token;
    }

    async function sendUnifiedBadge(token, devNameReg, badgeType) {
        const url = 'https://www.deviantart.com/_puppy/dashared/badges/give';
        try {
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ foruser: devNameReg, type: badgeType, csrf_token: token })
            });
            return await response.json();
        } catch (error) {
            return { errorDescription: 'Network error' };
        }
    }

    // --- EXECUTION LOOP ---
    function populateAndStartQueue() {
        if (isProcessingQueue) return;

        const availableLlamas = document.querySelectorAll('span.s-llama-give');
        const availableCakes = document.querySelectorAll('span.s-cake-give');
        
        const uniqueLlamas = new Set();
        const uniqueCakes = new Set();

        for (let i = 0; i < availableLlamas.length; i++) {
            const devName = availableLlamas[i].dataset.devname;
            if (!uniqueLlamas.has(devName)) {
                uniqueLlamas.add(devName);
                requestQueue.push({ 
                    devName: devName, 
                    devNameReg: availableLlamas[i].dataset.devnamereg, 
                    type: 'llama' 
                });
            }
        }
        
        for (let j = 0; j < availableCakes.length; j++) {
            const devName = availableCakes[j].dataset.devname;
            // Prevent queuing if cake was already sent this session
            if (!uniqueCakes.has(devName) && !sessionCakesGiven.has(devName)) {
                uniqueCakes.add(devName);
                requestQueue.push({ 
                    devName: devName, 
                    devNameReg: availableCakes[j].dataset.devnamereg, 
                    type: 'cake' 
                });
            }
        }

        updatePanelStats('reset');
        if (requestQueue.length > 0) processQueue();
    }

    async function processQueue() {
        if (isProcessingQueue) return;
        isProcessingQueue = true;

        for (let i = 0; i < requestQueue.length; i++) {
            updatePanelStats('pending');
            const req = requestQueue[i];
            
            // UI Feedback
            const targetBtns = document.querySelectorAll(`span.s-badge[data-devname="${req.devName}"][data-type="${req.type}"]`);
            targetBtns.forEach(btn => btn.style.opacity = '0.5');

            let token = await getGlobalCsrfToken(); 
            if (!token) break;

            const result = await sendUnifiedBadge(token, req.devNameReg, req.type);

            // Harden error checks for silently rejected requests
            if (result.error || result.status === 'error' || result.errorDescription) {
                const errText = (result.errorDescription || result.error || 'error').toString().toLowerCase();
                const spamKws = ['quickly', 'whoa there', 'spam filter', 'too fast'];
                
                if (spamKws.some(kw => errText.includes(kw))) {
                    updatePanelStats('spam');
                    targetBtns.forEach(btn => btn.className = `s-badge s-badge-spam`);
                    await delay(60000); 
                    i--; // Retry this payload
                    continue; 
                } else if (errText.includes('cannot give badge') || errText.includes('already')) {
                    // Fallback: DA silently rejected because they already have one mid-queue.
                    updatePanelStats('sent');
                    const currentCache = getCachedStatus(req.devName) || { llama: 'give', cake: 'give' };
                    
                    if (req.type === 'llama') currentCache.llama = 'already';
                    if (req.type === 'cake') currentCache.cake = 'enough'; // Set permanently to max limit reached
                    
                    saveCachedStatus(req.devName, currentCache.llama, currentCache.cake);
                    updateWidgetUI(req.devName, currentCache.llama, currentCache.cake);
                } else {
                    updatePanelStats('error');
                    targetBtns.forEach(btn => btn.className = `s-badge s-${req.type}-error`);
                }
            } else {
                updatePanelStats('sent');
                
                const currentCache = getCachedStatus(req.devName) || { llama: 'give', cake: 'give' };
                
                if (req.type === 'llama') {
                    currentCache.llama = 'already'; 
                    // Write to local storage since Llamas are a 1-time limit ever
                    saveCachedStatus(req.devName, currentCache.llama, currentCache.cake);
                } else if (req.type === 'cake') {
                    // Temporarily block cakes for this user for the current page session
                    sessionCakesGiven.add(req.devName);
                    // Do NOT save Cake status to localStorage here. Spoof UI strictly via memory update.
                    currentCache.cake = 'already'; 
                }

                // Sync all widgets visually across the entire page
                updateWidgetUI(req.devName, currentCache.llama, currentCache.cake);
                
                // Ensure opacity is restored from the pending feedback state
                const resetBtns = document.querySelectorAll(`span.s-badge[data-devname="${req.devName}"][data-type="${req.type}"]`);
                resetBtns.forEach(btn => btn.style.opacity = '1');
            }

            requestQueue.shift(); // Remove completed
            i--; // Adjust index since we mutated the array
            await randomDelay(2500, 4000);
        }

        requestQueue = [];
        updatePanelStats('pending');
        isProcessingQueue = false;
    }

    // --- INITIALIZATION ---
    async function initializeBatchStatuses(usernames) {
        let token = await getGlobalCsrfToken();
        for (let i = 0; i < usernames.length; i++) {
            const devName = usernames[i];
            const cachedStatus = getCachedStatus(devName);
            
            if (cachedStatus) {
                updateWidgetUI(devName, cachedStatus.llama, cachedStatus.cake);
            } else {
                if (!token) continue;
                try {
                    const url = `https://www.deviantart.com/_puppy/dauserprofile/give_menu/status?username=${encodeURIComponent(devName)}&csrf_token=${token}`;
                    const res = await fetch(url, { credentials: 'include' });
                    const data = await res.json();
                    
                    const status = {
                        llama: data.canGiveLlama ? 'give' : 'already',
                        cake: data.canGiveCake ? 'give' : 'already'
                    };
                    saveCachedStatus(devName, status.llama, status.cake);
                    
                    // Force UI to reflect session cake status if it somehow fired concurrently
                    let displayCake = status.cake;
                    if (sessionCakesGiven.has(devName) && displayCake === 'give') {
                        displayCake = 'already';
                    }
                    
                    updateWidgetUI(devName, status.llama, displayCake);
                } catch (err) {
                    updateWidgetUI(devName, 'error', 'error');
                }
                await randomDelay(400, 900); 
            }
        }
    }

    function scanAndInjectWidgets() {
        const loggedInUser = document.querySelector('header a[data-username]')?.getAttribute('data-username')?.toLowerCase();
        const userLinks = document.querySelectorAll('a.username, a[data-username]');
        const processedNames = new Set();
        let count = 0;

        for (let i = 0; i < userLinks.length; i++) {
            if (count >= BATCH_LIMIT) break;

            const link = userLinks[i];
            const devNameReg = link.getAttribute('data-username');
            const devName = devNameReg?.toLowerCase();
            
            if (!devName || devName === loggedInUser || processedNames.has(devName) || link.getAttribute('data-super-widget-found')) continue;
            
            processedNames.add(devName);
            link.setAttribute('data-super-widget-found', '1');
            
            const widget = createSuperWidget(devName, devNameReg);
            link.parentNode.insertBefore(widget, link.nextSibling);
            count++;
        }
        
        if (processedNames.size > 0) {
            initializeBatchStatuses(Array.from(processedNames));
        }
    }

    // Boot Up
    injectStyles();
    createFloatingPanel();
    
    // Initial scan, then hook into DOM changes
    setTimeout(scanAndInjectWidgets, 1500);
    const observer = new MutationObserver((mutations) => {
        clearTimeout(window.scanTimeout);
        window.scanTimeout = setTimeout(scanAndInjectWidgets, 500);
    });
    observer.observe(document.body, { childList: true, subtree: true });

})();