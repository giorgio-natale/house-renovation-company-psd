const db = require('../utils/db.js');
const sender =  require('../utils/sender.js');

module.exports.getQuotation = function getQuotation(req, res) {
    const rfqNumber = req.params.rfqNumber;
    
    if(db.quotationDb[rfqNumber] === undefined){
        sender.sendResponse(res, 404);
        return;        
    }

    if(db.quotationDb[rfqNumber].quotation === null){
        console.log("Still evaluating RFQ #" + rfqNumber + " ...");
        sender.sendResponse(res, 202);
        return;
    }

    console.log("Evaluated RFQ #" + rfqNumber + " with status " + db.quotationDb[rfqNumber].quotation.status);
    sender.sendResponse(res, 200, db.quotationDb[rfqNumber].quotation);
}
