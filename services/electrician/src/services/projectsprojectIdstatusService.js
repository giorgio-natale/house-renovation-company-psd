const db = require('../utils/db.js');
const sender =  require('../utils/sender.js');

module.exports.updateProjectStatus = function updateProjectStatus(req, res) {
    const projId = req.params.projectId;

    if(db.projectDb[projId] === undefined){
        sender.sendResponse(res, 404);
        return;        
    }

    db.projectDb[projId].status = req.body.status;
    
    console.log("Project #" + projId + " has now status " + req.body.status);
    console.log("##################################################");
    console.log("##################################################");

    sender.sendResponse(res, 200);
}

