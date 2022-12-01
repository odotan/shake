let count = -1 // The number of images
let total = 0 // Total size in bytes
let operation = null // send || receive
let QRGenerator = null // Will hold the QR Generator library
let QRSize = 64 // Default QRSize
let QRByteSize = 0 // By default, we begin with 0 byte then 8 bytes
let currentImage = 0 // Start with the first smallest image
let operationStarted = false
let currentQR = {
  content: "",
  md5: ""
}
let total_sent = 0

var codeReader = new ZXing.BrowserQRCodeReader(),
  selectedDeviceId = null

let images = []
let send_info = {
  count: 0,
  size: 0
}

// Update the QRSize
$(document).on('updateQRSize', function() {
  // Define the container and desired dimension value
  let container = $(`div.section[section="${operation}"] div.sub-content article.${operation}`)
  let dimension = (container.width() < container.height()) ? container.width() : container.height()
  dimension = parseInt(dimension - (dimension * 0.01))
  try {
    if (!navigator.userAgentData.mobile) {
      dimension = dimension * 0.9
    }
  } catch (e) {} finally {
    QRSize = dimension
  }
  if (QRGenerator != null) {
    QRGenerator.size = QRSize
  }
})

// On window resize change the QR size as well
$(window).resize(function() {
  $(document).trigger('updateQRSize')
})

// Function to initially change the QR size based on the operation
let initalQRSizeUpdate = (operation) => {
  setTimeout(function() {
    $(document).trigger('updateQRSize')
    let qr_value = "qr:ready" // For receive
    if (operation == "send") {
      qr_value = JSON.stringify(send_info)
    }
    // Set the size
    setTimeout(function() {
      QRGenerator = new QRious({
        element: $(`div.section[section="${operation}"] div.sub-content article.${operation} canvas.qr`)[0],
        level: 'L',
        size: QRSize,
        value: qr_value
      })
    }, 100)
  }, 100)
}

// Get the device's camera(s)
$(document).ready(function() {
  codeReader.getVideoInputDevices()
    .then((videoInputDevices) => {
      const sourceSelect = $('dialog#chooseCamera article select')[0]
      selectedDeviceId = videoInputDevices[0].deviceId
      if (videoInputDevices.length >= 1) {
        if (videoInputDevices.length == 1) {
          const sourceOption = document.createElement('option')
          sourceOption.text = "Front camera"
          sourceOption.value = ""
          sourceSelect.appendChild(sourceOption)
          selectedDeviceId = undefined
        } else {
          videoInputDevices.forEach((element) => {
            const sourceOption = document.createElement('option')
            sourceOption.text = element.label
            sourceOption.value = element.deviceId
            sourceSelect.appendChild(sourceOption)
          })
        }
        sourceSelect.onchange = () => {
          selectedDeviceId = sourceSelect.value
          console.log("Here");
          decodeContinuously();
        }
      }
    })
    .catch((err) => {
      console.error(err)
    })
})



function decodeContinuously() {
  codeReader.decodeFromInputVideoDeviceContinuously(selectedDeviceId, 'video', (result, err) => {
    if (result) {
      console.log('Found QR code!', result);
      console.log(result.text);
      switch (operation) {
        default:
        case "send":
          // First we detect the ready QR
          if (!operationStarted) {
            let content = result.text.toLowerCase().replace(/\s+/, '')
            if (content.indexOf("qr:ready") != -1) {
              operationStarted = true
              // Start the sending process
              sendingProcess()
            }
          }

          if (operationStarted) {
            // Now get the md5 value of the given content
            let md5Value = result.text
            // Compare with the current md5 value
            if (md5Value == currentQR.md5) {
              sendingProcess()
            }
          }
          break;
        case "receive":

          break;


      }
    }

    if (err) {
      if (err instanceof ZXing.NotFoundException) {
        console.log('No QR code found.');
      }

      if (err instanceof ZXing.ChecksumException) {
        console.log('A code was found, but it\'s read value was not valid.');
      }

      if (err instanceof ZXing.FormatException) {
        console.log('A code was found, but it was in a invalid format.');
      }
    }
  });
}


function sendingProcess() {
  if (currentImage >= images.length) {
    console.log("Finished!")
    return
  }
  let content = images[currentImage]
  console.log(content);
  if (QRByteSize % 2048 != 0 && QRByteSize >= 2048) {
    QRByteSize = 2048
  } else {
    if (QRByteSize % 2048 == 0 && QRByteSize != 0) {
      content = content.slice(QRByteSize, QRByteSize + 2048)
      QRByteSize += 2048
    } else {
      if (QRByteSize == 0) {
        content = content.slice(QRByteSize, QRByteSize + 8)
        QRByteSize = 8
      } else {
        content = content.slice(QRByteSize, QRByteSize * 2)
        QRByteSize *= 2
      }
    }
  }
  total_sent += QRByteSize
  console.log(formatBytes(total_sent));
  if (content.length == 0) {
    console.log("Finished the image!")
    ++currentImage
    return
  }
  currentQR.content = content
  currentQR.md5 = md5(content)
  QRGenerator.value = content
}
//
// {
//   count: 0,
//   total: 100
// }
