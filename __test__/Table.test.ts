/* eslint-disable @typescript-eslint/unbound-method */
import { AWSError, Request } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { Table, Index } from '../src/Table';
import { validateTable } from '../src/TableValidate';
import { delay } from './testCommon';

const client = new DocumentClient({ convertEmptyValues: true });
const request = {
  promise() {
    return delay(1, { Attributes: {} });
  },
} as Request<DocumentClient.GetItemOutput, AWSError>;

it('Validate Table exports', () => {
  expect(typeof Table.createTable).toBe('function');
  expect(typeof Index.createIndex).toBe('function');
  expect(typeof validateTable).toBe('function');
});

describe('Validate Simple Table', () => {
  interface SimpleTableKey {
    P: Table.PrimaryKey.PartitionString;
    S?: Table.PrimaryKey.SortString;
  }

  const clientFn = jest.fn(() => {
    return client;
  });

  const testTable = Table.createTable<SimpleTableKey, SimpleTableKey>({
    name: 'TestTable',
    keyAttributes: {
      P: Table.PrimaryKey.StringType,
      S: Table.PrimaryKey.StringType,
    },
    keySchema: {
      P: Table.PrimaryKey.PartitionKeyType,
      S: Table.PrimaryKey.SortKeyType,
    },
    client: clientFn,
  });

  it('getPutAction returns correct action', () => {
    expect(Table.getPutAction('Always')).toEqual('put');
    expect(Table.getPutAction('Exists')).toEqual('put-replace');
    expect(Table.getPutAction('NotExists')).toEqual('put-new');
  });

  it('on demand create client to be call only when needed', () => {
    expect(clientFn).not.toBeCalled();
    expect(testTable.client).toEqual(client);
    expect(clientFn).toBeCalledTimes(1);
  });

  it('validateTable', () => {
    expect(() => validateTable(testTable)).not.toThrow();
  });

  it('queryParams with P', () => {
    const params = testTable.queryParams({ P: 'abc' });
    expect(params).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 'abc' },
      KeyConditionExpression: '#n0 = :v0',
      TableName: 'TestTable',
    });
  });

  it('queryParams with P and S', () => {
    const params = testTable.queryParams({ P: 'abc', S: 'def' });
    expect(params).toEqual({
      ExpressionAttributeNames: {
        '#n0': 'P',
        '#n1': 'S',
      },
      ExpressionAttributeValues: {
        ':v0': 'abc',
        ':v1': 'def',
      },
      KeyConditionExpression: '#n0 = :v0 AND #n1 = :v1',
      TableName: 'TestTable',
    });
  });

  it('query', async () => {
    client.query = jest.fn(() => request);
    const results = await testTable.query({ P: 'xyz' });
    expect(results).toEqual({ Attributes: {} });
    expect(client.query).toBeCalledWith({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 'xyz' },
      KeyConditionExpression: '#n0 = :v0',
      TableName: 'TestTable',
    });
    expect(client.query).toBeCalledTimes(1);
  });

  it('scanParams', () => {
    const params = testTable.scanParams();
    expect(params).toEqual({
      TableName: 'TestTable',
    });
  });

  it('scan', async () => {
    client.scan = jest.fn(() => request);
    const results = await testTable.scan();
    expect(results).toEqual({ Attributes: {} });
    expect(client.scan).toBeCalledWith({
      TableName: 'TestTable',
    });
    expect(client.scan).toBeCalledTimes(1);
  });

  describe('When Model.create*Set', () => {
    it('expect createBinarySet type to be Binary', () => {
      const set = testTable.createBinarySet([Buffer.from('abc'), Buffer.from('xyz')]);
      expect(set.type).toEqual('Binary');
    });

    it('expect createBinarySet with validate type to be Binary', () => {
      const set = testTable.createBinarySet([Buffer.from('abc'), Buffer.from('xyz')], { validate: true });
      expect(set.type).toEqual('Binary');
    });

    it('expect createStringSet type to be String', () => {
      const set = testTable.createStringSet(['abc', 'xyz']);
      expect(set.type).toEqual('String');
    });

    it('expect createStringSet with validate type to be String', () => {
      const set = testTable.createStringSet(['abc', 'xyz'], { validate: true });
      expect(set.type).toEqual('String');
    });

    it('expect createNumberSet type to be Number', () => {
      const set = testTable.createNumberSet([4, 9]);
      expect(set.type).toEqual('Number');
    });

    it('expect createNumberSet with validate type to be Number', () => {
      const set = testTable.createNumberSet([4, 9], { validate: true });
      expect(set.type).toEqual('Number');
    });
  });
});

describe('Validate Table with indexes', () => {
  interface TestTableKey {
    P: Table.PrimaryKey.PartitionString;
    S?: Table.PrimaryKey.SortString;
  }

  interface GSI0Key {
    G0P: Table.PrimaryKey.PartitionString;
    G0S?: Table.PrimaryKey.SortString;
  }

  interface LSI0Key {
    P: Table.PrimaryKey.PartitionString;
    L0S?: Table.PrimaryKey.SortNumber;
  }

  interface TestTableAttributes extends TestTableKey, GSI0Key, LSI0Key {}

  const gsi0 = Index.createIndex<GSI0Key>({
    name: 'GSI0',
    keySchema: {
      G0P: Table.PrimaryKey.PartitionKeyType,
      G0S: Table.PrimaryKey.SortKeyType,
    },
    projection: {
      type: 'ALL',
    },
  });

  const lsi0 = Index.createIndex<LSI0Key>({
    name: 'LSI0',
    keySchema: {
      P: Table.PrimaryKey.PartitionKeyType,
      L0S: Table.PrimaryKey.SortKeyType,
    },
    projection: {
      attributes: ['project', 'some', 'attributes'],
      type: 'INCLUDE',
    },
  });

  const testTable = Table.createTable<TestTableKey, TestTableAttributes>({
    name: 'TestTable',
    keyAttributes: {
      P: Table.PrimaryKey.StringType,
      S: Table.PrimaryKey.StringType,
      G0P: Table.PrimaryKey.StringType,
      G0S: Table.PrimaryKey.StringType,
      L0S: Table.PrimaryKey.NumberType,
    },
    keySchema: {
      P: Table.PrimaryKey.PartitionKeyType,
      S: Table.PrimaryKey.SortKeyType,
    },
    globalIndexes: [gsi0] as Index[],
    localIndexes: [lsi0] as Index[],
    client,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Table with Index', () => {
    expect(() => validateTable(testTable)).not.toThrow();
  });

  it('Index.getPartitionKey', () => {
    expect(gsi0.getPartitionKey()).toEqual('G0P');
  });

  it('Index.getSortKey', () => {
    expect(gsi0.getSortKey()).toEqual('G0S');
  });

  it('Table.getPartitionKey', () => {
    expect(testTable.getPartitionKey()).toEqual('P');
  });

  it('Table.getSortKey', () => {
    expect(testTable.getSortKey()).toEqual('S');
  });

  it('Table.getSortKey empty when does not exist', () => {
    interface HashOnlyTableKey {
      P: Table.PrimaryKey.PartitionString;
    }
    const hashTable = Table.createTable<HashOnlyTableKey, HashOnlyTableKey>({
      name: 'hashTable',
      keyAttributes: { P: { type: 'S' } },
      keySchema: { P: { keyType: 'HASH' } },
      client,
    });
    expect(hashTable.getSortKey()).toEqual('');
  });

  it('Table.onError', () => {
    expect(() => testTable.onError('Error message')).toThrow();
  });

  it('getParams', () => {
    const params = testTable.getParams({ P: 'pk', S: 'sk' });
    expect(params).toEqual({
      Key: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
  });

  it('getParams with options', () => {
    const params = testTable.getParams({ P: 'pk', S: 'sk' }, { params: { ReturnConsumedCapacity: 'TOTAL' } });
    expect(params).toEqual({
      Key: { P: 'pk', S: 'sk' },
      ReturnConsumedCapacity: 'TOTAL',
      TableName: 'TestTable',
    });
  });

  it('deleteParams', () => {
    const params = testTable.deleteParams({ P: 'pk', S: 'sk' });
    expect(params).toEqual({
      Key: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
  });

  it('deleteParams with options', () => {
    const params = testTable.deleteParams({ P: 'pk', S: 'sk' }, { params: { ReturnConsumedCapacity: 'TOTAL' } });
    expect(params).toEqual({
      Key: { P: 'pk', S: 'sk' },
      ReturnConsumedCapacity: 'TOTAL',
      TableName: 'TestTable',
    });
  });

  it('putParams', () => {
    const params = testTable.putParams({ P: 'pk', S: 'sk' }, undefined, {
      writeOptions: 'Always',
    });
    expect(params).toEqual({
      Item: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
  });

  it('putParams for exists', () => {
    const params = testTable.putParams({ P: 'pk', S: 'sk' }, undefined, {
      writeOptions: 'Exists',
    });
    expect(params).toEqual({
      ConditionExpression: 'attribute_exists(#n0)',
      ExpressionAttributeNames: { '#n0': 'P' },
      Item: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
  });

  it('putParams for not exists', () => {
    const params = testTable.putParams({ P: 'pk', S: 'sk' }, undefined, {
      writeOptions: 'NotExists',
    });
    expect(params).toEqual({
      ConditionExpression: 'attribute_not_exists(#n0)',
      ExpressionAttributeNames: { '#n0': 'P' },
      Item: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
  });

  it('updateParams', () => {
    const params = testTable.updateParams({ P: 'pk', S: 'sk' }, undefined, {
      params: { ReturnConsumedCapacity: 'TOTAL' },
    });
    expect(params).toEqual({
      Key: { P: 'pk', S: 'sk' },
      ReturnConsumedCapacity: 'TOTAL',
      TableName: 'TestTable',
    });
  });

  it('updateParams with options', () => {
    const params = testTable.updateParams({ P: 'pk', S: 'sk' });
    expect(params).toEqual({
      Key: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
  });

  it('get', async () => {
    client.get = jest.fn(() => request);
    const results = await testTable.get({ P: 'pk', S: 'sk' });
    expect(results).toEqual({ Attributes: {} });
    expect(client.get).toBeCalledWith({
      Key: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
    expect(client.get).toBeCalledTimes(1);
  });

  it('delete', async () => {
    client.delete = jest.fn(() => request);
    const results = await testTable.delete({ P: 'pk', S: 'sk' });
    expect(results).toEqual({ Attributes: {} });
    expect(client.delete).toBeCalledWith({
      Key: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
    expect(client.delete).toBeCalledTimes(1);
  });

  it('put just key', async () => {
    client.put = jest.fn(() => request);
    const results = await testTable.put({ P: 'pk', S: 'sk' });
    expect(results).toEqual({ Attributes: {} });
    expect(client.put).toBeCalledWith({
      Item: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
    expect(client.put).toBeCalledTimes(1);
  });

  it('put exists just key', async () => {
    client.put = jest.fn(() => request);
    const results = await testTable.put({ P: 'pk', S: 'sk' }, undefined, {
      writeOptions: 'Exists',
    });
    expect(results).toEqual({ Attributes: {} });
    expect(client.put).toBeCalledWith({
      ConditionExpression: 'attribute_exists(#n0)',
      ExpressionAttributeNames: { '#n0': 'P' },
      Item: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
    expect(client.put).toBeCalledTimes(1);
  });

  it('put not exists just key', async () => {
    client.put = jest.fn(() => request);
    const results = await testTable.put({ P: 'pk', S: 'sk' }, undefined, {
      writeOptions: 'NotExists',
    });
    expect(results).toEqual({ Attributes: {} });
    expect(client.put).toBeCalledWith({
      ConditionExpression: 'attribute_not_exists(#n0)',
      ExpressionAttributeNames: { '#n0': 'P' },
      Item: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
    expect(client.put).toBeCalledTimes(1);
  });

  it('put with item', async () => {
    client.put = jest.fn(() => request);
    const results = await testTable.put({ P: 'pk', S: 'sk' }, { string: 'string', number: 8, bool: true });
    expect(results).toEqual({ Attributes: {} });
    expect(client.put).toBeCalledWith({
      Item: { P: 'pk', S: 'sk', bool: true, number: 8, string: 'string' },
      TableName: 'TestTable',
    });
    expect(client.put).toBeCalledTimes(1);
  });

  it('update just key', async () => {
    client.update = jest.fn(() => request);
    const results = await testTable.update({ P: 'pk', S: 'sk' });
    expect(results).toEqual({ Attributes: {} });
    expect(client.update).toBeCalledWith({
      Key: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
    });
    expect(client.update).toBeCalledTimes(1);
  });

  it('update with item', async () => {
    client.update = jest.fn(() => request);
    const results = await testTable.update({ P: 'pk', S: 'sk' }, { string: 'string', number: 18, bool: true });
    expect(results).toEqual({ Attributes: {} });
    expect(client.update).toBeCalledWith({
      ExpressionAttributeNames: {
        '#n0': 'string',
        '#n1': 'number',
        '#n2': 'bool',
      },
      ExpressionAttributeValues: {
        ':v0': 'string',
        ':v1': 18,
        ':v2': true,
      },
      Key: { P: 'pk', S: 'sk' },
      TableName: 'TestTable',
      UpdateExpression: 'SET #n0 = :v0, #n1 = :v1, #n2 = :v2',
    });
    expect(client.update).toBeCalledTimes(1);
  });

  it('gsi queryParams with P', () => {
    const params = gsi0.queryParams({ G0P: 'mno' });
    expect(params).toEqual({
      ExpressionAttributeNames: { '#n0': 'G0P' },
      ExpressionAttributeValues: { ':v0': 'mno' },
      IndexName: 'GSI0',
      KeyConditionExpression: '#n0 = :v0',
      TableName: 'TestTable',
    });
  });

  it('gsi queryParams with G0P and G0S', () => {
    const params = gsi0.queryParams({ G0P: 'mno', G0S: '123' });
    expect(params).toEqual({
      ExpressionAttributeNames: { '#n0': 'G0P', '#n1': 'G0S' },
      ExpressionAttributeValues: { ':v0': 'mno', ':v1': '123' },
      IndexName: 'GSI0',
      KeyConditionExpression: '#n0 = :v0 AND #n1 = :v1',
      TableName: 'TestTable',
    });
  });

  it('gsi query', async () => {
    client.query = jest.fn(() => request);
    const results = await gsi0.query({ G0P: 'zyx', G0S: '321' });
    expect(results).toEqual({ Attributes: {} });
    expect(client.query).toBeCalledWith({
      ExpressionAttributeNames: { '#n0': 'G0P', '#n1': 'G0S' },
      ExpressionAttributeValues: { ':v0': 'zyx', ':v1': '321' },
      IndexName: 'GSI0',
      KeyConditionExpression: '#n0 = :v0 AND #n1 = :v1',
      TableName: 'TestTable',
    });
    expect(client.query).toBeCalledTimes(1);
  });

  it('gsi scanParams', () => {
    const params = gsi0.scanParams();
    expect(params).toEqual({
      IndexName: 'GSI0',
      TableName: 'TestTable',
    });
  });

  it('gsi scan', async () => {
    client.scan = jest.fn(() => request);
    const results = await gsi0.scan();
    expect(results).toEqual({ Attributes: {} });
    expect(client.scan).toBeCalledWith({
      IndexName: 'GSI0',
      TableName: 'TestTable',
    });
    expect(client.scan).toBeCalledTimes(1);
  });
});
