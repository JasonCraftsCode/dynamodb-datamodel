import { ExpressionAttributes } from '../src/ExpressionAttributes';

it('Validate ExpressionAttributes exports', () => {
  expect(typeof ExpressionAttributes).toBe('function');
});

it('Validate isValidAttributeName ', () => {
  expect(ExpressionAttributes.isValidAttributeName('a')).toBeTruthy();
  expect(ExpressionAttributes.isValidAttributeName('a0')).toBeTruthy();
  expect(ExpressionAttributes.isValidAttributeName('0')).toBeFalsy();
  expect(ExpressionAttributes.isValidAttributeName('-')).toBeFalsy();
});

describe('Validate ExpressionAttributes', () => {
  it('addPath for simple name treatNameAsPath=false', () => {
    const attrs = new ExpressionAttributes();
    attrs.treatNameAsPath = false;
    expect(attrs.addPath('path')).toEqual('#n0');
    expect(attrs.getPaths()).toEqual({ '#n0': 'path' });
  });
  it('addPath for simple name', () => {
    const attrs = new ExpressionAttributes();
    expect(attrs.addPath('path')).toEqual('#n0');
    expect(attrs.getPaths()).toEqual({ '#n0': 'path' });
  });
  it('addPath for two part path', () => {
    const attrs = new ExpressionAttributes();
    expect(attrs.addPath('path.subpath')).toEqual('#n0.#n1');
    expect(attrs.getPaths()).toEqual({ '#n0': 'path', '#n1': 'subpath' });
  });
  it('addPath for 10 part path', () => {
    const attrs = new ExpressionAttributes();
    expect(attrs.addPath('path.l1.l2.l3.l4.l5.l6.l7.l8.l9')).toEqual('#n0.#n1.#n2.#n3.#n4.#n5.#n6.#n7.#n8.#n9');
    expect(attrs.getPaths()).toEqual({
      '#n0': 'path',
      '#n1': 'l1',
      '#n2': 'l2',
      '#n3': 'l3',
      '#n4': 'l4',
      '#n5': 'l5',
      '#n6': 'l6',
      '#n7': 'l7',
      '#n8': 'l8',
      '#n9': 'l9',
    });
  });
  it('addPath for array', () => {
    const attrs = new ExpressionAttributes();
    expect(attrs.addPath('path[1]')).toEqual('#n0[1]');
    expect(attrs.getPaths()).toEqual({ '#n0': 'path' });
  });
  it('addPath for 3 dimensional array', () => {
    const attrs = new ExpressionAttributes();
    expect(attrs.addPath('path[3][2][1]')).toEqual('#n0[3][2][1]');
    expect(attrs.getPaths()).toEqual({ '#n0': 'path' });
  });
  it('addPath for multi component', () => {
    const attrs = new ExpressionAttributes();
    expect(attrs.addPath('path.l1[1].l2.l3[2][1].l4.l5')).toEqual('#n0.#n1[1].#n2.#n3[2][1].#n4.#n5');
    expect(attrs.getPaths()).toEqual({
      '#n0': 'path',
      '#n1': 'l1',
      '#n2': 'l2',
      '#n3': 'l3',
      '#n4': 'l4',
      '#n5': 'l5',
    });
  });

  it('addPath with isReservedName', () => {
    const attrs = new ExpressionAttributes();
    attrs.isReservedName = () => true;
    expect(attrs.addPath('path')).toEqual('#path');
    expect(attrs.getPaths()).toEqual({ '#path': 'path' });
  });
  it('addPath with isValidName', () => {
    const attrs = new ExpressionAttributes();
    attrs.isValidName = () => true;
    expect(attrs.addPath('path')).toEqual('path');
    expect(attrs.getPaths()).toEqual({});
  });

  it('addValue string', () => {
    const attrs = new ExpressionAttributes();
    expect(attrs.addValue('value')).toEqual(':v0');
    expect(attrs.getValues()).toEqual({ ':v0': 'value' });
  });
  it('addValue number', () => {
    const attrs = new ExpressionAttributes();
    expect(attrs.addValue(3)).toEqual(':v0');
    expect(attrs.getValues()).toEqual({ ':v0': 3 });
  });
  it('addValue boolean', () => {
    const attrs = new ExpressionAttributes();
    expect(attrs.addValue(true)).toEqual(':v0');
    expect(attrs.getValues()).toEqual({ ':v0': true });
  });
  it('addValue null', () => {
    const attrs = new ExpressionAttributes();
    expect(attrs.addValue(null)).toEqual(':v0');
    expect(attrs.getValues()).toEqual({ ':v0': null });
  });
  it('addValue Buffer', () => {
    const attrs = new ExpressionAttributes();
    const value = Buffer.from('buffer');
    expect(attrs.addValue(value)).toEqual(':v0');
    expect(attrs.getValues()).toEqual({ ':v0': value });
  });
  it('addValue Object', () => {
    const attrs = new ExpressionAttributes();
    expect(attrs.addValue({ name1: 'value2', name2: 'value2' })).toEqual(':v0');
    expect(attrs.getValues()).toEqual({
      ':v0': { name1: 'value2', name2: 'value2' },
    });
  });
  it('addValue Array', () => {
    const attrs = new ExpressionAttributes();
    expect(attrs.addValue(['value2', 'value2'])).toEqual(':v0');
    expect(attrs.getValues()).toEqual({
      ':v0': ['value2', 'value2'],
    });
  });
  it('addValue Set<string>', () => {
    const attrs = new ExpressionAttributes();
    const value = new Set<string>(['a', 'b', 'c']);
    expect(attrs.addValue(value)).toEqual(':v0');
    expect(attrs.getValues()).toEqual({ ':v0': value });
  });
  it('addValue Set<number>', () => {
    const attrs = new ExpressionAttributes();
    const value = new Set<number>([1, 2, 3]);
    expect(attrs.addValue(value)).toEqual(':v0');
    expect(attrs.getValues()).toEqual({ ':v0': value });
  });
  it('addValue Set<Buffer>', () => {
    const attrs = new ExpressionAttributes();
    const buff1 = Buffer.from('buffer1');
    const buff2 = Buffer.from('buffer2');
    const value = new Set<Buffer>([buff1, buff2]);
    expect(attrs.addValue(value)).toEqual(':v0');
    expect(attrs.getValues()).toEqual({ ':v0': value });
  });

  it('getPaths', () => {
    const attrs = new ExpressionAttributes();
    attrs.addPath('path1');
    attrs.addPath('path2');
    expect(attrs.getPaths()).toEqual({ '#n0': 'path1', '#n1': 'path2' });
  });

  it('getValues', () => {
    const attrs = new ExpressionAttributes();
    attrs.addValue('value1');
    attrs.addValue(2);
    expect(attrs.getValues()).toEqual({ ':v0': 'value1', ':v1': 2 });
  });

  it('reset', () => {
    const attrs = new ExpressionAttributes();
    attrs.addPath('path1');
    attrs.addValue('value1');
    expect(attrs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attrs.getValues()).toEqual({ ':v0': 'value1' });
    attrs.reset();
    expect(attrs.getPaths()).toEqual({});
    expect(attrs.getValues()).toEqual({});
    attrs.addPath('path1');
    attrs.addValue('value1');
    expect(attrs.getPaths()).toEqual({ '#n0': 'path1' });
    expect(attrs.getValues()).toEqual({ ':v0': 'value1' });
  });
});
