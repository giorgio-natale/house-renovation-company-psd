const service = require('../services/projectsService.js');

module.exports.registerProject = function registerProject(req, res) {
    service.registerProject(req, res);
}

