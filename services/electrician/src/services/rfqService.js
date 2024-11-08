const db = require('../utils/db.js');
const sender =  require('../utils/sender.js');
const axios = require('axios');

module.exports.registerRequestForQuotation = function registerRequestForQuotation(req, res) {
    const rfqNumber = req.body.rfq.rfqNumber;
    const rfq = req.body.rfq;
    const callbackUrl = req.body.callbackUrl;


    if(db.quotationDb[rfqNumber] !== undefined){
        sender.sendResponse(res, 400,
            `The request for quotation number ${rfqNumber} is already registered in the systems`    
        );
        return;
    }

    db.quotationDb[rfqNumber] = {
        rfq: req.body,
        quotation: null
    }

    console.log("Received RFQ #" + rfqNumber);
    req.body.rfq.items.forEach(item => {
        console.log(" - " + item.title);
    });

    console.log("Evaluating RFQ #" + rfqNumber + " ...");

    setTimeout(() => {
        if(rfqNumber in db.quotationDb) {
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

            console.log("Evaluated RFQ #" + rfqNumber + " with status " + db.quotationDb[rfqNumber].quotation.status);

            axios({
                method: "put",
                url: callbackUrl,
                data: db.quotationDb[rfqNumber].quotation
            })
            .then(res => {})
            .catch((err) => console.log("Response from rfq callback: " + err));
        }
    }, 10000);

    sender.sendResponse(res, 201);
}

