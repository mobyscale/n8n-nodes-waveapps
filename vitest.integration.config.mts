import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { defineConfig } from 'vitest/config';

// Integration settings come from the uncommitted .env file (see .env.example).
// They are read here because the n8n lint rules do not allow process access in test files.
const envPath = resolve(import.meta.dirname, '.env');
if (existsSync(envPath)) loadEnvFile(envPath);

const integration = process.env.WAVE_ACCESS_TOKEN
	? {
			accessToken: process.env.WAVE_ACCESS_TOKEN,
			businessId: process.env.WAVE_BUSINESS_ID ?? '',
		}
	: null;

export default defineConfig({
	test: {
		include: ['test/integration/**/*.test.ts'],
		testTimeout: 120_000,
		hookTimeout: 300_000,
		fileParallelism: false,
		provide: { integration },
	},
});
