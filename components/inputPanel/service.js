import {
  logger,
   _,
} from '../../utils/index'
import {
  request,
  URL,
  login,
} from '../../network/index'

export function postComment(params) {
  return request.post(URL.postComment, params).then(res => {
    if (!res || res.code !== 0) {
      return Promise.reject(res)
    }
    return res
  })
}

export { login }
