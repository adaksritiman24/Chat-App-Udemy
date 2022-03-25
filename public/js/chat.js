const socket  = io();

//Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $locationSendButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector("#location-message-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix : true})


const autoScroll = ()=> {
    //new message element
    $newMessage = $messages.lastElementChild;

    //height of new message
    const newMessageStyle = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyle.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    //visible height
    const visibleHeight = $messages.offsetHeight;

    //height of messages container
    const conatinerHeight = $messages.scrollHeight;

    //how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (conatinerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on("locationMessage",({username, url, createdAt})=>{
    const html = Mustache.render(locationMessageTemplate, data={
        username,
        url,
        createdAt : moment(createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
})

socket.on('message',(message)=>{

    const html = Mustache.render(messageTemplate, data = {
        username : message.username,
        message : message.text,
        createdAt : moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoScroll();
})

socket.on('roomData',({room, users})=>{
    const html = Mustache.render(sidebarTemplate, {
        room, users
    })
    $sidebar.innerHTML = html;
})

var inputField = document.querySelector('#message');
$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    //disable button
    $messageFormButton.setAttribute("disabled","disabled");

    socket.emit('sendMessage', $messageFormInput.value, (response)=>{
        $messageFormButton.removeAttribute("disabled");
        console.log(response);
    });
    $messageFormInput.value = "";
    $messageFormInput.focus();
})

$locationSendButton.addEventListener('click',function(e){
    if (!navigator.geolocation){
        return alert("Geolocation is not supported by your browser!");
    }
    this.setAttribute('disabled','disabled');
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit("sendLocation", {
            latitude : position.coords.latitude,
            longitude : position.coords.longitude,
        }, ()=> {
            this.removeAttribute("disabled");
            console.log("Location Shared!")
        });
    })

})

socket.emit('join', { username, room }, (error)=>{
   if(error) {
       alert(error);
       location.href = "/";
   } 
});