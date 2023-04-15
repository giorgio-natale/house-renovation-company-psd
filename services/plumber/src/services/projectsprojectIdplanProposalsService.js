const db = require('../db/db.js');

module.exports.registerPlanProposal = function registerPlanProposal(req, res) {
    const projId = req.params.projectId;

    if(db.projectDb[projId] === undefined){
        res.status(404).send();
        return;
    }
    
    let generatedPlanProposalId;
    do {
        generatedPlanProposalId = Math.floor(Math.random() * 100);
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
                numberOfRequiredPlumbers: Math.floor(Math.random() * 5),
                status: "NOT_STARTED"
            }));

            const udateJobStatusInterval = setInterval(() => {
                db.projectDb[projId].jobs.forEach(i => {
                    switch(i.status) {
                        case "NOT_STARTED": {
                            i.status = "IN_PROGRESS";
                            break;
                        }
                        case "IN_PROGRESS": {
                            if(Math.random() >= 0.2)
                                i.status = "COMPLETED";
                            else
                                i.status = "FAILED";
                            break;
                        }
                        case "COMPLETED":
                        case "FAILED":
                        default:
                            break;
                    }
                });
                if(!db.projectDb[projId].jobs.some(i => i.status === "NOT_STARTED" || i.status === "IN_PROGRESS"))
                    clearInterval(udateJobStatusInterval);
            }, 5000);
        }
        else {
            db.projectDb[projId].planProposals[generatedPlanProposalId].status = "DECLINED";
        }
    }, 10000);

    res.status(201).send({
        ...db.projectDb[projId].planProposals[generatedPlanProposalId],
        links: {
            planProposalStatus: `http://localhost:${req.socket.localPort}/projects/${projId}/planProposals/${generatedPlanProposalId}/status`
        }
    });
}
