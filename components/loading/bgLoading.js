import {
  systemInfo,
} from '../../store/index'
import {
  PAGE_PATH,
  pageStatus
} from '../../services/index'

Component({
  properties: {
    absolute: {
      type: Boolean,
      value: true,
    },
    top: {
      type: String,
      value: '450rpx;'
    },
    status: {
      type: String,
      value: pageStatus.loading,
      observer(value) {
        if (this.data.networkIsConnected !== systemInfo.networkIsConnected) {
          this.setData({ networkIsConnected: systemInfo.networkIsConnected })
        }
      }
    },
    errorTips: {
      type: String,
      value: '似乎出错了',
    },
    loadingTips: {
      type: String,
      value: '正在加载...'
    }
  },
  data: {
    pageStatus: pageStatus,
    networkIsConnected: true,
    showGoHomeBtn: false,
  },
  created() {
  },
  attached() {
    try {
      const pages = getCurrentPages() || []
      const cur = pages[pages.length - 1] || {}
      const route = cur.route
      if (PAGE_PATH.HOME.indexOf(route) === -1) {
        this.setData({ showGoHomeBtn: true })
      }
    } catch(e) {}
  },
  methods: {
    tapRefresh(e) {
      this.setData({
        status: pageStatus.loading,
      })
      this.triggerEvent('refresh')
    },
    goHome() {
      wx.switchTab({
        url: PAGE_PATH.HOME
      });
    },
  }
})
