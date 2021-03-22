# {{accountName}}

## Bill of Lading for Ocean Transport or Multimodal Transport
### Non-negotiable unless consigned TO ORDER
## ORIGINAL

SCAC: {{scac}}

B/L Number: {{bolNumber}}

Booking Number: {{bookingNumber}}

### Shipper

{{shipper}}

### Consignee

{{consignee}}

### Notify Party

{{notifyParty}}

Exporter References: {{exportReferences}}  
Onward Instructions: {{onwardInstructions}}

Vessel: {{vessel}}  
Voyage number: {{voyageNumber}}

Port of Loading: {{portOfLoading}}  
Port of Discharge: {{portOfDischarge}}

Place of Receipt: {{placeOfReceipt}}  
Place of Delivery: {{placeOfDelivery}}

### Freight

{{#olist commodities}}
Amount: {{quantity}} {{unitOfMass}} Package: {{packageType}} Description: {{description}} NMFC: {{nmfcCode}} Freight Class: {{freightClass}} Hazardous: {{hazmat}}
{{/olist}}

### Declared value: {{declaredValue}}.
