import {WechatyBuilder, ScanStatus, log} from 'wechaty'
import qrTerminal from 'qrcode-terminal'
import chatgpt  from '../chatgpt/index.js'
const {sendMessage,sendImage} = chatgpt

const main = async () => {
    // 扫码
    function onScan(qrcode, status) {
        if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
            // 在控制台显示二维码
            qrTerminal.generate(qrcode, {small: true})
            const qrcodeImageUrl = ['https://api.qrserver.com/v1/create-qr-code/?data=', encodeURIComponent(qrcode)].join('')
            console.log('onScan:', qrcodeImageUrl, ScanStatus[status], status)
        } else {
            log.info('onScan: %s(%s)', ScanStatus[status], status)
        }
    }

    // 登录
    let robot = null

    function onLogin(user) {
        robot = user
        console.log(`${user} has logged in`)
        const date = new Date()
        console.log(`Current time:${date}`)
        console.log(`Automatic robot chat mode has been activated`)
    }

    // 登出
    function onLogout(user) {
        console.log(`${user} has logged out`)
    }

    // 收到好友请求
    async function onFriendShip(friendship) {
        const frienddShipRe = /chatgpt|chat/
        if (friendship.type() === 2) {
            if (frienddShipRe.test(friendship.hello())) {
                await friendship.accept()
            }
        }
    }

    let timeoutId,firstId
    const questionList = []
    let fist = true

    async function onMessage(msg) {
        const contact = msg.talker() // 发消息人
        const receiver = msg.to() // 消息接收人
        const content = msg.text() // 消息内容
        const room = msg.room() // 是否是群消息
        const self = msg.self()
        const mentionSelf = await msg.mentionSelf()
        const type = msg.type()
        // 过滤非文本和机器人的话
        // console.log(type, 666666)
        if (fist) {
            clearTimeout(firstId)
            firstId = setTimeout(() => {
                fist = false
            }, 2000)
            return
        }
        if(type !== 7 && self) {
            return
        }
        if(room && !mentionSelf ) {
            return
        }
        if(!room && !receiver) {
            return
        }
        const response = !room ? contact : room
        let loadingId = setTimeout(async () => {
            await response.say('让我思考一下...', contact)
        }, 2500)
        questionList.push({message: content.replace(`@${robot.name()}`, ''), contact, response,loadingId})
        if(questionList.length>1) {
            return
        }
        clearTimeout(timeoutId)
        timeoutId = setTimeout(async () => {
            await clearQuestionList()
        }, 100)

    }

    const clearQuestionList = async () => {
        if (!questionList.length) {
            return
        }
        const question = questionList[0]
        try {
            const message = await sendMessage(question.message)
            console.log(message)
            clearTimeout(question.loadingId)
            await question.response.say(message, question.contact)
        } catch (e) {
            console.error(e.message, 6666)
            await question.response.say('思想出了点小差，请重新发问', question.contact)
        }
        questionList.shift()
        await clearQuestionList()
    }
    const bot = WechatyBuilder.build({
        name: 'WechatEveryDay',
        // puppet: 'wechaty-puppet-wechat', // 如果有token，记得更换对应的puppet
        // puppetOptions: {
        //   head: true,
        //   uos: true,
        //   // endpoint: executablePath,
        //   launchOptions: {
        //     head: true,
        //     uos: true,
        //     executablePath: executablePath,
        //     // ... others launchOptions, see: https://github.com/GoogleChrome/puppeteer/blob/v1.18.1/docs/api.md#puppeteerlaunchoptions
        //   }
        // },
    })

    // 扫码
    bot.on('scan', onScan)
    // 登录
    bot.on('login', onLogin)
    // 登出
    bot.on('logout', onLogout)
    // 收到消息
    bot.on('message', onMessage)
    // 添加好友
    bot.on('friendship', onFriendShip)
    bot.on('error', e => {
        console.error(111, e.message)
    })
    // 启动微信机器人
    bot
        .start()
        .then(() => console.log('Start to log in wechat...'))
        .catch((e) => console.error(e))
}
await main()
