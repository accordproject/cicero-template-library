
# Acceptance of Delivery

This is a smart legal clause that conforms to the [Accord Protocol Template Specification](https://docs.google.com/document/d/1UacA_r2KGcBA2D4voDgGE8jqid-Uh4Dt09AE-shBKR0), the protocol is managed by the open-source community of the [Accord Project](https://accordproject.org). The clause can be parsed and executed by the [Cicero](https://github.com/accordproject/cicero) engine.

## Description
> This clause allows the receiver of goods to inspect them for a given time period after delivery.

This clause contains:
- *Some sample Clause Text* - [sample.txt](sample.txt)
- *A template* - [grammar/template.tem](grammar/template.tem)
- *A data model* - [models/model.cto](models/model.cto)
- *Contact logic* (in Ergo) - [logic/logic.ergo](lib/logic.ergo)

## Running this clause

### On your own machine

1. [Download the Cicero template library](https://github.com/accordproject/cicero-template-library/archive/master.zip)

2. Unzip the library with your favourite tool

3. Then from the command-line, change the current directory to the folder containing this README.md file.
```
cd acceptance-of-delivery
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
mattmbp:acceptance-of-delivery matt$ cicero execute
18:22:38 - info: Logging initialized. 2018-05-15T22:22:38.131Z
18:22:38 - info: Using current directory as template folder
18:22:38 - info: Loading a default sample.txt file.
18:22:38 - info: Loading a single default request.json file.
18:22:38 - info: Loading a default state.json file.
18:22:38 - info: {"clause":"acceptance-of-delivery@0.0.3-e407ff0a315c5b1c267677edbda49a32d4e9ef890ad21a3e40b3bc110d06c88c","request":{"$class":"org.accordproject.acceptanceofdelivery.InspectDeliverable","deliverableReceivedAt":"January 1, 2018 16:34:00","inspectionPassed":true},"response":{"$class":"org.accordproject.acceptanceofdelivery.InspectionResponse","status":"OUTSIDE_INSPECTION_PERIOD","shipper":"resource:org.hyperledger.composer.system.Participant#Party%20A","receiver":"resource:org.hyperledger.composer.system.Participant#Party%20B","transactionId":"faacef8f-c0b2-4d9f-911f-007aa98a1c1d","timestamp":"2018-05-15T22:22:38.869Z"},"state":{"$class":"org.accordproject.common.State","stateId":"org.accordproject.common.State#1"},"emit":[]}
```

### Sample Payload Data


Request, as in [request.json](https://github.com/accordproject/cicero-template-library/blob/master/acceptance-of-delivery/request.json)
```json
{
    "$class":"org.accordproject.acceptanceofdelivery.InspectDeliverable",
    "deliverableReceivedAt": "January 1, 2018 16:34:00",
    "inspectionPassed": true
}
```

For the request above, you should see the following response:
```json
{
    "$class":"org.accordproject.acceptanceofdelivery.InspectionResponse",
    "status":"OUTSIDE_INSPECTION_PERIOD",
    "shipper":"resource:org.hyperledger.composer.system.Participant#Party%20A",
    "receiver":"resource:org.hyperledger.composer.system.Participant#Party%20B",
    "transactionId":"57df30ca-3755-457b-9176-5fae50dd3283",
    "timestamp":"2018-02-17T21:49:40.206Z"
}
```


## Testing this clause

This clause comes with an automated test that ensures that it executes correctly under different conditions. To test the clause, complete the following steps.

You need npm and node to test a clause. You can download both from [here](https://nodejs.org/).

> This clause was tested with Node v8.9.3 and NPM v5.6.0

From the `acceptance-of-delivery` directory.

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
mattmbp:acceptance-of-delivery matt$ npm test

> acceptance-of-delivery@0.0.3 test /Users/matt/dev/accordproject/cicero-template-library/acceptance-of-delivery
> mocha

21:57:31 - info: Logging initialized. 2018-02-17T21:57:31.074Z


  Logic
    #InspectDeliverable
      ✓ passed inspection within time limit
      ✓ failed inspection within time limit
      ✓ inspection outside time limit
      ✓ inspection before delivable should throw


  4 passing (458ms)

```
