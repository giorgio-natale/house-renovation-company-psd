import { electriciansQuotationsStatus } from "../shared/shared.js";

export async function updateQuotation(req, res) {
    const rfqNumber = req.params.rfqNumber;
    let processContext = electriciansQuotationsStatus
        .filter(([task, taskService, rfqs]) => rfqNumber in rfqs);

    if(!processContext.weekTimeoutExpired) {
        processContext.rfqs[rfqNumber].response = req.body;
    
        if(!Object.entries(processContext.rfqs).some(([rfqNumber, value]) => {return value.response === null})){
            let processVariables = new Variables().set("electriciansQuotations", JSON.stringify(processContext.rfqs));
            await taskService.complete(task, processVariables);
        };
    } else {
        let processVariables = new Variables().set("electriciansQuotations", JSON.stringify(processContext.rfqs));
        await taskService.complete(task, processVariables);
    }

    res
    .set({ 'content-type': 'application/json; charset=utf-8' })
    .status(200)
    .send();
}