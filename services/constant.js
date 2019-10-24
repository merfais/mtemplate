/**
 * 全局上的静态常量
 */
export const reqStatus = {
  pending: 'pending',       // 已发起请求尚未返回
  fullfilled: 'fullfilled', // 请求返回, 结果成功
  rejected: 'rejected',     // 请求返回，结果失败
}

export const pageStatus = {
  loading: 'loading',       // 页面加载中
  ready: 'ready',           // 页面加载成功
  error: 'error',           // 页面加载失败
  noNetwork: 'noNetwork',   // 没有网络
}

