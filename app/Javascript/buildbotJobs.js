// Copyright 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

(function () {

    window.buildbot = window.buildbot || {};

    buildbot.Jobs = function () {
        this.jobs_ = {};
    };
    buildbot.notificationLevel = 0;
    buildbot.notificationMessageDuration = -2;
    console.log("Set lotificationLevel " + this.notificationLevel);
    console.log("Set notificationDuration " + this.notificationMessageDuration);

    chrome.storage.local.get({
        notificationLevel: '1',
        notificationDuration: '0',
        jenkinsJobs: []
    }, function (items) {
        buildbot.notificationLevel = items.notificationLevel;
        buildbot.notificationMessageDuration = items.notificationDuration;
    });


    buildbot.updateNotificationLevel = function (notificationLevel) {
        buildbot.notificationLevel = notificationLevel;
    }

    buildbot.updateNotificationDuration = function (notificationDuration) {
        buildbot.notificationMessageDuration = notificationDuration;
    }

    buildbot.Jobs.prototype = {
        forEach: function (callback) {
            for (var key in this.jobs_)
                callback(this.jobs_[key]);
        },

        getJob: function (number) {
            return this.jobs_[number];
        },

        updateJob: function (job) {

            var oldJob = this.jobs_[job.name];
            this.jobs_[job.name] = job;


            if (oldJob == null || oldJob.lastBuild.result != job.lastBuild.result) {
                var culprits = job.lastBuild.culprits;
                var actions = job.lastBuild.actions;
                var culpritName = '';
                if (culprits.length > 0) {
                    if (culprits[0].fullName) {
                        culpritName = culprits[0].fullName;
                    }
                } else {
                    if (actions && actions.length > 0) {
                        var causes = actions[0];
                        if (causes && causes.causes.length > 0) {
                            if (causes.causes[0].userName != null) {
                                culpritName = causes.causes[0].userName;
                            } else if (causes.causes[0].upstreamProject != null) {
                                culpritName = causes.causes[0].upstreamProject;
                            }

                        }
                    }
                }

                var buildStatus = '';
                if (job.lastBuild.result == null && job.lastBuild.building) {
                    buildStatus = "Building";
                } else {
                    buildStatus = job.lastBuild.result;
                }

                console.log("Notification level set to " + buildbot.notificationLevel)
                console.log("duration " + buildbot.notificationMessageDuration)
                if ((buildbot.notificationLevel = 2)
                    || (buildbot.notificationLevel = 1 && builtStatus == "Failed"))
                {                
                    var opt = {
                        type: "basic",
                        title: job.name, 
                        priority: parseInt(buildbot.notificationMessageDuration, 10),
                        isClickable: true,
                        message: culpritName + ' ' + job.lastBuild.number + ' ' + buildStatus,
                        iconUrl: getIcon(job.lastBuild.result)
                    }

                    chrome.notifications.clear("notify_" + job.name);
                    chrome.notifications.create("notify_" + job.name, opt, creationCallback);
                } else {
                    console.log("No notification triggered")
                }
            }

            var failedJobs = 0;

            for (var property in this.jobs_) {
                if (this.jobs_.hasOwnProperty(property)) {
                    var targetJob = this.jobs_[property];
                    if (targetJob.lastBuild && targetJob.lastBuild.result == "FAILURE") {
                        failedJobs++;
                    }
                }
            }            
            
            if (failedJobs > 0) {
                chrome.browserAction.setBadgeText({ text: String(failedJobs) });
                chrome.browserAction.setBadgeBackgroundColor({ color: getColor("FAILURE") });                
            } else {
                chrome.browserAction.setBadgeBackgroundColor({ color: getColor("SUCCESS") });                
            }
            
            chrome.browserAction.setBadgeBackgroundColor({ color: getColor("FAILURE") });
        },
        
        removeOldJobs: function (currentJobs) {
            var jobsToBeDeleted = [];
            
            for (var key in this.jobs_) {
                if (this.jobs_.hasOwnProperty(key)) {
                    var jobExists = false;
                    for (var curJobIndex = 0; curJobIndex < currentJobs.length; curJobIndex++) {
                        if (this.jobs_[key].name === currentJobs[curJobIndex]) {
                            jobExists = true;
                            break;
                        }
                    }
                    
                    if (!jobExists) {
                        jobsToBeDeleted.push(this.jobs_[key].name);
                    }                    
                }
            }
            for (var index = 0; index < jobsToBeDeleted.length; index++) {
                delete this.jobs_[jobsToBeDeleted[index]];                
            }
        },

        removeIssue: function (issue) {
            delete this.jobs_[issue.issue];
            this.postEvent_({ event: "issueRemoved", issue: issue.issue });
        },

        setEventCallback: function (callback) {
            this.eventCallback_ = callback;
        },
        
        postEvent_: function (obj) {
            if (this.eventCallback_)
                this.eventCallback_(obj);
        }
    };

    buildbot.getActiveJobs = function () {
        var background = chrome.extension.getBackgroundPage();
        if (!background.buildbot.hasOwnProperty("jobs"))
            background.buildbot.jobs = new buildbot.Jobs;

        return background.buildbot.jobs;
    };

    function getIcon(result) {
        var url = "img/green.png";
        if (result == "UNSTABLE") {
            url = "img/yellow.png";
        } else if (result == "FAILURE") {
            url = "img/red.png";
        } else if (result == "ABORTED") {
            url = "img/grey.png";
        }
        return url;
    }

    function getColor(result) {
        var color = [0, 0, 255, 200];
        if (result == "UNSTABLE") {
            color = [255, 255, 0, 200];
        } else if (result == "FAILURE") {
            color = [255, 0, 0, 200];
        } else if (result == "ABORTED") {
            color = [200, 200, 200, 200];
        }
        return color;
    }

    function creationCallback(id) {
        var t = event;
    }

})();
