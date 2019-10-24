const path = require('path')
const cloud = require('wx-server-sdk')

function getContext() {
  const wxContext = cloud.getWXContext()
  return {
    appid: wxContext.APPID,
    openid: wxContext.OPENID,
    unionid: wxContext.UNIONID,
    source: wxContext.SOURCE,
    env: wxContext.ENV,
  }
}

module.exports = function router(event) {
  const { funcName, ...args } = event
  const ctx = getContext()
  if (funcName === '') {
    return ctx
  }
  try {
    const func = require(path.resolve(__dirname, './api/', funcName))
    return func(args, ctx)
  } catch(e) {
    throw e
  }
}
