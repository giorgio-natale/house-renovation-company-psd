const http = require('http');
const express = require("express");
const { initialize } = require('@oas-tools/core');


const serverPort = process.env.npm_config_SERVER_PORT ?? 3000;
global.__baseUrl = "http://localhost:" + serverPort;

const app = express();
app.use(express.json({limit: '50mb'}));

const config = {}



initialize(app, config).then(() => {
    config.server = http.createServer(app).listen(serverPort, () => {
    console.log("\nApp running at http://localhost:" + serverPort);
    console.log("________________________________________________________________");
    if (!config?.middleware?.swagger?.disable) {
        console.log('API docs (Swagger UI) available on http://localhost:' + serverPort + '/docs');
        console.log("________________________________________________________________");
    }
    });

    app.get('/health', (req, res) => {
        res
        .set({ 'content-type': 'application/json; charset=utf-8' })
        .status(200)
        .send();
    })
    app.delete('/health', (req, res) => {
        console.log("Request for closing server");
        setTimeout(() => {
            console.log("[ACTUALLY CLOSING...]]")
            config.server.close()
            console.log("[CLOSED...]]")
            process.exit(0);
        }, 1000);
        res
        .set({ 'content-type': 'application/json; charset=utf-8' })
        .status(200)
        .send();
    })
});
