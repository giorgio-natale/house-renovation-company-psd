const db = require('../utils/db.js');
const sender =  require('../utils/sender.js');

module.exports.getJobs = function getJobs(req, res) {
    const projId = req.params.projectId;
    const date = new Date(req.query.date);
    const nextDate = new Date(date.getTime() + (24 * 60 * 60 * 1000));

    if(db.projectDb[projId] === undefined){
        sender.sendResponse(res, 404);
        return;        
    }

    
    sender.sendResponse(res, 200, {
        jobs: !date ? db.projectDb[projId].jobs : db.projectDb[projId].jobs.filter(i => new Date(i.startDateTime).getTime() <= nextDate.getTime() && new Date(i.endDateTime).getTime() >= date.getTime()),
        links: {
            projectStatus: `${__baseUrl}/projects/${projId}/status`
        }
    });
}
