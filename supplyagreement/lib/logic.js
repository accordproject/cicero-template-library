'use strict';

/*eslint-disable no-unused-vars*/
/*eslint-disable no-undef*/
/*eslint-disable no-var*/

// Auxiliary function to compute the last day of the current quarter
function isLastDayOfQuarter(timestamp) {
    // Keep always true for testing
    return true;
}

// Auxiliary function to locate the right obligation
function findObligation(obligations,kind) {
    for (var i = 0; i < obligations.length; i++) {
        logger.info('Found obligation: ' + obligations[i].getClassDeclaration().getFullyQualifiedName());
        if (obligations[i].getClassDeclaration().getFullyQualifiedName() === kind) {
            return obligations[i];
        }
    }
    return null;
}

// Auxiliary function to compute the price of a purchase order
function purchaseOrderPrice(products) {
    var price = 0;
    for (var i = 0; i < products.length; i++) {
        var product = products[i];
        price += product.quantity * product.unitPrice;
    }
    logger.info('Purchase Order total: ' + price);
    return price;
}

// Auxiliary function to check if delivery matches the order
function deliveryMatches(delivery,po) {
    // TBD
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
    var req = context.request;
    var res = context.response;
    var contract = context.contract;
    var state = context.state;
    var now = moment(req.timestamp);
    //logger.info(context);

    if (now.isBefore(moment(contract.effectiveDate,'MM-DD-YYYY'))) {
        throw new Error('Forecast was received before the effective date');
    }
    if (!isLastDayOfQuarter(now)) {
        throw new Error('Forecast was not received on last day of quarter');
    }

    var requiredPurchase = req.supplyForecast * (contract.minimumPercentage / 100.0);
    logger.info('Required purchase: ' + requiredPurchase);
    context.state = serializer.fromJSON({
        '$class' : 'org.accordproject.supplyagreement.AgreementState',
        'stateId' : state.stateId,
        'obligations' : [{
            '$class' : 'org.accordproject.supplyagreement.PurchaseObligation',
            'party' : contract.buyer,
            'requiredPurchase' : requiredPurchase,
            'year' : now.year(),
            'quarter' : now.quarter()
        }]});
    
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

    var purchaseObligation = findObligation(state.obligations,'org.accordproject.supplyagreement.PurchaseObligation');
    if (!purchaseObligation) {
        throw new Error('Could not find purchase obligation')
    } else if (purchaseObligation.requiredPurchase > purchaseOrderPrice(req.purchaseOrder.products)) {
        throw new Error('Purchase must be at least: ' + purchaseObligation.requiredPurchase);
    }
    
    var products = [];
    for (var i = 0; i < req.purchaseOrder.products.length; i++) {
        var product = req.purchaseOrder.products[i];
        products.push({ '$class' : 'org.accordproject.purchaseorder.OrderItem',
                        'partNumber': product.name,
                        'quantity': product.quantity });
    }
    
    context.state = serializer.fromJSON({
        '$class' : 'org.accordproject.supplyagreement.AgreementState',
        'stateId' : state.stateId,
        'obligations' : [{
            '$class' : 'org.accordproject.supplyagreement.DeliveryObligation',
            'party' : contract.supplier,
            'expectedDelivery' : req.purchaseOrder.deliveryDate,
            'deliverables' : products
        }]});
    
    context.res = {};
}

/**
 * Execute the smart clause
 * @param {Context} context - the Accord context
 * @param {org.accordproject.supplyagreement.DeliveryRequest} context.request - the incoming request
 * @param {org.accordproject.supplyagreement.DeliveryResponse} context.response - the response
 * @AccordClauseLogic
 */
function delivery(context) {
    logger.info(context);
    var req = context.request;
    var res = context.response;
    var contract = context.contract;
    var state = context.state;
    var now = moment(req.timestamp);

    var deliveryObligation = findObligation(state.obligations,'org.accordproject.supplyagreement.DeliveryObligation');

    if (!deliveryMatches(deliveryObligation,req.products)) {
        throw new Error('Delivery does not match the purchase order');
    }

    context.state = serializer.fromJSON({
        '$class' : 'org.accordproject.supplyagreement.AgreementState',
        'stateId' : state.stateId,
        'obligations' : [{
            '$class' : 'org.accordproject.supplyagreement.PaymentObligation',
            'party' : contract.buyer,
            'amount' : purchaseOrderPrice(req.products)
        }]});
    
        context.res = {};
}

/*eslint-enable no-unused-vars*/
/*eslint-enable no-undef*/
