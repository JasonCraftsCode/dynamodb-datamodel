import { Condition, ConditionExpression } from '../src/Condition';

it('Validate Condition exports', () => {
  expect(typeof Condition.eq).toEqual('function');
  expect(typeof Condition.ne).toEqual('function');
});

/*
// Remove aliasing since it is confusing to have two methods do the same thing
// Can always add aliasing in the future if there is a need
it('Validate Condition aliased names are the same', () => {
  expect(Condition.eq).toEqual(Condition.equal);
  expect(Condition.ne).toEqual(Condition.notEqual);
  expect(Condition.lt).toEqual(Condition.lessThen);
  expect(Condition.le).toEqual(Condition.lessThenEqual);
  expect(Condition.gt).toEqual(Condition.greaterThen);
  expect(Condition.ge).toEqual(Condition.greaterThenEqual);
});
*/

describe('Validate Condition with values', () => {
  const exp = new ConditionExpression();
  beforeEach(() => {
    exp.attributes.reset();
  });

  it('eq', () => {
    const condition = Condition.eq('path1', 'value1');
    expect(condition(exp)).toEqual('#n0 = :v0');
    expect(exp.attributes.getPaths()).toEqual({ '#n0': 'path1' });
    expect(exp.attributes.getValues()).toEqual({ ':v0': 'value1' });
  });

  it('ne', () => {
    const condition = Condition.ne('path1', 'value1');
    expect(condition(exp)).toEqual('#n0 <> :v0');
    expect(exp.attributes.getPaths()).toEqual({ '#n0': 'path1' });
    expect(exp.attributes.getValues()).toEqual({ ':v0': 'value1' });
  });

  it('lt', () => {
    const condition = Condition.lt('path1', 'value1');
    expect(condition(exp)).toEqual('#n0 < :v0');
    expect(exp.attributes.getPaths()).toEqual({ '#n0': 'path1' });
    expect(exp.attributes.getValues()).toEqual({ ':v0': 'value1' });
  });
  it('le', () => {
    const condition = Condition.le('path1', 'value1');
    expect(condition(exp)).toEqual('#n0 <= :v0');
    expect(exp.attributes.getPaths()).toEqual({ '#n0': 'path1' });
    expect(exp.attributes.getValues()).toEqual({ ':v0': 'value1' });
  });

  it('gt', () => {
    const condition = Condition.gt('path1', 'value1');
    expect(condition(exp)).toEqual('#n0 > :v0');
    expect(exp.attributes.getPaths()).toEqual({ '#n0': 'path1' });
    expect(exp.attributes.getValues()).toEqual({ ':v0': 'value1' });
  });

  it('ge', () => {
    const condition = Condition.ge('path1', 'value1');
    expect(condition(exp)).toEqual('#n0 >= :v0');
    expect(exp.attributes.getPaths()).toEqual({ '#n0': 'path1' });
    expect(exp.attributes.getValues()).toEqual({ ':v0': 'value1' });
  });

  it('between', () => {
    const condition = Condition.between('path1', 'value1', 'value2');
    expect(condition(exp)).toEqual('#n0 BETWEEN :v0 AND :v1');
    expect(exp.attributes.getPaths()).toEqual({ '#n0': 'path1' });
    expect(exp.attributes.getValues()).toEqual({ ':v0': 'value1', ':v1': 'value2' });
  });

  it('in', () => {
    const condition = Condition.in('path1', ['value1', 'value2', 'value3']);
    expect(condition(exp)).toEqual('#n0 IN (:v0, :v1, :v2)');
    expect(exp.attributes.getPaths()).toEqual({ '#n0': 'path1' });
    expect(exp.attributes.getValues()).toEqual({
      ':v0': 'value1',
      ':v1': 'value2',
      ':v2': 'value3',
    });
  });

  it('contains', () => {
    const condition = Condition.contains('path1', 'value1');
    expect(condition(exp)).toEqual('contains(#n0, :v0)');
    expect(exp.attributes.getPaths()).toEqual({ '#n0': 'path1' });
    expect(exp.attributes.getValues()).toEqual({ ':v0': 'value1' });
  });

  it('beginsWith', () => {
    const condition = Condition.beginsWith('path1', 'value1');
    expect(condition(exp)).toEqual('begins_with(#n0, :v0)');
    expect(exp.attributes.getPaths()).toEqual({ '#n0': 'path1' });
    expect(exp.attributes.getValues()).toEqual({ ':v0': 'value1' });
  });

  it('type', () => {
    const condition = Condition.type('path1', 'S');
    expect(condition(exp)).toEqual('attribute_type(#n0, :v0)');
    expect(exp.attributes.getPaths()).toEqual({ '#n0': 'path1' });
    expect(exp.attributes.getValues()).toEqual({ ':v0': 'S' });
  });

  it('exists', () => {
    const condition = Condition.exists('path1');
    expect(condition(exp)).toEqual('attribute_exists(#n0)');
    expect(exp.attributes.getPaths()).toEqual({ '#n0': 'path1' });
    expect(exp.attributes.getValues()).toEqual({});
  });

  it('notExists', () => {
    const condition = Condition.notExists('path1');
    expect(condition(exp)).toEqual('attribute_not_exists(#n0)');
    expect(exp.attributes.getPaths()).toEqual({ '#n0': 'path1' });
    expect(exp.attributes.getValues()).toEqual({});
  });

  it('size', () => {
    const condition = Condition.gt(Condition.size('path1'), 8);
    expect(condition(exp)).toEqual('size(#n0) > :v0');
    expect(exp.attributes.getPaths()).toEqual({ '#n0': 'path1' });
    expect(exp.attributes.getValues()).toEqual({ ':v0': 8 });
  });
});

describe('Validate Condition with Paths', () => {
  const exp = new ConditionExpression();
  beforeEach(() => {
    exp.attributes.reset();
  });

  it('eq with Path', () => {
    const condition = Condition.eq('path1', Condition.path('value1'));
    expect(condition(exp)).toEqual('#n0 = #n1');
    expect(exp.attributes.getPaths()).toEqual({ '#n0': 'path1', '#n1': 'value1' });
    expect(exp.attributes.getValues()).toEqual({});
  });

  it('ne with Path', () => {
    const condition = Condition.ne('path1', Condition.path('value1'));
    expect(condition(exp)).toEqual('#n0 <> #n1');
    expect(exp.attributes.getPaths()).toEqual({ '#n0': 'path1', '#n1': 'value1' });
    expect(exp.attributes.getValues()).toEqual({});
  });

  it('lt with Path', () => {
    const condition = Condition.lt('path1', Condition.path('value1'));
    expect(condition(exp)).toEqual('#n0 < #n1');
    expect(exp.attributes.getPaths()).toEqual({ '#n0': 'path1', '#n1': 'value1' });
    expect(exp.attributes.getValues()).toEqual({});
  });
  it('le with Path', () => {
    const condition = Condition.le('path1', Condition.path('value1'));
    expect(condition(exp)).toEqual('#n0 <= #n1');
    expect(exp.attributes.getPaths()).toEqual({ '#n0': 'path1', '#n1': 'value1' });
    expect(exp.attributes.getValues()).toEqual({});
  });

  it('gt with Path', () => {
    const condition = Condition.gt('path1', Condition.path('value1'));
    expect(condition(exp)).toEqual('#n0 > #n1');
    expect(exp.attributes.getPaths()).toEqual({ '#n0': 'path1', '#n1': 'value1' });
    expect(exp.attributes.getValues()).toEqual({});
  });

  it('ge with Path', () => {
    const condition = Condition.ge('path1', Condition.path('value1'));
    expect(condition(exp)).toEqual('#n0 >= #n1');
    expect(exp.attributes.getPaths()).toEqual({ '#n0': 'path1', '#n1': 'value1' });
    expect(exp.attributes.getValues()).toEqual({});
  });

  it('between with Path', () => {
    const condition = Condition.between('path1', Condition.path('value1'), Condition.path('value2'));
    expect(condition(exp)).toEqual('#n0 BETWEEN #n1 AND #n2');
    expect(exp.attributes.getPaths()).toEqual({
      '#n0': 'path1',
      '#n1': 'value1',
      '#n2': 'value2',
    });
    expect(exp.attributes.getValues()).toEqual({});
  });

  it('in with Path', () => {
    const condition = Condition.in('path1', [
      Condition.path('value1'),
      Condition.path('value2'),
      Condition.path('value3'),
    ]);
    expect(condition(exp)).toEqual('#n0 IN (#n1, #n2, #n3)');
    expect(exp.attributes.getPaths()).toEqual({
      '#n0': 'path1',
      '#n1': 'value1',
      '#n2': 'value2',
      '#n3': 'value3',
    });
    expect(exp.attributes.getValues()).toEqual({});
  });
});

describe('Validate Condition', () => {
  const condition1 = Condition.le('path1', 'value1');
  const condition2 = Condition.ge('path2', 'value2');
  const condition3 = Condition.eq('path3', 3);
  const condition4 = Condition.ne('path4', 4);
  const exp = new ConditionExpression();
  beforeEach(() => {
    exp.attributes.reset();
  });

  it('add Conditions', () => {
    const logical = Condition.and(condition1, condition2);
    expect(logical(exp)).toEqual('(#n0 <= :v0 AND #n1 >= :v1)');
  });

  it('or Conditions', () => {
    const logical = Condition.or(condition1, condition2);
    expect(logical(exp)).toEqual('(#n0 <= :v0 OR #n1 >= :v1)');
  });

  it('not Conditions', () => {
    const logical = Condition.not(condition1);
    expect(logical(exp)).toEqual('(NOT #n0 <= :v0)');
  });

  it('and Conditions with 1', () => {
    const logical = Condition.and(condition1);
    expect(logical(exp)).toEqual('(#n0 <= :v0)');
  });

  it('or Conditions with 1', () => {
    const logical = Condition.or(condition1);
    expect(logical(exp)).toEqual('(#n0 <= :v0)');
  });

  it('and with 4 conditions', () => {
    const logical = Condition.and(condition1, condition2, condition3, condition4);
    expect(logical(exp)).toEqual('(#n0 <= :v0 AND #n1 >= :v1 AND #n2 = :v2 AND #n3 <> :v3)');
  });

  it('and with Conditions', () => {
    const logical1 = Condition.not(condition1);
    const logical2 = Condition.and(condition2, condition3);
    const logical3 = Condition.and(logical1, logical2);
    expect(logical3(exp)).toEqual('((NOT #n0 <= :v0) AND (#n1 >= :v1 AND #n2 = :v2))');
  });

  it('add with Conditions and Conditions', () => {
    const logical1 = Condition.not(condition1);
    const logical3 = Condition.and(logical1, condition2, condition3);
    expect(logical3(exp)).toEqual('((NOT #n0 <= :v0) AND #n1 >= :v1 AND #n2 = :v2)');
  });

  it('or with 4 conditions', () => {
    const logical = Condition.or(condition1, condition2, condition3, condition4);
    expect(logical(exp)).toEqual('(#n0 <= :v0 OR #n1 >= :v1 OR #n2 = :v2 OR #n3 <> :v3)');
  });

  it('or with Conditions', () => {
    const logical1 = Condition.not(condition1);
    const logical2 = Condition.or(condition2, condition3);
    const logical3 = Condition.or(logical1, logical2);
    expect(logical3(exp)).toEqual('((NOT #n0 <= :v0) OR (#n1 >= :v1 OR #n2 = :v2))');
  });

  it('or with Conditions and Conditions', () => {
    const logical1 = Condition.not(condition1);
    const logical3 = Condition.or(logical1, condition2, condition3);
    expect(logical3(exp)).toEqual('((NOT #n0 <= :v0) OR #n1 >= :v1 OR #n2 = :v2)');
  });

  it('addAndParam with undefined conditions', () => {
    expect(Condition.addAndParam(undefined, new ConditionExpression(), {})).toEqual({});
  });

  it('addAndParam with empty conditions', () => {
    expect(Condition.addAndParam([], new ConditionExpression(), {})).toEqual({});
  });
  it('addAndParam with single conditions', () => {
    const condition = Condition.eq('path1', 'value1');
    expect(Condition.addAndParam([condition], new ConditionExpression(), {})).toEqual({
      ConditionExpression: '#n0 = :v0',
    });
  });

  it('addAndParam with two conditions', () => {
    const conditions = [Condition.eq('path1', 'value1'), Condition.gt('path2', 'value2')];
    expect(Condition.addAndParam(conditions, new ConditionExpression(), {})).toEqual({
      ConditionExpression: '#n0 = :v0 AND #n1 > :v1',
    });
  });

  it('addAndFilterParam with undefined conditions', () => {
    expect(Condition.addAndFilterParam(undefined, new ConditionExpression(), {})).toEqual({});
  });

  it('addAndFilterParam with empty conditions', () => {
    expect(Condition.addAndFilterParam([], new ConditionExpression(), {})).toEqual({});
  });
  it('addAndFilterParam with single conditions', () => {
    const condition = Condition.eq('path1', 'value1');
    expect(Condition.addAndFilterParam([condition], new ConditionExpression(), {})).toEqual({
      FilterExpression: '#n0 = :v0',
    });
  });

  it('addAndFilterParam with two conditions', () => {
    const conditions = [Condition.eq('path1', 'value1'), Condition.gt('path2', 'value2')];
    expect(Condition.addAndFilterParam(conditions, new ConditionExpression(), {})).toEqual({
      FilterExpression: '#n0 = :v0 AND #n1 > :v1',
    });
  });
});
