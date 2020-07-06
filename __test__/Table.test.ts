/* eslint-disable @typescript-eslint/unbound-method */
import { AWSError, Request } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { Table } from '../src/Table';
import { Index } from '../src/TableIndex';
import { validateTable } from '../src/TableValidate';
import { delay } from './testCommon';
import { Condition, Update } from '../src';

const client = new DocumentClient({ convertEmptyValues: true });
const request = {
  promise() {
    return delay(1, { Attributes: {} });
  },
} as Request<DocumentClient.GetItemOutput, AWSError>;

const batchRequest = {
  promise() {
    return delay(1, { RequestItems: {} });
  },
} as Request<DocumentClient.BatchGetItemOutput, AWSError>;

const transactRequest = {
  promise() {
    return delay(1, { TransactItems: {} });
  },
} as Request<DocumentClient.TransactGetItemsOutput, AWSError>;

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
      ReturnValues: 'ALL_NEW',
      TableName: 'TestTable',
    });
  });

  it('updateParams with options', () => {
    const params = testTable.updateParams({ P: 'pk', S: 'sk' });
    expect(params).toEqual({
      Key: { P: 'pk', S: 'sk' },
      ReturnValues: 'ALL_NEW',
      TableName: 'TestTable',
    });
  });

  it('batchGetParams', () => {
    const params = testTable.batchGetParams([
      { P: 'pk1', S: 'sk1' },
      { P: 'pk1', S: 'sk2' },
      { P: 'pk2', S: 'sk1' },
    ]);
    expect(params).toEqual({
      RequestItems: {
        TestTable: {
          Keys: [
            { P: 'pk1', S: 'sk1' },
            { P: 'pk1', S: 'sk2' },
            { P: 'pk2', S: 'sk1' },
          ],
        },
      },
    });
  });

  it('batchGetParams with options', () => {
    const params = testTable.batchGetParams(
      [
        { P: 'pk1', S: 'sk1' },
        { P: 'pk2', S: 'sk2' },
      ],
      { consumed: 'TOTAL', itemAttributes: ['attrib1', 'attrib2'] },
    );
    expect(params).toEqual({
      RequestItems: {
        TestTable: {
          ExpressionAttributeNames: {
            '#n0': 'attrib1',
            '#n1': 'attrib2',
          },
          Keys: [
            { P: 'pk1', S: 'sk1' },
            { P: 'pk2', S: 'sk2' },
          ],
          ProjectionExpression: 'attrib1, attrib2',
        },
      },
      ReturnConsumedCapacity: 'TOTAL',
    });
  });

  it('batchWriteParams', () => {
    const params = testTable.batchWriteParams(
      [
        { P: 'pk1', S: 'sk1', attrib1: 'a1' },
        { P: 'pk2', S: 'sk2', attrib2: 'a2' },
      ],
      [{ P: 'pk1', S: 'sk2' }],
    );
    expect(params).toEqual({
      RequestItems: {
        TestTable: [
          { PutRequest: { Item: { P: 'pk1', S: 'sk1', attrib1: 'a1' } } },
          { PutRequest: { Item: { P: 'pk2', S: 'sk2', attrib2: 'a2' } } },
          { DeleteRequest: { Key: { P: 'pk1', S: 'sk2' } } },
        ],
      },
    });
  });

  it('batchWriteParams with options', () => {
    const params = testTable.batchWriteParams([{ P: 'pk1', S: 'sk1' }], [{ P: 'pk1', S: 'sk2' }], {
      consumed: 'TOTAL',
      metrics: 'SIZE',
    });
    expect(params).toEqual({
      RequestItems: {
        TestTable: [
          { PutRequest: { Item: { P: 'pk1', S: 'sk1' } } },
          { DeleteRequest: { Key: { P: 'pk1', S: 'sk2' } } },
        ],
      },
      ReturnConsumedCapacity: 'TOTAL',
      ReturnItemCollectionMetrics: 'SIZE',
    });
  });

  it('batchWriteParams with empty ', () => {
    const params = testTable.batchWriteParams();
    expect(params).toEqual({
      RequestItems: {
        TestTable: [],
      },
    });
  });

  it('transactGetParams', () => {
    const params = testTable.transactGetParams(
      [
        { P: 'pk1', S: 'sk1' },
        { P: 'pk2', S: 'sk1' },
      ],
      [{ key: { P: 'pk2', S: 'sk2' }, itemAttributes: ['attrib1', 'attrib2'] }],
    );
    expect(params).toEqual({
      TransactItems: [
        { Get: { Key: { P: 'pk1', S: 'sk1' }, TableName: 'TestTable' } },
        { Get: { Key: { P: 'pk2', S: 'sk1' }, TableName: 'TestTable' } },
        {
          Get: {
            ExpressionAttributeNames: { '#n0': 'attrib1', '#n1': 'attrib2' },
            Key: { P: 'pk2', S: 'sk2' },
            ProjectionExpression: 'attrib1, attrib2',
            TableName: 'TestTable',
          },
        },
      ],
    });
  });

  it('transactGetParams with options', () => {
    const params = testTable.transactGetParams(
      [{ P: 'pk1', S: 'sk1' }],
      [{ key: { P: 'pk2', S: 'sk2' }, itemAttributes: ['attrib1', 'attrib2'] }],
      { consumed: 'TOTAL' },
    );
    expect(params).toEqual({
      TransactItems: [
        { Get: { Key: { P: 'pk1', S: 'sk1' }, TableName: 'TestTable' } },
        {
          Get: {
            ExpressionAttributeNames: { '#n0': 'attrib1', '#n1': 'attrib2' },
            Key: { P: 'pk2', S: 'sk2' },
            ProjectionExpression: 'attrib1, attrib2',
            TableName: 'TestTable',
          },
        },
      ],
      ReturnConsumedCapacity: 'TOTAL',
    });
  });

  it('transactGetParams with empty ', () => {
    const params = testTable.transactGetParams();
    expect(params).toEqual({ TransactItems: [] });
  });

  it('transactWriteParams', () => {
    const params = testTable.transactWriteParams({
      check: [
        { key: { P: 'pk1', S: 'sk1' }, conditions: [Condition.eq('name', 'john')] },
        { key: { P: 'pk2', S: 'sk2' }, conditions: [Condition.eq('admin', true)], returnFailure: 'ALL_OLD' },
      ],
      put: [
        {
          key: { P: 'pk3', S: 'sk3' },
          item: { attrib1: 'a1', attrib2: 2 },
          conditions: [Condition.gt('access', 2)],
          returnFailure: 'ALL_OLD',
        },
      ],
      delete: [
        { key: { P: 'pk4', S: 'sk4' }, conditions: [Condition.eq('readOnly', false)], returnFailure: 'ALL_OLD' },
      ],
      update: [
        {
          key: { P: 'pk5', S: 'sk5' },
          item: { attrib1: Update.inc(1), attrib2: 'abc', attrib3: null },
          conditions: [Condition.eq('lock', false)],
          returnFailure: 'ALL_OLD',
        },
      ],
    });
    expect(params).toEqual({
      TransactItems: [
        {
          ConditionCheck: {
            ConditionExpression: '#n0 = :v0',
            ExpressionAttributeNames: { '#n0': 'name' },
            ExpressionAttributeValues: { ':v0': 'john' },
            Key: { P: 'pk1', S: 'sk1' },
            TableName: 'TestTable',
          },
        },
        {
          ConditionCheck: {
            ConditionExpression: '#n0 = :v0',
            ExpressionAttributeNames: { '#n0': 'admin' },
            ExpressionAttributeValues: { ':v0': true },
            Key: { P: 'pk2', S: 'sk2' },
            ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
            TableName: 'TestTable',
          },
        },
        {
          Delete: {
            ConditionExpression: '#n0 = :v0',
            ExpressionAttributeNames: { '#n0': 'readOnly' },
            ExpressionAttributeValues: { ':v0': false },
            Key: { P: 'pk4', S: 'sk4' },
            ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
            TableName: 'TestTable',
          },
        },
        {
          Put: {
            ConditionExpression: '#n0 > :v0',
            ExpressionAttributeNames: { '#n0': 'access' },
            ExpressionAttributeValues: { ':v0': 2 },
            Item: { P: 'pk3', S: 'sk3', attrib1: 'a1', attrib2: 2 },
            ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
            TableName: 'TestTable',
          },
        },
        {
          Update: {
            ConditionExpression: '#n0 = :v0',
            ExpressionAttributeNames: { '#n0': 'lock', '#n1': 'attrib1', '#n2': 'attrib2', '#n3': 'attrib3' },
            ExpressionAttributeValues: { ':v0': false, ':v1': 1, ':v2': 'abc' },
            Key: { P: 'pk5', S: 'sk5' },
            ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
            TableName: 'TestTable',
            UpdateExpression: 'SET #n1 = #n1 + :v1, #n2 = :v2 REMOVE #n3',
          },
        },
      ],
    });
  });

  it('transactWriteParams with options', () => {
    const params = testTable.transactWriteParams(
      {
        put: [
          {
            key: { P: 'pk1', S: 'sk1' },
            item: { attrib1: 1, attrib2: 'a2' },
            conditions: [Condition.ne('lock', true)],
            returnFailure: 'ALL_OLD',
          },
        ],
      },
      { consumed: 'TOTAL', metrics: 'SIZE', token: 'token' },
    );
    expect(params).toEqual({
      TransactItems: [
        {
          Put: {
            ConditionExpression: '#n0 <> :v0',
            ExpressionAttributeNames: { '#n0': 'lock' },
            ExpressionAttributeValues: { ':v0': true },
            Item: { P: 'pk1', S: 'sk1', attrib1: 1, attrib2: 'a2' },
            ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
            TableName: 'TestTable',
          },
        },
      ],
      ClientRequestToken: 'token',
      ReturnConsumedCapacity: 'TOTAL',
      ReturnItemCollectionMetrics: 'SIZE',
    });
  });

  it('transactWriteParams with empty', () => {
    const params = testTable.transactWriteParams({});
    expect(params).toEqual({ TransactItems: [] });
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

  it('batchGet', async () => {
    client.batchGet = jest.fn(() => batchRequest);
    const results = await testTable.batchGet([
      { P: 'pk1', S: 'sk1' },
      { P: 'pk2', S: 'sk2' },
    ]);
    expect(results).toEqual({ RequestItems: {} });
    expect(client.batchGet).toBeCalledWith({
      RequestItems: {
        TestTable: {
          Keys: [
            { P: 'pk1', S: 'sk1' },
            { P: 'pk2', S: 'sk2' },
          ],
        },
      },
    });
    expect(client.batchGet).toBeCalledTimes(1);
  });

  it('batchWrite with item', async () => {
    client.batchWrite = jest.fn(() => batchRequest);
    const results = await testTable.batchWrite([{ P: 'pk1', S: 'sk1', attrib: 'a' }], [{ P: 'pk3', S: 'sk3' }]);
    expect(results).toEqual({ RequestItems: {} });
    expect(client.batchWrite).toBeCalledWith({
      RequestItems: {
        TestTable: [
          { PutRequest: { Item: { P: 'pk1', S: 'sk1', attrib: 'a' } } },
          { DeleteRequest: { Key: { P: 'pk3', S: 'sk3' } } },
        ],
      },
    });
    expect(client.batchWrite).toBeCalledTimes(1);
  });

  it('transactGet', async () => {
    client.transactGet = jest.fn(() => transactRequest);
    const results = await testTable.transactGet(
      [{ P: 'pk1', S: 'sk1' }],
      [{ key: { P: 'pk2', S: 'sk2' }, itemAttributes: ['attrib1', 'attrib2'] }],
    );
    expect(results).toEqual({ TransactItems: {} });
    expect(client.transactGet).toBeCalledWith({
      TransactItems: [
        {
          Get: { Key: { P: 'pk1', S: 'sk1' }, TableName: 'TestTable' },
        },
        {
          Get: {
            ExpressionAttributeNames: { '#n0': 'attrib1', '#n1': 'attrib2' },
            Key: { P: 'pk2', S: 'sk2' },
            ProjectionExpression: 'attrib1, attrib2',
            TableName: 'TestTable',
          },
        },
      ],
    });
    expect(client.transactGet).toBeCalledTimes(1);
  });

  it('transactWrite with item', async () => {
    client.transactWrite = jest.fn(() => transactRequest);
    const results = await testTable.transactWrite({
      put: [{ key: { P: 'pk1', S: 'sk1', attrib: 'a' } }],
      delete: [{ key: { P: 'pk3', S: 'sk3' } }],
    });
    expect(results).toEqual({ TransactItems: {} });
    expect(client.transactWrite).toBeCalledWith({
      TransactItems: [
        { Delete: { Key: { P: 'pk3', S: 'sk3' }, TableName: 'TestTable' } },
        { Put: { Item: { P: 'pk1', S: 'sk1', attrib: 'a' }, TableName: 'TestTable' } },
      ],
    });
    expect(client.transactWrite).toBeCalledTimes(1);
  });
});
