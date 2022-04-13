const { Server } = require("socket.io");

module.exports = function (server) {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:8080",],
    },
  });

  io.on('connection', socket => {
    socket.emit('success', { message: '我连接到服务器' })

    socket.on('disconnect', () => {
      console.log(socket.id)
      io.emit('quit', socket.id)
    })
    socket.on('mytask', e => {
      console.log(e.data)
      console.log(e.data.a)
    })
  })
  return io
}



