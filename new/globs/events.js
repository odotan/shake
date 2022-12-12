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

// Get the device's camera(s)
$(document).ready(function() {
  codeReader.getVideoInputDevices()
    .then((videoInputDevices) => {
      const sourceSelect = $('dialog#chooseCamera article select')[0]
      // selectedDeviceId = videoInputDevices[0].deviceId
      if (videoInputDevices.length >= 1) {
        if (videoInputDevices.length == 1) {
          const sourceOption = document.createElement('option')
          sourceOption.text = "Front camera"
          sourceOption.value = ""
          sourceSelect.appendChild(sourceOption)
          selectedDeviceId = null
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
          decodeContinuously()
        }
      }
    })
    .catch((err) => {
    })
})

$(document).ready(function() {
  $('#nightmode').click(function(){
    let mode = $('html').attr('data-theme')
    let new_mode = (mode == "light") ? "dark" : "light"
    $('html').attr('data-theme', new_mode)
  })
})
