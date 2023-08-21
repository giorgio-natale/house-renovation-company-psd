const service = require('../services/projectsprojectIdplanProposalService.js');

module.exports.registerPlanProposal = function registerPlanProposal(req, res) {
    service.registerPlanProposal(req, res);
}

module.exports.deletePlanProposal = function deletePlanProposal(req, res) {
    service.deletePlanProposal(req, res);
}

