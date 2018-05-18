
# Copyright License

This is a smart legal clause that conforms to the [Accord Protocol Template Specification](https://docs.google.com/document/d/1UacA_r2KGcBA2D4voDgGE8jqid-Uh4Dt09AE-shBKR0), the protocol is managed by the open-source community of the [Accord Project](https://accordproject.org). The clause can be parsed and executed by the [Cicero](https://github.com/accordproject/cicero) engine.

## Description
> This is a copyright license agreement.

This clause contains:
- *Some sample Clause Text* - [sample.txt](sample.txt)
- *A template* - [grammar/template.tem](grammar/template.tem)
- *A data model* - [models/model.cto](models/model.cto)
- *Contact logic* (in Ergo) - [logic/logic.ergo](lib/logic.ergo)

## Running this clause

### On your own machine

1. [Download the Cicero template library](https://github.com/accordproject/copyright-license/archive/master.zip)

2. Unzip the library with your favourite tool

3. Then from the command-line, change the current directory to the folder containing this README.md file.
```
cd copyright-license
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
mattmbp:copyright-license matt$ cicero execute
18:23:14 - info: Logging initialized. 2018-05-15T22:23:14.567Z
18:23:15 - info: Using current directory as template folder
18:23:15 - info: Loading a default sample.txt file.
18:23:15 - info: Loading a single default request.json file.
18:23:15 - info: Loading a default state.json file.
18:23:15 - info: {"clause":"copyright-license@0.0.3-ed96691079abc8d7017e5070ab9e3e901d04fc911ee6617fe181cefacf663010","request":{"$class":"org.accordproject.copyrightlicense.PaymentRequest"},"response":{"$class":"org.accordproject.copyrightlicense.PayOut","amount":100,"transactionId":"b27a6afc-8dd9-4620-bcc8-d063e5ffe5de","timestamp":"2018-05-15T22:23:15.353Z"},"state":{"$class":"org.accordproject.common.State","stateId":"org.accordproject.common.State#1"},"emit":[]}
```

### Sample Payload Data

Request, as in [request.json](https://github.com/accordproject/cicero-template-library/blob/master/copyright-notice/request.json)
```json
{
    "$class":"org.accordproject.copyrightlicense.PaymentRequest"
}
```

For the request above, you should see the following response:
```json
{
  "$class": "org.accordproject.copyrightlicense.PayOut",
  "amount": 100,
  "transactionId": "478eff7c-6861-4af8-ad66-68ed532035a6",
  "timestamp": "2018-05-04T04:42:30.698Z"
}
```


## Testing this clause

This clause comes with an automated test that ensures that it executes correctly under different conditions. To test the clause, complete the following steps.

You need npm and node to test a clause. You can download both from [here](https://nodejs.org/).

> This clause was tested with Node v8.9.3 and NPM v5.6.0

From the `copyright-license` directory.

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
mattmbp:copyright-license matt$ npm test

> copyright-license@0.0.3 test /Users/matt/dev/accordproject/cicero-template-library/copyright-license
> mocha

21:57:31 - info: Logging initialized. 2018-02-17T21:57:31.074Z


  Logic
    #RequestPayment
      ✓ licensee fee should be payed to the amount of


  1 passing (362ms)

```
