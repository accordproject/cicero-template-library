/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable no-var */

/**
 * Execute the smart clause
 * @param {Context} context - the Accord context
 * @param {io.clause.demo.fragileGoods.DeliveryUpdate} context.request - the incoming request
 * @param {io.clause.demo.fragileGoods.PayOut} context.response - the response
 * @AccordClauseLogic
 */
function execute(context) {
    // logger.info(context);
    var req = context.request;
    var res = context.response;
    var contract = context.contract;

    // contract data is read-only, so we need to clone
    res.amount = factory.newConcept( contract.deliveryPrice.getNamespace(), contract.deliveryPrice.getType());
    res.amount.doubleValue = contract.deliveryPrice.doubleValue;
    res.amount.currencyCode = contract.deliveryPrice.currencyCode;

    if(contract.deliveryPrice.currencyCode === 'XYZ') {
        throw new Error("What!");
    }

    req.accelerometerReadings.forEach(function(r){
        if(r > data.accelerationMax){
            res.amount.doubleValue -= contract.accelerationBreachPenalty.doubleValue;
        }
        if(r < data.accelerationMin){
            res.amount.doubleValue -= contract.accelerationBreachPenalty.doubleValue;
        }
    });

    if(req.status=='ARRIVED'){
        switch(data.deliveryLimitDuration.unit){
            case 'seconds':
                var duration = req.finishTime.getTime() - req.startTime.getTime();
                if((duration / 1000) > contract.deliveryLimitDuration.amount){
                    res.amount.doubleValue -= contract.lateDeliveryPenalty.doubleValue;
                }
                break;
            default:
                // TODO (MR) Implement other units
        }
    }
    
}

/* eslint-enable no-unused-vars */
/* eslint-enable no-undef */
