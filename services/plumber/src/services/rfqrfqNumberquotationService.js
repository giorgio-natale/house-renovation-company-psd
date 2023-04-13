const db = require('../db/db.js');

module.exports.getQuotation = function getQuotation(req, res) {
    const rfqNumber = req.params.rfqNumber;
    if(db.quotationDb[rfqNumber] === undefined){
        res.status(404).send();
        return;        
    }
    if(db.quotationDb[rfqNumber].quotation === null){
        res.status(202).send();
        return;
    }

    res.status(200).send(db.quotationDb[rfqNumber].quotation);
}

