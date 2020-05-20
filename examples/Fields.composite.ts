import { Fields, Model, Table, Update } from 'dynamodb-datamodel';
import { table, gsi0 } from './Table';

// (TypeScript) Define model key and item interface.
interface ModelKey {
  id: string;
}
// street, city, state and country only support simple set updates since they are part of a composite key
interface ModelItem extends ModelKey {
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  region: Update.String;
}

// Create composite slots to use in model schema below.
const location = Fields.composite({ alias: gsi0.getSortKey(), count: 4, delimiter: ';' });
const locSlots = location.createSlots();

// Define the schema using Fields
const model = Model.createModel<ModelKey, ModelItem>({
  schema: {
    id: Fields.split({ aliases: ['P', 'S'] }),
    neighborhood: locSlots[3],
    city: locSlots[2],
    state: locSlots[1],
    country: locSlots[0],
    region: Fields.string({ alias: gsi0.getPartitionKey() }),
  },
  table: table as Table,
});

const params = model.putParams({
  id: 'p1.s2',
  neighborhood: 'Birdland',
  city: 'Cupertino',
  state: 'CA',
  country: 'USA',
  region: 'NorthAmerica',
});

// test: value to expect
expect(params).toEqual({
  Item: { G0P: 'NorthAmerica', G0S: 'USA;CA;Cupertino;Birdland', P: 'p1', S: 's2' },
  TableName: 'ExampleTable',
});
