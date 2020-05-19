/* eslint-disable tsdoc/syntax */
import { Condition } from '../src/Condition';
import { Fields } from '../src/Fields';
import { Model } from '../src/Model';
import { Table } from '../src/Table';
import { Update } from '../src/Update';
import { buildUpdate } from './testCommon';

// Other field:
// TableId = Fields.split({ aliases: [table.getPartitionKey(), table.getSortKey()] });
//   options: delimiter, sortKeyDefault, generate
// Duplicate - Set same value on two aliases, or field name + alias.
//   Maybe part of FieldBase like copyTo: {alias: x, toLower: true }.  Though when duplicated the dup may also have a different field logic, like convert to lower case
//   Though having the BaseField support this allows
// Composite field - both partition and sort key should be used.
//   - slots could also have configs like: { street: {alias: 1}, neighborhood: 0, city: 1, state,: 2, country: 3, region: {alias:}}
//   - actually could just support
//   - sport writing value to field or even slot name.
//   - partition key for indexes should have a "scope prefix" to ensure different access patterns don't overlap
//   -

//
// Model array:
//   - group Id -
//   - sort key -
//   - sort type -
//   -
//
// Access Pattern:
//   - secondary index
//   - map of models w/ type attribute
//   -

const model = { name: 'MyModel' } as Model;
function getTableContext(action: Table.ItemActions): Fields.TableContext {
  return {
    action: action,
    conditions: [],
    model,
    options: {} as Table.BaseOptions,
  } as Fields.TableContext;
}
const modelContext = ({ model } as unknown) as Fields.ModelContext;
const tableContext = getTableContext('get');
const putTableContext = getTableContext('put');
const putNewTableContext = getTableContext('put-new');
const putReplaceTableContext = getTableContext('put-replace');
const updateTableContext = getTableContext('update');

// Advanced fields:
// x Model type - add model name on Model.Put (could also validate same or set when Model.Update)
//   - version - could just build version into type... and use begins_width (<type>#) to find/filter by type, could also
//     use between or =, >, >= w/ format <type>#X.YY (X = major, YY = minor, where can use a-z, A-Z for additional version numbers).  Would just need
//     some helpers to support that.  Now what Models register for what types and version is another issue since a
//     Model could handle any X.YY where X is the same and YY is different (major version hasn't changed).  With that
//     could just have model type embed the version like Model_1 or Model#1, then minor version would just be number
//     that is appended to the end of Model_1, though the biggest issue is that we need to limit the digits up front
//     to support between or >, >= conditions.  Ideally in most cases we wouldn't need to worry about data versioning
//     just attribute existence, type or value.  It also would add at least 3 bytes to each item 'V' + number or
//     '.' + 2 digit number, though version 0/1 could just be it doesn't exist.  But when would you need
//     to use version (when would model type or attribute existence, type or value not work)?  If there is an attribute
//     format that
// x Created on date - date added to item when Model.put is called
// x Updated on date - date updated when Model.update is called
// x Revision - revision set to 0 in Model.put then incremented by 1 on Model.update
//   - required - add Model.update condition to ensure revision is same as passed (throw error if now) and increment if same
// Fork - write to two different values
// - Delete - Mark when delete, don't allow get/put/delete/update after delete=true
//   - TTL support?
// - Hidden - When hidden don't show in get, query or scan
// - ReadOnly - When ReadOnly don't don't allow put/delete/update after readOnly=true
// - Created/Updated by user id - Use context.user
// - Owner user id -
// - Expiration - Use TTL
//
// Basic operations:
// - ID generation for Table.put: partition and sort keys.
// - Set on Table.put: Model type, created on date, id, date id, created by user,
// - Update on Table.update: update on date, revision, updated by user,
// - Don't write if equal: Delete, ReadOnly
// - Don't write if not equal: Revision, Owner id
//
// Issue:
// - How to support ID generation?  Maybe models have an ID generation method that clients can use
//   to generate the id.  Or just leave it up to the caller, though it would be nice to have a solution though
//   ids are generally very domain specific.
//   So no need for these fields (Model.create takes care of ensuring item doesn't exists/uniqueness):
//     - ID - unique id generated when Model.put is called (could auto handle already exists to regenerate and auto retry)
//     - Date Id - sortable unique-ish id generated when Model.put is called (could auto handle already exists to regenerate and auto retry)
//
// Advanced properties:
// - On put/update remove if default (.removeIfDefault(), kind of implies adding default if not exists)
//   - Add default to output if empty in table
// - Hide from output (Hide from table, .hideFromOutput())
// - on put/update remove if "empty" ('', null, undefined, '    ', 0, false, falsely), (.deleteIfEmpty() or .noEmpty())
// - Map old aliases on output or if empty (like nickName would map name if not present) (.outputAliases([]))
// - Readonly - once set cannot change (.readonly())
// -

// FieldDate inherits from FieldBase

// TODO:
//  Add some type safety.
//  Need to determine who handles toModel
//  Fork is mainly used to put values into a index attribute (normalized like toLower) and item attribute
class FieldFork implements Fields.Field {
  fields: Fields.Field[] = [];

  /**
   * Initialize the Field.
   * @param type - Name of type.
   * @param alias - Table attribute name to map this model property to.
   */
  constructor(...fields: Fields.Field[]) {
    if (fields) this.fields = fields;
  }

  //** @inheritDoc {@inheritDoc (Fields:namespace).Field.init} */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  init(name: string, model: Model): void {
    this.fields.forEach((field) => field.init(name, model));
  }

  /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toModel} */
  toModel(
    name: string,
    tableData: Table.AttributeValuesMap,
    modelData: Model.ModelData,
    context: Fields.ModelContext,
  ): void {
    this.fields.forEach((field) => field.toModel(name, tableData, modelData, context));
  }

  /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTable} */
  toTable(
    name: string,
    modelData: Model.ModelData,
    tableData: Table.AttributeValuesMap,
    context: Fields.TableContext,
  ): void {
    this.fields.forEach((field) => field.toTable(name, modelData, tableData, context));
  }

  /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTableUpdate} */
  toTableUpdate(
    name: string,
    modelData: Model.ModelUpdate,
    tableData: Update.ResolverMap,
    context: Fields.TableContext,
  ): void {
    this.fields.forEach((field) => field.toTableUpdate?.(name, modelData, tableData, context));
  }
}

// FieldDate inherits from FieldBase
describe('When FieldFork', () => {
  const field = new FieldFork(); // Fields.createdDate();
  field.init('fork', model);

  it('expect fields returns correct type', () => {
    expect(Array.isArray(field.fields)).toEqual(true);
  });
});

interface RevisionOptions {
  /**
   * Table attribute to map this Model property to.
   */
  alias?: string;

  /**
   * Start value for revision.
   */
  start?: number;

  /**
   * Require that the revision matches when written to
   */
  matchOnWrite?: boolean;
}

class FieldRevision implements Fields.Field {
  /**
   * Model name of the field, set by init function in Model or Field constructor.
   */
  name?: string;

  /**
   * Table attribute to map this Model property to.
   */
  alias?: string;

  /**
   * Start value for revision.
   */
  start = 0;

  /**
   * Require that the revision matches when written to
   */
  matchOnWrite?: boolean;

  /**
   * Initialize the Field.
   * @param type - Name of type.
   * @param alias - Table attribute name to map this model property to.
   */
  constructor(options: RevisionOptions = {}) {
    this.alias = options.alias;
    if (options.start) this.start = options.start;
    this.matchOnWrite = options.matchOnWrite;
  }

  /** @inheritDoc {@inheritDoc (Fields:namespace).Field.init} */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  init(name: string, model: Model): void {
    this.name = name;
  }

  /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toModel} */
  toModel(
    name: string,
    tableData: Table.AttributeValuesMap,
    modelData: Model.ModelData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: Fields.ModelContext,
  ): void {
    const value = tableData[this.alias || name];
    if (value !== undefined) modelData[name] = value;
  }

  /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTable} */
  toTable(
    name: string,
    modelData: Model.ModelData,
    tableData: Table.AttributeValuesMap,
    context: Fields.TableContext,
  ): void {
    const action = context.action;
    if (!Table.isPutAction(action)) return;
    if (this.matchOnWrite && action !== 'put-new')
      context.conditions.push(Condition.or(Condition.notExists(name), Condition.eq(name, modelData[name] || 0)));
    tableData[this.alias || name] = this.start;
  }

  /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTableUpdate} */
  toTableUpdate(
    name: string,
    modelData: Model.ModelUpdate,
    tableData: Update.ResolverMap,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: Fields.TableContext,
  ): void {
    if (this.matchOnWrite) context.conditions.push(Condition.eq(name, modelData[name]));
    tableData[this.alias || name] = Update.inc(1);
  }
}

// FieldDate inherits from FieldBase
describe('When FieldRevision', () => {
  const field = new FieldRevision();
  field.init('revision', model);

  it('expect revision returns correct type', () => {
    expect(field.name).toEqual('revision');
  });

  it('toModel expect date data', () => {
    const data: Model.ModelData = {};
    field.toModel('revision', { revision: 3 }, data, modelContext);
    expect(data).toEqual({ revision: 3 });
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
    expect(buildUpdate(data)).toEqual({
      Paths: { '#n0': 'revision' },
      UpdateExpression: 'SET #n0 = #n0 + :v0',
      Values: { ':v0': 1 },
    });
  });

  it('toTable with date and put action, revision set', () => {
    const data: Table.AttributeValuesMap = {};
    field.toTable('revision', { revision: 3 }, data, putTableContext);
    expect(data).toEqual({ revision: 0 });
  });

  it('alias with toTable with put action, revision set', () => {
    const field = new FieldRevision({ alias: 'R' });
    field.init('revision', model);
    const data: Table.AttributeValuesMap = {};
    field.toTable('revision', {}, data, putTableContext);
    expect(data).toEqual({ R: 0 });
  });

  it('alias with toTableUpdate, date set and getNow called', () => {
    const field = new FieldRevision({ alias: 'R' });
    field.init('revision', model);
    const data: Table.AttributeValuesMap = {};
    field.toTableUpdate('revision', {}, data, updateTableContext);
    expect(typeof data.R).toEqual('function');
    expect(buildUpdate(data)).toEqual({
      Paths: { '#n0': 'R' },
      UpdateExpression: 'SET #n0 = #n0 + :v0',
      Values: { ':v0': 1 },
    });
  });

  it('alias with toModel expect date data', () => {
    const field = new FieldRevision({ alias: 'R' });
    field.init('revision', model);
    const data: Model.ModelData = {};
    field.toModel('revision', { R: 3 }, data, modelContext);
    expect(data).toEqual({ revision: 3 });
  });
});
