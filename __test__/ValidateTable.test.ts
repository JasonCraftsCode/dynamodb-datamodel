import { validateKeySchema, validateTable } from '../src/ValidateTable';

it('Validate ValidateTable exports', () => {
  expect(typeof validateKeySchema).toEqual('function');
  expect(typeof validateTable).toEqual('function');
});
