import _ from '../utils/mlodash'
import logger from '../utils/logger'

const ROUTE_STACK_LIMIT = 10  // 小程序页面栈限制

/*
 * 路由表
 * path：页面的真正路径
 * route：分享链接的路由，
 *  由于小程序码分享有长度限制，为了统一路由，所有分享链接都采用数字路由
 * alias: 页面别名,标记唯一的页面除了用path还可以用alias
 * tabBar: 是否是tabBar页面，小程序对tabBar有特殊的控制
 */
const PAGES = {
  HOME: {           // 首页
    path: '/pages/home/index',
    route: 0,       // 分享链接的路由, 首页必须是0，因为路由失败会命中0，调到首页
    alias: 'home',
    tabBar: true,   // 标记是不是tabBar的页面, tabBar页面跳转需要使用switchTab
  },
  MINE: {           // 我的
    path: '/pages/mine/index',
    route: 1,
    alias: 'mine',
    tabBar: true,   // 标记是不是tabBar的页面, tabBar页面跳转需要使用switchTab
  },
  DETAIL: {
    path: '/pages/detail/index',
    route: 3,
    alias: 'detail',
  },
  PAGE_A: {         // 页面A
    path: '/pages/logs/logs',
    route: 10,
    alias: 'page_a',
  },
  PAGE_B: {         // 页面B
    path: '/pages/pageB/index',
    route: 12,
    alias: 'page_b',
  }
}

const ROUTE_TYPE = {}   // 用于处理route => type
const ROUTE_PATH = {}   // 用于处理route => path
const PAGE_ROUTE = {}   // 用于处理page alias => route
const PAGE_PATH = {}    // const page path
const PAGE_ALIAS = {}   // const page alias
const tabBarPages = new Set()
_.forEach(PAGES, (item, key) => {
  const route = item.route + ''
  ROUTE_PATH[route] = item.path
  PAGE_PATH[key] = item.path
  PAGE_ALIAS[key] = item.alias
  PAGE_ROUTE[item.path] = route
  PAGE_ROUTE[item.path.slice(1)] = route
  PAGE_ROUTE[item.alias] = route
  if (item.tabBar) {
    tabBarPages.add(route)
    tabBarPages.add(item.path)
    tabBarPages.add(item.path.slice(1))
    tabBarPages.add(item.alias)
  }
})

PAGES.length = 0

function formatQuery(query) {
  return _.reduce(query, (acc, value, key) => {
    if (value !== undefined && value !== null) {
      acc.push(`${key}=${value}`)
    }
    return acc
  }, []).join('&')
}

/**
 * route: 目标页,目标页所有类型包括：
 *   0: pageA
 *   1: pageB
 */
function parseRoute(route, rest) {
  let url = ROUTE_PATH[route] || PAGE_PATH.HOME
  let query = rest || {}
  if (_.isArray(rest)) {
    // // 通用参数处理
    // query = {
    //   xxx: rest[0],
    //   yyy: rest[1],
    // }
    // // 特定页面的特定query处理
    // if (url === PAGE_PATH.PAGE_A) {
    //   query.zzz = rest[2]
    // } else if (url === PAGE_PATH.PAGE_B) {
    //   query.ooo = rest[2]
    // }
  }
  return {
    url,
    query,
  }
  return url
}

function genShareUrl(params = {}) {
  logger.info('调用genShareUrl参数: params=', params)
  if (!_.isObject(params)) {
    params = {}
  }
  // page = PAGE_ALIAS.PAGEX
  // route = this.route
  let { page, route, ...query } = params
  if (!/^\d+$/.test(route)) {
    route = PAGE_ROUTE[route] || PAGE_ROUTE[page] || '0'
  }
  // 特定的route处理
  // if (route === 1) {
  //
  // } else if (route === 2) {
  //
  // }
  query.route = route
  query.from = query.from || 'mp'
  const url = (PAGE_PATH.HOME + '?' + formatQuery(query)).replace(/[\?&]+$/, '')
  logger.info(`生成的shareUrl：${url}`)
  return url
}

function _navigateTo(url) {
  return new Promise((success, fail) => {
    logger.info('wx.navigateTo: ', url)
    wx.navigateTo({ url, success, fail })
  })
}

function _redirectTo(url) {
  return new Promise((success, fail) => {
    logger.info('wx.redirectTo: ', url)
    wx.redirectTo({ url, success, fail })
  })
}

// 可能因为计算延迟或性能问题，导致调用navigateTo后页面并没有立刻跳转
// 此处做1s的延时保护，对于1s内相同的url，只做一次跳转
let lastNavigateUrl = ''
function navigateTo(url, query) {
  query = formatQuery(query)
  if (url.indexOf('?') === -1) {
    url += '?' + query
  } else {
    url += '&' + query
  }
  url = url.replace(/[\?&]+$/, '')
  if (url && lastNavigateUrl !== url) {
    lastNavigateUrl = url
    setTimeout(() => (lastNavigateUrl = ''), 1000)
    const reachLimit = (getCurrentPages() || []).length === ROUTE_STACK_LIMIT
    if (reachLimit) {
      return _redirectTo(url)
    } else {
      return _navigateTo(url)
    }
  }
}

module.exports = {
  ROUTE_PATH,
  PAGE_PATH,
  PAGE_ALIAS,
  PAGE_ROUTE,
  tabBarPages,
  parseRoute,
  genShareUrl,
  navigateTo,
  formatQuery,
}
