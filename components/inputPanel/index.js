import {
  _,
  logger,
} from '../../utils/index'
import {
  inputPanel,
} from '../../store/index'
import {
  postComment,
  login,
} from './service'

// inputPanel必须挂载到最外层的page上
// inputPanel创建和销毁随page的创建和销毁
// inputPanel与其他组件的通信依赖创建时注册的回调事件
Component({
  properties: {
    placeholder: {
      type: String,
      value: '我要吐槽',
    },
  },
  data: {
    disableSubmit: true,
    show: false,
    focus: false,
    value: '',
    inputPanelBottom: 0,
  },
  created() {
    Object.assign(this, {
      callback: [],
    })
    this.showInputPanel = this.showInputPanel.bind(this)
  },
  attached() {
    inputPanel.attached(this.showInputPanel)
    if (inputPanel.systemKeyboardHeight > 0) {
      this.setData({ inputPanelBottom: inputPanel.systemKeyboardHeight })
    }
  },
  ready() {
  },
  detached() {
    inputPanel.detached()
    this.callback = []
  },
  pageLifetimes: {
    show() {
    },
    hide() {
      if (this.data.show) {
        this.hideInputPanel(false)
      }
    },
  },
  methods: {
    tapShade() {
      if (this.data.show) {
        this.hideInputPanel(false)
      }
    },
    submit(e) {
      if (this.data.disableSubmit) {
        wx.showToast({
          icon:'none',
          title: '请输入内容',
        })
        this.hideInputPanel(false)
        return
      }
      wx.showLoading({ mask: true })
      const value = _.get(e, 'detail.value', '')
      let content = ''
      // form submit 各个字段value存储在detail.value的object上
      // 其他情况直接取detail.value的值即可
      if (_.isObject(value)) {
        content = value.content || ''
      } else {
        content = value
      }
      const data = {
        content,
      }
      postComment(data).then(res => {
        wx.hideLoading()
        wx.showToast({
          title: '发表成功',
        })
        inputPanel.deleteCache()
        this.hideInputPanel(true, res)
      }).catch(err => {
        logger.error('发表出现错误：', err)
        wx.hideLoading()
        wx.showToast({
          icon: 'none',
          title: '发表失败',
        })
        this.hideInputPanel(false, err)
      })
    },
    onInput(e) {
      const detail = e && e.detail || {}
      const value = (detail.value || '').trim()
      inputPanel.updateCache({ value })
      this.updateSubmitState(value)
    },
    onFocus(e) {
      const height = _.get(e, 'detail.height', 0)
      inputPanel.systemKeyboardHeight = height
      if (this.data.inputPanelBottom !== height) {
        this.setData({ inputPanelBottom: height })
      }
    },
    onBlur(e) {
      // 点击提交按钮 blur 事件优先于 submit事件触发
      this.hideInputPanel(false)
    },
    updateSubmitState(value) {
      if (value.length && this.data.disableSubmit) {
        this.setData({ disableSubmit: false })
      } else if (!value.length && !this.data.disableSubmit) {
        this.setData({ disableSubmit: true})
      }
    },
    showInputPanel(detail) {
      detail = { ...detail }
      if (!_.has(detail, 'callback')) {
        logger.error('Error: showInputPanel event 参数callback是必填的')
      }
      this.callback = detail.callback
      login().then(() => {
        const cache = inputPanel.getCache()
        const data = {
          value: detail.value || cache || '',
          focus: true,
        }
        if (!this.data.show) {
          // 第一次启动时不使用延迟
          if (this.data.inputPanelBottom === 0) {
            data.show = true
          } else {
            // 延迟150ms为的是与系统键盘同时出现，有误差
            setTimeout(() => {
              this.setData({ show: true })
            }, 150)
          }
        }
        const disableSubmit = !data.value
        if (disableSubmit !== this.data.disableSubmit) {
          data.disableSubmit = disableSubmit
        }
        if (detail.placeholder) {
          data.placeholder = detail.placeholder
        }
        this.setData(data)
      })
    },
    hideInputPanel(success = true, data) {
      this.setData({
        show: false,
        focus: false,
      })
      if (_.isArray(this.callback)) {
        this.callback.forEach(item => this.callbackResult(success, item, data))
      } else {
        this.callbackResult(success, this.callback, data)
      }
    },
    callbackResult(success, item = {}, data) {
      if (success) {
        if (_.isFunction(item.success)) {
          item.success(data)
        }
      } else {
        if (_.isFunction(item.fail)) {
          item.fail(data)
        }
      }
    },
  }
})
