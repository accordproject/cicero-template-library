
# SAFT (Simple Agreement for Future Tokens)

This is a smart legal contract that conforms to the [Accord Protocol Template Specification](https://docs.google.com/document/d/1UacA_r2KGcBA2D4voDgGE8jqid-Uh4Dt09AE-shBKR0), the protocol is managed by the open-source community of the [Accord Project](https://accordproject.org). The clause can be parsed and executed by the [Cicero](https://github.com/accordproject/cicero) engine.

## Description

> The SAFT contract is a futures contract where a person invests in a company in exchange for receiving utility tokens that may be used when a product launches.

This clause contains:
- *Sample Clause Text* - [sample.txt](sample.txt)
- *A template* - [grammar/template.tem](grammar/template.tem)
- *Some data models* - [models/model.cto](models/model.cto), [models/states.cto](models/states.cto)
- *Contact logic* (in JavaScript) - [logic/logic.js](lib/logic.js)

## Running this clause

### On your own machine

1. [Download the Cicero template library](https://github.com/accordproject/cicero-template-library/archive/master.zip)

2. Unzip the library with your favourite tool

3. Then from the command-line, change the current directory to the folder containing this README.md file.
```
cd saft
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
mattmbp:saft matt$ cicero execute
18:32:00 - info: Logging initialized. 2018-05-15T22:32:00.598Z
18:32:01 - info: Using current directory as template folder
18:32:01 - info: Loading a default sample.txt file.
18:32:01 - info: Loading a single default request.json file.
18:32:01 - info: Loading a default state.json file.
18:32:01 - info: CICERO-ENGINE {"request":{"$class":"org.accordproject.saft.Launch","exchangeRate":123,"transactionId":"f845a64b-f031-4982-8742-3e1f8be5d59a","timestamp":"2018-05-15T22:32:01.684Z"},"state":{"$class":"org.accordproject.common.State","stateId":"org.accordproject.common.State#1"},"contract":{"$class":"org.accordproject.saft.TemplateModel","token":"Clause Token","company":"Clause","companyType":"Limited","state":"NY","amendmentProvision":true,"purchaseAmount":25,"currency":"EUR","netProceedLimit":3000000,"date":"2017-10-04","deadlineDate":"2018-04-20","discountRatePercentage":38,"network":"Clause Network","coin":"Ether","exchanges":"itBit","companyRepresentative":"Peter Hunn","purchaser":"Daniel Charles Selman","description":"happiness and intergalactic equality"},"response":{"$class":"org.accordproject.saft.Payout","transactionId":"ac6fad22-db01-4232-9b8a-d41f0db6a9e7","timestamp":"2018-05-15T22:32:01.695Z"},"emit":[],"now":"2018-05-15T22:32:01.694Z"}
18:32:01 - info: {"clause":"saft@0.1.1-4175d2cf86166610d7765553553642f32960166fd76b0ac41b9998ff97a72986","request":{"$class":"org.accordproject.saft.Launch","exchangeRate":123},"response":{"$class":"org.accordproject.saft.Payout","tokenAmount":100,"tokenAddress":"Daniel Charles Selman","transactionId":"ac6fad22-db01-4232-9b8a-d41f0db6a9e7","timestamp":"2018-05-15T22:32:01.695Z"},"state":{"$class":"org.accordproject.common.State","stateId":"org.accordproject.common.State#1"},"emit":[]}
```

### Sample Payload Data

Request, as in [request.json](https://github.com/accordproject/cicero-template-library/blob/master/perishable-goods/request.json)
```json
{
    "$class": "org.accordproject.saft.Launch",
    "exchangeRate": 123
}
```

For the request above, you should see the following response:
```json
{
    "$class":"org.accordproject.saft.Payout",
    "tokenAmount":100,
    "tokenAddress":"Daniel Charles Selman",
    "transactionId":"51cc3295-dec4-4e5c-a5f0-ea0ee7901d3e",
    "timestamp":"2018-02-18T11:29:55.347Z"
}
```


## Testing this clause

This clause comes with an automated test that ensures that it executes correctly under different conditions. To test the clause, complete the following steps.

You need npm and node to test a clause. You can download both from [here](https://nodejs.org/).

> This clause was tested with Node v8.9.3 and NPM v5.6.0

From the `saft` directory.

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
mattmbp:saft matt$ npm test

> saft@0.1.1 test /Users/matt/dev/accordproject/cicero-template-library/saft
> mocha

11:31:59 - info: Logging initialized. 2018-02-18T11:31:59.439Z


  Logic
    #Launch
...
      ✓ when network launches there should be a payout


  1 passing (711ms)

```
> Output above is abbreviated for clarity at `...`
