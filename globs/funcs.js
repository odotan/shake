let reduceSize = (fromPrevious = false) => {
  try {
    let changeIndex = true
    if (fromPrevious) {
      startingIndex = previousQR.startingIndex
      changeIndex = false
    }
    QRByteSize /= 2
    if (!KeepSize) {
      if (changeIndex) {
        startingIndex -= QRGenerator.value.length
      }
      KeepSize = true
    } else {
      if (changeIndex) {
        startingIndex -= (QRByteSize * 2)
      }
    }
    if (QRByteSize < 8) {
      QRByteSize = 8
    }

    sendingProcess()
  } catch (e) {

  } finally {
    lastAck = (new Date()).getTime()
  }
}

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

// Function to read qrs
let decodeContinuously = () => {
  codeReader.reset()
  codeReader.decodeFromInputVideoDeviceContinuously(selectedDeviceId, 'preview_camera', (result, err) => {
    if (result) {
      console.warn(result.text)
      switch (operation) {
        default:
        case "send":
          if (!operationStarted) {
            let content = result.text.toLowerCase().replace(/\s+/, '')
            // Make sure the other device is ready, and wait for starting the sending process
            if (content.indexOf("qr:start") != -1 || content.indexOf("reduce") != -1) {
              operationStarted = true
              try {
                $('article.send footer progress')[0].indeterminate = false
                $('article.send footer progress').val(0)
                $('article.send footer div').html(`<div>0/${send_info.count} - 0/${formatBytes(send_info.size)}</div>`)
              } catch (e) {}

              // Start the sending process
              sendingProcess()
            }
            return
          }

          // The operation has started
          // Get the md5 value of the given content
          let md5Value = result.text
          // Compare it with the current md5 value
          if (md5Value == currentQR.md5) {
            // Add the value to be computed
            received_reserved += QRGenerator.value

            let formated_received = received_reserved.length
            if (received_reserved.length > send_info.size) {
              formated_received = send_info.size
            }
            $('article.send footer div').html(
              `<div>
                ${currentImage}/${send_info.count} - ${formatBytes(formated_received)}/${formatBytes(send_info.size)}
              </div>`
            )
            let progress = (received_reserved.length / send_info.size) * 100
            $('article.send footer progress').val(progress)
            lastAck = (new Date()).getTime()
              ++numberOfScans
            if (numberOfScans >= 5) {
              KeepSize = false
              numberOfScans = 0
            }
            // Repeat the process
            sendingProcess()
            return
          }
          // If not, check if the current message (reduce)
          if ((md5Value.toLowerCase()).indexOf('reduce') != -1) {
            let latestMD5 = md5Value.split(",")[1]
            if (latestMD5 == previousQR.md5) {
              return reduceSize(true)
            }
            // Check if the last ack was 5 seoncds ago
            if ((new Date()).getTime() - lastAck >= 5000) {
              reduceSize()
            }
          }
          break

        case "receive":
          lastAck = (new Date()).getTime()
          // If the operation didn't start yet
          if (!operationStarted) {

            let content = null

            try {
              // Try to convert the given content to JSON
              content = JSON.parse(result.text)
              // Save the info
              send_info = content
              $('article.receive footer').html("")
              $('article.receive footer').append($(`<div>0/${send_info.count} - 0/${formatBytes(send_info.size)}</div>`))
              $('article.receive footer').append($(`<progress value="0" max="100"></progress>`).show(function() {
                progress_bar = $(this)
              }))
              // Change the QR value to start the sending process
              QRGenerator.value = "qr:start"
              operationStarted = true
            } catch (e) {}
            return
          }

          // Convert the given content to MD5 hash
          let _md5 = md5(result.text)

          try {
            // Try to convert the given content to JSON
            let test = JSON.parse(result.text)
          } catch (e) {
            // If we've got an error, then the QR is not the info JSON
            if (latest_md5 != _md5) {

              let escapeRegExp = (string) => {
                return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              }

              latest_md5 = _md5
              received_reserved += result.text

              if (result.text.indexOf('data:') != -1 && received.length != 0 || (result.text.indexOf('qr:finished') != -1)) {
                images.push(received)
                received = result.text

              } else {

                received += result.text

              }

              QRGenerator.value = _md5

              let formated_received = received_reserved.length
              if (received_reserved.length > send_info.size) {
                formated_received = send_info.size
              }
              $('article.receive footer div').html(
                `<div>
                ${images.length}/${send_info.count} - ${formatBytes(formated_received)}/${formatBytes(send_info.size)}
                </div>`
              )
              try {
                let progress = (received_reserved.length / send_info.size) * 100
                progress_bar.val(progress)
              } catch (e) {}

            }

            // Check if the sending process has finished
            let finished = result.text.toLowerCase().replace(/\s+/, '')
            if (finished.indexOf('qr:finished') != -1) {
              QRGenerator.value = "Operation Done"
              $('div.section[section="receive"] article.preview').hide().html("")
              $('article.receive').hide()
              codeReader.reset()
              $('#chooseCamera select').val(1000)
              finish()
              $('#chooseCamera select').val(10000)
              count = -1
              let grid = `<div class="grid">`
              for (var i = 0; i < images.length; i++) {
                let image = `<img src="${images[i]}">`
                  ++count
                grid += `<div class="image">
                                ${image}<br />
                                <div class="size">${formatBytes(images[i].length)}</div>
                              </div>`
                if ((count % 5 == 0 && count != 0) || count + 1 == images.length) {
                  grid += `</div>`
                  $('div.section[section="receive"] article.preview').show().append(grid)
                  grid = `<div class="grid">`
                }
              }
              return
            }
          }
          break

      }
    }

    if (err) {
      if (err instanceof ZXing.NotFoundException) {
        console.log('No QR code found.')
      }

      if (err instanceof ZXing.ChecksumException) {
        console.log('A code was found, but it\'s read value was not valid.')
      }

      if (err instanceof ZXing.FormatException) {
        console.log('A code was found, but it was in a invalid format.')
      }
    }
  })
}


let sendingProcess = () => {
  // Check if we've finished or not
  if (currentImage >= images.length) {
    QRGenerator.value = "qr:finished"
    codeReader.reset()
    return
  }
  // If not, then the content will be taken from the current image
  let content = images[currentImage]

  // If the leng
  if ([null, undefined].includes(content)) {
    ++currentImage
    return
  }

  // Smart way to slice the content
  if (QRByteSize == 0) {
    content = content.slice(QRByteSize, QRByteSize + 8)
    QRByteSize = 8
    startingIndex = QRByteSize
  } else if (QRByteSize % 256 == 0) {
    content = content.slice(startingIndex, startingIndex + QRByteSize)
    startingIndex += QRByteSize
  } else {
    content = content.slice(startingIndex, startingIndex + QRByteSize)
    if (!KeepSize) {
      if (startingIndex <= QRByteSize) {
        QRByteSize *= 2
        startingIndex = QRByteSize
      } else {
        startingIndex += QRByteSize
        QRByteSize *= 2
      }
    } else {
      startingIndex += QRByteSize
    }
  }

  if (content.length <= 0) {
    ++currentImage
    QRByteSize = 0
    KeepSize = false
    return
  }

  currentQR.content = content
  currentQR.md5 = md5(content)
  QRGenerator.value = content

  previousQR.startingIndex = startingIndex
  previousQR.md5 = currentQR.md5
}


let fullReset = () => {
  count = -1
  total = 0
  operation = null
  QRGenerator = null
  QRSize = 64
  QRByteSize = 0
  currentImage = 0
  operationStarted = false
  currentQR = {
    content: "",
    md5: ""
  }

  latest_md5 = ""
  //selectedDeviceId = null

  images = []
  send_info = {
    count: 0,
    size: 0
  }

  received = ""
  received_reserved = ""
  progress_bar = null

  $('div.section').add('div.start').hide()

  $('div.section article.preview').html("")
  $('div.section article.preview').hide()

  $('article.send').hide()

  $('div.section[section="send"] div.sub-content').children('div.button').show()
  $('div.section[section="send"] div.sub-content').children('article.send').hide()

  $('div.start').hide()

  $('#start').show()

  // $('#chooseCamera select').val(1000)

  //codeReader.reset()
  $('article.receive').show()

  $('article.receive footer').html("Please point the other device to this QR to complete the hand shake.")
  try {
    $('article.send footer progress')[0].indeterminate = true
    $('article.send footer progress').removeAttr('value')
    $('article.send footer div').html(`Waiting for the hand shake.`)
  } catch (e) {}

  $('#images').val("")

}

function finish() {
  let audio = new Audio(FinishSound)
  audio.play()
}

function formatBytes(bytes, decimals = 0) {
  if (!+bytes) {
    return '0B'
  }
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))}${sizes[i]}`
}
