const { default: makeWASocket, useSingleFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const fs = require('fs-extra')
const P = require('pino')
const menu = require('./menu')
const config = require('./config')
const { downloadTikTok, downloadNHentai } = require('./lib/downloader')

const { state, saveState } = useSingleFileAuthState('./session.json')

async function start() {
  const sock = makeWASocket({
    version: await fetchLatestBaileysVersion(),
    printQRInTerminal: false,
    auth: state,
    logger: P({ level: 'silent' })
  })

  sock.ev.on('creds.update', saveState)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr, pairingCode } = update

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('Connection closed. Reconnecting...', shouldReconnect)
      if (shouldReconnect) start()
    } else if (connection === 'open') {
      console.log('✅ Bot connected')
    } else if (pairingCode) {
      console.log(`🔐 Masukkan kode pairing ini di WhatsApp Web: ${pairingCode}`)
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return
    const m = msg.message.conversation || msg.message.extendedTextMessage?.text
    const sender = msg.key.remoteJid

    if (!m) return

    if (m.toLowerCase() === 'menu') {
      await sock.sendMessage(sender, { text: menu() })
    }

    if (m.startsWith('tiktok ')) {
      const url = m.split(' ')[1]
      const videoUrl = await downloadTikTok(url)
      if (videoUrl) {
        await sock.sendMessage(sender, { video: { url: videoUrl }, caption: "Berikut video TikToknya 🎵" })
      } else {
        await sock.sendMessage(sender, { text: "Gagal mengambil video TikTok." })
      }
    }

    if (m.startsWith('nhentai ')) {
      const code = m.split(' ')[1]
      const nhentaiUrl = await downloadNHentai(code)
      if (nhentaiUrl) {
        await sock.sendMessage(sender, { text: `🔞 Doujinmu: ${nhentaiUrl}` })
      } else {
        await sock.sendMessage(sender, { text: "Gagal mengambil link dari kode nHentai." })
      }
    }
  })
}

start()
