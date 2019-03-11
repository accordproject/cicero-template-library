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

/*eslint-disable no-unused-vars*/
/*eslint-disable no-undef*/
/*eslint-disable no-var*/

/**
 * Execute the smart clause
 * @param {Context} context - the Accord context
 * @param {com.docusign.connect.DocuSignEnvelopeInformation} context.request - the incoming request
 * @param {com.docusign.clauses.PurchaseOrderFailureResponse} context.response - the response
 * @param {org.accordproject.cicero.runtime.PaymentObligation} context.emit - the emitted events
 * @AccordClauseLogic
 */
function execute(context) {
  const req = context.request;
  const res = context.response;
  const contract = context.contract;
  const emit = context.emit;
  const now = moment(req.timestamp);

  const deliveryDateStr = context.request.customFields.filter(obj => obj.name === "deliveryDate")[0].value;
  const deliveryDate = moment(Date.parse(deliveryDateStr));

  const actualPriceStr = context.request.customFields.filter(obj => obj.name === "actualPrice")[0].value;
  const actualPrice = parseFloat(actualPriceStr);

  const currencyCode = context.request.customFields.filter(obj => obj.name === "currencyCode")[0].value;

  const initialPenalty = factory.newConcept('org.accordproject.money', 'MonetaryAmount');
  initialPenalty.doubleValue = 0;
  initialPenalty.currencyCode = currencyCode;
  res.penalty = initialPenalty;

  if (now.isAfter(deliveryDate)) {
    let penaltyPercent;

    // because the units for each late duration may be different, check each diff separately
    const diff3 = now.diff(deliveryDate, contract.lateThree.unit);
    const diff2 = now.diff(deliveryDate, contract.lateTwo.unit);
    const diff1 = now.diff(deliveryDate, contract.lateOne.unit);

    if (diff3 > contract.lateThree.amount) {
      penaltyPercent = contract.lateThreePercent;
    } else if (diff2 > contract.lateTwo.amount) {
      penaltyPercent = contract.lateTwoPercent;
    } else if (diff1 > contract.lateOne.amount) {
      penaltyPercent = contract.lateOnePercent;
    } else {
      penaltyPercent = 0;
    }

    if (penaltyPercent) {
      const penalty = penaltyPercent / 100 * actualPrice;
      const amount = factory.newConcept('org.accordproject.money', 'MonetaryAmount');
      amount.doubleValue = penalty;
      amount.currencyCode = currencyCode;
      res.penalty = amount;

      const obligation = factory.newEvent('org.accordproject.cicero.runtime', 'PaymentObligation');
      obligation.amount = amount;
      obligation.promisee = factory.newRelationship('org.accordproject.cicero.contract', 'AccordParty', contract.buyer.getIdentifier());
      obligation.contract = factory.newRelationship('org.accordproject.cicero.contract', 'AccordContract', contract.getIdentifier());
      obligation.description = 'Payment due for purchase order including penalty discount';
      emit.push(obligation);
    }
  }
}

/*eslint-disable no-unused-vars*/
/*eslint-disable no-undef*/