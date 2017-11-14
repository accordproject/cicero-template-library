'use strict';

/*eslint-disable no-unused-vars*/
/*eslint-disable no-undef*/
/*eslint-disable no-var*/

/**
 * Execute the smart clause
 * @param {Context} context - the Accord context
 * @param {io.clause.saft.Launch} context.request - the incoming request
 * @param {io.clause.saft.Payout} context.response - the response
 * @AccordClauseLogic
 */
function onLaunch(context) {
    logger.info(context);    
    var req = context.request;
    var res = context.response;
    var data = context.data;
    res.tokenAmount = 100;
    res.tokenAddress = data.purchaser;
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
    var data = context.data;
    res.tokenAmount = 9;
    res.tokenAddress = data.purchaser;
}

/*eslint-enable no-unused-vars*/
/*eslint-enable no-undef*/