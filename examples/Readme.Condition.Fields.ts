import { Condition, Fields, Model, Table } from 'dynamodb-datamodel';
import { table } from './Table';

const schema = {
  age: Fields.number(),
  region: Fields.string(),
  interests: Fields.string(),
};

// Assigning the schema to a model will initialize the schema fields to use below.
new Model({ name: 'TestModel', schema, table: table as Table });

// Destructuring schema and Condition to make it easier to write filter expression.
const { age, region, interests } = schema;
const { and, or, gt } = Condition;

const filter = or(
  age.gt(21),
  and(
    region.eq('US'),
    gt(interests.size(), 10),
    or(interests.contains('nodejs'), interests.contains('dynamodb'), interests.contains('serverless')),
  ),
);

// build and validate expression
const params = Table.addParams({}, { conditions: [filter] }, 'filter');
expect(params.FilterExpression).toEqual(
  '(#n0 > :v0 OR (#n1 = :v1 AND size(#n2) > :v2 AND (contains(#n2, :v3) OR contains(#n2, :v4) OR contains(#n2, :v5))))',
);
