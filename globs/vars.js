let count = -1 // The number of images
let total = 0 // Total size in bytes
let operation = null // send || receive
let QRGenerator = null // Will hold the QR Generator library
let QRSize = 64 // Default QRSize
let QRByteSize = 0 // By default, we begin with 0 byte then 8 bytes
let startingIndex = 0 // We here store the value of the last slicing position
let currentImage = 0 // Start with the first smallest image
let operationStarted = false
let currentQR = {
  content: "",
  md5: ""
}
let previousQR = {
  startingIndex: 0,
  md5: ""
}
let latest_md5 = ""
let codeReader = new ZXing.BrowserQRCodeReader(),
  selectedDeviceId = null
let images = []
let send_info = {
  count: 0,
  size: 0
}
let received = "",
  received_reserved = ""
let progress_bar = null


let KeepSize = false
let lastAck = null
let numberOfScans = 0

let latestQR = ""
