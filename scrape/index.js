const fs = require('fs')
const mkdirp = require('mkdirp')
const { downloadFile, removeAllEmptyFolders, getJSON, getFailures } = require('../downloader')

const FORMATS = ['csv', 'xml', 'json', 'xsl', 'xlsx']
const FOLDER_NAME = 'datasets'

async function downloadAllFilesOfDataset (dataset, folder) {
  for (const resourse of dataset.resources) {
    const { url, title, format } = resourse
    if (!FORMATS.includes(format)) {
      return
    }
    const fileName = `${escapeFile(title)}.${format}`
    await downloadFile(url, `${folder}/${fileName}`)
  }
}

function escapeFile (str) {
  return str ? str.replace(/(\W+)/gi, '-').substr(0, 255) : ''
}

async function getEverythingBySlug (slug) {
  try {
    const data = await getJSON(`https://data.public.lu/api/1/datasets/?q=${slug}&page=0&page_size=50`)
    for (const dataset of data.data) {

      const { slug } = dataset
      const folderName = `${FOLDER_NAME}/${escapeFile(slug)}`
      await mkdirp(folderName)

      await downloadAllFilesOfDataset(dataset, folderName)

      fs.writeFileSync(`${folderName}/info.json`, JSON.stringify(dataset))
    }
  } catch (e) {

  }

}

async function getEverything () {
  const { links } = JSON.parse(fs.readFileSync('./links.json').toString())
  let slugs = links.map(link => link.replace('https://data.public.lu/en/datasets/', '').replace(/\/$/, ''))
  //slugs = ['accidents-accidents-corporels-de-circulation-routiere']
  await mkdirp(FOLDER_NAME)
  for (const slug of slugs) {
    await getEverythingBySlug(slug)
  }
}

async function work () {
  try {await getEverything()} catch (e) {}
  //try {removeAllEmptyFolders(FOLDER_NAME)} catch (e) {}
  console.log('finished')
  const failures = getFailures()
  console.log('retrying failures:', failures)
  for (const failure of failures) {
    await downloadFile(failure.uri, failure.filename)
  }
}

work()
