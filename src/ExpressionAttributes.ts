import { ExpressionAttributeNameMap } from 'aws-sdk/clients/dynamodb';
import { Table } from './Table';

/**
 * Object used in Condition, KeyCondition and Update resolver methods to create attribute names and values
 * aliases and store the mappings for use in ExpressionAttributeNames and ExpressionAttributeValues params.
 *
 */
export class ExpressionAttributes {
  /**
   * RegEx that validates an attribute name would not need to use an alias.
   */
  static validAttributeNameRegEx = /^[A-Za-z][A-Za-z0-9]*$/;
  /**
   * Validates that an attribute name can be used without an alias.
   * @param name Name of an attribute
   * @returns true if the attribute name is valid.
   */
  static isValidAttributeName(name: string): boolean {
    return ExpressionAttributes.validAttributeNameRegEx.test(name);
  }

  /**
   * Property function to determine if the name is a reserved word and should use an alias.
   * For a current list of reserved words see dynamodb-reservedwords module in NPM.
   * The reason to set isReservedName and isValidName is to allow the attribute names to be directly
   * embeded into the expression string, which can make them easier to read.
   * * @default '() => false;' To use aliases for all attribute names.
   */
  isReservedName: (name: string) => boolean = () => false;
  /**
   * Property function to determine if the name is valid to use without an alias.
   * Can use ExpressionAttribute.isValidAttributeName.
   * WARNING: Must be used with a proper isReservedName function to ensure reserved words are not used
   * without an alias otherwise the operations will return an error.
   * @default '() => false;' To use aliases for all attribute names.
   */
  isValidName: (name: string) => boolean = () => false;
  /**
   * Parse all names into paths by using the pathDelmiter, to make working with nested attributes easy.
   * @default true Since most all names won't contain pathDelmiter then just do this by default.
   */
  treatNameAsPath = true;
  /**
   * Delimiter to use for paths
   * @default '.' Period is used in javascript for nested objects.
   */
  pathDelmiter = '.';
  /**
   * Attribute names mapping, used to populate the ExpressionAttributeNames param.
   */
  names: ExpressionAttributeNameMap = {};
  /**
   * Auto incrementing name id used in names mapping.
   */
  nextName = 0;
  /**
   * Attribute values mapping, used to populate the ExpressionAttributeValues param.
   */
  values: Table.AttributeValuesMap = {};
  /**
   * Auto incrementing valke id used in values mapping.
   */
  nextValue = 0;

  /**
   * Private method to add an attribute name to the names mapping if needed and hand back an alias to use in
   * an expression.
   * @param name Attribute name.
   * @returns Alias to use for the attribute name or the name if not aliasing is needed.
   */
  private addName(name: string): string {
    const names = this.names;
    if (this.isReservedName(name)) {
      const attName = `#${name}`;
      names[attName] = name;
      return attName;
    } else if (!this.isValidName(name)) {
      for (const key in names) {
        if (names[key] === name) return key;
      }
      const attName = `#n${this.nextName++}`;
      names[attName] = name;
      return attName;
    }
    return name;
  }

  /**
   * Parse an attribute path and adds the names to the names mapping as needed and hands back an alias to use
   * in an expression.  If the name already exists in the map the existing alias will be used.
   * @param name Attribute path that can be delimited by a pathDelmiter and contain array notations '[]'.
   * @returns Alias path to use for the attribute name or the name if not aliasing is needed.
   */
  addPath(name: string): string {
    // split '.' and '[]' then add each and append with '.'
    if (this.treatNameAsPath) {
      const pathList = name.split(this.pathDelmiter).reduce((prev, curr) => {
        if (curr.endsWith(']')) {
          const beginBracket = curr.indexOf('[');
          const listName = this.addName(curr.substring(0, beginBracket));
          prev.push(`${listName}${curr.substring(beginBracket)}`);
        } else {
          prev.push(this.addName(curr));
        }
        return prev;
      }, new Array<string>());
      return pathList.join(this.pathDelmiter);
    }
    return this.addName(name);
  }

  /**
   * Adds the value to the values map and hands back an alias to use in ab expression.
   * A new alias will always be created every time addValue is called.
   * @param value Value to add to the values map.
   * @returns Alias to use in place of the value.
   */
  addValue(value: Table.AttributeValues): string {
    const name = `:v${this.nextValue++}`;
    this.values[name] = value;
    return name;
  }

  /**
   * Gets the names map to assign to ExpressionAttributeNames.
   */
  getPaths(): ExpressionAttributeNameMap {
    return this.names;
  }
  /**
   * Gets the values map to assign to ExpressionAttributeValues.
   */
  getValues(): Table.AttributeValuesMap {
    return this.values;
  }

  /**
   * Resets the names and values map to use for a new expression.
   */
  reset(): void {
    this.names = {};
    this.nextName = 0;
    this.values = {};
    this.nextValue = 0;
  }

  /**
   * Helper method to set ExpressionAttributeNames and ExpressionAttributeValues values on the input argument.
   * @param params Input params used for DocumentClient put, delete, update, query and scan methods.
   * @returns The input params argument passed in.
   */
  addParams(params: {
    ExpressionAttributeNames?: ExpressionAttributeNameMap;
    ExpressionAttributeValues?: Table.AttributeValuesMap;
  }): {
    ExpressionAttributeNames?: ExpressionAttributeNameMap;
    ExpressionAttributeValues?: Table.AttributeValuesMap;
  } {
    if (Object.keys(this.names).length > 0) params.ExpressionAttributeNames = this.names;
    else delete params.ExpressionAttributeNames;
    if (Object.keys(this.values).length > 0) params.ExpressionAttributeValues = this.values;
    else delete params.ExpressionAttributeValues;
    return params;
  }
}
