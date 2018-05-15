
# Service Level Agreement

This is a smart legal clause that conforms to the [Accord Protocol Template Specification](https://docs.google.com/document/d/1UacA_r2KGcBA2D4voDgGE8jqid-Uh4Dt09AE-shBKR0), the protocol is managed by the open-source community of the [Accord Project](https://accordproject.org). The clause can be parsed and executed by the [Cicero](https://github.com/accordproject/cicero) engine.

## Description

> A service level agreement that gives invoice credit based on service availability.

This clause contains:
- *Some sample Clause Text* - [sample.txt](sample.txt)
- *A template* - [grammar/template.tem](grammar/template.tem)
- *Some data models* - [models/clause.cto](models/clause.cto)
- *Contact logic* (in JavaScript) - [logic/logic.js](lib/logic.js)

## Running this clause

### On your own machine

1. [Download the Cicero template library](https://github.com/accordproject/cicero-template-library/archive/master.zip)

2. Unzip the library with your favourite tool

3. Then from the command-line, change the current directory to the folder containing this README.md file.
```
cd servicelevelagreement
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
mattmbp:servicelevelagreement matt$ cicero execute
18:32:39 - info: Logging initialized. 2018-05-15T22:32:39.050Z
18:32:39 - info: Using current directory as template folder
18:32:39 - info: Loading a default sample.txt file.
18:32:39 - info: Loading a single default request.json file.
18:32:39 - info: Loading a default state.json file.
18:32:39 - info: {"clause":"servicelevelagreement@0.0.1-58c0a82b311c6ec6c1c3a994b13994fd11f7a138fae428fe752ef04ad3477bd3","request":{"$class":"org.accordproject.servicelevelagreement.MonthSummary","monthlyServiceLevel":99.7,"monthlyCharge":10,"last11MonthCredit":0,"last11MonthCharge":0},"response":{"$class":"org.accordproject.servicelevelagreement.InvoiceCredit","monthlyCredit":0.2,"transactionId":"e74bde3f-df1d-4ced-be4c-c9bc6226ec91","timestamp":"2018-05-15T22:32:39.823Z"},"state":{"$class":"org.accordproject.common.State","stateId":"org.accordproject.common.State#1"},"emit":[]}
```

### Sample Payload Data

Request, as in [request.json](https://github.com/accordproject/cicero-template-library/blob/master/servicelevelagreement/request.json)
```json
{
    "$class": "org.accordproject.servicelevelagreement.MonthSummary",
    "monthlyServiceLevel": 99.7,
    "monthlyCharge": 10,
    "last11MonthCredit": 0,
    "last11MonthCharge": 0
}

```

For the request above, you should see the following response:
```json
{
    "$class":"org.accordproject.servicelevelagreement.InvoiceCredit",
    "monthlyCredit":0.2,
    "transactionId":"0a63058b-bf16-4ff0-810c-5ceff005b3e8",
    "timestamp":"2018-03-01T12:08:30.805Z"
}
```


## Testing this clause

This clause comes with an automated test that ensures that it executes correctly under different conditions. To test the clause, complete the following steps.

You need npm and node to test a clause. You can download both from [here](https://nodejs.org/).

> This clause was tested with Node v8.9.3 and NPM v5.6.0

From the `servicelevelagreement` directory.

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
mattmbp:servicelevelagreement matt$ npm test

> servicelevelagreement@0.0.1 test /Users/matt/dev/accordproject/cicero-template-library/servicelevelagreement
> mocha

12:06:56 - info: Logging initialized. 2018-03-01T12:06:56.032Z


  Logic
    #Service Level Agreement
      ✓ give no credit for 100% availability
      ✓ give some credit for 99.7% availability
      ✓ give more credit for 97.0% availability
      ✓ give more credit for 97.0% availability with monthly cap
      ✓ give credit capped at annual cap
      ✓ rejects bad request values


  6 passing (972ms)

```
