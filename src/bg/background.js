/* jshint esversion:6 */

function makeXHRreq(url, method, responseType){
  return new Promise(function(resolve, reject){
    let xhr = new XMLHttpRequest();
    xhr.responseType = responseType;
    xhr.onload = function(){resolve(xhr.response);};
    xhr.onerror = function(){reject(xhr.statusText);};
    xhr.open(method, url, true);
    xhr.send();
  });
}

function checkUserLogin(){
  makeXHRreq("https://moodle.plattsburgh.edu/login/index.php", "GET", "text")
  .then(function(success){
    console.log(success);
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
