const service = require('../services/projectsprojectIdplanProposalsplanProposalIdstatusService.js');

module.exports.getPlanProposalStatus = function getPlanProposalStatus(req, res) {
    service.getPlanProposalStatus(req, res);
}

