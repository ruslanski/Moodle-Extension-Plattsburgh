

/**
 * @function checkValidLogin check if the user has a valid login to moodle available.
 */
function checkValidLogin(){
  var xhr = new XMLHttpRequest();
  var url = "https://moodle.plattsburgh.edu/login/index.php";
  xhr.onreadystatechange = function(){
  	if(this.readyState == 4 && this.status == 200){
      if(xhr.responseURL.search("moodle.plattsburgh") > -1){
        console.log("User is already logged in!");
      }
      else if(xhr.responseURL.search("cas.plattsburgh") > -1){
        console.log("Send user notification to log in");
      }
      else{
        console.log("Some error occured");
      }
  	}
  };
  xhr.open('get', url, true);
  xhr.send();
}

checkValidLogin();
