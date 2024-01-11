const { WebSocketServer } = require("ws")

const crypto = require("crypto")

const wss = new WebSocketServer({ port: 8080 })

let clients = []

wss.on("connection", ws => {
    let id = crypto.randomBytes(4).toString("hex")
    ws.userId = id

    ws.send(JSON.stringify({ type: "id", data: ws.userId }))

    clients.push(ws)

    ws.on("error", err => {
        console.error("error", err)
    })

    ws.on("message", message => {
        try {
            let { type, data } = JSON.parse(message)

            switch (type) {
                case "peer":
                    clients.find(c => c.userId == data.id).send(JSON.stringify({ type: "peer", data: { ...data, id: ws.userId } }))
                    break
            }
        } catch (error) {}
    })

    ws.on("close", () => {
        clients = clients.filter(c => c.userId != ws.userId)
    })
})
