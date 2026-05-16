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

{{#optional consignee}}{{this}}{{/optional}}

### Notify Party

{{#optional notifyParty}}{{this}}{{/optional}}

Exporter References: {{#optional exportReferences}}{{this}}{{/optional}}  
Onward Instructions: {{#optional onwardInstructions}}{{this}}{{/optional}}

Vessel: {{vessel}}  
Voyage number: {{voyageNumber}}

Port of Loading: {{portOfLoading}}  
Port of Discharge: {{portOfDischarge}}

Place of Receipt: {{#optional placeOfReceipt}}{{this}}{{/optional}}  
Place of Delivery: {{#optional placeOfDelivery}}{{this}}{{/optional}}

### Freight

{{#olist commodities}}
Amount: {{quantity}} {{unitOfMass}} Package: {{packageType}} Description: {{description}}{{#optional nmfcCode}} NMFC: {{this}}{{/optional}}{{#optional freightClass}} Freight Class: {{this}}{{/optional}}{{#optional hazmat}} Hazardous: {{this}}{{/optional}}
{{/olist}}

### Declared value: {{declaredValue}}.
