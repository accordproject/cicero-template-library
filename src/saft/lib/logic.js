'use strict';

/*eslint-disable no-unused-vars*/
/*eslint-disable no-undef*/
/*eslint-disable no-var*/

/**
 * Execute the smart clause
 * @param {Context} context - the Accord context
 * @param {org.accordproject.saft.Launch} context.request - the incoming request
 * @param {org.accordproject.saft.Payout} context.response - the response
 * @AccordClauseLogic
 */
function onLaunch(context) {
    logger.info(context);    
    var req = context.request;
    var res = context.response;
    var contract = context.contract;
    res.tokenAmount = 100;
    res.tokenAddress = contract.purchaser;
}

/**
 * Execute the smart clause
 * @param {Context} context - the Accord context
 * @param {io.clause.saft.Terminate} context.request - the incoming request
 * @param {io.clause.saft.Payout} context.response - the response
 * @AccordClauseLogic
 */
function onTerminate(context) {
    logger.info(context);    
    var req = context.request;
    var res = context.response;
    var contract = context.contract;
    res.tokenAmount = 9;
    res.tokenAddress = contract.purchaser;
}

/*eslint-enable no-unused-vars*/
/*eslint-enable no-undef*/