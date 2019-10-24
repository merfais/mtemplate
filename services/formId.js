import _ from '../utils/mlodash'
import logger from '../utils/logger'
import {
  request,
  URL,
} from '../network/index'

export default function reportFormId(e) {
  // 直接处理form submi的event对象
  if (_.has(e, 'detail')  && e.type === 'submit') {
    const detail = e.detail || {}
    const data = { formId: detail.formId }
    const dataset = _.get(detail, 'target.dataset', {})
    Object.assign(data, dataset)
    request.post(URL.reportFormId, data).then(res => {
      if (!res || res.code !== 0) {
        return Promise.reject(res)
      }
    }).catch(err => {
      logger.error('收集formId失败:', err)
    })
  }
}
