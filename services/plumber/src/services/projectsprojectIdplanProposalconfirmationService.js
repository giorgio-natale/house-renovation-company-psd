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

    console.log("Received plan proposal confermation for project #" + projId);

    db.projectDb[projId].jobs = db.projectDb[projId].jobs.filter(job => job.status !== "NOT_STARTED");
    
    db.projectDb[projId].jobs = [
        ...db.projectDb[projId].jobs,
        ...db.projectDb[projId].planProposal.jobProposals.map(job => ({
            ...job,
            id: db.getNextVal("job").toString(),
            numberOfRequiredPlumbers: Math.floor(Math.random() * 4 + 1),
            status: "NOT_STARTED"
        }))
    ];
    
    sender.sendResponse(res, 200);
}