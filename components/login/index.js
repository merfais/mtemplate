import _ from '../../utils/mlodash'
import logger from '../../utils/logger'
import {
  userInfo,
} from '../../store/index'

const MSG = {
  OK: 'getUserInfo:ok',
  DENY: 'getUserInfo:fail auth deny',
  CANCEL: 'tapCancel',
}

Component({
  properties: {
    fullCover: Boolean,     // 是否使用不透明背景
  },
  data: {
    show: false,
    dialogStyle: '',
    coverStyle: '',
  },
  created() {
    this.hasRegistered = false
  },
  attached() {
    this.registerEvent()
  },
  detached() {
    this.cancelEvent('component detached')
  },
  pageLifetimes: {
    show() {
      this.registerEvent()
    },
    hide() {
      // page 一般不会销毁，除非路由退栈，或栈顶替换
      // 但事件派发是不区分页面的，没有销毁的页面都会接收到到事件
      // 因此，要在页面隐藏时销毁事件
      this.cancelEvent('page hide')
    },
  },
  methods: {
    none() {},
    handleCancel() {
      // 全背景覆盖时不响应取消事件
      if (this.data.fullCover) {
        return
      }
      this.setData({ show: false })
      if (_.isFunction(this.reject)) {
        this.reject('cancelEvent: ' + MSG.CANCEL)
      }
    },
    handleApprove() {
      // 拉起微信的授权窗口后，隐藏原来的对话框，
      // 不能使用wx:if，因为会销毁button。
      // 导致getUserInfo的回调失效
      if (this.data.fullCover) {
        // 只隐藏对话框，不隐藏背景
        this.setData({ dialogStyle: 'opacity: 0;' })
      } else {
        // 隐藏拉取授权的窗口，
        // 由于拉动小程序系统的授权框存在一定的时间，
        // 这里给一个100ms的延迟，用于动作衔接，
        // 这个时间只是估算，不准确。
        setTimeout(() => {
          this.setData({ coverStyle: 'opacity: 0;' })
        }, 100)
      }
    },
    handleGetUserInfo(e) {
      this.setData({ show: false })
      const detail = e && e.detail || {}
      const errMsg = detail.errMsg || ''
      if (errMsg === MSG.OK) {
        this.resolve(detail)
      } else if (_.isFunction(this.reject)) {
        this.reject(detail)
      }
    },
    registerEvent() {
      if (this.hasRegistered) {
        return
      }
      this.hasRegistered = true
      // 为了拿到this, 需要将回调函数注册再实例上，
      // 注册在method，scope变换，无法获取this
      this.showDialog = (resolve, reject) => {
        this.setData({
          show: true,
          coverStyle: '',
          dialogStyle: '',
        })
        this.resolve = resolve
        this.reject = reject
      }
      userInfo.on(userInfo.event.showAuthButton, this.showDialog)
    },
    cancelEvent(reason) {
      if (_.isFunction(this.reject)) {
        this.reject('cancelEvent: ' + reason)
      }
      this.setData({ show: false })
      userInfo.off(userInfo.event.showAuthButton, this.showDialog)
      this.resolve = null
      this.reject = null
      this.hasRegistered = false
    }
  },
})
