const db = require('../utils/db.js');
const sender =  require('../utils/sender.js');

module.exports.registerPlanProposal = function registerPlanProposal(req, res) {
    const projId = req.params.projectId;

    if(db.projectDb[projId] === undefined){
        sender.sendResponse(res, 404);
        return;
    }
    
    db.projectDb[projId].planProposal = {
        jobProposals: req.body.jobProposals,
        confirmation: "PENDING"
    }


    let planProposalStatus;

    if(Math.random() >= 0.2) {
        planProposalStatus = "ACCEPTED";
        sender.sendResponse(res, 201,
            {
                status: planProposalStatus,
                links: {
                    planProposal: `${__baseUrl}/projects/${projId}/planProposal`
                }
            }
        );
    } else {
        planProposalStatus = "DECLINED";
        sender.sendResponse(res, 201, {
            status: planProposalStatus,
            links: {
                planProposal: `${__baseUrl}/projects/${projId}/planProposal`
            }
        });
    }

    db.projectDb[projId].planProposal.status = planProposalStatus;        
}

module.exports.deletePlanProposal = function deletePlanProposal(req, res) {

    const projectId = req.params.projectId;
    delete db.projectDb[projectId].planProposal;

    sender.sendResponse(res, 200);
}