# Accord Project Template: car-rental-tr

This is an Online Payment Contract prepared in Turkish Language.

### Parse
Use the `cicero parse` command to load a template from a directory on disk and then use it to parse input text, echoing the result of parsing. If the input text is valid the parsing result will be a JSON serialized instance of the Template Mode:

Sample template.tem:

```
            1.1  [{buyer}] (Bundan sonra ALICI olarak anılacaktır)

            1.2. [{seller}]  (Bundan sonra SATICI olarak anılacaktır)

            Program: [{softwareID}]          

            Kullanıcı Sayısı: [{userCount}]

            10. Bu sözleşmeden doğan anlaşmazlıkların çözümde [{authorizedCourt}] yetkilidir.
```

Sample.txt:

```
            1.1  "Umut" (Bundan sonra ALICI olarak anılacaktır)

            1.2. "Serkan"  (Bundan sonra SATICI olarak anılacaktır)

            Program: "AcmeSoftware-1.0"          

            Kullanıcı Sayısı: "2" 

            10. Bu sözleşmeden doğan anlaşmazlıkların çözümde "ANKARA 1.Bölge İdare Mahkemesi" yetkilidir.
```

```
cicero parse --template ./car-rental-tr/ --dsl ./car-rental-tr/sample.txt
Setting clause data: {"$class": "org.accordtr.onlinepayment.MyRequest","input": "Payment Valid"}
```

### Execute
Use the `cicero execute` command to load a template from a directory on disk, instantiate a clause based on input text, and then invoke the clause using an incoming JSON payload.

```
data.json:
{
    "$class": "org.accordtr.onlinepayment.MyRequest",
    "input": "Payment Valid"
}
```

```
cicero execute --template ./onlinepayment/ --dsl ./onlinepayment/sample.txt --data ./onlinepayment/data.json 
```

The results of execution (a JSON serialized object) are displayed. They include:
* Details of the clause executed (name, version, SHA256 hash of clause data)
* The incoming request object
* The output response object

```
{
  "clause": "car-rental-tr@0.0.0-ff89c948d7499cf12b3319b2e2d809cd7485a6ee0c819b6ce7b643bc49579bd1",
  "request": {
    "$class": "org.accordtr.onlinepayment.MyRequest",
    "input": "Payment Valid"
  },
  "response": {
    "$class": "org.accordtr.onlinepayment.MyResponse",
    "output": "Payment Valid",
    "transactionId": "e041f21a-0557-432d-bac9-0b32070787dd",
    "timestamp": "2018-07-31T11:44:57.748Z"
  },
  "state": {
    "$class": "org.accordproject.cicero.contract.AccordContractState",
    "stateId": "b71ed0bf-56b1-4b27-8574-3d20f64b5896"
  },
  "emit": []
}
```