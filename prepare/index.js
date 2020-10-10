const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const { downloadFile, getLocalJSON, getJSON, getFailures } = require('../downloader')

const FOLDER_NAME = 'processed'

const createQuestionItem = (parsedValue, whatPattern, whatPatternTotal, locationPattern) => {
  let pattern = parsedValue.isTotal ? whatPatternTotal : whatPattern
  if (parsedValue.isLocation && !!locationPattern) {
    pattern = locationPattern
  }
  const { value } = parsedValue
  const what = pattern.replace('{what}', parsedValue.what).replace('{when}', parsedValue.when)
  return { what, value }
}

const processOneFile = async (vocabulary) => {
  const { path: filePath } = vocabulary
  const { values } = getLocalJSON('../' + filePath)
  return values.map(parsedValue => {
    return createQuestionItem(parsedValue, vocabulary['what-pattern'], vocabulary['what-pattern-total'], vocabulary['what-pattern-location'])
  })
}

const run = async () => {
  const { vocabulary } = getLocalJSON(`./vocabulary.json`)
  const allDataSet = {}

  for (const dataBlockTitle in vocabulary) {
    const questionItems = []

    for (const item of vocabulary[dataBlockTitle]) {
      const oneFile = await processOneFile(item)
      questionItems.push(...oneFile)
    }

    allDataSet[dataBlockTitle] = questionItems
  }
  console.log(allDataSet)
  fs.writeFileSync(`./questionItems.json`, JSON.stringify(allDataSet ))
}

run()