const db = require('../utils/db.js');
const sender =  require('../utils/sender.js');

module.exports.getQuotation = function getQuotation(req, res) {
    const rfqNumber = req.params.rfqNumber;
    if(db.quotationDb[rfqNumber] === undefined){
        sender.sendResponse(res, 404);
        return;        
    }
    if(db.quotationDb[rfqNumber].quotation === null){
        sender.sendResponse(res, 202);
        return;
    }
    sender.sendResponse(res, 200, db.quotationDb[rfqNumber].quotation);
}
