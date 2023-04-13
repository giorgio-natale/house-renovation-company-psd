const service = require('../services/rfqrfqNumberquotationService.js');

module.exports.getQuotation = function getQuotation(req, res) {
    service.getQuotation(req, res);
}

