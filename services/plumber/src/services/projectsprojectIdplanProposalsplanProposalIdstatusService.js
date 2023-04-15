const db = require('../utils/db.js');
const sender =  require('../utils/sender.js');

module.exports.getPlanProposalStatus = function getPlanProposalStatus(req, res) {
    const projId = req.params.projectId;
    const planProposalId = req.params.planProposalId;

    if(db.projectDb[projId] === undefined || db.projectDb[projId].planProposals[planProposalId] === undefined){
        sender.sendResponse(res, 404);
        return;        
    }

    let planProposalStatus = db.projectDb[projId].planProposals[planProposalId].status;

    if(planProposalStatus === "PENDING")
        sender.sendResponse(res, 202);
    else if(planProposalStatus === "ACCEPTED")
        sender.sendResponse(res, 200,
            {
                status: planProposalStatus,
                links: {
                    jobs: `http://localhost:${req.socket.localPort}/projects/${projId}/jobs`    
                }
            }
        );
    else
        sender.sendResponse(res, 200, {
            status: planProposalStatus,
            links: {
                planProposals: `http://localhost:${req.socket.localPort}/projects/${projId}/planProposals`
            }
        });
}
