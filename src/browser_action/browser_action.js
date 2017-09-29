/* jshint esversion:6 */
/* jshint -W083 */
// JS for message passing

// GLobal Variables
var EVENTS = {};
var WEEKDAY = {0:"Sunday", 1:"Monday", 2:"Tuesday", 3:"Wednesday", 4:"Thursday", 5:"Friday", 6:"Saturday"};
var MONTHS = {1:"Jan", 2:"Feb", 3:"Mar", 4:"Apr", 5:"May", 6:"Jun", 7:"Jul", 8:"Aug", 9:"Sep", 10:"Oct", 11:"Nov", 12:"Dec"};

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
    chrome.runtime.sendMessage({request: "MARK DONE", id:input.id, day:input.dataset.day, month:input.dataset.month, year:input.dataset.year}, function(response){
      EVENTS = response.EVENTS;
    });
  }
  else{
    console.log(input.id, "undone");
    chrome.runtime.sendMessage({request: "MARK UNDONE", id:input.id, day:input.dataset.day, month:input.dataset.month, year:input.dataset.year}, function(response){
      EVENTS = response.EVENTS;
    });
  }
}

function addEventsToPopup(){
  let currentYear = new Date(new Date()).getFullYear();
  let currentYearEvents = EVENTS[currentYear];
  for(let month in currentYearEvents){
    let monthEvents = currentYearEvents[month];
    let form = document.getElementById("todo-list");
    for(let day in monthEvents){
      let dayEvents = monthEvents[day];
      // console.log(`${day}, ${month}, ${currentYear}`);
      let fullDate = `${month}/${day}/${currentYear}`;
      if(document.querySelector(`[data-date="${fullDate}"]`) == null){
        let divWrap = document.createElement('div');
        let h_1 = document.createElement("h4");
        h_1.style.fontWeight = "bold";
        let fullDateText = document.createTextNode(`${WEEKDAY[new Date(fullDate).getDay()]} ${MONTHS[month]} ${day}`);
        h_1.appendChild(fullDateText);
        h_1.style.textAlign = "center";
        divWrap.appendChild(h_1);
        for(let eventDay in dayEvents){
            // console.log(dayEvents[eventDay]);
            {
              divWrap.dataset.date = fullDate;
              let span_1 = document.createElement('span');
              span_1.className = "todo-wrap";

              let input_1 = document.createElement('input');
              input_1.type = "checkbox";
              input_1.id = `${eventDay}`;
              input_1.dataset.day = day;
              input_1.dataset.month = month;
              input_1.dataset.year = currentYear;
              input_1.checked = dayEvents[eventDay].done;
              input_1.addEventListener("change", function(){inputEventChange(input_1);});
              span_1.appendChild(input_1);

              let label_1 = document.createElement('label');
              label_1.htmlFor = `${eventDay}`;
              label_1.className = "todo";

              let i_1 = document.createElement('i');
              i_1.className = "fa fa-check";
              let text_1 = document.createTextNode(`${dayEvents[eventDay].class.substring(0, 6)}: ${dayEvents[eventDay].summary}`);
              label_1.appendChild(i_1);
              label_1.appendChild(text_1);
              span_1.appendChild(label_1);

              // TODO: make delete-item working
              // let span_2 = document.createElement('span');
              // span_2.className = "delete-item";
              // span_2.title = "remove";
              //
              // let i_2 = document.createElement('i');
              // i_2.className = "fa fa-times-circle";
              // span_2.appendChild(i_2);
              // span_1.appendChild(span_2);
              divWrap.appendChild(span_1);
              if(document.getElementById("add-todo") !== null){
                form.insertBefore(divWrap, form.children[form.children.length - 1]);
              }
              else{
                form.appendChild(divWrap);
              }
            }
          }
      }
    }
  }
  // if(document.getElementById("add-todo") === null){
  //   let form = document.getElementById("todo-list");
  //   {
  //   	let div_0 = document.createElement('div');
  //   	div_0.id = "add-todo";
  //     {
  // 	    let i_0 = document.createElement('i');
  // 	    i_0.className = "fa fa-plus";
  //       let text_0 = document.createTextNode("Add a new event..");
  //       i_0.appendChild(text_0);
  //       div_0.appendChild(i_0);
  //     }
  //     form.appendChild(div_0);
  //   }
  // }
  setTimeout(function(){
    // document.getElementsByTagName("body")[0].style.display = "block";
    document.getElementById("mainPopup").style.display = "block";
    $("#loading").fadeOut("slow");
    let today_date = new Date();
    let today_date_data = `${today_date.getMonth()+1}/${today_date.getDate()}/${today_date.getFullYear()}`;
    let $currentEvent = $(`[data-date="${today_date_data}"`);
    if($currentEvent.length !== 0){
      $(window).scrollTop($currentEvent.offset().top - 10);
      $currentEvent.addClass("highlight_on_load");
    }
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

$(document).ready(function(){
  $("#refresh_button").on("click", function refreshEvents(e){
    chrome.runtime.sendMessage({request: "REFRESH"}, function(response){
      console.log(response.STATUS);
    });
  });
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
