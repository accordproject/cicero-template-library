# Perishable Goods 

This is a smart legal clause that conforms to the [Accord Project Template Specification](https://docs.google.com/document/d/1UacA_r2KGcBA2D4voDgGE8jqid-Uh4Dt09AE-shBKR0), the protocol is managed by the open-source community of the [Accord Project](https://accordproject.org). The clause can be parsed and executed by the [Cicero](https://github.com/accordproject/cicero) engine.

## Description

> This clause specifies penalties if the transport conditions (temperature and humidity) for a package are breached.

This clause contains:
- *Some sample Clause Text* - [sample.txt](sample.txt), [shipping-contract.txt](shipping-contact.txt)
- *A template* - [grammar/template.tem](grammar/template.tem)
- *Some data models* - [models/model.cto](models/model.cto), [models/contact.cto](models/contact.cto)
- *Contact logic* (in Ergo) - [logic/logic.ergo](lib/logic.ergo)

## Running this clause

### On your own machine

1. [Download the Cicero template library](https://github.com/accordproject/cicero-template-library/archive/master.zip)

2. Unzip the library with your favourite tool

3. Then from the command-line, change the current directory to the folder containing this README.md file.
```
cd perishable-goods
```
4. With the [Cicero command-line tool](https://github.com/accordproject/cicero#installation):
```
cicero execute --template ./ --sample ./sample.txt --request ./request.json --state ./state.json
```
> Note, all of the command-line flags (like `--template`) are optional.

Alternatively you can use the simpler command below if you want to use all of the default files.
```
cicero execute
```

You should see the following output in your terminal:
```bash
mattmbp:perishable-goods matt$ cicero execute
18:30:03 - info: Logging initialized. 2018-05-15T22:30:03.138Z
18:30:03 - info: Using current directory as template folder
18:30:03 - info: Loading a default sample.txt file.
18:30:03 - info: Loading a single default request.json file.
18:30:03 - info: Loading a default state.json file.
18:30:03 - info: CICERO-ENGINE Base payOut: 4500
18:30:03 - info: CICERO-ENGINE Received at: Sun Feb 18 2018 06:11:41 GMT-0500 (EST)
18:30:03 - info: CICERO-ENGINE Contract arrivalDateTime: 2018-04-02
18:30:03 - info: CICERO-ENGINE Lowest temp reading: 2
18:30:03 - info: CICERO-ENGINE Highest temp reading: 15
18:30:03 - info: CICERO-ENGINE Max temp penalty: 0.4
18:30:03 - info: CICERO-ENGINE Lowest humidity reading: 65
18:30:03 - info: CICERO-ENGINE Highest humidity reading: 90
18:30:03 - info: CICERO-ENGINE Min humidity penalty: 1.4
18:30:03 - info: CICERO-ENGINE Payout: 300
18:30:03 - info: CICERO-ENGINE {"request":{"$class":"org.accordproject.perishablegoods.ShipmentReceived","unitCount":3000,"shipment":{"$class":"org.accordproject.perishablegoods.Shipment","shipmentId":"SHIP_001","sensorReadings":[{"$class":"org.accordproject.perishablegoods.SensorReading","centigrade":15,"humidity":65,"shipment":"resource:org.accordproject.perishablegoods.Shipment#SHIP_001","transactionId":"c"},{"$class":"org.accordproject.perishablegoods.SensorReading","centigrade":2,"humidity":80,"shipment":"resource:org.accordproject.perishablegoods.Shipment#SHIP_001","transactionId":"a"},{"$class":"org.accordproject.perishablegoods.SensorReading","centigrade":5,"humidity":90,"shipment":"resource:org.accordproject.perishablegoods.Shipment#SHIP_001","transactionId":"b"}]},"transactionId":"99c64b8a-b3b0-408a-8ec4-7820776cd447","timestamp":"2018-02-18T11:11:41.264Z"},"state":{"$class":"org.accordproject.common.State","stateId":"org.accordproject.common.State#1"},"contract":{"$class":"org.accordproject.perishablegoods.contract.TemplateModel","grower":"PETER","importer":"DAN","shipment":"SHIP_001","dueDate":"2018-04-02","unitPrice":1.5,"unit":"KG","minUnits":3000,"maxUnits":3500,"product":"Grade I, Size 4, Zutano Mexican Avocados","sensorReadingFrequency":1,"duration":"HOUR","minTemperature":2,"maxTemperature":13,"minHumidity":70,"maxHumidity":90,"penaltyFactor":0.2},"response":{"$class":"org.accordproject.perishablegoods.PriceCalculation","totalPrice":300,"penalty":4200,"late":false,"shipment":{"$class":"org.accordproject.perishablegoods.Shipment","shipmentId":"SHIP_001","sensorReadings":[{"$class":"org.accordproject.perishablegoods.SensorReading","centigrade":15,"humidity":65,"shipment":"resource:org.accordproject.perishablegoods.Shipment#SHIP_001","transactionId":"c"},{"$class":"org.accordproject.perishablegoods.SensorReading","centigrade":2,"humidity":80,"shipment":"resource:org.accordproject.perishablegoods.Shipment#SHIP_001","transactionId":"a"},{"$class":"org.accordproject.perishablegoods.SensorReading","centigrade":5,"humidity":90,"shipment":"resource:org.accordproject.perishablegoods.Shipment#SHIP_001","transactionId":"b"}]},"transactionId":"2a204a05-5f24-4cc8-900b-e0f1d0520a62","timestamp":"2018-05-15T22:30:03.863Z"},"emit":[],"now":"2018-05-15T22:30:03.862Z"}
18:30:03 - info: {"clause":"perishable-goods@0.1.0-21d371562ab877afb69d7decedcc9b570da4eeba86a05b526c1e4b7a5417c44d","request":{"$class":"org.accordproject.perishablegoods.ShipmentReceived","unitCount":3000,"shipment":{"$class":"org.accordproject.perishablegoods.Shipment","shipmentId":"SHIP_001","sensorReadings":[{"$class":"org.accordproject.perishablegoods.SensorReading","centigrade":2,"humidity":80,"shipment":"resource:org.accordproject.perishablegoods.Shipment#SHIP_001","transactionId":"a"},{"$class":"org.accordproject.perishablegoods.SensorReading","centigrade":5,"humidity":90,"shipment":"resource:org.accordproject.perishablegoods.Shipment#SHIP_001","transactionId":"b"},{"$class":"org.accordproject.perishablegoods.SensorReading","centigrade":15,"humidity":65,"shipment":"resource:org.accordproject.perishablegoods.Shipment#SHIP_001","transactionId":"c"}]},"transactionId":"99c64b8a-b3b0-408a-8ec4-7820776cd447","timestamp":"2018-02-18T11:11:41.264Z"},"response":{"$class":"org.accordproject.perishablegoods.PriceCalculation","totalPrice":300,"penalty":4200,"late":false,"shipment":"resource:org.accordproject.perishablegoods.Shipment#SHIP_001","transactionId":"2a204a05-5f24-4cc8-900b-e0f1d0520a62","timestamp":"2018-05-15T22:30:03.863Z"},"state":{"$class":"org.accordproject.common.State","stateId":"org.accordproject.common.State#1"},"emit":[]}
```

This template provides additional sample clause text. You can execute the second sample with the command:
```
cicero execute --sample shipping-contract.txt 
```
You should then see the following output.
```
...
18:31:22 - info: CICERO-ENGINE Base payOut: 4500
18:31:22 - info: CICERO-ENGINE Received at: Sun Feb 18 2018 06:11:41 GMT-0500 (EST)
18:31:22 - info: CICERO-ENGINE Contract arrivalDateTime: 2018-04-02
18:31:22 - info: CICERO-ENGINE Lowest temp reading: 2
18:31:22 - info: CICERO-ENGINE Highest temp reading: 15
18:31:22 - info: CICERO-ENGINE Lowest humidity reading: 65
18:31:22 - info: CICERO-ENGINE Highest humidity reading: 90
18:31:22 - info: CICERO-ENGINE Payout: 4500
...
```
> Output above is abbreviated for clarity at `...`

### Sample Payload Data

Request, as in [request.json](https://github.com/accordproject/cicero-template-library/blob/master/perishable-goods/request.json)
```json
{
    "$class":"org.accordproject.perishablegoods.ShipmentReceived",
    "unitCount":3000,
    "shipment":{
        "$class":"org.accordproject.perishablegoods.Shipment",
        "shipmentId":"SHIP_001",
        "sensorReadings":[
            {
                "$class":"org.accordproject.perishablegoods.SensorReading",
                "centigrade":2,
                "humidity":80,
                "shipment":"resource:org.accordproject.perishablegoods.Shipment#SHIP_001",
                "transactionId":"a"
            },
            {
                "$class":"org.accordproject.perishablegoods.SensorReading",
                "centigrade":5,
                "humidity":90,
                "shipment":"resource:org.accordproject.perishablegoods.Shipment#SHIP_001",
                "transactionId":"b"
            },
            {
                "$class":"org.accordproject.perishablegoods.SensorReading",
                "centigrade":15,
                "humidity":65,
                "shipment":"resource:org.accordproject.perishablegoods.Shipment#SHIP_001",
                "transactionId":"c"
            }
        ]
    },
    "transactionId":"99c64b8a-b3b0-408a-8ec4-7820776cd447",
    "timestamp":"2018-02-18T11:11:41.264Z"
}
```

For the request above, you should see the following response:
```json
{
    "$class":"org.accordproject.perishablegoods.PriceCalculation",
    "totalPrice":300,
    "penalty":4200,
    "late":false,
    "shipment":"resource:org.accordproject.perishablegoods.Shipment#SHIP_001",
    "transactionId":"87a0f521-7848-4306-ad98-affc1af73333",
    "timestamp":"2018-02-18T11:13:53.190Z"
}
```


## Testing this clause

This clause comes with an automated test that ensures that it executes correctly under different conditions. To test the clause, complete the following steps.

You need npm and node to test a clause. You can download both from [here](https://nodejs.org/).

> This clause was tested with Node v8.9.3 and NPM v5.6.0

From the `perishable-goods` directory.

1. Install all of the dependencies.
```
npm install
```

2. Run the tests
```
npm test
```
If successful, you should see the following output
```
mattmbp:perishable-goods matt$ npm test

> perishable-goods@0.1.0 test /Users/matt/dev/accordproject/cicero-template-library/perishable-goods
> mocha

11:15:35 - info: Logging initialized. 2018-02-18T11:15:35.869Z


  Logic
    #ShipmentReceived
...
      ✓ on time delivery with min and max temp violations


  1 passing (280ms)

```
> Output above is abbreviated for clarity at `...`
