const db = require('../db/db.js');

module.exports.getJobs = function getJobs(req, res) {
    const projId = req.params.projectId;
    const date = req.query.date;

    if(db.projectDb[projId] === undefined){
        res.status(404).send();
        return;        
    }
    
    res.status(200).send({
        jobs: !date ? db.projectDb[projId].jobs : db.projectDb[projId].jobs.filter(i => new Date(i.startDateTime) <= new Date(date) && new Date(i.endDateTime) >= new Date (date)),
        links: {
            projectStatus: `http://localhost:${req.socket.localPort}/projects/${projId}/status`
        }
    })
}
