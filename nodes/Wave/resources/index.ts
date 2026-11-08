import { businessResource } from './business';
import { customerResource } from './customer';
import { referenceDataResource } from './referenceData';
import type { ResourceModule } from './types';
import { userResource } from './user';
import { vendorResource } from './vendor';

// Keep this list in alphabetical order of the option name. Reference Data is last on purpose.
export const resources: ResourceModule[] = [
	businessResource,
	customerResource,
	userResource,
	vendorResource,
	referenceDataResource,
];
