Feature: Supply Agreement, Perishable Goods
  This describe the expected behavior for the Accord Project's Perishable Goods Supply Agreeement

  Background:
    Given that the contract says
"""
On receipt of the shipment "SHIP_001" the importer "DAN" pays the grower "PETER" 1.50 USD per KG. The shipment must contain between 3000 and 3500 KG of "Grade I, Size 4, Zutano Mexican Avocados".

Shipping containers used must be temperature and humidity controlled, and sensor readings must be logged at least 1 per hours.

Shipments that arrive after 07/02/2018 are to be considered spoiled and must be arranged to be returned to or disposed of by grower at cost to grower.

Temperature readings for the shipment must be between 2 and 13.

Humidity readings for the shipment must be between 70 and 90.

Shipments that have a temperature or humidity reading outside the agreed range have a price penalty applied calculated using the Formula for Breach Penalty Calculation below. The breach penalty factor to be used is 0.2.

Formula for Breach Penalty Calculation:
   penalty = number of shipment units x difference between sensor reading and agreed range x breach penalty factor

"""

  Scenario: The contract is notified that a shipment has been received
    When it receives the request
"""
{
	"$class": "org.accordproject.perishablegoods.ShipmentReceived",
	"timestamp": "2019-02-16T12:06:36.172Z",
	"unitCount": 3000,
	"shipment": {
		"$class": "org.accordproject.perishablegoods.Shipment",
		"shipmentId": "SHIP_001",
		"sensorReadings": [{
			"$class": "org.accordproject.perishablegoods.SensorReading",
			"transactionId": "a",
			"shipment": "SHIP_001",
			"centigrade": 2,
			"humidity": 80
		}, {
			"$class": "org.accordproject.perishablegoods.SensorReading",
			"transactionId": "b",
			"shipment": "SHIP_001",
			"centigrade": 5,
			"humidity": 90
		}, {
			"$class": "org.accordproject.perishablegoods.SensorReading",
			"transactionId": "c",
			"shipment": "SHIP_001",
			"centigrade": 15,
			"humidity": 65
		}]
	}
}
"""
    Then it should respond with
"""
{
	"$class": "org.accordproject.perishablegoods.PriceCalculation",
	"totalPrice": {
		"$class": "org.accordproject.money.MonetaryAmount",
		"doubleValue": 300,
		"currencyCode": "USD"
	},
	"penalty": {
		"$class": "org.accordproject.money.MonetaryAmount",
		"doubleValue": 4200,
		"currencyCode": "USD"
	},
	"late": false,
	"shipment": "resource:org.accordproject.perishablegoods.Shipment#SHIP_001"
}
"""
    And the following obligations should have been emitted
"""
[
  {
    "$class": "org.accordproject.cicero.runtime.PaymentObligation",
    "amount": {
      "$class": "org.accordproject.money.MonetaryAmount",
      "doubleValue": 300,
      "currencyCode": "USD"
    },
    "description": "DAN should pay shipment amount to PETER",
    "promisor": "resource:org.accordproject.cicero.contract.AccordParty#DAN",
    "promisee": "resource:org.accordproject.cicero.contract.AccordParty#PETER",
    "eventId": "valid"
  }
]
"""

 Scenario: The contract recieve a shipment with units below the agreed bounds
    When it receives the request
"""
{
	"$class": "org.accordproject.perishablegoods.ShipmentReceived",
	"timestamp": "2019-02-16T12:06:36.172Z",
	"unitCount": 2500,
	"shipment": {
		"$class": "org.accordproject.perishablegoods.Shipment",
		"shipmentId": "SHIP_001",
		"sensorReadings": [{
			"$class": "org.accordproject.perishablegoods.SensorReading",
			"transactionId": "a",
			"shipment": "SHIP_001",
			"centigrade": 2,
			"humidity": 80
		}, {
			"$class": "org.accordproject.perishablegoods.SensorReading",
			"transactionId": "b",
			"shipment": "SHIP_001",
			"centigrade": 5,
			"humidity": 90
		}, {
			"$class": "org.accordproject.perishablegoods.SensorReading",
			"transactionId": "c",
			"shipment": "SHIP_001",
			"centigrade": 15,
			"humidity": 65
		}]
	}
}
"""
    Then it should reject the request with the error "[Ergo] Units received out of range for the contract"

	Scenario: The contract recieve a shipment with units above the agreed bounds
    When it receives the request
"""
{
	"$class": "org.accordproject.perishablegoods.ShipmentReceived",
	"timestamp": "2019-02-16T12:06:36.172Z",
	"unitCount": 4000,
	"shipment": {
		"$class": "org.accordproject.perishablegoods.Shipment",
		"shipmentId": "SHIP_001",
		"sensorReadings": [{
			"$class": "org.accordproject.perishablegoods.SensorReading",
			"transactionId": "a",
			"shipment": "SHIP_001",
			"centigrade": 2,
			"humidity": 80
		}, {
			"$class": "org.accordproject.perishablegoods.SensorReading",
			"transactionId": "b",
			"shipment": "SHIP_001",
			"centigrade": 5,
			"humidity": 90
		}, {
			"$class": "org.accordproject.perishablegoods.SensorReading",
			"transactionId": "c",
			"shipment": "SHIP_001",
			"centigrade": 15,
			"humidity": 65
		}]
	}
}
"""
    Then it should reject the request with the error "[Ergo] Units received out of range for the contract"

	Scenario: The contract recieve a shipment with units above the agreed bounds
    When it receives the request
"""
{
	"$class": "org.accordproject.perishablegoods.ShipmentReceived",
	"timestamp": "2019-02-16T12:06:36.172Z",
	"unitCount": 3000,
	"shipment": {
		"$class": "org.accordproject.perishablegoods.Shipment",
		"shipmentId": "SHIP_001",
		"sensorReadings": []
	}
}
"""
  Then it should reject the request with the error "[Ergo] No temperature readings received"
