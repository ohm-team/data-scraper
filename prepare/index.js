const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const { downloadFile, getLocalJSON, getJSON, getFailures } = require('../downloader')

const FOLDER_NAME = 'processed'

const random = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const createQuestionItem = (parsedValue, whatPattern, whatPatternTotal, locationPattern) => {
  let pattern = parsedValue.isTotal ? whatPatternTotal : whatPattern
  if (parsedValue.isLocation && !!locationPattern) {
    pattern = locationPattern
  }
  const { value } = parsedValue
  const what = pattern.replace('{what}', parsedValue.what).replace('{when}', parsedValue.when).replace(/\s+/, '')
  return { what, value }
}

const processOneFile = async (vocabulary) => {
  const { path: filePath } = vocabulary
  const { values } = getLocalJSON('../' + filePath)
  return values.map(parsedValue => {
    return createQuestionItem(parsedValue, vocabulary['what-pattern'], vocabulary['what-pattern-total'], vocabulary['what-pattern-location'])
  })
}

const findPair = (itemIndex, allItems) => {
  function isEqual (val1, val2) {
    return val1 === val2
  }
  const { value } = allItems[itemIndex]
  const pairIndex = allItems.findIndex((val, i) => isEqual(val.value, value) && i !== itemIndex)
  if (pairIndex > -1) {
    return [allItems[itemIndex], allItems[pairIndex]]
  } else {
    return null
  }
}

const findAllPairs = async (items) => {
  return items.map((item, index) => findPair(index, items)).filter(t => !!t)
}

const createQuestionsPool = async (filePath = './questions.json') => {
  const { items } = getLocalJSON(`./questionItemsFlat.json`)
  function creteQuestion (pair) {
    const question = pair[0]
    const answers = new Array(3).fill(0).map(() => {
      return items[random(0, items.length - 1)]
    })

    question.correctAnswerIndex = random(0, 3)
    answers.splice(question.correctAnswerIndex, 0, pair[1])

    return { question, answers: answers.map(({ what }) => what.replace('{value}', '').replace(/\s+/, '')) }
  }

  const pairs = await findAllPairs(items)

  const allQuestions = pairs.map(pair => {
    return [creteQuestion(pair), creteQuestion(pair.reverse())]
  }).flat(1)

  fs.writeFileSync(filePath, JSON.stringify({ questions: allQuestions }))

}
const run = async (filePath, doFlatten) => {
  const { vocabulary } = getLocalJSON(`./vocabulary.json`)
  let allDataSet = {}

  for (const dataBlockTitle in vocabulary) {
    const questionItems = []

    for (const item of vocabulary[dataBlockTitle]) {
      const oneFile = await processOneFile(item)
      questionItems.push(...oneFile)
    }

    allDataSet[dataBlockTitle] = questionItems

  }
  console.log(allDataSet)
  if (doFlatten) {
    allDataSet = { items: [...Object.values(allDataSet)].flat(1) }
  }
  fs.writeFileSync(filePath, JSON.stringify(allDataSet))
}

//run(`./questionItems.json`)
//run(`./questionItemsFlat.json`, true)

createQuestionsPool()