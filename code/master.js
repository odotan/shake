var codeReader = new ZXing.BrowserQRCodeReader(),
  selectedDeviceId = null,
  QRSize = 0,
  QRGenerator = null,
  operation = "unknown",
  send = {
    ready: false,
    index: 0
  },
  recieve = {
    index: 1,
    data: []
  },
  fileToSend = [];

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

$(document).on('update_size', function() {

  let dim = ($('fieldset[operation]').width() < $('fieldset[operation]').height()) ? $('fieldset[operation]').width() : $('fieldset[operation]').height();
  dim = parseInt(dim - (dim * 0.1));
  try {
    if (!navigator.userAgentData.mobile) {
      dim = dim * 0.7;
    }
  } catch (e) {

  }
  QRSize = dim;
  $('#qr_area').add('#qr').css({
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
          for (let i = 0; i < compressed.length; ++i) {
            temp += compressed[i];
            let size = 80;
            if ((new TextEncoder().encode(temp)).length >= size || ((i + 1) >= compressed.length)) {
              fileToSend.push(temp);
              temp = '';
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


function decodeContinuously() {
  codeReader.decodeFromInputVideoDeviceContinuously(selectedDeviceId, 'video', (result, err) => {
    if (result) {
      console.log('Found QR code!', result);
      console.log(result.text);

      // Detect the ready QR code, and start the sending operation
      if (result.text.toLowerCase().indexOf('ready') != -1 && operation == "send" && !send.ready) {
        if (QRGenerator == null) {
          QRGenerator = new QRious({
            element: $('#qr_send')[0],
            level: 'L',
            size: QRSize,
            value: "-"
          });
        }
        send.ready = true;
        sendingProcess(1);
      }

      // For sending operation, we detect the index qr_code
      let qr_index = parseInt(result.text);
      if (!isNaN(qr_index) && operation == "send" && send.ready) {
        // Check if the index is outside the fileToSend range
        if (qr_index > fileToSend.length) {
          $('div[op="send"] div.feedback').html(`Operation has been finished.`);
          QRGenerator.value = "Finished";
        } else {
          sendingProcess(qr_index);
        }
      }

      // For recieving operation, we detect all the qr_codes till we detect the `Finished` QR
      if (result.text.length > 5 && operation == "recieve") {
        if (result.text == "Finished") {
          $('div[op="recieve"] div.feedback').html(`Operation has been finished.`);
          finishBeep();
          dataToImage(recieve.data);
        } else {
          if (!recieve.data.includes(result.text)) {
            console.log("Push");
            recieve.data.push(result.text);
            ++recieve.index;
            $('div[op="recieve"] div.feedback').html(`Attemp to read QR #${recieve.index}.`);
            QRGenerator.value = recieve.index.toString();
          }
        }
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

function sendingProcess(index) {
  $('div[op="send"] div.feedback').html(`Start with QR #${index}/${fileToSend.length}.`);
  QRGenerator.value = fileToSend[index - 1];
}


function finishBeep() {
  let audio = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
  audio.play();
}

function dataToImage(chunks) {
  let data = "";
  chunks.forEach((chunk) => {
    data += chunk;
  });
  data = LZString.decompressFromEncodedURIComponent(data);
  let bytes = data.split(" ");
  bytes = bytes.filter((byte) => {
    return byte.toString().length != 0
  })

  let arr = new Uint8Array(bytes);

  var arrayBufferView = new Uint8Array(arr);
  var blob = new Blob([arrayBufferView], {
    type: "image/jpeg"
  });
  var urlCreator = window.URL || window.webkitURL;
  var imageUrl = urlCreator.createObjectURL(blob);
  var img = document.querySelector("#result");
  img.src = imageUrl;
  $('div.result').show();
}
