import { electriciansQuotationsStatus } from "../shared/shared.js";
import {Variables} from 'camunda-external-task-client-js'

export async function updateQuotation(req, res) {
    const rfqNumber = req.params.rfqNumber;
    let processContext = electriciansQuotationsStatus
        .find((context) => {return rfqNumber in context.rfqs;});

    if(!processContext.weekTimeoutExpired) {
        processContext.rfqs[rfqNumber].response = req.body;
    
        if(!Object.entries(processContext.rfqs).some(([rfqNumber, value]) => {return value.response === null})){
            let processVariables = new Variables().set("electriciansQuotations", JSON.stringify(processContext.rfqs));
            await processContext.taskService.complete(processContext.task, processVariables);
        };
    }

    res
    .set({ 'content-type': 'application/json; charset=utf-8' })
    .status(200)
    .send();
}