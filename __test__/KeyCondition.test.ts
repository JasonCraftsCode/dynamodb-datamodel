import { KeyCondition, KeyConditionExpression } from '../src/KeyCondition';
import { ExpressionAttributes } from '../src/ExpressionAttributes';

it('Validate Condition exports', () => {
  expect(typeof KeyCondition).toEqual('function');
  expect(typeof KeyConditionExpression).toEqual('function');
  expect(typeof KeyCondition.buildInput).toEqual('function');
});

describe('Validate KeyCondition', () => {
  it('eq', () => {
    expect(KeyCondition.buildInput({ P: KeyCondition.eq('keyvalue') })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 'keyvalue' },
      KeyConditionExpression: '#n0 = :v0',
    });
  });

  it('lt', () => {
    expect(KeyCondition.buildInput({ P: KeyCondition.lt(4) })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 4 },
      KeyConditionExpression: '#n0 < :v0',
    });
  });

  it('le', () => {
    expect(KeyCondition.buildInput({ P: KeyCondition.le(6) })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 6 },
      KeyConditionExpression: '#n0 <= :v0',
    });
  });

  it('gt', () => {
    expect(KeyCondition.buildInput({ P: KeyCondition.gt(8) })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 8 },
      KeyConditionExpression: '#n0 > :v0',
    });
  });

  it('ge', () => {
    expect(KeyCondition.buildInput({ P: KeyCondition.ge(10) })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 10 },
      KeyConditionExpression: '#n0 >= :v0',
    });
  });

  it('between', () => {
    expect(KeyCondition.buildInput({ P: KeyCondition.between('a', 'z') })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 'a', ':v1': 'z' },
      KeyConditionExpression: '#n0 BETWEEN :v0 AND :v1',
    });
  });

  it('beginsWith', () => {
    expect(KeyCondition.buildInput({ P: KeyCondition.beginsWith('abc') })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 'abc' },
      KeyConditionExpression: 'begins_with(#n0, :v0)',
    });
  });

  it('SortKey.buildInput with KeyConditionExpression', () => {
    const attr = new ExpressionAttributes();
    expect(KeyCondition.buildInput({ P: KeyCondition.eq('with exp') }, new KeyConditionExpression(attr))).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 'with exp' },
      KeyConditionExpression: '#n0 = :v0',
    });
  });

  it('SortKey.buildInput with 2 keys', () => {
    expect(KeyCondition.buildInput({ P: 'abc', S: KeyCondition.beginsWith('with exp') })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P', '#n1': 'S' },
      ExpressionAttributeValues: { ':v0': 'abc', ':v1': 'with exp' },
      KeyConditionExpression: '#n0 = :v0 AND begins_with(#n1, :v1)',
    });
  });

  it('SortKey.buildInput with 3 keys', () => {
    expect(KeyCondition.buildInput({ P: 'abc', S: KeyCondition.beginsWith('with exp'), E: 'extrakey' })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P', '#n1': 'S', '#n2': 'E' },
      ExpressionAttributeValues: { ':v0': 'abc', ':v1': 'with exp', ':v2': 'extrakey' },
      KeyConditionExpression: '#n0 = :v0 AND begins_with(#n1, :v1)',
    });
  });
});
