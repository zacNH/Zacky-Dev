const axios = require('axios')
const cheerio = require('cheerio')

async function downloadTikTok(url) {
  try {
    const res = await axios.get(`https://api.tiklydown.me/api/download?url=${encodeURIComponent(url)}`)
    return res.data.data.play
  } catch (e) {
    return null
  }
}

async function downloadNHentai(code) {
  try {
    return `https://nhentai.net/g/${code}/`
  } catch (e) {
    return null
  }
}

module.exports = {
  downloadTikTok,
  downloadNHentai
                        }
