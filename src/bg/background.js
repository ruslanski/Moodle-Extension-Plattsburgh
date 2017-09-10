/* jshint esversion:6 */

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
    xhr.onerror = function(){reject(xhr.statusText);};
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
    }
    else if(mainPage.responseURL.search("cas.plattsburgh") > -1){
      console.log("Send user notification to log in");
    }
    else{
      console.log("Some error occured!");
    }
  })
  .catch(function(error){
    console.log(error);
  });
}

checkUserLogin();

/**
 * @function checkValidLogin check if the user has a valid login to moodle available.
 */
function checkValidLogin(){
  var xhr = new XMLHttpRequest();
  var url = "https://moodle.plattsburgh.edu/login/index.php";
  xhr.onreadystatechange = function(){
  	if(this.readyState == 4 && this.status == 200){
      console.log(this);
      if(xhr.responseURL.search("moodle.plattsburgh.edu/my") > -1){
        console.log("User is already logged in!");
        let xhr = new XMLHttpRequest();
        let url = "https://moodle.plattsburgh.edu/calendar/view.php?view=month";
        xhr.onreadystatechange = function(){
          if(this.readyState == 4 && this.status == 200){
            // console.log(xhr.response);
            let jqueryHTML = $.parseHTML(xhr.response);
            console.log($(jqueryHTML).find("#region-main > div > div > div > div.bottom > a"));
          }
        };
        xhr.open("GET", url, true);
        xhr.send();
      }
      else if(xhr.responseURL.search("cas.plattsburgh") > -1){
        console.log("Send user notification to log in");
        chrome.notifications.create("1", {
          type: 'basic',
          iconUrl: '../../icons/icon128.png',
          title: "Moodle Plattsburgh",
          message: "Log in again! Not able to get latest calender from Moodle.",
          requireInteraction: true
        }, function(){});
      }
      else{
        console.log("Some error occured");
      }
  	}
  };
  xhr.open('get', url, true);
  xhr.send();
}

// checkValidLogin();
