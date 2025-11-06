let forRibbon_lastHighScore = 999;
let forRibbon_lastUserScore = -1;
let forRibbon_lastAvgScore = 999;

const selectByPrefix = (prefix, root = document) =>
    root.querySelector(`[class*="${prefix}"]`);

const selectAllByPrefix = (prefix, root = document) =>
    root.querySelectorAll(`[class*="${prefix}"]`);

(function () {
    const TARGET_URL_PART = '/task/list/detail';
    const TARGET_SELECTOR = 'div[ng-class*="styles.middleItem"]';
    let waitRetryCount = 0;

    function waitForTargetAndRun() {
      const found = document.querySelector(TARGET_SELECTOR);
      if (found) {
        try {
          onTargetReady(found);
        } catch (e) {
          // If a separate init handler isn't defined, fall back to existing flow
          try { fun_scratchScore(); } catch (_) {}
        }
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const el = document.querySelector(TARGET_SELECTOR);
        if (el) {
            obs.disconnect();
            if (
              document.querySelector(
                '.ng-scope[class*="fe-components-xb-pagination-__item"][class*="fe-components-xb-pagination-__active"]'
              )?.innerText !== "1"
            ) {
                // Not first page, skip
                return;
            }
            fun_scratchScore();
        }
      });

      // Choose a safe observe target even at document_start
      const observeTarget = document.body || document.documentElement || document;
      const isNode = observeTarget && (typeof Node !== 'undefined') && (observeTarget instanceof Node || typeof observeTarget.nodeType === 'number');

      if (!isNode) {
        if (waitRetryCount < 10) {
          waitRetryCount++;
          setTimeout(waitForTargetAndRun, 100 + waitRetryCount * 100);
        }
        return;
      }

      try {
        observer.observe(observeTarget, {
          childList: true,
          subtree: true,
        });
      } catch (err) {
        // Guard against "parameter 1 is not of type 'Node'" and retry up to 10 times
        if (waitRetryCount < 10) {
          waitRetryCount++;
          setTimeout(waitForTargetAndRun, 100 + waitRetryCount * 100);
        }
      }
    }

    function isTargetPage() {
      return location.href.includes(TARGET_URL_PART);
    }
    window.addEventListener('hashchange', () => {
      if (isTargetPage()) {
        console.log('[Extension] Detected navigation to detail page.');
        waitRetryCount = 0; // reset retries for a new page
        waitForTargetAndRun();
      }
    });

    if (isTargetPage()) {
      waitRetryCount = 0;
      waitForTargetAndRun();
    }

    document.addEventListener('readystatechange', () => {
      if (document.readyState === 'interactive' && isTargetPage()) {
        waitRetryCount = 0;
        waitForTargetAndRun();
      }
    });
  })();
  

async function fun_scratchScore() {
    const parentDiv = selectByPrefix('fe-components-stu-app-task-detail-__middleItem').children[1];
    const scoreDiv = parentDiv.querySelector('[class*="fe-components-stu-app-task-detail-__itemScore"]');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const rect = parentDiv.getBoundingClientRect();

    
    
    canvas.width = rect.width;
    canvas.height = 94;
    canvas.style.cssText = `
        position: absolute; top: 0; left: 0; cursor: grab;
        z-index: 1000; border-radius: 8px;
        animation: maskShimmer 6s ease-in-out infinite;
        /* Let the browser prep for the effects we animate */
        will-change: filter, -webkit-mask, mask, opacity;
    `;
    
    parentDiv.style.position = 'relative';


    if(rect.width < 600){
        return;
    }


    

    document.querySelector('.ng-binding[class*="fe-components-stu-app-task-detail-__itemScore"]').style.opacity = 0;

    let guestMode = await ins_getFromChromeStorage('login_guest');
    let enabledScratch = await ins_getFromChromeStorage('user_preference');
    enabledScratch = guestMode==true?true:(enabledScratch?.scratchScore??null);

    

    if(enabledScratch==false){
        document.querySelector('.ng-binding[class*="fe-components-stu-app-task-detail-__itemScore"]').style.opacity = 1;
        return;
    }
    
    if(guestMode==false){
        let record = await ins_getFromChromeStorage( 'scratched_scores' );
        if(record==null){
            record = [];
        }
        if(record.includes(document.querySelector('.ng-binding[class*="fe-components-stu-app-task-detail-__topTitle"]').innerText)){
            document.querySelector('.ng-binding[class*="fe-components-stu-app-task-detail-__itemScore"]').style.opacity = 1;
            return;
        }
    }
    
    
    parentDiv.appendChild(canvas);

    if((enabledScratch == null || enabledScratch == undefined) && guestMode==false){
        createPopup(9, {
            title: tlang("🎁您发现了新功能：分数刮刮乐","You've found a new feature: Score Scratch-Off"),
            images: ['https://x19.fp.ps.netease.com/file/69062fcd279872cdc101637bZ01Ixqgv06'],
            text:[tlang("刮开分数，趣味满满","Scratch off your scores for a fun experience")],
        });
    }

    document.querySelector('.ng-binding[class*="fe-components-stu-app-task-detail-__itemScore"]').style.opacity = 1;
    
    // Base paint of the mask (kept as-is)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#d4e8f5');
    gradient.addColorStop(0.5, '#e6e0f5');
    gradient.addColorStop(1, '#fff8e1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (!document.getElementById('scratchStyles')) {
        const style = document.createElement('style');
        style.id = 'scratchStyles';
        style.textContent = `
            /* ------------------------------
               FIX #1: keep the mask colorful
               - Lower brightness peaks
               - Increase saturation a touch
               ------------------------------ */
            @keyframes maskShimmer {
                0%, 100% { 
                    filter: brightness(0.98) saturate(1.05) hue-rotate(0deg);
                    opacity: 1;
                }
                33% { 
                    filter: brightness(1.04) saturate(1.25) hue-rotate(90deg);
                    opacity: 1;
                }
                66% { 
                    filter: brightness(1.02) saturate(1.15) hue-rotate(-122deg);
                    opacity: 1;
                }
            }

            /* Use a CSS var to start dissolve from the exact frozen filter */
            @keyframes maskDissolve {
                0% {
                    -webkit-mask: radial-gradient(circle at center, transparent 0%, transparent 0%, black 10%, black 100%);
                    mask: radial-gradient(circle at center, transparent 0%, transparent 0%, black 10%, black 100%);
                    /* ------------------------------
                       FIX #2: no color blink on switch
                       Start from the frozen filter value.
                       ------------------------------ */
                    filter: var(--mask-filter-start, brightness(1));
                }
                40% {
                    -webkit-mask: radial-gradient(circle at center, transparent 40%, transparent 40%, black 52%, black 100%);
                    mask: radial-gradient(circle at center, transparent 40%, transparent 40%, black 52%, black 100%);
                    /* Softer highlights to avoid washing to white */
                    filter: brightness(1.18) saturate(1.25) sepia(0.15) drop-shadow(0 0 18px rgba(255, 245, 150, 0.5));
                }
                70% {
                    -webkit-mask: radial-gradient(circle at center, transparent 80%, transparent 80%, black 95%, black 100%);
                    mask: radial-gradient(circle at center, transparent 80%, transparent 80%, black 95%, black 100%);
                    filter: brightness(1.30) saturate(1.35) sepia(0.20) drop-shadow(0 0 24px rgba(255, 245, 150, 0.6));
                }
                100% {
                    -webkit-mask: radial-gradient(circle at center, transparent 110%, transparent 110%, black 125%, black 100%);
                    mask: radial-gradient(circle at center, transparent 110%, transparent 110%, black 125%, black 100%);
                    filter: brightness(1.35) saturate(1.4) sepia(0.22) drop-shadow(0 0 26px rgba(255, 245, 150, 0.65));
                    opacity: 0;
                }
            }

            .gx-score-pop {
                position: relative;
                will-change: transform, filter;
                animation: gx-pop 2.5s cubic-bezier(.2,.8,.2,1) forwards;
            }
            .gx-score-pop::after {
                content: "";
                position: absolute;
                inset: -20% -120% -20% -120%;
                /* Leave the sheen but don't over-whiten the area */
                background: linear-gradient(120deg, rgba(255, 255, 255, 0) 35%, rgba(255, 255, 255, .75) 50%, rgba(255, 255, 255, 0) 65%);
                filter: blur(3px);
                transform: skewX(-20deg);
                pointer-events: none;
                animation: gx-sweep 1s .1s ease-out forwards;
            }
            @keyframes gx-pop {
                0% { transform: scale(1); text-shadow: 0 0 0 rgba(170, 255, 200, 0); }
                25% { transform: scale(1.55); text-shadow: 0 0 20px rgba(170, 255, 200, .9), 0 0 50px rgba(130, 210, 255, .6); }
                65% { transform: scale(1.55); text-shadow: 0 0 20px rgba(170, 255, 200, .9), 0 0 50px rgba(130, 210, 255, .6); }
                80% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            @keyframes gx-sweep {
                0% { left: -120%; }
                100% { left: 120%; }
            }
        `;
        document.head.appendChild(style);
    }
    
    let isScratching = false;
    let checkCount = 0;
    let centerRevealed = false;

    const scratch = (x, y) => {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    };

    const checkRevealed = () => {
        const scoreRect = scoreDiv.getBoundingClientRect();
        const parentRect = parentDiv.getBoundingClientRect();
        const cx = scoreRect.left - parentRect.left + scoreRect.width / 2;
        const cy = scoreRect.top - parentRect.top + scoreRect.height / 2;
        const r = Math.min(scoreRect.width, scoreRect.height) / 2;
        
        let transparent = 0, total = 0;
        for (let x = cx - r; x < cx + r; x += 3) {
            for (let y = cy - r; y < cy + r; y += 3) {
                if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
                    if (ctx.getImageData(x, y, 1, 1).data[3] < 128) transparent++;
                    total++;
                }
            }
        }
        if (transparent / total > 0.7) {
            centerRevealed = true;
        }
    };

    /* ------------------------------------------
       FIX #2: Freeze current visual filter/animation
       so switching to maskDissolve doesn't "blink".
       ------------------------------------------ */
    const freezeShimmerIfReady = () => {
        if (!centerRevealed) return;
        const cs = getComputedStyle(canvas);
        const currentFilter = cs.filter || 'brightness(1)';
        // Store starting filter for maskDissolve 0% frame
        canvas.style.setProperty('--mask-filter-start', currentFilter);
        // Stop shimmer and keep the exact look frozen
        canvas.style.animation = 'none';
        canvas.style.filter = currentFilter;
    };

    const removeMask = () => {
        if (!centerRevealed) return;
        // Start dissolve from the frzen state; animation overrides inline filter
        canvas.style.animation = 'maskDissolve 0.5s ease-out forwards';
        scoreDiv.classList.add('gx-score-pop');
        if(forRibbon_lastUserScore>=(forRibbon_lastAvgScore+10)||forRibbon_lastUserScore>=97||forRibbon_lastUserScore>=forRibbon_lastHighScore){
            ribbon_Fireworks(2);
        }
        
        saveRemoveRec();
        
        setTimeout(() => {
            canvas.remove();
        }, 500);
    };

    canvas.addEventListener('mousedown', (e) => {
        isScratching = true;
        canvas.style.cursor = 'grabbing';
        scratch(e.offsetX, e.offsetY);
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (!isScratching) return;
        scratch(e.offsetX, e.offsetY);
        if (++checkCount % 5 === 0) checkRevealed();
    });
    
    canvas.addEventListener('mouseup', () => {
        isScratching = false;
        canvas.style.cursor = 'grab';
        // Re-evaluate center reveal on mouse-up and freeze if ready
        checkRevealed();
        freezeShimmerIfReady();   // <-- prevents the one-frame color blink
        setTimeout(removeMask, 400);
    });
    
    canvas.addEventListener('mouseleave', () => {
        isScratching = false;
        canvas.style.cursor = 'grab';
        // If the user drags out after revealing, also freeze to avoid glitches
        checkRevealed();
        freezeShimmerIfReady();
    });

    async function saveRemoveRec(){
        if(guestMode==true) return;
        ins_getFromChromeStorage( 'scratched_scores' ).then((record)=>{
            if(record==undefined||record==null){
                record = [];
            }
            record.push(document.querySelector('.ng-binding[class*="fe-components-stu-app-task-detail-__topTitle"]').innerText);
            ins_saveToChromeStorage( 'scratched_scores', record ).then(()=>{
                console.log("Saved");
            });
        });
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message.type) return;
    switch (message.type) {
        case "append2Scores":
            forRibbon_lastAvgScore = (message.data.avgS/message.data.totalS)*100;
            forRibbon_lastHighScore = (message.data.maxS/message.data.totalS)*100;
            forRibbon_lastUserScore = (message.data.usrS/message.data.totalS)*100;
            break;
        case "bp-coverHP-way2":
            fun_scratch_Homepage();
            break;
    }
});
function ribbon_Fireworks(duration_Seconds){
    var duration = duration_Seconds * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 18, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
    }

    var interval = setInterval(function() {
    var timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
        return clearInterval(interval);
    }

    var particleCount = 220 * (timeLeft / duration);
    // since particles fall down, start a bit higher than random
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
}

async function fun_scratch_Homepage(){
    let guestMode = await ins_getFromChromeStorage('login_guest');
    let pref = await ins_getFromChromeStorage('user_preference');
    if(pref==null||pref==undefined){
        pref = {scratchScore:true};
    }
    enabledScratch = guestMode==true?true:(pref.scratchScore);
    let record = await ins_getFromChromeStorage( 'scratched_scores' );
    let initmode = 0;
    console.log("Scratch:",enabledScratch);
    if(enabledScratch==false){
        ins_saveToChromeStorage( 'scratched_scores' , null );//reset
        return;
    }
    if(record==undefined||record==null && guestMode==false){
        initmode = 1
        record = [];
    }
    try {
        if(document.querySelector('.ng-scope[class*="fe-components-xb-pagination-__item"][class*="fe-components-xb-pagination-__active"]').innerText!="1"){
            // Not first page, skip
            return;
        }
    } catch (e) {
        return;
    }
    
    console.log("Scratch Record:",record);
    let targetParent = document.querySelectorAll('.ng-scope[class*="fe-components-stu-app-task-list-__listItem"]');
    console.log("Found",targetParent.length,"items to scratch.");
    for(let i=0;i<targetParent.length;i++){
        perItem(i,initmode,guestMode);
    }

    if(initmode==1&&guestMode==false){ 
        // Use local storage helper defined in this file to avoid early-load dependency
        ins_saveToChromeStorage( 'scratched_scores' , record );
    }


    function perItem(index,initmode,guestMode){ 

        let obj = document.querySelectorAll('.ng-scope[class*="fe-components-stu-app-task-list-__listItem"]')[index];
        if(obj==undefined) return -1;
        let taskName = obj.querySelector('p[ng-class="styles.title"]').innerText.trim();
        let subjectName = obj.querySelector('p[ng-class="styles.subject"]').innerText.split("|")[0].trim();
        if(initmode==1 && guestMode==false){
            let scorePanel = obj.querySelector('div[ng-class="styles.model"]');
            if(scorePanel==null||scorePanel==undefined){
                return -1;
            }else{
                record.push(taskName+" | "+subjectName);
                return -1;
            }
        }else{
            if(record.includes(taskName+" | "+subjectName) && guestMode==false){
                // Already scratched, skip
            }else{
                console.log("Scratching:",taskName+" | "+subjectName);
                
                let scorePanel = obj.querySelector('div[ng-class="styles.model"]');
                if(scorePanel==null||scorePanel==undefined){
                    return -1;
                }else{
                    scorePanel.children[0].innerHTML = '<img src="' + chrome.runtime.getURL("res/newScore.png") + '" alt="NewScore" style="width: 70%;padding-top:20px;" />';
                }
            }
        }
    }

}

async function ins_saveToChromeStorage(keyName, obj) {
    try {
        const data = {};
        data[keyName] = obj; 
        await chrome.storage.local.set(data); 
        console.log("已存入 " + keyName + " 的数据!");
    } catch (error) {
        console.error('Error saving to chrome.storage:', error);
        M_send_comp_msg("calcErrorStop", null, 0);

        M_send_comp_msg("tip_err", error, 0);
        //err
    }
}
async function ins_getFromChromeStorage(keyName) {
    try {
        const result = await chrome.storage.local.get(keyName); 
        if (result[keyName] !== undefined) {
            return result[keyName];
        } else {
            console.warn('Key not found in chrome.storage:', keyName);
            return null;
        }
    } catch (error) {
        console.error('Error reading from chrome.storage or parsing:', error);
        M_send_str_msg("calcErrorStop", "1", 0);
        M_send_str_msg("tip_err", error, 0);
        //err
        return null;
    }
}

// Fast observer for task list items on tsinglanstudent.schoolis.cn
// Calls fun_scratch_Homepage() as soon as items appear to mask scores quickly
(function setupHomepageItemObserver(){
    try {
        if (location.hostname !== 'tsinglanstudent.schoolis.cn') return;

        // Covers both old and new list item class prefixes (hashed suffix varies)
        const ITEM_SELECTOR = [
            'div[class*="fe-components-stu-business-task-list-item-__item--"]',
            'div[class*="fe-components-stu-app-task-list-item-__item--"]'
        ].join(',');

        let scheduled = false;
        const scheduleScratch = () => {
            if (scheduled) return;
            scheduled = true;
            // Next frame for minimal latency while avoiding floods
            requestAnimationFrame(() => {
                try {
                    if (typeof fun_scratch_Homepage === 'function') {
                        fun_scratch_Homepage();
                        hideAssignments()
                    }
                } catch (e) { /* noop */ }
                scheduled = false;
            });
        };

        const root = document.documentElement || document.body;
        if (!root) return;

        // Immediate check on install
        if (document.querySelector(ITEM_SELECTOR)) {
            scheduleScratch();
        }

        const mo = new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const n of m.addedNodes) {
                    if (!(n instanceof Element)) continue;
                    if (n.matches && n.matches(ITEM_SELECTOR)) {
                        scheduleScratch();
                        return;
                    }
                    if (n.querySelector && n.querySelector(ITEM_SELECTOR)) {
                        scheduleScratch();
                        return;
                    }
                }
            }
        });
        mo.observe(root, { childList: true, subtree: true });
    } catch (_) { /* noop */ }
})();
