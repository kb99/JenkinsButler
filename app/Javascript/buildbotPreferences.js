// Copyright (c) 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

(function () {

    window.buildbot = window.buildbot || {};

    buildbot.PrefStore = function() {
        this.defaults_ = {
            prefs: {
                use_notifications: false,
                try_job_username: null
            }
        };

        loadPrefsFromStorage();

        var jenkinsUrl = '';
        var userApiKey = '';

        function getJenkinsUrl() {
            //this.get_("try_job_username", callback);
            //return "https://builds.apache.org/";
            return jenkinsUrl;
        }

        function getUserApiKey() {
            return userApiKey;
        }

        function getJenkinsJobs() {
            //this.get_("try_job_username", callback);
            return ["AuroraBot", "Apache Jackrabbit Oak matrix"];
        }

        function loadPrefsFromStorage() {
            chrome.storage.local.get({
                jenkinsUrl: '',
                userApiKey: ''
            }, function (items) {
                jenkinsUrl = items.jenkinsUrl;
                userApiKey = items.userApiKey;
            });
        }

    };


})();
