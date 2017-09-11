/* jshint esversion:6 */
/* jshint -W030 */

// Global Variables
// check chrome local storage is events already exit if not set it to null.
chrome.storage.local.get(["EVENTS"], function(events){
  (events.EVENTS !== undefined) ? (EVENTS = events.EVENTS) : EVENTS = {};
});

/**
 * @author Jayant Arora
 */

/**
 * @function makeXHRreq [Make XHR requests]
 * @param  {string} url          [The url that for which xhr needs to be called]
 * @param  {string} method       [method of xhr to be called.]
 * @param  {string} responseType [Type of response expected from xhr]
 * @return {Promise}              [A Promise is retured for the called XHR]
 */
function makeXHRreq(url, method, responseType){
  return new Promise(function(resolve, reject){
    let xhr = new XMLHttpRequest();
    xhr.responseType = responseType;
    xhr.onload = function(){resolve(xhr);};
    xhr.onerror = function(error){reject(xhr.statusText);};
    xhr.open(method, url, true);
    xhr.send();
  });
}

/**
 * @function checkUserLogin [Check if the user has a valid login to moodle available.]
 */
function checkUserLogin(){
  makeXHRreq("https://moodle.plattsburgh.edu/login/index.php", "GET", "text")
  .then(function(mainPage){
    console.log(mainPage);
    if(mainPage.responseURL.search("moodle.plattsburgh.edu/my") > -1){
      console.log("User is logged in!");
      getPageContainingURL();
    }
    else if(mainPage.responseURL.search("cas.plattsburgh") > -1){
      console.log("Send user notification to log in");
      // if the user is not logged in send a notification.
      // TODO: Open a new tab to ask the user to log in to cas.
      makeChromeNotification(type="basic", iconURL="../../icons/icon128.png", title="Moodle Plattsburgh", message="Log in again! Not able to get latest calender from Moodle.");
    }
    else{
      console.log("Some error occured!");
    }
  })
  .catch(function(error){
    console.log("Network Request failed: ", error);
  });
}

/**
 * @function makeChromeNotification [Generate chrome notifications]
 * @param  {string} type    [Type of notification]
 * @param  {string} iconURL [url to the icon for notification]
 * @param  {string} title   [title to display on the notification]
 * @param  {string} message [message to be sent to the notification]
 */
function makeChromeNotification(type, iconURL, title, message){
  chrome.notifications.create("1", {
    type: type,
    iconUrl: iconURL,
    title: title,
    message: message,
    requireInteraction: true
  }, function(){});
}

/**
 * @function getCalenderURL [Get url of the calender]
 * @param  {string} html [HTML of the page in string format which contains calender]
 * @return {[type]}      [description]
 */
function getCalenderURL(html){
  let jqueryHTML = $.parseHTML(html);
  let urlForCalender = $(jqueryHTML).find("#region-main > div > div > div > div.bottom > a")[0].href;
  makeXHRreq(url=urlForCalender, method="GET", responseType="text")
  .then(function(calender){
    parseCalender(calender.responseText);
  })
  .catch(function(error){
    console.log(error);
  });
  console.log(urlForCalender);
}


/**
 * @function getPageContainingURL Get the page in html which contains the URL for calender
 */
function getPageContainingURL(){
  let url = "https://moodle.plattsburgh.edu/calendar/view.php?view=month";
  makeXHRreq(url=url, method="GET", responseType="text")
  .then(function(page){
    getCalenderURL(page.response);
  })
  .catch(function(error){
    console.log(error);
  });
}

/**
 * @function parseCalender Parse given calender into uid, class, description, summary, startDate, endDate and done?
 * @param  {string} calender Calender.ics file in string format
 */
function parseCalender(calender){
  let jcalData = ICAL.parse(calender);
  let vcalendar = new ICAL.Component(jcalData);
  let vevents = vcalendar.getAllSubcomponents('vevent');
  for(let i=0; i<vevents.length; i++){
    let eventToAdd = {};
    eventToAdd.uid = vevents[i].getFirstPropertyValue("uid").replace(/[@].*/g, "");
    eventToAdd.class = vevents[i].getFirstPropertyValue("categories");
    eventToAdd.description = vevents[i].getFirstPropertyValue("description");
    eventToAdd.summary = vevents[i].getFirstPropertyValue("summary");
    eventToAdd.startDate = vevents[i].getFirstPropertyValue("dtstart").toJSDate();
    eventToAdd.endDate = vevents[i].getFirstPropertyValue("dtend").toJSDate();
    eventToAdd.done = false;
    // Add event to main EVENTS which holds all events.
    EVENTS[eventToAdd.uid] = eventToAdd;
  }
  chrome.storage.local.set({EVENTS: EVENTS}, function(){
    console.log("Events saved to storage");
  });
}

checkUserLogin();