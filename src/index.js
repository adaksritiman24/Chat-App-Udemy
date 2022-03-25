const express = require('express');
const Filter = require('bad-words');
const http = require("http");
const path = require('path');
const socketio = require('socket.io');

const {generateMessage, generaateLocationMessage}= require('./utils/messages');
const {addUser, removeUser, getUser, getUsersInRoom} = require("./utils/users");

const PORT = process.env.PORT || 3000;


app = express();
const server = http.createServer(app);
const io = socketio(server);

const pathToPublicDirectory = path.join(__dirname,'../public');

app.use(express.static(pathToPublicDirectory));

io.on('connection',(socket)=>{
    console.log("New Web socket connection");

    //joining the room
    socket.on('join', ({username, room}, callback)=>{
        const {error, user} = addUser({
            id : socket.id,
            username, 
            room
        })
        if(error) {
            return callback(error);
        }
        socket.join(user.room)

        socket.emit('message', generateMessage("Admin Daemon", 'Welcome!'));
        socket.broadcast.to(user.room).emit("message", generateMessage("Admin Daemon",`${user.username} has joined.`));
        
        io.to(user.room).emit('roomData', {
            room : user.room,
            users : getUsersInRoom(user.room)
        })
        
        callback();
    });

    //users sends a message to their room
    socket.on('sendMessage', (message, callback)=>{

        const user = getUser(socket.id);

        const filter = new Filter();

        if(filter.isProfane(message)){
            return callback("Profanity is not allowed!");
        }
        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback("Delivered!");
    })

    //remove user from room
    socket.on('disconnect',()=>{
        const user = removeUser(socket.id);
        if(user) {
            io.to(user.room).emit("message", generateMessage("Admin Daemon",`${user.username} has left.`));
            
            io.to(user.room).emit('roomData', {
                room : user.room,
                users : getUsersInRoom(user.room)
            })    
        }
    })

    //send location in the room
    socket.on('sendLocation',({latitude, longitude}, callback)=>{
        const user = getUser(socket.id);

        io.to(user.room).emit("locationMessage", generaateLocationMessage(user.username, `https://google.com/maps?q=${latitude},${longitude}`));
        callback();
    });

})

server.listen(PORT, ()=>{
    console.log("Server running on port "+PORT);
});