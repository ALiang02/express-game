const mysql = require('mysql')// 引入mysql模块
const databaseConfig = require('./mysql.config') // 引入数据库配置模块中的数据

// 向外暴露方法
const DB = class {
  constructor () {
    this.connection = null
  }

  init () {
    return new Promise((resolve, reject) => {
      this.connection = mysql.createConnection(databaseConfig)
      this.connection.connect(function (err) {
        if (err) reject(err)
        resolve(this)
      })
    })
  }

  query (sql, params) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, params, function (err, results) {
        if (err) reject(err)
        results = JSON.parse(JSON.stringify(results))
        resolve(results)
      })
    })
  }

  exit () {
    return new Promise((resolve, reject) => {
      this.connection.end(function (err) {
        if (err) reject(err)
        resolve(this)
      })
    })
  }
}

module.exports = DB
