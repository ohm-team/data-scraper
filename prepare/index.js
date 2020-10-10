const fs = require('fs')
const mkdirp = require('mkdirp')
const { downloadFile, getLocalJSON, getJSON, getFailures } = require('../downloader')

const FOLDER_NAME = 'processed'

const processOneFile = async (vocabulary) => {
  const { path } = vocabulary
  const { vocabulary } = getLocalJSON(`./vocabulary.json`)
}

const run = async () => {
  const { vocabulary } = getLocalJSON(`./vocabulary.json`)
  console.log(vocabulary)
  for (const item of vocabulary) {
    await processOneFile(item)
  }
}

run()