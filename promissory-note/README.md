# Promissory Note

This is a smart legal clause that conforms to the [Accord Project Template Specification](https://docs.google.com/document/d/1UacA_r2KGcBA2D4voDgGE8jqid-Uh4Dt09AE-shBKR0), the protocol is managed by the open-source community of the [Accord Project](https://accordproject.org). The clause can be parsed and executed by the [Cicero](https://github.com/accordproject/cicero) engine.

## Description

> This clause specifies how an interest bearing loan should be repaid.

This clause contains:
- *Sample Clause Text* - [sample.txt](sample.txt)
- *A template* - [grammar/template.tem](grammar/template.tem)
- *Some data models* - [models/model.cto](models/model.cto), [models/contact.cto](models/contact.cto)
- *Contact logic* (in Ergo) - [logic/logic.ergo](lib/logic.ergo)

## Running this clause

### On your own machine

1. [Download the Cicero template library](https://github.com/accordproject/cicero-template-library/archive/master.zip)

2. Unzip the library with your favourite tool

3. Then from the command-line, change the current directory to the folder containing this README.md file.
```
cd promissory-note
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

### Sample Payload Data


Request, as in [data.json](https://github.com/accordproject/cicero-template-library/blob/master/promissory-note/data.json)
```json
{
    "$class": "org.accordproject.promissorynote.Request",
    "amountPaid": 100.50
}
```

For the request above, you should see the following response:
```json
{
    "$class": "org.accordproject.promissorynote.Response",
    "outstandingBalance": 300.23
}
```


## Testing this clause

This clause comes with an automated test that ensures that it executes correctly under different conditions. To test the clause, complete the following steps.

You need npm and node to test a clause. You can download both from [here](https://nodejs.org/).

> This clause was tested with Node v8.9.3 and NPM v5.6.0

From the `promissory-note` directory.

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
dselman$ npm test

> promissory-note@0.0.1 test /Users/dselman/dev/cicero-template-library/promissory-note
> mocha

13:51:10 - info: Logging initialized. 2018-05-09T12:51:10.359Z


  Logic
    #PromissoryNote
      ✓ should execute a smart clause


  1 passing (437ms)

```
> Output above is abbreviated for clarity at `...`
