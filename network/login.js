import _ from '../utils/mlodash'
import logger from '../utils/logger'
import wxrequest from './wxrequest'
import URL from './url'
import {
  userInfo,
} from '../store/index'

// 缓存login请求句柄
let reqHandler = null

function innerLogin(force = false, reLogin = false) {
  return userInfo.getCode(force).then(res => {
    // code更新后userInfo的加密信息需要更新
    // 如果用户没有授权需要弹出授权对话框,引导用户授权
    return userInfo.authUserInfo().then(info => {
      const params = {
        signature: info.signature,
        rawData: info.rawData,
        encryptedData: info.encryptedData,
        iv: info.iv,
      }
      if (res.code) {
        params.code = res.code
      } else if (res.openid) {
        params.openid = res.openid
      }
      if (reLogin) {    // params打入reLogin参数为的是监控relogin请求
        params.reLogin = true
      }
      return wxrequest({
        method: 'POST',
        url: URL.login.url,
        data: params,
      }).then(data => {
        if (!data || data.code !== 0) {
          return Promise.reject(data)
        }
        const info = data.data || {}
        // 如果有任何字段是空值，说明后端session可能出现问题，
        // 强制刷新code，再次执行login，刷新后端session的数据
        if (info.token && info.openid) {
          return info
        } else if (!reLogin) {
          logger.error('login返回值中部分关键字段出现空数据, 重新发起登录请求', info)
          return innerLogin(true, true)
        }
        return Promise.reject(data)
      })
    })
  })
}

export default function login(force = false) {
  if (userInfo.hasLogin && force !==  true) {
    return Promise.resolve()
  }
  if (reqHandler) {
    return reqHandler
  }
  reqHandler = innerLogin(force).then(info => {
    reqHandler = null
    // 将登录态信息进行持久化，作为未登录时的降级方案
    // 不能直接使用持久化的登录态数据，有可能登录态是失效的
    userInfo.saveToken(info)
    userInfo.hasLogin = true
    return info
  }).catch(err => {
    reqHandler = null
    // 取消登录也会返回异常，但不做toast提示
    if (!(_.isString(err) && err.indexOf('cancelEvent') !== -1)) {
      wx.showToast({
        title: '登录失败',
        icon: 'none',
      })
    }
    logger.error('登录发生错误：', err)
    return Promise.reject(err)
  })
  return reqHandler
}
