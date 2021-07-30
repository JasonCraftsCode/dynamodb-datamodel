import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { ConditionExpression } from '../src/Condition';
import { ExpressionAttributes } from '../src/ExpressionAttributes';
import { Fields } from '../src/Fields';
import { Model } from '../src/Model';
import { Table } from '../src/Table';
import { Update } from '../src/Update';
import { buildUpdateParams } from './testCommon';

const client = new DocumentClient({ convertEmptyValues: true });

const table = {
  createSet(
    list: string[] | number[] | Table.BinaryValue[],
    options?: DocumentClient.CreateSetOptions,
  ): Table.AttributeSetValues {
    return client.createSet(list, options);
  },
};
const model = { name: 'MyModel', table } as Model;
function getTableContext(action: Table.ItemActions, scope: Fields.ActionScope = 'single'): Fields.TableContext {
  return {
    action,
    scope,
    conditions: [],
    model,
    options: {} as Table.BaseOptions,
  } as Fields.TableContext;
}
const modelContext = { model } as unknown as Fields.ModelContext;
const tableContext = getTableContext('get');
const putTableContext = getTableContext('put');
const putNewTableContext = getTableContext('put-new');
const putReplaceTableContext = getTableContext('put-replace');
const updateTableContext = getTableContext('update');

function createConditionExpression(): ConditionExpression {
  return new ConditionExpression(new ExpressionAttributes());
}

interface ChildModel {
  name: string;
  age: number;
  adult: boolean;
}

const childSchema = {
  name: Fields.string({ alias: 'n' }),
  age: Fields.number(),
  adult: Fields.boolean(),
};

interface SpouseModel {
  name: string;
  age: number;
  married: boolean;
}

const spouseSchema = {
  name: Fields.string({ alias: 'n' }),
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
  name: Update.String;
}

const groupSchema = {
  role: Fields.number({ alias: 'r' }),
  name: Fields.string(),
};

describe('When FieldBase', () => {
  it('expect init sets name', () => {
    const field = Fields.string();
    field.init('initField', model);
    expect(field.name).toEqual('initField');
  });

  it('alias expects to be set', () => {
    const field = Fields.string({ alias: 'alias' });
    expect(field.alias).toEqual('alias');
  });

  it('default value expects to be set', () => {
    const field = Fields.string({ default: 'default' });
    expect(field.default).toEqual('default');
    expect(field.getDefault('', {} as Model.ModelData, {} as Fields.TableContext)).toEqual('default');
  });

  it('default function expects to be set', () => {
    const field = Fields.string({ default: () => 'default' });
    expect(typeof field.default).toEqual('function');
    expect(field.getDefault('', {} as Model.ModelData, {} as Fields.TableContext)).toEqual('default');
  });
});

describe('When FieldExpression', () => {
  const field = Fields.string();
  field.init('string', model);

  // Condition
  it('expect path returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.path()(exp, 'S')).toEqual('#n0');
  });

  it('expect eq returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.eq('xyz')(exp, 'BOOL')).toEqual('#n0 = :v0');
  });

  it('expect ne returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.ne('xyz')(exp, 'BOOL')).toEqual('#n0 <> :v0');
  });

  it('expect lt returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.lt('xyz')(exp, 'BOOL')).toEqual('#n0 < :v0');
  });

  it('expect le returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.le('xyz')(exp, 'BOOL')).toEqual('#n0 <= :v0');
  });

  it('expect gt returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.gt('xyz')(exp, 'BOOL')).toEqual('#n0 > :v0');
  });

  it('expect ge returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.ge('xyz')(exp, 'BOOL')).toEqual('#n0 >= :v0');
  });

  it('expect between returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.between('a', 'z')(exp, 'BOOL')).toEqual('#n0 BETWEEN :v0 AND :v1');
  });

  it('expect in returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.in(['a', 'z'])(exp, 'BOOL')).toEqual('#n0 IN (:v0, :v1)');
  });

  it('expect typeOf returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.type('S')(exp, 'BOOL')).toEqual('attribute_type(#n0, :v0)');
  });

  it('expect exists returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.exists()(exp, 'BOOL')).toEqual('attribute_exists(#n0)');
  });

  it('expect notExists returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.notExists()(exp, 'BOOL')).toEqual('attribute_not_exists(#n0)');
  });
});

describe('When FieldString', () => {
  const field = Fields.string();
  field.init('string', model);

  it('expect size returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.size()(exp, 'S')).toEqual('size(#n0)');
  });

  it('expect contains returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.contains('xyz')(exp, 'BOOL')).toEqual('contains(#n0, :v0)');
  });

  it('expect beginsWith returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.beginsWith('xyz')(exp, 'BOOL')).toEqual('begins_with(#n0, :v0)');
  });
});

describe('When FieldNumber', () => {
  const field = Fields.number();
  field.init('number', model);
});

describe('When FieldBinary', () => {
  const field = Fields.binary();
  field.init('binary', model);

  it('expect size returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.size()(exp, 'S')).toEqual('size(#n0)');
  });
});

describe('When FieldBoolean', () => {
  const field = Fields.boolean();
  field.init('boolean', model);

  it('expect boolean returns correct type', () => {
    expect(field.name).toEqual('boolean');
  });
});

describe('When FieldSet', () => {
  const field = Fields.stringSet();
  field.init('set', model);

  const fieldNoArray = Fields.stringSet({ useArrays: false });
  fieldNoArray.init('setNoArray', model);

  it('expect numberSet returns correct type', () => {
    const field1 = Fields.numberSet();
    expect(field1.name).toBeUndefined();
  });

  it('expect binarySet returns correct type', () => {
    const field1 = Fields.binarySet();
    expect(field1.name).toBeUndefined();
  });

  it('expect stringSet returns correct type', () => {
    expect(field.name).toEqual('set');
  });

  it('expect size returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.size()(exp, 'S')).toEqual('size(#n0)');
  });

  it('expect contains returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.contains('xyz')(exp, 'BOOL')).toEqual('contains(#n0, :v0)');
  });

  it('expect stringSet toModel', () => {
    const data: Model.ModelData = {};
    field.toModel('set', { set: client.createSet(['abc', 'def']) }, data, modelContext);
    expect(data).toEqual({ set: ['abc', 'def'] });
  });

  it('expect array stringSet toTable', () => {
    const data: Table.AttributeValuesMap = {};
    field.toTable('set', { set: ['abc', 'def'] }, data, tableContext);
    expect(data).toEqual({ set: client.createSet(['abc', 'def']) });
  });

  it('expect array stringSet toTableUpdate', () => {
    const data: Table.AttributeValuesMap = {};
    field.toTableUpdate('set', { set: ['abc', 'def'] }, data, tableContext);
    expect(data).toEqual({ set: client.createSet(['abc', 'def']) });
  });

  it('expect createSet stringSet toTable', () => {
    const data: Table.AttributeValuesMap = {};
    field.toTable('set', { set: client.createSet(['abc', 'def']) }, data, tableContext);
    expect(data).toEqual({ set: client.createSet(['abc', 'def']) });
  });

  it('expect createSet stringSet toTableUpdate', () => {
    const data: Table.AttributeValuesMap = {};
    field.toTableUpdate('set', { set: client.createSet(['abc', 'def']) }, data, tableContext);
    expect(data).toEqual({ set: client.createSet(['abc', 'def']) });
  });

  it('expect no array stringSet toModel', () => {
    const data: Model.ModelData = {};
    fieldNoArray.toModel('set', { set: client.createSet(['abc', 'def']) }, data, modelContext);
    expect(data).toEqual({ set: client.createSet(['abc', 'def']) });
  });

  it('expect no array stringSet toTable', () => {
    const data: Table.AttributeValuesMap = {};
    fieldNoArray.toTable('set', { set: ['abc', 'def'] }, data, tableContext);
    expect(data).toEqual({ set: ['abc', 'def'] });
  });

  it('expect no array stringSet toTableUpdate', () => {
    const data: Table.AttributeValuesMap = {};
    fieldNoArray.toTableUpdate('set', { set: ['abc', 'def'] }, data, tableContext);
    expect(data).toEqual({ set: ['abc', 'def'] });
  });

  it('FieldSet default function expects to be set', () => {
    const defaultField = Fields.stringSet({ default: ['abc', 'def'] });
    defaultField.init('set', model);
    expect(defaultField.getDefault('set', {} as Model.ModelData, {} as Fields.TableContext)).toEqual(['abc', 'def']);
  });
});

describe('When FieldList', () => {
  const field = Fields.list();
  field.init('list', model);

  it('expect constructor with alias has alias', () => {
    const field1 = Fields.list({ alias: 'list' });
    expect(field1.alias).toEqual('list');
  });

  it('expect size returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.size()(exp, 'S')).toEqual('size(#n0)');
  });
});

describe('When FieldModelList', () => {
  const field = Fields.modelList<ChildModel>({ schema: childSchema });
  field.init('children', model);

  it('expect constructor to init correctly', () => {
    const field1 = Fields.modelList<ChildModel>({ schema: childSchema, alias: 'children' });
    expect(field1.alias).toEqual('children');
    //expect(field1.schema.adult.name).toEqual('adult');
  });

  it('expect size returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.size()(exp, 'S')).toEqual('size(#n0)');
  });

  it('expect modelList toModel', () => {
    const data: Model.ModelData = {};
    const child = { n: 'child', age: 5, adult: false };
    field.toModel('children', { children: [child] }, data, modelContext);
    expect(data).toEqual({ children: [{ name: 'child', age: 5, adult: false }] });
  });

  it('expect modelList toTable', () => {
    const data: Table.AttributeValuesMap = {};
    const child: ChildModel = { name: 'child', age: 5, adult: false };
    field.toTable('children', { children: [child] }, data, tableContext);
    expect(data).toEqual({ children: [{ n: 'child', age: 5, adult: false }] });
  });

  it('expect modelList toTableUpdate', () => {
    const data: Table.AttributeValuesMap = {};
    const child: ChildModel = { name: 'child', age: 5, adult: false };
    field.toTableUpdate('children', { children: [child] }, data, tableContext);
    expect(data).toEqual({ children: [{ n: 'child', age: 5, adult: false }] });
  });

  it('expect modelList with function toTableUpdate', () => {
    const data: Table.AttributeValuesMap = {};
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const update = () => {};
    field.toTableUpdate('children', { children: update }, data, tableContext);
    expect(typeof data.children).toEqual('function');
  });
});

describe('When FieldMap', () => {
  const field = Fields.map();
  field.init('map', model);

  it('expect constructed with alias to have alias', () => {
    const field1 = Fields.map({ alias: 'map' });
    expect(field1.alias).toEqual('map');
  });

  it('expect size returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.size()(exp, 'S')).toEqual('size(#n0)');
  });
});

describe('When FieldModelMap', () => {
  const field = Fields.modelMap<GroupModel>({ schema: groupSchema });
  field.init('groups', model);

  it('expect size returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.size()(exp, 'S')).toEqual('size(#n0)');
  });

  it('expect modelMap toModel', () => {
    const data: Model.ModelData = {};
    const group = { r: Role.Guest, name: 'guest' };
    field.toModel('groups', { groups: { abc: group } }, data, modelContext);
    expect(data).toEqual({ groups: { abc: { role: Role.Guest, name: 'guest' } } });
  });

  it('expect modelMap toTable', () => {
    const data: Table.AttributeValuesMap = {};
    const group: GroupModel = { role: Role.Admin, name: 'admin' };
    field.toTable('groups', { groups: { def: group } }, data, tableContext);
    expect(data).toEqual({ groups: { def: { r: Role.Admin, name: 'admin' } } });
  });

  it('expect modelMap toTableUpdate', () => {
    const data: Table.AttributeValuesMap = {};
    const group: GroupModel = { role: Role.Leader, name: 'leader' };
    field.toTableUpdate('groups', { groups: { hij: group } }, data, tableContext);
    expect(data).toEqual({ groups: { hij: { r: Role.Leader, name: 'leader' } } });
  });

  it('expect modelMap with function toTableUpdate', () => {
    const data: Table.AttributeValuesMap = {};
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const update = () => {};
    field.toTableUpdate('groups', { groups: update }, data, tableContext);
    expect(typeof data.groups).toEqual('function');
  });
});

describe('When FieldModel', () => {
  const field = Fields.model<SpouseModel>({ schema: spouseSchema });
  field.init('spouse', model);

  it('expect constructed with alias to have alias', () => {
    const field1 = Fields.model<SpouseModel>({ schema: spouseSchema, alias: 'spouse' });
    expect(field1.alias).toEqual('spouse');
  });

  it('expect size returns condition expression', () => {
    const exp = createConditionExpression();
    expect(field.size()(exp, 'S')).toEqual('size(#n0)');
  });

  /*
    name: string;
  age: number;
  married: boolean;
  */
  it('expect modelMap toModel', () => {
    const data: Model.ModelData = {};
    const spouse = { n: 'wife', age: 42, married: false };
    field.toModel('spouse', { spouse }, data, modelContext);
    expect(data).toEqual({ spouse: { name: 'wife', age: 42, married: false } });
  });

  it('expect modelMap toTable', () => {
    const data: Table.AttributeValuesMap = {};
    const spouse: SpouseModel = { name: 'wife', age: 42, married: false };
    field.toTable('spouse', { spouse }, data, tableContext);
    expect(data).toEqual({ spouse: { n: 'wife', age: 42, married: false } });
  });

  it('expect modelMap toTableUpdate', () => {
    const data: Table.AttributeValuesMap = {};
    const spouse: SpouseModel = { name: 'wife', age: 42, married: false };
    field.toTableUpdate('spouse', { spouse }, data, tableContext);
    expect(data).toEqual({ spouse: { n: 'wife', age: 42, married: false } });
  });

  it('expect modelMap with function toTableUpdate', () => {
    const data: Table.AttributeValuesMap = {};
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const update = () => {};
    field.toTableUpdate('spouse', { spouse: update }, data, tableContext);
    expect(typeof data.spouse).toEqual('function');
  });
});

// FieldDate inherits from FieldBase
describe('When FieldDate', () => {
  const field = Fields.date();
  field.init('date', model);

  it('expect date returns correct type', () => {
    expect(field.name).toEqual('date');
  });

  it('toModel expect date data', () => {
    const data: Model.ModelData = {};
    field.toModel('date', { date: 1585564302000 }, data, modelContext);
    expect(data).toEqual({ date: new Date(1585564302000000) });
  });

  it('toModel expect empty data to return empty date', () => {
    const data: Model.ModelData = {};
    field.toModel('date', {}, data, modelContext);
    expect(data).toEqual({});
  });

  it('toTable expect date as number', () => {
    const data: Table.AttributeValuesMap = {};
    field.toTable('date', { date: new Date(1585574302000000) }, data, tableContext);
    expect(data).toEqual({ date: 1585574302000 });
  });

  it('toTable expect empty data to return empty date', () => {
    const data: Table.AttributeValuesMap = {};
    field.toTable('date', {}, data, tableContext);
    expect(data).toEqual({});
  });

  it('toTableUpdate expect date as number', () => {
    const data: Table.AttributeValuesMap = {};
    field.toTableUpdate('date', { date: new Date(1585584302000000) }, data, tableContext);
    expect(data).toEqual({ date: 1585584302000 });
  });

  it('default value expects to be set', () => {
    const value = new Date(1585584306000000);
    const field = Fields.date({ default: value });
    expect(field.default).toEqual(value);
    expect(field.getDefault('', {} as Model.ModelData, {} as Fields.TableContext)).toEqual(value);
  });

  it('default function expects to be set', () => {
    const value = new Date(1585584305000000);
    const field = Fields.date({ default: () => value });
    expect(typeof field.default).toEqual('function');
    expect(field.getDefault('', {} as Model.ModelData, {} as Fields.TableContext)).toEqual(value);
  });

  it('toTable with default expect date to be default', () => {
    const value = new Date(1585584303000000);
    const field = Fields.date({ default: () => value });
    const data: Table.AttributeValuesMap = {};
    field.toTable('date', {}, data, tableContext);
    expect(data).toEqual({ date: 1585584303000 });
  });
});

describe('When FieldHidden', () => {
  const field = Fields.hidden();
  it('expect hidden returns correct type', () => {
    expect(field.toTable('hidden', {}, {}, tableContext)).toBeUndefined();
  });
});

describe('When FieldComposite', () => {
  const field = Fields.composite({ alias: 'G0S', count: 3 });
  const slots = field.createSlots();
  slots[0].init('split0', model);
  slots[1].init('split1', model);
  slots[2].init('split2', model);

  it('expect composite count with only alias to be 2', () => {
    const delimiter = Fields.composite({ alias: 'L0S' });
    expect(delimiter.count).toEqual(2);
  });

  it('expect composite with delimiter returns correct type', () => {
    const delimiter = Fields.composite({ alias: 'L0S', count: 2, delimiter: '#' });
    expect(delimiter.alias).toEqual('L0S');
    expect(delimiter.count).toEqual(2);
    expect(delimiter.delimiter).toEqual('#');
  });

  it('expect composite returns correct type', () => {
    expect(field.alias).toEqual('G0S');
    expect(field.count).toEqual(3);
    expect(field.delimiter).toEqual(';');
  });

  it('expect slot to return FieldCompositeSlot', () => {
    expect(slots[1].slot).toEqual(1);
    expect(slots[1].name).toEqual('split1');
    expect(slots[1].composite).toBe(field);
  });

  it('slot.toModel expect existing slot to map', () => {
    const data: Model.ModelData = {};
    slots[1].toModel('split', { G0S: 'part1;part2;part3' }, data, modelContext);
    expect(data).toEqual({ split: 'part2' });
  });

  it('slot.toModel expect missing slot to skip', () => {
    const data: Model.ModelData = {};
    slots[1].toModel('split', { G0S: 'part1;part2' }, data, modelContext);
    expect(data).toEqual({ split: 'part2' });
  });

  it('slot.toTable expect fields to map to key', () => {
    const data: Table.AttributeValuesMap = {};
    slots[2].toTable('split2', { split0: 'part0', split1: 'part1', split2: 'part2' }, data, tableContext);
    expect(data).toEqual({ G0S: 'part0;part1;part2' });
  });

  it('slot.toTable missing slot expect empty data', () => {
    const data: Table.AttributeValuesMap = {};
    slots[1].toTable('split', { split1: 'part1' }, data, tableContext);
    expect(data).toEqual({});
  });

  it('slot.toTable slot is function expect empty data', () => {
    const data: Table.AttributeValuesMap = {};
    slots[1].toTable('split', { split: () => 'value' }, data, tableContext);
    expect(data).toEqual({});
  });

  it('slot.toTableUpdate expect fields to map to key', () => {
    const data: Table.AttributeValuesMap = {};
    slots[1].toTableUpdate('split', { split: 'part1' }, data, tableContext);
    expect(data).toEqual({});
  });
});

describe('When FieldCompositeNamed', () => {
  const field = Fields.compositeNamed({
    alias: 'G0S',
    map: {
      city: 0,
      state: 1,
      country: 2,
    },
  });

  it('expect constructed with slots', () => {
    const field1 = Fields.compositeNamed({
      alias: 'L0S',
      map: { dollar: 0, cents: 1 },
      delimiter: '#',
    });
    const slots = field1.createNamedSlots();
    slots.dollar.init('dollar1', model);
    expect(field1.alias).toEqual('L0S');
    expect(field1.count).toEqual(2);
    expect(field1.delimiter).toEqual('#');
    expect(field1.map).toEqual({ dollar: 0, cents: 1 });
    expect(Object.keys(slots).length).toEqual(2);
    expect(slots.dollar.name).toEqual('dollar1');
  });

  it('expect correctly constructed', () => {
    expect(field.alias).toEqual('G0S');
    expect(field.count).toEqual(3);
    expect(field.delimiter).toEqual(';');
    expect(field.map).toEqual({
      city: 0,
      state: 1,
      country: 2,
    });
    //expect(field.slots.length).toEqual(3);
  });

  it('expect city slot return correct FieldCompositeSlot', () => {
    const slots = field.createNamedSlots();
    slots.city.init('city', model);
    expect(slots.city.name).toEqual('city');
    expect(slots.city.slot).toEqual(0);
  });

  it('expect 1 slot return state FieldCompositeSlot', () => {
    const slots = field.createSlots();
    slots[1].init('state', model);
    expect(slots[1].name).toEqual('state');
    expect(slots[1].slot).toEqual(1);
  });

  it('expect country slot return correct FieldCompositeSlot', () => {
    const slots = field.createNamedSlots();
    const slot = slots.country;
    slot.init('country', model);
    expect(slot.name).toEqual('country');
    expect(slot.slot).toEqual(2);
  });
});

describe('When FieldSplit', () => {
  const field = Fields.split({ aliases: ['P', 'S'] });
  field.init('split', model);

  it('expect init correctly', () => {
    expect(field.aliases).toEqual(['P', 'S']);
    expect(field.delimiter).toEqual('.');
    expect(field.name).toEqual('split');
  });

  it('expect init with delimiters correctly', () => {
    const field1 = Fields.split({ aliases: ['P', 'S'], delimiter: ':' });
    expect(field1.aliases).toEqual(['P', 'S']);
    expect(field1.delimiter).toEqual(':');
  });

  it('toModel expect join of all aliases', () => {
    const data: Model.ModelData = {};
    field.toModel('split', { P: 'id1', S: 'id2' }, data, modelContext);
    expect(data).toEqual({ split: 'id1.id2' });
  });

  it('toModel expect join of single aliases', () => {
    const data: Model.ModelData = {};
    field.toModel('split', { P: 'id1' }, data, modelContext);
    expect(data).toEqual({ split: 'id1' });
  });

  it('toModel expect join of first aliases', () => {
    const data: Model.ModelData = {};
    field.toModel('split', { S: 'id2' }, data, modelContext);
    expect(data).toEqual({ split: 'id2' });
  });

  it('toTable expect split of all aliases', () => {
    const data: Table.AttributeValuesMap = {};
    field.toTable('split', { split: 'id1.id2' }, data, tableContext);
    expect(data).toEqual({ P: 'id1', S: 'id2' });
  });

  it('toTable expect split of more then number of aliases', () => {
    const data: Table.AttributeValuesMap = {};
    field.toTable('split', { split: 'id1.id2.id3.id4' }, data, tableContext);
    expect(data).toEqual({ P: 'id1.id2.id3', S: 'id4' });
  });

  it('toTable expect join of first aliases', () => {
    const data: Table.AttributeValuesMap = {};
    field.toTable('split', { split: 'id1' }, data, tableContext);
    expect(data).toEqual({ P: 'id1' });
  });

  it('toTable missing field expect empty data', () => {
    const data: Table.AttributeValuesMap = {};
    field.toTable('split', { split1: 'id1' }, data, tableContext);
    expect(data).toEqual({});
  });

  it('toTable not a string field expect empty data', () => {
    const data: Table.AttributeValuesMap = {};
    field.toTable('split', { split: 5.2 }, data, tableContext);
    expect(data).toEqual({});
  });

  it('toTableUpdate expect join of all aliases', () => {
    const data: Update.ResolverMap = {};
    field.toTableUpdate('split', { split: 'id1.id2' }, data, tableContext);
    expect(data).toEqual({ P: 'id1', S: 'id2' });
  });

  it('toTableUpdate expect join of first aliases', () => {
    const data: Table.AttributeValuesMap = {};
    field.toTableUpdate('split', { split: 'id1' }, data, tableContext);
    expect(data).toEqual({ P: 'id1' });
  });

  // FieldDate inherits from FieldBase
  describe('When FieldType', () => {
    const field = Fields.type();
    field.init('type', model);

    it('expect date returns correct type', () => {
      expect(field.name).toEqual('type');
    });

    it('toModel expect date data', () => {
      const data: Model.ModelData = {};
      field.toModel('type', { type: 'MyModel' }, data, modelContext);
      expect(data).toEqual({ type: 'MyModel' });
    });

    it('toModel attribute not exist, expect no data', () => {
      const data: Model.ModelData = {};
      field.toModel('type', {}, data, modelContext);
      expect(data).toEqual({});
    });

    it('toTable unsupported action, skip date', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('type', {}, data, tableContext);
      expect(data).toEqual({});
    });

    it('toTable with put action, type set to model name', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('type', {}, data, putTableContext);
      expect(data).toEqual({ type: 'MyModel' });
    });

    it('toTable with put-new action, type set to model name', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('type', {}, data, putNewTableContext);
      expect(data).toEqual({ type: 'MyModel' });
    });

    it('toTable with put-replace action, type set to model name', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('type', {}, data, putReplaceTableContext);
      expect(data).toEqual({ type: 'MyModel' });
    });

    it('toTable with date and put action, expect date returned', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('type', { type: 'BadModel' }, data, putTableContext);
      expect(data).toEqual({ type: 'MyModel' });
    });

    it('alias with toTable with put action, date set and getNow called', () => {
      const field = Fields.type({ alias: 'T' });
      field.init('type', model);
      const data: Table.AttributeValuesMap = {};
      field.toTable('type', {}, data, putTableContext);
      expect(data).toEqual({ T: 'MyModel' });
    });

    it('alias with toModel expect date data', () => {
      const field = Fields.type({ alias: 'T' });
      field.init('type', model);
      const data: Model.ModelData = {};
      field.toModel('type', { T: 'MyModel' }, data, modelContext);
      expect(data).toEqual({ type: 'MyModel' });
    });
  });

  describe('When FieldCreatedDate', () => {
    const getNow = jest.fn(() => new Date(1585564302000000));
    const field = Fields.createdDate({ now: getNow });
    field.init('createdOn', model);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('expect date returns correct type', () => {
      expect(field.name).toEqual('createdOn');
    });

    it('toModel expect date data', () => {
      const data: Model.ModelData = {};
      field.toModel('createdOn', { createdOn: 1585664302000 }, data, modelContext);
      expect(data).toEqual({ createdOn: new Date(1585664302000000) });
    });

    it('toModel attribute not exist, expect no data', () => {
      const data: Model.ModelData = {};
      field.toModel('createdOn', {}, data, modelContext);
      expect(data).toEqual({});
    });

    it('toTable unsupported action, skip date', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('createdOn', {}, data, tableContext);
      expect(data).toEqual({});
      expect(getNow).not.toBeCalled();
    });

    it('toTable with date and unsupported action, skip date', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('createdOn', {}, data, tableContext);
      expect(data).toEqual({});
      expect(getNow).not.toBeCalled();
    });

    it('toTable with put action, createdOn set and getNow called', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('createdOn', {}, data, putTableContext);
      expect(data).toEqual({ createdOn: 1585564302000 });
      expect(getNow).toBeCalledTimes(1);
    });

    it('toTable with put-new action, createdOn set and getNow called', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('createdOn', {}, data, putNewTableContext);
      expect(data).toEqual({ createdOn: 1585564302000 });
      expect(getNow).toBeCalledTimes(1);
    });

    it('toTable with put-replace action, createdOn set and getNow called', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('createdOn', {}, data, putReplaceTableContext);
      expect(data).toEqual({ createdOn: 1585564302000 });
      expect(getNow).toBeCalledTimes(1);
    });

    it('toTable with date and put action, expect date returned', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('createdOn', { createdOn: new Date(1585584303000000) }, data, putTableContext);
      expect(data).toEqual({ createdOn: 1585564302000 });
      expect(getNow).toBeCalledTimes(1);
    });

    it('toTable with default now returns date', () => {
      const field = Fields.createdDate();
      field.init('createdOn', model);
      const now = Math.floor(new Date().valueOf() / 1000);
      const data: Table.AttributeValuesMap = {};
      field.toTable('createdOn', {}, data, putTableContext);
      expect(data).toEqual({ createdOn: data.createdOn });
      expect(data.createdOn).toBeGreaterThanOrEqual(now);
    });

    it('alias with toTable with put action, date set and getNow called', () => {
      const field = Fields.createdDate({ alias: 'addOn', now: getNow });
      field.init('createdOn', model);
      const data: Table.AttributeValuesMap = {};
      field.toTable('createdOn', {}, data, putTableContext);
      expect(data).toEqual({ addOn: 1585564302000 });
      expect(getNow).toBeCalledTimes(1);
    });

    it('alias with toModel expect date data', () => {
      const field = Fields.createdDate({ alias: 'addOn', now: getNow });
      field.init('createdOn', model);
      const data: Model.ModelData = {};
      field.toModel('createdOn', { addOn: 1585664302000 }, data, modelContext);
      expect(data).toEqual({ createdOn: new Date(1585664302000000) });
    });

    it('toTableUpdate expect no data', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTableUpdate('createdOn', { createdOn: 1585664302000 }, data, tableContext);
      expect(data).toEqual({});
    });
  });

  describe('When FieldUpdatedDate', () => {
    const getNow = jest.fn(() => new Date(1585564302000000));
    const field = Fields.updatedDate({ now: getNow });
    field.init('updatedOn', model);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('expect date returns correct type', () => {
      expect(field.name).toEqual('updatedOn');
    });

    it('toModel expect date data', () => {
      const data: Model.ModelData = {};
      field.toModel('updatedOn', { updatedOn: 1585664302000 }, data, modelContext);
      expect(data).toEqual({ updatedOn: new Date(1585664302000000) });
    });

    it('toTable unsupported action, skip date', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('createdOn', {}, data, tableContext);
      expect(data).toEqual({});
      expect(getNow).not.toBeCalled();
    });

    it('toTable with date and unsupported action, skip date', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('updatedOn', {}, data, putTableContext);
      expect(data).toEqual({ updatedOn: 1585564302000 });
      //expect(getNow).not.toBeCalled();
    });

    it('toTable with put action, updatedOn set and getNow called', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('updatedOn', {}, data, putTableContext);
      expect(data).toEqual({ updatedOn: 1585564302000 });
      expect(getNow).toBeCalledTimes(1);
    });

    it('toTable with put-new action, updatedOn set and getNow called', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('updatedOn', {}, data, putNewTableContext);
      expect(data).toEqual({ updatedOn: 1585564302000 });
      expect(getNow).toBeCalledTimes(1);
    });

    it('toTable with put-replace action, updatedOn set and getNow called', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('updatedOn', {}, data, putReplaceTableContext);
      expect(data).toEqual({ updatedOn: 1585564302000 });
      expect(getNow).toBeCalledTimes(1);
    });

    it('toTableUpdate with update action, updatedOn set and getNow called', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTableUpdate('updatedOn', {}, data, updateTableContext);
      expect(data).toEqual({ updatedOn: 1585564302000 });
      expect(getNow).toBeCalledTimes(1);
    });

    it('toTable with date and put action, expect date returned', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('updatedOn', { updatedOn: new Date(1585584303000000) }, data, putTableContext);
      expect(data).toEqual({ updatedOn: 1585564302000 });
      expect(getNow).toBeCalledTimes(1);
    });

    it('toTable with default now returns date', () => {
      const field = Fields.updatedDate();
      field.init('updatedOn', model);
      const now = Math.floor(new Date().valueOf() / 1000);
      const data: Table.AttributeValuesMap = {};
      field.toTable('updatedOn', {}, data, putTableContext);
      expect(data).toEqual({ updatedOn: data.updatedOn });
      expect(data.updatedOn).toBeGreaterThanOrEqual(now);
    });

    it('alias with toTableUpdate with put action, date set and getNow called', () => {
      const field = Fields.updatedDate({ alias: 'editOn', now: getNow });
      field.init('updatedOn', model);
      const data: Table.AttributeValuesMap = {};
      field.toTableUpdate('updatedOn', {}, data, updateTableContext);
      expect(data).toEqual({ editOn: 1585564302000 });
      expect(getNow).toBeCalledTimes(1);
    });

    it('alias with toModel expect date data', () => {
      const field = Fields.updatedDate({ alias: 'editNow', now: getNow });
      field.init('updatedOn', model);
      const data: Model.ModelData = {};
      field.toModel('updatedOn', { editOn: 1585664302000 }, data, modelContext);
      expect(data).toEqual({});
    });
  });

  describe('When FieldCreatedNumberDate', () => {
    const getNow = jest.fn(() => new Date(1585564302000000));
    const field = Fields.createdNumberDate({ now: getNow });
    field.init('createdOn', model);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('expect date returns correct type', () => {
      expect(field.name).toEqual('createdOn');
    });

    it('toModel expect date data', () => {
      const data: Model.ModelData = {};
      field.toModel('createdOn', { createdOn: 1585664302000 }, data, modelContext);
      expect(data).toEqual({ createdOn: 1585664302000 });
    });

    it('toModel attribute not exist, expect no data', () => {
      const data: Model.ModelData = {};
      field.toModel('createdOn', {}, data, modelContext);
      expect(data).toEqual({});
    });

    it('toTable unsupported action, skip date', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('createdOn', {}, data, tableContext);
      expect(data).toEqual({});
      expect(getNow).not.toBeCalled();
    });

    it('toTable with date and unsupported action, skip date', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('createdOn', {}, data, tableContext);
      expect(data).toEqual({});
      expect(getNow).not.toBeCalled();
    });

    it('toTable with put action, createdOn set and getNow called', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('createdOn', {}, data, putTableContext);
      expect(data).toEqual({ createdOn: 1585564302000 });
      expect(getNow).toBeCalledTimes(1);
    });

    it('toTable with put-new action, createdOn set and getNow called', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('createdOn', {}, data, putNewTableContext);
      expect(data).toEqual({ createdOn: 1585564302000 });
      expect(getNow).toBeCalledTimes(1);
    });

    it('toTable with put-replace action, createdOn set and getNow called', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('createdOn', {}, data, putReplaceTableContext);
      expect(data).toEqual({ createdOn: 1585564302000 });
      expect(getNow).toBeCalledTimes(1);
    });

    it('toTable with date and put action, expect date returned', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('createdOn', { createdOn: 1585664302000 }, data, putTableContext);
      expect(data).toEqual({ createdOn: 1585564302000 });
      expect(getNow).toBeCalledTimes(1);
    });

    it('toTable with default now returns date', () => {
      const field = Fields.createdNumberDate();
      field.init('createdOn', model);
      const now = Math.floor(new Date().valueOf() / 1000);
      const data: Table.AttributeValuesMap = {};
      field.toTable('createdOn', {}, data, putTableContext);
      expect(data).toEqual({ createdOn: data.createdOn });
      expect(data.createdOn).toBeGreaterThanOrEqual(now);
    });

    it('alias with toTable with put action, date set and getNow called', () => {
      const field = Fields.createdNumberDate({ alias: 'addOn', now: getNow });
      field.init('createdOn', model);
      const data: Table.AttributeValuesMap = {};
      field.toTable('createdOn', {}, data, putTableContext);
      expect(data).toEqual({ addOn: 1585564302000 });
      expect(getNow).toBeCalledTimes(1);
    });

    it('alias with toModel expect date data', () => {
      const field = Fields.createdNumberDate({ alias: 'addOn', now: getNow });
      field.init('createdOn', model);
      const data: Model.ModelData = {};
      field.toModel('createdOn', { addOn: 1585664302000 }, data, modelContext);
      expect(data).toEqual({ createdOn: 1585664302000 });
    });
  });

  describe('When FieldUpdatedNumberDate', () => {
    const getNow = jest.fn(() => new Date(1585564302000000));
    const field = Fields.updatedNumberDate({
      now: getNow,
      writeOnPut: true,
      toModelDefaultAlias: 'createdOn',
    });
    field.init('updatedOn', model);

    // TODO: writeOnPut: false

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('expect date returns correct type', () => {
      expect(field.name).toEqual('updatedOn');
    });

    it('toModel expect date data', () => {
      const data: Model.ModelData = {};
      field.toModel('updatedOn', { updatedOn: 1585664302000 }, data, modelContext);
      expect(data).toEqual({ updatedOn: 1585664302000 });
    });

    it('toModel with missing updateOn expect to use createOn', () => {
      const data: Model.ModelData = {};
      field.toModel('updatedOn', { createdOn: 1585664302000 }, data, modelContext);
      expect(data).toEqual({ updatedOn: 1585664302000 });
    });

    it('toTable unsupported action, skip date', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('createdOn', {}, data, tableContext);
      expect(data).toEqual({});
      expect(getNow).not.toBeCalled();
    });

    it('toTable with date and unsupported action, skip date', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('updatedOn', {}, data, updateTableContext);
      expect(data).toEqual({});
      expect(getNow).not.toBeCalled();
    });

    it('toTable with put action, updatedOn set and getNow called', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('updatedOn', {}, data, putTableContext);
      expect(data).toEqual({ updatedOn: 1585564302000 });
      expect(getNow).toBeCalledTimes(1);
    });

    it('toTable with put-new action, updatedOn set and getNow called', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('updatedOn', {}, data, putNewTableContext);
      expect(data).toEqual({ updatedOn: 1585564302000 });
      expect(getNow).toBeCalledTimes(1);
    });

    it('toTable with put-replace action, updatedOn set and getNow called', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('updatedOn', {}, data, putReplaceTableContext);
      expect(data).toEqual({ updatedOn: 1585564302000 });
      expect(getNow).toBeCalledTimes(1);
    });

    it('toTableUpdate with update action, updatedOn set and getNow called', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTableUpdate('updatedOn', {}, data, updateTableContext);
      expect(data).toEqual({ updatedOn: 1585564302000 });
      expect(getNow).toBeCalledTimes(1);
    });

    it('toTable with date and put action, expect date returned', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('updatedOn', { updatedOn: 1585664302000 }, data, putTableContext);
      expect(data).toEqual({ updatedOn: 1585564302000 });
      expect(getNow).toBeCalledTimes(1);
    });

    it('toTable with default now returns date', () => {
      const field = Fields.updatedNumberDate();
      field.init('updatedOn', model);
      const now = Math.floor(new Date().valueOf() / 1000);
      const data: Table.AttributeValuesMap = {};
      field.toTableUpdate('updatedOn', {}, data, updateTableContext);
      expect(data).toEqual({ updatedOn: data.updatedOn });
      expect(data.updatedOn).toBeGreaterThanOrEqual(now);
    });

    it('alias with toTableUpdate with put action, date set and getNow called', () => {
      const field = Fields.updatedNumberDate({
        alias: 'editOn',
        now: getNow,
      });
      field.init('updatedOn', model);
      const data: Table.AttributeValuesMap = {};
      field.toTableUpdate('updatedOn', {}, data, updateTableContext);
      expect(data).toEqual({ editOn: 1585564302000 });
      expect(getNow).toBeCalledTimes(1);
    });

    it('alias with toModel expect date data', () => {
      const field = Fields.updatedNumberDate({
        alias: 'editNow',
        now: getNow,
      });
      field.init('updatedOn', model);
      const data: Model.ModelData = {};
      field.toModel('updatedOn', { editOn: 1585664302000 }, data, modelContext);
      expect(data).toEqual({});
    });
  });

  describe('When FieldRevision', () => {
    const field = Fields.revision();
    field.init('revision', model);

    it('expect revision returns correct type', () => {
      expect(field.name).toEqual('revision');
    });

    it('toModel expect revision data', () => {
      const data: Model.ModelData = {};
      field.toModel('revision', { revision: 3 }, data, modelContext);
      expect(data).toEqual({ revision: 3 });
    });

    it('toModel no revision data', () => {
      const data: Model.ModelData = {};
      field.toModel('revision', { rev: 3 }, data, modelContext);
      expect(data).toEqual({});
    });

    it('toTable unsupported action, skip revision', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('revision', {}, data, tableContext);
      expect(data).toEqual({});
    });

    it('toTable with put action, revision set', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('revision', {}, data, putTableContext);
      expect(data).toEqual({ revision: 0 });
    });

    it('toTable with put-new action, revision set', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('revision', {}, data, putNewTableContext);
      expect(data).toEqual({ revision: 0 });
    });

    it('toTable with put-replace action, revision set', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('revision', {}, data, putReplaceTableContext);
      expect(data).toEqual({ revision: 0 });
    });

    it('toTableUpdate, revision set to Update.inc(1)', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTableUpdate('revision', {}, data, updateTableContext);
      expect(typeof data.revision).toEqual('function');
      expect(buildUpdateParams(data)).toEqual({
        ExpressionAttributeNames: { '#n0': 'revision' },
        ExpressionAttributeValues: { ':v0': 1 },
        UpdateExpression: 'SET #n0 = #n0 + :v0',
      });
    });

    it('toTable with date and put action, revision set', () => {
      const data: Table.AttributeValuesMap = {};
      field.toTable('revision', { revision: 3 }, data, putTableContext);
      expect(data).toEqual({ revision: 0 });
    });

    it('alias with toTable with put action, revision set', () => {
      const field = Fields.revision({ alias: 'R', start: 1 });
      field.init('revision', model);
      const data: Table.AttributeValuesMap = {};
      field.toTable('revision', {}, data, putTableContext);
      expect(data).toEqual({ R: 1 });
    });

    it('alias with toTableUpdate, date set and getNow called', () => {
      const field = Fields.revision({ alias: 'R', start: 1 });
      field.init('revision', model);
      const data: Table.AttributeValuesMap = {};
      field.toTableUpdate('revision', {}, data, updateTableContext);
      expect(typeof data.R).toEqual('function');
      expect(buildUpdateParams(data)).toEqual({
        ExpressionAttributeNames: { '#n0': 'R' },
        ExpressionAttributeValues: { ':v0': 1 },
        UpdateExpression: 'SET #n0 = #n0 + :v0',
      });
    });

    it('alias with toModel expect date data', () => {
      const field = Fields.revision({ alias: 'R', start: 1 });
      field.init('revision', model);
      const data: Model.ModelData = {};
      field.toModel('revision', { R: 3 }, data, modelContext);
      expect(data).toEqual({ revision: 3 });
    });

    it('matchOnWrite with toTable with put action, revision set', () => {
      const field = Fields.revision({ matchOnWrite: true });
      field.init('revision', model);
      const data: Table.AttributeValuesMap = {};
      putTableContext.conditions = [];
      field.toTable('revision', {}, data, putTableContext);
      expect(buildUpdateParams(data)).toEqual({
        ExpressionAttributeNames: { '#n0': 'revision' },
        ExpressionAttributeValues: { ':v0': 0 },
        UpdateExpression: 'SET #n0 = :v0',
      });
      expect(ConditionExpression.buildExpression(putTableContext.conditions, createConditionExpression())).toEqual(
        '(attribute_not_exists(#n0) OR #n0 = :v0)',
      );
    });

    it('matchOnWrite with toTableUpdate, date set and getNow called', () => {
      const field = Fields.revision({ matchOnWrite: true });
      field.init('revision', model);
      const data: Table.AttributeValuesMap = {};
      updateTableContext.conditions = [];
      field.toTableUpdate('revision', {}, data, updateTableContext);
      expect(typeof data.revision).toEqual('function');
      expect(buildUpdateParams(data)).toEqual({
        ExpressionAttributeNames: { '#n0': 'revision' },
        ExpressionAttributeValues: { ':v0': 1 },
        UpdateExpression: 'SET #n0 = #n0 + :v0',
      });
      expect(ConditionExpression.buildExpression(updateTableContext.conditions, createConditionExpression())).toEqual(
        '#n0 = :v0',
      );
    });
  });
});
