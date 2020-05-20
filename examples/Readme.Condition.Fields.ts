import { Condition, Fields, Model, Table, ConditionExpression } from 'dynamodb-datamodel';
import { table } from './Table';

const schema = {
  age: Fields.number(),
  region: Fields.string(),
  interests: Fields.string(),
};

// Assigning a schema to a model will initialize the schema fields with model property name
// which is needed for the field condition methods to work below.
new Model({
  name: 'TestModel',
  schema,
  table: table as Table,
});

const { age, region, interests } = schema;
const { and, or, gt } = Condition;
const filters = or(
  age.gt(21),
  and(
    region.eq('US'),
    gt(interests.size(), 10),
    or(interests.contains('nodejs'), interests.contains('dynamodb'), interests.contains('serverless')),
  ),
);

const exp = Condition.resolveTopAnd([filters], new ConditionExpression());
expect(exp).toEqual(
  '(#n0 > :v0 OR (#n1 = :v1 AND size(#n2) > :v2 AND (contains(#n2, :v3) OR contains(#n2, :v4) OR contains(#n2, :v5))))',
);
