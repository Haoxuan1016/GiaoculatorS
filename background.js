chrome.webRequest.onCompleted.addListener(
    (details) => {
        const { url } = details;
        // URL 定义
        const LoginUrl = "https://tsinglanstudent.schoolis.cn/api/StudyAbroad/GetStudentPromotionIdByStudentId";
        const DynamicScoreDetailUrl = "https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetDynamicScoreDetail";

        // 判断 URL 并执行对应逻辑
        if (url === LoginUrl) {
            console.log("{logged in}", details);
            InitGCalc(); // 用户登录逻辑
            setTimeout(() => {
                M_send_comp_msg("bp-loggedin", null, 0);
            }, 100);
            setTimeout(() => {
                M_send_comp_msg("bp-loggedin-frameEdit", null, 0);
            }, 700);
            setTimeout(() => {
                try {
                    getFromChromeStorage("updateMsg").then(update => {
                        console.log(update);
                        if(update.length>10){
                            M_send_str_msg("tip_update",update,0);
                            saveToChromeStorage("updateMsg", "");
                            //M_send_str_msg("rib_fwk", 0.5, 0); 这个版本不需要
                        }
                        
                    });
                } catch (e) {}
                M_send_comp_msg("bp-recordLogin", null, 0);
            }, 1000);
            
        
        } else if (url.startsWith(DynamicScoreDetailUrl)&&(!url.includes("gcalc"))|| url.includes("show=gbdiy")) {
            setTimeout(() => {
                //console.log("[Listener] Got:", url);
                try {
                    // 解析 URL 参数
                    const urlParams = new URLSearchParams(new URL(url).search);
                    const req_subjectId = urlParams.get("subjectId");
                    const req_semesterId = urlParams.get("semesterId");

                    // 构建数据对象
                    const data = {
                        smsId: req_semesterId,
                        subjectId: req_subjectId
                    };


                    M_send_comp_msg("rc_infopage", data, 0);
                } catch (error) {
                    console.error("[Listener Error] Failed to process URL parameters:", error);
                }
            }, 10); // 延迟 10ms 执行
        } else if (url.startsWith(DynamicScoreDetailUrl)) {
            setTimeout(() => {
                M_send_comp_msg("bp-observeDynamicScore",null, 0);

            }, 10);
        }
    },
    {
        urls: ["<all_urls>"], // 监听所有 URL
        types: ["xmlhttprequest"] // 包括 fetch 和 xmlhttprequest 请求
    }
);

function tlang(chi,eng){
    return (navigator.language || navigator.userLanguage).startsWith('zh') ? chi:eng;
}

chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === "update") {
        let updatedMsg;
        if(details.previousVersion == chrome.runtime.getManifest().version){
            return;
        }
        updatedMsg = tlang(`
                <div style="color: white; font-size: 11px;">
      <p style="margin-bottom: 2px; margin-top: 2px;">
        <img src="${chrome.runtime.getURL('iconV2.png')   }" style="width: 25px; height: 25px; vertical-align: middle; margin-right: 3px;">
        <strong>Giaoculator已更新！【${details.previousVersion}→${chrome.runtime.getManifest().version}】</strong>
      </p>
      <p style="margin-bottom: 2px; margin-top: 2px;">· 【主页美化】修复了背景图/视频不生效的问题</p>
      <p style="margin-bottom: 2px; margin-top: 2px;">· 【批改分计算】修复了部分情况下显示异常的问题</p>
      <p style="margin-bottom: 2px; margin-top: 2px;">· 【自定义分数】修复了该功能无法正常使用的问题</p>
      <p style="margin-bottom: 2px; margin-top: 2px;">· 【TeamsOrganizer】修复了部分情况下频繁弹窗的问题</p>
    </div>
    `,`
                <div style="color: white; font-size: 11px;">
      <p style="margin-bottom: 2px; margin-top: 2px;">
        <img src="${chrome.runtime.getURL('icon.png')   }" style="width: 25px; height: 25px; vertical-align: middle; margin-right: 3px;">
        <strong>Giaoculator Updated！【${details.previousVersion}→${chrome.runtime.getManifest().version}】</strong>
      </p>
        <p style="margin-bottom: 2px; margin-top: 2px;">· 【Homepage UI】Fixed background image/video not loading properly</p>
<p style="margin-bottom: 2px; margin-top: 2px;">· 【Score Calc】Fixed display issues in certain cases</p>
<p style="margin-bottom: 2px; margin-top: 2px;">· 【Custom Score】Fixed the feature not working properly</p>
<p style="margin-bottom: 2px; margin-top: 2px;">· 【TeamsOrganizer】Fixed frequent pop-ups in some cases</p>

    </div>
    
    `)
        
        saveToChromeStorage("updateMsg", updatedMsg);
        
        
    }
    else{
        chrome.storage.local.set({enable_state: true});
        chrome.tabs.create({
          url: chrome.runtime.getURL("welcome.html")
        });
    }

});

let MSAuthRetryInProgress = false;

async function saveToChromeStorage(keyName, obj) {
    try {
        const data = {};
        data[keyName] = obj; // 创建存储对象
        await chrome.storage.local.set(data); // 异步存储
        console.log("已存入 " + keyName + " 的数据!");
    } catch (error) {
        console.error('Error saving to chrome.storage:', error);
        M_send_comp_msg("calcErrorStop", null, 0);

        M_send_comp_msg("tip_err", error, 0);
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
        M_send_str_msg("calcErrorStop", "1", 0);
        M_send_str_msg("tip_err", error, 0);
        //err
        return null;
    }
}

function ensureBeingSyncedOrder(rawList) {
    let list;
    if (Array.isArray(rawList)) {
        list = rawList.slice();
    } else if (rawList && typeof rawList === 'object') {
        list = Object.values(rawList);
    } else {
        list = [];
    }
    const seen = new Set();
    const ordered = [];
    for (const item of list) {
        if (item === undefined || item === null) {
            continue;
        }
        if (!seen.has(item)) {
            seen.add(item);
            ordered.push(item);
        }
    }
    return ordered;
}

async function loadBeingSynced() {
    const raw = await getFromChromeStorage("MS_BeingSynced");
    return ensureBeingSyncedOrder(raw);
}

async function saveBeingSynced(list) {
    await saveToChromeStorage("MS_BeingSynced", ensureBeingSyncedOrder(list));
}

function appendBeingSynced(list, id) {
    if (id === undefined || id === null) {
        return ensureBeingSyncedOrder(list);
    }
    const ordered = ensureBeingSyncedOrder(list);
    const existingIndex = ordered.indexOf(id);
    if (existingIndex !== -1) {
        ordered.splice(existingIndex, 1);
    }
    ordered.push(id);
    return ordered;
}

function buildLegacySubjectKey(semesterId, subjectId) {
    return `${semesterId}|${subjectId}`;
}

function buildClassScopedSubjectKey(semesterId, subjectId, classId) {
    if (classId === undefined || classId === null) {
        return null;
    }
    return `${semesterId}|${subjectId}|${classId}`;
}

async function M_GetSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get('user_preference', function(data) {
            if (data.user_preference) {
                resolve(data.user_preference);
            } else {
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
                    autoHide_Condition: 70
                };
                chrome.storage.local.set({ user_preference: user_preference });
                resolve(user_preference);
            }
        });
    });
}

async function InitGCalc() {

    M_send_str_msg("bp-verNum", chrome.runtime.getManifest().version, 0);

    M_checkGPARules();
    M_clearCalcedData();
    M_clearRedirectRules();
    M_initDeclaritiveRules();
    let M_UserSettings = await M_GetSettings();
    C_CalcAll(M_UserSettings);
    M_StartMSFeatures();

}

async function C_CalcAll(M_UserSettings){ 
    
    const calcRange = M_UserSettings.calcRange;
    if(calcRange===0){
        return;
    }
    M_send_comp_msg("show_process",{cur: 0,oval: 1, text:tlang("获取学科信息..","Fetching Subjects"),isRefresh:false},-99999);
    const { year, semester, ids, bgnDates, endDates } = await C_GetSemesters(calcRange);
    
    console.log("crange",calcRange);
    for (let i = 0; i < calcRange; i++) {
        if (ids[i] !== null) {
            M_send_comp_msg("show_smsCalc_progress",null,0);
            console.log(`[AutoCalc] Start Calc for Semester ID: ${ids[i]}`);
            await C_CalcSms(ids[i], bgnDates[i], endDates[i], semester[i], year[i]);
            await C_BuildDynamicScoreRule(ids[i]);
            M_send_comp_msg("show_smsCalc_progress",null,0);
            M_send_comp_msg("show_process",{cur: i+1,oval: calcRange, text:tlang("已完成学期计算","Finished"),isRefresh:true},-99999);
        } else {
            console.log("[AutoCalc] Invalid Semester ID, skipping...");
        }
    }
    

    //finished Calcall

    saveToChromeStorage("lastUpdate", new Date().getTime());

}

function M_checkGPARules(){
    console.log("Checking GPARules");
    getFromChromeStorage("specialWeightRules").then(result => { 
        if (result === null) {
            const result = [{"Pre AP": 1.0},{"ultivari":1.5}];
            saveToChromeStorage("specialWeightRules",result);
        } else {
            console.log('SpecialGPARule Loaded:', result);
        }
    });
    getFromChromeStorage("subjectWeightRules").then(result => {
        if (result === null || JSON.stringify(result).length<60) {
            const result = {
                high: ["AP","AS","A2","A Level","ALevel","Linear Algebra"],
                low: ["Fine Art","IT ","Electi","Drama","Chinese Painting","Architectural","Dance","Percussion","Vocal","Media","Programming","Spanish","Philosophy","Skills","Journalism","Creative"],
                no: ["Homeroom"]
            };
            console.log('OriginalRule too short,Saved result:', result); // 返回结果
            M_send_str_msg("tip_alert_rt", tlang("科目权重规则过短，已初始化默认规则","Subject weighting rules are too short, default rules have been initialized") , 0);
            saveToChromeStorage("subjectWeightRules",result);
            return;
        }else{
            console.log('GPARule Loaded:', result); // 返回结果
        }
    });
    
}
function M_checkOutdatedScore(){
    getFromChromeStorage("lastUpdate").then(lastUpdate => {
        if (lastUpdate === null) {
            return;
        }
        const now = new Date().getTime();
        const diff = now - lastUpdate;
        const diffDays = diff / (1000 * 60 * 60 * 24);
        console.log("[checkOutdatedScore] Days since last update:", diffDays,lastUpdate,now);
        if (diffDays > 1) {
            M_send_str_msg("tip_alert_rt", "数据已过期，正在重新计算\nData Expired, Recalculating!" , 0);
            InitGCalc();
            getFromChromeStorage("MSFeatureEnabled").then(MSFeatureEnabled => {
                if (MSFeatureEnabled) {
                    T_fetchTeamsUserClassesAndAssignments();
                }
            });
        }
        if(diffDays > 0.1){//每2个小时刷新一次teams数据
            M_StartMSFeatures();
        }
    });
}


async function C_GetSemesters(calcRange) {
    const response = await fetch("https://tsinglanstudent.schoolis.cn/api/School/GetSchoolSemesters");
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    let startPos = data.data.findIndex(item => item.isNow === true);

    const semesters = data.data.slice(startPos, startPos + calcRange);
    const year = semesters.map(item => item.year);
    const semester = semesters.map(item => item.semester);
    const ids = semesters.map(item => item.id);
    const bgnDates = semesters.map(item => item.startDate);
    const endDates = semesters.map(item => item.endDate);

    return { year, semester, ids, bgnDates, endDates };
}


async function C_CalcSms(semesterId,bgn_info,end_info,semesterType,year) {
    setTimeout(() => {
        M_send_comp_msg("show_smsCalc_progress",null,0);
    }, 1000);
    
    console.log("f(CalcBySmsId):", semesterId, bgn_info, end_info, semesterType);

    // 构建请求 URL
    const url = `https://tsinglanstudent.schoolis.cn/api/LearningTask/GetStuSubjectListForSelect?semesterId=${semesterId}`;

    try {
        // 发送请求并解析响应
        const response = await fetch(url);
        const data = await response.json();

        // 如果数据存在且有效，处理科目信息
        if (data?.data?.length > 0) {
            let subjectIdList = {};
            const subjectKeyCounter = {};

            // 遍历科目列表，提取并映射数据
            for (const subject of data.data) {
                const normalizedName = subject.name === "HS History" ? "Chinese History" : subject.name; // 24-25学年特判
                const nextIndex = (subjectKeyCounter[normalizedName] || 0) + 1;
                subjectKeyCounter[normalizedName] = nextIndex;
                const subjectKey = nextIndex === 1 ? normalizedName : `${normalizedName}#${nextIndex}`;
                subjectIdList[subjectKey] = {
                    subjectName: normalizedName,
                    className: "noData",
                    subjectId: subject.id,
                    classId: -1,
                    subjectCode: subject.subjectCode,
                    maxCom: -1
                };
            }
            console.log("[CalcBySmsId] 开始填充学科数据:", semesterId, subjectIdList);
                //更新环
            // 填充学科数据
            
            subjectIdList = await C_fillInClassId_V3(subjectIdList,semesterId,bgn_info,end_info);
            //subjectIdList = await C_fillInClassId(subjectIdList, semesterType, year, "fixed");
            //subjectIdList = await C_fillInClassId(subjectIdList, semesterType, year, "recent");
            M_send_comp_msg("show_smsCalc_progress",null,0);
            //subjectIdList = await C_fillInClassId_StartMethod2(subjectIdList, semesterType, year, bgn_info, end_info,semesterId);
                //更新环
            console.log("[CalcBySmsId] 学科数据已填充完毕:", semesterId, subjectIdList);
            // 初始化 V2 计算
            await C_init_V2Calc(subjectIdList, semesterId, bgn_info, end_info, semesterType, year);

            M_send_comp_msg("show_smsCalc_progress",null,0);
            // 执行原始请求逻辑
            await C_fetchOriginalRequest(semesterId);
                //更新环
            
        }

        return true; // 成功处理
    } catch (error) {
        console.error("[CalcBySmsId] Error:", error);
        console.error("[CalcBySmsId] Error: V2CalcMethodError!!", error);
        return false; // 处理失败
    }
}

// Accept both legacy C# /Date(…)/ and ISO date strings
function isISODateString(str) {
    if (typeof str !== 'string') return false;
    // Matches YYYY-MM-DD or full ISO 8601 with time and optional Z/offset
    return /^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(str);
}

function dateConvert(input) {
    const csharpRegex = /\/Date\((\d+)([-+]\d+)?\)\//;
    if (!input && input !== 0) return "2000-01-01";

    // If already a Date
    if (input instanceof Date) {
        const d = input;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    // If numeric timestamp
    if (typeof input === 'number') {
        const d = new Date(input);
        if (!isNaN(d)) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }
    }

    // If string input
    if (typeof input === 'string') {
        const match = input.match(csharpRegex);
        if (match) {
            const timestamp = parseInt(match[1], 10);
            const d = new Date(timestamp);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }
        if (isISODateString(input)) {
            const d = new Date(input);
            if (!isNaN(d)) {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
            }
        }
        // If already YYYY-MM-DD, pass through
        if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
            return input;
        }
        // If numeric string timestamp
        if (/^\d{10,13}$/.test(input)) {
            const d = new Date(parseInt(input, 10));
            if (!isNaN(d)) {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
            }
        }
    }

    return "2000-01-01";
}

function C_ShortenDataBeforeFill(data) {
    const uniqueData = [];
    const seen = new Set(); // 用于跟踪已见过的 classInfo

    for (const item of data) {
        const classInfoKey = JSON.stringify(item.classInfo); // 将 classInfo 转换为字符串

        if (!seen.has(classInfoKey)) { // 如果 classInfo 是新的
            uniqueData.push(item); // 添加到 uniqueData 数组
            seen.add(classInfoKey); // 标记为已见过
        }
    }
    console.log("Shorten", data,uniqueData);
    return uniqueData;
}

function C_v3Calc_simplifyAssignments(jsonData) {
    const assignmentsByCourse = {};
    jsonData.data.list.forEach(assignment => {
      if (!assignmentsByCourse[assignment.subjectName]) {
        assignmentsByCourse[assignment.subjectName] = assignment;
      }
    });
    jsonData.data.list = Object.values(assignmentsByCourse);
    return jsonData.data.list;
  }

async function C_v3Calc_matchClassIdUsingAssignmentId(subjectIdList, assignmentId) {
    const url = `https://tsinglanstudent.schoolis.cn/api/LearningTask/GetDetail?learningTaskId=${assignmentId}&gcalcSysFetch`;

    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data?.data?.subjectId) {
                for (const subjectName in subjectIdList) {
                    if (subjectIdList.hasOwnProperty(subjectName)) {
                        const subjectEntry = subjectIdList[subjectName];
                        if (subjectEntry.subjectId === data.data.subjectId && subjectEntry.classId === -1) {
                            subjectEntry.classId = data.data.classId;
                            subjectEntry.className = (subjectName.length>18? (subjectName.slice(0, 18)+".."):subjectName)+"#"+data.data.subjectId;//v3计算无法获取className，懒得改了，拿subejctcode替代
                            console.log("[C_v3Calc_matchClassIdUsingAssignmentId] Updated:", subjectEntry.subjectName, subjectEntry.classId);
                            return subjectIdList;
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("[C_v3Calc_matchClassIdUsingAssignmentId] Error:", error);
    }
    console.log("[C_v3Calc_matchClassIdUsingAssignmentId] Not Found:", assignmentId);
    return subjectIdList;
}
async function C_fillInClassId_V3(subjectIdList, smsId, bgn_info, end_info) {
    const bgn_parsed = dateConvert(bgn_info);
    const end_parsed = dateConvert(end_info);
    let bgn_year = bgn_parsed.year;
    let bgn_mon = bgn_parsed.mon;
    let bgn_date = bgn_parsed.date;

    let end_year = end_parsed.year;
    let end_mon = end_parsed.mon;
    let end_date = end_parsed.date;
    const url = `https://tsinglanstudent.schoolis.cn/api/LearningTask/GetList?semesterId=${smsId}&subjectId=null&typeId=null&key=&beginTime=${bgn_year}-${bgn_mon}-${bgn_date}&endTime=${end_year}-${end_mon}-${end_date}&mode=null&pageIndex=1&pageSize=500`;

    console.log("[fillInClassIdV3] V3方法开始填充学科数据:", url);
    // 构建请求数据

    try {
        // 发起 POST 请求
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            let ServerClassList = C_v3Calc_simplifyAssignments(result);
            console.log("[fillInClassIdV3] V3方法获取到服务器数据:", ServerClassList);
            for(const assignment of ServerClassList){
                subjectIdList = await C_v3Calc_matchClassIdUsingAssignmentId(subjectIdList,assignment.id);
            }
            console.log("[fillInClassIdV3] V3方法填充完毕:", subjectIdList);
            return subjectIdList; // 返回更新后的 subjectIdList
        } else {
            console.error("[fillInClassIdV3] Error:", response.status, response.statusText);
            return subjectIdList; 
        }
    } catch (error) {
        console.error("[fillInClassIdV3] Error:", error);
        return subjectIdList; 
    }
}

async function C_fillInClassId_StartMethod2(subjectIdList, semesterType, year, bgndate, enddate, smsId) {
    // 日期转换辅助函数
    function jsDateToCSharpString(date) {
        const timestamp = date.getTime();
        const timezoneOffset = date.getTimezoneOffset();
        const absoluteOffset = Math.abs(timezoneOffset);
        const hours = Math.floor(absoluteOffset / 60).toString().padStart(2, '0');
        const minutes = (absoluteOffset % 60).toString().padStart(2, '0');
        const sign = timezoneOffset <= 0 ? '+' : '-';
        return `\/Date(${timestamp}${sign}${hours}${minutes})\/`;
    }

    // 生成日期范围数组
    function generateDateRanges(startDate, endDate) {
        const ranges = [];
        let currentStart = new Date(startDate);
        const end = new Date(endDate);
        
        while (currentStart < end) {
            const currentEnd = new Date(currentStart.getFullYear(), currentStart.getMonth() + 1, currentStart.getDate());
            const adjustedEnd = currentEnd > end ? end : currentEnd;
            
            ranges.push({
                start: new Date(currentStart),
                end: new Date(adjustedEnd)
            });
            
            currentStart = adjustedEnd;
        }
        return ranges;
    }

    // 主逻辑
    const startDate = new Date(dateConvert(bgndate));
    const endDate = new Date(dateConvert(enddate));
    const dateRanges = generateDateRanges(startDate, endDate);

    // 并行请求
    const requests = dateRanges.map(range => {
        const newBgndate = jsDateToCSharpString(range.start);
        const newEnddate = jsDateToCSharpString(range.end);
        // 深拷贝避免数据污染
        const copiedList = JSON.parse(JSON.stringify(subjectIdList));
        return C_fillInClassId_Method2(copiedList, semesterType, year, newBgndate, newEnddate, smsId);
    });

    const results = await Promise.all(requests);

    return mergeObjects(results);
}

function mergeObjects(result) {
    const mergedobject = {};
    for (const fetchResult of result) {
      for (const subjectName in fetchResult) {
        mergedobject[subjectName] = fetchResult[subjectName];
      }
    }
    return mergedobject;
}
async function C_fillInClassId_Method2(subjectIdList, semesterType, year, bgndate, enddate, smsId) {
    const url = 'https://tsinglanstudent.schoolis.cn/api/Schedule/ListScheduleByParent';

    // 构建请求数据
    const data = {
        beginTime: dateConvert(bgndate),
        endTime: dateConvert(enddate)
    };

    try {
        // 发起 POST 请求
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            let classList = result?.data || []; // 确保 classList 为有效数组

            classList = C_ShortenDataBeforeFill(classList);

            for (const classInfo of classList) {
                const subjectEntry = subjectIdList[classInfo.name];

                if (subjectEntry) {
                    if (1) {
              //          console.log(`[fillInClassId] Success: ${classInfo.name}, With: ${classInfo.classInfo.id}`);
                        subjectEntry.classId = classInfo.classInfo.id; // 更新 classId
                        subjectEntry.className = classInfo.classInfo.className;
                        subjectEntry.maxCom = 9999;
                        //console.log("[!SubjectEntryFill]Updated:", subjectEntry.subjectName, subjectEntry.classId, subjectEntry.maxCom);
                    }
                } else {
                    // 遍历 subjectIdList 进行模糊匹配
                    let matched = false;
                    for (const subjectKey in subjectIdList) {
                        if (subjectIdList.hasOwnProperty(subjectKey)) {
                            const currentSubject = subjectIdList[subjectKey];
                            const maxCommonLen = Logic_getMaxCommonConsecutiveLength(classInfo.name, currentSubject.subjectName);   

                            if (maxCommonLen > 18 || maxCommonLen >= (currentSubject.subjectName.length-1)) { // 完全匹配
                               // console.log(`[fillInClassId] Match Found: ${classInfo.name} 与 ${currentSubject.subjectName} (连续匹配长度: ${maxCommonLen})`);
                                currentSubject.classId = classInfo.classInfo.id;
                                currentSubject.className = classInfo.classInfo.className;
                                matched = true;
                                break;
                            } else if (maxCommonLen > 12) { // 普通匹配
                                if(currentSubject.maxCom < maxCommonLen){
                                    // console.log(`[fillInClassId] Match Found: ${classInfo.name} 与 ${currentSubject.subjectName} (连续匹配长度: ${maxCommonLen})`);
                                    console.log("[FillId]Original:", currentSubject.subjectName, currentSubject.classId, currentSubject.maxCom);
                                    currentSubject.classId = classInfo.classInfo.id;
                                    currentSubject.className = classInfo.classInfo.className;
                                    currentSubject.maxCom = maxCommonLen;
                                    console.log("[FillId]Updated:", currentSubject.subjectName, currentSubject.classId, currentSubject.maxCom);
                                }
                             }
                        }
                    }

                    if (!matched) {
                       // console.warn(`[fillInClassId] No sufficient match found for: ${classInfo.name}`);
                    }
                }
            }
            console.log("[fillInClassId] 填充完毕:", subjectIdList);
            return subjectIdList; // 返回更新后的 subjectIdList
        } else {
            return subjectIdList; // 即使失败，返回原始数据
        }
    } catch (error) {
    
        return subjectIdList; // 异常情况，返回原始数据
    }
}



async function C_fillInClassId(subjectIdList, semesterType, year, mode) {
    const url = 'https://tsinglanstudent.schoolis.cn/api/Schedule/ListScheduleByParent';

    let data;   
    // 构建请求数据
    if (mode === "fixed") {
        data = {
          beginTime: semesterType === "1" ? `${year}-12-01` : `${year + 1}-04-01`,
          endTime: semesterType === "1" ? `${year}-12-30` : `${year + 1}-05-01`
        };
      } else {
        const today = new Date();
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(today.getDate() - 15);
        const fifteenDaysLater = new Date();
        fifteenDaysLater.setDate(today.getDate() + 15);
      
        const formatDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
      
        data = {
          beginTime: formatDate(fifteenDaysAgo),
          endTime: formatDate(fifteenDaysLater)
        };
      }
    

    try {
        // 发起 POST 请求
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        let nofoundList ="";

        if (response.ok) {
            const result = await response.json();
            let classList = result?.data || []; // 确保 classList 为有效数组

            classList = C_ShortenDataBeforeFill(classList);

            for (const classInfo of classList) {
                const subjectEntry = subjectIdList[classInfo.name];

                if (subjectEntry) {
                    if (1) {
              //          console.log(`[fillInClassId] Success: ${classInfo.name}, With: ${classInfo.classInfo.id}`);
                        subjectEntry.classId = classInfo.classInfo.id; // 更新 classId
                        subjectEntry.className = classInfo.classInfo.className;
                        subjectEntry.maxCom = 9999;
                       // console.log("[!SubjectEntryFill]Updated:", subjectEntry.subjectName, subjectEntry.classId, subjectEntry.maxCom);
                    }
                } else {
                    // 遍历 subjectIdList 进行模糊匹配
                    let matched = false;
                    for (const subjectKey in subjectIdList) {
                        if (subjectIdList.hasOwnProperty(subjectKey)) {
                            const currentSubject = subjectIdList[subjectKey];
                            const maxCommonLen = Logic_getMaxCommonConsecutiveLength(classInfo.name, currentSubject.subjectName);   

                            if (maxCommonLen > 18 || maxCommonLen >= (currentSubject.subjectName.length-1)) { // 完全匹配
                               // console.log(`[fillInClassId] Match Found: ${classInfo.name} 与 ${currentSubject.subjectName} (连续匹配长度: ${maxCommonLen})`);
                                currentSubject.classId = classInfo.classInfo.id;
                                currentSubject.className = classInfo.classInfo.className;
                                matched = true;
                                break;
                            } else if (maxCommonLen > 12) { // 普通匹配
                                if(currentSubject.maxCom < maxCommonLen){
                                    // console.log(`[fillInClassId] Match Found: ${classInfo.name} 与 ${currentSubject.subjectName} (连续匹配长度: ${maxCommonLen})`);
                                    console.log("[FillId]Original:", currentSubject.subjectName, currentSubject.classId, currentSubject.maxCom);
                                    currentSubject.classId = classInfo.classInfo.id;
                                    currentSubject.className = classInfo.classInfo.className;
                                    currentSubject.maxCom = maxCommonLen;
                                    console.log("[FillId]Updated:", currentSubject.subjectName, currentSubject.classId, currentSubject.maxCom);
                                }
                             }
                        }
                    }

                    if (!matched) {
                       // console.warn(`[fillInClassId] No sufficient match found for: ${classInfo.name}`);
                    }
                }
            }
            console.log("[fillInClassId] 填充完毕:", subjectIdList);
            return subjectIdList; // 返回更新后的 subjectIdList
        } else {
            return subjectIdList; // 即使失败，返回原始数据
        }
    } catch (error) {
    
        return subjectIdList; // 异常情况，返回原始数据
    }
}

function Logic_getMaxCommonConsecutiveLength(str1, str2) {
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
    const m = str1.length;
    const n = str2.length;
    let maxLen = 0;
    let prev = Array(n + 1).fill(0);
    let current = Array(n + 1).fill(0);
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                current[j] = prev[j - 1] + 1;
                if (current[j] > maxLen) {
                    maxLen = current[j];
                }
            } else {
                current[j] = 0;
            }
        }
        [prev, current] = [current, prev];
    }
    
    return maxLen;
}

function formatNumber(number, decimalPlaces) {
    const formatted = Number(parseFloat(number.toFixed(decimalPlaces)));
    return String(formatted);
}

async function C_init_V2Calc(idList, semesterId, bgn_info, end_info, semesterType, year) {
    console.log("BGN_END_INFO",bgn_info,end_info);
    const subjectData = []; // 存储每个科目的数据
    let specialWeightRules = await getFromChromeStorage("specialWeightRules")
    let weightRules = await getFromChromeStorage("subjectWeightRules")

    let subjectSequence = 1;
    // 遍历每个科目
    for (const subject of Object.values(idList)) {
        console.log("sub",subject)
        M_send_comp_msg("show_process",{cur: subjectSequence,oval: Object.keys(idList).length, text:subject.subjectName, isRefresh:false},-99999);   
        subjectSequence++;
        const { classId, subjectId, subjectName, className, subjectCode } = subject;
        if(classId === -1){
            continue;
        }
        // 拼接请求 URL
        const url = `https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetDynamicScoreDetail?classId=${classId}&subjectId=${subjectId}&semesterId=${semesterId}&gcalc=gcalc_bg`;

        try {
            // 发起 GET 请求
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            console.log("[init_V2Calc]Fetched URL:",url,response);
            if (response.ok) {

                let isV1 = false;
                let v1PendingGradingTasks = [];
                let data = await response.json();
                console.log(`[init_V2Calc] Fetched data for subjectId: ${subjectId}`, data);

                if(data.data === null || data.state!= 0 ){
                    console.warn(`[V2Calc]Failed to fetch data,returning to V1`)
                    console.log(semesterId,subjectId,convertToMSDate(bgn_info).split('T')[0],convertToMSDate(end_info).split('T')[0]);
                    console.log(`getSubjectGrades(${semesterId},${subjectId},${convertToMSDate(bgn_info).split('T')[0]},${convertToMSDate(end_info).split('T')[0]})`);
                    formed = await getSubjectGrades(semesterId,subjectId,convertToMSDate(bgn_info).split('T')[0],convertToMSDate(end_info).split('T')[0],classId);
                    console.log("V1Calc.Formed",formed)
                    data = formed.gradeDetails;
                    v1PendingGradingTasks = formed.pendingGradingTasks || [];
                    isV1 = true;
                }
                let subjectScore = 0;
                let subjectTotalProp = 0;

                let flag_AllNull = true;
                // 计算成绩加权平均分
                for (const section of data.data.evaluationProjectList) {
                    if (!(section.learningTaskAndExamList.length === 0 || 
                        (section.learningTaskAndExamList.length === 1 && section.learningTaskAndExamList[0].score === null))) {
                            if(section.score <= 0 ){
                                for(const item of section.learningTaskAndExamList){
                                    if(item.score != null){
                                        flag_AllNull = false;
                                        subjectScore += (section.score * section.proportion);
                                        subjectTotalProp += section.proportion;
                                        break;
                                    }
                                }
                            }else{
                                flag_AllNull = false;
                                subjectScore += (section.score * section.proportion);
                                subjectTotalProp += section.proportion;
                            }
                            
                    }
                }

                if(flag_AllNull){
                    continue;
                    //All null, skip
                }
                subjectScore = (subjectScore / subjectTotalProp);



                subjectScore = formatNumber(subjectScore,1);

                // 构建课程信息对象
                const subjectInfo = {
                    ename: subjectName,
                    subjectCode: subjectCode,
                    semesterId: semesterId,
                    subjectId: subjectId
                };
                let finalWeight = (NameInList(subjectName,weightRules.high )) ? 1.5  : 1;
                console.log("WeightCheck",subjectName,finalWeight);
                if (subjectName) {

                    for (const rule of specialWeightRules) {
                        console.log("SpecialWeightCheck",subjectName,rule);
                        const ruleName = Object.keys(rule)[0];

                        if (subjectName.includes(ruleName)&&ruleName.length>=2) {
                            finalWeight = rule[ruleName];
                            console.log("SpecialWeightApplied",subjectName,finalWeight);
                            break;
                        }
                    }
                }
                console.log(`[init_V2Calc] Calculated subjectScore for subjectId: ${subjectId} is ${subjectScore} with weight ${finalWeight}`);
            
                const course = {
                    className: className,
                    subjectId: subjectId,
                    scoreMappingId: finalWeight==1.5 ? 801016  : 601016,
                    classEName: className,
                    smsId: semesterId,
                    subjectInfo: subjectInfo,
                    classId: classId,
                    subjectName: subjectName,
                    subjectEName: subjectName,
                    subjectScore: subjectScore,
                    updateDate: isV1?"/Date(1224172800000+0800)/":"/Date(1224086400000+0800)/",
                    isInGrade: true,
                    classType: 2,
                    isOriginal: true,
                    source: isV1?"v1calc":"v2calc",
                    pendingGradingTasks: isV1 ? v1PendingGradingTasks : []
                };

                // 异步保存数据到 chrome.storage.local
                const legacyStorageKey = buildLegacySubjectKey(semesterId, subjectId);
                const classScopedKey = buildClassScopedSubjectKey(semesterId, subjectId, classId);

                if (classScopedKey) {
                    await chrome.storage.local.remove(classScopedKey);
                    await saveToChromeStorage(classScopedKey, course);
                }

                await chrome.storage.local.remove(legacyStorageKey);
                await saveToChromeStorage(legacyStorageKey, course);

                // 将获取到的数据放入 subjectData
                subjectData.push({
                    subjectId: subjectId,
                    classId: classId,
                    data: data
                });
            } else {
                console.warn(`[init_V2Calc]BadResponce, Skipping: ${subjectId}, status: ${response}, url: ${url}`);
                continue;
                //console.error(`[init_V2Calc] Network response was not ok for subjectId: ${subjectId}, status: ${response}, url: ${url}`);
                //M_send_str_msg("tip_err",error, 0);
                //faceErrorWhileCalc = true;
                //M_send_comp_msg("calcErrorStop", null, 0);
            }
        } catch (error) {
            console.log("[init_V2Calc]Error:",error);
            console.log(response);
            console.warn(`[init_V2Calc]BadResponce, Skipping: `);
            continue;
            console.error('[init_V2Calc] There has been a problem with your fetch operation:', error);
            M_send_str_msg("tip_err",error, 0);
            faceErrorWhileCalc = true;
            M_send_comp_msg("calcErrorStop", null, 0);
        }
    }

    // 返回最终的 subjectData
    return subjectData;
}

async function C_fetchOriginalRequest(smsId) {
    isFetchOriginal = true;

    // 如果 smsId 无效，直接返回
    if (!smsId) {
        console.warn("[fetchOriginalRequest] Invalid semester ID.");
        return;
    }

    const urlPattern = `https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetStuSemesterDynamicScore?semesterId=${smsId}&gcalc=noRedirect`;

    try {
        // 发起请求并解析响应
        const response = await fetch(urlPattern);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const originalCourseInfoList = data?.data?.studentSemesterDynamicScoreBasicDtos || [];
        console.log("OriginalData:", originalCourseInfoList);

        isFetchOriginal = false;

        for (const courseInfo of originalCourseInfoList) {
            const subjectInfo = await C_fetchSubjectEName(smsId, courseInfo.subjectId);

            const course = {
                className: courseInfo.className,
                subjectId: courseInfo.subjectId,
                scoreMappingId: courseInfo.scoreMappingId,
                classEName: courseInfo.classEName,
                smsId: smsId,
                subjectInfo: subjectInfo,
                classId: courseInfo.classId,
                subjectName: courseInfo.subjectName,
                subjectEName: courseInfo.subjectEName,
                subjectScore: courseInfo.subjectScore,
                updateDate: courseInfo.updateDate,
                isInGrade: courseInfo.isInGrade,
                classType: courseInfo.classType,
                isOriginal: true,
                source: "original"
            };

            const legacyStorageKey = buildLegacySubjectKey(smsId, courseInfo.subjectId);
            const classScopedKey = buildClassScopedSubjectKey(smsId, courseInfo.subjectId, courseInfo.classId);

            if (classScopedKey) {
                await chrome.storage.local.remove(classScopedKey);
                await saveToChromeStorage(classScopedKey, course);
            }

            await chrome.storage.local.remove(legacyStorageKey);
            await saveToChromeStorage(legacyStorageKey, course);
        }
    } catch (error) {
        console.error('[fetchOriginalRequest] Error fetching subject data:', error);
        M_send_str_msg("tip_err",`计算 ${smsId} 学期时出现问题: ${error}`, 0);
        faceErrorWhileCalc = true;
        M_send_comp_msg("calcErrorStop", null, 0);
        return false;
    }

    return true;
}

function M_send_str_msg(msgtype, dataa,non){
    M_send_comp_msg(msgtype, {cont:dataa}, 0);
}

async function C_fetchSubjectEName(semesterId, subjectId) {
    if (!semesterId || !subjectId) {
        console.warn("[fetchSubjectEName] Invalid semesterId or subjectId.");
        return null;
    }

    const url = `https://tsinglanstudent.schoolis.cn/api/LearningTask/GetStuSubjectListForStatisticsSelect?semesterId=${semesterId}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const subjectData = data?.data?.find(subject => subject.id === subjectId);

        if (subjectData) {
            return {
                ename: subjectData.eName,
                subjectCode: subjectData.subjectCode,
                semesterId,
                subjectId
            };
        } else {
            console.warn(`[fetchSubjectEName] Subject with ID ${subjectId} not found.`);
        }

        return null;
    } catch (error) {
        console.error('[fetchSubjectEName] Error fetching subject eName:', error);
        return null;
    }
}



async function ShowChromeStorage() {
    const items = await new Promise((resolve) => {
        chrome.storage.local.get(null, (result) => {
            resolve(result);
        });
    });

    console.log("Current chrome.storage.local content:");
    for (const [key, value] of Object.entries(items)) {
        console.log(`[Key]: ${key}, [Value]:`, value);
    }
}



async function C_BuildDynamicScoreRule(semesterId) {
    //This function also Calculates the GPA
    let gpalist =  [];

    if (!semesterId) {
        console.error("[C_BuildDynamicScoreRule] Invalid semester ID.");
        return;
    }
     
    const mappingRules = await C_FetchMappingRules(semesterId);
    // 初始化 JSON 数据模板
    const jsonResponse = {
        data: {
            studentSemesterDynamicScoreBasicDtos: [],
            scoreMappingList: []
        },
        msgCN: null,
        msgEN: null,
        state: 0,
        msg: null
    };

    if (Array.isArray(mappingRules)) {
        jsonResponse.data.scoreMappingList = [...mappingRules]; 
    } else {
        console.warn("[C_BuildDynamicScoreRule] mappingRules is Empty");
        jsonResponse.data.scoreMappingList = []; 
    }

    const gcalcMapping_apWeight={ "scoresMappingId": 801016, "isUseGpa": true, "scoreMappingConfigs": [ { "displayName": "A+", "minValue": 97, "maxValue": 9999.9, "isContainMin": true, "isContainMax": true, "sort": 0, "gpa": 4.8 }, { "displayName": "A", "minValue": 93, "maxValue": 96.9, "isContainMin": true, "isContainMax": true, "sort": 1, "gpa": 4.5 }, { "displayName": "A-", "minValue": 90, "maxValue": 92.9, "isContainMin": true, "isContainMax": true, "sort": 2, "gpa": 4.2 }, { "displayName": "B+", "minValue": 87, "maxValue": 89.9, "isContainMin": true, "isContainMax": true, "sort": 3, "gpa": 3.8 }, { "displayName": "B", "minValue": 83, "maxValue": 86.9, "isContainMin": true, "isContainMax": true, "sort": 4, "gpa": 3.5 }, { "displayName": "B-", "minValue": 80, "maxValue": 82.9, "isContainMin": true, "isContainMax": true, "sort": 5, "gpa": 3.2 }, { "displayName": "C+", "minValue": 77, "maxValue": 79.9, "isContainMin": true, "isContainMax": true, "sort": 6, "gpa": 2.8 }, { "displayName": "C", "minValue": 73, "maxValue": 76.9, "isContainMin": true, "isContainMax": true, "sort": 7, "gpa": 2.5 }, { "displayName": "C-", "minValue": 70, "maxValue": 72.9, "isContainMin": true, "isContainMax": true, "sort": 8, "gpa": 2.2 }, { "displayName": "D+", "minValue": 67, "maxValue": 69.9, "isContainMin": true, "isContainMax": true, "sort": 9, "gpa": 1.8 }, { "displayName": "D", "minValue": 63, "maxValue": 66.9, "isContainMin": true, "isContainMax": true, "sort": 10, "gpa": 1.5 }, { "displayName": "D-", "minValue": 60, "maxValue": 62.9, "isContainMin": true, "isContainMax": true, "sort": 11, "gpa": 1.2 }, { "displayName": "F", "minValue": 0, "maxValue": 59.9, "isContainMin": true, "isContainMax": true, "sort": 12, "gpa": 0 } ] };
    const gcalcMapping_noWeight={ "scoresMappingId": 601016, "isUseGpa": true, "scoreMappingConfigs": [ { "displayName": "A+", "minValue": 97, "maxValue": 9999.9, "isContainMin": true, "isContainMax": true, "sort": 0, "gpa": 4.3 }, { "displayName": "A", "minValue": 93, "maxValue": 96.9, "isContainMin": true, "isContainMax": true, "sort": 1, "gpa": 4 }, { "displayName": "A-", "minValue": 90, "maxValue": 92.9, "isContainMin": true, "isContainMax": true, "sort": 2, "gpa": 3.7 }, { "displayName": "B+", "minValue": 87, "maxValue": 89.9, "isContainMin": true, "isContainMax": true, "sort": 3, "gpa": 3.3 }, { "displayName": "B", "minValue": 83, "maxValue": 86.9, "isContainMin": true, "isContainMax": true, "sort": 4, "gpa": 3 }, { "displayName": "B-", "minValue": 80, "maxValue": 82.9, "isContainMin": true, "isContainMax": true, "sort": 5, "gpa": 2.7 }, { "displayName": "C+", "minValue": 77, "maxValue": 79.9, "isContainMin": true, "isContainMax": true, "sort": 6, "gpa": 2.3 }, { "displayName": "C", "minValue": 73, "maxValue": 76.9, "isContainMin": true, "isContainMax": true, "sort": 7, "gpa": 2 }, { "displayName": "C-", "minValue": 70, "maxValue": 72.9, "isContainMin": true, "isContainMax": true, "sort": 8, "gpa": 1.7 }, { "displayName": "D+", "minValue": 67, "maxValue": 69.9, "isContainMin": true, "isContainMax": true, "sort": 9, "gpa": 1.3 }, { "displayName": "D", "minValue": 63, "maxValue": 66.9, "isContainMin": true, "isContainMax": true, "sort": 10, "gpa": 1 }, { "displayName": "D-", "minValue": 60, "maxValue": 62.9, "isContainMin": true, "isContainMax": true, "sort": 11, "gpa": 0.7 }, { "displayName": "F", "minValue": 0, "maxValue": 59.9, "isContainMin": true, "isContainMax": true, "sort": 12, "gpa": 0 } ] };
    
    jsonResponse.data.scoreMappingList.push(gcalcMapping_apWeight);
    jsonResponse.data.scoreMappingList.push(gcalcMapping_noWeight);

    try {
        // 遍历 chrome.storage.local 获取所有数据
        const allStorageData = await new Promise((resolve) => {
            chrome.storage.local.get(null, (items) => resolve(items));
        });

        // 筛选和映射数据到 JSON
        const classScopedCourseKeys = [];
        const legacyCourseKeys = [];

        Object.keys(allStorageData).forEach((key) => {
            const parts = key.split('|');
            if (parts.length < 2) {
                return;
            }

            const [storedSemesterId, subjectIdPart, classIdPart] = parts;
            if (storedSemesterId !== String(semesterId)) {
                return;
            }

            const subjectIdIsNumber = subjectIdPart !== undefined && subjectIdPart !== '' && !Number.isNaN(Number(subjectIdPart));
            if (!subjectIdIsNumber) {
                return;
            }

            const classIdIsNumber = classIdPart !== undefined && classIdPart !== '' && !Number.isNaN(Number(classIdPart));
            if (classIdIsNumber) {
                classScopedCourseKeys.push(key);
            } else if (parts.length === 2) {
                legacyCourseKeys.push(key);
            }
        });

        const keysToUse = classScopedCourseKeys.length > 0 ? classScopedCourseKeys : legacyCourseKeys;

        keysToUse.forEach((key) => {
            const courseData = allStorageData[key];
            if (!courseData || courseData.subjectId === undefined) {
                return;
            }

            gpalist.push({
                subjectName: courseData?.subjectEName ?? '',
                subjectScore: courseData?.subjectScore ?? null
            });

            const className = courseData?.className ?? '';
            const classEName = courseData?.classEName ?? '';
            const subjectName = courseData?.subjectName ?? '';
            const subjectEName = courseData?.subjectEName ?? '';

            const dto = {
                grade: null,
                classType: courseData?.classType ?? null,
                classId: courseData?.classId ?? null,
                className: className.length > 30 ? className.substring(0, 28) + '..' : className,
                classEName: classEName.length > 30 ? classEName.substring(0, 28) + '..' : classEName,
                subjectId: courseData?.subjectId ?? null,
                subjectName: subjectName.length > 26 ? subjectName.substring(0, 24) + '..' : subjectName,
                subjectEName: subjectEName.length > 26 ? subjectEName.substring(0, 24) + '..' : subjectEName,
                isInGrade: courseData?.isInGrade ?? null,
                subjectScore: courseData?.subjectScore ?? null,
                scoreMappingId: courseData?.scoreMappingId ?? null,
                updateDate: courseData?.updateDate ?? null,
                subjectTotalScore: 100,
                scoreType: 1,
                levelString: ""
            };
            
            jsonResponse.data.studentSemesterDynamicScoreBasicDtos.push(dto);
        });
        saveToChromeStorage(`${semesterId}|SubjectPerformanceList`, jsonResponse);
        saveToChromeStorage(`${semesterId}|GPAList`, gpalist);
        await C_CalcGPAForSemester(semesterId,gpalist,"calced");
        // 转换 JSON 数据为 data URL
        const jsonDataUrl = `data:application/json,${encodeURIComponent(JSON.stringify(jsonResponse))}`;

        //console.log("[C_BuildDynamicScoreRule] JSON data URL:", jsonDataUrl);
        // 创建规则
        chrome.declarativeNetRequest.updateDynamicRules(
            {
                addRules: [
                    {
                        id: semesterId, 
                        priority: 1,
                        action: {
                            type: "redirect",
                            redirect: {
                                url: jsonDataUrl
                            }
                        },
                        condition: {
                            regexFilter: `https://tsinglanstudent\\.schoolis\\.cn/api/DynamicScore/GetStuSemesterDynamicScore\\?semesterId=${semesterId}`,
                            resourceTypes: ["xmlhttprequest"]
                        }
                    }
                ],
                removeRuleIds: [semesterId] // 移除已有的规则
            },
            () => {
                //console.log("[C_BuildDynamicScoreRule] Rule created successfully.");
            }
        );
    } catch (error) {
        console.error("[C_BuildDynamicScoreRule] Error:", error);
    }   
}

async function C_FetchMappingRules(semesterId) {
    if (!semesterId) {
        console.error("[C_FetchMappingRules] Invalid semester ID.");
        return null;
    }

    const url = `https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetStuSemesterDynamicScore?semesterId=${semesterId}&gcalc=noRedirect`;

    try {
        // 发起请求获取数据
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonData = await response.json();

        // 提取并返回 scoreMappingList
        return jsonData?.data?.scoreMappingList || [];
    } catch (error) {
        console.error("[C_FetchMappingRules] Error fetching mapping rules:", error);
        return [];
    }
}


function M_initDeclaritiveRules() {
    const noRedirectRule = {
        id: 1000, 
        priority: 1016, 
        action: {
            type: "allow" // 允许请求，不受后续规则影响
        },
        condition: {
            regexFilter: ".*&gcalc=noRedirect.*", // 匹配包含 "&gcalc=noRedirect" 的请求
            resourceTypes: ["xmlhttprequest", "sub_frame", "main_frame"] // 适用的资源类型
        }
    };

    chrome.declarativeNetRequest.updateDynamicRules(
        {
            addRules: [noRedirectRule], // 添加规则
            removeRuleIds: [1000] // 确保先移除同 ID 的旧规则
        },
        () => {
        //    console.log("[M_initDeclaritiveRules] High-priority noRedirect rule created.");
        }
    );
}


function M_send_comp_msg(msgtype,data,redotimes){
    if(redotimes<8){
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            let message = {
                type: msgtype,
                data: data
            };
            try{
                chrome.tabs.sendMessage(tabs[0].id, message);
            }catch(e){
                setTimeout(() => { 
                    M_send_comp_msg(msgtype,data,redotimes+1);
                }, (redotimes>0) ? (redotimes*100+50):1000);
            }
            
        });
    }
 
 }

 function M_clearCalcedData() {
    chrome.storage.local.get(null, (items) => {
        const keysToRemove = Object.keys(items).filter(key => {
            return key.includes('|') || key.toLowerCase().includes('gpa') || key.toLowerCase().includes('lastUpdate');
        });

        if (keysToRemove.length > 0) {
            chrome.storage.local.remove(keysToRemove, () => {
                console.log(`[clearCalcedData] Removed ${keysToRemove.length} items:`, keysToRemove);
            });
        } else {
            console.log("[clearCalcedData] No matching items found.");
        }
    });
}
function M_clearRedirectRules() {
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
        const ruleIds = rules.map(rule => rule.id);

        if (ruleIds.length > 0) {
            chrome.declarativeNetRequest.updateDynamicRules(
                {
                    removeRuleIds: ruleIds
                },
                () => {
                    console.log(`[clearRedirectRules] Removed ${ruleIds.length} rules:`, ruleIds);
                }
            );
        } else {
            console.log("[clearRedirectRules] No dynamic rules to remove.");
        }
    });
}



chrome.webRequest.onBeforeRequest.addListener(
    async (details) => {
        const assignmentInfoPattern = "schoolis.cn/api/LearningTask/GetDetail?learningTaskId=";

        // 判断是否是需要处理的请求
        if (
            details.url.includes(assignmentInfoPattern) &&
            (!details.url.includes("&gcalcSysFetch") || details.url.includes("galc_teams"))
        ) {
            if (details.url.includes("noRedirect") || details.url.includes("gcalc")) {
                return; // URL 已标记，直接放行
            }

            try {
                // Fetch 原始数据，避免循环修改
                const fetchUrl = `${details.url}&gcalc=noRedirect`;
                const response = await fetch(fetchUrl);
                const result = await response.json();

                const data = result?.data;
                if (!data) return;

                await delay(10);

                // 根据数据状态发送消息
                if (data.finishState === null) {
                    M_send_str_msg("showSubmitLinkAnsBtn", data.id, 0);
                    console.log("SEND addSubmitLinkBtn");
                    return;
                }

                if (data.classAvgScore === null || data.classMaxScore === null) {
                    return;
                }

                if (data.finishState === 1 && data.comment === "" && data.score === 0) {
                    // Fetch hidden score
                    C_getScoreForAssignment(
                        data.id,
                        data.classId,
                        data.subjectId,
                        data.schoolSemesterId
                    );
                    M_send_str_msg("appendHiddenScore", {
                        state: "loading",
                        assignment: {
                  
                        },
                    }, 0);
                    
                }

                // 构建分数数据并发送消息
                const tmpdata = {
                    avgS: data.classAvgScore,
                    maxS: data.classMaxScore,
                    totalS: data.totalScore,
                    usrS: data.score,
                };

                if (tmpdata.avgS > 0) {
                    M_send_comp_msg("append2Scores", tmpdata, 0);
                }
            } catch (error) {
                console.error("[Assignment Info] Error:", error);
            }
        }
    },
    { urls: ["*://*.schoolis.cn/api/LearningTask/GetDetail*"] } // 模糊匹配目标 URL
);

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const hiddenScoreSessions = new Map();

function clearHiddenScoreSession(learningTaskId) {
    if (!learningTaskId) {
        return;
    }

    hiddenScoreSessions.delete(learningTaskId);
}


async function C_calcScoreForHiddenAssignment(learningTaskId, classId, subjectId, semesterId) {
    try {
        const subjectURL = `https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetDynamicScoreDetail?classId=${classId}&subjectId=${subjectId}&semesterId=${semesterId}&gcalc=gcalc_bg`;
        const targetLearningTaskURL = `https://tsinglanstudent.schoolis.cn/api/LearningTask/GetDetail?learningTaskId=${learningTaskId}&gcalc=gcalc_bg`;

        const targetDetailResponse = await fetch(targetLearningTaskURL);
        const targetDetail = await targetDetailResponse.json();
        const targetTaskData = targetDetail?.data;
        if (!targetTaskData || !Array.isArray(targetTaskData.evaProjects) || targetTaskData.evaProjects.length === 0) {
            console.error("[HiddenScore] error: unable to fetch target task category");
            M_send_str_msg("appendHiddenScore", -1, 0);
            return;
        }

        const targetCategory = targetTaskData.evaProjects.find(project => project && project.id);
        const targetCategoryId = targetCategory.id;
        if (!targetCategoryId) {
            console.error("[HiddenScore] error: invalid target category");
            M_send_str_msg("appendHiddenScore", -1, 0);
            return;
        }

        const semesterRange = await C_getSemesterDateInfo(semesterId);
        if (!semesterRange || !semesterRange.startDate || !semesterRange.endDate) {
            console.error("[HiddenScore] error: unable to fetch semester date range");
            M_send_str_msg("appendHiddenScore", -1, 0);
            return;
        }

        const tasksURL = `https://tsinglanstudent.schoolis.cn/api/LearningTask/GetList?semesterId=${semesterId}&subjectId=${subjectId}&typeId=null&key=&beginTime=${semesterRange.startDate}&endTime=${semesterRange.endDate}&mode=null&pageIndex=1&pageSize=100&gcalc=gcalc_bg&gcalc=noRedirect`;
        const tasksResponse = await fetch(tasksURL);
        const tasksResult = await tasksResponse.json();
        const tasks = tasksResult?.data?.list || [];

        const subjectResponse = await fetch(subjectURL);
        const subjectData = await subjectResponse.json();
        if (subjectData?.msg != null || subjectData?.data == null) {
            M_send_str_msg("appendHiddenScore", -1, 0);
            return;
        }

        if (tasks.length === 0) {
            console.error("[HiddenScore] error: no tasks found for subject");
            M_send_str_msg("appendHiddenScore", -1, 0);
            return;
        }

        const categoryInfo = C_findEvaluationProject(subjectData?.data?.evaluationProjectList, targetCategoryId);

        if (!categoryInfo || typeof categoryInfo.score !== "number") {
            console.error("[HiddenScore] error: unable to fetch subject category score");
            M_send_str_msg("appendHiddenScore", -1, 0);
            return;
        }

        hiddenScoreSessions.set(learningTaskId, {
            learningTaskId,
            classId,
            subjectId,
            semesterId,
            targetCategoryId,
            categoryScore: categoryInfo.score,
            tasks,
            isCalculating: false,
        });

        M_send_str_msg("appendHiddenScore", {
            state: "ready",
            assignment: {
                learningTaskId,
                classId,
                subjectId,
                semesterId,
            },
        }, 0);
    } catch (error) {
        console.error("[HiddenScore] error:", error);
        M_send_str_msg("appendHiddenScore", -1, 0);
        clearHiddenScoreSession(learningTaskId);
    }
}

async function C_continueHiddenScoreCalculation(learningTaskId) {
    const session = hiddenScoreSessions.get(learningTaskId);

    if (!session) {
        console.error("[HiddenScore] error: session not found for", learningTaskId);
        M_send_str_msg("appendHiddenScore", -1, 0);
        return;
    }

    if (session.isCalculating) {
        return;
    }

    session.isCalculating = true;
    hiddenScoreSessions.set(learningTaskId, session);

    try {
        let categoryTaskCount = 0;
        let knownScoreSum = 0;
        let otherHiddenCount = 0;

        for (const task of session.tasks) {
            if (task.finishState === null) {
                continue;
            }

            const taskDetailUrl = `https://tsinglanstudent.schoolis.cn/api/LearningTask/GetDetail?learningTaskId=${task.id}&gcalc=gcalc_bg`;
            const taskDetailResponse = await fetch(taskDetailUrl);
            const taskDetail = await taskDetailResponse.json();
            const taskData = taskDetail?.data;

            if (!taskData || !Array.isArray(taskData.evaProjects)) {
                continue;
            }

            const belongsToTargetCategory = taskData.evaProjects.some(project => project.id === session.targetCategoryId);
            if (!belongsToTargetCategory) {
                continue;
            }

            categoryTaskCount++;
            const isHiddenTask = task.finishState === 1 && task.syncTime === "0001-01-01T00:00:00";

            if (isHiddenTask && task.id !== learningTaskId) {
                otherHiddenCount++;
                continue;
            }

            if (!isHiddenTask) {
                const scoreValue = typeof taskData.score === "number" ? taskData.score : task.score;
                if (typeof scoreValue === "number") {
                    knownScoreSum += scoreValue;
                }
            }
        }

        if (otherHiddenCount > 0) {
            console.error("[HiddenScore] error: multiple hidden tasks detected in category");
            M_send_str_msg("appendHiddenScore", -1, 0);
            clearHiddenScoreSession(learningTaskId);
            return;
        }

        if (categoryTaskCount === 0) {
            console.error("[HiddenScore] error: no tasks found in the same category");
            M_send_str_msg("appendHiddenScore", -1, 0);
            clearHiddenScoreSession(learningTaskId);
            return;
        }

        const totalCategoryScore = session.categoryScore * categoryTaskCount;
        const hiddenScore = totalCategoryScore - knownScoreSum;
        let roundedScore = Math.round(hiddenScore * 10) / 10;

        // 极值兜底：分数应在 10–110 之间；超出说明
        // (a) 该任务实际处于"批改中且未填分"状态（类别均分还未包含此任务）
        // (b) 类别中存在多个未公开成绩，"多 hidden" 检测漏判
        if (!Number.isFinite(roundedScore) || roundedScore < 10 || roundedScore > 110) {
            console.warn("[HiddenScore] out-of-range:", roundedScore,
                "categoryScore=", session.categoryScore,
                "categoryTaskCount=", categoryTaskCount,
                "knownScoreSum=", knownScoreSum);
            M_send_str_msg("appendHiddenScore", {
                state: "blocked",
                message: (navigator.language || "").startsWith("zh")
                    ? "存在多个批改中任务，或老师尚未填入分数，暂时无法计算"
                    : "Multiple in-grading tasks, or teacher hasn't entered scores yet — cannot calculate"
            }, 0);
            clearHiddenScoreSession(learningTaskId);
            return;
        }

        // >100 但 ≤110 的情况：钳制到 100（分数最高不应超过 100%）
        if (roundedScore > 100) {
            console.log("[HiddenScore] clamping", roundedScore, "to 100");
            roundedScore = 100;
        }

        console.log("[HiddenScore]", roundedScore);
        M_send_str_msg("appendHiddenScore", { state: "done", score: roundedScore }, 0);
    } catch (error) {
        console.error("[HiddenScore] error during calculation:", error);
        M_send_str_msg("appendHiddenScore", -1, 0);
    } finally {
        clearHiddenScoreSession(learningTaskId);
    }
}

// 静默计算单个隐藏分数。返回 number（成功）或 null（失败 / 无法计算）。
// 用于 V1 预测面板：批改中任务先尝试静默 calc，再决定显示方式。
async function computeHiddenScoreSilent(learningTaskId, classId, subjectId, semesterId) {
    try {
        const targetLearningTaskURL = `https://tsinglanstudent.schoolis.cn/api/LearningTask/GetDetail?learningTaskId=${learningTaskId}&gcalcSysFetch`;
        const targetDetailResponse = await fetch(targetLearningTaskURL);
        const targetDetail = await targetDetailResponse.json();
        const targetTaskData = targetDetail?.data;
        if (!targetTaskData || !Array.isArray(targetTaskData.evaProjects) || targetTaskData.evaProjects.length === 0) return null;

        const targetCategory = targetTaskData.evaProjects.find(project => project && project.id);
        const targetCategoryId = targetCategory?.id;
        if (!targetCategoryId) return null;

        const semesterRange = await C_getSemesterDateInfo(semesterId);
        if (!semesterRange || !semesterRange.startDate || !semesterRange.endDate) return null;

        const tasksURL = `https://tsinglanstudent.schoolis.cn/api/LearningTask/GetList?semesterId=${semesterId}&subjectId=${subjectId}&typeId=null&key=&beginTime=${semesterRange.startDate}&endTime=${semesterRange.endDate}&mode=null&pageIndex=1&pageSize=100&gcalc=gcalc_bg&gcalc=noRedirect`;
        const tasksResponse = await fetch(tasksURL);
        const tasksResult = await tasksResponse.json();
        const tasks = tasksResult?.data?.list || [];
        if (tasks.length === 0) return null;

        const subjectURL = `https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetDynamicScoreDetail?classId=${classId}&subjectId=${subjectId}&semesterId=${semesterId}&gcalc=gcalc_bg`;
        const subjectResponse = await fetch(subjectURL);
        const subjectData = await subjectResponse.json();
        if (subjectData?.msg != null || subjectData?.data == null) return null;

        const categoryInfo = C_findEvaluationProject(subjectData?.data?.evaluationProjectList, targetCategoryId);
        if (!categoryInfo || typeof categoryInfo.score !== "number") return null;

        let categoryTaskCount = 0;
        let knownScoreSum = 0;
        let otherHiddenCount = 0;

        for (const task of tasks) {
            if (task.finishState === null) continue;
            const taskDetailUrl = `https://tsinglanstudent.schoolis.cn/api/LearningTask/GetDetail?learningTaskId=${task.id}&gcalc=gcalc_bg`;
            const taskDetailResponse = await fetch(taskDetailUrl);
            const taskDetail = await taskDetailResponse.json();
            const taskData = taskDetail?.data;
            if (!taskData || !Array.isArray(taskData.evaProjects)) continue;
            const belongsToTargetCategory = taskData.evaProjects.some(project => project.id === targetCategoryId);
            if (!belongsToTargetCategory) continue;
            categoryTaskCount++;
            const isHiddenTask = task.finishState === 1 && task.syncTime === "0001-01-01T00:00:00";
            if (isHiddenTask && task.id !== learningTaskId) {
                otherHiddenCount++;
                continue;
            }
            if (!isHiddenTask) {
                const scoreValue = typeof taskData.score === "number" ? taskData.score : task.score;
                if (typeof scoreValue === "number") knownScoreSum += scoreValue;
            }
        }

        if (otherHiddenCount > 0) return null;
        if (categoryTaskCount === 0) return null;

        const totalCategoryScore = categoryInfo.score * categoryTaskCount;
        const hiddenScore = totalCategoryScore - knownScoreSum;
        const roundedScore = Math.round(hiddenScore * 10) / 10;
        if (!Number.isFinite(roundedScore) || roundedScore < 10 || roundedScore > 110) return null;
        return roundedScore > 100 ? 100 : roundedScore;
    } catch (error) {
        console.warn("[computeHiddenScoreSilent] error:", error);
        return null;
    }
}

async function C_getSemesterDateInfo(semesterId) {
    try {
        const response = await fetch("https://tsinglanstudent.schoolis.cn/api/School/GetSchoolSemesters");
        const data = await response.json();
        // 用宽松比较：semesterId 可能是字符串（来自消息/URL），API 返回是数字
        const target = Number(semesterId);
        const semester = data?.data?.find(item => Number(item.id) === target);
        if (!semester) {
            return null;
        }

        const normalizeDate = (value) => {
            if (!value) return null;
            return value.includes("T") ? value.split("T")[0] : value;
        };

        return {
            startDate: normalizeDate(semester.startDate),
            endDate: normalizeDate(semester.endDate),
        };
    } catch (error) {
        console.error("[HiddenScore] error: unable to fetch semester info", error);
        return null;
    }
}

function C_findEvaluationProject(projects, targetId) {
    if (!Array.isArray(projects)) {
        return null;
    }

    for (const project of projects) {
        const projectId = project.evaluationProjectId ?? project.id;
        if (Number(projectId) === Number(targetId)) {
            return project;
        }

        const childResult = C_findEvaluationProject(project.evaluationProjectList, targetId);
        if (childResult) {
            return childResult;
        }
    }

    return null;
}

async function C_getScoreForAssignment(learningTaskId, classId, subjectId, semesterId) {
    await C_calcScoreForHiddenAssignment(learningTaskId, classId, subjectId, semesterId);
    return;//25.11.19 旧版隐藏分数获取方法，由于教务修改接口已失效，暂时禁用此功能
    const url = `https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetDynamicScoreDetail?classId=${classId}&subjectId=${subjectId}&semesterId=${semesterId}&gcalc=gcalc_bg`;

    console.log(url);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const data = await response.json();
        // 遍历 evaluationProjectList 的 learningTaskAndExamList
        for (const evaluationProject of data.data.evaluationProjectList) {
            for (const task of evaluationProject.learningTaskAndExamList) {
                console.log(task);
                if (task.id === learningTaskId) {
                    console.log("Found task:", task.score);
                    return task.score; // 匹配成功，返回 ID
                }
            }
        }
        return null;
    } catch (error) {
        return null; 
    }
};


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message.type) return;

    // 让独立异步监听器处理 (return; 表示本监听器不负责响应)
    // 否则下方末尾的 sendResponse({status:"received"}) 会抢先关闭 channel
    if (message.type === "fetchManualAssignmentList") return;

    console.log(`[Service Worker] Received message:`, message);

    switch (message.type) {
        case "show_process":
            handleShowProcess(message.data, message.additionalData);
            break;
        case "bp-unbindTeams":
            // Remove consent, then clear stored tokens
            T_removeConsent()
                .finally(() => {
                    chrome.storage.local.set({ "MSaccessToken": "" });
                    chrome.storage.local.set({ "MSrefresh_token": "" });
                    chrome.storage.local.set({ "MS_LastSync_Calender": null });
                    chrome.storage.local.set({ "MS_LastSync_TeamsTask": null });
                    chrome.storage.local.set({ "MS_LastSync_XBTask": null });
                });
            break;
        case "bp-removeAllCalenderEvent":
            T_removeFromMSCalender("GCalcAutoSync_Class");
            T_removeFromMSCalender("GCalcAutoSync_Tasks_XB");
            T_removeFromMSCalender("GCalcAutoSync_Tasks_MS");
            saveToChromeStorage("MS_BeingSynced",[]);
            break;
        case "bp-openSettings":
            chrome.runtime.openOptionsPage();
            break;
        case "bp-startSyncCalender":
            T_startCalenderSync();
            break;
        case "bp-startSyncTeamsTask":
            T_startTeamsTaskSync();
            break;
        case "bp-refreshTeamsTask":
            T_fetchTeamsUserClassesAndAssignments();
            break;
        case "bp-forceInitMS":
            M_StartMSFeatures();
            break;
        case "bp-startSyncXBTask":
            T_startXBTaskSync();
            break;
        case "bp-checkOutdatedScore":
            M_checkOutdatedScore();
            break;
        case "openOptionsPage_GPA":
            chrome.runtime.openOptionsPage(() => {
                setTimeout(() => {
                    chrome.runtime.sendMessage({
                        type: "op_openGPASettings",
                    });
                }, 300);
            });
            break;
        case "openOptionsPage_MSBind":
            chrome.runtime.openOptionsPage(() => {
                setTimeout(() => {
                    chrome.runtime.sendMessage({
                        type: "op_openMSBindSettings",
                    });
                }, 300);
            });
            break;
        case "recalc_GPA":
            getFromChromeStorage(message.data+"|GPAList").then((gpalist) => {
                C_CalcGPAForSemester(message.data, gpalist,"edited");
                console.log("[recalc_GPA] recalc_GPA",gpalist);
            });
            
            break;
        case "saveEditedSubject":
            applySubjectPerformanceEditing(message.smsId,message.subjectId,message.data,message.subjectScore);
            console.log("[saveEditedSubject] saveEditedSubject",message.data);
            break;
        case "discardEditedSubject":
            discardSubjectPerformanceEditing(message.smsId,message.subjectId);
            console.log("[discardEditedSubject] discardEditedSubject",message.data);
            break;
        case "bindMSAccount":
            M_BindMSAccount(message.xbAccount);
            break;
        case "StartMSFeature":
             M_StartMSFeatures(message.xbAccount);
            break;
        case "startHiddenScoreCalc":
            {
                const taskId = message.learningTaskId || message.assignment?.learningTaskId;
                if (taskId) {
                    C_continueHiddenScoreCalculation(taskId);
                }
            }
            break;
    }

    sendResponse({ status: "received" }); // 确保响应，不然可能报错
});

// 独立监听器：V2 预测面板的手动 assignment 拉取，带 10 分钟缓存
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== "fetchManualAssignmentList") return;
    (async () => {
        try {
            const smsId = message.smsId;
            const subjectId = message.subjectId;
            const classId = message.classId;
            // cacheKey 带版本：v4 = 过滤掉 finishState===null 的 initiated 任务
            const cacheKey = `${smsId}|${subjectId}|V2PredictCache_v4`;

            // 清掉历史遗留的"预测面板顺手装上"的 GetDynamicScoreDetail 重定向规则
            // （这条规则会把 V2 详情请求顶成本地 V1 数据，本次修复后不再安装；这里再 best-effort 清一次）
            try {
                if (typeof classId === "number" && !Number.isNaN(classId)) {
                    chrome.declarativeNetRequest.updateDynamicRules({
                        removeRuleIds: [classId - Number(smsId)]
                    });
                }
            } catch (cleanupErr) {
                console.warn("[fetchManualAssignmentList] cleanup stale rule failed:", cleanupErr);
            }

            // 缓存命中（10 分钟以内）
            const cached = await getFromChromeStorage(cacheKey);
            if (cached && typeof cached.ts === "number" &&
                (Date.now() - cached.ts < 10 * 60 * 1000) &&
                Array.isArray(cached.evaluationProjectList) &&
                cached.evaluationProjectList.length > 0) {
                sendResponse({ evaluationProjectList: cached.evaluationProjectList, fromCache: true });
                return;
            }

            // 缓存失效或不存在：走 V1 (getSubjectGrades) 重新拉
            const semInfo = await C_getSemesterDateInfo(smsId);
            if (!semInfo || !semInfo.startDate || !semInfo.endDate) {
                sendResponse({ error: "no semester info", evaluationProjectList: [] });
                return;
            }
            // 关键：installRedirectRule=false —— 预测面板只是看一下数据，
            // 不要污染 declarativeNetRequest（否则成绩详情页会被这份本地 V1 数据顶替掉 V2 真实返回）
            const result = await getSubjectGrades(smsId, subjectId, semInfo.startDate, semInfo.endDate, classId, false);
            const list = result?.gradeDetails?.data?.evaluationProjectList || [];
            // 写缓存
            await saveToChromeStorage(cacheKey, { ts: Date.now(), evaluationProjectList: list });
            sendResponse({ evaluationProjectList: list, fromCache: false });
        } catch (e) {
            console.error("[fetchManualAssignmentList] error:", e);
            sendResponse({ error: String(e && e.message || e), evaluationProjectList: [] });
        }
    })();
    return true; // 异步响应：保持 message channel 开放
});

function logic_combineIdsBetter(smsId, subjectId) {
    const modulus = 10000000;
    const factor1 = 31;
    const factor2 = 101;
  
    const combinedValue = (smsId * factor1 + subjectId * factor2) % modulus;
    return combinedValue;
  }

async function discardSubjectPerformanceEditing(smsId, subjectId) {
    var subjectData = await getFromChromeStorage(`${smsId}|${subjectId}`);
    const storageKey = `${smsId}|SubjectPerformanceList`;
    var data = await getFromChromeStorage(storageKey);
    for (let i = 0; i < data.data.studentSemesterDynamicScoreBasicDtos.length; i++) {
        if (data.data.studentSemesterDynamicScoreBasicDtos[i].subjectId == subjectId){
            data.data.studentSemesterDynamicScoreBasicDtos[i].subjectScore = subjectData.subjectScore;
            data.data.studentSemesterDynamicScoreBasicDtos[i].subjectsubjectEName = subjectData.subjectEName;
            data.data.studentSemesterDynamicScoreBasicDtos[i].subjectName = subjectData.subjectName;
        }
    }
    saveToChromeStorage(storageKey, data);
    let semesterId = Number(smsId);
    const jsonDataUrl = `data:application/json,${encodeURIComponent(JSON.stringify(data))}`;

    console.log("[UpdateWholeRule] JSON data URL:", jsonDataUrl);
    // 创建规则
    chrome.declarativeNetRequest.updateDynamicRules(
        {
            addRules: [
                {
                    id: semesterId, 
                    priority: 1,
                    action: {
                        type: "redirect",
                        redirect: {
                            url: jsonDataUrl
                        }
                    },
                    condition: {
                        regexFilter: `https://tsinglanstudent\\.schoolis\\.cn/api/DynamicScore/GetStuSemesterDynamicScore\\?semesterId=${semesterId}`,
                        resourceTypes: ["xmlhttprequest"]
                    }
                }
            ],
            removeRuleIds: [semesterId] // 移除已有的规则
        },
        () => {
            console.log("[UpdateWholeRule（edit)] Rule created successfully.");
        }
    );
    console.log("EditedData:", data);
}
async function applySubjectPerformanceEditing(smsId, subjectId, assignmentList, subjectScore) {
    const storageKey = `${smsId}|SubjectPerformanceList`;
    var data = await getFromChromeStorage(storageKey);
    var subjectData = await getFromChromeStorage(`${smsId}|${subjectId}`); 
    for (let i = 0; i < data.data.studentSemesterDynamicScoreBasicDtos.length; i++) {
       // console.log("[applySubjectPerformanceEditing] applySubjectPerformanceEditing",data.data.studentSemesterDynamicScoreBasicDtos[i].subjectId,subjectId);
        if (data.data.studentSemesterDynamicScoreBasicDtos[i].subjectId == subjectId) {
        
            //console.log("[applySubjectPerformanceEditing] Found matching subjectId:", data.data.studentSemesterDynamicScoreBasicDtos[i].subjectId);
            data.data.studentSemesterDynamicScoreBasicDtos[i].subjectScore = subjectScore;
            data.data.studentSemesterDynamicScoreBasicDtos[i].subjectsubjectEName = "[Edited]"+subjectData.subjectEName;
            data.data.studentSemesterDynamicScoreBasicDtos[i].subjectName = "[Edited]"+subjectData.subjectName; 
            break;
        }
      }
    saveToChromeStorage(storageKey, data);
    let semesterId = Number(smsId);
    const jsonDataUrl = `data:application/json,${encodeURIComponent(JSON.stringify(data))}`;

    console.log("[UpdateWholeRule] JSON data URL:", jsonDataUrl);
    // 创建规则
    chrome.declarativeNetRequest.updateDynamicRules(
        {
            addRules: [
                {
                    id: semesterId, 
                    priority: 1,
                    action: {
                        type: "redirect",
                        redirect: {
                            url: jsonDataUrl
                        }
                    },
                    condition: {
                        regexFilter: `https://tsinglanstudent\\.schoolis\\.cn/api/DynamicScore/GetStuSemesterDynamicScore\\?semesterId=${semesterId}`,
                        resourceTypes: ["xmlhttprequest"]
                    }
                }
            ],
            removeRuleIds: [semesterId] // 移除已有的规则
        },
        () => {
            console.log("[UpdateWholeRule] Rule created successfully.");
        }
    );
    console.log("EditedData:", data);

    

}
function NameInList(name, list) {
    try {
        if(list===null){
            return false;
        }
        const lowerCaseName = name.toLowerCase();
        for (let i = 0; i < list.length; i++) {
            if (list[i].length < 5) {
                if (name.includes(list[i])) {
                    //console.log("[NameInList] Found matching name:", list[i],name);
                    return true;
                }
            } else {
                if (lowerCaseName.includes(list[i].toLowerCase())) {
                  //  console.log("[NameInList] Found matching name:", list[i],name);
                    return true;
                }
            }
        }
        return false;
    } catch (e) {
        return false;
    }

}


async function C_CalcGPAForSemester(semesterId,gpalist,source) {
    let weightRules = await getFromChromeStorage("subjectWeightRules")
    let specialWeightRules = await getFromChromeStorage("specialWeightRules")
    console.log("weightrules",weightRules);

    let weightedGPA = 0;
    let nonweightedGPA = 0;
    let totalWeight = 0;
    // LowWeight = ["Fine Art","IT ","Electi","Drama","Chinese Painting","Architectural","Dance","Percussion","Vocal","Media","Programming","Spanish","Philosophy","Skills","Journalism","Creative"];
    // NoWeight = ["Homeroom"];
    // HighWeight = ["AP","AS","A2","A Level","ALevel"];


    let LowWeight = weightRules.low;
    let NoWeight = weightRules.no;
    let HighWeight = weightRules.high;
    let NormalWeight = [];
    if(specialWeightRules!==null){
        for(const rule of specialWeightRules){
            const ruleName = Object.keys(rule)[0];
            const ruleWeight = rule[ruleName]; 
            if(ruleWeight==1.0){
                NormalWeight.unshift(ruleName);
            }
        }
    }
    console.log("LowWeight",LowWeight);
    console.log("NoWeight",NoWeight);
    console.log("HighWeight",HighWeight);
    console.log("NormalWeight",NormalWeight);   
    let ChineseGPA = 0;
    let ChineseWeight = 0; 

    let back_ChineseScore;
    let back_CHuScore;

    gpalist.forEach((subject,index) => {
        if(subject.subjectScore===null||subject.subjectScore===undefined){
            gpalist[index].gpa=-1;
        }else{
            if(subject.subjectName.includes("Chinese")&&(!subject.subjectName.includes("second langua")&&(!subject.subjectName.includes("evel"))&&(!subject.subjectName.includes("AP")))){
                if(subject.subjectName.includes("History")||subject.subjectName.includes("Humani")||subject.subjectName.includes("eogra")){
                    ChineseGPA += (subject.subjectScore*(1/3));
                    ChineseWeight += (1/3);
                    back_CHuScore = subject.subjectScore;
                }else{
                    ChineseGPA += (subject.subjectScore*(2/3));
                    ChineseWeight += (2/3);
                    back_ChineseScore = subject.subjectScore;
                }
                gpalist[index].gpa=-1;
            }else{
                const subjectNameLower = subject.subjectName.toLowerCase();
                let matchedRule = null;
                for (const rule of specialWeightRules) {
                    // Get the single key and value from the rule object
                    const ruleName = Object.keys(rule)[0];
                    const ruleWeight = rule[ruleName];
                    const ruleNameLower = ruleName.toLowerCase();

                    // Log to see what's being checked
                    console.log(`Checking subject: "${subjectNameLower}" against keyword: "${ruleNameLower}"`);

                    // Check if the subject name includes the rule name (case-insensitive)
                    if (subjectNameLower.includes(ruleNameLower)) {
                        console.log("Match found!", { keyword: ruleName, weight: ruleWeight });
                        matchedRule = { keyword: ruleName, weight: ruleWeight };
                        break; // Exit the loop on the first match
                    }
                }
                if (matchedRule) {  
                    gpalist[index].gpa = ScoreToGPA(subject.subjectScore);
                    // 如果特殊权重值等于 1.5，执行加权逻辑
                    if (matchedRule.weight === 1.5) {
                        gpalist[index].weight = 1;
                        gpalist[index].gpa = gpalist[index].gpa > 0 ? gpalist[index].gpa + 0.5 : gpalist[index].gpa;
                        gpalist[index].isWeighted = true;
                    } else {
                        // 对于其他特殊权重，直接设置 weight
                        gpalist[index].weight = matchedRule.weight;
                        gpalist[index].isWeighted = false;
                    }
                    console.log("SpecialWeightMatched!",subject.subjectName,matchedRule);
                }else{
                    gpalist[index].gpa = ScoreToGPA(subject.subjectScore);
                    gpalist[index].isWeighted = false;
                    if(NameInList(subject.subjectName,NormalWeight))
                        gpalist[index].weight = 1;
                    else if(NameInList(subject.subjectName,HighWeight)){
                        gpalist[index].weight = 1;
                        gpalist[index].gpa = gpalist[index].gpa>0? gpalist[index].gpa+0.5:gpalist[index].gpa;
                        gpalist[index].isWeighted = true;
                    }else if(NameInList(subject.subjectName,NoWeight)){
                        gpalist[index].weight = 0;
                    }else if(NameInList(subject.subjectName,LowWeight)){
                        gpalist[index].weight = 0.5;
                    }else{
                        gpalist[index].weight = 1;
                    }
                }
                weightedGPA += subject.gpa * gpalist[index].weight;
                totalWeight += gpalist[index].weight; 
                nonweightedGPA += (subject.gpa>0?(subject.isWeighted?(subject.gpa-0.5):subject.gpa):(subject.gpa)) * gpalist[index].weight;
            }
        }
    });

    gpalist = gpalist.filter(item => item.gpa !== -1);
    if(ChineseWeight>0){
        gpalist.push({
            subjectName: "Chinese Culture",
            subjectScore: ChineseGPA/ChineseWeight,
            gpa: ScoreToGPA(ChineseGPA/ChineseWeight.toFixed(2)),
            weight: 1,
            isWeighted: false,
            chiAdditionalData: {chinese:back_ChineseScore,history:back_CHuScore}
        });
        nonweightedGPA += ScoreToGPA(ChineseGPA/ChineseWeight);
        weightedGPA += ScoreToGPA(ChineseGPA/ChineseWeight);
        totalWeight +=1;
        console.log("ChineseGPAPushed!",gpalist[gpalist.length]);
    }
    
    console.log(totalWeight,weightedGPA,nonweightedGPA);
    weightedGPA /= totalWeight;
    nonweightedGPA /= totalWeight;
    
    saveToChromeStorage(`gpaList${semesterId}`, gpalist);
    let schoolisGPA = null;

    console.log(gpalist,weightedGPA,nonweightedGPA)
    const response = await fetch("https://tsinglanstudent.schoolis.cn/api/DynamicScore/GetGpa?semesterId="+semesterId);
    if (!response.ok) {throw new Error(`CalcGPAHTTPError:${response.status}`);}
    const data = await response.json();
    
    if((data.source===null||data.source===undefined)&&source!=="edited"){
        schoolisGPA = data.data;
    }
    
    console.log("save",semesterId,{gpa:weightedGPA,noweight_gpa:nonweightedGPA,schoolisGPA:schoolisGPA});
    saveToChromeStorage(`gpa${semesterId}`, {gpa:weightedGPA,noweight_gpa:nonweightedGPA,schoolisGPA:schoolisGPA,source});

    if(schoolisGPA===null){
        const jsonResponse = {
            "data": formatNumber(weightedGPA,2),
            "msgCN": null,
            "msgEN": null,
            "state": 0,
            "msg": null,
            "source": source
        };

        const jsonDataUrl = `data:application/json,${encodeURIComponent(JSON.stringify(jsonResponse))}`;

        // 创建规则
        
        chrome.declarativeNetRequest.updateDynamicRules(
            {
                removeRuleIds: [parseInt("6"+semesterId)], // Ensure removeRuleIds is also an integer
                addRules: [
                {
                    id: parseInt("6"+semesterId), // Explicitly convert to an integer
                    priority: 1,
                    action: {
                    type: "redirect",
                    redirect: {
                        url: jsonDataUrl
                    }
                    },
                    condition: {
                    regexFilter: `https://tsinglanstudent\\.schoolis\\.cn/api/DynamicScore/GetGpa\\?semesterId=${semesterId}`,
                    resourceTypes: ["xmlhttprequest"]
                    }
                }
                ],
            },
            () => {
                console.log("CALCGPA:Declarative Net Request rule updated successfully.", semesterId, jsonDataUrl);
            }
            );
    }
}

function ScoreToGPA(score) {;
    const scoreMappingConfigs = [
      { "minValue": 97, "maxValue": 9999.9, "gpa": 4.3 },
      { "minValue": 93, "maxValue": 96.9999, "gpa": 4 },
      { "minValue": 90, "maxValue": 92.9999, "gpa": 3.7 },
      { "minValue": 87, "maxValue": 89.9999, "gpa": 3.3 },
      { "minValue": 83, "maxValue": 86.9999, "gpa": 3 },
      { "minValue": 80, "maxValue": 82.9999, "gpa": 2.7 },
      { "minValue": 77, "maxValue": 79.9999, "gpa": 2.3 },
      { "minValue": 73, "maxValue": 76.9999, "gpa": 2 },
      { "minValue": 70, "maxValue": 72.9999, "gpa": 1.7 },
      { "minValue": 67, "maxValue": 69.9999, "gpa": 1.3 },
      { "minValue": 63, "maxValue": 66.9999, "gpa": 1 },
      { "minValue": 60, "maxValue": 62.9999, "gpa": 0.7 },
      { "minValue": 0, "maxValue": 59.9999, "gpa": 0 }
    ];

    for (const config of scoreMappingConfigs) {
      if (score >= config.minValue && score <= config.maxValue) {
        return config.gpa;
      }
    }
    return 0; 
}

function formatNumber(number, decimalPlaces) {
    const formatted = Number(parseFloat(number.toFixed(decimalPlaces)));
    return String(formatted);
}





//###########################TEAMS BINDING SECTION############################
async function getCryptoKey() {
  const platformInfo = await chrome.runtime.getPlatformInfo();
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`extension-${chrome.runtime.id}-on-${platformInfo.os}`),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
     
      salt: new TextEncoder().encode("subcrypt-static-salt"),
      iterations: 100000,
      hash: "SHA-256"
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
async function encryptUsingSubCrypt(plainText) {
  const key = await getCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}


async function decryptUsingSubCrypt(encryptedStr) {
  const key = await getCryptoKey();
  const combined = Uint8Array.from(atob(encryptedStr), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  return new TextDecoder().decode(decrypted);
}

/*
                    chrome.storage.local.set({ accessToken }, function() {
                        console.log("Access Token stored successfully.");
                    });
*/
function generateCodeVerifier() {
  const array = new Uint8Array(64); // 64字节足够安全
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(byte => ('0' + byte.toString(16)).slice(-2))
    .join('');
}

// 将 code_verifier 进行 SHA-256 哈希并 base64url 编码
async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);

  const base64String = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return base64String;
}

//#TeamsFunctionsSTART:

async function fetchTeamsUserProfile() {
    try {
        // 异步获取token
        const result = await new Promise((resolve, reject) => {
            chrome.storage.local.get(['MSaccessToken'], function (result) {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(result);
                }
            });
        });

        const accessToken = result.MSaccessToken;
        if (!accessToken) {
            return { state: -1, error: 'No access token found.' };
        }

        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            return { state: -1, error: `Failed to fetch user profile. Status: ${response.status}` };
        }

        const data = await response.json();
        data.state = 1;
        return data;

    } catch (error) {
        return { state: -1, error: error.toString() };
    }
}

function T_fetchOneDriveFiles(){
    chrome.storage.local.get(['MSaccessToken'], function(result) {
        const accessToken = result.MSaccessToken;
        if (!accessToken) {
            console.error('No access token found.');
            return;
        }

        fetch('https://graph.microsoft.com/v1.0/drives/b!u5FOjqjM70aT-6aTDu4NiTJQZlXesQFHq129qEqSiXEcpmsDu-6FTahUDrBEEthG/items/015UTTMIMY4BO6WCTR5VF2Z572E6XBG7BR', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch user classes');
            }
            return response.json();
        })
        .then(fileData => {
            console.log("OneDriveFileData:",fileData);
        });
    });
}


let MSRetryTeamsInitInProgress = false;
async function T_retryTeamsInitAfterAuthFailure() {
    // 用独立的标记防止此函数并发；不复用 MSAuthRetryInProgress，
    // 否则会把 T_initMS 内部触发的 M_BindMSAccount("Rebind") 一并屏蔽
    if (MSRetryTeamsInitInProgress) {
        return;
    }
    MSRetryTeamsInitInProgress = true;
    try {
        const state = await T_initMS();
        if (state === 1) {
            await saveToChromeStorage("MS_ReauthRequired", false);
            T_fetchTeamsUserClassesAndAssignments();
        } else {
            await saveToChromeStorage("MS_ReauthRequired", true);
        }
    } catch (error) {
        console.error('[TeamsAuthRetry] Failed to re-init Teams auth', error);
    } finally {
        MSRetryTeamsInitInProgress = false;
    }
}

// ===== Microsoft Graph 请求基础设施：超时 + 重试 + 分页 + 受限并发 =====
const T_GRAPH_TIMEOUT_MS = 25000;        // 单个 Graph 请求的超时时间
const T_GRAPH_MAX_RETRIES = 2;           // 瞬时错误（429/5xx/超时）重试次数
const T_GRAPH_MAX_PAGES = 20;            // @odata.nextLink 分页保护上限
const T_CLASS_CONCURRENCY = 4;           // 同时拉取的课程数量
const T_SUBMISSION_CONCURRENCY = 4;      // 单个课程内同时拉取提交状态的数量
const T_ASSIGNMENT_LOOKBACK_DAYS = 14;   // 只保留最近多少天布置的任务

function T_isAuthError(error) {
    return !!(error && error.isAuthError);
}

function T_makeAuthError(status, label) {
    return { isAuthError: true, status: status, label: label };
}

// 带超时与重试的 Graph GET。401/403 抛出 {isAuthError:true}，由调用方统一走重新授权。
async function T_graphFetchJson(url, accessToken, options = {}) {
    const timeoutMs = options.timeoutMs ?? T_GRAPH_TIMEOUT_MS;
    const retries = options.retries ?? T_GRAPH_MAX_RETRIES;
    const label = options.label || url;
    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${accessToken}` },
                signal: controller.signal
            });

            if (response.status === 401 || response.status === 403) {
                throw T_makeAuthError(response.status, label);
            }

            // 429 / 5xx 视为瞬时错误：按 Retry-After 或指数退避重试
            if (response.status === 429 || response.status >= 500) {
                const retryAfterSec = Number(response.headers.get('Retry-After'));
                const waitMs = Number.isFinite(retryAfterSec) && retryAfterSec > 0
                    ? Math.min(retryAfterSec * 1000, 15000)
                    : Math.min(1000 * Math.pow(2, attempt), 8000);
                lastError = new Error(`[GraphFetch] ${label} 瞬时失败 ${response.status}`);
                if (attempt < retries) {
                    console.warn(`[GraphFetch] ${label} 返回 ${response.status}，${waitMs}ms 后重试 (${attempt + 1}/${retries})`);
                    await delay(waitMs);
                    continue;
                }
                throw lastError;
            }

            if (!response.ok) {
                throw new Error(`[GraphFetch] ${label} 失败，HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            if (T_isAuthError(error)) {
                throw error;
            }
            lastError = error;
            if (attempt < retries) {
                const waitMs = Math.min(1000 * Math.pow(2, attempt), 8000);
                const reason = error && error.name === 'AbortError' ? '超时' : '异常';
                console.warn(`[GraphFetch] ${label} ${reason}，${waitMs}ms 后重试 (${attempt + 1}/${retries})`, error);
                await delay(waitMs);
                continue;
            }
            throw lastError;
        } finally {
            clearTimeout(timer);
        }
    }

    throw lastError || new Error(`[GraphFetch] ${label} 失败`);
}

// 跟随 @odata.nextLink 把所有分页数据取全
async function T_graphFetchAllPages(url, accessToken, options = {}) {
    const items = [];
    let nextUrl = url;
    let page = 0;
    while (nextUrl && page < T_GRAPH_MAX_PAGES) {
        const data = await T_graphFetchJson(nextUrl, accessToken, options);
        if (Array.isArray(data?.value)) {
            items.push(...data.value);
        }
        nextUrl = data?.['@odata.nextLink'] || null;
        page += 1;
    }
    return items;
}

// 受限并发 map：worker 内抛出的错误会向外传播（用于授权失效时快速失败）
async function T_mapWithConcurrency(items, limit, worker) {
    const results = new Array(items.length);
    let cursor = 0;
    const workerCount = Math.max(1, Math.min(limit, items.length));
    const runners = [];
    for (let i = 0; i < workerCount; i++) {
        runners.push((async () => {
            while (true) {
                const index = cursor++;
                if (index >= items.length) {
                    return;
                }
                results[index] = await worker(items[index], index);
            }
        })());
    }
    await Promise.all(runners);
    return results;
}

// 与旧实现保持一致的截止时间修正逻辑（整点任务顺延到当天 23:59）
function T_adjustAssignmentDueTime(dueDateTime) {
    if (!dueDateTime) {
        return dueDateTime;
    }
    try {
        const dueUtc = new Date(dueDateTime);
        if (isNaN(dueUtc.getTime())) {
            return dueDateTime;
        }
        const dueUtcPlus8 = new Date(dueUtc.getTime() + 8 * 60 * 60 * 1000);
        if (dueUtcPlus8.getHours() === 8 && dueUtcPlus8.getMinutes() === 0) {
            dueUtcPlus8.setHours(23, 59, 0, 0);
            return new Date(dueUtcPlus8.getTime() - 8 * 60 * 60 * 1000).toISOString();
        }
        return dueDateTime;
    } catch (e) {
        console.warn('Failed to adjust due time, using original.', e);
        return dueDateTime;
    }
}

// 正在进行中的刷新（用于去重，避免面板反复点击刷新时并发打满 Graph 限流）
let MSTeamsAssignmentFetchPromise = null;

// 拉取用户的 Teams 课程与作业。
// 真异步：等所有课程 / 提交状态请求真正完成后才落盘，不再用固定 setTimeout 截断，
// 因此不会再出现「数据回传太慢被跳过 → 面板显示暂无作业」的情况。
function T_fetchTeamsUserClassesAndAssignments() {
    if (MSTeamsAssignmentFetchPromise) {
        console.log('[TeamsFetch] 已有刷新在进行中，复用当前请求');
        return MSTeamsAssignmentFetchPromise;
    }

    let authErrorHit = false;
    const running = (async () => {
        try {
            return await T_runTeamsAssignmentFetch();
        } catch (error) {
            if (T_isAuthError(error)) {
                authErrorHit = true;
                console.warn('[TeamsFetch] 授权失效，准备重新授权', error);
            } else {
                console.error('[TeamsFetch] 拉取 Teams 任务失败', error);
            }
            // 失败时回传已有列表：面板能停止转圈，也不会被清空成「暂无作业」
            const fallback = (await getFromChromeStorage('MSTasks')) || [];
            M_send_str_msg('MS_finishedAssignmentGet', fallback, 0);
            return null;
        }
    })();

    MSTeamsAssignmentFetchPromise = running;
    running.finally(() => {
        MSTeamsAssignmentFetchPromise = null;
        if (authErrorHit) {
            // 放在 finally 之后触发，保证重试时去重标记已清除
            T_retryTeamsInitAfterAuthFailure().catch(() => {});
        }
    });
    return running;
}

async function T_runTeamsAssignmentFetch() {
    const previousTasks = (await getFromChromeStorage('MSTasks')) || [];
    const ignoredKeys = new Set(
        previousTasks
            .filter(task => task && task.IgnoredState === 1)
            .map(task => `${task.typeName}||${task.subjectName}`)
    );

    const stored = await chrome.storage.local.get(['MSaccessToken']);
    const accessToken = stored.MSaccessToken;
    if (!accessToken) {
        console.error('No access token found.');
        M_send_str_msg('MS_finishedAssignmentGet', previousTasks, 0);
        return null;
    }

    const cutoffMs = Date.now() - T_ASSIGNMENT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;

    const classes = await T_graphFetchAllPages(
        'https://graph.microsoft.com/v1.0/education/me/classes',
        accessToken,
        { label: 'education/me/classes' }
    );

    if (!classes.length) {
        console.log('No classes found.');
        M_send_str_msg('MS_finishedAssignmentGet', previousTasks, 0);
        return previousTasks;
    }

    const failedClassNames = [];
    const perClassResults = await T_mapWithConcurrency(classes, T_CLASS_CONCURRENCY, async (classInfo) => {
        try {
            return await T_collectClassAssignments(classInfo, accessToken, cutoffMs, ignoredKeys);
        } catch (error) {
            if (T_isAuthError(error)) {
                throw error; // 授权问题立即中止整轮刷新
            }
            console.error(`Error fetching assignments for class ${classInfo?.displayName}:`, error);
            failedClassNames.push(classInfo?.displayName);
            return [];
        }
    });

    let collected = perClassResults.reduce((acc, list) => acc.concat(list || []), []);

    // 个别课程失败时保留其上一次的数据，避免整张表被清空
    if (failedClassNames.length) {
        const failedSet = new Set(failedClassNames);
        const retained = previousTasks.filter(task => task && failedSet.has(task.subjectName));
        console.warn(`[TeamsFetch] ${failedClassNames.length} 个课程拉取失败，保留其历史数据 ${retained.length} 条`, failedClassNames);
        collected = collected.concat(retained);
    }

    const finalAssignments = collected
        .filter(assignment => {
            const beginMs = Date.parse(assignment?.beginTime);
            return Number.isFinite(beginMs) && beginMs >= cutoffMs;
        })
        .sort((a, b) => Date.parse(a.beginTime) - Date.parse(b.beginTime))
        .map((assignment, index) => ({ ...assignment, id: 'ms' + (1016 + index) }));

    await saveToChromeStorage('MSTasks', finalAssignments);
    console.log(`[FinalTeamsTasks] 共 ${finalAssignments.length} 条（课程 ${classes.length} 个，失败 ${failedClassNames.length} 个）`, finalAssignments);
    M_send_str_msg('MS_finishedAssignmentGet', finalAssignments, 0);
    return finalAssignments;
}

// 拉取单个课程的作业 + 每条作业的提交状态
async function T_collectClassAssignments(classInfo, accessToken, cutoffMs, ignoredKeys) {
    const classId = classInfo.id;
    const className = classInfo.displayName;

    const assignments = await T_graphFetchAllPages(
        `https://graph.microsoft.com/v1.0/education/classes/${classId}/assignments`,
        accessToken,
        { label: `assignments/${className}` }
    );

    if (!assignments.length) {
        console.log(`No assignments found for class: ${className}`);
        return [];
    }

    const recentAssignments = assignments.filter(assignment => {
        const assignedMs = Date.parse(assignment?.assignedDateTime);
        return Number.isFinite(assignedMs) && assignedMs >= cutoffMs;
    });

    console.log(`Assignments for class: ${className}（${recentAssignments.length}/${assignments.length} 条在 ${T_ASSIGNMENT_LOOKBACK_DAYS} 天内）`);
    if (!recentAssignments.length) {
        return [];
    }

    return await T_mapWithConcurrency(recentAssignments, T_SUBMISSION_CONCURRENCY, async (assignment) => {
        let submissionData = { status: 'unknown', res: '' };
        try {
            submissionData = (await T_getAssignmentSubmissionState(classId, assignment.id, accessToken)) || submissionData;
        } catch (error) {
            if (T_isAuthError(error)) {
                throw error;
            }
            console.warn(`[TeamsFetch] 获取提交状态失败：${className} / ${assignment.displayName}`, error);
        }

        const ignoreKey = `${assignment.displayName}||${className}`;
        return {
            subjectName: className,
            typeName: assignment.displayName,
            beginTime: assignment.assignedDateTime,
            endTime: T_adjustAssignmentDueTime(assignment.dueDateTime),
            IgnoredState: ignoredKeys.has(ignoreKey) ? 1 : 0,
            id: '', // 最终排序完成后统一分配，保证 id 稳定
            msId: assignment.id,
            webUrl: assignment.webUrl,
            content: assignment.instructions?.content || '',
            status: submissionData.status || 'unknown',
            submitRes: submissionData.res || '',
            fileRes: assignment.resourcesFolderUrl || ''
        };
    });
}

async function T_getAssignmentSubmissionState(classId, assignmentId, accessToken) {
    const url = `https://graph.microsoft.com/v1.0/education/classes/${classId}/assignments/${assignmentId}/submissions`;

    try {
        const data = await T_graphFetchJson(url, accessToken, { label: `submissions/${assignmentId}` });
        const submissions = Array.isArray(data?.value) ? data.value : [];
        if (!submissions.length) {
            return { status: 'working', res: '' };
        }

        submissions.sort((a, b) => {
            const timeA = Date.parse(a?.submittedDateTime);
            const timeB = Date.parse(b?.submittedDateTime);
            return (Number.isFinite(timeB) ? timeB : 0) - (Number.isFinite(timeA) ? timeA : 0);
        });

        const latestSubmission = submissions[0];
        return {
            status: latestSubmission.status === 'working' ? 'unsubmitted' : latestSubmission.status,
            res: latestSubmission.resourcesFolderUrl || ''
        };
    } catch (error) {
        if (T_isAuthError(error)) {
            throw error;
        }
        console.error('Error fetching submission state:', error);
        return { status: 'error', res: '' };
    }
}


async function T_SetAssignmentAlert_MSAssignment() { 
    chrome.storage.local.get(['MSaccessToken'], async function(result) {
        M_send_str_msg("MSPanel_showSyncing",2,-1);
        const accessToken = result.MSaccessToken;
        if (!accessToken) {
            console.error('No access token found.');
            return;
        }
        let assignments = await getFromChromeStorage("MSTasks");
        assignments=assignments?assignments:[]
        if (assignments) {
            let TotalEvents = []
            let beingSynced = await loadBeingSynced();
            assignments.forEach(assignment => {
                // Format endTime to UTC+8 and display as YYYY-MM-DD HH:MM
                let endTimeUTC8 = "";
                let startTime = assignment.endTime;
                if (assignment.endTime) {
                    const date = new Date(assignment.endTime);
                    // add 8 hours for UTC+8 
                    date.setHours(date.getHours() + 8);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    endTimeUTC8 = `${year}-${month}-${day} ${hours}:${minutes}`;

                    // Set startTime to 1 hour before endTime
                    const startDate = new Date(assignment.endTime);
                    startDate.setHours(startDate.getHours() - 1);
                    startTime = startDate.toISOString();
                }
                let gcId = "GCalcAutoSync_Tasks_MS_"+assignment.endTime+assignment.typeName+assignment.subjectName[0]+assignment.subjectName[4];
                let event = {
                    startTime: startTime,
                    endTime: assignment.endTime,
                    title: "[Due] " + assignment.typeName,
                    id: assignment.id,
                    location: assignment.subjectName,
                    content: `<div class="container"> <h2>${tlang("🔔即将截止：","🔔Due Day Reminder:")}${assignment.typeName}</h2> <p>${assignment.subjectName}</p> <p>${tlang("截止日期：","Due at: ")}${endTimeUTC8}</p> <p><a class="button" href="${assignment.webUrl}">${tlang("查看任务详细","Click here to see in Teams")}</a></p> <img src="https://x19.fp.ps.netease.com/file/68dcf74fd3235782242735a51XUFdMFK06" style=" right: -5%; position: absolute; top: -90px; "><p style="display:none;font-size: 0; color: transparent;" >gcMark{${gcId}}</p></div>`,
                    tag: "GCalcAutoSync_Tasks_MS",
                    reminderMinutesBeforeStart: 360
                };
                if (beingSynced.includes(gcId)) {
                    console.log("skip", gcId);
                }else{
                    TotalEvents.push(event);
                }
            });
            console.log("[TotalEventsSyncToAler]", TotalEvents);
            T_batchAddToMSCalender(TotalEvents, accessToken);
        }
    });
}


async function T_SetAssignmentAlert_XBAssignment() { 
    chrome.storage.local.get(['MSaccessToken'], async function(result) {
        M_send_str_msg("MSPanel_showSyncing",3,-1);
        const accessToken = result.MSaccessToken;
        if (!accessToken) {
            console.error('No access token found.');
            return;
        }
        
        try {
            // Calculate date range: Today-14days to Today+14days
            const today = new Date();
            const beginDate = new Date(today);
            beginDate.setDate(today.getDate() - 14);
            const endDate = new Date(today);
            endDate.setDate(today.getDate() + 14);
            
            // Format dates as YYYY-MM-DD
            const beginTime = beginDate.toISOString().split('T')[0];
            const endTime = endDate.toISOString().split('T')[0];
            
            // Fetch tasks from Xiaobao Platform API
            const apiUrl = `https://tsinglanstudent.schoolis.cn/api/LearningTask/GetList?semesterId=31627&subjectId=null&typeId=null&key=&beginTime=${beginTime}&endTime=${endTime}&mode=null&pageIndex=1&pageSize=12`;
            
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data && data.data && data.data.list) {
                const assignments = data.data.list;
                let TotalEvents = []
                let beingSynced = await loadBeingSynced();
                
                assignments.forEach(assignment => {
                    // Only process tasks with learningTaskState = 2 (unfinished)
                    if (assignment.learningTaskState !== 2) {
                        return;
                    }
                    
                    // Parse the endTime from the API response format
                    let endTimeDate = null;
                    if (assignment.endTime) {
                        // Accept legacy C# /Date(...) or ISO8601 strings
                        if (typeof assignment.endTime === 'string') {
                            const dotnetMatch = assignment.endTime.match(/\/Date\((\d+)/);
                            if (dotnetMatch) {
                                endTimeDate = new Date(parseInt(dotnetMatch[1]));
                            } else if (isISODateString(assignment.endTime)) {
                                const d = new Date(assignment.endTime);
                                if (!isNaN(d)) endTimeDate = d;
                            } else if (/^\d{10,13}$/.test(assignment.endTime)) {
                                const d = new Date(parseInt(assignment.endTime, 10));
                                if (!isNaN(d)) endTimeDate = d;
                            }
                        } else if (typeof assignment.endTime === 'number') {
                            const d = new Date(assignment.endTime);
                            if (!isNaN(d)) endTimeDate = d;
                        } else if (assignment.endTime instanceof Date) {
                            endTimeDate = assignment.endTime;
                        }
                    }
                    
                    if (!endTimeDate) {
                        return; // Skip if no valid end time
                    }
                    
                    // Format endTime to UTC+8 and display as YYYY-MM-DD HH:MM
                    let endTimeUTC8 = "";
                    let startTime = endTimeDate.toISOString();
                    if (endTimeDate) {
                        const date = new Date(endTimeDate);
                        // add 8 hours for UTC+8 
                        date.setHours(date.getHours() + 8);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        endTimeUTC8 = `${year}-${month}-${day} ${hours}:${minutes}`;

                        // Set startTime to 1 hour before endTime
                        const startDate = new Date(endTimeDate);
                        startDate.setHours(startDate.getHours() - 1);
                        startTime = startDate.toISOString();
                    }
                    
                    let gcId = "GCalcAutoSync_Tasks_XB_"+assignment.endTime+assignment.name+assignment.subjectName[0]+assignment.subjectName[4];
                    let event = {
                        startTime: startTime,
                        endTime: endTimeDate.toISOString(),
                        title: "[Due] " + assignment.name,
                        id: assignment.id,
                        location: assignment.subjectName,
                        content: `<div class="container"> <h2>${tlang("🔔即将截止：","🔔Due Day Reminder:")}${assignment.name}</h2> <p>${assignment.subjectName}</p> <p>${tlang("截止日期：","Due at: ")}${endTimeUTC8}</p> <p>${tlang("请前往校宝查看","Please check in Xiaobao")}</p> <img src="https://x19.fp.ps.netease.com/file/68dcf74fd3235782242735a51XUFdMFK06" style=" right: -5%; position: absolute; top: -90px; "><p style="display:none;font-size: 0; color: transparent;" >gcMark{${gcId}}</p></div>`,
                        tag: "GCalcAutoSync_Tasks_XB",
                        reminderMinutesBeforeStart: 360
                    };
                    if (beingSynced.includes(gcId)) {
                        console.log("skip", gcId);
                    }else{
                        TotalEvents.push(event);
                    }
                });
                console.log("[TotalEventsSyncToAler]", TotalEvents);
                T_batchAddToMSCalender(TotalEvents, accessToken);
            }
        } catch (error) {
            console.error('Error fetching Xiaobao tasks:', error);
        }
    });
}



const CLIENT_ID = "13f429db-81e8-4b32-8f48-e68f0adb25e1";
const TENANT = "7222912a-435d-423b-b22b-74b909c3bf8b"; //Tsinglan
const REDIRECT_URI = `https://${chrome.runtime.id}.chromiumapp.org/auth`;
const SCOPES = "User.Read Calendars.Read Calendars.ReadWrite offline_access  email EduRoster.ReadBasic EduAssignments.Read openid profile";

const AUTH_URL = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize`;
const TOKEN_URL = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`;


async function M_BindMSAccount(xbAccount) {
    // 单窗口互斥：防止 launchWebAuthFlow 在多触发路径下并发开窗
    if (MSAuthRetryInProgress) {
        console.log("[M_BindMSAccount] another auth flow in progress, skip");
        return;
    }
    MSAuthRetryInProgress = true;

    let isNewBind = true;
    //不再传入xbAccount
    if(xbAccount=="Rebind"){
        try {
            xbAccount=(await getFromChromeStorage("MSUserProfile"))["xbAccount"];
        } catch (e) {
            MSAuthRetryInProgress = false;
            return;
        }
        isNewBind = false;
        // 自动 rebind 路径：在打开窗口前先标记 reauth 状态，让 Teams 面板立即显示橙色感叹号徽标
        await saveToChromeStorage("MS_ReauthRequired", true);
    }
    try {
        console.log("M_BindMSAccount[Start]");
        await getRefreshToken();
        console.log("M_BindMSAccount[GetRefreshToken]");
        await exchangeForAccess();
        console.log("M_BindMSAccount[ExchangeForAccess]");
        let userProfile = await fetchTeamsUserProfile();
        if (userProfile.state === 1) {
            console.log("M_BindMSAccount[FetchTeamsUserProfile]", userProfile);
            const updatedProfile = {
                name: userProfile.displayName,
                email: userProfile.mail,
                state: 1,
                xbAccount: xbAccount,
                showGuide: isNewBind ? true : false
            };
            await saveToChromeStorage("MSUserProfile", updatedProfile);
            await saveToChromeStorage("MS_PanelNeedInit", true);
            await saveToChromeStorage("MS_ReauthRequired", false);
            M_send_comp_msg("MSAccountBinded", null, 0);

        } else {
            console.error("M_BindMSAccount[FetchTeamsUserProfile] Error:", userProfile.error);
            M_send_comp_msg("MSAccountBindFailed", userProfile.error+("  [MS]extId:")+chrome.runtime.id, 0);
        }
    } catch (error) {
        console.error("M_BindMSAccount Error:", error.message || error);
        await saveToChromeStorage("MS_ReauthRequired", true);
        M_send_comp_msg("MSAccountBindFailed", (error.message || error)+("  [CR]extId:")+chrome.runtime.id, 0);
    } finally {
        MSAuthRetryInProgress = false;
    }
}

// 1. 获取 refreshToken 并存储到 chrome.storageasync function getRefreshToken() {
async function getRefreshToken() {
    const state = Math.random().toString(36).substring(2);
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

     const url = `${AUTH_URL}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_mode=query&scope=${encodeURIComponent(SCOPES)}&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${state}`;

    // Wrap chrome.identity.launchWebAuthFlow in a Promise
    const redirectUrl = await new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow(
            { url: url, interactive: true },
            (redirectUrl) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(redirectUrl);
                }
            }
        );
    });

    const params = new URLSearchParams(new URL(redirectUrl).search);
    const code = params.get("code");

    const body = new URLSearchParams({
        client_id: CLIENT_ID,
        scope: SCOPES,
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
        code_verifier: codeVerifier,
    });

    const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
    });

    const tokenResult = await response.json();
    const refreshToken = await encryptUsingSubCrypt(tokenResult.refresh_token);

    // Wrap chrome.storage.local.set in a Promise
    await new Promise((resolve, reject) => {
        chrome.storage.local.set({ MSrefresh_token: refreshToken }, () => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                console.log("Refresh token stored.");
                resolve();
            }
        });
    });

    return refreshToken; // Return the refresh token after storage
}

// 2. 使用 refreshToken 换取 accessToken
async function exchangeForAccess() {
    let refreshToken = await readRefreshToken();

    const body = new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        scope: SCOPES
    });

    const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString()
    });

    const tokenResult = await response.json();
    let MSaccessToken = tokenResult.access_token;
    //console.log(tokenResult)
    //console.log("Access Token:", tokenResult.access_token);
    chrome.storage.local.set({ MSaccessToken }, function() {
        console.log("Access Token stored successfully.");
    });
}

// 3. 从 chrome.storage.local 中读取 refreshToken
async function readRefreshToken() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["MSrefresh_token"], (result) => {
      // 检查是否存在 refresh_tokenf
      if (!result.MSrefresh_token) {
        console.log("No refresh_token found."); 
        reject("No refresh token found");
        return;
      }

      // 异步解密 refresh_token
      decryptUsingSubCrypt(result.MSrefresh_token)
        .then((decryptedRefreshToken) => {
          resolve(decryptedRefreshToken);  // 返回解密后的 token
        })
        .catch((error) => {
          reject("Decryption failed: " + error);  // 解密失败时的错误处理
        });
    });
  });
}

async function checkTeamsBindingState(){
    state = await T_initMS();
}

async function M_StartMSFeatures() {
    saveToChromeStorage("MSFeatureEnabled", false);
    MSProfile = await getFromChromeStorage("MSUserProfile");

    const response = await fetch("https://tsinglanstudent.schoolis.cn/api/MemberShip/GetCurrentStudentInfo");
    const result = await response.json();
    const xbProfile = result.data.loginName;
    
    if(await getFromChromeStorage("MSTasks")==null){
        saveToChromeStorage("MSTasks", []); //防止为空逻辑
    }

    if (!MSProfile || MSProfile.state !== 1) {
        console.log("![TS]No MS Profile or not bound");
        return;
    } else if (MSProfile.xbAccount !== xbProfile) {
        console.log("![TS]Different MS Account!Notemas");
        return;
    } else {
        if (await T_initMS() !== 1) {
            console.log("![TS]Init MS Failed, Rebinding");
            M_BindMSAccount("Rebind");
            return;
        } else {
            console.log("![TS]MS Account Matched!!");
            saveToChromeStorage("MSFeatureEnabled", true);
            saveToChromeStorage("MS_PanelNeedInit", false);
            saveToChromeStorage("MS_ReauthRequired", false);
            T_fetchTeamsUserClassesAndAssignments();
            T_checkCalenderSync();
            T_checkTeamsTaskSync();
            T_checkXBTaskSync();
        }
    }
}

async function T_initMS() {
    let MSAccountData;
    try {
        MSAccountData = await fetchTeamsUserProfile();
        console.log("[T_INITMS]CB:", MSAccountData);

        if (MSAccountData.state === -1) {
        console.log("[T_INITMS]AccessExpired, Retrying");
        await exchangeForAccess();

        MSAccountData = await fetchTeamsUserProfile();

        if (MSAccountData.state === -1) {
            //M_send_comp_msg("tip_err", { cont: "失败: " + MSAccountData.error }, 0);
            console.log("[T_INITMS]Failed");
            await saveToChromeStorage("MS_ReauthRequired", true);
            M_BindMSAccount("Rebind");
            return 0;
        } else {
            console.log("[T_INITMS]Success at 2",MSAccountData);
            //M_send_comp_msg("tip_suc", { cont: "成功" }, 0);
            await saveToChromeStorage("MS_ReauthRequired", false);
            return 1;
        }
        } else {
        console.log("[T_INITMS]Success at 1", MSAccountData);
        await saveToChromeStorage("MS_ReauthRequired", false);
        }

        return 1;
    } catch (e) {
        console.log("[T_INITMS]Other Error", e);
        //M_send_comp_msg("tip_err", { cont: e }, 0);
        return 0; 
    }
}
async function T_batchAddToMSCalender(events, accessToken) {
        // events: [{startTime, endTime, location, title, content, tag}]
        const BATCH_SIZE = 20;
        let overallSuccess = 0;
        let overallFailed = 0;
        let beingSynced = await loadBeingSynced();
        if (beingSynced.length > 100) {
                // trim oldest items to keep storage size manageable while preserving insertion order
                beingSynced = beingSynced.slice(beingSynced.length - 60);
                await saveBeingSynced(beingSynced);
        }
        for (let i = 0; i < events.length; i += BATCH_SIZE) {
                const batch = events.slice(i, i + BATCH_SIZE);

                const MAX_RETRY = 5;
                let attempts = 0;
                let pendingItems = batch.map((event, idxInBatch) => ({ event, idxInBatch }));
                let totalSuccess = 0;

		while (pendingItems.length > 0 && attempts < MAX_RETRY) {
			const batchRequest = {
				requests: pendingItems.map((item, idx) => ({
					id: String(idx + 1),
					method: "POST",
					url: "/me/events",
					headers: {
						"Content-Type": "application/json"
					},
					body: {
						subject: item.event.title,
						body: {
							contentType: 'HTML',
							content: item.event.content
						},
						start: {
							dateTime: item.event.startTime,
							timeZone: 'China Standard Time'
						},
						end: {
							dateTime: item.event.endTime,
							timeZone: 'China Standard Time'
						},
						location: {
							displayName: item.event.location
						},
						categories: [item.event.tag],
						isReminderOn: (item.event.reminderMinutesBeforeStart ?? -1) >= 0,
						reminderMinutesBeforeStart: item.event.reminderMinutesBeforeStart?item.event.reminderMinutesBeforeStart:5
					}
				}))
			};

			const response = await fetch('https://graph.microsoft.com/v1.0/$batch', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(batchRequest)
			});

			const result = await response.json();
			let nextPending = [];
			let cntSuccessThisAttempt = 0;
			let failedIndicesThisAttempt = [];

			for (let j = 0; j < result.responses.length; j++) {
				const r = result.responses[j];
				if (r.status !== 201) {
					nextPending.push(pendingItems[j]);
					failedIndicesThisAttempt.push(pendingItems[j].idxInBatch);
					console.error("Event creation failed:", r.status, r.body);
				} else {
					cntSuccessThisAttempt++;
					totalSuccess++;
                                        const regex = /gcMark{([^"]*)}/;
                                        const suc = r.body;
                                        const match = suc?.body?.content?.match?.(regex);
                                        if (match && match[1]) {
                                                beingSynced = appendBeingSynced(beingSynced, match[1]);
                                        }//如果想要记录保存要在event里面加入gcMark
                                }
                        }

                        console.log(`[T_BATCHADD]Attempt ${attempts + 1}: Success ${cntSuccessThisAttempt}, Failed ${failedIndicesThisAttempt.length}, TotalInThisAttempt ${pendingItems.length}`);
                        if (failedIndicesThisAttempt.length > 0) {
                                console.log(`[T_BATCHADD]Failed indices (relative to current 20-size chunk): ${failedIndicesThisAttempt.join(',')}`);
                        }
                        

                        attempts++;
                        if (nextPending.length > 0 && attempts < MAX_RETRY) {
                                await delay(1000);
                        }
			pendingItems = nextPending;
		}

		const finalFailed = batch.length - totalSuccess;
		console.log(`[T_BATCHADD]Success: ${totalSuccess}, Failed: ${finalFailed}, total: ${batch.length}`);
		if (finalFailed > 0) {
			console.error(`[T_BATCHADD]Failed indices after ${MAX_RETRY} attempts (relative to current 20-size chunk): ${pendingItems.map(p => p.idxInBatch).join(',')}`);
		}

		overallSuccess += totalSuccess;
		overallFailed += finalFailed;

		await delay(1000);
        await saveBeingSynced(beingSynced);
	}
	return { amountOfSuccess: overallSuccess, amountOfFailed: overallFailed };
}

async function T_SyncToTeamsCalender() {
	let calendershift = 1;
    let calenderAlert = 0;
	const syncResultDefault = { amountOfSuccess: 0, amountOfFailed: 0 };

	M_send_str_msg("MSPanel_showSyncing",1,-1);
    
	return await new Promise((resolve) => {
		getFromChromeStorage("MSFeaturesSettings").then(function(settingsData){
			if(settingsData?.CalenderSyncShift==null || settingsData?.CalenderSyncShift==undefined || settingsData?.CalenderSyncShift==1){
				calendershift = 1;
			} else {
				calendershift = 0;
			}
            if(settingsData?.CalenderTriggerNotify==null || settingsData?.CalenderTriggerNotify==undefined || settingsData?.CalenderTriggerNotify==1){
				calenderAlert = 1;
			} else {
				calenderAlert = 0;
			}
			chrome.storage.local.get('MSaccessToken', async function(getResult){
				const accessToken = getResult.MSaccessToken;
				if(!getResult.MSaccessToken){
					M_send_str_msg("tip_err", "没有访问令牌", 0);
					console.log("没有访问令牌");
					resolve(syncResultDefault);
					return;
				}
				const url = 'https://tsinglanstudent.schoolis.cn/api/Schedule/ListScheduleByParent';
				const data = (function() {
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					const endDate = new Date(today);
					endDate.setDate(today.getDate() + 14);
					const formatDate = (date) => date.toISOString().split('T')[0];
					return {
						beginTime: formatDate(today),
						endTime: formatDate(endDate)
					};
				})();
                                let beingSynced = await loadBeingSynced();
				try {
					const response = await fetch(url, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify(data)
					});
					if (response.ok) {
						const responseData = await response.json();
						const xbEvents = responseData.data;
						console.log("_____MSCalendar", xbEvents);
						function applyCalendarShift(beginDotNet, endDotNet) {
							if (calendershift !== 1) {
								return { begin: beginDotNet, end: endDotNet };
							}
							const parseMaybeDate = (val) => {
								try {
									if (val instanceof Date) return val;
									if (typeof val === 'number') return new Date(val);
									if (typeof val === 'string') {
										const m = /\/Date\((\d+)([+-]\d{4})?\)\//.exec(val);
										if (m) return new Date(parseInt(m[1], 10));
										if (isISODateString(val)) return new Date(val);
										if (/^\d{10,13}$/.test(val)) return new Date(parseInt(val, 10));
									}
								} catch (_) { }
								return null;
							};
							const beginDate = parseMaybeDate(beginDotNet);
							const endDate = parseMaybeDate(endDotNet);
							if (!beginDate || !endDate || isNaN(beginDate) || isNaN(endDate)) {
								return { begin: beginDotNet, end: endDotNet };
							}
							const bH = beginDate.getHours();
							const bM = beginDate.getMinutes();
							const eH = endDate.getHours();
							const eM = endDate.getMinutes();
							function buildDate(baseDate, hours, minutes) {
								const d = new Date(baseDate.getTime());
								d.setHours(hours, minutes, 0, 0);
								return d;
							}
							let newBegin = beginDate;
							let newEnd = endDate;
							// Strictly match both begin and end times
							if (bH === 8 && bM === 25 && eH === 9 && eM === 5) {
								newBegin = buildDate(beginDate, 8, 0);
								newEnd = buildDate(endDate, 8, 40);
							} else if (bH === 9 && bM === 15 && eH === 9 && eM === 55) {
								newBegin = buildDate(beginDate, 8, 40);
								newEnd = buildDate(endDate, 9, 20);
							} else if (bH === 12 && bM === 35 && eH === 13 && eM === 15) {
								newBegin = buildDate(beginDate, 11, 50);
								newEnd = buildDate(endDate, 12, 30);
							}
							return {
								begin: convertToXBDate(newBegin.toISOString()),
								end: convertToXBDate(newEnd.toISOString())
							};
						}
						// 构建 events 数组
						const events = xbEvents.flatMap(classInfo => {
							const shifted = applyCalendarShift(classInfo.beginTime, classInfo.endTime);
							const startTime = convertToMSDate(shifted.begin);
							const endTime = convertToMSDate(shifted.end);
							let gcId = `GCalcAutoSync_Class${startTime}${endTime}${classInfo.name || ''}`;
                                                        if (beingSynced.includes(gcId)) {
                                                                console.log("skip", gcId);
                                                                return [];
                                                        }
							return [{
								startTime: startTime,
								endTime: endTime,
								location: classInfo.playgroundName || '',
								title: classInfo.name || '',
								content: `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; padding: 10px;">\n                            <p style=\"margin: 0 0 8px 0; font-weight: bold; color: #2c3e50;\">\n                                【${tlang("老师", "Teacher")}】 \n                                <span style=\"font-weight: normal;\">\n                                ${classInfo.teacherList.map(t => t.name).join(', ')}\n                                </span>\n                            </p>\n                            <p style=\"margin: 0; font-weight: bold; color: #2c3e50;\">\n                                【${tlang("班级", "Class")}】\n                                <span style=\"font-weight: normal;\">\n                                ${tlang(classInfo.classInfo.className, classInfo.classInfo.classEName)}\n                                </span>\n                            </p>\n                            </div><p style="display:none;font-size: 0; color: transparent;" >gcMark{${gcId}}</p>`,
								tag: 'GCalcAutoSync_Class',
                                reminderMinutesBeforeStart: calenderAlert ? 5 : -1,
							}];
						});
						if(events.length<1){
							resolve(syncResultDefault);
							return;
						}
						console.log(events)
						const batchRes = await T_batchAddToMSCalender(events, accessToken);
						resolve({ amountOfSuccess: batchRes?.amountOfSuccess || 0, amountOfFailed: batchRes?.amountOfFailed || 0 });
					} else {
						console.log("请求失败:", response.status);
						resolve(syncResultDefault);
					}
				} catch (error) {
					console.error("请求错误:", error);
					resolve(syncResultDefault);
				}
			});
		});
	});
}

async function T_addToMSCalendar(startTime, endTime, location, title, content, tag, accessToken,retry=0) {
    console.log("________________addToMSCalendar",startTime, endTime, location, title, content, tag);
    try {
        const event = {
            subject: title,
            body: {
            contentType: 'HTML',
            content: content
            },
            start: {
            dateTime: startTime,
            timeZone: 'China Standard Time'
            },
            end: {
            dateTime: endTime,
            timeZone: 'China Standard Time'
            },
            location: {
            displayName: location
            },
            categories: [tag]
        };

        const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        });

        const result = await response.json();
        if(response.status === 201){
            console.log(title, startTime, "Success"); 
        } else {
            console.log(title, startTime, "Failed, retrying");
            setTimeout(() => {
                T_addToMSCalendar(startTime, endTime, location, title, content, tag, accessToken, retry+1);
            }, Math.floor(Math.random() * 991) + 10 + 500 * retry);
        }
        return result;
    } catch (e) {
        console.error("Error adding event to calendar:", e);
    }
  
}

function convertToMSDate(input) {
  try {
    if (input == null) return '';
    // Already a Date
    if (input instanceof Date) {
      return input.toISOString();
    }
    // Numeric timestamp
    if (typeof input === 'number') {
      const d = new Date(input);
      return isNaN(d) ? '' : d.toISOString();
    }
    if (typeof input === 'string') {
      // ISO format
      if (isISODateString(input)) {
        const d = new Date(input);
        return isNaN(d) ? '' : d.toISOString();
      }
      // C# /Date(…)/ format
      const match = /\/Date\((\d+)([+-]\d{4})?\)\//.exec(input);
      if (match) {
        const timestamp = parseInt(match[1], 10);
        const d = new Date(timestamp);
        return isNaN(d) ? '' : d.toISOString();
      }
      // Numeric string timestamp
      if (/^\d{10,13}$/.test(input)) {
        const d = new Date(parseInt(input, 10));
        return isNaN(d) ? '' : d.toISOString();
      }
    }
    // Fallback best-effort
    const d = new Date(input);
    return isNaN(d) ? '' : d.toISOString();
  } catch (e) {
    return '';
  }
}

function convertToXBDate(isoString) {
  const date = new Date(isoString);
  const timestamp = date.getTime();
  const offset = '+0800';
  return `/Date(${timestamp}${offset})/`;
}


async function T_removeFromMSCalender(category) {
    chrome.storage.local.get('MSaccessToken', async function(getResult){
        const accessToken = getResult.MSaccessToken;
        if(!getResult.MSaccessToken){
            M_send_str_msg("tip_err", "没有访问令牌", 0);
            console.log("没有访问令牌");
            return -1;
        }

        console.log("________________removeFromMSCalendar",category);
        let beingSynced = await loadBeingSynced();
        beingSynced = beingSynced.filter(item => !item.startsWith(category));
        await saveBeingSynced(beingSynced);


        const events = await fetchEventsWithCategory(category, accessToken);
        console.log("________________removeFromMSCalendar",category,"events",events);
        await batchDeleteEvents(events, accessToken);
    });
}

async function T_removeConsent(grantId = null, attempt = 0) {
    const accessToken = await getFromChromeStorage("MSaccessToken");
    if (!accessToken) {
        console.warn("[T_removeConsent] No access token available.");
        return { state: -1, error: "No access token found." };
    }

    const headers = {
        'Authorization': `Bearer ${accessToken}`
    };

    try {
        let targetGrantId = grantId;
        // Defensive: ensure targetGrantId is a non-empty string ID
        if (typeof targetGrantId !== 'string' || !targetGrantId.trim()) {
            if (targetGrantId !== null && targetGrantId !== undefined) {
                console.warn("[T_removeConsent] Ignoring non-string grantId:", typeof targetGrantId);
            }
            targetGrantId = null;
        }

        if (!targetGrantId) {
            const requiredScopes = new Set(SCOPES.split(/\s+/).filter(Boolean));
            let listUrl = `https://graph.microsoft.com/v1.0/me/oauth2PermissionGrants`;
            const allGrants = [];

            while (listUrl) {
                const listResponse = await fetch(listUrl, { headers });

                if (listResponse.status === 401 && attempt === 0) {
                    console.warn("[T_removeConsent] Access token expired when listing grants, refreshing...");
                    await exchangeForAccess();
                    return await T_removeConsent(grantId, attempt + 1);
                }

                if (!listResponse.ok) {
                    let errorDetail;
                    try {
                        errorDetail = await listResponse.json();
                    } catch (e) {
                        errorDetail = await listResponse.text();
                    }
                    console.error("[T_removeConsent] Failed to list oauth2PermissionGrants:", listResponse.status, errorDetail);
                    return { state: -1, error: `Failed to list oauth2PermissionGrants. Status: ${listResponse.status}`, detail: errorDetail };
                }

                const listData = await listResponse.json();
                if (Array.isArray(listData.value)) {
                    allGrants.push(...listData.value);
                }
                listUrl = listData['@odata.nextLink'] || null;
            }

            const matchingGrant = allGrants.find(grant => {
                if (grant.clientId !== CLIENT_ID || !grant.scope) {
                    return false;
                }
                const grantScopeSet = new Set(grant.scope.split(/\s+/).filter(Boolean));
                if (grantScopeSet.size < requiredScopes.size) {
                    return false;
                }
                for (const scope of requiredScopes) {
                    if (!grantScopeSet.has(scope)) {
                        return false;
                    }
                }
                return true;
            });

            if (!matchingGrant) {
                console.log(`[T_removeConsent] No oauth2PermissionGrants found for client ${CLIENT_ID} with required scopes.`);
                return { state: 0, message: 'No consent grant found.' };
            }

            targetGrantId = matchingGrant.id;
        }

        const deleteUrl = `https://graph.microsoft.com/v1.0/me/oauth2PermissionGrants/${targetGrantId}`;
        const deleteResponse = await fetch(deleteUrl, {
            method: 'DELETE',
            headers
        });

        if (deleteResponse.status === 401 && attempt === 0) {
            console.warn("[T_removeConsent] Access token expired when deleting grant, refreshing...");
            await exchangeForAccess();
            return await T_removeConsent(targetGrantId, attempt + 1);
        }

        if (deleteResponse.status === 204) {
            console.log(`[T_removeConsent] Successfully removed consent grant ${targetGrantId}.`);
            return { state: 1, id: targetGrantId };
        }

        let deleteErrorDetail;
        try {
            deleteErrorDetail = await deleteResponse.json();
        } catch (e) {
            deleteErrorDetail = await deleteResponse.text();
        }
        console.error("[T_removeConsent] Failed to delete oauth2PermissionGrant:", deleteResponse.status, deleteErrorDetail);
        return { state: -1, error: `Failed to remove consent. Status: ${deleteResponse.status}`, detail: deleteErrorDetail };
    } catch (error) {
        console.error("[T_removeConsent] Unexpected error:", error);
        return { state: -1, error: error.message || error };
    }
}
async function fetchEventsWithCategory(category, accessToken) {
    const now = new Date().toISOString(); // Get the current date and time in ISO format
    const url = `https://graph.microsoft.com/v1.0/me/events?$filter=start/dateTime ge '${now}' and categories/any(c:c eq '${category}')&$top=1000`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();
    return data.value;
}

async function batchDeleteEvents(events, accessToken) {
    // Microsoft Graph batch API 限制每次最多20个请求
    const BATCH_SIZE = 20;
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
        const batch = events.slice(i, i + BATCH_SIZE);
        const batchRequest = {
            requests: batch.map((event, idx) => ({
                id: String(idx + 1),
                method: "DELETE",
                url: `/me/events/${event.id}`
            }))
        };

        const response = await fetch('https://graph.microsoft.com/v1.0/$batch', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(batchRequest)
        });

        if (!response.ok) {
            console.error("Batch delete failed:", response.status, await response.text());
        } else {
            const result = await response.json();
            console.log("Batch delete result:", result);
        }
    }
}

async function deleteEvents(events, accessToken) {
    for (const event of events) {
        const url = `https://graph.microsoft.com/v1.0/me/events/${event.id}`;
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`Error deleting event ${event.id}: ${response.statusText}`);
        } else {
            console.log(`Deleted event ${event.id}`);
        }
    }
}

async function getAccessToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, token => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(token);
      }
    });
  });
}class ScoreData {
  constructor() {
    this.data = {
      "data": { "evaluationProjectList": [] },
      "msgCN": null, "msgEN": null, "state": 0, "msg": null
    };
  }

  formDataJSON(name, score, totalscore, id, categoryEName, categoryName, proportion, gcalcHiddenState) {
    const projectList = this.data.data.evaluationProjectList;
    let targetCategory = projectList.find(p => p.evaluationProjectEName === categoryEName);

    if (!targetCategory) {
      const newProjectId = id || new Date().getTime(); // Use provided ID or generate one
      targetCategory = {
        "evaluationProjectName": categoryName, "evaluationProjectEName": categoryEName,
        "proportion": proportion, "score": 0, "scoreStr": "", "scoreLevel": "", "gpa": 0,
        "gpaStr": "", "scoreIsNull": true, "evaluationProjectList": [], "levelString": "",
        "code": `code-${newProjectId}`, "evaluationProjectId": newProjectId,
        "proPath": `${newProjectId},`, "parentProId": 0, "evaluationProjectRemark": null,
        "learningTaskAndExamList": []
      };
      projectList.push(targetCategory);
    }

    // null 分数（批改中-无法计算）跳过 Math.min；正常分数才做保护
    let adjustedScore;
    if (score === null || score === undefined) {
      adjustedScore = null;
    } else {
      adjustedScore = Math.min(score, totalscore);
      if (score > totalscore) {
        console.warn(`⚠️ Score protection: Assignment "${name}" has score ${score} > totalScore ${totalscore}. Adjusted to ${adjustedScore}.`);
      }
    }

    const newLearningTask = {
      "id": id, "evaluationProjectId": targetCategory.evaluationProjectId,
      "proPath": targetCategory.proPath, "type": 2, "score": adjustedScore, "levelString": "",
      "studentInfoId": 2432662, "disciplineState": null, "classSubjectId": 1575677,
      "name": name, "date": `/Date(${new Date().getTime()}+0800)/`, "totalScore": totalscore,
      "scoreType": 1, "resultType": 0,
      "gcalcHiddenState": gcalcHiddenState || null
    };

    // Prevent adding duplicate tasks if the function is run multiple times
    if (!targetCategory.learningTaskAndExamList.some(task => task.id === id)) {
      targetCategory.learningTaskAndExamList.push(newLearningTask);
    }

    // 计算 category 平均分时跳过 null 分数（批改中-无法计算）
    const scoredTasks = targetCategory.learningTaskAndExamList.filter(t => t.score !== null && t.score !== undefined);
    if (scoredTasks.length > 0) {
      const totalScoreOfTasks = scoredTasks.reduce((sum, task) => sum + (task.score/task.totalScore)*100, 0);
      const averageScore = totalScoreOfTasks / scoredTasks.length;
      targetCategory.score = parseFloat(averageScore.toFixed(2));
      targetCategory.scoreIsNull = false;
    } else {
      targetCategory.score = 0;
      targetCategory.scoreIsNull = true;
    }
  }

  formDataJSONNested(name, score, totalscore, id, parentCategoryEName, parentCategoryName, parentProportion, childCategoryEName, childCategoryName, childProportion, gcalcHiddenState) {
    const projectList = this.data.data.evaluationProjectList;
    
    // Find or create parent category
    let parentCategory = projectList.find(p => p.evaluationProjectEName === parentCategoryEName);
    if (!parentCategory) {
      const newParentId = new Date().getTime();
      parentCategory = {
        "evaluationProjectName": parentCategoryName, "evaluationProjectEName": parentCategoryEName,
        "proportion": parentProportion, "score": 0, "scoreStr": "", "scoreLevel": "", "gpa": 0,
        "gpaStr": "", "scoreIsNull": true, "evaluationProjectList": [], "levelString": "",
        "code": `code-${newParentId}`, "evaluationProjectId": newParentId,
        "proPath": `${newParentId},`, "parentProId": 0, "evaluationProjectRemark": null,
        "learningTaskAndExamList": []
      };
      projectList.push(parentCategory);
    }

    // Find or create child category within parent
    let childCategory = parentCategory.evaluationProjectList.find(p => p.evaluationProjectEName === childCategoryEName);
    if (!childCategory) {
      const newChildId = new Date().getTime() + 1;
      childCategory = {
        "evaluationProjectName": childCategoryName, "evaluationProjectEName": childCategoryEName,
        "proportion": childProportion, "score": 0, "scoreStr": "", "scoreLevel": "", "gpa": 0,
        "gpaStr": "", "scoreIsNull": true, "evaluationProjectList": [], "levelString": "",
        "code": `code-${newChildId}`, "evaluationProjectId": newChildId,
        "proPath": `${parentCategory.evaluationProjectId},${newChildId},`, "parentProId": parentCategory.evaluationProjectId, 
        "evaluationProjectRemark": null, "learningTaskAndExamList": []
      };
      parentCategory.evaluationProjectList.push(childCategory);
    }

    // null 分数（批改中-无法计算）跳过 Math.min；正常分数才做保护
    let adjustedScore;
    if (score === null || score === undefined) {
      adjustedScore = null;
    } else {
      adjustedScore = Math.min(score, totalscore);
      if (score > totalscore) {
        console.warn(`⚠️ Score protection: Assignment "${name}" has score ${score} > totalScore ${totalscore}. Adjusted to ${adjustedScore}.`);
      }
    }

    const newLearningTask = {
      "id": id, "evaluationProjectId": childCategory.evaluationProjectId,
      "proPath": childCategory.proPath, "type": 2, "score": adjustedScore, "levelString": "",
      "studentInfoId": 2432662, "disciplineState": null, "classSubjectId": 1575677,
      "name": name, "date": `/Date(${new Date().getTime()}+0800)/`, "totalScore": totalscore,
      "scoreType": 1, "resultType": 0,
      "gcalcHiddenState": gcalcHiddenState || null
    };

    // Prevent adding duplicate tasks if the function is run multiple times
    if (!childCategory.learningTaskAndExamList.some(task => task.id === id)) {
      childCategory.learningTaskAndExamList.push(newLearningTask);
    }

    // 计算 child category 平均分时跳过 null 分数（批改中-无法计算）
    const scoredChildTasks = childCategory.learningTaskAndExamList.filter(t => t.score !== null && t.score !== undefined);
    if (scoredChildTasks.length > 0) {
      const totalScoreOfTasks = scoredChildTasks.reduce((sum, task) => sum + (task.score/task.totalScore)*100, 0);
      const averageScore = totalScoreOfTasks / scoredChildTasks.length;
      childCategory.score = parseFloat(averageScore.toFixed(2));
      childCategory.scoreIsNull = false;
    } else {
      childCategory.score = 0;
      childCategory.scoreIsNull = true;
    }

    // Calculate parent category score based on children
    if (parentCategory.evaluationProjectList.length > 0) {
      const totalChildScore = parentCategory.evaluationProjectList.reduce((sum, child) => {
        if (!child.scoreIsNull && child.proportion > 0) {
          return sum + (child.score * child.proportion);
        }
        return sum;
      }, 0);
      const totalChildProportion = parentCategory.evaluationProjectList.reduce((sum, child) => {
        if (!child.scoreIsNull && child.proportion > 0) {
          return sum + child.proportion;
        }
        return sum;
      }, 0);
      
      if (totalChildProportion > 0) {
        parentCategory.score = parseFloat((totalChildScore / totalChildProportion).toFixed(2));
        parentCategory.scoreIsNull = false;
      }
    }
  }

  getFinalObject() {
    return this.data;
  }
}





/**
 * Fetches all assignments AND exams for a subject, calculates the final weighted score,
 * and returns a detailed breakdown.
 *
 * @param {number} schoolSemesterId - The ID for the school semester.
 * @param {number} subjectId - The ID for the subject.
 * @param {string} beginDate - The start date in 'YYYY-MM-DD' format.
 * @param {string} endDate - The end date in 'YYYY-MM-DD' format.
 * @returns {Promise<object|null>} A Promise resolving to an object with the final score, or null on error.
 */
// installRedirectRule:
//   true  -> 同时安装 declarativeNetRequest 重定向（V1 兜底真正应用到页面时使用）
//   false -> 仅返回数据，不动网络规则（预测面板等"只想用一下数据"的场景）
async function getSubjectGrades(schoolSemesterId, subjectId, beginDate, endDate, classId, installRedirectRule = true) {
  const scoreDataManager = new ScoreData();
  const pendingGradingTasks = [];  // V1 路径下：批改中(无分)任务名收集，用于详情页提示

  // Helper function to fetch assignments
  const _fetchAssignments = async () => {
    // 用 GetList 而非 GetStatistics——后者会过滤掉"批改中"任务
    // GetList 返回所有任务（已批改 + 批改中 + 隐藏），各任务再通过 GetDetail + isInSubjectScore 过滤
    const url = `https://tsinglanstudent.schoolis.cn/api/LearningTask/GetList?semesterId=${schoolSemesterId}&subjectId=${subjectId}&typeId=null&key=&beginTime=${beginDate}&endTime=${endDate}&mode=null&pageIndex=1&pageSize=500&gcalc=gcalc_bg&gcalc=noRedirect`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch assignments: ${response.statusText}`);
    const listData = await response.json();
    if (!listData?.data?.list) return;

    for (const assignment of listData.data.list) {
      const detailUrl = `https://tsinglanstudent.schoolis.cn/api/LearningTask/GetDetail?learningTaskId=${assignment.id}&gcalcSysFetch`;
      const detailResponse = await fetch(detailUrl);
      if (!detailResponse.ok) continue;
      const detailData = await detailResponse.json();
      const { data } = detailData;
      if (!data?.isInSubjectScore || !data.evaProjects || data.evaProjects.length === 0) continue;
      // finishState===null 表示任务"已初始化"但既未批改也未发布，不应纳入任何计算/显示
      if (data.finishState === null || data.finishState === undefined) continue;
      // 批改中检测：与 onBeforeRequest 的 hidden score 触发条件一致
      const isInGrading = data.finishState === 1 && data.comment === "" && (data.score === 0 || data.score == null);
      let scoreToUse = data.score;
      let hiddenState = null;

      if (isInGrading) {
          const name = data.learningTaskName || `#${assignment.id}`;
          if (!pendingGradingTasks.includes(name)) pendingGradingTasks.push(name);

          // 尝试静默计算隐藏分；成功→使用计算值并标记 "calculated"，失败→score=null 并标记 "failed"
          const computed = await computeHiddenScoreSilent(data.id, data.classId, data.subjectId, schoolSemesterId);
          if (computed !== null) {
              scoreToUse = computed;
              hiddenState = "calculated";
          } else {
              scoreToUse = null;
              hiddenState = "failed";
          }
      }

      // Handle 2-layer evaProjects hierarchy
      for (const evaProject of data.evaProjects) {
        if (evaProject.proportion === 0 || evaProject.proportion === null || evaProject.proportion === undefined) continue;

        // Check if this is a nested project (has parentProId > 0)
        if (evaProject.parentProId > 0) {
          // This is a child project, find its parent
          const parentProject = data.evaProjects.find(p => p.id === evaProject.parentProId);
          if (parentProject) {
            // Add to nested structure: parent -> child
            scoreDataManager.formDataJSONNested(
              data.learningTaskName,
              scoreToUse,
              data.totalScore,
              data.id,
              parentProject.eName,
              parentProject.name,
              parentProject.proportion,
              evaProject.eName,
              evaProject.name,
              evaProject.proportion,
              hiddenState
            );
          }
        } else {
          // This is a top-level project
          scoreDataManager.formDataJSON(data.learningTaskName, scoreToUse, data.totalScore, data.id, evaProject.eName, evaProject.name, evaProject.proportion, hiddenState);
        }
      }
    }
  };

  // Helper function to fetch exams
  const _fetchExams = async () => {
    const url = `https://tsinglanstudent.schoolis.cn/api/Exam/GetList?semesterId=${schoolSemesterId}&subjectId=null&typeId=null&key=&beginTime=${beginDate}&endTime=${endDate}&pageIndex=1&pageSize=12&gcalcSysFetch`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch exams: ${response.statusText}`);
    const listData = await response.json();
    if (!listData?.data?.list) return;

    const relevantExams = listData.data.list.filter(exam => exam.subjects.some(s => s.subjectId === subjectId));
    
    for (const exam of relevantExams) {
        const detailUrl = `https://tsinglanstudent.schoolis.cn/api/Exam/GetDetail?examId=${exam.id}&gcalcSysFetch`;
        const detailResponse = await fetch(detailUrl);
        if(!detailResponse.ok) continue;
        const detailData = await detailResponse.json();
        const subjectScoreInfo = detailData.data.subjectScoreList.find(s => s.subjectId === subjectId);
        
        if(subjectScoreInfo && subjectScoreInfo.isInSubjectScore){
            // For exams, we currently only support single-layer evaluation projects
            // as the exam data structure doesn't seem to support nested categories
            scoreDataManager.formDataJSON(
                detailData.data.examName,
                subjectScoreInfo.score,
                100, // Default totalScore = 100 for final
                exam.id,
                subjectScoreInfo.evaluationProjectEName,
                subjectScoreInfo.evaluationProjectName,
                subjectScoreInfo.proportion
            );
        }
    }
  };
  
  console.log(`🚀 Fetching grades for Subject ID: ${subjectId}...`);
  try {
    // Run both fetching processes in parallel
    await Promise.all([_fetchAssignments(), _fetchExams()]);

    // --- Final Weighted Calculation ---
    const gradeDetails = scoreDataManager.getFinalObject();
    const assignmentList = gradeDetails.data.evaluationProjectList;
    const totalProportionAll = assignmentList.reduce((sum, project) => sum + (Number(project.proportion) || 0), 0);
    const hasFinalExamPlaceholder = assignmentList.some(project => 
        project.evaluationProjectId === 1895258 ||
        project.evaluationProjectEName === "Final Exam(Giaoculator)" ||
        project.evaluationProjectName === "期末考试(Giaoculator)"
    );
    if (!hasFinalExamPlaceholder && totalProportionAll < 100 && Math.abs(totalProportionAll - 80) < 0.01) {
        assignmentList.push({
            "evaluationProjectName": "期末考试(Giaoculator)",
            "evaluationProjectEName": "Final Exam(Giaoculator)",
            "proportion": 20,
            "score": null,
            "scoreStr": "",
            "scoreLevel": "",
            "gpa": 0,
            "gpaStr": "",
            "scoreIsNull": true,
            "evaluationProjectList": [],
            "levelString": "",
            "code": "code-1895258",
            "evaluationProjectId": 1895258,
            "proPath": "1895258,",
            "parentProId": 0,
            "evaluationProjectRemark": null,
            "learningTaskAndExamList": []
        });
    }
    let weightedTotal = 0;
    let totalProportion = 0;

    gradeDetails.data.evaluationProjectList.forEach(project => {
        if (project.proportion > 0 && !project.scoreIsNull) {
            weightedTotal += project.score * project.proportion;
            totalProportion += project.proportion;
        }
    });

    const finalWeightedScore = totalProportion > 0 ? parseFloat((weightedTotal / totalProportion).toFixed(2)) : 0;
    
    console.log(`🎉 Processing complete!`);
    saveToChromeStorage(`GCV1GradeDetails|${schoolSemesterId}|${subjectId}`, gradeDetails);
    //redirect

    if (installRedirectRule) {
        const redirectRule = {
            id: classId-schoolSemesterId,
            priority: 1,
            action: {
                type: "redirect",
                redirect: {
                    url: `data:application/json,${encodeURIComponent(JSON.stringify(gradeDetails))}`

                }
            },
            condition: {
                resourceTypes: ["xmlhttprequest"],
                urlFilter: `classId=${classId}&subjectId=${subjectId}&semesterId=${schoolSemesterId}`
            }
        };

        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [classId-schoolSemesterId],
            addRules: [redirectRule]
        });
    } else {
        console.log("[getSubjectGrades] installRedirectRule=false — 仅返回数据，不安装重定向规则");
    }
    return {
      finalWeightedScore: finalWeightedScore,
      totalProportionCovered: totalProportion,
      gradeDetails: gradeDetails,
      pendingGradingTasks: pendingGradingTasks
    };

  } catch (error) {
    console.error("An error occurred during the getSubjectGrades process:", error);
    return null;
  }
}

async function T_startCalenderSync() {
	const res = await T_SyncToTeamsCalender();
	const payload = {
		amountOfSuccess: res?.amountOfSuccess || 0,
		amountOfFailed: res?.amountOfFailed || 0,
		lastSyncTime: new Date().toISOString()
	};
	await saveToChromeStorage("MS_LastSync_Calender", payload);
    M_send_str_msg("MS_RefreshSyncPanels",1,-1)
	return payload;
}

async function T_startTeamsTaskSync() {
    M_send_str_msg("MSPanel_showSyncing",2,-1);
    // 等任务真正拉取完成再去写日历，避免用空列表/半截列表做同步
    await T_fetchTeamsUserClassesAndAssignments();
	const res = await T_SetAssignmentAlert_MSAssignment();  
	const payload = {
		lastSyncTime: new Date().toISOString()
	};
	await saveToChromeStorage("MS_LastSync_TeamsTask", payload);
    M_send_str_msg("MS_RefreshSyncPanels",2,-1)
	return payload;
}


async function T_startXBTaskSync() {
    M_send_str_msg("MSPanel_showSyncing",3,-1);
    await delay(500);
	const res = await T_SetAssignmentAlert_XBAssignment();  
	const payload = {
		lastSyncTime: new Date().toISOString()
	};
	await saveToChromeStorage("MS_LastSync_XBTask", payload);
    M_send_str_msg("MS_RefreshSyncPanels",3 ,-1)
	return payload;
}

async function T_checkCalenderSync() {
	// Read configured period from settings
	const settings = await getFromChromeStorage("MSFeaturesSettings");
	const configuredPeriod = settings?.CalenderSyncPeriod ?? "1 Day";
	const PERIODS_MS = {
		"1 Hour": 60 * 60 * 1000,
		"1 Day": 24 * 60 * 60 * 1000,
		"2 Days": 2 * 24 * 60 * 60 * 1000,
		"5 Days": 5 * 24 * 60 * 60 * 1000,
		"1 Week": 7 * 24 * 60 * 60 * 1000,
        "disabled": 3650 * 24 * 60 * 60 * 1000
	};
	const DEFAULT_PERIOD_MS = PERIODS_MS["1day"];
	const selectedPeriodMs = PERIODS_MS[configuredPeriod] ?? DEFAULT_PERIOD_MS;

	// Get last sync info
	const last = await getFromChromeStorage("MS_LastSync_Calender");
	const now = Date.now();

	// If never synced or missing timestamp, trigger a sync
	if (!last || !last.lastSyncTime) {
		const result = await T_startCalenderSync();
		return { triggered: true, reason: "no_previous_sync", result };
	}

	let lastTime = Date.parse(last.lastSyncTime);
	if (Number.isNaN(lastTime)) {
		const result = await T_startCalenderSync();
		return { triggered: true, reason: "invalid_last_time", result };
	}

	// If previous sync had failures, reduce period to 20 minutes
	const FAILURE_PERIOD_MS = 20 * 60 * 1000;
	const hadFailures = (last?.amountOfFailed ?? 0) > 0;
	const effectivePeriodMs = hadFailures ? Math.min(selectedPeriodMs, FAILURE_PERIOD_MS) : selectedPeriodMs;

	const elapsed = now - lastTime;
	if (elapsed >= effectivePeriodMs) {
		const result = await T_startCalenderSync();
		return { triggered: true, reason: "period_elapsed", result };
	}

	return { triggered: false, reason: "not_due_yet", nextCheckInMs: effectivePeriodMs - elapsed };
}


async function T_checkTeamsTaskSync() {
	// Read configured period from settings
	const settings = await getFromChromeStorage("MSFeaturesSettings");
	const configuredPeriod = settings?.TeamsTaskSyncPeriod ?? "1 Day";
	const PERIODS_MS = {
		"1 Hour": 60 * 60 * 1000,
		"1 Day": 24 * 60 * 60 * 1000,
		"disabled": 3650 * 24 * 60 * 60 * 1000
	};
	const DEFAULT_PERIOD_MS = PERIODS_MS["1 Day"];
	const selectedPeriodMs = PERIODS_MS[configuredPeriod] ?? DEFAULT_PERIOD_MS;

	// Get last sync info
	const last = await getFromChromeStorage("MS_LastSync_TeamsTask");
	const now = Date.now();

	// If never synced or missing timestamp, trigger a sync
	if (!last || !last.lastSyncTime) {
		const result = await T_startTeamsTaskSync()
		return { triggered: true, reason: "no_previous_sync", result };
	}

	let lastTime = Date.parse(last.lastSyncTime);
	if (Number.isNaN(lastTime)) {
		const result = await T_startTeamsTaskSync()
		return { triggered: true, reason: "invalid_last_time", result };
	}

	const elapsed = now - lastTime;
	if (elapsed >= selectedPeriodMs) {
		const result = await T_startTeamsTaskSync()
		return { triggered: true, reason: "period_elapsed", result };
	}

	return { triggered: false, reason: "not_due_yet", nextCheckInMs: selectedPeriodMs - elapsed };
}


async function T_checkXBTaskSync() {
	// Read configured period from settings
	const settings = await getFromChromeStorage("MSFeaturesSettings");
	const configuredPeriod = settings?.XBTaskSyncPeriod ?? "1 Day";
	const PERIODS_MS = {
		"1 Hour": 60 * 60 * 1000,
		"1 Day": 24 * 60 * 60 * 1000,
		"disabled": 3650 * 24 * 60 * 60 * 1000
	};
	const DEFAULT_PERIOD_MS = PERIODS_MS["1 Day"];
	const selectedPeriodMs = PERIODS_MS[configuredPeriod] ?? DEFAULT_PERIOD_MS;

	// Get last sync info
	const last = await getFromChromeStorage("MS_LastSync_XBTask");
	const now = Date.now();

	// If never synced or missing timestamp, trigger a sync
	if (!last || !last.lastSyncTime) {
		const result = await T_startXBTaskSync()
		return { triggered: true, reason: "no_previous_sync", result };
	}

	let lastTime = Date.parse(last.lastSyncTime);
	if (Number.isNaN(lastTime)) {
		const result = await T_startXBTaskSync()
		return { triggered: true, reason: "invalid_last_time", result };
	}

	const elapsed = now - lastTime;
	if (elapsed >= selectedPeriodMs) {
		const result = await T_startXBTaskSync()
		return { triggered: true, reason: "period_elapsed", result };
	}

	return { triggered: false, reason: "not_due_yet", nextCheckInMs: selectedPeriodMs - elapsed };
}
