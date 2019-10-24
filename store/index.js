import initStore from './store.js'
import global from './global'
import userInfo from './userInfo'
import systemInfo from './systemInfo'
import inputPanel from './inputPanel'

const store = initStore({
  global,
  userInfo,
  systemInfo,
  inputPanel,
})

module.exports = exports = store
