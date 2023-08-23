const db = require('../utils/db.js');
const sender =  require('../utils/sender.js');
module.exports.registerRequestForQuotation = function registerRequestForQuotation(req, res) {
    const rfqNumber = req.body.rfqNumber;
    const rfq = req.body;
    
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
    req.body.items.forEach(item => {
        console.log(" - " + item.title);
    });

    console.log("Evaluating RFQ #" + rfqNumber + " ...");

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
    }, 1000);

    sender.sendResponse(res, 201, {
        rfqNumber: rfqNumber,
        links: {
            quotation: `${__baseUrl}/rfq/${rfqNumber}/quotation`
        }
    });
}
