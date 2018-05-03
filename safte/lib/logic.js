'use strict';

/*eslint-disable no-unused-vars*/
/*eslint-disable no-undef*/
/*eslint-disable no-var*/

/**
 * Execute the smart clause
 * @param {Context} context - the Accord context
 * @param {org.accordproject.safte.TokenSale} context.request - the incoming request
 * @param {org.accordproject.safte.TokenShare} context.response - the response
 * @AccordClauseLogic
 */
function tokenSale(context) {
    logger.info(context);    
    var req = context.request;
    var res = context.response;
    var data = context.data;
		var discountRate = (100.0 - data.discount) / 100.00;
		var discountPrice = req.tokenPrice * discountRate;
    res.tokenAmount = data.purchaseAmount / discountPrice;
}

/**
 * Execute the smart clause
 * @param {Context} context - the Accord context
 * @param {org.accordproject.safte.EquityFinancing} context.request - the incoming request
 * @param {org.accordproject.safte.EquityShare} context.response - the response
 * @AccordClauseLogic
 */
function equityFinancing(context) {
    logger.info(context);    
    var req = context.request;
    var res = context.response;
    var data = context.data;
		var discountRate = (100.0 - data.discount) / 100.00;
		var discountPrice = req.sharePrice * discountRate;
    res.equityAmount = data.purchaseAmount / discountPrice;
}

/**
 * Execute the smart clause
 * @param {Context} context - the Accord context
 * @param {org.accordproject.safte.DissolutionEvent} context.request - the incoming request
 * @param {org.accordproject.safte.PayOut} context.response - the response
 * @AccordClauseLogic
 */
function disolutionEvent(context) {
    logger.info(context);    
    var req = context.request;
    var res = context.response;
    var data = context.data;
    res.amount = data.purchaseAmount;
}

/*eslint-enable no-unused-vars*/
/*eslint-enable no-undef*/