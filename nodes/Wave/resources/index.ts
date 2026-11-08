import { accountResource } from './account';
import { businessResource } from './business';
import { productResource } from './product';
import { referenceDataResource } from './referenceData';
import { salesTaxResource } from './salesTax';
import type { ResourceModule } from './types';
import { userResource } from './user';

// Keep this list in alphabetical order of the option name. Reference Data is last on purpose.
export const resources: ResourceModule[] = [
	accountResource,
	businessResource,
	productResource,
	salesTaxResource,
	userResource,
	referenceDataResource,
];
