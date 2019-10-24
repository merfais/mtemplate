
export function isFromApp(scene) {
  return scene === 1036
}
export function isFromQR(scene) {
  return scene === 1011   // 扫描二维码
    || scene === 1012     // 长按图片识别二维码
    || scene === 1013     // 扫描手机相册中选取的二维码
}
export function isFromMpQR(scene) {
  return scene === 1047   // 扫描小程序码
    || scene === 1048     // 长按图片识别小程序码
    || scene === 1049     // 扫描手机相册中选取的小程序码
}
export function isFromTemplate(scene) {
  return scene === 1014   // 小程序模板消息，推送消息
}
