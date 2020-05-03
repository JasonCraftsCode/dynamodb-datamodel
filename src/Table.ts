/**
 * Table.ts contains the classes used to model a single DynamodDB table with both local and global secondary indexes
 * @packageDocumentation
 */
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Condition } from './Condition';
import { ExpressionAttributes } from './ExpressionAttributes';
import { KeyCondition } from './KeyCondition';
import { Update } from './Update';

function getKeyName(keySchema: Table.PrimaryKey.KeyTypesMap, type: Table.PrimaryKey.KeyTypes): string {
  const keys = Object.keys(keySchema);
  for (const key of keys) {
    if (keySchema[key].keyType === type) {
      return key;
    }
  }
  return '';
}

/**
 * Represents either Global Secondary Index (GSI) or Local Secondary Index (LSI) for a table.  GSIs and LSIs can be
 * associated with a {@link Table} by add GSIs to the {@link Table.globalIndexes} array property and LSIs to the {@link Table.localIndexes}
 * array property, either through the {@link Table.constructor} or by calling {@link Table.addGlobalIndexes} or {@link Table.addLocalIndexes}.
 *
 * When the index is added to the Table either through the constructor, addGlobalIndexes or addLocalIndexes each index's
 * {@link init} will be passed the Table it is associated with to support the Index methods:
 * {@link queryParams}, {@link scanParams}, {@link query}, and {@link scan}.
 *
 * Once the GSIs and LSIs are associated with a table they can be validated using {@link validateTable}.
 *
 * If you are using TypeScript you can use {@link Index.createIndex} to create an Index with strong typing for the primary key.
 * This provides striong types for the {@link Index.keySchema} property, {@link Index.queryParams} and {@link Index.scan} methods.
 *
 * @example
 * ```typescript
 * import { Index, Table } from 'dynamodb-datamodel';
 * interface GSI0Key {
 *   G0P: Table.PrimaryKey.PartitionString;
 *   G0S?: Table.PrimaryKey.SortString;
 * }
 * const gsi0 = Index.createIndex<GSI0Key>({
 *   name: 'GSI0',
 *   keySchema: {
 *     G0P: Table.PrimaryKey.PartitionKeyType,
 *     G0S: Table.PrimaryKey.SortKeyType,
 *   },
 *   projection: { type: 'ALL' },
 * });
 * // gsi0 can then be added to the tables globalIndexes property.
 * ```
 */
export class Index {
  // NOTE: If you update the below property docs also update IndexParams
  /**
   * Name of the table's secondary index, used to set the IndexName for dynamodb scan and query actions.
   */
  name: string;
  /**
   * Schema map for the Secondary Index's primary key, in the form of { <partition key name>: { keyType: 'HASH'} }.
   */
  keySchema: Table.PrimaryKey.KeyTypesMap;
  /**
   * Defines how the other attributes for an entity are projected to the index.
   */
  projection: {
    /**
     * Only relivant when type is 'INCLUDE', list of the attributes to project to the secondary index.
     */
    attributes?: string[];
    /**
     * Defines what general set of attributes are projected into the secondary index.
     */
    type: Table.ProjectionType;
  };
  /**
   * The table this index is associated with.  Used in {@link queryParams}, {@link scanParams}, {@link query}, and {@link scan}.
   */
  table?: Table;

  /**
   * @param params Initalize the Index's name, keySchema and projection properties.
   */
  constructor(params: Index.IndexParams) {
    this.name = params.name;
    this.keySchema = params.keySchema;
    this.projection = params.projection;
  }

  /**
   * Used to initalize the Index with the table to support {@link queryParams}, {@link scanParams}, {@link query}, and {@link scan}..
   * @param table table to initalize the index with.
   */
  init(table: Table): void {
    this.table = table;
  }

  /**
   * @returns The name of the primary (or HASH) key.
   */
  getPartitionKey(): string {
    return getKeyName(this.keySchema, 'HASH');
  }

  /**
   * @returns The name of the sort (or RANGE) key.
   */
  getSortKey(): string {
    return getKeyName(this.keySchema, 'RANGE');
  }

  /**
   * Add the IndexName to query options.
   * @param options Options to add IndexName to.
   * @returns Query options with the IndexName set to the {@link Index.name}
   */
  getQueryOptions(options: Table.QueryOptions = {}): Table.QueryOptions {
    return { ...options, params: { IndexName: this.name, ...options.params } };
  }

  /**
   * Add the IndexName to scan options
   * @param options Options to add IndexName to.
   * @returns Scan options with the IndexName set to the {@link Index.name}
   */
  getScanOptions(options: Table.ScanOptions = {}): Table.ScanOptions {
    return { ...options, params: { IndexName: this.name, ...options.params } };
  }

  /**
   * Creates the params that can be used when calling the [DocumentClient.query]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property} method.
   * @param key Primary key with optional KeyCondition to query the secondary index with
   * @param options Used in building the query params
   * @returns DynamoDB query method params containing the table, index, key and options.
   */
  queryParams(key: Table.PrimaryKey.KeyQueryMap, options?: Table.QueryOptions): DocumentClient.QueryInput {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.table!.queryParams(key, this.getQueryOptions(options));
  }

  /**
   * Creates the params that can be used when calling the [DocumentClient.scan]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property} method.
   * @param options Used in building the scan params
   * @returns DocumentClient scan method's params containing the table, index and options.
   */
  scanParams(options?: Table.ScanOptions): DocumentClient.ScanInput {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.table!.scanParams(this.getScanOptions(options));
  }

  /**
   * Wrapper around [DocumentClient.query]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property}
   * method that uses the index and table properties with the key and options params.
   * @param key Primary key with optional KeyCondition to query the secondary index with
   * @param options Used in building the query params
   * @returns Primise with the query results, including items fetched
   */
  query(key: Table.PrimaryKey.KeyQueryMap, options?: Table.QueryOptions): Promise<DocumentClient.QueryOutput> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.table!.query(key, this.getQueryOptions(options));
  }
  /**
   * Wrapper around [DocumentClient.scan]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property}
   * method that uses the index and table properties with the options param.
   * @param options Used in building the scan params
   * @returns Primise with the scan results, including items fetched
   */
  scan(options?: Table.ScanOptions): Promise<DocumentClient.ScanOutput> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.table!.scan(this.getScanOptions(options));
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace, no-redeclare
export namespace Index /* istanbul ignore next: needed for ts with es5 */ {
  // NOTE: if you update the docs for the properties of IndexParams also update the docs for Index properties
  /**
   * Used in {@link Index constructor}
   */
  export interface IndexParams {
    /**
     * Name of the table's secondary index, used to set the IndexName for dynamodb scan and query actions.
     */
    name: string;
    /**
     * Schema map for the Secondary Index's primary key, in the form of { <partition key name>: { keyType: 'HASH'} }.
     */
    keySchema: Table.PrimaryKey.KeyTypesMap;
    /**
     * Defines how the other attributes for an entity are projected to the index.
     */
    projection: {
      /**
       * Only relivant when type is 'INCLUDE', list of the attributes to project to the secondary index.
       */
      attributes?: string[];
      /**
       * Defines what general set of attributes are projected into the secondary index.
       */
      type: Table.ProjectionType;
    };
  }

  /**
   * Default and Example global secondary index primary key with the generalized compact format of.
   */
  export interface DefaultGlobalIndexKey {
    /**
     * Partition key: G#P which representds **G**lobal + **#** of index + **P**artition key
     */
    G0P: Table.PrimaryKey.PartitionString;
    /**
     * Sort key: G#S which representds **G**lobal + **#** of index + **S**ort key. The sort key is optional to support the sort key as being option for queryParams and query methods.
     */
    G0S?: Table.PrimaryKey.SortString;
  }

  /**
   * Default and Example local secondary index primary key with the generalized compact format of.
   */
  export interface DefaultLocalIndexKey {
    /**
     * Partition key: P which is the Table partition key since local secondary indexes are stored in the same partition as the main table.
     */
    P: Table.PrimaryKey.PartitionString;
    /**
     * Sort key: L#S which representds **G**lobal + **#** of index + **S**ort key.  The sort key is optional to support the sort key as being option for queryParams and query methods.
     */
    L0S?: Table.PrimaryKey.SortString;
  }

  /**
   * Index constructor param for the generic form of Index
   * @typeParam KEY The interface of the index's primary key
   */
  export interface IndexParamsT<KEY> extends IndexParams {
    /**
     * Generic form of {@link IndexParam.keySchema}
     */
    keySchema: Table.PrimaryKey.KeyTypesMapT<KEY>;
  }

  /**
   * Generic form of {@link Index}.
   * @typeParam KEY The interface of the index's primary key
   */
  export interface IndexT<KEY = DefaultGlobalIndexKey> extends Index {
    /**
     * Generic form of {@link Index.keySchema}
     */
    keySchema: Table.PrimaryKey.KeyTypesMapT<KEY>;

    /**
     * @see Generic form of {@link Index.queryParams}
     */
    queryParams(key: Table.PrimaryKey.KeyQueryMapT<KEY>, options?: Table.QueryOptions): DocumentClient.QueryInput;
    /**
     * @see Generic form of {@link Index.query}
     */
    query(key: Table.PrimaryKey.KeyQueryMapT<KEY>, options?: Table.QueryOptions): Promise<DocumentClient.QueryOutput>;
  }

  /**
   * Creates the generic form of Index used in TypeScript to get strong typing
   * @param params Index constructor params
   */
  // eslint-disable-next-line no-inner-declarations
  export function createIndex<KEY = DefaultGlobalIndexKey>(params: IndexParamsT<KEY>): IndexT<KEY> {
    return new Index(params) as IndexT<KEY>;
  }
}

/**
 *
 */
export class Table {
  private _client?: DocumentClient;

  name: string;
  keyAttributes: Table.PrimaryKey.AttributeTypesMap;
  keySchema: Table.PrimaryKey.KeyTypesMap;
  globalIndexes: Index[] = [];
  localIndexes: Index[] = [];
  createClient: DocumentClient | (() => DocumentClient);
  onError: (msg: string) => void = (msg: string) => {
    throw new Error(msg);
  };

  constructor(params: Table.TableParams) {
    this.name = params.name;
    this.keyAttributes = params.keyAttributes;
    this.keySchema = params.keySchema;
    if (params.globalIndexes) this.addGlobalIndexes(params.globalIndexes);
    if (params.localIndexes) this.addLocalIndexes(params.localIndexes);
    this.createClient = params.client;
  }

  get client(): DocumentClient {
    if (!this._client) this._client = typeof this.createClient === 'function' ? this.createClient() : this.createClient;
    return this._client;
  }

  addGlobalIndexes(gsi: Index[]): void {
    gsi.forEach((index) => index.init(this));
    this.globalIndexes = this.globalIndexes.concat(gsi);
  }

  addLocalIndexes(lsi: Index[]): void {
    lsi.forEach((index) => index.init(this));
    this.localIndexes = this.localIndexes.concat(lsi);
  }

  getPartitionKey(): string {
    return getKeyName(this.keySchema, 'HASH');
  }

  getSortKey(): string {
    return getKeyName(this.keySchema, 'RANGE');
  }

  createSet(
    list: string[] | number[] | Table.BinaryValue[],
    options?: DocumentClient.CreateSetOptions,
  ): Table.AttributeSetValues {
    return this.client.createSet(list, options);
  }

  createStringSet(list: string[], options?: DocumentClient.CreateSetOptions): Table.StringSetValue {
    return this.createSet(list, options) as Table.StringSetValue;
  }

  createNumberSet(list: number[], options?: DocumentClient.CreateSetOptions): Table.NumberSetValue {
    return this.createSet(list, options) as Table.NumberSetValue;
  }

  createBinarySet(list: Table.BinaryValue[], options?: DocumentClient.CreateSetOptions): Table.BinarySetValue {
    return this.createSet(list, options) as Table.BinarySetValue;
  }

  // Action Params:
  /**
   * @returns Input params for {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property | DocumentClient.get}
   */
  getParams(key: Table.PrimaryKey.AttributeValuesMap, options: Table.GetOptions = {}): Table.GetInput {
    return {
      ...options.params,
      TableName: this.name,
      Key: key,
    };
  }
  deleteParams(
    key: Table.PrimaryKey.AttributeValuesMap,
    options: Table.DeleteOptions = {},
  ): DocumentClient.DeleteItemInput {
    const params: DocumentClient.DeleteItemInput = {
      ...options.params,
      TableName: this.name,
      Key: key,
    };
    const attributes = options.attributes || new ExpressionAttributes();
    Condition.addAndParam(options.conditions, attributes, params);
    attributes.addParams(params);
    return params;
  }
  getPutCondition(options: Table.PutWriteOptions): Condition.Resolver | void {
    if (options === 'Exists') return Condition.exists(this.getPartitionKey());
    if (options === 'NotExists') return Condition.notExists(this.getPartitionKey());
  }
  // Consider having writeOptions default to be 'NotExists'
  putParams(
    key: Table.PrimaryKey.AttributeValuesMap,
    item?: Table.AttributeValuesMap,
    options: Table.PutOptions = {},
  ): DocumentClient.PutItemInput {
    const params: DocumentClient.PutItemInput = {
      ...options.params,
      TableName: this.name,
      Item: { ...key, ...item },
    };
    const conditions = options.conditions || [];
    const condition = this.getPutCondition(options.writeOptions || 'Always');
    if (condition) conditions.push(condition);
    const attributes = options.attributes || new ExpressionAttributes();
    Condition.addAndParam(conditions, attributes, params);
    attributes.addParams(params);
    return params;
  }
  updateParams(
    key: Table.PrimaryKey.AttributeValuesMap,
    item?: Update.UpdateMapValue,
    options: Table.UpdateOptions = {},
  ): DocumentClient.UpdateItemInput {
    const params: DocumentClient.UpdateItemInput = {
      ...options.params,
      TableName: this.name,
      Key: key,
    };
    const attributes = options.attributes || new ExpressionAttributes();
    Update.addParam(item, attributes, params);
    Condition.addAndParam(options.conditions, attributes, params);
    attributes.addParams(params);
    return params;
  }
  queryParams(key: Table.PrimaryKey.KeyQueryMap, options: Table.QueryOptions = {}): DocumentClient.QueryInput {
    const params: DocumentClient.QueryInput = {
      ...options.params,
      TableName: this.name,
    };
    const attributes = options.attributes || new ExpressionAttributes();
    KeyCondition.addParam(key, attributes, params);
    Condition.addAndFilterParam(options.conditions, attributes, params);
    attributes.addParams(params);
    return params;
  }
  scanParams(options: Table.ScanOptions = {}): DocumentClient.ScanInput {
    const params: DocumentClient.ScanInput = {
      ...options.params,
      TableName: this.name,
    };
    const attributes = options.attributes || new ExpressionAttributes();
    Condition.addAndFilterParam(options.conditions, attributes, params);
    attributes.addParams(params);
    return params;
  }

  // actions:
  get(key: Table.PrimaryKey.AttributeValuesMap, options?: Table.GetOptions): Promise<DocumentClient.GetItemOutput> {
    return this.client.get(this.getParams(key, options)).promise();
  }
  delete(
    key: Table.PrimaryKey.AttributeValuesMap,
    options?: Table.DeleteOptions,
  ): Promise<DocumentClient.DeleteItemOutput> {
    return this.client.delete(this.deleteParams(key, options)).promise();
  }
  put(
    key: Table.PrimaryKey.AttributeValuesMap,
    items?: Table.AttributeValuesMap,
    options?: Table.PutOptions,
  ): Promise<DocumentClient.PutItemOutput> {
    return this.client.put(this.putParams(key, items, options)).promise();
  }
  update(
    key: Table.PrimaryKey.AttributeValuesMap,
    items?: Update.UpdateMapValue,
    options?: Table.UpdateOptions,
  ): Promise<DocumentClient.UpdateItemOutput> {
    return this.client.update(this.updateParams(key, items, options)).promise();
  }
  // query and scan are also used to access indexes
  query(key: Table.PrimaryKey.KeyQueryMap, options?: Table.QueryOptions): Promise<DocumentClient.QueryOutput> {
    return this.client.query(this.queryParams(key, options)).promise();
  }
  scan(options?: Table.ScanOptions): Promise<DocumentClient.ScanOutput> {
    return this.client.scan(this.scanParams(options)).promise();
  }

  static getPutAction(options?: Table.PutWriteOptions): 'put' | 'put-new' | 'put-replace' {
    if (options === 'NotExists') return 'put-new';
    if (options === 'Exists') return 'put-replace';
    return 'put';
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace, no-redeclare
export namespace Table /* istanbul ignore next: needed for ts with es5 */ {
  // export type PromiseResult<D, E> = D & { $response: Response<D, E> };
  export type Optional<T> = { [P in keyof T]?: T[P] };

  export type AttributeTypes = 'B' | 'N' | 'S' | 'BOOL' | 'NULL' | 'L' | 'M' | 'BS' | 'NS' | 'SS';

  export type BinaryValue = DocumentClient.binaryType;
  export type StringSetValue = DocumentClient.StringSet;
  export type NumberSetValue = DocumentClient.NumberSet;
  export type BinarySetValue = DocumentClient.BinarySet;
  export type MapValue = { [key: string]: AttributeValues };
  export type ListValue = AttributeValues[];

  export type AttributeSetValues = StringSetValue | NumberSetValue | BinarySetValue;
  export type AttributeValues =
    | null
    | string
    | number
    | boolean
    | BinaryValue
    | AttributeSetValues
    | MapValue
    | ListValue;

  export type AttributeValuesMap = { [key: string]: AttributeValues };

  export type ItemActions = 'get' | 'delete' | 'put' | 'put-new' | 'put-replace' | 'update';

  export interface TableParams {
    name: string;
    keyAttributes: PrimaryKey.AttributeTypesMap;
    keySchema: PrimaryKey.KeyTypesMap;
    globalIndexes?: Index[];
    localIndexes?: Index[];
    client: DocumentClient | (() => DocumentClient);
    onError?: (msg: string) => void;
  }

  export class PrimaryKey {
    static readonly StringType: { type: 'S' } = { type: 'S' };
    static readonly NumberType: { type: 'N' } = { type: 'N' };
    static readonly BinaryType: { type: 'B' } = { type: 'B' };
    static readonly PartitionKeyType: { keyType: 'HASH' } = { keyType: 'HASH' };
    static readonly SortKeyType: { keyType: 'RANGE' } = { keyType: 'RANGE' };
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace PrimaryKey {
    export type AttributeValues = string | number | Table.BinaryValue;
    // ScalarAttributeType
    export type AttributeTypes = 'B' | 'N' | 'S';
    export type KeyTypes = 'HASH' | 'RANGE';

    export type PartitionString = string | { type: 'S' } | { keyType: 'HASH' };
    export type PartitionNumber = number | { type: 'N' } | { keyType: 'HASH' };
    export type PartitionBinary = Table.BinaryValue | { type: 'B' } | { keyType: 'HASH' };

    export type SortString = string | { type: 'S' } | { keyType: 'RANGE' } | KeyCondition.StringResolver;
    export type SortNumber = number | { type: 'N' } | { keyType: 'RANGE' } | KeyCondition.NumberResolver;
    export type SortBinary = Table.BinaryValue | { type: 'B' } | { keyType: 'RANGE' } | KeyCondition.BinaryResolver;

    // *Map used as key based params in Table
    export type AttributeTypesMap = { [key: string]: { type: AttributeTypes } };
    export type KeyTypesMap = { [key: string]: { keyType: KeyTypes } };
    export type KeyQueryMap = { [key: string]: AttributeValues | KeyCondition.AttributeResolver };
    export type AttributeValuesMap = { [key: string]: AttributeValues };

    // *MapT used as key based params in TableT
    export type AttributeTypesMapT<T> = {
      [P in keyof Required<T>]: Extract<T[P], { type: AttributeTypes }>;
    };
    export type KeyTypesMapT<T> = {
      [P in keyof Required<T>]: Extract<T[P], { keyType: KeyTypes }>;
    };
    export type KeyQueryMapT<T> = {
      [P in keyof T]: Extract<T[P], Table.AttributeValues | KeyCondition.AttributeResolver>;
    };
    export type AttributeValuesMapT<T> = {
      [P in keyof Required<T>]: Extract<T[P], Table.AttributeValues>;
    };
  }

  /**
   * Defines what general set of attributes are projected into the secondary index.
   * @typedef _"ALL"_ - All of the attributes of an item are projected into the secondary index.
   * @typedef _"KEYS_ONLY"_ - The table and the secondary index primary keys are projected into the secondary index.
   */
  export type ProjectionType = 'ALL' | 'KEYS_ONLY' | 'INCLUDE';

  // Omit legacy attributes
  //   * @typedef GetInput DocumentClient.GetItemInput
  /**
   * Input params for [DocumentClient.get]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property}
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface GetInput extends Omit<DocumentClient.GetItemInput, 'AttributesToGet'> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface PutInput extends Omit<DocumentClient.PutItemInput, 'Expected' | 'ConditionalOperator'> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DeleteInput extends Omit<DocumentClient.DeleteItemInput, 'Expected' | 'ConditionalOperator'> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface UpdateInput
    extends Omit<DocumentClient.UpdateItemInput, 'AttributeUpdates' | 'Expected' | 'ConditionalOperator'> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface QueryInput
    extends Omit<
      DocumentClient.QueryInput,
      'AttributesToGet' | 'KeyConditions' | 'QueryFilter' | 'ConditionalOperator'
    > {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface ScanInput
    extends Omit<DocumentClient.ScanInput, 'AttributesToGet' | 'ScanFilter' | 'ConditionalOperator'> {}

  export interface BaseOptions<T = {}> {
    attributes?: ExpressionAttributes;
    conditions?: Condition.Resolver[];
    params?: Optional<T>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context?: any;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface GetOptions extends BaseOptions<GetInput> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DeleteOptions extends BaseOptions<DeleteInput> {}
  export type PutWriteOptions = 'Always' | 'Exists' | 'NotExists';
  export interface PutOptions extends BaseOptions<PutInput> {
    writeOptions?: PutWriteOptions;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface UpdateOptions extends BaseOptions<UpdateInput> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface QueryOptions extends BaseOptions<QueryInput> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface ScanOptions extends BaseOptions<ScanInput> {}

  // Default Key definitions
  // StringSortKey should be optional (?) since for update actions it is optional
  export interface DefaultTableKey {
    P: PrimaryKey.PartitionString;
    S?: PrimaryKey.SortString;
  }

  // TableT
  export interface TableParamsT<KEY, ATTRIBUTES> extends TableParams {
    keyAttributes: PrimaryKey.AttributeTypesMapT<ATTRIBUTES>;
    keySchema: PrimaryKey.KeyTypesMapT<KEY>;
  }

  export interface TableT<KEY = DefaultTableKey, ATTRIBUTES = KEY> extends Table {
    keyAttributes: PrimaryKey.AttributeTypesMapT<ATTRIBUTES>;
    keySchema: PrimaryKey.KeyTypesMapT<KEY>;

    getParams(key: PrimaryKey.AttributeValuesMapT<KEY>, options?: Table.GetOptions): Table.GetInput;
    deleteParams(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      options?: Table.DeleteOptions,
    ): DocumentClient.DeleteItemInput;
    putParams(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      item?: Table.AttributeValuesMap,
      options?: Table.PutOptions,
    ): DocumentClient.PutItemInput;
    updateParams(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      item?: Update.UpdateMapValue,
      options?: Table.UpdateOptions,
    ): DocumentClient.UpdateItemInput;
    queryParams(key: PrimaryKey.KeyQueryMapT<KEY>, options?: Table.QueryOptions): DocumentClient.QueryInput;
    scanParams(options?: Table.ScanOptions): DocumentClient.ScanInput;

    // actions:
    get(key: PrimaryKey.AttributeValuesMapT<KEY>, options?: Table.GetOptions): Promise<DocumentClient.GetItemOutput>;
    delete(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      options?: Table.DeleteOptions,
    ): Promise<DocumentClient.DeleteItemOutput>;
    put(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      item?: Table.AttributeValuesMap,
      options?: Table.PutOptions,
    ): Promise<DocumentClient.PutItemOutput>;
    update(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      item?: Update.UpdateMapValue,
      options?: UpdateOptions,
    ): Promise<DocumentClient.UpdateItemOutput>;
    // query and scan are also used to access indexes
    query(key: PrimaryKey.KeyQueryMapT<KEY>, options?: Table.QueryOptions): Promise<DocumentClient.QueryOutput>;
    scan(options?: ScanOptions): Promise<DocumentClient.ScanOutput>;
  }

  // eslint-disable-next-line no-inner-declarations
  export function createTable<KEY = Table.DefaultTableKey, ATTRIBUTES = KEY>(
    params: TableParamsT<KEY, ATTRIBUTES>,
  ): TableT<KEY, ATTRIBUTES> {
    return new Table(params) as TableT<KEY, ATTRIBUTES>;
  }
}
