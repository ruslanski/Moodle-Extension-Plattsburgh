/* jshint esversion:6 */
/* jshint -W030 */

/**
 * @author Jayant Arora
 */

// add badge to denote testing
chrome.browserAction.setBadgeText({text:"a"});

// Global Variables
// check chrome local storage is events already exit if not set it to null.
chrome.storage.local.get(["EVENTS"], function(events){
  (events.EVENTS !== undefined) ? (EVENTS = events.EVENTS) : EVENTS = {};
});

var EVENT_NEED_FIX = {};

// chrome.storage.local.get(["EVENTS_TEST"], function(events){
//   (events.EVENTS_TEST !== undefined) ? (EVENTS_TEST = events.EVENTS_TEST) : EVENTS_TEST = {};
// });

// Add listener to listen for requests to get events
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(request);
    if(request.request === "EVENTS"){
      sendResponse({EVENTS: EVENTS});
    }
    if(request.request === "MARK DONE"){
      let id = request.id;
      let year = request.year;
      let month = request.month;
      let day = request.day;
      EVENTS[year][month][day][id].done = true;
      chrome.storage.local.set({EVENTS: EVENTS}, function(){
        sendResponse({EVENTS: EVENTS});
        console.log("event marked as done");
      });
    }
    if(request.request === "MARK UNDONE"){
      let id = request.id;
      let year = request.year;
      let month = request.month;
      let day = request.day;
      EVENTS[year][month][day][id].done = false;
      chrome.storage.local.set({EVENTS: EVENTS}, function(){
        sendResponse({EVENTS: EVENTS});
        console.log("event marked as undone");
      });
    }
    if(request.request === "REFRESH"){
      checkUserLogin();
      sendResponse({STATUS: "Refresh initialized"});
    }
  }
);

// loadScript("https://cdnjs.cloudflare.com/ajax/libs/q.js/2.0.3/q.min.js");

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
      makeChromeNotification(type="basic", iconURL="../../icons/icon.png", title="Moodle Plattsburgh", message="Log in again! Not able to get latest calender from Moodle.");
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
    console.log(vevents[i].getFirstPropertyValue("dtend"));
    eventToAdd.endDateJSON = vevents[i].getFirstPropertyValue("dtend").toJSON();
    let dateYear = eventToAdd.endDate.getFullYear();
    let dateMonth = eventToAdd.endDate.getMonth()+1;
    let dateDate = eventToAdd.endDate.getDate();
    let dateHour = eventToAdd.endDate.getHours();
    let dateMins = eventToAdd.endDate.getMinutes();
    let dateSecs = eventToAdd.endDate.getMinutes();
    eventToAdd.endDateJSON.year = dateYear;
    eventToAdd.endDateJSON.month = dateMonth;
    eventToAdd.endDateJSON.day = dateDate;
    eventToAdd.endDateJSON.hour = dateHour;
    eventToAdd.endDateJSON.minute = dateMins;
    eventToAdd.endDateJSON.second = dateSecs;
    eventToAdd.endDateUnix = vevents[i].getFirstPropertyValue("dtend").toUnixTime();

    // Test is the event has a valid due date.
    if(eventToAdd.endDateJSON.timezone === "floating" || eventToAdd.endDateJSON.isDate === true){
      // if(EVENTS[eventToAdd.uid]){
      //   if(EVENTS[eventToAdd.uid][0] !=== eventToAdd.endDateJSON EVENTS[eventToAdd.uid][1] EVENTS[eventToAdd.uid][2])
      // }
      if(EVENT_NEED_FIX[eventToAdd.uid]){
        if(!EVENT_NEED_FIX[eventToAdd.uid].newDate){
          EVENT_NEED_FIX[eventToAdd.uid].oldDate = eventToAdd.endDateJSON;
        }
        else{
          EVENT_NEED_FIX[eventToAdd.uid].oldDate = EVENT_NEED_FIX[eventToAdd.uid].newDate;
          // EVENT_NEED_FIX[eventToAdd.uid].oldDate = eventToAdd.endDateJSON;
        }
      }
      else{
        EVENT_NEED_FIX[eventToAdd.uid] = {};
        EVENT_NEED_FIX[eventToAdd.uid].oldDate = eventToAdd.endDateJSON;
      }
    }

    if(EVENTS[eventToAdd.uid]){
      let oldEventloc = EVENTS[eventToAdd.uid];
      console.log(eventToAdd.uid, EVENTS[oldEventloc[0]][oldEventloc[1]][oldEventloc[2]][eventToAdd.uid]);
      eventToAdd.done = EVENTS[oldEventloc[0]][oldEventloc[1]][oldEventloc[2]][eventToAdd.uid].done;
      EVENTS[oldEventloc[0]][oldEventloc[1]][oldEventloc[2]][eventToAdd.uid] = eventToAdd;
      continue;
    }
    else{
      eventToAdd.done = false;
    }

    EVENTS[eventToAdd.uid] = [eventToAdd.endDateJSON.year, eventToAdd.endDateJSON.month, eventToAdd.endDateJSON.day];

    if(EVENTS[eventToAdd.endDateJSON.year]){
      if(EVENTS[eventToAdd.endDateJSON.year][eventToAdd.endDateJSON.month]){
        if(EVENTS[eventToAdd.endDateJSON.year][eventToAdd.endDateJSON.month][eventToAdd.endDateJSON.day]){
          // if(EVENTS[eventToAdd.endDateJSON.year][eventToAdd.endDateJSON.month][eventToAdd.endDateJSON.day][eventToAdd.uid]){
          //   eventToAdd.done = EVENTS[eventToAdd.endDateJSON.year][eventToAdd.endDateJSON.month][eventToAdd.endDateJSON.day][eventToAdd.uid].done;
          // }
          // else{
          //   eventToAdd.done = false;
          // }
          EVENTS[eventToAdd.endDateJSON.year][eventToAdd.endDateJSON.month][eventToAdd.endDateJSON.day][eventToAdd.uid] = eventToAdd;
        }
        else{
          EVENTS[eventToAdd.endDateJSON.year][eventToAdd.endDateJSON.month][eventToAdd.endDateJSON.day] = {};
          EVENTS[eventToAdd.endDateJSON.year][eventToAdd.endDateJSON.month][eventToAdd.endDateJSON.day][eventToAdd.uid] = eventToAdd;
        }
      }
      else{
        EVENTS[eventToAdd.endDateJSON.year][eventToAdd.endDateJSON.month] = {};
        EVENTS[eventToAdd.endDateJSON.year][eventToAdd.endDateJSON.month][eventToAdd.endDateJSON.day] = {};
        EVENTS[eventToAdd.endDateJSON.year][eventToAdd.endDateJSON.month][eventToAdd.endDateJSON.day][eventToAdd.uid] = eventToAdd;
      }
    }
    else{
      EVENTS[eventToAdd.endDateJSON.year] = {};
      EVENTS[eventToAdd.endDateJSON.year][eventToAdd.endDateJSON.month] = {};
      EVENTS[eventToAdd.endDateJSON.year][eventToAdd.endDateJSON.month][eventToAdd.endDateJSON.day] = {};
      EVENTS[eventToAdd.endDateJSON.year][eventToAdd.endDateJSON.month][eventToAdd.endDateJSON.day][eventToAdd.uid] = eventToAdd;
    }
    // [eventToAdd.endDateJSON.month][eventToAdd.endDateJSON.day][eventToAdd.uid] = eventToAdd;
  }

  // call function to fix dates for those who have faulty dates
  scrapeEventTime();

  chrome.storage.local.set({EVENTS: EVENTS}, function(){
    console.log("Events saved to storage");
  });

  // inform popup that events are now laoded
  chrome.runtime.sendMessage({request: "EVENTS LOADED"}, function(response){
    console.log(response);
  });
}

// create an alarm to run checkUserLogin again every 3 hours
chrome.alarms.create("REFRESH MOODLE EVENTS", {periodInMinutes: 180});

// set up code to run when alarm is fired
chrome.alarms.onAlarm.addListener(function(){
  checkUserLogin();
});

/**
 * @function scrapeEventTime scrape page if event time is not available
 */
function scrapeEventTime(){
  let currentTime = Math.floor(new Date().getTime() / 1000);
  makeXHRreq(`https://moodle.plattsburgh.edu/calendar/view.php?view=month&time=${currentTime}&course=1`, "GET", "text")
  .then(function(monthPage){
    console.log(monthPage);
    let listofpromisesForEventURL = Object.keys(EVENT_NEED_FIX).map(function(uid){
      let tempURL = monthPage.responseText.match(new RegExp("https:\/\/moodle\.plattsburgh\.edu\/calendar\/view\.php\\?view=day&amp;course=1&amp;time=[0-9]*#event_"+uid));
      // test if the event is available as we are only scraping page for this month.
      // there are some events that belong to other months and it is a waste of computation to scrape them
      // when they are not event needed
      if(tempURL){
        let linkToPageWithEvents = tempURL[0].replace(/&amp;/g, "&");
        return scrapeListOfEventsPage(linkToPageWithEvents, uid);
      }
      else{
        return undefined;
      }
    });

    Q.allSettled(listofpromisesForEventURL)
    .then(function(eventUrlWithID){
      // console.log(eventUrlWithID);
      let scraptedDates =  eventUrlWithID.map(function(idAndUrl){
        if(idAndUrl.state === "fulfilled" && idAndUrl.value !== undefined){
          return getDueDateFromEventPage(idAndUrl.value[1], idAndUrl.value[0]);
        }
      });
      Q.allSettled(scraptedDates)
      .then(function(jsonDate){
        jsonDate.forEach(function(jsDate){
          if(jsDate.state === "fulfilled" && jsDate.value !== undefined){
            EVENT_NEED_FIX[jsDate.value[1]].newDate = jsDate.value[0];
          }
        });
        console.log(EVENT_NEED_FIX);
        fixDropBoxEvents();
      })
      .catch(function(error){
        console.log("Error: ", error);
      });
    })
    .catch(function(error){
      console.log("error getting event url with id: ", error);
    });
  })
  .catch(function(error){
    console.log("Error in scrapeEventTime: ", error);
  });
}

/**
 * @function scrapeListOfEventsPage
 * @param  {string} linkToPageWithEvents [description]
 * @param {string} idOfEvent ID of the event for which link needs to be scraped
 */
function scrapeListOfEventsPage(linkToPageWithEvents, idOfEvent){
    // return eventURL;
    return new Promise(function(resolve, reject){
      makeXHRreq(linkToPageWithEvents, "GET", "text")
      .then(function(pageWithEvent){
        let $pageWithEvent = $.parseHTML(pageWithEvent.responseText);
        let eventURL = $($pageWithEvent).find(`#event_${idOfEvent} > div > div.box.card-header.clearfix > h3 > a`)[0].href;
        if(eventURL){
          resolve([idOfEvent, eventURL]);
        }
        else{
          reject("Event Url not found");
        }
      })
      .catch(function(error){
        console.log(error);
      });
    // getDueDateFromEventPage(eventURL, idOfEvent);
  });
}

/**
 * @function getDueDateFromEventPage
 * @param  {string} actualEventPageURL get date from actual page where event is defined.
 * @param {string} idOfEvent ID of the event for which link needs to be scraped
 */
function getDueDateFromEventPage(actualEventPageURL, idOfEvent){
  return new Promise(function(resolve, reject){
    makeXHRreq(actualEventPageURL, "GET", "text")
    .then(function(actualEventPage){
      let $event = $.parseHTML(actualEventPage.responseText);
      let eventDate = $($($event).find('tr:has(td:contains("Due date"))').children()[1]).text();
      // console.log(eventDate);
      if(eventDate){
        let tempDateObject = new Date(eventDate);
        let dateYear = tempDateObject.getFullYear();
        let dateMonth = tempDateObject.getMonth()+1;
        let dateDate = tempDateObject.getDate();
        let dateHour = tempDateObject.getHours();
        let dateMins = tempDateObject.getMinutes();
        let dateSecs = tempDateObject.getMinutes();
        let jsonDate = new ICAL.Time({year: dateYear, month: dateMonth, day: dateDate, hour: dateHour, minute: dateMins, second: dateSecs, isDate: false}).toJSON();
        // console.log(idOfEvent);
        resolve([jsonDate, idOfEvent]);
      }
      else{
        reject("Error getting due date");
      }
      // EVENT_NEED_FIX[idOfEvent].newDate = jsonDate;
    })
    .catch(function(error){
      console.log(error);
    });
  });
}

/**
 * @function loadScript
 * @param {string} source
 */
function loadScript(source) {
  let script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.defer = true;
  script.src = `${source}`;
  let head = document.getElementsByTagName("head")[0];
  head.appendChild(script);
}

function fixDropBoxEvents(){
  for(let uid in EVENT_NEED_FIX){
    let brokenEvent = EVENT_NEED_FIX[uid];
    if(brokenEvent.newDate){
      let oldDate = brokenEvent.oldDate;
      let newDate = brokenEvent.newDate;
      let oldEvent = EVENTS[oldDate.year][oldDate.month][oldDate.day][uid];
      delete EVENTS[oldDate.year][oldDate.month][oldDate.day][uid];

      if(Object.keys(EVENTS[oldDate.year][oldDate.month][oldDate.day]).length === 0){
        delete EVENTS[oldDate.year][oldDate.month][oldDate.day];
        if(Object.keys(EVENTS[oldDate.year][oldDate.month]).length === 0){
          delete EVENTS[oldDate.year][oldDate.month];
        }
      }
      if(EVENTS[newDate.year]){
        if(EVENTS[newDate.year][newDate.month]){
          if(EVENTS[newDate.year][newDate.month][newDate.day]){
            EVENTS[newDate.year][newDate.month][newDate.day][uid] = oldEvent;
            EVENTS[uid] = [newDate.year, newDate.month, newDate.day];
          }
          else{
            EVENTS[newDate.year][newDate.month][newDate.day] = {};
            EVENTS[newDate.year][newDate.month][newDate.day][uid] = oldEvent;
            EVENTS[uid] = [newDate.year, newDate.month, newDate.day];
          }
        }
        else{
          EVENTS[newDate.year][newDate.month] = {};
          EVENTS[newDate.year][newDate.month][newDate.day] = {};
          EVENTS[newDate.year][newDate.month][newDate.day][uid] = oldEvent;
          EVENTS[uid] = [newDate.year, newDate.month, newDate.day];
        }
      }
      else{
        EVENTS[newDate.year] = {};
        EVENTS[newDate.year][newDate.month] = {};
        EVENTS[newDate.year][newDate.month][newDate.day] = {};
        EVENTS[newDate.year][newDate.month][newDate.day][uid] = oldEvent;
        EVENTS[uid] = [newDate.year, newDate.month, newDate.day];
      }
    }
  }
  chrome.storage.local.set({EVENTS: EVENTS}, function(){
    console.log("Events saved to storage");
  });

  // inform popup that events are now laoded
  chrome.runtime.sendMessage({request: "EVENTS LOADED"}, function(response){
    console.log(response);
  });
}

checkUserLogin();
