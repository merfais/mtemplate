import logger from '../utils/logger'
import _ from '../utils/mlodash'

const info = {
  name: 'systemInfo',
  state: {
    app_version: '1.0.1',
    systemInfo: null,
    networkType: null,
    networkIsConnected: true,
    _menuButtonRect: null,
  },
  getter: {
    model() {
      return this.getSysInfo().model
    },
    pixelRatio() {
      return this.getSysInfo().pixelRatio
    },
    windowWidth() {
      return this.getSysInfo().windowWidth
    },
    windowHeight() {
      return this.getSysInfo().windowHeight
    },
    system() {
      return this.getSysInfo().system
    },
    language() {
      return this.getSysInfo().language
    },
    version() {
      return this.getSysInfo().version
    },
    screenWidth() {
      return this.getSysInfo().screenWidth
    },
    screenHeight() {
      return this.getSysInfo().screenHeight
    },
    SDKVersion() {
      return this.getSysInfo().SDKVersion
    },
    brand() {
      return this.getSysInfo().brand
    },
    fontSizeSetting() {
      return this.getSysInfo().fontSizeSetting
    },
    batteryLevel() {
      return this.getSysInfo().batteryLevel
    },
    statusBarHeight() {
      return this.getSysInfo().statusBarHeight
    },
    platform() { // ios andriod
      return this.getSysInfo().platform
    },
    isIphoneX() {
      return this.getSysInfo().isIphoneX
    },
    menuButtonRect() {
      if (this._menuButtonRect && this._menuButtonRect.height) {
        return this._menuButtonRect
      }
      let menuButtonRect = {}
      if (_.isFunction(wx.getMenuButtonBoundingClientRect)) {
        try {
          menuButtonRect = wx.getMenuButtonBoundingClientRect()
        } catch(e) {
          logger.error('getMenuButtonBoundingClientRect 接口失败:', e)
        }
      }
      if (!menuButtonRect || !menuButtonRect.height || menuButtonRect.height === 0) {
        if (this.getSysInfo().isIphoneX) {
          menuButtonRect = {
            bottom: 82,
            height: 32,
            left: 278,
            right: 365,
            top: 50,
            width: 87,
          }
        } else {
          menuButtonRect = {
            bottom: this.getSysInfo().statusBarHeight + 40,
            height: 32,
            left: 278,
            right: 365,
            top: this.getSysInfo().statusBarHeight + 8,
            width: 87,
          }
        }
      }
      this._menuButtonRect = menuButtonRect
      return menuButtonRect
    }
  },
  method: {
    getSysInfo() {
      if (this.systemInfo !== null) {
        return this.systemInfo
      }
      try {
        this.systemInfo = wx.getSystemInfoSync()
        // 去掉字段中的特殊字符和空格，只保留字母数字
        _.forEach(this.systemInfo, (v, k) => {
          if (v === null || v === undefined) {
            this.systemInfo[k] = ''
          } else if (_.isString(v)) {
            this.systemInfo[k] = v.replace(/[^\w\.]/g, '_')
          }
        })
        this.systemInfo.isIphoneX = /iphone/i.test(this.systemInfo.brand) && /X|11/.test(this.systemInfo.model)
        // const system = this.systemInfo.system.toUpperCase()
        // this.systemInfo.isIOS12_2 = system.indexOf('IOS_12_2') !== -1
        logger.info('wx.getSystemInfoSync:', this.systemInfo)
      } catch(e) {
        logger.error('wx.getSystemInfoSync发生错误：', e)
        this.systemInfo = null
      }
      return this.systemInfo || {}
    },
    getNetworkType() {
      if (this.networkType) {
        return Promise.resolve(this.networkType)
      }
      return new Promise(resolve => {
        wx.getNetworkType({
          success: res => {
            this.networkType = res.networkType
            if (res.networkType === 'none') {
              this.networkIsConnected = false
            }
            wx.onNetworkStatusChange(res => {
              this.networkType = res.networkType
              this.nftworkIsConnected = res.isConnected
            })
            resolve(this.networkType)
          },
          fail: err => {
            logger.error('获取网络状态失败：'. err)
            resolve(this.networkType)
          },
        })
      })
    },
  }
}

export default info
