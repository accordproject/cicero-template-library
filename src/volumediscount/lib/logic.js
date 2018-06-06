'use strict';

/*eslint-disable no-unused-vars*/
/*eslint-disable no-undef*/
/*eslint-disable no-var*/

/**
 * Execute the smart clause
 * @param {Context} context - the Accord context
 * @param {org.accordproject.volumediscount.VolumeDiscountRequest} context.request - the incoming request
 * @param {org.accordproject.volumediscount.VolumeDiscountResponse} context.response - the response
 * @AccordClauseLogic
 */
function execute(context) {

    logger.info(context);
    var req = context.request;
    var res = context.response;
    var contract = context.contract;

    // decision table
    var netAnnualChargeVolume = req.netAnnualChargeVolume;

    if (netAnnualChargeVolume < contract.firstVolume) {
        res.discountRate = contract.firstRate;
    } else if (netAnnualChargeVolume < contract.secondVolume) {
        res.discountRate = contract.secondRate;
    } else {
        res.discountRate = contract.thirdRate;
    }
    
}

/*eslint-enable no-unused-vars*/
/*eslint-enable no-undef*/