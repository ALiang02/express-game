const express = require('express')
const DB = require('../db')
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
          account,
          name
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
            account,
            name: results[0].name
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
// 导出路由
module.exports = router
