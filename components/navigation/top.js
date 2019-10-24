import {
  logger,
  versionLt,
} from '../../utils/index'
import {
  systemInfo,
} from '../../store/index'
import {
  PAGE_PATH,
} from '../../services/index'

Component({
  properties: {
    withHome: Boolean,
    title: {
      type: String,
      value: ''
    },
  },
  data: {
    show: true,
    menuHeight: '',
    height: 0,
    showBackArrow: true,
  },
  created() {
  },
  attached() {
    try {
      if (systemInfo.platform !== 'devtools' && versionLt(systemInfo.version, '7.0.0')) {
        this.setData({ show: false })
      } else {
        let data = {}
        const rect = systemInfo.menuButtonRect
        if (rect.top && rect.height) {
          Object.assign(data, {
            height: rect.top + rect.height + rect.height / 4,
            menuHeight: rect.height + rect.height / 2,
          })
        }
        const pages = getCurrentPages() || []
        data.showBackArrow = pages.length > 1
        this.setData(data)
      }
    } catch (e) {
      logger.error('计算顶部导航条位置出现错误:', e)
    }
  },
  ready() {
  },
  methods: {
    tapNavigate(e) {
      if (this.data.withHome) {
        wx.switchTab({ url: PAGE_PATH.HOME })
      }
    }
  }
})
