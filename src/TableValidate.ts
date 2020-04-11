import { Table, IndexBase } from './Table';

// Validate:
// X Table initialize
// X Index initialize
// - Params & action args (key and params)
// - Table and Index name (regex)
// - Attribute names (regex)

export interface KeyName {
  pk?: string;
  sk?: string;
}

export function validateKeyAttribute<ATTRIBUTES extends { [index: string]: any }>(
  keyAttributes: Table.PrimaryAttributeDefinitionsT<ATTRIBUTES>,
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

export function validateKeySchema<
  KEY extends { [index: string]: any },
  ATTRIBUTES extends { [index: string]: any } = KEY
>(
  keySchema: Table.PrimaryKeySchemaT<KEY>,
  keyAttributes: Table.PrimaryAttributeDefinitionsT<ATTRIBUTES>,
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

export function validateIndexes(index: IndexBase, names: Set<string>, onError: (msg: string) => void) {
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

export function validateTable<KEY, ATTRIBUTES>(table: Table<KEY, ATTRIBUTES>) {
  if (!table.name) table.onError(`Table must have a name`);
  validateKeyAttribute(table.keyAttributes, table.name, table.onError);
  const { pk, sk } = validateKeySchema(table.keySchema, table.keyAttributes, table.name, table.onError);
  const names = new Set<string>();
  table.globalIndexes?.forEach((index) => {
    validateIndexes(index, names, table.onError);
    const { name, keySchema } = index;
    const ikeys = validateKeySchema(keySchema, table.keyAttributes, name, table.onError);
    if (ikeys.pk === pk && ikeys.sk === sk)
      table.onError(`${name} has same partition key '${pk}' and sort key '${sk}' as table`);
  });
  table.localIndexes?.forEach((index) => {
    validateIndexes(index, names, table.onError);
    const { name, keySchema } = index;
    const ikeys = validateKeySchema(keySchema, table.keyAttributes, name, table.onError);
    if (ikeys.pk !== pk) table.onError(`${name} partition key '${ikeys.pk}' needs to be '${pk}'`);
    if (ikeys.sk === sk) table.onError(`${name} has same sort key '${sk}' as table`);
    if (ikeys.sk === undefined) table.onError(`${name} must have a sort key`);
  });
}
