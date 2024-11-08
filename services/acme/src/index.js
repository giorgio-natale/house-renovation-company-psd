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
const weekTimeoutMillis = 15000;
const optimisticLockDelay = 200;


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
            console.log("[PLUMBERS]: A week has expired!");
            weekTimeoutExpired = true;
        }, weekTimeoutMillis);
        console.log("Exchanging quotation with plumbers...");
        let rfqs = {};

        let activities = JSON.parse(task.variables.get('activities'));
        let items = activities.plumber.items;

        let customerContact = JSON.parse(task.variables.get('customerContact'));
        let site = JSON.parse(task.variables.get('site'));    

        thirdParties["plumbers"].forEach(plumberId => {
            let rfqIdNum = getNextVal();
            let rfqNumber = "RFQ" + rfqIdNum;
            rfqs[rfqNumber] = {plumberId:plumberId, response: null};

            let postRequest = {
                "rfqNumber": rfqNumber,
                "customerContact": customerContact,
                "renovationCompanyContact": {
                  "name": "Acme Corp",
                  "address": "Fairfield, New Jersey",
                  "phoneNumber": "39212345678",
                  "emailAddress": "acme-corp@acme.com"
                },
                "site": site,
                "items": items,
                "estimatedStartDate": new Date().toJSON().slice(0, 10),
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
                            console.log("Failed to get an rfq to plumber #" + value.plumberId);
                            console.log(err);
                        });
                    }
                });
                if(!Object.entries(rfqs).some(([rfqNumber, value]) => {return value.response === null})){
                    setTimeout(async () => {
                        let processVariables = new Variables().set("plumbersQuotations", JSON.stringify(rfqs));
                        await taskService.complete(task, processVariables);
                        clearInterval(pollingTimer);
                        clearTimeout(weekTimeout);
                    }, optimisticLockDelay * 2);
                }
            }else{
                setTimeout(async () => {
                    let processVariables = new Variables().set("plumbersQuotations", JSON.stringify(rfqs));
                    await taskService.complete(task, processVariables);
                    clearInterval(pollingTimer);
                    clearTimeout(weekTimeout);
                }, optimisticLockDelay * 2);
            }

        }, 1000);

    });

    camundaClient.subscribe('electricians-quotation-exchange', async function({ task, taskService }) {
        console.log("Exchanging quotation with electricians...");

        await taskService.extendLock(task, lockDurationMillis);

        let processContext = {task: task, taskService: taskService, rfqs: {}, weekTimeoutExpired: false}
        processContext.weekTimeout = setTimeout(async () => {
            console.log("[ELECTRICIANS]: A week has expired!");
            setTimeout(async () => {
                processContext.weekTimeoutExpired = true;
                let processVariables = new Variables().set("electriciansQuotations", JSON.stringify(processContext.rfqs));
                await processContext.taskService.complete(processContext.task, processVariables);
            }, optimisticLockDelay);
           }, weekTimeoutMillis);

        let rfqs = {};

        let activities = JSON.parse(task.variables.get('activities'));
        let items = activities.electrician.items;

        let customerContact = JSON.parse(task.variables.get('customerContact'));
        let site = JSON.parse(task.variables.get('site'));  

        thirdParties["electricians"].forEach(electricianId => {
            let rfqIdNum = getNextVal();
            let rfqNumber = "RFQ" + rfqIdNum;

            rfqs[rfqNumber] = {electricianId: electricianId, response: null};

            let postRequest = {
                "rfq": {
                    "rfqNumber": rfqNumber,
                    "customerContact": customerContact,
                    "renovationCompanyContact": {
                      "name": "Acme Corp",
                      "address": "Fairfield, New Jersey",
                      "phoneNumber": "39212345678",
                      "emailAddress": "acme-corp@acme.com"
                    },
                    "site": site,
                    "items": items,
                    "estimatedStartDate": new Date().toJSON().slice(0, 10),
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
        
        processContext.rfqs = rfqs;
        electriciansQuotationsStatus.push(processContext);
    });

    camundaClient.subscribe('constructors-quotation-exchange', async function({ task, taskService }) {
        console.log("Exchanging quotation with constructors...");
        await taskService.extendLock(task, lockDurationMillis);
        let weekTimeoutExpired = false;
        let weekTimeout = setTimeout(() => {
            console.log("[CONSTRUCTOR]: A week has expired!");
            weekTimeoutExpired = true;
        }, weekTimeoutMillis);
        let rfqs = {};

        let activities = JSON.parse(task.variables.get('activities'));
        let items = activities.constructor.items;

        let customerContact = JSON.parse(task.variables.get('customerContact'));
        let site = JSON.parse(task.variables.get('site'));  

        thirdParties["constructors"].forEach(constructorId => {
            if(!weekTimeoutExpired){
                let rfqIdNum = getNextVal();
                let rfqNumber = "RFQ" + rfqIdNum;
                rfqs[rfqNumber] = {constructorId:constructorId, response: null};

                let postRequest = {
                    "rfqNumber": rfqNumber,
                    "customerContact": customerContact,
                    "renovationCompanyContact": {
                      "name": "Acme Corp",
                      "address": "Fairfield, New Jersey",
                      "phoneNumber": "39212345678",
                      "emailAddress": "acme-corp@acme.com"
                    },
                    "site": site,
                    "items": items,
                    "estimatedStartDate": new Date().toJSON().slice(0, 10),
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

    camundaClient.subscribe('send-quotation-acceptance-notifications', async function({ task, taskService }) {
        await taskService.extendLock(task, lockDurationMillis);
        console.log("Sending project to winners...");

        let activities = JSON.parse(task.variables.get('activities'));
        let project = JSON.parse(task.variables.get('project'));

        let requests = [];

        if(activities.plumber.isNeeded) {
            let winnerPlumber = JSON.parse(task.variables.get('winnerPlumber'));
            requests.push(axios({
                method: "post",
                url: "http://localhost:"+ winnerPlumber.plumberId + "/projects",
                data: {...project, rfqNumber: winnerPlumber.rfqNumber}
            }).then((res) => ({variableName: "plumberProject", value: res.data})
            ).catch((err) => {
                console.log("Failed to post a project to plumber #" + winnerPlumber.plumberId);
                console.log(err);
            }));
        }

        if(activities.electrician.isNeeded) {
            let winnerElectrician = JSON.parse(task.variables.get('winnerElectrician'));
            requests.push(axios({
                method: "post",
                url: "http://localhost:"+ winnerElectrician.electricianId + "/projects",
                data: {...project, rfqNumber: winnerElectrician.rfqNumber}
            }).then((res) => ({variableName: "electricianProject", value: res.data})
            ).catch((err) => {
                console.log("Failed to post a project to electrician #" + winnerElectrician.electricianId);
                console.log(err);
            }));
        }

        if(activities.constructor.isNeeded) {
            let winnerConstructor = JSON.parse(task.variables.get('winnerConstructor'));
            requests.push(axios({
                method: "post",
                url: "http://localhost:"+ winnerConstructor.constructorId + "/projects",
                data: {...project, rfqNumber: winnerConstructor.rfqNumber}
            }).then((res) => ({variableName: "constructorProject", value: res.data})
            ).catch((err) => {
                console.log("Failed to post a project to constructor #" + winnerConstructor.constructorId);
                console.log(err);
            }));
        }

        Promise.all(requests).then(async (responses) => {
            let obj = {};
            responses.forEach(res => obj[res.variableName] = JSON.stringify(res.value));
            let processVariables = new Variables().setAll(obj);
            await taskService.complete(task, processVariables);
        });

    });

    camundaClient.subscribe('send-quotation-discard-notifications', async function({ task, taskService }) {
        await taskService.extendLock(task, lockDurationMillis);
        console.log("Sending quotation discard notification to losers...")

        let activities = JSON.parse(task.variables.get('activities'));
        let requests = [];

        if(activities.plumber.isNeeded) {
            let plumbersQuotations = JSON.parse(task.variables.get('plumbersQuotations'));
            let winnerPlumber = JSON.parse(task.variables.get('winnerPlumber'));
            let loserPlumberIds = thirdParties.plumbers.filter(plumberId => plumberId !== winnerPlumber.plumberId);
            loserPlumberIds.forEach(plumberId => {
                let rfqNumber = Object.entries(plumbersQuotations).find(([rfqNumber, value]) => value.plumberId === plumberId)[0];
                requests.push(axios({
                    method: "delete",
                    url: "http://localhost:"+ plumberId + "/rfq/" + rfqNumber
                }).then((res) => {
                }).catch((err) => {
                    console.log("Failed to delete rfq #" + rfqNumber + "to plumber #" + plumberId);
                    console.log(err);
                }));
            });
        }

        if(activities.electrician.isNeeded) {
            let electriciansQuotations = JSON.parse(task.variables.get('electriciansQuotations'));
            let winnerElectrician = JSON.parse(task.variables.get('winnerElectrician'));
            let loserElectricianIds = thirdParties.electricians.filter(electricianId => electricianId !== winnerElectrician.electricianId);
            loserElectricianIds.forEach(electricianId => {
                let rfqNumber = Object.entries(electriciansQuotations).find(([rfqNumber, value]) => value.electricianId === electricianId)[0];
                requests.push(axios({
                    method: "delete",
                    url: "http://localhost:"+ electricianId + "/rfq/" + rfqNumber
                }).then((res) => {
                }).catch((err) => {
                    console.log("Failed to delete rfq #" + rfqNumber + "to electrician #" + electricianId);
                    console.log(err);
                }));
            });
        }

        if(activities.constructor.isNeeded) {
            let constructorsQuotations = JSON.parse(task.variables.get('constructorsQuotations'));
            let winnerConstructor = JSON.parse(task.variables.get('winnerConstructor'));
            let loserConstructorIds = thirdParties.constructors.filter(constructorId => constructorId !== winnerConstructor.constructorId);
            loserConstructorIds.forEach(constructorId => {
                let rfqNumber = Object.entries(constructorsQuotations).find(([rfqNumber, value]) => value.constructorId === constructorId)[0];
                requests.push(axios({
                    method: "delete",
                    url: "http://localhost:"+ constructorId + "/rfq/" + rfqNumber
                }).then((res) => {
                }).catch((err) => {
                    console.log("Failed to delete rfq #" + rfqNumber + "to constructor #" + constructorId);
                    console.log(err);
                }));
            });
        }

        Promise.all(requests).then(async (res) => {
            setTimeout(async () => {
                await taskService.complete(task);
            }, optimisticLockDelay);
        });

    });

    camundaClient.subscribe('send-quotation-discard-notifications-due-to-unavailable-third-parties', async function({ task, taskService }) {
        await taskService.extendLock(task, lockDurationMillis);
        console.log("Sending quotation discard notification due to unavailable third parties...");

        let activities = JSON.parse(task.variables.get('activities'));
        let requests = [];

        if(activities.plumber.isNeeded) {
            let plumbersQuotations = JSON.parse(task.variables.get('plumbersQuotations'));
            thirdParties.plumbers.forEach(plumberId => {
                let rfqNumber = Object.entries(plumbersQuotations).find(([rfqNumber, value]) => value.plumberId === plumberId)[0];
                requests.push(axios({
                    method: "delete",
                    url: "http://localhost:"+ plumberId + "/rfq/" + rfqNumber
                }).then((res) => {
                }).catch((err) => {
                    console.log("Failed to delete rfq #" + rfqNumber + "to plumber #" + plumberId);
                    console.log(err);
                }));
            });
        }

        if(activities.electrician.isNeeded) {
            let electriciansQuotations = JSON.parse(task.variables.get('electriciansQuotations'));
            thirdParties.electricians.forEach(electricianId => {
                let rfqNumber = Object.entries(electriciansQuotations).find(([rfqNumber, value]) => value.electricianId === electricianId)[0];
                requests.push(axios({
                    method: "delete",
                    url: "http://localhost:"+ electricianId + "/rfq/" + rfqNumber
                }).then((res) => {
                }).catch((err) => {
                    console.log("Failed to delete rfq #" + rfqNumber + "to electrician #" + electricianId);
                    console.log(err);
                }));
            });
        }

        if(activities.constructor.isNeeded) {
            let constructorsQuotations = JSON.parse(task.variables.get('constructorsQuotations'));
            thirdParties.constructors.forEach(constructorId => {
                let rfqNumber = Object.entries(constructorsQuotations).find(([rfqNumber, value]) => value.constructorId === constructorId)[0];
                requests.push(axios({
                    method: "delete",
                    url: "http://localhost:"+ constructorId + "/rfq/" + rfqNumber
                }).then((res) => {
                }).catch((err) => {
                    console.log("Failed to delete rfq #" + rfqNumber + "to constructor #" + constructorId);
                    console.log(err);
                }));
            });
        }

        Promise.all(requests).then(async (res) => {
            await taskService.complete(task);
        });

    });

    camundaClient.subscribe('offer-plan-proposal-plumber', async function({ task, taskService }) {
        await taskService.extendLock(task, lockDurationMillis);
        console.log("Sending plan proposal to plumber...");

        let planProposal = JSON.parse(task.variables.get('plumberPlanProposal'));
        let winnerPlumber = JSON.parse(task.variables.get('winnerPlumber'));
        let project = JSON.parse(task.variables.get('plumberProject'));
        
        axios({
            method: "post",
            url: "http://localhost:"+ winnerPlumber.plumberId + "/projects/" + project.id + "/planProposal",
            data: planProposal
        }).then(async (res) => {
            let processVariables = new Variables().set("plumberPlanProposal", JSON.stringify({...planProposal, status: res.data.status}));
            await taskService.complete(task, processVariables);
        }).catch((err) => {
            console.log("Failed to post plan proposal to plumber #" + winnerPlumber.plumberId);
            console.log(err);
        });

    });

    camundaClient.subscribe('offer-plan-proposal-electrician', async function({ task, taskService }) {
        await taskService.extendLock(task, lockDurationMillis);
        console.log("Sending plan proposal to electrician...");

        let planProposal = JSON.parse(task.variables.get('electricianPlanProposal'));
        let winnerElectrician = JSON.parse(task.variables.get('winnerElectrician'));
        let project = JSON.parse(task.variables.get('electricianProject'));
        
        axios({
            method: "post",
            url: "http://localhost:"+ winnerElectrician.electricianId + "/projects/" + project.id + "/planProposal",
            data: planProposal
        }).then(async (res) => {
            let processVariables = new Variables().set("electricianPlanProposal", JSON.stringify({...planProposal, status: res.data.status}));
            setTimeout(async () => {
                await taskService.complete(task, processVariables);
            }, optimisticLockDelay);
        }).catch((err) => {
            console.log("Failed to post plan proposal to electrician #" + winnerElectrician.electricianId);
            console.log(err);
        });

    });

    camundaClient.subscribe('offer-plan-proposal-constructor', async function({ task, taskService }) {
        await taskService.extendLock(task, lockDurationMillis);
        console.log("Sending plan proposal to constructor...");

        let planProposal = JSON.parse(task.variables.get('constructorPlanProposal'));
        let winnerConstructor = JSON.parse(task.variables.get('winnerConstructor'));
        let project = JSON.parse(task.variables.get('constructorProject'));
        
        axios({
            method: "post",
            url: "http://localhost:"+ winnerConstructor.constructorId + "/projects/" + project.id + "/planProposal",
            data: planProposal
        }).then(async (res) => {
            let processVariables = new Variables().set("constructorPlanProposal", JSON.stringify({...planProposal, status: res.data.status}));
            setTimeout(async () => {
                await taskService.complete(task, processVariables);
            }, optimisticLockDelay * 2);
        }).catch((err) => {
            console.log("Failed to post plan proposal to constructor #" + winnerConstructor.constructorId);
            console.log(err);
        });

    });

    camundaClient.subscribe('send-plan-proposal-approval-notifications', async function({ task, taskService }) {
        await taskService.extendLock(task, lockDurationMillis);
        console.log("Sending plan proposal confirmations...");

        let activities = JSON.parse(task.variables.get('activities'));
        let requests = [];

        if(activities.plumber.isNeeded) {
            let winnerPlumber = JSON.parse(task.variables.get('winnerPlumber'));
            let project = JSON.parse(task.variables.get('plumberProject'));
            requests.push(axios({
                method: "put",
                url: "http://localhost:"+ winnerPlumber.plumberId + "/projects/" + project.id + "/planProposal/confirmation",
                data: {status: "CONFIRMED"}
            }).then((res) => {
            }).catch((err) => {
                console.log("Failed to post plan proposal confirmation to plumber #" + winnerPlumber.plumberId);
                console.log(err);
            }));
        }

        if(activities.electrician.isNeeded) {
            let winnerElectrician = JSON.parse(task.variables.get('winnerElectrician'));
            let project = JSON.parse(task.variables.get('electricianProject'));
            requests.push(axios({
                method: "put",
                url: "http://localhost:"+ winnerElectrician.electricianId + "/projects/" + project.id + "/planProposal/confirmation",
                data: {status: "CONFIRMED"}
            }).then((res) => {
            }).catch((err) => {
                console.log("Failed to post plan proposal confirmation to electrician #" + winnerElectrician.electricianId);
                console.log(err);
            }));
        }
        
        if(activities.constructor.isNeeded) {
            let winnerConstructor = JSON.parse(task.variables.get('winnerConstructor'));
            let project = JSON.parse(task.variables.get('constructorProject'));
            requests.push(axios({
                method: "put",
                url: "http://localhost:"+ winnerConstructor.constructorId + "/projects/" + project.id + "/planProposal/confirmation",
                data: {status: "CONFIRMED"}
            }).then((res) => {
            }).catch((err) => {
                console.log("Failed to post plan proposal confirmation to constructor #" + winnerConstructor.constructorId);
                console.log(err);
            }));
        }

        Promise.all(requests).then(async (res) => {
            await taskService.complete(task);
        });
        
    });

    camundaClient.subscribe('send-plan-proposal-discard-notifications', async function({ task, taskService }) {
        await taskService.extendLock(task, lockDurationMillis);
        console.log("Sending plan proposal discard notifications...");

        let activities = JSON.parse(task.variables.get('activities'));
        let requests = [];

        if(activities.plumber.isNeeded) {
            let winnerPlumber = JSON.parse(task.variables.get('winnerPlumber'));
            let project = JSON.parse(task.variables.get('plumberProject'));
            requests.push(axios({
                method: "delete",
                url: "http://localhost:"+ winnerPlumber.plumberId + "/projects/" + project.id + "/planProposal",
            }).then((res) => {
            }).catch((err) => {
                console.log("Failed to send plan proposal discard notification to plumber #" + winnerPlumber.plumberId);
                console.log(err);
            }));
        }

        if(activities.electrician.isNeeded) {
            let winnerElectrician = JSON.parse(task.variables.get('winnerElectrician'));
            let project = JSON.parse(task.variables.get('electricianProject'));
            requests.push(axios({
                method: "delete",
                url: "http://localhost:"+ winnerElectrician.electricianId + "/projects/" + project.id + "/planProposal",
            }).then((res) => {
            }).catch((err) => {
                console.log("Failed to send plan proposal discard notification to electrician #" + winnerElectrician.electricianId);
                console.log(err);
            }));
        }
        
        if(activities.constructor.isNeeded) {
            let winnerConstructor = JSON.parse(task.variables.get('winnerConstructor'));
            let project = JSON.parse(task.variables.get('constructorProject'));
            requests.push(axios({
                method: "delete",
                url: "http://localhost:"+ winnerConstructor.constructorId + "/projects/" + project.id + "/planProposal",
            }).then((res) => {
            }).catch((err) => {
                console.log("Failed to send plan proposal discard notification to constructor #" + winnerConstructor.constructorId);
                console.log(err);
            }));
        }

        Promise.all(requests).then(async (res) => {
            await taskService.complete(task);
        });
        
    });

    camundaClient.subscribe('get-jobs-status-plumber', async function({ task, taskService }) {
        await taskService.extendLock(task, lockDurationMillis);
        console.log("Getting job status from plumber...");

        let winnerPlumber = JSON.parse(task.variables.get('winnerPlumber'));
        let project = JSON.parse(task.variables.get('plumberProject'));
        let today = JSON.parse(task.variables.get('today'));
        
        axios({
            method: "get",
            url: "http://localhost:"+ winnerPlumber.plumberId + "/projects/" + project.id + "/jobs?date=" + today
        }).then(async (res) => {
            let processVariables = new Variables().set("plumberLastJobStatus", JSON.stringify({status: res.data.jobs[0].status}));
            await taskService.complete(task, processVariables);
        }).catch((err) => {
            console.log("Failed to get job status from plumber #" + winnerPlumber.plumberId);
            console.log(err);
        });
    });

    camundaClient.subscribe('get-jobs-status-electrician', async function({ task, taskService }) {
        await taskService.extendLock(task, lockDurationMillis);
        console.log("Getting job status from electrician...");

        let winnerElectrician = JSON.parse(task.variables.get('winnerElectrician'));
        let project = JSON.parse(task.variables.get('electricianProject'));
        let today = JSON.parse(task.variables.get('today'));
        
        axios({
            method: "get",
            url: "http://localhost:"+ winnerElectrician.electricianId + "/projects/" + project.id + "/jobs?date=" + today
        }).then(async (res) => {
            let processVariables = new Variables().set("electricianLastJobStatus", JSON.stringify({status: res.data.jobs[0].status}));
            setTimeout(async () => {
                await taskService.complete(task, processVariables);
            }, optimisticLockDelay);
        }).catch((err) => {
            console.log("Failed to get job status from electrician #" + winnerElectrician.electricianId);
            console.log(err);
        });
    });

    camundaClient.subscribe('get-jobs-status-constructor', async function({ task, taskService }) {
        await taskService.extendLock(task, lockDurationMillis);
        console.log("Getting job status from constructor...");

        let winnerConstructor = JSON.parse(task.variables.get('winnerConstructor'));
        let project = JSON.parse(task.variables.get('constructorProject'));
        let today = JSON.parse(task.variables.get('today'));
        
        axios({
            method: "get",
            url: "http://localhost:"+ winnerConstructor.constructorId + "/projects/" + project.id + "/jobs?date=" + today
        }).then(async (res) => {
            let processVariables = new Variables().set("constructorLastJobStatus", JSON.stringify({status: res.data.jobs[0].status}));
            setTimeout(async () => {
                await taskService.complete(task, processVariables);
            }, optimisticLockDelay * 2);
        }).catch((err) => {
            console.log("Failed to get job status from constructor #" + winnerConstructor.constructorId);
            console.log(err);
        });
    });

    camundaClient.subscribe('send-project-completion-notifications', async function({ task, taskService }) {
        await taskService.extendLock(task, lockDurationMillis);
        console.log("Sending project completion notifications...");
        
        let activities = JSON.parse(task.variables.get('activities'));
        let requests = [];

        if(activities.plumber.isNeeded) {
            let winnerPlumber = JSON.parse(task.variables.get('winnerPlumber'));
            let project = JSON.parse(task.variables.get('plumberProject'));
            requests.push(axios({
                method: "put",
                url: "http://localhost:"+ winnerPlumber.plumberId + "/projects/" + project.id + "/status",
                data: {status: "COMPLETED"}
            }).then((res) => {
            }).catch((err) => {
                console.log("Failed to send project completion notification to plumber #" + winnerPlumber.plumberId);
                console.log(err);
            }));
        }

        if(activities.electrician.isNeeded) {
            let winnerElectrician = JSON.parse(task.variables.get('winnerElectrician'));
            let project = JSON.parse(task.variables.get('electricianProject'));
            requests.push(axios({
                method: "put",
                url: "http://localhost:"+ winnerElectrician.electricianId + "/projects/" + project.id + "/status",
                data: {status: "COMPLETED"}
            }).then((res) => {
            }).catch((err) => {
                console.log("Failed to send project completion notification to electrician #" + winnerElectrician.electricianId);
                console.log(err);
            }));
        }
        
        if(activities.constructor.isNeeded) {
            let winnerConstructor = JSON.parse(task.variables.get('winnerConstructor'));
            let project = JSON.parse(task.variables.get('constructorProject'));
            requests.push(axios({
                method: "put",
                url: "http://localhost:"+ winnerConstructor.constructorId + "/projects/" + project.id + "/status",
                data: {status: "COMPLETED"}
            }).then((res) => {
            }).catch((err) => {
                console.log("Failed to send project completion notification to constructor #" + winnerConstructor.constructorId);
                console.log(err);
            }));
        }

        Promise.all(requests).then(async (res) => {
            await taskService.complete(task);
        });
       
    });

});