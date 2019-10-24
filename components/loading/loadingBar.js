import {
  logger
} from '../../utils/index'
import {
  systemInfo,
} from '../../store/index'
import {
  pageStatus,
} from '../../services/index'

Component({
  properties: {
    hasMore: {
      type: Boolean,
      value:true
    },
    status: {
      type: String,
      value: pageStatus.loading,
      observer(value) {
        if (this.data.networkIsConnected !== systemInfo.networkIsConnected) {
          this.setData({ networkIsConnected: systemInfo.networkIsConnected })
        }
      },
    },
    loadingText: {
      type: String,
      value: '正在加载更多',
    },
    noMoreText: {
      type: String,
      value: '已显示全部内容',
    },
    errorText: {
      type: String,
      value: '貌似出错了，点击重试',
    },
    noNetworkText: {
      type: String,
      value: '网络无法连接，点击重试',
    },
  },
  data: {
    networkIsConnected: true,
    pageStatus: pageStatus,
  },
  created() {
  },
  attached() {
  },
  methods: {
    onTap() {
      if (this.data.status === pageStatus.noNetwork
        || this.data.status === pageStatus.error
      ) {
        this.triggerEvent('retry')
      }
    },
  }
})
