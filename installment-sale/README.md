
# Installment Sale

This is a smart legal clause that conforms to the [Accord Protocol Template Specification](https://docs.google.com/document/d/1UacA_r2KGcBA2D4voDgGE8jqid-Uh4Dt09AE-shBKR0), the protocol is managed by the open-source community of the [Accord Project](https://accordproject.org). The clause can be parsed and executed by the [Cicero](https://github.com/accordproject/cicero) engine.

## Description
> A simple clause for a sale paid in installments.

This clause contains:
- *Some sample Clause Text* - [sample.txt](sample.txt)
- *A template* - [grammar/template.tem](grammar/template.tem)
- *A data model* - [models/model.cto](models/model.cto)
- *Contact logic* (in JavaScript) - [logic/logic.ero](lib/logic.ergo)

## Running this clause

### On your own machine

1. [Download the Cicero template library](https://github.com/accordproject/installment-sale/archive/master.zip)

2. Unzip the library with your favourite tool

3. Then from the command-line, change the current directory to the folder containing this README.md file.
```
cd installment-sale
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
mattmbp:installment-sale matt$ cicero execute
18:29:01 - info: Logging initialized. 2018-05-15T22:29:01.219Z
18:29:01 - info: Using current directory as template folder
18:29:01 - info: Loading a default sample.txt file.
18:29:01 - info: Loading a single default request.json file.
18:29:01 - info: Loading a default state.json file.
18:29:01 - info: {"clause":"installment-sale@0.0.3-7018ffb6733ef40574833128bff20f82bd305f8db438256d6921409da08bec2c","request":{"$class":"org.accordproject.installmentsale.Installment","amount":2500},"response":{"$class":"org.accordproject.installmentsale.Balance","balance":7612.499999999999,"total_paid":2500,"transactionId":"99d68c6b-87df-43c2-b44f-3f409eef3480","timestamp":"2018-05-15T22:29:01.945Z"},"state":{"$class":"org.accordproject.installmentsale.InstallmentSaleState","status":"WaitingForFirstDayOfNextMonth","balance_remaining":7612.499999999999,"next_payment_month":4,"total_paid":2500,"stateId":"org.accordproject.installmentsale.InstallmentSaleState#1"},"emit":[{"$class":"org.accordproject.installmentsale.PaymentObligation","from":"Dan","to":"Ned","amount":2500,"eventId":"valid","timestamp":"2018-05-15T22:29:01.946Z"}]}
```

### Sample Payload Data

Request, as in [request.json](https://github.com/accordproject/cicero-template-library/blob/master/installment-sale/request.json)
```json
{
    "$class": "org.accordproject.installmentsale.Installment",
    "amount": 2500.00
}
```

For the request above, you should see the following response:
```json
{
  "$class": "org.accordproject.installmentsale.Balance",
  "balance": 7612.499999999999,
  "total_paid": 2500,
  "transactionId": "4c2c8861-6557-46e9-840e-b0e39e410e49",
  "timestamp": "2018-05-08T15:24:04.434Z"
}
```


## Testing this clause

This clause comes with an automated test that ensures that it executes correctly under different conditions. To test the clause, complete the following steps.

You need npm and node to test a clause. You can download both from [here](https://nodejs.org/).

> This clause was tested with Node v8.9.3 and NPM v5.6.0

From the `installment-sale` directory.

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
mattmbp:installment-sale matt$ npm test

> installment-sale@0.0.3 test /Users/matt/dev/accordproject/cicero-template-library/installment-sale
> mocha

21:57:31 - info: Logging initialized. 2018-02-17T21:57:31.074Z


  Logic
    #Installment
      ✓ pay one installment
    #Installment
      ✓ pay in four installments


  4 passing (458ms)

```
