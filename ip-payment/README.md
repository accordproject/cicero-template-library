
# IP Payment Clause

This is a smart legal clause that conforms to the [Accord Protocol Template Specification](https://docs.google.com/document/d/1UacA_r2KGcBA2D4voDgGE8jqid-Uh4Dt09AE-shBKR0), the protocol is managed by the open-source community of the [Accord Project](https://accordproject.org). The clause can be parsed and executed by the [Cicero](https://github.com/accordproject/cicero) engine.

## Description
> A payment clause for an IP agreement, such as a trademark or a copyright licenses aggreement.

This clause contains:
- *Some sample Clause Text* - [sample.txt](sample.txt)
- *A template* - [grammar/template.tem](grammar/template.tem)
- *A data model* - [models/model.cto](models/model.cto)
- *Contact logic* (in JavaScript) - [logic/logic.js](lib/logic.js)

## Running this clause

### On your own machine

1. [Download the Cicero template library](https://github.com/accordproject/ip-payment/archive/master.zip)

2. Unzip the library with your favourite tool

3. Then from the command-line, change the current directory to the folder containing this README.md file.
```
cd ip-payment
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
mattmbp:ip-payment matt$ cicero execute
18:29:20 - info: Logging initialized. 2018-05-15T22:29:20.325Z
18:29:20 - info: Using current directory as template folder
18:29:20 - info: Loading a default sample.txt file.
18:29:20 - info: Loading a single default request.json file.
18:29:20 - info: Loading a default state.json file.
18:29:21 - info: {"clause":"ip-payment@0.0.3-b29a1d3b15800d29e2ace411d8f40d272e22675e81131b1e7dead5f16491ef56","request":{"$class":"org.accordproject.ippayment.PaymentRequest","netSaleRevenue":1200,"sublicensingRevenue":450,"permissionGrantedBy":"04-05-2018"},"response":{"$class":"org.accordproject.ippayment.PayOut","totalAmount":77.4,"dueBy":"04-12-2018","transactionId":"084e34b8-0407-403c-9ad6-944620b69f04","timestamp":"2018-05-15T22:29:21.054Z"},"state":{"$class":"org.accordproject.common.State","stateId":"org.accordproject.common.State#1"},"emit":[]}
```

### Sample Payload Data

Request, as in [request.json](https://github.com/accordproject/cicero-template-library/blob/master/acceptance-of-delivery/request.json)
```json
{
    "$class":"org.accordproject.ippayment.PaymentRequest",
		"netSaleRevenue":1200.00,
		"sublicensingRevenue":450.00,
		"permissionGrantedBy":"04-05-2018"
}
```

For the request above, you should see the following response:
```json
{
  "$class": "org.accordproject.ippayment.PayOut",
  "totalAmount": 7740,
  "dueBy": "07-07-2018",
  "transactionId": "8d8748f3-60a9-4041-b0d3-7fa83fcc4a7d",
  "timestamp": "2018-05-04T13:36:58.290Z"
}
```

## Testing this clause

This clause comes with an automated test that ensures that it executes correctly under different conditions. To test the clause, complete the following steps.

You need npm and node to test a clause. You can download both from [here](https://nodejs.org/).

> This clause was tested with Node v8.9.3 and NPM v5.6.0

From the `ip-payment` directory.

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
mattmbp:ip-payment matt$ npm test

> ip-payment@0.0.3 test /Users/matt/dev/accordproject/cicero-template-library/ip-payment
> mocha

21:57:31 - info: Logging initialized. 2018-02-17T21:57:31.074Z


  Logic
    #RequestPayment
      ✓ Payment should be payed to the amount of


  1 passing (239ms)

```
