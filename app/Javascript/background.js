(function () {

    function getJenkinsConfig(callback) {
        chrome.storage.local.get({
            jenkinsUrl: '',
            userName: '',
            userApiKey: '',
            pollFrequency: 60 * 1000,
            checkWebSockets: false,
            websocketsUrl: '',
            jenkinsJobs: []
        }, function(result) {
            callback(result);
        });
    }

    function parseChromeStorageResult(items) {
        var jenkinsSetup = {};
        jenkinsSetup.jenkinsUrl = items.jenkinsUrl;
        jenkinsSetup.userName = items.userName;
        jenkinsSetup.userApiKey = items.userApiKey;
        jenkinsSetup.pollFrequency = items.pollFrequency;
        jenkinsSetup.checkWebSockets = items.checkWebSockets;
        jenkinsSetup.websocketsUrl = items.websocketsUrl;
        jenkinsSetup.jobs = items.jenkinsJobs;
        return jenkinsSetup;
    }
    
    function setupWebSockets(jenkinsSetup) {
        var ws = new ReconnectingWebSocket(jenkinsSetup.websocketsUrl);
        ws.debug = true;
        ws.timeoutInterval = 20000;
        ws.reconnectInterval = 30000;
        ws.maxReconnectInterval = 60000;

        ws.onopen = function () {
            
            var opt = {
                type: "basic",
                title: "Jenkins Butler",
                message: "WebSockets conection sucessful to " + jenkinsSetup.websocketsUrl,
                iconUrl: "img/blue.png"
            }

            chrome.notifications.clear("notify_wsOnOpen");
            chrome.notifications.create("notify_wsOnOpen", opt, creationCallback);


            // Web Socket is connected. You can send data by send() method.
            //ws.send("message to send"); ....
        };
        ws.onmessage = function (evt) {
            var obj = $.parseJSON(evt.data);
            console.log(obj);
            if (!!obj && jenkinsSetup.jobs.indexOf(obj.project) > -1) {
                buildbot.refreshSingleJob(obj.project, jenkinsSetup);                
            }           
        }; 
        ws.onclose = function(evt) {
            var opt = {
                type: "basic",
                title: "Jenkins Butler",
                message: "WebSockets conection closed to " + jenkinsSetup.websocketsUrl,
                iconUrl: "img/red.png"
            }

            chrome.notifications.clear("notify_wsOnOpen");
            chrome.notifications.create("notify_wsOnOpen", opt, creationCallback);

        }; // websocket is closed. };
        ws.onerror = function (evt) {
            console.log(evt);
        }
    }

    function creationCallback(id) {
        var t = event;
    }

    function checkIfWebSocketsEnabled(items) {
        var jenkinsSetup = parseChromeStorageResult(items);
        if (jenkinsSetup.checkWebSockets) {
            setupWebSockets(jenkinsSetup);
        }
    }

    function refreshJenkinsJobs(items) {
        var jenkinsSetup = parseChromeStorageResult(items);
        buildbot.refreshJobs(jenkinsSetup);
        window.setTimeout(refreshJenkinsOnTimerEvent, jenkinsSetup.pollFrequency);
    }

    function refreshJenkinsOnTimerEvent() {
        getJenkinsConfig(refreshJenkinsJobs);
    }

    function main() {
        getJenkinsConfig(refreshJenkinsJobs);
        getJenkinsConfig(checkIfWebSocketsEnabled);
    }
    
    main();

})();