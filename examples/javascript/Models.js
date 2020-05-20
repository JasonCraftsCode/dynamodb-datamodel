const { Fields, Model } = require('dynamodb-datamodel');
const { table } = require('./Table');

// Define the schema using Fields
const model = new Model({
  schema: {
    id: Fields.split({ aliases: ['P', 'S'] }),
    name: Fields.string(),
    age: Fields.number(),
    children: Fields.list(),
    sports: Fields.stringSet(),
  },
  table,
});

const params = model.getParams({ id: 'P-1.S-1' });

expect(params).toEqual({ Key: { P: 'P-1', S: 'S-1' }, TableName: 'ExampleTable' });
