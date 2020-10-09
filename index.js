const request = require('request')
const fs = require('fs')
const mkdirp = require('mkdirp')
const FORMATS = ['csv', 'xml', 'json', 'xsl', 'xslx']
var rimraf = require('rimraf')
var path = require('path')
const { downloadFile, getJSON, getFailures } = require('./downloader')
const loaded = {}
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
    //console.log('removing: ', folder)
    rimraf.sync(folder)
    return
  }
}
async function download (uri, filename) {
  if (loaded[uri]) {
    return
  }
  loaded[uri] = true
  downloadFile(uri, filename)
}

async function downloadAllFilesOfDataset (dataset, folder) {
  let success = 0
  //console.log('starting with dataset', folder)
  for (const resourse of dataset.resources) {
    const { url, title, format } = resourse
    if (!FORMATS.includes(format)) {
      return
    }
    const fileName = `${escapeFile(title)}.${format}`
    //console.log('starting with file', fileName)
    await download(url, `${folder}/${fileName}`)
    success++
    //console.log('finished with file', fileName, success)
  }

  return success
}

function escapeFile (str) {
  return str ? str.replace(/(\W+)/gi, '-').substr(0, 255) : ''
}

async function getEverythingBySlug (slug) {
  try {
    //console.log('starting with slug', slug)
    const data = await getJSON(`https://data.public.lu/api/1/datasets/?q=${slug}&page=0&page_size=50`)
    //console.log(`https://data.public.lu/api/1/datasets/?q=${slug}&page=0&page_size=50`)
    for (const dataset of data.data) {

      const { slug } = dataset
      const folderName = `datasets/${escapeFile(slug)}`
      await mkdirp(folderName)

      await downloadAllFilesOfDataset(dataset, folderName)

      fs.writeFileSync(`${folderName}/info.json`, JSON.stringify(dataset))
    }
    //console.log('finished with slug', slug)
  } catch (e) {
    //console.log('Failed: ', slug, e)
  }

}

async function getEverything () {
  const { links } = JSON.parse(fs.readFileSync('./links.json').toString())
  let slugs = links.map(link => link.replace('https://data.public.lu/en/datasets/', '').replace(/\/$/, ''))
  await mkdirp('datasets')
  for (const slug of slugs) {
    await getEverythingBySlug(slug)
  }
}

async function work () {
  try {await getEverything()} catch (e) {}
  try {removeAllEmptyFolders()} catch (e) {}
  console.log('finished')
  const failures = getFailures()
  console.log('retrying failures:', failures)
  for (const failure of failures) {
    await downloadFile(failure.uri, failure.filename)
  }
}

work()
//removeAllEmptyFolders('datasets')