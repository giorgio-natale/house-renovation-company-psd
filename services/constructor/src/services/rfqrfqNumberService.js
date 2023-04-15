const db = require('../utils/db.js');
const sender =  require('../utils/sender.js');

module.exports.deleteRequestForQuotation = function deleteRequestForQuotation(req, res) {
    const rfqNumber = req.params.rfqNumber;
    delete db.quotationDb[rfqNumber];
    sender.sendResponse(res, 200);
}
