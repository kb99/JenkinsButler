 (function () {
     var apiSub = "/api/json?tree=name,url,builds[number,result,url,building],lastBuild[number,building,result,url,culprits[fullName],actions[causes[userId,userName,upstreamBuild,upstreamProject]]]";

     
    window.buildbot = window.buildbot || {};
    
    var jenkinsJobs = buildbot.getActiveJobs();

    buildbot.refreshJobs = function (jenkinsSetup) {
        if (jenkinsSetup.jenkinsUrl === '') {
            return;
        }
        var jobs = jenkinsSetup.jobs;
        if (jobs) {
            
            for (var i = 0; i < jobs.length; i++) {
                buildbot.refreshSingleJob(jobs[i], jenkinsSetup);
            }
        } else {
            console.log("no jenkins jobs to query");
        }
        jenkinsJobs.removeOldJobs(jobs);        
    };

    buildbot.refreshSingleJob = function (job, jenkinsSetup) {
        if (jenkinsSetup.jenkinsUrl === '') {
            return;
        }

        buildbot.requestURL(createUrl(appendLastSlash(jenkinsSetup.jenkinsUrl), job),
            jenkinsSetup.userName,
            jenkinsSetup.userApiKey,
            "text",
            updateJobStatus,
            setJobStatusToError);
    };

    function updateJobStatus(result) {
        jenkinsJobs.updateJob(result);
    };

    function setJobStatusToError(error) {
    };

    function appendLastSlash(url) {
        var lastChar = url.substring(url.length - 1);
        if (lastChar != "/") {
            return url + "/";
        }
        return url;
    };

    function createUrl(host, job) {
        var url = host + "job/" + job + apiSub;
        console.log("url is " + url);
        return url;
    };
})();
