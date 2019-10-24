import _ from '../utils/mlodash'
import logger from '../utils/logger'
import URL from './url'

// 不需要打请求日志的URL
const loggerBlackListUrl = [
  // URL.xx.url,
]

function notHitBlackList(url) {
  let rst = true
  _.forEach(loggerBlackListUrl, str => {
    rst = url.indexOf(str) === -1
    return rst
  })
  return rst
}

function formatValue(data, delEmptyDataKey = true) {
  return _.reduce(data, (acc, value, key) => {
    if (value !== null
      && value !== undefined
      && value !== ''
      && value !== 'null'
      && value !== 'undefined'
    ) {
      acc[key] = value
    } else if (delEmptyDataKey !== true) {
      acc[key] = ''
    }
    return acc
  }, {})
}

export default function wxrequest(options, delEmptyDataKey = true) {
  if (!_.isObject(options.data)) {
    options.data = {}
  }
  options.data = formatValue(options.data, delEmptyDataKey)
  const start = Date.now()
  const reqid = Math.random().toString(26).substr(3, 4)
  return new Promise((success, fail) => {
    options.header = Object.assign({
      'content-type': 'application/x-www-form-urlencoded',
    }, options.header)
    if (notHitBlackList(options.url)) {
      logger.warn(`-->req(${reqid})[${options.method}] ${options.url}`, options.data)
    }
    wx.request({
      ...options,
      success,
      fail,
    })
  }).then(ack =>{
    let rst = ack
    // 处理返回码
    let code
    if (ack && _.has(ack, 'data')) {
      if (_.has(ack.data, 'code')) {
        code = ack.data.code
        if (!isNaN(Number(code))) {
          ack.data.code = Number(code)
        }
      }
      rst = ack.data
    }
    if (notHitBlackList(options.url)) {
      const end = Date.now()
      logger.warn(`<--rep(${reqid})[${options.method}] ${end - start} ${options.url} code=${code}`)
    }
    return rst
  }).catch(err => {
    if (notHitBlackList(options.url)) {
      const end = Date.now()
      logger.error(`<--rep(${reqid})[${options.method}] ${end - start} ${options.url} err=`, err)
    }
    return Promise.reject(err)
  })
}
