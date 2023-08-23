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

        axios({
            method: "put",
            url: callbackUrl,
            data: db.quotationDb[rfqNumber].quotation
          })
          .then(res => {})
          .catch((err) => console.log("Response from rfq callback: " + err));
        
    }, 10000);

    sender.sendResponse(res, 201);
}

