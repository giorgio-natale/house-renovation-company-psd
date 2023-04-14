const service = require('../services/projectsprojectIdplanProposalsService.js');

module.exports.registerPlanProposal = function registerPlanProposal(req, res) {
    service.registerPlanProposal(req, res);
}

