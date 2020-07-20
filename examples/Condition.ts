import { Condition, Table } from 'dynamodb-datamodel';

// Destructuring methods from Condition to make writing expression more concise
const { eq, ne, and, path } = Condition;
const condition = and(eq('first', 'john'), eq('last', 'smith'), ne('first', path('nickname')));

// Table params generate for condition
expect(Table.addParams({}, { conditions: [condition] })).toEqual({
  ConditionExpression: '(#n0 = :v0 AND #n1 = :v1 AND #n0 <> #n2)',
  ExpressionAttributeNames: { '#n0': 'first', '#n1': 'last', '#n2': 'nickname' },
  ExpressionAttributeValues: { ':v0': 'john', ':v1': 'smith' },
});
