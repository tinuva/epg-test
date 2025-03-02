const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'vidio.com',
  days: 2,
  url({ channel }) {
    return `https://www.vidio.com/live/${channel.site_id}/schedules`
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      let start = parseStart($item, date)
      if (prev && start.isBefore(prev.start)) {
        start = start.add(1, 'd')
        date = date.add(1, 'd')
      }
      let stop = parseStop($item, date)
      if (stop.isBefore(start)) {
        stop = stop.add(1, 'd')
        date = date.add(1, 'd')
      }
      programs.push({
        title: parseTitle($item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart($item, date) {
  const timeString = $item('div.b-livestreaming-daily-schedule__item-content-caption').text()
  const [_, start] = timeString.match(/(\d{2}:\d{2}) -/) || [null, null]
  const dateString = `${date.format('YYYY-MM-DD')} ${start}`

  return dayjs.tz(dateString, 'YYYY-MM-DD HH:mm', 'Asia/Jakarta')
}

function parseStop($item, date) {
  const timeString = $item('div.b-livestreaming-daily-schedule__item-content-caption').text()
  const [_, stop] = timeString.match(/- (\d{2}:\d{2}) WIB/) || [null, null]
  const dateString = `${date.format('YYYY-MM-DD')} ${stop}`

  return dayjs.tz(dateString, 'YYYY-MM-DD HH:mm', 'Asia/Jakarta')
}

function parseTitle($item) {
  return $item('div.b-livestreaming-daily-schedule__item-content-title').text()
}

function parseItems(content, date) {
  const $ = cheerio.load(content)

  return $(
    `#schedule-content-${date.format(
      'YYYYMMDD'
    )} > .b-livestreaming-daily-schedule__scroll-container .b-livestreaming-daily-schedule__item`
  ).toArray()
}
