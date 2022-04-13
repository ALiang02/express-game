const express = require('express')

const router = express.Router()
router.post('/hello', function (req, res, next) {
  console.log(req.body);
  res.send({
    code: 0,
    message: 'hello,world!'
  });
})
// 导出路由
module.exports = router
