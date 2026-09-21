(function () {
    const TARGET_PATH = "/v2/exam/Exam/ExamAndLearningTaskShowScoreTypeSettings";
    const FAKE_BODY = JSON.stringify({
        state: 0,
        msg: null,
        msgCN: null,
        msgEN: null,
        data: {
            isOnlyShowPublishedScore: false
        }
    });
    const FAKE_JSON = JSON.parse(FAKE_BODY);

    function isTargetUrl(url) {
        return typeof url === "string" && url.indexOf(TARGET_PATH) !== -1;
    }

    function urlFromFetchInput(input) {
        if (typeof input === "string") {
            return input;
        }
        if (input && typeof input.url === "string") {
            return input.url;
        }
        return "";
    }

    const origFetch = window.fetch;
    if (typeof origFetch === "function") {
        window.fetch = function (input, init) {
            if (isTargetUrl(urlFromFetchInput(input))) {
                return Promise.resolve(new Response(FAKE_BODY, {
                    status: 200,
                    statusText: "OK",
                    headers: { "Content-Type": "application/json; charset=utf-8" }
                }));
            }
            return origFetch.apply(this, arguments);
        };
    }

    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
        this.__gcalcShowScoreType = isTargetUrl(url);
        return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
        if (!this.__gcalcShowScoreType) {
            return origSend.apply(this, arguments);
        }

        const xhr = this;
        const responseValue = xhr.responseType === "json" ? FAKE_JSON : FAKE_BODY;

        Object.defineProperty(xhr, "readyState", { configurable: true, get: function () { return 4; } });
        Object.defineProperty(xhr, "status", { configurable: true, get: function () { return 200; } });
        Object.defineProperty(xhr, "statusText", { configurable: true, get: function () { return "OK"; } });
        Object.defineProperty(xhr, "responseText", { configurable: true, get: function () { return FAKE_BODY; } });
        Object.defineProperty(xhr, "response", { configurable: true, get: function () { return responseValue; } });
        xhr.getAllResponseHeaders = function () {
            return "content-type: application/json; charset=utf-8\r\n";
        };
        xhr.getResponseHeader = function (name) {
            return String(name).toLowerCase() === "content-type"
                ? "application/json; charset=utf-8"
                : null;
        };

        setTimeout(function () {
            if (typeof xhr.onreadystatechange === "function") {
                xhr.onreadystatechange();
            }
            xhr.dispatchEvent(new Event("readystatechange"));
            if (typeof xhr.onload === "function") {
                xhr.onload();
            }
            xhr.dispatchEvent(new ProgressEvent("load"));
            xhr.dispatchEvent(new ProgressEvent("loadend"));
        }, 0);
    };
})();
