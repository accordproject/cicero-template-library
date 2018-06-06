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
    
    describe('#ShipmentReceived', async function() {

        it('on time delivery with min and max temp violations', async function() {
            const request = {};
            const NS = 'org.accordproject.perishablegoods';
            request.$class = `${NS}.ShipmentReceived`;
            request.timestamp = new Date();
            request.unitCount = 3000;
            const shipment = {$class: `${NS}.Shipment`, shipmentId: 'SHIP_001'};
            const readingLow = {$class: `${NS}.SensorReading`, transactionId: 'a', shipment: 'SHIP_001', centigrade: 2, humidity: 80};
            const readingOk = {$class: `${NS}.SensorReading`, transactionId: 'b', shipment: 'SHIP_001', centigrade: 5, humidity: 90};
            const readingHigh = {$class: `${NS}.SensorReading`, transactionId: 'c', shipment: 'SHIP_001', centigrade: 15, humidity: 65};            
            shipment.sensorReadings = [readingLow, readingOk, readingHigh];
            request.shipment = shipment;
            const state = {};
            state.$class = 'org.accordproject.common.ContractState';
            state.stateId = 'org.accordproject.common.ContractState#1';
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.totalPrice.should.equal(300);
            result.response.penalty.should.equal(4200);
            result.response.late.should.equal(false);            
        });
    });
});