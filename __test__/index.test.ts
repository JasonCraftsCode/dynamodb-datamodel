import { Table, Model } from '../src/index';

it('Validate ', () => {
  expect(typeof Table).toBe('function');
  expect(typeof Model).toBe('function');
});
