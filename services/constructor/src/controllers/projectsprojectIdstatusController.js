const service = require('../services/projectsprojectIdstatusService.js');

module.exports.updateProjectStatus = function updateProjectStatus(req, res) {
    service.updateProjectStatus(req, res);
}

