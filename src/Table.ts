/**
 * Table.ts contains the classes used to model a single DynamoDB table with both local and global secondary indexes.
 * @packageDocumentation
 */
import { DocumentClient, ExpressionAttributeNameMap } from 'aws-sdk/clients/dynamodb';
import { Condition, ConditionExpression } from './Condition';
import { ExpressionAttributes } from './ExpressionAttributes';
import { KeyCondition, KeyConditionExpression } from './KeyCondition';
import { Update, UpdateExpression } from './Update';

/**
 * Object that represents the DynamoDB table.
 *
 * In most single table designs secondary indexes will be used like in the following example:
 * @example [examples/Table.ts]{@link https://github.com/jasoncraftscode/dynamodb-datamodel/tree/main/examples/Table.ts} (imports: [examples/Index.ts]{@link https://github.com/jasoncraftscode/dynamodb-datamodel/tree/main/examples/Index.ts})
 * ```typescript
 * [[include:Table.ts]]
 * ```
 *
 * @public
 */
export class Table {
  private _client?: DocumentClient;
  private _createClient: () => DocumentClient;

  /**
   * Name of the DynamoDB table, used to set the TableName when calling DynamoDB methods.
   */
  name: string;

  /**
   * Definition of the attribute types required for table and index primary key and for index projected attributes.
   * These need to be defined at the table level since the attributes are table wide concept.
   */
  keyAttributes: Table.PrimaryKey.AttributeTypesMap;

  /**
   * Schema map for the Table's primary key, in the form of \{ \<partition key name\>: \{ keyType: 'HASH' \} \}.
   */
  keySchema: Table.PrimaryKey.KeyTypesMap;

  /**
   * Determines how errors should be handled.
   * The default is to throw on any errors.
   */
  onError: (msg: string) => void = (msg: string) => {
    throw new Error(msg);
  };

  /**
   * @param params - Initialize the Table's name, attributes, keySchema and index properties.
   */
  constructor(params: Table.TableParams) {
    this.name = params.name;
    this.keyAttributes = params.keyAttributes;
    this.keySchema = params.keySchema;
    this._createClient =
      typeof params.client === 'function' ? params.client : (): DocumentClient => params.client as DocumentClient;
  }

  /**
   * Gets the DocumentClient associated with this Table, which may mean creating one.
   * @returns The DocumentClient used for all Table operations.
   */
  get client(): DocumentClient {
    if (!this._client) this._client = this._createClient();
    return this._client;
  }

  /**
   * Gets the partition key name for the Table.
   * @returns The name of the primary (or HASH) key attribute.
   */
  getPartitionKey(): string {
    return Table.getKeyName(this.keySchema, 'HASH');
  }

  /**
   * Gets the sort key name for the Table.
   * @returns The name of the sort (or RANGE) key attribute.
   */
  getSortKey(): string {
    return Table.getKeyName(this.keySchema, 'RANGE');
  }

  /**
   * Wrapper around the [DocumentClient.createSet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#createSet-property}
   * used by the below create*Set methods to create type safe sets. Choose to leverage DocumentClient
   * implementation of set to allow DocumentClient to correctly auto convert to DynamoDB's native types.
   * @param list - Array of items to create the set from.
   * @param options - Options to pass DocumentClient createSet.
   */
  createSet(
    list: string[] | number[] | Table.BinaryValue[],
    options?: DocumentClient.CreateSetOptions,
  ): Table.AttributeSetValues {
    return this.client.createSet(list, options);
  }

  /**
   * Create a string set from a string array.
   * @param list - String array to create set from.
   * @param options - Options to pass DocumentClient createSet.
   */
  createStringSet(list: string[], options?: DocumentClient.CreateSetOptions): Table.StringSetValue {
    return this.createSet(list, options) as Table.StringSetValue;
  }

  /**
   * Create a number set from a number array.
   * @param list - Number array to create set from.
   * @param options - Options to pass DocumentClient createSet.
   */
  createNumberSet(list: number[], options?: DocumentClient.CreateSetOptions): Table.NumberSetValue {
    return this.createSet(list, options) as Table.NumberSetValue;
  }

  /**
   * Create a binary set from a binary array.
   * @param list - Binary array to create set from.
   * @param options - Options to pass DocumentClient createSet.
   */
  createBinarySet(list: Table.BinaryValue[], options?: DocumentClient.CreateSetOptions): Table.BinarySetValue {
    return this.createSet(list, options) as Table.BinarySetValue;
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.get]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property}.
   * @param key - Primary key of the item to get.
   * @param options - Additional optional options to use for get.
   * @returns Input params for [DocumentClient.get]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property}.
   */
  getParams(key: Table.PrimaryKey.AttributeValuesMap, options: Table.GetOptions = {}): Table.GetInput {
    return Table.addParams<Table.GetInput>({ TableName: this.name, Key: key }, options);
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.delete]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#delete-property}.
   * @param key - Primary key of the item to delete.
   * @param options - Additional optional options to use for delete.
   * @returns Input params for [DocumentClient.delete]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#delete-property}.
   */
  deleteParams(
    key: Table.PrimaryKey.AttributeValuesMap,
    options: Table.DeleteOptions = {},
  ): DocumentClient.DeleteItemInput {
    return Table.addParams<DocumentClient.DeleteItemInput>({ TableName: this.name, Key: key }, options);
  }

  /**
   * Get the condition that is needed to support a specific PutWriteOptions.
   * @param options - Type of put to get the condition for.
   * @returns Condition resolver that maps to the PutWriteOptions.
   */
  getPutCondition(options: Table.PutWriteOptions | undefined): Condition.Resolver | void {
    if (options === 'Exists') return Condition.exists(this.getPartitionKey());
    if (options === 'NotExists') return Condition.notExists(this.getPartitionKey());
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.put]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property}.
   * @param key - Primary key of item to put.
   * @param item - Attributes of the item to put.
   * @param options - Additional optional options to use for put.
   * @returns Input params for [DocumentClient.put]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property}.
   */
  putParams(
    key: Table.PrimaryKey.AttributeValuesMap,
    item?: Table.AttributeValuesMap,
    options: Table.PutOptions = {},
  ): DocumentClient.PutItemInput {
    let conditions = options.conditions;
    const resolver = this.getPutCondition(options.writeOptions);
    if (resolver) conditions = conditions ? conditions.concat(resolver) : [resolver];
    return Table.addParams<DocumentClient.PutItemInput>(
      { TableName: this.name, Item: item ? Object.assign(Object.assign({}, key), item) : key },
      { attributes: options.attributes, conditions },
    );
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.update]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property}.
   * By default this method uses `ReturnValues: 'ALL_NEW'` to return all of the properties for an item,
   * since many APIs or server code use the updated values in some way.
   * @param key - Primary key of item to update.
   * @param item - Attributes of the item to update.
   * @param options - Additional optional options to use for update.
   * @returns Input params for [DocumentClient.update]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property}.
   */
  updateParams(
    key: Table.PrimaryKey.AttributeValuesMap,
    item?: Update.ResolverMap,
    options: Table.UpdateOptions = {},
  ): DocumentClient.UpdateItemInput {
    return Table.addParams<DocumentClient.UpdateItemInput>(
      { TableName: this.name, Key: key, ReturnValues: 'ALL_NEW' },
      options,
      (params, attributes) => UpdateExpression.addParams(params, attributes, item),
    );
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.query]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property} method.
   * @param key - Primary key with optional KeyCondition to query the table with.
   * @param options - Used in building the query params.
   * @returns Input params for [DocumentClient.query]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property}.
   */
  queryParams(key: Table.PrimaryKey.KeyQueryMap, options: Table.QueryOptions = {}): DocumentClient.QueryInput {
    return Table.addParams<DocumentClient.QueryInput>({ TableName: this.name }, options, (params, attributes) =>
      KeyConditionExpression.addParams(params, attributes, key),
    );
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.scan]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property} method.
   * @param options - Used in building the scan params.
   * @returns Input params for [DocumentClient.scan]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property} method.
   */
  scanParams(options: Table.ScanOptions = {}): DocumentClient.ScanInput {
    return Table.addParams<DocumentClient.ScanInput>({ TableName: this.name }, options);
  }

  /**
   * Wrapper method for [DocumentClient.get]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property} method.
   * @param key - Primary key of item to get.
   * @param options - Additional optional options to use for get.
   * @returns Async promise returned by [DocumentClient.get]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property} method.
   */
  get(key: Table.PrimaryKey.AttributeValuesMap, options?: Table.GetOptions): Promise<DocumentClient.GetItemOutput> {
    return this.client.get(this.getParams(key, options)).promise();
  }

  /**
   * Wrapper method for [DocumentClient.delete]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#delete-property} method.
   * @param key - Primary key of item to delete.
   * @param options - Additional optional options to use for delete.
   * @returns Async promise returned by [DocumentClient.delete]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#delete-property} method.
   */
  delete(
    key: Table.PrimaryKey.AttributeValuesMap,
    options?: Table.DeleteOptions,
  ): Promise<DocumentClient.DeleteItemOutput> {
    return this.client.delete(this.deleteParams(key, options)).promise();
  }

  /**
   * Wrapper method for [DocumentClient.put]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property} method.
   * @param key - Primary key of item to put.
   * @param item - Attributes of the item to put.
   * @param options - Additional optional options to use for put.
   * @returns Async promise returned by [DocumentClient.put]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property} method.
   */
  put(
    key: Table.PrimaryKey.AttributeValuesMap,
    items?: Table.AttributeValuesMap,
    options?: Table.PutOptions,
  ): Promise<DocumentClient.PutItemOutput> {
    return this.client.put(this.putParams(key, items, options)).promise();
  }

  /**
   * Wrapper method for [DocumentClient.update]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property} method.
   * @param key - Primary key of item to update.
   * @param item - Attributes of the item to update.
   * @param options - Additional optional options to use for update.
   * @returns Async promise returned by [DocumentClient.update]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property} method.
   */
  update(
    key: Table.PrimaryKey.AttributeValuesMap,
    item?: Update.ResolverMap,
    options?: Table.UpdateOptions,
  ): Promise<DocumentClient.UpdateItemOutput> {
    return this.client.update(this.updateParams(key, item, options)).promise();
  }

  /**
   * Wrapper around [DocumentClient.query]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property}.
   * method that uses the index and table properties with the key and options params.
   * @param key - Primary key with optional KeyCondition to query the secondary index with.
   * @param options - Used in building the query params.
   * @returns Promise with the query results, including items fetched.
   */
  query(key: Table.PrimaryKey.KeyQueryMap, options?: Table.QueryOptions): Promise<DocumentClient.QueryOutput> {
    return this.client.query(this.queryParams(key, options)).promise();
  }

  /**
   * Wrapper around [DocumentClient.scan]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property}.
   * method that uses the index and table properties with the options param.
   * @param options - Used in building the scan params.
   * @returns Promise with the scan results, including items fetched.
   */
  scan(options?: Table.ScanOptions): Promise<DocumentClient.ScanOutput> {
    return this.client.scan(this.scanParams(options)).promise();
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.batchGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchGet-property} method.
   * @param batchGet - Batch get object to set the table get on.
   * @param keys - Keys of items to get.
   * @param options - Set of get options for table.
   * @returns BatchGet object passed in, to support calling execute on same line.
   */
  setBatchGet(
    batchGet: Table.BatchGet,
    keys: Table.PrimaryKey.AttributeValuesMap[],
    options?: Table.BatchGetTableOptions,
  ): Table.BatchGet {
    batchGet.set(this.name, keys, options);
    return batchGet;
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.batchWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchWrite-property} method.
   * @param batchWrite - Batch write object to set the table write on.
   * @param putItems - Items to put in the table.
   * @param delKeys - Keys of items to delete from the table.
   * @returns BatchWrite object passed in, to support calling execute on same line.
   */
  setBatchWrite(
    batchWrite: Table.BatchWrite,
    putItems?: Table.PutItem[],
    delKeys?: Table.PrimaryKey.AttributeValuesMap[],
  ): Table.BatchWrite {
    batchWrite.set(this.name, putItems || [], delKeys || []);
    return batchWrite;
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.transactGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactGet-property} method.
   * @param batchWrite - Batch write object to set the table write on.
   * @param keys - Keys of items to get.
   * @param getItems - Keys of items and associated attributes to get.
   * @returns TransactGet object passed in, to support calling execute on same line.
   */
  setTransactGet(transactGet: Table.TransactGet, getItems: Table.TransactGetItem[]): Table.TransactGet {
    transactGet.set(this.name, getItems);
    return transactGet;
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.transactWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactWrite-property} method.
   * @param write - Set of operations to write in the transaction.
   * @param options - Used in building the transactWrite params.
   * @returns TransactWrite object passed in, to support calling execute on same line.
   */
  setTransactWrite(transactWrite: Table.TransactWrite, write: Table.TransactWriteData): Table.TransactWrite {
    transactWrite.set(this.name, {
      check: write.check || [],
      delete: write.delete || [],
      put: write.put || [],
      update: write.update || [],
    });
    return transactWrite;
  }

  /**
   * Maps PutWriteOptions to one of the put based ItemActions used by Fields to tell the type of put operation.
   * @param options - Put write option to map into a put item action.
   */
  static getPutAction(options?: Table.PutWriteOptions): Table.PutItemActions {
    if (options === 'NotExists') return 'put-new';
    if (options === 'Exists') return 'put-replace';
    return 'put';
  }

  /**
   * Checks if item action is a put based action.
   * @param action - Item actions to check if put.
   * @returns True if item action is a put action.
   */
  static isPutAction(action: Table.ItemActions): boolean {
    return action === 'put' || action === 'put-new' || action === 'put-replace';
  }

  /**
   * Appends attributes names to the ProjectionExpression for input params.
   * @param params - Params to add ProjectionExpression on.
   * @param itemAttributes - List of attribute names to return.
   * @param attributes - Definition of the attribute types required for table and index primary key and for index projected attributes.
   * @returns Params that have ProjectionExpression added to.
   */
  static addItemAttributes<T extends Table.ExpressionParams>(
    params: T,
    attributes: Table.ExpressionAttributes,
    itemAttributes?: string[],
  ): void {
    if (itemAttributes && itemAttributes.length > 0) {
      itemAttributes.forEach((value) => attributes.addPath(value));
      params.ProjectionExpression = itemAttributes.join(', ');
    }
  }

  /**
   * Add expressions properties to the params object.
   * @param T - Type of table action input params
   * @param params - The params object to add expression properties to.
   * @param options - Options used to build params.
   * @param addParam - Function to add additional expression params.
   * @returns Params object that was passed in with expression added.
   */
  static addParams<T extends Table.ExpressionParams>(
    params: T,
    options: Table.AddParamsOptions,
    addParams?: Table.AddExpressionParams,
    getAttributes?: () => Table.ExpressionAttributes,
  ): T & Table.ExpressionParams {
    const attributes = options.attributes
      ? options.attributes()
      : getAttributes
      ? getAttributes()
      : new ExpressionAttributes();
    ConditionExpression.addParams(params, attributes, 'condition', options.conditions);
    ConditionExpression.addParams(params, attributes, 'filter', options.filters);
    Table.addItemAttributes(params, attributes, options.itemAttributes);
    if (addParams) addParams(params, attributes);
    ExpressionAttributes.addParams(params, attributes);
    return options.params ? Object.assign(params, options.params) : params;
  }

  /**
   * Add expressions properties to the params object.
   * @param T - Type of table transact write item input params
   * @param params - The params object to add expression properties to.
   * @param item - Transact write item used to build params.
   * @param addParam - Function to add additional expression params.
   * @returns Params object that was passed in with expression added.
   */
  static addWriteParams<
    T extends Table.ExpressionParams & {
      ReturnValuesOnConditionCheckFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure;
    },
  >(
    params: T,
    item: {
      conditions?: Condition.Resolver[];
      returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure;
    },
    addParams?: Table.AddExpressionParams,
  ): T & Table.ExpressionParams {
    if (item.returnFailure) params.ReturnValuesOnConditionCheckFailure = item.returnFailure;
    return Table.addParams(params, item, addParams);
  }

  /**
   * Translates options into batch or transact based input params.
   * @param options - Common batch or transact options to set on params.
   * @param params - Input params to set based on options.
   */
  static addBatchParams(
    options: {
      token?: DocumentClient.ClientRequestToken;
      consumed?: DocumentClient.ReturnConsumedCapacity;
      metrics?: DocumentClient.ReturnItemCollectionMetrics;
    },
    params: {
      ClientRequestToken?: DocumentClient.ClientRequestToken;
      ReturnConsumedCapacity?: DocumentClient.ReturnConsumedCapacity;
      ReturnItemCollectionMetrics?: DocumentClient.ReturnItemCollectionMetrics;
    },
  ): void {
    if (options.token) params.ClientRequestToken = options.token;
    if (options.consumed) params.ReturnConsumedCapacity = options.consumed;
    if (options.metrics) params.ReturnItemCollectionMetrics = options.metrics;
  }

  /**
   * Finds the partition or sort key name for a table or index key schema.
   * @param keySchema - Table key schema to find the primary key in.
   * @param type - Primary key type to look for, either HASH or RANGE.
   * @returns Name of the key if it exists otherwise an empty string.
   */
  static getKeyName(keySchema: Table.PrimaryKey.KeyTypesMap, type: Table.PrimaryKey.KeyTypes): string {
    const keys = Object.keys(keySchema);
    for (const key of keys) if (keySchema[key].keyType === type) return key;
    return '';
  }
}

/**
 * Is also a namespace for scoping Table based interfaces and types.
 * @public
 */
/* istanbul ignore next: needed for ts with es5 */
// eslint-disable-next-line @typescript-eslint/no-namespace, no-redeclare
export namespace Table {
  /**
   * TypeScript utility type that constructs a type consisting of all properties of T set to optional.
   * Does the opposite of [Required]{@link https://www.typescriptlang.org/docs/handbook/utility-types.html#requiredt}.
   */
  export type Optional<T> = { [P in keyof T]?: T[P] };

  /**
   * Attribute types support by {@link Table} and [DocumentClient]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html}.
   */
  export type AttributeTypes = 'B' | 'N' | 'S' | 'BOOL' | 'NULL' | 'L' | 'M' | 'BS' | 'NS' | 'SS';

  /**
   * Binary value supported by {@link Table} and [DocumentClient]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html}.
   */
  export type BinaryValue = DocumentClient.binaryType;

  /**
   * String set value supported by {@link Table} and [DocumentClient]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html}.
   */
  export type StringSetValue = DocumentClient.StringSet;

  /**
   * Number set value supported by {@link Table} and [DocumentClient]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html}.
   */
  export type NumberSetValue = DocumentClient.NumberSet;

  /**
   * Binary set value supported by {@link Table} and [DocumentClient]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html}.
   */
  export type BinarySetValue = DocumentClient.BinarySet;

  /**
   * Map value supported by {@link Table} and [DocumentClient]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html}.
   */
  export type MapValue = { [key: string]: AttributeValues };

  /**
   * List value supported by {@link Table} and [DocumentClient]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html}.
   */
  export type ListValue = AttributeValues[];

  /**
   * Supported Table set based values.
   */
  export type AttributeSetValues = StringSetValue | NumberSetValue | BinarySetValue;

  /**
   * Supported Table attribute values.
   */
  export type AttributeValues =
    | null
    | string
    | number
    | boolean
    | BinaryValue
    | AttributeSetValues
    | MapValue
    | ListValue;

  /**
   * Supported Table value map used for {@link put} method.
   */
  export type AttributeValuesMap = { [key: string]: AttributeValues };

  /**
   * Put based item actions, used by {@link Fields} to determine what put based table operation will be executed.
   */
  export type PutItemActions = 'put' | 'put-new' | 'put-replace';
  /**
   * Item actions used by {@link Fields} to determine what table operation will be executed.
   */
  export type ItemActions = 'get' | 'delete' | PutItemActions | 'update' | 'check';

  /**
   * Params used to construct a {@link Table}.
   */
  export interface TableParams {
    /**
     * Name of the DynamoDB table, used to set the TableName when calling DynamoDB methods.
     */
    name: string;

    /**
     * Definition of the attribute types required for table and index primary key and for index projected attributes.
     * These need to be defined at the table level since the attributes are table wide concept.
     */
    keyAttributes: Table.PrimaryKey.AttributeTypesMap;

    /**
     * Schema map for the Table's primary key, in the form of \{ \<partition key name\>: \{ keyType: 'HASH' \} \}.
     */
    keySchema: Table.PrimaryKey.KeyTypesMap;

    /**
     * DocumentClient to use in the {@link Table}.  Can be a function to support creating the DocumentClient on demand.
     */
    client: DocumentClient | (() => DocumentClient);

    /**
     * Determines how errors should be handled.
     */
    onError?: (msg: string) => void;
  }

  /**
   * Contains the primary key type and key type values.  Used when definition {@link Table.keyAttributes},
   * {@link Table.keySchema} and {@link Index.keySchema}
   */
  export class PrimaryKey {
    /**
     * Use for defining string based {@link Table.keyAttributes}
     */
    static readonly StringType: { type: 'S' } = { type: 'S' };

    /**
     * Use for defining number based {@link Table.keyAttributes}
     */
    static readonly NumberType: { type: 'N' } = { type: 'N' };

    /**
     * Use for defining binary based {@link Table.keyAttributes}
     */
    static readonly BinaryType: { type: 'B' } = { type: 'B' };

    /**
     * Use for defining partition (HASH) key {@link Table.keySchema} or {@link Index.keySchema}
     */
    static readonly PartitionKeyType: { keyType: 'HASH' } = { keyType: 'HASH' };

    /**
     * Use for defining sort (RANGE) key {@link Table.keySchema} or {@link Index.keySchema}
     */
    static readonly SortKeyType: { keyType: 'RANGE' } = { keyType: 'RANGE' };
  }

  /**
   * Is also a namespace for scoping PrimaryKey based interfaces and types.
   * @public
   * */
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace PrimaryKey {
    /** Support primary key attribute values types. */
    export type AttributeValues = string | number | Table.BinaryValue;

    /** Supported primary key attribute types (see DocumentClient.ScalarAttributeType). */
    export type AttributeTypes = 'B' | 'N' | 'S';

    /** Supported primary key types. */
    export type KeyTypes = 'HASH' | 'RANGE';

    /** Definition for partition string.  Used for defining the primary key for Tables and Indexes. */
    export type PartitionString = string | { type: 'S' } | { keyType: 'HASH' };

    /** Definition for partition number.  Used for defining the primary key for Tables and Indexes. */
    export type PartitionNumber = number | { type: 'N' } | { keyType: 'HASH' };

    /** Definition for partition number.  Used for defining the primary key for Tables and Indexes. */
    export type PartitionBinary = Table.BinaryValue | { type: 'B' } | { keyType: 'HASH' };

    /** Definition for sort string.  Used for defining the primary key for Tables and Indexes. */
    export type SortString = string | { type: 'S' } | { keyType: 'RANGE' } | KeyCondition.StringResolver;

    /** Definition for sort string.  Used for defining the primary key for Tables and Indexes. */
    export type SortNumber = number | { type: 'N' } | { keyType: 'RANGE' } | KeyCondition.NumberResolver;

    /** Definition for sort string.  Used for defining the primary key for Tables and Indexes. */
    export type SortBinary = Table.BinaryValue | { type: 'B' } | { keyType: 'RANGE' } | KeyCondition.BinaryResolver;

    /** Definition for the {@link Table.keyAttributes}. */
    export type AttributeTypesMap = { [key: string]: { type: AttributeTypes } };

    /** Definition for the {@link Table.keySchema} and {@link Index.keySchema}. */
    export type KeyTypesMap = { [key: string]: { keyType: KeyTypes } };

    /**
     * Definition for the key argument used in {@link Table.queryParams}, {@link Table.query},
     * {@link Index.query} and {@link Index.queryParams}
     */
    export type KeyQueryMap = { [key: string]: AttributeValues | KeyCondition.AttributeResolver };

    /**
     * Definition for the key argument used in {@link Table.get}, {@link Table.delete}, {@link Table.put},
     * {@link Table.update} and associated Params methods.
     */
    export type AttributeValuesMap = { [key: string]: AttributeValues };

    /** Typed based version of {@link Table.PrimaryKey.AttributeTypesMap} used in {@link Table.TableT}. */
    export type AttributeTypesMapT<T> = {
      [P in keyof Required<T>]: Extract<T[P], { type: AttributeTypes }>;
    };

    /** Typed based version of {@link Table.PrimaryKey.KeyTypesMap} used in {@link Table.TableT} and {@link Index.IndexT} */
    export type KeyTypesMapT<T> = {
      [P in keyof Required<T>]: Extract<T[P], { keyType: KeyTypes }>;
    };

    /** Typed based version of {@link Table.PrimaryKey.KeyQueryMap} used in {@link Table.TableT} and {@link Index.IndexT} */
    export type KeyQueryMapT<T> = {
      [P in keyof T]: Extract<T[P], Table.AttributeValues | KeyCondition.AttributeResolver>;
    };

    /** Typed based version of {@link Table.PrimaryKey.AttributeValuesMap} used in {@link Table.TableT} */
    export type AttributeValuesMapT<T> = {
      [P in keyof Required<T>]: Extract<T[P], Table.AttributeValues>;
    };

    /** Attribute query value of the primary key for tables and indexes. */
    export interface KeyQuery {
      /** Partition key query value. */
      pk: Table.AttributeValues;

      /** Sort key query value. */
      sk?: Table.AttributeValues | KeyCondition.AttributeResolver;
    }
  }

  /**
   * Interface that allows expressions to get aliases for path and values and store that mapping to then
   * allow ExpressionAttributeNames and ExpressionAttributeValues to be set on params.
   */
  export interface ExpressionAttributes {
    /**
     * Parse an attribute path and adds the names to the expression attribute names and hands back an alias
     * to use in condition, update, filter, and other expressions.
     * @param name - Attribute path to get an alias for.
     * @returns Alias path to use in place of the attribute name.
     */
    addPath(name: string): string;

    /**
     * Adds the value to the expression attribute values and hands back an alias
     * to use in condition, update, filter, and other expressions.
     * @param value - Value to add to the values map.
     * @returns Alias to use in place of the attribute value.
     */
    addValue(value: Table.AttributeValues): string;

    /** Gets the names map to assign to ExpressionAttributeNames. */
    getPaths(): ExpressionAttributeNameMap | void;

    /** Gets the values map to assign to ExpressionAttributeValues. */
    getValues(): Table.AttributeValuesMap | void;
  }

  /** The ExpressionAttributes params used by dynamodb. */
  export type ExpressionAttributeParams = {
    ExpressionAttributeNames?: ExpressionAttributeNameMap;
    ExpressionAttributeValues?: Table.AttributeValuesMap;
  };

  /** The set of expression params used by dynamodb. */
  export type ExpressionParams = {
    ConditionExpression?: string;
    FilterExpression?: string;
    KeyConditionExpression?: string;
    UpdateExpression?: string;
    ProjectionExpression?: string;
  } & ExpressionAttributeParams;

  /** Method to add additional expressions to the params. */
  export type AddExpressionParams = (params: ExpressionParams, attributes: ExpressionAttributes) => void;

  /**
   * Defines what general set of attributes are projected into the secondary index.
   * @param ALL - All of the attributes of an item are projected into the secondary index.
   * @param KEYS_ONLY - The table and the secondary index primary keys are projected into the secondary index.
   */
  export type ProjectionType = 'ALL' | 'KEYS_ONLY' | 'INCLUDE';

  /**
   * Input params for [DocumentClient.get]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property}
   * Removes legacy parameters from the type definition, including AttributesToGet.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface GetInput extends Omit<DocumentClient.GetItemInput, 'AttributesToGet'> {}

  /**
   * Input params for [DocumentClient.put]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property}
   * Removes legacy parameters from the type definition, including Expected and ConditionalOperator
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface PutInput extends Omit<DocumentClient.PutItemInput, 'Expected' | 'ConditionalOperator'> {}

  /**
   * Input params for [DocumentClient.delete]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#delete-property}
   * Removes legacy parameters from the type definition, including Expected and ConditionalOperator
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DeleteInput extends Omit<DocumentClient.DeleteItemInput, 'Expected' | 'ConditionalOperator'> {}

  /**
   * Input params for [DocumentClient.update]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property}
   * Removes legacy parameters from the type definition, including AttributeUpdates, Expected and ConditionalOperator
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface UpdateInput
    extends Omit<DocumentClient.UpdateItemInput, 'AttributeUpdates' | 'Expected' | 'ConditionalOperator'> {}

  /**
   * Input params for [DocumentClient.query]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property}
   * Removes legacy parameters from the type definition, including AttributesToGet, KeyConditions, QueryFilter and ConditionalOperator
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface QueryInput
    extends Omit<
      DocumentClient.QueryInput,
      'AttributesToGet' | 'KeyConditions' | 'QueryFilter' | 'ConditionalOperator'
    > {}

  /**
   * Input params for [DocumentClient.scan]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property}
   * Removes legacy parameters from the type definition, including AttributesToGet, QueryFilter and ConditionalOperator
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface ScanInput
    extends Omit<DocumentClient.ScanInput, 'AttributesToGet' | 'ScanFilter' | 'ConditionalOperator'> {}

  /**
   * Input per table params for [DocumentClient.batchGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchGet-property}
   * Removes legacy parameters from the type definition, including AttributesToGet
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface BatchGetTableInput extends Omit<DocumentClient.KeysAndAttributes, 'AttributesToGet'> {}

  /**
   * Base options for all table operations like get, put, delete, update and others.
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  export interface BaseOptions<T = {}> {
    /**
     * Expression attributes to use for resolving conditions and updates.  Will be used to generate the
     * ExpressionAttributeNames and ExpressionAttributeValues params in table operations.
     */
    attributes?: () => Table.ExpressionAttributes;

    /**
     * Params to append on to the params that get passed to dynamodb.  This does mean these params can
     * be used to override any of the values generated by Table, so just be careful on what params you pass.
     */
    params?: Optional<T>;

    /**  User defined context that gets passed through to all Fields. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context?: any;
  }

  /**
   * Options used in the following methods: {@link Table.get}, {@link Table.getParams},
   * {@link Model.get} and {@link Model.getParams}.
   */
  export interface GetOptions extends BaseOptions<GetInput> {
    /** List of attributes to return from table for operation. */
    itemAttributes?: string[];
  }

  /** Base options for all table operations like get, put, delete, update and others. */
  // eslint-disable-next-line @typescript-eslint/ban-types
  export interface WriteOptions<T = {}> extends BaseOptions<T> {
    /**
     * Array of expression condition resolvers that are joined together with AND, then used as
     * ConditionExpression or FilterExpression params in table operations.
     */
    conditions?: Condition.Resolver[];
  }

  /**
   * Options used in the following methods: {@link Table.delete}, {@link Table.deleteParams}, {@link Model.delete}
   * and {@link Model.deleteParams}.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DeleteOptions extends WriteOptions<DeleteInput> {}

  /**
   * Put method write options that determine how put will execute.
   *
   * - 'Always' - Default put behavior, that will always set the item weather it exists or now.
   * - 'Exists' - Only set the item if the item already exists, adds
   * - ConditionExpression="attribute_exists(#pk)", where #pk is the partition key name.
   * - 'NotExists' - Only set the item if the item does not exist, add
   * ConditionExpression="attribute_not_exists(#pk)", where #pk is the partition key name.
   */
  export type PutWriteOptions = 'Always' | 'Exists' | 'NotExists';

  /**
   * Options to used for put and putParams methods on {@link Table} and {@link Model}, along with
   * {@link Model.new} and {@link Model.replace}.
   */
  export interface PutOptions extends WriteOptions<PutInput> {
    /** Allows put to be conditional based on if the item already exists. */
    writeOptions?: PutWriteOptions;
  }

  /**
   * Options used in the following methods:  {@link Table.update}, {@link Table.updateParams},
   * {@link Model.update} and {@link Model.updateParams}.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface UpdateOptions extends WriteOptions<UpdateInput> {}

  /**
   * Options used in the following methods: {@link Table.query}, {@link Table.queryParams},
   * {@link Index.query} and {@link Index.queryParams}.
   */
  export interface QueryOptions extends BaseOptions<QueryInput> {
    /** List of attributes to return from table for operation. */
    itemAttributes?: string[];

    /**
     * Filter conditions for filtering out items after the query but before returning.
     * Note: Items filtered out still consume read capacity.
     */
    filters?: Condition.Resolver[];
  }

  /**
   * Options used in the following methods: {@link Table.scan}, {@link Table.scanParams},
   * {@link Index.scan} and {@link Index.scanParams}.
   */
  export interface ScanOptions extends BaseOptions<ScanInput> {
    /** List of attributes to return from table for operation. */
    itemAttributes?: string[];

    /**
     * Filter conditions for filtering out items after the query but before returning.
     * Note: Items filtered out still consume read capacity.
     */
    filters?: Condition.Resolver[];
  }

  /** Options used in the following methods: {@link Table.batchGet}, {@link Table.batchGetParams}. */
  export interface BatchGetOptions extends BaseOptions {
    /** Returns the ConsumedCapacity for the table operation. */
    consumed?: DocumentClient.ReturnConsumedCapacity;
  }

  /** Options used in the following methods: {@link Table.batchGet}, {@link Table.batchGetParams}. */
  export interface BatchGetTableOptions extends BaseOptions<BatchGetTableInput> {
    /** List of attributes to return from table for operation. */
    itemAttributes?: string[];
  }

  /** Options used in the following methods: {@link Table.batchWrite}, {@link Table.batchWriteParams}. */
  export interface BatchWriteTableOptions extends BaseOptions {
    /** Returns the ConsumedCapacity for the table operation. */
    consumed?: DocumentClient.ReturnConsumedCapacity;

    /** Returns the ReturnItemCollectionMetrics for the table operation. */
    metrics?: DocumentClient.ReturnItemCollectionMetrics;
  }

  /** Options used in the following methods: {@link Table.transactGet}, {@link Table.transactGetParams}. */
  export interface TransactGetTableOptions extends BaseOptions {
    /** Returns the ConsumedCapacity for the table operation. */
    consumed?: DocumentClient.ReturnConsumedCapacity;
  }

  /** Key and item attributes for used when putting and item */
  export interface PutItem {
    /** Primary key of item to put. */
    key: Table.PrimaryKey.AttributeValuesMap;

    /** Attributes of the item to put. */
    item?: Table.AttributeValuesMap;
  }

  /** Param to transactGet* methods */
  export interface TransactGetItem {
    /** Primary key of items to get.  */
    key: Table.PrimaryKey.AttributeValuesMap;

    /** Attributes of the items to get. */
    itemAttributes?: string[];
  }

  /** Options used in the following methods: {@link Table.transactWrite}, {@link Table.transactWriteParams}. */
  export interface TransactWriteTableOptions extends BaseOptions {
    /** Token to use for the transact request. */
    token?: DocumentClient.ClientRequestToken;

    /** Returns the ConsumedCapacity for the table operation. */
    consumed?: DocumentClient.ReturnConsumedCapacity;

    /** Returns the ReturnItemCollectionMetrics for the table operation. */
    metrics?: DocumentClient.ReturnItemCollectionMetrics;
  }

  /** Param to transactWrite* methods that contains the key and items for each operation supported. */
  export interface TransactWriteData {
    /** Transaction based condition check to validate a condition before writing. */
    check?: {
      key: Table.PrimaryKey.AttributeValuesMap;
      conditions: Condition.Resolver[];
      returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure;
    }[];

    /** Transaction based delete item. */
    delete?: {
      key: Table.PrimaryKey.AttributeValuesMap;
      conditions?: Condition.Resolver[];
      returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure;
    }[];

    /** Transaction based put item. */
    put?: {
      key: Table.PrimaryKey.AttributeValuesMap;
      item?: Table.AttributeValuesMap;
      conditions?: Condition.Resolver[];
      returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure;
    }[];

    /** Transaction based update item. */
    update?: {
      key: Table.PrimaryKey.AttributeValuesMap;
      item?: Update.ResolverMap;
      conditions?: Condition.Resolver[];
      returnFailure?: DocumentClient.ReturnValue;
    }[];
  }

  /** Options used in the following methods: {@link Table.addParams}. */
  export interface AddParamsOptions extends BaseOptions {
    /** List of attributes to return from table for operation. */
    itemAttributes?: string[];

    /**
     * Array of expression condition resolvers that are joined together with AND, then used as
     * ConditionExpression or FilterExpression params in table operations.
     */
    conditions?: Condition.Resolver[];

    /**
     * Filter conditions for filtering out items after the query but before returning.
     * Note: Items filter out still consume read capacity.
     */
    filters?: Condition.Resolver[];
  }

  /** Default and Example table primary key with a generalized compact format. */
  export interface DefaultTableKey {
    /** Table partition key. */
    P: PrimaryKey.PartitionString;

    /**
     * Table sort key. The sort key is optional to support the sort key as being option for queryParams
     * and query methods.
     */
    S?: PrimaryKey.SortString;
  }

  /**
   * Table constructor param for the generic form of {@link TableParams}.
   * @param KEY - Interface of the table's primary key.
   * @param ATTRIBUTES - The interface or type that has all required attributes, including table
   * and index primary key and all defined index projected attributes.
   */
  export interface TableParamsT<KEY, ATTRIBUTES> extends TableParams {
    /** Generic form of {@link TableParam.keyAttributes}. */
    keyAttributes: PrimaryKey.AttributeTypesMapT<ATTRIBUTES>;

    /** Generic form of {@link TableParam.keySchema}. */
    keySchema: PrimaryKey.KeyTypesMapT<KEY>;
  }

  /** Generic form of {@link Table.PutItem}. */
  export interface PutItemT<KEY> extends PutItem {
    /** Primary key of item to put. */
    key: Table.PrimaryKey.AttributeValuesMapT<KEY>;

    /** Attributes of the item to put. */
    item?: Table.AttributeValuesMap;
  }

  /** Generic form of {@link Table.TransactGetItem}. */
  export interface TransactGetItemT<KEY> extends TransactGetItem {
    /** Keys of items to get.  */
    key: Table.PrimaryKey.AttributeValuesMapT<KEY>;

    /** Attributes of the items to get. */
    itemAttributes?: string[];
  }

  /**  Generic form of {@link Table.TransactWrite}. */
  export interface TransactWriteDataT<KEY> extends TransactWriteData {
    /** Generic form of {@link Table.TransactWrite.check}. */
    check?: {
      key: Table.PrimaryKey.AttributeValuesMapT<KEY>;
      conditions: Condition.Resolver[];
      returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure;
    }[];

    /** Generic form of {@link Table.TransactWrite.delete}. */
    delete?: {
      key: Table.PrimaryKey.AttributeValuesMapT<KEY>;
      conditions?: Condition.Resolver[];
      returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure;
    }[];

    /** Generic form of {@link Table.TransactWrite.put}. */
    put?: {
      key: Table.PrimaryKey.AttributeValuesMapT<KEY>;
      item?: Table.AttributeValuesMap;
      conditions?: Condition.Resolver[];
      returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure;
    }[];

    /** Generic form of {@link Table.TransactWrite.update}. */
    update?: {
      key: Table.PrimaryKey.AttributeValuesMapT<KEY>;
      item?: Update.ResolverMap;
      conditions?: Condition.Resolver[];
      returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure;
    }[];
  }

  /**
   * Generic form of {@link Table}.
   * @param KEY - The interface of the table's primary key.
   * @param ATTRIBUTES - The interface or type that has all required attributes, including
   * table and index primary key and all defined index projected attributes.
   */
  export interface TableT<KEY = Table.DefaultTableKey, ATTRIBUTES = KEY> extends Table {
    /** Generic form of {@link Table.keyAttributes}. */
    keyAttributes: Table.PrimaryKey.AttributeTypesMapT<ATTRIBUTES>;

    /** Generic form of {@link Table.keySchema}. */
    keySchema: Table.PrimaryKey.KeyTypesMapT<KEY>;

    /**
     * See Generic form of {@link Table.getParams}.
     */
    getParams(key: Table.PrimaryKey.AttributeValuesMapT<KEY>, options?: Table.GetOptions): DocumentClient.GetItemInput;

    /** See Generic form of {@link Table.deleteParams}. */
    deleteParams(
      key: Table.PrimaryKey.AttributeValuesMapT<KEY>,
      options?: Table.DeleteOptions,
    ): DocumentClient.DeleteItemInput;

    /** See Generic form of {@link Table.putParams}. */
    putParams(
      key: Table.PrimaryKey.AttributeValuesMapT<KEY>,
      item?: Table.AttributeValuesMap,
      options?: Table.PutOptions,
    ): DocumentClient.PutItemInput;

    /** See Generic form of {@link Table.updateParams}. */
    updateParams(
      key: Table.PrimaryKey.AttributeValuesMapT<KEY>,
      item?: Update.ResolverMap,
      options?: Table.UpdateOptions,
    ): DocumentClient.UpdateItemInput;

    /** See Generic form of {@link Table.queryParams}. */
    queryParams(key: Table.PrimaryKey.KeyQueryMapT<KEY>, options?: Table.QueryOptions): DocumentClient.QueryInput;

    /** See Generic form of {@link Table.scanParams}. */
    scanParams(options?: Table.ScanOptions): DocumentClient.ScanInput;

    /** See Generic form of {@link Table.get}. */
    get(
      key: Table.PrimaryKey.AttributeValuesMapT<KEY>,
      options?: Table.GetOptions,
    ): Promise<DocumentClient.GetItemOutput>;

    /** See Generic form of {@link Table.delete}. */
    delete(
      key: Table.PrimaryKey.AttributeValuesMapT<KEY>,
      options?: Table.DeleteOptions,
    ): Promise<DocumentClient.DeleteItemOutput>;

    /** See Generic form of {@link Table.put}. */
    put(
      key: Table.PrimaryKey.AttributeValuesMapT<KEY>,
      item?: Table.AttributeValuesMap,
      options?: Table.PutOptions,
    ): Promise<DocumentClient.PutItemOutput>;

    /** See Generic form of {@link Table.update}. */
    update(
      key: Table.PrimaryKey.AttributeValuesMapT<KEY>,
      item?: Update.ResolverMap,
      options?: Table.UpdateOptions,
    ): Promise<DocumentClient.UpdateItemOutput>;

    /** See Generic form of {@link Table.query}. */
    query(key: Table.PrimaryKey.KeyQueryMapT<KEY>, options?: Table.QueryOptions): Promise<DocumentClient.QueryOutput>;

    /** See Generic form of {@link Table.scan}. */
    scan(options?: Table.ScanOptions): Promise<DocumentClient.ScanOutput>;

    /** See Generic form of {@link Table.setBatchGet}. */
    setBatchGet(batchGet: Table.BatchGet, keys: Table.PrimaryKey.AttributeValuesMapT<KEY>[]): Table.BatchGet;

    /** See Generic form of {@link Table.setBatchWrite}. */
    setBatchWrite(
      batchWrite: Table.BatchWrite,
      putItems?: Table.PutItemT<KEY>[],
      delKeys?: PrimaryKey.AttributeValuesMapT<KEY>[],
    ): Table.BatchWrite;

    /** See Generic form of {@link Table.setTransactGet}. */
    setTransactGet(transactGet: Table.TransactGet, items: Table.TransactGetItemT<KEY>[]): Table.TransactGet;

    /** See Generic form of {@link Table.setTransactWrite}. */
    setTransactWrite(transactWrite: Table.TransactWrite, write: Table.TransactWriteDataT<KEY>): Table.TransactWrite;
  }

  /**
   * Creates the generic form of {@link Table} used in TypeScript to get strong typing.
   *
   *
   * So you may ask, why have createTable over just using new {@link Table.TableT}?  The reason is that since the method
   * signature is exactly the same (same method names with same params, only typings are more strict) between
   * TableT and Table there is no need to have TableT class with just a bunch of pass through wrapper methods.
   * This also makes the {@link Table} TSDocs easier to read without all of the TypeScript Generic types.  Same
   * approach is taken with {@link Index} and {@link Model}.
   * @param KEY - The interface of the table's primary key.
   * @param ATTRIBUTES - The interface or type that has all required attributes, including table and index
   * primary key and all defined index projected attributes.
   * @param params - Table constructor params.
   * @returns A new table as TableT.
   */
  export function createTable<KEY = Table.DefaultTableKey, ATTRIBUTES = KEY>(
    params: Table.TableParamsT<KEY, ATTRIBUTES>,
  ): Table.TableT<KEY, ATTRIBUTES> {
    return new Table(params) as Table.TableT<KEY, ATTRIBUTES>;
  }

  /** Used by ModelResult to get the table item that will be converted to a model item. */
  export interface TableResult {
    /**
     * Gets the table item from the result of a DocumentClient operation.
     * @param tableName - Name of table to get item for.
     * @param key - Key of table item to get.
     * @returns The table item data.
     */
    getItem(tableName: string, key: Table.PrimaryKey.AttributeValuesMap): Table.AttributeValuesMap | void;
  }

  /**
   * Compare the value of the list of keys between item1 and item2.
   * @param keys - List of keys to compare between item1 and item2.
   * @param item1 - Item to compare item2 against.
   * @param item2 - Item to compare item1 against.
   * @returns true if the value of the keys of item1 and item2 are equal.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function equalMap(keys: string[], item1: { [key: string]: any }, item2?: { [key: string]: any }): boolean {
    if (!item2) return false;
    for (const name of keys) if (item1[name] !== item2[name]) return false;
    return true;
  }

  // Batch Operations
  /** Creates the params that can be used when calling [DocumentClient.batchGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchGet-property} method. */
  export class BatchGet implements TableResult {
    private reads: {
      [key: string]: {
        keys: Table.PrimaryKey.AttributeValuesMap[];
        options?: BatchGetTableOptions;
      };
    } = {};
    private getTableReads(name: string): {
      keys: Table.PrimaryKey.AttributeValuesMap[];
      options?: BatchGetTableOptions;
    } {
      const keys = this.reads[name];
      if (keys) return keys;
      return (this.reads[name] = { keys: [] });
    }
    private result?: DocumentClient.BatchGetItemOutput;

    /** The DocumentClient used for the batch get operations. */
    public client: DocumentClient;

    /** Options used in building the batchGet params. */
    public options: BatchGetOptions;

    /**
     * @param client - The DocumentClient used for the batch get operations.
     * @param options - Options used in building the batchGet params.
     */
    constructor(client: DocumentClient, options: BatchGetOptions = {}) {
      this.client = client;
      this.options = options;
    }

    /**
     * Sets the keys for items to fetch from a specific table.
     * @param tableName - Name of table to for batch get.
     * @param keys - Keys of items to get.
     * @param options - options to set for the table batch get.
     */
    set(tableName: string, keys: Table.PrimaryKey.AttributeValuesMap[], options?: BatchGetTableOptions): void {
      this.reads[tableName] = { keys, options };
    }

    /**
     * Sets the options for a specific table.
     * @param tableName - Name of table to for batch get.
     * @param options - options to set for the table batch get.
     */
    setOptions(tableName: string, options: BatchGetTableOptions): void {
      this.getTableReads(tableName).options = options;
    }

    /**
     * Add a get item based on key for a specific table.
     * @param tableName - Name of table to for batch get.
     * @param keys - Key of item to get.
     */
    addGet(tableName: string, key: Table.PrimaryKey.AttributeValuesMap): void {
      this.getTableReads(tableName).keys.push(key);
    }

    /**
     * Creates the params that can be used when calling [DocumentClient.batchGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchGet-property} method.
     * @returns Input params for [DocumentClient.batchGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchGet-property} method.
     */
    getParams(): DocumentClient.BatchGetItemInput {
      const params: DocumentClient.BatchGetItemInput = { RequestItems: {} };
      Table.addBatchParams(this.options, params);
      Object.keys(this.reads).forEach((name) => {
        const { keys, options } = this.reads[name];
        params.RequestItems[name] = Table.addParams<Table.BatchGetTableInput>(
          { Keys: keys },
          options || {},
          undefined,
          this.options.attributes,
        );
      });
      return params;
    }

    /**
     * Wrapper around [DocumentClient.batchGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchGet-property} method.
     * @returns Promise with the batchGet results, including responses fetched.
     */
    async execute(): Promise<DocumentClient.BatchGetItemOutput> {
      this.result = await this.client.batchGet(this.getParams()).promise();
      return this.result;
    }

    /**
     * The result from the DocumentClient.batchGet executed.
     * @returns The output of DocumentClient.batchGet.
     */
    getResult(): DocumentClient.BatchGetItemOutput | undefined {
      return this.result;
    }

    /**
     * Gets the table item from the DocumentClient.batchGet result.
     * @param tableName - Name of table to get item for.
     * @param key - Key of table item to get.
     * @returns The table item data.
     */
    getItem(tableName: string, key: Table.PrimaryKey.AttributeValuesMap): Table.AttributeValuesMap | void {
      const responses = this.result?.Responses?.[tableName];
      if (!responses) return;
      const keyNames = Object.keys(key);
      for (const item of responses) if (equalMap(keyNames, key, item)) return item;
    }
  }

  /** Contains the list of items to put and delete in a batch write. */
  interface TableBatchWrites {
    /** List of items to put in the batch write. */
    putItems: Table.PutItem[];

    /** List of keys of items to delete in the batch write. */
    delKeys: Table.PrimaryKey.AttributeValuesMap[];
  }

  /** Creates the params that can be used when calling [DocumentClient.batchWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchWrite-property} method. */
  export class BatchWrite implements TableResult {
    private writes: { [key: string]: TableBatchWrites } = {};
    private getTableWrites(name: string): TableBatchWrites {
      const writes = this.writes[name];
      if (writes) return writes;
      return (this.writes[name] = { putItems: [], delKeys: [] });
    }
    private result?: DocumentClient.BatchWriteItemOutput;

    /** The DocumentClient used for the batch write operations. */
    public client: DocumentClient;

    /** Options used in building the batchWrite params. */
    public options: Table.BatchWriteTableOptions;

    /**
     * @param client - The DocumentClient used for the batch write operations.
     * @param options - Options used in building the batchWrite params.
     */
    constructor(client: DocumentClient, options: Table.BatchWriteTableOptions = {}) {
      this.client = client;
      this.options = options;
    }

    /**
     * Sets the items to put and delete for a specific table.
     * @param tableName - Name of table to for batch write.
     * @param putItems - Items to put in the table.
     * @param delKeys - Keys of items to delete from the table.
     */
    set(tableName: string, putItems: Table.PutItem[], delKeys: Table.PrimaryKey.AttributeValuesMap[]): void {
      this.writes[tableName] = { putItems: putItems, delKeys: delKeys };
    }

    /**
     * Adds a put item for a specific table.
     * @param tableName - Name of table to for batch write.
     * @param item - Items to put in the table.
     */
    addPut(tableName: string, item: Table.PutItem): void {
      this.getTableWrites(tableName).putItems.push(item);
    }

    /**
     * Adds a delete item by key for a specific table.
     * @param tableName - Name of table to for batch write.
     * @param key - Keys of item to delete from the table.
     */
    addDelete(tableName: string, key: Table.PrimaryKey.AttributeValuesMap): void {
      this.getTableWrites(tableName).delKeys.push(key);
    }

    /**
     * Creates the params that can be used when calling [DocumentClient.batchWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchWrite-property} method.
     * @returns Input params for [DocumentClient.batchWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchWrite-property} method.
     */
    getParams(): DocumentClient.BatchWriteItemInput {
      const params: DocumentClient.BatchWriteItemInput = { RequestItems: {} };
      Table.addBatchParams(this.options, params);

      Object.keys(this.writes).forEach((tableName) => {
        const items: DocumentClient.WriteRequest[] = [];
        const { putItems, delKeys } = this.writes[tableName];
        putItems.forEach((item) =>
          items.push({
            PutRequest: { Item: item.item ? Object.assign(Object.assign({}, item.key), item.item) : item.key },
          }),
        );
        delKeys.forEach((key) => items.push({ DeleteRequest: { Key: key } }));
        params.RequestItems[tableName] = items;
      });
      return params;
    }

    /**
     * Wrapper around [DocumentClient.batchWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchWrite-property} method.
     * @returns Promise with the batchWrite results, including responses fetched.
     */
    async execute(): Promise<DocumentClient.BatchWriteItemOutput> {
      this.result = await this.client.batchWrite(this.getParams()).promise();
      return this.result;
    }

    /**
     * The result from the DocumentClient.batchWrite executed.
     * @returns The output of DocumentClient.batchWrite.
     */
    getResult(): DocumentClient.BatchWriteItemOutput | undefined {
      return this.result;
    }

    /**
     * Gets the table item from the DocumentClient.batchWrite result.
     * @param tableName - Name of table to get item for.
     * @param key - Key of table item to get.
     * @returns The table item data.
     */
    getItem(tableName: string, key: Table.PrimaryKey.AttributeValuesMap): Table.AttributeValuesMap | void {
      const metrics = this.result?.ItemCollectionMetrics?.[tableName];
      if (!metrics) return;
      const keyNames = Object.keys(key);
      for (const item of metrics) if (equalMap(keyNames, key, item.ItemCollectionKey)) return item.ItemCollectionKey;
      // NOTE: For put items may need to return the stored writes
    }
  }

  // Transact Operations
  /** Creates the params that can be used when calling [DocumentClient.transactGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactGet-property} method. */
  export class TransactGet implements TableResult {
    private reads: { [key: string]: Table.TransactGetItem[] } = {};
    private getTableReads(name: string): Table.TransactGetItem[] {
      const keys = this.reads[name];
      if (keys) return keys;
      return (this.reads[name] = []);
    }
    private request?: DocumentClient.TransactGetItemsInput;
    private result?: DocumentClient.TransactGetItemsOutput;

    /** The DocumentClient used for the transact get operations. */
    public client: DocumentClient;

    /** Options used in building the transactGet params. */
    public options: Table.TransactGetTableOptions;

    /**
     * @param client - The DocumentClient used for the transact get operations.
     * @param options - Options used in building the transactGet params.
     */
    constructor(client: DocumentClient, options: Table.TransactGetTableOptions = {}) {
      this.client = client;
      this.options = options;
    }

    /**
     * Sets the keys for the items to fetch for a specific table.
     * @param tableName - Name of table to for transact get.
     * @param items - Keys of items and associated attributes to get.
     */
    set(tableName: string, items: Table.TransactGetItem[]): void {
      this.reads[tableName] = items;
    }

    /**
     * Add a get item based on key for a specific table.
     * @param tableName - Name of table to for transact get.
     * @param key - Primary key of items to get.
     * @param itemAttributes - List of attribute names to return, when not present all attributes will be returned.
     */
    addGet(tableName: string, key: Table.PrimaryKey.AttributeValuesMap, itemAttributes?: string[]): void {
      this.getTableReads(tableName).push({ key, itemAttributes });
    }

    /**
     * Creates the params that can be used when calling [DocumentClient.transactGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactGet-property} method.
     * @returns Input params for [DocumentClient.transactGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactGet-property} method.
     */
    getParams(): DocumentClient.TransactGetItemsInput {
      const items: DocumentClient.TransactGetItemList = [];
      const params: DocumentClient.TransactGetItemsInput = { TransactItems: items };
      Table.addBatchParams(this.options, params);
      Object.keys(this.reads).forEach((name) =>
        this.reads[name].forEach((item) =>
          items.push({ Get: Table.addParams<DocumentClient.Get>({ Key: item.key, TableName: name }, this.options) }),
        ),
      );
      return params;
    }
    /**
     * Wrapper around [DocumentClient.transactGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactGet-property} method.
     * @returns Promise with the transactGet results, including responses fetched.
     */
    async execute(): Promise<DocumentClient.TransactGetItemsOutput> {
      this.request = this.getParams();
      this.result = await this.client.transactGet(this.request).promise();
      return this.result;
    }

    /**
     * The result from the DocumentClient.transactGet executed.
     * @returns The output of DocumentClient.transactGet.
     */
    getResult(): DocumentClient.TransactGetItemsOutput | undefined {
      return this.result;
    }

    /**
     * Gets the table item from the DocumentClient.transactGet result.
     * @param tableName - Name of table to get item for.
     * @param key - Key of table item to get.
     * @returns The table item data.
     */
    getItem(tableName: string, key: Table.PrimaryKey.AttributeValuesMap): Table.AttributeValuesMap | void {
      const responses = this.result?.Responses;
      if (!responses) return;
      const keyNames = Object.keys(key);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const items = this.request!.TransactItems;
      for (let i = 0; i < items.length; i++) {
        const item = items[i].Get;
        if (item.TableName === tableName && equalMap(keyNames, key, item.Key)) return responses[i].Item;
      }
    }
  }

  /** Wrapper around [DocumentClient.transactWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactWrite-property} method. */
  export class TransactWrite implements TableResult {
    private writes: { [key: string]: Required<Table.TransactWriteData> } = {};
    private getTableWrites(name: string): Required<Table.TransactWriteData> {
      const writes = this.writes[name];
      if (writes) return writes;
      return (this.writes[name] = { check: [], delete: [], put: [], update: [] });
    }
    private result?: DocumentClient.TransactWriteItemsOutput;

    /** The DocumentClient used for the transact write operations. */
    public client: DocumentClient;

    /** Options used in building the transactWrite params.  */
    public options: Table.TransactWriteTableOptions;

    /**
     * @param client - The DocumentClient used for the transact write operations.
     * @param options - Options used in building the transactWrite params.
     */
    constructor(client: DocumentClient, options: Table.TransactWriteTableOptions = {}) {
      this.client = client;
      this.options = options;
    }

    /**
     * Sets the items to check, delete, put and update for a specific table.
     * @param tableName - Name of table to for transact write.
     * @param write - Set of operations to write in the transaction.
     */
    set(tableName: string, writes: Required<Table.TransactWriteData>): void {
      this.writes[tableName] = writes;
    }

    /**
     * Add check condition statement to transactWrite.
     * @param tableName - Name of table for write transaction.
     * @param key - Key of item to used in condition check.
     * @param conditions - List of conditions to validate when executing the transact write.
     * @param returnFailure - Determines what to return on transaction failure.
     */
    addCheck(
      tableName: string,
      key: Table.PrimaryKey.AttributeValuesMap,
      conditions: Condition.Resolver[],
      returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure,
    ): void {
      this.getTableWrites(tableName).check.push({ key, conditions, returnFailure });
    }

    /**
     * Add delete statement to transact write.
     * @param tableName - Name of table for write transaction.
     * @param key - Key of item to delete in transact write.
     * @param conditions - List of conditions to validate when executing the transact write.
     * @param returnFailure - Determines what to return on transaction failure.
     */
    addDelete(
      tableName: string,
      key: Table.PrimaryKey.AttributeValuesMap,
      conditions?: Condition.Resolver[],
      returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure,
    ): void {
      this.getTableWrites(tableName).delete.push({ key, conditions, returnFailure });
    }

    /**
     * Add put statement to transact write.
     * @param tableName - Name of table for write transaction.
     * @param key - Key of item to put in transact write.
     * @param item - Item to put in the transact write.
     * @param conditions - List of conditions to validate when executing the transact write.
     * @param returnFailure - Determines what to return on transaction failure.
     */
    addPut(
      tableName: string,
      key: Table.PrimaryKey.AttributeValuesMap,
      item?: Table.AttributeValuesMap,
      conditions?: Condition.Resolver[],
      returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure,
    ): void {
      this.getTableWrites(tableName).put.push({ key, item, conditions, returnFailure });
    }

    /**
     * Add update statement to transact write.
     * @param tableName - Name of table for write transaction.
     * @param key - Key of item to update in transact write.
     * @param item - Item to update in transact write.
     * @param conditions - List of conditions to validate when executing the transact write.
     * @param returnFailure - Determines what to return on transaction failure.
     */
    addUpdate(
      tableName: string,
      key: Table.PrimaryKey.AttributeValuesMap,
      item?: Update.ResolverMap,
      conditions?: Condition.Resolver[],
      returnFailure: DocumentClient.ReturnValue = 'ALL_NEW',
    ): void {
      this.getTableWrites(tableName).update.push({ key, item, conditions, returnFailure });
    }

    /**
     * Creates the params that can be used when calling [DocumentClient.transactWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactWrite-property} method.
     * @returns Input params for [DocumentClient.transactWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactWrite-property} method.
     */
    getParams(): DocumentClient.TransactWriteItemsInput {
      const items: DocumentClient.TransactWriteItemList = [];
      const params: DocumentClient.TransactWriteItemsInput = { TransactItems: items };
      Table.addBatchParams(this.options, params);
      Object.keys(this.writes).forEach((name) => {
        const writes = this.writes[name];
        writes.check.forEach((item) =>
          items.push({
            ConditionCheck: Table.addWriteParams<DocumentClient.ConditionCheck>(
              { TableName: name, Key: item.key } as DocumentClient.ConditionCheck,
              item,
            ),
          }),
        );

        writes.delete.forEach((item) =>
          items.push({
            Delete: Table.addWriteParams<DocumentClient.Delete>({ TableName: name, Key: item.key }, item),
          }),
        );

        writes.put.forEach((item) =>
          items.push({
            Put: Table.addWriteParams<DocumentClient.Put>(
              { TableName: name, Item: { ...item.key, ...item.item } },
              item,
            ),
          }),
        );

        writes.update.forEach((item) =>
          items.push({
            Update: Table.addWriteParams<DocumentClient.Update>(
              { TableName: name, Key: item.key } as DocumentClient.Update,
              item,
              (params, attributes) => UpdateExpression.addParams(params, attributes, item.item),
            ),
          }),
        );
      });
      return params;
    }

    /**
     * Wrapper around [DocumentClient.transactWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactWrite-property} method.
     * @returns Promise with the batchWrite results, including responses fetched.
     */
    async execute(): Promise<DocumentClient.TransactWriteItemsOutput> {
      this.result = await this.client.transactWrite(this.getParams()).promise();
      return this.result;
    }

    /**
     * The result from the DocumentClient.transactWrite executed.
     * @returns The output of DocumentClient.transactWrite.
     */
    getResult(): DocumentClient.TransactWriteItemsOutput | undefined {
      return this.result;
    }

    /**
     * Gets the table item from the DocumentClient.transactWrite result.
     * @param tableName - Name of table to get item for.
     * @param key - Key of table item to get.
     * @returns The table item data.
     */
    getItem(tableName: string, key: Table.PrimaryKey.AttributeValuesMap): Table.AttributeValuesMap | void {
      const tableMetrics = this.result?.ItemCollectionMetrics?.[tableName];
      if (!tableMetrics) return;
      const keyNames = Object.keys(key);
      for (const metrics of tableMetrics) {
        const item = metrics.ItemCollectionKey;
        if (equalMap(keyNames, key, item)) return item;
      }
      // NOTE: For put return the stored writes
    }
  }
}
