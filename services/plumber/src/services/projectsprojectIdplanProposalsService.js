const db = require('../utils/db.js');
const sender =  require('../utils/sender.js');

module.exports.registerPlanProposal = function registerPlanProposal(req, res) {
    const projId = req.params.projectId;

    if(db.projectDb[projId] === undefined){
        sender.sendResponse(res, 404);
        return;
    }
    
    let generatedPlanProposalId;
    do {
        generatedPlanProposalId = Math.floor(Math.random() * 100).toString();
    } while (db.projectDb[projId].planProposals[generatedPlanProposalId] !== undefined);

    db.projectDb[projId].planProposals[generatedPlanProposalId] = {
        id: generatedPlanProposalId,
        jobProposals: req.body.jobProposals,
        status: "PENDING"
    }

    setTimeout(() => {
        if(Math.random() >= 0.2) {
            db.projectDb[projId].planProposals[generatedPlanProposalId].status = "ACCEPTED";
            
            db.projectDb[projId].jobs = req.body.jobProposals.map((i, index) => ({
                ...i,
                id: index+1,
                numberOfRequiredPlumbers: Math.floor(Math.random() * 4 + 1),
                status: "NOT_STARTED"
            }));

            setTimeout(() => {
                db.projectDb[projId].jobs = db.projectDb[projId].jobs.map(i => ({
                    ...i,
                    status: "COMPLETED"
                }));
            }, 10000);
        }
        else {
            db.projectDb[projId].planProposals[generatedPlanProposalId].status = "DECLINED";
        }
    }, 10000);

    sender.sendResponse(res, 201,
        {
            id: generatedPlanProposalId,
            jobProposals: req.body.jobProposals,
            links: {
                planProposalStatus: `http://localhost:${req.socket.localPort}/projects/${projId}/planProposals/${generatedPlanProposalId}/status`
            }
        }
    );
}
