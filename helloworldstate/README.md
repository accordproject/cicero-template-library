# Hello World 

This is a smart legal clause that conforms to the [Accord Protocol Template Specification](https://docs.google.com/document/d/1UacA_r2KGcBA2D4voDgGE8jqid-Uh4Dt09AE-shBKR0), the protocol is managed by the open-source community of the [Accord Project](https://accordproject.org). The clause can be parsed and executed by the [Cicero](https://github.com/accordproject/cicero) engine.

## Description

> This is the stateful Hello World of Accord Protocol Templates. Executing the clause will simply echo back the text that occurs after the string `Hello` prepended to text that is passed in the request along with the number of times the clause has been called.

This clause contains:
- *Some sample Clause Text* - [sample.txt](sample.txt)
- *A template* - [grammar/template.tem](grammar/template.tem)
- *A data model* - [models/model.cto](models/model.cto)
- *Contact logic* (in JavaScript) - [logic/logic.js](lib/logic.js)

## Running this clause

### On your own machine

1. [Download the Cicero template library](https://github.com/accordproject/cicero-template-library/archive/master.zip)

2. Unzip the library with your favourite tool

3. Then from the command-line, change the current directory to the folder containing this README.md file.
```
cd helloworldstate
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
mattmbp:helloworldstate matt$ cicero execute
11:01:15 - info: Logging initialized. 2018-02-18T11:01:15.771Z
11:01:16 - info: Using current directory as template folder
11:01:16 - info: Loading a default sample.txt file.
11:01:16 - info: Loading a default data.json file.
11:01:16 - info: {"clause":"helloworld@0.0.5-3119b65d48818b038883b0846738d34a61df5ac895093eb88003f07c96ee39c7","request":{"$class":"org.accordproject.helloworld.Request","input":"Accord Project"},"response":{"$class":"org.accordproject.helloworld.Response","output":"Hello Fred Blogs Accord Project(1)","transactionId":"8b0ec544-6fe1-4894-9044-18d1d568dce1","timestamp":"2018-05-07T18:26:07.721Z"},"state":{"counter":1},"emit":[]}
```

The contract state changes every time you call the clause. If you pass more than one requests on the command line, the input will use the state to return the number of times it has been called:

```
cicero execute --template ./ --sample ./sample.txt --request ./request.json --request ./request.json --request ./request.json
14:31:19 - info: Logging initialized. 2018-05-07T18:31:19.790Z
14:31:20 - info: Loading a default state.json file.
14:31:20 - info: {"clause":"helloworldstate@0.0.5-bf3fd89c5a3c5ac9faab5754f69c7cefe24e1e5b30fe786ff29883ca286b4f3d","request":{"$class":"org.accordproject.helloworldstate.Request","input":"Accord Project"},"response":{"$class":"org.accordproject.helloworldstate.Response","output":"Hello Fred Blogs Accord Project(3)","transactionId":"5c3b1f10-8bf6-4b52-b03c-39b3498fcaee","timestamp":"2018-05-07T18:31:20.358Z"},"state":{"counter":3},"emit":[]}
```

### Sample Payload Data


Request, as in [data.json](https://github.com/accordproject/cicero-template-library/blob/master/helloworld/data.json)
```json
{
    "$class": "org.accordproject.helloworld.Request",
    "input": "Accord Project"
}

```

For the request above, you should see the following response:
```json
{
    "$class": "org.accordproject.helloworld.Response",
    "output": "Hello Fred Blogs Accord Project(1)",
    "transactionId": "8b0ec544-6fe1-4894-9044-18d1d568dce1",
    "timestamp": "2018-05-07T18:26:07.721Z"
  }
```


## Testing this clause

This clause comes with an automated test that ensures that it executes correctly under different conditions. To test the clause, complete the following steps.

You need npm and node to test a clause. You can download both from [here](https://nodejs.org/).

> This clause was tested with Node v8.9.3 and NPM v5.6.0

From the `helloworldstate` directory.

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
mattmbp:helloworldstate matt$ npm test

> helloworldstate@0.0.5 test /Users/matt/dev/accordproject/cicero-template-library/helloworldstate
> mocha

10:59:43 - info: Logging initialized. 2018-02-18T10:59:43.781Z


  Logic
    #Hello
      ✓ should produce correct result


  1 passing (217ms)
```
