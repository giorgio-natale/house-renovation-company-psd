const db = require('../utils/db.js');
const sender =  require('../utils/sender.js');

module.exports.getJobs = function getJobs(req, res) {
    const projId = req.params.projectId;
    const date = req.query.date;

    if(db.projectDb[projId] === undefined){
        sender.sendResponse(res, 404);
        return;        
    }
    
    sender.sendResponse(res, 200, {
        jobs: !date ? db.projectDb[projId].jobs : db.projectDb[projId].jobs.filter(i => new Date(i.startDateTime) <= new Date(date) && new Date(i.endDateTime) >= new Date (date)),
        links: {
            projectStatus: `${__baseUrl}/projects/${projId}/status`
        }
    });
}
