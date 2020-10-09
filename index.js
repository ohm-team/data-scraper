const request = require('request')
const fs = require('fs')
const mkdirp = require('mkdirp')
const FORMATS = ['csv', 'xml', 'json', 'xsl', 'xslx']
const { execSync } = require('child_process')

var rimraf = require('rimraf')

async function download (uri, filename) {
  return new Promise((resolve, reject) => {
    request.head(uri, (err, res, body) => {
      if (err) {
        reject(err)
        return
      }

      request(uri).pipe(fs.createWriteStream(filename)).on('close', () => {
        resolve()
      })
    })
  })
}
async function getJSON (uri) {
  return new Promise((resolve, reject) => {
    request(uri, (err, data, body) => {
      if (err) {
        reject(err)
      }
      try {
        resolve(JSON.parse(body))
      } catch {
        reject('cant parse json')
      }
    })
  })
}

async function downloadAllFilesOfDataset (dataset, folder) {
  let success = 0
  dataset.resources.forEach(async resourse => {
    const { url, title, format } = resourse
    if (!FORMATS.includes(format)) {
      return
    }
    const fileName = escapeFile(`${title}.${format}`)
    await download(url, `${folder}/${fileName}`)
    success++
  })

  return success
}

function escapeFile (str) {
  return str.replace(/(\W+)/gi, '-').substr(0, 255)
}

async function getEverythingBySlug (slug) {
  try {
    const data = await getJSON(`https://data.public.lu/api/1/datasets/?q=${slug}&page=0&page_size=50`)

    data.data.map(async dataset => {
        const { slug } = dataset
        const folderName = `datasets/${escapeFile(slug)}`
        await mkdirp(folderName)

        const hasFiles = await downloadAllFilesOfDataset(dataset, folderName)
        console.log(hasFiles)
        if (!hasFiles) {
          console.log(`removing ${__dirname}/${folderName}`)
          fs.rmdirSync(folderName, { recursive: true })
        }
        fs.writeFileSync(`${folderName}/info.json`, JSON.stringify(dataset))
      }
    )
  } catch (e) {
    console.log('Failed: ', slug)
  }
}

async function getEverything () {
  const { links } = JSON.parse(fs.readFileSync('./links.json').toString())
  const slugs = links.map(link => link.replace('https://data.public.lu/en/datasets/', '').replace(/\/$/, ''))
  await mkdirp('datasets')
  slugs.forEach(async (slug, i) => {
    await getEverythingBySlug(slug)

  })

}

getEverything()