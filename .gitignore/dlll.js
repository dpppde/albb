clearMessages = function (guild_id, author_id, authToken) {
    /*
     * Dear Discord,
     *     I'm sorry to hear that you think your users are idiots;
     * although, I suppose that's fair since Discord is literally
     * TeamSpeak+IRC for people who don't know what SSH is.
     *                                              Best wishes.
     * P.S.: Bad third-parties? get a grip on your monetization then? Lol
     */
    const searchURL = `https://discordapp.com/api/v6/guilds/${guild_id}/messages/search?author_id=${author_id}`
    const headers = { Authorization: authToken }
    let clock = 0
    interval = 500
    let messagesStore = []
    function delay(duration) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, duration)
        })
    }
    function loadMessages() {
        return fetch(searchURL, { headers })
    }
    function tryDeleteMessage(message) {
        if (message.author.id == author_id) {       
            console.log(`Deleting message ${message.id} from ${message.author.username} (${message.content.substring(0, 30)}...)`)
            return fetch(`https://discordapp.com/api/v6/channels/${message.channel_id}/messages/${message.id}`, { headers, method: 'DELETE' })
        }
    }
    function onlyNotDeleted(message) {
        return message.deleted === false
    }

    loadMessages()
        .then(resp => resp.json())
        .then(messages => {
            messages = messages.messages.map(context => context[2])

            if (messages === null || messages.length === 0) {
                console.log(`We have loaded all messages in this chat.`)           
                return
            }
            beforeId = messages[messages.length-1].id
            messages.forEach(message => { message.deleted = false })
            messagesStore = messagesStore.concat(messages)
            return Promise.all(messagesStore.filter(onlyNotDeleted).map(message => {
                return delay(clock += interval)
                    .then(() => tryDeleteMessage(message))
                    .then(resp => {
                        if (resp) {
                            if (resp.status == 429) {
                                interval += 10
                                console.log(`Too fast; bumping interval to ${interval}`)
                            } else if (resp.status === 204) {
                                message.deleted = true
                                return resp.text()
                            }
                        }
                    })
            }))
        })
        .then(function() {
            if (messagesStore.length !== 0 && messagesStore.length < 100) {
                clearMessages(guild_id, author_id, authToken)
            } else {
                console.log(`Done.`)
            }
        })
}
var authToken = JSON.parse(document.body.appendChild(document.createElement`iframe`).contentWindow.localStorage.token)
clearMessages('407171723419713537', '412788723466633217', authToken)
