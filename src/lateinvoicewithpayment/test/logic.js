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
    
    describe('#LateInvoiceWithPayment', async function() {

        it('should accept invoice and emit a payment obligation', async function () {
            const request = {
                '$class': 'org.accordproject.lateinvoicewithpayment.LateInvoiceRequest',
                'invoiceDue': 'January 17, 2019 03:24:00',
                'amountDue': {
                    'doubleValue': 200,
                    'currencyCode': 'USD'
                },
                'timestamp': '2019-01-12T17:38:01.412Z'
            };
            const state = {};
            state.$class = 'org.accordproject.cicero.contract.AccordContractState';
            state.stateId = 'org.accordproject.cicero.contract.AccordContractState#1';
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.paymentRequired.should.equal(true);
            result.emit[0].$class.should.equal('org.accordproject.cicero.runtime.PaymentObligation');
            result.emit[0].amount.should.deep.equal({
                '$class': 'org.accordproject.money.MonetaryAmount',
                'doubleValue': 200,
                'currencyCode': 'USD'
            });
        });

        it('should reject invoice and not emit a payment obligation', async function () {
            const request = {
                '$class': 'org.accordproject.lateinvoicewithpayment.LateInvoiceRequest',
                'invoiceDue': 'January 17, 2018 03:24:00',
                'amountDue': {
                    'doubleValue': 200,
                    'currencyCode': 'USD'
                },
                'timestamp': '2019-01-12T17:38:01.412Z'
            };
            const state = {};
            state.$class = 'org.accordproject.cicero.contract.AccordContractState';
            state.stateId = 'org.accordproject.cicero.contract.AccordContractState#1';
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.paymentRequired.should.equal(false);
            result.emit.length.should.equal(0);
        });
    });
});