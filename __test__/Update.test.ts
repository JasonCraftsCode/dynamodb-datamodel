import { Update, UpdateExpression, buildUpdateExpression, buildUpdateInput, UpdateMapValue } from '../src/Update';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
var documentClient = new DocumentClient();

it('Validate Condition exports', () => {
  expect(typeof Update).toEqual('function');
  expect(typeof UpdateExpression).toEqual('function');
  expect(typeof buildUpdateExpression).toEqual('function');
});

export function buildUpdate(updateMap: UpdateMapValue, exp = new UpdateExpression()) {
  const update = buildUpdateExpression(updateMap, exp);
  return {
    UpdateExpression: update,
    Paths: exp.getPaths(),
    Values: exp.getValues(),
  };
}

describe('Validate buildUpdateExpression for each type', () => {
  const exp = new UpdateExpression();
  beforeEach(() => {
    exp.reset();
  });

  it('buildUpdateInput', () => {
    expect(buildUpdateInput({ testString: 'string' }, exp)).toEqual({
      UpdateExpression: 'SET #n0 = :v0',
      ExpressionAttributeNames: { '#n0': 'testString' },
      ExpressionAttributeValues: { ':v0': 'string' },
    });
  });

  it('buildUpdateInput with no exp', () => {
    expect(buildUpdateInput({ testString: 'string' })).toEqual({
      UpdateExpression: 'SET #n0 = :v0',
      ExpressionAttributeNames: { '#n0': 'testString' },
      ExpressionAttributeValues: { ':v0': 'string' },
    });
  });

  it('set string', () => {
    expect(buildUpdate({ testString: 'string' }, exp)).toEqual({
      UpdateExpression: 'SET #n0 = :v0',
      Paths: { '#n0': 'testString' },
      Values: { ':v0': 'string' },
    });
  });

  it('set number', () => {
    expect(buildUpdate({ testNumber: 8 }, exp)).toEqual({
      UpdateExpression: 'SET #n0 = :v0',
      Paths: { '#n0': 'testNumber' },
      Values: { ':v0': 8 },
    });
  });
});

describe('Validate buildUpdateExpression', () => {
  const exp = new UpdateExpression();
  beforeEach(() => {
    exp.reset();
  });

  it('set values', () => {
    const input = {
      testString: 'string',
      testNumber: 10,
      testBoolean: true,
      testBinary: Buffer.from('the buffer'),
      testStringSet: documentClient.createSet(['abc', 'def', 'xyz'], {
        validate: true,
      }),
      testNumberSet: documentClient.createSet([1, 3, 6], { validate: true }),
      testBinarySet: documentClient.createSet([Buffer.from('asdf'), Buffer.from('flmvc')], { validate: true }),
      testList: [1, 'string', true],
      testMap: { tbool: true, tstring: 'str', tmap: { tnumber: 8 } },
      testNull: null,
    };
    const update = buildUpdateExpression(input, exp);
    expect(update).toEqual(
      'SET #n0 = :v0, #n1 = :v1, #n2 = :v2, #n3 = :v3, #n4 = :v4, #n5 = :v5, #n6 = :v6, #n7 = :v7, #n8 = :v8 REMOVE #n9',
    );
    expect({ remove: exp.removeList, set: exp.setList }).toEqual({
      remove: ['#n9'],
      set: [
        '#n0 = :v0',
        '#n1 = :v1',
        '#n2 = :v2',
        '#n3 = :v3',
        '#n4 = :v4',
        '#n5 = :v5',
        '#n6 = :v6',
        '#n7 = :v7',
        '#n8 = :v8',
      ],
    });
    expect(exp.getPaths()).toEqual({
      '#n0': 'testString',
      '#n1': 'testNumber',
      '#n2': 'testBoolean',
      '#n3': 'testBinary',
      '#n4': 'testStringSet',
      '#n5': 'testNumberSet',
      '#n6': 'testBinarySet',
      '#n7': 'testList',
      '#n8': 'testMap',
      '#n9': 'testNull',
    });
    expect(exp.getValues()).toEqual({
      ':v0': input.testString,
      ':v1': input.testNumber,
      ':v2': input.testBoolean,
      ':v3': input.testBinary,
      ':v4': input.testStringSet,
      ':v5': input.testNumberSet,
      ':v6': input.testBinarySet,
      ':v7': input.testList,
      ':v8': input.testMap,
    });
  });

  it('set paths', () => {
    const input = { testPath: Update.path('testPath2') };
    expect(buildUpdateExpression(input, exp)).toEqual('SET #n0 = #n1');
    expect(exp.getPaths()).toEqual({ '#n0': 'testPath', '#n1': 'testPath2' });
    expect(exp.getValues()).toEqual({});
  });

  it('set pathWithDefault', () => {
    const input = { testPath: Update.pathWithDefault('testPath3', 'default') };
    expect(buildUpdateExpression(input, exp)).toEqual('SET #n0 = if_not_exists(#n1, :v0)');
    expect(exp.getPaths()).toEqual({ '#n0': 'testPath', '#n1': 'testPath3' });
    expect(exp.getValues()).toEqual({ ':v0': 'default' });
  });

  it('set Update values', () => {
    const input = {
      testString: Update.set('string'),
      testNumber: Update.set(10),
      testBoolean: Update.set(true),
      testBinary: Update.set(Buffer.from('the buffer')),
      testStringSet: Update.set(documentClient.createSet(['abc', 'def', 'xyz'], { validate: true })),
      testNumberSet: Update.set(documentClient.createSet([1, 3, 6], { validate: true })),
      testBinarySet: Update.set(
        documentClient.createSet([Buffer.from('asdf'), Buffer.from('flmvc')], {
          validate: true,
        }),
      ),
      testList: Update.set([1, 'string', true]),
      testMap: Update.set({
        tbool: true,
        tstring: 'str',
        tmap: { tnumber: 8 },
      }),
      testDel: Update.del(),
      testFunction: Update.set(Update.path('testFunc1')),
    };
    const update = buildUpdateExpression(input, exp);
    expect(update).toEqual(
      'SET #n0 = :v0, #n1 = :v1, #n2 = :v2, #n3 = :v3, #n4 = :v4, #n5 = :v5, #n6 = :v6, #n7 = :v7, #n8 = :v8, #n10 = #n11 REMOVE #n9',
    );
    expect({ remove: exp.removeList, set: exp.setList }).toEqual({
      remove: ['#n9'],
      set: [
        '#n0 = :v0',
        '#n1 = :v1',
        '#n2 = :v2',
        '#n3 = :v3',
        '#n4 = :v4',
        '#n5 = :v5',
        '#n6 = :v6',
        '#n7 = :v7',
        '#n8 = :v8',
        '#n10 = #n11',
      ],
    });
    expect(exp.getPaths()).toEqual({
      '#n0': 'testString',
      '#n1': 'testNumber',
      '#n2': 'testBoolean',
      '#n3': 'testBinary',
      '#n4': 'testStringSet',
      '#n5': 'testNumberSet',
      '#n6': 'testBinarySet',
      '#n7': 'testList',
      '#n8': 'testMap',
      '#n9': 'testDel',
      '#n10': 'testFunction',
      '#n11': 'testFunc1',
    });
    expect(exp.getValues()).toEqual({
      ':v0': 'string',
      ':v1': 10,
      ':v2': true,
      ':v3': Buffer.from('the buffer'),
      ':v4': documentClient.createSet(['abc', 'def', 'xyz'], {
        validate: true,
      }),
      ':v5': documentClient.createSet([1, 3, 6], { validate: true }),
      ':v6': documentClient.createSet([Buffer.from('asdf'), Buffer.from('flmvc')], { validate: true }),
      ':v7': [1, 'string', true],
      ':v8': {
        tbool: true,
        tstring: 'str',
        tmap: { tnumber: 8 },
      },
    });
  });

  it('set Update default values', () => {
    const input = {
      testString: Update.default('default string'),
      testNumber: Update.default(10),
      testBoolean: Update.default(true),
      testBinary: Update.default(Buffer.from('the buffer')),
      testStringSet: Update.default(documentClient.createSet(['abc', 'def', 'xyz'], { validate: true })),
      testNumberSet: Update.default(documentClient.createSet([1, 3, 6], { validate: true })),
      testBinarySet: Update.default(
        documentClient.createSet([Buffer.from('asdf'), Buffer.from('flmvc')], {
          validate: true,
        }),
      ),
      testList: Update.default([1, 'string', true]),
      testMap: Update.default({
        tbool: true,
        tstring: 'str',
        tmap: { tnumber: 8 },
      }),
    };
    const update = buildUpdateExpression(input, exp);
    expect(update).toEqual(
      'SET #n0 = if_not_exists(#n0, :v0), #n1 = if_not_exists(#n1, :v1), #n2 = if_not_exists(#n2, :v2), #n3 = if_not_exists(#n3, :v3), #n4 = if_not_exists(#n4, :v4), #n5 = if_not_exists(#n5, :v5), #n6 = if_not_exists(#n6, :v6), #n7 = if_not_exists(#n7, :v7), #n8 = if_not_exists(#n8, :v8)',
    );
    expect({ set: exp.setList }).toEqual({
      set: [
        '#n0 = if_not_exists(#n0, :v0)',
        '#n1 = if_not_exists(#n1, :v1)',
        '#n2 = if_not_exists(#n2, :v2)',
        '#n3 = if_not_exists(#n3, :v3)',
        '#n4 = if_not_exists(#n4, :v4)',
        '#n5 = if_not_exists(#n5, :v5)',
        '#n6 = if_not_exists(#n6, :v6)',
        '#n7 = if_not_exists(#n7, :v7)',
        '#n8 = if_not_exists(#n8, :v8)',
      ],
    });
    expect(exp.getPaths()).toEqual({
      '#n0': 'testString',
      '#n1': 'testNumber',
      '#n2': 'testBoolean',
      '#n3': 'testBinary',
      '#n4': 'testStringSet',
      '#n5': 'testNumberSet',
      '#n6': 'testBinarySet',
      '#n7': 'testList',
      '#n8': 'testMap',
    });
    expect(exp.getValues()).toEqual({
      ':v0': 'default string',
      ':v1': 10,
      ':v2': true,
      ':v3': Buffer.from('the buffer'),
      ':v4': documentClient.createSet(['abc', 'def', 'xyz']),
      ':v5': documentClient.createSet([1, 3, 6]),
      ':v6': documentClient.createSet([Buffer.from('asdf'), Buffer.from('flmvc')]),
      ':v7': [1, 'string', true],
      ':v8': {
        tbool: true,
        tstring: 'str',
        tmap: { tnumber: 8 },
      },
    });
  });

  it('inc and dec number values', () => {
    const input = {
      testIncNumber: Update.inc(1),
      testIncString: Update.inc('fromString'),
      testIncPath: Update.inc(Update.path('fromPath')),
      testDecNumber: Update.dec(2),
      testDecString: Update.dec('fromString'),
      testDecPath: Update.dec(Update.path('fromPath')),
    };
    const update = buildUpdateExpression(input, exp);
    expect(update).toEqual(
      'SET #n0 = #n0 + :v0, #n1 = #n1 + #n2, #n3 = #n3 + #n4, #n5 = #n5 - :v1, #n6 = #n6 - #n2, #n7 = #n7 - #n4',
    );
    expect({ set: exp.setList }).toEqual({
      set: [
        '#n0 = #n0 + :v0',
        '#n1 = #n1 + #n2',
        '#n3 = #n3 + #n4',
        '#n5 = #n5 - :v1',
        '#n6 = #n6 - #n2',
        '#n7 = #n7 - #n4',
      ],
    });
    expect(exp.getPaths()).toEqual({
      '#n0': 'testIncNumber',
      '#n1': 'testIncString',
      '#n2': 'fromString',
      '#n3': 'testIncPath',
      '#n4': 'fromPath',
      '#n5': 'testDecNumber',
      '#n6': 'testDecString',
      '#n7': 'testDecPath',
    });
    expect(exp.getValues()).toEqual({
      ':v0': 1,
      ':v1': 2,
    });
  });

  it('add and sub number values', () => {
    const input = {
      testAddLeftString: Update.add('leftString', 1),
      testAddLeftPath: Update.add(Update.path('leftPath'), 2),
      testAddRightString: Update.add(3, 'rightString'),
      testSubLeftString: Update.sub('fromString', 4),
      testSubLeftPath: Update.sub(Update.path('fromPath'), 5),
      testSubRightPath: Update.sub(6, Update.path('fromPath')),
    };
    const update = buildUpdateExpression(input, exp);
    expect(update).toEqual(
      'SET #n0 = #n1 + :v0, #n2 = #n3 + :v1, #n4 = :v2 + #n5, #n6 = #n7 - :v3, #n8 = #n9 - :v4, #n10 = :v5 - #n9',
    );
    expect({ set: exp.setList }).toEqual({
      set: [
        '#n0 = #n1 + :v0',
        '#n2 = #n3 + :v1',
        '#n4 = :v2 + #n5',
        '#n6 = #n7 - :v3',
        '#n8 = #n9 - :v4',
        '#n10 = :v5 - #n9',
      ],
    });
    expect(exp.getPaths()).toEqual({
      '#n0': 'testAddLeftString',
      '#n1': 'leftString',
      '#n10': 'testSubRightPath',
      '#n2': 'testAddLeftPath',
      '#n3': 'leftPath',
      '#n4': 'testAddRightString',
      '#n5': 'rightString',
      '#n6': 'testSubLeftString',
      '#n7': 'fromString',
      '#n8': 'testSubLeftPath',
      '#n9': 'fromPath',
    });
    expect(exp.getValues()).toEqual({
      ':v0': 1,
      ':v1': 2,
      ':v2': 3,
      ':v3': 4,
      ':v4': 5,
      ':v5': 6,
    });
  });

  it('Update List', () => {
    const input = {
      testNumberAppend: Update.append(new Array([1, 2, 3])),
      testNumberPrepend: Update.prepend(new Array([4, 5, 6])),
      testDelIndexes: Update.delIndexes([7, 8, 9]),
      testNumberJoin: Update.join('joinNumberField', new Array([10, 11, 12])),
      testNumberJoin2: Update.join(new Array([13, 14, 15]), 'join2NumberField'),
      testSetNumberIndexes: Update.setIndexes({ 16: 21, 17: 25, 18: 31 }),
      testStringAppend: Update.append(new Array(['a', 'b', 'c'])),
      testStringPrepend: Update.prepend(new Array(['d', 'e', 'f'])),
      testStringJoin: Update.join('joinStringField', new Array(['j', 'k', 'l'])),
      testStringJoin2: Update.join(new Array(['m', 'n', 'o']), 'join2StringField'),
      testBinaryAppend: Update.append(new Array([Buffer.from('abc'), Buffer.from('xyz')])),
      testBinaryPrepend: Update.prepend(new Array([Buffer.from('123'), Buffer.from('789')])),
      testBinaryJoin: Update.join('joinBinaryField', new Array([Buffer.from('MnO'), Buffer.from('qRs')])),
      testBinaryJoin2: Update.join(new Array([Buffer.from('987'), Buffer.from('321')]), 'join2BinaryField'),
      testSetStringIndexes: Update.setIndexes({ 19: 'g', 20: 'h', 21: 'i' }),
    };
    const update = buildUpdateExpression(input, exp);
    expect(update).toEqual(
      'SET #n0 = list_append(#n0, :v0), #n1 = list_append(:v1, #n1), #n3 = list_append(#n4, :v2), #n5 = list_append(:v3, #n6), #n7[16] = :v4, #n7[17] = :v5, #n7[18] = :v6, #n8 = list_append(#n8, :v7), #n9 = list_append(:v8, #n9), #n10 = list_append(#n11, :v9), #n12 = list_append(:v10, #n13), #n14 = list_append(#n14, :v11), #n15 = list_append(:v12, #n15), #n16 = list_append(#n17, :v13), #n18 = list_append(:v14, #n19), #n20[19] = :v15, #n20[20] = :v16, #n20[21] = :v17 REMOVE #n2[7], #n2[8], #n2[9]',
    );
    expect({ remove: exp.removeList, set: exp.setList }).toEqual({
      remove: ['#n2[7]', '#n2[8]', '#n2[9]'],
      set: [
        '#n0 = list_append(#n0, :v0)',
        '#n1 = list_append(:v1, #n1)',
        '#n3 = list_append(#n4, :v2)',
        '#n5 = list_append(:v3, #n6)',
        '#n7[16] = :v4',
        '#n7[17] = :v5',
        '#n7[18] = :v6',
        '#n8 = list_append(#n8, :v7)',
        '#n9 = list_append(:v8, #n9)',
        '#n10 = list_append(#n11, :v9)',
        '#n12 = list_append(:v10, #n13)',
        '#n14 = list_append(#n14, :v11)',
        '#n15 = list_append(:v12, #n15)',
        '#n16 = list_append(#n17, :v13)',
        '#n18 = list_append(:v14, #n19)',
        '#n20[19] = :v15',
        '#n20[20] = :v16',
        '#n20[21] = :v17',
      ],
    });
    expect(exp.getPaths()).toEqual({
      '#n0': 'testNumberAppend',
      '#n1': 'testNumberPrepend',
      '#n10': 'testStringJoin',
      '#n11': 'joinStringField',
      '#n12': 'testStringJoin2',
      '#n13': 'join2StringField',
      '#n14': 'testBinaryAppend',
      '#n15': 'testBinaryPrepend',
      '#n16': 'testBinaryJoin',
      '#n17': 'joinBinaryField',
      '#n18': 'testBinaryJoin2',
      '#n19': 'join2BinaryField',
      '#n2': 'testDelIndexes',
      '#n20': 'testSetStringIndexes',
      '#n3': 'testNumberJoin',
      '#n4': 'joinNumberField',
      '#n5': 'testNumberJoin2',
      '#n6': 'join2NumberField',
      '#n7': 'testSetNumberIndexes',
      '#n8': 'testStringAppend',
      '#n9': 'testStringPrepend',
    });
    expect(exp.getValues()).toEqual({
      ':v0': new Array([1, 2, 3]),
      ':v1': new Array([4, 5, 6]),
      ':v2': new Array([10, 11, 12]),
      ':v3': new Array([13, 14, 15]),
      ':v4': 21,
      ':v5': 25,
      ':v6': 31,
      ':v7': new Array(['a', 'b', 'c']),
      ':v8': new Array(['d', 'e', 'f']),
      ':v9': new Array(['j', 'k', 'l']),
      ':v10': new Array(['m', 'n', 'o']),
      ':v11': new Array([Buffer.from('abc'), Buffer.from('xyz')]),
      ':v12': new Array([Buffer.from('123'), Buffer.from('789')]),
      ':v13': new Array([Buffer.from('MnO'), Buffer.from('qRs')]),
      ':v14': new Array([Buffer.from('987'), Buffer.from('321')]),
      ':v15': 'g',
      ':v16': 'h',
      ':v17': 'i',
    });
  });

  it('Update List with paths', () => {
    const input = {
      testAppendString: Update.append('appendString'),
      testAppendPath: Update.append(Update.path('appendPath')),
      testPrependString: Update.prepend('prependString'),
      testPrependPath: Update.prepend(Update.path('prependPath')),
      testJoinString: Update.join('join1String', 'join2String'),
      testJoinPath: Update.join(Update.path('join1Path'), Update.path('join2Path')),
    };
    const update = buildUpdateExpression(input, exp);
    expect(update).toEqual(
      'SET #n0 = list_append(#n0, #n1), #n2 = list_append(#n2, #n3), #n4 = list_append(#n5, #n4), #n6 = list_append(#n7, #n6), #n8 = list_append(#n9, #n10), #n11 = list_append(#n12, #n13)',
    );
    expect({ set: exp.setList }).toEqual({
      set: [
        '#n0 = list_append(#n0, #n1)',
        '#n2 = list_append(#n2, #n3)',
        '#n4 = list_append(#n5, #n4)',
        '#n6 = list_append(#n7, #n6)',
        '#n8 = list_append(#n9, #n10)',
        '#n11 = list_append(#n12, #n13)',
      ],
    });
    expect(exp.getPaths()).toEqual({
      '#n0': 'testAppendString',
      '#n1': 'appendString',
      '#n10': 'join2String',
      '#n11': 'testJoinPath',
      '#n12': 'join1Path',
      '#n13': 'join2Path',
      '#n2': 'testAppendPath',
      '#n3': 'appendPath',
      '#n4': 'testPrependString',
      '#n5': 'prependString',
      '#n6': 'testPrependPath',
      '#n7': 'prependPath',
      '#n8': 'testJoinString',
      '#n9': 'join1String',
    });
    expect(exp.getValues()).toEqual({});
  });

  it('Update add List', () => {
    const input = {
      testAddToSetString: Update.addToSet(documentClient.createSet(['a', 'b', 'c'])),
      testAddToSetNumber: Update.addToSet(documentClient.createSet([1, 2, 3])),
      testAddToSetBinary: Update.addToSet(
        documentClient.createSet([Buffer.from('abc'), Buffer.from('def'), Buffer.from('ghi')]),
      ),
    };
    const update = buildUpdateExpression(input, exp);
    expect(update).toEqual('ADD #n0 :v0, #n1 :v1, #n2 :v2');
    expect({ add: exp.addList }).toEqual({
      add: ['#n0 :v0', '#n1 :v1', '#n2 :v2'],
    });
    expect(exp.getPaths()).toEqual({
      '#n0': 'testAddToSetString',
      '#n1': 'testAddToSetNumber',
      '#n2': 'testAddToSetBinary',
    });
    expect(exp.getValues()).toEqual({
      ':v0': documentClient.createSet(['a', 'b', 'c']),
      ':v1': documentClient.createSet([1, 2, 3]),
      ':v2': documentClient.createSet([Buffer.from('abc'), Buffer.from('def'), Buffer.from('ghi')]),
    });
  });

  it('Update remove List', () => {
    const input = {
      testRemoveToSetString: Update.removeFromSet(documentClient.createSet(['a', 'b', 'c'])),
      testRemoveToSetNumber: Update.removeFromSet(documentClient.createSet([1, 2, 3])),
      testRemoveToSetBinary: Update.removeFromSet(
        documentClient.createSet([Buffer.from('abc'), Buffer.from('def'), Buffer.from('ghi')]),
      ),
    };
    const update = buildUpdateExpression(input, exp);
    expect(update).toEqual('DELETE #n0 :v0, #n1 :v1, #n2 :v2');
    expect({ del: exp.delList }).toEqual({
      del: ['#n0 :v0', '#n1 :v1', '#n2 :v2'],
    });
    expect(exp.getPaths()).toEqual({
      '#n0': 'testRemoveToSetString',
      '#n1': 'testRemoveToSetNumber',
      '#n2': 'testRemoveToSetBinary',
    });
    expect(exp.getValues()).toEqual({
      ':v0': documentClient.createSet(['a', 'b', 'c']),
      ':v1': documentClient.createSet([1, 2, 3]),
      ':v2': documentClient.createSet([Buffer.from('abc'), Buffer.from('def'), Buffer.from('ghi')]),
    });
  });

  it('Update Map', () => {
    const input = {
      testMap: Update.map({
        l1String: 'l1 string',
        l1Number: 14,
        l1Binary: Buffer.from('abc'),
        l1Boolean: true,
        l1List: [1, 'abc', true],
        l1Map: {
          l2String: 'l2 string',
          l2Number: 25,
          l2Binary: Buffer.from('def'),
          l2Boolean: true,
        },
        l1Undefined: undefined,
      }),
    };
    const update = buildUpdateExpression(input, exp);
    expect(update).toEqual(
      'SET #n0.#n1 = :v0, #n0.#n2 = :v1, #n0.#n3 = :v2, #n0.#n4 = :v3, #n0.#n5 = :v4, #n0.#n6 = :v5',
    );
    expect({ set: exp.setList }).toEqual({
      set: ['#n0.#n1 = :v0', '#n0.#n2 = :v1', '#n0.#n3 = :v2', '#n0.#n4 = :v3', '#n0.#n5 = :v4', '#n0.#n6 = :v5'],
    });
    expect(exp.getPaths()).toEqual({
      '#n0': 'testMap',
      '#n1': 'l1String',
      '#n2': 'l1Number',
      '#n3': 'l1Binary',
      '#n4': 'l1Boolean',
      '#n5': 'l1List',
      '#n6': 'l1Map',
    });
    expect(exp.getValues()).toEqual({
      ':v0': 'l1 string',
      ':v1': 14,
      ':v2': Buffer.from('abc'),
      ':v3': true,
      ':v4': [1, 'abc', true],
      ':v5': {
        l2Binary: Buffer.from('def'),
        l2Boolean: true,
        l2Number: 25,
        l2String: 'l2 string',
      },
    });
  });

  it('Update Map inner expression', () => {
    const input = {
      testMap: Update.map({
        l1Path: Update.path('testMap2.l1'),
        l1DefaultBoolean: Update.default(true),
        l1IncNumber: Update.inc(2),
        l1DecNumber: Update.dec(5),
        l1AddNumber: Update.add('testMap2.l1Number', 5),
        l1SubNumber: Update.sub(5, 'testMap1.l1Number'),
        l1AppendList: Update.append([1, 'abc', true]),
        l1PrependList: Update.prepend([2, 'def', false]),
        l1JoinList: Update.join('testMap1.l1List', [3, 'hij', true]),
        l1DelIndexesList: Update.delIndexes([1, 3, 6]),
        l1SetIndexesList: Update.setIndexes({
          1: 'list string',
          3: 5,
          6: true,
        }),
        l1Map: Update.map({
          l2String: 'l2 string',
          l2Path: Update.path('testMap2.l1'),
          l2IncNumber: Update.inc(2),
          l2Number: 25,
          l2Boolean: true,
          l2Delete: Update.del(),
        }),
        l1Null: null,
        l1Delete: Update.del(),
        l1AddToSetString: Update.addToSet(documentClient.createSet(['a', 'b', 'c'])),
        l1RemoveFromSetNumber: Update.removeFromSet(documentClient.createSet([11, 12, 13])),
      }),
    };
    const update = buildUpdateExpression(input, exp);
    expect(update).toEqual(
      'SET #n0.#n1 = #n2.#n3, #n0.#n4 = if_not_exists(#n0.#n4, :v0), #n0.#n5 = #n0.#n5 + :v1, #n0.#n6 = #n0.#n6 - :v2, #n0.#n7 = #n2.#n8 + :v3, #n0.#n9 = :v4 - #n10.#n8, #n0.#n11 = list_append(#n0.#n11, :v5), #n0.#n12 = list_append(:v6, #n0.#n12), #n0.#n13 = list_append(#n10.#n14, :v7), #n0.#n16[1] = :v8, #n0.#n16[3] = :v9, #n0.#n16[6] = :v10, #n0.#n17.#n18 = :v11, #n0.#n17.#n19 = #n2.#n3, #n0.#n17.#n20 = #n0.#n17.#n20 + :v12, #n0.#n17.#n21 = :v13, #n0.#n17.#n22 = :v14 REMOVE #n0.#n15[1], #n0.#n15[3], #n0.#n15[6], #n0.#n17.#n23, #n0.#n24, #n0.#n25 ADD #n0.#n26 :v15 DELETE #n0.#n27 :v16',
    );
    expect({
      add: exp.addList,
      del: exp.delList,
      remove: exp.removeList,
      set: exp.setList,
    }).toEqual({
      add: ['#n0.#n26 :v15'],
      del: ['#n0.#n27 :v16'],
      remove: ['#n0.#n15[1]', '#n0.#n15[3]', '#n0.#n15[6]', '#n0.#n17.#n23', '#n0.#n24', '#n0.#n25'],
      set: [
        '#n0.#n1 = #n2.#n3',
        '#n0.#n4 = if_not_exists(#n0.#n4, :v0)',
        '#n0.#n5 = #n0.#n5 + :v1',
        '#n0.#n6 = #n0.#n6 - :v2',
        '#n0.#n7 = #n2.#n8 + :v3',
        '#n0.#n9 = :v4 - #n10.#n8',
        '#n0.#n11 = list_append(#n0.#n11, :v5)',
        '#n0.#n12 = list_append(:v6, #n0.#n12)',
        '#n0.#n13 = list_append(#n10.#n14, :v7)',
        '#n0.#n16[1] = :v8',
        '#n0.#n16[3] = :v9',
        '#n0.#n16[6] = :v10',
        '#n0.#n17.#n18 = :v11',
        '#n0.#n17.#n19 = #n2.#n3',
        '#n0.#n17.#n20 = #n0.#n17.#n20 + :v12',
        '#n0.#n17.#n21 = :v13',
        '#n0.#n17.#n22 = :v14',
      ],
    });
    expect(exp.getPaths()).toEqual({
      '#n0': 'testMap',
      '#n1': 'l1Path',
      '#n10': 'testMap1',
      '#n11': 'l1AppendList',
      '#n12': 'l1PrependList',
      '#n13': 'l1JoinList',
      '#n14': 'l1List',
      '#n15': 'l1DelIndexesList',
      '#n16': 'l1SetIndexesList',
      '#n17': 'l1Map',
      '#n18': 'l2String',
      '#n19': 'l2Path',
      '#n2': 'testMap2',
      '#n20': 'l2IncNumber',
      '#n21': 'l2Number',
      '#n22': 'l2Boolean',
      '#n23': 'l2Delete',
      '#n24': 'l1Null',
      '#n25': 'l1Delete',
      '#n26': 'l1AddToSetString',
      '#n27': 'l1RemoveFromSetNumber',
      '#n3': 'l1',
      '#n4': 'l1DefaultBoolean',
      '#n5': 'l1IncNumber',
      '#n6': 'l1DecNumber',
      '#n7': 'l1AddNumber',
      '#n8': 'l1Number',
      '#n9': 'l1SubNumber',
    });
    expect(exp.getValues()).toEqual({
      ':v0': true,
      ':v1': 2,
      ':v10': true,
      ':v11': 'l2 string',
      ':v12': 2,
      ':v13': 25,
      ':v14': true,
      ':v15': documentClient.createSet(['a', 'b', 'c']),
      ':v16': documentClient.createSet([11, 12, 13]),
      ':v2': 5,
      ':v3': 5,
      ':v4': 5,
      ':v5': [1, 'abc', true],
      ':v6': [2, 'def', false],
      ':v7': [3, 'hij', true],
      ':v8': 'list string',
      ':v9': 5,
    });
  });

  it('Update Map subpath', () => {
    const input = {
      testMap: Update.map({
        'l1List[5]': 'l1 string',
        'l1.l2.l3': 'l3 value',
        'l1.l2[3].l3': 'l3 value in list',
        'l1.l2.l3Inc': Update.inc(4),
        'l1.l3.l3.l4Null': null,
        'l1.l2[1][2][3]': '3d array',
      }),
    };
    const update = buildUpdateExpression(input, exp);
    expect(update).toEqual(
      'SET #n0.#n1[5] = :v0, #n0.#n2.#n3.#n4 = :v1, #n0.#n2.#n3[3].#n4 = :v2, #n0.#n2.#n3.#n5 = #n0.#n2.#n3.#n5 + :v3, #n0.#n2.#n3[1][2][3] = :v4 REMOVE #n0.#n2.#n4.#n4.#n6',
    );
    expect({ remove: exp.removeList, set: exp.setList }).toEqual({
      remove: ['#n0.#n2.#n4.#n4.#n6'],
      set: [
        '#n0.#n1[5] = :v0',
        '#n0.#n2.#n3.#n4 = :v1',
        '#n0.#n2.#n3[3].#n4 = :v2',
        '#n0.#n2.#n3.#n5 = #n0.#n2.#n3.#n5 + :v3',
        '#n0.#n2.#n3[1][2][3] = :v4',
      ],
    });
    expect(exp.getPaths()).toEqual({
      '#n0': 'testMap',
      '#n1': 'l1List',
      '#n2': 'l1',
      '#n3': 'l2',
      '#n4': 'l3',
      '#n5': 'l3Inc',
      '#n6': 'l4Null',
    });
    expect(exp.getValues()).toEqual({
      ':v0': 'l1 string',
      ':v1': 'l3 value',
      ':v2': 'l3 value in list',
      ':v3': 4,
      ':v4': '3d array',
    });
  });
});
