$(document).ready(function() {
  let welcome = $('div.welcome')

  $('#send').click(function() {
    welcome.add('div.section[section="receive"]').hide()
    $('div.section[section="send"]').show()

    // Reset
    $('article.preview').hide().html("")
    $('div.start').hide()
    count = -1
    total = 0
    images = []
    send_info = {
      count: 0,
      size: 0
    }

    // Change operation
    operation = "send"
  })

  $('#receive').click(function() {
    welcome.add('div.section[section="send"]').hide()
    $('div.section[section="receive"]').show()

    // Change operation
    operation = "receive"

    initalQRSizeUpdate("receive")
  })

  $('img.back').click(function() {
    $('div.section').add('div.start').hide()
    welcome.show()

    // Change operation
    operation = null
  })

  $('#start').click(function() {
    switch (operation) {
      default:
      case "send":
        let content = $('div.section[section="send"] div.sub-content')
        content.children('div.button').hide()
        content.children('article.preview').hide()
        content.children('article.send').show()
        try {
          content.children('footer').children('progress')[0].indeterminate = true
        } catch (e) {

        } finally {

        }
        $(this).hide()
        initalQRSizeUpdate("send")


        console.log("Send images.")
        break

      case "receive":
        console.log("Receive images.")
        break
    }
  })
})


$(document).ready(function() {
  $('#select_files').click(function() {
    $('#images').click()
  })
  $('#images').change(function(e) {
    $('#select_files').attr('disabled', '')
    $('#select_files').attr('aria-busy', 'true')
    try {
      let files = e.target.files
      let grid = `<div class="grid">`
      $('article.preview').hide().html("")
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
        let reader = new FileReader()
        reader.onload = async function(e) {
          let image = `<img src="${e.target.result}" alt="${file.name}">`
            ++count
          total += file.size
          grid += `<div class="image">
                        ${image}<br />
                        <div class="size">${formatBytes(file.size)}</div>
                      </div>`
          if ((count % 5 == 0 && count != 0) || count + 1 == files.length) {
            grid += `</div>`
            $('article.preview').show().append(grid)
            grid = `<div class="grid">`
          }
          // let image_compresses = LZString.compressToBase64(e.target.result);
          let image_compresses = e.target.result
          images.push(image_compresses)
        }
        reader.readAsDataURL(file)
      }
      setTimeout(async function() {
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
      }, 500)
    } catch (_e) {} finally {
      setTimeout(function() {
        $('#select_files').removeAttr('disabled')
        $('#select_files').removeAttr('aria-busy')
      }, 100)
    }
  })
})


function formatBytes(bytes, decimals = 0) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))}${sizes[i]}`
}
