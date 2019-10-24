import {
  userInfo
} from '../../store/index'
import {
  pageStatus,
  genShareUrl,
} from '../../services/index'
import {
  login,
  getX,
} from './service'

Page({
  data: {
    pageStatus: pageStatus,
    status: pageStatus.loading,
    nickName: '',
    avatarUrl: '',
    city: '',
    country: '',
    gender: '',
    province: '',
  },
  onLoad() {
  },
  onReady() {
    this.render()
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
  render() {
    this.renderUserInfo(userInfo.userInfo)
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
  getUserInfo(e) {
    login().then(res => {
      this.renderUserInfo(userInfo.userInfo)
    })
  },
  renderUserInfo(info) {
    if (info.nickName) {
      this.setData(info)
    }
  },
  tapPreview() {
    wx.previewImage({
      urls: [this.data.avatarUrl]
    })
  },
})
