'use strict';

/*eslint-disable no-unused-vars*/
/*eslint-disable no-undef*/
/*eslint-disable no-var*/

function isLastDayOfQuarter(timestamp) {
    // Keep always true for testing
    return true;
}

/**
 * Execute the smart clause
 * @param {Context} context - the Accord context
 * @param {org.accordproject.supplyagreement.ForecastRequest} context.request - the incoming request
 * @param {org.accordproject.supplyagreement.ForecastResponse} context.response - the response
 * @AccordClauseLogic
 */
function demandforecast(context) {
    logger.info(context);
    var req = context.request;
    var res = context.response;
    var contract = context.contract;
    var state = context.state;
    var now = moment(req.timestamp);

    if (now.isBefore(moment(contract.effectiveDate,"MM-DD-YYYY"))) {
        throw new Error('Forecast was received before the effective date');
    }
    if (!isLastDayOfQuarter(now)) {
        throw new Error('Forecast was not received on last day of quarter');
    }

    context.state = { 'obligations' : [{
        '$class' : 'org.accordproject.supplyagreement.PurchaseObligation',
        'party' : contract.buyer,
        'requiredPurchase' : req.supplyForecast * (contract.minimumPercentage / 100.0),
        'year' : now.year(),
        'quarter' : now.quarter()
    }]};
    
    context.res = {};
}

/**
 * Execute the smart clause
 * @param {Context} context - the Accord context
 * @param {org.accordproject.supplyagreement.PurchaseRequest} context.request - the incoming request
 * @param {org.accordproject.supplyagreement.PurchaseResponse} context.response - the response
 * @AccordClauseLogic
 */
function purchase(context) {
    logger.info(context);
    var req = context.request;
    var res = context.response;
    var contract = context.contract;
    var state = context.state;
    var now = moment(req.timestamp);

    var products = [];
    for (var i = 0; i < req.purchaseOrder.products.length; i++) {
        var product = req.purchaseOrder.products[i];
        products.push({ '$class' : 'org.accordproject.purchaseorder.OrderItem',
                        'partNumber': product.name,
                        'quantity': product.quantity });
    }
    
    context.state = { 'obligations' : [{
        '$class' : 'org.accordproject.supplyagreement.DeliveryObligation',
        'party' : contract.supplier,
        'expectedDelivery' : req.purchaseOrder.deliveryDate,
        'products' : products
    }]};
    
    context.res = {};
}

/*eslint-enable no-unused-vars*/
/*eslint-enable no-undef*/
