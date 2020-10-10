const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const { downloadFile, getLocalJSON, getJSON, getFailures } = require('../downloader')

const FOLDER_NAME = 'processed'

const createQuestionItem = (parsedValue, whatPattern, whatPatternTotal) => {
  let pattern = parsedValue.isTotal ? whatPatternTotal : whatPattern
  const { value } = parsedValue
  const what = pattern.replace('{what}', parsedValue.what).replace('{when}', parsedValue.when)
  return { what, value }
}

const processOneFile = async (vocabulary) => {
  const { path: filePath } = vocabulary
  const { values } = getLocalJSON('../' + filePath)
  return values.map(parsedValue => {
    return createQuestionItem(parsedValue, vocabulary['what-pattern'], vocabulary['what-pattern-total'])
  })
}

const run = async () => {
  const { vocabulary } = getLocalJSON(`./vocabulary.json`)
  const questionItems = []
  for (const item of vocabulary) {
    const oneFile = await processOneFile(item)
    questionItems.push(...oneFile)
  }
  console.log(questionItems)
  fs.writeFileSync(`./questionItems.json`, JSON.stringify({questionItems}))
}

run()