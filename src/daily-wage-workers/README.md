# Daily Wage Workers Payment

A contract template for calculating payment owed to daily wage workers, including support for overtime hours at a higher rate.

## Features

- Calculates base pay from days worked × daily rate
- Calculates overtime pay from hours × overtime rate
- Returns total payment amount with currency

## Usage

The contract requires:
- **Employer**: The hiring party
- **Worker**: The worker receiving payment
- **Daily Rate**: Payment per day (e.g., 150.00 USD)
- **Overtime Rate**: Payment per overtime hour (e.g., 25.00 USD)

## Example

For a worker with:
- Daily rate: 150.00 USD
- Overtime rate: 25.00 USD
- Days worked: 5
- Overtime hours: 4

Total payment = (5 × 150) + (4 × 25) = **850.00 USD**

