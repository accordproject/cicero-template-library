
# Supply Agreement

This is a smart legal clause that conforms to the [Accord Protocol Template Specification](https://docs.google.com/document/d/1UacA_r2KGcBA2D4voDgGE8jqid-Uh4Dt09AE-shBKR0), the protocol is managed by the open-source community of the [Accord Project](https://accordproject.org). The clause can be parsed and executed by the [Cicero](https://github.com/accordproject/cicero) engine.

## Description

> A sample supply agreement.

This clause contains:
- *Sample Clause Text* - [sample.txt](sample.txt)
- *A template* - [grammar/template.tem](grammar/template.tem)
- *A data model* - [models/clause.cto](models/clause.cto)
- *Contact logic* (in JavaScript) - [logic/logic.js](lib/logic.js)

## Running this clause

### On your own machine

1. [Download the Cicero template library](https://github.com/accordproject/cicero-template-library/archive/master.zip)

2. Unzip the library with your favourite tool

3. Then from the command-line, change the current directory to the folder containing this README.md file.
```
cd supplyagreement
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
mattmbp:supplyagreement matt$ cicero execute
14:39:08 - info: Logging initialized. 2018-05-10T18:39:08.552Z
14:39:08 - info: Using current directory as template folder
14:39:08 - info: Loading a default sample.txt file.
14:39:08 - info: Loading a single default request.json file.
14:39:08 - info: Loading a default state.json file.
14:39:09 - info: CICERO-ENGINE {"request":{"$class":"org.accordproject.supplyagreement.ForecastRequest","supplyForecast":1200,"transactionId":"0da18b1c-98a5-4fbb-bc58-13b609df2e1e","timestamp":"2018-05-10T18:39:09.602Z"},"state":{"$class":"org.accordproject.contract.State"},"contract":{"$class":"org.accordproject.supplyagreement.TemplateModel","effectiveDate":"2018-04-02","supplier":"DAN","buyer":"PETER","shortDescriptionOfTheProducts":"Colorful Umbrellas","noticeWindow":2,"cancellationWindow":10,"minimumPercentage":85,"deliverables":"Blue Umbrellas","deliveryWindow":1,"deliveryAttachment":"Annex A","inspectionWindow":3,"acceptanceAttachment":"Annex B","priceUpdateWindow":15,"accountNumber":"XXX-XX","routingNumnber":"YYY-YY","termYears":2,"renewalYears":1,"renewalWindow":30,"governingState":"NY","venueState":"NY"},"clause":{},"response":{"$class":"org.accordproject.supplyagreement.BindingResponse","transactionId":"ee525721-7c99-4322-9a90-f9165466db28","timestamp":"2018-05-10T18:39:09.606Z"},"emit":[]}
14:39:09 - info: {"clause":"supplyagreement@0.0.6-eae4c8d3c71aedf06d3b0ec7dc7d3178307f7b72fc6f0dc1c1c58db5c6664ff1","request":{"$class":"org.accordproject.supplyagreement.ForecastRequest","supplyForecast":1200},"response":{"$class":"org.accordproject.supplyagreement.BindingResponse","requiredPurchase":1020,"year":2018,"quarter":2,"transactionId":"ee525721-7c99-4322-9a90-f9165466db28","timestamp":"2018-05-10T18:39:09.606Z"},"state":{"$class":"org.accordproject.contract.State"},"emit":[]}
```

### Sample Payload Data


Request, as in [data.json](https://github.com/accordproject/cicero-template-library/blob/master/supplyagreement/data.json)
```json
{
    "$class": "org.accordproject.supplyagreement.ForecastRequest",
    "supplyForecast": 1200.0
}
```

For the request above, you should see the following response:
```json
{
  "$class": "org.accordproject.supplyagreement.BindingResponse",
  "requiredPurchase": 1020,
  "year": 2018,
  "quarter": 2,
  "transactionId": "ee525721-7c99-4322-9a90-f9165466db28",
  "timestamp": "2018-05-10T18:39:09.606Z"
}
```


## Testing this clause

This clause comes with an automated test that ensures that it executes correctly under different conditions. To test the clause, complete the following steps.

You need npm and node to test a clause. You can download both from [here](https://nodejs.org/).

> This clause was tested with Node v8.9.3 and NPM v5.6.0

From the `supplyagreement` directory.

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
mattmbp:supplyagreement matt$ npm test

> supplyagreement@0.0.6 test /Users/matt/dev/mttrbrts/cicero-template-library/supplyagreement
> mocha

11:37:53 - info: Logging initialized. 2018-02-18T11:37:53.706Z


  Logic
    #Supplyagreement
...
      ✓ should execute a smart clause (234ms)


  1 passing (426ms)

```
> Output above is abbreviated for clarity at `...`
