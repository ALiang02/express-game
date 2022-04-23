const express = require('express')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const http = require('http')
const router = require('./routes')
const myRouter = require('./router')
const ws = require('./ws')

const app = express()

// 设置跨域
app.all('*', function (req, res, next) {
  // 设置允许跨域的域名，*代表允许任意域名跨域
  res.header('Access-Control-Allow-Origin', '*')
  // 允许的header类型
  res.header('Access-Control-Allow-Headers', 'content-type')
  // 跨域允许的请求方式
  res.header('Access-Control-Allow-Methods', 'DELETE,PUT,POST,GET,OPTIONS')
  next()
})
// 记录日志
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static('./static'))
// 在 app 上注册路由模块
app.use('/data', router)
app.use('/', myRouter)

const server = http.createServer(app)
ws(server)

server.listen(3000, () => {
  console.log('express 服务器运行在 http://127.0.0.1:3000')
})
