import {
  logger,
   _,
} from '../../utils/index'
import {
  parseRoute,
  tabBarPages,
  PAGE_PATH,
  formatQuery,
} from '../../services/index'
import {
  global,
} from '../../store/index'

/***********************************************************************
 * query 有两种传参：
 * 1. 完整query模式 /pages/home/index?route=0&from=mp&other=xxx
 *   route: 目标页, 必填
 *     1: pages/A/index
 *     2: pages/B/index
 *   from: 分享源
 *     1: 小程序自身
 *     2: App程序
 *     3: H5页面
 *   other: 其他必要参数，每个目的页需要的各不相同
 *
 * 2. scene 小程序码 /pages/home/index?scene=1,1,xxx
 *   scene由于长度限制，不能直接使用k=v结构存储，故使用逗号(,)分割value方式:
 *     第一位是route;
 *     第二位是from;
 *     其余各位按需存储;
 *
 ********************************************************************/
export function analyseRoute(query) {
  // 没有query的值，说明不需要跳转，即打开主页
  if (!_.has(query, 'scene') && !_.has(query, 'route')) {
    return query
  }
  global.openFromShare = true
  let {
    route,
    from,
    ...rest
  } = query
  if (_.has(query, 'scene')) {
    const params = decodeURIComponent(query.scene).split(',')
    route = params[0]
    from = params[1]
    rest = params.slice(2)
  }
  const routeRst = parseRoute(route, rest)
  global.shareTargetPath = routeRst.url
  if (tabBarPages.has(route)) {
    if (routeRst.url === PAGE_PATH.HOME) { // 目的页就是主页，不需要跳转，返回query
      return routeRst.query
    } else {
      global.tabBarPageQuery = routeRst.query
      wx.switchTab({ url: routeRst.url })
      return null
    }
  } else {
    const url = (routeRst.url + '?' + formatQuery(routeRst.query)).replace(/[\?&]+$/, '')
    wx.navigateTo({ url })
    return null
  }
}

export function getX() {
  return Promise.resolve()
}

