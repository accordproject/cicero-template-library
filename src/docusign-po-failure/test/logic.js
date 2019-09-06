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
    const clauseText = fs.readFileSync(path.resolve(rootDir, 'sample.md'), 'utf8');
    
    let template;
    let clause;
    let engine;    

    beforeEach( async function() {
        template = await Template.fromDirectory(rootDir);
        clause = new Clause(template);
        clause.parse(clauseText);
        engine = new Engine();
    });
    
    describe('#docusign-po-failure', async function() {

        it('should calculate the penalty when delivered after third late period', async function () {
            const request = {
                $class: 'com.docusign.connect.DocuSignEnvelopeInformation',
                envelopeStatus: {
                    $class: 'com.docusign.connect.EnvelopeStatus',
                    status : 'Completed'
                },
                recipients: [
                    {
                        status: 'Completed',
                        email: 'testRecipient@accordproject.org',
                        userName: 'testUser',
                        tabStatuses: [
                            {
                                tabType: "Custom",
                                status: "Signed",
                                tabLabel: "currencyCode",
                                tabName: "",
                                customTabType: "Text",
                                tabValue: "USD",
                                originalValue: "",
                                $class: "com.docusign.connect.TextTabStatus"
                            },
                            {
                                tabType: "Custom",
                                status: "Signed",
                                tabLabel: "actualPrice",
                                tabName: "",
                                customTabType: "Number",
                                tabValue: 2000,
                                originalValue: "",
                                $class: "com.docusign.connect.NumberTabStatus"
                            },
                            {
                                tabType: "Custom",
                                status: "Signed",
                                tabLabel: "deliveryDate",
                                tabName: "",
                                customTabType: "Date",
                                tabValue: "2019-02-08T00:00:00-07:00",
                                originalValue: "",
                                $class: "com.docusign.connect.DateTabStatus"
                            }
                        ],
                        $class: 'com.docusign.connect.Recipient'
                    }
                ],
                timestamp: '2019-03-10T17:38:01.412Z'
            };
            const state = {};
            state.$class = 'com.docusign.clauses.PurchaseOrderFailureState';
            state.stateId = 'org.accordproject.cicero.contract.AccordContractState#1';
            state.pastFailures = [];
            state.nbPastFailures = 0;
            const result = await engine.execute(clause, request, state, '2019-03-18T00:00:00Z');
            result.should.not.be.null;
            result.response.penalty.should.deep.equal({
                '$class': 'org.accordproject.money.MonetaryAmount',
                'doubleValue': 1000,
                'currencyCode': 'USD'
            });
            result.state.nbPastFailures.should.equal(1);
            result.emit[0].$class.should.equal('org.accordproject.cicero.runtime.PaymentObligation');
            result.emit[0].amount.should.deep.equal({
                '$class': 'org.accordproject.money.MonetaryAmount',
                'doubleValue': 1000,
                'currencyCode': 'USD'
            });
        });

        it('should calculate the penalty when delivered after third late period (with repeated failure penalty)', async function () {
            const request = {
                $class: 'com.docusign.connect.DocuSignEnvelopeInformation',
                envelopeStatus: {
                    $class: 'com.docusign.connect.EnvelopeStatus',
                    status : 'Completed'
                },
                recipients: [
                    {
                        status: 'Completed',
                        email: 'testRecipient@accordproject.org',
                        userName: 'testUser',
                        tabStatuses: [
                            {
                                tabType: "Custom",
                                status: "Signed",
                                tabLabel: "currencyCode",
                                tabName: "",
                                customTabType: "Text",
                                tabValue: "USD",
                                originalValue: "",
                                $class: "com.docusign.connect.TextTabStatus"
                            },
                            {
                                tabType: "Custom",
                                status: "Signed",
                                tabLabel: "actualPrice",
                                tabName: "",
                                customTabType: "Number",
                                tabValue: 2000,
                                originalValue: "",
                                $class: "com.docusign.connect.NumberTabStatus"
                            },
                            {
                                tabType: "Custom",
                                status: "Signed",
                                tabLabel: "deliveryDate",
                                tabName: "",
                                customTabType: "Date",
                                tabValue: "2019-02-08T00:00:00-07:00",
                                originalValue: "",
                                $class: "com.docusign.connect.DateTabStatus"
                            }
                        ],
                        $class: 'com.docusign.connect.Recipient'
                    }
                ],
                timestamp: '2019-03-10T17:38:01.412Z'
            };
            const state = {};
            state.$class = 'com.docusign.clauses.PurchaseOrderFailureState';
            state.stateId = 'org.accordproject.cicero.contract.AccordContractState#1';
            state.pastFailures = ["2018-11-08T05:00:00.000Z","2019-02-08T05:00:00.000Z","2019-01-08T05:00:00.000Z","2019-03-01T05:00:00.000Z","2019-02-01T05:00:00.000Z","2019-03-08T05:00:00.000Z"];
            state.nbPastFailures = 6;
            const result = await engine.execute(clause, request, state, '2019-03-18T00:00:00Z');
            result.should.not.be.null;
            result.response.penalty.should.deep.equal({
                '$class': 'org.accordproject.money.MonetaryAmount',
                'doubleValue': 1599.99,
                'currencyCode': 'USD'
            });
            result.state.nbPastFailures.should.equal(5);
            result.emit[0].$class.should.equal('org.accordproject.cicero.runtime.PaymentObligation');
            result.emit[0].amount.should.deep.equal({
                '$class': 'org.accordproject.money.MonetaryAmount',
                'doubleValue': 1599.99,
                'currencyCode': 'USD'
            });
        });

        it('should calculate the penalty when delivered after second late period', async function () {
            const request = {
                $class: 'com.docusign.connect.DocuSignEnvelopeInformation',
                envelopeStatus: {
                    $class: 'com.docusign.connect.EnvelopeStatus',
                    status : 'Completed'
                },
                recipients: [
                    {
                        status: 'Completed',
                        email: 'testRecipient@accordproject.org',
                        userName: 'testUser',
                        tabStatuses: [
                            {
                                tabType: "Custom",
                                status: "Signed",
                                tabLabel: "currencyCode",
                                tabName: "",
                                customTabType: "Text",
                                tabValue: "GBP",
                                originalValue: "",
                                $class: "com.docusign.connect.TextTabStatus"
                            },
                            {
                                tabType: "Custom",
                                status: "Signed",
                                tabLabel: "actualPrice",
                                tabName: "",
                                customTabType: "Number",
                                tabValue: 2000,
                                originalValue: "",
                                $class: "com.docusign.connect.NumberTabStatus"
                            },
                            {
                                tabType: "Custom",
                                status: "Signed",
                                tabLabel: "deliveryDate",
                                tabName: "",
                                customTabType: "Date",
                                tabValue: "2019-03-08T00:00:00-07:00",
                                originalValue: "",
                                $class: "com.docusign.connect.DateTabStatus"
                            }
                        ],
                        $class: 'com.docusign.connect.Recipient'
                    }
                ],
                timestamp: '2019-03-10T17:38:01.412Z'
            };
            const state = {};
            state.$class = 'com.docusign.clauses.PurchaseOrderFailureState';
            state.stateId = 'org.accordproject.cicero.contract.AccordContractState#1';
            state.pastFailures = [];
            state.nbPastFailures = 0;
            const result = await engine.execute(clause, request, state, '2019-03-18T00:00:00Z');
            result.should.not.be.null;
            result.response.penalty.should.deep.equal({
                '$class': 'org.accordproject.money.MonetaryAmount',
                'doubleValue': 200,
                'currencyCode': 'GBP'
            });
            result.state.nbPastFailures.should.equal(1);
            result.emit[0].$class.should.equal('org.accordproject.cicero.runtime.PaymentObligation');
            result.emit[0].amount.should.deep.equal({
                '$class': 'org.accordproject.money.MonetaryAmount',
                'doubleValue': 200,
                'currencyCode': 'GBP'
            });
        });
        
        it('should calculate the penalty when delivered after first late period', async function () {
            const request = {
                $class: 'com.docusign.connect.DocuSignEnvelopeInformation',
                envelopeStatus: {
                    $class: 'com.docusign.connect.EnvelopeStatus',
                    status : 'Completed'
                },
                recipients: [
                    {
                        status: 'Completed',
                        email: 'testRecipient@accordproject.org',
                        userName: 'testUser',
                        tabStatuses: [
                            {
                                tabType: "Custom",
                                status: "Signed",
                                tabLabel: "currencyCode",
                                tabName: "",
                                customTabType: "Text",
                                tabValue: "USD",
                                originalValue: "",
                                $class: "com.docusign.connect.TextTabStatus"
                            },
                            {
                                tabType: "Custom",
                                status: "Signed",
                                tabLabel: "actualPrice",
                                tabName: "",
                                customTabType: "Number",
                                tabValue: 2000,
                                originalValue: "",
                                $class: "com.docusign.connect.NumberTabStatus"
                            },
                            {
                                tabType: "Custom",
                                status: "Signed",
                                tabLabel: "deliveryDate",
                                tabName: "",
                                customTabType: "Date",
                                tabValue: "2019-03-11T00:00:00-07:00",
                                originalValue: "",
                                $class: "com.docusign.connect.DateTabStatus"
                            }
                        ],
                        $class: 'com.docusign.connect.Recipient'
                    }
                ],
                timestamp: '2019-03-10T17:38:01.412Z'
            };
            const state = {};
            state.$class = 'com.docusign.clauses.PurchaseOrderFailureState';
            state.stateId = 'org.accordproject.cicero.contract.AccordContractState#1';
            state.pastFailures = [];
            state.nbPastFailures = 0;
            const result = await engine.execute(clause, request, state, '2019-03-13T00:00:00Z');
            result.should.not.be.null;
            result.response.penalty.should.deep.equal({
                '$class': 'org.accordproject.money.MonetaryAmount',
                'doubleValue': 100,
                'currencyCode': 'USD'
            });
            result.state.nbPastFailures.should.equal(1);
            result.emit[0].$class.should.equal('org.accordproject.cicero.runtime.PaymentObligation');
            result.emit[0].amount.should.deep.equal({
                '$class': 'org.accordproject.money.MonetaryAmount',
                'doubleValue': 100,
                'currencyCode': 'USD'
            });
        });

        it('should set the penalty to zero if not late', async function () {
            const request = {
                $class: 'com.docusign.connect.DocuSignEnvelopeInformation',
                envelopeStatus: {
                    $class: 'com.docusign.connect.EnvelopeStatus',
                    status : 'Completed'
                },
                recipients: [
                    {
                        status: 'Completed',
                        email: 'testRecipient@accordproject.org',
                        userName: 'testUser',
                        tabStatuses: [
                            {
                                tabType: "Custom",
                                status: "Signed",
                                tabLabel: "currencyCode",
                                tabName: "",
                                customTabType: "Text",
                                tabValue: "USD",
                                originalValue: "",
                                $class: "com.docusign.connect.TextTabStatus"
                            },
                            {
                                tabType: "Custom",
                                status: "Signed",
                                tabLabel: "actualPrice",
                                tabName: "",
                                customTabType: "Number",
                                tabValue: 2000,
                                originalValue: "",
                                $class: "com.docusign.connect.NumberTabStatus"
                            },
                            {
                                tabType: "Custom",
                                status: "Signed",
                                tabLabel: "deliveryDate",
                                tabName: "",
                                customTabType: "Date",
                                tabValue: "2019-03-20T00:00:00-07:00",
                                originalValue: "",
                                $class: "com.docusign.connect.DateTabStatus"
                            }
                        ],
                        $class: 'com.docusign.connect.Recipient'
                    }
                ],
                timestamp: '2019-03-08T17:38:01.412Z'
            };
            const state = {};
            state.$class = 'com.docusign.clauses.PurchaseOrderFailureState';
            state.stateId = 'org.accordproject.cicero.contract.AccordContractState#1';
            state.pastFailures = [];
            state.nbPastFailures = 0;
            const result = await engine.execute(clause, request, state, '2019-03-18T00:00:00Z');
            result.should.not.be.null;
            result.response.penalty.should.deep.equal({
                '$class': 'org.accordproject.money.MonetaryAmount',
                'doubleValue': 0,
                'currencyCode': 'USD'
            });
            result.state.nbPastFailures.should.equal(0);
            result.emit.should.deep.equal([]);
        });
    });
});