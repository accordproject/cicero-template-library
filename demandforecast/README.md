
# Demand Forecast

This is a smart legal clause that conforms to the [Accord Protocol Template Specification](https://docs.google.com/document/d/1UacA_r2KGcBA2D4voDgGE8jqid-Uh4Dt09AE-shBKR0), the protocol is managed by the open-source community of the [Accord Project](https://accordproject.org). The clause can be parsed and executed by the [Cicero](https://github.com/accordproject/cicero) engine.

## Description

> A sample demand forecast clause.

This clause contains:
- *Sample Clause Text* - [sample.txt](sample.txt)
- *A template* - [grammar/template.tem](grammar/template.tem)
- *A data model* - [models/clause.cto](models/clause.cto)
- *Contact logic* (in Ergo) - [logic/logic.ergo](lib/logic.ergo)

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
cicero execute --template ./ --sample ./sample.txt --request ./request.json --state ./state.json
```
> Note, all of the command-line flags (like `--template`) are optional.

Alternatively you can use the simpler command below if you want to use all of the default files.
```
cicero execute
```

You should see the following output in your terminal:
```bash
mattmbp:demandforecast matt$ cicero execute
18:24:47 - info: Logging initialized. 2018-05-15T22:24:47.808Z
18:24:48 - info: Using current directory as template folder
18:24:48 - info: Loading a default sample.txt file.
18:24:48 - info: Loading a single default request.json file.
18:24:48 - info: Loading a default state.json file.
18:24:48 - info: {"clause":"demandforecast@0.0.6-33c2b992f58379853035778dff7ba160aee48558fc3462ca6252ecdab529e735","request":{"$class":"org.accordproject.demandforecast.ForecastRequest","supplyForecast":1200},"response":{"$class":"org.accordproject.demandforecast.BindingResponse","requiredPurchase":1020,"year":2018,"quarter":2,"transactionId":"d813cd90-2ac2-4491-b866-8fee4a267f74","timestamp":"2018-05-15T22:24:48.495Z"},"state":{"$class":"org.accordproject.common.State","stateId":"org.accordproject.common.State#1"},"emit":[]}
```

### Sample Payload Data

Request, as in [request.json](https://github.com/accordproject/cicero-template-library/blob/master/demandforecast/request.json)
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
