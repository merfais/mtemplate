import _ from '../utils/mlodash'
import logger from '../utils/logger'
import {
  global,
  userInfo,
  systemInfo,
} from '../store/index'
import { request } from './request'
import cloud from './cloud'
import URL from './url'

let reqHandler

const SESSION_EXCEPTION_CODE = -40000

function getShareInfo(shareTicket) {
  return new Promise((resolve, reject) => {
    wx.getShareInfo({
      shareTicket,
      success(res) {
        logger.log('wx.getShareInfo：', res)
        resolve(res)
      },
      fail(err) {
        logger.error('wx.getShareInfo 出错：', err)
        reject(err)
      },
    })
  })
}

function getGid(shareTicket, forceRefreshCode = false) {
  return userInfo.getCode(forceRefreshCode).then(res => {
    return getShareInfo(shareTicket).then(info => {
      const params = {
        encryptedData: info.encryptedData,
        iv: info.iv,
      }
      if (res.code) {
        params.code = res.code
      }
      return request.post(URL.getOpenGId, params)
    })
  }).then(data => {
    logger.log('调用getGid结果:', data)
    if (!data || data.code !== 0) {
      return Promise.reject(data)
    }
    return data
  })
}

// 热启动时由于可能从不同的群聊中进入，
// 不能使用缓存的openGId,每次都需要刷新，重新请求
export default function getOpenGid(shareTicket) {
  logger.log('调用getOpenGid, shareTicket:', shareTicket)
  // 开发工具可以写死openGId，便于调试
  // if (systemInfo.platform === 'devtools') {
  //   global.openGId = ''
  // }
  // 请求还没有结束，返回请求句柄
  if (reqHandler) {
    return reqHandler
  }
  // app.onShow会立刻调用getOpenGid, 携带shareTicket参数，
  // 其他地方不再携带shareTicket参数，即shareTicket只解析一次
  if (!shareTicket) {
    return Promise.resolve(global.openGId)
  }
  reqHandler = getShareInfo(shareTicket).then(info => {
    return cloud.getOpenGId(wx.cloud.CloudID(info.cloudID)).then(data => {
      logger.log('调用云函数getOpenGId: ', data)
      if (!_.get(data, 'data.openGId')) {
        return Promise.reject(data)
      }
      return data
    })
  }).catch(err => {
    logger.error('调用云函数getOpenGId失败, 开始调用后端API：', err)
    return getGid(shareTicket).catch(err => {
      if (err && err.code <= SESSION_EXCEPTION_CODE) {
        // 后端解析失败，一般是由于session过期，刷新code后再次请求
        logger.log('重新调用getGId:', err)
        return getGid(shareTicket, true)
      } else {
        return Promise.reject(err)
      }
    })
  }).then(data => {
    data = data.data
    if (data.openGId) {
      global.openGId = data.openGId
    } else {
      global.openGId = ''
      logger.error('换取openGId返回非法值:', data)
    }
    reqHandler = null
    return global.openGId
  }).catch(err => {
    logger.error('换取openGId发生错误：', err)
    global.openGId = ''
    reqHandler = null
    return global.openGId
  })
  return reqHandler
}
