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
    let state = JSON.parse(fs.readFileSync(path.resolve(rootDir, 'state.json'), 'utf8'));

    let template;
    let clause;
    let engine;    

    before( async function() {
        template = await Template.fromDirectory(rootDir);
        clause = new Clause(template);
        clause.parse(clauseText);
        engine = new Engine();    
    });
    
    describe('#FullPaymentUponDemand', async function() {

        it('should produce correct payment in USD', async function() {
            const request = {};
            request.$class = 'org.accordproject.payment.fullupondemand.PaymentDemand';

            const state1 = Object.assign({}, state);

            const result = await engine.execute(clause, request, state1);
            result.should.not.be.null;
            result.emit[0].$class.should.equal('org.accordproject.cicero.runtime.PaymentObligation');
            result.emit[0].amount.doubleValue.should.equal(3.14);
            result.emit[0].amount.currencyCode.should.equal("EUR");
            result.state.status.should.equal("OBLIGATION_EMITTED");
        });

        it('should complete once the payment is acknowledged', async function() {
            const request = {};
            request.$class = 'org.accordproject.payment.PaymentReceived';

            const state1 = Object.assign({}, state);
            state1.status = "OBLIGATION_EMITTED";

            const result = await engine.execute(clause, request, state1);
            result.should.not.be.null;
            result.state.status.should.equal("COMPLETED")
        });

        it('should not emit multiple payment obligations', async function() {
            const request = {};
            request.$class = 'org.accordproject.payment.fullupondemand.PaymentDemand';

            const state1 = Object.assign({}, state);
            state1.status = "OBLIGATION_EMITTED";

            await engine.execute(clause, request, state1).catch((e) => {
                e.message.should.equal('Payment has already been demanded.');
            });
        });

        it('should not complete if obligation hasnt been emitted', async function() {
            const request = {};
            request.$class = 'org.accordproject.payment.PaymentReceived';

            const state1 = Object.assign({}, state);
            state1.status = "INITIALIZED";

            await engine.execute(clause, request, state1).catch((e) => {
                e.message.should.equal('Either a payment obligation hasn\'t yet been emitted by the contract or payment notification has already been received');
            });
        });
    });
});