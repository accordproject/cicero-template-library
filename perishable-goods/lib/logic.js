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
    var shipmentReceived = context.request;
    var shipment = shipmentReceived.shipment;
    var res = context.response;
    res.shipment = shipment;
    var contract = context.contract;
    var payOut = contract.unitPrice * shipmentReceived.unitCount;
    //logger.info(context);

    logger.info('Base payOut: ' + payOut);
    logger.info('Received at: ' + shipmentReceived.timestamp);
    logger.info('Contract arrivalDateTime: ' + contract.dueDate);

    if(shipmentReceived.unitCount < contract.minUnits || shipmentReceived.unitCount > contract.maxUnits) {
        throw new Error('Units received out of range for the contract.');
    }

    // if the shipment did not arrive on time the payout is zero
    if (moment(shipmentReceived.timestamp).isAfter(moment(contract.dueDate))) {
        payOut = 0;
        res.penalty = 0;
        res.late = true;
        logger.info('Late shipment');
    } else {
        res.late = false;       
        // find the lowest temperature reading
        if (shipment.sensorReadings) {
            // sort the sensorReadings by centigrade
            shipment.sensorReadings.sort(function (a, b) {
                return (a.centigrade - b.centigrade);
            });
            var lowestReading = shipment.sensorReadings[0];
            var highestReading = shipment.sensorReadings[shipment.sensorReadings.length - 1];
            var penalty = 0;
            logger.info('Lowest temp reading: ' + lowestReading.centigrade);
            logger.info('Highest temp reading: ' + highestReading.centigrade);

            // does the lowest temperature violate the contract?
            if (lowestReading.centigrade < contract.minTemperature) {
                penalty += (contract.minTemperature - lowestReading.centigrade) * contract.penaltyFactor;
                logger.info('Min temp penalty: ' + penalty);
            }

            // does the highest temperature violate the contract?
            if (highestReading.centigrade > contract.maxTemperature) {
                penalty += (highestReading.centigrade - contract.maxTemperature) * contract.penaltyFactor;
                logger.info('Max temp penalty: ' + penalty);
            }

            // sort the sensorReadings by humidity
            shipment.sensorReadings.sort(function (a, b) {
                return (a.humidity - b.humidity);
            });
            var lowestReading = shipment.sensorReadings[0];
            var highestReading = shipment.sensorReadings[shipment.sensorReadings.length - 1];
            logger.info('Lowest humidity reading: ' + lowestReading.humidity);
            logger.info('Highest humidity reading: ' + highestReading.humidity);

            // does the lowest humidity violate the contract?
            if (lowestReading.humidity < contract.minHumidity) {
                penalty += (contract.minHumidity - lowestReading.humidity) * contract.penaltyFactor;
                logger.info('Min humidity penalty: ' + penalty);
            }

            // does the highest humidity violate the contract?
            if (highestReading.humidity > contract.maxHumidity) {
                penalty += (highestReading.humidity - contract.maxHumidity) * contract.penaltyFactor;
                logger.info('Max humidity penalty: ' + penalty);
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