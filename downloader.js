const MAX = 5

let currentConnections = 0
const fs = require('fs')
const axios = require('axios')

const downloadFile = (uri, filename) => {
  axios.get(uri, { responseType: 'stream' }).then(response => {
    response.data.pipe(fs.createWriteStream(filename))
  }).catch(error => {
    console.log(error)
  })
}


const performOne = (uri, filename)=>{
  axios.get(uri, { responseType: 'stream' }).then(response => {
    response.data.pipe(fs.createWriteStream(filename))
  }).catch(error => {
    console.log(error)
  })
}
//downloadFile('http://www.statistiques.public.lu/stat/TableViewer/download.aspx?FldrName=2&ReportId=13381&MainTheme=4&IF_DOWNLOADFORMAT=csv&RFPath=7277&IF_DOWNLOAD_ALL_ITEMS=yes&IF_Language=fra', ' lol.csv')

module.exports = {
  downloadFile
}