import { Fields, Model, Table, Update } from 'dynamodb-datamodel';
import { table } from './Table';

// (TypeScript) Define model key and item interface.
export interface ModelKey {
  id: string;
}
// Use Update types so model.update will have some type safety.
export interface ModelItem extends ModelKey {
  name: Update.String;
  age?: Update.Number;
  children?: Update.List<{ name: string; age: number }>;
  sports?: Update.StringSet;
}

// Define the schema using Fields
export const model = Model.createModel<ModelKey, ModelItem>({
  schema: {
    id: Fields.split({ aliases: ['P', 'S'] }),
    name: Fields.string(),
    age: Fields.number(),
    children: Fields.list(),
    sports: Fields.stringSet(),
  },
  table: table as Table,
});

// Generate params to pass to DocumentClient or call the action method
const params = model.updateParams({ id: 'P-1.S-1', age: Update.inc(1) });

// (jest) output of updateParams
expect(params).toEqual({
  ExpressionAttributeNames: { '#n0': 'age' },
  ExpressionAttributeValues: { ':v0': 1 },
  Key: { P: 'P-1', S: 'S-1' },
  TableName: 'ExampleTable',
  UpdateExpression: 'SET #n0 = #n0 + :v0',
});
