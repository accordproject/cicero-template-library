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
    
    describe('#InspectDeliverable', async function() {

        it('passed inspection within time limit', async function() {
            const request = {};
            request.$class = 'org.accordproject.acceptanceofdelivery.InspectDeliverable';
            request.deliverableReceivedAt = new Date();
            request.inspectionPassed = true;
            const state = {};
            state.$class = 'org.accordproject.common.ContractState';
            state.stateId = 'org.accordproject.common.ContractState#1';
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.status.should.equal('PASSED_TESTING');
            result.response.shipper.should.equal('resource:org.hyperledger.composer.system.Participant#Party%20A');
            result.response.receiver.should.equal('resource:org.hyperledger.composer.system.Participant#Party%20B');
        });

        it('failed inspection within time limit', async function() {
            const request = {};
            request.$class = 'org.accordproject.acceptanceofdelivery.InspectDeliverable';
            request.deliverableReceivedAt = new Date();
            request.inspectionPassed = false;
            const state = {};
            state.$class = 'org.accordproject.common.ContractState';
            state.stateId = 'org.accordproject.common.ContractState#1';
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.status.should.equal('FAILED_TESTING');
            result.response.shipper.should.equal('resource:org.hyperledger.composer.system.Participant#Party%20A');
            result.response.receiver.should.equal('resource:org.hyperledger.composer.system.Participant#Party%20B');
        });

        it('inspection outside time limit', async function() {
            const request = {};
            request.$class = 'org.accordproject.acceptanceofdelivery.InspectDeliverable';
            // deliverable was received 11 days ago
            request.deliverableReceivedAt = moment().subtract(11, 'days');
            request.inspectionPassed = true;
            const state = {};
            state.$class = 'org.accordproject.common.ContractState';
            state.stateId = 'org.accordproject.common.ContractState#1';
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.status.should.equal('OUTSIDE_INSPECTION_PERIOD');
            result.response.shipper.should.equal('resource:org.hyperledger.composer.system.Participant#Party%20A');
            result.response.receiver.should.equal('resource:org.hyperledger.composer.system.Participant#Party%20B');
        });

        it('inspection before delivable should throw', async function() {
            const request = {};
            request.$class = 'org.accordproject.acceptanceofdelivery.InspectDeliverable';
            const state = {};
            state.$class = 'org.accordproject.common.ContractState';
            state.stateId = 'org.accordproject.common.ContractState#1';
            // deliverable was received tomorrow!
            request.deliverableReceivedAt = moment().add(1, 'days');
            request.inspectionPassed = true;
            engine.execute(clause, request, state).should.be.rejectedWith(Error);
        });
    });
});