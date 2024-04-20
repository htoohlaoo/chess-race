module.exports = io => {
    io.on('connection', socket => {
        console.log('New socket connection');
        let currentCode = null;
        socket.on('move', function(move) {
            console.log('move detected')
            io.to(currentCode).emit('newMove', move);
        });
        
        socket.on('joinGame', function(data) {

            currentCode = data.code;
            socket.join(currentCode);
            if (!games[currentCode]) {
                games[currentCode] = true;
                return;
            }
            
            io.to(currentCode).emit('ready');
           
        });
        socket.on('startGame', function(data) {

            if (games[currentCode]) {
                io.to(currentCode).emit('startGame');
                return;
            }
            
            
           
        });

        socket.on('timeover', function(data) {

            currentCode = data.code;
            socket.join(currentCode);
            if (currentCode) {
                io.to(currentCode).emit('gameOverDisconnect');
                delete games[currentCode];
            }
           
        });

        socket.on('disconnect', function() {
            console.log('socket disconnected');

            if (currentCode) {
                io.to(currentCode).emit('gameOverDisconnect');
                delete games[currentCode];
            }
        });

    });
};