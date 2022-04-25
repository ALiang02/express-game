const { Server } = require('socket.io')
let io

const socketInit = function (server) {
  io = new Server(server, {
    cors: {
      origin: '*'
    }
  })

  io.on('connection', socket => {
    console.log(socket.id)
    socket.emit('success', { message: '我连接到服务器' })
    socket.on('join_room', (data) => {
      console.log('socket.id:', socket.id)
      console.log('join_room:', data)
      socket.join('' + data.room)
    })

    socket.on('disconnect', (reason) => {
      console.log('disconnect reason:', reason)
    })
  })
}
const getIo = function () {
  return io
}

module.exports = { getIo, socketInit }
