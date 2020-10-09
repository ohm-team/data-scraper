const puppeteer = require('puppeteer')
const request = require('request')
const cliProgress = require('cli-progress')
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
const fs = require('fs')
async function getAllLinks (page) {

  return await page.evaluate(() => {

    function trim (s) {
      return s.trim().replace(/\s\n+/g, '').replace(/ +/g, ' ')
    }

    const cards = [...document.querySelectorAll('.resource-card')]
    return cards.map(card => {
      try {
        const title = trim(card.querySelector('.card-body').textContent)
        const format = trim(card.querySelector('.card-footer li:first-child').textContent)
        if (format === 'csv') {
          return {
            href: card.querySelector('a').href,
            title,
            format
          }
        }
      } catch {
        return card
      }

    }).filter(t => !!t)

  })
}

function trim (s) {
  return s.trim().replace(/\s\n+/g, '').replace(/ +/g, ' ')
}

async function getElementText (page, selector) {
  return trim(await page.evaluate(el => el.textContent, await page.$(selector)))
}

function download (uri, filename, callback) {
  request.head(uri, (err, res, body) => {
    console.log('content-type:', res.headers['content-type'])
    console.log('content-length:', res.headers['content-length'])

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback)
  })

}

async function run () {
  const browser = await puppeteer.launch({ timeout: 0 })
  const page = await browser.newPage()

  await page.goto('https://data.public.lu/en/datasets/securite-sociale-prestations-familiales', { waitUntil: 'networkidle2' })
  await page.screenshot({ path: 'screen.png' })
  const pageTitle = await getElementText(page, '.page-header')
  const pageDescription = await getElementText(page, '.page-header+.row')
  //bar1.start(1);

  const links = await getAllLinks(page)
  console.log(links)

  download(links[0].href, links[0].title + '.' + links[0].format, () => {
    console.log('done')
  })
  //bar1.update(1);
  //bar1.stop();
  await browser.close()
}

run()