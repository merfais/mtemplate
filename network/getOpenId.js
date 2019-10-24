import _ from '../utils/mlodash'
import logger from '../utils/logger'
import wxrequest from './wxrequest'
import cloud from './cloud'
import URL from './url'
import {
  userInfo,
} from '../store/index'

let reqHandler

export default function getOpenId() {
  if (userInfo.openid) {
    return Promise.resolve(userInfo.openid)
  }
  if (reqHandler) {
    return reqHandler
  }
  reqHandler = cloud.getOpenId().then(data => {
    logger.log('调用云函数getOpenId: ', data)
    if (!data.openid) {
      return Promise.reject(data)
    }
    return data.openid
  }).catch(err => {
    logger.error('云函数getOpenId获取openid发生错误，调用后端getOpenId', err)
    return userInfo.getCode(true).then(res => {
      if (res && res.code) {
        return wxrequest({
          method: 'post',
          url: URL.getOpenId.url,
          data: { code: res.code },
        })
      } else {
        return Promise.reject(res)
      }
    }).then(data => {
      logger.log('后端getOpenId返回值：', data)
      if (!data || data.code !== 0 || !data.openid) {
        return Promise.reject(data)
      }
      return data.openid
    })
  }).then(openid => {
    reqHandler = null
    userInfo.openid = openid
    try {
      logger.log('openid写入storage中缓存的:', openid)
      wx.setStorageSync('openid', openid)
    } catch(e) {}
  }).catch(err => {
    reqHandler = null
    try {
      const openid = wx.getStorageSync('openid')
      logger.log('降级使用storage中缓存的openid:', openid)
      if (openid) {
        userInfo.openid = openid
      }
    } catch(e) {}
  })
  return reqHandler
}
