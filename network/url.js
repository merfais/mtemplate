import _ from '../utils/mlodash'
import { global } from '../store/index'
import logger from '../utils/logger'

const PROD_DOMAIN = 'https://prod.example.com'
const DEV_DOMAIN = 'https://test.example.com'

const urlMap = {
  example: {
    url: '/example',
    domain: 'https://example.com',   // 非通用域名
    params: {   // 静态参数，组装到url.query部分
      a: 'a',
      b: 'b',
    },
    data: {     // 静态参数，组装到请求体data中
      a: 'a',
      b: 'b'
    },
  },
  reportFormId: {       // 收集formId
    url: '/reportFormId',
    params() {          // 函数式静态参数
      const { global } = require('../store/index')
      return global.dev === true ? { env: 'dev' } : {}
    },
    data: () => ({}),   // 必须有返回值
  },
  restfulExample: {
    url: '/api/getX/<id>',
    domain: {
      dev: 'https: //test.example.com',   // 测试环境domain
      prod: 'https: //example.com',       // 正式环境domain
    }
  },
  login: '/login',    // 没有静态参数，也不需要特殊的domain控制
  getOpenId: '/getOpenId',        // 换取用户openid
  getOpenGId: '/getOpenGId',      // 换取群组opengid
  postComment: '/postComment',
}

function encode(params, delEmptyDataKey = true) {
  return _.reduce(params, (acc, value, key) => {
    if (value === undefined || value === null) {
      value = ''
    }
    if (delEmptyDataKey) {
      if (value !== '') {
        acc.push(`${key}=${encodeURIComponent(value)}`)
      }
    } else {
      acc.push(`${key}=${encodeURIComponent(value)}`)
    }
    return acc
  }, []).join('&')
}


function toString(url, dftParams, dftData) {
  return exParams => {
    const params = {}
    if (_.isObject(dftParams)) {
      Object.assign(params, dftParams)
    } else if (_.isFunction(dftParams)) {
      Object.assign(params, dftParams())
    }
    if (_.isObject(dftData)) {
      Object.assign(params, dftData)
    } else if (_.isFunction(dftData)) {
      Object.assign(params, dftData())
    }
    if (_.isObject(exParams)) {
      Object.assign(params, exParams)
    }
    const query = encode(params)
    return query ? `${url}?${query}` : url
  }
}

const URL = {}

URL.formatUrl = dev => {
  let domain = PROD_DOMAIN      // 线上domain
  if (dev === true) {
    domain = DEV_DOMAIN       // 测试domain
  }
  _.forEach(urlMap, (item, key) => {
    let tmp
    if (_.isString(item)) {
      tmp = { url: domain + item }
    } else if (_.isObject(item)) {
      tmp = { ...item }
      if (_.isString(tmp.domain)) {
        domain = tmp.domain || domain
      } else if (_.isObject(tmp.domain)) {
        if (dev === true) {
          domain = tmp.domain.dev || tmp.domain.prod || domain
        } else {
          domain = tmp.domain.prod || tmp.domain.dev || domain
        }
      }
      delete tmp.domain
      if (_.isString(item.url)) {
        tmp.url = domain + item.url
      } else {
        logger.error('url表错误，url支持object注册，但item必须包含url字段')
      }
    }
    // toString 会整合静态参数和调用toString(params)提供的参数
    // 主要用于格式化出完整的url，赋值给image.src等需要URL的地方
    tmp.toString = toString(tmp.url, tmp.params, tmp.data)
    URL[key] = tmp
  })
}

URL.formatUrl(global.dev)

export default URL
