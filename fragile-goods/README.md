# Fragile Goods 

This is a smart legal clause that conforms to the [Accord Protocol Template Specification](https://docs.google.com/document/d/1UacA_r2KGcBA2D4voDgGE8jqid-Uh4Dt09AE-shBKR0), the protocol is managed by the open-source community of the [Accord Project](https://accordproject.org). The clause can be parsed and executed by the [Cicero](https://github.com/accordproject/cicero) engine.

## Description

> This clause specifies penalties for shocks caused to a fragile package in transport.

This clause contains:
- *Some sample Clause Text* - [sample.txt](sample.txt)
- *A template* - [grammar/template.tem](grammar/template.tem)
- *A data model* - [models/model.cto](models/model.cto)
- *Contact logic* (in JavaScript) - [logic/logic.js](lib/logic.js)

## Running this clause

### On your own machine

1. [Download the Cicero template library](https://github.com/accordproject/cicero-template-library/archive/master.zip)

2. Unzip the library with your favourite tool

3. Then from the command-line, change the current directory to the folder containing this README.md file.
```
cd fragile-goods
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
mattmbp:fragile-goods matt$ cicero execute
18:25:06 - info: Logging initialized. 2018-05-15T22:25:06.285Z
18:25:06 - info: Using current directory as template folder
18:25:06 - info: Loading a default sample.txt file.
18:25:06 - info: Loading a single default request.json file.
18:25:06 - info: Loading a default state.json file.
18:25:06 - info: {"clause":"fragile-goods@0.0.4-8f725043d1fe2e64c5bcdefdb5693d65ba37fba60f743ac0f2f8d5e5595fe901","request":{"$class":"io.clause.demo.fragileGoods.DeliveryUpdate","startTime":"January 1, 2018 16:34:00","finishTime":"January 1, 2018 16:34:11","status":"ARRIVED","accelerometerReadings":[0.2,0.6,-0.3,-0.7,0.1]},"response":{"$class":"io.clause.demo.fragileGoods.PayOut","amount":790,"transactionId":"0fd66669-addc-4c0c-8c30-6103fd2293aa","timestamp":"2018-05-15T22:25:06.988Z"},"state":{"$class":"org.accordproject.common.State","stateId":"org.accordproject.common.State#1"},"emit":[]}
```

### Sample Payload Data

Request, as in [request.json](https://github.com/accordproject/cicero-template-library/blob/master/fragile-goods/request.json)
```json
{
    "$class": "io.clause.demo.fragileGoods.DeliveryUpdate",
    "startTime":"January 1, 2018 16:34:00",
    "finishTime":"January 1, 2018 16:34:11",
    "status":"ARRIVED",
    "accelerometerReadings":[0.2,0.6,-0.3,-0.7,0.1]    
}
```

For the request above, you should see the following response:
```json
{
    "$class":"io.clause.demo.fragileGoods.PayOut",
    "amount":790,
    "transactionId":"609813f8-e5b4-49f9-86ab-265a4428ee0f",
    "timestamp":"2018-02-18T10:53:15.589Z"
}
```


## Testing this clause

This clause comes with an automated test that ensures that it executes correctly under different conditions. To test the clause, complete the following steps.

You need npm and node to test a clause. You can download both from [here](https://nodejs.org/).

> This clause was tested with Node v8.9.3 and NPM v5.6.0

From the `fragile-goods` directory.

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
mattmbp:fragile-goods matt$ npm test

> fragile-goods@0.0.3 test /Users/matt/dev/accordproject/cicero-template-library/fragile-goods
> mocha

10:54:35 - info: Logging initialized. 2018-02-18T10:54:35.125Z


  Logic
    #FragileGoodsDemo
      ✓ should execute a completed delivery contract with all deductions
      ✓ should execute an inflight delivery contract
      ✓ should execute a completed on-time delivery contract with breaches
      ✓ should execute a completed delivery contact with no deductions


  4 passing (468ms)

```
