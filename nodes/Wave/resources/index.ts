import { businessResource } from './business';
import { invoiceResource } from './invoice';
import { invoicePaymentResource } from './invoicePayment';
import { referenceDataResource } from './referenceData';
import type { ResourceModule } from './types';
import { userResource } from './user';

// Keep this list in alphabetical order of the option name. Reference Data is last on purpose.
export const resources: ResourceModule[] = [
	businessResource,
	invoiceResource,
	invoicePaymentResource,
	userResource,
	referenceDataResource,
];
