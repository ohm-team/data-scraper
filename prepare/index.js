const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const { downloadFile, getAllFilePaths, getLocalJSON, getJSON, getFailures } = require('../downloader')

const FOLDER_NAME = 'prepare'

const random = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const createQuestionItem = (parsedValue, whatPattern, whatPatternTotal, locationPattern) => {
  let pattern = parsedValue.isTotal ? whatPatternTotal : whatPattern
  if (parsedValue.isLocation && !!locationPattern) {
    pattern = locationPattern
  }
  const { value } = parsedValue
  const what = pattern.replace('{what}', parsedValue.what).replace('{when}', parsedValue.when).replace(/\s+/g, ' ').trim()
  return { what, value }
}

const createQuestionRough = (parsedValue, description) => {
  const { value, when, what } = parsedValue
  const whatStatistics = `${description} statistics for ${when} year:`.replace(/\s+/g, ' ').trim()
  const whatValue = `${what} amount is {value}`

  const answerValue = `${what} amount in ${when}`.replace(/\s+/g, ' ').trim()
  const answerStatistics = `by ${description} statistics`.replace(/\s+/g, ' ').trim()

  return { whatStatistics, whatValue, answerValue, answerStatistics, value }
}

const processOneFile = async (vocabulary, usePatterns) => {
  const { path: filePath } = vocabulary
  // todo: add url to processed data
  const { values, path: url, table_description } = getLocalJSON(filePath)
  return values.map(parsedValue => {
    let item
    if (usePatterns) {
      item = createQuestionItem(parsedValue, vocabulary['what-pattern'], vocabulary['what-pattern-total'], vocabulary['what-pattern-location'])
    } else {
      item = createQuestionRough(parsedValue, table_description)
    }

    item.url = url
    return item
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

const createQuestionsPool = async (filePath = `${FOLDER_NAME}/questions.json`) => {
  const { items } = getLocalJSON(`${FOLDER_NAME}/questionItemsFlat.json`)

  function creteQuestion (pair) {
    const question = pair[0]
    const answers = new Array(3).fill(0).map(() => {
      return items[random(0, items.length - 1)]
    })

    question.correctAnswerIndex = random(0, 3)
    question.answerUrl = pair[1].url

    answers.splice(question.correctAnswerIndex, 0, pair[1])

    return {
      question,
      answers: answers.map(({ answerValue, answerStatistics }) => (
        { answerValue: answerValue.replace('{value}', ''), answerStatistics }))
    }
  }

  const pairs = await findAllPairs(items)

  const allQuestions = pairs.map(pair => {
    return [creteQuestion(pair), creteQuestion(pair.reverse())]
  }).flat(1)

  fs.writeFileSync(filePath, JSON.stringify({ questions: allQuestions }))
}

const getQuestionItems = async (filePath, usePatterns, doFlatten) => {
  const { vocabulary } = getLocalJSON(`${FOLDER_NAME}/vocabulary.json`)
  let allDataSet = {}

  for (const dataBlockTitle in vocabulary) {
    const questionItems = []

    for (const item of vocabulary[dataBlockTitle]) {
      const oneFile = await processOneFile(item, usePatterns)
      questionItems.push(...oneFile)
    }

    allDataSet[dataBlockTitle] = questionItems

  }

  if (doFlatten) {
    allDataSet = { items: [...Object.values(allDataSet)].flat(1) }
  }
  fs.writeFileSync(filePath, JSON.stringify(allDataSet))
}

const getRoughQuestionItems = async (filePath) => {
  const allFilePaths = await getAllFilePaths('processed')
  let allDataSet = []

  for (const path of allFilePaths) {
    const oneFile = await processOneFile({ path }, false)
    allDataSet.push(...oneFile)
  }

  fs.writeFileSync(filePath, JSON.stringify({ items: allDataSet }))
}

//getQuestionItems(`${FOLDER_NAME}/questionItems.json`, true)
//getQuestionItems(`${FOLDER_NAME}/questionItemsFlat.json`, true, true)
//getRoughQuestionItems(`${FOLDER_NAME}/questionItemsFlat.json`)
createQuestionsPool()