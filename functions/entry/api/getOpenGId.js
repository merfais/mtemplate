const _ = require('lodash')

module.exports = function getOpenGId(params) {
  if (_.has(params, 'data') && _.isObject(params.data)) {
    return params.data
  }
  return params
}
