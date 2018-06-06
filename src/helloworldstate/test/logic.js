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
    
    describe('#Hello', async function() {

        it('should say hello once', async function() {
            const request = {};
            request.$class = 'org.accordproject.helloworldstate.Request';
            request.input = 'World'
            const state = {};
            state.$class = 'org.accordproject.helloworldstate.HelloWorldState';
            state.stateId = 'org.accordproject.helloworldstate.HelloWorldState#0';
		        state.counter = 0;
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.output.should.equal('Hello Fred Blogs World(1)');
        });
    });

    describe('#Hello', async function() {

        it('should say hello twice', async function() {
            const request = {};
            request.$class = 'org.accordproject.helloworldstate.Request';
            request.input = 'World'
            const state = {};
            state.$class = 'org.accordproject.helloworldstate.HelloWorldState';
            state.stateId = 'org.accordproject.helloworldstate.HelloWorldState#0';
		        state.counter = 0;
            const result1 = await engine.execute(clause, request, state);
            const result2 = await engine.execute(clause, request, result1.state);
            result2.should.not.be.null;
            result2.response.output.should.equal('Hello Fred Blogs World(2)');
            result2.state.counter.should.equal(2);
        });
    });

    describe('#Hello', async function() {

        it('should say hello thrice', async function() {
            const request = {};
            request.$class = 'org.accordproject.helloworldstate.Request';
            request.input = 'World'
            const state = {};
            state.$class = 'org.accordproject.helloworldstate.HelloWorldState';
            state.stateId = 'org.accordproject.helloworldstate.HelloWorldState#0';
		        state.counter = 0;
            const result1 = await engine.execute(clause, request, state);
            const result2 = await engine.execute(clause, request, result1.state);
            const result3 = await engine.execute(clause, request, result2.state);
            result3.should.not.be.null;
            result3.response.output.should.equal('Hello Fred Blogs World(3)');
            result3.state.counter.should.equal(3);
        });
    });
});
