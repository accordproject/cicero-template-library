// The model's request types as runtime values, for registering handlers
// (runtime/logic.ts's `requestType`). Template-engine would generate these
// from the model alongside logic/generated/; they're written by hand here,
// and test/types.test.ts checks them against the model.
import { requestType } from '../../../runtime/logic';
import { IPaymentOverdue, IPaymentSettled } from './generated/poc.accordproject.latepayment@0.1.0';

export const PaymentOverdue = requestType<IPaymentOverdue>()('poc.accordproject.latepayment@0.1.0.PaymentOverdue');
export const PaymentSettled = requestType<IPaymentSettled>()('poc.accordproject.latepayment@0.1.0.PaymentSettled');
