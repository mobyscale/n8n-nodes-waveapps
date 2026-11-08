import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';

import { Wave } from '../../nodes/Wave/Wave.node';
import { parseVariables, unwrapFirstField } from '../../nodes/Wave/resources/customGraphql';

const node = {
	id: '1',
	name: 'Wave',
	type: 'n8n-nodes-waveapps.wave',
	typeVersion: 1,
	position: [0, 0] as [number, number],
	parameters: {},
};

function createContext(parameters: IDataObject = {}, response: unknown = {}) {
	const request = vi.fn().mockResolvedValue(response);
	const allParameters: IDataObject = {
		authentication: 'accessToken',
		resource: 'customGraphql',
		operation: 'execute',
		...parameters,
	};
	const context = {
		getInputData: () => [{ json: {} }],
		getNode: () => node,
		continueOnFail: () => false,
		getNodeParameter: (name: string, _itemIndex: number, fallback?: unknown) =>
			name in allParameters ? allParameters[name] : fallback,
		helpers: { httpRequestWithAuthentication: request },
	} as unknown as IExecuteFunctions;
	return { context, request };
}

describe('parseVariables', () => {
	const { context } = createContext();

	it('accepts a JSON string, an object or nothing', () => {
		expect(parseVariables.call(context, '{"id": "x"}', 0)).toEqual({ id: 'x' });
		expect(parseVariables.call(context, { id: 'y' }, 0)).toEqual({ id: 'y' });
		expect(parseVariables.call(context, '  ', 0)).toEqual({});
		expect(parseVariables.call(context, undefined, 0)).toEqual({});
	});

	it('fails on invalid JSON and on values that are not objects', () => {
		expect(() => parseVariables.call(context, '{id:', 0)).toThrow('valid JSON');
		expect(() => parseVariables.call(context, '[1]', 0)).toThrow('JSON object');
	});
});

describe('unwrapFirstField', () => {
	const { context } = createContext();

	it('returns the output of the first field', () => {
		const output = { didSucceed: true, inputErrors: [], customer: { id: 'c1' } };
		expect(unwrapFirstField.call(context, { customerCreate: output }, 0)).toEqual(output);
		expect(unwrapFirstField.call(context, { items: [{ a: 1 }] }, 0)).toEqual([{ a: 1 }]);
		expect(unwrapFirstField.call(context, { count: 3 }, 0)).toEqual({ count: 3 });
	});

	it('throws the input errors when didSucceed is false', () => {
		const data = {
			customerCreate: {
				didSucceed: false,
				inputErrors: [{ code: 'REQUIRED', message: 'Name is required', path: ['input', 'name'] }],
			},
		};
		expect(() => unwrapFirstField.call(context, data, 0)).toThrow(NodeApiError);
		expect(() => unwrapFirstField.call(context, data, 0)).toThrow('Name is required');
	});
});

describe('execute', () => {
	it('sends the query and variables and returns data', async () => {
		const { context, request } = createContext(
			{ query: 'query($id: ID!) { business(id: $id) { id } }', variables: '{"id":"b1"}' },
			{ data: { business: { id: 'b1' } } },
		);
		const [output] = await new Wave().execute.call(context);
		expect(output).toEqual([{ json: { business: { id: 'b1' } }, pairedItem: { item: 0 } }]);
		expect(request.mock.calls[0][1].body).toEqual({
			query: 'query($id: ID!) { business(id: $id) { id } }',
			variables: { id: 'b1' },
		});
	});
});
