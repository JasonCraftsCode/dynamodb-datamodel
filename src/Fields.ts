import { Condition } from './Condition';
import { Model } from './Model';
import { Table } from './Table';
import { Update } from './Update';

/**
 * Collection of functions for constructing a Model schema.
 */
export class Fields {
  static string(alias?: string): Fields.FieldString {
    return new Fields.FieldString('S', alias);
  }

  static number(alias?: string): Fields.FieldNumber {
    return new Fields.FieldNumber('N', alias);
  }

  static binary(alias?: string): Fields.FieldBinary {
    return new Fields.FieldBinary('B', alias);
  }

  static boolean(alias?: string): Fields.FieldBoolean {
    return new Fields.FieldBoolean('BOOL', alias);
  }

  static stringSet(alias?: string): Fields.FieldStringSet {
    return new Fields.FieldStringSet('SS', alias);
  }

  static numberSet(alias?: string): Fields.FieldNumberSet {
    return new Fields.FieldNumberSet('NS', alias);
  }

  static binarySet(alias?: string): Fields.FieldBinarySet {
    return new Fields.FieldBinarySet('BS', alias);
  }

  static list(alias?: string): Fields.FieldList<Table.AttributeValues, 'L'> {
    return new Fields.FieldList('L', alias);
  }

  static listT<V, T extends Table.AttributeTypes>(
    type: string,
    schema: Model.ModelSchemaT<V>,
    alias?: string,
  ): Fields.FieldListT<V, T> {
    return new Fields.FieldListT<V, T>(type, schema, alias);
  }

  static map(alias?: string): Fields.FieldMap<Table.AttributeValues, 'M'> {
    return new Fields.FieldMap('M', alias);
  }

  static mapT<V, T extends Table.AttributeTypes>(
    type: string,
    schema: Model.ModelSchemaT<V>,
    alias?: string,
  ): Fields.FieldMapT<V, T> {
    return new Fields.FieldMapT<V, T>(type, schema, alias);
  }

  static object<V, T extends Table.AttributeTypes>(
    type: string,
    schema: Model.ModelSchemaT<V>,
    alias?: string,
  ): Fields.FieldObject<V, T> {
    return new Fields.FieldObject<V, T>(type, schema, alias);
  }

  static date(alias?: string): Fields.FieldDate {
    return new Fields.FieldDate('DATE', alias);
  }

  static hidden(): Fields.FieldHidden {
    return new Fields.FieldHidden();
  }

  static split(aliases: string[], delimiter?: string): Fields.FieldSplit {
    return new Fields.FieldSplit(aliases, delimiter);
  }

  static composite(alias: string, count: number, delimiter?: string): Fields.FieldComposite {
    return new Fields.FieldComposite(alias, count, delimiter);
  }

  static namedComposite<T extends { [key: string]: number }>(
    alias: string,
    slotMap: T,
    slots?: Fields.CompositeSlot<T>,
    delimiter?: string,
  ): Fields.FieldCompositeT<T> {
    return new Fields.FieldCompositeT<T>(alias, slotMap, slots, delimiter);
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace, no-redeclare
export namespace Fields /* istanbul ignore next: needed for ts with es5 */ {
  /**
   * Context object passed to {@link Field.toTable} and {@link Field.toTableUpdate} to allow the fields to know
   * about the broader context and provide more complex behavior, like appending to the conditions param.
   */
  export interface TableContext {
    /**
     * Type of action that will be run after all field's {@link Field.toTable} or {@link Field.toTableUpdate} are called.
     */
    action: Table.ItemActions;
    /**
     * Array of conditions to resolve and joined with AND conditions, then set as the ConditionExpression param before calling DynamoDB method
     */
    conditions: Condition.Resolver[];
    /**
     * Options for the current {@link Model} method being called.
     */
    options: Table.BaseOptions;
    /**
     * The model that is calling the field's {@link Field.toTable} or {@link Field.toTableUpdate} methods
     */
    model: Model.ModelBase;
  }

  /**
   * Context object passed to {@link Field.toModel} to allow the fields to know
   * about the broader context and provide more complex behavior.
   */
  export interface ModelContext {
    /**
     * Type of action that ran before all field's {@link Field.toModel} are called.
     */
    action: Table.ItemActions;
    /**
     * Options for the current {@link Model} method being called.
     */
    options: Table.BaseOptions;
    /**
     * The model that is calling the field's {@link Field.toModel} method.
     */
    model: Model.ModelBase;
  }

  /**
   * The core interface all Fields implement and is used by {@link Model} to basically map model data to and from the
   * table data.
   *
   *
   */
  export interface Field {
    /**
     * Initialize the field with the field name from the Model's schema and the model.
     * @param name Name of the model attribute this field is set on.
     * @param model Model this field is associated with.
     */
    init(name: string, model: Model): void;

    /**
     * Method called after calling
     * @param name Name of the model attribute this field is associated with (generally same as {@link init} name argument)
     * @param tableData Data from the table that needs to be mapped to the model data.
     * @param modelData Data object for the model that this method will append to.
     * @param context Current context this method is being called in.
     */
    toModel(
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      context: ModelContext,
    ): Promise<void> | void;

    // get, delete, put (new, exist or put)
    // tableData { action: 'get'|'delete'|'put'|'new'|'set'|'update', data, conditions }
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: TableContext,
    ): Promise<void> | void;

    toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.UpdateMapValue,
      context: TableContext,
    ): Promise<void> | void;
  }

  export class FieldBase<V, T> implements Field {
    readonly type: string;
    name?: string; // set by init function in Model or Field constructor
    // TODO: is there a default where we don't set or remove the attribute, then toModel will always return?
    _default?: V | FieldBase.DefaultFunction<V>;
    _alias?: string;
    _required?: boolean; // default: false
    _hidden?: boolean; // default: false
    _validator?: FieldBase.Validator<V>;
    _updateValidator?: FieldBase.UpdateValidator<V>;
    _coerce?: boolean; // default: false

    constructor(type: string, alias?: string) {
      this.type = type;
      this._alias = alias;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    init(name: string, model: Model): void {
      this.name = name;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yup(schema: any, options?: any): FieldBase<V, T> {
      return this.validator((value) => {
        return schema.validate(value, {
          strict: !(this._coerce || false),
          ...options,
        });
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    joi(schema: any, options?: any): FieldBase<V, T> {
      return this.validator((value) => {
        return schema.validateAsync(value, {
          convert: this._coerce || false,
          ...options,
        });
      });
    }
    regex(regex: RegExp): FieldBase<V, T> {
      return this.validator((value: V) => {
        return new Promise<void | V>((resolve, reject) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (regex.test((value as any).toString())) {
            resolve(value);
          } else {
            reject(new Error(`value must match regex: '${regex}'`));
          }
        });
      });
    }
    validator(validator: FieldBase.Validator<V>): FieldBase<V, T> {
      this._validator = validator;
      return this;
    }
    updateValidator(validator: FieldBase.UpdateValidator<V>): FieldBase<V, T> {
      this._updateValidator = validator;
      return this;
    }

    validate(value: V): Promise<void | V> {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this._validator!(value);
    }

    validateUpdate(value: Model.ModelUpdateValue<V>): Promise<Model.ModelUpdateValue<V> | void> {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this._updateValidator!(value);
    }

    coerce(value = true): FieldBase<V, T> {
      this._coerce = value;
      return this;
    }

    alias(value?: string): FieldBase<V, T> {
      this._alias = value;
      return this;
    }

    default(value: V | FieldBase.DefaultFunction<V>): FieldBase<V, T> {
      this._default = value;
      return this;
    }

    hidden(value = true): FieldBase<V, T> {
      this._hidden = value;
      return this;
    }

    required(value = true): FieldBase<V, T> {
      this._required = value;
      return this;
    }

    tableName(): string {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this._alias || this.name!;
    }

    toModel(
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: ModelContext,
    ): Promise<void> {
      return new Promise<void>((resolve) => {
        const value = tableData[this._alias || name];
        // TODO: Should we use default, validate table data or do other things with data coming out of the table?
        if (value !== undefined) {
          modelData[name] = value;
        }
        resolve();
      });
    }

    async toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: TableContext,
    ): Promise<void> {
      let value = (modelData[name] as unknown) as V;
      if (this._validator) {
        const coerced = await this._validator(value);
        if (this._coerce && coerced !== undefined) {
          value = coerced;
        }
      } else if (this._coerce) {
        // Simple coercion
      }
      // (typeof value === 'string' && value.length === 0) ||
      // (Array.isArray(value) && value.length === 0)
      // Sets, typeOf
      if (value === undefined || value === null) {
        const def = this._default;
        if (def !== undefined) {
          value =
            typeof def === 'function'
              ? (def as FieldBase.DefaultFunction<V>)(name, tableData, modelData, context)
              : def;
        } else if (this._required) {
          throw new Error(`Field ${this.name} is required`);
        } else {
          return;
        }
      }
      if (this._hidden) return;
      // TODO: dynamodb attributes can't have empty values like "", empty array, empty sets or null.
      tableData[this._alias || name] = value;
    }

    async toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.UpdateMapValue,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: TableContext,
    ): Promise<void> {
      let value = modelData[name];
      if (this._updateValidator) {
        const coerced = await this._updateValidator(value as Model.ModelUpdateValue<V>);
        if (this._coerce && coerced !== undefined) {
          value = coerced;
        }
      } else if (this._coerce) {
        // Simple coercion
      }
      // TODO: do we need to do anything with required or default for update?
      if (value === undefined) return;
      if (this._hidden) return;
      tableData[this._alias || name] = value;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace FieldBase {
    export type Validator<T> = (value: T) => Promise<T | void>;
    export type UpdateValidator<T> = (value: Model.ModelUpdateValue<T>) => Promise<Model.ModelUpdateValue<T> | void>;

    export type DefaultFunction<T> = (
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      context: TableContext,
    ) => T;
  }

  export class FieldExpression<V, T extends Table.AttributeTypes> extends FieldBase<V, T> {
    // Conditions
    path(): Condition.Resolver<T> {
      return Condition.path(this.tableName());
    }

    eq(v: V): Condition.Resolver<T> {
      return Condition.eq(this.tableName(), v);
    }

    ne(v: V): Condition.Resolver<T> {
      return Condition.ne(this.tableName(), v);
    }

    lt(v: V): Condition.Resolver<T> {
      return Condition.lt(this.tableName(), v);
    }

    le(v: V): Condition.Resolver<T> {
      return Condition.le(this.tableName(), v);
    }

    gt(v: V): Condition.Resolver<T> {
      return Condition.gt(this.tableName(), v);
    }

    ge(v: V): Condition.Resolver<T> {
      return Condition.ge(this.tableName(), v);
    }

    between(from: V, to: V): Condition.Resolver<T> {
      return Condition.between(this.tableName(), from, to);
    }

    in(v: V[]): Condition.Resolver<T> {
      return Condition.in(this.tableName(), v);
    }

    typeOf(type: Table.AttributeTypes): Condition.Resolver<T> {
      return Condition.type(this.tableName(), type);
    }

    exists(): Condition.Resolver<T> {
      return Condition.exists(this.tableName());
    }

    notExists(): Condition.Resolver<T> {
      return Condition.notExists(this.tableName());
    }

    // Update
    getPath(path: string, defaultValue?: V): Update.UpdateFunction {
      return defaultValue === undefined ? Update.path(path) : Update.pathWithDefault(path, defaultValue);
    }
    del(): Update.Resolver<string> {
      return Update.del();
    }
    set(value: V | Update.UpdateFunction): Update.Resolver<string> {
      return Update.set(value);
    }
    setDefault(value: V | Update.UpdateFunction): Update.Resolver<string> {
      return Update.default(value);
    }
  }

  export class FieldString extends FieldExpression<string, 'S'> {
    // Condition
    size(): Condition.Resolver<'S'> {
      return Condition.size(this.tableName());
    }
    contains(value: string): Condition.Resolver<'S'> {
      return Condition.contains(this.tableName(), value);
    }
    beginsWith(value: string): Condition.Resolver<'S'> {
      return Condition.beginsWith(this.tableName(), value);
    }
  }

  export class FieldNumber extends FieldExpression<number, 'N'> {
    // Update
    inc(value: Update.UpdateNumberValue): Update.Resolver<'N'> {
      return Update.inc(value);
    }
    dec(value: Update.UpdateNumberValue): Update.Resolver<'N'> {
      return Update.dec(value);
    }
    add(left: Update.UpdateNumberValue, right: Update.UpdateNumberValue): Update.Resolver<'N'> {
      return Update.add(left, right);
    }
    sub(left: Update.UpdateNumberValue, right: Update.UpdateNumberValue): Update.Resolver<'N'> {
      return Update.sub(left, right);
    }
  }

  export class FieldSet<V, T extends 'BS' | 'NS' | 'SS'> extends FieldExpression<V, T> {
    // Condition
    size(): Condition.Resolver<T> {
      return Condition.size(this.tableName());
    }
    contains(value: string): Condition.Resolver<T> {
      return Condition.contains(this.tableName(), value);
    }

    // Update
    add(value: Table.AttributeSetValues): Update.Resolver<T> {
      return Update.addToSet(value);
    }
    remove(value: Table.AttributeSetValues): Update.Resolver<T> {
      return Update.removeFromSet(value);
    }
  }

  export class FieldBinary extends FieldExpression<Table.BinaryValue, 'B'> {
    // Condition
    size(): Condition.Resolver<'B'> {
      return Condition.size(this.tableName());
    }
  }

  export class FieldBoolean extends FieldExpression<boolean, 'BOOL'> {}

  export class FieldNull extends FieldExpression<null, 'NULL'> {}

  export class FieldStringSet extends FieldSet<Table.StringSetValue, 'SS'> {}

  export class FieldNumberSet extends FieldSet<Table.NumberSetValue, 'NS'> {}

  export class FieldBinarySet extends FieldSet<Table.BinarySetValue, 'BS'> {}

  export class FieldList<V extends Table.AttributeValues, T extends Table.AttributeTypes> extends FieldExpression<
    V[],
    T
  > {
    // Condition
    size(): Condition.Resolver<'L'> {
      return Condition.size(this.tableName());
    }

    // Update
    append(value: Update.UpdateListValueT<V>): Update.Resolver<'L'> {
      return Update.append(value);
    }
    prepend(value: Update.UpdateListValueT<V>): Update.Resolver<'L'> {
      return Update.prepend(value);
    }
    join(left: Update.UpdateListValueT<V>, right: Update.UpdateListValueT<V>): Update.Resolver<'L'> {
      return Update.join(left, right);
    }
    delIndexes(indexes: number[]): Update.Resolver<'L'> {
      return Update.delIndexes(indexes);
    }
    setIndexes(indexes: { [key: number]: V | Update.UpdateFunction }): Update.Resolver<'L'> {
      return Update.setIndexes(indexes);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export class FieldListT<V extends { [key: string]: any }, T extends Table.AttributeTypes> extends FieldList<V, T> {
    schema: Model.ModelSchemaT<V>;

    constructor(type: string, schema: Model.ModelSchemaT<V>, alias?: string) {
      super(type, alias) /* istanbul ignore next: needed for ts with es5 */;
      this.schema = schema;
    }

    init(name: string, model: Model): void {
      super.init(name, model);
      Object.keys(this.schema).forEach((key) => this.schema[key].init(key, model));
    }
  }

  export class FieldMap<V extends Table.AttributeValues, T extends Table.AttributeTypes> extends FieldExpression<
    { [key: string]: V },
    T
  > {
    // Condition
    size(): Condition.Resolver<'M'> {
      return Condition.size(this.tableName());
    }

    // Update
    map(map: { [key: string]: V }): Update.Resolver<'M'> {
      return Update.map(map);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export class FieldMapT<V extends { [key: string]: any }, T extends Table.AttributeTypes> extends FieldMap<V, T> {
    schema: Model.ModelSchemaT<V>;

    constructor(type: string, schema: Model.ModelSchemaT<V>, alias?: string) {
      super(type, alias) /* istanbul ignore next: needed for ts with es5 */;
      this.schema = schema;
    }

    init(name: string, model: Model): void {
      super.init(name, model);
      Object.keys(this.schema).forEach((key) => this.schema[key].init(key, model));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export class FieldObject<V extends { [key: string]: any }, T extends Table.AttributeTypes> extends FieldExpression<
    V,
    T
  > {
    schema: Model.ModelSchemaT<V>;

    constructor(type: string, schema: Model.ModelSchemaT<V>, alias?: string) {
      super(type, alias) /* istanbul ignore next: needed for ts with es5 */;
      this.schema = schema;
    }

    init(name: string, model: Model): void {
      super.init(name, model);
      Object.keys(this.schema).forEach((key) => this.schema[key].init(key, model));
    }

    // Condition
    size(): Condition.Resolver<'M'> {
      return Condition.size(this.tableName());
    }

    // Update
    map(map: Model.ModelUpdateT<V>): Update.Resolver<'M'> {
      return Update.map(map);
    }
  }

  export class FieldDate extends FieldBase<Date, 'DATE'> {
    async toModel(
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      context: ModelContext,
    ): Promise<void> {
      await super.toModel(name, tableData, modelData, context);
      const value = modelData[name];
      if (value === undefined) return;
      modelData[name] = new Date((value as number) * 1000);
    }

    async toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: TableContext,
    ): Promise<void> {
      await super.toTable(name, tableData, modelData, context);
      const value = modelData[this._alias || name];
      if (value === undefined) return;
      tableData[this._alias || name] = Math.round((value as Date).valueOf() / 1000);
    }

    toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.UpdateMapValue,
      context: TableContext,
    ): Promise<void> {
      return this.toTable(name, modelData, tableData as Table.AttributeValuesMap, context);
    }
  }

  export class FieldHidden extends FieldBase<undefined, 'HIDDEN'> {
    readonly _hidden = true;
    constructor() {
      super('HIDDEN');
    }
  }

  export class FieldCompositeSlot implements Field {
    name?: string;
    composite: FieldComposite;
    slot: number;
    constructor(composite: FieldComposite, slot: number, name?: string) {
      this.composite = composite;
      this.slot = slot;
      this.name = name;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    init(name: string, model: Model): void {
      this.name = name;
    }

    toModel(
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      context: ModelContext,
    ): Promise<void> {
      return new Promise<void>((resolve) => {
        this.composite.toModel(this.slot, name, tableData, modelData, context);
        resolve();
      });
    }

    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: TableContext,
    ): Promise<void> {
      return new Promise<void>((resolve) => {
        this.composite.toTable(this.slot, name, modelData, tableData, context);
        resolve();
      });
    }

    toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.UpdateMapValue,
      context: TableContext,
    ): Promise<void> {
      return new Promise<void>((resolve) => {
        this.composite.toTableUpdate(this.slot, name, modelData, tableData, context);
        resolve();
      });
    }
  }

  export class FieldComposite {
    alias: string;
    count: number;
    delimiter: string;

    constructor(alias: string, count: number, delimiter = '.') {
      this.alias = alias;
      this.count = count;
      this.delimiter = delimiter;
    }

    slot(value: number): FieldCompositeSlot {
      return new FieldCompositeSlot(this, value);
    }

    toModel(
      slot: number,
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: ModelContext,
    ): void {
      const value = tableData[this.alias];
      if (typeof value !== 'string') return;
      const parts = value.split(this.delimiter);
      if (slot >= parts.length) return;
      modelData[name] = parts[slot];
    }

    toTable(
      slot: number,
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: TableContext,
    ): void {
      const value = modelData[name];
      if (value === undefined) return;
      if (typeof value === 'function') return; // throw and error
      const slots = (tableData[this.alias] as string)?.split(this.delimiter) || new Array<string>(this.count);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      slots[slot] = value!.toString();
      tableData[this.alias] = slots.join(this.delimiter);
    }

    toTableUpdate(
      slot: number,
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.UpdateMapValue,
      context: TableContext,
    ): void {
      this.toTable(slot, name, modelData, tableData as Table.AttributeValuesMap, context);
    }
  }

  export type CompositeSlot<T extends { [index: string]: number }> = {
    [P in keyof T]: () => FieldCompositeSlot;
  };

  export class FieldCompositeT<T extends { [index: string]: number }> extends FieldComposite {
    slots: CompositeSlot<T>;
    map: T;

    constructor(alias: string, map: T, slots?: CompositeSlot<T>, delimiter?: string) {
      const keys = Object.keys(map);
      super(alias, keys.length, delimiter);
      this.map = map;
      if (slots) this.slots = slots;
      else {
        const newSlots: { [index: string]: () => FieldCompositeSlot } = {};
        keys.forEach((key) => {
          // TODO: validate slot is < keys.length
          const slot = map[key];
          newSlots[key] = (): FieldCompositeSlot => new FieldCompositeSlot(this, slot, key);
        });
        this.slots = newSlots as CompositeSlot<T>;
      }
    }

    slot(value: number | string): FieldCompositeSlot {
      if (typeof value === 'number') {
        const keys = Object.keys(this.map);
        return new FieldCompositeSlot(this, value, keys[value]);
      }
      return this.slots[value]();
    }
  }

  export class FieldSplit implements Field {
    name?: string;
    aliases: string[];
    delimiter: string;

    constructor(aliases: string[], delimiter = '.') {
      this.aliases = aliases;
      this.delimiter = delimiter;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    init(name: string, model: Model): void {
      this.name = name;
    }
    toModel(
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: ModelContext,
    ): void {
      const parts: string[] = [];
      this.aliases.forEach((alias) => {
        const part = tableData[alias];
        if (part) parts.push(part.toString());
      });
      if (parts.length > 0) modelData[name] = parts.join(this.delimiter);
    }

    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: TableContext,
    ): void {
      // TODO: should we throw for this?
      const value = modelData[name];
      if (value !== undefined && typeof value === 'string') {
        // skip any field that is not a string and is split aliased
        let parts = value.split(this.delimiter);
        const extraParts = parts.length - this.aliases.length;
        if (extraParts > 0) {
          parts[extraParts] = parts.slice(0, extraParts + 1).join(this.delimiter);
          parts = parts.slice(extraParts);
        }
        for (let i = 0; i < parts.length; i++) {
          tableData[this.aliases[i]] = parts[i];
        }
      }
    }

    toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.UpdateMapValue,
      context: TableContext,
    ): void {
      this.toTable(name, modelData, tableData as Table.AttributeValuesMap, context);
    }
  }

  /*
   export class FieldCreated extends Field<Date, 'CREATED'> {
    name?: string;
    alias?: string;
    constructor(alias?: string) {
      this.alias = alias;
    }
    init(name: string) {
      this.name = name;
    }
    async toModel(
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      context: ModelContext,
    ) {
      const value = tableData[this.alias | name];
      if (value === undefined) return;
      modelData[name] = new Date((value as number) * 1000);
    }

    async toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: TableContext,
    ) {
      // Only if new
      const value = modelData[this._alias || name];
      if (value === undefined) return;
      tableData[this._alias || name] = Math.round((value as Date).valueOf() / 1000);
    }

    toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.UpdateMapValue,
      context: TableContext,
    ) {
      // Don't update created date
    }
  }
  */
}
