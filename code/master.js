$(document).ready(function() {
  codeReader.getVideoInputDevices()
    .then((videoInputDevices) => {
      const sourceSelect = document.getElementById('sourceSelect');
      selectedDeviceId = videoInputDevices[0].deviceId;
      if (videoInputDevices.length >= 1) {
        if (videoInputDevices.length == 1) {
          const sourceOption = document.createElement('option');
          sourceOption.text = "Front camera";
          sourceOption.value = "";
          sourceSelect.appendChild(sourceOption);
          selectedDeviceId = undefined;
        } else {
          videoInputDevices.forEach((element) => {
            const sourceOption = document.createElement('option');
            sourceOption.text = element.label;
            sourceOption.value = element.deviceId;
            sourceSelect.appendChild(sourceOption);
          });
        }
        sourceSelect.onchange = () => {
          selectedDeviceId = sourceSelect.value;
        };
      }
    })
    .catch((err) => {
      console.error(err);
    });
});

$(document).on('updateQRSize', function() {
  let dim = ($('fieldset[operation]').width() < $('fieldset[operation]').height()) ? $('fieldset[operation]').width() : $('fieldset[operation]').height();
  QRSize = dim;
  dim = parseInt(dim - (dim * 0.01));
  try {
    if (!navigator.userAgentData.mobile) {
      dim = dim * 0.7;
    }
  } catch (e) {

  }
  $('div.qr_area').add('div.qr_area img').css({
    'width': `${dim}px`,
    'height': `${dim}px`
  });
  if (QRGenerator != null) {
    QRGenerator.size = QRSize
  }
});

$(document).ready(function() {
  $(document).trigger('update_size');
  $('#start').click(function() {
    let send = $('#send').prop('checked');
    let _operation = $('fieldset[operation]');
    let op_name = $(_operation.find('span')[0]);
    $('fieldset[operation]').addClass('full');
    $(document).trigger('update_size');
    setTimeout(function() {
      if (send) {
        operation = "send";
        op_name.text('Send');
        $('div[op]').hide();
        $('div[op="send"]').show();
        if (!send.ready) {
          let compressed = LZString.compressToEncodedURIComponent(LENNA);
          let temp = "";
          // Throtting; we start with 8B, then increase it (duplication x2) till we reach 1024B
          let size = 8;
          console.log(compressed.length); // 1730
          for (let i = 0; i < compressed.length; ++i) {
            temp += compressed[i];
            if ((new TextEncoder().encode(temp)).length >= size || ((i + 1) >= compressed.length)) {
              fileToSend.push(temp);
              temp = '';
              size += Math.ceil(size / 2);
              if (size > 512) {
                size = 512;
              }
            }
          }
          $('div[op="send"] div.feedback').html(`Waiting for the <code>Ready</code> QR code.`);
          decodeContinuously();
        }
        return;
      }
      // Recieve
      op_name.text('Recieve');
      $('div[op]').hide();
      $('div[op="recieve"]').show();
      operation = "recieve";
      $('div[op="recieve"] div.feedback').html(`Waiting for reading <code>Ready</code> QR code.`);
      if (QRGenerator == null) {
        QRGenerator = new QRious({
          element: $('#qr_recieve')[0],
          level: 'L',
          size: QRSize,
          value: "Ready"
        });
      }
      decodeContinuously();
    }, 100);
  });
});
