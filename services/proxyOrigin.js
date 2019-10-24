import {
  _,
  logger,
  time,
} from '../utils/index'
import {
  global,
} from '../store/index'
import {
  request,
  URL,
} from '../network/index'
import mock from '../mock/index'

const type_constant = {
  page_show_perf: 'page_show_perf',
  page_ready_perf: 'page_ready_perf',
  app_error: 'app_error',
  page_not_found: 'page_not_found',
  request_error: 'request_error',
  request: 'request',
}

const app = {
  _time$: {
    appLaunchStart: 0,
    appLaunchEnd: 0,
    appShowStart: 0,
    appShowEnd: 0,
    appHideStart: 0,
    appHideEnd: 0,
  },
  coldBoot: 1,
}


function proxy(options, keyName, injectFn) {
  const originalFn = options[keyName]
  options[keyName] = function(...params) {
    if (_.isFunction(injectFn.before)) {
      injectFn.before.apply(this, params)
    }
    if (_.isFunction(originalFn)) {
      originalFn.apply(this, params)
    }
    if (_.isFunction(injectFn.after)) {
      injectFn.after.apply(this, params)
    }
  }
}

function genQuery(query) {
  if (_.isObject(query)) {
    return _.map(query, (value, key) => {
      return `${key}:${value}`
    }).join(', ')
  } else if (query) {
    return JSON.stringify(query)
  }
  return ''
}

function toFixed3(num) {
  num = num.toFixed(3)
  const tarr = num.split('.')
  if (!tarr[1] || tarr[1] === '000') {
    tarr[1] = '001'
  }
  return parseFloat(tarr[0] + '.' + tarr[1])
}

function beforeOnPageLoad(query) {
  const now = time.timestampToSecond(Date.now())
  this.query = query
  logger.log(`加载页面${this.route}, query=`, query)
  this._time$ = {
    pageLoadStart: now,
    pageLoadEnd: 0,
    pageShowStart: 0,
    pageShowEnd: 0,
    pageReadyStart: 0,
    pageReadyEnd: 0,
    pageHideStart: 0,
    pageHideEnd: 0,
    pageUnloadStart: 0,
    pageUnloadEnd: 0,
    ShowLoadDur: 0,
    ReadyLoadDur: 0,
  }
  this._onShowSend$ = () => {
    // 上报页面onShow时长
    // 内部跳转时只上报onLoad - onShow区间的耗时
    // 打开外部链接还要上报 appLaunch/appShow - onShow 区间的耗时
    const data = {
      pagePath: this.route,
      query: genQuery(this.query),
      type: type_constant.page_show_perf,
      ...this._time$
    }
    if (this._isOutsideTarget$) {
      const startUpToShowDur = app.coldBoot === 1 ?
        this._time$.pageShowEnd - app._time$.appLaunchStart :
        this._time$.pageShowEnd - app._time$.appShowStart
      const startUpToLoadDur = app.coldBoot === 1 ?
        this._time$.pageLoadStart - app._time$.appLaunchStart :
        this._time$.pageLoadStart - app._time$.appShowStart
      Object.assign(data, {
        openLink: true,
        coldBoot: app.coldBoot,
        appLaunchStart: app._time$.appLaunchStart,
        appShowStart: app._time$.appShowStart,
        startUpToShowDur: toFixed3(startUpToShowDur),
        startUpToLoadDur: toFixed3(startUpToLoadDur),
      })
    }
    // request.post(URL.report, data)
  }
  this._onReadySend$ = () => {
    // 上报页面onReady时长
    // 内部跳转时只上报onLoad - onReady区间的耗时
    // 打开外部链接还要上报 appLaunch/appShow - onReady 区间的耗时
    const data = {
      pagePath: this.route,
      query: genQuery(this.query),
      type: type_constant.page_ready_perf,
      ...this._time$
    }
    if (this._isOutsideTarget$) {
      const startUpToReadyDur = app.coldBoot === 1 ?
        this._time$.pageReadyEnd - app._time$.appLaunchStart :
        this._time$.pageReadyEnd - app._time$.appShowStart
      const startUpToLoadDur = app.coldBoot === 1 ?
        this._time$.pageLoadStart - app._time$.appLaunchStart :
        this._time$.pageLoadStart - app._time$.appShowStart
      Object.assign(data, {
        openLink: true,
        coldBoot: app.coldBoot,
        appLaunchStart: app._time$.appLaunchStart,
        appShowStart: app._time$.appShowStart,
        startUpToReadyDur: toFixed3(startUpToReadyDur),
        startUpToLoadDur: toFixed3(startUpToLoadDur),
      })
    }
    // request.post(URL.report, data)
  }
  this._hasHideOnce$ = false
  // 如果打开链接的目的地址是本页面，为本页面打上_isOutsideTarget标记
  // 然后清空全局标记
  if (global.openFromShare && global.shareTargetPath.indexOf(this.route) !== -1) {
    this._isOutsideTarget$ = true
    if (!_.isEmpty(global.tabBarPageQuery)) {
      Object.assign(this.query, global.tabBarPageQuery)
      global.tabBarPageQuery = {}
    }
    global.shareTargetPath = ''
    global.openFromShare = false
  } else {
    this._isOutsideTarget$ = false
  }
}

function afterOnPageLoad() {
  const now = time.timestampToSecond(Date.now())
  this._time$.pageLoadEnd = now
}

function beforeOnPageShow(query) {
  const now = time.timestampToSecond(Date.now())
  this._time$.pageShowStart = now
  logger.log(`显示页面${this.route}`)
}

function afterOnPageShow() {
  const now = time.timestampToSecond(Date.now())
  this._time$.pageShowEnd = now
  this._time$.ShowLoadDur = toFixed3(now - this._time$.pageLoadStart)
  if (!this._hasHideOnce$ && _.isFunction(this._onShowSend$)) {
    this._onShowSend$()
    delete this._onShowSend$
  }
}

function beforeOnPageReady() {
  const now = time.timestampToSecond(Date.now())
  logger.log(`ready页面${this.route}`)
  this._time$.pageReadyStart = now
  if (global.dev) {
    wx.setNavigationBarTitle({
      title: '「开发版」'
    })
  }
}

function afterOnPageReady() {
  const now = time.timestampToSecond(Date.now())
  this._time$.pageReadyEnd = now
  this._time$.ReadyLoadDur = toFixed3(now - this._time$.pageLoadStart)
  if (!this._hasHideOnce$ && _.isFunction(this._onReadySend$)) {
    this._onReadySend$()
    delete this._onReadySend$
  }
}

function beforeOnPageHide() {
  const now = time.timestampToSecond(Date.now())
  this._time$.pageHideStart = now
  logger.log(`隐藏页面${this.route}`)
  this._hasHideOnce$ = true
  delete this._onShowSend$
  delete this._onReadySend$
}

function afterOnPageHide() {
  const now = time.timestampToSecond(Date.now())
  this._time$.pageHideEnd = now
}

function beforeOnPageUnload() {
  const now = time.timestampToSecond(Date.now())
  this._time$.pageUnloadStart = now
  logger.log(`卸载页面${this.route}`)
  this._hasHideOnce$ = true
  delete this._onShowSend$
  delete this._onReadySend$
}

function afterOnPageUnload() {
  const now = time.timestampToSecond(Date.now())
  this._time$.pageUnloadEnd = now
}

function beforeOnPageShareAppMessage(e) {
}

function afterOnPageShareAppMessage(e) {
}

function beforeOnAppLaunch(options) {
  const now = time.timestampToSecond(Date.now())
  app._time$.appLaunchStart = now
  this.options = options
  this._hasHideOnce$ = false
}

function afterOnAppLaunch(options) {
  const now = time.timestampToSecond(Date.now())
  app._time$.appLaunchEnd = now
}

function beforeOnAppShow(options) {
  const now = time.timestampToSecond(Date.now())
  app._time$.appShowStart =  now
  this.options = options
}

function afterOnAppShow(options) {
  const now = time.timestampToSecond(Date.now())
  app._time$.appShowEnd = now
  app._time$.appShowLaunchDur = toFixed3(now - app._time$.appLaunchStart)
  if (!this._hasHideOnce$) {
    // 上报APP onShow时长
    const data = {
      type: type_constant.app_show_perf,
      query: genQuery(this.options.query),
      scene: this.options.scene,
      ...app._time$,
    }
    // request.post(URL.report, data)
  }
}

function beforeOnAppHide() {
  const now = time.timestampToSecond(Date.now())
  app._time$.appHideStart = now
  app.coldBoot = 0
  this._hasHideOnce$ = true
}

function afterOnAppHide() {
  const now = time.timestampToSecond(Date.now())
  app._time$.appHideEnd = now
}

function onAppError(err) {
  const params = {
    type: type_constant.app_error,
    msg: '',
    stackLength: 0,
  }
  if (_.isString(err)) {
    const stack = err.split('\n')
    if (stack.length > 2) {
      params.stackLength = stack.length
      _.forEach(stack, (val, index) => {
        params[`s${index}`] = val.trim()
      })
    } else {
      params.msg = err
    }
  } else {
    // FIXME: 先上报上去，统计一下错误信息，后面再修正
    err = JSON.stringify(err)
    params.msg = err
  }
  // request.post(URL.report, params)
}

function onAppPageNotFound(res) {
  const params = {
    type: type_constant.page_not_found,
    path: res.path,
    query: genQuery(res.query),
    isEntryPage: res.isEntryPage ? '1' : '0',
    res: JSON.stringify(res),
  }
  // request.post(URL.report, params)
}

/*
 *  代理生命周期函数
 */
const originalPage = Page
Page = function(options) {
  proxy(options, 'onLoad', {
    before: beforeOnPageLoad,
    after: afterOnPageLoad,
  })
  proxy(options, 'onShow', {
    before: beforeOnPageShow,
    after: afterOnPageShow,
  })
  proxy(options, 'onReady', {
    before: beforeOnPageReady,
    after: afterOnPageReady,
  })
  proxy(options, 'onHide', {
    before: beforeOnPageHide,
    after: afterOnPageHide,
  })
  proxy(options, 'onUnload', {
    before: beforeOnPageUnload,
    after: afterOnPageUnload,
  })
  originalPage(options)
}

const originalApp = App
App = function(options) {
  proxy(options, 'onLaunch', {
    before: beforeOnAppLaunch,
    after: afterOnAppLaunch,
  })
  proxy(options, 'onShow', {
    before: beforeOnAppShow,
    after: afterOnAppShow,
  })
  proxy(options, 'onHide', {
    before: beforeOnAppHide,
    after: afterOnAppHide,
  })
  proxy(options, 'onError', {
    before: onAppError,
  })
  proxy(options, 'onPageNotFound', {
    before: onAppPageNotFound,
  })
  originalApp(options)
}

// 域名黑名单，命中黑名单的域名不做上报
const blackDomain = /test\.com/
// 字段黑名单，命中黑名单的字段不上报
const blackField = [
  'model',
  'pixelRatio',
  'windowWidth',
  'windowHeight',
  'system',
  'language',
  'version',
  'screenWidth',
  'screenHeight',
  'SDKVersion',
  'brand',
  'fontSizeSetting',
  'batteryLevel',
  'statusBarHeight',
  'platform',
  'network',
  'app_version',
  'uuid',
]

// restful风格的API，url中间可能存在params参数，
// 上报时需要剔除params的干扰
const restfulUrl = [
  // 'xxx'
]

const SUCCESS_CODE = '0'

// 请求上报
function sendWxRequest({ startPagePath, startTime, req, res, err }) {
  if (!req || !req.url || req.url.match(blackDomain)) {
    return
  }
  const pages = getCurrentPages()
  const endPagePath = _.get(pages, `[${pages.length - 1}].__route__`)
  const reqData = []
  const reqDataFields = []
  const endTime = time.timestampToSecond(Date.now())
  const params = {
    startTime,
    endTime,
    duration: toFixed3(endTime - startTime),
    startPagePath,
    endPagePath,
    pageHasChange: startPagePath !== endPagePath ? '1' : '0',
    url: req.url,
    method: (req.method || 'GET').toUpperCase(),
  }
  let data
  if (req.data) {
    data = { ...req.data }
  } else {
    data = {}
  }
  const rst = req.url.match(/^(?:([A-Za-z]+):)?(\/{2})?([\w.-]+)(\/[\w.-\/]+)(?:\?(.+))?/)
  if (rst) {
    Object.assign(params, {
      protocol: rst[1] || '',   // protocol
      host: rst[3] || '',       // domain,ip
      uri: rst[4] || '',        // api_url
    })
    if (rst[5]) {               // query
      _.forEach((rst[5]).split('&'), item => {
        const arr = item.split('=')
        let key = arr[0]
        if (data[key]) {
          key = key + '__1'
        }
        let value = arr[1]
        if (value === null || value === undefined) {
          value = ''
        }
        data[key] = decodeURIComponent(value)
      })
    }
    // 带params的restfulAPI需要处理调中间的params
    _.forEach(restfulUrl, url => {
      if (url.match(params.uri)) {
        // params.uri = params.uri
      }
    })
  }
  _.forEach(data, (value, key) => {
    if (blackField.indexOf(key) === -1) {
      reqDataFields.push(key)
    }
  })
  // 排序用于去重
  reqDataFields.sort()
  _.forEach(reqDataFields, key => {
    let value = data[key]
    if (value === null || value === undefined) {
      value = ''
    }
    // 处理超长字符，避免数据体积过大
    if (_.isString(value) && value.length > 40) {
      value = value.slice(0, 32) + '...' + value.slice(-5)
    }
    reqData.push(`${key}:${value}`)
  })
  params.reqData = reqData.join(',')
  params.reqDataFields = reqDataFields.join(',')
  if (res) {
    params.status = Number(res.statusCode) || 601
    params.msg = res.errMsg
    params.code = _.get(res, 'data.code', '') + ''
    params.resType = 'success'
    params.err = ''
    if (params.code !== '' && params.code !== SUCCESS_CODE) {
      params.type = type_constant.request_error
      params.err = JSON.stringify(res.data)
      // request.post(URL.report, params)
    }
  } else {
    params.status = Number(err && err.statusCode) || 600
    params.msg = err && err.errMsg
    params.code = '600'
    params.resType = 'fail'
    params.err = JSON.stringify(_.omit(err, ['errMsg', 'statusCode']))
    params.type = type_constant.request_error
    // request.post(URL.report, params)
  }
  params.type = type_constant.request
  // request.post(URL.report, params)
}

const reportQueue = []            // 上报请求队列
const timerTimeout = 2000         // 上报定时器2s超时
let reportQueueTimer              // 上报定时器
let reportQueueFlushing = false   // 清空队列标记

function flushQueue() {
  if (reportQueueFlushing && reportQueue.length) {
    const next  = reportQueue.shift()
    wx.request(next)
    setTimeout(flushQueue, 100)   // 加100ms延时，避免网络拥塞
  }
}

/*
 *  代理 wx.request
 */
const originalRequest = wx.request
Object.defineProperty(wx, 'request', {
  writeable: true,
  configurable: true,
  enumerable: true,
  value(params) {
    const startTime = time.timestampToSecond(Date.now())
    const pages = getCurrentPages()
    const startPagePath = _.get(pages, `[${pages.length - 1}].__route__`)
    const originalSuccess = params.success
    const originalFail = params.fail
    if (params && params.url && !params.url.match(blackDomain)) {
      reportQueueFlushing = false
      if (global.mock) {
        if (_.isFunction(originalSuccess)) {
          originalSuccess(mock(params.url, params.data))
        }
      } else {
        originalRequest({
          ...params,
          success: res => {
            sendWxRequest({ startPagePath, startTime, req: params, res })
            if (_.isFunction(originalSuccess)) {
              originalSuccess(res)
            }
          },
          fail: err => {
            sendWxRequest({ startPagePath, startTime, req: params, err })
            if (_.isFunction(originalFail)) {
              originalFail(err)
            }
          }
        })
      }
      clearTimeout(reportQueueTimer)
      reportQueueTimer = setTimeout(() => {
        reportQueueFlushing = true
        flushQueue()
      }, timerTimeout)
    } else if (reportQueueFlushing) {
      originalRequest(params)
    } else {
      reportQueue.push(params)
    }
  }
})

/*
 *  代理 wx.setStorageSync
 */
const originalSetStorage = wx.setStorageSync
Object.defineProperty(wx, 'setStorageSync', {
  writeable: true,
  configurable: true,
  enumerable: true,
  value(...params) {
    try {
      originalSetStorage.apply(originalSetStorage, params)
    } catch (e) {
      logger.error('setStorageSync err', e)
    }
  }
})

/*
 *  代理console.error
 */
const originalError = console.error
console.error = (...args) => {
  // 小程序库函数使用了console.error,做排除
  const args0 = args && args[0]
  if (_.isString(args0)) {
    if (args0 === 'request:fail ' || args0.indexOf('已开启无网络状态模拟') !== -1) {
      return
    }
  }
  originalError.apply(this, args)
  const params = {}
  _.forEach(args, (value, index) => {
    if (_.isObject(value) || _.isArray(value)) {
      params[`arg${index}`] = JSON.stringify(value)
    } else {
      params[`arg${index}`] = '' + value
    }
  })
  const pages = getCurrentPages()
  params.currentPage = _.get(pages, `[${pages.length - 1}].__route__`)
  params.type = type_constant.console_error
  // request.post(URL.report, params)
}
