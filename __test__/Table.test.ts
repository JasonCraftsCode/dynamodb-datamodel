/* eslint-disable @typescript-eslint/unbound-method */
import { AWSError, Request } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { Condition } from '../src/Condition';
import { ExpressionAttributes } from '../src/ExpressionAttributes';
import { Table } from '../src/Table';
import { Index } from '../src/TableIndex';
import { Update } from '../src/Update';
import { validateTable } from '../src/TableValidate';
import { delay } from './testCommon';

const client = new DocumentClient({ convertEmptyValues: true });
const request = {
  promise() {
    return delay(1, { Attributes: {} });
  },
} as Request<DocumentClient.GetItemOutput, AWSError>;

const context = { data: true };

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

  it('queryParams with options', () => {
    const params = testTable.queryParams(
      { P: 'abc' },
      {
        filters: [Condition.eq('P', 'xyz')],
        context: context,
        attributes: () => new ExpressionAttributes(),
        itemAttributes: ['attrib1', 'attrib2'],
        params: {
          Limit: 5,
          ConsistentRead: true,
          ExclusiveStartKey: { P: 'abc' },
          Select: 'SPECIFIC_ATTRIBUTES',
          ScanIndexForward: true,
        },
      },
    );
    expect(params).toEqual({
      ConsistentRead: true,
      ExclusiveStartKey: { P: 'abc' },
      ExpressionAttributeNames: { '#n0': 'P', '#n1': 'attrib1', '#n2': 'attrib2' },
      ExpressionAttributeValues: { ':v0': 'xyz', ':v1': 'abc' },
      FilterExpression: '#n0 = :v0',
      KeyConditionExpression: '#n0 = :v1',
      Limit: 5,
      ProjectionExpression: 'attrib1, attrib2',
      ScanIndexForward: true,
      Select: 'SPECIFIC_ATTRIBUTES',
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

  it('scanParams with options', () => {
    const params = testTable.scanParams({
      attributes: () => new ExpressionAttributes(),
      context,
      filters: [Condition.beginsWith('attrib', 'abc')],
      itemAttributes: ['attrib1', 'attrib2'],
      params: {
        ConsistentRead: true,
        ExclusiveStartKey: { P: 'abc' },
        Limit: 10,
        Select: 'SPECIFIC_ATTRIBUTES',
        ReturnConsumedCapacity: 'INDEXES',
        Segment: 1,
        TotalSegments: 2,
      },
    });
    expect(params).toEqual({
      ConsistentRead: true,
      ExclusiveStartKey: { P: 'abc' },
      ExpressionAttributeNames: { '#n0': 'attrib', '#n1': 'attrib1', '#n2': 'attrib2' },
      ExpressionAttributeValues: { ':v0': 'abc' },
      FilterExpression: 'begins_with(#n0, :v0)',
      Limit: 10,
      ProjectionExpression: 'attrib1, attrib2',
      ReturnConsumedCapacity: 'INDEXES',
      Segment: 1,
      Select: 'SPECIFIC_ATTRIBUTES',
      TableName: 'TestTable',
      TotalSegments: 2,
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
    client,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Table with Index', () => {
    expect(() => validateTable(testTable)).not.toThrow();
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
    const params = testTable.getParams(
      { P: 'pk', S: 'sk' },
      {
        attributes: () => new ExpressionAttributes(),
        context,
        itemAttributes: ['attrib1', 'attrib2'],
        params: { ReturnConsumedCapacity: 'TOTAL' },
      },
    );
    expect(params).toEqual({
      ExpressionAttributeNames: { '#n0': 'attrib1', '#n1': 'attrib2' },
      Key: { P: 'pk', S: 'sk' },
      ProjectionExpression: 'attrib1, attrib2',
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
    const params = testTable.deleteParams(
      { P: 'pk', S: 'sk' },
      {
        attributes: () => new ExpressionAttributes(),
        conditions: [Condition.between('attrib', '1', '9')],
        context,
        params: { ReturnConsumedCapacity: 'TOTAL', ReturnValues: 'ALL_OLD', ReturnItemCollectionMetrics: 'SIZE' },
      },
    );
    expect(params).toEqual({
      ConditionExpression: '#n0 BETWEEN :v0 AND :v1',
      ExpressionAttributeNames: { '#n0': 'attrib' },
      ExpressionAttributeValues: { ':v0': '1', ':v1': '9' },
      Key: { P: 'pk', S: 'sk' },
      ReturnConsumedCapacity: 'TOTAL',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_OLD',
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

  it('putParams with options', () => {
    const params = testTable.putParams(
      { P: 'pk', S: 'sk' },
      { attrib: 'string' },
      {
        attributes: () => new ExpressionAttributes(),
        conditions: [Condition.lt('ver', 4)],
        context,
        params: { ReturnConsumedCapacity: 'TOTAL', ReturnItemCollectionMetrics: 'SIZE', ReturnValues: 'ALL_OLD' },
      },
    );
    expect(params).toEqual({
      ConditionExpression: '#n0 < :v0',
      ExpressionAttributeNames: { '#n0': 'ver' },
      ExpressionAttributeValues: { ':v0': 4 },
      Item: { P: 'pk', S: 'sk', attrib: 'string' },
      TableName: 'TestTable',
    });
  });

  it('updateParams', () => {
    const params = testTable.updateParams({ P: 'pk', S: 'sk' });
    expect(params).toEqual({
      Key: { P: 'pk', S: 'sk' },
      ReturnValues: 'ALL_NEW',
      TableName: 'TestTable',
    });
  });

  it('updateParams with options', () => {
    const params = testTable.updateParams(
      { P: 'pk', S: 'sk' },
      { attrib: 'test' },
      {
        attributes: () => new ExpressionAttributes(),
        conditions: [Condition.ge('ge', 6)],
        context,
        params: { ReturnValues: 'ALL_OLD', ReturnItemCollectionMetrics: 'SIZE', ReturnConsumedCapacity: 'TOTAL' },
      },
    );
    expect(params).toEqual({
      ConditionExpression: '#n0 >= :v0',
      ExpressionAttributeNames: { '#n0': 'ge', '#n1': 'attrib' },
      ExpressionAttributeValues: { ':v0': 6, ':v1': 'test' },
      Key: { P: 'pk', S: 'sk' },
      ReturnConsumedCapacity: 'TOTAL',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_OLD',
      TableName: 'TestTable',
      UpdateExpression: 'SET #n1 = :v1',
    });
  });
  it('setBatchGet', () => {
    const batchGet = new Table.BatchGet(testTable.client);
    batchGet.set = jest.fn();
    testTable.setBatchGet(batchGet, [{ P: 'pk1', S: 'sk1' }]);
    expect(batchGet.set).toBeCalledTimes(1);
    expect(batchGet.set).toBeCalledWith(testTable.name, [{ P: 'pk1', S: 'sk1' }], undefined);
  });

  it('setBatchWrite', () => {
    const batchWrite = new Table.BatchWrite(testTable.client);
    batchWrite.set = jest.fn();
    testTable.setBatchWrite(batchWrite);
    testTable.setBatchWrite(batchWrite, [{ key: { P: 'pk1', S: 'sk1' } }], [{ P: 'pk2', S: 'sk2' }]);
    expect(batchWrite.set).toBeCalledTimes(2);
    expect(batchWrite.set).toBeCalledWith(testTable.name, [{ key: { P: 'pk1', S: 'sk1' } }], [{ P: 'pk2', S: 'sk2' }]);
  });

  it('setTransactGet', () => {
    const transactGet = new Table.TransactGet(testTable.client);
    transactGet.set = jest.fn();
    testTable.setTransactGet(transactGet, [{ key: { P: 'pk1', S: 'sk1' } }]);
    expect(transactGet.set).toBeCalledTimes(1);
    expect(transactGet.set).toBeCalledWith(testTable.name, [{ key: { P: 'pk1', S: 'sk1' } }]);
  });

  it('setTransactWrite', () => {
    const transactWrite = new Table.TransactWrite(testTable.client);
    transactWrite.set = jest.fn();
    testTable.setTransactWrite(transactWrite, {});
    testTable.setTransactWrite(transactWrite, {
      check: [],
      delete: [{ key: { P: 'pk1', S: 'sk1' } }],
      put: [],
      update: [],
    });
    expect(transactWrite.set).toBeCalledTimes(2);
    expect(transactWrite.set).toBeCalledWith(testTable.name, {
      check: [],
      delete: [{ key: { P: 'pk1', S: 'sk1' } }],
      put: [],
      update: [],
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
      ReturnValues: 'ALL_NEW',
      TableName: 'TestTable',
    });
    expect(client.update).toBeCalledTimes(1);
  });

  it('update with item', async () => {
    client.update = jest.fn(() => request);
    const results = await testTable.update({ P: 'pk', S: 'sk' }, { string: 'string', number: 18, bool: true });
    expect(results).toEqual({ Attributes: {} });
    expect(client.update).toBeCalledWith({
      ExpressionAttributeNames: { '#n0': 'string', '#n1': 'number', '#n2': 'bool' },
      ExpressionAttributeValues: { ':v0': 'string', ':v1': 18, ':v2': true },
      Key: { P: 'pk', S: 'sk' },
      ReturnValues: 'ALL_NEW',
      TableName: 'TestTable',
      UpdateExpression: 'SET #n0 = :v0, #n1 = :v1, #n2 = :v2',
    });
    expect(client.update).toBeCalledTimes(1);
  });
});

function batchGetRequest(
  output: DocumentClient.BatchGetItemOutput,
): Request<DocumentClient.BatchGetItemOutput, AWSError> {
  return {
    promise() {
      return delay(1, output);
    },
  } as Request<DocumentClient.BatchGetItemOutput, AWSError>;
}

describe('Validate Batch Get', () => {
  it('set', () => {
    const batchGet = new Table.BatchGet(client);
    batchGet.set('testTable', [{ P: 'pk1', S: 'sk1' }]);
    expect(batchGet.getParams()).toEqual({
      RequestItems: { testTable: { Keys: [{ P: 'pk1', S: 'sk1' }] } },
    });
  });

  it('set with custom attributes and itemAttributes', () => {
    const batchGet = new Table.BatchGet(client, {
      attributes: () => new ExpressionAttributes(),
    });
    batchGet.set('testTable', [{ P: 'pk1', S: 'sk1' }], {
      itemAttributes: ['attrib1'],
      params: { ConsistentRead: true },
    });
    expect(batchGet.getParams()).toEqual({
      RequestItems: {
        testTable: {
          ConsistentRead: true,
          ExpressionAttributeNames: {
            '#n0': 'attrib1',
          },
          Keys: [{ P: 'pk1', S: 'sk1' }],
          ProjectionExpression: 'attrib1',
        },
      },
    });
  });

  it('addGet', () => {
    const batchGet = new Table.BatchGet(client);
    batchGet.addGet('testTable', { P: 'pk1', S: 'sk1' });
    batchGet.addGet('testTable', { P: 'pk2', S: 'sk2' });
    expect(batchGet.getParams()).toEqual({
      RequestItems: {
        testTable: {
          Keys: [
            { P: 'pk1', S: 'sk1' },
            { P: 'pk2', S: 'sk2' },
          ],
        },
      },
    });
  });

  it('options set', () => {
    const batchGet = new Table.BatchGet(client, {
      consumed: 'TOTAL',
    });
    batchGet.addGet('testTable', { P: 'pk1', S: 'sk1' });
    batchGet.setOptions('testTable', { itemAttributes: ['attrib1', 'attrib2'] });
    expect(batchGet.getParams()).toEqual({
      RequestItems: {
        testTable: {
          ExpressionAttributeNames: { '#n0': 'attrib1', '#n1': 'attrib2' },
          Keys: [{ P: 'pk1', S: 'sk1' }],
          ProjectionExpression: 'attrib1, attrib2',
        },
      },
      ReturnConsumedCapacity: 'TOTAL',
    });
  });

  it('execute', async () => {
    const item1 = { P: 'pk1', S: 'sk1', name: 'john' };
    const item2 = { P: 'pk2', S: 'sk2', name: 'bob' };
    const output = { Responses: { testTable: [item1, item2] } };
    client.batchGet = jest.fn(() => batchGetRequest(output));
    const batchGet = new Table.BatchGet(client);
    batchGet.set('testTable', [{ P: 'pk1', S: 'sk1' }]);
    expect(batchGet.getItem('testTable', { P: 'pk1', S: 'sk1' })).toEqual(undefined);
    const results = await batchGet.execute();
    expect(results).toEqual(output);
    expect(batchGet.getResult()).toEqual(output);
    expect(batchGet.getItem('testTable', { P: 'pk2', S: 'sk2' })).toEqual(item2);
    expect(batchGet.getItem('testTable2', { P: 'pk1', S: 'sk1' })).toEqual(undefined);
    expect(client.batchGet).toBeCalledWith({
      RequestItems: { testTable: { Keys: [{ P: 'pk1', S: 'sk1' }] } },
    });
    expect(client.batchGet).toBeCalledTimes(1);
  });
});

function batchWriteRequest(
  output: DocumentClient.BatchWriteItemOutput,
): Request<DocumentClient.BatchWriteItemOutput, AWSError> {
  return {
    promise() {
      return delay(1, output);
    },
  } as Request<DocumentClient.BatchWriteItemOutput, AWSError>;
}
describe('Validate Batch Write', () => {
  it('set getParams', () => {
    const batchWrite = new Table.BatchWrite(client);
    batchWrite.set(
      'testTable',
      [
        { key: { P: 'pk1', S: 'sk1' }, item: { attrib1: 'a1' } },
        { key: { P: 'pk2', S: 'sk2' }, item: { attrib2: 'a2' } },
      ],
      [{ P: 'pk1', S: 'sk2' }],
    );
    const params = batchWrite.getParams();
    expect(params).toEqual({
      RequestItems: {
        testTable: [
          { PutRequest: { Item: { P: 'pk1', S: 'sk1', attrib1: 'a1' } } },
          { PutRequest: { Item: { P: 'pk2', S: 'sk2', attrib2: 'a2' } } },
          { DeleteRequest: { Key: { P: 'pk1', S: 'sk2' } } },
        ],
      },
    });
  });

  it('set getParams with options', () => {
    const batchWrite = new Table.BatchWrite(client, { consumed: 'TOTAL', metrics: 'SIZE' });
    batchWrite.set('testTable', [{ key: { P: 'pk1', S: 'sk1' } }], [{ P: 'pk1', S: 'sk2' }]);
    const params = batchWrite.getParams();
    expect(params).toEqual({
      RequestItems: {
        testTable: [
          { PutRequest: { Item: { P: 'pk1', S: 'sk1' } } },
          { DeleteRequest: { Key: { P: 'pk1', S: 'sk2' } } },
        ],
      },
      ReturnConsumedCapacity: 'TOTAL',
      ReturnItemCollectionMetrics: 'SIZE',
    });
  });

  it('set getParams with empty', () => {
    const batchWrite = new Table.BatchWrite(client);
    batchWrite.set('testTable', [], []);
    const params = batchWrite.getParams();
    expect(params).toEqual({
      RequestItems: {
        testTable: [],
      },
    });
  });

  it('addPut', () => {
    const batchWrite = new Table.BatchWrite(client);
    batchWrite.addPut('testTable', { key: { P: 'pk1', S: 'sk1' }, item: { attrib1: 'a', attrib2: 'b' } });
    expect(batchWrite.getParams()).toEqual({
      RequestItems: {
        testTable: [{ PutRequest: { Item: { P: 'pk1', S: 'sk1', attrib1: 'a', attrib2: 'b' } } }],
      },
    });
  });

  it('addDelete', () => {
    const batchWrite = new Table.BatchWrite(client);
    batchWrite.addDelete('testTable', { P: 'pk1', S: 'sk1' });
    batchWrite.addDelete('testTable', { P: 'pk2', S: 'sk2' });
    expect(batchWrite.getParams()).toEqual({
      RequestItems: {
        testTable: [
          { DeleteRequest: { Key: { P: 'pk1', S: 'sk1' } } },
          { DeleteRequest: { Key: { P: 'pk2', S: 'sk2' } } },
        ],
      },
    });
  });

  it('execute', async () => {
    const item1 = { P: 'pk1', S: 'sk1', attrib: 'a' };
    const item2 = { P: 'pk2', S: 'sk2', attrib: 'b' };
    const output = {
      ItemCollectionMetrics: { testTable: [{ ItemCollectionKey: item1 }, { ItemCollectionKey: item2 }] },
    };
    client.batchWrite = jest.fn(() => batchWriteRequest(output));
    const batchWrite = new Table.BatchWrite(client);
    batchWrite.set('testTable', [{ key: { P: 'pk1', S: 'sk1' }, item: { attrib: 'a' } }], [{ P: 'pk3', S: 'sk3' }]);
    expect(batchWrite.getItem('testTable', { P: 'pk1', S: 'sk1' })).toEqual(undefined);
    const results = await batchWrite.execute();
    // results.ItemCollectionMetrics['TestTable'][0].ItemCollectionKey
    expect(results).toEqual(output);
    expect(batchWrite.getResult()).toEqual(output);
    expect(batchWrite.getItem('testTable', { P: 'pk2', S: 'sk2' })).toEqual(item2);
    expect(batchWrite.getItem('testTable2', { P: 'pk1', S: 'sk1' })).toEqual(undefined);
    expect(client.batchWrite).toBeCalledWith({
      RequestItems: {
        testTable: [
          { PutRequest: { Item: { P: 'pk1', S: 'sk1', attrib: 'a' } } },
          { DeleteRequest: { Key: { P: 'pk3', S: 'sk3' } } },
        ],
      },
    });
    expect(client.batchWrite).toBeCalledTimes(1);
  });
});

function transactGetRequest(
  output: DocumentClient.TransactGetItemsOutput,
): Request<DocumentClient.TransactGetItemsOutput, AWSError> {
  return {
    promise() {
      return delay(1, output);
    },
  } as Request<DocumentClient.TransactGetItemsOutput, AWSError>;
}

describe('Validate Transact Get', () => {
  it('set', () => {
    const transactGet = new Table.TransactGet(client);
    transactGet.set('testTable', [{ key: { P: 'pk1', S: 'sk1' } }]);
    expect(transactGet.getParams()).toEqual({
      TransactItems: [{ Get: { Key: { P: 'pk1', S: 'sk1' }, TableName: 'testTable' } }],
    });
  });

  it('addGet', () => {
    const transactGet = new Table.TransactGet(client);
    transactGet.addGet('testTable', { P: 'pk1', S: 'sk1' });
    transactGet.addGet('testTable', { P: 'pk2', S: 'sk2' });
    expect(transactGet.getParams()).toEqual({
      TransactItems: [
        { Get: { Key: { P: 'pk1', S: 'sk1' }, TableName: 'testTable' } },
        { Get: { Key: { P: 'pk2', S: 'sk2' }, TableName: 'testTable' } },
      ],
    });
  });

  it('options addGet', () => {
    const transactGet = new Table.TransactGet(client, {
      consumed: 'TOTAL',
      attributes: () => new ExpressionAttributes(),
    });
    transactGet.addGet('testTable', { P: 'pk1', S: 'sk1' });
    expect(transactGet.getParams()).toEqual({
      ReturnConsumedCapacity: 'TOTAL',
      TransactItems: [{ Get: { Key: { P: 'pk1', S: 'sk1' }, TableName: 'testTable' } }],
    });
  });

  it('execute', async () => {
    const item1 = { P: 'pk1', S: 'sk1', name: 'john' };
    const item2 = { P: 'pk2', S: 'sk2', name: 'bob' };
    const output = { Responses: [{ Item: item1 }, { Item: item2 }] };
    client.transactGet = jest.fn(() => transactGetRequest(output));
    const transactGet = new Table.TransactGet(client);
    expect(transactGet.getItem('testTable', { P: 'pk1', S: 'sk1' })).toEqual(undefined);
    transactGet.set('testTable', [{ key: { P: 'pk1', S: 'sk1' } }, { key: { P: 'pk2', S: 'sk2' } }]);
    expect(transactGet.getItem('testTable', { P: 'pk1', S: 'sk1' })).toEqual(undefined);
    const results = await transactGet.execute();
    expect(results).toEqual(output);
    expect(transactGet.getResult()).toEqual(output);
    expect(transactGet.getItem('testTable', { P: 'pk2', S: 'sk2' })).toEqual(item2);
    expect(transactGet.getItem('testTable2', { P: 'pk1', S: 'sk1' })).toEqual(undefined);
    expect(client.transactGet).toBeCalledWith({
      TransactItems: [
        { Get: { Key: { P: 'pk1', S: 'sk1' }, TableName: 'testTable' } },
        { Get: { Key: { P: 'pk2', S: 'sk2' }, TableName: 'testTable' } },
      ],
    });
    expect(client.transactGet).toBeCalledTimes(1);
  });
});

function transactWriteRequest(
  output: DocumentClient.TransactWriteItemsOutput,
): Request<DocumentClient.TransactWriteItemsOutput, AWSError> {
  return {
    promise() {
      return delay(1, output);
    },
  } as Request<DocumentClient.TransactWriteItemsOutput, AWSError>;
}
describe('Validate Transact Write', () => {
  it('set getParams', () => {
    const transactWrite = new Table.TransactWrite(client);
    transactWrite.set('testTable', {
      check: [],
      put: [
        { key: { P: 'pk1', S: 'sk1' }, item: { attrib1: 'a1' } },
        { key: { P: 'pk2', S: 'sk2' }, item: { attrib2: 'a2' } },
      ],
      delete: [{ key: { P: 'pk1', S: 'sk2' } }],
      update: [],
    });
    const params = transactWrite.getParams();
    expect(params).toEqual({
      TransactItems: [
        { Delete: { Key: { P: 'pk1', S: 'sk2' }, TableName: 'testTable' } },
        { Put: { Item: { P: 'pk1', S: 'sk1', attrib1: 'a1' }, TableName: 'testTable' } },
        { Put: { Item: { P: 'pk2', S: 'sk2', attrib2: 'a2' }, TableName: 'testTable' } },
      ],
    });
  });

  it('set getParams with options', () => {
    const transactWrite = new Table.TransactWrite(client, { consumed: 'TOTAL', metrics: 'SIZE', token: 'abc' });
    transactWrite.set('testTable', {
      check: [],
      put: [{ key: { P: 'pk1', S: 'sk1' } }],
      delete: [{ key: { P: 'pk1', S: 'sk2' } }],
      update: [],
    });
    const params = transactWrite.getParams();
    expect(params).toEqual({
      ClientRequestToken: 'abc',
      ReturnConsumedCapacity: 'TOTAL',
      ReturnItemCollectionMetrics: 'SIZE',
      TransactItems: [
        { Delete: { Key: { P: 'pk1', S: 'sk2' }, TableName: 'testTable' } },
        { Put: { Item: { P: 'pk1', S: 'sk1' }, TableName: 'testTable' } },
      ],
    });
  });

  it('set getParams with empty', () => {
    const transactWrite = new Table.TransactWrite(client);
    transactWrite.set('testTable', { check: [], delete: [], put: [], update: [] });
    const params = transactWrite.getParams();
    expect(params).toEqual({ TransactItems: [] });
  });

  it('addCheck', () => {
    const transactWrite = new Table.TransactWrite(client);
    transactWrite.addCheck('testTable', { P: 'pk1', S: 'sk1' }, [Condition.eq('P', 'pk1')]);
    transactWrite.addCheck('testTable', { P: 'pk2', S: 'sk2' }, [Condition.eq('P', 'pk2')]);
    expect(transactWrite.getParams()).toEqual({
      TransactItems: [
        {
          ConditionCheck: {
            ConditionExpression: '#n0 = :v0',
            ExpressionAttributeNames: { '#n0': 'P' },
            ExpressionAttributeValues: { ':v0': 'pk1' },
            Key: { P: 'pk1', S: 'sk1' },
            TableName: 'testTable',
          },
        },
        {
          ConditionCheck: {
            ConditionExpression: '#n0 = :v0',
            ExpressionAttributeNames: { '#n0': 'P' },
            ExpressionAttributeValues: { ':v0': 'pk2' },
            Key: { P: 'pk2', S: 'sk2' },
            TableName: 'testTable',
          },
        },
      ],
    });
  });

  it('addPut', () => {
    const transactWrite = new Table.TransactWrite(client);
    transactWrite.addPut('testTable', { P: 'pk1', S: 'sk1' }, { attrib1: 'a', attrib2: 'b' });
    expect(transactWrite.getParams()).toEqual({
      TransactItems: [{ Put: { Item: { P: 'pk1', S: 'sk1', attrib1: 'a', attrib2: 'b' }, TableName: 'testTable' } }],
    });
  });

  it('addDelete', () => {
    const transactWrite = new Table.TransactWrite(client);
    transactWrite.addDelete('testTable', { P: 'pk1', S: 'sk1' });
    expect(transactWrite.getParams()).toEqual({
      TransactItems: [{ Delete: { Key: { P: 'pk1', S: 'sk1' }, TableName: 'testTable' } }],
    });
  });

  it('addUpdate', () => {
    const transactWrite = new Table.TransactWrite(client);
    transactWrite.addUpdate('testTable', { P: 'pk1', S: 'sk1' }, { name: Update.inc(2) });
    expect(transactWrite.getParams()).toEqual({
      TransactItems: [
        {
          Update: {
            ExpressionAttributeNames: { '#n0': 'name' },
            ExpressionAttributeValues: { ':v0': 2 },
            Key: { P: 'pk1', S: 'sk1' },
            ReturnValuesOnConditionCheckFailure: 'ALL_NEW',
            TableName: 'testTable',
            UpdateExpression: 'SET #n0 = #n0 + :v0',
          },
        },
      ],
    });
  });

  it('execute', async () => {
    const item1 = { P: 'pk1', S: 'sk1', attrib: 'a' };
    const item2 = { P: 'pk2', S: 'sk2', attrib: 'a' };
    const output = {
      ItemCollectionMetrics: { testTable: [{ ItemCollectionKey: item1 }, { ItemCollectionKey: item2 }] },
    };
    client.transactWrite = jest.fn(() => transactWriteRequest(output));
    const transactWrite = new Table.TransactWrite(client);
    transactWrite.set('testTable', {
      check: [],
      put: [{ key: { P: 'pk1', S: 'sk1' }, item: { attrib: 'a' } }],
      delete: [{ key: { P: 'pk3', S: 'sk3' } }],
      update: [],
    });
    expect(transactWrite.getItem('testTable', { P: 'pk2', S: 'sk2' })).toEqual(undefined);
    const results = await transactWrite.execute();
    // results.ItemCollectionMetrics['TestTable'][0].ItemCollectionKey
    expect(results).toEqual(output);
    expect(transactWrite.getResult()).toEqual(output);
    expect(transactWrite.getItem('testTable2', { P: 'pk1', S: 'sk1' })).toEqual(undefined);
    expect(transactWrite.getItem('testTable', { P: 'pk2', S: 'sk2' })).toEqual(item2);
    expect(client.transactWrite).toBeCalledWith({
      TransactItems: [
        { Delete: { Key: { P: 'pk3', S: 'sk3' }, TableName: 'testTable' } },
        { Put: { Item: { P: 'pk1', S: 'sk1', attrib: 'a' }, TableName: 'testTable' } },
      ],
    });
    expect(client.transactWrite).toBeCalledTimes(1);
  });
});

it('equalMap', () => {
  expect(Table.equalMap(['abc', 'xyz'], { abc: '123', xyz: '987' })).toEqual(false);
});
