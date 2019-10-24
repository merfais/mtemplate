import _ from '../utils/mlodash'

const inputPanel = {
  name: 'inputPanel',
  state: {
    stack: [],
    systemKeyboardHeight: 0,
    cache: new Map(),    // 输入缓存
  },
  getter: {
  },
  method: {
    attached(show) {
      this.stack.push(show)
    },
    detached(show) {
      this.stack.pop()
    },
    show(params = {}) {
      if (_.isFunction(this.stack[this.stack.length - 1])) {
        return new Promise((success, fail) => {
          this.stack[this.stack.length - 1]({
            ...params,
            callback: {
              success,
              fail,
            }
          })
        })
      }
      return Promise.reject('未找到inputPanel组件实例')
    },
    updateCache(data = {}) {
      // 缓存输入的内容
      const id = data.id || 'id'
      this.cache.set(id, data.value || '')
    },
    getCache(data = {}) {
      // 读取缓存内容
      const id = data.id || 'id'
      return this.cache.get(id) || ''
    },
    deleteCache(data = {}) {
      // 删除缓存的内容
      const id = data.id || 'id'
      this.cache.delete(id)
    },
  },
}
export default inputPanel
