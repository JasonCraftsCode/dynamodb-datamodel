import { Condition, ConditionExpression } from 'dynamodb-datamodel';

const { and, or, eq, gt, contains, size } = Condition;
const filters = or(
  gt('age', 21),
  and(
    eq('region', 'US'),
    gt(size('interests'), 10),
    or(contains('interests', 'nodejs'), contains('interests', 'dynamodb'), contains('interests', 'serverless')),
  ),
);

const exp = Condition.resolveTopAnd([filters], new ConditionExpression());
expect(exp).toEqual(
  '(#n0 > :v0 OR (#n1 = :v1 AND size(#n2) > :v2 AND (contains(#n2, :v3) OR contains(#n2, :v4) OR contains(#n2, :v5))))',
);
