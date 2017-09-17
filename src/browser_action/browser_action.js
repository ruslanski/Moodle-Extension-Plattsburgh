/* jshint esversion:6 */
/* jshint -W083 */
// JS for message passing

// GLobal Variables
var EVENTS = {};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  if(request.request === "EVENTS LOADED"){
    chrome.runtime.sendMessage({request: "EVENTS"}, function(response){
      EVENTS = response.EVENTS;
      if(Object.keys(EVENTS).length !== 0){
        addEventsToPopup();
      }
      console.log(response);
    });
  }
});

function inputEventChange(input){
  if(input.checked === true){
    console.log(input.id, "Done");
    chrome.runtime.sendMessage({request: "MARK DONE", id:input.id}, function(response){
      EVENTS = response.EVENTS;
    });
  }
  else{
    console.log(input.id, "undone");
    chrome.runtime.sendMessage({request: "MARK UNDONE", id:input.id}, function(response){
      EVENTS = response.EVENTS;
    });
  }
}

function addEventsToPopup(){
  // for(let i=0; i<1; i++){
  for(let key in EVENTS){
    let form = document.getElementById("todo-list");
    {
    	let span_1 = document.createElement('span');
    	span_1.className = "todo-wrap";

    	let input_1 = document.createElement('input');
    	input_1.type = "checkbox";
    	input_1.id = `${key}`;
    	input_1.checked = EVENTS[key].done;
      input_1.addEventListener("change", function(){inputEventChange(input_1);});
      span_1.appendChild(input_1);

    	let label_1 = document.createElement('label');
    	label_1.htmlFor = `${key}`;
    	label_1.className = "todo";

    	let i_1 = document.createElement('i');
    	i_1.className = "fa fa-check";
      let text_1 = document.createTextNode(`${EVENTS[key].class.substring(0, 6)}: ${EVENTS[key].summary}`);
      label_1.appendChild(i_1);
      label_1.appendChild(text_1);
      span_1.appendChild(label_1);

    	let span_2 = document.createElement('span');
    	span_2.className = "delete-item";
    	span_2.title = "remove";

    	let i_2 = document.createElement('i');
    	i_2.className = "fa fa-times-circle";
      span_2.appendChild(i_2);
      span_1.appendChild(span_2);

      if(document.getElementById("add-todo") !== null){
        form.insertBefore(span_1, form.children[form.children.length - 1]);
      }
      else{
        form.appendChild(span_1);
      }
    }
  }
  if(document.getElementById("add-todo") === null){
    let form = document.getElementById("todo-list");
    {
    	let div_0 = document.createElement('div');
    	div_0.id = "add-todo";
      {
  	    let i_0 = document.createElement('i');
  	    i_0.className = "fa fa-plus";
        let text_0 = document.createTextNode("Add a new event..");
        i_0.appendChild(text_0);
        div_0.appendChild(i_0);
      }
      form.appendChild(div_0);
    }
  }
  setTimeout(function(){
    // document.getElementsByTagName("body")[0].style.display = "block";
    document.getElementById("mainPopup").style.display = "block";
    $("#loading").fadeOut("slow");
  }, 200);
}

chrome.runtime.sendMessage({request: "EVENTS"}, function(response){
  EVENTS = response.EVENTS;
  console.log(response);
  if(Object.keys(EVENTS).length !== 0){
    addEventsToPopup();
  }
  console.log("doc ready add EVENTS");
});


// JS for popup

$('#add-todo').click(function(){
var lastSibling = $('#todo-list > .todo-wrap:last-of-type > input').attr('id');
var newId = Number(lastSibling) + 1;

$(this).before('<span class="editing todo-wrap"><input type="checkbox" id="'+newId+'"/><label for="'+newId+'" class="todo"><i class="fa fa-check"></i><input type="text" class="input-todo" id="input-todo'+newId+'"/></label></div>');
$('#input-todo'+newId+'').parent().parent().animate({
  height:"36px"
},200);
$('#input-todo'+newId+'').focus();

$('#input-todo'+newId+'').enterKey(function(){
  $(this).trigger('enterEvent');
});

$('#input-todo'+newId+'').on('blur enterEvent',function(){
  var todoTitle = $('#input-todo'+newId+'').val();
  var todoTitleLength = todoTitle.length;
  if (todoTitleLength > 0) {
    $(this).before(todoTitle);
    $(this).parent().parent().removeClass('editing');
    $(this).parent().after('<span class="delete-item" title="remove"><i class="fa fa-times-circle"></i></span>');
    $(this).remove();
    $('.delete-item').click(function(){
      var parentItem = $(this).parent();
      parentItem.animate({
        left:"-30%",
        height:0,
        opacity:0
      },200);
      setTimeout(function(){ $(parentItem).remove(); }, 1000);
    });
  }
  else {
    $('.editing').animate({
      height:'0px'
    },200);
    setTimeout(function(){
      $('.editing').remove();
    },400);
  }
});

});
