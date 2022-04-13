const express = require('express')
const DB = require('../db')
const router = express.Router()
const { idGenerate } = require('../utils')
router.post('/hello', function (req, res, next) {
  console.log(req.body);
  res.send({
    code: 0,
    message: 'hello,world!'
  });
})
router.post('/room_create', async function (req, res, next) {
  const user_id = req.body.user_id, room_name = req.body.data.room.name
  const room_id = idGenerate('room'), qipan_id = idGenerate('qipan');
  let results
  const db = new DB();
  await db.init();
  results = await db.query('SELECT * from user', [user_id])
  const user_name = results[0].name
  await db.query('UPDATE user SET room_id = ? WHERE id = ?', [room_id, user_id])
  await db.query('INSERT INTO ROOM(id,name,host_name,host_id,gamer_name,gamer_id,qipan_id) VALUES(?,?,?,?,?,?,?)', [room_id, room_name, user_name, user_id, '', '', qipan_id])
  await db.query('INSERT INTO qipan(id,status,qizis,result) VALUES(?,?,?,?)', [qipan_id, 0, '', 0])
  res.send({
    code: 0,
    message: 'hello,world!',
    data: {
      room: {
        id: room_id,
        name: room_name,
        host: user_name,
        gamer: '',
        status: 0
      }
    }
  });
})
// 导出路由
module.exports = router
