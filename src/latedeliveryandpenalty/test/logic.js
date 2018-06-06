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
    const clauseTextNoForceMajeure = fs.readFileSync(path.resolve(rootDir, 'sample-noforcemajeure.txt'), 'utf8');
    
    let template;
    let clause;
    let engine;    

    beforeEach( async function() {
        template = await Template.fromDirectory(rootDir);
        clause = new Clause(template);
        clause.parse(clauseTextNoForceMajeure);
        clause.parse(clauseText);
        engine = new Engine();
    });
    
    describe('#LateDeliveryAndPenalty', async function() {

        it('should execute a smart clause', async function () {
            const request = {
                '$class': 'org.accordproject.latedeliveryandpenalty.LateDeliveryAndPenaltyRequest',
                'forceMajeure': false,
                'agreedDelivery': '2017-10-07T16:38:01.412Z',
                'goodsValue': 200,
                'transactionId': '402c8f50-9e61-433e-a7c1-afe61c06ef00',
                'timestamp': '2017-11-12T17:38:01.412Z'
            };
            const state = {};
            state.$class = 'org.accordproject.common.ContractState';
            state.stateId = 'org.accordproject.common.ContractState#1';
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.penalty.should.equal(110.00000000000001);
        });
    });
});