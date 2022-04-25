const express = require('express')
const DB = require('../db')
const { getIo } = require('../ws')
const router = express.Router()
router.post('/register', async function (req, res, next) {
  let rep_data
  try {
    const account = req.body.data.account
    const name = req.body.data.name
    const password = req.body.data.password
    const db = new DB()
    await db.init()
    let results = await db.query('SELECT * FROM user WHERE account = ?', [account])
    if (results.length > 0) {
      rep_data = {
        code: 1,
        message: '该账户已存在'
      }
    } else {
      results = await db.query('SELECT * FROM user ORDER BY id DESC LIMIT 1')
      const user_id = results[0].id + 1
      await db.query('INSERT INTO user(id,account,name,password) VALUES(?,?,?,?)', [user_id, account, name, password])
      rep_data = {
        code: 0,
        message: '成功',
        data: {
          user: {
            account,
            name
          },
          board: {
            id: -1,
            turn: false,
            chesses: [],
            chessPre: [-1, -1],
            status: -1, // -1未开始，0先手方，1后手方，2和局，3先手方胜，4后手方胜
            line: false
          },
          room: {
            id: -1,
            name: '',
            host: '',
            gamer: '',
            status: -1
          }
        }

      }
    }
    await db.exit()
  } catch (error) {
    rep_data = {
      code: 2,
      message: error
    }
  }
  res.send(rep_data)
})

router.post('/login', async function (req, res, next) {
  let rep_data
  try {
    const account = req.body.data.account
    const password = req.body.data.password
    const db = new DB()
    await db.init()
    const results = await db.query('SELECT * FROM user WHERE account = ?', [account])
    if (results.length > 0) {
      if (password === results[0].password) {
        rep_data = {
          code: 0,
          message: '成功',
          data: {
            user: {
              account,
              name: results[0].name
            },
            board: {
              id: -1,
              turn: false,
              chesses: [],
              chessPre: [-1, -1],
              status: -1, // -1未开始，0先手方，1后手方，2和局，3先手方胜，4后手方胜
              line: false
            },
            room: {
              id: -1,
              name: '',
              host: '',
              gamer: '',
              status: -1
            }

          }
        }
      } else {
        rep_data = {
          code: 1,
          message: '密码错误'
        }
      }
    } else {
      rep_data = {
        code: 1,
        message: '账户不存在'
      }
    }
    await db.exit()
  } catch (error) {
    rep_data = {
      code: 2,
      message: error
    }
  }
  res.send(rep_data)
})

router.post('/room_list', async function (req, res, next) {
  let rep_data
  try {
    const account = req.body.account
    const db = new DB()
    await db.init()
    let results = await db.query('SELECT * FROM user WHERE account = ?', [account])
    if (results.length > 0) {
      results = await db.query('SELECT room.id,room.name,user.name as host_name,status FROM room inner join user on room.host = user.id')
      rep_data = {
        code: 0,
        message: 'success',
        data: results
      }
    } else {
      rep_data = {
        code: 1,
        message: '账户不存在'
      }
    }
    await db.exit()
  } catch (error) {
    rep_data = {
      code: 2,
      message: error
    }
  }
  res.send(rep_data)
})

router.post('/room_create', async function (req, res, next) {
  let rep_data
  try {
    const account = req.body.account
    const room_name = req.body.data.name
    const socket = req.body.socket
    const db = new DB()
    await db.init()
    let results = await db.query('SELECT * FROM user WHERE account = ?', [account])
    if (results.length > 0) {
      const user_id = results[0].id
      const user_name = results[0].name
      results = await db.query('SELECT * FROM room ORDER BY id DESC LIMIT 1')
      const room_id = results[0].id + 1
      await db.query('INSERT INTO room(id,name,host,status) VALUES(?,?,?,?)', [room_id, room_name, user_id, 0])
      await db.query('UPDATE user SET room = ? where id = ?', [room_id, user_id])
      const io = getIo()
      io.in(socket).socketsJoin('' + room_id)
      rep_data = {
        code: 0,
        message: 'success',
        data: {
          id: room_id,
          name: room_name,
          host: user_name,
          status: 0
        }
      }
    } else {
      rep_data = {
        code: 1,
        message: '账户不存在'
      }
    }
    await db.exit()
  } catch (error) {
    rep_data = {
      code: 2,
      message: error
    }
  }
  res.send(rep_data)
})

router.post('/room_join', async function (req, res, next) {
  let rep_data
  try {
    const account = req.body.account
    const room_id = req.body.data.id
    const socket = req.body.socket
    const db = new DB()
    await db.init()
    let results = await db.query('SELECT * FROM user WHERE account = ?', [account])
    if (results.length > 0) {
      const user_id = results[0].id
      const user_name = results[0].name
      results = await db.query('SELECT status from room where id = ?', [room_id])
      if (results.length > 0) {
        if (results[0].status === 0) {
          await db.query('UPDATE room SET gamer = ?, status = ? WHERE id = ?', [user_id, 1, room_id])
          await db.query('UPDATE user SET room = ? WHERE id = ?', [room_id, user_id])
          results = await db.query('SELECT room.id, room.name, user.name as host_name, status FROM room JOIN user ON room.host = user.id  WHERE room.id = ?', [room_id])
          const io = getIo()
          io.in(socket).socketsJoin('' + room_id)
          io.in('' + room_id).except(socket).emit('room_join', { gamer: user_name, status: 1 })
          rep_data = {
            code: 0,
            message: 'success',
            data: {
              id: results[0].id,
              name: results[0].name,
              host: results[0].host_name,
              gamer: user_name,
              status: results[0].status
            }
          }
        } else {
          rep_data = {
            code: 1,
            message: '房间状态错误'
          }
        }
      } else {
        rep_data = {
          code: 1,
          message: '房间不存在'
        }
      }
    } else {
      rep_data = {
        code: 1,
        message: '账户不存在'
      }
    }
    await db.exit()
  } catch (error) {
    rep_data = {
      code: 2,
      message: error
    }
  }
  res.send(rep_data)
})

router.post('/room_quit', async function (req, res, next) {
  let rep_data
  try {
    const account = req.body.account
    const room_id = req.body.room
    const socket = req.body.socket
    const db = new DB()
    await db.init()
    let results = await db.query('SELECT * FROM user WHERE account = ?', [account])
    if (results.length > 0) { // 判断是否有这个用户
      const user_id = results[0].id
      results = await db.query('SELECT host, gamer from room where id = ?', [room_id])
      if (results.length > 0) { // 判断是否有这个房间
        await db.query('UPDATE user SET room = ? WHERE id = ?', [null, user_id])
        const io = getIo()
        const empty_data = {
          board: {
            id: -1,
            turn: false,
            chesses: [],
            chessPre: [-1, -1],
            status: -1, // -1未开始，0先手方，1后手方，2和局，3先手方胜，4后手方胜
            line: false
          },
          room: {
            id: -1,
            name: '',
            host: '',
            gamer: '',
            status: -1
          }
        }
        if (results[0].gamer === user_id) { // 判断该用户是房主还是玩家
          await db.query('UPDATE room SET gamer = ?, status = ? WHERE id = ?', [null, 0, room_id])
          io.in('' + room_id).except(socket).emit('room_quit', { gamer: '', status: 0 })
          io.in(socket).socketsLeave('' + room_id)
          rep_data = {
            code: 0,
            message: 'success',
            data: empty_data
          }
        } else if (results[0].gamer === null && results[0].host === user_id) {
          await db.query('UPDATE room SET host = ?, board = ? WHERE id = ?', [null, null, room_id])
          await db.query('DELETE FROM room WHERE id = ?', [room_id])

          io.in(socket).socketsLeave('' + room_id)
          rep_data = {
            code: 0,
            message: 'success',
            data: empty_data
          }
        } else if (results[0].gamer !== null && results[0].host === user_id) {
          await db.query('UPDATE room SET host = ?, gamer = ? , status = ? WHERE id = ?', [results[0].gamer, null, 0, room_id])
          io.in(socket).socketsLeave('' + room_id)
          rep_data = {
            code: 0,
            message: 'success',
            data: empty_data
          }
        } else {
          rep_data = {
            code: 1,
            message: '玩家不在房间'
          }
        }
      } else {
        rep_data = {
          code: 1,
          message: '房间不存在'
        }
      }
    } else {
      rep_data = {
        code: 1,
        message: '账户不存在'
      }
    }
    await db.exit()
  } catch (error) {
    rep_data = {
      code: 2,
      message: error
    }
  }
  res.send(rep_data)
})

router.post('/room_ready', async function (req, res, next) {
  let rep_data
  try {
    const account = req.body.account
    const room_id = req.body.room
    const socket = req.body.socket
    const db = new DB()
    await db.init()
    let results = await db.query('SELECT * FROM user WHERE account = ?', [account])
    if (results.length > 0) { // 判断是否有这个用户
      results = await db.query('SELECT host, gamer from room where id = ?', [room_id])
      if (results.length > 0) { // 判断是否有这个房间
        await db.query('UPDATE room SET status = ? WHERE id = ?', [2, room_id])
        const io = getIo()
        io.in('' + room_id).except(socket).emit('room_ready', { status: 2 })
        rep_data = {
          code: 0,
          message: 'success',
          data: {
            status: 2
          }
        }
      } else {
        rep_data = {
          code: 1,
          message: '房间不存在'
        }
      }
    } else {
      rep_data = {
        code: 1,
        message: '账户不存在'
      }
    }
    await db.exit()
  } catch (error) {
    rep_data = {
      code: 2,
      message: error
    }
  }
  res.send(rep_data)
})

router.post('/room_ready_cancel', async function (req, res, next) {
  let rep_data
  try {
    const account = req.body.account
    const room_id = req.body.room
    const socket = req.body.socket
    const db = new DB()
    await db.init()
    let results = await db.query('SELECT * FROM user WHERE account = ?', [account])
    if (results.length > 0) { // 判断是否有这个用户
      results = await db.query('SELECT host, gamer from room where id = ?', [room_id])
      if (results.length > 0) { // 判断是否有这个房间
        await db.query('UPDATE room SET status = ? WHERE id = ?', [1, room_id])
        const io = getIo()
        io.in('' + room_id).except(socket).emit('room_ready_cancel', { status: 1 })
        rep_data = {
          code: 0,
          message: 'success',
          data: {
            status: 1
          }
        }
      } else {
        rep_data = {
          code: 1,
          message: '房间不存在'
        }
      }
    } else {
      rep_data = {
        code: 1,
        message: '账户不存在'
      }
    }
    await db.exit()
  } catch (error) {
    rep_data = {
      code: 2,
      message: error
    }
  }
  res.send(rep_data)
})

router.post('/room_start', async function (req, res, next) {
  let rep_data
  try {
    const account = req.body.account
    const room_id = req.body.room
    const socket = req.body.socket
    const hostFirst = req.body.data.hostFirst
    const db = new DB()
    await db.init()
    let results = await db.query('SELECT * FROM user WHERE account = ?', [account])
    if (results.length > 0) { // 判断是否有这个用户
      results = await db.query('SELECT host, gamer from room where id = ?', [room_id])
      if (results.length > 0) { // 判断是否有这个房间
        const firstHand = hostFirst ? results[0].host : results[0].gamer
        const secondHand = hostFirst ? results[0].gamer : results[0].host
        results = await db.query('SELECT * FROM board ORDER BY id DESC LIMIT 1')
        const board_id = results[0].id + 1
        await db.query('INSERT INTO board(id,chesses,first_hand,second_hand,status) VALUES(?,?,?,?,?)', [board_id, '', firstHand, secondHand, 0])
        await db.query('UPDATE room SET status = ?, board = ? WHERE id = ?', [3, board_id, room_id])
        const io = getIo()
        io.in('' + room_id).except(socket).emit('room_start', {
          room: { status: 3 },
          board: {
            id: board_id,
            chesses: [],
            status: 0,
            turn: !hostFirst
          }
        })
        rep_data = {
          code: 0,
          message: 'success',
          data: {
            status: 3,
            board: {
              id: board_id,
              chesses: [],
              status: 0,
              turn: hostFirst
            }
          }
        }
      } else {
        rep_data = {
          code: 1,
          message: '房间不存在'
        }
      }
    } else {
      rep_data = {
        code: 1,
        message: '账户不存在'
      }
    }
    await db.exit()
  } catch (error) {
    rep_data = {
      code: 2,
      message: error.message
    }
  }
  res.send(rep_data)
})

router.post('/chess_on', async function (req, res, next) {
  let rep_data
  try {
    const account = req.body.account
    const room_id = req.body.room
    const board_id = req.body.board
    const socket = req.body.socket
    const chess = req.body.data.chess
    const db = new DB()
    await db.init()
    let results = await db.query('SELECT * FROM user WHERE account = ?', [account])
    if (results.length > 0) { // 判断是否有这个用户
      results = await db.query('SELECT host, gamer from room where id = ?', [room_id])
      if (results.length > 0) { // 判断是否有这个房间
        results = await db.query('SELECT chesses, status from board where id = ?', [board_id])
        if (results.length > 0) {
          let chesses = results[0].chesses
          const status = 1 - results[0].status
          if (chesses === '') {
            chesses = chess.join(',')
          } else {
            chesses += ' ' + chess.join(',')
          }
          await db.query('UPDATE board SET chesses = ?, status = ? where id = ?', [chesses, status, board_id])
          const io = getIo()
          io.in('' + room_id).except(socket).emit('chess_on', { chess, turn: true })
          const line = victoryJudge(chesses)
          if (line) {
            console.log('line:', line)
            await db.query('UPDATE room SET status = ?  WHERE id = ?', [1, room_id])
            io.in('' + room_id).except(socket).emit('chess_victory', { board: { line, turn: false }, room: { status: 1 } })
          }

          rep_data = {
            code: 0,
            message: 'success',
            data: {
              chess,
              chessPre: [-1, -1],
              turn: false,
              line
            }
          }
        } else {
          rep_data = {
            code: 1,
            message: '棋盘不存在'
          }
        }
      } else {
        rep_data = {
          code: 1,
          message: '房间不存在'
        }
      }
    } else {
      rep_data = {
        code: 1,
        message: '账户不存在'
      }
    }
    await db.exit()
  } catch (error) {
    rep_data = {
      code: 2,
      message: error.message
    }
  }
  res.send(rep_data)
})

const victoryJudge = function (chessesStr) {
  const chesses = chessesStr.split(' ').map(chess => {
    chess = chess.split(',')
    return [parseInt(chess[0]), parseInt(chess[1])]
  })
  const line = check(0, 1, chesses) || check(1, 0, chesses) || check(1, 1, chesses) || check(1, -1, chesses)
  return line
}

const check = function (east, north, chesses) {
  let line = []
  const n = chesses.length - 1
  const x = chesses[n][0]
  const y = chesses[n][1]

  for (let i = -4; i <= 4; i++) {
    for (let j = n % 2; j <= n; j += 2) {
      if (chesses[j][0] === x + east * i && chesses[j][1] === y + north * i) {
        line.push(chesses[j])
        if (line.length === 5) {
          return line
        }
        break
      } else if (j === n || j === n - 1) {
        line = []
      }
    }
  }
  return false
}

// 导出路由
module.exports = router
