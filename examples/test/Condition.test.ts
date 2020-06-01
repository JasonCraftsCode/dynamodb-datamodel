/* eslint-disable @typescript-eslint/no-require-imports, jest/expect-expect */
import { Condition, Table } from 'dynamodb-datamodel';

it('Condition', () => {
  require('../Condition');
});

// Validate each example for Condition functions
it('Condition.path', () => {
  const condition = Condition.eq('name', Condition.path('nickname'));

  // Table params generate for condition
  expect(Table.addParams({}, { conditions: [condition] }, 'condition')).toEqual({
    ConditionExpression: '#n0 = #n1',
    ExpressionAttributeNames: { '#n0': 'name', '#n1': 'nickname' },
  });
});

it('Condition.size', () => {
  const condition = Condition.eq(Condition.size('name'), 4);

  // Table params generate for condition
  expect(Table.addParams({}, { conditions: [condition] }, 'condition')).toEqual({
    ConditionExpression: 'size(#n0) = :v0',
    ExpressionAttributeNames: { '#n0': 'name' },
    ExpressionAttributeValues: { ':v0': 4 },
  });
});
