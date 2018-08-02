
# Accord Protocol Template: one-time-payment-tr

This is an One-Time Payment Protocol prepared in Turkish Language.

### Parse
Use the `cicero parse` command to load a template from a directory on disk and then use it to parse input text, echoing the result of parsing. If the input text is valid the parsing result will be a JSON serialized instance of the Template Mode:

Sample template.tem:

```
        1.1 Banka [{seller}]
        1.2 Müşteri [{buyer}]

        7. An initial payment of [{initialAmount}] shall be made by [{buyer}] to [{seller}] upon execution of this Agreement.
```

Sample.txt:

```
        1.1 Banka "ACME Corp."
        1.2 Müşteri "Can Doğan"

        7. An initial payment of 1922.99 TRY shall be made by "ACME Corp." to "Can Doğan" upon execution of this Agreement.
```

```
cicero parse --template ./one-time-payment-tr/ --dsl ./one-time-payment-tr/sample.txt
Setting clause data: {"$class": "org.accordtr.onetimepayment.InitRequest"}
```

### Execute
Use the `cicero execute` command to load a template from a directory on disk, instantiate a clause based on input text, and then invoke the clause using an incoming JSON payload.

```
data.json:
{
   "$class": "org.accordtr.onetimepayment.InitRequest"
}
```

```
cicero execute --template ./one-time-payment-tr/ --dsl ./one-time-payment-tr/sample.txt --data ./one-time-payment-tr/data.json 
```

The results of execution (a JSON serialized object) are displayed. They include:
* Details of the clause executed (name, version, SHA256 hash of clause data)
* The incoming request object
* The output response object

```
    {
      "$class": "org.accordproject.cicero.runtime.PaymentObligation",
      "amount": {
        "$class": "org.accordproject.money.MonetaryAmount",
        "doubleValue": 1922.00,
        "currencyCode": "TRY"
      },
      "description": "[object Object] should pay contract amount to [object Object]",
      "contract": "resource:org.accordproject.cicero.contract.AccordContract#608991e1-4d47-4f52-8c3d-dab7ad003ac9",
      "promisor": "resource:org.accordproject.cicero.contract.AccordParty#Can%20Do%C4%9Fan",
      "promisee": "resource:org.accordproject.cicero.contract.AccordParty#ACME%20Corp.",
      "eventId": "valid",
      "timestamp": "2018-07-31T08:46:18.749Z"
      }
    ]
  }
```