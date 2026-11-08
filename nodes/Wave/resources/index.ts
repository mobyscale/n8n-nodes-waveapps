import { accountResource } from './account';
import { businessResource } from './business';
import { customerResource } from './customer';
import { customGraphqlResource } from './customGraphql';
import { estimateResource } from './estimate';
import { estimateDepositResource } from './estimateDeposit';
import { productResource } from './product';
import { referenceDataResource } from './referenceData';
import { salesTaxResource } from './salesTax';
import { transactionResource } from './transaction';
import type { ResourceModule } from './types';
import { userResource } from './user';
import { vendorResource } from './vendor';

// Keep this list in alphabetical order of the option name. Reference Data is last on purpose.
export const resources: ResourceModule[] = [
	accountResource,
	businessResource,
	customGraphqlResource,
	customerResource,
	estimateResource,
	estimateDepositResource,
	productResource,
	salesTaxResource,
	transactionResource,
	userResource,
	vendorResource,
	referenceDataResource,
];
