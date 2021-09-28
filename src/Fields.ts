import { Condition } from './Condition';
import { Model } from './Model';
import { Table } from './Table';
import { Update } from './Update';

// TODO: Consider supporting throwing when invalid type.

function toEpochSec(value: Date): number {
  return Math.floor(value.valueOf() / 1000);
}

function toDate(epochSec: number): Date {
  return new Date(epochSec * 1000);
}

/**
 * Collection of functions for constructing a Model schema with Field objects and the Field classes.
 * @example [examples/Fields.ts]{@link https://github.com/jasoncraftscode/dynamodb-datamodel/tree/main/examples/Fields.ts}, (imports: [examples/Table.ts]{@link https://github.com/jasoncraftscode/dynamodb-datamodel/tree/main/examples/Table.ts})
 * ```typescript
 * [[include:Fields.ts]]
 * ```
 * @public
 */
export class Fields {
  /**
   * Creates a string field object to use in a {@link Model.schema}.
   * @param options - Options to initialize field with.
   * @returns New FieldString object.
   */
  static string(options?: Fields.BaseOptions<string>): Fields.FieldString {
    return new Fields.FieldString(options);
  }

  /**
   * Creates a number field object to use in a {@link Model.schema}.
   * @param options - Options to initialize field with.
   * @returns New FieldNumber object.
   */
  static number(options?: Fields.BaseOptions<number>): Fields.FieldNumber {
    return new Fields.FieldNumber(options);
  }

  /**
   * Creates a binary field object to use in a {@link Model.schema}.
   * @param options - Options to initialize field with.
   * @returns New FieldBinary object.
   */
  static binary(options?: Fields.BaseOptions<Table.BinaryValue>): Fields.FieldBinary {
    return new Fields.FieldBinary(options);
  }

  /**
   * Creates a boolean field object to use in a {@link Model.schema}.
   * @param options - Options to initialize field with.
   * @returns New FieldBoolean object.
   */
  static boolean(options?: Fields.BaseOptions<boolean>): Fields.FieldBoolean {
    return new Fields.FieldBoolean(options);
  }

  /**
   * Creates a string set field object to use in a {@link Model.schema}.
   * @param options - Options to initialize field with.
   * @returns New FieldStringSet object.
   */
  static stringSet(options?: Fields.SetOptions<Table.StringSetValue | string[]>): Fields.FieldStringSet {
    return new Fields.FieldStringSet(options);
  }

  /**
   * Creates a number set field object to use in a {@link Model.schema}.
   * @param options - Options to initialize field with.
   * @returns New FieldNumberSet object.
   */
  static numberSet(options?: Fields.SetOptions<Table.NumberSetValue | number[]>): Fields.FieldNumberSet {
    return new Fields.FieldNumberSet(options);
  }

  /**
   * Creates a binary set field object to use in a {@link Model.schema}.
   * @param options - Options to initialize field with.
   * @returns New FieldBinarySet object.
   */
  static binarySet(options?: Fields.SetOptions<Table.BinarySetValue | Table.BinaryValue[]>): Fields.FieldBinarySet {
    return new Fields.FieldBinarySet(options);
  }

  /**
   * Creates a list field object to use in a {@link Model.schema}.
   * @param options - Options to initialize field with.
   * @returns New FieldList object.
   */
  static list(options?: Fields.BaseOptions<Table.ListValue>): Fields.FieldList<Table.AttributeValues> {
    return new Fields.FieldList(options);
  }

  /**
   * Creates a schema based list field object to use in a {@link Model.schema}.
   * @param V - Interface of model to use for schema.
   * @param options - Options to initialize field with.
   * @returns New FieldModelList<V> object.
   */
  static modelList<V>(options: Fields.ModelListOptions<V>): Fields.FieldModelList<V> {
    return new Fields.FieldModelList<V>(options);
  }

  /**
   * Creates a map field object to use in a {@link Model.schema}.
   * @param options - Options to initialize field with.
   * @returns New FieldMap object.
   */
  static map(options?: Fields.BaseOptions<Table.MapValue>): Fields.FieldMap<Table.AttributeValues> {
    return new Fields.FieldMap(options);
  }

  /**
   * Creates a schema based map field object to use in a {@link Model.schema}.
   * @param V - Interface of model to use for schema.
   * @param options - Options to initialize field with.
   * @returns New FieldModelMap<V> object.
   */
  static modelMap<V>(options: Fields.ModelMapOptions<V>): Fields.FieldModelMap<V> {
    return new Fields.FieldModelMap<V>(options);
  }

  /**
   * Creates a schema based map field object to use in a {@link Model.schema}.
   * @param V - Interface of model to use for schema.
   * @param options - Options to initialize field with.
   * @returns New FieldModel<V> object.
   */
  static model<V>(options: Fields.ModelOptions<V>): Fields.FieldModel<V> {
    return new Fields.FieldModel<V>(options);
  }

  /**
   * Creates a date field object to use in a {@link Model.schema}, stored as a number in the table.
   * @param options - Options to initialize field with.
   * @returns New FieldDate object.
   */
  static date(options?: Fields.BaseOptions<Date>): Fields.FieldDate {
    return new Fields.FieldDate(options);
  }

  /**
   * Creates a hidden field object to use in a {@link Model.schema}, which doesn't get set in the table.
   * @returns New FieldHidden object.
   */
  static hidden(): Fields.FieldHidden {
    return new Fields.FieldHidden();
  }

  /**
   * Creates a split field object to use in a {@link Model.schema}. which can be used to split a model property into two or more
   * table attributes.  This is commonly used as an model id property which gets slit into the table's partition and sort keys.
   * Example: Model schema contains 'id: Fields.split(\{ aliases: ['P','S'] \})' and when id = 'guid.date' the field will split the id value
   * in to the table primary key of \{ P: 'guid', S: 'date' \}
   *
   * @example [examples/Fields.split.ts]{@link https://github.com/jasoncraftscode/dynamodb-datamodel/tree/main/examples/Fields.split.ts}, (imports: [examples/Table.ts]{@link https://github.com/jasoncraftscode/dynamodb-datamodel/tree/main/examples/Table.ts})
   * ```typescript
   * [[include:Fields.split.ts]]
   * ```
   *
   * @param options - Options to initialize field with.
   * @returns New FieldSplit object.
   */
  static split(options: Fields.SplitOptions): Fields.FieldSplit {
    return new Fields.FieldSplit(options);
  }

  /**
   * Creates an indices based slots composite field object which can then return FieldCompositeSlot by index to use in a {@link Model.schema}.
   *
   * @example [examples/Fields.composite.ts]{@link https://github.com/jasoncraftscode/dynamodb-datamodel/tree/main/examples/Fields.composite.ts}, (imports: [examples/Table.ts]{@link https://github.com/jasoncraftscode/dynamodb-datamodel/tree/main/examples/Table.ts})
   * ```typescript
   * [[include:Fields.composite.ts]]
   * ```
   *
   * @param options - Options to initialize field with.
   * @returns New composite object with array field slots.
   */
  static composite(options: Fields.CompositeOptions): Fields.FieldComposite {
    return new Fields.FieldComposite(options);
  }

  /**
   * Creates an name based slots composite field object which can then return FieldCompositeSlot by name to use in a {@link Model.schema}.
   *
   * @example [examples/Fields.compositeNamed.ts]{@link https://github.com/jasoncraftscode/dynamodb-datamodel/tree/main/examples/Fields.compositeNamed.ts}, (imports: [examples/Table.ts]{@link https://github.com/jasoncraftscode/dynamodb-datamodel/tree/main/examples/Table.ts})
   * ```typescript
   * [[include:Fields.compositeNamed.ts]]
   * ```
   *
   * @param T - Map of slot names to index
   * @param options - Options to initialize field with.
   * @returns New composite object with named field slots.
   */
  static compositeNamed<T extends { [key: string]: number }>(
    options: Fields.CompositeNamedOptions<T>,
  ): Fields.FieldCompositeNamed<T> {
    return new Fields.FieldCompositeNamed<T>(options);
  }

  /**
   * Creates a field that adds the Model name to a table attribute.
   *
   * @example [examples/Fields.type.ts]{@link https://github.com/jasoncraftscode/dynamodb-datamodel/tree/main/examples/Fields.type.ts}, (imports: [examples/Table.ts]{@link https://github.com/jasoncraftscode/dynamodb-datamodel/tree/main/examples/Table.ts})
   * ```typescript
   * [[include:Fields.type.ts]]
   * ```
   *
   * @param options - Options to initialize field with.
   * @returns New FieldType object.
   */
  static type(options?: Fields.TypeOptions): Fields.FieldType {
    return new Fields.FieldType(options);
  }

  /**
   * Creates a field that add a created date to a table attribute.
   * @param options - Options to initialize field with.
   * @returns New FieldCreatedDate object.
   */
  static createdDate(options?: Fields.CreatedDateOptions): Fields.FieldCreatedDate {
    return new Fields.FieldCreatedDate(options);
  }

  /**
   * Creates a field that adds an updated date to a table attribute.
   * @param options - Options to initialize field with.
   * @returns New FieldUpdatedDate object.
   */
  static updatedDate(options?: Fields.UpdateDateOptions): Fields.FieldUpdatedDate {
    return new Fields.FieldUpdatedDate(options);
  }

  /**
   * Creates a field that add a created date as a number in seconds since UTC UNIX epoch time (January 1, 1970 00:00:00 UTC) to a table attribute.
   * @param options - Options to initialize field with.
   * @returns New FieldCreatedNumberDate object.
   */
  static createdNumberDate(options?: Fields.CreatedDateOptions): Fields.FieldCreatedNumberDate {
    return new Fields.FieldCreatedNumberDate(options);
  }

  /**
   * Creates a field that adds an updated date as a number in seconds since UTC UNIX epoch time (January 1, 1970 00:00:00 UTC) to a table attribute.
   * @param options - Options to initialize field with.
   * @returns New FieldUpdatedNumberDate object.
   */
  static updatedNumberDate(options?: Fields.UpdateNumberDateOptions): Fields.FieldUpdatedNumberDate {
    return new Fields.FieldUpdatedNumberDate(options);
  }

  /**
   * Creates a field that will be incremented with each update.  It also supports preventing an update if
   * the table attribute doesn't match the model property.
   * @param options - Options to initialize field with.
   * @returns New FieldRevision object.
   */
  static revision(options?: Fields.RevisionOptions): Fields.FieldRevision {
    return new Fields.FieldRevision(options);
  }
}

/**
 * Is also a namespace for scoping Condition based interfaces and types.
 * @public
 * */
/* istanbul ignore next: needed for ts with es5 */
// eslint-disable-next-line @typescript-eslint/no-namespace, no-redeclare
export namespace Fields {
  /**
   * Used in TableContext to determine the scope the action is executed in.
   * @param single - Action will be preformed via the single item API.
   * @param batch - Action will be preformed via the batch read/write API.
   * @param transact - TAction will be preformed via the transaction read/write API.
   */
  export type ActionScope = 'single' | 'batch' | 'transact';

  /**
   * Context object passed to {@link Field.toTable} and {@link Field.toTableUpdate} to allow the fields to know
   */
  export interface TableContext {
    /**
     * Type of action that will be run after all field's {@link Field.toTable} or {@link Field.toTableUpdate} are called.
     */
    action: Table.ItemActions;

    /**
     * The scope the action is executed in.
     */
    scope: ActionScope;

    /**
     * Array of conditions to resolve and joined with AND conditions, then set as the ConditionExpression
     * param before calling DynamoDB method.
     */
    conditions: Condition.Resolver[];

    /**
     * Options for the current {@link Model} method being called.
     */
    options: Table.BaseOptions;

    /**
     * The model that is calling the field's {@link Field.toTable} or {@link Field.toTableUpdate} methods.
     */
    model: Model.ModelBase;
  }

  /**
   * Context object passed to {@link Field.toModel} to allow the fields to know about the broader context
   * and provide more complex behavior.
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
   * Defines the table attributes used by a field.
   */
  export interface AttributeDefinition {
    /**
     * The type of the table attribute the field writes.
     */
    type: Table.AttributeTypes;
  }

  /**
   * Defines the set of table attributes that are used by a field.
   */
  export type AttributesSchema = { [key: string]: AttributeDefinition };

  /**
   * The core interface all Fields implement and is used by {@link Model} to basically map model data
   * to and from the table data.
   * @example Custom Field
   * ```typescript
   * class CustomField extends Field {
   * }
   * ```
   */
  export interface Field {
    /**
     * Initialize the field with the field name from the Model's schema and the model.
     * @param name - Name of the model attribute this field is set on.
     * @param model - Model this field is associated with.
     */
    init(name: string, model: Model): void;

    /**
     * Method called **after** calling into the table object to read and write to the table.  This method will convert the
     * table data into model data.
     * @param name - Name of the model attribute this field is associated with (generally same as {@link init} name argument).
     * @param tableData - Data from the table that needs to be mapped to the model data.
     * @param modelData - Data object for the model that this method will append to.
     * @param context - Current context this method is being called in.
     */
    toModel(name: string, tableData: Table.AttributeValuesMap, modelData: Model.ModelData, context: ModelContext): void;

    /**
     * Method called **before** calling into the table object to read and write to the table.  This method will convert the model data
     * into table data and append read or write conditions.
     * @param name - Name of the model attribute this field is associated with (generally same as {@link init} name argument).
     * @param modelData - Data from the model that needs to be mapped to the table data.
     * @param tableData - Data object for the table that this method will append to.
     * @param context - Current context this method is being called in.
     */
    toTable(name: string, modelData: Model.ModelData, tableData: Table.AttributeValuesMap, context: TableContext): void;

    /**
     * Method called **before** calling into the table object to update the table.  This method will convert the model data
     * into table data and append read or write conditions.
     *
     *
     * Note: Several Fields will just call toTable from toTableUpdate if they don't support any special update syntax.
     * @param name - Name of the model attribute this field is associated with (generally same as {@link init} name argument)
     * @param modelData - Data from the model that needs to be mapped to the table data.
     * @param tableData - Data object for the table that this method will append to.
     * @param context - Current context this method is being called in.
     */
    toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.ResolverMap,
      context: TableContext,
    ): void;
  }

  /**
   * Options used for creating {@link FieldBase}.
   * @param V - Type used for default value.
   */
  export interface BaseOptions<V> {
    /**
     * Table attribute to map this Model property to.
     */
    alias?: string;

    /**
     * Value or function to get value from to use when the Model property is empty.
     */
    default?: V | FieldBase.DefaultFunction<V>;
  }

  /**
   * Base Field implementation used by many of the basic field types.
   * @param V - Type for the value of the field.
   * @public
   */
  export class FieldBase<V> implements Field {
    /**
     * Model name of the field, set by init function in Model or Field constructor.
     */
    name?: string;

    /**
     * Table attribute to map this Model property to.
     */
    alias?: string;

    // TODO: Add support for different default actions, like if not present in table
    // use default in model, delete attribute if set to default, and set default in update.
    /**
     * Value or function to get value from to use when the Model property is empty.
     */
    default?: V | FieldBase.DefaultFunction<V>;

    /**
     * Initialize the Field.
     * @param options - Options to initialize FieldBase with.
     */
    constructor(options: BaseOptions<V> = {}) {
      this.alias = options.alias;
      this.default = options.default;
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.init} */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    init(name: string, model: Model): void {
      this.name = name;
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toModel} */
    toModel(
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: ModelContext,
    ): void {
      const value = tableData[this.alias || name];
      if (value !== undefined) modelData[name] = value;
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTable} */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: TableContext,
    ): void {
      let value = modelData[name] as unknown as V | undefined;
      if (value === undefined) value = this.getDefault(name, modelData, context);
      if (value !== undefined) tableData[this.alias || name] = value;
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTableUpdate} */
    toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.ResolverMap,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: TableContext,
    ): void {
      const value = modelData[name];
      if (value !== undefined) tableData[this.alias || name] = value;
    }

    /**
     * Name of table attribute.  Used in Condition based Field methods.
     */
    tableName(): string {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.alias || this.name!;
    }

    /**
     * Get the default value to use in toTable if no value it set.
     * @param name - Model property name associated with field (passed into toTable).
     * @param modelData - Data from the model that to reference for default.
     * @param context - Current context this method is being called in.
     * @returns Default value to use.
     */
    getDefault(name: string, modelData: Model.ModelData, context: TableContext): V | undefined {
      const def = this.default;
      return typeof def === 'function' ? (def as FieldBase.DefaultFunction<V>)(name, modelData, context) : def;
    }
  }

  /**
   * Is also a namespace for scoping FieldBase based interfaces and types.
   * @public
   */
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace FieldBase {
    /**
     * Function to get the default value when the model property is missing.
     * @param T - Value to return from default function.
     * @param name - Name of the model attribute this field is associated with (generally same as {@link init} name argument).
     * @param modelData - Data from the model that needs to be mapped to the table data.
     * @param context - Current context this method is being called in.
     * @returns default value for the model property if it is missing.
     */
    export type DefaultFunction<T> = (name: string, modelData: Model.ModelData, context: TableContext) => T;
  }

  /**
   * Base class for model property fields.
   * @param V - Type this field represents used in Condition methods.
   */
  export class FieldExpression<V> extends FieldBase<V> {
    /**
     * Helper method that just calls {@link Condition.path} with tableName() as value param.
     * See {@link Condition.path} for more info and examples.
     */
    path(): Condition.ValueResolver {
      return Condition.path(this.tableName());
    }

    /**
     * Helper method that just calls {@link Condition.eq} with tableName() as left param.
     * See {@link Condition.eq} for more info and examples.
     */
    eq(v: Condition.Value<V>): Condition.Resolver {
      return Condition.eq(this.tableName(), v);
    }

    /**
     * Helper method that just calls {@link Condition.ne} with tableName() as left param.
     * See {@link Condition.ne} for more info and examples.
     */
    ne(v: Condition.Value<V>): Condition.Resolver {
      return Condition.ne(this.tableName(), v);
    }

    /**
     * Helper method that just calls {@link Condition.lt} with tableName() as left param.
     * See {@link Condition.lt} for more info and examples.
     */
    lt(v: Condition.Value<V>): Condition.Resolver {
      return Condition.lt(this.tableName(), v);
    }

    /**
     * Helper method that just calls {@link Condition.le} with tableName() as left param.
     * See {@link Condition.le} for more info and examples.
     */
    le(v: Condition.Value<V>): Condition.Resolver {
      return Condition.le(this.tableName(), v);
    }

    /**
     * Helper method that just calls {@link Condition.gt} with tableName() as left param.
     * See {@link Condition.gt} for more info and examples.
     */
    gt(v: Condition.Value<V>): Condition.Resolver {
      return Condition.gt(this.tableName(), v);
    }

    /**
     * Helper method that just calls {@link Condition.ge} with tableName() as left param.
     * See {@link Condition.ge} for more info and examples.
     */
    ge(v: Condition.Value<V>): Condition.Resolver {
      return Condition.ge(this.tableName(), v);
    }

    /**
     * Helper method that just calls {@link Condition.between} with tableName() as path param.
     * See {@link Condition.between} for more info and examples.
     */
    between(from: Condition.Value<V>, to: Condition.Value<V>): Condition.Resolver {
      return Condition.between(this.tableName(), from, to);
    }

    /**
     * Helper method that just calls {@link Condition.in} with tableName() as path param.
     * See {@link Condition.in} for more info and examples.
     */
    in(v: Condition.Value<V>[]): Condition.Resolver {
      return Condition.in(this.tableName(), v);
    }

    /**
     * Helper method that just calls {@link Condition."type"} with tableName() as path param.
     * See {@link Condition."type"} for more info and examples.
     */
    type(type: Table.AttributeTypes): Condition.Resolver {
      return Condition.type(this.tableName(), type);
    }

    /**
     * Helper method that just calls {@link Condition.exists} with tableName() as path param.
     * See {@link Condition.exists} for more info and examples.
     */
    exists(): Condition.Resolver {
      return Condition.exists(this.tableName());
    }

    /**
     * Helper method that just calls {@link Condition.notExists} with tableName() as path param.
     * See {@link Condition.notExists} for more info and examples.
     */
    notExists(): Condition.Resolver {
      return Condition.notExists(this.tableName());
    }
  }

  /**
   * See {@link Fields.string} for details.
   */
  export class FieldString extends FieldExpression<string> {
    /**
     * Helper method that just calls {@link Condition.size} with tableName() as path param.
     * See {@link Condition.size} for more info and examples.
     */
    size(): Condition.ValueResolver {
      return Condition.size(this.tableName());
    }

    /**
     * Helper method that wraps {@link Condition.contains}.
     * See {@link Condition.contains} for more info and examples.
     */
    contains(value: string): Condition.Resolver {
      return Condition.contains(this.tableName(), value);
    }

    /**
     *  Helper method that wraps {@link Condition.beginsWith}.
     * See {@link Condition.beginsWith} for more info and examples.
     */
    beginsWith(value: string): Condition.Resolver {
      return Condition.beginsWith(this.tableName(), value);
    }
  }

  /**
   * See {@link Fields.number} for details.
   */
  export class FieldNumber extends FieldExpression<number> {}

  /**
   * See {@link Fields.binary} for details.
   */
  export class FieldBinary extends FieldExpression<Table.BinaryValue> {
    /**
     * Helper method that just calls {@link Condition.size} with tableName() as path param.
     * See {@link Condition.size} for more info and examples.
     */
    size(): Condition.ValueResolver {
      return Condition.size(this.tableName());
    }
  }

  /**
   * See {@link Fields.boolean} for details.
   */
  export class FieldBoolean extends FieldExpression<boolean> {}

  /**
   * See {@link Fields.null} for details.
   */
  export class FieldNull extends FieldExpression<null> {}

  export interface SetOptions<V> extends BaseOptions<V> {
    /**
     * Defines the schema for the list type.
     */
    useArrays?: boolean;
  }

  /**
   *  Generic set property field is base class for {@link FieldStringSet}, {@link FieldStringSet}, and {@link FieldStringSet}.
   */
  export class FieldSet<V> extends FieldExpression<V> {
    useArrays?: boolean;

    /**
     * Initialize the Field.
     * @param options - Options to initialize FieldBase with.
     */
    constructor(options: SetOptions<V> = {}) {
      super(options) /* istanbul ignore next: needed for ts with es5 */;
      this.useArrays = options.useArrays !== undefined ? options.useArrays : true;
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toModel} */
    toModel(
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: ModelContext,
    ): void {
      const value = tableData[this.alias || name];
      if (value !== undefined) modelData[name] = this.useArrays ? (value as Table.AttributeSetValues).values : value;
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTable} */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: TableContext,
    ): void {
      let value = modelData[name] as unknown as V | undefined;
      if (value === undefined) value = this.getDefault(name, modelData, context);
      if (value !== undefined)
        tableData[this.alias || name] =
          this.useArrays && Array.isArray(value) ? context.model.table.createSet(value) : value;
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTableUpdate} */
    toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.ResolverMap,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: TableContext,
    ): void {
      const value = modelData[name];
      if (value !== undefined)
        tableData[this.alias || name] =
          this.useArrays && Array.isArray(value) ? context.model.table.createSet(value) : value;
    }

    /**
     * Helper method that just calls {@link Condition.size} with tableName() as path param.
     * See {@link Condition.size} for more info and examples.
     */
    size(): Condition.ValueResolver {
      return Condition.size(this.tableName());
    }

    /**
     * Helper method that just calls {@link Condition.contains} with tableName() as path param.
     * See {@link Condition.contains} for more info and examples.
     */
    contains(value: string): Condition.Resolver {
      return Condition.contains(this.tableName(), value);
    }
  }

  /**
   * See {@link Fields.stringSet} for details.
   */
  export class FieldStringSet extends FieldSet<Table.StringSetValue | string[]> {}

  /**
   * See {@link Fields.numberSet} for details.
   */
  export class FieldNumberSet extends FieldSet<Table.NumberSetValue | number[]> {}

  /**
   * See {@link Fields.binarySet} for details.
   */
  export class FieldBinarySet extends FieldSet<Table.BinarySetValue | Table.BinaryValue[]> {}

  /**
   * See {@link Fields.list} for details.
   */
  export class FieldList<V extends Table.AttributeValues> extends FieldExpression<V[]> {
    /**
     * Helper method that just calls {@link Condition.size} with tableName() as path param.
     * See {@link Condition.size} for more info and examples.
     */
    size(): Condition.ValueResolver {
      return Condition.size(this.tableName());
    }
  }

  /**
   * FieldModelList constructor options.
   */
  export interface ModelListOptions<V> extends BaseOptions<V[]> {
    /**
     * Defines the schema for the list type.
     */
    schema: Model.ModelSchemaT<V>;
  }

  /**
   * See {@link Fields.modelList} for details.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export class FieldModelList<V extends { [key: string]: any }> extends FieldList<V> {
    /**
     * Defines the schema for the list type.
     */
    schema: Model.ModelSchemaT<V>;

    /**
     * Initializes FieldModelList with the options.
     * @param options - Options to initialize FieldModelList with.
     */
    constructor(options: ModelListOptions<V>) {
      super(options) /* istanbul ignore next: needed for ts with es5 */;
      this.schema = options.schema;
    }

    /**
     * Initializes the schema property.
     * See {@link Field.init} for more information.
     */
    init(name: string, model: Model): void {
      super.init(name, model);
      Model.initSchema(this.schema, model);
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toModel} */
    toModel(
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: ModelContext,
    ): void {
      const value = tableData[this.alias || name] as V[];
      if (value !== undefined) {
        const modelValue: V[] = [];
        value.forEach((next) => {
          const nextData = {} as V;
          Object.keys(this.schema).forEach((key) => this.schema[key].toModel(key, next, nextData, context));
          modelValue.push(nextData);
        });
        modelData[name] = modelValue;
      }
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTable} */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: TableContext,
    ): void {
      let value = modelData[name] as V[] | undefined;
      if (value === undefined) value = this.getDefault(name, modelData, context);
      if (value !== undefined) {
        const tableValue: V[] = [];
        value.forEach((next) => {
          const nextData = {} as V;
          Object.keys(this.schema).forEach((key) => this.schema[key].toTable(key, next, nextData, context));
          tableValue.push(nextData);
        });
        tableData[this.alias || name] = tableValue;
      }
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTableUpdate} */
    toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.ResolverMap,
      context: TableContext,
    ): void {
      const value = modelData[name] as V[];
      if (typeof value === 'function') tableData[this.alias || name] = value;
      else if (value !== undefined) {
        const tableValue: V[] = [];
        value.forEach((next) => {
          const nextData = {} as V;
          Object.keys(this.schema).forEach((key) => this.schema[key].toTableUpdate(key, next, nextData, context));
          tableValue.push(nextData);
        });
        tableData[this.alias || name] = tableValue;
      }
    }
  }

  /**
   * See {@link Fields.map} for details.
   */
  export class FieldMap<V extends Table.AttributeValues> extends FieldExpression<{ [key: string]: V }> {
    /**
     * Helper method that just calls {@link Condition.size} with tableName() as path param.
     * See {@link Condition.size} for more info and examples.
     */
    size(): Condition.ValueResolver {
      return Condition.size(this.tableName());
    }
  }

  /**
   * Condition.Expression used for nested conditions
   */
  /*
  class InnerConditionExpression implements Condition.Expression {
    root: string;
    exp: Condition.Expression;
    constructor(root: string, exp: Condition.Expression) {
      this.root = exp.addPath(root);
      this.exp = exp;
    }

    addPath(path: string): string {
      return `${this.root}.${this.exp.addPath(path)}`;
    }

    addValue(value: Table.AttributeValues): string {
      return this.exp.addValue(value);
    }
  }
  */

  /**
   * FieldModelMap constructor options.
   * @param V - Type of the map value.
   */
  export interface ModelMapOptions<V> extends BaseOptions<{ [key: string]: V }> {
    /**
     * Model schema to use as the value for the Map
     */
    schema: Model.ModelSchemaT<V>;
  }

  /**
   * See {@link Fields.modelMap} for details.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export class FieldModelMap<V extends { [key: string]: any }> extends FieldMap<V> {
    /**
     * Model schema to use as the value for the Map
     */
    schema: Model.ModelSchemaT<V>;

    /**
     * Constructs a FieldModelMap object with options.
     * @param options - Options to initialize model map with.
     */
    constructor(options: ModelMapOptions<V>) {
      super(options) /* istanbul ignore next: needed for ts with es5 */;
      this.schema = options.schema;
    }

    /**
     * Initializes the schema property.
     * See {@link Field.init} for more information.
     */
    init(name: string, model: Model): void {
      super.init(name, model);
      Model.initSchema(this.schema, model);
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toModel} */
    toModel(
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: ModelContext,
    ): void {
      const value = tableData[this.alias || name] as { [key: string]: V };
      if (value !== undefined) {
        const modelValue: { [key: string]: V } = {};
        Object.keys(value).forEach((valueKey) => {
          const nextData = {} as V;
          Object.keys(this.schema).forEach((key) => this.schema[key].toModel(key, value[valueKey], nextData, context));
          modelValue[valueKey] = nextData;
        });
        modelData[name] = modelValue;
      }
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTable} */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: TableContext,
    ): void {
      let value = modelData[name] as { [key: string]: V } | undefined;
      if (value === undefined) value = this.getDefault(name, modelData, context);
      if (value !== undefined) {
        const tableValue: { [key: string]: V } = {};
        Object.keys(value).forEach((valueKey) => {
          const nextData = {} as V;
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          Object.keys(this.schema).forEach((key) => this.schema[key].toTable(key, value![valueKey], nextData, context));
          tableValue[valueKey] = nextData;
        });
        tableData[this.alias || name] = tableValue;
      }
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTableUpdate} */
    toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.ResolverMap,
      context: TableContext,
    ): void {
      const value = modelData[name] as { [key: string]: V };
      if (typeof value === 'function') tableData[this.alias || name] = value;
      else if (value !== undefined) {
        const tableValue: { [key: string]: V } = {};
        Object.keys(value).forEach((valueKey) => {
          const nextData = {} as V;
          Object.keys(this.schema).forEach((key) =>
            this.schema[key].toTableUpdate(key, value[valueKey], nextData, context),
          );
          tableValue[valueKey] = nextData;
        });
        tableData[this.alias || name] = tableValue;
      }
    }

    /**
     * Used to create nested
     * ```typescript
     * groups.condition('group1', group.name.eq('teachers'));
     * // or
     * Condition.eq('groups.group1.name', 'teachers');
     * ```
     * @param key - Map key value to scope condition to
     * @param resolver - Resolver to Model used in this FieldModelMap
     */
    /*
    condition(key: string, resolver: Condition.Resolver): Condition.Resolver {
      const root = this.mapPath(key);
      return (exp: Condition.Expression, type: Table.AttributeTypes | undefined): string => {
        return resolver(new InnerConditionExpression(root, exp), type);
      };
    }

    mapPath(key: string): string {
      return `${this.tableName()}.${key}`;
    }
    */
  }

  /**
   * FieldModel constructor options.
   */
  export interface ModelOptions<V> extends BaseOptions<V> {
    /**
     * Model schema to use for the FieldModel
     */
    schema: Model.ModelSchemaT<V>;
  }

  /**
   * See {@link Fields.model} for details.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export class FieldModel<V extends { [key: string]: any }> extends FieldExpression<V> {
    /**
     * Model schema to use for writing to this field
     */
    schema: Model.ModelSchemaT<V>;

    /**
     * Initialize the class with options.
     * @param options - Options to initialize the class with.
     */
    constructor(options: ModelOptions<V>) {
      super(options) /* istanbul ignore next: needed for ts with es5 */;
      this.schema = options.schema;
    }

    /**
     * Initializes the schema property.
     * See {@link Field.init} for more information.
     */
    init(name: string, model: Model): void {
      super.init(name, model);
      Model.initSchema(this.schema, model);
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toModel} */
    toModel(
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: ModelContext,
    ): void {
      const value = tableData[this.alias || name] as V;
      if (value !== undefined) {
        const nextData = {} as V;
        Object.keys(this.schema).forEach((key) => this.schema[key].toModel(key, value, nextData, context));
        modelData[name] = nextData;
      }
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTable} */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: TableContext,
    ): void {
      let value = modelData[name] as V | undefined;
      if (value === undefined) value = this.getDefault(name, modelData, context);
      if (value !== undefined) {
        const nextData = {} as V;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        Object.keys(this.schema).forEach((key) => this.schema[key].toTable(key, value!, nextData, context));
        tableData[this.alias || name] = nextData;
      }
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTableUpdate} */
    toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.ResolverMap,
      context: TableContext,
    ): void {
      const value = modelData[name] as V;
      if (typeof value === 'function') tableData[this.alias || name] = value;
      else if (value !== undefined) {
        const nextData = {} as V;
        Object.keys(this.schema).forEach((key) => this.schema[key].toTableUpdate(key, value, nextData, context));
        tableData[this.alias || name] = nextData;
      }
    }

    /**
     * Helper method that just calls {@link Condition.size} with tableName() as path param.
     * See {@link Condition.size} for more info and examples.
     */
    size(): Condition.ValueResolver {
      return Condition.size(this.tableName());
    }
  }

  /**
   * See {@link Fields.date} for details.
   */
  export class FieldDate extends FieldBase<Date> {
    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toModel} */
    toModel(
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: ModelContext,
    ): void {
      const value = tableData[this.alias || name];
      if (typeof value === 'number') modelData[name] = toDate(value);
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTable} */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: TableContext,
    ): void {
      let value = modelData[name] as Date | undefined;
      if (value === undefined) value = super.getDefault(name, modelData, context);
      if (value !== undefined) tableData[this.alias || name] = toEpochSec(value);
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTableUpdate} */
    toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.ResolverMap,
      context: TableContext,
    ): void {
      this.toTable(name, modelData, tableData as Table.AttributeValuesMap, context);
    }
  }

  /**
   * See {@link Fields.hidden} for details.
   * Hidden property field.  Used to avoid writing a property to the DynamoDb table.
   */
  export class FieldHidden implements Fields.Field {
    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.init} */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    init(name: string, model: Model): void {}

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toModel} */
    toModel(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      name: string,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      tableData: Table.AttributeValuesMap,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      modelData: Model.ModelData,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: ModelContext,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
    ): void {}

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTable} */
    toTable(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      name: string,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      modelData: Model.ModelData,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      tableData: Table.AttributeValuesMap,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: TableContext,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
    ): void {}

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTableUpdate} */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    toTableUpdate(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      name: string,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      modelData: Model.ModelUpdate,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      tableData: Update.ResolverMap,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: Fields.TableContext,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
    ): void {}
  }

  /**
   * Composite slot property field, comes from the call to createSlots on FieldCompositeSlot.
   */
  export class FieldCompositeSlot implements Field {
    /**
     * Model name of the field, set by init function in Model or Field constructor.
     */
    name?: string;
    /**
     * Composite object used to determine some functionality like delimiter.
     */
    composite: FieldComposite;
    /**
     * Index number of this slot in the slots array.
     */
    slot: number;
    /**
     * All of the slots for the composite field of a model.
     */
    slots: FieldCompositeSlot[];

    /**
     * Initializes this class the required parameters.
     * @param composite - Composite object used to determine some functionality like delimiter.
     * @param slot - Index number of this slot in the slots array.
     * @param slots - All of the slots for the composite field of a model.
     */
    constructor(composite: FieldComposite, slot: number, slots: FieldCompositeSlot[]) {
      this.composite = composite;
      this.slot = slot;
      this.slots = slots;
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.init} */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    init(name: string, model: Model): void {
      this.name = name;
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toModel} */
    toModel(
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: ModelContext,
    ): void {
      const value = tableData[this.composite.alias];
      if (typeof value !== 'string') return;
      const parts = value.split(this.composite.delimiter);
      //if (this.slot >= parts.length) return;
      modelData[name] = parts[this.slot];
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTable} */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: TableContext,
    ): void {
      const value = modelData[name];
      if (value === undefined) return;
      if (typeof value === 'function') return; // throw an error
      const alias = this.composite.alias;
      if (tableData[alias] !== undefined) return; // Already set no need to overwrite
      const slots = this.slots;
      const count = slots.length;
      const dataSlots = new Array<string>(count);
      for (let i = 0; i < count; i++) {
        const slotValue = modelData[slots[i].name as string];
        if (typeof slotValue !== 'string') return; // throw an error
        //dataSlots[i] = this.composite.toLower ? slotValue.toLowerCase() : slotValue;
        dataSlots[i] = slotValue;
      }
      tableData[alias] = dataSlots.join(this.composite.delimiter);
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTableUpdate} */
    toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.ResolverMap,
      context: TableContext,
    ): void {
      this.toTable(name, modelData, tableData as Table.AttributeValuesMap, context);
    }
  }

  /*
  export type CreateCompositeSlot = (
    composite: FieldComposite,
    slot: number,
    slots: FieldCompositeSlot[],
  ) => FieldCompositeSlot;
  */

  /**
   * Options to construct FieldComposite with.
   */
  export interface CompositeOptions {
    /**
     * Table attribute name to map this model property to.
     */
    alias: string;

    /**
     * Number of model fields (slots) to compose together into a table attribute.
     */
    count?: number;

    /**
     * Delimiter to use for when splitting the table attribute in to multiple model fields.
     */
    delimiter?: string;

    // TODO: Add support to converting value to lower case (or run a simple convert function).
    // TODO: Add support for slots to also write the value to the field name, slot name or alias.
    // TODO: Add support for custom slot fields.
    // TODO: Add support for default slot values.
    //toLower?: boolean;
    //slots?: CreateCompositeSlot[];
  }

  /**
   * See {@link Fields.composite} for details.
   */
  export class FieldComposite {
    /**
     * Table attribute name to map this model property to.
     */
    alias: string;

    /**
     * Number of model fields (slots) to compose together into a table attribute.
     * @defaultValue 2
     */
    count = 2;

    /**
     * Delimiter to use for when splitting the table attribute in to multiple model fields.
     * @defaultValue ';'
     */
    delimiter = ';';

    //slots: CreateCompositeSlot[];
    //toLower = false;

    /**
     * Initializes the class with options.
     * @param options - Options to initialize this class with.
     */
    constructor(options: CompositeOptions) {
      this.alias = options.alias;
      if (options.count) this.count = options.count; // || options.slots!.length;
      if (options.delimiter) this.delimiter = options.delimiter;

      //if (options.toLower) this.toLower = options.toLower;
      //if (options.slots) this.slots = options.slots;
      //else {
      /*
      const slots = new Array<CreateCompositeSlot>(this.count);
      for (let i = 0; i < this.count; i++)
        slots[i] = (composite: FieldComposite, slot: number, slots: FieldCompositeSlot[]): FieldCompositeSlot =>
          new FieldCompositeSlot(composite, slot, slots);
      this.slots = slots;
      */
      //}
    }

    /**
     * Create the field slots to use when defining the schema for a model.
     * Note: Need to create a new set of field slots for each model that uses this composite definition.
     * @returns An array of composite slots used for a Model schema.
     */
    createSlots(): FieldCompositeSlot[] {
      const slots = new Array<FieldCompositeSlot>(this.count);
      for (let i = 0; i < this.count; i++) slots[i] = new FieldCompositeSlot(this, i, slots);
      //this.slots[i](this, i, slots);
      return slots;
    }
  }

  /**
   * Defines the map for the named slots for a composite named field.
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  export type CompositeSlotMap<T extends { [index: string]: number }, V extends { [index: string]: Field } = {}> = V & {
    [P in keyof T]: FieldCompositeSlot;
  };

  /**
   * Options used when constructing a FieldCompositeNamed.
   */
  export interface CompositeNamedOptions<T extends { [index: string]: number }> extends CompositeOptions {
    /**
     * The mapping between the slot name and its index.
     */
    map: T;
  }

  /**
   * See {@link Fields.compositeNamed} for details.
   */
  export class FieldCompositeNamed<T extends { [index: string]: number }> extends FieldComposite {
    /**
     * The mapping between the slot name and its index.
     */
    map: T;

    /**
     * Initializes this class with options.
     * @param options - Options to initialize class with.
     */
    constructor(options: CompositeNamedOptions<T>) {
      options.count = Object.keys(options.map).length;
      super(options);
      this.map = options.map;
    }

    /**
     * Create the named field slots to use when defining the schema for a model.
     * Note: Need to create a new set of field slots for each model that uses this composite definition.
     * @returns A map of composite slot fields used in the definition of a Model schema.
     */
    createNamedSlots(): CompositeSlotMap<T> {
      const slots = super.createSlots();
      const namedSlots: { [index: string]: FieldCompositeSlot } = {};
      Object.keys(this.map).forEach((key) => (namedSlots[key] = slots[this.map[key]]));
      return namedSlots as CompositeSlotMap<T>;
    }
  }

  /**
   * Options to construct FieldSplit with.
   */
  export interface SplitOptions {
    /**
     * Array of table attribute names to map this model property to.
     */
    aliases: string[];

    /**
     * Delimiter to use for splitting the model property string.
     */
    delimiter?: string;
  }

  /**
   * See {@link Fields.split} for details.
   * Note: Currently only supports string table attributes.
   */
  export class FieldSplit implements Field {
    /**
     * Model name of the field, set by init function in Model or Field constructor.
     */
    name?: string;

    /**
     * Array of table attribute names to map this model property to.
     */
    aliases: string[];

    /**
     * Delimiter to use for splitting the model property string, default delimiter is '.'.
     */
    delimiter = '.';

    /**
     * Initialize this class with options.
     * @param options - Options to initialize this class with.
     */
    constructor(options: SplitOptions) {
      this.aliases = options.aliases;
      if (options.delimiter) this.delimiter = options.delimiter;
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.init} */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    init(name: string, model: Model): void {
      this.name = name;
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toModel} */
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

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTable} */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: TableContext,
    ): void {
      const value = modelData[name];
      if (typeof value !== 'string') return;
      let parts = value.split(this.delimiter);
      const extraParts = parts.length - this.aliases.length;
      if (extraParts > 0) {
        parts[extraParts] = parts.slice(0, extraParts + 1).join(this.delimiter);
        parts = parts.slice(extraParts);
      }
      for (let i = 0; i < parts.length; i++) tableData[this.aliases[i]] = parts[i];
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTableUpdate} */
    toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.ResolverMap,
      context: TableContext,
    ): void {
      this.toTable(name, modelData, tableData as Table.AttributeValuesMap, context);
    }
  }

  /**
   * FieldType constructor options.
   */
  export interface TypeOptions {
    /**
     * Table attribute to map this Model property to.
     */
    alias?: string;
  }

  /**
   * See {@link Fields."type"} for details.
   */
  export class FieldType implements Field {
    /**
     * Model name of the field, set by init function in Model or Field constructor.
     */
    name?: string;

    /**
     * Table attribute to map this Model property to.
     */
    alias?: string;

    /**
     * Initialize the Field.
     * @param type - Name of type.
     * @param alias - Table attribute name to map this model property to.
     */
    constructor(options: TypeOptions = {}) {
      this.alias = options.alias;
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.init} */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    init(name: string, model: Model): void {
      this.name = name;
    }

    // eslint-disable-next-line tsdoc/syntax
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

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTable} */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: Fields.TableContext,
    ): void {
      if (Table.isPutAction(context.action) && context.model.name) tableData[this.alias || name] = context.model.name;
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTableUpdate} */
    toTableUpdate(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      name: string,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      modelData: Model.ModelUpdate,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      tableData: Update.ResolverMap,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: Fields.TableContext,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
    ): void {}
  }

  /**
   * Options for {@link CreatedDate} class constructor.
   */
  export interface CreatedDateOptions {
    /**
     * Table attribute to map this Model property to.
     */
    alias?: string;

    /**
     * Function to get the current date.
     */
    now?: () => Date;
  }

  /**
   * See {@link Fields.createdDate} for details.
   */
  export class FieldCreatedDate implements Fields.Field {
    /**
     * Model name of the field, set by init function in Model or Field constructor.
     */
    name?: string;

    /**
     * Table attribute to map this Model property to.
     */
    alias?: string;

    /**
     * Function to get the current date.
     */
    now: () => Date = (): Date => new Date();

    /**
     * Initialize this class with options.
     * @param options - Options to initialize this class with.
     */
    constructor(options: CreatedDateOptions = {}) {
      this.alias = options.alias;
      if (options.now) this.now = options.now;
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.init} */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    init(name: string, model: Model): void {
      this.name = name;
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toModel} */
    toModel(
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: Fields.ModelContext,
    ): void {
      const value = tableData[this.alias || name];
      if (typeof value === 'number') modelData[name] = toDate(value);
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTable} */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: Fields.TableContext,
    ): void {
      if (Table.isPutAction(context.action)) tableData[this.alias || name] = toEpochSec(this.now());
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTableUpdate} */
    toTableUpdate(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      name: string,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      modelData: Model.ModelUpdate,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      tableData: Update.ResolverMap,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: Fields.TableContext,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
    ): void {}
  }

  /**
   * Options used when creating {@link FieldUpdatedDate}
   */
  export interface UpdateDateOptions {
    /**
     * Table attribute to map this Model property to.
     */
    alias?: string;

    /**
     * Function to get the current date.
     */
    now?: () => Date;
  }

  /**
   * See {@link Fields.updatedDate} for more details.
   */
  export class FieldUpdatedDate implements Fields.Field {
    /**
     * Model name of the field, set by init function in Model or Field constructor.
     */
    name?: string;

    /**
     * Table attribute to map this Model property to.
     */
    alias?: string;

    /**
     * Function to get the current date.
     */
    now: () => Date = (): Date => new Date();

    /**
     * Initialize this class with options.
     * @param options - Options to initialize this class with.
     */
    constructor(options: UpdateDateOptions = {}) {
      this.alias = options.alias;
      if (options.now) this.now = options.now;
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.init} */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    init(name: string, model: Model): void {
      this.name = name;
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toModel} */
    toModel(
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: Fields.ModelContext,
    ): void {
      const value = tableData[this.alias || name];
      if (typeof value === 'number') modelData[name] = toDate(value);
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTable} */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: Fields.TableContext,
    ): void {
      if (Table.isPutAction(context.action)) tableData[this.alias || name] = toEpochSec(this.now());
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTableUpdate} */
    toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.ResolverMap,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: Fields.TableContext,
    ): void {
      tableData[this.alias || name] = toEpochSec(this.now());
    }
  }

  /**
   * See {@link Fields.createdNumberDate} for more details.
   */
  export class FieldCreatedNumberDate extends FieldNumber {
    /**
     * Function to get the current date.
     */
    now = (): Date => new Date();

    /**
     * Initialize this class with options.
     * @param options - Options to initialize this class with.
     */
    constructor(options: CreatedDateOptions = {}) {
      super(options);
      if (options.now) this.now = options.now;
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTable} */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: Fields.TableContext,
    ): void {
      if (Table.isPutAction(context.action)) tableData[this.alias || name] = toEpochSec(this.now());
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTableUpdate} */
    toTableUpdate(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      name: string,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      modelData: Model.ModelUpdate,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      tableData: Update.ResolverMap,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: Fields.TableContext,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
    ): void {}
  }

  /**
   * Options used when creating {@link FieldUpdatedNumberDate}
   */
  export interface UpdateNumberDateOptions {
    /**
     * Table attribute to map this Model property to.
     */
    alias?: string;

    /**
     * Function to get the current date.
     */
    now?: () => Date;

    /**
     * Sets the updated date when item it put.
     */
    writeOnPut?: boolean;

    /**
     * Table attribute to use in toModel when value is not present.
     */
    toModelDefaultAlias?: string;
  }

  /**
   * See {@link Fields.updatedNumberDate} for more details.
   */
  export class FieldUpdatedNumberDate extends FieldNumber {
    /**
     * Function to get the current date.
     */
    now: () => Date = (): Date => new Date();

    /**
     * Sets the updated date when item it put.
     */
    writeOnPut?: boolean;

    /**
     * Table attribute to use in toModel when value is not present.
     */
    toModelDefaultAlias?: string;

    /**
     * Initialize this class with options.
     * @param options - Options to initialize this class with.
     */
    constructor(options: UpdateNumberDateOptions = {}) {
      super(options);
      if (options.now) this.now = options.now;
      this.writeOnPut = options.writeOnPut;
      this.toModelDefaultAlias = options.toModelDefaultAlias;
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toModel} */
    toModel(
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: Fields.ModelContext,
    ): void {
      let value = tableData[this.alias || name];
      if (value === undefined && this.toModelDefaultAlias) value = tableData[this.toModelDefaultAlias];
      if (value !== undefined) modelData[name] = value;
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTable} */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: Fields.TableContext,
    ): void {
      if (this.writeOnPut && Table.isPutAction(context.action)) tableData[this.alias || name] = toEpochSec(this.now());
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTableUpdate} */
    toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.ResolverMap,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: Fields.TableContext,
    ): void {
      tableData[this.alias || name] = toEpochSec(this.now());
    }
  }

  /**
   * Options used when creating {@link FieldRevision}
   */
  export interface RevisionOptions {
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

  /**
   * See {@link Fields.revision} for more details.
   */
  export class FieldRevision implements Fields.Field {
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
     * Initialize this class with options.
     * @param options - Options to initialize this class with.
     */
    constructor(options: RevisionOptions = {}) {
      this.alias = options.alias;
      if (options.start) this.start = options.start;
      this.matchOnWrite = options.matchOnWrite;
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.init} */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    init(name: string, model: Model): void {
      this.name = name;
    }

    // eslint-disable-next-line tsdoc/syntax
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

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTable} */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: Fields.TableContext,
    ): void {
      const action = context.action;
      if (!Table.isPutAction(action)) return;
      const tableName = this.alias || name;
      if (this.matchOnWrite && action !== 'put-new')
        context.conditions.push(
          Condition.or(Condition.notExists(tableName), Condition.eq(tableName, modelData[name] || 0)),
        );
      tableData[tableName] = this.start;
    }

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTableUpdate} */
    toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.ResolverMap,
      context: Fields.TableContext,
    ): void {
      const tableName = this.alias || name;
      if (this.matchOnWrite) context.conditions.push(Condition.eq(tableName, modelData[name]));
      tableData[tableName] = Update.inc(1);
    }
  }
}
