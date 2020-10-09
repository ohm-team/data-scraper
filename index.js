const request = require('request')
const fs = require('fs')
const mkdirp = require('mkdirp')
const FORMATS = ['csv', 'xml', 'json', 'xsl', 'xslx']
var rimraf = require('rimraf')
var path = require('path')

function removeAllEmptyFolders (folder) {
  var isDir = fs.statSync(folder).isDirectory()
  if (!isDir) {
    return
  }
  var files = fs.readdirSync(folder)
  if (files.length > 0) {
    files.forEach(function (file) {
      var fullPath = path.join(folder, file)
      removeAllEmptyFolders(fullPath)
    })

    files = fs.readdirSync(folder)
  }

  if (files.length == 1 || files.length == 0) {
    console.log('removing: ', folder)
    rimraf.sync(folder)
    return
  }
}
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
    request({ uri, timeout: 5000 }, (err, data, body) => {
      if (err) {
        resolve()
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
  console.log('starting with dataset', folder)
  for (const resourse of dataset.resources) {
    const { url, title, format } = resourse
    if (!FORMATS.includes(format)) {
      return
    }
    const fileName = `${escapeFile(title)}.${format}`
    console.log('starting with file', fileName)
    await download(url, `${folder}/${fileName}`)
    success++
    console.log('finished with file', fileName, success)
  }

  return success
}

function escapeFile (str) {
  return str ? str.replace(/(\W+)/gi, '-').substr(0, 255) : ''
}

async function getEverythingBySlug (slug) {
  try {
    console.log('starting with slug', slug)
    const data = await getJSON(`https://data.public.lu/api/1/datasets/?q=${slug}&page=0&page_size=50`)
    for (const dataset of data.data) {

      const { slug } = dataset
      const folderName = `datasets/${escapeFile(slug)}`
      await mkdirp(folderName)

      await downloadAllFilesOfDataset(dataset, folderName)

      fs.writeFileSync(`${folderName}/info.json`, JSON.stringify(dataset))
    }
    console.log('finished with slug', slug)
  } catch (e) {
    console.log('Failed: ', slug, e)
  }

}

async function getEverything () {
  const { links } = JSON.parse(fs.readFileSync('./links.json').toString())
  let slugs = links.map(link => link.replace('https://data.public.lu/en/datasets/', '').replace(/\/$/, ''))

  rimraf.sync('datasets')
  await mkdirp('datasets')
  for (const slug of slugs) {
    await getEverythingBySlug(slug)
  }
}

async function runSeq () {
  await asyncThingsToDo.reduce(
    (p, spec) => p.then(() => runTask(spec).then(log)),
    starterPromise
  )
}

async function work () {
  try {
    await getEverything()
  } catch (e) {

  }
  removeAllEmptyFolders('datasets')
  console.log('finished')
}

work()
//removeAllEmptyFolders('datasets')