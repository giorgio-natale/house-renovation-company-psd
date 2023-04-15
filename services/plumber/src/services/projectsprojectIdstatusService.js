const db = require('../db/db.js');

module.exports.updateProjectStatus = function updateProjectStatus(req, res) {
    const projId = req.params.projectId;

    if(db.projectDb[projId] === undefined){
        res.status(404).send();
        return;        
    }

    if(req.body.status === undefined ||
        (req.body.status !== "NOT_STARTED" &&
        req.body.status !== "IN_PROGRESS" &&
        req.body.status !== "COMPLETED")
    ) {
        res.status(400).send();
        return;
    }

    db.projectDb[projId].status = req.body.status;
    res.status(200).send();
}
