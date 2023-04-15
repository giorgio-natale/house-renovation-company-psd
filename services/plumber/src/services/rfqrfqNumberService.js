const db = require('../db/db.js');

module.exports.deleteRequestForQuotation = function deleteRequestForQuotation(req, res) {
    const rfqNumber = req.params.rfqNumber;
    delete db.quotationDb[rfqNumber];
    res.status(200).send();
}
