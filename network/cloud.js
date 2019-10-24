import _ from '../utils/mlodash'
import logger from '../utils/logger'

const funcNames = [
  'getOpenId',
  'getOpenGId',
]

function genFunctions(funcName = '') {
  return (data = {}) => {
    if (_.isObject(data)) {
      data = {
        data,
        funcName,
      }
    } else {
      data.funcName = funcName
    }
    return wx.cloud.callFunction({
      name: 'entry',
      data,
    }).catch(err => {
      logger.error(`调用云函数${funcName}发生异常：`, err)
      return Promise.reject(err)
    }).then(res => {
      if (!res) {
        logger.error(`调用云函数${funcName}返回空值`)
        return Promise.reject(res)
      }
      return res.result
    })
  }
}

const cloud = _.reduce(funcNames, (acc, name) => {
  acc[name] = genFunctions(name)
  return acc
}, {})

export default cloud
