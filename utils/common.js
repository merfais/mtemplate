export function versionToNumber(version) {
  version += ''
  if (!/^[0-9.]+$/.test(version)) {
    return 0
  }
  return version.split('.').map(v => {
    const n = 4 - v.length
    return Array(n).join('0') + '0' + v
  }).join('') * 1
}

// a >= b
export function versionGte(a, b) {
  return versionToNumber(a) >= versionToNumber(b)
}

// a > b
export function versionGt(a, b) {
  return versionToNumber(a) > versionToNumber(b)
}

// a < b
export function versionLt(a, b) {
  return versionToNumber(a) < versionToNumber(b)
}

// a <= b
export function versionLte(a, b) {
  return versionToNumber(a) <= versionToNumber(b)
}

export function generateUUID() {
  try {
    let uuid = wx.getStorageSync('UUID')
    if (uuid && uuid.length === 36) {
      userInfo.uuid = uuid
      return uuid
    }
    uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
    userInfo.uuid = uuid
    wx.setStorageSync('UUID', uuid)
  } catch(e) {}
}
