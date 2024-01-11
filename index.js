const ws = require("ws")
const express = require("express")
const crypto = require("crypto")

const app = express()

const PORT = process.env.PORT || 4321

let users = []

const wss = new ws.Server({ noServer: true })
wss.on("connection", ws => {
    let id = crypto.randomUUID()
    ws.userId = id
    ws.metadata = {}

    users.push(ws)

    ws.send(JSON.stringify({ type: "id", data: ws.userId }))

    ws.on("error", err => console.error("error", err))

    ws.on("message", message => {
        try {
            let { type, data } = JSON.parse(message)

            switch (type) {
                case "id":
                    if (!users.find(c => c.userId == data)) {
                        ws.userId = data
                        ws.send(JSON.stringify({ type: "id", data: ws.userId }))
                    }
                    break
                case "peer":
                    users.find(c => c.userId == data.id).send(JSON.stringify({ type: "peer", data: { ...data, id: ws.userId } }))
                    break

                case "data":
                    ws.metadata = data
                    break
            }
        } catch (error) {}
    })

    ws.on("close", () => (users = users.filter(c => c.userId != ws.userId)))
})

app.get("/", (req, res) => {
    const filters = req.query
    res.json(users.map(user => ({ id: user.userId, data: user.metadata })))
})

const server = app.listen(PORT)
server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, socket => {
        wss.emit("connection", socket, request)
    })
})

console.log("SERVER ON ", PORT)
