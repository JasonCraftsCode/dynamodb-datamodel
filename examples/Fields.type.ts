import { Fields, Model, Table, Update } from 'dynamodb-datamodel';
import { table } from './Table';

// (TypeScript) Define model key and item interface.
interface ModelKey {
  id: string;
}
interface ModelItem extends ModelKey {
  typename?: Update.String;
}

// Define the schema using Fields
const model = Model.createModel<ModelKey, ModelItem>({
  name: 'ExampleModel',
  schema: {
    id: Fields.split({ aliases: ['P', 'S'] }),
    typename: Fields.type({ alias: 'T' }),
  },
  table: table as Table,
});

// Generate params to pass to DocumentClient or call the action method
const params = model.putParams({ id: 'P-1.S-1' });

// (jest) output of putParams
expect(params).toEqual({ Item: { P: 'P-1', S: 'S-1', T: 'ExampleModel' }, TableName: 'ExampleTable' });
