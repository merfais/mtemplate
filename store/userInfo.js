import _ from '../utils/mlodash'
import logger from '../utils/logger'

const scope = {
  userInfo: 'scope.userInfo',
  userLocation: 'scope.userLocation',
  address: 'scope.address',
  invoiceTitle: 'scope.invoiceTitle',
  invoice: 'scope.invoice',
  werun: 'scope.werun',
  record: 'scope.record',
  writePhotosAlbum: 'scope.writePhotosAlbum',
  camera: 'scope.camera',
}

function getAuthSetting() {
  return new Promise((resolve, reject) => {
    wx.getSetting({
      success(res) {
        logger.log('wx.getSetting：', res)
        resolve(res && res.authSetting)
      },
      fail(err) {
        logger.error('wx.getSetting 出错：', err)
        resolve({})
      },
    })
  })
}

function getUserInfo(lang) {
  return new Promise((resolve, reject) => {
    wx.getUserInfo({
      lang,
      success(res) {
        logger.log('wx.getUserInfo: ', res)
        resolve(res)
      },
      fail(err) {
        logger.error('wx.getUserInfo 出错：', err)
        reject(err)
      }
    })
  })
}

function checkSession() {
  return new Promise((resolve, reject) => {
    wx.checkSession({
      success(res) {
        logger.log('wx.checkSession：', res)
        resolve(res)
      },
      fail(err) {
        logger.error('wx.checkSession 出错：', err)
        reject(err)
      },
    })
  })
}

function login() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        logger.log('wx.login：', res)
        resolve(res)
      },
      fail(err) {
        logger.error('wx.login 出错：', err)
        reject(err)
      },
    })
  })
}

const userInfo = {
  name: 'userInfo',
  state: {
    // 用户信息
    rawData: null,
    userInfo: {},
    avatarUrl: null,
    city: null,
    country: null,
    gender: null,
    language: null,
    nickName: null,
    province: null,
    // 登录态信息
    openid: null,
    token: null,
    cloudID: null,
    // 其他状态
    uuid: null,
    hasLogin: false,
    initOver: false,
    hasRefreshCodeOnce: false,      // 是否调用wx.login刷新过一次code,
  },
  getter: {
    // 一般为了追踪用户，对每个请求都会携带用户标识，或用户的登录态
    // 这里将请求需要的用户信息聚合后给到request中
    reqParams() {
      return {
        openid: this.openid,
        token: this.token,
      }
    },
  },
  setter: {
  },
  method: {
    saveUserInfo(data) {
      logger.log('缓存用户信息')
      try {
        wx.setStorageSync('userInfo', data.userInfo)
        wx.setStorageSync('rawData', data.rawData)
      } catch(e) {}
      Object.assign(this, {
        rawData: data.rawData,
        userInfo: data.userInfo,
        avatarUrl: data.userInfo.avatarUrl,
        city: data.userInfo.city,
        country: data.userInfo.country,
        gender: data.userInfo.gender,
        language: data.userInfo.language,
        nickName: data.userInfo.nickName,
        province: data.userInfo.province,
      })
    },
    getUserInfoWhenAuth() {
      return getAuthSetting().then(authSetting => {
        if (authSetting && authSetting[scope.userInfo]) {
          return getUserInfo(this._$store.systemInfo.language)
        } else {
          logger.log('用户未授权scope.userInfo, 不能直接读取用户信息')
          return Promise.reject(authSetting)
        }
      })
    },
    refreshUserInfo() {
      return this.getUserInfoWhenAuth().then(data => {
        this.saveUserInfo(data)
      }).catch(err => {
        if (_.isEmpty(this.userInfo)) {
          try {
            const info = wx.getStorageSync('userInfo')
            if (info && info.nickName) {
              Object.assign(this, {
                userInfo: info,
                avatarUrl: info.avatarUrl,
                city: info.city,
                country: info.country,
                gender: info.gender,
                language: info.language,
                nickName: info.nickName,
                province: info.province,
              })
            }
          } catch(e) {}
        }
        if (!this.rawData) {
          try {
            const rawData = wx.getStorageSync('rawData')
            if (rawData) {
              this.rawData = rawData
            }
          } catch(e) {}
        }
        logger.log('降级从storage缓存中读取userInfo', this.userInfo, this.rawData)
      })
    },
    authUserInfo() {  // 如果未授权弹起授权框
      return this.getUserInfoWhenAuth().catch(err => {
        return new Promise((resolve, reject) => {
          logger.log('拉起授权框确认框')
          this.emit(this.event.showAuthButton, resolve, reject)
        })
      }).then(res => {
        this.saveUserInfo(res)
        return res
      })
    },
    getCode(force = false) {
      if (!this.hasRefreshCodeOnce || force) {
        this.hasRefreshCodeOnce = true
        return login()
      }
      return checkSession().then(res => {
        // session 没有过期，
        // 如果已经缓存的了openid，则返回openid，通过openid换取后端缓存的登录态
        // 如果没有缓存openid，则强制刷新code，重新登录，换取登录态
        if (this.openid) {
          return { openid: this.openid }
        } else {
          return login()
        }
      }).catch(() => {
        logger.log('session过期，调用wx.login刷新code')
        return login()
      })
    },
    saveToken(info) {
      this.token = info.token
      try {
        logger.log('持久化token，openid=', this.openid)
        wx.setStorageSync(this.openid, {
          openid: this.openid,
          token: this.token,
        })
      } catch(e) {
        logger.error('持久化的token信息失败', e)
      }
    },
    getToken() {
      if (this.openid) {
        try {
          const token = wx.getStorageSync(this.openid)
          logger.log(`持久化数据中的token信息, openid=${this.openid}, token=`, token)
          if (_.isObject(token)) {
            Object.assign(this, {
              openid: token.openid,
              token: token.token,
            })
          }
        } catch(e) {
          logger.error('持久化数据中未找到token信息, 出现错误：err=', e)
        }
      } else {
        logger.error('无法读取持久化的token信息，无效的openid=', this.openid)
      }
    }
  },
  event: [
    'showAuthButton',
  ],
}

export default userInfo
