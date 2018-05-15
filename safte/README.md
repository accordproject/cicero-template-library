
# SAFTE (Simple Agreement for Future Tokens or Equity)

This is a smart legal contract that conforms to the [Accord Protocol Template Specification](https://docs.google.com/document/d/1UacA_r2KGcBA2D4voDgGE8jqid-Uh4Dt09AE-shBKR0), the protocol is managed by the open-source community of the [Accord Project](https://accordproject.org). The clause can be parsed and executed by the [Cicero](https://github.com/accordproject/cicero) engine.

## Description

> The SAFTE contract is a futures contract where a person invests in a company in exchange for receiving either utility tokens that may be used when a product launches or equity in the company.

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
cd safte
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
mattmbp:safte matt$ cicero execute
18:32:19 - info: Logging initialized. 2018-05-15T22:32:19.046Z
18:32:19 - info: Using current directory as template folder
18:32:19 - info: Loading a default sample.txt file.
18:32:19 - info: Loading a single default request.json file.
18:32:19 - info: Loading a default state.json file.
18:32:20 - info: CICERO-ENGINE {"request":{"$class":"org.accordproject.safte.TokenSale","tokenPrice":1.23,"transactionId":"8483dedf-0009-4b0a-ac03-470de19c23f0","timestamp":"2018-05-15T22:32:20.578Z"},"state":{"$class":"org.accordproject.common.State","stateId":"org.accordproject.common.State#1"},"contract":{"$class":"org.accordproject.safte.TemplateModel","companyName":"ACME","companyRegistrationNumber":555,"purchaser":"Dan","jurisdiction":"NY","purchaseAmount":25,"discount":7,"projectName":"Umbrella","projectDescription":"manages umbrella tokens","months":12,"monthsText":"twelve","amount":1000,"amountText":"one thousand"},"response":{"$class":"org.accordproject.safte.TokenShare","transactionId":"47b04887-a5a2-42b8-9073-a4bb1ff539e7","timestamp":"2018-05-15T22:32:20.588Z"},"emit":[],"now":"2018-05-15T22:32:20.588Z"}
18:32:20 - info: {"clause":"safte@0.1.1-95e0689a76925ef6c11da3ccd7124fbbceb9233e6aa0361f67e45b28fe205018","request":{"$class":"org.accordproject.safte.TokenSale","tokenPrice":1.23},"response":{"$class":"org.accordproject.safte.TokenShare","tokenAmount":21.855057260250017,"transactionId":"47b04887-a5a2-42b8-9073-a4bb1ff539e7","timestamp":"2018-05-15T22:32:20.588Z"},"state":{"$class":"org.accordproject.common.State","stateId":"org.accordproject.common.State#1"},"emit":[]}
```

### Sample Payload Data

Request, as in [request.json](https://github.com/accordproject/cicero-template-library/blob/master/perishable-goods/request.json)
```json
{
    "$class": "org.accordproject.safte.TokenSale",
    "tokenPrice": 1.23
}
```

For the request above, you should see the following response:
```json
{
  "$class": "org.accordproject.safte.TokenShare",
  "tokenAmount": 21.855057260250017,
  "transactionId": "f0ec9a22-58a4-4a29-8fc4-930f74e14783",
  "timestamp": "2018-05-03T07:43:39.272Z"
}
```


## Testing this clause

This clause comes with an automated test that ensures that it executes correctly under different conditions. To test the clause, complete the following steps.

You need npm and node to test a clause. You can download both from [here](https://nodejs.org/).

> This clause was tested with Node v8.9.3 and NPM v5.6.0

From the `safte` directory.

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
mattmbp:safte matt$ npm test

> safte@0.1.1 test /Users/matt/dev/accordproject/cicero-template-library/safte
> mocha

11:31:59 - info: Logging initialized. 2018-02-18T11:31:59.439Z


  Logic
    #TokenSale
...
      ✓ if token sale occurs, should provide a share of that sale
    #
...
      ✓ if equity financing is chosen, should provide a share of that equity
    #
...
      ✓ if dissolution event occurs, should refund the amount

  3 passing (3s)

```
> Output above is abbreviated for clarity at `...`
