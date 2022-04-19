const express = require('express')
const DB = require('../db')
const router = express.Router()
const { idGenerate } = require('../utils')

router.post('/hello', function (req, res, next) {
  console.log(req.body)
  res.send({
    code: 0,
    message: 'hello,world!'
  })
})
router.post('/save', async function (req, res, next) {
  try {
    const user_id = req.body.user_id; const user = req.body.data.user
    const db = new DB()
    await db.init()
    await db.query('UPDATE user SET name = ? , password = ?  WHERE id = ?', [user.name, user.password, user_id])
    await db.exit()
    res.send({
      code: 0,
      message: 'success',
      data: {
        user
      }
    })
  } catch (error) {
    res.send({
      code: 1,
      message: error
    })
  }
})
router.post('/room_create', async function (req, res, next) {
  // 创建房间
  try {
    const user_id = req.body.user_id; const room_name = req.body.data.room.name
    const room_id = idGenerate('room'); const qipan_id = idGenerate('qipan')
    const db = new DB()
    await db.init()
    const results = await db.query('SELECT * from user WHERE ID = ?', [user_id])
    const user_name = results[0].name
    await db.query('UPDATE user SET room_id = ? WHERE id = ?', [room_id, user_id])
    await db.query('INSERT INTO ROOM(id,name,host,host_id,gamer,gamer_id,qipan_id,status) VALUES(?,?,?,?,?,?,?,?)', [room_id, room_name, user_name, user_id, '', '', qipan_id, 0])
    await db.query('INSERT INTO qipan(id,status,qizis,result) VALUES(?,?,?,?)', [qipan_id, 0, '', 0])
    await db.exit()
    res.send({
      code: 0,
      message: 'success',
      data: {
        room: {
          id: room_id,
          name: room_name,
          host: user_name,
          gamer: '',
          status: 0
        },
        qipan_id
      }
    })
  } catch (error) {
    res.send({
      code: 1,
      message: error
    })
  }
})

router.post('/room_list', async function (req, res, next) {
  // 获取房间列表
  try {
    const db = new DB()
    await db.init()
    const results = await db.query('SELECT * from room')
    await db.exit()
    res.send({
      code: 0,
      message: 'success',
      data: {
        rooms: results
      }
    })
  } catch (error) {
    res.send({
      code: 1,
      message: error
    })
  }
})
router.post('/room_join', async function (req, res, next) {
  // 加入房间
  try {
    const user_id = req.body.user_id
    const room_id = req.body.data.room.id
    const db = new DB()
    await db.init()
    let results = await db.query('SELECT * from user WHERE id = ?', [user_id])
    const user_name = results[0].name
    await db.query('UPDATE user SET room_id = ?  WHERE id = ?', [room_id, user_id])
    await db.query('UPDATE room SET gamer = ?, gamer_id = ?, status = ? WHERE id = ?', [user_name, user_id, 1, room_id])
    results = await db.query('SELECT * from room WHERE id = ?', [room_id])
    const qipan_id = results[0].qipan_id
    await db.exit()
    res.send({
      code: 0,
      message: 'success',
      data: {
        room: {
          id: room_id
        },
        qipan_id
      }
    })
  } catch (error) {
    res.send({
      code: 1,
      message: error
    })
  }
})
router.post('/room_quit', async function (req, res, next) {
  // 加入房间
  try {
    const user_id = req.body.user_id
    const qipan_id = req.body.qipan_id
    const db = new DB()
    await db.init()
    const users = await db.query('SELECT * from user WHERE id = ?', [user_id])
    const room_id = users[0].room_id
    await db.query('UPDATE user SET room_id = ?  WHERE id = ?', ['', user_id])
    const rooms = await db.query('SELECT * from room WHERE id = ?', [room_id])
    if (user_id === rooms[0].host_id && rooms[0].gamer_id === '') {
      // 房主退出删除房间
      await db.query('DELETE FROM qipan WHERE id = ?', [qipan_id])
      await db.query('DELETE FROM room WHERE id = ?', [room_id])
    } else if (user_id === rooms[0].host_id && rooms[0].gamer_id !== '') {
      // 房主退出转移房主
      await db.query('UPDATE room SET host = ?, host_id = ?, gamer = ?, gamer_id = ?, status = ?  WHERE id = ?', [rooms[0].gamer, rooms[0].gamer_id, '', '', 0, room_id])
    } else if (user_id !== rooms[0].host_id) {
      // 路人退出房间
      await db.query('UPDATE room SET gamer = ?, gamer_id = ?, status = ? WHERE id = ?', ['', '', 0, room_id])
    }
    await db.exit()
    res.send({
      code: 0,
      message: 'success',
      data: {

      }
    })
  } catch (error) {
    res.send({
      code: 1,
      message: error
    })
  }
})

router.post('/room_ready', async function (req, res, next) {
  // 加入房间
  try {
    const room_id = req.body.room_id
    const db = new DB()
    await db.init()
    await db.query('UPDATE room SET status = ?  WHERE id = ?', [2, room_id])
    await db.exit()
    res.send({
      code: 0,
      message: 'success',
      data: {

      }
    })
  } catch (error) {
    res.send({
      code: 1,
      message: error
    })
  }
})

router.post('/room_ready_cancel', async function (req, res, next) {
  // 加入房间
  try {
    const room_id = req.body.room_id
    const db = new DB()
    await db.init()
    await db.query('UPDATE room SET status = ?  WHERE id = ?', [1, room_id])
    await db.exit()
    res.send({
      code: 0,
      message: 'success',
      data: {

      }
    })
  } catch (error) {
    res.send({
      code: 1,
      message: error
    })
  }
})

router.post('/room_start', async function (req, res, next) {
  // 加入房间
  try {
    const room_id = req.body.room_id
    const qipan_id = req.body.qipan_id
    const db = new DB()
    await db.init()
    await db.query('UPDATE qipan SET qizis = ?  WHERE id = ?', ['', qipan_id])
    await db.query('UPDATE room SET status = ?  WHERE id = ?', [3, room_id])
    const results = await db.query('SELECT * from qipan WHERE id = ?', [qipan_id])
    await db.exit()
    res.send({
      code: 0,
      message: 'success',
      data: {
        status: results[0].status
      }
    })
  } catch (error) {
    res.send({
      code: 1,
      message: error
    })
  }
})

router.post('/xiaqi', async function (req, res, next) {
  // 加入房间
  try {
    const room_id = req.body.room_id
    const qipan_id = req.body.qipan_id
    const qizi = req.body.data.qizi.x + ',' + req.body.data.qizi.y
    const db = new DB()
    await db.init()
    const results = await db.query('SELECT * from qipan WHERE id = ?', [qipan_id])
    let qizisStr
    if (results[0].qizis === '') {
      qizisStr = qizi
    } else {
      qizisStr = results[0].qizis + ' ' + qizi
    }
    await db.query('UPDATE qipan SET qizis = ?  WHERE id = ?', [qizisStr, qipan_id])
    const line = victoryJudge(qizisStr)
    if (line) {
      await db.query('UPDATE room SET status = ?  WHERE id = ?', [1, room_id])
    }
    await db.exit()
    res.send({
      code: 0,
      message: 'success',
      data: {
        victory: !!line,
        line
      }
    })
  } catch (error) {
    res.send({
      code: 1,
      message: error
    })
  }
})

const victoryJudge = function (qizisStr) {
  console.log(qizisStr)
  const qizis = qizisStr.split(' ').map(qizi => {
    qizi = qizi.split(',')
    return {
      x: parseInt(qizi[0]),
      y: parseInt(qizi[1])
    }
  })
  const line = check(0, 1, qizis) || check(1, 0, qizis) || check(1, 1, qizis) || check(1, -1, qizis)
  return line
}

const check = function (east, north, qizis) {
  let line = []
  const n = qizis.length - 1
  const x = qizis[n].x
  const y = qizis[n].y

  for (let i = -4; i <= 4; i++) {
    for (let j = n % 2; j <= n; j += 2) {
      if (qizis[j].x === x + east * i && qizis[j].y === y + north * i) {
        line.push(qizis[j])
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
