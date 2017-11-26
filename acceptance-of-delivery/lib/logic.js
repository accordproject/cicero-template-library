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
 * @param {org.accordproject.acceptanceofdelivery.InspectDeliverable} context.request - the incoming request
 * @param {org.accordproject.acceptanceofdelivery.InspectionResponse} context.response - the response
 * @AccordClauseLogic
 */
function execute(context) {
    var req = context.request;
    var res = context.response;
    var data = context.data;
    var now = moment(req.timestamp);
    var received = moment(req.deliverableReceivedAt);
    
    if(now.isBefore(received)) {
        throw new Error('Timetamp of the transaction is before the deliverable date.')
    }

    if(now.isAfter(received.add(data.businessDays, 'days'))) {
        res.status = "OUTSIDE_INSPECTION_PERIOD";        
    }
    else if(req.inspectionPassed) {
        res.status = "PASSED_TESTING";        
    }
    else {
        res.status = "FAILED_TESTING";        
    }

    res.shipper = factory.newRelationship('org.hyperledger.composer.system', 'Participant', data.shipper);
    res.receiver = factory.newRelationship('org.hyperledger.composer.system', 'Participant', data.receiver);
    logger.info(context);
}

/* eslint-enable no-unused-vars */
/* eslint-enable no-undef */
