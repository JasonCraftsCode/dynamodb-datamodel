import { validateKeySchema, validateTable } from '../src/TableValidate';

it('Validate ValidateTable exports', () => {
  expect(typeof validateKeySchema).toEqual('function');
  expect(typeof validateTable).toEqual('function');
});
