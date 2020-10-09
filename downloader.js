const MAX = 5

let currentConnections = 0
const fs = require('fs')
const axios = require('axios')
const queue = []
let sent = 0
const failures = []

const downloadFile = (uri, filename) => {
  if((fs.existsSync(filename))){
    return
  }
  queue.push({ uri, filename })
  getNext()
}

const getNext = () => {
  if (queue.length && currentConnections < MAX) {
    const { uri, filename } = queue.pop()
    performOne(uri, filename)
  }
}
const performOne = (uri, filename) => {
  currentConnections++
  sent++
  console.log("Sent requests:", sent)
  return axios.get(uri, { responseType: 'stream' }).then(response => {
    response.data.pipe(fs.createWriteStream(filename))
  }).catch(error => {
    console.log('requies failed for ', uri)
    failures.push({ uri, filename })
  }).finally(() => {
    currentConnections--
    getNext()
  })
}


const getJSON = async (uri) => {
  return axios.get(uri).then(response => {
    return response.data
  }).catch((e) => {
    console.log(e)
    failures.push({ uri, filename })
  })
}

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

  if (files.length === 1 || files.length === 0) {
    //console.log('removing: ', folder)
    rimraf.sync(folder)
    return
  }
}
module.exports = {
  downloadFile: downloadFile,
  removeAllEmptyFolders,
  getJSON,
  getFailures: () => failures
}