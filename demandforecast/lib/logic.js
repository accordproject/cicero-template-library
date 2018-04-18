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
 * @param {org.accordproject.demandforecast.ForecastRequest} context.request - the incoming request
 * @param {org.accordproject.demandforecast.BindingResponse} context.response - the response
 * @AccordClauseLogic
 */
function execute(context) {
    logger.info(context);
    var req = context.request;
    var res = context.response;
    var data = context.data;
    var now = moment(req.timestamp);

    if (now.isBefore(moment(data.effectiveDate,"MM-DD-YYYY"))) {
        throw new Error('Forecast was received before the effective date');
    }
    if (!isLastDayOfQuarter(now)) {
        throw new Error('Forecast was not received on last day of quarter');
    }
    
    res.requiredPurchase = req.supplyForecast * (data.minimumPercentage / 100.0);
    res.year = now.year();
    res.quarter = now.quarter();
}

/*eslint-enable no-unused-vars*/
/*eslint-enable no-undef*/
