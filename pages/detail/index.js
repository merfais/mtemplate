import {
  userInfo,
} from '../../store/index'
import {
  pageStatus,
  genShareUrl,
} from '../../services/index'

Page({
  data: {
    motto: 'Hello World',
    nickName: '',
    avatarUrl: '',
    city: '',
    country: '',
    gender: '',
    province: '',
  },
  onLoad () {
    this.renderUserInfo(userInfo.userInfo)
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
  getUserInfo(e) {
    userInfo.authUserInfo().then(res => {
      this.renderUserInfo(res.userInfo)
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
