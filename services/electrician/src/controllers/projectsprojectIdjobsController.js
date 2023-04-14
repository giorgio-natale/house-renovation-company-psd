const service = require('../services/projectsprojectIdjobsService.js');

module.exports.getJobs = function getJobs(req, res) {
    service.getJobs(req, res);
}

