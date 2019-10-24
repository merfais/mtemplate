// 云函数入口文件
const _ = require('lodash')
const router = require('./router.js')

// 云函数入口函数
exports.main = async (event, context) => {
  if (!_.has(event, 'funcName')) {
    throw new Error('缺少必要参数funcName')
  }
  if (!_.isString(event.funcName)) {
    throw new Error('字段funcName只支持字符串类型')
  }
  return router(event)
}
