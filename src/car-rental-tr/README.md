
# Accord Protocol Template: car-rental-tr

This is a Simple Car Rental Contract in Turkish Language.

### Parse
Use the `cicero parse` command to load a template from a directory on disk and then use it to parse input text, echoing the result of parsing. If the input text is valid the parsing result will be a JSON serialized instance of the Template Mode:

Sample template.tem:

```
    1.1 Kiraya Veren Şirket, Şahıs, Kurum [{lessorName}]
    1.2 Adresi [{lessorAddress}]
    1.3 Telefon [{lessorPhone}]

    1.4 Kiralayanın Adı Soyadı [{lesseeName}]
    1.5 Adresi [{lesseeAddress}]
    1.6 Telefon [{lesseePhone}]

    2.1 Plaka No [{plateID}]
    2.2 Marka [{carBrand}]
    2.3 Model [{model}]
    2.4 Trafiğe Çıkış Yılı [{modelYear}]
    2.5 Renk [{color}]
    2.6 Şase No [{vechileID}]

    3.1 [{#paymentClause}][{amountText}] ([{amount}]) [{paymentProcedure}].[{/paymentClause}]
    3.2 Kiralama Başlangıç Tarihi [{startDate}]
    3.3 Kiralama Bitiş Tarihi [{endDate}]
    3.4 Teslimat Noktası [{deliveryStation}]

    1. SÖZLEŞMENİN KONUSU [{plateID}] Plaka numaralı [{carBrand}] marka otomobilin KİRALAYAN'a kiraya verilmesi.

    İş bu sözleşmeden doğacak herhangi bir anlaşmazlık durumunda [{authorizedCourt}] mahkemelerinin yetkili olduğunu taraflar kabul etmişlerdir.
```

Sample.txt:

```
1. TARAFLAR

    1.1 Kiraya Veren Şirket, Şahıs, Kurum "Acme Car Rental"
    1.2 Adresi "Dikmen Caddesi No:48/15 Dikmen Ankara"
    1.3 Telefon "+901231231234"

    1.4 Kiralayanın Adı Soyadı "Can Doğan"
    1.5 Adresi "John F. Kennedy Sokak No:23/12 Kavaklıdere Ankara"
    1.6 Telefon "+901234567890"

    2.1 Plaka No "06 MX 7817"
    2.2 Marka "Volkswagen"
    2.3 Model "Golf 1.6 TDI Comfortline"
    2.4 Trafiğe Çıkış Yılı "2017"
    2.5 Renk "Kırmızı"
    2.6 Şase No "WVWZZZ3CZXW000001"

    3.1 "İki Yüz On Yedi Amerikan Doları" (217.99 USD) "bank transfer".
    3.2 Kiralama Başlangıç Tarihi "13.07.2018"
    3.3 Kiralama Bitiş Tarihi "17.07.2018"
    3.4 Teslimat Noktası "Acme Car Rental Merkez Ofis"

    1. SÖZLEŞMENİN KONUSU "PlakaNo" Plaka numaralı "marka" marka otomobilin KİRALAYAN'a kiraya verilmesi.

    İş bu sözleşmeden doğacak herhangi bir anlaşmazlık durumunda "Ankara" mahkemelerinin yetkili olduğunu taraflar kabul etmişlerdir.
```

```
cicero parse --template ./car-rental-tr/ --dsl ./car-rental-tr/sample.txt
Setting clause data: {"$class": "org.accordtr.carrental.PaymentRequest"}
```

### Execute
Use the `cicero execute` command to load a template from a directory on disk, instantiate a clause based on input text, and then invoke the clause using an incoming JSON payload.

```
data.json:
{
   "$class": "org.accordtr.carrental.PaymentRequest",
}
```

```
cicero execute --template ./car-rental-tr/ --dsl ./car-rental-tr/sample.txt --data ./car-rental-tr/data.json 
```

The results of execution (a JSON serialized object) are displayed. They include:
* Details of the clause executed (name, version, SHA256 hash of clause data)
* The incoming request object
* The output response object

```
{
  "clause": "car-rental-tr@0.0.0-f1e436961c6c450c1d0cc21bb89446f78c45d0789ef3dfbe0c0b94ae4ee02cfd",
  "request": {
    "$class": "org.accordtr.carrental.PaymentRequest"
  },
  "response": {
    "$class": "org.accordtr.carrental.PayOut",
    "amount": {
      "$class": "org.accordproject.money.MonetaryAmount",
      "doubleValue": 217,
      "currencyCode": "USD"
    },
    "transactionId": "d1385e00-e0f1-4a3b-8d15-5e26c04dc888",
    "timestamp": "2018-07-31T07:45:32.890Z"
  },
  "state": {
    "$class": "org.accordproject.cicero.contract.AccordContractState",
    "stateId": "org.accordproject.cicero.contract.AccordContractState#1"
  },
  "emit": []
}
```
