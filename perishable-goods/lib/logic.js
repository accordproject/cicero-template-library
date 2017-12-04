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
 * @param {org.accordproject.perishablegoods.ShipmentReceived} context.request - the incoming request
 * @param {org.accordproject.perishablegoods.PriceCalculation} context.response - the response
 * @AccordClauseLogic
 */
function payOut(context) {

    logger.info(context);
    
    var shipmentReceived = context.request;
    var shipment = shipmentReceived.shipment;
    var res = context.response;
    res.shipment = shipment;
    var data = context.data;
    var payOut = data.unitPrice * shipmentReceived.unitCount;

    logger.info('Base payOut: ' + payOut);
    logger.info('Received at: ' + shipmentReceived.timestamp);
    logger.info('Contract arrivalDateTime: ' + data.dueDate);

    if(shipmentReceived.unitCount < data.minUnits || shipmentReceived.unitCount > data.maxUnits) {
        throw new Error('Units received out of range for the contract.');
    }

    // if the shipment did not arrive on time the payout is zero
    if (shipmentReceived.timestamp > data.dueDate) {
        payOut = 0;
        res.late = true;
        logger.info('Late shipment');
    } else {
        res.late = false;       
        // find the lowest temperature reading
        if (shipment.temperatureReadings) {
            // sort the temperatureReadings by centigrade
            shipment.temperatureReadings.sort(function (a, b) {
                return (a.centigrade - b.centigrade);
            });
            var lowestReading = shipment.temperatureReadings[0];
            var highestReading = shipment.temperatureReadings[shipment.temperatureReadings.length - 1];
            var penalty = 0;
            logger.info('Lowest temp reading: ' + lowestReading.centigrade);
            logger.info('Highest temp reading: ' + highestReading.centigrade);

            // does the lowest temperature violate the contract?
            if (lowestReading.centigrade < data.minTemperature) {
                penalty += (data.minTemperature - lowestReading.centigrade) * data.minPenaltyFactor;
                logger.info('Min temp penalty: ' + penalty);
            }

            // does the highest temperature violate the contract?
            if (highestReading.centigrade > data.maxTemperature) {
                penalty += (highestReading.centigrade - data.maxTemperature) * data.maxPenaltyFactor;
                logger.info('Max temp penalty: ' + penalty);
            }

            // apply any penalities
            var totalPenalty = penalty * shipmentReceived.unitCount;
            res.penalty = totalPenalty;
            payOut -= totalPenalty;

            if (payOut < 0) {
                payOut = 0;
            }
        }
        else {
            throw new Error('No temperature readings received.');
        }
    }

    logger.info('Payout: ' + payOut);
    res.totalPrice = payOut;
    logger.info(context);
}

/* eslint-enable no-unused-vars */
/* eslint-enable no-undef */