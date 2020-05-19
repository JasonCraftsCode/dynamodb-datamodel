/* eslint-disable tsdoc/syntax */
import { Condition } from './Condition';
import { Model } from './Model';
import { Table } from './Table';
import { Update } from './Update';

/**
 * Collection of functions for constructing a Model schema with Field objects and the Field classes.
 * Fields use function chaining to
 * @example Using Model
 * ```typescript
 * import { Fields, Model, Update } from 'dynamodb-datamodel';
 *
 * // (TypeScript) Define model key and item interface.
 * interface ModelKey {
 *   id: string;
 * }
 * interface ModelItem extends ModelKey {
 *   name: Update.String;
 *   age?: Update.Number;
 *   children?: Update.List<{ name: string, age: number}>;
 *   sports?: Update.StringSet;
 * }
 *
 * // Define the schema using Fields
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
 *
 * // Use model to read and write to the dynamodb table
 * ```
 * @public
 */
export class Fields {
  /**
   * Creates a string field object to use in a {@link Model.schema}.
   * @param options - Options to initialize field with.
   * @returns New field object.
   */
  static string(options?: Fields.BaseOptions<string>): Fields.FieldString {
    return new Fields.FieldString(options);
  }

  /**
   * Creates a number field object to use in a {@link Model.schema}.
   * @param options - Options to initialize field with.
   * @returns New field object.
   */
  static number(options?: Fields.BaseOptions<number>): Fields.FieldNumber {
    return new Fields.FieldNumber(options);
  }

  /**
   * Creates a binary field object to use in a {@link Model.schema}.
   * @param options - Options to initialize field with.
   * @returns New field object.
   */
  static binary(options?: Fields.BaseOptions<Table.BinaryValue>): Fields.FieldBinary {
    return new Fields.FieldBinary(options);
  }

  /**
   * Creates a boolean field object to use in a {@link Model.schema}.
   * @param options - Options to initialize field with.
   * @returns New field object.
   */
  static boolean(options?: Fields.BaseOptions<boolean>): Fields.FieldBoolean {
    return new Fields.FieldBoolean(options);
  }

  /**
   * Creates a string set field object to use in a {@link Model.schema}.
   * @param options - Options to initialize field with.
   * @returns New field object.
   */
  static stringSet(options?: Fields.BaseOptions<Table.StringSetValue>): Fields.FieldStringSet {
    return new Fields.FieldStringSet(options);
  }

  /**
   * Creates a number set field object to use in a {@link Model.schema}.
   * @param options - Options to initialize field with.
   * @returns New field object.
   */
  static numberSet(options?: Fields.BaseOptions<Table.NumberSetValue>): Fields.FieldNumberSet {
    return new Fields.FieldNumberSet(options);
  }

  /**
   * Creates a binary set field object to use in a {@link Model.schema}.
   * @param options - Options to initialize field with.
   * @returns New field object.
   */
  static binarySet(options?: Fields.BaseOptions<Table.BinarySetValue>): Fields.FieldBinarySet {
    return new Fields.FieldBinarySet(options);
  }

  /**
   * Creates a list field object to use in a {@link Model.schema}.
   * @param options - Options to initialize field with.
   * @returns New field object.
   */
  static list(options?: Fields.BaseOptions<Table.ListValue>): Fields.FieldList<Table.AttributeValues> {
    return new Fields.FieldList(options);
  }

  /**
   * Creates a schema based list field object to use in a {@link Model.schema}.
   * @param V - Interface of model to use for schema.
   * @param options - Options to initialize field with.
   * @returns New field object.
   */
  static modelList<V>(options: Fields.ModelListOptions<V>): Fields.FieldModelList<V> {
    return new Fields.FieldModelList<V>(options);
  }

  /**
   * Creates a map field object to use in a {@link Model.schema}.
   * @param options - Options to initialize field with.
   * @returns New field object.
   */
  static map(options?: Fields.BaseOptions<Table.MapValue>): Fields.FieldMap<Table.AttributeValues> {
    return new Fields.FieldMap(options);
  }

  /**
   * Creates a schema based map field object to use in a {@link Model.schema}.
   * @param V - Interface of model to use for schema.
   * @param options - Options to initialize field with.
   * @returns New field object.
   */
  static modelMap<V>(options: Fields.ModelMapOptions<V>): Fields.FieldModelMap<V> {
    return new Fields.FieldModelMap<V>(options);
  }

  /**
   * Creates a schema based map field object to use in a {@link Model.schema}.
   * @param V - Interface of model to use for schema.
   * @param options - Options to initialize field with.
   * @returns New field object.
   */
  static model<V>(options: Fields.ModelOptions<V>): Fields.FieldModel<V> {
    return new Fields.FieldModel<V>(options);
  }

  /**
   * Creates a date field object to use in a {@link Model.schema}, stored as a number in the table.
   * @param options - Options to initialize field with.
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
   * Example: Model schema contains 'id: Fields.split(\{ aliases: ['P','S'] \})' and when id = 'guid.date' the field will split the id value
   * in to the table primary key of \{ P: 'guid', S: 'date' \}
   * @example
   * ```typescript
   * import { Fields, Model } from 'dynamodb-datamodel';
   *
   * // (TypeScript) Define model key and item interface.
   * interface ModelKey {
   *   id: string;
   * }
   *
   * // Define the schema using Fields
   * const model = Model.createModel<ModelKey, ModelKey>({
   *   schema: {
   *     id: Fields.split({ aliases:['P', 'S'] }),
   *   },
   *   // ...additional properties like table
   * });
   * ```
   * @param options - Options to initialize field with.
   * @returns New field object.
   */
  static split(options: Fields.SplitOptions): Fields.FieldSplit {
    return new Fields.FieldSplit(options);
  }

  /**
   * Creates an indices based slots composite field object which can then return FieldCompositeSlot by index to use in a {@link Model.schema}.
   * @example
   * ```typescript
   * import { Fields, Model } from 'dynamodb-datamodel';
   *
   * // (TypeScript) Define model key and item interface.
   * interface ModelKey {
   *   id: string;
   * }
   * // street, city, state and country only support simple set updates since
   * // they are part of a composite key
   * interface ModelItem extends ModelKey {
   *   street: string;
   *   city: string;
   *   state: string;
   *   country: string;
   * }
   *
   * // Create composite slots to use in model schema below.
   * const location = Fields.composite({alias: 'G0S', count: 4});
   * const locSlots = location.createSlots();
   *
   * // Define the schema using Fields
   * const model = Model.createModel<ModelKey, ModelKey>({
   *   schema: {
   *     id: Fields.split({ aliases:['P', 'S'] }),
   *     street: locSlots[0],
   *     city: locSlots[1],
   *     state: locSlots[2],
   *     country: locSlots[3],
   *   },
   *   // ...additional properties like table
   * });
   * ```
   * @param options - Options to initialize field with.
   * @returns New composite object.
   */
  static composite(options: Fields.CompositeOptions): Fields.FieldComposite {
    return new Fields.FieldComposite(options);
  }

  /**
   * Creates an name based slots composite field object which can then return FieldCompositeSlot by name to use in a {@link Model.schema}.
   * @example [Fields.compositeNamed.test.ts]{@link https://github.com/JasonCraftsCode/dynamodb-datamodel/blob/master/__test__/examples/Fields.compositeNamed.test.ts}, (imports: [./ExampleIndex]{@link https://github.com/JasonCraftsCode/dynamodb-datamodel/blob/master/__test__/examples/ExampleIndex.ts}, [./ExampleTable]{@link https://github.com/JasonCraftsCode/dynamodb-datamodel/blob/master/__test__/examples/ExampleTable.ts})
   * ```typescript
   * [[include:Fields.compositeNamed.test.ts]]
   * ```
   *
   * @example
   * ```typescript
   * import { Fields, Model } from 'dynamodb-datamodel';
   *
   * // (TypeScript) Define model key and item interface.
   * interface ModelKey {
   *   id: string;
   * }
   * // street, city, state and country only support simple set updates since
   * // they are part of a composite key
   * interface ModelItem extends ModelKey {
   *   street: string;
   *   city: string;
   *   state: string;
   *   country: string;
   * }
   *
   * // Create composite slots to use in model schema below.
   * const locMap = { street: 0, city: 1, state: 2, country: 3 };
   * const location = Fields.compositeNamed({alias: 'G0S', map: locMap});
   * const locSlots = location.createNamedSlots();
   *
   * // Define the schema using Fields
   * const model = Model.createModel<ModelKey, ModelItem>({
   *   schema: {
   *     id: Fields.split({ aliases:['P', 'S'] }),
   *     street: locSlots.street,
   *     city: locSlots.city,
   *     state: locSlots.state,
   *     country: locSlots.country,
   *   },
   *   // ...additional properties like table
   * });
   * ```
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
   * ```typescript
   * import { Fields, Model } from 'dynamodb-datamodel';
   *
   * // (TypeScript) Define model key and item interface.
   * interface ModelKey {
   *   id: string;
   * }
   * interface ModelItem extends Key {
   *
   * }
   *
   * // Define the schema using Fields
   * const model = Model.createModel<ModelKey, ModelItem>({
   *   schema: {
   *     id: Fields.split({ aliases:['P', 'S'] }),
   *   },
   *   // ...additional properties like table
   * });
   * ```
   * @param options - Options to initialize field with.
   * @returns New field object.
   */
  static type(options?: Fields.TypeOptions): Fields.FieldType {
    return new Fields.FieldType(options);
  }

  /**
   * Creates a field that add a created date to a table attribute.
   * @param options - Options to initialize field with.
   * @returns New field object.
   */
  static createdDate(options?: Fields.CreatedDateOptions): Fields.FieldCreatedDate {
    return new Fields.FieldCreatedDate(options);
  }

  /**
   * Creates a field that adds an updated date to a table attribute.
   * @param options - Options to initialize field with.
   * @returns New field object.
   */
  static updatedDate(options?: Fields.UpdateDateOptions): Fields.FieldUpdatedDate {
    return new Fields.FieldUpdatedDate(options);
  }
}

/** @public */
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

  /**
   *
   */
  export interface AttributeDefinition {
    type: Table.AttributeTypes;
  }

  /**
   *
   */
  export type AttributesSchema = { [key: string]: AttributeDefinition };

  /**
   * The core interface all Fields implement and is used by {@link Model} to basically map model data to and from the
   * table data.
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
     * @param name - Name of the model attribute this field is associated with (generally same as {@link init} name argument)
     * @param tableData - Data from the table that needs to be mapped to the model data.
     * @param modelData - Data object for the model that this method will append to.
     * @param context - Current context this method is being called in.
     */
    toModel(name: string, tableData: Table.AttributeValuesMap, modelData: Model.ModelData, context: ModelContext): void;

    /**
     * Method called **before** calling into the table object to read and write to the table.  This method will convert the model data
     * into table data and append read or write conditions.
     * @param name - Name of the model attribute this field is associated with (generally same as {@link init} name argument)
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
    toTableUpdate?(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.ResolverMap,
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
      context: ModelContext,
    ): void {
      const value = tableData[this.alias || name];
      if (value !== undefined) modelData[name] = value;
    }

    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTable} */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: TableContext,
    ): void {
      let value = (modelData[name] as unknown) as V | undefined;
      if (value === undefined) value = this.getDefault(name, modelData, context);
      if (value !== undefined) tableData[this.alias || name] = value;
    }

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

  /** @public */
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
   * @param T - Type name for the Condition.Resolver for automatic type checking.
   */
  export class FieldExpression<V, T extends Table.AttributeTypes> extends FieldBase<V> {
    /**
     * Helper method that just calls {@link Condition.path} with tableName() as value param.
     * See {@link Condition.path} for more info and examples.
     */
    path(): Condition.Resolver<T> {
      return Condition.path(this.tableName());
    }

    /**
     * Helper method that just calls {@link Condition.eq} with tableName() as left param.
     * See {@link Condition.eq} for more info and examples.
     */
    eq(v: V): Condition.Resolver<T> {
      return Condition.eq(this.tableName(), v);
    }

    /**
     * Helper method that just calls {@link Condition.ne} with tableName() as left param.
     * See {@link Condition.ne} for more info and examples.
     */
    ne(v: V): Condition.Resolver<T> {
      return Condition.ne(this.tableName(), v);
    }

    /**
     * Helper method that just calls {@link Condition.lt} with tableName() as left param.
     * See {@link Condition.lt} for more info and examples.
     */
    lt(v: V): Condition.Resolver<T> {
      return Condition.lt(this.tableName(), v);
    }

    /**
     * Helper method that just calls {@link Condition.le} with tableName() as left param.
     * See {@link Condition.le} for more info and examples.
     */
    le(v: V): Condition.Resolver<T> {
      return Condition.le(this.tableName(), v);
    }

    /**
     * Helper method that just calls {@link Condition.gt} with tableName() as left param.
     * See {@link Condition.gt} for more info and examples.
     */
    gt(v: V): Condition.Resolver<T> {
      return Condition.gt(this.tableName(), v);
    }

    /**
     * Helper method that just calls {@link Condition.ge} with tableName() as left param.
     * See {@link Condition.ge} for more info and examples.
     */
    ge(v: V): Condition.Resolver<T> {
      return Condition.ge(this.tableName(), v);
    }

    /**
     * Helper method that just calls {@link Condition.between} with tableName() as path param.
     * See {@link Condition.between} for more info and examples.
     */
    between(from: V, to: V): Condition.Resolver<T> {
      return Condition.between(this.tableName(), from, to);
    }

    /**
     * Helper method that just calls {@link Condition.in} with tableName() as path param.
     * See {@link Condition.in} for more info and examples.
     */
    in(v: V[]): Condition.Resolver<T> {
      return Condition.in(this.tableName(), v);
    }

    /**
     * Helper method that just calls {@link Condition."type"} with tableName() as path param.
     * See {@link Condition."type"} for more info and examples.
     */
    type(type: Table.AttributeTypes): Condition.Resolver<T> {
      return Condition.type(this.tableName(), type);
    }

    /**
     * Helper method that just calls {@link Condition.exists} with tableName() as path param.
     * See {@link Condition.exists} for more info and examples.
     */
    exists(): Condition.Resolver<T> {
      return Condition.exists(this.tableName());
    }

    /**
     * Helper method that just calls {@link Condition.notExists} with tableName() as path param.
     * See {@link Condition.notExists} for more info and examples.
     */
    notExists(): Condition.Resolver<T> {
      return Condition.notExists(this.tableName());
    }
  }

  /**
   * String property field
   */
  export class FieldString extends FieldExpression<string, 'S'> {
    /**
     * Helper method that just calls {@link Condition.size} with tableName() as path param.
     * See {@link Condition.size} for more info and examples.
     */
    size(): Condition.Resolver<'S'> {
      return Condition.size(this.tableName());
    }

    /**
     * Helper method that wraps {@link Condition.contains}.
     * See {@link Condition.contains} for more info and examples.
     */
    contains(value: string): Condition.Resolver<'S'> {
      return Condition.contains(this.tableName(), value);
    }

    /**
     *  Helper method that wraps {@link Condition.beginsWith}.
     * See {@link Condition.beginsWith} for more info and examples.
     */
    beginsWith(value: string): Condition.Resolver<'S'> {
      return Condition.beginsWith(this.tableName(), value);
    }
  }

  /**
   * Number property field.
   */
  export class FieldNumber extends FieldExpression<number, 'N'> {}

  /**
   * Binary property field.
   */
  export class FieldBinary extends FieldExpression<Table.BinaryValue, 'B'> {
    /**
     * Helper method that just calls {@link Condition.size} with tableName() as path param.
     * See {@link Condition.size} for more info and examples.
     */
    size(): Condition.Resolver<'B'> {
      return Condition.size(this.tableName());
    }
  }

  /**
   * Boolean property field.
   */
  export class FieldBoolean extends FieldExpression<boolean, 'BOOL'> {}

  /**
   * Null property field.
   */
  export class FieldNull extends FieldExpression<null, 'NULL'> {}

  /**
   *  Generic set property field is base class for {@link FieldStringSet}, {@link FieldStringSet}, and {@link FieldStringSet}.
   */
  export class FieldSet<V, T extends 'BS' | 'NS' | 'SS'> extends FieldExpression<V, T> {
    /**
     * Helper method that just calls {@link Condition.size} with tableName() as path param.
     * See {@link Condition.size} for more info and examples.
     */
    size(): Condition.Resolver<T> {
      return Condition.size(this.tableName());
    }

    /**
     * Helper method that just calls {@link Condition.contains} with tableName() as path param.
     * See {@link Condition.contains} for more info and examples.
     */
    contains(value: string): Condition.Resolver<T> {
      return Condition.contains(this.tableName(), value);
    }
  }

  /**
   * String set property field.
   */
  export class FieldStringSet extends FieldSet<Table.StringSetValue, 'SS'> {}

  /**
   * Number set property field.
   */
  export class FieldNumberSet extends FieldSet<Table.NumberSetValue, 'NS'> {}

  /**
   * Binary set property field.
   */
  export class FieldBinarySet extends FieldSet<Table.BinarySetValue, 'BS'> {}

  /**
   * List property field.
   */
  export class FieldList<V extends Table.AttributeValues> extends FieldExpression<V[], 'L'> {
    /**
     * Helper method that just calls {@link Condition.size} with tableName() as path param.
     * See {@link Condition.size} for more info and examples.
     */
    size(): Condition.Resolver<'L'> {
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
   * Model list property field.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export class FieldModelList<V extends { [key: string]: any }> extends FieldList<V> {
    /**
     * Defines the schema for the list type.
     */
    schema: Model.ModelSchemaT<V>;

    constructor(options: ModelListOptions<V>) {
      super(options) /* istanbul ignore next: needed for ts with es5 */;
      this.schema = options.schema;
    }

    /**
     * Initializes the schema property
     * See {@link Field.init} for more information.
     */
    init(name: string, model: Model): void {
      super.init(name, model);
      Model.initSchema(this.schema, model);
    }
  }

  /**
   * Map property field.
   * @param V - Type for map values.
   */
  export class FieldMap<V extends Table.AttributeValues> extends FieldExpression<{ [key: string]: V }, 'M'> {
    /**
     * Helper method that just calls {@link Condition.size} with tableName() as path param.
     * See {@link Condition.size} for more info and examples.
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

  /**
   * FieldModelMap constructor options.
   * @param V - Type of the map value.
   */
  export interface ModelMapOptions<V> extends BaseOptions<{ [key: string]: V }> {
    schema: Model.ModelSchemaT<V>;
  }

  /**
   * Map of model property field.
   * @param V - Type of the map value.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export class FieldModelMap<V extends { [key: string]: any }> extends FieldMap<V> {
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
     * See {@link Field.init} for more information.
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
    schema: Model.ModelSchemaT<V>;
  }

  /**
   * Model property field.
   * @param V - Type of the map value.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export class FieldModel<V extends { [key: string]: any }> extends FieldExpression<V, 'M'> {
    schema: Model.ModelSchemaT<V>;

    constructor(options: ModelOptions<V>) {
      super(options) /* istanbul ignore next: needed for ts with es5 */;
      this.schema = options.schema;
    }

    /**
     * See {@link Field.init} for more information.
     */
    init(name: string, model: Model): void {
      super.init(name, model);
      Model.initSchema(this.schema, model);
    }

    /**
     * Helper method that just calls {@link Condition.size} with tableName() as path param.
     * See {@link Condition.size} for more info and examples.
     */
    size(): Condition.Resolver<'M'> {
      return Condition.size(this.tableName());
    }
  }

  /**
   * Date property field.
   */
  export class FieldDate extends FieldBase<Date> {
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toModel} */
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

    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTable} */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: TableContext,
    ): void {
      let value = modelData[name] as Date | undefined;
      if (value === undefined) value = super.getDefault(name, modelData, context);
      if (value !== undefined) tableData[this.alias || name] = Math.round(value.valueOf() / 1000);
    }

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
   * Hidden property field.  Used to avoid writing a property to the DynamoDb table.
   */
  export class FieldHidden implements Fields.Field {
    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.init} */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    init(name: string, model: Model): void {}

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
  }

  /**
   * Composite slot property field, comes from the call to createSlots on FieldCompositeSlot.
   */
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
      context: ModelContext,
    ): void {
      //if (this.composite.writeOnly) return;
      const value = tableData[this.composite.alias];
      if (typeof value !== 'string') return;
      const parts = value.split(this.composite.delimiter);
      //if (this.slot >= parts.length) return;
      modelData[name] = parts[this.slot];
    }

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

    //toLower?: boolean;
    //slots?: CreateCompositeSlot[];
    //writeOnly?: boolean;
  }

  /**
   *
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
     * @defaultValue '.'
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
  export type CompositeSlotMap<T extends { [index: string]: number }, V extends { [index: string]: Field } = {}> = V &
    {
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
   * Composite
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
      context: ModelContext,
    ): void {
      const parts: string[] = [];
      this.aliases.forEach((alias) => {
        const part = tableData[alias];
        if (part) parts.push(part.toString());
      });
      if (parts.length > 0) modelData[name] = parts.join(this.delimiter);
    }

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
   * Type
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
     * @param type - Name of type.
     * @param alias - Table attribute name to map this model property to.
     */
    constructor(options: CreatedDateOptions = {}) {
      this.alias = options.alias;
      if (options.now) this.now = options.now;
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
      if (value !== undefined) modelData[name] = new Date((value as number) * 1000);
    }

    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTable} */
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
     * @param type - Name of type.
     * @param alias - Table attribute name to map this model property to.
     */
    constructor(options: UpdateDateOptions = {}) {
      this.alias = options.alias;
      if (options.now) this.now = options.now;
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
      if (value !== undefined) modelData[name] = new Date((value as number) * 1000);
    }

    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTable} */
    toTable(
      name: string,
      modelData: Model.ModelData,
      tableData: Table.AttributeValuesMap,
      context: Fields.TableContext,
    ): void {
      if (Table.isPutAction(context.action)) tableData[this.alias || name] = Math.round(this.now().valueOf() / 1000);
    }

    /** @inheritDoc {@inheritDoc (Fields:namespace).Field.toTableUpdate} */
    toTableUpdate(
      name: string,
      modelData: Model.ModelUpdate,
      tableData: Update.ResolverMap,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: Fields.TableContext,
    ): void {
      tableData[this.alias || name] = Math.round(this.now().valueOf() / 1000);
    }
  }
}
