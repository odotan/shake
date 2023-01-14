$(document).ready(function() {
  let welcome = $('div.welcome')

  $('#send').click(function() {
    if (selectedDeviceId == null) {
      $('#chooseCamera').attr('open', 'true')
      $('html').addClass('modal-is-open')
      return
    }
    welcome.add('div.section[section="receive"]').hide()
    $('div.section[section="send"]').show()
    $('div.section[section="send"] article.preview').hide().html("")
    $('div.start').hide()
    count = -1
    total = 0
    images = []
    send_info = {
      count: 0,
      size: 0
    }
    operation = "send"
  })

  $('#receive').click(function() {
    if (selectedDeviceId == null) {
      $('#chooseCamera').attr('open', 'true')
      $('html').addClass('modal-is-open')
      return
    }
    welcome.add('div.section[section="send"]').hide()
    $('div.section[section="receive"]').show()
    operation = "receive"
    initalQRSizeUpdate("receive")
  })


  $('img.back').click(function() {
    welcome.show()
    fullReset()
  })

  $('#start').click(function() {
    if (operation == "send") {
      let content = $('div.section[section="send"] div.sub-content')
      content.children('div.button').hide()
      content.children('div.section[section="send"] article.preview').hide()
      content.children('article.send').show()
      try {
        content.children('footer').children('progress')[0].indeterminate = true
      } catch (e) {}
      $(this).hide()
      initalQRSizeUpdate("send")
    }
  })
})


$(document).ready(function() {

  $('#select_files').click(function() {
    $('#images').click()
  })
  $('#images').click(function() {
    $(this).val(null)
  })
  $('#images').change(function(e) {
    $('#select_files').attr('disabled', '')
    $('#select_files').attr('aria-busy', 'true')
    try {
      let files = e.target.files
      let grid = `<div class="grid">`
      $('div.section[section="send"] article.preview').hide().html("")
      $('div.start').hide()

      count = -1
      total = 0
      images = []
      send_info = {
        count: 0,
        size: 0
      }

      for (var i = 0; i < files.length; i++) {
        let file = files[i]

        new Compressor(file, {
          quality: ImagesQuality / 100,

          // The compression process is asynchronous,
          // which means you have to access the `result` in the `success` hook function.
          success(result) {
            let reader = new FileReader()

            reader.onload = async function(e) {
              let image = `<img src="${e.target.result}" alt="${result.name}">`
                ++count
              total += result.size
              grid += `<div class="image">
                          ${image}<br />
                          <div class="size">
                            ${formatBytes(result.size)}
                          </div>
                       </div>`
              if ((count % 5 == 0 && count != 0) || count + 1 == files.length) {
                grid += `</div>`
                $('div.section[section="send"] article.preview').show().append(grid)
                grid = `<div class="grid">`
              }

              let image_compresses = e.target.result
              images.push(image_compresses)
              if (i == files.length) {
                images.sort((a, b) => {
                  return a.length - b.length
                })

                send_info.count = images.length
                let size = 0
                images.forEach((image) => {
                  size += image.length
                })
                send_info.size = size
                $('div.start').fadeIn()
              }
            }
            reader.readAsDataURL(result)

          },
          error(err) {
            console.log(err.message);
          },
        });
      }
    } catch (_e) {} finally {
      setTimeout(function() {
        $('#select_files').removeAttr('disabled')
        $('#select_files').removeAttr('aria-busy')
      }, 100)
    }
  })

  $('#imgQuality').on('input', function() {
    let quality = parseInt($(this).val())
    $('div.imagesQuality sup').text(`${quality}%`)
    ImagesQuality = quality
  })
})
