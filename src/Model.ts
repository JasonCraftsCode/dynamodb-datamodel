import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Fields } from './Fields';
import { Table } from './Table';
import { Update } from './Update';

/**
 * The Model object that wraps access to the DynamoDB table and makes it easy to map table data to
 * and from model data.
 *
 * @example [examples/Model.ts]{@link https://github.com/JasonCraftsCode/dynamodb-datamodel/blob/master/examples/Model.ts} (imports: [examples/Table.ts]{@link https://github.com/JasonCraftsCode/dynamodb-datamodel/blob/master/examples/Table.ts})
 * ```typescript
 * [[include:Model.ts]]
 * ```
 *
 * @public
 */
export class Model implements Model.ModelBase {
  /**
   * The type name of the model.  Used by {@link Fields."type"} to set a type attribute.
   */
  name?: string;

  /**
   * Schema to use for mapping data between the model and table data.
   */
  schema: Model.ModelSchema;

  /**
   * Table to used for reading and writing model data to dynamodb.
   */
  table: Table;

  /**
   * Initialize this class with params.
   * @param params - Params to initialize this class with.
   */
  constructor(params: Model.ModelParams) {
    this.name = params.name;
    this.schema = params.schema;
    // TODO: register model with table to support query and scan data mapping
    this.table = params.table;
    Model.initSchema(this.schema, this);
  }

  /**
   * Converts table item data to model data.  Method called from the in the model methods after reading or
   * writing data to the table to convert the item and attribute output to model properties.
   * @param data - Table item data to convert to model data.
   * @param context - Context used for converting table to model data, passed to each field object.
   * @returns Model data converted from the table data.
   */
  toModel(data: Table.AttributeValuesMap | undefined, context: Fields.ModelContext): Model.ModelOut | undefined {
    const tableData = data || {};
    const modelData: Model.ModelOut = {};
    Object.keys(this.schema).forEach((key) => this.schema[key].toModel(key, tableData, modelData, context));
    return Object.keys(modelData).length > 0 ? modelData : undefined;
  }

  /**
   * Converts model data to table data.  Methods called called from the model methods before reading or
   * writing data to the table, to convert the model data to the table data.
   * @param data - Model data to convert to table data.
   * @param context - Context used for converting model to table data, passed to each field object.
   * @returns Table data converted from the model data.
   */
  toTable(data: Model.ModelData, context: Fields.TableContext): Model.TableData {
    const tableData: Table.AttributeValuesMap = {};
    Object.keys(this.schema).forEach((key) => this.schema[key].toTable(key, data, tableData, context));
    return Model.splitTableData(this.table, tableData);
  }

  /**
   * Converts model update data to table update data, similar to {@link toTable} but since table updates
   * supports attribute based update expressions updates are handled differently then other actions.
   * @param data - Model update data to convert to table update data.
   * @param context - Context used for converting model to table data, passed to each field object.
   * @returns Table data converted from the model data.
   */
  toTableUpdate(data: Model.ModelUpdate, context: Fields.TableContext): Model.TableUpdateData {
    const tableData: Table.AttributeValuesMap = {};
    Object.keys(this.schema).forEach((key) => {
      const field = this.schema[key];
      if (field.toTableUpdate) field.toTableUpdate(key, data, tableData, context);
    });
    return Model.splitTableData(this.table, tableData);
  }

  /**
   * Generate the context used in {@link toModel}, {@link toTable} and {@link toTableUpdate}.
   * @param action - Type of table item action is currently executing.
   * @param options - Options used when reading or writing to the table.
   */
  getContext(action: Table.ItemActions, options: Table.BaseOptions): Fields.TableContext {
    if (!options.conditions) options.conditions = [];
    return { action, conditions: options.conditions, options, model: this };
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.get]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property}.
   * @param key - Model key of the item to get.
   * @param options - Additional optional options to use for get.
   * @returns Input params for [DocumentClient.get]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property}.
   */
  getParams(key: Model.ModelCore, options: Table.GetOptions = {}): DocumentClient.GetItemInput {
    const tableData = this.toTable(key, this.getContext('get', options));
    return this.table.getParams(tableData.key, options);
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.delete]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#delete-property}.
   * @param key - Model key of the item to delete.
   * @param options - Additional optional options to use for delete.
   * @returns Input params for [DocumentClient.delete]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#delete-property}.
   */
  deleteParams(key: Model.ModelCore, options: Table.DeleteOptions = {}): DocumentClient.DeleteItemInput {
    const tableData = this.toTable(key, this.getContext('delete', options));
    return this.table.deleteParams(tableData.key, options);
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.put]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property}.
   * @param item - Model item data to put.
   * @param options - Additional optional options to use for put.
   * @returns Input params for [DocumentClient.put]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property}.
   */
  putParams(item: Model.ModelCore, options: Table.PutOptions = {}): DocumentClient.PutItemInput {
    const action = Table.getPutAction(options.writeOptions);
    const tableData = this.toTable(item, this.getContext(action, options));
    return this.table.putParams(tableData.key, tableData.item, options);
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.update]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property}.
   * @param item - Model item data or update resolver to update.
   * @param options - Additional optional options to use for update.
   * @returns Input params for [DocumentClient.update]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property}.
   */
  updateParams(item: Model.ModelUpdate, options: Table.UpdateOptions = {}): DocumentClient.UpdateItemInput {
    const tableData = this.toTableUpdate(item, this.getContext('update', options));
    return this.table.updateParams(tableData.key, tableData.item, options);
  }

  /**
   * Wrapper method for [DocumentClient.get]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property} method.
   * That uses the model as input and output.
   * @param key - Model key of item to get.
   * @param options - Additional optional options to use for get.
   * @returns An async promise that contains the model data and the table get result object.
   */
  async get(key: Model.ModelCore, options: Table.GetOptions = {}): Promise<Model.GetOutput> {
    const context = this.getContext('get', options);
    const tableData = this.toTable(key, context);
    const result = await this.table.get(tableData.key, options);
    const item = this.toModel(result.Item, context);
    return { item, result };
  }

  /**
   * Wrapper method for [DocumentClient.delete]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#delete-property} method.
   * That uses the model as input and output.
   * @param key - Model key of item to delete.
   * @param options - Additional optional options to use for delete.
   * @returns An async promise that contains the model data and the table delete result object.
   */
  async delete(key: Model.ModelCore, options: Table.DeleteOptions = {}): Promise<Model.DeleteOutput> {
    const context = this.getContext('delete', options);
    const tableData = this.toTable(key, context);
    const result = await this.table.delete(tableData.key, options);
    const item = this.toModel(result.Attributes, context);
    return { item, result };
  }

  /**
   * Adds the model item to the table and ensures it doesn't already exists.
   * See {@link put} for params details.
   */
  create(data: Model.ModelCore, options: Table.PutOptions = {}): Promise<Model.PutOutput> {
    options.writeOptions = 'NotExists';
    return this.put(data, options);
  }

  /**
   * Replaces the model item in the table only if it already exists.
   * See {@link put} for details.
   */
  replace(data: Model.ModelCore, options: Table.PutOptions = {}): Promise<Model.PutOutput> {
    options.writeOptions = 'Exists';
    return this.put(data, options);
  }

  /**
   * Wrapper method for [DocumentClient.put]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property} method.
   * That uses the model as input and output.
   * @param item - Model data of the item to put.
   * @param options - Additional optional options to use for put.
   * @returns An async promise that contains the model data and the table put result object.
   */
  async put(data: Model.ModelCore, options: Table.PutOptions = {}): Promise<Model.PutOutput> {
    const action = Table.getPutAction(options.writeOptions);
    const context = this.getContext(action, options);
    const tableData = this.toTable(data, context);
    const result = await this.table.put(tableData.key, tableData.item, options);
    const item = this.toModel(tableData.data, context);
    return { item, result };
  }

  /**
   * Wrapper method for [DocumentClient.update]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property} method.
   * That uses the model as input and output.
   * @param item - Model data of the item to update.
   * @param options - Additional optional options to use for update.
   * @returns An async promise that contains the model data and the table update result object.
   */
  async update(data: Model.ModelUpdate, options: Table.UpdateOptions = {}): Promise<Model.UpdateOutput> {
    const context = this.getContext('update', options);
    const tableData = this.toTableUpdate(data, context);
    const result = await this.table.update(tableData.key, tableData.item, options);
    const item = this.toModel(result.Attributes, context);
    return { item, result };
  }

  /**
   * Helper method that splits the table data into a key and item.
   * @param table - Table used to determine what attributes are keys.
   * @param data - Table data to split into key and item.
   */
  static splitTableData(table: Table, data: Table.AttributeValuesMap): Model.TableData {
    const key: Table.PrimaryKey.AttributeValuesMap = {};
    const item: Table.AttributeValuesMap = { ...data };
    Object.keys(table.keySchema).forEach((name) => {
      const value = data[name];
      if (value === undefined || value === null) return;
      key[name] = value;
      delete item[name];
    });
    return { key, item, data };
  }

  /**
   * Initializes each field in the schema with the model and associated property name.
   * @param schema - Model schema to initialize.
   * @param model - Model to use when initialize each field in the schema.
   */
  static initSchema(schema: Model.ModelSchema, model: Model): void {
    Object.keys(schema).forEach((key) => schema[key].init(key, model));
  }
}

/**
 * Is also a namespace for scoping Model based interfaces and types.
 * @public
 * */
// eslint-disable-next-line @typescript-eslint/no-namespace, no-redeclare
export namespace Model /* istanbul ignore next: needed for ts with es5 */ {
  /**
   * Interface used in {@link Field.init}.
   */
  export interface ModelBase {
    /**
     * The type name of the model.  Used by {@link Fields."type"} to set a type attribute.
     */
    name?: string;

    /**
     * Schema to use for mapping data between the model and table data.
     */
    schema: Model.ModelSchema;

    /**
     * Table to used for reading and writing model data to dynamodb.
     */
    table: Table;
  }

  /**
   * Types supported by the Model.
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  export type ModelType = number | string | boolean | null | object;

  /**
   * Item data supported by the Model.
   */
  export type ModelData = { [key: string]: ModelType };

  /**
   * Data returned from {@link Model.toTable}.
   */
  export interface TableData {
    /** All item table attributes. */
    data: Table.AttributeValuesMap;
    /** Primary key for item. */
    key: Table.PrimaryKey.AttributeValuesMap;
    /** Rest of the item attributes. */
    item?: Table.AttributeValuesMap;
  }

  /**
   * Data returned from {@link Model.toTableUpdate}.
   */
  export interface TableUpdateData {
    /** All item table update attributes. */
    data: Update.ResolverMap;
    /** Primary key for item. */
    key: Table.PrimaryKey.AttributeValuesMap;
    /** Rest of the item update attributes. */
    item?: Update.ResolverMap;
  }

  /**
   * Params used when creating {@link Model}.
   */
  export interface ModelParams {
    /**
     * The type name of the model.  Used by {@link Fields."type"} to set a type attribute.
     */
    name?: string;

    /**
     * Schema to use for mapping data between the model and table data.
     */
    schema: Model.ModelSchema;

    /**
     * Table to used for reading and writing model data to dynamodb.
     */
    table: Table;
  }

  /**
   * Model property value used for item updates.
   */
  export type ModelUpdateValue<T> = Extract<T, ModelType | Update.Resolver<Table.AttributeTypes>> | null;

  /**
   * Type for the Model schema which contains a Field for each Model property.
   */
  export type ModelSchema = { [key: string]: Fields.Field };

  /**
   * Model input type used in most Model methods.
   */
  export type ModelCore = { [key: string]: ModelType };

  /**
   * Model output type used in most Model methods.
   */
  export type ModelOut = { [key: string]: ModelType };

  /**
   * Model input type used for update Model methods.
   */
  export type ModelUpdate = {
    [key: string]: ModelUpdateValue<ModelType>;
  };

  /**
   * Base output type for the Model read/write methods.
   */
  export interface BaseOutput<ITEM, RESULT> {
    /**
     * Model item data read from the table.
     */
    item?: ModelOutT<ITEM>;

    /**
     * The result of the table read/write.
     */
    result: RESULT;
  }

  /**
   * Return value of {@link Model.get}.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface GetOutput<T = ModelOut> extends BaseOutput<T, DocumentClient.GetItemOutput> {}

  /**
   * Return value of {@link Model.create}, {@link Model.replace} and {@link Model.put}.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface PutOutput<T = ModelOut> extends BaseOutput<T, DocumentClient.PutItemOutput> {}

  /**
   * Return value of {@link Model.delete}.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DeleteOutput<T = ModelOut> extends BaseOutput<T, DocumentClient.DeleteItemOutput> {}

  /**
   * Return value of {@link Model.update}.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface UpdateOutput<T = ModelOut> extends BaseOutput<T, DocumentClient.UpdateItemOutput> {}

  /**
   * Type for the ModelT schema which contains a Field for each Model property.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ModelSchemaT<T extends { [key: string]: any }> = {
    [P in keyof Required<T>]: Fields.Field;
  };

  /**
   * Model input type used in most ModelT methods.
   */
  export type ModelCoreT<T> = {
    [P in keyof T]: Extract<T[P], ModelType>;
  };

  /**
   * Model output type used in most ModelT methods.
   */
  export type ModelOutT<T> = {
    [P in keyof T]: Extract<T[P], ModelType>;
  };

  /**
   * Model input type used for update Model methods.
   */
  export type ModelUpdateT<T> = {
    [P in keyof Table.Optional<T>]: ModelUpdateValue<T[P]>;
  };

  /**
   * Params used when creating {@link ModelT}.
   * @param KEY - Key part of the model used for get and delete actions.
   * @param MODEL - The model interface.
   */
  export interface ModelParamsT<KEY, MODEL extends KEY = KEY> extends ModelParams {
    /**
     * Schema to use for mapping data between the model and table data.
     */
    schema: ModelSchemaT<MODEL>;
  }

  /**
   * Generic version of Model, see {@link Model} for more details.
   * @param KEY - Key part of the model used for get and delete actions.
   * @param MODEL - The model interface.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export interface ModelT<KEY extends { [key: string]: any }, MODEL extends KEY = KEY> extends Model {
    /**
     * Schema to use for mapping data between the model and table data.
     */
    schema: Model.ModelSchemaT<MODEL>;

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Model:class).toModel} */
    toModel(data: Table.AttributeValuesMap): Model.ModelOutT<MODEL>;

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Model:class).toTable} */
    toTable(data: Model.ModelCoreT<MODEL>): Model.TableData;

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Model:class).toTableUpdate} */
    toTableUpdate(data: Model.ModelUpdateT<MODEL>): Model.TableUpdateData;

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Model:class).getParams} */
    getParams(key: Model.ModelCoreT<KEY>, options?: Table.GetOptions): DocumentClient.GetItemInput;

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Model:class).deleteParams} */
    deleteParams(key: Model.ModelCoreT<KEY>, options?: Table.DeleteOptions): DocumentClient.DeleteItemInput;

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Model:class).putParams} */
    putParams(data: Model.ModelCoreT<MODEL>, options?: Table.PutOptions): DocumentClient.PutItemInput;

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Model:class).updateParams} */
    updateParams(data: Model.ModelUpdateT<MODEL>, options?: Table.UpdateOptions): DocumentClient.UpdateItemInput;

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Model:class).get} */
    get(key: Model.ModelCoreT<KEY>, options?: Table.GetOptions): Promise<Model.GetOutput<MODEL>>;

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Model:class).delete} */
    delete(key: Model.ModelCoreT<KEY>, options?: Table.DeleteOptions): Promise<Model.DeleteOutput<MODEL>>;

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Model:class).create} */
    create(data: Model.ModelCoreT<MODEL>, options?: Table.PutOptions): Promise<Model.PutOutput<MODEL>>;

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Model:class).replace} */
    replace(data: Model.ModelCoreT<MODEL>, options?: Table.PutOptions): Promise<Model.PutOutput<MODEL>>;

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Model:class).put} */
    put(data: Model.ModelCoreT<MODEL>, options?: Table.PutOptions): Promise<Model.PutOutput<MODEL>>;

    // eslint-disable-next-line tsdoc/syntax
    /** @inheritDoc {@inheritDoc (Model:class).update} */
    update(data: Model.ModelUpdateT<MODEL>, options?: Table.UpdateOptions): Promise<Model.UpdateOutput<MODEL>>;
  }

  /**
   *
   * See {@link Table.createTable} reasoning for having a createTable over support 'new TableT'.
   * @param params - Options to used when creating Model
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-inner-declarations
  export function createModel<KEY extends { [key: string]: any }, MODEL extends KEY = KEY>(
    params: ModelParamsT<KEY, MODEL>,
  ): Model.ModelT<KEY, MODEL> {
    return new Model(params) as Model.ModelT<KEY, MODEL>;
  }
}
