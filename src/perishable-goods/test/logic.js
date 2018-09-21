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
var expect = chai.expect;
const moment = require('moment');

describe('Logic', () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 2);
    const rootDir = path.resolve(__dirname, '..');
    const clauseText = `On receipt of the shipment "SHIP_001" the importer "DAN" pays the grower "PETER" 1.50 USD per KG. The shipment must contain between 3000 and 3500 KG of "Grade I, Size 4, Zutano Mexican Avocados".

Shipping containers used must be temperature and humidity controlled, and sensor readings must be logged at least 1 per hours.

Shipments that arrive after ${dueDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })} are to be considered spoiled and must be arranged to be returned to or disposed of by grower at cost to grower.

Temperature readings for the shipment must be between 2 and 13.

Humidity readings for the shipment must be between 70 and 90.

Shipments that have a temperature or humidity reading outside the agreed range have a price penalty applied calculated using the Formula for Breach Penalty Calculation below. The breach penalty factor to be used is 0.2.

Formula for Breach Penalty Calculation:
   penalty = number of shipment units x difference between sensor reading and agreed range x breach penalty factor
`;

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
            state.$class = 'org.accordproject.cicero.contract.AccordContractState';
            state.stateId = 'org.accordproject.cicero.contract.AccordContractState#1';
            const result = await engine.execute(clause, request, state);
            result.should.not.be.null;
            result.response.totalPrice.doubleValue.should.equal(300);
            result.response.penalty.doubleValue.should.equal(4200);
            result.response.late.should.equal(false);            
            result.emit[0].$class.should.equal('org.accordproject.cicero.runtime.PaymentObligation');
            result.emit[0].amount.should.deep.equal({
                '$class': 'org.accordproject.money.MonetaryAmount',
                'doubleValue': 300,
                'currencyCode': 'USD'
            });
        });

        it('shipment units below agreeed upon bounds', async function() {
            const request = {};
            const NS = 'org.accordproject.perishablegoods';
            request.$class = `${NS}.ShipmentReceived`;
            request.timestamp = new Date();
            request.unitCount = 2990;
            const shipment = {$class: `${NS}.Shipment`, shipmentId: 'SHIP_001'};
            const readingLow = {$class: `${NS}.SensorReading`, transactionId: 'a', shipment: 'SHIP_001', centigrade: 2, humidity: 80};
            const readingOk = {$class: `${NS}.SensorReading`, transactionId: 'b', shipment: 'SHIP_001', centigrade: 5, humidity: 90};
            const readingHigh = {$class: `${NS}.SensorReading`, transactionId: 'c', shipment: 'SHIP_001', centigrade: 15, humidity: 65};
            shipment.sensorReadings = [readingLow, readingOk, readingHigh];
            request.shipment = shipment;
            const state = {};
            state.$class = 'org.accordproject.cicero.contract.AccordContractState';
            state.stateId = 'org.accordproject.cicero.contract.AccordContractState#1';
            await expect(engine.execute(clause, request, state)).to.eventually.be.rejectedWith('Units received out of range for the contract');
        });

        it('shipment units above agreeed upon bounds', async function() {
            const request = {};
            const NS = 'org.accordproject.perishablegoods';
            request.$class = `${NS}.ShipmentReceived`;
            request.timestamp = new Date();
            request.unitCount = 3590;
            const shipment = {$class: `${NS}.Shipment`, shipmentId: 'SHIP_001'};
            const readingLow = {$class: `${NS}.SensorReading`, transactionId: 'a', shipment: 'SHIP_001', centigrade: 2, humidity: 80};
            const readingOk = {$class: `${NS}.SensorReading`, transactionId: 'b', shipment: 'SHIP_001', centigrade: 5, humidity: 90};
            const readingHigh = {$class: `${NS}.SensorReading`, transactionId: 'c', shipment: 'SHIP_001', centigrade: 15, humidity: 65};
            shipment.sensorReadings = [readingLow, readingOk, readingHigh];
            request.shipment = shipment;
            const state = {};
            state.$class = 'org.accordproject.cicero.contract.AccordContractState';
            state.stateId = 'org.accordproject.cicero.contract.AccordContractState#1';
            await expect(engine.execute(clause, request, state)).to.eventually.be.rejectedWith('Units received out of range for the contract');
        });

        it('shipment does not include temperature readings', async function() {
            const request = {};
            const NS = 'org.accordproject.perishablegoods';
            request.$class = `${NS}.ShipmentReceived`;
            request.timestamp = new Date();
            request.unitCount = 3300;
            const shipment = {$class: `${NS}.Shipment`, shipmentId: 'SHIP_001'};
            shipment.sensorReadings = [];
            request.shipment = shipment;
            const state = {};
            state.$class = 'org.accordproject.cicero.contract.AccordContractState';
            state.stateId = 'org.accordproject.cicero.contract.AccordContractState#1';
            await expect(engine.execute(clause, request, state)).to.eventually.be.rejectedWith('No temperature readings received');
        });
    });
});
