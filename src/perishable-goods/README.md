# Perishable Goods 

This clause specifies penalties if the transport conditions (temperature and humidity) for a package are breached.

## Stateful execution

The contract keeps the sensor history in its state, so readings can be sent while the shipment is in transit:

1. **`SensorReadingsReceived`** (`shipmentId`, `sensorReadings[]`). Send it as often as needed, with one reading or a small batch. The minimum/maximum temperature and humidity recorded so far are stored in `PerishableGoodsState`, and the response (`SensorReadingsRecorded`) returns them. Readings received after `dueDate` are still recorded, and a `LateShipmentNotification` event is emitted.
2. **`ShipmentReceived`** (`shipmentId`, `unitCount`, optional `sensorReadings[]`). Any readings included are combined with those already in state. The penalty is calculated from the recorded min/max values, a `PerishableGoodsPaymentEvent` obligation is emitted, and the contract status becomes `COMPLETED`. A shipment received after `dueDate` is priced at 0 and also completes the contract.

Once the contract is `COMPLETED`, further requests are rejected. Sending all readings in a single `ShipmentReceived` (as in `request.json`) still works and gives the same result as sending them one by one.
