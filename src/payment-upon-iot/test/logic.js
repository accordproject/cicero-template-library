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
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));
const moment = require('moment');

describe('Logic', () => {

    const rootDir = path.resolve(__dirname, '..');
    const clauseText = fs.readFileSync(path.resolve(rootDir, 'sample.txt'), 'utf8');

    let template;
    let clause;
    let engine;    
    let state = {};
    state.$class = 'org.accordproject.payment.iot.CounterState';
    state.stateId = '1';
    state.status = 'INITIALIZED';
    state.counter = 0.0;
    state.paymentCount = 0.0;

    beforeEach( async function() {
        template = await Template.fromDirectory(rootDir);
        clause = new Clause(template);
        clause.parse(clauseText);
        engine = new Engine();

        // init the contract
        const request = {};
        request.$class = 'org.accordproject.cicero.runtime.Request';
        const result = await engine.execute(clause, request, state);
        result.should.not.be.null;
        result.response.counter.should.equal(0);
        result.response.paymentCount.should.equal(0);
        result.state.status.should.equal("INITIALIZED");
        result.state.counter.should.equal(0);
        result.state.paymentCount.should.equal(0);
    });
    
    describe('#PaymentUponIoT', async function() {

        it('should transition to RUNNING on ContractSigned', async function() {
            // contract signed
            const request = {};
            request.$class = 'org.accordproject.signature.ContractSigned';
            request.contract = 'MY_CONTRACT';
            const result = await engine.execute(clause, request, state);

            // check emitted payment obligation
            result.should.not.be.null;
            result.response.counter.should.equal(0);
            result.response.paymentCount.should.equal(0);    
            result.state.status.should.equal("RUNNING");
            result.state.counter.should.equal(0);
        });

        it('should increment counter on short press', async function() {

            const request = {};
            request.$class = 'org.accordproject.iot.SingleButtonPress';
            state.status = 'RUNNING';
            
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.counter.should.equal(1);
            result.response.paymentCount.should.equal(0);    
            result.state.counter.should.equal(1)
        });

        it('should decrement counter on double press', async function() {

            const request = {};
            request.$class = 'org.accordproject.iot.DoubleButtonPress';
            state.status = 'RUNNING';
            state.counter = 3;
            
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.counter.should.equal(2);
            result.response.paymentCount.should.equal(0);    
            result.state.counter.should.equal(2)
        });

        it('counter should not be negative on double press', async function() {

            const request = {};
            request.$class = 'org.accordproject.iot.DoubleButtonPress';
            state.status = 'RUNNING';
            state.counter = 0;
            
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.counter.should.equal(0);
            result.response.paymentCount.should.equal(0);    
            result.state.counter.should.equal(0)
        });

        it('should emit payment obligation on long press', async function() {

            const request = {};
            request.$class = 'org.accordproject.iot.SingleButtonPress';
            state.status = 'RUNNING';
            
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.counter.should.equal(1);
            result.response.paymentCount.should.equal(0);
            result.state.counter.should.equal(1)

            const request2 = {};
            request2.$class = 'org.accordproject.iot.LongButtonPress';

            const result2 = await engine.execute(clause, request2, result.state);
            result2.should.not.be.null;
            result2.response.counter.should.equal(1);
            result2.response.paymentCount.should.equal(0);
            result2.state.status.should.equal("RUNNING")
            result2.emit[0].$class.should.equal('org.accordproject.cicero.runtime.PaymentObligation');
            result2.emit[0].amount.doubleValue.should.equal(10.00);
            result2.emit[0].amount.currencyCode.should.equal("USD");
        });

        it('should log received payments', async function() {

            const request = {};
            request.$class = 'org.accordproject.payment.iot.MonetaryAmountPayment';
            request.amount = {
                doubleValue: 10.0,
                currencyCode: "USD"
            }
            state.status = 'RUNNING';
            
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.counter.should.equal(0);
            result.response.paymentCount.should.equal(1);
            result.state.paymentCount.should.equal(1)
        });

        it('should complete when the maximum payments received', async function() {

            const request = {};
            request.$class = 'org.accordproject.payment.iot.MonetaryAmountPayment';
            request.amount = {
                doubleValue: 10.0,
                currencyCode: "USD"
            }
            state.status = 'RUNNING';
            state.paymentCount = 4;
            
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.counter.should.equal(0);
            result.response.paymentCount.should.equal(5);
            result.state.paymentCount.should.equal(5);
            result.state.status.should.equal('COMPLETED');
        });

        it('should reduce counter by payment amount', async function() {

            const request = {};
            request.$class = 'org.accordproject.payment.iot.MonetaryAmountPayment';
            request.amount = {
                doubleValue: 20.0,
                currencyCode: "USD"
            }
            state.status = 'RUNNING';
            state.paymentCount = 0;
            state.counter = 4;
            
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.counter.should.equal(2);
            result.state.counter.should.equal(2);
            result.response.paymentCount.should.equal(1);
            result.state.paymentCount.should.equal(1);
            result.state.status.should.equal('RUNNING');
        });

        it('counter should never be negative', async function() {

            const request = {};
            request.$class = 'org.accordproject.payment.iot.MonetaryAmountPayment';
            request.amount = {
                doubleValue: 1000.0,
                currencyCode: "USD"
            }
            state.status = 'RUNNING';
            state.paymentCount = 0;
            state.counter = 4;
            
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.counter.should.equal(0);
            result.response.paymentCount.should.equal(1);
            result.state.paymentCount.should.equal(1);
            result.state.status.should.equal('RUNNING');
        });

        it('should not be able to pay in a different currency', async function() {

            const request = {};
            request.$class = 'org.accordproject.payment.iot.MonetaryAmountPayment';
            request.amount = {
                doubleValue: 1000.0,
                currencyCode: "EUR"
            }
            state.status = 'RUNNING';
            state.paymentCount = 0;
            state.counter = 4;            
            engine.execute(clause, request, state).should.be.rejected;
        });
    });
});
