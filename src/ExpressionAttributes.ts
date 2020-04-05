import { ExpressionAttributeNameMap } from 'aws-sdk/clients/dynamodb';

import { AttributeValue, AttributeValueMap } from './Common';

export const validAttributeNameRegEx = /^[A-Za-z][A-Za-z0-9]*$/;
export function isValidAttributeName(name: string) {
  return validAttributeNameRegEx.test(name);
}

export class ExpressionAttributes {
  isReservedName: (name: string) => boolean = () => false;
  isValidName: (name: string) => boolean = () => false;
  treatNameAsPath: boolean = true;
  names: ExpressionAttributeNameMap = {};
  nextName: number = 0;
  values: AttributeValueMap = {};
  nextValue: number = 0;

  private addName(name: string) {
    const names = this.names;
    if (this.isReservedName(name)) {
      const attName = `#${name}`;
      names[attName] = name;
      return attName;
    } else if (!this.isValidName(name)) {
      for (const key in names) {
        if (names[key] === name) {
          return key;
        }
      }
      const attName = `#n${this.nextName++}`;
      names[attName] = name;
      return attName;
    }
    return name;
  }

  addPath(name: string) {
    // split '.' and '[]' then add each and append with '.'
    if (this.treatNameAsPath) {
      const pathList = name.split('.').reduce((prev, curr) => {
        if (curr.endsWith(']')) {
          const beginBracket = curr.indexOf('[');
          const listName = this.addName(curr.substring(0, beginBracket));
          prev.push(`${listName}${curr.substring(beginBracket)}`);
        } else {
          prev.push(this.addName(curr));
        }
        return prev;
      }, new Array<string>());
      return pathList.join('.');
    }
    return this.addName(name);
  }

  addValue(value: AttributeValue) {
    const name = `:v${this.nextValue++}`;
    this.values[name] = value;
    return name;
  }

  getPaths() {
    return this.names;
  }
  getValues() {
    return this.values;
  }

  reset() {
    this.names = {};
    this.nextName = 0;
    this.values = {};
    this.nextValue = 0;
  }
}
