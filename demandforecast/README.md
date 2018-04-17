
# Demand Forecast

This is a smart legal clause that conforms to the [Accord Protocol Template Specification](https://docs.google.com/document/d/1UacA_r2KGcBA2D4voDgGE8jqid-Uh4Dt09AE-shBKR0), the protocol is managed by the open-source community of the [Accord Project](https://accordproject.org). The clause can be parsed and executed by the [Cicero](https://github.com/accordproject/cicero) engine.

## Description

> A sample demand forecast clause.

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
cd demandforecast
```
4. With the [Cicero command-line tool](https://github.com/accordproject/cicero#installation):
```
cicero execute --template ./ --dsl ./sample.txt --data ./data.json
```
> Note, all of the command-line flags (like `--template`) are optional.

Alternatively you can use the simpler command below if you want to use all of the default files.
```
cicero execute
```

You should see the following output in your terminal:
```bash
mattmbp:demandforecast matt$ cicero execute
12:09:22 - info: Logging initialized. 2018-04-10T16:09:22.503Z
12:09:23 - info: CICERO-ENGINE {"request":{"$class":"org.accordproject.demandforecast.ForecastRequest","supplyForecast":1200,"transactionId":"c45aa239-9d21-44fd-ac00-ac9374371cf5","timestamp":"2018-04-10T16:09:23.074Z"},"response":{"$class":"org.accordproject.demandforecast.BindingResponse","transactionId":"1cfb50e0-e243-4f16-9491-f0939216a67b","timestamp":"2018-04-10T16:09:23.084Z"},"data":{"$class":"org.accordproject.demandforecast.TemplateModel","purchaser":"PETER","supplier":"DAN","effectiveDate":"04/02/2018","minimumPercentage":85}}
12:09:23 - info: {"clause":"demandforecast@0.0.6-4e8927e99afa2d81afcc6ec5241225dd88ce1b72cfa2359dda195d4c2dc0adc8","request":{"$class":"org.accordproject.demandforecast.ForecastRequest","supplyForecast":1200},"response":{"$class":"org.accordproject.demandforecast.BindingResponse","requiredPurchase":1020,"year":2018,"quarter":2,"transactionId":"1cfb50e0-e243-4f16-9491-f0939216a67b","timestamp":"2018-04-10T16:09:23.084Z"}}
```

### Sample Payload Data


Request, as in [data.json](https://github.com/accordproject/cicero-template-library/blob/master/demandforecast/data.json)
```json
{
    "$class": "org.accordproject.demandforecast.ForecastRequest",
    "supplyForecast": 1200.0
}
```

For the request above, you should see the following response:
```json
{
  "$class": "org.accordproject.demandforecast.BindingResponse",
  "requiredPurchase": 1020,
  "year": 2018,
  "quarter": 2,
  "transactionId": "151aa717-096c-4300-8de3-72650325e599",
  "timestamp": "2018-04-10T16:10:28.699Z"
}
```


## Testing this clause

This clause comes with an automated test that ensures that it executes correctly under different conditions. To test the clause, complete the following steps.

You need npm and node to test a clause. You can download both from [here](https://nodejs.org/).

> This clause was tested with Node v8.9.3 and NPM v5.6.0

From the `demandforecast` directory.

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
mattmbp:demandforecast matt$ npm test

> demandforecast@0.0.6 test /Users/matt/dev/mttrbrts/cicero-template-library/demandforecast
> mocha

11:37:53 - info: Logging initialized. 2018-02-18T11:37:53.706Z


  Logic
    #DemandForecast
...
      ✓ should execute a smart clause (234ms)


  1 passing (426ms)

```
> Output above is abbreviated for clarity at `...`
