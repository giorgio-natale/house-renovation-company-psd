const service = require('../services/rfqrfqNumberService.js');

module.exports.deleteRequestForQuotation = function deleteRequestForQuotation(req, res) {
    service.deleteRequestForQuotation(req, res);
}

