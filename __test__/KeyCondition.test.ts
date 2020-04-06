import { SortKey, KeyConditionExpression, buildKeyConditionInput } from '../src/KeyCondition';

it('Validate Condition exports', () => {
  expect(typeof SortKey).toEqual('function');
  expect(typeof KeyConditionExpression).toEqual('function');
  expect(typeof buildKeyConditionInput).toEqual('function');
});

describe('Validate SortKey', () => {
  it('eq', () => {
    expect(buildKeyConditionInput({ P: SortKey.eq('keyvalue') })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 'keyvalue' },
      KeyConditionExpression: '#n0 = :v0',
    });
  });

  it('lt', () => {
    expect(buildKeyConditionInput({ P: SortKey.lt(4) })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 4 },
      KeyConditionExpression: '#n0 < :v0',
    });
  });

  it('le', () => {
    expect(buildKeyConditionInput({ P: SortKey.le(6) })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 6 },
      KeyConditionExpression: '#n0 <= :v0',
    });
  });

  it('gt', () => {
    expect(buildKeyConditionInput({ P: SortKey.gt(8) })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 8 },
      KeyConditionExpression: '#n0 > :v0',
    });
  });

  it('ge', () => {
    expect(buildKeyConditionInput({ P: SortKey.ge(10) })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 10 },
      KeyConditionExpression: '#n0 >= :v0',
    });
  });

  it('between', () => {
    expect(buildKeyConditionInput({ P: SortKey.between('a', 'z') })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 'a', ':v1': 'z' },
      KeyConditionExpression: '#n0 BETWEEN :v0 AND :v1',
    });
  });

  it('beginsWith', () => {
    expect(buildKeyConditionInput({ P: SortKey.beginsWith('abc') })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 'abc' },
      KeyConditionExpression: 'begins_with(#n0, :v0)',
    });
  });

  it('buildKeyConditionInput with KeyConditionExpression', () => {
    expect(buildKeyConditionInput({ P: SortKey.eq('with exp') }, new KeyConditionExpression())).toEqual({
      ExpressionAttributeNames: { '#n0': 'P' },
      ExpressionAttributeValues: { ':v0': 'with exp' },
      KeyConditionExpression: '#n0 = :v0',
    });
  });

  it('buildKeyConditionInput with 2 keys', () => {
    expect(buildKeyConditionInput({ P: 'abc', S: SortKey.beginsWith('with exp') })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P', '#n1': 'S' },
      ExpressionAttributeValues: { ':v0': 'abc', ':v1': 'with exp' },
      KeyConditionExpression: '#n0 = :v0 AND begins_with(#n1, :v1)',
    });
  });

  it('buildKeyConditionInput with 3 keys', () => {
    expect(buildKeyConditionInput({ P: 'abc', S: SortKey.beginsWith('with exp'), E: 'extrakey' })).toEqual({
      ExpressionAttributeNames: { '#n0': 'P', '#n1': 'S', '#n2': 'E' },
      ExpressionAttributeValues: { ':v0': 'abc', ':v1': 'with exp', ':v2': 'extrakey' },
      KeyConditionExpression: '#n0 = :v0 AND begins_with(#n1, :v1)',
    });
  });
});
