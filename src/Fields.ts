import { Condition } from './Condition';
import { Model } from './Model';
import { Table } from './Table';
import { Update } from './Update';

// TODO: Consider just using constructors w/ params to create fields and not field chaining
// since field chaining doesn't provide much value and

/**
 * Collection of functions for constructing a Model schema with Field objects and the Field classes.
 * Fields use function chaining to
 * @example Using Model
 * ```typescript
 * import { Fields, Model, Update } from 'dynamodb-datamodel';
 *
 * interface ModelKey {
 *   id: string;
 * }
 * interface ModelItem extends ModelKey {
 *   name: string;
 *   age?: number;
 *   children?: { name: string, age: number}[];
 *   sports?: Table.StringSetValue;
 * }
 *
 * const model = Model.createModel<ModelKey, ModelItem>({
 *   schema: {
 *     id: Fields.split({ aliases:['P', 'S'] }),
 *     name: Fields.string(),
 *     age: Fields.number(),
 *     children: Fields.list(),
 *     sports: Fields.stringSet(),
 *   },
 *   // ...additional properties like table
 * });
 * ```
 */
export class Fields {
  /**
   * Creates a string field object to use in a {@link Model.schema}.
   * @param options Options to initialize field with.
   * @returns New field object.
   */
  static string(options?: Fields.BaseOptions<string>): Fields.FieldString {
    return new Fields.FieldString(options);
  }

  /**
   * Creates a number field object to use in a {@link Model.schema}.
   * @param options Options to initialize field with.
   * @returns New field object.
   */
  static number(options?: Fields.BaseOptions<number>): Fields.FieldNumber {
    return new Fields.FieldNumber(options);
  }

  /**
   * Creates a binary field object to use in a {@link Model.schema}.
   * @param options Options to initialize field with.
   * @returns New field object.
   */
  static binary(options?: Fields.BaseOptions<Table.BinaryValue>): Fields.FieldBinary {
    return new Fields.FieldBinary(options);
  }

  /**
   * Creates a boolean field object to use in a {@link Model.schema}.
   * @param options Options to initialize field with.
   * @returns New field object.
   */
  static boolean(options?: Fields.BaseOptions<boolean>): Fields.FieldBoolean {
    return new Fields.FieldBoolean(options);
  }

  /**
   * Creates a string set field object to use in a {@link Model.schema}.
   * @param options Options to initialize field with.
   * @returns New field object.
   */
  static stringSet(options?: Fields.BaseOptions<Table.StringSetValue>): Fields.FieldStringSet {
    return new Fields.FieldStringSet(options);
  }

  /**
   * Creates a number set field object to use in a {@link Model.schema}.
   * @param options Options to initialize field with.
   * @returns New field object.
   */
  static numberSet(options?: Fields.BaseOptions<Table.NumberSetValue>): Fields.FieldNumberSet {
    return new Fields.FieldNumberSet(options);
  }

  /**
   * Creates a binary set field object to use in a {@link Model.schema}.
   * @param options Options to initialize field with.
   * @returns New field object.
   */
  static binarySet(options?: Fields.BaseOptions<Table.BinarySetValue>): Fields.FieldBinarySet {
    return new Fields.FieldBinarySet(options);
  }

  /**
   * Creates a list field object to use in a {@link Model.schema}.
   * @param options Options to initialize field with.
   * @returns New field object.
   */
  static list(options?: Fields.BaseOptions<Table.ListValue>): Fields.FieldList<Table.AttributeValues> {
    return new Fields.FieldList(options);
  }

  /**ß
   * Creates a schema based list field object to use in a {@link Model.schema}.
   * @typeParam V Interface of model to use for schema.
   * @param options Options to initialize field with.
   * @returns New field object.
   */
  static listModel<V>(options: Fields.ListModelOptions<V>): Fields.FieldListModel<V> {
    return new Fields.FieldListModel<V>(options);
  }

  /**
   * Creates a map field object to use in a {@link Model.schema}.
   * @param options Options to initialize field with.
   * @returns New field object.
   */
  static map(options?: Fields.BaseOptions<Table.MapValue>): Fields.FieldMap<Table.AttributeValues> {
    return new Fields.FieldMap(options);
  }

  /**
   * Creates a schema based map field object to use in a {@link Model.schema}.
   * @typeParam V Interface of model to use for schema.
   * @param options Options to initialize field with.
   * @returns New field object.
   */
  static mapModel<V>(options: Fields.MapModelOptions<V>): Fields.FieldMapModel<V> {
    return new Fields.FieldMapModel<V>(options);
  }

  /**
   * Creates a schema based map field object to use in a {@link Model.schema}.
   * @typeParam V Interface of model to use for schema.
   * @param options Options to initialize field with.
   * @returns New field object.
   */
  static model<V>(options: Fields.ModelOptions<V>): Fields.FieldModel<V> {
    return new Fields.FieldModel<V>(options);
  }

  /**
   * Creates a date field object to use in a {@link Model.schema}, stored as a number in the table.
   * @param options Options to initialize field with.
   * @returns New field object.
   */
  static date(options?: Fields.BaseOptions<Date>): Fields.FieldDate {
    return new Fields.FieldDate(options);
  }

  /**
   * Creates a hidden field object to use in a {@link Model.schema}, which doesn't get set in the table.
   */
  static hidden(): Fields.FieldHidden {
    return new Fields.FieldHidden();
  }

  /**
   * Creates a split field object to use in a {@link Model.schema}. which can be used to split a model property into two or more
   * table attributes.  This is commonly used as an model id property which gets slit into the table's partition and sort keys.
   * Example: Model schema contains 'id: Fields.split({ aliases: ['P','S'] })' and when id = 'guid.date' the field will split the id value
   * in to the table primary key of { P: 'guid', S: 'date'}
   * @example
   * ```typescript
   * ```
   * @param options Options to initialize field with.
   * @returns New field object.
   */
  static split(options: Fields.SplitOptions): Fields.FieldSplit {
    return new Fields.FieldSplit(options);
  }

  /**
   * Creates an indices based slots composite field object which can then return FieldCompositeSlot by index to use in a {@link Model.schema}.
   * @example
   * ```typescript
   * ```
   * @param options Options to initialize field with.
   * @returns New composite object.
   */
  static composite(options: Fields.CompositeOptions): Fields.FieldComposite {
    return new Fields.FieldComposite(options);
  }

  /**
   * Creates an name based slots composite field object which can then return FieldCompositeSlot by name to use in a {@link Model.schema}.
   * @example
   * ```typescript
   * ```
   * @template T Map of slot names to index
   * @param options Options to initialize field with.
   * @returns New composite object with named field slots.
   */
  static compositeNamed<T extends { [key: string]: number }>(
    options: Fields.CompositeNamedOptions<T>,
  ): Fields.FieldCompositeNamed<T> {
    return new Fields.FieldCompositeNamed<T>(options);
  }

  /**
   * Creates a field that adds the Model name to a table attribute.
   * @param options Options to initialize field with.
   * @returns New field object.
   */
  static type(options?: Fields.TypeOptions): Fields.FieldType {
    return new Fields.FieldType(options);
  }

  /**
   * Creates a field that add a created date to a table attribute.
   * @param options Options to initialize field with.
   * @returns New field object.
   */
  static createdDate(options?: Fields.CreatedDateOptions): Fields.FieldCreatedDate {
    return new Fields.FieldCreatedDate(options);
  }

  /**
   * Creates a field that adds an updated date to a table attribute.
   * @param options Options to initialize field with.
   * @returns New field object.
   */
  static updatedDate(options?: Fields.UpdateDateOptions): Fields.FieldUpdatedDate {
    return new Fields.FieldUpdatedDate(options);
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
     * The model that is calling the field's {@link Field.toTable} or {@link Field.toTableUpdate} methods.
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

  export interface AttributeDefinition {
    type: Table.AttributeTypes;
  }

  export type AttributesSchema = { [key: string]: AttributeDefinition };

  /**
   * The core interface all Fields implement and is used by {@link Model} to basically map model data to and from the
   * table data.
   * @example Custom Field
   * ```typescript
   * ```
   */
  export interface Field {
    /**
     * Initialize the field with the field name from the Model's schema and the model.
     * @param name Name of the model attribute this field is set on.
     * @param model Model this field is associated with.
     */
    init(name: string, model: Model): void;

    /**
     * Method called **after** calling into the table object to read and write to the table.  This method will convert the
     * table data into model data.
     * @param name Name of the model attribute this field is associated with (generally same as {@link init} name argument)
     * @param tableData Data from the table that needs to be mapped to the model data.
     * @param modelData Data object for the model that this method will append to.
     * @param context Current context this method is being called in.
     */
    toModel(name: string, tableData: Table.AttributeValuesMap, modelData: Model.ModelData, context: ModelContext): void;

    /**
     * Method called **before** calling into the table object to read and write to the table.  This method will convert the model data
     * into table data and append read or write conditions.
     * @param name Name of the model attribute this field is associated with (generally same as {@link init} name argument)
     * @param modelData Data from the model that needs to be mapped to the table data.
     * @param tableData Data object for the table that this method will append to.
     * @param context Current context this method is being called in.
     */
    toTable(name: string, modelData: Model.ModelData, tableData: Table.AttributeValuesMap, context: TableContext): void;

    /**
     * Method called **before** calling into the table object to update the table.  This method will convert the model data
     * into table data and append read or write conditions.
     *
     *
     * Note: Several Fields will just call toTable from toTableUpdate if they don't support any special update syntax.
     * @param name Name of the model attribute this field is associated with (generally same as {@link init} name argument)
     * @param modelData Data from the model that needs to be mapped to the table data.
     * @param tableData Data object for the table that this method will append to.
     * @param context Current context this method is being called in.
     */
    toTableUpdate?(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.UpdateMapValue,
      context: TableContext,
    ): void;

    /**
     * Returns the table attributes and types that the field will read and write to.
     * Used for validation and creation of access patterns
     */
    getAttributesSchema?(): AttributesSchema;
  }

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
   * @template V Type for the value of the field.
   * @template T Type string to enforce method typings.
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

    /**
     * Value or function to get value from to use when the Model property is empty.
     */
    default?: V | FieldBase.DefaultFunction<V>;

    /**
     * Initialize the Field.
     * @param type Name of type.
     * @param alias Table attribute name to map this model property to.
     */
    constructor(options: BaseOptions<V> = {}) {
      this.alias = options.alias;
      this.default = options.default;
    }

    /**
     * @see Field.init
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    init(name: string, model: Model): void {
      this.name = name;
    }

    /**
     * @see Field.toModel for more information
     */
    toModel(
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: ModelContext,
    ): void {
      const value = tableData[this.alias || name];
      // TODO: Should we use default, validate table data or do other things with data coming out of the table?
      if (value !== undefined) modelData[name] = value;
    }

    /**
     * @see Field.toTable for more information.
     */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: TableContext,
    ): void {
      let value = (modelData[name] as unknown) as V | undefined;
      if (value === undefined) value = this.getDefault(name, modelData, context);
      // TODO: dynamodb attributes can't have empty values like "", empty array, empty sets or null.
      if (value !== undefined) tableData[this.alias || name] = value;
    }

    /**
     * @see Field.toTableUpdate for more information.
     */
    toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.UpdateMapValue,
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
     * @param name Model property name associated with field (passed into toTable).
     * @param modelData Data from the model that to reference for default.
     * @param context Current context this method is being called in.
     * @return Default value.
     */
    getDefault(name: string, modelData: Model.ModelData, context: TableContext): V | undefined {
      const def = this.default;
      return typeof def === 'function' ? (def as FieldBase.DefaultFunction<V>)(name, modelData, context) : def;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace FieldBase {
    /**
     * Function to get the default value when the model property is missing.
     * @template T Value to return from default function.
     * @param name Name of the model attribute this field is associated with (generally same as {@link init} name argument).
     * @param modelData Data from the model that needs to be mapped to the table data.
     * @param context Current context this method is being called in.
     * @return default value for the model property if it is missing.
     */
    export type DefaultFunction<T> = (name: string, modelData: Model.ModelData, context: TableContext) => T;
  }

  export class FieldExpression<V, T extends Table.AttributeTypes> extends FieldBase<V> {
    // Conditions methods for easy discovery.
    /**
     * Helper method that just calls {@link Condition.path} with tableName() as value param.
     * @see Condition.path for more info and example.
     */
    path(): Condition.Resolver<T> {
      return Condition.path(this.tableName());
    }

    /** Helper method that just calls {@link Condition.eq} with tableName() as left param.
     * @see Condition.eq for more info and example.
     */
    eq(v: V): Condition.Resolver<T> {
      return Condition.eq(this.tableName(), v);
    }

    /** Helper method that just calls {@link Condition.ne} with tableName() as left param.
     * @see Condition.ne for more info and example.
     */
    ne(v: V): Condition.Resolver<T> {
      return Condition.ne(this.tableName(), v);
    }

    /** Helper method that just calls {@link Condition.lt} with tableName() as left param.
     * @see Condition.lt for more info and example.
     */
    lt(v: V): Condition.Resolver<T> {
      return Condition.lt(this.tableName(), v);
    }

    /** Helper method that just calls {@link Condition.le} with tableName() as left param.
     * @see Condition.le for more info and example.
     */
    le(v: V): Condition.Resolver<T> {
      return Condition.le(this.tableName(), v);
    }

    /** Helper method that just calls {@link Condition.gt} with tableName() as left param.
     * @see Condition.gt for more info and example.
     */
    gt(v: V): Condition.Resolver<T> {
      return Condition.gt(this.tableName(), v);
    }

    /** Helper method that just calls {@link Condition.ge} with tableName() as left param.
     * @see Condition.ge for more info and example.
     */
    ge(v: V): Condition.Resolver<T> {
      return Condition.ge(this.tableName(), v);
    }

    /** Helper method that just calls {@link Condition.between} with tableName() as path param.
     * @see Condition.between for more info and example.
     */
    between(from: V, to: V): Condition.Resolver<T> {
      return Condition.between(this.tableName(), from, to);
    }

    /** Helper method that just calls {@link Condition.in} with tableName() as path param.
     * @see Condition.in for more info and example.
     */
    in(v: V[]): Condition.Resolver<T> {
      return Condition.in(this.tableName(), v);
    }

    /** Helper method that just calls {@link Condition.type} with tableName() as path param.
     * @see Condition.type for more info and example.
     */
    typeOf(type: Table.AttributeTypes): Condition.Resolver<T> {
      return Condition.type(this.tableName(), type);
    }

    /** Helper method that just calls {@link Condition.exists} with tableName() as path param.
     * @see Condition.exists for more info and example.
     */
    exists(): Condition.Resolver<T> {
      return Condition.exists(this.tableName());
    }

    /** Helper method that just calls {@link Condition.notExists} with tableName() as path param.
     * @see Condition.notExists for more info and example.
     */
    notExists(): Condition.Resolver<T> {
      return Condition.notExists(this.tableName());
    }
  }

  export class FieldString extends FieldExpression<string, 'S'> {
    // Condition
    /** Helper method that just calls {@link Condition.size} with tableName() as path param.
     * @see Condition.size for more info and example.
     */
    size(): Condition.Resolver<'S'> {
      return Condition.size(this.tableName());
    }

    // Condition method for easy discovery
    /** Helper method that wraps {@link Condition.contains}.
     * @see Condition.contains for more info and example.
     */
    contains(value: string): Condition.Resolver<'S'> {
      return Condition.contains(this.tableName(), value);
    }

    /** Helper method that wraps {@link Condition.beginsWith}.
     * @see Condition.beginsWith for more info and example.
     */
    beginsWith(value: string): Condition.Resolver<'S'> {
      return Condition.beginsWith(this.tableName(), value);
    }
  }

  export class FieldNumber extends FieldExpression<number, 'N'> {}

  export class FieldBinary extends FieldExpression<Table.BinaryValue, 'B'> {
    // Condition
    /** Helper method that just calls {@link Condition.size} with tableName() as path param.
     * @see Condition.size for more info and example.
     */
    size(): Condition.Resolver<'B'> {
      return Condition.size(this.tableName());
    }
  }

  export class FieldBoolean extends FieldExpression<boolean, 'BOOL'> {}

  export class FieldNull extends FieldExpression<null, 'NULL'> {}

  export class FieldSet<V, T extends 'BS' | 'NS' | 'SS'> extends FieldExpression<V, T> {
    // Condition
    /** Helper method that just calls {@link Condition.size} with tableName() as path param.
     * @see Condition.size for more info and example.
     */
    size(): Condition.Resolver<T> {
      return Condition.size(this.tableName());
    }

    /** Helper method that just calls {@link Condition.contains} with tableName() as path param.
     * @see Condition.contains for more info and example.
     */
    contains(value: string): Condition.Resolver<T> {
      return Condition.contains(this.tableName(), value);
    }
  }

  export class FieldStringSet extends FieldSet<Table.StringSetValue, 'SS'> {}

  export class FieldNumberSet extends FieldSet<Table.NumberSetValue, 'NS'> {}

  export class FieldBinarySet extends FieldSet<Table.BinarySetValue, 'BS'> {}

  export class FieldList<V extends Table.AttributeValues> extends FieldExpression<V[], 'L'> {
    // Condition
    /** Helper method that just calls {@link Condition.size} with tableName() as path param.
     * @see Condition.size for more info and example.
     */
    size(): Condition.Resolver<'L'> {
      return Condition.size(this.tableName());
    }
  }

  /**
   *
   */
  export interface ListModelOptions<V> extends BaseOptions<V[]> {
    /**
     * Defines the schema for the list type.
     */
    schema: Model.ModelSchemaT<V>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export class FieldListModel<V extends { [key: string]: any }> extends FieldList<V> {
    schema: Model.ModelSchemaT<V>;

    constructor(options: ListModelOptions<V>) {
      super(options) /* istanbul ignore next: needed for ts with es5 */;
      this.schema = options.schema;
    }

    /**
     * @see Field.init for more information.
     */
    init(name: string, model: Model): void {
      super.init(name, model);
      Model.initSchema(this.schema, model);
    }
  }

  export class FieldMap<V extends Table.AttributeValues> extends FieldExpression<{ [key: string]: V }, 'M'> {
    // Condition
    /** Helper method that just calls {@link Condition.size} with tableName() as path param.
     * @see Condition.size for more info and example.
     */
    size(): Condition.Resolver<'M'> {
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

  export interface MapModelOptions<V> extends BaseOptions<{ [key: string]: V }> {
    schema: Model.ModelSchemaT<V>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export class FieldMapModel<V extends { [key: string]: any }> extends FieldMap<V> {
    schema: Model.ModelSchemaT<V>;

    constructor(options: MapModelOptions<V>) {
      super(options) /* istanbul ignore next: needed for ts with es5 */;
      this.schema = options.schema;
    }

    /**
     * @see Field.init for more information.
     */
    init(name: string, model: Model): void {
      super.init(name, model);
      Model.initSchema(this.schema, model);
    }

    /**
     * Used to create nested
     * ```typescript
     * groups.condition('group1', group.name.eq('teachers'));
     * // or
     * Condition.eq('groups.group1.name', 'teachers');
     * ```
     * @param key Map key value to scope condition to
     * @param resolver Resolver to Model used in this FieldMapModel
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

  export interface ModelOptions<V> extends BaseOptions<V> {
    schema: Model.ModelSchemaT<V>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export class FieldModel<V extends { [key: string]: any }> extends FieldExpression<V, 'M'> {
    schema: Model.ModelSchemaT<V>;

    constructor(options: ModelOptions<V>) {
      super(options) /* istanbul ignore next: needed for ts with es5 */;
      this.schema = options.schema;
    }

    /**
     * @see Field.init for more information.
     */
    init(name: string, model: Model): void {
      super.init(name, model);
      // TODO: since this is just a sub model then we can pass the name down to initSchema and
      // prepend the name to each schema init call, which would allow the condition methods on this schema to work.
      // This doesn't work for List or Map since there is a middle index or name.  We would need to have a
      // method on the list or map to get a scoped schema name.
      Model.initSchema(this.schema, model);
    }

    // Condition
    /** Helper method that just calls {@link Condition.size} with tableName() as path param.
     * @see Condition.size for more info and example.
     */
    size(): Condition.Resolver<'M'> {
      return Condition.size(this.tableName());
    }
  }

  export class FieldDate extends FieldBase<Date> {
    // TODO: add Update methods

    /**
     * @see Field.toModel for more information.
     */
    toModel(
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: ModelContext,
    ): void {
      const value = tableData[this.alias || name];
      if (value !== undefined) modelData[name] = new Date((value as number) * 1000);
    }

    /**
     * @see Field.toTable for more information.
     */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: TableContext,
    ): void {
      let value = modelData[name] as Date | undefined;
      if (value === undefined) value = super.getDefault(name, modelData, context);
      //if (typeof value === 'function') throw new TypeError('Field does not support update resolver functions');
      if (value !== undefined) tableData[this.alias || name] = Math.round(value.valueOf() / 1000);
    }

    /**
     * @see Field.toTableUpdate for more information.
     */
    toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.UpdateMapValue,
      context: TableContext,
    ): void {
      this.toTable(name, modelData, tableData as Table.AttributeValuesMap, context);
    }
  }

  export class FieldHidden implements Fields.Field {
    /**
     * @see Field.init
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    init(): void {}

    /**
     * @see Field.toModel for more information
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    toModel(): void {}

    /**
     * @see Field.toTable for more information.
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    toTable(): void {}
  }

  export interface CompositeSlotOptions {
    composite: FieldComposite;
    slot: number;
  }

  export class FieldCompositeSlot implements Field {
    name?: string;
    composite: FieldComposite;
    slot: number;
    slots: FieldCompositeSlot[];
    constructor(composite: FieldComposite, slot: number, slots: FieldCompositeSlot[]) {
      this.composite = composite;
      this.slot = slot;
      this.slots = slots;
    }

    /**
     * @see Field.init for more information.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    init(name: string, model: Model): void {
      this.name = name;
    }

    /**
     * @see Field.toModel for more information.
     */
    toModel(
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: ModelContext,
    ): void {
      //if (this.composite.writeOnly) return;
      const value = tableData[this.composite.alias];
      if (typeof value !== 'string') return;
      const parts = value.split(this.composite.delimiter);
      //if (this.slot >= parts.length) return;
      modelData[name] = parts[this.slot];
    }

    /**
     * @see Field.toTable for more information.
     */
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

    /**
     * @see Field.toTableUpdate for more information.
     */
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

    //toLower?: boolean;
    //slots?: CreateCompositeSlot[];
    //writeOnly?: boolean;
  }

  export class FieldComposite {
    /**
     * Table attribute name to map this model property to.
     */
    alias: string;

    /**
     * Number of model fields (slots) to compose together into a table attribute.
     * @default 2
     */
    count = 2;

    /**
     * Delimiter to use for when splitting the table attribute in to multiple model fields.
     * @default '.''
     */
    delimiter = '.';

    //writeOnly = false;
    //slots: CreateCompositeSlot[];
    //toLower = false;

    constructor(options: CompositeOptions) {
      this.alias = options.alias;
      if (options.count) this.count = options.count; // || options.slots!.length;
      if (options.delimiter) this.delimiter = options.delimiter;

      //if (options.writeOnly) this.writeOnly = options.writeOnly;
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
  export type CompositeSlotMap<T extends { [index: string]: number }> = {
    [P in keyof T]: FieldCompositeSlot;
  };

  /**
   * Options used when constructing a FieldCompositeNamed
   */
  export interface CompositeNamedOptions<T extends { [index: string]: number }> extends CompositeOptions {
    /**
     * The mapping between the slot name and its index.
     */
    map: T;
  }

  /**
   * Defines the composite key th
   */
  export class FieldCompositeNamed<T extends { [index: string]: number }> extends FieldComposite {
    /**
     * The mapping between the slot name and its index.
     */
    map: T;

    constructor(options: CompositeNamedOptions<T>) {
      options.count = Object.keys(options.map).length;
      super(options);
      this.map = options.map;
    }

    /**
     * Create the named field slots to use when defining the schema for a model.
     * Note: Need to create a new set of field slots for each model that uses this composite definition.
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
   * Currently only supports string table attributes.
   */
  export class FieldSplit implements Field {
    name?: string;

    /**
     * Array of table attribute names to map this model property to.
     */
    aliases: string[];

    /**
     * Delimiter to use for splitting the model property string, default delimiter is '.'.
     */
    delimiter = '.';

    constructor(options: SplitOptions) {
      this.aliases = options.aliases;
      if (options.delimiter) this.delimiter = options.delimiter;
    }

    /**
     * @see Field.init for more information
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    init(name: string, model: Model): void {
      this.name = name;
    }

    /**
     * @see Field.toModel for more information
     */
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

    /**
     * @see Field.toTable for more information.
     */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: TableContext,
    ): void {
      const value = modelData[name];
      if (typeof value !== 'string') return;
      // skip any field that is not a string and is split aliased
      let parts = value.split(this.delimiter);
      const extraParts = parts.length - this.aliases.length;
      if (extraParts > 0) {
        parts[extraParts] = parts.slice(0, extraParts + 1).join(this.delimiter);
        parts = parts.slice(extraParts);
      }
      for (let i = 0; i < parts.length; i++) tableData[this.aliases[i]] = parts[i];
    }

    /**
     * @see Field.toTableUpdate for more information.
     */
    toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.UpdateMapValue,
      context: TableContext,
    ): void {
      this.toTable(name, modelData, tableData as Table.AttributeValuesMap, context);
    }
  }

  export interface TypeOptions {
    /**
     * Table attribute to map this Model property to.
     */
    alias?: string;
  }

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
     * @param type Name of type.
     * @param alias Table attribute name to map this model property to.
     */
    constructor(options: TypeOptions = {}) {
      this.alias = options.alias;
    }

    /**
     * @see Fields.Field.init for more information.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    init(name: string, model: Model): void {
      this.name = name;
    }

    /**
     * @see Fields.Field.toModel for more information.
     */
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

    /**
     * @see Fields.Field.toTable for more information.
     */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: Fields.TableContext,
    ): void {
      if (Table.isPutAction(context.action) && context.model.name) tableData[this.alias || name] = context.model.name;
    }
  }

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
     * Initialize the Field.
     * @param type Name of type.
     * @param alias Table attribute name to map this model property to.
     */
    constructor(options: CreatedDateOptions = {}) {
      this.alias = options.alias;
      if (options.now) this.now = options.now;
    }

    /**
     * @see Fields.Field.init for more information.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    init(name: string, model: Model): void {
      this.name = name;
    }

    /**
     * @see Fields.Field.toModel for more information.
     */
    toModel(
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: Fields.ModelContext,
    ): void {
      const value = tableData[this.alias || name];
      if (value !== undefined) modelData[name] = new Date((value as number) * 1000);
    }

    /**
     * @see Fields.Field.toTable for more information.
     */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: Fields.TableContext,
    ): void {
      if (Table.isPutAction(context.action)) tableData[this.alias || name] = Math.round(this.now().valueOf() / 1000);
    }
  }

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
     * Initialize the Field.
     * @param type Name of type.
     * @param alias Table attribute name to map this model property to.
     */
    constructor(options: UpdateDateOptions = {}) {
      this.alias = options.alias;
      if (options.now) this.now = options.now;
    }

    /**
     * @see Fields.Field.init for more information.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    init(name: string, model: Model): void {
      this.name = name;
    }

    /**
     * @see Fields.Field.toModel for more information.
     */
    toModel(
      name: string,
      tableData: Table.AttributeValuesMap,
      modelData: Model.ModelData,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: Fields.ModelContext,
    ): void {
      const value = tableData[this.alias || name];
      if (value !== undefined) modelData[name] = new Date((value as number) * 1000);
    }

    /**
     * @see Fields.Field.toTable for more information.
     */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: Fields.TableContext,
    ): void {
      if (Table.isPutAction(context.action)) tableData[this.alias || name] = Math.round(this.now().valueOf() / 1000);
    }

    /**
     * @see Fields.Field.toTableUpdate for more information.
     */
    toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.UpdateMapValue,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: Fields.TableContext,
    ): void {
      tableData[this.alias || name] = Math.round(this.now().valueOf() / 1000);
    }
  }
}
