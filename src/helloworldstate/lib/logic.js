'use strict';

/*eslint-disable no-unused-vars*/
/*eslint-disable no-undef*/
/*eslint-disable no-var*/

/**
 * Execute the smart clause
 * @param {Context} context - the Accord context
 * @param {org.accordproject.helloworldstate.MyRequest} context.request - the incoming request
 * @param {org.accordproject.helloworldstate.MyResponse} context.response - the response
 * @AccordClauseLogic
 */
function execute(context) {
    // logger.info(context);
    var req = context.request;
    var res = context.response;
		var contract = context.contract;
		var state = context.state;

		context.state = serializer.fromJSON({
        "$class": "org.accordproject.helloworldstate.HelloWorldState",
        "stateId": "org.accordproject.helloworldstate.HelloWorldState#"+(state.counter+1),
        'counter' : state.counter + 1
    });
    res.output = 'Hello ' + contract.name + ' ' + request.input + '(' + context.state.counter + ')';
}

/*eslint-enable no-unused-vars*/
/*eslint-enable no-undef*/
