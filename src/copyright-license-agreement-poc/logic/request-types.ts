// The model's request types as runtime values, for registering handlers
// and creating requests (runtime/logic.ts's `requestType`). Template-engine
// would generate these from the model alongside logic/generated/; they're
// written by hand here, and test/types.test.ts checks them against the
// model. The late payment clause's are included because this licence's
// models include that clause's, as its generated types do.
import { requestType } from '../runtime/logic';
import { IPaymentRequest, IPaymentReceived } from './generated/poc.accordproject.copyrightlicense@0.1.0';
import { IPaymentOverdue, IPaymentSettled } from './generated/poc.accordproject.latepayment@0.1.0';

export const PaymentRequest = requestType<IPaymentRequest>()('poc.accordproject.copyrightlicense@0.1.0.PaymentRequest');
export const PaymentReceived = requestType<IPaymentReceived>()('poc.accordproject.copyrightlicense@0.1.0.PaymentReceived');
export const PaymentOverdue = requestType<IPaymentOverdue>()('poc.accordproject.latepayment@0.1.0.PaymentOverdue');
export const PaymentSettled = requestType<IPaymentSettled>()('poc.accordproject.latepayment@0.1.0.PaymentSettled');
