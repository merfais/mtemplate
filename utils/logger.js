import _ from './mlodash'

const sysLogger = _.isFunction(wx.getLogManager) && wx.getLogManager()
const realtimeLogger = _.isFunction(wx.getRealtimeLogManager) && wx.getRealtimeLogManager()

function isDev() {
  const store = require('../store/index.js')
  return store.global.dev && store.systemInfo.platform === 'devtools'
}

function syslog(level, ...args) {
  if (sysLogger && _.isFunction(sysLogger[level])) {
    const str = _.reduce(args, (acc, item) => {
      if (_.isObject(item) || _.isArray(item)) {
        acc += ' ' + JSON.stringify(item)
      } else {
        acc += ' ' + item
      }
      return acc
    }, '[c]')
    sysLogger[level](str)
  }
}

function reallog(level, args) {
  if (realtimeLogger && _.isFunction(realtimeLogger[level])) {
    realtimeLogger[level].apply(realtimeLogger, args)
  }
}

function log(...args) {
  if (!isDev()) {
    console.log(...args)
    syslog('log', ...args)
  }
}

function info(...args) {
  if (!isDev()) {
    console.info(...args)
    syslog('info', ...args)
    reallog('info', args)
  }
}

function warn(...args) {
  if (!isDev()) {
    console.warn(...args)
    syslog('warn', ...args)
    reallog('warn', args)
  }
}

function error(...args) {
  console.error(...args)
  syslog('debug', 'ERROR', ...args)
  reallog('error', args)
  reallog('debug', args)
}

function debug(...args) {
  reallog('debug', args)
}

module.exports = exports = {
  log,
  info,
  warn,
  error,
  realtimeDebug: debug,
}
