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

const Template = require('@accordproject/cicero-core').Template;
const Clause = require('@accordproject/cicero-core').Clause;
const Engine = require('@accordproject/cicero-engine').Engine;

const fs = require('fs');
const path = require('path');
const chai = require('chai');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));
const moment = require('moment');

describe('Logic', () => {

    const rootDir = path.resolve(__dirname, '..');
    const clauseText = fs.readFileSync(path.resolve(rootDir, 'sample.txt'), 'utf8');

    let template;
    let clause;
    let engine;    

    beforeEach( async function() {
        template = await Template.fromDirectory(rootDir);
        clause = new Clause(template);
        clause.parse(clauseText);
        engine = new Engine();
    });
    
    describe('#SupplyAgreement', async function() {

        it('should execute a demand forecast', async function () {
            const request = {
                "$class": "org.accordproject.supplyagreement.ForecastRequest",
                "supplyForecast": 1200.0
            };
            const state = {};
            state.$class = 'org.accordproject.supplyagreement.AgreementState';
            state.stateId = 'org.accordproject.supplyagreement.AgreementState#1';
            state.purchaseObligation = null;
            state.deliveryObligation = null;
            state.paymentObligation = null;
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.state.purchaseObligation.requiredPurchase.should.equal(1020.0);
            result.state.purchaseObligation.party.should.equal("PETER");
        });

        it('should execute a purchase order', async function () {
            const request = {
                "$class": "org.accordproject.supplyagreement.PurchaseRequest",
                "purchaseOrder": {
                    "$class": "org.accordproject.purchaseorder.PurchaseOrder",
                    "products": [
                        {
                            "$class": "org.accordproject.purchaseorder.Product",
                            "partNumber": "PN-001",
                            "name": "Pink Umbrella",
                            "quantity": 180,
                            "unitPrice": 5.99
                        },
                        {
                            "$class": "org.accordproject.purchaseorder.Product",
                            "partNumber": "PN-002",
                            "name": "Blue Umbrella",
                            "quantity": 100,
                            "unitPrice": 4.99
                        }
                    ],
                    "deliveryDate": "2018/05/10",
                    "deliveryLocation": "555 Main Street"
                }
            };
            const state = {};
            state.$class = 'org.accordproject.supplyagreement.AgreementState';
            state.stateId = 'org.accordproject.supplyagreement.AgreementState#1';
            state.purchaseObligation = {
                "$class": "org.accordproject.supplyagreement.PurchaseObligation",
                "requiredPurchase": 1020,
                "year": 2018,
                "quarter": 4,
                "party": "PETER"
            };
            state.deliveryObligation = null;
            state.paymentObligation = null;
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.state.deliveryObligation.deliverables[0].partNumber.should.equal("Pink Umbrella");
            result.state.deliveryObligation.party.should.equal("DAN");
        });

        it('should execute a delivery', async function () {
            const request = {
                "$class": "org.accordproject.supplyagreement.DeliveryRequest",
                "products": [
                    {
                        "$class": "org.accordproject.purchaseorder.Product",
                        "partNumber": "PN-001",
                        "name": "Pink Umbrella",
                        "quantity": 180,
                        "unitPrice": 5.99
                    },
                    {
                        "$class": "org.accordproject.purchaseorder.Product",
                        "partNumber": "PN-002",
                        "name": "Blue Umbrella",
                        "quantity": 100,
                        "unitPrice": 4.99
                    }
                ]
            };

            const state = {};
            state.$class = 'org.accordproject.supplyagreement.AgreementState';
            state.stateId = 'org.accordproject.supplyagreement.AgreementState#1';
            state.purchaseObligation = null;
            state.deliveryObligation = {
                "$class": "org.accordproject.supplyagreement.DeliveryObligation",
                "expectedDelivery": "2018-05-10T04:00:00.000Z",
                "deliverables": [
                    {
                        "$class": "org.accordproject.purchaseorder.OrderItem",
                        "partNumber": "Pink Umbrella",
                        "quantity": 180
                    }, 
                    {
                        "$class": "org.accordproject.purchaseorder.OrderItem",
                        "partNumber": "Blue Umbrella",
                        "quantity": 100
                    }
                ],
                "party": "DAN"
            };
            state.paymentObligation = null;
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.state.paymentObligation.amount.should.equal(1577.2);
            result.state.paymentObligation.party.should.equal("PETER");
        });
    });
});
