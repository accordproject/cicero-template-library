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
    
    describe('#Count', async function() {

        it('should count completed envelopes', async function() {
            const request =
            {
                "$class": "com.docusign.connect.DocuSignEnvelopeInformation",
                "envelopeStatus": {
                    "$class" : "com.docusign.connect.EnvelopeStatus",
                    "status" : "Completed"
                    }
            }
            
            const state = {
                "$class": "com.docusign.connect.counter.DocuSignEnvelopeCounterState",
                "stateId": "0",
                "counter" : 0
            }
            
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.output.should.equal('Have received 1.0 contracts with status Completed');
        });

        it('should not count voided envelopes', async function() {
            const request =
            {
                "$class": "com.docusign.connect.DocuSignEnvelopeInformation",
                "envelopeStatus": {
                    "$class" : "com.docusign.connect.EnvelopeStatus",
                    "status" : "Voided"
                    }
            }
            
            const state = {
                "$class": "com.docusign.connect.counter.DocuSignEnvelopeCounterState",
                "stateId": "0",
                "counter" : 1
            }
            
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.output.should.equal('Have received 1.0 contracts with status Completed');
        });
    });
});
