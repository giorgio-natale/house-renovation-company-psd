const db = require('../utils/db.js');
const sender =  require('../utils/sender.js');

module.exports.registerProject = function registerProject(req, res) {

    const rfqNumber = req.body.rfqNumber;

    if (Object.values(db.projectDb).some(i => i.rfqNumber === rfqNumber)){
        sender.sendResponse(res, 400,
            `A project related to request for quotation number ${rfqNumber} already exists`
        );
        return;
    }

    if (db.quotationDb[rfqNumber] === undefined){
        sender.sendResponse(res, 400,
            `The project is associated to a non existing request for quotation`
        );
        return;
    }

    if (db.quotationDb[rfqNumber].quotation === null || db.quotationDb[rfqNumber].quotation.status !== "READY"){
        sender.sendResponse(res, 400,
            `The project is not associated to a valid quotation`
            
        );
        return;
    }

    generatedProjId = db.getNextVal("projectId").toString();

    console.log("Received confermation for project #" + generatedProjId + " (associated to RFQ #" + rfqNumber + ")");

    db.projectDb[generatedProjId] = {
        project: {
            id: generatedProjId,
            status: "IN_PROGRESS",
            ...req.body
        },
        planProposal: {},
        jobs: []
    }

    sender.sendResponse(res, 201, {
        ...req.body,
        id: generatedProjId,
        links: {
            projectStatus: `${__baseUrl}/projects/${generatedProjId}/status`,
            planProposal: `${__baseUrl}/projects/${generatedProjId}/planProposal`
        }
    });
}
