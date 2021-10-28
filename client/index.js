var express = require('express');
var app = express();
app.set('view engine', 'ejs');
const socketio = require('socket.io');

// index page
app.get('/', function(req, res) {
    res.render('pages/index');
});

app.get('/chat', function(req, res) {
    res.render('pages/chat');
});

const server = app.listen(80, () => {
    console.log('Server started on port 80');
});

const io = socketio(server)

io.on('connection', (socket) => {
    console.log('New user connected');

    socket.username = "Anonymous"

    socket.on('change_username', data => {
        socket.username = data.username
    })

    //handle the new message event
    socket.on('new_message', data => {
        console.log("new message")
        io.sockets.emit('receive_message', { message: data.message, username: socket.username })
    })
});