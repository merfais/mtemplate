import {
  logger,
   _,
  versionGte,
} from '../../utils/index'
import {
  global,
  systemInfo,
  inputPanel,
} from '../../store/index'
import {
  pageStatus,
  navigateTo,
  PAGE_PATH,
  genShareUrl,
} from '../../services/index'
import {
  analyseRoute,
  getX,
} from './service'

Page({
  data: {
    pageStatus: pageStatus,
    status: pageStatus.loading,
    bottomLoadingStatus: pageStatus.loading,
    hasMore: true,
  },
  onLoad(query) {
    query = analyseRoute(query)
    Object.assign(this, {
      navigateToOther: !query,    // 需要跳转到其他页面时，query的值时null
      showCount: 0,               // 页面show次数
      hasInit: false,
    })
    this.query = query || {}
  },
  onShow() {
    // 第一次show的时候跳过渲染
    this.showCount += 1
    if (this.showCount === 1) {
      return
    }
    this.init()
  },
  onReady() {
    // ready时如果需要去目的页，非首页，跳过渲染
    // 从目的页回退时再渲染
    if (this.navigateToOther) {
      this.navigateToOther = false
      return
    } else {
      this.init()
    }
  },
  onHide() {
  },
  onUnload() {
  },
  onShareAppMessage(e) {
    const url = genShareUrl({
      route: this.route,    // 使用 page: PAGE_PATH.HOME 也可以
      other: 'params',
    })
    return {
      title: '分享示例',
      path: url,
    }
  },
  init() {
    if (this.hasInit) {
      return
    }
    this.hasInit = true
    this.render()
  },
  render() {
    // 获取后端数据，渲染页面
    getX().then(data => {
      this.setData({
        status: pageStatus.ready,
      })
    }).catch(err => {
      logger.error('获取X发生错误：', err)
      this.setData({
        status: pageStatus.error
      })
    })
  },
  onLoadMore() {
    // 上拉加载

  },
  // 以下是实例代码
  tapComment() {
    inputPanel.show().then(res => {
      this.setData({
        comment: _.get(res, 'data.content', '')
      })
    }).catch(err => {
      logger.error('吐槽失败：', err)
    })
  },
  tapLink() {
    navigateTo(PAGE_PATH.DETAIL)
  },
  tapLog() {
    navigateTo(PAGE_PATH.PAGE_A)
  }
})
