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
        }
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
    const results = await db.query('SELECT * from user WHERE id = ?', [user_id])
    const user_name = results[0].name
    await db.query('UPDATE user SET room_id = ?  WHERE id = ?', [room_id, user_id])
    await db.query('UPDATE room SET gamer = ?, gamer_id = ?, status = ? WHERE id = ?', [user_name, user_id, 1, room_id])
    await db.exit()
    res.send({
      code: 0,
      message: 'success',
      data: {
        room: {
          id: room_id
        }
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
    const db = new DB()
    await db.init()
    const users = await db.query('SELECT * from user WHERE id = ?', [user_id])
    const room_id = users[0].room_id
    await db.query('UPDATE user SET room_id = ?  WHERE id = ?', ['', user_id])
    const rooms = await db.query('SELECT * from room WHERE id = ?', [room_id])
    if (user_id === rooms[0].host_id && rooms[0].gamer_id === '') {
      // 房主退出删除房间
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

// 导出路由
module.exports = router
