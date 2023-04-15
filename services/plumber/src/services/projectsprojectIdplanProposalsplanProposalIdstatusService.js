const db = require('../db/db.js');

module.exports.getPlanProposalStatus = function getPlanProposalStatus(req, res) {
    const projId = req.params.projectId;
    const planProposalId = req.params.planProposalId;

    if(db.projectDb[projId] === undefined || db.projectDb[projId].planProposals[planProposalId] === undefined){
        res.status(404).send();
        return;        
    }

    if(db.projectDb[projId].planProposals[planProposalId].status === "PENDING")
        res.status(202).send();
    else
        res.status(200).send({
            status: db.projectDb[projId].planProposals[planProposalId].status,
            links: {
                planProposals: `http://localhost:${req.socket.localPort}/projects/${projId}/planProposals`,
                jobs: `http://localhost:${req.socket.localPort}/projects/${projId}/jobs`      
            }
        });
}
