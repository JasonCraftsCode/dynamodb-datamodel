import { Update } from 'dynamodb-datamodel';
import { table } from './Table';

// update will: set name attribute to 'new name', delete nickName attribute and increment revision attribute by 2.
const params = table.updateParams(
  { P: 'P-1', S: 'S-1' },
  { name: 'new name', nickName: Update.del(), revision: Update.inc(2) },
);

// (jest) output of updateParams
expect(params).toEqual({
  ExpressionAttributeNames: { '#n0': 'name', '#n1': 'nickName', '#n2': 'revision' },
  ExpressionAttributeValues: { ':v0': 'new name', ':v1': 2 },
  Key: { P: 'P-1', S: 'S-1' },
  ReturnValues: 'ALL_NEW',
  TableName: 'ExampleTable',
  UpdateExpression: 'SET #n0 = :v0, #n2 = #n2 + :v1 REMOVE #n1',
});
