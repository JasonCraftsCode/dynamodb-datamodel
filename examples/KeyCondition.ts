import { KeyCondition } from 'dynamodb-datamodel';
import { table } from './Table';

// Use KeyCondition to query the table with primary key of 'P-GUID' and sort key between (and including) 'a' and 'z'
const key = {
  P: 'P-GUID',
  S: KeyCondition.between('a', 'z'),
};
const params = table.queryParams(key);

expect(params).toEqual({
  ExpressionAttributeNames: { '#n0': 'P', '#n1': 'S' },
  ExpressionAttributeValues: { ':v0': 'P-GUID', ':v1': 'a', ':v2': 'z' },
  KeyConditionExpression: '#n0 = :v0 AND #n1 BETWEEN :v1 AND :v2',
  TableName: 'ExampleTable',
});
