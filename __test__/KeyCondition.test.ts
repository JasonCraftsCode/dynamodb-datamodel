import { SortKey, KeyConditionExpression, buildKeyConditionInput } from '../src/KeyCondition';

it('Validate Condition exports', () => {
  expect(typeof SortKey).toEqual('function');
  expect(typeof KeyConditionExpression).toEqual('function');
  expect(typeof buildKeyConditionInput).toEqual('function');
});

describe('Validate SortKey', () => {
  it('eq', () => {
    //const cond = SortKey.eq('string');
    //expect(cond).toEqual('');
  });
});
