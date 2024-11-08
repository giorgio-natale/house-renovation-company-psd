const db = require('../utils/db.js');
const sender =  require('../utils/sender.js');

module.exports.getJobs = function getJobs(req, res) {
    const projId = req.params.projectId;
    const date = new Date(req.query.date);

    if(db.projectDb[projId] === undefined) {
        sender.sendResponse(res, 404);
        return;        
    }

    const jobs = !date ?
        db.projectDb[projId].jobs :
        db.projectDb[projId].jobs.filter(i => new Date(i.startDateTime).getTime() <= date.getTime() && new Date(i.endDateTime).getTime() >= date.getTime());

    if(jobs.length === 0) {
        sender.sendResponse(res, 404);
        return;
    }

    if(jobs[0].status === "NOT_STARTED") {
        let nextJobStatus;
        if(Math.random() >= 0.3) {
            nextJobStatus = "COMPLETED";
        } else {
            nextJobStatus = "FAILED";
        }
    
        console.log("Job '" + jobs[0].title + "' of date " + date.toJSON().slice(0,10) + " " + nextJobStatus);
    
        jobs[0].status = nextJobStatus;
    }
    
    sender.sendResponse(res, 200, {
        jobs: jobs,
        links: {
            projectStatus: `${__baseUrl}/projects/${projId}/status`
        }
    });
}
