const global = {
  name: 'global',
  state: {
    dev: true,                    // 环境参数，控制API请求等
    mock: true,                   // 关闭网络请求通道，网络请求全部成功返回
    scene: null,                  // 打开小程序场景值
    openFromShare: false,         // 是否是打开分享链接
    shareTargetPath: '',          // 打开分享链接时真正的目的页面地址
    tabBarPageQuery: {},          // 打开分享链接时，如果目的页是tabBar页面, 页面的参数
    openGId: '',                  // shareTicket计算出的群id，
  },
  getter: {
  },
  method: {
  },
  event: [
  ],


  /**
   *
   * name: 'global',  // 必填，模块名称
   * state: {         // 选填，模块的状态，任意类型变量，非函数，可读可写，
   *   // bar: 'bar', // 在外部使用module.bar访问，在getter,method使用this.bar访问
   * },
   * getter: {        // 选填，模块的属性，与state用法相同，书写是函数，使用是变量，可与setter配合
   *   foo() {        // 在外部使用module.foo访问，在getter,method中使用this.foo访问
   *     return this.bar   // return是必须的
   *   }
   * },
   * setter: {        // 选填，模块的属性，与state用法相同，书写是函数，使用是变量，可与getter配合
   *   foo(...args) { // 在外部使用module.foo访问，在getter,method中使用this.foo访问
   *     // return this.bar   // return是无效的
   *   }
   * },
   * method: {        // 选填，模块的方法，函数，可带任意数量参数，可读不可写
   *   baz(...args) { // 在外部使用module.baz访问, 尽量不要在内部直接访问，内部使用this.baz可访问
   *     this.bar = this.foo        // 可使用this直接修改state的值
   *     return this.bar + this.foo // return不是必须的
   *   }
   * }
   * event: [         // 选填，模块的事件，字符串，需要先注册再使用，可读不可写。事件一定要及时销毁，有内存泄漏风险
   *   'click',       // 在外部使用module.on(module.event.click, () => {})，尽量不要在内部直接访问
   *   'update',      // 在外部使用module.off(module.event.update, () => {})，未提供回调函数，则清楚所有update事件
   *   'delete',      // 在外部使用module.emit(module.event.click, ...args)，可使用任意个数事件参数
   * ]
   *
   */
}
export default global
