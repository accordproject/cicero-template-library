# Acceptance of Delivery

This template allows the receiver of goods to inspect them within a specified time period after delivery.

## What the Contract Does

This contract evaluates an `InspectDeliverable` request object for delivered goods to determine if they meet the required standards within an agreed-upon timeframe. It enforces a maximum inspection period and returns the final inspection status.

## Contract Parameters

The template defines the following contract parameters:

- `shipper`: The organization responsible for delivering the goods.
- `receiver`: The organization receiving the goods.
- `deliverable`: A description of the goods being delivered.
- `businessDays`: The number of days allowed for inspection after delivery.
- `attachment`: Additional information or supporting documents.

## Inputs

The contract is triggered by an `InspectDeliverable` transaction, which includes:

- `deliverableReceivedAt` (DateTime): The date and time when the goods were received.
- `inspectionPassed` (Boolean): Indicates whether the goods passed inspection.

## Execution Logic

When the contract receives an `InspectDeliverable` transaction, it performs the following:

1. **Time Validation**  
   Ensures the transaction timestamp is not before `deliverableReceivedAt`.

2. **Inspection Deadline Calculation**  
   Computes the inspection deadline by adding `businessDays` to `deliverableReceivedAt`.

3. **Status Evaluation**  
   - If the current time exceeds the deadline → `OUTSIDE_INSPECTION_PERIOD`
   - If within deadline and inspection passes → `PASSED_TESTING`
   - If within deadline and inspection fails → `FAILED_TESTING`

## Output

The contract produces an `InspectionResponse` containing:

- `status`:  
  - `PASSED_TESTING` → Goods accepted  
  - `FAILED_TESTING` → Goods rejected  
  - `OUTSIDE_INSPECTION_PERIOD` → Inspection submitted too late  

- `shipper`: The delivering organization  
- `receiver`: The receiving organization  

## How It Fits in the Accord Project Architecture

- **The contract text** is defined using CiceroMark
- **The data model** is defined using Concerto (this file)
- **The execution logic** is implemented in Ergo

Together, these components enable executable legal contracts.
