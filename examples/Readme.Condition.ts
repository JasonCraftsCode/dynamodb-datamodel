import { Condition, Table } from 'dynamodb-datamodel';

// Destructuring Condition to make it easier to write filter expression.
const { and, or, eq, gt, contains, size } = Condition;

const filter = or(
  gt('age', 21),
  and(
    eq('region', 'US'),
    gt(size('interests'), 10),
    or(contains('interests', 'nodejs'), contains('interests', 'dynamodb'), contains('interests', 'serverless')),
  ),
);

const params = Table.addParams({}, { conditions: [filter] }, 'filter');
expect(params.FilterExpression).toEqual(
  '(#n0 > :v0 OR (#n1 = :v1 AND size(#n2) > :v2 AND (contains(#n2, :v3) OR contains(#n2, :v4) OR contains(#n2, :v5))))',
);
