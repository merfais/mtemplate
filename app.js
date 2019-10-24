import './services/proxyOrigin.js'
import {
  userInfo,
  systemInfo,
  global,
} from './store/index.js'
import {
  getOpenId,
  getOpenGid,
  flushReqQueue,
} from './network/index.js'
import {
  logger,
  _,
  generateUUID,
} from './utils/index.js'

logger.info('源码加载完毕，当前版本号:', systemInfo.app_version)

App({
  onLaunch(e) {
    logger.info('app启动参数：', e)
    generateUUID()
    try {
      wx.cloud.init({
        env: 'prod',
        traceUser: true
      })
    } catch(e) {
      logger.error ('初始化云函数失败：', e)
    }
    // 换取openid, 如果失败，降级尝试读取storage中持久化的openid
    // 因此用户可能换手机登录，所以不能直接使用持久化的openid
    // 必须每次启动时去后端拿真实的openid，然后持久化
    getOpenId().then(() => {
      // 登录态数据以openid作为key进行了持久化，但此登录态信息并不一定是对的
      // 只作为未登录前的降级数据使用，需要登录态的API，需先执行login逻辑
      // 如果用户未授权，可能拿不到用户信息，降级使用持久化的userInfo
      if (!userInfo.rawData) {
        try {
          const info = wx.getStorageSync('userInfo')
          Object.assign(userInfo, info)
        } catch(e) {}
        try {
          const rawData = wx.getStorageSync('rawData')
          Object.assign(userInfo, rawData)
        } catch(e) {}
      }
      logger.info('userInfo.openid = ', userInfo.openid)
      userInfo.getToken()
      // 需要openid的API请求有可能先于getOpenid成功返回前发出（在其他文件，在page中等）
      // 因此在network中使用requestQueue管理API，使用initOver标记控制请求流
      userInfo.initOver = true
      flushReqQueue()
    })
  },
  onShow(e) {
    logger.info('app切换到前台，携带参数', e)
    // 小程序场景值scene在onShow时有可能变化，刷新缓存
    global.scene = parseInt(e.scene)
    // 热启动分两种场景
    // 1、切到后台，重新打开新的外部连接，进入的path=pages/newpath
    // 2、切到后台，什么都不做，再切回前台，进入的path=切后台前的path
    // shareTicket的值需要在打开外部连接时刷新
    // 'pages/home'是主入口，也是分享链接的统一入口，但分享链接都携带真实路由等参数
    if (e.path && e.path.indexOf('pages/home/index') !== -1 && Object.keys(e.query).length !== 0) {
      global.openGId = ''
      if (e.shareTicket) {
        getOpenGid(e.shareTicket)
      }
    }
  },
  onHide() {
  },
  onError(e) {
    logger.error('app出现错误: ', e)
  },
})
