# Accord Project Template: car-rental-tr

This is a Sales Contract prepared in Russian Language.

### Parse
Use the `cicero parse` command to load a template from a directory on disk and then use it to parse input text, echoing the result of parsing. If the input text is valid the parsing result will be a JSON serialized instance of the Template Mode:

Sample template.tem:

```
[{seller}] именуемый в дальнейшем Продавец, и [{buyer}], именуемый в дальнейшем Покупатель, заключили настоящий Договор о нижеследующем:

4.2.	Продажа товара на настоящему договору осуществляется [{counterparty}], объем который указывается в соответствующих накладных.

5.3.	Форма оплаты- безналичный расчет. Расчеты производятся [{currencyType}].

8.4.	Споры, возникающие при исполнении настоящего договора, разрешаются путем переговоров. В случае не достижения согласия путем переговоров, Стороны вправе обратиться в экономический суд Российская Федерация по месту нахождения ответчика, предъявив предварительно другой стороне письменную претензию. Срок рассмотрения претензии- [{appealPeriod}] календарных дней со дня ее получения. Не получение ответа на претензию в установленный срок не препятствует Стороне обратиться непосредственно в судебные органы за защитой своих интересов.

8.6.	Во всем остальном, не предусмотренном настоящим договором, стороны руководствуются [{countryLegislation}].

```

Sample.txt:

```
"продавец" именуемый в дальнейшем Продавец, и "покупатель", именуемый в дальнейшем Покупатель, заключили настоящий Договор о нижеследующем:

4.2.	Продажа товара на настоящему договору осуществляется "партиями", объем который указывается в соответствующих накладных.

5.3.	Форма оплаты- безналичный расчет. Расчеты производятся "в российские рубли".

8.4.	Споры, возникающие при исполнении настоящего договора, разрешаются путем переговоров. В случае не достижения согласия путем переговоров, Стороны вправе обратиться в экономический суд Российская Федерация по месту нахождения ответчика, предъявив предварительно другой стороне письменную претензию. Срок рассмотрения претензии- "7" календарных дней со дня ее получения. Не получение ответа на претензию в установленный срок не препятствует Стороне обратиться непосредственно в судебные органы за защитой своих интересов.

8.6.	Во всем остальном, не предусмотренном настоящим договором, стороны руководствуются "законодательством Российская Федерация".

```

```
cicero parse --template ./car-rental-tr/ --dsl ./car-rental-tr/sample.txt
Setting clause data: {"$class": "org.accordru.salescontract.MyRequest","input": "Contract Valid"}
```

### Execute
Use the `cicero execute` command to load a template from a directory on disk, instantiate a clause based on input text, and then invoke the clause using an incoming JSON payload.

```
data.json:
{
    "$class": "org.accordru.salescontract.MyRequest",
    "input": "Contract Valid"
}
```

```
cicero execute --template ./salescontract/ --dsl ./salescontract/sample.txt --data ./salescontract/data.json 
```

The results of execution (a JSON serialized object) are displayed. They include:
* Details of the clause executed (name, version, SHA256 hash of clause data)
* The incoming request object
* The output response object

```
{
  "clause": "car-rental-tr@0.0.0-f63fb789bcc0dd2ae58fb11b15ba59a22383fd46b289f2b9e5e2611be753259c",
  "request": {
    "$class": "org.accordru.salescontract.MyRequest",
    "input": "Contract Valid"
  },
  "response": {
    "$class": "org.accordru.salescontract.MyResponse",
    "output": "Contract Valid",
    "transactionId": "7399e8d6-fc43-4c42-aa71-beabc23e74fe",
    "timestamp": "2018-07-31T12:35:19.835Z"
  },
  "state": {
    "$class": "org.accordproject.cicero.contract.AccordContractState",
    "stateId": "org.accordproject.cicero.contract.AccordContractState#1"
  },
  "emit": []
}
```