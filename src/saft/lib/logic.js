'use strict';

/*eslint-disable no-unused-vars*/
/*eslint-disable no-undef*/
/*eslint-disable no-var*/

/**
 * Execute the smart clause
 * @param {Context} context - the Accord context
 * @param {org.accordproject.saft.Launch} context.request - the incoming request
 * @param {org.accordproject.saft.Payout} context.response - the response
 * @param {Event} context.emit - the emitted events
 * @AccordClauseLogic
 */
function onLaunch(context) {
    logger.info(context);    
    var req = context.request;
    var res = context.response;
    var contract = context.contract;
    res.tokenAmount = factory.newConcept('org.accordproject.money', 'MonetaryAmount');
    res.tokenAmount.doubleValue = 100;
    res.tokenAmount.currencyCode = 'USD';
    res.tokenAddress = contract.purchaser;
}

/**
 * Execute the smart clause
 * @param {Context} context - the Accord context
 * @param {org.accordproject.saft.Terminate} context.request - the incoming request
 * @param {org.accordproject.saft.Payout} context.response - the response
 * @param {Event} context.emit - the emitted events
 * @AccordClauseLogic
 */
function onTerminate(context) {
    logger.info(context);    
    var req = context.request;
    var res = context.response;
    var contract = context.contract;
    res.tokenAmount = factory.newConcept('org.accordproject.money', 'MonetaryAmount');
    res.tokenAmount.doubleValue = 9;
    res.tokenAmount.currencyCode = 'USD';
    res.tokenAddress = contract.purchaser;
}

/*eslint-enable no-unused-vars*/
/*eslint-enable no-undef*/