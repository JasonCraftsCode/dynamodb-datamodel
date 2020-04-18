import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import * as yup from 'yup';
import * as joi from '@hapi/joi';

import { ExpressionAttributes } from '../src/ExpressionAttributes';
import { Fields } from '../src/Fields';
import { Model } from '../src/Model';
import { Table } from '../src/Table';
import { Update, UpdateExpression } from '../src/Update';

const client = new DocumentClient({ convertEmptyValues: true });

interface TableKey {
  P: Table.PrimaryKey.PartitionString;
  S?: Table.PrimaryKey.SortString;
}

const table = Table.createTable<TableKey, TableKey>({
  name: 'MainTable',
  keyAttributes: {
    P: Table.PrimaryKey.StringType,
    S: Table.PrimaryKey.StringType,
  },
  keySchema: {
    P: Table.PrimaryKey.PartitionKeyType,
    S: Table.PrimaryKey.SortKeyType,
  },
  client,
});

interface ChildModel {
  name: string;
  age: number;
  adult: boolean;
}

const childSchema = {
  name: Fields.string(),
  age: Fields.number(),
  adult: Fields.boolean(),
};

interface SpouseModel {
  name: string;
  age: number;
  married: boolean;
}

const spouseSchema = {
  name: Fields.string(),
  age: Fields.number(),
  married: Fields.boolean(),
};

enum Role {
  Guest = 0,
  Member = 1,
  Leader = 2,
  Admin = 3,
}

interface GroupModel {
  role: Role;
}

const groupSchema = {
  role: Fields.number(),
};

describe('When FieldBase', () => {
  it('expect init sets name', () => {
    const initField = Fields.string();
    initField.init('initField');
    expect(initField.name).toEqual('initField');
  });

  it('yup expect validate invalid value to throw', async () => {
    const field = Fields.number().yup(yup.number().min(1).max(2));
    await expect(field.validate(0)).rejects.toThrowError(new Error('this must be greater than or equal to 1'));
  });

  it('yup with coerce expect return value coerce', async () => {
    const field = Fields.number().coerce().yup(yup.number().min(1).max(10));
    await expect(field.validate('5' as any)).resolves.toEqual(5);
  });

  it('joi expect validate invalid value to throw', async () => {
    const field = Fields.number().joi(joi.number().min(1).max(2));
    await expect(field.validate(0)).rejects.toThrowError(new Error('"value" must be larger than or equal to 1'));
  });

  it('joi with coerce expect return value coerce', async () => {
    const field = Fields.number().joi(joi.number().min(1).max(10)).coerce();
    await expect(field.validate('5' as any)).resolves.toEqual(5);
  });

  it('regex expect validate invalid value to throw', async () => {
    const field = Fields.string().regex(/^[A-Za-z][A-Za-z0-9]*$/);
    await expect(field.validate('0f')).rejects.toThrowError(
      new Error("value must match regex: '/^[A-Za-z][A-Za-z0-9]*$/'"),
    );
  });

  it('regex expect validate to return value', async () => {
    const field = Fields.string().regex(/^[A-Za-z][A-Za-z0-9]*$/);
    await expect(field.validate('ff')).resolves.toEqual('ff');
  });

  it('validator always throw expect to throw', async () => {
    const field = Fields.string().validator((value: string) => {
      return new Promise<string | void>((resolve, reject) => {
        reject(new Error(`always throw`));
      });
    });
    await expect(field.validate('abc')).rejects.toThrowError(new Error('always throw'));
  });

  it('updateValidator with does not throw expect success', async () => {
    const field = Fields.string().updateValidator((value: Model.ModelUpdateValue<string>) => {
      return new Promise<string | void>((resolve, reject) => {
        resolve('abc');
      });
    });
    await expect(field.validateUpdate('abc')).resolves.toEqual('abc');
  });

  it('updateValidator always throw expect to throw', async () => {
    const field = Fields.string().updateValidator((value: any) => {
      return new Promise<void>((resolve, reject) => {
        reject(new Error(`always throw`));
      });
    });
    await expect(field.validateUpdate('abc')).rejects.toThrowError(new Error('always throw'));
  });

  it('coerce expects to be set', () => {
    expect(Fields.string().coerce()._coerce).toEqual(true);
    expect(Fields.string().coerce(true)._coerce).toEqual(true);
  });

  it('hidden expects to be set', () => {
    expect(Fields.string().hidden()._hidden).toEqual(true);
    expect(Fields.string().hidden(true)._hidden).toEqual(true);
  });

  it('required expects to be set', () => {
    expect(Fields.string().required()._required).toEqual(true);
    expect(Fields.string().required(true)._required).toEqual(true);
  });

  it('default expects to be set', () => {
    expect(Fields.string().default('default')._default).toEqual('default');
  });

  it('alias expects to be set', () => {
    expect(Fields.string().alias('alias')._alias).toEqual('alias');
    expect(Fields.string().alias()._alias).toEqual(undefined);
  });

  it('constructor with alias expects alias to be set', () => {
    const field = Fields.string('alias');
    expect(field._alias).toEqual('alias');
  });

  // toTablw
  it('toTable with hidden field expect not in table data', async () => {
    const field = Fields.number().hidden();
    const tabelData: Table.AttributeValuesMap = {};
    await field.toTable('test', { test: '5' }, tabelData, {} as Model.ModelBase);
    expect(tabelData).toEqual({});
  });

  it('toTable with coerce validator expect coerce value', async () => {
    const field = Fields.number().coerce().yup(yup.number().min(1).max(10));
    const tabelData: Table.AttributeValuesMap = {};
    await field.toTable('test', { test: '5' }, tabelData, {} as Model.ModelBase);
    expect(tabelData).toEqual({ test: 5 });
  });

  it('toTable with coerce expect coerce value', async () => {
    const field = Fields.number().coerce();
    const tabelData: Table.AttributeValuesMap = {};
    await field.toTable('test', { test: 8 }, tabelData, {} as Model.ModelBase);
    expect(tabelData).toEqual({ test: 8 });
  });

  // toTableUpdate
  it('toTableUpdate with hidden field expect not in table data', async () => {
    const field = Fields.number().hidden();
    const tabelData: Table.AttributeValuesMap = {};
    await field.toTableUpdate('test', { test: '5' }, tabelData, {} as Model.ModelBase);
    expect(tabelData).toEqual({});
  });

  it('toTableUpdate with coerce validator expect coerce value', async () => {
    const field = Fields.number()
      .coerce()
      .updateValidator((value: Model.ModelUpdateValue<number>) => {
        return new Promise<number | void>((resolve, reject) => {
          resolve(15);
        });
      });
    field.init('test');
    const tabelData: Update.UpdateMapValue = {};
    await field.toTableUpdate('test', { test: '5' }, tabelData, {} as Model.ModelBase);
    expect(tabelData).toEqual({ test: 15 });
  });

  it('toTableUpdate with coerce validator and undefine keep value', async () => {
    const field = Fields.number()
      .coerce()
      .updateValidator((value: Model.ModelUpdateValue<number>) => {
        return new Promise<number | void>((resolve, reject) => {
          resolve();
        });
      });
    field.init('test');
    const tabelData: Update.UpdateMapValue = {};
    await field.toTableUpdate('test', { test: '5' }, tabelData, {} as Model.ModelBase);
    expect(tabelData).toEqual({ test: '5' });
  });

  it('toTableUpdate with coerce expect coerce value', async () => {
    const field = Fields.number().coerce();
    const tabelData: Table.AttributeValuesMap = {};
    await field.toTableUpdate('test', { test: 9 }, tabelData, {} as Model.ModelBase);
    expect(tabelData).toEqual({ test: 9 });
  });

  // toTable
  it('required field missing from model expect toTable to throw', async () => {
    const field = Fields.string().required();
    field.init('test');
    await expect(field.toTable('test', {}, {}, {} as Model.ModelBase)).rejects.toThrowError(
      new Error('Field test is required'),
    );
  });

  it('toTable with default expects default return', async () => {
    const field = Fields.string().default('default');
    const tabelData: Table.AttributeValuesMap = {};
    await field.toTable('test', {}, tabelData, {} as Model.ModelBase);
    expect(tabelData).toEqual({ test: 'default' });
  });

  it('toTable with default function expects default return', async () => {
    const field = Fields.string().default((name, tableData, modelData, model) => {
      return name + '-default';
    });
    const tabelData: Table.AttributeValuesMap = {};
    await field.toTable('test', {}, tabelData, {} as Model.ModelBase);
    expect(tabelData).toEqual({ test: 'test-default' });
  });
});

describe('When FieldExpression', () => {
  const field = Fields.string();
  field.init('string');

  // Condition
  it('expect path returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.path()(exp)).toEqual('#n0');
  });

  it('expect eq returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.eq('xyz')(exp)).toEqual('#n0 = :v0');
  });

  it('expect ne returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.ne('xyz')(exp)).toEqual('#n0 <> :v0');
  });

  it('expect lt returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.lt('xyz')(exp)).toEqual('#n0 < :v0');
  });

  it('expect le returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.le('xyz')(exp)).toEqual('#n0 <= :v0');
  });

  it('expect gt returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.gt('xyz')(exp)).toEqual('#n0 > :v0');
  });

  it('expect ge returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.ge('xyz')(exp)).toEqual('#n0 >= :v0');
  });

  it('expect between returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.between('a', 'z')(exp)).toEqual('#n0 BETWEEN :v0 AND :v1');
  });

  it('expect in returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.in(['a', 'z'])(exp)).toEqual('#n0 IN (:v0, :v1)');
  });

  it('expect typeOf returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.typeOf('S')(exp)).toEqual('attribute_type(#n0, :v0)');
  });

  it('expect exists returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.exists()(exp)).toEqual('attribute_exists(#n0)');
  });

  it('expect notExists returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.notExists()(exp)).toEqual('attribute_not_exists(#n0)');
  });

  // Update
  it('expect getPath returns update expression', () => {
    const exp = new UpdateExpression();
    expect(field.getPath('path')('string', exp)).toEqual('#n0');
  });

  it('expect getPath with default returns update expression', () => {
    const exp = new UpdateExpression();
    expect(field.getPath('path', 'default')('string', exp)).toEqual('if_not_exists(#n0, :v0)');
  });

  it('expect del with default returns update expression', () => {
    const exp = new UpdateExpression();
    field.del()('string', exp);
    expect(exp.buildExpression()).toEqual('REMOVE string');
  });

  it('expect set returns update expression', () => {
    const exp = new UpdateExpression();
    field.set('setString')('string', exp);
    expect(exp.buildExpression()).toEqual('SET string = :v0');
  });

  it('expect setDefault returns update expression', () => {
    const exp = new UpdateExpression();
    field.setDefault('setString')('string', exp);
    expect(exp.buildExpression()).toEqual('SET string = if_not_exists(string, :v0)');
  });
});

describe('When FieldString', () => {
  const field = Fields.string();
  field.init('string');

  it('expect size returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.size()(exp)).toEqual('size(#n0)');
  });

  it('expect contains returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.contains('xyz')(exp)).toEqual('contains(#n0, :v0)');
  });

  it('expect beginsWith returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.beginsWith('xyz')(exp)).toEqual('begins_with(#n0, :v0)');
  });
});

describe('When FieldNumber', () => {
  const field = Fields.number();
  field.init('number');

  it('expect inc returns update expression', () => {
    const exp = new UpdateExpression();
    field.inc(1)('number', exp);
    expect(exp.buildExpression()).toEqual('SET number = number + :v0');
  });

  it('expect dec returns update expression', () => {
    const exp = new UpdateExpression();
    field.dec(1)('number', exp);
    expect(exp.buildExpression()).toEqual('SET number = number - :v0');
  });

  it('expect add returns update expression', () => {
    const exp = new UpdateExpression();
    field.add('number2', 1)('number', exp);
    expect(exp.buildExpression()).toEqual('SET number = #n0 + :v0');
  });

  it('expect sub returns update expression', () => {
    const exp = new UpdateExpression();
    field.sub('number2', 1)('number', exp);
    expect(exp.buildExpression()).toEqual('SET number = #n0 - :v0');
  });
});

describe('When FieldBinary', () => {
  const field = Fields.binary();
  field.init('binary');

  it('expect size returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.size()(exp)).toEqual('size(#n0)');
  });
});

describe('When FieldBoolean', () => {
  const field = Fields.boolean();
  field.init('boolean');

  it('expect boolean returns correct type', () => {
    expect(field.type).toEqual('BOOL');
    expect(field.name).toEqual('boolean');
  });
});

describe('When FieldSet', () => {
  const field = Fields.stringSet();
  field.init('set');

  it('expect stringSet returns correct type', () => {
    expect(field.type).toEqual('SS');
    expect(field.name).toEqual('set');
  });

  it('expect numberSet returns correct type', () => {
    const field1 = Fields.numberSet();
    expect(field1.type).toEqual('NS');
  });

  it('expect binarySet returns correct type', () => {
    const field1 = Fields.binarySet();
    expect(field1.type).toEqual('BS');
  });

  it('expect size returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.size()(exp)).toEqual('size(#n0)');
  });

  it('expect contains returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.contains('xyz')(exp)).toEqual('contains(#n0, :v0)');
  });

  it('expect add returns update expression', () => {
    const exp = new UpdateExpression();
    field.add(table.createStringSet(['abc', 'dev']))('set', exp);
    expect(exp.buildExpression()).toEqual('ADD set :v0');
  });

  it('expect remove returns update expression', () => {
    const exp = new UpdateExpression();
    field.remove(table.createStringSet(['abc', 'dev']))('set', exp);
    expect(exp.buildExpression()).toEqual('DELETE set :v0');
  });
});

describe('When FieldList', () => {
  const field = Fields.list();
  field.init('list');

  it('expect constructor with alias has alias', () => {
    const field1 = Fields.list('list');
    expect(field1._alias).toEqual('list');
  });

  it('expect size returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.size()(exp)).toEqual('size(#n0)');
  });
});

describe('When FieldListT', () => {
  const field = Fields.listT<ChildModel, 'Child'>('Child', childSchema);
  field.init('children');

  it('expect constructor to init correctly', () => {
    const field1 = Fields.listT<ChildModel, 'Child'>('Child', childSchema, 'children');
    expect(field1._alias).toEqual('children');
    expect(field1.type).toEqual('Child');
    expect(field1.schema.adult.name).toEqual('adult');
  });

  it('expect size returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.size()(exp)).toEqual('size(#n0)');
  });

  it('expect append returns update expression', () => {
    const exp = new UpdateExpression();
    field.append([{ name: 'child1', adult: false, age: 5 }])('children', exp);
    expect(exp.buildExpression()).toEqual('SET children = list_append(children, :v0)');
  });

  it('expect prepend returns update expression', () => {
    const exp = new UpdateExpression();
    field.prepend([{ name: 'child1', adult: false, age: 5 }])('children', exp);
    expect(exp.buildExpression()).toEqual('SET children = list_append(:v0, children)');
  });

  it('expect join returns update expression', () => {
    const exp = new UpdateExpression();
    field.join('stepchildren', [{ name: 'child1', adult: false, age: 5 }])('children', exp);
    expect(exp.buildExpression()).toEqual('SET children = list_append(#n0, :v0)');
  });

  it('expect delIndexes returns update expression', () => {
    const exp = new UpdateExpression();
    field.delIndexes([0, 1])('children', exp);
    expect(exp.buildExpression()).toEqual('REMOVE children[0], children[1]');
  });

  it('expect setIndexes returns update expression', () => {
    const exp = new UpdateExpression();
    field.setIndexes({ 0: { name: '0child', adult: false, age: 5 } })('children', exp);
    expect(exp.buildExpression()).toEqual('SET children[0] = :v0');
  });
});

describe('When FieldMap', () => {
  const field = Fields.map();
  field.init('map');

  it('expect constructed with alias to have alias', () => {
    const field1 = Fields.map('map');
    expect(field1._alias).toEqual('map');
  });

  it('expect size returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.size()(exp)).toEqual('size(#n0)');
  });

  it('expect map returns update expression', () => {
    const exp = new UpdateExpression();
    field.map({ map: { abc: 'yea', xyz: 'boo' } })('map', exp);
    expect(exp.buildExpression()).toEqual('SET map.#n0 = :v0');
  });
});

describe('When FieldMapT', () => {
  const field = Fields.mapT<GroupModel, 'Groups'>('Groups', groupSchema);
  field.init('groups');
  it('expect size returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.size()(exp)).toEqual('size(#n0)');
  });

  it('expect map returns update expression', () => {
    const exp = new UpdateExpression();
    field.map({ group1: { role: Role.Admin } })('groups', exp);
    expect(exp.buildExpression()).toEqual('SET groups.#n0 = :v0');
  });
});

describe('When FieldObject', () => {
  const field = Fields.object<SpouseModel, 'Spouse'>('Spouse', spouseSchema);
  field.init('spouse');

  it('expect constructed with alias to have alias', () => {
    const field1 = Fields.object<SpouseModel, 'Spouse'>('Spouse', spouseSchema, 'spouse');
    expect(field1._alias).toEqual('spouse');
  });

  it('expect size returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.size()(exp)).toEqual('size(#n0)');
  });

  it('expect map returns update expression', () => {
    const exp = new UpdateExpression();
    field.map({ name: 'abc' })('spouse', exp);
    expect(exp.buildExpression()).toEqual('SET spouse.#n0 = :v0');
  });
});

// FieldDate inherits from FieldBase
describe('When FieldDate', () => {
  const field = Fields.date();
  field.init('date');

  it('expect date returns correct type', () => {
    expect(field.type).toEqual('DATE');
    expect(field.name).toEqual('date');
  });

  it('toModel expect date data', async () => {
    const data: Model.ModelData = {};
    await field.toModel('date', { date: 1585564302000 }, data, {} as Model.ModelBase);
    expect(data).toEqual({ date: new Date(1585564302000000) });
  });

  it('toTable expect date as number', async () => {
    const data: Table.AttributeValuesMap = {};
    await field.toTable('date', { date: new Date(1585574302000000) }, data, {} as Model.ModelBase);
    expect(data).toEqual({ date: 1585574302000 });
  });

  it('toTableUpdate expect date as number', async () => {
    const data: Table.AttributeValuesMap = {};
    await field.toTableUpdate('date', { date: new Date(1585584302000000) }, data, {} as Model.ModelBase);
    expect(data).toEqual({ date: 1585584302000 });
  });
});

describe('When FieldHidden', () => {
  const field = Fields.hidden();
  it('expect hidden returns correct type', () => {
    expect(field._alias).toBeUndefined();
    expect(field.type).toEqual('HIDDEN');
    expect(field._hidden).toEqual(true);
  });
});

describe('When FieldComposite', () => {
  const field = Fields.composite('G0S', 3);

  it('expect composite with delim returns correct type', () => {
    const delim = Fields.composite('L0S', 2, '#');
    expect(delim.alias).toEqual('L0S');
    expect(delim.count).toEqual(2);
    expect(delim.delim).toEqual('#');
  });

  it('expect composite returns correct type', () => {
    expect(field.alias).toEqual('G0S');
    expect(field.count).toEqual(3);
    expect(field.delim).toEqual('.');
  });

  it('expect slot to return FieldCompositeSlot', () => {
    const slot = field.slot(1);
    expect(slot.slot).toEqual(1);
    expect(slot.name).toBeUndefined();
    expect(slot.composite).toBe(field);
  });

  it('slot.toModel expect existing slot to map', async () => {
    const slot = field.slot(1);
    const data: Model.ModelData = {};
    await slot.toModel('split', { G0S: 'part1.part2.part3' }, data, {} as Model.ModelBase);
    expect(data).toEqual({ split: 'part2' });
  });

  it('slot.toModel expect missing slot to skip', async () => {
    const slot = field.slot(2);
    const data: Model.ModelData = {};
    await slot.toModel('split', { G0S: 'part1.part2' }, data, {} as Model.ModelBase);
    expect(data).toEqual({});
  });

  it('slot.toTable expect fields to map to key', async () => {
    const slot2 = field.slot(2);
    const slot1 = field.slot(1);
    const data: Table.AttributeValuesMap = {};
    await slot2.toTable('split2', { split2: 'part2' }, data, {} as Model.ModelBase);
    expect(data).toEqual({ G0S: '..part2' });
    await slot1.toTable('split1', { split1: 'part1' }, data, {} as Model.ModelBase);
    expect(data).toEqual({ G0S: '.part1.part2' });
  });

  it('slot.toTable missing slot expect empty data', async () => {
    const slot = field.slot(1);
    const data: Table.AttributeValuesMap = {};
    await slot.toTable('split', { split1: 'part1' }, data, {} as Model.ModelBase);
    expect(data).toEqual({});
  });

  it('slot.toTable slot is function expect empty data', async () => {
    const slot = field.slot(1);
    const data: Table.AttributeValuesMap = {};
    await slot.toTable('split', { split: () => 'value' }, data, {} as Model.ModelBase);
    expect(data).toEqual({});
  });

  it('slot.toTableUpdate expect fields to map to key', async () => {
    const slot = field.slot(1);
    const data: Table.AttributeValuesMap = {};
    await slot.toTableUpdate('split', { split: 'part1' }, data, {} as Model.ModelBase);
    expect(data).toEqual({ G0S: '.part1.' });
  });
});

describe('When FieldNamedComposite', () => {
  const field = Fields.namedComposite('G0S', {
    city: 0,
    state: 1,
    country: 2,
  });

  it('expect constructed with slots', () => {
    const field1 = Fields.namedComposite(
      'L0S',
      { dollar: 0, cents: 1 },
      {
        dollar: () => new Fields.FieldCompositeSlot(field, 0, 'dollar1'),
        cents: () => new Fields.FieldCompositeSlot(field, 1, 'cents1'),
      },
      '#',
    );
    expect(field1.alias).toEqual('L0S');
    expect(field1.count).toEqual(2);
    expect(field1.delim).toEqual('#');
    expect(field1.map).toEqual({ dollar: 0, cents: 1 });
    expect(Object.keys(field1.slots).length).toEqual(2);
    expect(field1.slots.dollar().name).toEqual('dollar1');
  });

  it('expect correctly constructed', () => {
    expect(field.alias).toEqual('G0S');
    expect(field.count).toEqual(3);
    expect(field.delim).toEqual('.');
    expect(field.map).toEqual({
      city: 0,
      state: 1,
      country: 2,
    });
    expect(Object.keys(field.slots).length).toEqual(3);
  });

  it('expect city slot return correct FieldCompositeSlot', () => {
    const slot = field.slot('city');
    expect(slot.name).toEqual('city');
    expect(slot.slot).toEqual(0);
  });

  it('expect 1 slot return state FieldCompositeSlot', () => {
    const slot = field.slot(1);
    expect(slot.name).toEqual('state');
    expect(slot.slot).toEqual(1);
  });

  it('expect country slot return correct FieldCompositeSlot', () => {
    const slot = field.slots.country();
    expect(slot.name).toEqual('country');
    expect(slot.slot).toEqual(2);
  });
});

describe('When FieldSplit', () => {
  const field = Fields.split(['P', 'S']);
  field.init('split');

  it('expect init correctly', () => {
    expect(field.aliases).toEqual(['P', 'S']);
    expect(field.delim).toEqual('.');
    expect(field.name).toEqual('split');
  });

  it('expect init with delims correctly', () => {
    const field1 = Fields.split(['P', 'S'], ':');
    expect(field1.aliases).toEqual(['P', 'S']);
    expect(field1.delim).toEqual(':');
  });

  it('toModel expect join of all aliases', async () => {
    const data: Model.ModelData = {};
    await field.toModel('split', { P: 'id1', S: 'id2' }, data, {} as Model.ModelBase);
    expect(data).toEqual({ split: 'id1.id2' });
  });

  it('toModel expect join of single aliases', async () => {
    const data: Model.ModelData = {};
    await field.toModel('split', { P: 'id1' }, data, {} as Model.ModelBase);
    expect(data).toEqual({ split: 'id1' });
  });

  it('toModel expect join of first aliases', async () => {
    const data: Model.ModelData = {};
    await field.toModel('split', { S: 'id2' }, data, {} as Model.ModelBase);
    expect(data).toEqual({ split: 'id2' });
  });

  it('toTable expect split of all aliases', async () => {
    const data: Table.AttributeValuesMap = {};
    await field.toTable('split', { split: 'id1.id2' }, data, {} as Model.ModelBase);
    expect(data).toEqual({ P: 'id1', S: 'id2' });
  });

  it('toTable expect split of more then number of aliases', async () => {
    const data: Table.AttributeValuesMap = {};
    await field.toTable('split', { split: 'id1.id2.id3.id4' }, data, {} as Model.ModelBase);
    expect(data).toEqual({ P: 'id1.id2.id3', S: 'id4' });
  });

  it('toTable expect join of first aliases', async () => {
    const data: Table.AttributeValuesMap = {};
    await field.toTable('split', { split: 'id1' }, data, {} as Model.ModelBase);
    expect(data).toEqual({ P: 'id1' });
  });

  it('toTable missing field expect empty data', async () => {
    const data: Table.AttributeValuesMap = {};
    await field.toTable('split', { split1: 'id1' }, data, {} as Model.ModelBase);
    expect(data).toEqual({});
  });

  it('toTable not a string field expect empty data', async () => {
    const data: Table.AttributeValuesMap = {};
    await field.toTable('split', { split: 5.2 }, data, {} as Model.ModelBase);
    expect(data).toEqual({});
  });

  it('toTableUpdate expect join of all aliases', async () => {
    const data: Update.UpdateMapValue = {};
    await field.toTableUpdate('split', { split: 'id1.id2' }, data, {} as Model.ModelBase);
    expect(data).toEqual({ P: 'id1', S: 'id2' });
  });

  it('toTableUpdate expect join of first aliases', async () => {
    const data: Table.AttributeValuesMap = {};
    await field.toTableUpdate('split', { split: 'id1' }, data, {} as Model.ModelBase);
    expect(data).toEqual({ P: 'id1' });
  });
});
