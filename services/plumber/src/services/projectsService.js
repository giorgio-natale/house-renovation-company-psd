const db = require('../db/db.js');

module.exports.registerProject = function registerProject(req, res) {

    if (Object.values(db.projectDb).some(i => i.rfqNumber === reqProject.rfqNumber)){
        res.status(400).send();
        return;
    }

    let generatedProjId;
    do {
        generatedProjId = Math.floor(Math.random() * 100);
    } while (db.projectDb[generatedProjId] !== undefined);

    db.projectDb[generatedProjId] = {
        project: {
            id: generatedProjId,
            status: "NOT_STARTED",
            ...req.body
        },
        planProposals: [],
        jobs: []
    }

    res.status(201).send({
        ...db.projectDb[generatedProjId],
        links: {
            projectStatus: `http://localhost:${req.socket.localPort}/projects/${generatedProjId}/status`,
            planProposal: `http://localhost:${req.socket.localPort}/projects/${generatedProjId}/planProposals`
        }
    });
}
