const fs = require('fs')
const mkdirp = require('mkdirp')
const { downloadFile, removeAllEmptyFolders, getJSON, getFailures } = require('../downloader')

const FOLDER_NAME = 'processed'

removeAllEmptyFolders(FOLDER_NAME)