(function(){

    function getJobStatusStyle(build) {
        if (build.result == "SUCCESS") {
            return "label-success";
            
        }
        
        if (build.result == "UNSTABLE") {
            return "label-warning";
        }

        if (build.result == "FAILURE") {
            return "label-danger";
        }
        return "label-default";
    }
    

    function addJobStatusRow(job, numbuildsForEachJob) {
        var table = document.getElementById("status-table");

        var row = table.insertRow(-1);
        row.className = "trunk-status-row ";
        var label = row.insertCell(-1);
        var jobNameH4 = document.createElement("h4");
        var labelDiv = document.createElement("div");
        labelDiv.className = "label label-block label-info";

        var labelAnchor = document.createElement("a");
        labelAnchor.href = job.url;
        labelAnchor.target = "_blank";
        labelAnchor.id = "link_" + job.name;
        labelAnchor.textContent = job.name;

        labelDiv.appendChild(labelAnchor);
        jobNameH4.appendChild(labelDiv);
        label.appendChild(jobNameH4);
    
        if (job.builds != null && job.builds.length > 0) {
            var numBuildsToDisplay = job.builds.length > numbuildsForEachJob ? numbuildsForEachJob : job.builds.length;
            for (var i = 0; i < numBuildsToDisplay; i++) {

                var jobAnchor = document.createElement("a");
                jobAnchor.href = job.builds[i].url;
                jobAnchor.target = "_blank";
                jobAnchor.id = "link_" + job.name + job.builds[i].number;
                jobAnchor.textContent = job.builds[i].number;

                var status = row.insertCell(-1);
                if (job.builds[i].building) {

                    var progressDiv = document.createElement("div");
                    progressDiv.className = "progress-bar progress-bar-striped active";
                    progressDiv.setAttribute("role", "progressbar");
                    progressDiv.setAttribute("aria-valuenow", "100");
                    progressDiv.setAttribute("aria-valuemin", "0");
                    progressDiv.setAttribute("aria-valuemax", "100");
                    progressDiv.setAttribute("style", "width: 100%");
                    progressDiv.appendChild(jobAnchor);
                    status.appendChild(progressDiv);
                } else {
                    var jobH4 = document.createElement("h4");
                    var labelDiv = document.createElement("div");
                    labelDiv.className = "label label-block " + getJobStatusStyle(job.builds[i]);
                    labelDiv.appendChild(jobAnchor);
                    jobH4.appendChild(labelDiv);
                    status.appendChild(jobH4);
                }
            }
        }
    }

function loadSettingsAndDisplayJobs() {
    chrome.storage.local.get({
        numbuildsForEachJob: '5',
        jenkinsJobs: []
    }, function (items) {
        var jobs = buildbot.getActiveJobs();
        jobs.forEach(function (job) {
            addJobStatusRow(job, items.numbuildsForEachJob);
        });
    });

}

function main() {
    loadSettingsAndDisplayJobs();
}

function loadOptionsPage() {
    chrome.tabs.create({ 'url': 'chrome://extensions/?options=' + chrome.runtime.id });
}
 
//document.getElementById('loadJobs').addEventListener('click', loadOptionsPage);
document.getElementById('optionsBtn').addEventListener('click', loadOptionsPage);
main();

})();
