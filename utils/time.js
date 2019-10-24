
function addLeftZero(num) {
  if (Number(num) < 10) {
    return '0' + num
  }
  return num
}

function timestampToSecond(timestamp) {
  timestamp = parseInt(timestamp) || 0
  const tstr = timestamp + ''
  const num = tstr.length - 10
  if (num === 0) {
    return timestamp + 0.001
  } else {
    if (num > 0) {
      timestamp = (timestamp / (10 ** num)).toFixed(3)
    } else {
      timestamp = (timestamp / 1000).toFixed(3)
    }
    const tarr = timestamp.split('.')
    if (!tarr[1] || tarr[1] === '000') {
      tarr[1] = '001'
    }
    return parseFloat(tarr[0] + '.' + tarr[1])
  }
}

function format(date, format) {
  if (typeof date === 'number' || typeof date === 'string') {
    if ((date + '').length === 10) {
      date *= 1000
    }
    date = new Date(date)
  }
  if (Object.prototype.toString.call(date) !== '[object Date]') {
    return ''
  }
  const ddweek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const mm = addLeftZero(date.getMinutes())
  const HH = addLeftZero(date.getHours())
  const DD = addLeftZero(date.getDate())
  const dd = ddweek[date.getDay()]
  let rst = ''
  switch(format) {
    case 'DD':        // Day of month 01,02,...,31
      rst = DD
      break
    case 'dd':      // Day of week 周日,周一,....,周六
      rst = dd
      break
    case 'dddd':      // Day of week 星期日,星期一,....,星期六
      break
    case 'HH:mm':
      rst = `${HH}:${mm}`
      break
    default:
      rst = ''
      break
  }
  return rst
}

exports = module.exports = {
  timestampToSecond,
  format,
}
