let version = "1.3.10";
function runWhenElementReady(selector, callback, interval, maxAttempts) {
    let attempts = 0;

    function check() {
        if (document.querySelector(selector)) {
            callback();
        } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(check, interval);
        }
    }

    check();
}



// 使用示例：每隔 500ms 检查一次目标元素，最多检查 10 次
runWhenElementReady('link', diyHomepage, 10, 5);
runWhenElementReady('link', diyHomepage, 100, 3);
try {
    const selectByPrefix = (prefix, root = document) =>
        root.querySelector(`[class*="${prefix}"]`);

    const selectAllByPrefix = (prefix, root = document) =>
        root.querySelectorAll(`[class*="${prefix}"]`);
} catch (e) {}

const byClassPrefix = (prefix) => `[class*="${prefix}"]`;

const normalizeSelector = (selector) =>
    typeof selector === 'string'
        ? selector.replace(/\.([A-Za-z0-9_-]+)--[A-Za-z0-9_-]{6,}/g, (_match, prefix) => byClassPrefix(prefix))
        : selector;

const querySelectorStable = (selector, root = document) =>
    root.querySelector(normalizeSelector(selector));

const querySelectorAllStable = (selector, root = document) =>
    root.querySelectorAll(normalizeSelector(selector));

const queryAllByClassNames = (classNames, root = document) => {
    if (typeof classNames !== 'string') {
        return [];
    }

    const classes = classNames.trim().split(/\s+/).filter(Boolean);
    if (!classes.length) {
        return [];
    }

    const selector = classes
        .map((cls) => {
            const [base, hash = ''] = cls.split('--');
            if (hash.length >= 6) {
                return byClassPrefix(base);
            }
            return `.${cls}`;
        })
        .join('');

    return root.querySelectorAll(selector);
};

const queryByClassNames = (classNames, root = document) =>
    queryAllByClassNames(classNames, root)[0] || null;

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?$/;

function isISODateString(value) {
    return typeof value === 'string' && ISO_DATE_REGEX.test(value.trim());
}

function parseCSharpDateString(value) {
    const match = /^\/Date\((\d+)([+-]\d{4})?\)\/$/.exec(value);
    if (!match) {
        return null;
    }
    const timestamp = parseInt(match[1], 10);
    if (Number.isNaN(timestamp)) {
        return null;
    }
    return new Date(timestamp);
}
function findHashedClass(prefix, root = document) {
  // 拆分输入字符串，支持多个 class（例如 ng-binding + fe-xxx）
  const parts = prefix.trim().split(/\s+/);
  const lastPart = parts[parts.length - 1];

  // 构建正则，匹配 “prefix--哈希” 的模式
  const hashRegex = new RegExp(`^${lastPart}--[A-Za-z0-9_-]{6,}$`);

  // 遍历所有 DOM 节点，查找符合条件的 class
  const all = root.querySelectorAll('[class]');
  for (const el of all) {
    for (const cls of el.classList) {
      if (hashRegex.test(cls)) {
        // 若还有其它类（如 ng-binding）要求同时存在，也检查
        const allMatch = parts
          .slice(0, -1)
          .every((p) => el.classList.contains(p));
        if (allMatch) return cls;
      }
    }
  }
  return null;
}

function ensureSchoolisDate(value) {
    if (!value) {
        return null;
    }
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }
    if (typeof value === 'number') {
        const dateFromNumber = new Date(value);
        return Number.isNaN(dateFromNumber.getTime()) ? null : dateFromNumber;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        const csharpDate = parseCSharpDateString(trimmed);
        if (csharpDate) {
            return csharpDate;
        }
        if (isISODateString(trimmed)) {
            const isoDate = new Date(trimmed);
            return Number.isNaN(isoDate.getTime()) ? null : isoDate;
        }
        const directDate = new Date(trimmed);
        if (!Number.isNaN(directDate.getTime())) {
            return directDate;
        }
        const normalized = trimmed.replace(/-/g, '/');
        const fallbackDate = new Date(normalized);
        return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate;
    }
    return null;
}

function compareSchoolisDates(a, b) {
    const dateA = ensureSchoolisDate(a);
    const dateB = ensureSchoolisDate(b);
    if (!dateA && !dateB) {
        return 0;
    }
    if (!dateA) {
        return 1;
    }
    if (!dateB) {
        return -1;
    }
    return dateA.getTime() - dateB.getTime();
}

if(selectByPrefix===undefined){
    const selectByPrefix = (prefix, root = document) =>
        root.querySelector(`[class*="${prefix}"]`);

    const selectAllByPrefix = (prefix, root = document) =>
        root.querySelectorAll(`[class*="${prefix}"]`);
}
// 顶栏模块按钮（我的测评 / 我的任务 / … / 动态成绩）的数量与顺序会随校宝版本变化，
// 所以一律按集合处理，绝不依赖 childNodes[n] 或 querySelector 的第一个匹配。
function gcGetTopbarModuleBox() {
    return document.querySelector('[class*="fe-components-stu-business-topbar-__profileItemBox--"]');
}

function gcGetTopbarModuleItems() {
    const box = gcGetTopbarModuleBox();
    if (!box) return [];
    return Array.from(box.querySelectorAll('[class*="fe-components-stu-business-topbar-__profileItem--"]'));
}

// 按文案（中/英）定位顶栏模块按钮，而不是按下标：校宝调整顺序后依然指向同一个模块
const GC_TOPBAR_MODULE_LABELS = {
    dynamicScore: ['动态成绩', 'dynamic score', 'realtime score'],
    task: ['我的任务', 'my task', 'my assignment']
};

function gcFindTopbarModuleItem(kind) {
    const labels = GC_TOPBAR_MODULE_LABELS[kind] || [];
    if (!labels.length) return null;
    const items = gcGetTopbarModuleItems();
    for (const item of items) {
        // innerText 在元素被隐藏时会返回空串，所以回退到 textContent
        const text = (item.innerText || item.textContent || '').trim().toLowerCase();
        if (!text) continue;
        if (labels.some(label => text.includes(label.toLowerCase()))) return item;
    }
    return null;
}

function waitForElement() {
    if (gcGetTopbarModuleItems().length > 0) {
        setTimeout(function() {
            updateContent();
            fun_decorateRealtimeList();
            modifyPageFooter();
            showTeamsMainPannelBtn();
            hideAseRepeatedly(null,100,1500)
        }, 30);
        setTimeout(function() {
            updateContent();
            fun_decorateRealtimeList();
            showTeamsMainPannelBtn();
            modifyPageFooter();
            hideAseRepeatedly(null,100,1500);
            addBtnBindings();
        }, 100);
    } else {
        // If the element is not found yet, try again after a short delay
        setTimeout(waitForElement, 100); // Check every 200 milliseconds
    }
}

function addBtnBindings(){
    const box = gcGetTopbarModuleBox();
    if (!box || box._gcModuleNavBound) return;
    box._gcModuleNavBound = true;
    // 用事件委托监听整个顶栏模块区：任何模块按钮被点击后 Angular 都会重建视图，
    // 这里负责让 Teams 按钮重新挂载，并让动态成绩页的观察器重新生效。
    box.addEventListener('click', function(event) {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        if (!target.closest('[class*="fe-components-stu-business-topbar-__profileItem--"]')) return;
        // 先尝试把任务列表挂回去：若顶栏点的是当前模块，Angular 不会重渲染，
        // 恢复后页面才不会停在 Teams 面板上；若会重渲染，这次恢复也无副作用。
        gcRestoreTaskListView('topbar-nav');
        fun_decorateRealtimeList();
        setTimeout(showTeamsMainPannelBtn, 300);
        setTimeout(showTeamsMainPannelBtn, 900);
    });
}

setInterval(function() {
    if (!document.querySelector('.ng-binding[class*="fe-components-stu-business-login-enter-box-__forgetLink"]')) {
      send_comp_msg("bp-checkOutdatedScore", "1", 0);
    }
  }, 300000);




// 共享同一个已观察集合，避免重复调用时在同一节点上叠加多个 MutationObserver
const gcDynamicScoreObserved = new Set();
const gcObserveTargetState = new WeakMap();
let gcDecorateRealtimeGen = 0;
let gcSemesterSwitchDocBound = false;
let gcRealtimeListClickBound = false;
let gcLastRealtimeSubjectId = null;
let gcSuppressRealtimeObserveUntil = 0;

function fun_suppressRealtimeObserve(ms) {
    gcSuppressRealtimeObserveUntil = Math.max(gcSuppressRealtimeObserveUntil, Date.now() + ms);
}

function fun_isRealtimeListPage() {
    return window.location.href.includes("https://tsinglanstudent.schoolis.cn/Home#!/realtime/list");
}

function gcGetObserveState(observedClasses) {
    let state = gcObserveTargetState.get(observedClasses);
    if (!state) {
        state = new Map();
        gcObserveTargetState.set(observedClasses, state);
    }
    return state;
}

function gcDisconnectDynamicScoreObservers() {
    const state = gcObserveTargetState.get(gcDynamicScoreObserved);
    if (state) {
        state.forEach((entry) => {
            if (entry && entry.debounceTimer) {
                clearTimeout(entry.debounceTimer);
            }
            if (entry && entry.observer) {
                try { entry.observer.disconnect(); } catch (e) {}
            }
        });
        state.clear();
    }
    gcDynamicScoreObserved.clear();
}

function fun_decorateRealtimeList() {
    if (!fun_isRealtimeListPage()) {
        return;
    }
    const gen = ++gcDecorateRealtimeGen;
    [0, 80, 200, 500, 1000].forEach((delay) => {
        setTimeout(() => {
            if (gen !== gcDecorateRealtimeGen) return;
            if (!fun_isRealtimeListPage()) return;
            updateContent();
        }, delay);
    });
    gcDisconnectDynamicScoreObservers();
    startobserveDynamicScoreTarget();
    fun_bindRealtimeSemesterSwitch(0);
    fun_bindRealtimeListItemClick();
}

function fun_bindRealtimeSemesterSwitch(redotimes) {
    if (!fun_isRealtimeListPage()) return;
    const input = queryAllByClassNames("fe-components-xb-pull-btn-__input--3TWoIfVMNo-eszvg3cnXCa")[0];
    if (!input) {
        if ((redotimes || 0) < 8) {
            setTimeout(() => fun_bindRealtimeSemesterSwitch((redotimes || 0) + 1), 150);
        }
        return;
    }
    if (!input._gcSemesterBound) {
        input._gcSemesterBound = true;
        let lastValue = input.value;
        const onChange = () => {
            if (input.value === lastValue) return;
            lastValue = input.value;
            fun_decorateRealtimeList();
        };
        input.addEventListener("change", onChange);
        input.addEventListener("input", onChange);
        const obs = new MutationObserver(onChange);
        obs.observe(input, { attributes: true, childList: true, characterData: true, subtree: true });
    }
    if (!gcSemesterSwitchDocBound) {
        gcSemesterSwitchDocBound = true;
        document.addEventListener("click", function (e) {
            if (!fun_isRealtimeListPage()) return;
            const t = e.target instanceof Element ? e.target : null;
            if (!t) return;
            if (t.closest('[class*="fe-components-xb-pull-btn-__t_overflow"]')) {
                setTimeout(fun_decorateRealtimeList, 80);
            }
        }, true);
    }
}

function fun_extractRealtimeSubjectId(root) {
    if (!root) return null;
    const gradeNode = querySelectorStable('.fe-components-stu-app-realtime-list-__grade--2wJch67b4uOYNPgwNpRCm8', root)
        || root.querySelector('[class*="fe-components-stu-app-realtime-list-__grade--"]');
    if (!gradeNode) return null;
    const match = (gradeNode.textContent || "").match(/#(\d+)/);
    return match ? match[1] : null;
}

function fun_bindRealtimeListItemClick() {
    if (gcRealtimeListClickBound) return;
    gcRealtimeListClickBound = true;
    document.addEventListener("click", function (e) {
        if (!fun_isRealtimeListPage()) return;
        const t = e.target instanceof Element ? e.target : null;
        if (!t) return;
        const item = t.closest('[class*="fe-components-stu-app-realtime-list-__listItem"]');
        if (!item) return;
        const subjectId = fun_extractRealtimeSubjectId(item);
        if (subjectId) gcLastRealtimeSubjectId = subjectId;
        const kick = () => fun_ensureRealtimeDetailDecorated(subjectId || gcLastRealtimeSubjectId);
        setTimeout(kick, 80);
        setTimeout(kick, 250);
        setTimeout(kick, 600);
    }, true);
}

function startobserveDynamicScoreTarget(){
    observeTarget(
        'fe-components-stu-app-realtime-list-__listItemBox',
        updateContent,
        0,
        gcDynamicScoreObserved
    );
    observeTarget(`.ng-scope${byClassPrefix('fe-components-stu-app-realtime-list-__item')}${byClassPrefix('fe-components-stu-app-realtime-list-__listItem')}`,
        updateContent,
        0,
        gcDynamicScoreObserved
    );

}
function startobserveScoreHides(){
    chrome.storage.local.get('user_preference', function(settings) {
        console.log(settings);
        if(settings.user_preference.autoHide){
            observeTarget(
                'fe-components-stu-app-task-list-__listItemBox',
                hideAssignments
            );
        }
    });
    
}



function resolveSelector(target) {
    if (typeof target !== 'string') {
        return null;
    }

    if (target.startsWith('.') || target.startsWith('#') || target.includes('[') || target.includes(' ')) {
        return target;
    }

    return byClassPrefix(target);
}

function observeTarget(targetClass, callback, redotimes = 0, observedClasses = new Set()) {
    const selector = resolveSelector(targetClass);
    if (!selector) {
        return;
    }

    const state = gcGetObserveState(observedClasses);
    if (observedClasses.has(selector)) {
        const existing = state.get(selector);
        if (existing && existing.node && existing.node.isConnected) {
            return;
        }
        if (existing) {
            if (existing.debounceTimer) clearTimeout(existing.debounceTimer);
            if (existing.observer) {
                try { existing.observer.disconnect(); } catch (e) {}
            }
            state.delete(selector);
        }
        observedClasses.delete(selector);
    }

    const targetNode = querySelectorStable(selector);

    if (targetNode) {
        const entry = { node: targetNode, observer: null, debounceTimer: null };
        const observer = new MutationObserver(() => {
            if (Date.now() < gcSuppressRealtimeObserveUntil) {
                return;
            }
            if (entry.debounceTimer) clearTimeout(entry.debounceTimer);
            entry.debounceTimer = setTimeout(() => {
                entry.debounceTimer = null;
                if (Date.now() < gcSuppressRealtimeObserveUntil) {
                    return;
                }
                callback();
            }, 50);
        });

        observer.observe(targetNode, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        entry.observer = observer;
        state.set(selector, entry);
        observedClasses.add(selector);
        callback();
    } else {
        if (redotimes < 5) {
            const retryDelay = Math.min(5000, 2 ** redotimes * 130 + 50);

            setTimeout(() => {
                observeTarget(targetClass, callback, redotimes + 1, observedClasses);
            }, retryDelay);
        }
    }
}

if(window.location.href.includes("https://tsinglanstudent.schoolis.cn")){
    waitForElement(); // Start polling immediately
    setTimeout(function() {
        if(!document.querySelector('.ng-binding[class*="fe-components-stu-business-login-enter-box-__forgetLink"]')){
            send_comp_msg("bp-checkOutdatedScore","1",0);
        }
    }, 100);
    if(fun_isRealtimeListPage()){
        fun_decorateRealtimeList();
    }
}

observeUrlChange({
    "https://tsinglanstudent.schoolis.cn/Home#!/realtime/list": fun_decorateRealtimeList,
    "https://tsinglanstudent.schoolis.cn/Home#!/task/list":showTeamsMainPannelBtn
});
observeUrlChange({
    "https://tsinglanstudent.schoolis.cn/Home#!/task/list": startobserveScoreHides
});

console.log("Giaoculator is Running");

// ================== 悬浮窗 ===================
// 这个是添加悬浮窗代码的入口，负责给网页添加悬浮窗的HTML和CSS代码。
// 如果不需要只需要在这里不添加即可，但是可能下面的dom操作会报错（就是document.xxx的那些）
POP_addPopComponent(); 

// totalUpdate是很重要的，他负责了进度条的总更新次数
// 比如有4个学期，这里就填写4。每一次使用进度条的地方都需要设置这个值和清零currentUpdate
let currentUpdate = 0;

// 监测当前注入是否收到了信息
let revieveMessage = false;

let longtermMessage = '';

// 如果登录后3秒内没有收到消息，就会自动展示长期消息
// setTimeout(() => {
//     setInterval(() => {
//         if (!revieveMessage)
//             processLongtermMsg();
//     }, 1000);
// }, 3000);

// TODO: 长期设置代码

// 设置SVG圆环的初始状态

if(document.querySelector('.progress-ring__circle')!=null){
    globalThis.circle = document.querySelector('.progress-ring__circle');
    globalThis.radius = circle.r.baseVal.value;
    globalThis.circumference = 2 * Math.PI * radius;
    globalThis.maxOffset = circumference;
    console.log(maxOffset);

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = maxOffset;
}

// 更新进度的函数，每次调用会+1，可以写到后端发消息的地方或者啥的。
function upgradeProgress() {    
    if (currentUpdate < 3) {
        currentUpdate++;

        let newOffset = maxOffset - (currentUpdate / 3) * circumference;

        circle.style.transition = 'stroke-dashoffset 0.5s ease-out';

        circle.style.strokeDashoffset = newOffset;
    }
}



// 重置环，比如在计算完成后调用这个函数
function resetRing_Old(){
    currentUpdate = 0;
    circle.style.transition = 'stroke-dashoffset 0.5s ease-out';
    circle.style.strokeDashoffset = maxOffset;
}


function RingShowCalcError(){
    var logo = document.getElementById('xfc-logo');
    var circle = document.querySelector('.progress-ring__circle');

    // 修改图标图片并添加渐变动画
    circle.style.transition = 'stroke 1s ease-out,stroke-dashoffset 0.5s ease-out, stroke-width 0.5s ease-out';
    circle.style.stroke = '#da0000';
    circle.style.strokeDashoffset = 0;
    setTimeout(() => {
        circle.style.transition = 'stroke-dashoffset 0.5s ease-out, stroke-width 0.5s ease-out';
        circle.style.strokeWidth = '0'; // 使圆环向外圈变细并消失
        setTimeout(() => {
            circle.style.stroke="rgb(86,194,90)";
            circle.style.stroke.width=6;
        }, 510);
    }, 10000);

}

var logo = document.getElementById('xfc-logo');

var iconSrc = chrome.runtime.getURL("icon.png");
var settingsSrc = chrome.runtime.getURL("res/ball_settings.png");
logo.src = iconSrc;
logo.style.transition = "opacity 0.1s ease-in-out";

logo.addEventListener('mouseenter', function () {
    logo.style.transition = "opacity 0.1s ease-in-out";
    logo.style.opacity = 0; // 开始淡出
    setTimeout(() => {
        logo.src = settingsSrc; // 更换图片
        logo.style.opacity = 1; // 渐入
    }, 100); // 等待过渡结束后切换
});

// 添加鼠标移出事件监听
logo.addEventListener('mouseleave', function () {
    logo.style.transition = "opacity 0.1s ease-in-out"; 
    logo.style.opacity = 0; // 开始淡出
    setTimeout(() => {
        logo.src = iconSrc; // 更换图片
        logo.style.opacity = 1; // 渐入
    }, 100); // 等待过渡结束后切换
});

function resetRing(isFinal) {
    // 获取旧的图标元素和环形进度条
    var logo = document.getElementById('xfc-logo');
    var circle = document.querySelector('.progress-ring__circle');

    // 动画速度控制（基础速度单位为秒）
    const baseSpeed = 0.3; // 动画基础时间
    const timeFactor = baseSpeed * 1000; // 转换为毫秒

    // 修改图标图片并添加渐变动画
    logo.style.opacity = '0';
    setTimeout(() => {
        logo.src = chrome.runtime.getURL("res/green-tick.png");
        logo.style.opacity = '1';
        setTimeout(() => {
            logo.style.transition = `opacity ${baseSpeed}s ease-in`;
            logo.style.opacity = '0';
        }, timeFactor * 3); // 动态延迟控制
    }, timeFactor); // 等待旧图标淡出后再显示新图标

    setTimeout(() => {
        logo.src = chrome.runtime.getURL("icon.png");
        logo.style.opacity = '1';
        setTimeout(() => {
            logo.style.transition = '';
        }, timeFactor); // 动态时间控制
    }, timeFactor * 5); // 动态延迟控制

    // 环形进度条动画调整
    circle.style.transition = `stroke-dashoffset ${baseSpeed}s ease-out, stroke-width ${baseSpeed}s ease-out`;
    circle.style.strokeWidth = '0'; // 使圆环向外圈变细并消失

    setTimeout(() => {
        currentUpdate = 0;
        circle.style.strokeDashoffset = circle.getAttribute('r') * Math.PI * 2;
        setTimeout(() => {
            circle.style.strokeWidth = '6'; // 将strokeWidth重置为原始宽度
            if(isFinal){
                document.getElementById("progress-text").style.transition = `opacity ${baseSpeed * 3}s ease-in`;
                document.getElementById("progress-text").style.opacity='0';
            }
        }, timeFactor); // 动态时间控制
    }, timeFactor); // 动态时间控制
}



const floatingBall = document.querySelector('.floating-ball');
const infoBox = document.querySelector('.info-box');
const closeBtn = document.querySelector('.close-btn');
const infoContent = document.querySelector('.info-content');

// let unreadMessageCount = 0;
let isInfoBoxOpen = false;
let processingBox = false;

let messageList = [];
let messageReadState = [];

// 信息框里的东西，支持html代码，每次要展示的时候首先更新这个变量
// 当然建议用下方的封装函数实现显示消息红点的效果
let htmlContent = '<p>No message avaliable.</p>';

// 展示信息框，一般不手动调用
function showInfoBox() {
    processingBox = true
    infoContent.innerHTML = htmlContent;
    infoBox.style.display = 'block';
    setTimeout(() => { infoBox.style.opacity = 1; }, 10); 
    isInfoBoxOpen = true;
    processingBox = false;
}


// 隐藏信息框，一般不手动调用
function hideInfoBox() {
    console.log("我被关闭了！")
    console.trace()
    processingBox = true
    infoBox.style.opacity = 0;
    setTimeout(() => { infoBox.style.display = 'none'; }, 300);
    isInfoBoxOpen = false;
    processingBox = false;
    // setTimeout(() => { processLongtermMsg(); }, 1000);
}

function processLongtermMsg(){
    if(longtermMessage){
        sendFloatingMessage(longtermMessage, 'dot');
        longtermMessage = '';
        revieveMessage = true;
    }
}

if(closeBtn!=null){
    // 点击叉叉关闭信息框
    closeBtn.addEventListener('click', () => {
        hideInfoBox();
    });
}


function hideFloatingBall(){

    try {
        document.getElementsByClassName("floating-ball")[0].remove();
        document.getElementById("progress-text").remove();
        document.getElementById("progress-text-shadow").remove();
    } catch (e) {
        setTimeout(() => {
            document.getElementsByClassName("floating-ball")[0].remove();
            document.getElementById("progress-text").remove();
            document.getElementById("progress-text-shadow").remove();
        }, 100);
    }
}
// 点击悬浮窗展示信息框
if(floatingBall != null){
    floatingBall.addEventListener('click', () => {
        setTimeout(() => {
            send_comp_msg("bp-openSettings","1",0);
        }, 300);/*
        document.getElementsByClassName("floating-ball")[0].style.transition='opacity 0.2s ease-out';
        document.getElementsByClassName("floating-ball")[0].style.opacity=0;
        document.getElementById("progress-text").style.transition = 'opacity 0.2s ease-out';
        document.getElementById("progress-text").style.opacity = '0';
        document.getElementById("progress-text-shadow").style.transition = 'opacity 0.2s ease-out';
        document.getElementById("progress-text-shadow").style.opacity = '0';
        setTimeout(() => {
            document.getElementById("progress-text").remove();
            document.getElementsByClassName("floating-ball")[0].remove();
            document.getElementById("progress-text-shadow").remove();
            
            return;
        }, 210);*/
        
    
        return;//先暂时关闭信息框功能，改为隐藏悬浮球
        if (processingBox) return;
        if (isInfoBoxOpen) {
            hideInfoBox();
        } else {
            showInfoBox();
            hideDot();
    
        }
    });
}


// 展示红点
function showDot(){
    document.querySelector('.alert-dot').style.display = 'block';
    // 设置opacity
    setTimeout(() => { document.querySelector('.alert-dot').style.opacity = 1; }, 10);
}

// 隐藏红点
function hideDot(){
    document.querySelector('.alert-dot').style.display = 'none';
    // 设置opacity
    document.querySelector('.alert-dot').style.opacity = 0;
}

// 展示像微信那样未读消息数字，但是目前还没想好怎么调用
function showNumber(number){
    document.querySelector('.number-span').innerText = number;
    document.querySelector('.alert-number').style.display = 'block';
    // 设置opacity
    setTimeout(() => { document.querySelector('.alert-number').style.opacity = 1; }, 10);
}

function hideNumber(){
    document.querySelector('.alert-number').style.display = 'none';
    // 设置opacity
    document.querySelector('.alert-number').style.opacity = 0;
}

// 发送悬浮窗消息，这个是让外部调用的接口
// 第一个message参数是要展示的消息，第二个type是展示的类型，目前支持dot和force两种
// dot就是显示一个红点，提示用户要打开，force就是直接弹出窗口
// 注意调用这个函数的时候，先前打开的窗口会被关闭
function sendFloatingMessage(message, type){
    console.log("发送了信息！",message,type)
    hideInfoBox()
    setTimeout(() => {
        if(type=="dot"){
            showDot();
            htmlContent = message;
        }
        else if (type=="force"){
            htmlContent = message;
            showInfoBox();
        }
    }, 500);

}   

// =============================== 悬浮窗代码结束
if (window.location.hostname.endsWith("schoolis.cn") && window.location.pathname !== "/" && queryAllByClassNames("ng-binding fe-components-stu-business-login-enter-box-__forgetLink--33qRdR5UpfjVrt3C_MdyYR").length > 0) {
    window.location.href = window.location.protocol + "//" + window.location.hostname;
  }

SHOW_REFRESH = false;
var tmp_stopHide = false;
var clicked_disclamer = false;

if(window.location.href==="http://4.3.2.1/homepage/login.html"){
    window.location.href="http://4.3.2.1";
}else if(window.location.href.includes("view.officeapps.live.com")){
    directDownloadFile_AddBtn();
}



chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    chrome.storage.local.get('enable_state', function(result) {
        let type = message.type;
        let data = message.data;
        console.log("RC", type, data);
        if (result.enable_state === true || !result.hasOwnProperty('enable_state') || type.startsWith("bp")) { // 如果enable_state为true或未设置，则继续。
            var disable_autologin = false;
            if (type == "load") {
                console.log("Rec_Do_Load");
                if (data.show == true){
                    const targetElement = document.querySelector('[class*="stu-common-stu-loading"]');
                    if (targetElement) {
                        targetElement.style.display = "table";
                    }
                } else {
                    const targetElement = document.querySelector('[class*="stu-common-stu-loading"]');
                    if (targetElement) {
                        targetElement.style.display = "none";
                    }
                }
            } else if (type =="MS_RefreshSyncPanels"){
                updateSyncPanels(data.cont);
            
            } else if (type == "bp-refresh"){
                location.reload();
            }else if (type == "bp-firstInstall"){
                //do nothing for now
            } else if (type == "bp-observeDynamicScore"){
                fun_decorateRealtimeList();
            } else if (type == "MSPanel_showSyncing"){
                MSShowSyncing(data.cont);
            } else if (type == "bp-fun-addMask"){
                fun_scratchScore();
            } else if (type == "bp-logpageState"){
                //换位置
            }else if (type == "bp-verNum"){
                version = data.cont;
            
            } else if (type == "bp-loggedin-frameEdit"){
                insertCountdownBanner();
                hideAssignments()
            }else if (type == "bp-loggedin"){
                console.log("loggedin")
                startobserveScoreHides();
                hideAssignments()
                recordLoginUser();
                
            }else if (type == "calcErrorStop"){
                RingShowCalcError();
            }else if (type == "bp-showRefresh"){
                showHideButtonAtHome();//NEW
                // MB_insertEditedDiv()
            } else if (type == "bp-refresh-click"){
                simulateClickRefresh(0);
            } else if (type == "replace_context"){
                fun_decorateRealtimeList();
            } else if (type == "sim_login"){
                if(disable_autologin == false){
                    simulateClickLogin();
                    setTimeout(() => {
                        simulateClickLogin();
                    }, 1000);
                    sendSeccesstip("自动登录成功");
                    disable_autologin = true;
                }
            } else if (type == "tip_suc"){
                sendSeccesstip(data.cont);
            } else if (type == "appendHiddenScore"){
                handleHiddenScoreMessage(data.cont);
            } else if (type == "show_process"){
                addCalcState(data,0);
                console.log("REC:Showproges")
                // MB_insertEditedDiv();
            } else if (type == "show_smsCalc_progress"){
                upgradeProgress();
                //addSmsCalcState(data);
            }else if (type == "tip_congrat"){
                sendCongrat(data.cont);
            } else if (type == "tip_err"){
                sendErrortip(data.cont);
            } else if (type == "tip_info"){ // 合并tip_info和tip_info_long的处理
                sendInfotip(data.cont);
            } else if (type == "tip_info_long"){ // 合并tip_info和tip_info_long的处理
                console.log("REC:Showinfo",data)
                sendInfotipLong(data.cont);
            } else if (type == "tip_update"){
                sendUpdate(data.cont);
            } else if (type == "tip_alert"){
                sendAlerttip(data.cont);
            } else if (type == "tip_alert_rt"){
                sendAlertrttip(data.cont);
            } else if (type == "tip_alert_long"){
                sendAlerttipLong(data.cont);
            } else if (type == "rc_infopage"){
                updateContent_DetailPage();
                showGPAcount(0,data);
                console.log("RCInfo")
            } else if (type == "rib_fwk"){
                ribbon_Fireworks(parseFloat(data.cont));
            } else if (type == "rc_hidescore"){
                hideScoresRepeatedly(10,1500);
                tmp_stopHide = false;
            } else if (type == "rc_hideasm"){
                hideAssignments(data.cont);
                hideAseRepeatedly(data,10,1500);
                hideAseRepeatedly(data,100,3000);
            } else if (type == "bp-GPAcalced"){
                gpaClaced();
            } else if (type == "bp-recordLogin"){
                recordLoginUser();
            } else if (type == "append2Scores"){
                appendAvgMaxScoresInPage(data,0);
            } else if (type == "bp-GPANotcalced"){
                gpaNotClaced();
            } else if (type == "bp-OpenPageAfterLoginNtw"){
                setTimeout(() => {
                    window.location.href="http://4.3.2.1";
                }, 20);
                setTimeout(() => {
                    window.location.href="http://4.3.2.1";
                }, 60);
            } else if (type == "stat-RenderText") {
                replaceTaskStat(data.cont)
            } else if (type == "gb-finishedCalc"){
                console.log(data)
                document.getElementById("gb_newnum").innerText = parseFloat(data.cont).toFixed(1);
            } else if (type == "gb-savedData"){
                console.log("gb-savedData:",data);
                showDiyScoresBox(data.smsId, data.subjectId, data.subjectName,data.model,data.list);
            } else if(type=="showSubmitLinkAnsBtn"){
                addSubmitLinkBtn(data.cont,0);
            } else if(type == "send_pop") {
                revieveMessage = true;
                sendFloatingMessage(data.message, data.type);
            } else if(type == "send_pop_longterm") {
                longtermMessage = data.message;
            } else if(type == "MS_finishedAssignmentGet"){
                startTeamsPanel(data.cont); 
        
            }
        }
    });
});

function MSShowSyncing(data){
    console.log("MSShowSyncing",data)
    const sync1ContentElem = document.getElementById(`sync${data}Content`);
	if (sync1ContentElem) {
        sync1ContentElem.innerText = tlang("同步中..","Synchronizing..")
		// Remove any previous spinner if present
		const prevSpinner = sync1ContentElem.querySelector('.sync-rotating-spinner');
		if (prevSpinner) prevSpinner.remove();

		const spinner = document.createElement('img');
        spinner.id = `sync${data}Spinner`;
		spinner.src = chrome.runtime.getURL("res/refresh.svg");
		spinner.style.width = "1em";
		spinner.style.height = "1em";
        spinner.style.marginTop = "-4px";
		spinner.style.verticalAlign = "middle";
		spinner.style.marginRight = "0.5em";
		spinner.className = "sync-rotating-spinner";
		spinner.style.animation = "sync-rotate 2s linear infinite";
		// Insert spinner before the text
		sync1ContentElem.insertBefore(spinner, sync1ContentElem.firstChild);

		// Add keyframes for rotation if not already present
		if (!document.getElementById("sync-rotate-style")) {
			const style = document.createElement("style");
			style.id = "sync-rotate-style";
			style.textContent = `
				@keyframes sync-rotate {
					0% { transform: rotate(0deg);}
					100% { transform: rotate(360deg);}
				}
			`;
			document.head.appendChild(style);
		}
	}
}

function Ntw_SimclickDisclamer(){
    console.log("RUNNING ntwDis")

    if(!clicked_disclamer){
        var targ = document.getElementById("password_disclaimer");//用于快速点击disclamer选项
        if(targ){
            if(!targ.checked){
                targ.click();
                clicked_disclamer=true;
            }
        }
    }
}
function editPageText(){
    console.log("RUNNING oedit")

    changeBarname(0, " (1)")
    changeBarname(1, " (2)")
    changeBarname(2, " (3)")
    changeBarname(3, " (4)")
}

async function showGPATip(){
    let smsId;
    try {
        smsId = await getIdBySemester(queryAllByClassNames("fe-components-xb-pull-btn-__input--3TWoIfVMNo-eszvg3cnXCa")[0].value);
    } catch (e) {
        smsId = -1;
    }
    
    if (smsId === -1) {
        return;
    }
    try {
        chrome.storage.local.get(`gpa${smsId}`, function(idData) {
            if (idData[`gpa${smsId}`] === undefined) {
                gpaNotClaced();
                return;
            }

            if(idData[`gpa${smsId}`] === undefined || idData[`gpa${smsId}`].schoolisGPA==null){
                gpaClaced();
            }else{
                gpaNotClaced();
            }
        });
    } catch (error) {
        gpaNotClaced();
    }
    
}

async function beforeshowGPAbox(){
    console.log("RUNNING beforeshowGPAbox");
    let smsId;
    smsId = await getIdBySemester(queryAllByClassNames("fe-components-xb-pull-btn-__input--3TWoIfVMNo-eszvg3cnXCa")[0].value);
    if (smsId === -1) {
        return; // Handle error case if getIdBySemester fails, if needed
    }

    const storageData = await new Promise((resolve) => {
        chrome.storage.local.get(`gpa${smsId}`, function(data) {
            resolve(data);
        });
    });

    if(storageData[`gpa${smsId}`] !== undefined){
        queryAllByClassNames("ng-scope fe-components-stu-app-realtime-list-__item--15ati0uVXaVfuWcqrnMUMw fe-components-stu-app-realtime-list-__listItem--3XdXNo9J8YyN2Z4GL0lpGz")[0].click();
        showGPABox();

        //sendInfotip(tlang("计算的GPA仅供参考，可能存在误差<br><br>详见：<a style='color:#cccccc;text-decoration:underline' href='https://g2h8ru7041.feishu.cn/docx/RLXdd0ZeuogSwzx1R3KcwgElnMg?from=from_copylink'>GPA计算说明</a>","The calculated GPA is for reference only and may contain errors.<br><br>For details, see：<a style='color:#cccccc;text-decoration:underline' href='https://g2h8ru7041.feishu.cn/docx/RLXdd0ZeuogSwzx1R3KcwgElnMg?from=from_copylink'>Description</a>"));
    }else{
        sendAlertrttip(tlang("该学期不在计算范围内","This semester is not in the calculation range"));
    }
}

function fun_rewriteRealtimeUpdateTimeNode(target) {
    if (!target) return;
    const text = target.innerText;
    if (text === "首次公布时间：1970-01-01 08:00") {
        target.innerText = "由Giaoculator计算";
        return;
    }
    if (text === "首次公布时间：2008-10-16 00:00") {
        target.innerText = "由Giaoculator获取";
        return;
    }
    if (text === "首次公布时间：2008-10-17 00:00" || text === "First Publish Time：2008-10-17 00:00") {
        target.innerText = tlang("由Giaoculator使用V1.1方法计算", "Calced Using V1.1 Method");
        const parentDiv = target.parentElement;
        if (parentDiv && !parentDiv._gcV1ClickBound) {
            parentDiv._gcV1ClickBound = true;
            parentDiv.addEventListener('click', function () {
                const subjectId = fun_extractRealtimeSubjectId(parentDiv);
                const smsInput = queryAllByClassNames("fe-components-xb-pull-btn-__input--3TWoIfVMNo-eszvg3cnXCa")[0];
                if (!smsInput) return;
                getIdBySemester(smsInput.value).then(semesterid => {
                    showGPAcount(0, { smsId: semesterid, subjectId: subjectId });
                });
            });
        }
        return;
    }
    if (text === "First Publish Time：1970-01-01 08:00" || text === "First Publish Time：2008-10-16 00:00") {
        target.innerText = "Calc by Giaoculator";
    }
}

function fun_rewriteRealtimeUpdateTimes() {
    fun_suppressRealtimeObserve(250);
    try {
        const targetElement = queryAllByClassNames('ng-binding fe-components-stu-app-realtime-list-__updateTime--3zHR7bQeuvOr3Nr0IlpZGI');
        for (let cnt = 0; cnt < targetElement.length; cnt++) {
            fun_rewriteRealtimeUpdateTimeNode(targetElement[cnt]);
        }
    } catch (error) {}
}

function updateContent() {
    fun_suppressRealtimeObserve(250);
    showGPATip();

    setTimeout(() => {
        var element = queryAllByClassNames("ng-scope fe-components-stu-app-realtime-list-__listItem--3XdXNo9J8YyN2Z4GL0lpGz fe-components-stu-app-realtime-list-__border--28HM0G_CwJuVpXrawp7ETW")[0];
        if (element && !element._gcGpaClickBound) {
            element._gcGpaClickBound = true;
            element.addEventListener('click', function(event) {
                if (!element.disabled) { // 检查按钮是否处于禁用状态，如果不是才执行
                    element.disabled = true; // 立即禁用按钮
            
                    if(!document.getElementById("gcalc_gpaSubtitle")){
                        beforeshowGPAbox();
                    }
                    
                    
            
                    setTimeout(function() {
                        element.disabled = false; // 3秒后重新启用按钮
                    }, 3000);
                }
            });
        }
    }, 100);

    console.log("RUNNING updateContent")
    fun_rewriteRealtimeUpdateTimes();
    setTimeout(fun_rewriteRealtimeUpdateTimes, 100);
}

function hideScores(scorelim) {



  const elements = queryAllByClassNames('fe-components-stu-app-realtime-list-__content--2keQZ3lLv0HwiGHcw7cEeU');
  for (let element of elements) {
    const scoreNumElement = querySelectorStable('.fe-components-stu-app-realtime-list-__scoreNum--toPOhGj5JXhKFaxKzn7G1', element);
    if (scoreNumElement) {
      const score = parseFloat(scoreNumElement.innerText);
      if (score < scorelim) {
        const scoreInfoElement = querySelectorStable('.fe-components-stu-app-realtime-list-__scoreInfo--1d-D_GnPEaK1HTrcgeNURt', element);
        console.log(scoreNumElement,scoreInfoElement);
        if (scoreInfoElement!=null) {
            console.log(scoreInfoElement,"is not NULL");
            scoreNumElement.innerHTML = '<img src="' + chrome.runtime.getURL("res/disablev2.png") + '" alt="Disabled" style="width: 200px;position: absolute;top: 94px;left: 16px;">';
            scoreInfoElement.remove();
        }else{
            scoreNumElement.innerHTML = '<img src="' + chrome.runtime.getURL("res/disablev2.png") + '" alt="Disabled" style="width: 200px;position: absolute;top: 94px;left: 16px;">';//初中部样式
        }
     }
    }
  }
}

async function saveToChromeStorage(keyName, obj) {
    try {
        const data = {};
        data[keyName] = obj; // 创建存储对象
        await chrome.storage.local.set(data); // 异步存储
        console.log("已存入 " + keyName + " 的数据!");
    } catch (error) {
        console.error('Error saving to chrome.storage:', error);

        //err
    }
}
async function getFromChromeStorage(keyName) {
    try {
        const result = await chrome.storage.local.get(keyName); // 异步获取
        if (result[keyName] !== undefined) {
            return result[keyName]; // 返回存储的值
        } else {
            console.warn('Key not found in chrome.storage:', keyName);
            return null;
        }
    } catch (error) {
        console.error('Error reading from chrome.storage or parsing:', error);
        //err
        return null;
    }
}

async function hideAssignments() {
    let guestMode = await getFromChromeStorage("login_guest");
    let settingData=await getFromChromeStorage("user_preference");
   // insertTeamsLogoLink();
    console.log("RUNNING assign")
   
    if(tmp_stopHide==true){
        return;
    }
    var scorelim = settingData.autoHide_Condition;
    if(guestMode==true){
        scorelim=101;
    }
    const elements = queryAllByClassNames('ng-scope fe-components-stu-app-task-list-__listItem--2LlZEXXtXjZzVCV4Ai9B6y');
    for (let element of elements) {
        try {
            var scoreNumElement = querySelectorStable('.fe-components-stu-business-task-list-item-__taskScore--13ruwhA6IFpxEaXteLRQco', element);
            var totalScoreNum = (element.querySelector('span.ng-binding.ng-scope').textContent.match(/\d+/)[0]) * 1.0;
            if (scoreNumElement) {
                //var score = parseFloat(scoreNumElement.innerText) +"|" +totalScoreNum;
                var score = (parseFloat(scoreNumElement.innerText)/totalScoreNum)*100;
                if (score < scorelim && settingData.autoHide) {
                    // 这个判断多余，可以考虑删除后面的代码
                    scoreNumElement.innerHTML = '<img src="' + chrome.runtime.getURL("res/disable.png") + '" alt="Disabled" style="width: 70%;padding-top:20px;" />';
            
                    const scoreInfoElement = querySelectorStable('.fe-components-stu-app-realtime-list-__scoreInfo--1d-D_GnPEaK1HTrcgeNURt', element);
                    if (scoreInfoElement) {
                        scoreInfoElement.remove();
                    }
                }
            }
        } catch (error) {
        }
        
    }
}
async function getIdBySemester(smsName) {
    let data = localStorage.getItem("schoolsemesters");
    if (data) {
        data = JSON.parse(data);
    } else {
        const response = await fetch("https://tsinglanstudent.schoolis.cn/api/School/GetSchoolSemesters");
        if (!response.ok) {
            return -1;
        }
        data = await response.json();
        localStorage.setItem("schoolsemesters", JSON.stringify(data));
    }
    console.log(smsName)

    if(smsName.includes("Semester")){
        smsName = englishToChiSemester(smsName);
    }
    try {
        let smsId = data.data[data.data.findIndex(item => item.name === smsName)].id;
    } catch (e) {
        const response = await fetch("https://tsinglanstudent.schoolis.cn/api/School/GetSchoolSemesters");
        if (!response.ok) {
            return -1;
        }
        data = await response.json();
        localStorage.setItem("schoolsemesters", JSON.stringify(data));
    }
    let smsId = data.data[data.data.findIndex(item => item.name === smsName)].id;
    return smsId;
}

function englishToChiSemester(englishSemester) {
    const parts = englishSemester.split(', ');
    const semesterPart = parts[0]; // "Semester 2"
    const yearPart = parts[1];     // "2024-2025"
  
    const semesterNumber = semesterPart.split(' ')[1]; // "2"
    const chineseSemester = `第${semesterNumber}学期`;
    const chineseYear = `${yearPart}学年`;
  
    return `${chineseYear} ${chineseSemester}`;
}

function updateContent_DetailPage() {

    try {
        console.log("RUNNING updateDP")
        const target = queryAllByClassNames('fe-components-stu-app-realtime-list-__basicInfoItem--2mLNqht5xhMaGuOPL1rAei')[2];
        if(target.children[1].innerText=="1970-01-01 08:00"||target.children[1].innerText=="2008-10-16 00:00"){
            target.children[0].innerText=tlang("Giaoculator获取的数据","Giaoculator fetched data");
            
            target.children[1].innerText="";
        }else if(target.children[1].innerText=="2008-10-17 00:00"){
            target.children[0].innerText=tlang("Giaoculator计算的数据(V1.1)","Giaoculator calced data(V1.1)");
            
            target.children[1].innerText="";
        }

        engPage_opti(0);
        setTimeout(engPage_opti(0), 30);
        ensureHiddenScoreBoxSkeleton();
    } catch (e) {

    }

}

function engPage_opti(redotimes){
    if(redotimes>25){
        return;
    }
    setTimeout(() => {
        console.log("RUNNING englishOpi")
        const targetElement2 = queryAllByClassNames('ng-binding fe-components-stu-app-realtime-list-__modelTitle--8I6j6U9niNNfZsIj8855i');    
        if (targetElement2[0]) { 
            target = targetElement2[0];
            if(target.innerText=="Grade Details"){
                target.innerText="Details"
            }
            return true;
        } else {
            return false;
        }
    }, 10);
    setTimeout(() => {
        console.log("RUNNING englishOpi")
        const targetElement2 = queryAllByClassNames('ng-binding fe-components-stu-app-realtime-list-__modelTitle--8I6j6U9niNNfZsIj8855i');    
        if (targetElement2[0]) { 
            target = targetElement2[0];
            if(target.innerText=="Grade Details"){
                target.innerText="Details"
            }
            return true;
        } else {
            setTimeout(engPage_opti(redotimes+1), redotimes*10);
            return false;
        }
    }, 120);
}


function beauty_dymCode(){
    return;
}

document.onkeydown = function(e) {//快捷键
    const target = e.target;
    
    const currentWindow = window.location.href;
    const tagName = target.tagName.toUpperCase();
    const isEditable = target.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA';
    const isFocused = document.activeElement === target;

    if(e.key === 'Enter' ){
        simulateClickLogin();
        
    } 
    if (isEditable&&(currentWindow.includes("4.3.2.1"))) {
        
        Ntw_SimclickDisclamer();
        
        return;
    }
    if(currentWindow.includes("https://tsinglanstudent.schoolis.cn/")){
        beauty_dymCode()
    }
    

    if(e.key === 'Backspace' ){
        hidestudentInfo();
        
    } 

    if (isEditable && isFocused) {
        return;
    }//以下如果在输入中则不会触发




    if (e.key === 'Escape') {
        simulateClickLogout();
    } else if (e.key >= '1' && e.key <= '4') {
        hideAssignments()
        if(e.key == '3'){
            simulateClickBar('4'.charCodeAt(0) - 49);
        } else if(e.key == '4'){
            simulateClickBar('5'.charCodeAt(0) - 49);
        }else{
            simulateClickBar(e.key.charCodeAt(0) - 49);
        }
        
    } else if (e.key === 'ArrowLeft' && (currentWindow.startsWith("https://") && currentWindow.includes(".schoolis.cn/Home#!/task/list") || (currentWindow.startsWith("https://") && currentWindow.includes(".schoolis.cn/Home#!/schedule")))) {
        try {
            document.getElementsByClassName("fc-prev-button fc-button fc-state-default fc-corner-left fc-corner-right")[0].click();
        } catch (e) { }
        try{queryAllByClassNames("ng-scope fe-components-xb-pagination-__pageNumber--1VqmLfGo3J_SMKjULyiFzU fe-components-xb-pagination-__leftIcon--1xTQmlKB0ldX-7LWrTevD4")[0].click();}catch{}
    } else if (e.key === 'ArrowRight' && (currentWindow.startsWith("https://") && currentWindow.includes(".schoolis.cn/Home#!/task/list") || (currentWindow.startsWith("https://") && currentWindow.includes(".schoolis.cn/Home#!/schedule")))) {
        try {
            document.getElementsByClassName("fc-next-button")[0].click();
        } catch (e) {
            console.log("Notfound");
        }
        try{queryAllByClassNames("ng-scope fe-components-xb-pagination-__pageNumber--1VqmLfGo3J_SMKjULyiFzU fe-components-xb-pagination-__rightIcon--ZSZeXHkbdqtWaqpsNXVn-")[0].click();}catch{}
    } else if (e.key === 'ArrowDown' && currentWindow.startsWith("https://") && currentWindow.includes(".schoolis.cn/Home#!/realtime/list")) {
        simulateClickRefresh(1);
    } else if (e.key === 'ArrowUp' && currentWindow.startsWith("https://") && currentWindow.includes(".schoolis.cn/Home#!/realtime/list")) {
        simulateClickRefresh(-1);
    }
};


function simulateClickLogin() {
    try{
        queryAllByClassNames("ng-binding fe-components-stu-business-login-enter-box-__signBtn--vqaowAg9R6jMv5h-QLc8U")[0].click();
    }catch{

    }
}

function simulateClickBar(keyNum) {
    if(true){
        try{
            queryAllByClassNames("ng-binding ng-scope fe-components-stu-business-topbar-__profileItem--342GOGLPiXlh4W0BfctRIF")[keyNum].click();
        }catch{
    
        }
    }
}

function changeBarname(keyNum, prefix) {
    if(true){
        try{
            var name = queryAllByClassNames("ng-binding ng-scope fe-components-stu-business-topbar-__profileItem--342GOGLPiXlh4W0BfctRIF")[keyNum].innerText;
            queryAllByClassNames("ng-binding ng-scope fe-components-stu-business-topbar-__profileItem--342GOGLPiXlh4W0BfctRIF")[keyNum].innerText = name + prefix;
        }catch{
    
        }
    }
}

function simulateClickLogout() {
    if(window.location.href === "https://tsinglanstudent.schoolis.cn/Home#!/task/list/detail"){
        queryAllByClassNames("ng-binding ng-scope fe-components-xb-location-__router--nsd2ZgXX2cpKLO-r5y7lv")[0].click();
    }
    
    else{
        try{
            queryAllByClassNames("fe-components-stu-app-realtime-list-__closeIcon--21rEx3pvaQh2o8ssUTWfBv")[0].click();
        }catch{
            try {
                queryAllByClassNames("fe-components-stu-app-realtime-list-__closeIcon--21rEx3pvaQh2o8ssUTWfBv")[1].click();
            } catch (error) {
                try{
                    queryAllByClassNames("ng-binding fe-components-stu-business-topbar-profile-__liBtn--2o4Tw8hObEQPDm7WM_T2us")[1].click();
                }catch{
                    try {
                        document.getElementsByClassName("logout hide")[0].click();
                    } catch{
                        
                    }
                }
            }
            
        }
    }
}
function simulateClickRefresh(posChange) {
    var targtext = queryAllByClassNames("fe-components-xb-pull-btn-__input--3TWoIfVMNo-eszvg3cnXCa")[0].value
    try{
        targlists = queryAllByClassNames("ng-isolate-scope fe-components-xb-pull-btn-__t_overflow--3OZPYj_1Z20EZZbQur_fl9");
        for(targ in targlists){
            if(targlists[targ].getAttribute('xb-title') == targtext){
                targlists[targ*1.0 +posChange].click();
                continue;
            }
        } 
        setTimeout(() => { 
            fun_decorateRealtimeList();
        }, 25);
        fun_decorateRealtimeList();
    }catch(e){
    }
}


function sendtopSeccesstip(cont){
    const notyf = new Notyf
    notyf.success({
        duration: 1500,
        position: {
          x: 'right',
          y: 'top',
        },
        dismissible: true,
        message : cont
    })
}


function sendSeccesstip(cont){
    const notyf = new Notyf
    notyf.success({
        duration: 1500,
        position: {
          x: 'right',
          y: 'bottom',
        },
        dismissible: true,
        message : cont
    })
}

function sendCongrat(cont){
    const notyf = new Notyf({
        types: [
          {
            type: 'congrat',
            background: "#52c41a",
            icon: false
          }
        ]
      });

    notyf.open({
        type: 'congrat',
        duration: 3300,
        position: {
          x: 'center',
          y: 'top',
        },
        dismissible: false,
        message : cont
    })
}

function sendErrortip(cont){
    const notyf = new Notyf
    notyf.error({
        duration: 1500,
        position: {
          x: 'center',
          y: 'bottom',
        },
        dismissible: true,
        message : cont
    })
}

function sendTopErrortip(cont){
    const notyf = new Notyf
    notyf.error({
        duration: 1500,
        position: {
          x: 'right',
          y: 'top',
        },
        dismissible: true,
        message : cont
    })
}


function sendInfotip(cont){
    const notyf = new Notyf({
        types: [
          {
            type: 'info',
            background: "#2884E8",
            icon: false
          }
        ]
      });

    notyf.open({
        type: 'info',
        duration: 2500,
        position: {
          x: 'left',
          y: 'top',
        },
        dismissible: true,
        message : cont
    })
}

function sendInfotipLong(cont){
    const notyf = new Notyf({
        types: [
          {
            type: 'info',
            background: "#2884E8",
            icon: false
          }
        ]
      });

    notyf.open({
        type: 'info',
        duration: 6000,
        position: {
          x: 'left',
          y: 'top',
        },
        dismissible: true,
        message : cont
    })
}

function sendUpdate(cont){
    const notyf = new Notyf({
        types: [
          {
            type: 'info',
            background: "#2884E8",
            icon: false
          }
        ]
      });

    notyf.open({
        type: 'info',
        duration: 100000,
        position: {
          x: 'left',
          y: 'top',
        },
        dismissible: true,
        message : cont
    });
}
    
function sendAlerttipLong(cont){
    const notyf = new Notyf({
        types: [
          {
            type: 'warning',
            background: "orange",
            icon: false
          }
        ]
      });

    notyf.open({
        type: 'warning',
        duration: 20000,
        position: {
          x: 'right',
          y: 'top',
        },
        dismissible: true,
        message : cont
    })
}

function sendAlerttip(cont){
    const notyf = new Notyf({
        types: [
          {
            type: 'warning',
            background: 'orange',
            icon: false
          }
        ]
      });

    notyf.open({
        type: 'warning',
        duration: 1500,
        position: {
          x: 'center',
          y: 'bottom',
        },
        dismissible: true,
        message : cont
    })
}

function sendAlertrttip(cont){
    const notyf = new Notyf({
        types: [
          {
            type: 'warning',
            background: 'orange',
            icon: false
          }
        ]
      });

    notyf.open({
        type: 'warning',
        duration: 1500,
        position: {
          x: 'left',
          y: 'top',
        },
        dismissible: true,
        message : cont
    })
}

async function hideScoresRepeatedly(interval, duration) {
    console.log("aaa");
    const { user_preference } = await chrome.storage.local.get('user_preference');
    let guestMode = await getFromChromeStorage("login_guest");
    let scorelim = user_preference?.autoHide_Condition;
    if(guestMode==true){
        scorelim = 0;//hide all for guest
    }
    let dohide = user_preference?.autoHide;
    console.log("InHide");
    if (!dohide) {
        console.log("dohide", dohide);
        return;
    }
    console.log(scorelim);
    const times = Math.floor(duration / interval);

    for (let i = 0; i <= times; i++) {
        setTimeout(() => {
            hideScores(scorelim);
        }, i * interval);
    }
}
function hideAseRepeatedly(data, interval, duration) {
    //25.11.1 已关闭，content_instantEdit将负责hide assignment操作
    return;
}

function showStateAtLoginPage(isGuest){
    
    chrome.storage.local.get('enable_state', function(estate) {
        chrome.storage.local.get('user_preference', function(tmp) {
            showStateAtLoginPageMain(tmp,estate.enable_state,isGuest);
        });
    });

}

function showHideButtonAtHome(){
    showHideButton(tmp_stopHide);
    return;
    chrome.storage.local.get('enable_state', function() {
        chrome.storage.local.get('user_preference', function(tmp) {
            showHideButton(tmp);
        });
    });
}

// 
function changeHideState(){
    console.log(tmp_stopHide);
    tmp_stopHide = !tmp_stopHide;
    showHideButtonAtHome();
    queryAllByClassNames("fe-components-xb-pagination-__active--38NmY6BWhbJQuJwfItXtYi")[0].click();
    return;
    // 设置显示状态为相反
    chrome.storage.local.get('user_preference', function(tmp) {
        var data = tmp.user_preference;
        data.autoHide = !data.autoHide;
        chrome.storage.local.set({user_preference: data});
    })
    // showHideButtonAtHome();
}

function showHideButton(tmp){
    // if (SHOW_REFRESH) {
    //     return;
    // }
    // SHOW_REFRESH = true;

    // var span = document.createElement('span');
    // span.className = 'ng-scope fe-components-stu-app-task-list-__marR10--3--xJSPS__rgN4cQ4G6FjE';
    // span.style.marginRight = '0';

    // var xb_rest_btn = document.createElement('xb-rest-btn');
    // xb_rest_btn.className = 'ng-isolate-scope';

    // var button = document.createElement('button');
    // button.className = 'ng-binding fe-components-xb-rest-btn-__cancel--GAK6A0SPZh0p3LOnXTukB';
    // button.style.height = '30px';
    //data = tmp.user_preference;
    hidestate = tmp

    // var div = querySelectorStable('.fe-components-stu-common-stu-select-bar-__selectDiv--1TuYczJu6_9rrSCwO58S-d');
    // 获取ng-binding fe-components-xb-rest-btn-__cancel--GAK6A0SPZh0p3LOnXTukB的button元素，并将里面的内容替换为img
    button = querySelectorStable('.fe-components-xb-rest-btn-__cancel--GAK6A0SPZh0p3LOnXTukB');
    url = chrome.runtime.getURL(hidestate==true ? "res/visOn.svg" : "res/visOff.svg"); // 你的SVG文件路径
    // button.innerHTML = '<img src="' + url + '" alt="*" style="height: 20px; width: 25px; margin-top:5px; fill: #ccc" />';
    if (hidestate==true){
        button.innerHTML = '<span><svg style="height: 20px; width: 25px; margin-top:5px; fill: #222" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z"/></svg></span>'
    }else{
        button.innerHTML = '<span><svg style="height: 20px; width: 25px; margin-top:5px; fill: #222" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"/></svg></span>'
    }
    // 给Button加上点击事件
    button.onclick = function() {
        changeHideState();
    }



}

function showStateAtLoginPageMain(tmp,estate,isGuest) {
    var langSet = (navigator.language || navigator.userLanguage).startsWith('zh') ? 'cn' : 'en';
    var content;
    var div = querySelectorStable('.fe-components-stu-business-login-enter-box-__signBtnWrap--1hC-pSiXWu5_WJuSPKGEzQ');
    if (!div) {
        console.log('指定的div未找到');
        return;
    }

    data = tmp.user_preference;
    if(isGuest){
        if(langSet == 'cn'){
            content = '访客模式：隐藏所有数据';
        }else{
            content = 'Guest Mode: Hide All Data';
        }
    }else if(data.autoHide==true && estate){
        if(langSet == 'cn'){
            if(data.autoHide_Condition > 100){
                content = '自动隐藏所有数据';
            }else{
                content = '自动隐藏分数低于'+data.autoHide_Condition+'%的数据';
            }
        }else{
            if(data.autoHide_Condition > 100){
                content = 'Auto-Hide Score Limit: Hide All';
            }else{
                content = 'Auto-Hide Score Limit: '+data.autoHide_Condition+'%';
            }
        }
    }else if(estate==false){
        if(langSet == 'cn'){
            content = 'Giaoculator已关闭';
        }else{
            content = 'Giaoculator is Disabled';
        }
    }else{
        if(langSet == 'cn'){
            content = '自动隐藏未开启';
        }else{
            content = 'Auto-Hide Scores Disabled';
        }
    }
    var containerG = document.getElementById('autoHideState');
    if (containerG) {
        var existingIcon = containerG.querySelector('img');
        if (existingIcon) existingIcon.src = chrome.runtime.getURL(data.autoHide&&estate ? "res/hideOn.svg" : "res/hideOff.svg");
        var existingText = containerG.querySelector('span');
        if (existingText) existingText.textContent = content;
        return;
    }
    var container = document.createElement('div');
    container.id = 'autoHideState';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'flex-start';
    container.style.paddingBottom = '10px'; // 假设按钮的下内边距是10px

    // 创建图标img元素
    var iconImg = document.createElement('img');
    iconImg.src = chrome.runtime.getURL(data.autoHide&&estate ? "res/hideOn.svg" : "res/hideOff.svg"); // 你的SVG文件路径
    if(isGuest){
        iconImg.src = chrome.runtime.getURL("res/hideOn.svg");
    }
    iconImg.alt = '*';
    iconImg.style.height = '20px'; // 根据需要调整大小
    iconImg.style.width = '25px'; // 根据需要调整大小
    container.appendChild(iconImg);

    // 创建文本
    var textSpan = document.createElement('span');
    textSpan.textContent = content;
    textSpan.style.marginTop = '-1px';
    textSpan.style.fontSize = '12px';
    textSpan.style.paddingLeft = '2px'; // 图标和文本之间的间距
    container.appendChild(textSpan);

    // 最后，将新创建的元素插入到div的第一个子元素（即button）之前
    var button = div.querySelector('button');
    if (button) {
        var myTarget = document.getElementById('autoHideState');
        div.insertBefore(container, button);
        
    } 
}


function diyHomepage(){
    chrome.storage.local.get('user_preference', function(result) {
        if(result.user_preference==undefined || result.user_preference==null){
            const homeSrc = "https://bing.biturl.top/?resolution=3840&format=image&index=0&mkt=zh-CN";
            const user_preference = {
                calcRange: 1,
                homeSrc: homeSrc,
                autoHide: true,
                advLogPage: true,
                advScoreShadow: false,
                autologNtw: 0,
                homeSrcDark: "https://bing.biturl.top/?resolution=3840&format=image&index=0&mkt=zh-CN",
                homeDarkMode: 1,
                autoHide_Condition: 70,
            };
            chrome.storage.local.set({ user_preference: user_preference });
            location.reload();
        }
        showStateAtLoginPage(false);
        var sourcedata = result.user_preference;
        if(result.user_preference.advLogPage){
            setTimeout(() => {
                beautyLoginPage(sourcedata,0);
            }, 1);
            setTimeout(() => {
                beauty_dymCode()
            }, 100);
            return;
        }
        try {
            var targ = queryAllByClassNames("fe-components-stu-business-login-enter-box-__schoolBackground--2S3KJugj_l_m7T5hRdY_cv")[0];
            if(source.includes(".mp4"))  {
                targ.children[0].innerHTML = "<div id='video-wrapper' style='width: 100%; height: 100%; position: relative; overflow: hidden;'><video style='width: 100%; height: 100%; object-fit: cover;' autoplay loop muted><source src='"+source+"' type='video/mp4'>Your browser does not support the video tag.</video></div>";
            // } else if(source.includes(".jpg")||source.includes("image")||source.includes(".jpeg")||source.includes(".png")||source.includes(".webp")||source.includes(".svg")||source.includes("tiff")||source.includes("bmp")||source.includes("gif")){
            } else {
                var img = new Image();
                img.onload = function() {
                    // Get the dimensions of the image and the container
                    var imgWidth = img.width;
                    var imgHeight = img.height;
                    var containerWidth = targ.children[0].offsetWidth;
                    var containerHeight = targ.children[0].offsetHeight;

                    // Decide which background size to use based on the dimensions
                    if (imgWidth > containerWidth || imgHeight > containerHeight) {
                        targ.children[0].style.backgroundSize = "cover";
                    } else {
                        targ.children[0].style.backgroundSize = "contain";
                    }

                    // Center the background image and prevent repetition
                    targ.children[0].style.backgroundPosition = "center center";
                    targ.children[0].style.backgroundRepeat = "no-repeat";
                    targ.children[0].style.backgroundImage = "url("+source+")";
                };
                img.src = source;
            } 
        }
        catch (error) {
            // Consider logging the error or handling it as required
        }
    });
}


function fun_setGpaTitle(text) {
    const el = queryAllByClassNames("ng-binding fe-components-stu-app-realtime-list-__gpaContentTitle--JYXIB_rCNvSgM5wWcEYdJ")[0];
    if (!el || el.innerText === text) {
        return;
    }
    fun_suppressRealtimeObserve(250);
    el.innerText = text;
}

function gpaClaced(){
    try {
        const text = (navigator.language || navigator.userLanguage).startsWith('zh') ? "学期GPA (计算)" : "Semester GPA (Calced)";
        fun_setGpaTitle(text);
        setTimeout(() => fun_setGpaTitle(text), 20);
    } catch{}
    
} 

function gpaNotClaced(){
    try {
        const text = (navigator.language || navigator.userLanguage).startsWith('zh') ? "学期GPA" : "Semester GPA";
        fun_setGpaTitle(text);
    } catch{}
}

function ntwLoginMain(){
    window.location.href = "http://4.3.2.1/ac_portal/20210314173759/pc.html?template=20210314173759&tabs=qrcode-pwd-dingtalk&vlanid=0&_ID_=0&switch_url=&url=";
    dticon = document.getElementsByClassName("auth-way-item-icon dingtalk")[0];
    dticon.src = chrome.runtime.getURL("res/disablev2.png")
}


function beautyLoginPage(srcData,redotimes){
    let colormode = srcData.homeDarkMode*1;
    var loginPageSrc = srcData.homeSrc;
    addGuestModeCheckbox();
    if(colormode >= 2){
        const hours = new Date().getHours();
        if (hours >= 6 && hours <= 18) {
            colormode = 1;
        } else {
            if(colormode == 3){
                loginPageSrc = srcData.homeSrcDark;
            }
            colormode = 0;
        }
    }
    
    //diyHomepage_LocalImg(loginPageSrc);



    try {
        if(curretSchool().includes("tsinglan")){ 
                queryAllByClassNames('ng-scope fe-components-stu-business-login-enter-box-__headMain--7bzuRu-Sq5O2sOCFgPNQH')[0].children[0].src = chrome.runtime.getURL(colormode?"res/tsLogo_D.png":"res/tsLogo_W.png");
        }
        if(!colormode){
            document.getElementById("autoHideState").children[1].style.color="#E4E4E4"
            const images = document.querySelectorAll('img');
            images.forEach(function(img) {
                if (img.src.includes('hideOn.svg')) {
                    img.src = img.src.replace('hideOn.svg', 'hideOn_Dark.svg');
                }else if (img.src.includes('hideOff.svg')) {
                    img.src = img.src.replace('hideOff.svg', 'hideOff_Dark.svg');
                }
            });
            const textlinks = document.querySelectorAll('a');
            textlinks.forEach(function(textlink) {
                textlink.style.color="#E4E4E4";
            });
            const inputs = document.querySelectorAll('input');
            inputs.forEach(function(tmp) {
                tmp.style.color="#E4E4E4";
            });
        }

        setTimeout(() => {
            try {//验证码适配
                let codeInput=queryAllByClassNames("fe-components-stu-business-login-enter-box-__inputWrap--2OI0SgF-iDEHZborbYzrNZ fe-components-stu-business-login-enter-box-__loginAccount--V6OxcxzYg1Kv38n9KjsDg fe-components-stu-business-login-enter-box-__codeAccount--1v5pY_k1CJAvtvhBeacNLV")[0];
                codeInput.children[0].outerHTML="<span>";
            } catch (e) {}
        }, 300);

        try {//验证码适配
            let codeInput=queryAllByClassNames("fe-components-stu-business-login-enter-box-__inputWrap--2OI0SgF-iDEHZborbYzrNZ fe-components-stu-business-login-enter-box-__loginAccount--V6OxcxzYg1Kv38n9KjsDg fe-components-stu-business-login-enter-box-__codeAccount--1v5pY_k1CJAvtvhBeacNLV")[0];
            codeInput.children[0].outerHTML="<span>";
            queryAllByClassNames("fe-components-stu-business-login-enter-box-__accountContainer--22PmjI_OEsahZLiUEgL4zr")[0].style.paddingTop="10px";
        } catch (e) {
            
        }
        try {
            if(queryAllByClassNames("ng-binding fe-components-stu-business-login-enter-box-__another--2h0L224JEWaxwWm501-8Vi")[0].innerText.length>1){
                queryAllByClassNames("fe-components-stu-business-login-enter-box-__accountContainer--22PmjI_OEsahZLiUEgL4zr")[0].style.paddingTop="10px";
            }
        } catch (e) {}



        if(loginPageSrc.length<2 || loginPageSrc =="<default>"){
            loginPageSrc = "https://bing.biturl.top/?resolution=3840&format=image&index=0&mkt=zh-CN";
        }
        


        if(loginPageSrc.includes("gcalc_localImg")||loginPageSrc.includes(".jpg")||loginPageSrc.includes(".heic")||loginPageSrc.includes("image")||loginPageSrc.includes(".jpeg")||loginPageSrc.includes(".png")||loginPageSrc.includes(".webp")||loginPageSrc.includes(".svg")||loginPageSrc.includes("tiff")||loginPageSrc.includes("bmp")||loginPageSrc.includes("gif")){
            // 图片：others
            console.log("others",loginPageSrc);
            if(loginPageSrc.includes("gcalc_localImg")){
                //已由上面完成
                return;
            }
            // 新版 Schoolis 多了 __loginContainer 层把 __bgWhite 挡住，优先用 loginContainer
            const _bgTarget = document.querySelector('[class*="fe-components-stu-business-login-enter-box-__loginContainer"]')
                || document.querySelector('.ng-scope[class*="fe-apps-login-__bgWhite"]');
            if(!loginPageSrc.includes("bing.biturl.top/?res")){
                if (_bgTarget) {
                    _bgTarget.style.backgroundImage = "url("+loginPageSrc+")";
                    _bgTarget.style.backgroundSize = "cover";
                    _bgTarget.style.backgroundPosition = "center";
                    _bgTarget.style.backgroundRepeat = "no-repeat";
                    _bgTarget.style.backgroundColor = "transparent";
                }
                return;
            }
            // 图片：BING — 用 inline 样式直接打到 _bgTarget，不再依赖会过期的 hash 选择器
            if (_bgTarget) {
                _bgTarget.style.position = "relative";
                _bgTarget.style.backgroundColor = "transparent";
            }
            const style = document.createElement("style");
            style.textContent = `
                /* 新图覆盖层，用于淡入动画 */
                .new-bg-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-size: cover;
                    background-position: center center;
                    background-repeat: no-repeat;
                    z-index: 9;
                    opacity: 0;
                    transition: opacity 0.6s ease-in-out;
                }
            `;
            document.head.appendChild(style);

            /**
             * 工具函数：获取指定 URL 的图片并转换为 Base64
             * @param {string} url
             * @returns {Promise<string>} Base64 字符串（dataURL）
             */
            async function fetchImageAsBase64(url) {
                const response = await fetch(url);
                const blob = await response.blob();
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            }

            /**
             * 工具函数：计算 Base64 图片的 SHA-256 哈希（返回 hex 字符串）
             * @param {string} base64 - dataURL 形式的 Base64
             * @returns {Promise<string>} 形如 "abc123..." 的 hex 哈希
             */
            async function computeSHA256(base64) {
                // 去掉前缀 "data:xxx;base64,"
                const base64Data = base64.split(",")[1] || "";
                // 将 base64 解码为二进制
                const raw = atob(base64Data);
                const uint8Array = new Uint8Array(raw.length);
                for (let i = 0; i < raw.length; i++) {
                    uint8Array[i] = raw.charCodeAt(i);
                }
                // 使用 Web Crypto API 做 SHA-256 摘要
                const hashBuffer = await crypto.subtle.digest("SHA-256", uint8Array);
                // 转成 16 进制字符串
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
                return hashHex;
            }

            // 2. 获取本地缓存的 “上一次的Base64图”
            chrome.storage.local.get(["lastImg"], async (res) => {
                const oldBase64 = res.lastImg;
                const bgElem = _bgTarget;

                if (!bgElem) return; // 没找到目标元素，直接退出

                // 2.1 如果有旧图，先行显示它
                if (oldBase64) {
                    bgElem.style.backgroundImage = `url(${oldBase64})`;
                }

                // 3. 若本次加载的图片地址满足条件，比如后缀包含 .jpg
                if (1) {
                    try {
                        // 3.1 获取新图的 Base64
                        const newBase64 = await fetchImageAsBase64(loginPageSrc);

                        // 3.2 分别计算旧图、新图的哈希
                        const oldHash = oldBase64 ? await computeSHA256(oldBase64) : null;
                        const newHash = await computeSHA256(newBase64);

                        // 如果“旧图哈希”和“新图哈希”相同，说明图片内容并无变化 => 不执行淡入动画
                        if (oldHash && oldHash === newHash) {
                            console.log("Images are identical, skip fade in");
                            // 直接把背景更新为最新的（其实是一样的图）
                            bgElem.style.backgroundImage = `url(${newBase64})`;
                            // 也写回缓存（防止 dataURL 存在额外元数据差异，这里可要可不要）
                            chrome.storage.local.set({ lastImg: newBase64 });
                        } else {
                            // 4. 动画淡入
                            const overlay = document.createElement("div");
                            overlay.className = "new-bg-overlay";
                            overlay.style.backgroundImage = `url(${newBase64})`;

                            bgElem.appendChild(overlay);

                            // 触发 CSS transition：让 overlay 的 opacity 从 0 -> 1
                            requestAnimationFrame(() => {
                                overlay.style.opacity = "1";
                            });

                            // 过渡结束后，替换掉父容器的背景并移除 overlay
                            const handleTransitionEnd = () => {
                                bgElem.style.backgroundImage = `url(${newBase64})`;
                                bgElem.removeChild(overlay);
                                overlay.removeEventListener("transitionend", handleTransitionEnd);
                            };
                            overlay.addEventListener("transitionend", handleTransitionEnd);

                            // 5. 更新缓存为新图
                            chrome.storage.local.set({ lastImg: newBase64 });
                        }
                    } catch (err) {
                        console.error("Error fetching/converting image:", err);
                    }
                }
            });

    //END
        } else {
            // 假设 targ 是目标元素，source 是视频源URL
            var targ = document.querySelector('div[ng-controller="login"]'); // 或者用来定位背景元素的其它选择器
            var source = loginPageSrc; // 替换为实际视频URL

            // 创建一个空的div作为视频容器
            var videoContainer = document.createElement('div');
            videoContainer.style.position = 'absolute';
            videoContainer.style.top = '0';
            videoContainer.style.left = '0';
            videoContainer.style.width = '100%';
            videoContainer.style.height = '100%';
            videoContainer.style.overflow = 'hidden';
            videoContainer.style.zIndex = '-1'; // 确保视频在其他内容之下

            // 设置视频HTML字符串
            videoContainer.innerHTML = "<video style='width: 100%; height: 100%; object-fit: cover;' autoplay loop muted><source src='" + source + "' type='video/mp4'>Your browser does not support the video tag.</video>";

            // 将视频容器追加到目标元素
            if (targ) {
                targ.style.background = 'none'; // 移除原背景
                targ.appendChild(videoContainer); // 添加视频容器
            }
            // 新版 Schoolis __loginContainer 有不透明背景色挡住视频 — 透明化
            try {
                const _lc = document.querySelector('[class*="fe-components-stu-business-login-enter-box-__loginContainer"]');
                if (_lc) {
                    _lc.style.backgroundColor = "transparent";
                    _lc.style.backgroundImage = "none";
                }
                const _bgw = document.querySelector('.ng-scope[class*="fe-apps-login-__bgWhite"]');
                if (_bgw) _bgw.style.backgroundColor = "transparent";
            } catch (e) {}


        }
    } catch (error) {
        if(redotimes<50){
            setTimeout(() => {
                beautyLoginPage(srcData,redotimes+1);
            }, redotimes<6 ? 100 : redotimes*100);
        }
    }
    try {
        if(!colormode){
            queryAllByClassNames("fe-components-directive-input-clear-__closeIcon--1-4h2qP26t0bSzIiZPJxT0")[0].remove()
            queryAllByClassNames("fe-components-directive-input-clear-__closeIcon--1-4h2qP26t0bSzIiZPJxT0")[0].remove()
        }
    } catch (error) {
        
    }
    setTimeout(() => {
        try {
            if(queryAllByClassNames("ng-binding fe-components-stu-business-login-enter-box-__another--2h0L224JEWaxwWm501-8Vi")[0].innerText.length>1){
                queryAllByClassNames("fe-components-stu-business-login-enter-box-__accountContainer--22PmjI_OEsahZLiUEgL4zr")[0].style.paddingTop="10px";
            }
        } catch (e) {}
    }, 1000);
    
}

// 替换任务统计处的文字
function replaceTaskStat(text) {
    // ng-binding fe-components-stu-app-task-stat-__containerBody--37aNor2CicrLBH0qmwwofX
    queryAllByClassNames("ng-binding fe-components-stu-app-task-stat-__containerBody--37aNor2CicrLBH0qmwwofX")[0].innerText = text;
}

function directDownloadFile() {
    const fullUrl = window.location.href;
    const urlObj = new URL(fullUrl);
    const params = new URLSearchParams(urlObj.search);
    const src = params.get('src');
    
    if (src) {
        window.location.href = src;
    } else {
        console.error('src参数不存在');
    }
}

function directDownloadFile_AddBtn() {
    // 创建按钮
    const btn = document.createElement('button');
    let text =(navigator.language || navigator.userLanguage).startsWith('zh') ? '下载' : 'Download';
    btn.innerHTML = '<img src='+chrome.runtime.getURL("res/download.svg")+' alt="下载" style="height: 20px; vertical-align: middle;"> '+text;
    btn.style.position = 'fixed';
    btn.style.right = '10px';
    btn.id = 'gcalcDownloadBtn';
    btn.style.bottom = '30px';
    btn.style.zIndex = '10000'; // 确保按钮在最顶层
    btn.style.padding = '5px 10px';
    btn.style.border = 'none';
    btn.style.cursor = 'pointer';
    btn.style.borderRadius = '5px';
    // '#007bff'
    btn.style.backgroundColor = '#4CAF50';
    btn.style.color = 'white';
    btn.style.fontSize = '10px';
    btn.style.fontWeight = 'bold';
    btn.onclick = function() {
        directDownloadFile();
    };
    document.body.appendChild(btn);
    hideFloatingBall();
    if(document.getElementsByClassName("ms-Button root-163").length>4){
        document.getElementById('gcalcDownloadBtn').remove()
    }
}
function fun_findRealtimeScoreList() {
    const strictRe = /^fe-components-stu-app-realtime-list-__scoreList--[A-Za-z0-9_-]+$/;
    const candidates = document.querySelectorAll('[class*="fe-components-stu-app-realtime-list-__scoreList"]');
    for (const el of candidates) {
        if (!el.isConnected) continue;
        for (const cls of el.classList) {
            if (strictRe.test(cls)) return el;
        }
    }
    const fallback = queryAllByClassNames("fe-components-stu-app-realtime-list-__scoreList--3yQylVqARJbNb5r06eJd3c")[0];
    return (fallback && fallback.isConnected) ? fallback : null;
}

function fun_isLiveRealtimeOverlay(el) {
    if (!el || !el.isConnected) return false;
    const modal = el.closest('[class*="fe-components-stu-app-realtime-list-__xbDialogModalBox"]');
    if (modal) {
        const style = window.getComputedStyle(modal);
        if (style.display === "none" || style.visibility === "hidden") return false;
        return true;
    }
    return !!el.closest('[class*="fe-components-stu-app-realtime-list-__scoreList"]');
}

function fun_pruneStaleRealtimeOverlays() {
    ["gcalc_gpacntstate", "gcalc_editedNotice", "gcalc_clicktoshowDiyBox", "gcalc_editedNoticeBtn", "gcalc_diyboxbtn", "gcalc_v1WarnLi"].forEach((id) => {
        const el = document.getElementById(id);
        if (el && !fun_isLiveRealtimeOverlay(el)) {
            try { el.remove(); } catch (e) {}
        }
    });
}

function fun_ensureRealtimeDetailDecorated(subjectId) {
    if (!fun_isRealtimeListPage()) return;
    fun_pruneStaleRealtimeOverlays();
    const scoreList = fun_findRealtimeScoreList();
    if (!scoreList) return;
    if (fun_isLiveRealtimeOverlay(document.getElementById("gcalc_gpacntstate"))) return;
    if (fun_isLiveRealtimeOverlay(document.getElementById("gcalc_editedNotice"))) return;

    updateContent_DetailPage();
    const smsInput = queryAllByClassNames("fe-components-xb-pull-btn-__input--3TWoIfVMNo-eszvg3cnXCa")[0];
    if (!smsInput) return;
    getIdBySemester(smsInput.value).then((semesterid) => {
        showGPAcount(0, { smsId: semesterid, subjectId: subjectId || gcLastRealtimeSubjectId });
    });
}

function hideOriginalShowScoreDetail(smsid, subjectid, subjectname, model){
    const btntext = tlang("进入任务预测","Enter Prediction Mode");
    // 提示语 + 同款"进入任务预测"按钮（直接内联在提示语下方，不依赖 setTimeout 路径中的 addBtnforshowDisScoresBox）
    const innerHtml = `
        <div style="display:flex; flex-direction:column; align-items:center; margin-top:22px; margin-bottom:20px;">
            <h4 style="text-align:center; margin-bottom:10px; font-size:1.2em; padding-top:49px; padding-bottom:24px;">${tlang("该科目成绩已在任务预测模式中修改，请进入任务预测模式查看","The grade for this subject has been modified. Please enter task prediction mode to view it.")}</h4>
            <p id="gcalc_editedNoticeBtn" style="font-size:13px; display:inline-block; margin-top:6px; margin-bottom:24px; padding:6px 16px; border:1px solid #ccc; border-radius:4px; cursor:pointer; background:#fff;">${btntext}</p>
        </div>
    `;

    const container = fun_findRealtimeScoreList();

    const _applyNotice = (c) => {
        if (!c) return false;
        c.innerHTML = `<div id="gcalc_editedNotice">${innerHtml}</div>`;
        const btn = document.getElementById("gcalc_editedNoticeBtn");
        if (btn && smsid !== undefined && subjectid !== undefined) {
            btn.addEventListener('click', function(){
                getUsrAssignmentInfoBeforeshowDiyBox(smsid, subjectid, subjectname, model);
            });
        }
        return true;
    };

    if (container) {
        _applyNotice(container);
        return;
    }
    console.log("[hideOriginalShowScoreDetail] scoreList container not found, retry later");
    // 异步重试 5 次（DOM 可能还在渲染中）
    const _retry = (n) => {
        if (n <= 0) return;
        setTimeout(() => {
            if (fun_isLiveRealtimeOverlay(document.getElementById("gcalc_editedNotice"))) return;
            const c = fun_findRealtimeScoreList();
            if (c) _applyNotice(c);
            else _retry(n-1);
        }, 200);
    };
    _retry(5);
}
function showGPAcount(redotimes,data){
    console.log("INShowGPACount")
    try {
        fun_pruneStaleRealtimeOverlays();
        let showGB = true;
        let GBModel = 0;
        if(fun_isLiveRealtimeOverlay(document.getElementById("gcalc_gpacntstate"))){
            return;
        }
        var tiptext;
        let className = queryAllByClassNames("ng-binding fe-components-stu-app-realtime-list-__gradeName--2NKfjy7pw11NCA7ZnBb5Fs")[0].innerText;
        let subjectName = queryAllByClassNames("ng-binding fe-components-stu-app-realtime-list-__basicInfoItemValue--3Zx2X_CcFbD3XBxLp_NeFt")[1].innerText;
        let totalInfo = className + subjectName;
        let excludeList_LowWeight = ["Fine Art","IT","Ele","Drama","Chinese Painting","Architectural","Dance","Percussion","Vocal","Media","Programming","Spanish","Philosophy","Skills","Journalism","Creative"];
        let excludeList_NotCNT = ["TSSA","IELTS","TOFEL","Student","Clubs","Homeroom"];
        let categoryLists = queryAllByClassNames("ng-binding fe-components-stu-app-realtime-list-__scoreListItemLabel--IDO2v_3UsPFqDDV9iQ2ml");
        if(totalInfo.includes("Drama")){
            showGB = false;
        }
        if(totalInfo.includes("Physical Education")){
            GBModel = 1;
        }
        if(excludeList_LowWeight.some(excludeItem => totalInfo.includes(excludeItem))){
            tiptext=tlang("该科目的GPA计算权重为0.5倍","This Subject Weights 0.5 in GPA Calculation")
        }else if(excludeList_NotCNT.some(excludeItem => totalInfo.includes(excludeItem))){
            tiptext=tlang("该科目不计入GPA计算","This Subject will be ignore in GPA Calculation")
        }else if(totalInfo.includes("C-Hum")){
            tiptext=tlang("该科目与中文计为一科计算","This Subject counts together with Chinese Culture")
        }else if(totalInfo.includes("Chinese")&&!totalInfo.includes("Second")&&!totalInfo.includes("A Level")&&!totalInfo.includes("AP")){
            tiptext=tlang("该科目与中文人文计为一科计算","This Subject counts together with C-Humanities")
        }else if(totalInfo.includes("AP")&&!totalInfo.includes("Second")&&!totalInfo.includes("Pre ")){
            tiptext=tlang("该科目为AP科目，正常计入GPA计算","This Subject Weights 1 in GPA Calculation")
        }else{
            tiptext=tlang("该科目正常计入GPA计算","This Subject Weights 1 in GPA Calculation")
        }

        if(queryAllByClassNames("ng-binding fe-components-stu-app-realtime-list-__modelTitle--8I6j6U9niNNfZsIj8855i")[0].innerText.includes("GPA")){
            tiptext=tlang("以上为GPA（计算）所包含科目","Subjects included in GPA calculation")
        }else{
            getFromChromeStorage(`${data.smsId}|${data.subjectId}|CustomAssignmentList`).then((custom) => {
                if(custom===undefined||custom===null){
                    console.log("no custom");
                }else{
                    // 把 smsId/subjectId/subjectName/GBModel 传过去，让提示语下方的"进入任务预测"按钮也能直接打开预测面板
                    hideOriginalShowScoreDetail(data.smsId, data.subjectId, subjectName, GBModel);
                }

            });
        }

        updateContent_DetailPage();
        for(let i=0;i<categoryLists.length;i++){
            var tmp = categoryLists[i].innerText
            if(tmp.includes("Q1")||tmp.includes("Q2")||tmp.includes("Q3")||tmp.includes("Q4")){
                tiptext=tlang("该科目为初中部科目","This Subject is a MS Subject");
                showGB = false;
            }
        }
        
        let newHtml="<ul id='gcalc_gpacntstate' ng-class='[styles.scoreListItem,commonStyles.clearFix]' class='fe-components-stu-app-realtime-list-__scoreListItem--3G2orCiXa-n9QRjw05Ii8f fe-shared-css-__clearFix--2mg8N64gHXU6X_nBPlhIaB'> <!-- ngRepeat: items in $ctrl.evaluationProjectList --><!-- end ngRepeat: items in $ctrl.evaluationProjectList --><li ng-repeat='items in $ctrl.evaluationProjectList' class='ng-scope'> <ul ng-class='commonStyles.clearFix' ng-click='toggleChildItem($index)' class='fe-shared-css-__clearFix--2mg8N64gHXU6X_nBPlhIaB'> <li ng-class='[styles.scoreListItemLabel, styles.scoreListItemScoreWeight]' class='"+ findHashedClass("ng-binding fe-components-stu-app-realtime-list-__scoreListItemLabel") + "' style='font-size:"+tlang(13,11)+"px'>"+tiptext+"</li> <li ng-class='[styles.scoreListItemWeight, styles.scoreListItemScoreWeight]' class='ng-binding fe-components-stu-app-realtime-list-__scoreListItemWeight--285HojRL7boCDLSqVG3jB-'></li> <li ng-class='[styles.scoreListItemScore, styles.scoreListItemScoreWeight]' id='gcalc_diyboxbtn' class='fe-components-stu-app-realtime-list-__scoreListItemScore--1SnqOFUX5PHAR3L-RwXhkl'> <span class='ng-binding'></span> <!-- ngIf: items.evaluationProjectList.length>0 && items.showChild --> <!-- ngIf: items.evaluationProjectList.length>0 && !items.showChild --> </li> </ul> </li></ul>"
        let targetDiv = fun_findRealtimeScoreList() || querySelectorStable('.fe-components-stu-app-realtime-list-__scoreList--3yQylVqARJbNb5r06eJd3c');
        if (targetDiv) {
            targetDiv.insertAdjacentHTML('beforeend', newHtml);

        } else {
            throw new Error("scoreList not ready");
        }
        // V1 fallback 警告：如果当前科目走了 V1 手动算分，且有"批改中"任务，提示数据可能不准确
        try {
            getFromChromeStorage(`${data.smsId}|${data.subjectId}`).then(course => {
                if (!course || course.source !== "v1calc") return;
                const pending = Array.isArray(course.pendingGradingTasks) ? course.pendingGradingTasks : [];
                if (pending.length === 0) return;
                const labelCls = findHashedClass("ng-binding fe-components-stu-app-realtime-list-__scoreListItemLabel");
                const warnText = tlang(
                    `${pending.join("、")} 任务处于批改中无法获取，因此数据不一定准确！`,
                    `${pending.join(", ")} in grading state — data may be inaccurate.`
                );
                const warnHtml = `<li ng-repeat="items in $ctrl.evaluationProjectList" class="ng-scope" id="gcalc_v1WarnLi"> <ul ng-class="commonStyles.clearFix" class="fe-shared-css-__clearFix--2mg8N64gHXU6X_nBPlhIaB"> <li ng-class="[styles.scoreListItemLabel, styles.scoreListItemScoreWeight]" class="${labelCls}" style="font-size:${tlang(12,10)}px;color:#ff8c00;font-weight:500;">${warnText}</li> </ul> </li>`;
                const wrap = document.getElementById("gcalc_gpacntstate");
                if (wrap && fun_isLiveRealtimeOverlay(wrap) && !document.getElementById("gcalc_v1WarnLi")) {
                    wrap.insertAdjacentHTML('beforeend', warnHtml);
                }
            }).catch(() => {});
        } catch (e) {}
        if(showGB){
            try {

            }catch (error) {}
            setTimeout(() => {
                addBtnforshowDisScoresBox(data.smsId,data.subjectId,className,GBModel,0);
                matchSubjectToGoal(data.smsId);
            }, 100);
            
        }
    } catch (error) {
        setTimeout(() => {
            if(redotimes<30){
                console.log("retrying...",error);
                showGPAcount(redotimes+1,data);
            }
        }, 50);
    }
    
}

function tlang(chi,eng){
    return (navigator.language || navigator.userLanguage).startsWith('zh') ? chi:eng;
}

function hidestudentInfo(){
    try {
        queryAllByClassNames("fe-components-stu-business-head-img-__faceRadius--1KnMrEFLUQRin87ps3YG_k")[0].src=chrome.runtime.getURL("res/settings.svg");
        queryAllByClassNames("fe-components-stu-business-topbar-profile-__User--2nAN-ZibOa7TaBGcERbXX0")[0].remove();
        queryAllByClassNames("fe-components-stu-business-topbar-profile-__navUserBox--XXkgBpUL2yMAg1-Bz8tLq")[0].style="height:10px";
    } catch (error) {}
    try {queryAllByClassNames("fe-components-stu-business-topbar-profile-edit-__StatisticsTabItem--CudXhV9FC828VnLP4xeqJ")[1].remove()} catch (error) {}
    try {queryAllByClassNames("fe-components-stu-app-task-detail-__topInfoLi---LQyncvlBCIHhDzj4LFAn fe-components-stu-app-task-detail-__topInfo--2dj7QXyKxrcGchkM3UQrFK fe-components-stu-app-task-detail-__studentInfo--3pYOqsjP22Jx0AnmEkK9HR")[0].remove()} catch (error) {}
}

function addBtnforshowDisScoresBox(smsid,subjectid,subjectname,model,redotimes){
    // 当 [Edited] 提示语已经占据整个 scoreList 容器时（gcalc_gpacntstate 已被替换），
    // 这条路径不该再加按钮——提示语里已经内联了"进入任务预测"按钮。
    if (fun_isLiveRealtimeOverlay(document.getElementById("gcalc_editedNotice"))) return;
    if (fun_isLiveRealtimeOverlay(document.getElementById("gcalc_clicktoshowDiyBox"))) return;
    if (!fun_isLiveRealtimeOverlay(document.getElementById("gcalc_gpacntstate")) || !fun_isLiveRealtimeOverlay(document.getElementById("gcalc_diyboxbtn"))) {
        if ((redotimes || 0) < 15) {
            setTimeout(() => addBtnforshowDisScoresBox(smsid,subjectid,subjectname,model,(redotimes || 0) + 1), 80);
        }
        return;
    }

    let btntext = tlang("进入任务预测","Enter Edit Mode")
    try {
        const isGpaModal = queryAllByClassNames("ng-binding fe-components-stu-app-realtime-list-__modelTitle--8I6j6U9niNNfZsIj8855i")[0].innerText.includes("GPA");
        if(isGpaModal){
            btntext=tlang("修改权重匹配规则","Edit Weight Matching Rules")
        }
        let tmpBtn = `<p id="gcalc_clicktoshowDiyBox" style="font-size: 13px; display: inline-block; margin-top:11px; padding: 4px 11px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">${btntext}</p>`;

        document.getElementById("gcalc_gpacntstate").children[0].children[0].children[0].style = "font-size:13px;position: relative;top: 1px;";
        document.getElementById("gcalc_diyboxbtn").insertAdjacentHTML('beforeend', tmpBtn);
        const diyBtn = document.getElementById("gcalc_clicktoshowDiyBox");
        if (diyBtn) {
            if(isGpaModal){
                diyBtn.addEventListener('click', function() {
                    chrome.runtime.sendMessage({
                        type: "openOptionsPage_GPA"
                    });
                });
            }else{
                diyBtn.addEventListener('click', function() {
                    getUsrAssignmentInfoBeforeshowDiyBox(smsid,subjectid,subjectname,model);
                });
            }
        }
    } catch (e) {
        if ((redotimes || 0) < 15) {
            setTimeout(() => addBtnforshowDisScoresBox(smsid,subjectid,subjectname,model,(redotimes || 0) + 1), 80);
        }
    }

    
}

function appendAvgMaxScoresInPage(data,redotimes){
    chrome.storage.local.get('exp_showFullavg', function(state) {
        let ShowFull_state = 1;
        console.log(redotimes);
        try {
            
            if((data.usrS/data.totalS)*100>=(data.avgS/data.totalS)*100+10||((data.usrS/data.totalS)*100)>=97||data.usrS>=data.maxS){
                queryAllByClassNames("ng-binding fe-components-stu-app-task-detail-__itemScore--1nuolF1pAilxxSB6o8b2Rx")[0].style="text-shadow: 0 0 10px #bbffbb";
            }else if((data.usrS/data.totalS)*100+10<(data.avgS/data.totalS)*100||data.usrS==0){
                queryAllByClassNames("ng-binding fe-components-stu-app-task-detail-__itemScore--1nuolF1pAilxxSB6o8b2Rx")[0].style="text-shadow: 0 0 10px #ff9999";
            }

            
            let elementToAppend;
            let targetElement = queryAllByClassNames("fe-components-stu-app-task-detail-__itemClassInfo--2Ist05O25K5lXA-9nAmiDO")[0]; // 找到目标元素
            if(queryAllByClassNames("ng-binding ng-scope fe-components-stu-app-task-detail-__itemClassInfoShow--359Ece2CkimkinYlmlxVbP").length==2){
                return;
            }else if(queryAllByClassNames("ng-binding ng-scope fe-components-stu-app-task-detail-__itemClassInfoShow--359Ece2CkimkinYlmlxVbP").length==1){
                queryAllByClassNames("ng-binding ng-scope fe-components-stu-app-task-detail-__itemClassInfoShow--359Ece2CkimkinYlmlxVbP")[0].remove();
            }
            let maxS=data.maxS;
            let usrS=data.usrS;
            let avgS=data.avgS;
            let PercentageAvgS = (avgS/data.totalS)*100;
            let PercentageUsrS = (usrS/data.totalS)*100;
            let PercentageMaxS = (maxS/data.totalS)*100;
            let maxScoreModel;
            let avgScoreModel;
            let hintText = "";
            let iconModel = "<img src="+chrome.runtime.getURL("res/icon.png")+" id='gcalc2ScoresIcon' alt='Ico' style='vertical-align: middle; margin-right: 5px; height: 24px;'>"
            //25.11.7请注意，由于这两个model无法从页面中找到最新class名，只能用固定的class。因此若页面再次更新，可能需要再次修改此处代码。
            if(ShowFull_state){
                maxScoreModel = "<p ng-class='styles.itemClassInfoShow' ng-if='taskDetailInfo.displayClassAvgScore' class='ng-binding ng-scope fe-components-stu-app-task-detail-__itemClassInfoShow--kHnYpBUlUdD919MkOWU83'>"+tlang("班级最高成绩:","Class Highest:")+maxS+"</p>"
                avgScoreModel = "<p ng-class='styles.itemClassInfoShow' ng-if='taskDetailInfo.displayClassAvgScore' class='ng-binding ng-scope fe-components-stu-app-task-detail-__itemClassInfoShow--kHnYpBUlUdD919MkOWU83'>"+tlang("班级平均成绩:","Class Average:")+avgS+"</p>"
            }else{
                maxScoreModel = ""
                if (PercentageUsrS === PercentageMaxS) {
                    hintText = tlang("班级最高！", "Class Highest!");
                } else if (PercentageUsrS >= PercentageAvgS + 8) {
                    hintText = tlang("表现优秀！", "Outstanding Performance!");
                } else if (PercentageUsrS >= PercentageAvgS){
                    hintText = tlang("表现良好", "Good Performance!");
                } else if (Math.abs(PercentageUsrS - PercentageAvgS) <= 6) {
                    hintText = tlang("接近平均水平", "Around Class Average");
                } else if (PercentageUsrS < PercentageAvgS) {
                    hintText = tlang("有进步空间", "Room for Improvement");
                }
                console.log(PercentageAvgS,PercentageUsrS,PercentageMaxS);

                avgScoreModel = "<p ng-class='styles.itemClassInfoShow' ng-if='taskDetailInfo.displayClassAvgScore' style='margin-right: 7px' class='ng-binding ng-scope fe-components-stu-app-task-detail-__itemClassInfoShow--359Ece2CkimkinYlmlxVbP'>"+"&nbsp;&nbsp;"+hintText+"</p>"
                console.log(hintText);
            }
            
            let tempDiv = document.createElement('div'); 

            tempDiv.innerHTML = iconModel;
            if (tempDiv.firstChild) {
                targetElement.appendChild(tempDiv.firstChild);
            }
            
            tempDiv.innerHTML = avgScoreModel;
            if (tempDiv.firstChild) {
                targetElement.appendChild(tempDiv.firstChild);
            }
            
            tempDiv.innerHTML = maxScoreModel;
            if (maxScoreModel!="") {
                targetElement.appendChild(tempDiv.firstChild);
            }
            
            setTimeout(() => {
                if(!document.getElementById("gcalc2ScoresIcon")){
                    appendAvgMaxScoresInPage(data,redotimes+1)
                }   
            }, 200);
            
            
        } catch (error) {
            console.log(error);
            setTimeout(() => {
                if(redotimes<10){
                    appendAvgMaxScoresInPage(data,redotimes+1)
                }
                
            }, redotimes*20);
        }
    });
    
    
}
function sys_showload(state){
    if (state == true){
        const targetElement = document.querySelector('[class*="stu-common-stu-loading"]');
        if (targetElement) {
            targetElement.style.display = "table";
        }
    } else {
        const targetElement = document.querySelector('[class*="stu-common-stu-loading"]');
        if (targetElement) {
            targetElement.style.display = "none";
        }
    }
}

function gbHasChildren(item) {
    return Array.isArray(item?.evaluationProjectList) && item.evaluationProjectList.length > 0;
}

function gbCateKey(item) {
    if (!item) return "";
    if (item.evaluationProjectId !== undefined && item.evaluationProjectId !== null && item.evaluationProjectId !== "") {
        return "id_" + String(item.evaluationProjectId);
    }
    const name = String(item.evaluationProjectEName || item.evaluationProjectName || "cate");
    return "n_" + name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function gbWalkCates(list, fn, parent) {
    if (!Array.isArray(list)) return;
    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        fn(item, parent || null);
        if (gbHasChildren(item)) {
            gbWalkCates(item.evaluationProjectList, fn, item);
        }
    }
}

function gbFindCate(list, key) {
    let found = null;
    gbWalkCates(list, (item) => {
        if (!found && gbCateKey(item) === String(key)) found = item;
    });
    return found;
}

function gbFindParentOf(list, key) {
    let parent = null;
    gbWalkCates(list, (item, p) => {
        if (!parent && gbCateKey(item) === String(key)) parent = p || null;
    });
    return parent;
}

function gbCountTasks(list) {
    let n = 0;
    gbWalkCates(list, (item) => {
        n += Array.isArray(item.learningTaskAndExamList) ? item.learningTaskAndExamList.length : 0;
    });
    return n;
}

function gbCateMatch(a, b) {
    if (!a || !b) return false;
    const aid = a.evaluationProjectId ?? a.id;
    const bid = b.evaluationProjectId ?? b.id;
    if (aid != null && bid != null && String(aid) === String(bid)) return true;
    if (a.evaluationProjectEName && b.evaluationProjectEName && a.evaluationProjectEName === b.evaluationProjectEName) return true;
    if (a.evaluationProjectName && b.evaluationProjectName && a.evaluationProjectName === b.evaluationProjectName) return true;
    return false;
}

function gbCollectDescendantTaskIds(item, ids) {
    const out = ids || new Set();
    if (!Array.isArray(item?.evaluationProjectList)) return out;
    item.evaluationProjectList.forEach((child) => {
        if (Array.isArray(child.learningTaskAndExamList)) {
            child.learningTaskAndExamList.forEach((t) => {
                if (t && t.id != null) out.add(t.id);
            });
        }
        gbCollectDescendantTaskIds(child, out);
    });
    return out;
}

function gbStripDuplicatedParentTasks(item) {
    if (!item || !gbHasChildren(item) || !Array.isArray(item.learningTaskAndExamList)) return;
    const childIds = gbCollectDescendantTaskIds(item, new Set());
    item.learningTaskAndExamList = item.learningTaskAndExamList.filter((t) => t && !childIds.has(t.id));
}

function gbMergeV1IntoV2(v2List, v1List) {
    if (!Array.isArray(v2List)) return Array.isArray(v1List) ? v1List : [];
    if (!Array.isArray(v1List) || v1List.length === 0) return v2List;
    return v2List.map((v2p) => {
        const v1Match = v1List.find((v1p) => gbCateMatch(v2p, v1p));
        const merged = Object.assign({}, v2p);
        const v2Tasks = Array.isArray(v2p.learningTaskAndExamList) ? v2p.learningTaskAndExamList : [];
        const v1Tasks = v1Match && Array.isArray(v1Match.learningTaskAndExamList) ? v1Match.learningTaskAndExamList : [];
        const v2Kids = Array.isArray(v2p.evaluationProjectList) ? v2p.evaluationProjectList : [];
        const v1Kids = v1Match && Array.isArray(v1Match.evaluationProjectList) ? v1Match.evaluationProjectList : [];
        if (v2Kids.length > 0) {
            merged.evaluationProjectList = gbMergeV1IntoV2(v2Kids, v1Kids);
            merged.learningTaskAndExamList = v2Tasks;
        } else if (v1Kids.length > 0) {
            merged.evaluationProjectList = v1Kids;
            merged.learningTaskAndExamList = v2Tasks.length > 0 ? v2Tasks : [];
        } else {
            merged.learningTaskAndExamList = v2Tasks.length > 0 ? v2Tasks : v1Tasks;
        }
        gbStripDuplicatedParentTasks(merged);
        return merged;
    });
}

function gbRemoveTaskById(list, targetId) {
    if (!Array.isArray(list)) return false;
    for (let i = 0; i < list.length; i++) {
        const project = list[i];
        if (Array.isArray(project.learningTaskAndExamList)) {
            const idx = project.learningTaskAndExamList.findIndex((t) => t.id === targetId);
            if (idx !== -1) {
                project.learningTaskAndExamList.splice(idx, 1);
                return true;
            }
        }
        if (gbHasChildren(project) && gbRemoveTaskById(project.evaluationProjectList, targetId)) {
            return true;
        }
    }
    return false;
}

function gbGetTaskRows(cataKey) {
    const lb = document.getElementById("gb_listbox");
    if (!lb) return [];
    return Array.from(lb.querySelectorAll("[data-cata-key]")).filter(
        (el) => el.getAttribute("data-cata-key") === String(cataKey)
    );
}

function gbSetCateScore(key, score) {
    const el = document.getElementById(key + "_score");
    if (!el) return;
    if (score === null || score === undefined || score === "" || isNaN(parseFloat(score)) || parseFloat(score) < 0) {
        el.textContent = "-% / -";
        el.setAttribute("scoreValue", null);
        return;
    }
    const n = parseFloat(score);
    el.textContent = `${n.toFixed(1)}% / ${scoreToLevel(n)}`;
    el.setAttribute("scoreValue", n);
}

function gbRefreshParentScore(parentItem) {
    if (!parentItem || !gbHasChildren(parentItem)) return;
    let totalScore = 0;
    let totalWeight = 0;
    parentItem.evaluationProjectList.forEach((child) => {
        const s = gcParseCateScore(gbCateKey(child));
        const prop = parseFloat(child.proportion);
        if (s !== null && !isNaN(prop) && prop > 0) {
            totalScore += s * prop;
            totalWeight += prop;
        }
    });
    if (totalWeight > 0) gbSetCateScore(gbCateKey(parentItem), totalScore / totalWeight);
    else gbSetCateScore(gbCateKey(parentItem), null);
}

function gbExpandCate(key) {
    const childWrap = document.getElementById("gb_children_" + key);
    const taskWrap = document.getElementById("gb_tasks_" + key);
    if (childWrap) childWrap.style.display = "";
    if (taskWrap) taskWrap.style.display = "";
    const arrow = document.getElementById("gbArrow_" + key);
    if (arrow) arrow.innerHTML = "&#9660;";
}

function gbPulseCate(key, improved) {
    const scoreElement = document.getElementById(key + "_score");
    const divElement = document.getElementById(key + "_div");
    if (scoreElement) {
        scoreElement.style.transition = "transform 0.3s ease-in-out";
        scoreElement.style.transform = "scale(1.5)";
        setTimeout(() => { scoreElement.style.transform = "scale(1)"; }, 300);
    }
    if (divElement) {
        const orig = divElement.getAttribute("data-gb-bg") || "rgba(255, 246, 203, 0.85)";
        divElement.style.transition = "background-color 0.5s ease-in-out";
        divElement.style.backgroundColor = improved ? "rgb(30, 244, 137)" : "rgba(235, 144, 144, 0.85)";
        setTimeout(() => {
            divElement.style.backgroundColor = orig;
        }, 500);
    }
}

function gbAfterLeafScoreChange(assignmentList, leafKey) {
    const parent = gbFindParentOf(assignmentList, leafKey);
    if (parent) gbRefreshParentScore(parent);
}

function gbTaskRowHtml(taskitem, cataKey, indent, titleOverride) {
    let tmpicon = "";
    if (taskitem?.fromGCalc) {
        tmpicon = `<img src="${chrome.runtime.getURL("icon.png")}" style="width:15.5px; height:15.5px; vertical-align: middle; margin-top:-2px; margin-right: 6px;" />`;
    } else {
        tmpicon = `<img src="https://cdn.schoolis.cn/sis/favicon/sis.ico" style="width:16px; height:16px; vertical-align: middle; margin-right: 6px;" />`;
    }
    const isHiddenCalc = taskitem.gcalcHiddenState === "calculated";
    const hiddenLabel = isHiddenCalc
        ? ` <span style="color:#888;font-size:11px;">(${tlang("批改中-计算","Grading-Calc")})</span>`
        : "";
    const visScoreVal = (taskitem.score !== null && taskitem.score !== undefined)
        ? (taskitem.score / taskitem.totalScore * 100)
        : "";
    const scoreDisplay = (taskitem.score === null || taskitem.score === undefined)
        ? "-&nbsp;"
        : (taskitem.score / taskitem.totalScore * 100).toFixed(1) + "%";
    const pad = "&nbsp;".repeat(6 + (indent || 0) * 4);
    const detailTitle = titleOverride || `${tlang("详细","Details")}: ${taskitem.score}/${taskitem.totalScore}`;
    return `
        <div data-cata-key="${cataKey}" data-vis-score="${visScoreVal}" style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background-color: rgba(255, 255, 255, 0.85); margin-bottom: 3px; margin-top: 3px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer;">
        <span title="${taskitem.name || ""}" style="flex: 2; text-align: left;">
            ${pad}
            ${tmpicon}
            &nbsp;&nbsp;${limitBytes(taskitem.name || "", 70)}${hiddenLabel}
        </span>
        <span style="flex: 1; text-align: center;"></span>
        <span title="${detailTitle}" style="flex: 1; text-align: center;">
            ${scoreDisplay}
        </span>
        </div>
    `;
}

function gbBindRemoveTask(rowEl, assignmentList, leafItem, taskitem) {
    if (!rowEl) return;
    rowEl.addEventListener("click", function () {
        const assignmentCata = gbCateKey(leafItem);
        const assignmentScore = (taskitem.score / taskitem.totalScore) * 100;
        gbRemoveTaskById(assignmentList, taskitem.id);
        sendtopSeccesstip(taskitem.fromGCalc
            ? tlang("自定义项目已移除","Cunstom Assignment Removed")
            : tlang("原生项目已移除","Original Assignment Removed"));
        const cateScore = gcParseCateScore(assignmentCata);
        const effCount = gcGetEffectiveCount(assignmentCata);
        if (effCount <= 1) {
            gbSetCateScore(assignmentCata, null);
        } else if (cateScore !== null) {
            gbSetCateScore(assignmentCata, (cateScore * effCount - parseFloat(assignmentScore)) / (effCount - 1));
        } else {
            gbSetCateScore(assignmentCata, null);
        }
        this.remove();
        gcRefreshBundlePrediction(assignmentCata);
        gbAfterLeafScoreChange(assignmentList, assignmentCata);
        setTimeout(() => {
            gcRefreshTotalScore(false);
        }, 80);
    });
}

function gbRenderLeafTasks(item, assignmentList, container, indent) {
    if (!container) return;
    const cataKey = gbCateKey(item);
    const failedTasks = [];
    const list = Array.isArray(item.learningTaskAndExamList) ? item.learningTaskAndExamList : [];
    list.forEach((taskitem) => {
        if (taskitem.gcalcHiddenState === "failed") {
            failedTasks.push(taskitem);
            return;
        }
        if (taskitem.score === null || taskitem.score === undefined) return;
        container.insertAdjacentHTML("beforeend", gbTaskRowHtml(taskitem, cataKey, indent));
        const rows = gbGetTaskRows(cataKey);
        gbBindRemoveTask(rows[rows.length - 1], assignmentList, item, taskitem);
    });
    if (failedTasks.length > 0) {
        gcRenderFailedBundle(item, failedTasks, container, assignmentList);
    }
}

function gbAppendTaskHtml(cataKey, html) {
    const wrap = document.getElementById("gb_tasks_" + cataKey);
    if (!wrap) return null;
    const bundle = Array.from(wrap.querySelectorAll("[data-bundle-cate]")).find(
        (el) => el.getAttribute("data-bundle-cate") === String(cataKey)
    );
    if (bundle) bundle.insertAdjacentHTML("beforebegin", html);
    else wrap.insertAdjacentHTML("beforeend", html);
    const rows = gbGetTaskRows(cataKey);
    return rows[rows.length - 1] || null;
}

function getUsrAssignmentInfoBeforeshowDiyBox(smsid, subjectid,subjectName,model){
    sys_showload(true);
    let data={
        smsId:smsid,
        subjectId:subjectid,
        subjectName:subjectName,
        model:model
    }
    const customHistory = smsid+"|"+subjectid+"|CustomAssignmentList";
    const storagekey = smsid+"|"+subjectid;
    console.log(storagekey);
    chrome.storage.local.get(customHistory).then(async (customeResult) => {
        console.log("localINFOF",customeResult[customHistory]);
        if(customeResult[customHistory]!==undefined){
            console.log("Found Local Custom History",customeResult[customHistory]); // Corrected logging here
            showDiyScoresBox(smsid,subjectid,subjectName,customeResult[customHistory]);
        }else{
            chrome.storage.local.get(storagekey).then(async (result) => {
                console.log(result[storagekey]);
                let classId = null;
                try {
                    classId = result[storagekey]?.classId; // Using optional chaining to avoid potential errors
                } catch (error) {
                    // Consider logging the error for debugging purposes if this happens frequently
                    console.error("Error accessing classId from local storage:", error);
                }

                if (!classId){
                    const apiUrl = new URL(("https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetStuSemesterDynamicScore?semesterId="+smsid+"&gcalc=gcalc_bg"));
                    try {
                        const response = await fetch(apiUrl);
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                        const responseData = await response.json();
                        responseData.data.studentSemesterDynamicScoreBasicDtos.forEach(element => {
                            if(element.subjectId == subjectid){
                                classId = element.classId;
                                console.log("method2Found:",classId);
                            }
                        });
                    } catch (error) {
                        console.error("Error fetching class ID:", error);
                        sys_showload(false);
                        sendAlerttip(tlang("无法进入自定义模式:获取班级ID失败","Failed to init:Failed to get Class ID")); // Improved error message
                        return;
                    }
                }
                if(!classId){
                    sys_showload(false);
                    sendAlerttip(tlang("无法进入自定义模式:未找到班级ID","Failed to init:Class ID Not Found"));
                    return;
                }
                const apiUrl = new URL("https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetDynamicScoreDetail");
                apiUrl.searchParams.append("classId", classId);
                apiUrl.searchParams.append("subjectId", subjectid);
                apiUrl.searchParams.append("semesterId", smsid);

                try {
                    const response = await fetch(apiUrl);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const responseData = await response.json();
                    console.log("API Response Data:", responseData);
                    const projects = responseData?.data?.evaluationProjectList || [];
                    // V2 接口 (GetDynamicScoreDetail) 在新版可能返回 learningTaskAndExamList: []，
                    // 导致预测面板看不到任何任务条目。检测到这种情况则去拉 V1 (手动 fetch)
                    // 有子类的科目任务挂在 evaluationProjectList 子孙上，必须递归计数，不能只看顶层。
                    const allEmpty = projects.length > 0 && gbCountTasks(projects) === 0;
                    console.log("[V2Predict] allEmpty=", allEmpty, "projects=", projects.length, "taskCount=", gbCountTasks(projects));
                    if (allEmpty) {
                        try {
                            chrome.runtime.sendMessage(
                                { type: 'fetchManualAssignmentList', smsId: smsid, subjectId: subjectid, classId: classId },
                                (resp) => {
                                    const respLen = Array.isArray(resp?.evaluationProjectList) ? resp.evaluationProjectList.length : 'not-array';
                                    const respHasData = Array.isArray(resp?.evaluationProjectList) && resp.evaluationProjectList.length > 0;
                                    const sumOfLearningTaskLists = respHasData ? gbCountTasks(resp.evaluationProjectList) : -1;
                                    console.log("[V2Predict] fetchManualAssignmentList respLen=", respLen, "hasData=", respHasData, "fromCache=", resp?.fromCache, "totalTasks=", sumOfLearningTaskLists, "respKeys=", resp ? Object.keys(resp) : 'null', "error=", resp?.error, "lastError:", chrome.runtime.lastError);
                                    // 合并：保留 V2 的 category 元数据（包括 score、proportion、name、子类），递归注入 V1 的 task 列表
                                    let merged = projects;
                                    if (respHasData) {
                                        merged = gbMergeV1IntoV2(projects, resp.evaluationProjectList);
                                    }
                                    showDiyScoresBox(smsid, subjectid, subjectName, merged);
                                    sys_showload(false);
                                }
                            );
                        } catch (e) {
                            console.warn("[V2Predict] fetchManualAssignmentList threw:", e);
                            showDiyScoresBox(smsid, subjectid, subjectName, projects);
                            sys_showload(false);
                        }
                    } else {
                        showDiyScoresBox(smsid, subjectid, subjectName, projects);
                        sys_showload(false);
                    }
                } catch (error) {
                    console.error("Fetch failed:", error);
                    sys_showload(false);
                }
            });
        }
    });


    // return;//old method - This line will prevent the following code from running
    // console.log("SendMSG:",data);
    // send_comp_msg("gb_getSavedData",data,0);
}

function showDiyScoresBox(smsId,subjectId,subjectName,assignmentList){
    console.log(assignmentList);
    let tmp_target = queryAllByClassNames("ng-scope fe-components-stu-app-realtime-list-__xbDialogModal--32pq02X2epeJa2CLnNeez5")[0];
    if(!tmp_target){
        console.log("[ShowDiyScoresBox]Target Not Found");
        return;
    }
    // Resolve latest hashed classes from tmp_target for stable rendering
    function resolveHashedClass(prefix, root, fallback) {
        try {
            if (!prefix) return fallback || "";
            const parts = prefix.trim().split(/\s+/);
            const base = parts[parts.length - 1].replace(/--.*/, "");
            if (root && root.classList) {
                for (const cls of root.classList) {
                    if (cls.startsWith(base + "--")) return cls;
                }
            }
            const found = (typeof findHashedClass === "function") ? findHashedClass(parts.join(" "), root || document) : null;
            return found || fallback || base;
        } catch (e) {
            return fallback || "";
        }
    }
    const xbDialogModalCls = resolveHashedClass("fe-components-stu-app-realtime-list-__xbDialogModal", tmp_target, "fe-components-stu-app-realtime-list-__xbDialogModal--32pq02X2epeJa2CLnNeez5");
    const xbDialogModalBoxCls = resolveHashedClass("fe-components-stu-app-realtime-list-__xbDialogModalBox", tmp_target, "fe-components-stu-app-realtime-list-__xbDialogModalBox--1hItMXot7XJyswrPjZ2WjQ");
    const headerCls = resolveHashedClass("fe-components-stu-app-realtime-list-__header", tmp_target, "fe-components-stu-app-realtime-list-__header--2llDMOt0zjGNFxFvoV5VBp");
    const clearFixCls = resolveHashedClass("fe-shared-css-__clearFix", tmp_target, "fe-shared-css-__clearFix--2mg8N64gHXU6X_nBPlhIaB");
    const modelTitleCls = resolveHashedClass("fe-components-stu-app-realtime-list-__modelTitle", tmp_target, "fe-components-stu-app-realtime-list-__modelTitle--8I6j6U9niNNfZsIj8855i");
    const closeIconCls = resolveHashedClass("fe-components-stu-app-realtime-list-__closeIcon", tmp_target, "fe-components-stu-app-realtime-list-__closeIcon--21rEx3pvaQh2o8ssUTWfBv");
    const bodyCls = resolveHashedClass("fe-components-stu-app-realtime-list-__body", tmp_target, "fe-components-stu-app-realtime-list-__body--KTwHV_4KFA0kqa0udu2GW");
    let selectionList = `<option value="none" disabled selected>${tlang("任务类别","Select Category")}</option>`;
    assignmentList.forEach(assignment => {
        selectionList += `
            <option value="${gbCateKey(assignment)}">
            ${tlang(assignment.evaluationProjectName, assignment.evaluationProjectEName)}
            </option>
        `;
    });
    mainHtml = `<div ng-class="styles.xbDialogModal" ng-if="$ctrl.showDialog" class="ng-scope ${xbDialogModalCls}">
    <div ng-class="styles.xbDialogModalBox" style="width:990px; max-height:680px" class="${xbDialogModalBoxCls}">
        <div ng-class="[styles.header, commonStyles.clearFix]" class="${headerCls} ${clearFixCls}">
            <span ng-class="styles.modelTitle" class="ng-binding ${modelTitleCls}">${tlang("预测成绩变化","Predict Score Changing")}</span>
            <span ng-class="styles.closeIcon" ng-click="closeModal()" class="${closeIconCls}"></span>
        </div>
        <div id="gb-body" ng-class="styles.body" class="${bodyCls}">
            <br><br>
            <div style="margin-bottom: 20px;">
                <p style="font-size: 14px; margin-right: 8px;">${tlang("学期ID","SemesterId")}：${smsId}&nbsp&nbsp&nbsp${tlang("&nbsp科目：","Subject:")}${subjectName} </p>
            </div>
            <div style="margin-bottom: 16px; display:flex; flex-wrap:nowrap; align-items:center; gap:6px; white-space:nowrap;">
                <label style="font-size: 13px; flex-shrink:0;">${tlang("任务名称","TaskName")}:</label>
                <input placeholder="${tlang("自定义名称(可选)","CustomName(Optional)")}"  id="gb_aName" type="text" style="line-height: 20px; padding: 3px 5px; border: 1px solid #ccc; border-radius: 4px; width: 128px; flex-shrink:0;">
                <label style="font-size: 13px; flex-shrink:0;">${tlang("得分(%)","Score(%)")}:</label>
                <input placeholder="96" id="gb_aScore" type="number" style="line-height: 20px; padding: 3px 5px; border: 1px solid #ccc; border-radius: 4px; width: 52px; flex-shrink:0;">
                <label style="font-size: 13px; flex-shrink:0;">${tlang("类别","Category")}:</label>
                <select id="gb_cataSelect" style="padding: 3px 5px; border: 1px solid #ccc; border-radius: 4px; max-width: 132px; flex-shrink:0;">
                    ${selectionList}
                </select>
                <span id="gb_subCataWrap" style="display:none; align-items:center; gap:6px; flex-shrink:0; min-width:0;">
                    <label style="font-size: 13px;">${tlang("细分类别","Subcategory")}:</label>
                    <select id="gb_subCataSelect" title="" style="padding: 3px 5px; border: 1px solid #ccc; border-radius: 4px; width: 132px; max-width: 132px; text-overflow: ellipsis;">
                        <option value="none" disabled selected>${tlang("细分类别","Select Subcategory")}</option>
                    </select>
                </span>
                <p id="gb_propDis" style="font-size: 13px; display: inline-block; margin:0; flex-shrink:0; min-width:72px;">${tlang("占比：","Prop.：")}-%</p>
                <button id="gb_appendBtn" style="font-size: 12px;background-color: #4CAF50; color: white; padding: 6px 9px; border: none; border-radius: 4px; cursor: pointer; flex-shrink:0;">${tlang("添加到列表","Add to List")}</button>
            </div>
            <div style="margin-bottom: 20px;">
                <div style="border: 0.2px solid #ccc; border-radius: 4px;width: 100%; margin: 0 auto; overflow-x: hidden; overflow-y: auto;">
                <div style="width: 100%; height: 370px; border: 1px solid #ccc; overflow-y: auto;">
                <ul id="gb_listbox">
                    
                </ul>
                </div>
            </div>
            </div>
            <div style="margin-bottom: 20px;">
                <div id="SubjectTotal_div" style="font-size: 15px; display: flex; align-items: center; justify-content: space-between; padding: 10px; background-color: rgba(255, 246, 203, 0.85); margin-bottom: 3px; margin-top: 3px; border-radius: 5px; box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 4px; cursor: pointer; transition: background-color 0.5s ease-in-out;">
                <span style="flex: 2; text-align: left;">
                    <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#8B1A10" style="margin-bottom: -3px;"><path d="M400-240v-80h62l105-120-105-120h-66l-64 344q-8 45-37 70.5T221-120q-45 0-73-24t-28-64q0-32 17-51.5t43-19.5q25 0 42.5 17t17.5 41q0 5-.5 9t-1.5 9q5-1 8.5-5.5T252-221l62-339H200v-80h129l21-114q7-38 37.5-62t72.5-24q44 0 72 26t28 65q0 30-17 49.5T500-680q-25 0-42.5-17T440-739q0-5 .5-9t1.5-9q-6 2-9 6t-5 12l-17 99h189v80h-32l52 59 52-59h-32v-80h200v80h-62L673-440l105 120h62v80H640v-80h32l-52-60-52 60h32v80H400Z"></path></svg>
                    &nbsp;${tlang("学科总成绩","Subject Score")}
                </span>
                <span style="flex: 1; text-align: center;">
                </span>
                <span id="SubjectTotal_score" style="flex: 1 1 0%; text-align: center; transition: transform 0.3s ease-in-out; transform: scale(1);">-% / -</span>
                </div>
            </div>
            <button id="gb_saveBtn" style="font-size: 14px;background-color: #4CAF50;color: white;padding: 7px 10px;border: none;border-radius: 4px;position:absolute;bottom:25px;right: 30px;cursor: pointer;">${tlang("应用至GPA计算","Apply Changes")}</button>
            <button id="gb_resetBtn" style="font-size: 14px;background-color: #f44336;color: white;padding: 7px 10px;border: none;border-radius: 4px;position: absolute;bottom: 25px;left: 25px;cursor: pointer;">${tlang("恢复原始数据","Reset to Default")}</button>
        </div>
    </div>
    </div>
    `; //Main Html of the box
    let oriScore = queryAllByClassNames("ng-binding fe-components-stu-app-realtime-list-__score--1e6GrTtGfRHkKF-12OE_J3")[0].innerText;
    tmp_target.innerHTML = mainHtml;
    queryAllByClassNames("fe-components-stu-app-realtime-list-__closeIcon--21rEx3pvaQh2o8ssUTWfBv")[0].addEventListener("click", function() {
        closeGcalcBox();
    });
    document.getElementById("gb_resetBtn").addEventListener("click", function() {
        chrome.storage.local.remove(smsId+"|" + subjectId + "|CustomAssignmentList");
        getFromChromeStorage(smsId+"|"+subjectId).then((originalInfo) => {
            getFromChromeStorage(smsId+"|GPAList").then((result) => {
                let list = result;
                for(let i=0;i<list.length;i++){
                    if(list[i].subjectName==subjectName||list[i].subjectName=="[Edited]"+subjectName){
                        if (list[i].subjectName && list[i].subjectName.startsWith("[Edited]")) {
                            list[i].subjectName = list[i].subjectName.substring("[Edited]".length);
                        }
                        list[i].subjectScore = formatNumber(originalInfo.subjectScore,1);
                        break;
                    }
                }
                saveToChromeStorage(smsId+"|GPAList",list);
                sendtopSeccesstip(tlang("科目分数已恢复为原始数据!","Subject Score has been reset to original data!"));
                chrome.runtime.sendMessage({
                    type:"recalc_GPA",
                    data: smsId
                });
                chrome.runtime.sendMessage({
                    type:"discardEditedSubject",
                    smsId: smsId,
                    subjectId: subjectId,
                    subjectScore: originalInfo.subjectScore
                });
                closeGcalcBox();
            });
        });

        
    });
    document.getElementById("gb_saveBtn").addEventListener("click", function() {
        gbWalkCates(assignmentList, (item) => {
            const scoreEl = document.getElementById(gbCateKey(item) + "_score");
            const tmpScore = scoreEl ? scoreEl.getAttribute("scoreValue") : null;
            if(tmpScore==null||tmpScore==""||tmpScore=="-"||tmpScore=="NaN"||tmpScore===undefined){
                item.scoreIsNull = true;
                item.score = 0;
                item.scoreLevel = "";
            }else{
                item.scoreIsNull = false;
                item.score = parseFloat(tmpScore);
                item.scoreLevel = scoreToLevel(parseFloat(tmpScore));
            }
        });

        getFromChromeStorage(smsId+"|GPAList").then((result) => {
            console.log(result,"Result",subjectName);
            let list = result;
            for(let i=0;i<list.length;i++){
                if(list[i].subjectName==subjectName||list[i].subjectName=="[Edited]"+subjectName){
                    if(!list[i].subjectName.includes("Edited")){
                        list[i].subjectName = "[Edited]"+subjectName;
                    }
                    list[i].subjectScore = formatNumber(parseFloat(gb_calcTotalScore()),1);
                    break;
                }
            }
            saveToChromeStorage(smsId+"|GPAList",list);
            saveToChromeStorage(smsId+"|"+subjectId+"|CustomAssignmentList",assignmentList);
            sendtopSeccesstip(tlang("已应用至GPA计算!","Data Applied to GPA Calculation!"));
            chrome.runtime.sendMessage({
                type:"recalc_GPA",
                data: smsId
            });
            chrome.runtime.sendMessage({
                type:"saveEditedSubject",
                smsId: smsId,
                subjectId: subjectId,
                data: assignmentList,
                subjectScore: gb_calcTotalScore()
            });
            chrome.storage.local.get("gpa"+smsId,function(data){
                let schoolis_gpa = data["gpa"+smsId].schoolisGPA;
                if(schoolis_gpa){
                    sys_showload(true);
                    setTimeout(()=>{
                        sys_showload(false);
                        closeGcalcBox();
                    },100);
                }else{
                    closeGcalcBox();
                }
            });
            
        });
        
    });//SAVEBTN
    
    
    const selectElement = document.getElementById("gb_cataSelect");
    const subSelectElement = document.getElementById("gb_subCataSelect");
    const subWrapElement = document.getElementById("gb_subCataWrap");
    const pElement = document.getElementById("gb_propDis");

    pElement.textContent = "";
    pElement.gcLeafKey = null;

    function gbSyncCataSelectUI() {
        const selectedItem = gbFindCate(assignmentList, selectElement.value);
        if (!selectedItem) {
            subWrapElement.style.display = "none";
            pElement.textContent = `${tlang("占比","Prop")}-%`;
            pElement.gcValue = null;
            pElement.gcLeafKey = null;
            return;
        }
        if (gbHasChildren(selectedItem)) {
            subWrapElement.style.display = "inline-flex";
            let subOpts = `<option value="none" disabled selected>${tlang("细分类别","Select Subcategory")}</option>`;
            selectedItem.evaluationProjectList.forEach((child) => {
                const fullName = tlang(child.evaluationProjectName, child.evaluationProjectEName);
                subOpts += `<option value="${gbCateKey(child)}" title="${fullName}">${limitBytes(fullName, 22)}</option>`;
            });
            subSelectElement.innerHTML = subOpts;
            subSelectElement.title = "";
            pElement.textContent = `${tlang("占比","Prop")}${selectedItem.proportion}%↘`;
            pElement.gcValue = null;
            pElement.gcLeafKey = null;
        } else {
            subWrapElement.style.display = "none";
            subSelectElement.innerHTML = `<option value="none" disabled selected>${tlang("细分类别","Select Subcategory")}</option>`;
            subSelectElement.title = "";
            const proportion = selectedItem.proportion ?? 30;
            pElement.textContent = `${tlang("占比","Prop")}${proportion}%`;
            pElement.gcValue = proportion;
            pElement.gcLeafKey = gbCateKey(selectedItem);
        }
    }

    selectElement.addEventListener("change", gbSyncCataSelectUI);
    subSelectElement.addEventListener("change", function () {
        const parentItem = gbFindCate(assignmentList, selectElement.value);
        const childItem = parentItem && gbHasChildren(parentItem)
            ? parentItem.evaluationProjectList.find((c) => gbCateKey(c) === subSelectElement.value)
            : null;
        if (!childItem || !parentItem) return;
        const fullName = tlang(childItem.evaluationProjectName, childItem.evaluationProjectEName);
        subSelectElement.title = fullName;
        pElement.textContent = `${tlang("占比","Prop")}${parentItem.proportion}%↘${childItem.proportion}%`;
        pElement.gcValue = childItem.proportion;
        pElement.gcLeafKey = gbCateKey(childItem);
    });
    var pendingAssignmentList = [];
    sys_showload(false);

    function renderCategory(item, parentItem, indent) {
        const key = gbCateKey(item);
        const isChild = !!parentItem;
        const hasKids = gbHasChildren(item);
        if (item.score === null || item.score == "-" || item.score == "NaN" || item.score === undefined) {
            item.scoreIsNull = true;
        } else {
            item.score = formatNumber(item.score, 1);
        }
        const bg = isChild ? "rgba(245, 240, 220, 0.92)" : "rgba(255, 246, 203, 0.85)";
        const padLeft = 10 + (indent || 0) * 16;
        const host = parentItem
            ? document.getElementById("gb_children_" + gbCateKey(parentItem))
            : document.getElementById("gb_listbox");
        if (!host) return;
        const scoreLabel = item.scoreIsNull ? "-" : item.score;
        const levelLabel = item.scoreIsNull ? "-" : (item.scoreLevel || scoreToLevel(item.score) || "-");
        const categoryHtml = `
            <div id="${key}_div" data-gb-top="${isChild ? "0" : "1"}" data-gb-child="${isChild ? "1" : "0"}" data-gb-bg="${bg}" style="font-size:13px; display: flex; align-items: center; justify-content: space-between; padding: 10px; padding-left:${padLeft}px; background-color: ${bg}; margin-bottom: 3px; margin-top: 3px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer;">
            <span style="flex: 2; text-align: left;">
                <span id="gbArrow_${key}" style="display:inline-block; width:14px; user-select:none; color:#8B1A10;">&#9660;</span>
                ${tlang(item.evaluationProjectName, item.evaluationProjectEName)}(${item.proportion}%)
            </span>
            <span style="flex: 1; text-align: center;">
            </span>
            <span scoreValue="${item.scoreIsNull ? null : item.score}" gc_prop=${item.proportion} id="${key}_score" style="flex: 1; text-align: center;">
                ${scoreLabel}% / ${levelLabel}
            </span>
            </div>
        `;
        host.insertAdjacentHTML("beforeend", categoryHtml);

        if (hasKids) {
            host.insertAdjacentHTML("beforeend", `<div id="gb_children_${key}"></div>`);
            item.evaluationProjectList.forEach((child) => renderCategory(child, item, (indent || 0) + 1));
        }

        const leftoverTasks = Array.isArray(item.learningTaskAndExamList) && item.learningTaskAndExamList.length > 0;
        if (!hasKids || leftoverTasks) {
            host.insertAdjacentHTML("beforeend", `<div id="gb_tasks_${key}"></div>`);
            gbRenderLeafTasks(item, assignmentList, document.getElementById("gb_tasks_" + key), (indent || 0) + 1);
        }

        const row = document.getElementById(key + "_div");
        const wrappers = [];
        const childWrap = document.getElementById("gb_children_" + key);
        const taskWrap = document.getElementById("gb_tasks_" + key);
        if (childWrap) wrappers.push(childWrap);
        if (taskWrap) wrappers.push(taskWrap);
        if (row && wrappers.length) {
            row.addEventListener("click", function (ev) {
                ev.stopPropagation();
                const hide = wrappers[0].style.display !== "none";
                wrappers.forEach((w) => { w.style.display = hide ? "none" : ""; });
                const arrow = document.getElementById("gbArrow_" + key);
                if (arrow) arrow.innerHTML = hide ? "&#9654;" : "&#9660;";
            });
        }
    }

    gbWalkCates(assignmentList, (item) => gbStripDuplicatedParentTasks(item));
    assignmentList.forEach((item) => renderCategory(item, null, 0));
    assignmentList.forEach((item) => {
        if (gbHasChildren(item)) gbRefreshParentScore(item);
    });
    //init overallScore
    document.getElementById("SubjectTotal_score").textContent = `${gb_calcTotalScore()}% / ${scoreToLevel(gb_calcTotalScore())}`;

    document.getElementById("gb_appendBtn").addEventListener("click", function() {
        if(!document.getElementById("gb_aScore").value){
            sendTopErrortip(tlang("请先填写自定义分数","Please enter the custom score first"));
            console.log(assignmentList);
            return;
        }
        if(document.getElementById("gb_cataSelect").value=="none"){
            sendTopErrortip(tlang("请先选择任务类别","Please select a category first"));
            return;
        }

        const assignmentName = document.getElementById("gb_aName").value==""?`${tlang("用户自定义任务","Custom Assignment")}${(Math.random()*10000).toFixed(0)}`:document.getElementById("gb_aName").value;
        const assignmentScore = document.getElementById("gb_aScore").value;
        if(assignmentScore<0||assignmentScore>100){
            sendTopErrortip(tlang("分数必须在0~100之间","Score must be between 0~100"));
            return;
        }

        const parentItem = gbFindCate(assignmentList, document.getElementById("gb_cataSelect").value);
        if (!parentItem) {
            sendTopErrortip(tlang("请先选择任务类别","Please select a category first"));
            return;
        }
        let leafItem = parentItem;
        if (gbHasChildren(parentItem)) {
            const subKey = document.getElementById("gb_subCataSelect").value;
            if (!subKey || subKey === "none") {
                sendTopErrortip(tlang("请先选择细分类别","Please select a subcategory first"));
                return;
            }
            leafItem = gbFindCate(assignmentList, subKey);
        }
        if (!leafItem || gbHasChildren(leafItem)) {
            sendTopErrortip(tlang("请先选择细分类别","Please select a subcategory first"));
            return;
        }

        const assignmentCata = gbCateKey(leafItem);
        const parentForPath = gbFindParentOf(assignmentList, assignmentCata);
        const proPath = parentForPath
            ? `${parentForPath.evaluationProjectId},${leafItem.evaluationProjectId},`
            : `${leafItem.evaluationProjectId},`;

        if (!Array.isArray(leafItem.learningTaskAndExamList)) leafItem.learningTaskAndExamList = [];
        const newTask = {
            "id": generateId(),
            "evaluationProjectId": leafItem.evaluationProjectId,
            "proPath": proPath,
            "type": 2,
            "score": assignmentScore,
            "levelString": "",
            "studentInfoId": 1016,
            "disciplineState": null,
            "classSubjectId": 1016,
            "name": assignmentName,
            "date": "/Date(1000000000000+0800)/",
            "totalScore": 100,
            "scoreType": 1,
            "resultType": 0,
            "fromGCalc": true
        };
        leafItem.learningTaskAndExamList.push(newTask);

        gbExpandCate(gbCateKey(parentItem));
        gbExpandCate(assignmentCata);
        let taskWrap = document.getElementById("gb_tasks_" + assignmentCata);
        if (!taskWrap) {
            const leafRow = document.getElementById(assignmentCata + "_div");
            if (leafRow) leafRow.insertAdjacentHTML("afterend", `<div id="gb_tasks_${assignmentCata}"></div>`);
            taskWrap = document.getElementById("gb_tasks_" + assignmentCata);
        }
        const indent = parentForPath ? 2 : 1;
        const listItemHtml = gbTaskRowHtml(newTask, assignmentCata, indent, tlang("自定义项目","Entered Score"));
        const newTarget = gbAppendTaskHtml(assignmentCata, listItemHtml);
        gbBindRemoveTask(newTarget, assignmentList, leafItem, newTask);

        let cateScore = gcParseCateScore(assignmentCata);
        let effCount = gcGetEffectiveCount(assignmentCata);
        let newCateScore = cateScore !== null
            ? (cateScore*(effCount-1) + parseFloat(assignmentScore))/(effCount)
            : parseFloat(assignmentScore);
        gbSetCateScore(assignmentCata, newCateScore);
        gcRefreshBundlePrediction(assignmentCata);
        gbAfterLeafScoreChange(assignmentList, assignmentCata);
        gbPulseCate(assignmentCata, newCateScore >= (cateScore !== null ? cateScore : 0));
        if (parentForPath) gbPulseCate(gbCateKey(parentForPath), newCateScore >= (cateScore !== null ? cateScore : 0));

        let tscateScoreDiv = document.getElementById("SubjectTotal_score").textContent.trim();
        let tsmatch = tscateScoreDiv.match(/^([\d.]+)% /);
        tsmatch = tsmatch ? parseFloat(tsmatch[1]) : 0;

        setTimeout(() => {
            const newOverall = gb_calcTotalScore();
            document.getElementById("SubjectTotal_score").textContent = `${newOverall}% / ${scoreToLevel(newOverall)}`;
            document.getElementById("SubjectTotal_score").setAttribute("scoreValue", newOverall);
            let TscoreElement = document.getElementById("SubjectTotal_score");
            let TdivElement = document.getElementById("SubjectTotal_div");

            TscoreElement.style.transition = "transform 0.3s ease-in-out";
            TscoreElement.style.transform = "scale(1.5)";
            setTimeout(() => {
                TscoreElement.style.transform = "scale(1)";
            }, 300);

            TdivElement.style.transition = "background-color 0.5s ease-in-out";
            TdivElement.style.backgroundColor = parseFloat(newOverall)>=(tsmatch)?"rgb(30, 244, 137)":"rgba(235, 144, 144, 0.85)";
            setTimeout(() => {
                TdivElement.style.backgroundColor = "rgba(255, 246, 203, 0.85)";
            }, 500);
        }, 60);
    });
    try{
        document.getElementById("gb_nextStepBtn").addEventListener("click", function() {
            showState2DiyScoresBox(smsId,subjectId,subjectName,oriScore);
        });
    }catch(e){}
    

}
    
// ---- Task9: "批改中-无法计算" bundle 支持 ----
// 有效任务数：可见任务数 + 已生效 bundle 的成员数（实现"权重 *n"）
function gcGetEffectiveCount(cataName){
    const lb = document.getElementById("gb_listbox");
    if(!lb) return 0;
    let n = gbGetTaskRows(cataName).length;
    const bundleRow = Array.from(lb.querySelectorAll("[data-bundle-cate]")).find(
        (el) => el.getAttribute("data-bundle-cate") === String(cataName)
    );
    if (bundleRow && bundleRow.getAttribute("data-bundle-active") === "1") {
        n += parseInt(bundleRow.getAttribute("data-bundle-size")) || 0;
    }
    return n;
}

function gcRefreshTotalScore(animate){
    const el = document.getElementById("SubjectTotal_score");
    if(!el) return;
    const newOverall = gb_calcTotalScore();
    el.textContent = `${newOverall}% / ${scoreToLevel(newOverall)}`;
    el.setAttribute("scoreValue", newOverall);
    if(animate){
        el.style.transition = "transform 0.3s ease-in-out";
        el.style.transform = "scale(1.4)";
        setTimeout(() => { el.style.transform = "scale(1)"; }, 300);
    }
}

function gcParseCateScore(cata){
    const scoreEl = document.getElementById(cata + "_score");
    if(!scoreEl) return null;
    let v = scoreEl.getAttribute("scoreValue");
    if(v===null || v==="" || v==="null" || isNaN(parseFloat(v))) return null;
    return parseFloat(v);
}

// 计算某 category 的可见任务分数之和（按百分比；data-vis-score 在渲染时写入）
function gcGetSumVisible(cata){
    let sum = 0;
    const rows = gbGetTaskRows(cata);
    for (let i=0; i<rows.length; i++){
        const v = parseFloat(rows[i].getAttribute("data-vis-score"));
        if (!isNaN(v)) sum += v;
    }
    return sum;
}

// 由 category 分推算出 bundle 中每个"批改中-无法计算"任务的预测分
//   推导：category = (sum_visible + predicted*n) / (visN+n)
//        => predicted = (category*(visN+n) - sum_visible) / n
function gcRefreshBundlePrediction(cata){
    const lb = document.getElementById("gb_listbox");
    if(!lb) return;
    const bundleRow = Array.from(lb.querySelectorAll("[data-bundle-cate]")).find(
        (el) => el.getAttribute("data-bundle-cate") === String(cata)
    );
    if (!bundleRow) return;
    const n = parseInt(bundleRow.getAttribute("data-bundle-size")) || 0;
    if (n === 0) return;
    const cateScore = gcParseCateScore(cata);
    const visN = gbGetTaskRows(cata).length;
    const predEl = document.getElementById("gcBundlePred_" + cata);
    if (cateScore === null) {
        if (predEl) predEl.innerHTML = `&mdash;&mdash; <span style="color:#888;font-size:11px;">(&times;${n})</span>`;
        bundleRow.setAttribute("data-bundle-active","0");
        bundleRow.setAttribute("data-bundle-score","");
        return;
    }
    const sumVis = gcGetSumVisible(cata);
    const predicted = (cateScore*(visN+n) - sumVis) / n;
    bundleRow.setAttribute("data-bundle-active","1");
    bundleRow.setAttribute("data-bundle-score", predicted);
    if (predEl) {
        predEl.innerHTML = `${predicted.toFixed(1)}% <span style="color:#888;font-size:11px;">(&times;${n})</span>`;
    }
}

// 把一个 category 的全部"批改中-无法计算"任务渲染成一个可展开的 bundle 行
// 预测分自动从 category 分推导，无需用户输入
function gcRenderFailedBundle(item, failedTasks, container, assignmentList){
    const lb = container || document.getElementById("gb_listbox");
    if(!lb) return;
    const cata = gbCateKey(item);
    const n = failedTasks.length;

    let memberRows = "";
    failedTasks.forEach(t => {
        memberRows += `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 10px; background-color: rgba(245,245,245,0.85); margin-bottom:2px; margin-top:2px; border-radius:5px; opacity:0.75;">
                <span title="${t.name}" style="flex:2; text-align:left;">
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <img src="https://cdn.schoolis.cn/sis/favicon/sis.ico" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;" />
                    ${limitBytes(t.name||"", 64)} <span style="color:#888;font-size:11px;">(${tlang("批改中-无法计算","Grading-N/A")})</span>
                </span>
                <span style="flex:1; text-align:center;"></span>
                <span style="flex:1; text-align:center;">&mdash;&mdash;</span>
            </div>
        `;
    });

    // n 个校宝小图标，横向半重叠（最多 5 个，超出显示 +k）
    const maxIcons = Math.min(n, 5);
    let iconsHtml = `<span style="display:inline-flex; align-items:center; vertical-align:middle; margin-right:8px;">`;
    for (let i=0; i<maxIcons; i++){
        iconsHtml += `<img src="https://cdn.schoolis.cn/sis/favicon/sis.ico" style="width:16px; height:16px; ${i===0?'':'margin-left:-8px;'} border-radius:50%; box-shadow:0 0 0 1.5px white;" />`;
    }
    if (n > maxIcons){
        iconsHtml += `<span style="margin-left:-4px; padding:1px 5px; font-size:10px; color:#555; background:#eee; border-radius:8px; box-shadow:0 0 0 1.5px white;">+${n-maxIcons}</span>`;
    }
    iconsHtml += `</span>`;

    const bundleHtml = `
        <div class="gcBundleRow" data-bundle-cate="${cata}" data-bundle-size="${n}" data-bundle-score="" data-bundle-active="0" style="display:flex; align-items:center; justify-content:space-between; padding:10px; background-color: rgba(214,229,255,0.9); margin-bottom:3px; margin-top:3px; border-radius:5px; box-shadow:0 2px 4px rgba(0,0,0,0.1); cursor:pointer;">
            <span style="flex:2; text-align:left;">
                &nbsp;&nbsp;&nbsp;&nbsp;
                <span id="gcBundleArrow_${cata}" style="display:inline-block; width:14px; user-select:none; color:#3b5bdb;">&#9654;</span>
                ${iconsHtml}
                ${tlang("批改中合并","In-Grading Bundle")} <span style="color:#888;font-size:11px;">(${n} ${tlang("项","items")})</span>
            </span>
            <span style="flex:1; text-align:center;"></span>
            <span id="gcBundlePred_${cata}" title="${tlang("由科目分推算","Derived from category score")}" style="flex:1; text-align:center; color:#3b5bdb; font-weight:500;">
                &mdash;&mdash; <span style="color:#888;font-size:11px;">(&times;${n})</span>
            </span>
        </div>
        <div id="gcBundleSubs_${cata}" style="display:none;">
            ${memberRows}
            <div style="display:flex; align-items:center; justify-content:center; padding:10px; background-color: rgba(255,255,255,0.6); margin-bottom:3px; margin-top:2px; border-radius:5px;">
                <button id="gcBundleRemoveAll_${cata}" style="font-size:12px; background-color:#f44336; color:white; padding:6px 14px; border:none; border-radius:4px; cursor:pointer;">
                    ${tlang("点击同时移除"+n+"个项目", "Remove all "+n+" items")}
                </button>
            </div>
        </div>
    `;
    lb.insertAdjacentHTML('beforeend', bundleHtml);

    const bundleRow = Array.from(lb.querySelectorAll("[data-bundle-cate]")).find(
        (el) => el.getAttribute("data-bundle-cate") === String(cata)
    );
    const arrowEl = document.getElementById("gcBundleArrow_" + cata);
    const subsEl = document.getElementById("gcBundleSubs_" + cata);
    const removeBtn = document.getElementById("gcBundleRemoveAll_" + cata);

    function toggleSubs(){
        if(!subsEl) return;
        if(subsEl.style.display==="none"){
            subsEl.style.display="block";
            if (arrowEl) arrowEl.innerHTML="&#9660;";
        } else {
            subsEl.style.display="none";
            if (arrowEl) arrowEl.innerHTML="&#9654;";
        }
    }

    if (bundleRow) {
        bundleRow.addEventListener("click", function(ev){
            ev.stopPropagation();
            // 点击红色"移除"按钮时不触发展开/收起
            if (ev.target && (ev.target.id === ("gcBundleRemoveAll_"+cata))) return;
            toggleSubs();
        });
    }

    if (removeBtn) {
        removeBtn.addEventListener("click", function(ev){
            ev.stopPropagation();
            // 移除 bundle -> category 退回为"仅可见任务的平均分"
            const visN = gbGetTaskRows(cata).length;
            const sumVis = gcGetSumVisible(cata);
            // 先把 bundle 从 DOM 中移除，这样 gcGetEffectiveCount 不再计入 bundle
            if (bundleRow) bundleRow.remove();
            if (subsEl) subsEl.remove();
            if (visN > 0) {
                gbSetCateScore(cata, sumVis / visN);
            } else {
                gbSetCateScore(cata, null);
            }
            // 从数据中移除这些任务（保证保存/再次打开一致）
            if (item && Array.isArray(item.learningTaskAndExamList)) {
                const ids = failedTasks.map(f => f.id);
                item.learningTaskAndExamList = item.learningTaskAndExamList.filter(t => ids.indexOf(t.id) === -1);
            }
            if (assignmentList) gbAfterLeafScoreChange(assignmentList, cata);
            gcRefreshTotalScore(true);
            sendtopSeccesstip(tlang("已移除"+n+"个批改中项目", "Removed "+n+" in-grading item(s)"));
        });
    }

    // 初始计算并显示预测分（此时 bundle 已存在于 DOM，可被 gcGetEffectiveCount 计入）
    gcRefreshBundlePrediction(cata);
}

function gb_calcTotalScore(){
    let totalScore = 0;
    let totalWeight = 0;
    const rows = document.querySelectorAll('#gb_listbox [data-gb-top="1"]');
    rows.forEach((row) => {
        const key = row.id.replace(/_div$/, "");
        const titleDiv = document.getElementById(key + "_score");
        if (!titleDiv) return;
        const match = titleDiv.getAttribute("scoreValue");
        if (match!==null&&match!==undefined&&match>=0&&match!="null") {
            const cateScore = parseFloat(match);
            const prop = parseFloat(titleDiv.getAttribute("gc_prop"));
            if (isNaN(cateScore) || isNaN(prop)) return;
            totalScore += cateScore * prop;
            totalWeight += prop;
        }
    });
    return (totalScore/totalWeight).toFixed(1);
}



function limitBytes(str, maxBytes) {
    let bytes = 0;
    let result = "";
    
    for (let char of str) {
        let charBytes = encodeURIComponent(char).length > 2 ? 2 : 1; 
        if (bytes + charBytes > maxBytes) break; 
        result += char;
        bytes += charBytes;
    }
    
    return bytes < maxBytes ? result : result + ".."; 
}

function padSpaces(str, targetLength) {
    //return str.padEnd(6)
    const paddingLength = Math.max(0, targetLength - str.length);
    return str + "&ensp;".repeat(paddingLength);
}

//addNewUsrAssignment(smsid,subjectid,name, percentageScore,proportion,cataName)

function send_comp_msg(msgtype, data = null, addData = null) {
    if (chrome.runtime?.id) {
        chrome.runtime.sendMessage({ type: msgtype, data, additionalData: addData });
    }
}

function showState2DiyScoresBox(smsId,subjectId,subjectName,oriScore){
    if (subjectName.includes("[Edited] ")) {
        subjectName = subjectName.replace("[Edited] ", "");
    }
    mainHtml = `<div id="gb-s2-body" ng-class="styles.body" class="fe-components-stu-app-realtime-list-__body--KTwHV_4KFA0kqa0udu2GW" style="display: flex; flex-direction: column;">
    <br><br>
    <div style="font-size: 28px; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); ;padding: 20px; display: flex; flex-direction: row;">
  <div ng-if="$ctrl.listInfo.length!=0" ng-class="[styles.item, styles.listItem]" ng-repeat="item in $ctrl.listInfo" ng-click="actionRealtime(item)" class="ng-scope fe-components-stu-app-realtime-list-__item--15ati0uVXaVfuWcqrnMUMw fe-components-stu-app-realtime-list-__listItem--3XdXNo9J8YyN2Z4GL0lpGz">
			<p ng-class="styles.title" xb-title="${subjectName}" class="ng-isolate-scope fe-components-stu-app-realtime-list-__title--2-qR61O6OMCyK_cqZXD1EC"><ng-transclude>${subjectName}</ng-transclude>
<div ng-class="styles['bubble-tips']" ng-show="show" style="" class="ng-hide fe-components-directive-xb-title-__bubble-tips--1rVlv__7CL6h6fs0m5wLMm">
	<!-- ngRepeat: text in xbTitle.split('</br>') track by $index --><p ng-repeat="text in xbTitle.split('</br>') track by $index" style="" class="ng-binding ng-scope">${subjectName}</p><!-- end ngRepeat: text in xbTitle.split('</br>') track by $index -->
	<em ng-class="styles[isUp?'title-arrows-up':'title-arrows-down']" class="fe-components-directive-xb-title-__title-arrows-down--1OqcUAwVxF4Rv0iZgjyYvH"></em>
</div></p>
			<p ng-class="styles.grade" xb-title="${subjectName}" class="ng-isolate-scope fe-components-stu-app-realtime-list-__grade--2wJch67b4uOYNPgwNpRCm8"><ng-transclude>${subjectName}</ng-transclude>
<div ng-class="styles['bubble-tips']" ng-show="show" style="" class="ng-hide fe-components-directive-xb-title-__bubble-tips--1rVlv__7CL6h6fs0m5wLMm">
	<!-- ngRepeat: text in xbTitle.split('</br>') track by $index --><p ng-repeat="text in xbTitle.split('</br>') track by $index" style="" class="ng-binding ng-scope">${subjectName}</p>
	<em ng-class="styles[isUp?'title-arrows-up':'title-arrows-down']" class="fe-components-directive-xb-title-__title-arrows-down--1OqcUAwVxF4Rv0iZgjyYvH"></em>
</div></p>
<div ng-class="styles.content" ng-if="item.scoreType==1" class="ng-scope fe-components-stu-app-realtime-list-__content--2keQZ3lLv0HwiGHcw7cEeU">
				<div ng-class="[styles.scoreNum,(item.subjectScore=='--')?styles.noneScore:'',(item.gpa!= null || item.level)?'':styles.scoreCenter]" class="ng-binding fe-components-stu-app-realtime-list-__scoreNum--toPOhGj5JXhKFaxKzn7G1 fe-components-stu-app-realtime-list-__scoreCenter--qsS5Rck5H9C3EHLPt3XUF">
					${oriScore}</div>
				<div style="clear:both;"></div>
			</div>
			<div ng-class="styles.updateTime" class="ng-binding fe-components-stu-app-realtime-list-__updateTime--3zHR7bQeuvOr3Nr0IlpZGI">原始成绩</div>
		</div>
        
<div ng-if="$ctrl.listInfo.length!=0" ng-class="[styles.item, styles.listItem]" ng-repeat="item in $ctrl.listInfo" ng-click="actionRealtime(item)" class="ng-scope fe-components-stu-app-realtime-list-__item--15ati0uVXaVfuWcqrnMUMw fe-components-stu-app-realtime-list-__listItem--3XdXNo9J8YyN2Z4GL0lpGz">
			<p ng-class="styles.title" xb-title="[Edited] ${subjectName}" class="ng-isolate-scope fe-components-stu-app-realtime-list-__title--2-qR61O6OMCyK_cqZXD1EC"><ng-transclude>[Edited] ${subjectName}</ng-transclude>
<div ng-class="styles['bubble-tips']" ng-show="show" style="" class="ng-hide fe-components-directive-xb-title-__bubble-tips--1rVlv__7CL6h6fs0m5wLMm">
	<!-- ngRepeat: text in xbTitle.split('</br>') track by $index --><p ng-repeat="text in xbTitle.split('</br>') track by $index" style="" class="ng-binding ng-scope">[Edited] ${subjectName}</p><!-- end ngRepeat: text in xbTitle.split('</br>') track by $index -->
	<em ng-class="styles[isUp?'title-arrows-up':'title-arrows-down']" class="fe-components-directive-xb-title-__title-arrows-down--1OqcUAwVxF4Rv0iZgjyYvH"></em>
</div></p>
			<p ng-class="styles.grade" xb-title="${subjectName}" class="ng-isolate-scope fe-components-stu-app-realtime-list-__grade--2wJch67b4uOYNPgwNpRCm8"><ng-transclude>${subjectName}</ng-transclude>
<div ng-class="styles['bubble-tips']" ng-show="show" style="" class="ng-hide fe-components-directive-xb-title-__bubble-tips--1rVlv__7CL6h6fs0m5wLMm">
	<!-- ngRepeat: text in xbTitle.split('</br>') track by $index --><p ng-repeat="text in xbTitle.split('</br>') track by $index" style="" class="ng-binding ng-scope">${subjectName}</p>
	<em ng-class="styles[isUp?'title-arrows-up':'title-arrows-down']" class="fe-components-directive-xb-title-__title-arrows-down--1OqcUAwVxF4Rv0iZgjyYvH"></em>
</div></p>
<div ng-class="styles.content" ng-if="item.scoreType==1" class="ng-scope fe-components-stu-app-realtime-list-__content--2keQZ3lLv0HwiGHcw7cEeU">
				<div id="gb_newnum" ng-class="[styles.scoreNum,(item.subjectScore=='--')?styles.noneScore:'',(item.gpa!= null || item.level)?'':styles.scoreCenter]" class="ng-binding fe-components-stu-app-realtime-list-__scoreNum--toPOhGj5JXhKFaxKzn7G1 fe-components-stu-app-realtime-list-__scoreCenter--qsS5Rck5H9C3EHLPt3XUF">
					-</div>
				<div style="clear:both;"></div>
			</div>
			<div ng-class="styles.updateTime" class="ng-binding fe-components-stu-app-realtime-list-__updateTime--3zHR7bQeuvOr3Nr0IlpZGI">修改后成绩</div>
		</div>
</div>
    <button id="gb_finishBtn" style="font-size: 14px;background-color: #4CAF50; color: white; padding: 7px 10px; border: none; border-radius: 4px; position:absolute; bottom:25px; right:31px; cursor: pointer;">确认</button>
</div>
    `; 
    document.getElementById("gb-body").style.display = "none";
    queryAllByClassNames("fe-components-stu-app-realtime-list-__xbDialogModalBox--1hItMXot7XJyswrPjZ2WjQ")[0].insertAdjacentHTML('beforeend', mainHtml);
    queryAllByClassNames("fe-components-stu-app-realtime-list-__closeIcon--21rEx3pvaQh2o8ssUTWfBv")[0].addEventListener("click", function() {
        closeGcalcBox();
    });
    document.getElementById("gb_finishBtn").addEventListener("click", function() {
        closeGcalcBox();
    });

}


function closeGcalcBox(){
    // 关闭自定义成绩册弹窗 = 让「动态成绩」页重新渲染。
    // 旧实现写死顶栏下标 [5]，校宝调整模块顺序后会跳到别的模块，这里改为按文案定位 + 路由兜底。
    const dynamicScoreItem = gcFindTopbarModuleItem('dynamicScore');
    if (dynamicScoreItem) {
        dynamicScoreItem.click();
        fun_decorateRealtimeList();
        return;
    }
    const realtimeUrl = "https://tsinglanstudent.schoolis.cn/Home#!/realtime/list";
    if (window.location.href.startsWith(realtimeUrl)) {
        window.location.reload();
    } else {
        window.location.href = realtimeUrl;
    }
}

function ribbon_Fireworks(duration_Seconds){
    var duration = duration_Seconds * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
    }

    var interval = setInterval(function() {
    var timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
        return clearInterval(interval);
    }

    var particleCount = 200 * (timeLeft / duration);
    // since particles fall down, start a bit higher than random
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
}



function addSmsCalcState(data){
    let cur = data.cur;
    let oval = data.oval;
    // 悬浮窗更新代码
    if(cur > currentUpdate){
        upgradeProgress();
        currentUpdate = cur;
    };

    if(cur == oval){
        //
    }
}
function addCalcState(data,redotimes){
    try {
        let cur = data.cur;
        let oval = data.oval;
        let text = data.text;
        let isRefresh = data.isRefresh;
        
        // 悬浮窗更新代码
        /*
        7 = oval;
        if(cur > currentUpdate){
            upgradeProgress();
            currentUpdate = cur;
        }*/
/*
        let targ = document.getElementById("gcalc_proc");
        if(!targ){
            let mainHtml = `<span id="gcalc_proc" ng-class="$ctrl.styles.gotoText" ng-show="showCourse" ng-click="" class="ng-binding fe-components-stu-business-topbar-__gotoText--abWs2AncUsOC7EPXLLEaK" style="
        display: flex;
        justify-content: center;
        margin-top: -30px;
        margin-left: -15px;
        ">计算中 (NaN)</span>`
            queryAllByClassNames("fe-components-stu-business-topbar-__navBar--2Au2lL_QIAwQu9fN70vAd4")[0].insertAdjacentHTML('beforeend', mainHtml);
        }*/
        //targ = document.getElementById("gcalc_proc");

        const progressText = document.getElementById("progress-text");
        progressText.innerText = text.length > 13 ? text.substring(0, 13) + '..' : text;
       // progressText.style.transition = `opacity 0.1s ease-out`;
        progressText.style.opacity = '100';
        if(cur == 0){
            document.getElementById("progress-text").innerText=`${cur} / ${oval} ${text}`;
        }
        if(cur>0 && cur<oval && isRefresh){
            setTimeout(() => {
                resetRing(0); // 重置环
            }, 50);
            document.getElementById("progress-text").innerText=`${cur} / ${oval}`;
            return;
        }
        if(cur == oval && cur>=1 && isRefresh){
             if(oval>1) document.getElementById("progress-text").innerText=`${cur} / ${oval}`;
             setTimeout(() => {
                resetRing(1);
             }, oval==1? 50:70);
        }
        
        //targ.innerText = tlang(`计算中 (${cur}/${oval})`,`Processing (${cur} / ${oval})`)
    } catch (error) {
        console.log("WaitForAgain",error);
        setTimeout(() => {
            addCalcState(data,redotimes+1)
        }, 100*redotimes);
    }
}





function MB_insertEditedDiv() {
  // 查找第一个具有 'ng-isolate-scope' 类的元素
  var target = querySelectorStable('.fe-components-stu-app-task-list-__listItemBox--3elHWcZSeppt-hG2vNGaZz');
  var already = document.querySelector('#my_status_bar');
  // 确保找到了目标元素
  if (target && !already) {
    // 创建一个新的div元素，并设置其内容和样式
    var newDiv = `
    <div id="my_status_bar" style="border: 1px solid #e5e5e5; border-radius: 3px; background-color: #fff; margin-top: 8px; padding: 15px; font-family: Arial, sans-serif; font-size: 14px; display: flex; justify-content: space-between; height: auto;">
      <div style="width: 50%; margin-right: 10px;">
        <ul style="margin: 0; padding: 0; list-style: none;">
          <li>这是一条消息</li>
        </ul>
      </div>
      <div style="width: 50%;">
        <ul style="margin: 0; padding: 0; list-style: none;">
          <li>这是一条消息</li>
        </ul>
      </div>
    </div>`;
    
  
    // 在找到的元素后面插入新的div
    target.insertAdjacentHTML('beforebegin', newDiv);
    console.log("done")
  } else {
    console.log('No element with class "ng-isolate-scope" found.');
  }
  
}

function POP_addPopComponent(){
    if (!window.location.href.includes('schoolis.cn')) {
        return;
    }
    let mainHtml = `
    <div>
        <div class="floating-ball">
            <div class="alert-dot"></div>
            <div class="alert-number">
                <span class="number-span">1</span>
            </div>
            <svg class="progress-ring" width="70" height="70">
                <circle class="progress-ring__circle" stroke="rgb(86,194,90)" stroke-width="6" fill="transparent" r="30.75" cx="35" cy="35"/>
            </svg>
            <div class="content-container">
                <img src="`+chrome.runtime.getURL("icon.png")+`" alt="Logo" id="xfc-logo">
            </div>
            
            <div id="progress-text-shadow"></div>
            <div id="progress-text"></div>
        </div>
        <div class="info-box">
            <div class="close-btn">×</div>
            <div class="info-content"></div>
        </div>
    </div>
`;
    var styleElement = document.createElement('style');
    let manCss = `
    .floating-ball {
        /* 保持这个样式不变 */
        position: fixed;
        z-index: 999;
        right: 40px;
        bottom: 40px;
        width: 70px;
        height: 70px;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
        background-color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        user-select: none;
    }

    #progress-text-shadow {
        box-shadow: 10px 10px 30px 8px rgba(0, 0, 0, 0.75);
        opacity: 1;
        z-index: 9998;
        font-size: 16px;
        color: black;
        
        /* === 修改为居中定位 === */
        position: fixed;
        right: 85px; /* 与浮动球的 right 对齐 */
        bottom: 48px; /* 调整此值使其位于浮动球下方，可根据需要调整 */
        transform: translateX(50%); /* 向右移动自身宽度的一半，实现水平居中 */
        white-space: nowrap; /* 确保文字不换行 */
    }

    #progress-text {
        opacity: 1;
        z-index: 9999;
        font-size: 16px;
        color: black;
        text-shadow: -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white;
        
        /* === 修改为居中定位 === */
        position: fixed;
        right: 75px; /* 与浮动球的 right 对齐 */
        bottom: 35px; /* 调整此值使其位于浮动球下方，可根据需要调整 */
        transform: translateX(50%); /* 向右移动自身宽度的一半，实现水平居中 */
        white-space: nowrap; /* 确保文字不换行 */
    }

    .content-container {
        position: relative;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .progress-ring {
        position: absolute;
        width: 100%;
        height: 100%;
    }
    .info-content {
        margin-right: 13px;
    }

    .progress-ring__circle {
        transition: stroke-dashoffset 4s linear;
        transform: rotate(-90deg);
        transform-origin: 50% 50%;
    }

    @keyframes fillProgress {
        from {
            stroke-dashoffset: 193.20794819577225; /* Full circumference */
        }
        to {
            stroke-dashoffset: 0;
        }
    }

    #xfc-logo {
        position: relative;
        top: 1px;
        width: 35px;
        height: 35px;
        /* border-radius: 50%; */
    }

    .info-box {
        position: fixed;
        right: 75px;
        bottom: 80px;
        width: 260px;
        /* height: 250px; */
        border-radius: 10px;
        box-shadow: 0 0px 15px rgba(0, 0, 0, 0.08);
        background-color: #fff;
        padding: 20px;
        display: none;
        opacity: 0; /* 初始透明度 */
        transition: opacity 0.09s ease-in-out; /* 渐变效果 */
        font-size: 15px;
        z-index: 998;
    }


    .close-btn {
        position: absolute;
        top: 10px;
        right: 14px;
        cursor: pointer;
        font-size: 20px;
        user-select: none;
        color: #333;
    }

    .alert-dot {
        position: absolute;
        z-index: 1000;
        top: 5px;
        right: 56px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: rgb(240, 0, 0);
        display: none;
        opacity: 0;
    }

    .alert-number {
        position: absolute;
        z-index: 1000;
        top: 50%;
        right: 50%;
        transform: translate(50%, -50%);
        width: 15px;
        height: 15px;
        border-radius: 50%;
        background-color: rgb(240, 0, 0);
        color: #fff;
        font-size: 11px;
        display: none;
        opacity: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .number-span {
        position: relative;
        font-size: 12px;
    }
    `
    styleElement.type = 'text/css';

    if (styleElement.styleSheet){
      styleElement.styleSheet.cssText = manCss;
    } else {
      styleElement.appendChild(document.createTextNode(manCss));
    }
    
    // 将<style>元素添加到<head>标签中
    document.head.appendChild(styleElement);

    var pop_component = document.createElement('div');
    pop_component.innerHTML = mainHtml;
    document.body.appendChild(pop_component);
    
}


function addSubmitLinkBtn(assignmentId,redotimes){
    return;//关闭25.2.12
    try{
        let mHtml = `<button sync-click="$ctrl.clickFun()" ng-disabled="$ctrl.isDisabled" ng-class="[$ctrl.styles.cancel,$ctrl.styles[$ctrl.isDisabled?'disabled':'']]" style="height:30px;margin-left: 10px;" title="加入链接" class="ng-binding fe-components-xb-rest-btn-__cancel--GAK6A0SPZh0p3LOnXTukB" id="gcalc_addLink">
        <img ng-if="$ctrl.src" ng-class="$ctrl.styles.img" ng-src="//cdn.schoolis.cn/sis/release/student/fe_stu/fe_build/images/iconUpload.e12a6658cac5bd82cf3279f0edd086da.png" class="ng-scope fe-components-xb-rest-btn-__img--lETa8z2YkhgS2-Jzh69Al" 
        src="${chrome.runtime.getURL("icon.png")}"style="width: 19px;"> 加入链接
        </button>`
    
        querySelectorStable("xb-rest-btn.ng-scope.ng-isolate-scope button img.ng-scope.fe-components-xb-rest-btn-__img--lETa8z2YkhgS2-Jzh69Al").parentElement.parentElement.insertAdjacentHTML('beforeend', mHtml);
        document.getElementById("gcalc_addLink").onclick = function() {
            let link = prompt("【提交后将覆盖原有内容】\n老师端点击后将直接跳转\n请输入一个链接 (如：Canva共享链接):");
            if(!link.includes("http")) link = "http://" + link;
            if(link.length>3){
                let cont = prompt("输入补充说明(对应平台[内容]一栏)(可留空):");
                sendSeccesstip("任务已提交！");
                let sdata={link:link,id:assignmentId,cont:cont};
                send_comp_msg("submitLinkAssign",sdata,"1");
                if(window.location.href === "https://tsinglanstudent.schoolis.cn/Home#!/task/list/detail"){
                    queryAllByClassNames("ng-binding ng-scope fe-components-xb-location-__router--nsd2ZgXX2cpKLO-r5y7lv")[0].click();
                }
            }else{
                sendAlerttip("[操作已取消] 链接过短");
            }
            
        }
    }catch(e){
        if(redotimes<10){
            setTimeout(() => {
                addSubmitLinkBtn(assignmentId,redotimes+1);
            }, 10+redotimes*5);
        }else{
            return;
        }
    }
}




function addTeamsAssignmentsBigBtn() {
    const parent = queryAllByClassNames("fe-components-stu-app-task-list-__listItemBox--3elHWcZSeppt-hG2vNGaZz")[0];
    const bigBtn = document.createElement('span');
    bigBtn.innerHTML = `
        <div ng-class="styles.listItem" ng-repeat="item in $ctrl.fancyList" class="ng-scope fe-components-stu-app-task-list-__listItem--2LlZEXXtXjZzVCV4Ai9B6y">
			<task-list-item item-data="item" ng-click="$ctrl.action({urlRoute:'task.list.detail',taskID:item.taskId})" class="ng-isolate-scope"><div ng-class="[styles.item,isCN?'':styles.ENWord,itemData.itemID%4==0?styles.lastRight:'']" class="fe-components-stu-business-task-list-item-__item--M9uMyMIr3DamhKqgJxoqB fe-components-stu-business-task-list-item-__ENWord--3GngC7Z1JiIxFPkUjdb5qC">
	<div ng-class="styles.itemInner" class="fe-components-stu-business-task-list-item-__itemInner--3rHeqUplcuFbdElt1R0e_D">
		<div ng-class="styles.itemBox" class="fe-components-stu-business-task-list-item-__itemBox--3RO3Z0Qh77tpGykURW0nbs">
			<p ng-class="styles.title" xb-title="C3-exercises on data representation" class="ng-isolate-scope fe-components-stu-business-task-list-item-__title--2SiMfuAKOLyjFeTLGHhWkv"><ng-transclude>Teams Assignments</ng-transclude>
<!-- 多行文本可以用</br>进行换行 -->
<div ng-class="styles['bubble-tips']" ng-show="show" style="" class="ng-hide fe-components-directive-xb-title-__bubble-tips--1rVlv__7CL6h6fs0m5wLMm">
	<!-- ngRepeat: text in xbTitle.split('</br>') track by $index --><p ng-repeat="text in xbTitle.split('</br>') track by $index" style="" class="ng-binding ng-scope">C3-exercises on data representation</p><!-- end ngRepeat: text in xbTitle.split('</br>') track by $index -->
	<em ng-class="styles[isUp?'title-arrows-up':'title-arrows-down']" class="fe-components-directive-xb-title-__title-arrows-down--1OqcUAwVxF4Rv0iZgjyYvH"></em>
</div></p>
			<p ng-class="styles.subject" xb-title="A Level Math | Classwork or Homework" class="ng-isolate-scope fe-components-stu-business-task-list-item-__subject--3Ilm4uS0OvpOX4YfAp0RyP"><ng-transclude><!-- ngIf: itemData.scoreType==1 --><span ng-if="itemData.scoreType==1" class="ng-binding ng-scope">Account: peter.li_27@tsinglan.org</span><!-- end ngIf: itemData.scoreType==1 -->
			</ng-transclude>
<!-- 多行文本可以用</br>进行换行 -->
<div ng-class="styles['bubble-tips']" ng-show="show" style="" class="ng-hide fe-components-directive-xb-title-__bubble-tips--1rVlv__7CL6h6fs0m5wLMm">
	<!-- ngRepeat: text in xbTitle.split('</br>') track by $index --><p ng-repeat="text in xbTitle.split('</br>') track by $index" style="" class="ng-binding ng-scope">A Level Math | Classwork or Homework</p><!-- end ngRepeat: text in xbTitle.split('</br>') track by $index -->
	<em ng-class="styles[isUp?'title-arrows-up':'title-arrows-down']" class="fe-components-directive-xb-title-__title-arrows-down--1OqcUAwVxF4Rv0iZgjyYvH"></em>
</div></p>
			<p ng-class="styles.lineTime" class="ng-binding fe-components-stu-business-task-list-item-__lineTime--24Dzb2sTLB_PtFbti-_-0M">Unread Assignmets:</p>
		</div>
		<!-- ngIf: itemData.mode==0 --><div ng-if="itemData.mode==0" ng-class="styles.itemBottomBox" class="ng-scope fe-components-stu-business-task-list-item-__itemBottomBox--3KkNAr3IemPu4sYmM_w9uB">
			<!-- ngIf: !itemData.isCanContinueAnswer && !itemData.isExempt && (itemData.learningTaskState === StuTaskStates.UnSubmitted) && !itemData.isSynchroToMobiled --><div ng-if="!itemData.isCanContinueAnswer &amp;&amp; !itemData.isExempt &amp;&amp; (itemData.learningTaskState === StuTaskStates.UnSubmitted) &amp;&amp; !itemData.isSynchroToMobiled" ng-class="[styles.button,styles.startBtn]" class="ng-binding ng-scope fe-components-stu-business-task-list-item-__button--2LXhzjSSbQ4M7G3SvxBx7Y fe-components-stu-business-task-list-item-__startBtn--3ajgZgE1tFqsNNtfncmyd3">
				Read
			</div><!-- end ngIf: !itemData.isCanContinueAnswer && !itemData.isExempt && (itemData.learningTaskState === StuTaskStates.UnSubmitted) && !itemData.isSynchroToMobiled -->
			<!-- ngIf: !itemData.isCanContinueAnswer && !itemData.isExempt && (itemData.learningTaskState === StuTaskStates.Submitted) && !itemData.isSynchroToMobiled -->
			<!-- 新增可继续作答-->
			<!-- ngIf: itemData.isCanContinueAnswer && !itemData.isExempt -->
			<!-- ngIf: (itemData.learningTaskState === StuTaskStates.Corrected) || itemData.isSynchroToMobiled -->
		</div><!-- end ngIf: itemData.mode==0 -->
		<!-- ngIf: !itemData.isExempt && itemData.mode==1 -->
		<!-- ngIf: !itemData.isExempt --><div ng-if="!itemData.isExempt" ng-class="[styles.cornerMark, color]" class="ng-scope fe-components-stu-business-task-list-item-__cornerMark--1fyBZpOtSoxGFA1AKaUlT7 fe-components-stu-business-task-list-item-__cornerMarkGreay--3LLSEs43g4PG2VwGgsXUSp">
			<!-- ngIf: itemData.learningTaskState === StuTaskStates.UnSubmitted&&itemData.mode==0 --><span ng-if="itemData.learningTaskState === StuTaskStates.UnSubmitted&amp;&amp;itemData.mode==0" ng-class="isCN?'':styles.unSubmitted" class="ng-binding ng-scope fe-components-stu-business-task-list-item-__unSubmitted--141PEr1y5131N0Sod_pXB3">Unsubmitted</span><!-- end ngIf: itemData.learningTaskState === StuTaskStates.UnSubmitted&&itemData.mode==0 -->
			<!-- ngIf: itemData.learningTaskState === StuTaskStates.UnSubmitted&&itemData.mode==1 -->
			<!-- ngIf: itemData.learningTaskState === StuTaskStates.Submitted&&itemData.mode==0 -->
			<!-- ngIf: itemData.learningTaskState === StuTaskStates.Submitted&&itemData.mode==1 -->
			<!-- ngIf: itemData.learningTaskState === StuTaskStates.Corrected -->
			<!-- ngIf: itemData.learningTaskState === StuTaskStates.Correcting -->
		</div><!-- end ngIf: !itemData.isExempt -->
		<!-- <div ng-if="itemData.isExempt" ng-class="[styles.cornerMark, color]">
			<span ng-class="isCN?'':styles.corrected">{{$ctrl.exemptText}}</span>
		</div> -->
	</div>
</div>
</task-list-item>
		</div>
    `;
    bigBtn.style.display = 'inline-block';

    if (parent.children.length > 0) {
        parent.insertBefore(bigBtn, parent.children[0]);
    } else {
        parent.appendChild(bigBtn);
    }
}

function insertTeamsLogoLink() {
    return;
    if(document.getElementById("gcalcTeamsPageBtn")!=null){
        return;
    }

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', 'javascript:void(0)');
    linkElement.setAttribute('ng-click', '$ctrl.goThisPage($ctrl.totalPages)');
    linkElement.setAttribute('ng-class', '{true:$ctrl.styles.active,false:$ctrl.styles.item}[$ctrl.currentPage == $ctrl.totalPages]');
    linkElement.setAttribute('ng-if', '$ctrl.totalPages == 1 ? false : true');
    linkElement.className = 'ng-binding ng-scope fe-components-xb-pagination-__item--2TJMqEWoq3wUhD7RGTCUPA';
    linkElement.id = 'gcalcTeamsPageBtn'

    // 创建 <img> 元素
    const imgElement = document.createElement('img');
    imgElement.setAttribute('src', 'https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/Icon-Teams-28x281?resMode=sharp2&op_usm=1.5,0.65,15,0&qlt=100');
    imgElement.setAttribute('alt', 'Teams Logo');
    imgElement.style.marginTop = '5px';
    imgElement.style.width = '20px';
    imgElement.style.height = '20px';

    // 创建 <span> 元素
    const spanElement = document.createElement('span');
    spanElement.style.marginLeft = '5px';
    spanElement.style.position = 'relative';
    spanElement.style.top = '-3.8px';
    spanElement.style.paddingRight = '1px';
    spanElement.textContent = 'Teams任务'; // 设置文本内容

    // 将 <img> 和 <span> 添加到 <a> 中
    linkElement.appendChild(imgElement);
    linkElement.appendChild(spanElement);

    const parentElement = querySelectorStable('.fe-components-xb-pagination-__pageBox--3F71ymrSYtbCMwqmq90a4P');
    if (parentElement && parentElement.firstChild) {
        parentElement.insertBefore(linkElement, parentElement.firstChild); // 插入到第一个 child 前
        document.getElementById("gcalcTeamsPageBtn").addEventListener('click', function() {
            showDiyScoresBox("1", "11", "11","1",null);
        });
    }

    
}

function showTeamsAssignmentsBox(){

}



function handleHiddenScoreMessage(payload){
    if (payload && typeof payload === "object") {
        if (payload.state === "ready" || payload.state === "loading") {
            showFetchedAssignmentData_toPage_Box(payload,0);
            return;
        }

        if (payload.state === "done") {
            const parsedScore = Number(payload.score);
            const score = Number.isFinite(parsedScore) ? parsedScore : -1;
            showFetchedAssignmentData_toPage(score,0);
            return;
        }

        if (payload.state === "blocked") {
            showFetchedAssignmentData_toPage_Info(payload.message || tlang("无法计算隐藏成绩","Cannot calculate hidden score"), 0);
            return;
        }

        if (payload.state === "error") {
            showFetchedAssignmentData_toPage(-1,0);
            return;
        }
    }

    if (typeof payload === "number") {
        showFetchedAssignmentData_toPage(payload,0);
    }
}

function showFetchedAssignmentData_toPage_Info(message, redotimes = 0) {
    ensureHiddenScoreStyles();
    try {
        const iconUrl = chrome.runtime.getURL("res/icon.png");
        // 中性 info 配色 — 不用橙/红，避免暗示"出错"
        const rootClasses = `${HIDDEN_SCORE_SECTION_CLASS} fe-components-stu-app-task-detail-__middleItem--3UARKdlVHw_dUkgmWyvb0o fe-components-stu-app-task-detail-__allItem--2937HX4klXBd-XkSerQYvs gcalc-hiddenScoreSection gcalc-hiddenScoreSection--info`;
        const boxHtml = `<div id="middleItem" data-gcalc-hidden-score-container="1" ng-class="[styles.middleItem,styles.allItem]" class="${rootClasses}">
<p ng-class="styles.itemTitle" class="ng-binding fe-components-stu-app-task-detail-__itemTitle--XjtjPzbGMxENYjwBLXlxQ">任务成绩</p>
<div style="display:flex;flex-direction:column;align-items:center;padding-top:18px;padding-bottom:10px" ng-if="taskDetailInfo.scoreType==1" class="ng-scope">
    <div style="display:flex;align-items:center;background:#f4f5f7;color:#555;border:1px solid #e1e3e6;border-radius:6px;padding:10px 14px;max-width:320px;font-size:13px;line-height:1.5;">
        <img src="${iconUrl}" alt="Ico" style="height:20px;margin-right:8px;flex:0 0 auto;">
        <span class="gcalc-hiddenScoreHelper" style="color:#555;">${message}</span>
    </div>
</div>
</div>`;
        const anchor = queryAllByClassNames("fe-components-stu-app-task-detail-__scoreInfo--28FZIgd0wM_50-7QeEdEJy")[0];
        if (anchor && anchor.parentElement) {
            anchor.parentElement.innerHTML = boxHtml;
        }
    } catch (error) {
        if (redotimes < 10) {
            setTimeout(() => showFetchedAssignmentData_toPage_Info(message, redotimes + 1), redotimes * 20);
        }
    }
}


const HIDDEN_SCORE_SECTION_CLASS = "fe-components-stu-app-task-detail-__scoreInfo--28FZIgd0wM_50-7QeEdEJy";

function showFetchedAssignmentData_toPage_Box(payload, redotimes = 0){
    ensureHiddenScoreStyles();
    try {
        const assignment = payload?.assignment || {};
        const iconUrl = chrome.runtime.getURL("res/icon.png");
        const state = payload?.state || "ready";
        const isLoading = state === "loading";
        const canStart = Boolean(assignment.learningTaskId) && !isLoading;
        const buttonLabel = payload?.buttonLabel || (isLoading ? tlang("准备中...","Preparing...") : tlang("开始计算分数","Start Calculation"));
        const helperText = payload?.message || (isLoading ? tlang("Giaoculator 正在检测是否可以计算隐藏成绩","Giaoculator is checking whether this hidden score can be calculated") : tlang("Giaoculator 可尝试计算隐藏成绩","Giaoculator can attempt to fetch this hidden score"));
        const cursorStyle = canStart ? "pointer" : "not-allowed";
        const disabledAttr = canStart ? "" : "disabled";
        const buttonInner = isLoading ? `<span class="gcalc-hiddenScoreSpinner"></span>${buttonLabel}` : buttonLabel;
        const buttonClasses = `gcalc-hiddenScoreBtn${isLoading ? " gcalc-hiddenScoreBtn--loading" : ""}`;
        const sectionStateClass = isLoading ? "gcalc-hiddenScoreSection--loading" : "gcalc-hiddenScoreSection--ready";

        const rootClasses = `${HIDDEN_SCORE_SECTION_CLASS} fe-components-stu-app-task-detail-__middleItem--3UARKdlVHw_dUkgmWyvb0o fe-components-stu-app-task-detail-__allItem--2937HX4klXBd-XkSerQYvs gcalc-hiddenScoreSection ${sectionStateClass}`;
        
        const boxHtml = `<div id="middleItem" data-gcalc-hidden-score-container="1" ng-class="[styles.middleItem,styles.allItem]" class="${rootClasses}">
<p ng-class="styles.itemTitle" class="ng-binding fe-components-stu-app-task-detail-__itemTitle--XjtjPzbGMxENYjwBLXlxQ">任务成绩</p>

<div style="display: flex; flex-direction: column; align-items: center;padding-top:10px" ng-if="taskDetailInfo.scoreType==1" class="ng-scope">

        <button id="gcalc_hiddenScoreStartBtn" class="${buttonClasses}" ${disabledAttr} style="max-width: 180px;padding: 6px 18px;font-size: 14px;color: #fff;background-color: #5B8AF9;border: 1px #5B8AF9 solid;border-radius: 4px;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;cursor:${cursorStyle};">
            ${buttonInner}
        </button>

        <div ng-class="styles.itemClassInfo" style="display: flex; align-items: center; margin-top: 20px;">
            <img src="${iconUrl}" id="gcalc2ScoresIcon" alt="Ico" style="height: 24px; margin-right: 5px;">
            <p ng-class="styles.itemClassInfoShow" ng-if="taskDetailInfo.displayClassAvgScore" class="ng-binding ng-scope fe-components-stu-app-task-detail-__itemClassInfoShow--kHnYpBUlUdD919MkOWU83 gcalc-hiddenScoreHelper">${helperText}</p>
        </div>
    </div>
</div>`;
        console.log("showFetchedAssignmentData_toPage_Box", payload,helperText);
        queryAllByClassNames("fe-components-stu-app-task-detail-__scoreInfo--28FZIgd0wM_50-7QeEdEJy")[0].parentElement.innerHTML = boxHtml;

        const startBtn = document.getElementById("gcalc_hiddenScoreStartBtn");
        if (startBtn && canStart) {
            startBtn.addEventListener('click', () => {
                if (startBtn.dataset.loading === "1") {
                    return;
                }
                startBtn.dataset.loading = "1";
                startBtn.disabled = true;
                startBtn.classList.add("gcalc-hiddenScoreBtn--loading");
                startBtn.innerHTML = `<span class="gcalc-hiddenScoreSpinner"></span>${tlang("计算中...","Calculating...")}`;

                chrome.runtime.sendMessage({
                    type: "startHiddenScoreCalc",
                    learningTaskId: assignment.learningTaskId,
                    assignment
                });
            });
        }
    } catch (error) {
        setTimeout(() => {
            if (redotimes < 10) {
                showFetchedAssignmentData_toPage_Box(payload, redotimes + 1);
            }

        }, redotimes * 20);
    }
}


function showFetchedAssignmentData_toPage(score, redotimes = 0){
    //最终分数
    ensureHiddenScoreStyles();
    try {
            const displayScore = typeof score === "number" && score > -1 ? score : "";
        const resultRootClasses = `${HIDDEN_SCORE_SECTION_CLASS} gcalc-hiddenScoreResult gcalc-hiddenScoreSection`;
        const boxHtml = `<div ng-if="taskDetailInfo.mode==0" class="ng-scope">
        <!-- 成绩信息 -->
        <div id="middleItem" data-gcalc-hidden-score-container="1" style="opacity: 1;" ng-class="styles.scoreInfo" ng-show="taskDetailInfo.isSynchroToMobiled" class="${resultRootClasses}">
            <div ng-class="[styles.middleItem,styles.allItem]" class="fe-components-stu-app-task-detail-__middleItem--3UARKdlVHw_dUkgmWyvb0o fe-components-stu-app-task-detail-__allItem--2937HX4klXBd-XkSerQYvs">
                <p ng-class="styles.itemTitle" class="ng-binding fe-components-stu-app-task-detail-__itemTitle--XjtjPzbGMxENYjwBLXlxQ">任务成绩</p>

                <!-- ngIf: taskDetailInfo.scoreType==1 --><div style="text-align: center" ng-if="taskDetailInfo.scoreType==1" class="ng-scope">
                    <div ng-class="[styles.itemScore,taskDetailInfo.score!==null?'':styles.itemScoreNone]" class="ng-binding fe-components-stu-app-task-detail-__itemScore--3kcWQccf5Vmk4IDUredeP4" style="text-shadow: rgb(187, 255, 187) 0px 0px 10px;">
                        ${displayScore}
                    </div>
                    <div ng-class="styles.itemClassInfo" class="fe-components-stu-app-task-detail-__itemClassInfo--1tNCnybsWFHswNcl6p4fln">
                        <!-- ngIf: taskDetailInfo.displayClassAvgScore -->
                        <!-- ngIf: taskDetailInfo.displayClassMaxScore -->
                    <img src="${chrome.runtime.getURL("res/icon.png")}" id="gcalc2ScoresIcon" alt="Ico" style="vertical-align: middle; margin-right: 5px; height: 24px;"><p ng-class="styles.itemClassInfoShow" ng-if="taskDetailInfo.displayClassAvgScore" class="ng-binding ng-scope fe-components-stu-app-task-detail-__itemClassInfoShow--kHnYpBUlUdD919MkOWU83">${score>-1?tlang("&nbsp;&nbsp;Giaoculator 已计算该分数","&nbsp;&nbsp;Score Fetched from Server"):tlang("&nbsp;&nbsp;该科目总分暂未公布或有多个批改中数据，暂时无法计算该批改中项目","&nbsp;&nbsp;Total score for this subject has not been released or there are multiple items under review, so this item cannot be calculated currently.")}</p></div>
                </div><!-- end ngIf: taskDetailInfo.scoreType==1 -->
                <!-- 手动等级 -->
                <!-- ngIf: taskDetailInfo.scoreType==2 -->
            </div>
        </div>
        <!-- 教师点评 -->
        <!-- ngIf: taskDetailInfo.comment||(teacherCommentDocuments1.length !=0||teacherCommentDocuments2.length != 0) -->
    </div>`;
    queryAllByClassNames("fe-components-stu-app-task-detail-__scoreInfo--28FZIgd0wM_50-7QeEdEJy")[0].parentElement.innerHTML = boxHtml;
    } catch (error) {
        setTimeout(() => {
            if(redotimes<10){
                showFetchedAssignmentData_toPage(score,redotimes+1);
            }

        }, redotimes*20);
    }
   }



function ensureHiddenScoreStyles(){
    if (document.getElementById("gcalc-hiddenScore-style")) {
        return;
    }

    const style = document.createElement("style");
    style.id = "gcalc-hiddenScore-style";
    style.textContent = `
        .gcalc-hiddenScoreSection {
            animation: gcalc-hiddenScore-fadeIn .45s ease;
        }
        .gcalc-hiddenScoreSection--loading .gcalc-hiddenScoreHelper {
            color: #5B8AF9 !important;
        }
        .gcalc-hiddenScoreHelper {
            margin-left: 5px;
            margin-top: 0px;
            font-size: 12px;
            color: #5b5c61;
            text-align: center;
            line-height: 1.4;
        }
        .gcalc-hiddenScoreBtn {
            position: relative;
            overflow: hidden;
            transition: background-color .2s ease, opacity .2s ease;
        }
        .gcalc-hiddenScoreBtn--loading {
            opacity: .85;
            padding-left: 32px !important;
        }
        .gcalc-hiddenScoreSpinner {
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 2px solid rgba(255,255,255,0.6);
            border-top-color: #fff;
            border-radius: 50%;
            margin-right: 6px;
            animation: gcalc-hiddenScore-spin 0.9s linear infinite;
            vertical-align: middle;
        }
        @keyframes gcalc-hiddenScore-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes gcalc-hiddenScore-fadeIn {
            0% { opacity: 0; transform: translateY(6px); }
            100% { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
}

function ensureHiddenScoreBoxSkeleton(redotimes = 0) {
    try {
        if (document.querySelector('[data-gcalc-hidden-score-container="1"]') || document.getElementById("gcalc_hiddenScoreStartBtn")) {
            return;
        }
        showFetchedAssignmentData_toPage_Box({ state: "loading" }, redotimes);
    } catch (error) {
        if (redotimes < 5) {
            setTimeout(() => ensureHiddenScoreBoxSkeleton(redotimes + 1), 20 * (redotimes + 1));
        }
    }
}


function observeUrlChange(callbacks) {
    let currentUrl = window.location.href;
    const checkUrl = () => {
        const newUrl = window.location.href;
        if (newUrl !== currentUrl) {
            currentUrl = newUrl;
            Object.entries(callbacks).forEach(([url, func]) => {
                if (newUrl.includes(url)) func();
            });
        }
    };
    const observer = new MutationObserver(checkUrl);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", checkUrl);
    // Ensure hash-based routing also triggers observers (AngularJS/SPA routes)
    window.addEventListener("hashchange", checkUrl);
    ["pushState", "replaceState"].forEach(type => {
        const original = history[type];
        history[type] = function (...args) {
            original.apply(this, args);
            checkUrl();
        };
    });
    checkUrl();
}

function scoreToLevel(score) {
    const scoreMappingConfigs = [
        { displayName: "A+", minValue: 97, maxValue: 9999.9, isContainMin: true, isContainMax: true },
        { displayName: "A", minValue: 93, maxValue: 96.9999, isContainMin: true, isContainMax: true },
        { displayName: "A-", minValue: 90, maxValue: 92.9999, isContainMin: true, isContainMax: true },
        { displayName: "B+", minValue: 87, maxValue: 89.9999, isContainMin: true, isContainMax: true },
        { displayName: "B", minValue: 83, maxValue: 86.9999, isContainMin: true, isContainMax: true },
        { displayName: "B-", minValue: 80, maxValue: 82.9999, isContainMin: true, isContainMax: true },
        { displayName: "C+", minValue: 77, maxValue: 79.9999, isContainMin: true, isContainMax: true },
        { displayName: "C", minValue: 73, maxValue: 76.9999, isContainMin: true, isContainMax: true },
        { displayName: "C-", minValue: 70, maxValue: 72.9999, isContainMin: true, isContainMax: true },
        { displayName: "D+", minValue: 67, maxValue: 69.9999, isContainMin: true, isContainMax: true },
        { displayName: "D", minValue: 63, maxValue: 66.9999, isContainMin: true, isContainMax: true },
        { displayName: "D-", minValue: 60, maxValue: 62.9999, isContainMin: true, isContainMax: true },
        { displayName: "F", minValue: 0, maxValue: 59.9999, isContainMin: true, isContainMax: true }
    ];

    const numericScore = Number(score);
    
    for (const config of scoreMappingConfigs) {
        const { minValue, maxValue, isContainMin, isContainMax, displayName } = config;
        const lowerBound = isContainMin ? (numericScore >= minValue) : (numericScore > minValue);
        const upperBound = isContainMax ? (numericScore <= maxValue) : (numericScore < maxValue);
        
        if (lowerBound && upperBound) {
            return displayName;
        }
    }
    
    return ""; //Nan
}

function showGPABox_BuildItem(subjectName,subjectWeight,gpa,noweight_gpa,btn,clickId){
    let mainHtml = `<li ng-repeat="items in $ctrl.evaluationProjectList" class="ng-scope">
						<ul ng-class="commonStyles.clearFix" ng-click="toggleChildItem($index)" class="fe-shared-css-__clearFix--2bBfLqA_aK4d2nGdPWfQp">
							<li ng-class="[styles.scoreListItemLabel, styles.scoreListItemScoreWeight]" class="ng-binding fe-components-stu-app-realtime-list-__scoreListItemLabel--QNy_JUewV_q9IbUjEwFt_">
								${subjectName}
							</li>
							<li ng-class="[styles.scoreListItemWeight, styles.scoreListItemScoreWeight]" class="ng-binding fe-components-stu-app-realtime-list-__scoreListItemWeight--1ts22xvRGDfAVRWKPcE8lO">
								${subjectWeight}
							</li>
							<li ng-class="[styles.scoreListItemScore, styles.scoreListItemScoreWeight]" class="fe-components-stu-app-realtime-list-__scoreListItemScore--lkSMDUgc9xblZBcZfKry6">
								<span class="ng-binding">${gpa} / ${noweight_gpa}</span>
								<!-- ngIf: items.evaluationProjectList.length>0 && items.showChild -->
								<!-- ngIf: items.evaluationProjectList.length>0 && !items.showChild -->
								<!-- ngIf: items.evaluationProjectList.length==0&&items.learningTaskAndExamList.length --><a id="gpabox${clickId}" ng-click="$ctrl.checkProjectDetail(items)" ng-if="items.evaluationProjectList.length==0&amp;&amp;items.learningTaskAndExamList.length" ng-class="styles.projectDetail" class="ng-binding ng-scope fe-components-stu-app-realtime-list-__projectDetail--14CZMywvVSz8N3pzPn3gXq">${btn}</a><!-- end ngIf: items.evaluationProjectList.length==0&&items.learningTaskAndExamList.length -->
							</li>
						</ul>
						<!-- ngRepeat: ele in items.evaluationProjectList -->
					</li>`
    return mainHtml;
}

async function checktitleElementExistence() {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            resolve(false); // 5秒超时，仍然放行，但返回 false 表示超时
        }, 5000); // 5秒超时

        const intervalId = setInterval(() => {
            let element = queryAllByClassNames("ng-binding fe-components-stu-app-realtime-list-__modelTitle--8I6j6U9niNNfZsIj8855i")[0];
            if (element && element.innerText) {
                clearTimeout(timeoutId);
                clearInterval(intervalId);
                resolve(true); // 找到了元素，立即放行并返回 true
            }
        }, 10); // 每 100 毫秒检查一次
    });
}


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function recordLoginUser() {
    try {
        const span = querySelectorStable(".ng-binding.fe-components-stu-business-topbar-profile-__textName--3bSZuorZJGVJm0wDSYFp_B");
        if (!span) {
            console.error("User info span not found");
            return;
        }
        const newInfo = span.innerHTML;

     
        let localData = await getFromChromeStorage("lastLoginUser");

        if (!localData || localData.lastLoginUser !== newInfo) {
            const updatedData = {
                lastLoginUser: newInfo,
                lastLoginUser2: localData ? localData.lastLoginUser : null
            };
            await saveToChromeStorage("lastLoginUser", updatedData);
        }
    } catch (e) {
        console.error("Error in recordLoginUser:", e);
    }
    return;
    //暂未完成
    MSData = await getFromChromeStorage("MSUserProfile");
    if(MSData.state===1&&MSData.xbAccount===querySelectorStable(".ng-binding.fe-components-stu-business-topbar-profile-__textName--3bSZuorZJGVJm0wDSYFp_B").innerHTML){
        sendSeccesstip("账号正确可以使用");
        send_comp_msg("StartMSFeature",null,null);
    }else{
        sendErrortip("账号不正确或未登录"+MSData.xbAccount+querySelectorStable(".ng-binding.fe-components-stu-business-topbar-profile-__textName--3bSZuorZJGVJm0wDSYFp_B").innerHTML);
        return;
    }
}

async function showGPABox(){
    await checktitleElementExistence();
        
    const smsId = await getIdBySemester(queryAllByClassNames("fe-components-xb-pull-btn-__input--3TWoIfVMNo-eszvg3cnXCa")[0].value);
    chrome.storage.local.get("gpaList"+smsId,function(tmp){
        let gpaList = tmp["gpaList"+smsId];
        console.log(gpaList);
        chrome.storage.local.get("gpa"+smsId,function(data){
            console.log(data);
            let gpa = formatNumber(data["gpa"+smsId].gpa,2);
            let noweight_gpa = formatNumber(data["gpa"+smsId].noweight_gpa,2);
            let schoolis_gpa = data["gpa"+smsId].schoolisGPA;
            
            

            queryAllByClassNames("ng-binding fe-components-stu-app-realtime-list-__modelTitle--8I6j6U9niNNfZsIj8855i")[0].innerText=tlang("GPA计算详细","GPA Calculation Details");
            queryAllByClassNames("ng-binding fe-components-stu-app-realtime-list-__gradeName--2NKfjy7pw11NCA7ZnBb5Fs")[0].innerText=queryAllByClassNames("fe-components-xb-pull-btn-__input--3TWoIfVMNo-eszvg3cnXCa")[0].value;
            queryAllByClassNames("ng-binding fe-components-stu-app-realtime-list-__gradeName--2NKfjy7pw11NCA7ZnBb5Fs")[0].style.paddingBottom="30px";


            queryAllByClassNames("fe-components-stu-app-realtime-list-__scoreListItem--3G2orCiXa-n9QRjw05Ii8f fe-shared-css-__clearFix--2mg8N64gHXU6X_nBPlhIaB")[0].children[0].innerText=tlang("学科","Subject");
            queryAllByClassNames("fe-components-stu-app-realtime-list-__scoreListItem--3G2orCiXa-n9QRjw05Ii8f fe-shared-css-__clearFix--2mg8N64gHXU6X_nBPlhIaB")[0].children[2].innerText=tlang("GPA / 未加权GPA","GPA / Unweighted GPA");
            let sublineA = queryAllByClassNames("fe-components-stu-app-realtime-list-__basicInfoItem--1GJykgXpYfsz2zE3hh9vsL")[0];
            let sublineB = queryAllByClassNames("fe-components-stu-app-realtime-list-__basicInfoItem--1GJykgXpYfsz2zE3hh9vsL")[2];
            let bigScore = document.getElementsByClassName("ng-binding fe-components-stu-app-realtime-list-__score--3U_eJ7HbMjTKZkN2XLzX3S")[0];

            bigScore.innerText=schoolis_gpa?schoolis_gpa:gpa;
            bigScore.style.marginTop="-12px";

            let bigScoreSubtitle = `<p ng-class="styles.basicInfoItem" class="fe-components-stu-app-realtime-list-__basicInfoItem--2mLNqht5xhMaGuOPL1rAei">
						<span class="ng-binding"> </span><span ng-class="styles.basicInfoItemValue" id="gcalc_gpaSubtitle" class="ng-binding fe-components-stu-app-realtime-list-__basicInfoItemValue--3Zx2X_CcFbD3XBxLp_NeFt" style="display: block; text-align: center;">${schoolis_gpa?tlang("加权后GPA（校宝）","WeightedGPA"):tlang("加权后GPA（计算）","WeightedGPA(Calced)")}</span>
					</p>`;

            bigScore.insertAdjacentHTML('afterend', bigScoreSubtitle);

            if(schoolis_gpa){
                sublineA.children[0].innerText=" ";
                sublineB.children[0].innerText=" ";
                sublineA.children[1].innerText=tlang("加权后GPA（计算）：","Calced GPA：")+gpa;
                sublineB.children[1].innerText=tlang("未加权GPA（计算）：","Calced Unweighted GPA：")+noweight_gpa;
            }else{
                sublineA.children[0].innerText=" ";
                sublineB.children[1].innerText=" ";
                sublineA.children[1].innerText=tlang("未加权GPA（计算）：","Calced Unweighted GPA：")+noweight_gpa;
                sublineB.children[0].innerText=tlang("加权后GPA（校宝系统）：无数据","SchoolisGPA：No Data");
            }


            const originalItem = queryAllByClassNames("fe-components-stu-app-realtime-list-__scoreListItem--3G2orCiXa-n9QRjw05Ii8f fe-shared-css-__clearFix--2mg8N64gHXU6X_nBPlhIaB")[1];
            if (originalItem) {
                while (originalItem.firstChild) {
                    originalItem.removeChild(originalItem.firstChild);
                }
            }

            gpaList.sort((a, b) => {
                if (a.weight !== b.weight) {
                    return a.weight - b.weight;
                }
                if (b.gpa !== a.gpa) {
                    return b.gpa - a.gpa;
                }
                return a.subjectName.localeCompare(b.subjectName); 
            });
            
            
            gpaList.forEach((item) => {
                if(item.gpa!=-1){
                    originalItem.insertAdjacentHTML('beforeend', showGPABox_BuildItem(
                        item.subjectName,
                        formatNumber(item.weight, 1),
                        formatNumber(item.gpa, 2),
                        formatNumber((item.gpa > 0 ? (item.gpa - (item.isWeighted ? 0.5 : 0)) : (item.gpa)), 2),
                        item.subjectName==="Chinese Culture"?tlang("详细", "Details"):tlang("", ""),
                        item.subjectName==="Chinese Culture"?"chi":""
                        
                    ));
                    if(item.subjectName==="Chinese Culture"){
                        document.getElementById("gpaboxchi").onclick = function() {
                            sendInfotip(tlang(`
                                <div style="color: white; font-size: 11px;">
        <p style="margin-bottom: 2px; margin-top: 2px;"><strong>中国文化成绩取决于语文和历史两个学科</strong></p>
        <p style="margin-bottom: 2px; margin-top: 2px;">【语文】 · 占比：66.6% · 得分：${item.chiAdditionalData.chinese}</p>
        <p style="margin-bottom: 2px; margin-top: 2px;">【历史】 · 占比：33.3% · 得分：${item.chiAdditionalData.history}</p>
        <p style="margin-bottom: 2px; margin-top: 2px;">【科目总分】${(item.chiAdditionalData.history*0.3333+item.chiAdditionalData.chinese*0.6666).toFixed(1)} 【GPA】${item.gpa}</p>
        `,`<div style="color: white; font-size: 11px;">
    <p style="margin-bottom: 2px; margin-top: 2px;"><strong>Chinese Culture Score Depends on Two Subjects: Chinese Language and History</strong></p>
    <p style="margin-bottom: 2px; margin-top: 2px;">【Chinese】 · Weight: 66.6% · Score: ${item.chiAdditionalData.chinese}</p>
    <p style="margin-bottom: 2px; margin-top: 2px;">【History】 · Weight: 33.3% · Score: ${item.chiAdditionalData.history}</p>
    <p style="margin-bottom: 2px; margin-top: 2px;">【Total Subject Score】${(item.chiAdditionalData.history*0.3333+item.chiAdditionalData.chinese*0.6666).toFixed(1)} 【GPA】${item.gpa}</p>
</div>`))
                        }
                    }
                }
                
            });
        
        
        
            //e.g: subline.children[0].innertext  (0:Grey,1:Black)
        });
    });
   

}

function readAndCombineLongStringFromChromeStorage(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (items) => { // 获取所有存储的数据
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
  
        let longString = "";
        for (let i = 0; ; i++) {
          const chunkKey = `${key}_${i}`;
          const chunk = items[chunkKey];
          if (chunk === undefined) {
            break; // 所有分段都已读取完毕
          }
          longString += chunk;
        }
  
        resolve(longString);
      });
    });
  }

function formatNumber(number, decimalPlaces) {
    number = parseFloat(number);
    const formatted = Number(parseFloat(number.toFixed(decimalPlaces)));
    return String(formatted);
}
function curretSchool() {
    const hostname = window.location.hostname; 
    if (hostname.endsWith("schoolis.cn")) { 
      const schoolName = hostname.split(".")[0];
      return schoolName;
    } else {
      return null; 
    }
  }

function generateId() {
    const startYear = new Date(2025, 0, 1).getTime(); 
    const timestamp = Date.now() - startYear; 
    const random = Math.floor(Math.random() * 1000);
    return timestamp * 1000 + random; 
}


function matchSubjectToGoal(smsId) {
    //25.8.30暂时关闭
    return;
    let subjectName = queryAllByClassNames("ng-binding fe-components-stu-app-realtime-list-__gradeName--2NKfjy7pw11NCA7ZnBb5Fs")[0].innerText;
    getFromChromeStorage(`${smsId}|${usr}|Goals`, function (goals) {
        if(goals==null||goals.subjectName==null){
            return;
        }else{
            let goalScore = goals.subjectName;
            let scoreElement = querySelectorStable(".ng-binding.fe-components-stu-app-realtime-list-__score--1e6GrTtGfRHkKF-12OE_J3");
        
            scoreElement.style.marginTop = "-15px";
        
            let goalElementHTML = `
                <span 
                    ng-class="styles.basicInfoItemValue" 
                    id="gcalc_gpaSubtitle" 
                    class="ng-binding fe-components-stu-app-realtime-list-__basicInfoItemValue--3Zx2X_CcFbD3XBxLp_NeFt" 
                    style="display: block; text-align: center;"
                >
                    ${tlang("目标分：", "Goal：")}${formatNumber(goalScore, 1)}<br>
                </span>
            `;
        
            scoreElement.insertAdjacentHTML("afterend", goalElementHTML);
        }
    });
    
}
function saveGoals(smsId){
    let goalsToSave;
    let goals=[{goalScore:99,subjectName:"Chinese II"},{goalScore:80,subjectName:"English II"}];
    for(let i=0;i<goals.length;i++){
        let goalScore = goals[i].goalScore;
        let subjectName = goals[i].subjectName;
    }
    let usrName=queryAllByClassNames("ng-binding fe-components-stu-business-topbar-profile-__textTip--2HOWBFmZQ5JVEZskM6Xjuh")[0].innerText;
    saveToChromeStorage
}

function insertCountdownBanner() {
    console.log("insertCountdownBanner");
    if (document.getElementById('gc_countdownBanner') || document.getElementById('countdown')) return;
    const now = new Date();
    // JS month is 0-based: 5 means June.
    const deadline = new Date(Date.UTC(2026, 5, 10, 6, 0, 0)); 
    if (now >= deadline) return;
    const banner = document.createElement('div');
    banner.id = 'gc_countdownBanner';
    banner.style.cssText = 'position: relative;left: -20px;width: 102.2%;background: #FD9900;color: white;text-align: center;font-size: 13px;font-weight: bold;padding: 1px 5px;z-index: 1;box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 4px;display: flex;justify-content: space-between;align-items: center;';

    const content = document.createElement('div');
    content.innerHTML = '⏳ 距离 G9-G11 S2学期成绩提交截止还有 <span id="countdown">加载中...</span>';
    banner.appendChild(content);

    const closeBtn = document.createElement('span');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'cursor:pointer;padding-left:10px;padding-right:30px;font-size:18px;';
    closeBtn.onclick = () => banner.remove();
    banner.appendChild(closeBtn);

    queryAllByClassNames("fe-components-stu-business-topbar-__navBar--2Au2lL_QIAwQu9fN70vAd4")[0].appendChild(banner);

    function updateCountdown() {
        const now = new Date();
        const diff = deadline.getTime() - now.getTime();
        if (diff <= 0) {
        document.getElementById('countdown').innerText = '已开始！';
        clearInterval(timer);
        return;
        }
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);
        try {
        document.getElementById('countdown').innerText = `${d}天 ${h}小时 ${m}分 ${s}秒`;
        } catch (error) {}
    }

    const timer = setInterval(updateCountdown, 1000);
    updateCountdown();
}


function updateTeamsReauthBadge(visible) {
    const badge = document.getElementById("gc_teamsReauthBadge");
    if (badge) badge.style.display = visible ? "inline-block" : "none";
}

function showTeamsMainPannelBtn(){
    if(document.getElementById("gc_teamsMainBtn")) return;
    const reauthBadgeHtml = `<span id="gc_teamsReauthBadge" title="${tlang('授权过期，点击重新授权','Authorization expired — click to re-authorize')}" style="display:none;width:14px;height:14px;line-height:14px;border-radius:50%;background:#ff8c00;color:#fff;font-size:11px;font-weight:bold;text-align:center;margin-left:4px;vertical-align:middle;font-family:Arial,sans-serif;">!</span>`;
    const btnHtml = `<span class="ng-scope fe-modules-task-__examTabItem--308Eb5U31Pt_Y24rocyVZU" id="gc_teamsMainBtn">
        <stu-arc-button ng-click=" " text=" " is-current=" " class=" "><button ng-class=" " style=" margin-right: 10px; " class="${findHashedClass("fe-components-stu-common-stu-arc-button-__arcbtn") || "fe-components-stu-common-stu-arc-button-__arcbtn"}">
    <span class="ng-binding"><img src="https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/Icon-Teams-28x281?resMode=sharp2&op_usm=1.5,0.65,15,0&qlt=100" style="height: 1em; vertical-align: middle; margin-right: 4px;margin-top:-3px">${tlang(" Teams 面板","Teams Organizer")}${reauthBadgeHtml}</span>
</button></stu-arc-button>
    </span>`;

    const parentElement = gcGetTaskTabBar();
    if (parentElement) {
        parentElement.insertAdjacentHTML('afterbegin', btnHtml);
        // 初始读取 reauth 状态来决定 badge 可见性，并监听后续变化（只注册一次，避免重复插入按钮时叠加监听）
        getFromChromeStorage("MS_ReauthRequired").then(v => updateTeamsReauthBadge(v === true));
        if (!window.gcReauthBadgeWatcherBound) {
            window.gcReauthBadgeWatcherBound = true;
            try {
                chrome.storage.onChanged.addListener((changes, area) => {
                    if (area === "local" && changes.MS_ReauthRequired) {
                        updateTeamsReauthBadge(changes.MS_ReauthRequired.newValue === true);
                    }
                });
            } catch (e) {}
        }
        setTimeout(() => {
            const teamsBtn = document.getElementById("gc_teamsMainBtn");
            if (!teamsBtn) return;
            teamsBtn.addEventListener('click', async function() {
                try {
                    const [enabled, profile, refreshToken, panelNeedInit, reauthRequired] = await Promise.all([
                        getFromChromeStorage("MSFeatureEnabled"),
                        getFromChromeStorage("MSUserProfile"),
                        getFromChromeStorage("MSrefresh_token"),
                        getFromChromeStorage("MS_PanelNeedInit"),
                        getFromChromeStorage("MS_ReauthRequired")
                    ]);

                    const hasRefreshToken = typeof refreshToken === 'string' ? refreshToken.length > 0 : !!refreshToken;

                    // 最高优先级：reauth 状态下任何点击都直接触发重新授权 + 告知性提示
                    if (reauthRequired === true) {
                        sendInfotipLong(tlang(
                            "授权过期，已打开窗口进行重新授权。您可查看是否有弹出窗口，并也许需要手动操作。",
                            "Authorization expired. A re-authorization window has been opened. Please check for a popup — you may need to complete it manually."
                        ));
                        try { chrome.runtime.sendMessage({ type: 'bindMSAccount', xbAccount: 'Rebind' }); } catch (e) {}
                        return;
                    }

                    if (enabled) {
                        const now = Date.now();
                        const lastOpenRaw = await getFromChromeStorage("MSPanelLastopen");
                        const lastOpenTs = typeof lastOpenRaw === 'number' ? lastOpenRaw : Number(lastOpenRaw);
                        const shouldRefresh = !lastOpenTs || Number.isNaN(lastOpenTs) || (now - lastOpenTs > 20 * 60 * 1000);

                        await saveToChromeStorage("MSPanelLastopen", now);

                        if (panelNeedInit) {
                            sendAlerttip(tlang("正在初始化Teams数据，请稍候...","Initializing Teams data, please wait..."));
                            try { chrome.runtime.sendMessage({ type: 'bp-forceInitMS' }); } catch (e) {}
                        }

                        if (shouldRefresh) {
                            sendAlerttip(tlang("正在刷新Teams任务，请稍候...","Refreshing Teams assignments, please wait..."));
                            try { chrome.runtime.sendMessage({ type: 'bp-refreshTeamsTask' }); } catch (e) {}
                        }

                        switchToTeamsPanel({ showRefreshing: !!(shouldRefresh || panelNeedInit) });

                        setTimeout(() => {
                            if (profile?.showGuide) {
                                createPopup(8, {
                                    title: tlang("Teams Organizer入门：在Outlook®APP中查看课表和提醒","Getting Started with Teams Organizer: View Schedule and Reminders in Outlook® APP"),
                                    images: ['https://x19.fp.ps.netease.com/file/68fe4597c4cdd10497fcea41ZYWVsWzo06','https://x19.fp.ps.netease.com/file/68fe45aa7e5097add65b0e28q7m4cHKa06','https://x19.fp.ps.netease.com/file/68fe45c173a867596657f0d3Y16tEhek06','https://x19.fp.ps.netease.com/file/68fe4ac9b9670ef5ddd86eb0QYaC9S5E06'],
                                    text:[tlang("同步的日程会出现在对应Teams账号中","Synced schedules will appear in the corresponding Teams account"),tlang("如需添加小组件 下载Outlook® APP并登录","Download Outlook® APP and login to use small widgets"),tlang("可添加Outlook小组件在桌面或锁屏界面","Add Outlook widgets to desktop or lock screen"),tlang("无需手动操作：登录校宝，系统自动同步","Auto Sync: Login Schoolis , Sync as Schedule")]
                                });
                                saveToChromeStorage("MSUserProfile", { ...profile, showGuide: false });
                            }
                        }, 1800);
                    } else {
                        if (hasRefreshToken && !reauthRequired) {
                            sendAlerttip(tlang("正在加载Teams数据，请稍候...","Loading Teams data, please wait..."));
                            try { chrome.runtime.sendMessage({ type: 'bp-forceInitMS' }); } catch (e) {}
                        } else {
                            const popupConfig = {
                                title: tlang("绑定账号以启用Teams Organizer功能","Bind an account to enable Teams Organizer"),
                                images: ['https://x19.fp.ps.netease.com/file/68fe341456088707e6f82b31zzKy9veD06','https://x19.fp.ps.netease.com/file/68fe3b3136c8122042a30633BZiX4j0H06','https://x19.fp.ps.netease.com/file/68fe42052f2abaeb78cad4cd6gABb28K06'],
                                text:[tlang("查看Teams平台任务","View Teams platform assignments"),tlang("在Outlook®APP中查看课表和提醒","View schedule and reminders in Outlook® APP"),tlang("同步课程表和DDL到日历","Sync schedule and assignment DDLs to calendar")]
                            };
                            try {
                                createPopup(1, popupConfig);
                            } catch (e) {
                                createPopup(1, popupConfig);
                            }
                        }
                    }
                } catch (error) {
                    console.error('[TeamsPanel] Failed to handle panel button click', error);
                }
            });
        }, 50);
    }

}

// ===== Teams 面板：打开 / 关闭 =====
// 旧实现用 innerHTML 直接覆盖任务列表 DOM，切回时只能靠「模拟点击顶栏第一个模块按钮」
// 来强制整页重载；顶栏顺序一变（我的任务不再是第一个）就会跳到我的测评。
// 新实现把原始 DOM 节点整体摘下来保存（Angular 的 scope / watcher 仍绑在这些节点上），
// 需要切回时原样挂回，既不依赖按钮下标，也不需要重新加载页面。
const GC_TEAMS_PANEL_ROOT_ID = 'gc_teamsPanelRoot';
const GC_ARC_BTN_PREFIX = 'fe-components-stu-common-stu-arc-button-__arcbtn';
const GC_TAB_ITEM_PREFIX = 'fe-modules-task-__examTabItem';

const gcTeamsPanelState = {
    active: false,
    container: null,
    savedNodes: null,
    tabBar: null,
    accountHintElem: null,
    globalHandlersBound: false
};

function gcGetTaskTabBar() {
    return querySelectorStable('.ng-scope.fe-modules-task-__examTab--1ZAmHzjYqG3fNys7mmzbQs')
        || document.querySelector('[class*="fe-modules-task-__examTab--"]');
}

function gcGetTaskMainContainer() {
    return queryAllByClassNames('fe-components-stu-common-stu-main-__main--1MX7Alx64kpykyOSL7AbFM')[0]
        || document.querySelector('stu-main [class*="fe-components-stu-common-stu-main-__main--"]')
        || document.querySelector('[class*="fe-components-stu-common-stu-main-__main--"]');
}

function gcGetTeamsTabButton() {
    const wrap = document.getElementById('gc_teamsMainBtn');
    return wrap ? wrap.querySelector('button') : null;
}

// 除 Teams 按钮以外的所有 tab 按钮（任务列表 / 任务统计 …），按集合处理不依赖下标
function gcGetOtherTabButtons() {
    const tabBar = gcGetTaskTabBar();
    if (!tabBar) return [];
    const teamsWrap = document.getElementById('gc_teamsMainBtn');
    return Array.from(tabBar.querySelectorAll(`button[class*="${GC_ARC_BTN_PREFIX}"]`))
        .filter(btn => !(teamsWrap && teamsWrap.contains(btn)));
}

function gcHighlightTeamsTab(active) {
    const applyStyle = (btn, styles) => {
        if (!btn) return;
        if (active) {
            if (btn.dataset.gcOriginalStyle === undefined) {
                btn.dataset.gcOriginalStyle = btn.style.cssText;
            }
            Object.assign(btn.style, styles);
        } else if (btn.dataset.gcOriginalStyle !== undefined) {
            btn.style.cssText = btn.dataset.gcOriginalStyle;
            delete btn.dataset.gcOriginalStyle;
        }
    };

    applyStyle(gcGetTeamsTabButton(), { backgroundColor: '#5B8AF9', color: '#FFF', borderColor: '#5B8AF9' });
    gcGetOtherTabButtons().forEach(btn => {
        applyStyle(btn, { backgroundColor: '#FFF', borderColor: '#EDEDED', color: '#737373' });
    });
}

function gcIsTeamsPanelOpen() {
    return gcTeamsPanelState.active
        && !!gcTeamsPanelState.container
        && gcTeamsPanelState.container.isConnected
        && !!document.getElementById(GC_TEAMS_PANEL_ROOT_ID);
}

// 点击 tab 栏里任何非 Teams 的按钮时先把原始 DOM 挂回去，再让 Angular 的 ng-click 正常执行：
// 「任务列表」= 当前 state（Angular 不会重渲染）→ 靠恢复的 DOM 显示；
// 「任务统计」= 切换 state → Angular 自己重建视图。
function gcOnTabBarClickCapture(event) {
    if (!gcTeamsPanelState.active) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const teamsWrap = document.getElementById('gc_teamsMainBtn');
    if (teamsWrap && teamsWrap.contains(target)) return;
    const hitTab = target.closest(`[class*="${GC_ARC_BTN_PREFIX}"]`) || target.closest(`[class*="${GC_TAB_ITEM_PREFIX}"]`);
    if (!hitTab) return;
    gcRestoreTaskListView('tab-click');
}

function gcOnHashChangeWhilePanelOpen() {
    if (gcTeamsPanelState.active) {
        // 路由变化后 Angular 会重建视图，保存的节点已失效，直接丢弃状态
        gcMarkTeamsPanelDetached('hashchange');
    }
}

function gcBindTeamsPanelGlobalHandlers() {
    if (!gcTeamsPanelState.globalHandlersBound) {
        window.addEventListener('hashchange', gcOnHashChangeWhilePanelOpen);
        gcTeamsPanelState.globalHandlersBound = true;
    }
    const tabBar = gcGetTaskTabBar();
    if (tabBar && gcTeamsPanelState.tabBar !== tabBar) {
        if (gcTeamsPanelState.tabBar) {
            gcTeamsPanelState.tabBar.removeEventListener('click', gcOnTabBarClickCapture, true);
        }
        tabBar.addEventListener('click', gcOnTabBarClickCapture, true);
        gcTeamsPanelState.tabBar = tabBar;
    }
}

function gcRestoreBoundAccountHint() {
    const elem = gcTeamsPanelState.accountHintElem;
    gcTeamsPanelState.accountHintElem = null;
    if (!elem || elem.dataset.gcOriginalHtml === undefined) return;
    try {
        elem.innerHTML = elem.dataset.gcOriginalHtml;
    } catch (e) {}
    delete elem.dataset.gcOriginalHtml;
}

// 面板所在视图已被 Angular 销毁 / 路由已切走：只清状态，不尝试恢复 DOM
function gcMarkTeamsPanelDetached(reason) {
    if (!gcTeamsPanelState.active) return;
    console.log('[TeamsPanel] 面板状态失效：', reason);
    gcTeamsPanelState.active = false;
    gcTeamsPanelState.container = null;
    gcTeamsPanelState.savedNodes = null;
    gcTeamsPanelState.accountHintElem = null;
    gcHighlightTeamsTab(false);
}

function gcRestoreTaskListView(reason) {
    if (!gcTeamsPanelState.active) return false;
    const container = gcTeamsPanelState.container;
    const savedNodes = gcTeamsPanelState.savedNodes;
    gcTeamsPanelState.active = false;
    gcTeamsPanelState.container = null;
    gcTeamsPanelState.savedNodes = null;
    gcHighlightTeamsTab(false);
    console.log('[TeamsPanel] 关闭面板并恢复任务列表：', reason);

    if (!container || !container.isConnected || !savedNodes) {
        // 容器已经被 Angular 重建，无需（也无法）恢复
        gcTeamsPanelState.accountHintElem = null;
        return false;
    }

    try {
        const panelRoot = container.querySelector('#' + GC_TEAMS_PANEL_ROOT_ID);
        if (panelRoot) panelRoot.remove();
        while (container.firstChild) container.removeChild(container.firstChild);
        container.appendChild(savedNodes);
        gcRestoreBoundAccountHint();
        return true;
    } catch (error) {
        console.error('[TeamsPanel] 恢复任务列表失败，回退为重新加载页面', error);
        gcTeamsPanelState.accountHintElem = null;
        try { window.location.reload(); } catch (e) {}
        return false;
    }
}

function gcMarkPanelRefreshing(shouldShow) {
    if (!shouldShow) return;
    try {
        if (typeof window.gcStartRefreshUI === 'function') window.gcStartRefreshUI();
    } catch (e) {}
}

function switchToTeamsPanel(options = {}) {
    const teamsBtnWrap = document.getElementById('gc_teamsMainBtn');
    if (!teamsBtnWrap) {
        console.warn('[TeamsPanel] 未找到 Teams 按钮，取消打开面板');
        return;
    }
    const mainContainer = gcGetTaskMainContainer();
    if (!mainContainer) {
        console.warn('[TeamsPanel] 未找到任务列表容器，取消打开面板');
        return;
    }

    // 已经打开：只重新填充数据，不重复替换 DOM（否则会把面板自身存成 savedNodes）
    if (gcIsTeamsPanelOpen() && gcTeamsPanelState.container === mainContainer) {
        gcHighlightTeamsTab(true);
        getFromChromeStorage('MSTasks').then(tasks => {
            startTeamsPanel(tasks || []);
            gcMarkPanelRefreshing(options.showRefreshing);
        });
        return;
    }

    // 若状态残留但 DOM 已被重建，先清掉旧状态
    if (gcTeamsPanelState.active) {
        gcMarkTeamsPanelDetached('reopen');
    }

    gcHighlightTeamsTab(true);

    // 绑定账号提示（分页栏「共 N 条」的位置），关闭面板时会还原
    const accountHintElem = queryAllByClassNames('ng-binding fe-components-xb-pagination-__total--3M1T46bD50G4qol-v9NA8i')[0] || null;
    if (accountHintElem) {
        if (accountHintElem.dataset.gcOriginalHtml === undefined) {
            accountHintElem.dataset.gcOriginalHtml = accountHintElem.innerHTML;
        }
        gcTeamsPanelState.accountHintElem = accountHintElem;
        getFromChromeStorage('MSUserProfile').then(profile => {
            // 该元素若随任务列表一起被摘下（分页栏属于任务列表），就跳过，不做无意义的写入
            if (!gcTeamsPanelState.active || !accountHintElem.isConnected || !profile || !profile.email) return;
            accountHintElem.innerHTML = `${tlang("绑定的Teams账号：","Binded Teams Account:")}
            <span ng-class=" $ctrl.styles.text" class="ng-binding ${findHashedClass("fe-components-xb-pagination-__text") || "fe-components-xb-pagination-__text--17ymRnzQ0Vej98kzhssEk-"}">${profile.email}</span>`;
        }).catch(error => console.warn('[TeamsPanel] 读取绑定账号失败', error));
    }

    // 摘下原始节点（保留引用，Angular 绑定不受影响）
    const savedNodes = document.createDocumentFragment();
    while (mainContainer.firstChild) {
        savedNodes.appendChild(mainContainer.firstChild);
    }

    const panelRoot = document.createElement('div');
    panelRoot.id = GC_TEAMS_PANEL_ROOT_ID;
    mainContainer.appendChild(panelRoot);

    gcTeamsPanelState.active = true;
    gcTeamsPanelState.container = mainContainer;
    gcTeamsPanelState.savedNodes = savedNodes;
    gcBindTeamsPanelGlobalHandlers();

    fetch(chrome.runtime.getURL('teamsPanel.html'))
        .then(response => response.text())
        .then(html => {
            if (!gcTeamsPanelState.active || !panelRoot.isConnected) return false;
            panelRoot.innerHTML = html;
            const s1 = document.getElementById("gb_teamsPanel_s1_header");
            if (s1 && s1.children[0]) s1.children[0].innerText = tlang("任务列表","Teams Assignments");
            const s2 = document.getElementById("gb_teamsPanel_s2_header");
            if (s2 && s2.children[0]) s2.children[0].innerText = tlang("日程同步","Calender Sync");
            const logo = document.getElementById("teamsGCLogo");
            if (logo) logo.src = chrome.runtime.getURL("res/iconBig_teamsAcc.png");
            return getFromChromeStorage("MSTasks");
        })
        .then(tasks => {
            if (tasks === false) return; // 面板已被关闭 / 视图已重建
            startTeamsPanel(tasks || []);
            // 打开面板时若同时触发了后台刷新，这里让刷新图标转起来，
            // 等 MS_finishedAssignmentGet 回来重绘列表时自动停止
            gcMarkPanelRefreshing(options.showRefreshing);
        })
        .catch(error => {
            console.error('[TeamsPanel] 面板加载失败', error);
            gcRestoreTaskListView('load-failed');
        });
}
async function updateSyncPanels(panelId){ 
    // 面板未渲染（例如后台同步消息先到）时直接跳过，避免访问不存在的节点报错
    if (!document.getElementById(`sync${panelId}Title`)) return;
    let lastSyncData = null;
    let syncCont = null;
    switch(panelId){
        case 1:
            document.getElementById("sync1Spinner")?.remove()
            document.getElementById("sync1Title").innerHTML = `<span class="sync-status status-active" ></span>` + tlang("课程表同步","Schedule Sync");
            lastSyncData = await getFromChromeStorage("MS_LastSync_Calender")
            syncCont = "sync1Content"
            break;
        case 2:
            document.getElementById("sync2Spinner")?.remove()
            document.getElementById("sync2Title").innerHTML = `<span class="sync-status status-active" ></span>` + tlang("Teams任务同步","Teams Task Sync");
            lastSyncData = await getFromChromeStorage("MS_LastSync_TeamsTask")
            syncCont = "sync2Content"
            break;
        case 3:
            document.getElementById("sync3Spinner")?.remove()
            document.getElementById("sync3Title").innerHTML = `<span class="sync-status status-active" ></span>` + tlang("校宝任务同步","Xiaobao Task Sync");
            lastSyncData = await getFromChromeStorage("MS_LastSync_XBTask")
            syncCont = "sync3Content"
            break;
        case 4:
            document.getElementById("sync4Title").innerText = "📃 问题及建议反馈"
            document.getElementById("sync4Content").innerText = tlang("反馈问题或许愿新功能~","Feedback Issues or Wish for New Features~");
            document.getElementById("sync4Content").style.cursor = "pointer";
    }
    if (lastSyncData==null){
        const emptyElem = syncCont ? document.getElementById(syncCont) : null;
        if (emptyElem) emptyElem.innerText = tlang("未同步","Not Synced");
        return;
    }
    let sync1Tip = tlang("上次同步时间：","Last Sync Time:") +
        (lastSyncData.lastSyncTime
            ? (() => {
                const resolvedDate = ensureSchoolisDate(lastSyncData.lastSyncTime);
                if (!resolvedDate) {
                    return lastSyncData.lastSyncTime;
                }
                const d = new Date(resolvedDate.getTime());
                let yyyy = d.getFullYear();
                let mm = String(d.getMonth() + 1).padStart(2, '0');
                let dd = String(d.getDate()).padStart(2, '0');
                let hh = String(d.getHours()).padStart(2, '0');
                let min = String(d.getMinutes()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}(${hh}:${min})`;
            })()
            : ""
        );
    const syncContElem = syncCont ? document.getElementById(syncCont) : null;
    if (syncContElem) syncContElem.innerText = sync1Tip;
}

function formatISOString(isoString) {
    const date = ensureSchoolisDate(isoString);
    if (!date) {
        return '';
    }
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
function startTeamsPanel(tasks){
    tasks = Array.isArray(tasks) ? tasks : [];
    console.log("startTeamsPanel",tasks);
    // 面板没打开时（例如后台刷新完成的消息先到）不渲染，等下次打开面板再从存储读取
    if (!document.getElementById('assignmentsList')) {
        console.log("[TeamsPanel] 面板未渲染，跳过本次列表刷新");
        return;
    }
    let assignmentsData = [];
    
    setTimeout(() => {
        updateSyncPanels(4);    
        updateSyncPanels(3);    
        updateSyncPanels(2);
        updateSyncPanels(1);
    }, 30);


    for (const task of tasks) {
            assignmentsData.push({
                id: task.id,
                title: task.typeName,
                description: task.content,
                className: task.subjectName,
                dueDate: formatISOString(task.endTime),
                assignedDate: formatISOString(task.beginTime),
                IgnoredState: task.IgnoredState,
                status: (task.status == "submitted" || task.status == "returned") ? "inactive" :(task.IgnoredState == 1) ? "inactive" : "pending",
                submissionState: task.status,
                priority: (task.status == "submitted" || task.status == "returned") ? "ignored" : (task.IgnoredState == 1) ? "ignored" : "high",
                published: formatISOString(task.beginTime),
                webUrl: task.webUrl,
                state: (task.status == "submitted" || task.status == "returned") ? 0 : (task.IgnoredState == 1) ? -1 : 1
            });
    }


    console.log("Assignments Data:", assignmentsData);

    console.log("Assignments Data:", assignmentsData);

    // Keep a reference to the current assignments list
    let currentAssignments = [...assignmentsData];

    // Format date to display
    function formatDate(dateString) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        const date = ensureSchoolisDate(dateString);
        return date ? date.toLocaleDateString(undefined, options) : '';
    }

    function formatShortDate(dateString) {
        const options = { month: 'short', day: 'numeric' };
        const date = ensureSchoolisDate(dateString);
        return date ? date.toLocaleDateString(undefined, options) : '';
    }

    function formatDateTime(dateString) {
        const date = ensureSchoolisDate(dateString);
        if (!date) return '';
        const now = new Date();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        const timeDiff = date.getTime() - now.getTime();
        const hoursRemaining = Math.ceil(timeDiff / (1000 * 60 * 60));
        
        if (timeDiff < 0) {
            return tlang(`已于${month}-${day}截止`,`Due at ${month}-${day}(PastDue)`);
        } else {
            return tlang(`将于${month}-${day}截止(剩余${hoursRemaining}h)`,`Due at ${month}-${day}(${hoursRemaining}h Remaining)`);
        }
    }

    // Sort assignments
    function sortAssignments(sortBy) {
        console.log("Sorting by:", sortBy);
        // Sort the assignments
        currentAssignments.sort((a, b) => {
            if (a.state !== b.state) {
                return b.state - a.state;
            }
            if (sortBy === 'due') {
                return compareSchoolisDates(a.dueDate, b.dueDate);
            } else if (sortBy === 'published') {
                return compareSchoolisDates(b.published, a.published);
            }
            return 0;
        });

        // Repopulate the list
        repopulateAssignments();
    }

    // Repopulate assignments list
    function repopulateAssignments() {
        const assignmentsList = document.getElementById('assignmentsList');
        assignmentsList.innerHTML = '';

        // If we are refreshing, stop the refresh UI when the list is being displayed
        try {
            if (window.gcTeamsRefreshing && typeof window.gcStopRefreshUI === 'function') {
                window.gcStopRefreshUI();
            }
        } catch (e) {}

        // Empty-state when no assignments
        if (!currentAssignments || currentAssignments.length === 0) {
            try { ensureTeamsPanelStyles?.(); ensureMaterialSymbols?.(); } catch (e) {}
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.innerHTML = `
                <span class="material-symbols-outlined">list_alt_check</span>
                <div>${tlang('暂未在Teams中找到布置的作业！', 'No homework found in Teams platform')}</div>
                <a id="gcEmptyRefreshLink">${tlang('点击刷新', 'Click to refresh')}</a>
            `;
            assignmentsList.appendChild(empty);
            const link = document.getElementById('gcEmptyRefreshLink');
            if (link) {
                link.addEventListener('click', () => {
                    try { if (typeof window.gcStartRefreshUI === 'function') window.gcStartRefreshUI(); } catch (e) {}
                    try { chrome.runtime.sendMessage({ type: 'bp-refreshTeamsTask' }); } catch (e) {}
                });
            }
            return;
        }

        currentAssignments.forEach((assignment, index) => {
            const item = document.createElement('div');
            const isIgnored = assignment.priority === 'ignored';
            const submissionState = assignment.submissionState;
            item.className = `assignment-item${isIgnored ? ' ignored' : ''}`;
            item.setAttribute('data-id', assignment.id);
            
            // Set animation delay for staggered effect - ensure all items animate properly
            item.style.animation = `staggerFade 0.6s ease-out forwards`;
            item.style.animationDelay = `${0.1 + index * 0.05}s`;
            
            // Add animated class after animation completes for ignored items
            if (isIgnored) {
                setTimeout(() => {
                    item.classList.add('animated');
                }, (0.1 + index * 0.05) * 1000 + 600);
            }
            
            const priorityClass = assignment.priority.toLowerCase();
            const statusColor = assignment.status;
            let dueDateText = ""
            if (isIgnored) {
                if(submissionState == "submitted") {
                    dueDateText = tlang("已提交", "SUBMITTED");
                }else if(submissionState == "returned") {
                    dueDateText = tlang("已退回", "RETURNED");

                } else {
                    dueDateText = tlang("已忽略", "IGNORED");
                }
            } else {
                dueDateText = formatDateTime(assignment.dueDate);
            }
            const dueDateObject = ensureSchoolisDate(assignment.dueDate);
            const isPastDue = !isIgnored && dueDateObject && dueDateObject.getTime() < Date.now();
            
            item.innerHTML = `
                <span class="status ${statusColor}"></span>
                <span class="title ${isIgnored ? 'ignored' : ''}">${assignment.title.length > 45 ? assignment.title.slice(0, 45) + '...' : assignment.title }</span>
                <span class="class-name-tag ${isIgnored ? 'ignored' : ''}">${assignment.className.slice(2, assignment.className.length-10) + '..'}</span>
                <span class="spacer"></span>
                <span class="due-date ${isIgnored ? 'ignored' : ''} ${isPastDue ? 'past-due' : ''}">${dueDateText}</span>
            `;
            
            item.addEventListener('click', () => showAssignmentModal(assignment));
            
            assignmentsList.appendChild(item);
        });
    }
    let currentAssignment = null;
    // Show assignment modal
    function showAssignmentModal(assignment) {
        let submissionStateText = '';
        let submissionStateColor = '';
        const assignmentDueDate = ensureSchoolisDate(assignment.dueDate);
        if (assignmentDueDate && assignmentDueDate < new Date() && (assignment.submissionState !== 'submitted' && assignment.submissionState !== 'returned')) {
            assignment.submissionState = 'late';
        }
        switch (assignment.submissionState.toUpperCase()) {
            case 'LATE':
                submissionStateText = "💦" + tlang("过期未提交", "PAST DUE");
                submissionStateColor = '#FF5733';
                break;
            case 'SUBMITTED':
                submissionStateText = "🎉" + tlang("已提交", "SUBMITTED")
                submissionStateColor = '#4CAF50';
                break;
            case 'UNSUBMITTED':
                submissionStateText = "☝️" + tlang("未提交", "NOT SUBMITTED");
                submissionStateColor = '#F44336';
                break;
            case 'RETURNED':
                submissionStateText = "🔍" + tlang("已退回", "RETURNED");
                submissionStateColor = '#2196F3';
                break;
            default:
                submissionStateText = assignment.submissionState.toUpperCase();
                submissionStateColor = '#2196F3';
        }
        currentAssignment = assignment;
        // Set modal content
        document.getElementById('modalTitle').textContent = assignment.title;
        document.getElementById('modalDescription').innerHTML = assignment.description;
        document.getElementById('modalClass').textContent = assignment.className;
        document.getElementById('modalState').textContent = submissionStateText;
        document.getElementsByClassName("state-tag")[0].style.backgroundColor = submissionStateColor;
        document.getElementById('modalDueDate').textContent = formatDate(assignment.dueDate);
        document.getElementById('modalAssignedDate').textContent = formatDate(assignment.assignedDate);
        document.getElementById('goToTeamsBtn').setAttribute('data-url', assignment.webUrl);
        
        // Show modal
        document.getElementById('assignmentModal').classList.add('active');
        document.getElementById('goToTeamsBtn').innerText = tlang("在Teams中查看","See in Teams");
        document.getElementById('ignoreBtn').innerText = currentAssignment.IgnoredState == 1 ? tlang("取消忽略","Unignore Assignment") : tlang("忽略此任务","Ignore Assignment");
        document.getElementById('gc-langset-duedate').innerText = tlang("截止日期","Due Date");
        document.getElementById('gc-langset-assigneddate').innerText = tlang("分配日期","Assigned Date");
        if(assignment.submissionState == "submitted" || assignment.submissionState == "returned") {
            document.getElementById('ignoreBtn').style.display = 'none';
        }else{
            document.getElementById('ignoreBtn').style.display = 'block';
        }
        if(currentAssignment.IgnoredState == 1) {
            document.getElementById('ignoreBtn').style.backgroundColor = '#2ecc71';
        }else{
            document.getElementById('ignoreBtn').style.backgroundColor = '#e74c3c';
        }

        // Wire the ignore/unignore handler after currentAssignment is set
        const ignoreBtn = document.getElementById('ignoreBtn');
        ignoreBtn.onclick = null;
        ignoreBtn.onclick = currentAssignment.IgnoredState == 1 ? unIgnoreAssignment : ignoreAssignment;

        // Prevent background scrolling
        document.body.style.overflow = 'hidden';
    }

    // Hide assignment modal
    function hideAssignmentModal() {
        document.getElementById('assignmentModal').classList.remove('active');
        document.body.style.overflow = '';
    }

    //INIT////////////////////////////////////////

    
    // Initial population
    getFromChromeStorage("MSFeature_AssignmentDisplay_Sort").then(sort => {
        if(sort == null) sort = 'published';
        saveToChromeStorage("MSFeature_AssignmentDisplay_Sort", sort);
        document.getElementsByClassName("sort-btn")[0].innerText = !(sort == 'published') ? tlang('当前排序：即将截止靠前', 'Sort: Deadline First') : tlang('当前排序：新发布的靠前', 'Sort: Newer Tasks First');
        sortAssignments(sort);
    });
    
    
    
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            getFromChromeStorage("MSFeature_AssignmentDisplay_Sort").then(sort => {
                let sortBy = sort;
                sortBy = sortBy == 'published' ? 'due' : 'published';
                btn.textContent = !(sortBy == 'published') ? tlang('当前排序：即将截止靠前', 'Sort: Deadline First') : tlang('当前排序：新发布的靠前', 'Sort: Newer Tasks First');
                sortAssignments(sortBy);
                saveToChromeStorage("MSFeature_AssignmentDisplay_Sort", sortBy);
            });
        });
    });
    // Inject Material icons, styles, and sorting/refresh controls
    function ensureMaterialSymbols() {
        const ids = [
            'gc-mat-symbols-base',
            'gc-mat-icon-clock',
            'gc-mat-icon-cached',
            'gc-mat-icon-list'
        ];
        const hrefs = [
            'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined',
            'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=clock_arrow_down',
            'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=cached',
            'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=list_alt_check'
        ];
        ids.forEach((id, idx) => {
            if (!document.getElementById(id)) {
                const link = document.createElement('link');
                link.id = id;
                link.rel = 'stylesheet';
                link.href = hrefs[idx];
                try { document.head.appendChild(link); } catch (e) {}
            }
        });
        try {
            if (document.fonts && document.fonts.load) {
                document.fonts.load("24px 'Material Symbols Outlined Local'");
            }
        } catch (e) {}
    }
    function ensureTeamsPanelStyles() {
        if (document.getElementById('gc-teams-panel-icons-style')) return;
        const style = document.createElement('style');
        style.id = 'gc-teams-panel-icons-style';
        const localFontUrl = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) ? chrome.runtime.getURL('res/fonts/MaterialSymbolsOutlined.ttf') : '';
        const localFontFace = localFontUrl ? `@font-face { font-family: 'Material Symbols Outlined Local'; font-style: normal; font-weight: 400; src: url('${localFontUrl}') format('truetype'); font-display: swap; }` : '';
        style.textContent = `
            ${localFontFace}
            .sort-controls { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
            .icon-btn { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; border: 1px solid #dee2e6; background-color: #f8f9fa; color: #333; cursor: pointer; transition: background-color .2s ease, transform .1s ease; user-select: none; }
            .icon-btn:hover { background-color: #e9ecef; }
            .icon-btn:active { transform: scale(0.96); }
            .material-symbols-outlined { font-family: 'Material Symbols Outlined Local', 'Material Symbols Outlined', 'Material Icons Outlined', sans-serif; font-weight: normal; font-style: normal; font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; font-size: 22px; line-height: 1; display: inline-block; letter-spacing: normal; text-transform: none; -webkit-font-smoothing: antialiased; }
            /* Refresh spin + active color */
            @keyframes gc-rotate { 0%{transform: rotate(0deg);} 100%{transform: rotate(360deg);} }
            .icon-btn.gc-rotating .material-symbols-outlined { animation: gc-rotate 1s linear infinite; }
            .icon-btn.gc-refresh-active { color: #3498db; border-color: #3498db; background-color: #eef6ff; }
            .icon-btn[data-tooltip]::after { content: attr(data-tooltip); position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); background: rgba(0,0,0,.85); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 12px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity .15s ease; }
            .icon-btn[data-tooltip]::before { content: ''; position: absolute; bottom: calc(100% + 2px); left: 50%; transform: translateX(-50%); border-width: 6px 6px 0 6px; border-style: solid; border-color: rgba(0,0,0,.85) transparent transparent transparent; opacity: 0; transition: opacity .15s ease; }
            .icon-btn:hover::after, .icon-btn:hover::before { opacity: 1; }
            .assignments-list .empty-state { height: 380px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #6c757d; }
            .assignments-list .empty-state .material-symbols-outlined { font-size: 72px; color: #9aa0a6; }
            .assignments-list .empty-state a { color: #1e88e5; text-decoration: underline; cursor: pointer; }
        `;
        try { document.head.appendChild(style); } catch (e) {}
    }
    function updateSortIconUI(currentSort) {
        const iconWrap = document.getElementById('gcSortToggleIcon');
        if (!iconWrap) return;
        const isPublished = currentSort === 'published';
        iconWrap.style.color = isPublished ? '#3498db' : '#333';
        iconWrap.setAttribute('data-tooltip', isPublished ? tlang('当前排序：新发布的靠前', 'Sort: Newer Tasks First') : tlang('当前排序：即将截止靠前', 'Sort: Deadline First'));
    }
    (function initSortAndRefreshIcons() {
        try { ensureMaterialSymbols(); ensureTeamsPanelStyles(); } catch (e) {}
        const sc = document.querySelector('.sort-controls');
        if (!sc) return;
        const oldBtn = sc.querySelector('.sort-btn');
        if (oldBtn) { oldBtn.style.display = 'none'; }
        if (!document.getElementById('gcSortToggleIcon')) {
            const sortDiv = document.createElement('div');
            sortDiv.id = 'gcSortToggleIcon';
            sortDiv.className = 'icon-btn';
            sortDiv.setAttribute('data-tooltip', 'Sort');
            sortDiv.innerHTML = '<span class="material-symbols-outlined">clock_arrow_down</span>';
            sc.appendChild(sortDiv);
        }
        if (!document.getElementById('gcRefreshIcon')) {
            const refDiv = document.createElement('div');
            refDiv.id = 'gcRefreshIcon';
            refDiv.className = 'icon-btn';
            refDiv.setAttribute('data-tooltip', tlang('刷新', 'Refresh'));
            refDiv.innerHTML = '<span class="material-symbols-outlined">cached</span>';
            sc.appendChild(refDiv);
        }
        getFromChromeStorage('MSFeature_AssignmentDisplay_Sort').then(sort => {
            let current = sort == null ? 'published' : sort;
            saveToChromeStorage('MSFeature_AssignmentDisplay_Sort', current);
            updateSortIconUI(current);
            sortAssignments(current);
        });
        function startRefreshUI(){
            const wrap = document.getElementById('gcRefreshIcon');
            if (!wrap) return;
            window.gcTeamsRefreshing = true;
            wrap.classList.add('gc-refresh-active','gc-rotating');
            wrap.style.pointerEvents = 'none';
        }
        function stopRefreshUI(){
            const wrap = document.getElementById('gcRefreshIcon');
            if (!wrap) return;
            wrap.classList.remove('gc-rotating','gc-refresh-active');
            wrap.style.pointerEvents = '';
            window.gcTeamsRefreshing = false;
        }

        const sortIcon = document.getElementById('gcSortToggleIcon');
        if (sortIcon && !sortIcon._wired) {
            sortIcon.addEventListener('click', () => {
                getFromChromeStorage('MSFeature_AssignmentDisplay_Sort').then(sort => {
                    const next = sort === 'published' ? 'due' : 'published';
                    updateSortIconUI(next);
                    sortAssignments(next);
                    saveToChromeStorage('MSFeature_AssignmentDisplay_Sort', next);
                });
            });
            sortIcon._wired = true;
        }
        const refreshIcon = document.getElementById('gcRefreshIcon');
        if (refreshIcon && !refreshIcon._wired) {
            refreshIcon.addEventListener('click', () => {
                startRefreshUI();
                try { chrome.runtime.sendMessage({ type: 'bp-refreshTeamsTask' }); } catch (e) {}
            });
            refreshIcon._wired = true;
        }
        // Expose stop/start to repopulate handler via closures
        window.gcStartRefreshUI = startRefreshUI;
        window.gcStopRefreshUI = stopRefreshUI;
    })();

    function addSyncBoxListener(id, popupType) {
        const box = document.getElementById(id);
        if (!box) return;
        if (!box._syncListenerAdded) {
            box.addEventListener('click', function() {
                createPopup(popupType, {text: "aaa"});
            });
            box._syncListenerAdded = true;
        }
    }
    addSyncBoxListener("sync-box-1", 4);
    addSyncBoxListener("sync-box-2", 5);
    addSyncBoxListener("sync-box-3", 6);
    addSyncBoxListener("sync-box-4", 7);
    document.querySelectorAll('.sync-box:not(.coming-soon):not(#sync-box-1):not(#sync-box-2)').forEach(box => {
        box.addEventListener('click', function() {
            return;

            const status = this.querySelector('.sync-status');
            if (status.classList.contains('status-active')) {
                status.classList.remove('status-active');
                status.classList.add('status-inactive');
                this.querySelector('p').textContent = 'Status: Paused';
                
                // Add visual feedback
                this.style.borderLeft = '4px solid #e74c3c';
                setTimeout(() => {
                    this.style.borderLeft = '';
                }, 500);
            } else {
                status.classList.remove('status-inactive');
                status.classList.add('status-active');
                this.querySelector('p').textContent = 'Status: Connected';
                
                // Add visual feedback
                this.style.borderLeft = '4px solid #2ecc71';
                setTimeout(() => {
                    this.style.borderLeft = '';
                }, 500);
            }
        });
    });
    
    // Modal event listeners
    document.getElementById('closeModal').addEventListener('click', hideAssignmentModal);

    async function unIgnoreAssignment() {
        const userChoice = await showConfirmationPopup({
            text: tlang(
                "您确定要取消忽略此任务吗？",
                "Are you sure you want to unignore this assignment?"
            )
        });
        if (userChoice === 'okay') {
            hideAssignmentModal();
            getFromChromeStorage("MSTasks").then(tasks => {
                tasks.forEach(task => {
                    if (task.typeName+task.subjectName === currentAssignment.title+currentAssignment.className) {
                        task.IgnoredState = 0;
                    }
                });
                saveToChromeStorage("MSTasks", tasks);
                startTeamsPanel(tasks); 
            });
            
        }
    }
    async function ignoreAssignment() {
        const userChoice = await showConfirmationPopup({
        text: tlang(
            "您确定要忽略此任务吗？忽略后该项目将标注为已忽略，适用于无需提交或不再需要完成的任务。",
            "Are you sure you want to ignore this assignment? Ignored assignments will be marked as such and are suitable for tasks that do not require submission or are no longer needed."
        )
        });

        if (userChoice === 'okay') {
            hideAssignmentModal();
            getFromChromeStorage("MSTasks").then(tasks => {
                tasks.forEach(task => {
                    if (task.typeName+task.subjectName === currentAssignment.title+currentAssignment.className) {
                        task.IgnoredState = 1;
                    }
                });
                saveToChromeStorage("MSTasks", tasks);
                startTeamsPanel(tasks); 
            });
                
        } else {
            console.log("User clicked DISCARD or closed the popup.");
            // Add your logic for the 'discard' case here
        }
        
    }
    
    document.getElementById('goToTeamsBtn').addEventListener('click', function() {
        const url = this.getAttribute('data-url');
        if (url) {
            window.open(url, '_blank');
        }
        hideAssignmentModal();
    });
    
    // Close modal when clicking outside
    document.getElementById('assignmentModal').addEventListener('click', function(e) {
        if (e.target === this) {
            hideAssignmentModal();
        }
    });
    
    // Close with escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideAssignmentModal();
            
        }
    });
    

}
function createPopup(type, data = {}) {
    // Inject CSS
    const styleId = 'popup-styles';
    if (!document.getElementById(styleId)) {
        fetch(chrome.runtime.getURL('res/inwindow-popup.css'))
            .then(response => response.text())
            .then(css => {
                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = css;
                document.head.appendChild(style);
            });
    }

    // Create popup structure
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = (type === 4 || type === 5 || type === 6) ? 'custom-modal settings-modal' : 'custom-modal';
    
    const header = document.createElement('div');
    header.className = 'custom-modal-header';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'custom-close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.id = 'gc-popup-discard';
    closeBtn.onclick = () => removePopup(overlay);

    header.appendChild(closeBtn);
    modal.appendChild(header);

    function ensurePopupCarouselStyles() {
        if (document.getElementById('gc-popup-carousel-style')) return;
        const style = document.createElement('style');
        style.id = 'gc-popup-carousel-style';
        const localFontUrl = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
            ? chrome.runtime.getURL('res/fonts/MaterialSymbolsOutlined.ttf')
            : '';
        style.textContent = `
            ${localFontUrl ? `@font-face { font-family: 'Material Symbols Outlined Local'; font-style: normal; font-weight: 400; src: url('${localFontUrl}') format('truetype'); font-display: swap; }` : ''}
            .gc-carousel { position: relative; overflow: hidden; }
            .gc-carousel .gc-carousel-arrow { color: #fff; background: rgba(0,0,0,0.45); transition: background-color .28s ease, box-shadow .28s ease, transform .28s ease; z-index: 3; }
            .gc-carousel .gc-carousel-arrow:hover { background: rgba(59,130,246,0.78); box-shadow: 0 12px 28px rgba(37,99,235,0.32); transform: translateY(-50%) scale(1.08); }
            .gc-carousel .gc-carousel-arrow:focus-visible { outline: 0; box-shadow: 0 0 0 3px rgba(59,130,246,0.4); }
            .gc-carousel .gc-carousel-arrow.gc-press { animation: gc-carousel-press .42s ease; }
            .gc-carousel .gc-carousel-arrow .gc-carousel-icon { font-family: 'Material Symbols Outlined Local', 'Material Symbols Outlined', 'Material Icons Outlined', sans-serif; font-weight: normal; font-style: normal; font-size: 26px; line-height: 1; letter-spacing: normal; pointer-events: none; font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; display: inline-flex; align-items: center; justify-content: center; }
            .gc-carousel .gc-img-wrap { position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; transition: transform .45s ease; }
            .gc-carousel .gc-carousel-image { transition: transform .45s ease, opacity .45s ease; }
            .gc-carousel:hover .gc-img-wrap { transform: scale(1.02); }
            .gc-carousel .gc-carousel-image.gc-slide-from-left { animation: gc-carousel-slide-in-left .45s ease both; }
            .gc-carousel .gc-carousel-image.gc-slide-from-right { animation: gc-carousel-slide-in-right .45s ease both; }
            .gc-carousel .gc-carousel-caption { position: absolute; bottom: 5px; left: 50%; transform: translate(-50%, 0); padding: 6px 14px; border-radius: 999px; background: rgba(17,25,40,0.35); color: #fff; font-size: 0.95rem; line-height: 1.25; pointer-events: none; display: none; max-width: calc(100% - 56px); box-shadow: 0 1px 18px rgba(15,23,42,0.14); backdrop-filter: blur(6px); }
            .gc-carousel .gc-carousel-caption.gc-caption-show { display: inline-flex; justify-content: center; text-align: center; }
            .gc-carousel .gc-carousel-caption.gc-caption-left { animation: gc-carousel-caption-left .38s ease both; }
            .gc-carousel .gc-carousel-caption.gc-caption-right { animation: gc-carousel-caption-right .38s ease both; }
            .gc-carousel-dots { gap: 6px; }
            .gc-carousel-dots .gc-carousel-dot { width: 9px; height: 9px; border-radius: 999px; background: rgba(255,255,255,0.65); display: inline-block; cursor: pointer; transition: transform .28s ease, background-color .28s ease; }
            .gc-carousel-dots .gc-carousel-dot.active { background: #2563eb; transform: scale(1.2); }
            @keyframes gc-carousel-slide-in-left { from { opacity: 0; transform: translateX(-18px) scale(.98); } to { opacity: 1; transform: translateX(0) scale(1); } }
            @keyframes gc-carousel-slide-in-right { from { opacity: 0; transform: translateX(18px) scale(.98); } to { opacity: 1; transform: translateX(0) scale(1); } }
            @keyframes gc-carousel-caption-left { from { opacity: 0; transform: translate(-58%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
            @keyframes gc-carousel-caption-right { from { opacity: 0; transform: translate(-42%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
            @keyframes gc-carousel-press { 0% { transform: translateY(-50%) scale(1); } 50% { transform: translateY(-50%) scale(0.94); } 100% { transform: translateY(-50%) scale(1); } }
        `;
        try { document.head.appendChild(style); } catch (e) {}
    }

    function setupPopupCarousel(container, config = {}) {
        ensurePopupCarouselStyles();
        if (!container) return;
        const images = Array.isArray(config.images) ? config.images : [];
        const texts = Array.isArray(config.texts) ? config.texts : [];
        let idx = typeof config.initialIndex === 'number' ? Math.max(0, Math.min(config.initialIndex, images.length ? images.length - 1 : 0)) : 0;
        const imgEl = container.querySelector('.gc-carousel-image');
        const emptyEl = container.querySelector('.gc-carousel-empty');
        const leftBtn = container.querySelector('.gc-left');
        const rightBtn = container.querySelector('.gc-right');
        const captionEl = container.querySelector('.gc-carousel-caption') || (() => {
            const caption = document.createElement('div');
            caption.className = 'gc-carousel-caption';
            container.appendChild(caption);
            return caption;
        })();

        (function ensureEnhancedImage() {
            if (!imgEl) return;
            if (!container.querySelector('.gc-img-wrap')) {
                const wrap = document.createElement('div');
                wrap.className = 'gc-img-wrap';
                wrap.style.cssText = 'position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%;';
                imgEl.parentNode.insertBefore(wrap, imgEl);
              
                wrap.appendChild(imgEl);
            }
        })();

  

        if (imgEl) {
            imgEl.addEventListener('animationend', (event) => {
                if (event.animationName === 'gc-carousel-slide-in-left' || event.animationName === 'gc-carousel-slide-in-right') {
                    imgEl.classList.remove('gc-slide-from-left', 'gc-slide-from-right', 'gc-sliding');
                }
            });
        }

        function animateButton(btn) {
            if (!btn) return;
            btn.classList.remove('gc-press');
            void btn.offsetWidth;
            btn.classList.add('gc-press');
        }

        function update(direction) {
            const hasImages = images.length > 0;
            if (imgEl) {
                imgEl.style.display = hasImages ? 'block' : 'none';
            }
            if (emptyEl) {
                emptyEl.style.display = hasImages ? 'none' : 'block';
            }
            if (!hasImages) {
                if (imgEl) imgEl.removeAttribute('src');
      
                if (captionEl) captionEl.style.display = 'none';
                if (leftBtn) leftBtn.style.display = 'none';
                if (rightBtn) rightBtn.style.display = 'none';
                return;
            }

            const src = images[idx];
            if (imgEl) {
                if (direction) {
                    imgEl.classList.remove('gc-slide-from-left', 'gc-slide-from-right', 'gc-sliding');
                    void imgEl.offsetWidth;
                    imgEl.classList.add(direction === 'left' ? 'gc-slide-from-left' : 'gc-slide-from-right');
                    imgEl.classList.add('gc-sliding');
                }
                imgEl.src = src;
            }
         

            const textContent = (texts[idx] || '').toString().trim();
            if (captionEl) {
                captionEl.classList.remove('gc-caption-left', 'gc-caption-right', 'gc-caption-show');
                if (textContent) {
                    captionEl.textContent = textContent;
                    captionEl.style.display = 'inline-flex';
                    void captionEl.offsetWidth;
                    if (direction === 'left') {
                        captionEl.classList.add('gc-caption-left');
                    } else if (direction === 'right') {
                        captionEl.classList.add('gc-caption-right');
                    }
                    captionEl.classList.add('gc-caption-show');
                } else {
                    captionEl.style.display = 'none';
                }
            }

          
            if (leftBtn) leftBtn.style.display = images.length > 1 ? 'flex' : 'none';
            if (rightBtn) rightBtn.style.display = images.length > 1 ? 'flex' : 'none';
        }

      

        if (leftBtn) {
            leftBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!images.length) return;
                animateButton(leftBtn);
                idx = (idx - 1 + images.length) % images.length;
                update('left');
            });
            leftBtn.addEventListener('animationend', (event) => {
                if (event.animationName === 'gc-carousel-press') {
                    leftBtn.classList.remove('gc-press');
                }
            });
        }

        if (rightBtn) {
            rightBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!images.length) return;
                animateButton(rightBtn);
                idx = (idx + 1) % images.length;
                update('right');
            });
            rightBtn.addEventListener('animationend', (event) => {
                if (event.animationName === 'gc-carousel-press') {
                    rightBtn.classList.remove('gc-press');
                }
            });
        }

        update();
    }

    // Build content based on type
    if (type !== 3) {
        const body = document.createElement('div'); 
        body.className = 'custom-modal-body';

        if (type === 2) {
            body.innerHTML = `
                <div class="modal-text">${data.text || 'Tip: Default tip message'}</div>
                <button class="custom-btn btn-okay"  id="gc-popup-okay">${tlang("确认","Okay")}</button>
            `;
            modal.appendChild(body); 
            
        } else if (type === 4){
            getFromChromeStorage("MSFeaturesSettings").then(settings => { 
                let originalSettings = settings? settings : {CalenderSyncPeriod: "1 Day", CalenderSyncShift: true};
                const syncPeriod = settings?.CalenderSyncPeriod ?? "1 Day";
                const doShift = settings?.CalenderSyncShift ?? true;
                const doAlert = settings?.CalenderTriggerNotify ?? false;
                body.innerHTML = `
                <div class="settings-title">${tlang("课程表同步设置","Calendar Sync Settings")}</div>
                <div class="settings-content">
                    <div class="settings-section">
                        <label for="sync-period-select" class="settings-label">${tlang("自动同步周期","Auto Sync Period")}</label>
                        <p style="font-size: 0.85em; color: #888; margin: 4px 0 8px 0;">
                            ${tlang("设置自动同步课程表到日历的时间间隔。","Set how often your calendar will auto-sync.")}
                        </p>
                        <select id="sync-period-select" class="settings-select">
                            <option value="1 Hour"${syncPeriod === "1 Hour" ? " selected" : ""}>${tlang("1小时","1 hour")}</option>
                            <option value="1 Day"${syncPeriod === "1 Day" ? " selected" : ""}>${tlang("1天","1 day")}</option>
                            <option value="2 Days"${syncPeriod === "2 Days" ? " selected" : ""}>${tlang("2天","2 days")}</option>
                            <option value="5 Days"${syncPeriod === "5 Days" ? " selected" : ""}>${tlang("5天","5 days")}</option>
                            <option value="1 Week"${syncPeriod === "1 Week" ? " selected" : ""}>${tlang("1周","1 week")}</option>
                            <option value="disabled"${syncPeriod === "disabled" ? " selected" : ""}>${tlang("仅手动同步","Disable Auto Sync")}</option>
                        </select>
                    </div>
                    <div class="settings-section">
                        <label class="settings-checkbox-label">
                            <input type="checkbox" id="calendar-shift-checkbox" class="settings-checkbox"${doShift ? " checked" : ""}>
                            <span class="checkbox-text">${tlang("自动对齐高中部时间表","Auto-Align to HS Bell Schedule")}</span>
                        </label>
                        <p style="font-size: 0.85em; color: #888; margin: 4px 0 8px 0;">
                            ${tlang("将同步的课程时间自动调整为高中部标准作息时间。","Automatically adjust synced class times to the HS bell schedule.")}
                        </p>
                        <label class="settings-checkbox-label">
                            <input type="checkbox" id="calendar-alert-checkbox" class="settings-checkbox"${doAlert ? " checked" : ""}>
                            <span class="checkbox-text">${tlang("课程表事件是否触发通知提醒","Enable Outlook Notifications for Class Events")}</span>
                        </label>
                        <p style="font-size: 0.85em; color: #888; margin: 4px 0 8px 0;">
                            ${tlang("勾选后，Outlook会在上课前五分钟发送提醒。若无特别必要，建议关闭以防止频繁通知。","Check this box to trigger a notification for class events. If you don't need this, we recommend unchecking to prevent excessive notifications.")}
                        </p>
                    </div>
                    <div class="settings-section">
                         <button id="settings-action-btn" class="settings-action-btn">${tlang("立即同步一次","Start Calender Sync Now")}</button>
                    </div>
                </div>   
                <div class="settings-footer">
                    <button class="custom-btn btn-secondary" id="gc-popup-cancel">${tlang("取消","Cancel")}</button>
                    <button class="custom-btn btn-primary" id="gc-popup-save">${tlang("保存","Save")}</button>
                </div>
                `;
                modal.appendChild(body);

                document.getElementById('settings-action-btn').addEventListener('click', function() {
                    send_comp_msg("bp-startSyncCalender",null,null)
                    document.getElementById('gc-popup-save').click()
                })
                document.getElementById("gc-popup-save").addEventListener('click',function() {
                    const syncPeriod = document.getElementById('sync-period-select').value;
                    const doShift = document.getElementById('calendar-shift-checkbox').checked;
                    const doAlert = document.getElementById('calendar-alert-checkbox').checked;
                    originalSettings.CalenderSyncPeriod = syncPeriod;
                    originalSettings.CalenderSyncShift = doShift;
                    originalSettings.CalenderTriggerNotify = doAlert;
                    saveToChromeStorage("MSFeaturesSettings",originalSettings);
                })
            });
        } else if (type === 5){ 
            getFromChromeStorage("MSFeaturesSettings").then(settings => { 
                let originalSettings = settings? settings : {TeamsTaskSyncPeriod: "1 Day"};
                const syncPeriod = settings?.TeamsTaskSyncPeriod ?? "1 Day";
                
                body.innerHTML = `
                <div class="settings-title">${tlang("同步Teams任务设置","Teams Task Sync Settings")}</div>
                <div class="settings-content">
                    <div class="settings-section">
                        <label for="sync-period-select" class="settings-label">${tlang("自动同步周期","Auto Sync Period")}</label>
                        <select id="sync-period-select" class="settings-select">
                            <option value="1 Hour"${syncPeriod === "1 Hour" ? " selected" : ""}>${tlang("1小时","1 hour")}</option>
                            <option value="1 Day"${syncPeriod === "1 Day" ? " selected" : ""}>${tlang("1天","1 day")}</option>
                            <option value="disabled"${syncPeriod === "disabled" ? " selected" : ""}>${tlang("仅手动同步","Disable Auto Sync")}</option>
                        </select>
                    </div>
                    <p style="font-size: 0.85em; color: #888; margin: 4px 0 8px 0;">
                            ${tlang("该功能将定期同步Teams上的作业截止日期至Teams日历，并默认于截止6小时前触发提醒。","This feature will periodically sync assignment due dates to Teams calendar, and default to trigger a reminder 6 hours before the deadline.")}
                        </p>
                    <div class="settings-section">
                         <button id="settings-action-btn" class="settings-action-btn">${tlang("立即同步一次","Start a Manual Task Sync Now")}</button>
                        </div>
                    </div>   
                <div class="settings-footer">
                    <button class="custom-btn btn-secondary" id="gc-popup-cancel">${tlang("取消","Cancel")}</button>
                    <button class="custom-btn btn-primary" id="gc-popup-save">${tlang("保存","Save")}</button>
                </div>
                
            `;
                modal.appendChild(body);
                document.getElementById('settings-action-btn').addEventListener('click', function() {
                    send_comp_msg("bp-startSyncTeamsTask",null,null)
                    document.getElementById('gc-popup-save').click()
                })
                document.getElementById("gc-popup-save").addEventListener('click',function() {
                    const syncPeriod = document.getElementById('sync-period-select').value;
                    
                    originalSettings.TeamsTaskSyncPeriod = syncPeriod;
                    saveToChromeStorage("MSFeaturesSettings",originalSettings);
                })
            });
        } else if (type === 6){ 
            getFromChromeStorage("MSFeaturesSettings").then(settings => { 
                let originalSettings = settings? settings : {XBTaskSyncPeriod: "1 Day"};
                const syncPeriod = settings?.XBTaskSyncPeriod ?? "1 Day";
                let ignoreSome = settings?.XBTaskSyncIgnoreType ?? true;
                
                body.innerHTML = `
                <div class="settings-title">${tlang("同步校宝任务设置","Teams Task Sync Settings")}</div>
                <div class="settings-content">
                    <div class="settings-section">
                        <label for="sync-period-select" class="settings-label">${tlang("自动同步周期","Auto Sync Period")}</label>
                        <select id="sync-period-select" class="settings-select">
                            <option value="1 Hour"${syncPeriod === "1 Hour" ? " selected" : ""}>${tlang("1小时","1 hour")}</option>
                            <option value="1 Day"${syncPeriod === "1 Day" ? " selected" : ""}>${tlang("1天","1 day")}</option>
                            <option value="disabled"${syncPeriod === "disabled" ? " selected" : ""}>${tlang("仅手动同步","Disable Auto Sync")}</option>
                        </select>
                    </div>
                    <div class="settings-section">
                        <label class="settings-checkbox-label">
                            <input type="checkbox" id="calendar-shift-checkbox" class="settings-checkbox"${ignoreSome ? " checked" : ""}>
                            <span class="checkbox-text">${tlang("不同步“单元测验，小测等”类型任务","Do Not Sync Tasks of Type 'Test, Quiz'")}</span>
                        </label>
                        
                    </div>
                    <p style="font-size: 0.85em; color: #888; margin: 4px 0 8px 0;">
                            ${tlang("该功能将定期同步校宝上的作业截止日期至Teams日历，并默认于截止6小时前触发提醒。","This feature will periodically sync assignment due dates to Teams calendar, and default to trigger a reminder 6 hours before the deadline.")}
                        </p>
                    <div class="settings-section">
                         <button id="settings-action-btn" class="settings-action-btn">${tlang("立即同步一次","Start a Manual Task Sync Now")}</button>
                        </div>
                    </div>   
                <div class="settings-footer">
                    <button class="custom-btn btn-secondary" id="gc-popup-cancel">${tlang("取消","Cancel")}</button>
                    <button class="custom-btn btn-primary" id="gc-popup-save">${tlang("保存","Save")}</button>
                </div>
                
            `;
                modal.appendChild(body);
                document.getElementById('settings-action-btn').addEventListener('click', function() {
                    send_comp_msg("bp-startSyncXBTask",null,null)
                    document.getElementById('gc-popup-save').click()
                })
                document.getElementById("gc-popup-save").addEventListener('click',function() {
                    const syncPeriod = document.getElementById('sync-period-select').value;
                    
                    originalSettings.XBTaskSyncPeriod = syncPeriod;
                    originalSettings.XBTaskSyncIgnoreType = document.getElementById('calendar-shift-checkbox').checked;
                    saveToChromeStorage("MSFeaturesSettings",originalSettings);
                })
            });
        }else if (type === 7){ 
            body.innerHTML = `
                <div class="settings-title">${tlang("在Forms中填写","Feedback & Suggestion")}</div>
                <iframe width="700px" height="480px" src="https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=KpEicl1DO0KyK3S5CcO_izimwdzN4nREuVb2RzJ5VJRURE1PQ0NCV1YxWjRFWThHMkhJSllLQ09XMy4u&rc67cae315b83410aacea03731033238f=${"Giaoculator S - V"+version + (navigator.userAgent.toLowerCase().includes('edg') ? 'e' : 'c')}&embed=true" frameborder="0" marginwidth="0" marginheight="0" scrolling="no" style=" border: none; border-radius: 16px; overflow: hidden; max-width: 100%; max-height: 100vh; box-shadow: 0 4px 12px rgba(0,0,0,0.15); " allowfullscreen webkitallowfullscreen mozallowfullscreen msallowfullscreen> </iframe>
            `;
            modal.appendChild(body); 
        }
    }
    if (type === 8) {//+图文
        const body = document.createElement('div');
        body.className = 'custom-modal-body';
        const images = Array.isArray(data.images) ? data.images : [];
        const initialIndex = typeof data.startIndex === 'number' ? Math.max(0, Math.min(data.startIndex, images.length - 1)) : 0;
        ensurePopupCarouselStyles();
        body.innerHTML = `
            <div class="gc-type1-top" style="display:flex;justify-content:flex-start;align-items:center;gap: 10px;margin:0;padding-bottom: 30px;">
            <img src="${chrome.runtime.getURL('res/msteamsLogo.svg')}" style="height:30px;vertical-align:middle;">
            <div class="modal-text" style="font-weight:500;margin-bottom:0px">${data.title}</div>
            </div>
            <div class="gc-carousel" style="position:relative;display:flex;align-items:center;justify-content:center;width:100%;min-height:180px;max-height:260px;overflow:hidden;border-radius:12px;background:#f7f8fa;">
                <button type="button" class="gc-carousel-arrow gc-left" style="position:absolute;left:6px;top:50%;transform:translateY(-50%);border:none;width:32px;height:32px;border-radius:16px;cursor:pointer;display:${images.length>1?'flex':'none'};align-items:center;justify-content:center;">
                    <span class="gc-carousel-icon material-symbols-outlined">chevron_left</span>
                </button>
                <img class="gc-carousel-image" alt="" style="max-width:100%;max-height:240px;object-fit:contain;display:${images.length? 'block':'none'};border-radius:12px;position:relative;z-index:1;" />
                <div class="gc-carousel-empty" style="color:#999;font-size:0.95rem;display:${images.length? 'none':'block'};padding:24px 8px;text-align:center;">${tlang("暂无图片","No images")}</div>
                <button type="button" class="gc-carousel-arrow gc-right" style="position:absolute;right:6px;top:50%;transform:translateY(-50%);border:none;width:32px;height:32px;border-radius:16px;cursor:pointer;display:${images.length>1?'flex':'none'};align-items:center;justify-content:center;">
                    <span class="gc-carousel-icon material-symbols-outlined">chevron_right</span>
                </button>
                <div class="gc-carousel-caption" style="display:none;z-index:99;"></div>
                
            </div>
        `;
        modal.appendChild(body);
        setupPopupCarousel(body.querySelector('.gc-carousel'), {
            images,
            texts: data.text,
            initialIndex
        });
    } else if (type === 1) {
        // Override layout for type 1: top-right header + image carousel in the middle
        const body = modal.querySelector('.custom-modal-body') || (()=>{ const b=document.createElement('div'); b.className='custom-modal-body'; modal.appendChild(b); return b; })();
        const images = Array.isArray(data.images) ? data.images : [];
        const initialIndex = typeof data.startIndex === 'number' ? Math.max(0, Math.min(data.startIndex, images.length - 1)) : 0;
        ensurePopupCarouselStyles();
        body.innerHTML = `
            <div class="gc-type1-top" style="display:flex;justify-content:flex-start;align-items:center;gap: 10px;margin:0;padding-bottom: 30px;">
            <img src="${chrome.runtime.getURL('res/msteamsLogo.svg')}" style="height:30px;vertical-align:middle;">
            <div class="modal-text" style="font-weight:500;margin-bottom:0px">${data.title}</div>
            </div>
            <div class="gc-carousel" style="position:relative;display:flex;align-items:center;justify-content:center;width:100%;min-height:180px;max-height:260px;overflow:hidden;border-radius:12px;background:#f7f8fa;">
                <button type="button" class="gc-carousel-arrow gc-left" style="position:absolute;left:6px;top:50%;transform:translateY(-50%);border:none;width:32px;height:32px;border-radius:16px;cursor:pointer;display:${images.length>1?'flex':'none'};align-items:center;justify-content:center;">
                    <span class="gc-carousel-icon material-symbols-outlined">chevron_left</span>
                </button>
                <img class="gc-carousel-image" alt="" style="max-width:100%;max-height:240px;object-fit:contain;display:${images.length? 'block':'none'};border-radius:12px;position:relative;z-index:1;" />
                <div class="gc-carousel-empty" style="color:#999;font-size:0.95rem;display:${images.length? 'none':'block'};padding:24px 8px;text-align:center;">${tlang("暂无图片","No images")}</div>
                <button type="button" class="gc-carousel-arrow gc-right" style="position:absolute;right:6px;top:50%;transform:translateY(-50%);border:none;width:32px;height:32px;border-radius:16px;cursor:pointer;display:${images.length>1?'flex':'none'};align-items:center;justify-content:center;">
                    <span class="gc-carousel-icon material-symbols-outlined">chevron_right</span>
                </button>
                <div class="gc-carousel-caption" style="display:none;z-index:99;"></div>
                
            </div>
            <div class="custom-modal-footer" style="margin-top:30px;">
                <button class="custom-btn btn-secondary" id="gc-popup-discard">${tlang("取消","Discard")}</button>
                <button class="custom-btn btn-primary" id="gc-popup-settings-MS">${tlang("前往查看","Go to Settings")}</button>
            </div>
        `;
        setupPopupCarousel(body.querySelector('.gc-carousel'), {
            images,
            texts: data.text,
            initialIndex
        });
    } else if (type === 9) {
        // Override layout for type 1: top-right header + image carousel in the middle
        const body = modal.querySelector('.custom-modal-body') || (()=>{ const b=document.createElement('div'); b.className='custom-modal-body'; modal.appendChild(b); return b; })();
        const images = Array.isArray(data.images) ? data.images : [];
        const initialIndex = typeof data.startIndex === 'number' ? Math.max(0, Math.min(data.startIndex, images.length - 1)) : 0;
        ensurePopupCarouselStyles();
        body.innerHTML = `
            <div class="gc-type1-top" style="display:flex;justify-content:flex-start;align-items:center;gap: 10px;margin:0;padding-bottom: 30px;">
            <div class="modal-text" style="font-weight:500;margin-bottom:0px">${data.title}</div>
            </div>
            <div class="gc-carousel" style="position:relative;display:flex;align-items:center;justify-content:center;width:100%;min-height:180px;max-height:260px;overflow:hidden;border-radius:12px;background:#f7f8fa;">
                <button type="button" class="gc-carousel-arrow gc-left" style="position:absolute;left:6px;top:50%;transform:translateY(-50%);border:none;width:32px;height:32px;border-radius:16px;cursor:pointer;display:${images.length>1?'flex':'none'};align-items:center;justify-content:center;">
                    <span class="gc-carousel-icon material-symbols-outlined">chevron_left</span>
                </button>
                <img class="gc-carousel-image" alt="" style="max-width:100%;max-height:240px;object-fit:contain;display:${images.length? 'block':'none'};border-radius:12px;position:relative;z-index:1;" />
                <div class="gc-carousel-empty" style="color:#999;font-size:0.95rem;display:${images.length? 'none':'block'};padding:24px 8px;text-align:center;">${tlang("暂无图片","No images")}</div>
                <button type="button" class="gc-carousel-arrow gc-right" style="position:absolute;right:6px;top:50%;transform:translateY(-50%);border:none;width:32px;height:32px;border-radius:16px;cursor:pointer;display:${images.length>1?'flex':'none'};align-items:center;justify-content:center;">
                    <span class="gc-carousel-icon material-symbols-outlined">chevron_right</span>
                </button>
                <div class="gc-carousel-caption" style="display:none;z-index:99;"></div>
                
            </div>
            <div class="custom-modal-footer" style="margin-top:30px;">
                <button class="custom-btn btn-secondary" id="gc-popup-type9Disable">${tlang("关闭该功能","Disable Now")}</button>
                <button class="custom-btn btn-primary" id="gc-popup-type9Okay">${tlang("确认","Got it!")}</button>
            </div>
        `;
        setupPopupCarousel(body.querySelector('.gc-carousel'), {
            images,
            texts: data.text,
            initialIndex
        });
    }

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    if (type == 7 || type == 1 || type == 8 ||  type == 9) {
        document.getElementsByClassName("custom-modal")[0].style.maxWidth = "700px";
    }
    if(type == 9){
        document.getElementById('gc-popup-type9Disable').style.backgroundColor = "#e53e3e";
        document.getElementById('gc-popup-type9Okay').style.borderColor = "#38a169";
    }
    if(type==2){
        try{
            document.getElementById('gc-popup-okay').addEventListener('click', function() {
                    document.getElementById('gc-popup-discard').click()
            });
        }catch(e){}
    }
    handleGCPopupClick = handleGCPopupClick.bind(this);
    overlay.addEventListener('click', handleGCPopupClick);  
    

    requestAnimationFrame(() => overlay.classList.add('active'));
}
async function showConfirmationPopup(data = {}) {
    return new Promise(async (resolve) => {
        const styleId = 'popup-styles';
        if (!document.getElementById(styleId)) {
            try {
                const response = await fetch(chrome.runtime.getURL('res/inwindow-popup.css'));
                const css = await response.text();
                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = css;
                document.head.appendChild(style);
            } catch (error) {
                console.error("Failed to fetch or apply popup CSS:", error);
            }
        }

        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'custom-modal';


        modal.innerHTML = `
            <div class="custom-modal-header">
                <button class="custom-close-btn">&times;</button>
            </div>
            <div class="custom-modal-body">
                <div class="modal-text">${data.text || 'Are you sure?'}</div>
                <div class="custom-modal-footer">
                     <button class="custom-btn btn-secondary" data-choice="discard">${tlang("取消","Discard")}</button>
                     <button class="custom-btn btn-primary" data-choice="okay">${tlang("确认","Okay")}</button>
                </div>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        const cleanupAndResolve = (choice) => {

            modal.removeEventListener('click', handleClick);
            overlay.remove();
            resolve(choice);
        };

        const handleClick = (event) => {
            const target = event.target;
            if (target.matches('.custom-btn')) {
                cleanupAndResolve(target.dataset.choice);
            }
            if (target.matches('.custom-close-btn')) {
                cleanupAndResolve('discard');
            }
        };

        modal.addEventListener('click', handleClick);

        setTimeout(() => overlay.classList.add('active'), 10);
    });
}

function handleGCPopupClick(event) {
    console.log("Popup clicked:", event.target);
    if (event.target.id === 'gc-popup-discard') {
        removePopup(event.target.closest('.custom-modal-overlay'));
    } else if (event.target.id === "gc-popup-settings-MS") {
        chrome.runtime.sendMessage({
                type: "openOptionsPage_MSBind"
            });
    } else if (event.target.id === 'gc-popup-type9Disable') {
        getFromChromeStorage("user_preference").then(prefs => {
            let originalPrefs = prefs ? prefs : {"scratchScore": false};
            originalPrefs.scratchScore = false;
            saveToChromeStorage("user_preference", originalPrefs);
        });
        try{
            document.querySelector("canvas").remove()
            document.querySelector("canvas").remove()
        }catch(e){}
        sendInfotip(tlang("已关闭分数刮一刮功能，设置中可重新打开","Score Scratching is being disabled, you may re-enable it in settings"),3000,"info");
        removePopup(event.target.closest('.custom-modal-overlay'));
    } else if (event.target.id === 'gc-popup-type9Okay') {
        getFromChromeStorage("user_preference").then(prefs => {
            let originalPrefs = prefs ? prefs : {"scratchScore": false};
            originalPrefs.scratchScore = true;
            saveToChromeStorage("user_preference", originalPrefs);
        });
        removePopup(event.target.closest('.custom-modal-overlay'));
    } else if (event.target.id === 'gc-popup-cancel') {
        removePopup(event.target.closest('.custom-modal-overlay'));
    } else if (event.target.id === 'gc-popup-save') {
        //do not handle save here!
        removePopup(event.target.closest('.custom-modal-overlay'));
    } else if (event.target.id === 'settings-action-btn') {
        // Handle action button click
        console.log('Action button clicked');
        
        // You can add your action logic here
        // For example, trigger a specific function or show a message
        
 
    } else{
        return;
    }
}

function removePopup(overlay) {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
}
///////TEAMS PANEL

// Append Giaoculator badge under the page footer if not already present
function modifyPageFooter() {
  try {
    // Avoid duplicate insertion by our marker or by checking for the logo src
    if (document.querySelector('[data-giaoculator="footer-badge"]')) return;

    const logoUrl = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
      ? chrome.runtime.getURL('res/iconBig_foot.png')
      : 'res/iconBig_only.png';
    if (document.querySelector(`img[src="${logoUrl}"]`)) return;
    const footerEl = querySelectorStable('div[class*="fe-components-stu-business-org-footer-__footBox--"]')
      || document.querySelector('footer')
      || querySelectorStable('.fe-components-stu-business-org-footer-__footBox--3hotK29i9BpxtSdcmmjpqY');

    if (!footerEl) return;
    const badge = document.createElement('div');
    badge.setAttribute('data-giaoculator', 'footer-badge');
    badge.style.cssText = [
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'gap:6px',
      'margin:-17px 0 0 0',
      'font-size:12px',
      'color:#666',
      'padding-bottom:20px',
      'select-user:none',
    ].join(';');

    // Logo image
    const img = document.createElement('img');
    img.src = logoUrl;
    img.alt = 'Giaoculator';
    img.style.cssText = 'margin-left:2.5px;height:30px;margin-bottom:1px';

    const suffix = navigator.userAgent.toLowerCase().includes('edg') ? 'e' : 'c';
    const verBase = (typeof version !== 'undefined') ? String(version) : '';
    const verText = `${verBase}${suffix}`;

    const text = document.createElement('span');
    text.textContent = `(${verText})`;

    badge.appendChild(img);
    badge.appendChild(text);
    footerEl.insertAdjacentElement('afterend', badge);

    if (typeof window !== 'undefined') {
      window.modifyPageFooter = modifyPageFooter;
    }
  } catch (err) {
    try { console.warn('Giaoculator: modifyPageFooter failed', err); } catch (_) {}
  }
}


function addGuestModeCheckbox() {
    try {
        const forgetLink =
            queryByClassNames('ng-binding fe-components-stu-business-login-enter-box-__forgetLink--33qRdR5UpfjVrt3C_MdyYR') ||
            querySelectorStable('a.ng-binding.fe-components-stu-business-login-enter-box-__forgetLink--33qRdR5UpfjVrt3C_MdyYR');
        if (!forgetLink) return;
        const container = forgetLink.parentElement;
        if (!container) return;
        // Avoid duplicate insertion
        if (container.querySelector('#gx-guest-mode')) return;
        // Ensure the container distributes left (checkbox) and right (forgot link)
        const cs = getComputedStyle(container);
        if (cs.display !== 'flex') {
            container.style.display = 'flex';
        }
        container.style.justifyContent = 'space-between';
        container.style.alignItems = 'center';
        // Create checkbox + text label (default unchecked)
        const label = document.createElement('label');
        label.id = 'gx-guest-mode-wrap';
        label.style.display = 'inline-flex';
        label.style.alignItems = 'center';
        label.style.gap = '6px';
        label.style.color = '#737373'
        label.style.cursor = 'pointer';
        label.style.margin = '0';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'gx-guest-mode';
        checkbox.name = 'gx-guest-mode';
        checkbox.checked = false; // default is not checked
        const text = document.createElement('span');
        text.textContent = tlang("使用访客模式","Login as Guest");
        label.appendChild(checkbox);
        label.appendChild(text);
        container.insertBefore(label, container.firstChild);
        saveToChromeStorage('login_guest', false);
        checkbox.addEventListener('change', function () {
            saveToChromeStorage('login_guest', checkbox.checked);
            if(checkbox.checked){
                sendInfotip(tlang("<strong>【访客模式】</strong>适用于借用他人电脑登录的情况","<strong>【Guest Mode】</strong>If you are borrowing someone else's computer to log in, enable this function."), 3000);
                showStateAtLoginPage(true);
            }else{
                showStateAtLoginPage(false);
            }
        });
    } catch (e) {
        console.warn('addGuestModeCheckbox error', e);
    }
}