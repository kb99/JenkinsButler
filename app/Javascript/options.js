//Options Page Chrome Developer Console - use V2 link as its supported from Chrome v40 onwards
//https://developer.chrome.com/extensions/optionsV2
//https://developer.chrome.com/extensions/options


var apiSub = "/api/json?tree=name,url,builds[number,result,url],lastBuild[number,url]";
var apiAllJobs = "/api/json";
var apiViews = 'api/json?tree=views[name,url]';
var apiMostRecentBuilds = 'view/Most%20Recent%20Builds/api/json';

var jenkinsJobLookup = {};


/**
* Save options to chrome local storage
*/
function save_options() {
    var jenkinsUrl = document.getElementById('jenkinsUrl').value;
    var userName = document.getElementById('userName').value;
    var userApiKey = document.getElementById('userApiKey').value;
    var pollFrequency = document.getElementById('pollFrequency').value;
    var checkWebSockets = document.getElementById('checkWebSockets').checked;
    var websocketsUrl = document.getElementById('websocketsUrl').value;
    var notificationLevel = document.getElementById('notificationLevel').value;
    var notificationDuration = document.getElementById('notificationDuration').value;
    var numbuildsForEachJob = document.getElementById('numbuildsForEachJob').value;
    chrome.storage.local.set({
        jenkinsUrl: jenkinsUrl,
        userName: userName,
        userApiKey: userApiKey,
        pollFrequency: pollFrequency * 1000,
        checkWebSockets: checkWebSockets,
        websocketsUrl: websocketsUrl,
        notificationLevel: notificationLevel,
        notificationDuration: notificationDuration,
        numbuildsForEachJob: numbuildsForEachJob
}, function () {
        // Update status to let user know options were saved.
        var status = document.getElementById('configSettingsStatus');
        status.textContent = 'Settings saved.';
        setTimeout(function () {
            status.textContent = '';
        }, 1500);
    });
}

/**
* Restore options from chrome local storage
*/
function restore_options() {
    chrome.storage.local.get({
        jenkinsUrl: '',
        userName: '',
        userApiKey: '',
        pollFrequency: 60 * 1000,
        checkWebSockets: false,
        websocketsUrl: '',
        notificationLevel: '1',
        notificationDuration: '0',
        numbuildsForEachJob: '5',
        jenkinsJobs: []
    }, function (items) {
        document.getElementById('jenkinsUrl').value = items.jenkinsUrl;
        document.getElementById('userName').value = items.userName;
        document.getElementById('userApiKey').value = items.userApiKey;
        document.getElementById('pollFrequency').value = items.pollFrequency / 1000;
        document.getElementById('checkWebSockets').checked = items.checkWebSockets;
        document.getElementById('websocketsUrl').value = items.websocketsUrl;
        document.getElementById('notificationLevel').value = items.notificationLevel;
        document.getElementById('notificationDuration').value = items.notificationDuration;
        document.getElementById('numbuildsForEachJob').value = items.numbuildsForEachJob;

        var length = items.jenkinsJobs.length;
        for (var i = 0; i < length; i++) {
            addJobToJenkinsJobList(true, items.jenkinsJobs[i]);
        }

        var background = chrome.extension.getBackgroundPage();
        background.buildbot.updateNotificationLevel(items.notificationLevel);
        background.buildbot.updateNotificationDuration(items.notificationDuration);
    });
}

/**
 * <??????>
 * @deprecated Since version 1.0. Will be deleted in version 3.0. Use bar instead.
 */
function loadMostRecentBuildsJenkinsJobs() {
    console.warn("Calling deprecated function! - loadMostRecentBuildsJenkinsJobs");
    var jenkinsUrl = document.getElementById('jenkinsUrl').value;

    if (jenkinsUrl == '') {
        return;
    }

    buildbot.requestURL(appendLastSlash(jenkinsUrl) + apiMostRecentBuilds, "json", displayJenkinsJobs, dislayErrorGettingJenkinsJobs);
}

/**
* Loads default list of Jenkins jobs. Also loads list of Jenkins Views to dropdown
*/
function loadJenkinsJobs() {
    var jenkinsUrl = document.getElementById('jenkinsUrl').value;
    var userName = document.getElementById('userName').value;
    var apiToken = document.getElementById('userApiKey').value;

    if (jenkinsUrl == '') {
        return;
    }

    buildbot.requestURL(appendLastSlash(jenkinsUrl) + apiViews, userName, apiToken, "json", displayJenkinsViewsInDropDown, dislayErrorGettingJenkinsJobs);
}

/**
* Change list of jobs displayed in screen if user changes selection in dropdown
* Make call to Jenkins to retrieve list of jobs
*/
function switchJobView() {
    var jenkinsUrl = document.getElementById('jenkinsUrl').value;
    var userName = document.getElementById('userName').value;
    var apiToken = document.getElementById('userApiKey').value;
    if (jenkinsUrl == '') {
        return;
    }

    var optionSelector = document.getElementById('sel1');
    var pair = optionSelector.value.split("|");
    if (pair[0] === "Most Recent Builds") {
        buildbot.requestURL(appendLastSlash(pair[1]) + apiMostRecentBuilds, userName, apiToken, "json", displayJenkinsJobs, dislayErrorGettingJenkinsJobs);
    } else {
        buildbot.requestURL(appendLastSlash(pair[1]) + apiAllJobs, userName, apiToken, "json", displayJenkinsJobs, dislayErrorGettingJenkinsJobs);
    }
}

/**
* Add available Jenkins Views to dropdown
*/
function displayJenkinsViewsInDropDown(results) {

    var jenkinsJobSelector = document.getElementById('sel1');
    jenkinsJobSelector.innerHTML = '';

    var length = results.views.length;
    for (var i = 0; i < length; i++) {
        addDropDownItem(results.views[i]);
    }
    
    document.getElementById("sel1").selectedIndex = 0;
    switchJobView();
}

/**
* adds single item to dropdown 
* @item - name of view to add to dropdown
*/
function addDropDownItem(item) {
    var optionSelector = document.getElementById('sel1');
    var option = document.createElement("option");
    option.value = item.name + '|' + item.url;
    option.innerText = item.name;
    optionSelector.appendChild(option);
}

/**
* displays list of jobs received from Jenkins Api call
* @results - result from Ajax Api call
*/
function displayJenkinsJobs(results) {

    var jenkinsJobSelector = document.getElementById('jenkinsJobSelector');
    jenkinsJobSelector.innerHTML = '';

    var length = results.jobs.length;
    for (var i = 0; i < length; i++) {
        addCheckBox(results.jobs[i]);
    }
}

/**
* adds checkbox item to jenkinsJobSelector 
* @job - Jenkins Job object returned from Ajax Api call
*/
function addCheckBox(job) {
    var jenkinsJobSelector = document.getElementById('jenkinsJobSelector');
    var checkboxDiv = document.createElement("div");
    checkboxDiv.className = checkboxDiv.className + " checkbox";

    var label = document.createElement("label");
    var description = document.createTextNode(job.name);
    var checkbox = document.createElement("input");

    var jobIdForLookup = getIndexOfJenkinsJob(job.name);

    checkbox.type = "checkbox";    
    checkbox.id = 'check-' + jobIdForLookup;
    checkbox.name = job.name;
    checkbox.value = job.name;
    checkbox.addEventListener('click', handleCheckboxClick);

    if ($('#selectedJenkinsJobs').find('#li-' + jobIdForLookup).get(0) != null) {
        checkbox.checked = true;
    }

    label.appendChild(checkbox);   // add the box to the element
    label.appendChild(description);// add the description to the element

    checkboxDiv.appendChild(label);
    jenkinsJobSelector.appendChild(checkboxDiv);
}

/**
* Event handler when check box clicked 
* @event - event handler raised with click 
*/
function handleCheckboxClick(event) {
    addJobToJenkinsJobList(this.checked, this.value, null);
}

/**
* Adds or removes item from selectedJenkinsJob List
* @addJobToList - bool - should item be added or removed from list
* @jobName - name of job to add/remove from list
*/
function addJobToJenkinsJobList(addJobToList, jobName, idValue) {
    var jenkinsJobSelector = document.getElementById('selectedJenkinsJobs');

    var jobIdForLookup = jobName != null ? getIndexOfJenkinsJob(jobName) : idValue;

    if (addJobToList) {
        if ($('#selectedJenkinsJobs').find('#li-' + jobIdForLookup).get(0) == null) {
            var listItem = document.createElement("li");
            listItem.className = listItem.className + " list-group-item";
            listItem.id = 'li-' + jobIdForLookup;
            listItem.innerText = jobName;

            var deleteAnchor = document.createElement("a");
            deleteAnchor.id = "deleteMe-" + jobIdForLookup;
            deleteAnchor.className = deleteAnchor.className + " badge x-button";
            deleteAnchor.innerText = "x";
            deleteAnchor.addEventListener('click', removeItemFromListClickEvent);
            listItem.appendChild(deleteAnchor);

            jenkinsJobSelector.appendChild(listItem);
            
        }
    } else {
        if ($('#selectedJenkinsJobs').find('#li-' + jobIdForLookup).get(0) != null) {
            $('#selectedJenkinsJobs').find('#li-' + jobIdForLookup).get(0).remove();
        }
    }
}

/**
* Saves items in selectedJenkinsJob List to Chrome Storage
* @event - event object raised by click event
*/
function saveJenkinsJobs(event) {

    var jenkinsJobsToSave = [];
    var selectedJenkinsJobs = document.getElementById("selectedJenkinsJobs").getElementsByTagName("li");

    var length = selectedJenkinsJobs.length;
    for (var i = 0; i < length; i++) {
        var jobId = selectedJenkinsJobs[i].id;
        var liString = 'li-';
        if (jobId.startsWith(liString)) {
            jobId = jobId.substring(liString.length);
        }
        var jobName = getJenkinsJobFromIndex(jobId);
        jenkinsJobsToSave.push(jobName);
    }

    var jenkinsSetup = getJenkinsSetupFromPageFields();
    jenkinsSetup.jobs = jenkinsJobsToSave;
    var background = chrome.extension.getBackgroundPage();
    background.buildbot.refreshJobs(jenkinsSetup);

    chrome.storage.local.set({
        jenkinsJobs: jenkinsJobsToSave,
    }, function () {
        // Update status to let user know options were saved.
        var status = document.getElementById('configJobsStatus');
        status.textContent = 'Jenkins Jobs saved.';
        setTimeout(function () {
            status.textContent = '';
        }, 6000);
    });
}

/**
* Event Handler when user removes item from the selected list
*/
function removeItemFromListClickEvent() {

    var id = this.id;
    var deleteMeString ='deleteMe-';
    if (id.startsWith(deleteMeString)) {
        id = id.substring(deleteMeString.length);
    }

    addJobToJenkinsJobList(false, null, id);

    if ($('#jenkinsJobSelector').find('#check-' + id).get(0) != null) {
        $('#jenkinsJobSelector').find('#check-' + id).get(0).checked = false;
    }
}

/**
* display error message on screen
* @error - error message to display
*/
function dislayErrorGettingJenkinsJobs(error) {
    var displayMessage = document.getElementById('displayMessage');
    displayMessage.style.visibility = '';
    displayMessage.innerText = error;
}

/**
* append trailing slash '/' to url if its not present
* @url - url to append slash to
*/
function appendLastSlash(url) {
    var lastChar = url.substring(url.length - 1);
    if (lastChar != "/") {
        return url + "/";
    }
    return url;
}

function getIndexOfJenkinsJob(jobName) {
    if (jenkinsJobLookup[jobName] == null) {
        var sizeOfArray = 0;
        var key;
        for (key in jenkinsJobLookup) {
            if (jenkinsJobLookup.hasOwnProperty(key)) sizeOfArray++;
        }
        jenkinsJobLookup[jobName] = sizeOfArray + 1;
        return sizeOfArray + 1;
    } else {
        return jenkinsJobLookup[jobName];
    }
}

function getJenkinsJobFromIndex(index) {
    var key;
    for (key in jenkinsJobLookup) {
        if (jenkinsJobLookup.hasOwnProperty(key)) {
            if (jenkinsJobLookup[key] == index) return key;
        }
    }
    return "NotFound";
}

function getJenkinsSetupFromPageFields() {
        var jenkinsSetup = {};
        jenkinsSetup.jenkinsUrl = document.getElementById('jenkinsUrl').value;
        jenkinsSetup.userName =  document.getElementById('userName').value;
        jenkinsSetup.userApiKey = document.getElementById('userApiKey').value;
        jenkinsSetup.pollFrequency = document.getElementById('pollFrequency').value;
        jenkinsSetup.checkWebSockets = document.getElementById('checkWebSockets').checked;
        jenkinsSetup.websocketsUrl = document.getElementById('websocketsUrl').value;
        return jenkinsSetup;        
    }

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('loadJenkinsJobs').addEventListener('click', loadJenkinsJobs);
document.getElementById('saveJenkinsJobs').addEventListener('click', saveJenkinsJobs);
document.getElementById('sel1').addEventListener('change', switchJobView);

