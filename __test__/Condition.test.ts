import { Condition } from '../src/Condition';
import { ExpressionAttributes } from '../src/ExpressionAttributes';

it('Validate Condition exports', () => {
  expect(typeof Condition).toEqual('function');
  expect(typeof Condition).toEqual('function');
});

it('Validate Condition aliased names are the same', () => {
  expect(Condition.eq).toEqual(Condition.equal);
  expect(Condition.ne).toEqual(Condition.notEqual);
  expect(Condition.lt).toEqual(Condition.lessThen);
  expect(Condition.le).toEqual(Condition.lessThenEqual);
  expect(Condition.gt).toEqual(Condition.greaterThen);
  expect(Condition.ge).toEqual(Condition.greaterThenEqual);
});

describe('Validate Condition with values', () => {
  const attribs = new ExpressionAttributes();
  beforeEach(() => {
    attribs.reset();
  });

  it('eq', () => {
    const cond = Condition.eq('path1', 'value1');
    expect(cond(attribs)).toEqual('#n0 = :v0');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({ ':v0': 'value1' });
  });

  it('ne', () => {
    const cond = Condition.ne('path1', 'value1');
    expect(cond(attribs)).toEqual('#n0 <> :v0');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({ ':v0': 'value1' });
  });

  it('lt', () => {
    const cond = Condition.lt('path1', 'value1');
    expect(cond(attribs)).toEqual('#n0 < :v0');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({ ':v0': 'value1' });
  });
  it('le', () => {
    const cond = Condition.le('path1', 'value1');
    expect(cond(attribs)).toEqual('#n0 <= :v0');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({ ':v0': 'value1' });
  });

  it('gt', () => {
    const cond = Condition.gt('path1', 'value1');
    expect(cond(attribs)).toEqual('#n0 > :v0');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({ ':v0': 'value1' });
  });

  it('ge', () => {
    const cond = Condition.ge('path1', 'value1');
    expect(cond(attribs)).toEqual('#n0 >= :v0');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({ ':v0': 'value1' });
  });

  it('between', () => {
    const cond = Condition.between('path1', 'value1', 'value2');
    expect(cond(attribs)).toEqual('#n0 BETWEEN :v0 AND :v1');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({ ':v0': 'value1', ':v1': 'value2' });
  });

  it('in', () => {
    const cond = Condition.in('path1', ['value1', 'value2', 'value3']);
    expect(cond(attribs)).toEqual('#n0 IN (:v0, :v1, :v2)');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({
      ':v0': 'value1',
      ':v1': 'value2',
      ':v2': 'value3',
    });
  });

  it('contains', () => {
    const cond = Condition.contains('path1', 'value1');
    expect(cond(attribs)).toEqual('contains(#n0, :v0)');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({ ':v0': 'value1' });
  });

  it('beginsWith', () => {
    const cond = Condition.beginsWith('path1', 'value1');
    expect(cond(attribs)).toEqual('begins_with(#n0, :v0)');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({ ':v0': 'value1' });
  });

  it('type', () => {
    const cond = Condition.type('path1', 'S');
    expect(cond(attribs)).toEqual('attribute_type(#n0, :v0)');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({ ':v0': 'S' });
  });

  it('exists', () => {
    const cond = Condition.exists('path1');
    expect(cond(attribs)).toEqual('attribute_exists(#n0)');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({});
  });

  it('notExists', () => {
    const cond = Condition.notExists('path1');
    expect(cond(attribs)).toEqual('attribute_not_exists(#n0)');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({});
  });

  it('size', () => {
    const cond = Condition.gt(Condition.size('path1'), 8);
    expect(cond(attribs)).toEqual('size(#n0) > :v0');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attribs.getValues()).toEqual({ ':v0': 8 });
  });
});

describe('Validate Condition with Paths', () => {
  const attribs = new ExpressionAttributes();
  beforeEach(() => {
    attribs.reset();
  });

  it('eq with Path', () => {
    const cond = Condition.eq('path1', Condition.path('value1'));
    expect(cond(attribs)).toEqual('#n0 = #n1');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1', '#n1': 'value1' });
    expect(attribs.getValues()).toEqual({});
  });

  it('ne with Path', () => {
    const cond = Condition.ne('path1', Condition.path('value1'));
    expect(cond(attribs)).toEqual('#n0 <> #n1');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1', '#n1': 'value1' });
    expect(attribs.getValues()).toEqual({});
  });

  it('lt with Path', () => {
    const cond = Condition.lt('path1', Condition.path('value1'));
    expect(cond(attribs)).toEqual('#n0 < #n1');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1', '#n1': 'value1' });
    expect(attribs.getValues()).toEqual({});
  });
  it('le with Path', () => {
    const cond = Condition.le('path1', Condition.path('value1'));
    expect(cond(attribs)).toEqual('#n0 <= #n1');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1', '#n1': 'value1' });
    expect(attribs.getValues()).toEqual({});
  });

  it('gt with Path', () => {
    const cond = Condition.gt('path1', Condition.path('value1'));
    expect(cond(attribs)).toEqual('#n0 > #n1');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1', '#n1': 'value1' });
    expect(attribs.getValues()).toEqual({});
  });

  it('ge with Path', () => {
    const cond = Condition.ge('path1', Condition.path('value1'));
    expect(cond(attribs)).toEqual('#n0 >= #n1');
    expect(attribs.getPaths()).toEqual({ '#n0': 'path1', '#n1': 'value1' });
    expect(attribs.getValues()).toEqual({});
  });

  it('between with Path', () => {
    const cond = Condition.between('path1', Condition.path('value1'), Condition.path('value2'));
    expect(cond(attribs)).toEqual('#n0 BETWEEN #n1 AND #n2');
    expect(attribs.getPaths()).toEqual({
      '#n0': 'path1',
      '#n1': 'value1',
      '#n2': 'value2',
    });
    expect(attribs.getValues()).toEqual({});
  });

  it('in with Path', () => {
    const cond = Condition.in('path1', [Condition.path('value1'), Condition.path('value2'), Condition.path('value3')]);
    expect(cond(attribs)).toEqual('#n0 IN (#n1, #n2, #n3)');
    expect(attribs.getPaths()).toEqual({
      '#n0': 'path1',
      '#n1': 'value1',
      '#n2': 'value2',
      '#n3': 'value3',
    });
    expect(attribs.getValues()).toEqual({});
  });
});

describe('Validate Condition', () => {
  const cond1 = Condition.le('path1', 'value1');
  const cond2 = Condition.ge('path2', 'value2');
  const cond3 = Condition.eq('path3', 3);
  const cond4 = Condition.ne('path4', 4);
  const attribs = new ExpressionAttributes();
  beforeEach(() => {
    attribs.reset();
  });

  it('add Conditions', () => {
    const logical = Condition.and([cond1, cond2]);
    expect(logical(attribs)).toEqual('(#n0 <= :v0 AND #n1 >= :v1)');
  });

  it('or Conditions', () => {
    const logical = Condition.or([cond1, cond2]);
    expect(logical(attribs)).toEqual('(#n0 <= :v0 OR #n1 >= :v1)');
  });

  it('not Conditions', () => {
    const logical = Condition.not(cond1);
    expect(logical(attribs)).toEqual('(NOT #n0 <= :v0)');
  });

  it('and Conditions with 1', () => {
    const logical = Condition.and([cond1]);
    expect(logical(attribs)).toEqual('(#n0 <= :v0)');
  });

  it('or Conditions with 1', () => {
    const logical = Condition.or([cond1]);
    expect(logical(attribs)).toEqual('(#n0 <= :v0)');
  });

  it('and with 4 conditions', () => {
    const logical = Condition.and([cond1, cond2, cond3, cond4]);
    expect(logical(attribs)).toEqual('(#n0 <= :v0 AND #n1 >= :v1 AND #n2 = :v2 AND #n3 <> :v3)');
  });

  it('and with Conditions', () => {
    const logical1 = Condition.not(cond1);
    const logical2 = Condition.and([cond2, cond3]);
    const logical3 = Condition.and([logical1, logical2]);
    expect(logical3(attribs)).toEqual('((NOT #n0 <= :v0) AND (#n1 >= :v1 AND #n2 = :v2))');
  });

  it('add with Conditions and Conditions', () => {
    const logical1 = Condition.not(cond1);
    const logical3 = Condition.and([logical1, cond2, cond3]);
    expect(logical3(attribs)).toEqual('((NOT #n0 <= :v0) AND #n1 >= :v1 AND #n2 = :v2)');
  });

  it('or with 4 conditions', () => {
    const logical = Condition.or([cond1, cond2, cond3, cond4]);
    expect(logical(attribs)).toEqual('(#n0 <= :v0 OR #n1 >= :v1 OR #n2 = :v2 OR #n3 <> :v3)');
  });

  it('or with Conditions', () => {
    const logical1 = Condition.not(cond1);
    const logical2 = Condition.or([cond2, cond3]);
    const logical3 = Condition.or([logical1, logical2]);
    expect(logical3(attribs)).toEqual('((NOT #n0 <= :v0) OR (#n1 >= :v1 OR #n2 = :v2))');
  });

  it('or with Conditions and Conditions', () => {
    const logical1 = Condition.not(cond1);
    const logical3 = Condition.or([logical1, cond2, cond3]);
    expect(logical3(attribs)).toEqual('((NOT #n0 <= :v0) OR #n1 >= :v1 OR #n2 = :v2)');
  });

  it('buildInput', () => {
    const cond = Condition.eq('path1', 'value1');
    expect(Condition.buildInput(cond)).toEqual({
      ConditionExpression: '#n0 = :v0',
      ExpressionAttributeNames: { '#n0': 'path1' },
      ExpressionAttributeValues: { ':v0': 'value1' },
    });
    expect(Condition.buildInput(cond, new ExpressionAttributes())).toEqual({
      ConditionExpression: '#n0 = :v0',
      ExpressionAttributeNames: { '#n0': 'path1' },
      ExpressionAttributeValues: { ':v0': 'value1' },
    });
  });
});
