const mysql = require('mysql');//引入mysql模块
const databaseConfig = require('./mysql.config');  //引入数据库配置模块中的数据

//向外暴露方法
db = {
  query: function (sql, params, callback) {
    //每次使用的时候需要创建链接，数据操作完成之后要关闭连接
    var connection = mysql.createConnection(databaseConfig);
    connection.connect(function (err) {
      if (err) {
        console.log('数据库链接失败');
        throw err;
      }
      //开始数据操作
      //传入三个参数，第一个参数sql语句，第二个参数sql语句中需要的数据，第三个参数回调函数
      connection.query(sql, params, function (err, results, fields) {
        if (err) {
          console.log('数据操作失败');
          throw err;
        }
        //将查询出来的数据返回给回调函数
        callback && callback(results, fields);
        //results作为数据操作后的结果，fields作为数据库连接的一些字段
        //停止链接数据库，必须再查询语句后，要不然一调用这个方法，就直接停止链接，数据操作就会失败
        connection.end(function (err) {
          if (err) {
            console.log('关闭数据库连接失败！');
            throw err;
          }
        });
      });
    });
  }
};

function demo () {
  //查询
  // db.query('select * from user', [], function (result, fields) {
  //   console.log('查询结果：');
  //   console.log(result);
  // });
  //添加
  // var addSql = 'INSERT INTO user(id,name,password) VALUES(?,?,?)';
  // var addSqlParams = ['45692584', '大树守卫', '123456'];
  // db.query(addSql, addSqlParams, function (result, fields) {
  //   console.log('添加成功')
  // })
}


module.exports = db




