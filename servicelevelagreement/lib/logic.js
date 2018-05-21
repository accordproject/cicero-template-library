'use strict';

/*eslint-disable no-unused-vars*/
/*eslint-disable no-undef*/
/*eslint-disable no-var*/

/**
 * Execute the smart clause
 * @param {Context} context - the Accord context
 * @param {org.accordproject.servicelevelagreement.MonthSummary} context.request - the incoming request
 * @param {org.accordproject.servicelevelagreement.InvoiceCredit} context.response - the response
 * @AccordClauseLogic
 */
function execute(context) {
    // logger.info(context);
    var req = context.request;
    var res = context.response;
    var contract = context.contract;

    // Pre-conditions checking
    if(contract.availability1 < 0 
        || contract.serviceCredit1 < 0 
        || contract.availability2 < 0 
        || contract.serviceCredit2 < 0){
            throw new Error('Template variables must not be negative.')
        }

    if(req.monthlyServiceLevel < 0 
        || req.monthlyServiceLevel > 100){
            throw new Error('A service level must be at least 0% and at most 100%.')
        }


    // Set default credit
    res.monthlyCredit = 0;

    //
    // Section 3
    //

    // Annex 1, schedule - row 2
    if(req.monthlyServiceLevel < contract.availability2){
        res.monthlyCredit = (contract.serviceCredit2 / 100.0) * req.monthlyCharge;
    // Annex 1, schedule - row 1
    } else if (req.monthlyServiceLevel < contract.availability1){
        res.monthlyCredit = (contract.serviceCredit1 / 100.0) * req.monthlyCharge;
    }

    // Clause 3.3
    res.monthlyCredit = Math.min(res.monthlyCredit, (contract.monthlyCapPercentage  / 100.0 ) * req.monthlyCharge);

    // Clause 3.4
    var yearlyCreditCap = ( contract.yearlyCapPercentage / 100.0) * (req.last11MonthCharge+req.monthlyCharge);
    res.monthlyCredit = Math.min(res.monthlyCredit, yearlyCreditCap - req.last11MonthCredit);

    // Safety checking
    res.monthlyCredit = res.monthlyCredit.toFixed(2) // Round to 2 decimal places
    res.monthlyCredit = Math.max(0, res.monthlyCredit); // Make sure that the credit is at least 0

}

/*eslint-enable no-unused-vars*/
/*eslint-enable no-undef*/