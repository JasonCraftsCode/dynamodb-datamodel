import { Fields, Model, Table } from 'dynamodb-datamodel';
import { table } from './Table';

// (TypeScript) Define model key and item interface.
interface ModelKey {
  id: string;
}

// Define the schema using Fields
const model = Model.createModel<ModelKey>({
  schema: {
    id: Fields.split({ aliases: ['P', 'S'] }),
  },
  table: table as Table,
});

// Generate params to pass to DocumentClient or call the action method
const params = model.getParams({ id: 'P-1.S-1' });

// (jest) output of getParams
expect(params).toEqual({ Key: { P: 'P-1', S: 'S-1' }, TableName: 'ExampleTable' });
