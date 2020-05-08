import { Table, Index } from './Table';

// Validate:
// X Table initialize
// X Index initialize
// - Params & action args (key and params)
// - Table and Index name (regex)
// - Attribute names (regex)

/**
 * Attribute names of the primary key for tables and indexes.
 */
export interface KeyName {
  /**
   * Partition key name.
   */
  pk?: string;

  /**
   * Sort key name.
   */
  sk?: string;
}

/**
 * Validate the key attributes for a {@link Table}.
 * @typeParam ATTRIBUTES The interface or type that has all required attributes, including table and index
 * primary key and all defined index projected attributes.
 * @param keyAttributes Key attributes of the Table.
 * @param name Name of Table.
 * @param onError Method to call when there is a validation error.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateKeyAttributes<ATTRIBUTES extends { [index: string]: any }>(
  keyAttributes: Table.PrimaryKey.AttributeTypesMapT<ATTRIBUTES>,
  name: string,
  onError: (msg: string) => void,
): void {
  Object.keys(keyAttributes).forEach((key) => {
    const attr = keyAttributes[key];
    if (attr.type !== 'S' && attr.type !== 'N' && attr.type !== 'B') {
      onError(`Primary key '${key}' has an invalid type of '${attr.type}' in table '${name}'`);
    }
  });
}

/**
 * Validate the key schema for a {@link Table}.
 * @typeParam KEY The interface of the table's primary key
 * @typeParam ATTRIBUTES The interface or type that has all required attributes, including table and index
 * primary key and all defined index projected attributes.
 * @param keySchema Key schema of the Table.
 * @param keyAttributes Key attributes of the Table.
 * @param name Name of the Table.
 * @param onError Method to call when there is a validation error.
 */
export function validateKeySchema<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  KEY extends { [index: string]: any },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ATTRIBUTES extends { [index: string]: any } = KEY
>(
  keySchema: Table.PrimaryKey.KeyTypesMapT<KEY>,
  keyAttributes: Table.PrimaryKey.AttributeTypesMapT<ATTRIBUTES>,
  name: string,
  onError: (msg: string) => void,
): KeyName {
  let { pk, sk }: KeyName = {};
  Object.keys(keySchema).forEach((key) => {
    const schema = keySchema[key];
    const attr = keyAttributes[key];
    if (attr === undefined) {
      onError(`Key '${key}' not in table's keyAttributes`);
    }
    if (schema.keyType === 'HASH') {
      if (pk !== undefined) onError(`Key '${key}' invalid, ${name} already has partition key '${pk}'`);
      pk = key;
    } else if (schema.keyType === 'RANGE') {
      if (sk !== undefined) onError(`Key '${key}' invalid, ${name} already has sort key '${sk}'`);
      sk = key;
    } else {
      onError(`Key '${key}' has an invalid key type of '${schema.keyType}'`);
    }
  });
  if (pk === undefined) onError(`${name} needs partition key`);
  return { pk, sk };
}

/**
 * Validates an {@link Index} for a {@link Table}.
 * @param index An index for a Table.
 * @param names Name of the Table.
 * @param onError Method to call when there is a validation error.
 */
export function validateIndexes(index: Index, names: Set<string>, onError: (msg: string) => void): void {
  if (!index.name) onError(`Global index must have a name`);
  if (names.has(index.name)) onError(`Duplicate index name '${index.name}'`);
  names.add(index.name);
  const type = index.projection.type;
  if (type === 'INCLUDE') {
    if (!index.projection.attributes || index.projection.attributes.length <= 0) {
      onError(`'${index.name}' projection type '${type}' must have attributes`);
    }
  } else if (type !== 'ALL' && type !== 'KEYS_ONLY') {
    onError(`'${index.name}' projection type is invalidate '${type}'`);
  } else {
    if (index.projection.attributes) onError(`${index.name}' projection type '${type}' does not support attributes`);
  }
}

/**
 * Validates that a {@link Table} is configured correctly.  The Table's onError methods is called for any
 * validation errors.   This method should primarily be used in tests to validate the table.
 * @typeParam KEY The interface of the table's primary key.
 * @typeParam ATTRIBUTES The interface or type that has all required attributes, including table and index primary
 * key and all defined index projected attributes.
 * @param table Table to be validated.
 */
export function validateTable<KEY, ATTRIBUTES>(table: Table.TableT<KEY, ATTRIBUTES>): void {
  if (!table.name) table.onError(`Table must have a name`);
  validateKeyAttributes(table.keyAttributes, table.name, table.onError);
  const { pk, sk } = validateKeySchema(table.keySchema, table.keyAttributes, table.name, table.onError);
  const names = new Set<string>();
  table.globalIndexes.forEach((index) => {
    validateIndexes(index, names, table.onError);
    const { name, keySchema } = index;
    const iKeys = validateKeySchema(keySchema, table.keyAttributes, name, table.onError);
    if (iKeys.pk === pk && iKeys.sk === sk)
      table.onError(`${name} has same partition key '${pk}' and sort key '${sk}' as table`);
  });
  table.localIndexes.forEach((index) => {
    validateIndexes(index, names, table.onError);
    const { name, keySchema } = index;
    const iKeys = validateKeySchema(keySchema, table.keyAttributes, name, table.onError);
    if (iKeys.pk !== pk) table.onError(`${name} partition key '${iKeys.pk}' needs to be '${pk}'`);
    if (iKeys.sk === sk) table.onError(`${name} has same sort key '${sk}' as table`);
    if (iKeys.sk === undefined) table.onError(`${name} must have a sort key`);
  });
}
