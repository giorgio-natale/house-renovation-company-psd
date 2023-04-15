const db = require('../utils/db.js');
const sender =  require('../utils/sender.js');
const axios = require('axios');

module.exports.registerPlanProposal = function registerPlanProposal(req, res) {
    const projId = req.params.projectId;
    const callbackUrl = req.body.callbackUrl;
    const currentPort = req.socket.localPort;

    if(db.projectDb[projId] === undefined){
        sender.sendResponse(res, 404);
        return;
    }
    
    const generatedPlanProposalId = db.getNextVal("planProposalId");

    db.projectDb[projId].planProposals[generatedPlanProposalId] = {
        id: generatedPlanProposalId,
        jobProposals: req.body.planProposal.jobProposals,
        status: "PENDING"
    }

    setTimeout(() => {
        if(Math.random() >= 0.2) {
            db.projectDb[projId].planProposals[generatedPlanProposalId].status = "ACCEPTED";
            
            db.projectDb[projId].jobs = req.body.planProposal.jobProposals.map((i, index) => ({
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
        
        planProposalStatus = db.projectDb[projId].planProposals[generatedPlanProposalId].status
        let callbackResponse;
        if(planProposalStatus === "ACCEPTED"){
            callbackResponse = 
                {
                    status: planProposalStatus,
                    links: {
                        jobs: `http://localhost:${currentPort}/projects/${projId}/jobs`    
                    }
                }
        }else{
            callbackResponse = 
                {
                    status: planProposalStatus,
                    links: {
                        planProposals: `http://localhost:${currentPort}/projects/${projId}/planProposals`
                    }
                }
        }
        
        axios({
            method: "put",
            url: callbackUrl,
            data: callbackResponse
          })
          .then(res => console.log("Response from plan proposal callback: " + res))
          .catch((err) => console.log("Response from plan proposal callback: " + err));
    }, 10000);

    sender.sendResponse(res, 201);
}

