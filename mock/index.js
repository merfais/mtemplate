import login from './login'
import getOpenId from './getOpenId'
import postComment from './comment'

function reShape(data) {
  return { data }
}

export default function mock(url, data = {}) {
  if (url.match(/login/)) {
    return reShape(login(data))
  } else if (url.match(/getOpenId/)) {
    return reShape(getOpenId(data))
  } else if (url.match(/postComment/)) {
    return reShape(postComment(data))
  } else {
    return reShape({ code: -1, ...data })
  }
}
