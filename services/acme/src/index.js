
import http from "http";
import express from "express";
import { initialize } from "@oas-tools/core";
import axios from "axios";
import { Client, logger } from 'camunda-external-task-client-js';

import { thirdParties } from "./shared/shared.js";


const serverPort = 9000;
const app = express();
app.use(express.json({limit: '50mb'}));

const config = { baseUrl: 'http://localhost:8080/engine-rest', use: logger, asyncResponseTimeout: 10000 };

//TODO: set lock duration to a lot (>1h)
const camundaClient = new Client(config);


initialize(app, config).then(() => {
    http.createServer(app).listen(serverPort, () => {
    console.log("\nApp running at http://localhost:" + serverPort);
    console.log("________________________________________________________________");
    if (!config?.middleware?.swagger?.disable) {
        console.log('API docs (Swagger UI) available on http://localhost:' + serverPort + '/docs');
        console.log("________________________________________________________________");
    }
    });

    camundaClient.subscribe('plumbers-quotation-exchange', async function({ task, taskService }) {
        console.log("Sto contattando i plumbers ( task id '" + task.id + "')");
        await taskService.complete(task);
    });

    camundaClient.subscribe('electricians-quotation-exchange', async function({ task, taskService }) {
        console.log("Sto contattando gli electricians ( task id '" + task.id + "')");
        await taskService.complete(task);
    });

    camundaClient.subscribe('constructors-quotation-exchange', async function({ task, taskService }) {
        console.log("Sto contattando i constructors ( task id '" + task.id + "')");
        setTimeout(async () => {
            await taskService.complete(task);
        }, 100);
    });


});
