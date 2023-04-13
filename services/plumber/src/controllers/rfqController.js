const service = require('../services/rfqService.js');

module.exports.registerRequestForQuotation = function registerRequestForQuotation(req, res) {
    service.registerRequestForQuotation(req, res);
}

