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
    const clauseTextHighCredit = fs.readFileSync(path.resolve(rootDir, 'sample-high-credit.txt'), 'utf8');
    
    let template;
    let clause;
    let engine;    

    beforeEach( async function() {
        template = await Template.fromDirectory(rootDir);
        clause = new Clause(template);
        clause.parse(clauseText);
        engine = new Engine();
    });
    
    describe('#Service Level Agreement', async function() {

        it('give no credit for 100% availability', async function () {
            const request = {
                "$class": "org.accordproject.servicelevelagreement.MonthSummary",
                "monthlyServiceLevel": 100,
                "monthlyCharge": 10,
                "last11MonthCredit": 0,
                "last11MonthCharge": 0
            };
            const state = {};
            state.$class = 'org.accordproject.common.ContractState';
            state.stateId = 'org.accordproject.common.ContractState#1';
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.monthlyCredit.should.equal(0);
        });

        it('give some credit for 99.7% availability', async function () {
            const request = {
                "$class": "org.accordproject.servicelevelagreement.MonthSummary",
                "monthlyServiceLevel": 99.7,
                "monthlyCharge": 10,
                "last11MonthCredit": 0,
                "last11MonthCharge": 0
            };
            const state = {};
            state.$class = 'org.accordproject.common.ContractState';
            state.stateId = 'org.accordproject.common.ContractState#1';
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.monthlyCredit.should.equal(0.2);
        });

        it('give more credit for 97.0% availability', async function () {
            const request = {
                "$class": "org.accordproject.servicelevelagreement.MonthSummary",
                "monthlyServiceLevel": 97,
                "monthlyCharge": 10,
                "last11MonthCredit": 0,
                "last11MonthCharge": 0
            };
            const state = {};
            state.$class = 'org.accordproject.common.ContractState';
            state.stateId = 'org.accordproject.common.ContractState#1';
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.monthlyCredit.should.equal(0.3);
        });

        it('give more credit for 97.0% availability with monthly cap', async function () {
            clause.parse(clauseTextHighCredit);
            const request = {
                "$class": "org.accordproject.servicelevelagreement.MonthSummary",
                "monthlyServiceLevel": 97,
                "monthlyCharge": 10,
                "last11MonthCredit": 0,
                "last11MonthCharge": 0
            };
            const state = {};
            state.$class = 'org.accordproject.common.ContractState';
            state.stateId = 'org.accordproject.common.ContractState#1';
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.monthlyCredit.should.equal(1);
        });

        it('give credit capped at annual cap', async function () {
            clause.parse(clauseTextHighCredit);
            const request = {
                "$class": "org.accordproject.servicelevelagreement.MonthSummary",
                "monthlyServiceLevel": 97,
                "monthlyCharge": 10,
                "last11MonthCredit": 11.01,
                "last11MonthCharge": 110
            };
            const state = {};
            state.$class = 'org.accordproject.common.ContractState';
            state.stateId = 'org.accordproject.common.ContractState#1';
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.monthlyCredit.should.equal(0.99);
        });

        it('rejects bad request values', async function () {
            const request = {
                "$class": "org.accordproject.servicelevelagreement.MonthSummary",
                "monthlyServiceLevel": -10,
                "monthlyCharge": 10,
                "last11MonthCredit": 0,
                "last11MonthCharge": 0
            };
            const state = {};
            state.$class = 'org.accordproject.common.ContractState';
            state.stateId = 'org.accordproject.common.ContractState#1';
            await engine.execute(clause, request, state).catch((e) => {
                e.message.should.equal('A service level must be at least 0% and at most 100%.');
            });
        });
    });
});