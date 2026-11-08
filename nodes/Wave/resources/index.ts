import { businessResource } from './business';
import { referenceDataResource } from './referenceData';
import type { ResourceModule } from './types';
import { userResource } from './user';

// Keep this list in alphabetical order of the option name. Reference Data is last on purpose.
export const resources: ResourceModule[] = [businessResource, userResource, referenceDataResource];
