const MAX = 5

let currentConnections = 0
const fs = require('fs')
const axios = require('axios')
const queue = []
let sent = 0
const failures = []

const downloadFile = (uri, filename) => {
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
  console.log(sent)
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

const oldDownload = (uri, filename) => {
  sent++
  console.log(sent)
  axios.get(uri, { responseType: 'stream' }).then(response => {
    response.data.pipe(fs.createWriteStream(filename))
  }).catch(error => {
    console.log(error)
    failures.push({ uri, filename })
  }).finally(() => {

  })
}

const getJSON = async (uri) => {
  return axios.get(uri).then(response => {
    return response.data
  }).catch((e) => {
    console.log(e)
  })
}

module.exports = {
  downloadFile: oldDownload,
  getJSON,
  getFailures: () => failures
}