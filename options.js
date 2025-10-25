
var autologNtw;
var langSet = (navigator.language || navigator.userLanguage).startsWith('zh') ? 'cn' : 'en';

document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById("customGPAweight");
    
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.type === "op_openGPASettings") {
            button.click();
        }else if(message.type === "op_openMSBindSettings"){
            document.getElementById("bindMSAccountsBtn").click();
        };
    });
});

function sendAlertrttip(cont){
  return;
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


document.addEventListener('DOMContentLoaded', function() {
    loadOptions();
    setLanguage();
});

document.getElementById("darkModeSelect").addEventListener("change", function() {
  document.getElementById("homeSrcDark").style.width = "50%";
  let value = this.value;
  console.log(value);
  if (value == 3) {
    document.getElementById("homeSrcDarkBr").style.display = 'inline-block'; // Or 'inline', 'inline-block' as needed
    document.getElementById("homeSrcDarkLabel").style.display = 'inline-block'; // Or 'inline', 'inline-block' as needed
    document.getElementById("homeSrcDarkSelect").style.display = 'inline-block'; // Or 'inline', 'inline-block' as needed
    document.getElementById("homeSrcDark").style.display = 'inline-block';      // Or 'inline', 'inline-block' as needed
  } else {
    document.getElementById("homeSrcDarkLabel").style.display = 'none';
    document.getElementById("homeSrcDarkBr").style.display = 'none';
    document.getElementById("homeSrcDarkSelect").style.display = 'none';
    document.getElementById("homeSrcDark").style.display = 'none';
  }
});

document.getElementById('advLogPage').addEventListener('change', function() {
    var checkbox = this;
    var input = document.getElementById('darkModeSelect');
    var label = document.getElementById('darkModeSelect_Label');

    if (checkbox.checked == true) {
        input.style.display = 'inline-block';
        label.style.display = 'inline';
        input.style.visibility = 'visible';
        label.style.visibility = 'visible';
    } else {
        input.style.visibility = 'hidden';
        label.style.visibility = 'hidden';
    }
});


document.getElementById('save').addEventListener('click', saveOptions);

document.getElementById('exp_settings').addEventListener('click', initExpSettings);

// Update display for calcRange slider dynamically
document.getElementById('calcRange').addEventListener('input', function() {
    if(document.getElementById('calcRange').value == 0){
        if(langSet == 'cn'){
            document.getElementById('calcRangeValue').textContent = "不主动计算动态成绩";
        }
        else{
            document.getElementById('calcRangeValue').textContent = "Do Not Calculate Any Score Data";
        }
    }else if(document.getElementById('calcRange').value == 1){
        if(langSet == 'cn'){
            document.getElementById('calcRangeValue').textContent = "仅计算当前学期的数据";
        }
        else{
            document.getElementById('calcRangeValue').textContent = "Calculate the Current Semester Only";
        }
    }else{
        if(langSet == 'cn'){
            document.getElementById('calcRangeValue').textContent =  "计算最近 " + document.getElementById('calcRange').value + " 个学期的数据";
        }
        else{
            document.getElementById('calcRangeValue').textContent =  "Calculate Last " + document.getElementById('calcRange').value + " Semesters' Scores";

        }
    }
});

function tlang(chi,eng){
    return (navigator.language || navigator.userLanguage).startsWith('zh') ? chi:eng;
}



document.addEventListener('DOMContentLoaded', function() {
    const res1TypeSelect = document.getElementById('res1TypeSelect');
    const welcomeMsg = document.getElementById('welcomeMsg');

    const homeSrcDarkSelect = document.getElementById('homeSrcDarkSelect');
    const homeSrcDark = document.getElementById('homeSrcDark');
  
    setTimeout(() => {  
      if(welcomeMsg.value.includes("<gcalc_localImg>")){
        res1TypeSelect.value = "local";
      }else if(welcomeMsg.value.includes("bing")){
          res1TypeSelect.value = "bing";
      }else{
          res1TypeSelect.value = "online";
      }

      if(homeSrcDark.value.includes("gcalc_localImg")){
        homeSrcDarkSelect.value = "local";
      }
      if(welcomeMsg.value.includes("bing")){
        homeSrcDarkSelect.value = "bing";
      }
      if(!(homeSrcDark.value.includes("gcalc_localImg")||homeSrcDark.value.includes("bing"))){
        homeSrcDarkSelect.value = "online";
      }
    }, 20);
    

    setTimeout(() => {
      if (res1TypeSelect.value == "bing" || res1TypeSelect.value == "local") {
        welcomeMsg.style.visibility = "hidden";
        welcomeMsg.style.width = "1%";
      } else {
        welcomeMsg.style.visibility = "visible";
        welcomeMsg.style.width = "50%";
      }

      if(homeSrcDarkSelect.value == "bing" || homeSrcDarkSelect.value == "local"){
          homeSrcDark.style.visibility = "hidden";
          homeSrcDark.style.width = "1%";
      }else{
          homeSrcDark.style.visibility = "visible";
          homeSrcDark.style.width = "50%";
      }
    },40);
  });


function saveOptions() {
    var advLogPage = document.getElementById('advLogPage').checked;
    var calcRange = document.getElementById('calcRange').value;
    var welcomeMsg = document.getElementById('welcomeMsg').value;
    var autoHide = document.getElementById('autoHide').checked;
    var autoHide_Condition = document.getElementById('autoHide_Condition').value;

    var user_preference = {
        calcRange: parseInt(calcRange, 10),
        welcomeMsg: welcomeMsg,
        advLogPage: advLogPage,
        autoHide: autoHide,
        autologNtw: autologNtw,
        autoHide_Condition: parseInt(autoHide_Condition, 10),
        homeSrc: welcomeMsg,
        homeSrcDark: document.getElementById('homeSrcDark').value,
        homeDarkMode: document.getElementById('darkModeSelect').value // 0:Black 1:White 2:Depends on Time 3:Color&Pic
    };

    // Use chrome.storage.local to save the user preferences
    chrome.storage.local.set({user_preference: user_preference}, function() {
        console.log('Preferences saved',user_preference);
        if(langSet == 'cn'){
            document.getElementById('showReloadTip').innerText = "设置已保存，重新登录平台后生效";
        }
        else{
            document.getElementById('showReloadTip').innerText = "Saved, re-login to apply changes.";
        }
        setTimeout(() => {
            document.getElementById('showReloadTip').innerText = ''
        }, 3000);
    });

}

document.getElementById('autoHide_Condition').addEventListener('input', function() {
    var min = 1; // 最小值
    var max = 101; // 最大值
    var value = parseInt(this.value, 10); // 获取用户输入的数值，并转换为整数

    // 检查值是否低于最小值
    if (value < min) {
        this.value = min; // 设置为最小值
    }
    // 检查值是否高于最大值
    else if (value > max) {
        this.value = max; // 设置为最大值
    }
});

document.getElementById('res1TypeSelect').addEventListener('change', function() {
    if(this.value == "bing"){
        document.getElementById('welcomeMsg').value = "https://bing.biturl.top/?resolution=3840&format=image&index=0&mkt=zh-CN";
        document.getElementById('welcomeMsg').style.visibility = "hidden";
        document.getElementById('welcomeMsg').style.width = "1%";
    }else if(this.value == "local"){
        document.getElementById('welcomeMsg').value = "https://bing.biturl.top/?resolution=3840&format=image&index=0&mkt=zh-CN";
        document.getElementById('welcomeMsg').style.visibility = "hidden";
        document.getElementById('welcomeMsg').style.width = "1%";
        SelectImgtoBase64()
        .then(base64String => {
            console.log("Base64 string:", base64String);
            document.getElementById('welcomeMsg').value = "<gcalc_localImg>";
            removeLongStringFromChromeStorage('localImg');
            setTimeout(() => {
                saveToChromeStorage('localImg', base64String);
                document.getElementById('showReloadTip').innerText = tlang("本地图片上传成功，请点击保存","Local image upload successful, please click Save.");
            }, 100);
            
            /*
            // Use the Base64 string here (e.g., set it as the src of an image)
            const imgElement = document.createElement('img');
            imgElement.src = base64String;
            document.body.appendChild(imgElement);*/

        })
        .catch(error => {
            console.error("Error getting Base64:", error);
            sendAlertrttip("Error getting Base64:"+error);
        });
    }else{
        document.getElementById('welcomeMsg').style.visibility = "visible";
        document.getElementById('welcomeMsg').style.width = "50%";
    }
});



document.getElementById('homeSrcDarkSelect').addEventListener('change', function() {
  if(this.value == "bing"){
      document.getElementById('homeSrcDark').value = "https://bing.biturl.top/?resolution=3840&format=image&index=0&mkt=zh-CN";
      document.getElementById('homeSrcDark').style.visibility = "hidden";
      document.getElementById('homeSrcDark').style.width = "1%";
  }else if(this.value == "local"){
      document.getElementById('homeSrcDark').value = "https://bing.biturl.top/?resolution=3840&format=image&index=0&mkt=zh-CN";
      document.getElementById('homeSrcDark').style.visibility = "hidden";
      document.getElementById('homeSrcDark').style.width = "1%";
      SelectImgtoBase64()
      .then(base64String => {
          console.log("Base64 string:", base64String);
          document.getElementById('homeSrcDark').value = "<gcalc_localImg2>";
          removeLongStringFromChromeStorage('localImg2');
          setTimeout(() => {
              saveToChromeStorage('localImg2', base64String);
              document.getElementById('showReloadTip').innerText = tlang("本地图片（深色主题）上传成功，请点击保存","Local image(dark theme) upload successful, please click Save.");
          }, 100);
          
          /*
          // Use the Base64 string here (e.g., set it as the src of an image)
          const imgElement = document.createElement('img');
          imgElement.src = base64String;
          document.body.appendChild(imgElement);*/

      })
      .catch(error => {
          console.error("Error getting Base64:", error);
          sendAlertrttip("Error getting Base64:"+error);
      });
  }else{
      document.getElementById('homeSrcDark').style.visibility = "visible";
      document.getElementById('homeSrcDark').style.width = "50%";
  }
});


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

function removeLongStringFromChromeStorage(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (items) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
  
        const keysToRemove = Object.keys(items).filter(itemKey => itemKey.startsWith(key + "_"));
  
        if (keysToRemove.length === 0) {
          resolve(); // 没有找到任何分段，直接 resolve
          return;
        }
  
        chrome.storage.local.remove(keysToRemove, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
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
function saveLongStringToChromeStorage(key, myString) {
    const MAX_CHUNK_SIZE = 20480; 
    const stringLength = myString.length;
    const chunkCount = Math.ceil(stringLength / MAX_CHUNK_SIZE);
  
    return new Promise((resolve, reject) => {
      const promises = [];
  
      for (let i = 0; i < chunkCount; i++) {
        console.log(key,"[suc]sabelong:",i,chunkCount)
        const startIndex = i * MAX_CHUNK_SIZE;
        const endIndex = Math.min((i + 1) * MAX_CHUNK_SIZE, stringLength);
        const chunk = myString.substring(startIndex, endIndex);
        const chunkKey = `${key}_${i}`; // 每个分段的 key
  
        promises.push(new Promise((resolveChunk, rejectChunk) => {
          chrome.storage.local.set({ [chunkKey]: chunk }, () => {
            if (chrome.runtime.lastError) {
              rejectChunk(chrome.runtime.lastError);
            } else {
              resolveChunk();
            }
          });
        }));
      }
  
      Promise.all(promises)
        .then(() => resolve())
        .catch(error => reject(error));
    });
  }

function loadOptions() {
    // Load the user preferences from chrome.storage.local
    chrome.storage.local.get('user_preference', function(data) {
        if (data.user_preference) {
            document.getElementById('calcRange').value = data.user_preference.calcRange;
            if(document.getElementById('calcRange').value == 0){
                if(langSet == 'cn'){
                    document.getElementById('calcRangeValue').textContent = "不主动计算动态成绩";
                }
                else{
                    document.getElementById('calcRangeValue').textContent = "Do Not Calculate Any Score Data";
                }
            }else if(document.getElementById('calcRange').value == 1){
                if(langSet == 'cn'){
                    document.getElementById('calcRangeValue').textContent = "仅计算当前学期的数据";
                }
                else{
                    document.getElementById('calcRangeValue').textContent = "Calculate the Current Semester Only";
                }
            }else{
                if(langSet == 'cn'){
                    document.getElementById('calcRangeValue').textContent =  "计算最近 " + document.getElementById('calcRange').value + " 个学期的数据";
                }
                else{
                    document.getElementById('calcRangeValue').textContent =  "Calculate Last " + document.getElementById('calcRange').value + " Semesters' Scores";
        
                }
            }
            try {
                autologNtw = data.user_preference.autologNtw;
            } catch (error) {
                autologNtw = 0;
            }
            
            document.getElementById('welcomeMsg').value = data.user_preference.homeSrc;
            document.getElementById('darkModeSelect').value = data.user_preference.homeDarkMode;
            if(data.user_preference.homeDarkMode!=3){
                document.getElementById('homeSrcDark').style.visibility = "hidden";
                document.getElementById('homeSrcDark').style.width = "1%";
                document.getElementById("homeSrcDarkLabel").style.display = 'none';
                document.getElementById("homeSrcDarkBr").style.display = 'none';
                document.getElementById("homeSrcDarkSelect").style.display = 'none';
                document.getElementById("homeSrcDark").style.display = 'none';
            }else{
                document.getElementById('welcomeMsg').style.width = "30%";
                document.getElementById('homeSrcDark').style.width = "30%";
                document.getElementById("homeSrcDarkBr").style.display = 'inline-block'; // Or 'inline', 'inline-block' as needed
                document.getElementById("homeSrcDarkLabel").style.display = 'inline-block'; // Or 'inline', 'inline-block' as needed
                document.getElementById("homeSrcDarkSelect").style.display = 'inline-block'; // Or 'inline', 'inline-block' as needed
                document.getElementById("homeSrcDark").style.display = 'inline-block';      // Or 'inline', 'inline-block' as needed
            }
            document.getElementById('homeSrcDark').value = data.user_preference.homeSrcDark;
            document.getElementById('autoHide').checked = data.user_preference.autoHide;
            document.getElementById('advLogPage').checked = data.user_preference.advLogPage;
            document.getElementById('autoHide_Condition').value = data.user_preference.autoHide_Condition;
            var input = document.getElementById('autoHide_Condition');
            var label = document.getElementById('autoHide_Condition_Label');

            if (data.user_preference.autoHide == true) {
                input.style.display = 'inline-block';
                label.style.display = 'inline';
                input.style.visibility = 'visible';
                label.style.visibility = 'visible';
            } else {
                input.style.visibility = 'hidden';
                label.style.visibility = 'hidden';
            }
            input = document.getElementById('darkModeSelect');
            label = document.getElementById('darkModeSelect_Label');
            if (data.user_preference.advLogPage == true) {
                input.style.display = 'inline-block';
                label.style.display = 'inline';
                input.style.visibility = 'visible';
                label.style.visibility = 'visible';
            } else {
                input.style.visibility = 'hidden';
                label.style.visibility = 'hidden';
            }
        }else{
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
            setTimeout(() => {
                location.reload(true);
            }, 10);
            
        }
        
    });
}

document.getElementById('autoHide').addEventListener('change', function() {
    var checkbox = this;
    var input = document.getElementById('autoHide_Condition');
    var label = document.getElementById('autoHide_Condition_Label');

    if (checkbox.checked == true) {
        input.style.display = 'inline-block';
        label.style.display = 'inline';
        input.style.visibility = 'visible';
        label.style.visibility = 'visible';
    } else {
        input.style.visibility = 'hidden';
        label.style.visibility = 'hidden';
    }
});




function setLanguage() {
    console.log(navigator.language || navigator.userLanguage);
    var userLang = navigator.language || navigator.userLanguage; 
    (function() {
        let agent = navigator.userAgent.toLowerCase();
        let mark = "x";
        if (agent.includes("edg")) {
            mark = "e";
        } else if (agent.includes("chrome")) {
            mark = "c";
        }
        document.getElementById("verNum").innerText += mark;
    })();
    var texts = {
        'en': {
            'main_header': 'General',
            'goto_report': 'IssueReport',
            'goto_read': 'HelpDocs',
            'main_header_ask': 'Help Center',
            'calcRangeLabel': 'Auto-Calc Range',
            'welcomeMsgLabel': 'Custom Loginpage Background',
            'autoHideGradesLabel': 'Hide Unsatisfactory Score Numbers',
            'enableLabel': 'Enable',
            'enableLabel2': 'Enable',
            'autoHide_Condition_Label': 'When score is below',
            'save': 'Save',
            'advLogPageLabel': 'Better HomePage',
            'darkModeSelect_Label': 'Theme',
            'bindMSAccountsLabel': 'Connect To Teams',
            'updateLabel': 'Enable Update Notification',
            'res1TypeLabel': 'Resource Type',
            'homeSrcDarkLabel': 'Resource Type(Dark)',
            'main_header_custom': 'Customization',
            'customGPAweightLabel': 'GPA Calculation Weights',
            'customGPAweight': 'Edit Weights',
        },
        'zh': {
            'main_header': '基本设置',
            'goto_report': '报告问题',
            'goto_read': '阅读说明',
            'main_header_ask': '帮助中心',
            'calcRangeLabel': '自动计算范围',
            'welcomeMsgLabel': '自定义登录界面资源',
            'autoHideGradesLabel': '隐藏低分成绩外显',
            'bindMSAccountsLabel': '连接到Teams',
            'enableLabel': '启用',
            'enableLabel2': '启用',
            'darkModeSelect_Label': '颜色主题',
            'advLogPageLabel': '启用美化',
            'autoHide_Condition_Label': '当分数低于',
            'save': '保存',
            'updateLabel': '启用更新提示',
            'res1TypeLabel': '资源类型',
            'homeSrcDarkLabel': '资源类型(深色模式)',
            'main_header_custom': '自定义设置',
            'customGPAweightLabel': 'GPA计算权重',
            'customGPAweight': '编辑科目权重',
        }
    };
    

    var langKey = userLang.startsWith('zh') ? 'zh' : 'en'; // Default to English if not Chinese
    var data = texts[langKey];
    for (id in data) {
        var element = document.getElementById(id);
        if (element) {
            element.textContent = data[id];
        }
    }
    if(!userLang.startsWith('zh')){
        document.getElementById('darkModeSelect').children[0].textContent = "Light Theme";
        document.getElementById('darkModeSelect').children[1].textContent = "Dark Theme";
        document.getElementById('darkModeSelect').children[2].textContent = "Theme Depends on Time";
        document.getElementById('darkModeSelect').children[3].textContent = "Theme and Background Depends on Time";
        document.getElementById('res1TypeSelect').children[0].textContent = "Bing Wallpaper API";
        document.getElementById('res1TypeSelect').children[1].textContent = "Local Image";
        document.getElementById('res1TypeSelect').children[2].textContent = "Online Image/Video";
        document.getElementById('homeSrcDarkSelect').children[0].textContent = "Bing Wallpaper API";
        document.getElementById('homeSrcDarkSelect').children[1].textContent = "Local Image";
        document.getElementById('homeSrcDarkSelect').children[2].textContent = "Online Image/Video";
    }
    
}

function initExpSettings(){
    var uset = prompt("输入实验功能号码");
    if(uset.includes('avg')){
        chrome.storage.local.get('exp_showFullavg', function(state) {
            if(state.exp_showFullavg){
                chrome.storage.local.set({'exp_showFullavg': false}, function() {
                    alert("avg已关闭！");
                });
            }else{
                chrome.storage.local.set({'exp_showFullavg': true}, function() {
                    alert("avg已开启！");
                });
            }
        });
    }
    /*
    chrome.storage.local.get('user_preference', function(data) {
        var tmp = data.user_preference.autologNtw;
        if(data.user_preference.autologNtw == 0){
            tmp = "已关闭❌"
        }else{
            tmp = "已开启✅"
        }
        var uset = prompt("[实验功能]\n自动保存凭据并快捷登录至4.3.2.1\n开启状态: "+tmp+"\n输入0/1/2即可关闭/开启/清除数据");
        if(uset.includes('0')){
            autologNtw = 0;
            chrome.storage.local.remove('savedPostData', function() {
                alert("已关闭并清除本地数据！");
            });
        }else if(uset.includes('1')){
            autologNtw = 1;
            alert("功能已开启！");
        }else if(uset.includes('2')){
            chrome.storage.local.remove('savedPostData', function() {
                alert("已重置本地数据！");
            });
        }
    });*/
    
}
function SelectImgtoBase64() {
    return new Promise((resolve, reject) => {
      // 创建遮罩层
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      `;
  
      // 创建退出按钮
      const closeButton = document.createElement('button');
      closeButton.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background-color: transparent;
        border: none;
        color: white;
        font-size: 30px;
        cursor: pointer;
        z-index: 10000; /* 确保按钮在最上层 */
      `;
      closeButton.textContent = "×"; // 使用 × 作为关闭图标
  
      // 添加退出按钮到遮罩层
      overlay.appendChild(closeButton);
  
      // 创建提示文字
      const message = document.createElement('span');
      message.style.cssText = `
        color: white;
        font-size: 20px;
        margin-bottom: 10px;
        pointer-events: none;
      `;
      message.textContent = tlang("点击上传图片","Upload image");
  
      // 创建图标
      const icon = document.createElement('span');
      icon.style.cssText = `
        font-family: 'Material Symbols Outlined';
        font-size: 48px;
        color: white;
        pointer-events: none;
        user-select: none;
      `;
      icon.textContent = "upload";
  
      // 创建隐藏的文件输入框
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';
  
      // 添加元素到遮罩层
      overlay.appendChild(message);
      overlay.appendChild(icon);
      overlay.appendChild(fileInput);
  
      // 添加遮罩层到页面
      document.body.appendChild(overlay);
  
      // 点击事件监听器 (点击遮罩层打开文件选择对话框)
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) { // 确保点击的是遮罩层本身，而不是子元素
          fileInput.click();
        }
      });
  
      // 退出按钮点击事件监听器
      closeButton.addEventListener('click', (event) => {
        event.stopPropagation(); // 阻止事件冒泡到遮罩层
        overlay.remove();
        reject("Upload cancelled"); // Promise reject，表示取消上传
      });
  
      // 文件选择事件监听器
      fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
  
          reader.onload = (e) => {
            const base64String = e.target.result;
            resolve(base64String);
            overlay.remove();
          };
  
          reader.onerror = (error) => {
            reject(error);
            overlay.remove();
          };
  
          reader.readAsDataURL(file);
        } else {
          reject("No file selected");
          overlay.remove();
        }
      });
    });
  }

// 点击 #customGPAweight 按钮时触发的函数
function openCustomGPAWeightModal(original, special) {
    try { document.getElementById('showReloadTip').innerText = ""; } catch (e) {}

    const safeOriginal = original || {};
    const originalHigh = (safeOriginal.high || []);
    const originalLow = (safeOriginal.low || []);
    const originalNo = (safeOriginal.no || []);
    const originalSpecial = (special || []);

    // 创建模态窗口的 HTML 结构
    const modal = document.createElement('div');
    modal.classList.add('custom-gpa-modal');
    modal.innerHTML = `
        <div class="modal-content">
            <h2>${tlang("修改科目加权的匹配规则","Custom GPA Weight Rules")}</h2>
            <p id="model-dtext">
              ${tlang(
                "- 计算GPA时，会进行关键词匹配来决定其权重与GPA加权值。<br>- 关键词支持空格，且当长度大于5个字符时，不再区分大小写。<br>- 您可随时点击重置为默认设定。<br>- Giaoculator已内置对应规则，若无特殊情况，无需手动修改任何内容。<br>- 特殊权重规则将拥有最高优先级。",
                `- Keyword matching will be performed to determine weight and GPA weighting value when calculating GPA.<br>- Keywords support spaces, and case sensitivity is ignored when length is greater than 5 characters.<br>- You may click to reset to default settings at any time.<br>- Unless special cases, you don't have to manually modify any rules here.<br>- Special weight rules always have the highest priority.`
              )}
            </p>

            <div class="input-row">
                <label>${tlang("加权科目:","Weighted Subject:")}</label>
                <div class="tag-container" data-name="high">
                    <input type="text" class="tag-input" placeholder="${tlang("输入关键词并回车","Type and press enter")}">
                </div>
            </div>

            <div class="input-row">
                <label>${tlang("选修科目(0.5学分):","Electives(0.5Credits):")}</label>
                <div class="tag-container" data-name="low">
                    <input type="text" class="tag-input" placeholder="${tlang("输入关键词并回车","Type and press enter")}">
                </div>
            </div>

            <div class="input-row">
                <label>${tlang("不计分学科(非B1~B8):","Not-Count-In Subject(Afterschool and others):")}</label>
                <div class="tag-container" data-name="no">
                    <input type="text" class="tag-input" placeholder="${tlang("输入关键词并回车","Type and press enter")}">
                </div>
            </div>

            <!-- Special Weight Rules (Highest Priority) -->
            <div class="input-row">
                <label>${tlang("特殊权重规则（最高优先级）:","Special Weight Rules (Highest Priority):")}</label>
                <div class="special-wrapper">
                    <div class="special-inputs">
                        <input type="text" id="special-keyword" placeholder="${tlang("输入关键词","Enter keyword")}" />
                        <select id="special-level">
                            <option value="1">${tlang("加权（1.5）","Weighted (1.5)")}</option>
                            <option value="2">${tlang("不加权（1.0）","Non-Weighted (1.0)")}</option>
                            <option value="3">${tlang("选修（0.5）","Electives (0.5)")}</option>
                            <option value="4">${tlang("不计入GPA（0）","Not Count in GPA (0)")}</option>
                        </select>
                        <button id="addSpecialBtn">${tlang("添加","Add")}</button>
                    </div>
                    <ul class="special-list"></ul>
                </div>
            </div>

            <div class="modal-buttons">
                <button id="cancelBtn">${tlang("取消","Cancel")}</button>
                <button id="resetBtn">${tlang("恢复到默认","Reset to Default")}</button>
                <button id="saveBtn">${tlang("保存","Save")}</button>
            </div>
        </div>
    `;

    // 添加 CSS 样式
    const style = document.createElement('style');
    style.textContent = `
        .custom-gpa-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .modal-content {
            background-color: white;
            padding: 20px;
            border-radius: 10px;
            width: 500px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .input-row {
            margin-bottom: 15px;
        }
        .tag-container {
            border: 1px solid #ccc;
            border-radius: 5px;
            padding: 5px;
            min-height: 30px;
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            align-items: center;
        }
        .tag-input {
            border: none;
            outline: none;
            flex-grow: 1;
            min-width: 100px;
            padding: 5px;
            font-size: 14px;
        }
        .tag-input:focus {
            box-shadow: none;
        }
        .tag {
            background-color: #e0e0e0;
            padding: 4px 8px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .tag .remove-tag {
            cursor: pointer;
            font-weight: bold;
            color: #666;
        }
        .modal-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
        .modal-buttons button {
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        #cancelBtn {
            background-color: #ccc;
        }
        #resetBtn {
            background-color: rgb(88, 155, 255);
            color: white;
        }
        #resetBtn:hover {
            background-color: rgb(64, 137, 247);
        }
        #saveBtn {
            background-color: #4CAF50;
            color: white;
        }
        #saveBtn:hover {
            background-color: #45a049;
        }
        #model-dtext {
            font-size: 12px;
            color: #666;
            font-style: italic;
        }

        /* Special rules styles */
        .special-wrapper {
            border: 1px solid #ccc;
            border-radius: 6px;
            padding: 8px;
        }
        .special-inputs {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
        }
        #special-keyword {
            flex: 1;
            padding: 6px 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 14px;
        }
        #special-level {
            width: 210px;
            padding: 6px 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 14px;
        }
        #addSpecialBtn {
            background-color: rgb(88, 155, 255);
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
        }
        #addSpecialBtn:hover {
            background-color: rgb(64, 137, 247);
        }
        .special-list {
            list-style: none;
            padding-left: 0;
            margin: 0;
            max-height: 180px;
            overflow-y: auto;
        }
        .special-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 6px 10px;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            background: #fafafa;
            margin-top: 6px;
        }
        .special-item .kw {
            font-weight: 600;
            color: #333;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 60%;
        }
        .special-item .weight-badge {
            background: #eef3ff;
            color: #3a67e3;
            border: 1px solid #d5e0ff;
            border-radius: 12px;
            padding: 2px 8px;
            font-size: 12px;
            white-space: nowrap;
        }
        .special-item .remove-special {
            cursor: pointer;
            font-weight: bold;
            color: #666;
            margin-left: 6px;
        }
        .special-item .remove-special:hover {
            color: #333;
        }
    `;
    document.head.appendChild(style);

    // 将模态窗口添加到页面
    document.body.appendChild(modal);

    // 处理输入框的关键词分隔和标签生成（普通规则）
    const tagInputs = modal.querySelectorAll('.tag-input');
    tagInputs.forEach(input => {
        const container = input.parentElement;

        input.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            if (value.endsWith(',')) {
                const keyword = value.slice(0, -1).trim(); // 去掉逗号
                if (keyword) {
                    addTag(container, keyword);
                    e.target.value = ''; // 清空输入框
                }
            }
        });

        // 支持 Enter 键分隔
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const keyword = e.target.value.trim();
                if (keyword) {
                    addTag(container, keyword);
                    e.target.value = ''; // 清空输入框
                }
            } else if (e.key === 'Backspace' && !e.target.value) {
                const tags = container.querySelectorAll('.tag');
                if (tags.length > 0) {
                    tags[tags.length - 1].remove(); // 删除最后一个标签
                }
            }
        });

        // 点击删除标签
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-tag')) {
                e.target.parentElement.remove();
            }
        });
    });

    // 添加标签的辅助函数（普通规则）
    function addTag(container, text) {
        const tag = document.createElement('span');
        tag.classList.add('tag');
        tag.innerHTML = `${text} <span class="remove-tag">×</span>`;
        container.insertBefore(tag, container.querySelector('.tag-input')); // 在输入框前插入
    }

    // --------- Special Weight Rules logic ----------
    const levelToWeight = {
        "1": 1.5, // Weighted
        "2": 1.0, // Non-Weighted
        "3": 0.5, // Electives
        "4": 0.0  // Not Count in GPA
    };

    const specialListEl = modal.querySelector('.special-list');
    const specialKeywordInput = modal.querySelector('#special-keyword');
    const specialLevelSelect = modal.querySelector('#special-level');
    const addSpecialBtn = modal.querySelector('#addSpecialBtn');

    function addSpecialItem(keyword, weight) {
        if (!keyword) return;
        const kwNorm = keyword.trim();
        if (!kwNorm) return;

        // prevent duplicates (case-insensitive)
        const exists = Array.from(specialListEl.querySelectorAll('.special-item .kw'))
            .some(el => el.textContent.trim().toLowerCase() === kwNorm.toLowerCase());
        if (exists) return;

        const li = document.createElement('li');
        li.classList.add('special-item');
        li.dataset.keyword = kwNorm;
        li.dataset.weight = String(weight);

        // show numeric weight; you can also show label if needed
        li.innerHTML = `
            <span class="kw" title="${kwNorm}">${kwNorm}</span>
            <span class="weight-badge">${weight}</span>
            <span class="remove-special" title="${tlang("移除","Remove")}">×</span>
        `;
        specialListEl.appendChild(li);
    }

    function handleAddSpecial() {
        const kw = specialKeywordInput.value.trim();
        const level = specialLevelSelect.value;
        if (!kw) return;

        const weight = levelToWeight[level] ?? 1.0;
        addSpecialItem(kw, weight);

        // clear input for next entry
        specialKeywordInput.value = '';
        specialKeywordInput.focus();
    }

    addSpecialBtn.addEventListener('click', handleAddSpecial);
    specialKeywordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSpecial();
        } else if (e.key === 'Escape') {
            e.target.blur();
        }
    });

    specialListEl.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('remove-special')) {
            const li = target.closest('.special-item');
            if (li) li.remove();
        }
    });

    // 取消按钮事件
    const cancelBtn = modal.querySelector('#cancelBtn');
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modal); // 关闭模态窗口
    });

    const resetBtn = modal.querySelector('#resetBtn');
    resetBtn.addEventListener('click', () => {
        const result = {
            high: ["AP","AS","A2","A Level","ALevel","Linear Algebra"],
            low: ["Fine Art","IT ","Electi","Drama","Chinese Painting","Architectural","Dance","Percussion","Vocal","Media","Programming","Spanish","Philosophy","Skills","Journalism","Creative"],
            no: ["Homeroom"],
            specialWeightRules: [] // 默认清空特殊规则
        };

        document.body.removeChild(modal);
        console.log('Saved result:', result);
        saveToChromeStorage("subjectWeightRules", result);
        document.getElementById('showReloadTip').innerText = tlang("科目加权匹配规则保存成功。","Subject weight matching rules saved.");
        return result;
    });

    // init 普通规则        
    try {
        for (let i = 0; i < originalHigh.length; i++) {
            const keyword = originalHigh[i];
            addTag(modal.querySelector(`.tag-container[data-name="high"]`), keyword);
        }
    } catch (e) {}
    try {
        for (let i = 0; i < originalLow.length; i++) {
            const keyword = originalLow[i];
            addTag(modal.querySelector(`.tag-container[data-name="low"]`), keyword);
        }
    } catch (e) {}
    try {
        for (let i = 0; i < originalNo.length; i++) {
            const keyword = originalNo[i];
            addTag(modal.querySelector(`.tag-container[data-name="no"]`), keyword);
        }
    } catch (e) {}

    // init 特殊规则
    try {
        if (Array.isArray(originalSpecial)) {
            // 支持两种结构：[{ "Pre AP Math": 1.0 }, { "Art": "1.5" }] 或 [{keyword:"Art", weight:1.5}]
            originalSpecial.forEach(item => {
                if (item && typeof item === 'object' && !Array.isArray(item)) {
                    const entries = Object.entries(item);
                    if (entries.length === 1) {
                        const [k, v] = entries[0];
                        addSpecialItem(k, parseFloat(v));
                    } else if ('keyword' in item && 'weight' in item) {
                        addSpecialItem(String(item.keyword), parseFloat(item.weight));
                    }
                }
            });
        } else if (originalSpecial && typeof originalSpecial === 'object') {
            // 若为字典对象
            Object.entries(originalSpecial).forEach(([k, v]) => {
                addSpecialItem(k, parseFloat(v));
            });
        }
    } catch (e) {}

    // 保存按钮事件
    const saveBtn = modal.querySelector('#saveBtn');
    saveBtn.addEventListener('click', () => {
        const result = {
            high: [],
            low: [],
            no: [],
            specialWeightRules: []
        };

        // 收集普通规则标签
        const tagContainers = modal.querySelectorAll('.tag-container');
        tagContainers.forEach(container => {
            const name = container.getAttribute('data-name');
            const tags = container.querySelectorAll('.tag');
            tags.forEach(tag => {
                const text = tag.textContent.replace('×', '').trim();
                result[name].push(text);
            });
        });

        // 收集特殊规则列表（保存成数组，元素为 { [keyword]: weight }）
        const specialItems = modal.querySelectorAll('.special-item');
        specialItems.forEach(li => {
            const kw = li.dataset.keyword || li.querySelector('.kw')?.textContent?.trim();
            const wt = parseFloat(li.dataset.weight || li.querySelector('.weight-badge')?.textContent || '1.0');
            if (kw) {
                const obj = {};
                obj[kw] = wt;
                result.specialWeightRules.push(obj);
            }
        });

        document.body.removeChild(modal); // 关闭模态窗口
        console.log('Saved result:', result);
        saveToChromeStorage("subjectWeightRules", result);
        saveToChromeStorage("specialWeightRules", result.specialWeightRules);
        document.getElementById('showReloadTip').innerText = tlang("科目加权匹配规则保存成功。","Subject weight matching rules saved.");
        return result;
    });
}

// 为 #customGPAweight 按钮绑定点击事件
document.getElementById('customGPAweight').addEventListener('click', beforeopenCustomGPAWeightModal);

function beforeopenCustomGPAWeightModal(){
    chrome.storage.local.get(["specialWeightRules"], function(speresult) {
       chrome.storage.local.get(["subjectWeightRules"], function(result) {
            openCustomGPAWeightModal(result["subjectWeightRules"], speresult["specialWeightRules"]);
        });
    });
    
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


//###################MS BIDING################
document.getElementById('teamsIconforBindLabel').src=chrome.runtime.getURL("res/msteamsLogo.ico");
let questionMarkLabel = document.getElementById('questionforBindLabel')
let TeamsBidingBtn = document.getElementById('bindMSAccountsBtn');
questionMarkLabel.src=chrome.runtime.getURL("res/questionMark.svg");
chrome.storage.local.get('MSUserProfile', function(a) {
    let data = a.MSUserProfile?a.MSUserProfile:{};
    console.log(data)
    if(data.state == 1){
        TeamsBidingBtn.innerText = tlang(`已绑定：${data.name}`,`Binded:${data.name}`);
    }else{
        TeamsBidingBtn.innerText = tlang("进入账号绑定","Bind Teams Account");
    }
});
TeamsBidingBtn.addEventListener('click', function() {
    beforeOpenTeamsBidingModal();/*
    */

});questionMarkLabel.addEventListener('mouseover', function () {
        const tooltip = document.createElement('div');
        tooltip.textContent = tlang("与Teams账号连接后可在校宝提交Teams系统项目，并支持将DDL自动至Teams日历","You may submit Teams assignments in Xiaobao and automatically add DDLs to your Teams calendar after connecting with Teams Account.");
        tooltip.style.position = 'absolute';
        tooltip.style.background = '#333';
        tooltip.style.color = '#fff';
        tooltip.style.padding = '5px 10px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '12px';
        tooltip.style.zIndex = '1000';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.opacity = '0'; 
        tooltip.style.transition = 'opacity 0.2s ease-in-out'; 
        const rect = questionMarkLabel.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX}px`;
        tooltip.style.top = `${rect.top + window.scrollY - 30}px`; 
        tooltip.className = 'tooltip';
        document.body.appendChild(tooltip);
        setTimeout(() => (tooltip.style.opacity = '1'), 0);
    });

    questionMarkLabel.addEventListener('mouseout', function () {
        const tooltip = document.querySelector('.tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0'; 
            setTimeout(() => tooltip.remove(), 200); 
        }
    });
function beforeOpenTeamsBidingModal() {
    let lastLoginUser = "";
    let lastLoginUser2 = "";
    chrome.storage.local.get('lastLoginUser', function(a) {
        try {
            let data = a.lastLoginUser;
            if (data.lastLoginUser != null && data.lastLoginUser != "" && data.lastLoginUser != undefined) {
                lastLoginUser = data.lastLoginUser;
                lastLoginUser2 = data.lastLoginUser2 ? data.lastLoginUser2 : "-----";
            } else {
                lastLoginUser = "[本地无记录，请先登录一次校宝平台]";
                lastLoginUser2 = "-----";
            }
        } catch (error) {
            lastLoginUser = "[本地无记录，请先登录一次校宝平台]";
            lastLoginUser2 = "-----";
        }
        openTeamsBidingModal(lastLoginUser, lastLoginUser2);
    });
}
function openTeamsBidingModal(lastLoginUser,lastLoginUser2) {
    
    try {document.getElementById('showReloadTip').innerText = "";} catch (e) {};
    
    // 创建模态窗口的 HTML 结构
    const modal = document.createElement('div');
    modal.classList.add('teams-biding-modal');
    modal.innerHTML = `<div class="teams-biding-modal">
        <div class="modal-content">
            <h2 id="bidingH2">连接到Teams</h2>
            <p id="model-dtext">绑定Teams账户可使用多项功能<br>连接的Teams账号仅支持一个校宝访问，请进行选择</p>
            <br>
            <div class="icon-container" style="display: flex; justify-content: center; align-items: center; gap: 20px; margin: 20px 0;">
                <!-- 左侧图标和选择框 -->
                <div style="width:100px;display: flex; flex-direction: column; align-items: center;">
                    <div class="icon-circle" id="schoolIconCircle">
                        <img id="schoolIcon" src="https://cdn.schoolis.cn/sis/favicon/sis.ico" alt="校宝系统" style="width: 40px; height: 40px;">
                    </div>
                    <select id="userSelect" style="margin-top: 10px; padding: 5px;">
                        <option value="" selected>${tlang("请选择校宝账号","Select Xiaobao account")}</option>
                        <option value="${lastLoginUser}" ${lastLoginUser[0]=='['?"disabled":""}>${lastLoginUser}</option>
                        <option value="${lastLoginUser2}" ${lastLoginUser2[0]=='-'?"disabled":""}>${lastLoginUser2}</option>
                    </select>
                </div>
                <!-- 中间的连接线 -->
                <div style="width: 70px; height: 1.6px; background: #EEE; align-self: center; margin-top:-43px;"></div>
                <!-- 右侧图标和按钮 -->
                <div style="width:100px;display: flex; flex-direction: column; align-items: center;">
                    <div class="icon-circle" id="teamsIconCircle">
                        <img id="teamsIconforBindLabel" src="${chrome.runtime.getURL("res/msteamsLogo.ico")}" alt="Teams" style="width: 40px; height: 40px;">
                    </div>
                    <button id="bindButton" style="margin-top: 10px; padding: 6px 10px; background: #4CAF50; color: white; border: none; border-radius: 7px; cursor: pointer;">点击绑定</button>
                </div>
            </div>
            <!-- 备注 -->
            <p class="note-text">Giaoculator仅能访问您所授权的作业与日历信息，所有操作将在本地完成。</p>
            <!-- 按钮区域 -->
            <div class="modal-buttons">
                <button id="cancelBtn" style="display:none">解除绑定</button>
                <button id="saveBtn">返回</button>
            </div>
        </div>
    </div>
    `;

    // 添加 CSS 样式
    const style = document.createElement('style');
    style.textContent = `
    .teams-biding-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    .modal-content {
        background-color: white;
        padding: 20px;
        padding-bottom: 0px;
        border-radius: 10px;
        width: 500px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        font-family: Arial, sans-serif;
    }
    .modal-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 17px;
    }
    .modal-buttons button {
        padding: 8px 15px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    }
    #userSelect{
        border-radius: 8px;
        padding: 6.3px;
        color: #111111;
        border: 1px solid #ccc;
        width: 160px;
        outline: none;
        max-width: 95%;
    }
    #saveBtn {
        margin-top: 10px; padding: 6px 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;
    }
    #saveBtn:hover {
        background-color: #45a049;
    }
    
    #cancelBtn {
        margin-top: 10px; padding: 6px 10px; color: white; border: none; border-radius: 4px; cursor: pointer;
        background-color:rgb(196, 54, 78);
        color: white;
    }
    #cancel:hover {
          background-color:rgb(208, 74, 74);
    }
    #model-dtext {
        font-size: 12px;
        color: #666;
        font-style: italic;
        text-align: center;
        margin-bottom: 20px;
    }
    #bidingH2 {
        font-size: 18px;
        color: #333;
        margin-bottom: 10px;
        text-align: center;
    }
    .icon-circle {
        width: 60px;
        height: 60px;
        border: 0px solid #333;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 10px;
        position: relative;
        overflow: hidden;
        background-image: url(${chrome.runtime.getURL("res/settings_bg.png")});
        background-size: 220% 220%; 
        background-position: 0 0;
    }
    .note-text {
        font-size: 12px;
        color: #666;
        text-align: center;
        margin-top: 20px;
    }
    `;
    document.head.appendChild(style);

    document.body.appendChild(modal);



    chrome.storage.local.get('MSUserProfile', function(a) {
        let data = a.MSUserProfile?a.MSUserProfile:{};
        let note = modal.querySelector('.note-text');
        console.log(data)
        if(data.state == 1){
            modal.querySelector('#userSelect').outerHTML = `<p style="color:#333;">${data.xbAccount}</p>`;
            modal.querySelector('#bindButton').outerHTML = `<p style="color:#333;">${data.name}</p>`;
            note.innerText = (`绑定的Teams仅在校宝登录账号为${data.xbAccount}时生效，如需修改请先解除绑定`);
            unbindBtn.style.display= "block";
            modal.querySelector('#saveBtn').innerText = tlang("确定","Okay");
        }else{
        }
    });

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        let note = modal.querySelector('.note-text');
        if (request.type === "MSAccountBinded") {
            chrome.storage.local.get('MSUserProfile', function(a) {
                let data = a.MSUserProfile;
                console.log(data)
                if(data.state == 1){
                    modal.querySelector('#userSelect').outerHTML = `<p style="color:#333;">${data.xbAccount}</p>`;
                    modal.querySelector('#bindButton').outerHTML = `<p style="color:#333;">${data.name}</p>`;
                    note.innerText = (`绑定的Teams仅在校宝登录账号为${data.xbAccount}时生效，如需修改请先解除绑定`);
                    unbindBtn.style.display= "block";
                    let TeamsBidingBtn = document.getElementById('bindMSAccountsBtn');
                    TeamsBidingBtn.innerText = tlang(`已绑定：${data.name}`,`Binded:${data.name}`);
                    modal.querySelector('#saveBtn').innerText = tlang("确定","Okay");
                }else{
                }
            });
        }else if(request.type === "MSAccountBindFailed") {
            let errorMsg = request.data;
            note.innerText = (`绑定失败: ${errorMsg}`);
            bindButton.disabled = false;
            bindButton.innerText = tlang("点击绑定","Bind Now");
            bindButton.style.backgroundColor = "#4CAF50";
        }
    });
    function unbindTeams() {
        console.log("Unbinding Teams account...");
        chrome.storage.local.set({ MSUserProfile: { state: 0, name: "", xbAccount: "" } }, function() {
            document.getElementById('showReloadTip').innerText = tlang("Teams账号解绑成功。","Teams account unbound successfully.");
            let TeamsBidingBtn = document.getElementById('bindMSAccountsBtn');
            TeamsBidingBtn.innerText = tlang("进入账号绑定","Bind Teams Account");
            chrome.storage.local.set({"MSaccessToken": ""});
            chrome.storage.local.set({"MSrefresh_token": ""});
            document.body.removeChild(modal); // 关闭模态窗口
        });
    }   
    const unbindBtn = modal.querySelector('#cancelBtn');
    unbindBtn.addEventListener('click', () => {
        if(confirm(tlang("是否解除绑定Teams账号？","Are you sure to unbind Teams account?"))){
            unbindTeams();
        }
    })
    const exitBtn = modal.querySelector('#saveBtn');
    exitBtn.addEventListener('click', () => {
        document.body.removeChild(modal); 
    });

    const bindButton = modal.querySelector('#bindButton');
    bindButton.addEventListener('click', () => {
        if(modal.querySelector('#userSelect').value == ""){
            const userSelect = modal.querySelector('#userSelect');
            userSelect.style.boxShadow = '0 0 8px 2px rgb(38, 176, 77), 0 0 16px 6px #ffedc2';
            userSelect.style.transition = 'box-shadow 0.4s';
            setTimeout(() => {
                userSelect.style.boxShadow = '';
            }, 1100);
            userSelect.focus();
            return;
        }
        chrome.runtime.sendMessage({ 
            type: "bindMSAccount", 
            xbAccount: modal.querySelector('#userSelect').value,
        });
        bindButton.disabled = true;
        bindButton.innerText = tlang("在新窗口操作","Operate in new window");
        bindButton.style.backgroundColor = "#ccc";
        bindButton.cursor = "sending";
    });

    let schoolPosX = 0;
    let schoolPosY = 0;
    let teamsPosX = 0;
    let teamsPosY = 0;
    let schoolDirX = 1; 
    let schoolDirY = 1;
    let teamsDirX = -1; 
    let teamsDirY = -1;
    const speed = 0.2; // 移动速度（像素/帧）

    const schoolIconCircle = document.getElementById('schoolIconCircle');
    const teamsIconCircle = document.getElementById('teamsIconCircle');

    function animateBackground() {
        // 校宝图标背景移动
        schoolPosX += speed * schoolDirX;
        schoolPosY += speed * schoolDirY;
        // 到达边界后反向
        if (schoolPosX >= 100) {
            schoolPosX = 100;
            schoolDirX = -1;
        } else if (schoolPosX <= 0) {
            schoolPosX = 0;
            schoolDirX = 1;
        }
        if (schoolPosY >= 100) {
            schoolPosY = 100;
            schoolDirY = -1;
        } else if (schoolPosY <= 0) {
            schoolPosY = 0;
            schoolDirY = 1;
        }
        schoolIconCircle.style.backgroundPosition = `${schoolPosX}% ${schoolPosY}%`;

        // Teams 图标背景移动
        teamsPosX += speed * teamsDirX;
        teamsPosY += speed * teamsDirY;
        // 到达边界后反向
        if (teamsPosX >= 100) {
            teamsPosX = 100;
            teamsDirX = -1;
        } else if (teamsPosX <= 0) {
            teamsPosX = 0;
            teamsDirX = 1;
        }
        if (teamsPosY >= 100) {
            teamsPosY = 100;
            teamsDirY = -1;
        } else if (teamsPosY <= 0) {
            teamsPosY = 0;
            teamsDirY = 1;
        }
        teamsIconCircle.style.backgroundPosition = `${teamsPosX}% ${teamsPosY}%`;

        requestAnimationFrame(animateBackground);
    }

    animateBackground();
}

