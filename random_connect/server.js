var app = require('express')();
var server = require('http').Server(app);



var io = require('socket.io')(server);

server.listen(8000);
// WARNING: app.listen(80) will NOT work here!

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/123', function (req, res) {
    res.sendFile(__dirname + '/123.html');
});

var clients = {};

function matchIt(socket, ids, matchType) {
    var my_id = socket.id;
    for(var id of ids) {
        if(my_id == id) {
            continue;
        }
        var otherSocket = io.sockets.connected[id];
        if (!otherSocket || otherSocket.disconnected || otherSocket.mystatus != 'READY') {
            continue;
        }

        if (matchType == 'ANY') {
            otherSocket.mystatus = 'BUSY';
            socket.mystatus = 'BUSY';
            socket.emit('matched', { id: otherSocket.id });
            return true;
        }

        if (matchType != 'ANY' && otherSocket.CT != socket.CT) {
            otherSocket.mystatus = 'BUSY';
            socket.mystatus = 'BUSY';
            socket.emit('matched', { id: otherSocket.id });
            return true;
        }
    }

    return false;
}

io.on('connection', function (socket) {

    
    //var test = socket.broadcast;
    socket.ip = socket.handshake.address;
    //io.sockets.connected
    socket.CT = socket.handshake.query.CT

    clients[socket.id] = socket.id

    //io.emit('this', { will: 'be received by everyone' });

    socket.emit('news', { hello: 'world' });
    

    socket.on('mystatus', function (data) {
        socket.mystatus = data.mystatus;

        if (data.mystatus == 'READY') {
            var doneMatch = matchIt(socket, Object.keys(io.sockets.connected), 'OTHER')
            if (!doneMatch) {
                matchIt(socket, Object.keys(io.sockets.connected), 'ANY')
            }
        }
    });

    socket.on('disconnect', function(){
        delete clients[socket.handshake.address]
    })

});