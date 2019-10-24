import _ from '../utils/mlodash'
import logger from '../utils/logger'
import { userInfo } from '../store/index'
import wxrequest from './wxrequest'
import login from './login'
import URL from './url'

// 默认method
const DEFAULT_METHOD = 'post'
const LOGIN_EXCEPTION_CODE = -10001

// 登录态时效后重新换取登录态过程的标记
let reLogin = false
// 登录态时效后发起的请求队列
let reqQueue = []
// request 与flushReqQueue 需要递归引用，提升变量
let request
// 不会进入队列的请求的URL，命中这个list的url立即发起请求
const queueWhiteList = new Set([
  // URL.xx.url,
])

// POST时url中如果有参数，需要encode
function encode(params) {
  return _.reduce(params, (acc, value, key) => {
    if (value !== undefined
      && value !== null
      && value !== ''
      && value !== 'undefined'
      && value !== 'null'
    ) {
      acc.push(`${key}=${encodeURIComponent(value)}`)
    }
    return acc
  }, []).join('&')
}

// 处理restful URL(https://api.com/api/<id>/aa)中参数id
function replaceUrlParams(url, params) {
  return url.replace(/(\/)<([^\/<>]*)>(\/?)/g, (str, pre, key, after) => {
    if (params[key] !== null && params[key] !== undefined) {
      const value = params[key]
      delete params[key]
      return `${pre}${value}${after}`
    } else {
      logger.error(`参数列表中不存在key=${key}的参数`)
      return `${pre}${key}${after}`
    }
  })
}

function formatReqParams(options) {
  let { method, url, params, data, ...rest } = options
  // 处理params
  if (params !== undefined && params !== null) {
    if (_.isObject(params)) {
      params = { ...params }  // 浅拷贝一份
    } else {
      logger.error('请求参数错误，params只支持Object格式')
    }
  } else {
    params = {}
  }
  // 在params中添加用户标识openid
  params.openid = userInfo.openid || userInfo.uuid
  // 处理data
  if (data !== undefined && data !== null) {
    if (_.isObject(data)) {
      data = {
        ...userInfo.reqParams, // 植入必要的用户信息
        ...data   // 浅拷贝一份
      }
    } else {
      logger.error('请求参数错误，data只支持Object格式')
    }
  } else {
    data = { ...userInfo.reqParams } // 植入必要的用户信息
  }
  // 处理非标准的url，标准的url是一个object
  if (_.isString(url) && URL[url]) {
    url = URL[url]
    if (!url) {
      logger.error(`url(${options.url})没有注册，请先到network/url.js中注册后再使用`)
    }
  }
  // url注册表中含静态参数params
  if (_.isObject(url.params)) {
    params = Object.assign({}, url.params, params)
  } else if (_.isFunction(url.params)){
    params = Object.assign({}, url.params(), params)
  }
  // url注册表中含静态参数data
  if (_.isObject(url.data)) {
    data = Object.assign({}, url.data, data)
  } else if (_.isFunction(url.data)) {
    data = Object.assign({}, url.data(), data)
  }
  url = url.url  // url注册时已经校验，必存在url.url
  method = (method || DEFAULT_METHOD).toUpperCase()
  const reqParams = { method, ...rest }
  if (method === 'GET') {
    // GET请求data相当于params, params优先级高于data
    reqParams.data = Object.assign({}, data, params)
    reqParams.url = replaceUrlParams(url, reqParams.data)   // 替换url中的params
  } else if (method === 'POST') {
    url = replaceUrlParams(url, params)   // 替换url中的params
    // 剩下的params进行encode后拼接到url中
    const paramsEncoded = encode(params)
    if (paramsEncoded) {
      reqParams.url = url + '?' + paramsEncoded
    } else {
      reqParams.url = url
    }
    reqParams.data = data
  } else {
    // 其他请求params相当于data, data优先级高于params
    reqParams.data = Object.assign({}, params, data)
    reqParams.url = replaceUrlParams(url, reqParams.data)   // 替换url中的params
  }
  return reqParams
}

/**
 * 清空请求队列
 */
function flushReqQueue() {
  const queue = reqQueue.slice()
  reqQueue.length = 0
  _.forEach(queue, item => {
    request(item.options, item.exts)
      .then(item.resolve)
      .catch(item.reject)
  })
  logger.info('flushReqQueue', queue)
}

/**
 * 为了区分参数是拼接在url中还是放到body中，可分别使用params和data传递参数
 * 在GET中，params和data都会拼接到url中，
 * 在POST中，只有params拼接在url中，data放在body中
 *
 */
request = function (options, exts = {}) {
  if (!_.isObject(options)) {
    logger.error('请求参数错误，request第一个参数只支持Object格式')
  }
  if (!_.has(options, 'url')) {
    logger.error('缺少必要参数options.url')
  }
  const url = options.url.url
  if ((reLogin || !userInfo.initOver) && !queueWhiteList.has(url)) {
    // 登录态已经失效，登录态生效前进如请求队列
    // 避免多次请求login接口，但密集请求下，依旧会出现多次login
    return new Promise((resolve, reject) => {
      reqQueue.push({
        resolve,
        reject,
        options,
        exts,
      })
    })
  } else {
    let req = Promise.resolve()
    if (exts.login === true) {
      // 如果需要提前登录，执行登录逻辑
      // 登录逻辑中包含授权
      req = login()
    } else if (exts.auth === true) {
      // 如果需要授权
      req = userInfo.authUserInfo()
    }
    return req.then(() => {
      const reqParams = formatReqParams(options)
      return wxrequest(reqParams)
    }).then(data => {
      const code = data && data.code
      if (code === LOGIN_EXCEPTION_CODE && userInfo.hasLogin) { // 登录态异常
        reLogin = true
        logger.error('登录态异常：', data)
        return login(true).then(() => {
          reLogin = false
          flushReqQueue()
          const reqParams = formatReqParams(options)
          return wxrequest(reqParams)
        })
      } else {
        return data
      }
    })
  }
}

/**
 * url 相当于request参数的options.url
 * params 类型是Object，相当于request参数的options.params
 */
request.get = function(url, params) {
  const exts = {}
  if (this.needLogin === true) {
    this.needLogin = false
    exts.login = true
  }
  if (this.needRefreshCode === true) {
    this.needRefreshCode = false
  }
  if (this.needAuth === true) {
    this.needAuth = false
    exts.auth = true
  }
  return request({
    url,
    params,
    method: 'GET',
  }, exts)
}

/**
 * url 相当于request参数的options.url
 * data 类型是Object，相当于request参数的options.data
 * params 类型是Object，相当于request参数的options.params
 */
request.post = function(url, data, params) {
  const exts = {}
  if (this.needLogin === true) {
    this.needLogin = false
    exts.login = true
  }
  if (this.needRefreshCode === true) {
    this.needRefreshCode = false
  }
  if (this.needAuth === true) {
    this.needAuth = false
    exts.auth = true
  }
  return request({
    url,
    data,
    params,
    method: 'POST',
  }, exts)
}

/**
 * login的链式调用
 * request.login().get()
 * request.login().post()
 * 不支持 request.login().request()
 *
 * 需要登录态的API在调用前要使用login获取登录态
 * 登录态需要两个信息，分别是
 * 1、通过wx.login()获取code，
 * 2、通过wx.getUserInfo()获取用户授权信息，
 *   对于未授权的情况需要使用button open-type="getUserInfo"打开授权窗口,
 *   已授权的情况可调用wx.getUserInfo()。
 *   授权过程已通过store.userInfo模块封装，自动完成
 *
 */
request.login = function() {
  this.needLogin = true
  return this
}

/**
 * auth的链式调用
 * request.auth().get()
 * request.auth().post()
 * 不支持 request.auth().request()
 *
 * 需要用户数据API在调用前要使用auth获取用户授权数据
 * 通过wx.getUserInfo()获取用户授权信息，
 * 对于未授权的情况需要使用button open-type="getUserInfo" 打开授权窗口
 * 已授权的情况可调用wx.getUserInfo()。
 * 授权过程已通过store.userInfo模块封装，自动完成
 */
request.auth = function() {
  this.needAuth = true
  return this
}

module.exports = {
  request,
  flushReqQueue,
}
