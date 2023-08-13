import http from "http";
import express, { response } from "express";
import { initialize } from "@oas-tools/core";
import axios from "axios";
import { Client, logger, Variables } from 'camunda-external-task-client-js';

import { thirdParties, getNextVal, electriciansQuotationsStatus } from "./shared/shared.js";

const serverPort = 9000;
const app = express();
app.use(express.json({limit: '50mb'}));

const config = { baseUrl: 'http://localhost:8080/engine-rest', use: logger, asyncResponseTimeout: 10000 };

//TODO: set lock duration to a lot (>1h)
const camundaClient = new Client(config);
const lockDurationMillis = 60 * 60 * 1000;
const weekTimeoutMillis = 300000;


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
        console.log("[REQUEST FOR CLOSING]")
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

    camundaClient.subscribe('plumbers-quotation-exchange', async function({ task, taskService }) {
        await taskService.extendLock(task, lockDurationMillis);
        let weekTimeoutExpired = false;
        let weekTimeout = setTimeout(() => {
            weekTimeoutExpired = true;
        }, weekTimeoutMillis);
        console.log("Sto contattando i plumbers ( task id '" + task.id + "')");
        let rfqs = {};

        let activities = JSON.parse(task.variables.get('activities'));
        let items = activities.plumber.items;

        thirdParties["plumbers"].forEach(plumberId => {
            let rfqIdNum = getNextVal();
            let rfqNumber = "RFQ" + rfqIdNum;
            rfqs[rfqNumber] = {plumberId:plumberId, response: null};

            let postRequest = {
                "rfqNumber": rfqNumber,
                "customerContact": {
                  "name": "householder",
                  "address": "my address",
                  "phoneNumber": "03512345678",
                  "emailAddress": "myEmailAddress"
                },
                "renovationCompanyContact": {
                  "name": "Acme Corp",
                  "address": "Fairfield, New Jersey",
                  "phoneNumber": "39212345678",
                  "emailAddress": "acme-corp@acme.com"
                },
                "site": {
                  "address": "my address",
                  "squareMeters": 127,
                  "constructionYear": "1999"
                },
                "items": items,
                "estimatedStartDate": "2023-04-18",
                "waterPoints": 15
            };


            axios({
                method: "post",
                url: "http://localhost:"+ plumberId + "/rfq",
                data: postRequest
            }).then((res) => {
            }).catch((err) => {
                console.log("Failed to post an rfq to plumber #" + plumberId);
                console.log(err);
            });
            
        });
        

        let pollingTimer = setInterval(async () => {
            if(!weekTimeoutExpired){
                Object.entries(rfqs).forEach(([rfqNumber, value])=>{
                    if (value.response === null){
                        axios({
                            method: "get",
                            url: "http://localhost:"+ value.plumberId + "/rfq/" + rfqNumber + "/quotation",
                        }).then((res) => {
                            if(res.status != 202){
                                value.response = res.data;
                            }
                        }).catch((err) => {
                            console.log("Failed to get an rfq to plumber #" + plumberId);
                            console.log(err);
                        });
                    }
                });
                if(!Object.entries(rfqs).some(([rfqNumber, value]) => {return value.response === null})){
                    let processVariables = new Variables().set("plumbersQuotations", JSON.stringify(rfqs));
                    await taskService.complete(task, processVariables);
                    clearInterval(pollingTimer);
                    clearTimeout(weekTimeout);
                }
            }else{
                console.log("A week has expired!");
                let processVariables = new Variables().set("plumbersQuotations", JSON.stringify(rfqs));
                await taskService.complete(task, processVariables);
                clearInterval(pollingTimer);
                clearTimeout(weekTimeout);
            }

        }, 1000);

    });

    camundaClient.subscribe('electricians-quotation-exchange', async function({ task, taskService }) {
        console.log("Sto contattando gli electricians ( task id '" + task.id + "')");

        await taskService.extendLock(task, lockDurationMillis);

        let processContext = {task: task, taskService: taskService, rfqs: {}, weekTimeoutExpired: false}

        setTimeout(() => {
            processContext.weekTimeoutExpired = true;
        }, weekTimeoutMillis);

        let rfqs = {};

        let activities = JSON.parse(task.variables.get('activities'));
        let items = activities.electrician.items;

        thirdParties["electricians"].forEach(electricianId => {
            let rfqIdNum = getNextVal();
            let rfqNumber = "RFQ" + rfqIdNum;

            rfqs[rfqNumber] = {electricianId: electricianId, response: null};

            let postRequest = {
                "rfq": {
                    "rfqNumber": rfqNumber,
                    "customerContact": {
                        "name": "householder",
                        "address": "my address",
                        "phoneNumber": "03512345678",
                        "emailAddress": "myEmailAddress"
                    },
                    "renovationCompanyContact": {
                        "name": "Acme Corp",
                        "address": "Fairfield, New Jersey",
                        "phoneNumber": "39212345678",
                        "emailAddress": "acme-corp@acme.com"
                    },
                    "site": {
                        "address": "my address",
                        "squareMeters": 127,
                        "constructionYear": "1999"
                    },
                    "items": items,
                    "estimatedStartDate": "2023-04-18",
                    "lightPoints": 15
                },
                "callbackUrl": "http://localhost:9000/rfq/" + rfqNumber + "/quotation"
            }


            axios({
                method: "post",
                url: "http://localhost:"+ electricianId + "/rfq",
                data: postRequest
            }).then((res) => {
            }).catch((err) => {
                console.log("Failed to post an rfq to electrician #" + electricianId);
                console.log(err);
            });
            
        });

        electriciansQuotationsStatus.push({...processContext, rfqs: rfqs});
    });

    camundaClient.subscribe('constructors-quotation-exchange', async function({ task, taskService }) {
        console.log("Sto contattando i constructors ( task id '" + task.id + "')");
        await taskService.extendLock(task, lockDurationMillis);
        let weekTimeoutExpired = false;
        let weekTimeout = setTimeout(() => {
            weekTimeoutExpired = true;
        }, weekTimeoutMillis);
        let rfqs = {};

        let activities = JSON.parse(task.variables.get('activities'));
        let items = activities.constructor.items;

        thirdParties["constructors"].forEach(constructorId => {
            if(!weekTimeoutExpired){
                let rfqIdNum = getNextVal();
                let rfqNumber = "RFQ" + rfqIdNum;
                rfqs[rfqNumber] = {constructorId:constructorId, response: null};

                let postRequest = {
                    "rfqNumber": rfqNumber,
                    "customerContact": {
                    "name": "householder",
                    "address": "my address",
                    "phoneNumber": "03512345678",
                    "emailAddress": "myEmailAddress"
                    },
                    "renovationCompanyContact": {
                    "name": "Acme Corp",
                    "address": "Fairfield, New Jersey",
                    "phoneNumber": "39212345678",
                    "emailAddress": "acme-corp@acme.com"
                    },
                    "site": {
                    "address": "my address",
                    "squareMeters": 127,
                    "constructionYear": "1999"
                    },
                    "items": items,
                    "estimatedStartDate": "2023-04-18"
                }


                axios({
                    method: "post",
                    url: "http://localhost:"+ constructorId + "/rfq",
                    data: postRequest
                }).then(async (res) => {
                    rfqs[rfqNumber].response = res.data;
                    if(!Object.entries(rfqs).some(([rfqNumber, value]) => {return value.response === null})){
                        let processVariables = new Variables().set("constructorsQuotations", JSON.stringify(rfqs));
                        await taskService.complete(task, processVariables);
                        clearTimeout(weekTimeout);
                    }
                }).catch((err) => {
                    console.log("Failed to post an rfq to constructor #" + constructorId);
                    console.log(err);
                });
            }
            
        });
    });

});
