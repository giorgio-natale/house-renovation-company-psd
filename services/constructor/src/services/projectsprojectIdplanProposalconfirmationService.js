const db = require('../utils/db.js');
const sender =  require('../utils/sender.js');

module.exports.updatePlanProposalConfirmation = function updatePlanProposalConfirmation(req, res) {
    const projId = req.params.projectId;

    if(db.projectDb[projId] === undefined){
        sender.sendResponse(res, 404);
        return;
    }

    if(req.body.status !== "CONFIRMED"){
        sender.sendResponse(res, 400);
        return;
    }

    db.projectDb[projId].planProposal.confirmation = "CONFIRMED";

    db.projectDb[projId].jobs = db.projectDb[projId].jobs.filter(job => job.status !== "NOT_STARTED");
    
    db.projectDb[projId].jobs = [
        ...db.projectDb[projId].jobs,
        ...db.projectDb[projId].planProposal.jobProposals.map(job => ({
            ...job,
            id: db.getNextVal("job").toString(),
            numberOfRequiredConstructors: Math.floor(Math.random() * 4 + 1),
            status: "NOT_STARTED"
        }))
    ];

    let nextJobStatus;
    if(Math.random() >= 0.2) {
        nextJobStatus = "COMPLETED";
    } else {
        nextJobStatus = "FAILED";
    }

    db.projectDb[projId].jobs.find(job => job.status === "NOT_STARTED").status = nextJobStatus;
    
    sender.sendResponse(res, 200);
}