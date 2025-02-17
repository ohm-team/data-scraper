const fs = require('fs')
const { getAllFilePaths, getLocalJSON } = require('../downloader')

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
const trim = (str)=>{
  return str.replace(/\s+/g, ' ').trim()
}
const createQuestionRough = (parsedValue, description) => {
  const ifFrench = process.env.LOCALE === 'fr'
  const { value, when, what } = parsedValue

  if (ifFrench) {
    const whatStatistics = trim(`${description} statistiques pour ${when}:`)
    const whatValue = trim(`${what} montant est {value}`)

    const answerValue = trim(`${what} montant en ${when}`)
    const answerStatistics = trim(`par les statistiques ${description}`)
    return { whatStatistics, whatValue, answerValue, answerStatistics, value }
  }

  const whatStatistics = trim(`${description} statistics for year ${when}:`)
  const whatValue = `${what} amount is {value}`

  const answerValue = trim(`${what} amount in ${when}`)
  const answerStatistics = trim(`by ${description} statistics`)

  return { whatStatistics, whatValue, answerValue, answerStatistics, value }
}

const processOneFile = async (vocabulary, usePatterns) => {
  const { path: filePath } = vocabulary
  const { values, url, table_description, tags = [] } = getLocalJSON(filePath)

  return (values || []).map(parsedValue => {
    let item
    if (usePatterns) {
      item = createQuestionItem(parsedValue, vocabulary['what-pattern'], vocabulary['what-pattern-total'], vocabulary['what-pattern-location'])
    } else {
      item = createQuestionRough(parsedValue, table_description)
    }

    item.url = url
    item.tags = tags
    return item
  })
}

const findPair = (itemIndex, allItems) => {
  function isEqual (val1, val2) {
    return val1 === val2
  }
  const { value, url } = allItems[itemIndex]
  const pairIndex = allItems.findIndex((val, i) => val.url !== url && isEqual(val.value, value) && i !== itemIndex)
  if (pairIndex > -1) {
    return [allItems[itemIndex], allItems[pairIndex]]
  } else {
    return null
  }
}

const findAllPairs = async (items) => {
  return items.map((item, index) => findPair(index, items)).filter(t => !!t)
}

const createQuestionsPool = async (json, questionsFileName = 'questions.json') => {
  const filePath = `${FOLDER_NAME}/${questionsFileName}`
  const { items } = json || getLocalJSON(`${FOLDER_NAME}/questionItemsFlat.json`)

  function creteQuestion (pair) {
    const question = pair[0]
    const answers = new Array(3).fill(0).map(() => {
      return items[random(0, items.length - 1)]
    })

    question.correctAnswerIndex = random(0, 3)
    question.answerUrl = pair[1].url
    question.answerTags = pair[1].tags
    answers.splice(question.correctAnswerIndex, 0, pair[1])

    return {
      question,
      answers: answers.map(({ answerValue, answerStatistics }) => (
        { answerValue: answerValue.replace('{value}', ''), answerStatistics }))
    }
  }

  const pairs = await findAllPairs(items)

  const allQuestions = pairs.map(pair => {
    return creteQuestion(pair)
  })

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

const getRoughQuestionItems = async (processedFolder = 'processed', filePath, writeToFile) => {
  const allFilePaths = await getAllFilePaths(processedFolder)

  let allDataSet = []

  for (const path of allFilePaths) {
    const oneFile = await processOneFile({ path }, false)
    allDataSet.push(...oneFile)
  }

  if (writeToFile) {
    fs.writeFileSync(filePath, JSON.stringify({ items: allDataSet }))
  }
  return { items: allDataSet }
}

const generateQuestionSetFromProcessedFiles = async (processedFolder, questionsFileName) => {
  const json = await getRoughQuestionItems(processedFolder, `${FOLDER_NAME}/questionItemsFlat.json`, false)
  await createQuestionsPool(json, questionsFileName)
}

generateQuestionSetFromProcessedFiles(process.env.PROCESSED_FOLDER, process.env.OUTPUT)