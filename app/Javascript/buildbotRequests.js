// Copyright (c) 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

(function () {

    window.buildbot = window.buildbot || {};

    buildbot.requestURL =
        function (url, userName, apiToken, responseType, callback, optErrorStatusCallback) {
            var xhr = new XMLHttpRequest();
            if (responseType == "json")
                // WebKit doesn't handle xhr.responseType = "json" as of Chrome 25.
                xhr.responseType = "text";
            else
                xhr.responseType = responseType;

            xhr.onreadystatechange = function (state) {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        //var response = responseType == "json" ? JSON.parse(xhr.response) : xhr.response;
                        var response = JSON.parse(xhr.response);
                        callback(response);
                    } else {
                        if (optErrorStatusCallback)
                            optErrorStatusCallback(xhr.status);
                    }
                }
            };

            xhr.onerror = function (error) {
                console.log("xhr error:", error);
            };

            xhr.open("GET", url, true);
            if (userName && userName.length > 0 && apiToken && apiToken.length > 0) {
                var authCredentials = userName + ":" + apiToken;
                xhr.setRequestHeader("Authorization", "Basic " + btoa(authCredentials));
            }
            xhr.send();
        };

})();
