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
    
    describe('#FragileGoodsDemo', async function() {

        it('should execute a completed delivery contract with all deductions', async function () {
            const request = {
                "$class":"io.clause.demo.fragileGoods.DeliveryUpdate",
                "startTime":"2018-01-01T16:34:00.000Z",
                "finishTime":"2018-01-01T16:34:11.000Z",
                "status":"ARRIVED",
                "accelerometerReadings":[0.2,0.6,-0.3,-0.7,0.1],
                "transactionId":"d8b14719-ae23-4867-a4c7-7c0199a74cc3",
                "timestamp":"2018-01-02T08:28:42.248Z"
            };
            const state = {};
            state.$class = 'org.accordproject.common.ContractState';
            state.stateId = 'org.accordproject.common.ContractState#1';
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.amount.should.equal(790);
        });

        it('should execute an inflight delivery contract', async function () {
            const request = {
                "$class":"io.clause.demo.fragileGoods.DeliveryUpdate",
                "startTime":"2018-01-01T16:34:00.000Z",
                //"finishTime":"2018-01-01T16:34:11.000Z",
                "status":"IN_TRANSIT",
                "accelerometerReadings":[0.2,0.6,-0.3,-0.7,0.1],
                "transactionId":"d8b14719-ae23-4867-a4c7-7c0199a74cc3",
                "timestamp":"2018-01-02T08:28:42.248Z"
            };
            const state = {};
            state.$class = 'org.accordproject.common.ContractState';
            state.stateId = 'org.accordproject.common.ContractState#1';
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.amount.should.equal(990);
        });

        it('should execute a completed on-time delivery contract with breaches', async function () {
            const request = {
                "$class":"io.clause.demo.fragileGoods.DeliveryUpdate",
                "startTime":"2018-01-01T16:34:00.000Z",
                "finishTime":"2018-01-01T16:34:09.000Z",
                "status":"ARRIVED",
                "accelerometerReadings":[0.2,0.6,-0.3,-0.7,0.1],
                "transactionId":"d8b14719-ae23-4867-a4c7-7c0199a74cc3",
                "timestamp":"2018-01-02T08:28:42.248Z"
            };
            const state = {};
            state.$class = 'org.accordproject.common.ContractState';
            state.stateId = 'org.accordproject.common.ContractState#1';
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.amount.should.equal(990);
        });

        it('should execute a completed delivery contact with no deductions', async function () {
            const request = {
                "$class":"io.clause.demo.fragileGoods.DeliveryUpdate",
                "startTime":"2018-01-01T16:34:00.000Z",
                "finishTime":"2018-01-01T16:34:09.000Z",
                "status":"ARRIVED",
                "accelerometerReadings":[0.2,0.4,0.1],
                "transactionId":"d8b14719-ae23-4867-a4c7-7c0199a74cc3",
                "timestamp":"2018-01-02T08:28:42.248Z"
            };
            const state = {};
            state.$class = 'org.accordproject.common.ContractState';
            state.stateId = 'org.accordproject.common.ContractState#1';
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.amount.should.equal(1000);
        });
    });
});