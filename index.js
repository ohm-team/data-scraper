const request = require('request')
const fs = require('fs')
const mkdirp = require('mkdirp')
const FORMATS = ['csv', 'xml', 'json', 'xsl', 'xslx']

async function download (uri, filename) {
  return new Promise((resolve, reject) => {
    request.head(uri, (err, res, body) => {
      console.log('content-type:', res.headers['content-type'])
      console.log('content-length:', res.headers['content-length'])
      if (err) {
        reject(err)
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
      resolve(JSON.parse(body))
    })
  })
}

async function parseDataset (dataset, folder) {
  return dataset.resources.map(async resourse => {
    const { url, title, format } = resourse
    if (!FORMATS.includes(format)) {
      return
    }
    await download(url, `${folder}/${title}.${format}`)
  })
}

async function getEverything (slug) {
  const data = await getJSON(`https://data.public.lu/api/1/datasets/?q=${slug}&page=0&page_size=50`)
  await mkdirp('datasets')
  data.data.map(async dataset => {
    const { slug } = dataset
    const folderName = `datasets/${slug}`
    await mkdirp(folderName)
    try {
      await parseDataset(dataset, folderName)
      fs.writeFileSync(`${folderName}/info.json`, JSON.stringify(dataset))
    } catch (e) {

    }
  })
}

getEverything('categories-de-permis-de-conduire-par-age-et-sexe-2016')