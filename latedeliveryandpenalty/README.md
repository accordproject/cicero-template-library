
# Late Delivery And Penalty

This is a smart legal clause that conforms to the [Accord Protocol Template Specification](https://docs.google.com/document/d/1UacA_r2KGcBA2D4voDgGE8jqid-Uh4Dt09AE-shBKR0), the protocol is managed by the open-source community of the [Accord Project](https://accordproject.org). The clause can be parsed and executed by the [Cicero](https://github.com/accordproject/cicero) engine.

## Description

> A sample Late Delivery And Penalty clause.

This clause contains:
- *Some sample Clause Text* - [sample.txt](sample.txt), [shipping-noforcemajure.txt](sample-noforcemajure.txt)
- *A template* - [grammar/template.tem](grammar/template.tem)
- *Some data models* - [models/model.cto](models/model.cto), [models/contact.cto](models/contact.cto)
- *Contact logic* (in Ergo) - [logic/logic.ergo](lib/logic.ergo)

## Running this clause

### On your own machine

1. [Download the Cicero template library](https://github.com/accordproject/cicero-template-library/archive/master.zip)

2. Unzip the library with your favourite tool

3. Then from the command-line, change the current directory to the folder containing this README.md file.
```
cd latedeliveryandpenalty
```
4. With the [Cicero command-line tool](https://github.com/accordproject/cicero#installation):
```
cicero execute --template ./ --sample ./sample.txt --request ./request.json --state./state.json
```
> Note, all of the command-line flags (like `--template`) are optional.

Alternatively you can use the simpler command below if you want to use all of the default files.
```
cicero execute
```

You should see the following output in your terminal:
```bash
mattmbp:latedeliveryandpenalty matt$ cicero execute
18:29:45 - info: Logging initialized. 2018-05-15T22:29:45.624Z
18:29:46 - info: Using current directory as template folder
18:29:46 - info: Loading a default sample.txt file.
18:29:46 - info: Loading a single default request.json file.
18:29:46 - info: Loading a default state.json file.
18:29:46 - info: CICERO-ENGINE late
18:29:46 - info: CICERO-ENGINE penalty duration unit: DAY
18:29:46 - info: CICERO-ENGINE penalty duration amount: 2
18:29:46 - info: CICERO-ENGINE diff:149
18:29:46 - info: CICERO-ENGINE capped.
18:29:46 - info: CICERO-ENGINE buyerMayTerminate.
18:29:46 - info: {"clause":"latedeliveryandpenalty@0.0.4-a1c6d2f2e8f97d23244f73f21d67ffdac326b6f33425d56cef9f02a0177b5c0d","request":{"$class":"org.accordproject.latedeliveryandpenalty.LateDeliveryAndPenaltyRequest","forceMajeure":false,"agreedDelivery":"December 17, 2017 03:24:00","deliveredAt":null,"goodsValue":200},"response":{"$class":"org.accordproject.latedeliveryandpenalty.LateDeliveryAndPenaltyResponse","penalty":110.00000000000001,"buyerMayTerminate":true,"transactionId":"c6eb6b44-bfe7-4b8e-8f3d-1e7b82638366","timestamp":"2018-05-15T22:29:46.333Z"},"state":{"$class":"org.accordproject.common.State","stateId":"org.accordproject.common.State#1"},"emit":[]}
```

This template provides additional sample clause text. You can execute the second sample with the command:
```
cicero execute --dsl sample-noforcemajeure.txt 
```
You should then see the following output.
```
...
11:52:42 - info: CICERO-ENGINE late
11:52:42 - info: CICERO-ENGINE penalty duration unit: DAY
11:52:42 - info: CICERO-ENGINE penalty duration amount: 9
11:52:42 - info: CICERO-ENGINE diff:63
11:52:42 - info: CICERO-ENGINE capped.
...
```
> Output above is abbreviated for clarity at `...`

### Sample Payload Data

Request, as in [request.json](https://github.com/accordproject/cicero-template-library/blob/master/latedeliveryandpenalty/request.json)
```json
{
    "$class":"org.accordproject.latedeliveryandpenalty.LateDeliveryAndPenaltyRequest",
    "forceMajeure":false,
    "agreedDelivery":"December 17, 2017 03:24:00",
    "deliveredAt":null,
    "goodsValue":200
}
```

For the request above, you should see the following response:
```json
{
    "$class":"org.accordproject.latedeliveryandpenalty.LateDeliveryAndPenaltyResponse",
    "penalty":110.00000000000001,
    "buyerMayTerminate":false,
    "transactionId":"92141ecd-3081-4fa6-938f-9f94917bcc47",
    "timestamp":"2018-02-18T11:03:26.383Z"
}
```


## Testing this clause

This clause comes with an automated test that ensures that it executes correctly under different conditions. To test the clause, complete the following steps.

You need npm and node to test a clause. You can download both from [here](https://nodejs.org/).

> This clause was tested with Node v8.9.3 and NPM v5.6.0

From the `latedeliveryandpenalty` directory.

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
mattmbp:latedeliveryandpenalty matt$ npm test

> latedeliveryandpenalty@0.0.4 test /Users/matt/dev/accordproject/cicero-template-library/latedeliveryandpenalty
> mocha

11:05:21 - info: Logging initialized. 2018-02-18T11:05:21.175Z


  Logic
    #LateDeliveryAndPenalty
    #LateDeliveryAndPenalty
00:57:38 - info: CICERO-ENGINE late
00:57:38 - info: CICERO-ENGINE penalty duration unit: DAY
00:57:38 - info: CICERO-ENGINE penalty duration amount: 2
00:57:38 - info: CICERO-ENGINE diff:36
00:57:38 - info: CICERO-ENGINE capped.
00:57:38 - info: CICERO-ENGINE buyerMayTerminate.
      ✓ should execute a smart clause


  1 passing (513ms)

```
