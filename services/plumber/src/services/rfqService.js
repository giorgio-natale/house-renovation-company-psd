const db = require('../db/db.js');

module.exports.registerRequestForQuotation = function registerRequestForQuotation(req, res) {
    const rfqNumber = req.body.rfqNumber;
    const rfq = req.body;
    if(db.quotationDb[rfqNumber] !== undefined){
        res.status(400).send();
        return;
    }

    db.quotationDb[rfqNumber] = {
        rfq: req.body,
        quotation: null
    }

    setTimeout(() => {
        if(Math.random() >= 0.2){
            const pricedItems = rfq["items"].map(i => ({...i, price: Math.floor(Math.random() * 100)}))
            db.quotationDb[rfqNumber].quotation = {
                pricedItems: pricedItems,
                status: "READY"
            }
        } else {
            db.quotationDb[rfqNumber].quotation = {
                status: "CANCELLED"
            }
        }
    }, 10000);

    res.status(201).send({
        rfqNumber: rfqNumber,
        links: {
            quotation: `http://localhost:${req.socket.localPort}/rfq/${rfqNumber}/quotation`
        }
    });
}

