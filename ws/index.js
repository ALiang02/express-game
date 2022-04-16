const { Server } = require('socket.io')

module.exports = function (server) {
  const io = new Server(server, {
    cors: {
      origin: '*'
    }
  })

  io.on('connection', socket => {
    socket.emit('success', { message: '我连接到服务器' })

    socket.on('disconnect', () => {
      console.log(socket.id)
      socket.emit('quit', socket.id)
    })
    socket.on('mytask', e => {
      console.log(e.data)
      console.log(e.data.a)
    })
    socket.on('room_join', data => {
      console.log('room:join')
      socket.join(data.room)
      socket.to(data.room).emit('room_join', { user: data.user })
    })
    socket.on('room_create', data => {
      socket.join(data.room)
    })
    socket.on('room_quit', data => {
      socket.leave(data.room)
      socket.to(data.room).emit('room_quit', { isHost: data.isHost })
    })
    socket.on('room_ready', data => {
      socket.to(data.room).emit('room_ready', { status: data.status })
    })
    socket.on('room_ready_cancel', data => {
      socket.to(data.room).emit('room_ready_cancel', { status: data.status })
    })
    socket.on('room_start', data => {
      socket.to(data.room).emit('room_start', { status: data.status })
    })
  })
  return io
}
