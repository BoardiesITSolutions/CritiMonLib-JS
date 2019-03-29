function CritiMon(api_key, app_id, app_version)
{
    var critimon = new Object({
        api_key: api_key,
        app_id: app_id,
        app_version: app_version,
        cookie: "",
        device_id: "",
        initialise: function(resultCallback) {

            var deviceIDCookie = getCookie("DeviceID");
            if (deviceIDCookie !== "")
            {
                critimon.device_id = deviceIDCookie;
            }
            var sessionIDCookie = getCookie("session_id")
            if (sessionIDCookie !== "")
            {
                critimon.cookie = sessionIDCookie;
            }
            initialiseCritimon(function (){
                resultCallback();
            });

        },
        reportCrash: function(ex, severity, customProperties){
            console.log(ex);
            sendCrash(ex, severity, customProperties);
        }
    });

    function setCookie(key, value, expire)
    {
        var d = new Date();
        if (!expire)
        {
            document.cookie = key + "=" + value + ";expires=Mon, 1 Jan " + (d.getFullYear() + 1) + " 12:00:00 UTC;";
        }
        else
        {
            var now = new Date();
            var minutes = 10;
            now.setTime(now.getTime() + (minutes * 60 * 1000));

            document.cookie = key + "=" + value + ";expires=" + now.toUTCString() + ";";
        }
    }

    function getCookie(cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for(var i = 0; i <ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    function initialiseCritimon(resultCallback)
    {
        if ((typeof critimon.api_key === typeof undefined || typeof critimon.app_id === typeof undefined)
            || critimon.api_key.length === 0 || critimon.app_id.length === 0)
        {
            reject("CritiMon api_key and app_id is required. Pass these in when creating the critimon object");
        }
        else
        {
            var postArray = { };
            postArray.ApplicationID = critimon.app_id;
            if (critimon.device_id !== "")
            {
                postArray.DeviceID = critimon.device_id;
            }
            else
            {
                postArray.DeviceID = generateRandomeDeviceID();
            }
            critimon.device_id = postArray.DeviceID;
            setCookie("DeviceID", postArray.DeviceID, false);
            sendCritiMonRequest(postArray, "initialise", critimon, function(result){
                window.onerror = function(msg, url, lineNo, columnNo, error){
                    unhandledErrorHandler(msg, url, lineNo, columnNo, error);
                };
                resultCallback(result);
            });
        }
    }

    function unhandledErrorHandler(msg, url, lineNo, columnNo, error)
    {
        console.log("unhandled error: Msg: " + msg);
        console.log("Unhandled error: Url: " + url);
        console.log("Unhandled error: Line No: " + lineNo);
        console.log("Unhandled error: Column No: " + columnNo);
        console.log("Unhandled error: Error: " + error);

        sendUnhandledCrash(msg, url, lineNo, columnNo, error, "Critical", "Unhandled");
    }

    function sendCrash(ex, severity, customProperties)
    {
        //Validate the crash severity
        switch (severity)
        {
            case "Low":
            case "Medium":
            case "Major":
            case "Critical":
                break;
            default:
                throw "Invalid Crash Severity provided";
        }
        var lines = ex.toString().split(/\r?\n/);
        var msg = lines[0];
        var postArray = { };
        postArray.Severity = severity;
        if (msg.indexOf(":") >= 0)
        {
            postArray.ExceptionType = msg.substring(0, msg.indexOf(":"));
            postArray.ExceptionMessage = msg.substring(msg.indexOf(":")+1).trim();
        }
        else
        {
            postArray.ExceptionType = msg;
            postArray.ExceptionMessage = msg;
        }
        postArray.ScreenResolution = "";
        postArray.Locale = navigator.language;
        postArray.AppID = critimon.app_id;
        postArray.CrashType = "Handled";
        postArray.DeviceID = critimon.device_id;
        postArray.Stacktrace = returnStacktrace();

        //Now we have a stack get the line number
        postArray.LineNo = getLineNoFromStacktrace(postArray.Stacktrace);

        postArray.VersionName = critimon.app_version;

        postArray.ScreenResolution = screen.width + " x " + screen.height;
        postArray.BrowserWidthHeight = $(window).width() + " x " + $(window).height();
        postArray.DeviceType = "JS";

        var browserDetails = identifyBrowser();
        postArray.Browser = browserDetails.browser;
        postArray.BrowserVersion = browserDetails.version;
        postArray.DeviceType = "Javascript";
        postArray.Url = window.location.href;

        if (typeof customProperties !== typeof undefined && customProperties !== null)
        {
            if (typeof customProperties === typeof String)
            {
                var currentProperties = JSON.parse(customProperties);
                currentProperties.Url = window.location.href;
                postArray.CustomProperty = JSON.stringify(customProperties);
            }
            else
            {
                customProperties.Url = window.location.href;
                postArray.CustomProperty = JSON.stringify(customProperties);
            }
        }
        else
        {
            customProperties = { };
            customProperties.Url = window.location.href;
            postArray.CustomProperty = JSON.stringify(customProperties);
        }
        sendCritiMonRequest(postArray, "crash", critimon, null);
    }

    function sendUnhandledCrash(msg, url, lineNo, columnNo, error, crashSeverity, crashType)
    {
        //Validate the crash severity
        switch (crashSeverity)
        {
            case "Low":
            case "Medium":
            case "Major":
            case "Critical":
                break;
            default:
                throw "Invalid Crash Severity provided";
        }
        //Validate the crash type
        switch (crashType)
        {
            case "Handled":
            case "Unhandled":
                break;
            default:
                throw "Invalid crash type provided";
        }

        var postArray = { };
        postArray.Severity = crashSeverity;
        if (msg.indexOf(":") >= 0)
        {
            postArray.ExceptionType = msg.substring(0, msg.indexOf(":"));
            postArray.ExceptionMessage = msg.substring(msg.indexOf(":")+1).trim();
        }
        else
        {
            postArray.ExceptionType = msg;
            postArray.ExceptionMessage = msg;
        }
        postArray.ScreenResolution = screen.width + " x " + screen.height;
        postArray.Locale = navigator.language;
        postArray.AppID = critimon.app_id;
        postArray.CrashType = crashType;
        postArray.DeviceID = critimon.device_id;
        postArray.Stacktrace = returnStacktrace();
        postArray.LineNo = lineNo;
        postArray.VersionName = critimon.app_version;
        postArray.ScreenResolution = screen.width + " x " + screen.height;
        postArray.BrowserWidthHeight = $(window).width() + " x " + $(window).height();

        var browserDetails = identifyBrowser();
        postArray.Browser = browserDetails.browser;
        postArray.BrowserVersion = browserDetails.version;
        postArray.DeviceType = "Javascript";

        var customProperties = { };
        customProperties.Url = window.location.href;
        postArray.CustomProperty = JSON.stringify(customProperties);

        sendCritiMonRequest(postArray, "crash", critimon, null);
    }

    function returnStacktrace()
    {
        var stack = new Error().stack;
        var splitStack = stack.split(/\r?\n/);

        //Rebuild into a proper string
        var stack = "";
        for (var i = 0; i < splitStack.length; i++)
        {
            if (i === 1 || i === 2 || i === 3)continue;

            stack += splitStack[i] + "\r\n";
        }
        return stack;
    }

    function getLineNoFromStacktrace(stack)
    {
        var stackSplit = stack.split(/\r?\n/);
        stack = stackSplit[1];
        stack = stack.replace("http://");
        stack = stack.replace("https://");
        //Get the first colon (:), after this is the line number)
        var lineInfo = stack.substring(stack.indexOf(":")+1);
        //Now what we have left, the colon next is the end of the line number
        var lineNo = lineInfo.substring(0, lineInfo.indexOf(":"));
        return lineNo;
    }

    function sendCritiMonRequest(postArray, api_endpoint, critimon, callbackResult)
    {
        var url = "http://192.168.1.96:500/";
        url += api_endpoint;

        $.ajax({
            type: "POST",
            url: url,
            async: true,
            headers: {
                "authorisation-token": critimon.api_key,
                "session_id": critimon.cookie,
                "device_id": critimon.device_id
            },
            data: postArray,
            crossDomain: true,
            success: function(object, status, xhr){
                if (api_endpoint === "initialise")
                {
                    critimon.cookie = xhr.getResponseHeader("session_id");
                    setCookie("session_id", critimon.cookie, true);
                }
                if (callbackResult !== null)
                {
                    callbackResult(object);
                }
            },
            error: function(xhr)
            {
                console.error("Status: " + xhr.status);
                console.error("Status Text:" + xhr.statusText);
                console.error("Response Text: " + xhr.responseText);
                if (callbackResult !== null)
                {
                    callbackResult(xhr);
                }
            }
        });

    }

    function generateRandomeDeviceID()
    {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 20; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    function identifyBrowser()
    {
        var regexps = {
                'Chrome': [/Chrome\/(\S+)/],
                'Firefox': [/Firefox\/(\S+)/],
                'MSIE': [/MSIE (\S+);/],
                'Opera': [
                    /Opera\/.*?Version\/(\S+)/,
                    /Opera\/(\S+)/
                ],
                'Safari': [/Version\/(\S+).*?Safari\//]
            },
        re, m, browser, version;

        userAgent = navigator.userAgent;
        elements = 2;
        for (browser in regexps)
        {
            while (re = regexps[browser].shift())
            {
                if (m = userAgent.match(re))
                {
                    version = (m[1].match(new RegExp('[^.]+(?:\.[^.]+){0,' + --elements + '}')))[0];
                    //return browser + ' ' + version);
                    var returnVal = {
                        "browser": browser,
                        "version": version
                    };
                    return returnVal;
                }
            }
        }
    }

    return critimon;
}

