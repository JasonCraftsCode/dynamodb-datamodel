import { AWSError, Request } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import * as yup from 'yup';
import * as joi from '@hapi/joi';

import { BinaryValue, StringSetValue, NumberSetValue, AttributeType, AttributeValueMap } from '../src/Common';
import { Model, Schema, ModelBase, ModelUpdateValue, ModelData, FieldCompositeSlot } from '../src/Model';
import {
  Update,
  UpdateInput,
  UpdateString,
  UpdateNumber,
  UpdateBoolean,
  UpdateBinary,
  UpdateStringSet,
  UpdateNumberSet,
  UpdateList,
  UpdateMap,
  UpdateExpression,
  UpdateMapValue,
} from '../src/Update';
import { TableBase, Table, IndexBase, Index } from '../src/Table';
import { ExpressionAttributes } from '../src/ExpressionAttributes';
import { delay } from './testCommon';

const client = new DocumentClient({ convertEmptyValues: true });
const request = (out: any) => {
  return {
    promise() {
      return delay(1, out);
    },
  } as Request<DocumentClient.GetItemOutput, AWSError>;
};

it('Validate Model exports', () => {
  expect(typeof Model).toBe('function');
});

interface TableKey {
  P: Table.StringPartitionKey;
  S?: Table.StringSortKey;
}

interface GSI0Key {
  G0P: Table.StringPartitionKey;
  G0S?: Table.StringSortKey;
}

interface LSI0Key {
  P: Table.StringPartitionKey;
  L0S?: Table.NumberSortKey;
}

interface TableAttributes extends TableKey, GSI0Key, LSI0Key {}

const gsi0 = new Index<GSI0Key>({
  name: 'GSI0',
  keySchema: {
    G0P: { keyType: 'HASH' },
    G0S: { keyType: 'RANGE' },
  },
  projection: { type: 'ALL' },
});

const lsi0 = new Index<LSI0Key>({
  name: 'LSI0',
  keySchema: {
    P: { keyType: 'HASH' },
    L0S: { keyType: 'RANGE' },
  },
  projection: { type: 'ALL' },
});

const table = new Table<TableKey, TableAttributes>({
  name: 'MainTable',
  keyAttributes: {
    P: { type: 'S' },
    S: { type: 'S' },
    G0P: { type: 'S' },
    G0S: { type: 'S' },
    L0S: { type: 'N' },
  },
  keySchema: {
    P: { keyType: 'HASH' },
    S: { keyType: 'RANGE' },
  },
  globalIndexes: [gsi0 as IndexBase],
  localIndexes: [lsi0 as IndexBase],
  client,
});

// Multiple fields get written to a single attribute, then usually that attribute is
// the sort key for a secondary index
// This means composite keys need some conversion between the model and table data
const location = Schema.namedComposite('G0S', {
  city: 0,
  state: 1,
  country: 2,
});

// Types to Test:
// x split
// x composite
// x string
// x number
// x boolean
// - ? null
// x binary
// x string set
// x number set
// - binary set
// x list
// x map
// x object
// x date
// - custom
// - ... (remainder) args

// Field methods:
// x alias
// - hidden
// - default
// - required
// - validation - regex, yup, joi, ajv
//   - validateAsync(value, options): value
// - coerce/convert - simple, yup, joi, ajv
//

interface ChildModel {
  name: string;
  age: number;
  adult: boolean;
}

const childSchema = {
  name: Schema.string(),
  age: Schema.number(),
  adult: Schema.boolean(),
};

interface SpouseModel {
  name: string;
  age: number;
  married: boolean;
}

const spouseSchema = {
  name: Schema.string(),
  age: Schema.number(),
  married: Schema.boolean(),
};

enum Role {
  Guest = 0,
  Member = 1,
  Leader = 2,
  Admin = 3,
}

interface GroupModel {
  role: Role;
}

const groupSchema = {
  role: Schema.number(),
};

interface UserKey {
  id: string;
}

interface UserModel extends UserKey {
  city?: string;
  state?: string;
  country?: string;
  name: string | UpdateString;
  count?: number | UpdateNumber;
  description?: string | UpdateString;
  revision: number | UpdateNumber;
  adult: boolean | UpdateBoolean;
  photo?: BinaryValue | UpdateBinary;
  interests?: StringSetValue | UpdateStringSet;
  modified?: NumberSetValue | UpdateNumberSet;
  spouse?: SpouseModel | UpdateMap;
  children?: ChildModel[] | UpdateList;
  groups?: { [key: string]: GroupModel } | UpdateMap;
  created?: Date | UpdateInput<'Date'>;
  hide?: Set<Date>;
  nickname?: string | UpdateString;
  rangeYup?: number | UpdateNumber;
  rangeJoi?: number | UpdateNumber;
}

const userSchema = {
  id: Schema.split(['P', 'S']),
  city: location.slots.city(),
  state: location.slots.state(),
  country: location.slots.country(),
  name: Schema.string(),
  count: Schema.number(),
  description: Schema.string('desc'),
  revision: Schema.number('rev'),
  adult: Schema.boolean(),
  photo: Schema.binary(),
  interests: Schema.stringSet(),
  modified: Schema.numberSet(),
  children: Schema.listT<ChildModel, 'Child'>('Child', childSchema),
  spouse: Schema.object<SpouseModel, 'Spouse'>('Spouse', spouseSchema),
  groups: Schema.mapT<GroupModel, 'Groups'>('Groups', groupSchema),
  created: Schema.date(),
  hide: Schema.hidden(),
  nickname: Schema.string().default('none'),
  rangeYup: Schema.number().yup(yup.number().integer().positive()),
  rangeJoi: Schema.number().joi(joi.number().integer().positive()),
};

const userModel = new Model<UserKey, UserModel>({
  schema: userSchema,
  table: table as TableBase,
});

describe('Validate Model with Table and Indexes', () => {
  describe('model params', () => {
    it('Model.createBinarySet with single id', async () => {
      const binarySet = userModel.createBinarySet([Buffer.from('abc'), Buffer.from('xyz')]);
      expect(binarySet.type).toEqual('Binary');
    });

    it('Model.getParams with single id', async () => {
      // TODO: should probably throw in SplitField
      const params = await userModel.getParams({ id: 'id1' });
      expect(params).toEqual({
        Key: {
          P: 'id1',
        },
        TableName: 'MainTable',
      });
    });

    it('Model.getParams with multiple id', async () => {
      // TODO: should probably throw in SplitField
      const params = await userModel.getParams({ id: 'id1.id2.id3.id4' });
      expect(params).toEqual({
        Key: {
          P: 'id1.id2.id3',
          S: 'id4',
        },
        TableName: 'MainTable',
      });
    });

    it('Model.getParams with single id', async () => {
      const params = await userModel.getParams({ id: 'id1.id2' });
      expect(params).toEqual({
        Key: {
          P: 'id1',
          S: 'id2',
        },
        TableName: 'MainTable',
      });
    });

    it('Model.deleteParams', async () => {
      const params = await userModel.deleteParams({ id: 'id1.id2' });
      expect(params).toEqual({
        Key: {
          P: 'id1',
          S: 'id2',
        },
        TableName: 'MainTable',
      });
    });

    it('Model.putParams with min fields', async () => {
      const params = await userModel.putParams({
        id: 'id1.id2',
        name: 'name1',
        revision: 1,
        adult: true,
      });
      expect(params).toEqual({
        Item: {
          P: 'id1',
          S: 'id2',
          name: 'name1',
          rev: 1,
          adult: true,
          nickname: 'none',
        },
        TableName: 'MainTable',
      });
    });

    it('Model.putParams with all fields', async () => {
      const params = await userModel.putParams({
        id: 'id1.id2',
        name: 'name1',
        revision: 1,
        adult: true,
        city: 'new york',
        state: 'new york',
        country: 'usa',
        description: 'user desription',
        count: 2,
        created: new Date(1585563302000),
        photo: Buffer.from('abcdefghijklmn'),
        spouse: { age: 40, married: true, name: 'spouse' },
        children: [
          {
            name: 'child1',
            age: 7,
            adult: false,
          },
          {
            name: 'child2',
            age: 10,
            adult: false,
          },
        ],
        modified: userModel.createNumberSet([1585553302, 1585563302]),
        interests: userModel.createStringSet(['basketball', 'soccer', 'football']),
        groups: { group1: { role: Role.Guest }, group3: { role: Role.Member } },
        hide: new Set([new Date(), new Date()]),
        rangeYup: 1,
        rangeJoi: 2,
      });
      expect(params).toEqual({
        Item: {
          G0S: 'new york.new york.usa',
          P: 'id1',
          S: 'id2',
          adult: true,
          children: [
            {
              name: 'child1',
              age: 7,
              adult: false,
            },
            {
              name: 'child2',
              age: 10,
              adult: false,
            },
          ],
          count: 2,
          created: 1585563302,
          desc: 'user desription',
          groups: {
            group1: {
              role: 0,
            },
            group3: {
              role: 1,
            },
          },
          interests: userModel.createStringSet(['basketball', 'soccer', 'football']),
          modified: userModel.createNumberSet([1585553302, 1585563302]),
          name: 'name1',
          nickname: 'none',
          photo: Buffer.from('abcdefghijklmn'),
          rev: 1,
          spouse: {
            age: 40,
            married: true,
            name: 'spouse',
          },
          rangeJoi: 2,
          rangeYup: 1,
        },
        TableName: 'MainTable',
      });
    });

    it('Model.updateParams min args', async () => {
      const params = await userModel.updateParams({
        id: 'id1.id2',
      });
      expect(params).toEqual({
        Key: {
          P: 'id1',
          S: 'id2',
        },
        TableName: 'MainTable',
      });
    });

    it('Model.updateParams with all fields', async () => {
      const params = await userModel.updateParams({
        id: 'id1.id2',
        name: Update.set('new name'),
        revision: Update.inc(1),
        city: 'kirkland',
        state: 'wa',
        country: 'usa',
        created: new Date(1585553302000),
        description: null,
        adult: Update.del(),
        count: Update.add('revision', 3),
        spouse: Update.map({
          age: Update.dec(1),
          married: Update.del(),
          name: 'new spouse',
        }),
        children: Update.prepend([{ name: 'child3', age: 3, adult: false }]),
        photo: Update.path('photo'),
        modified: Update.addToSet(userModel.createNumberSet([1585533302, 1585543302])),
        interests: Update.removeFromSet(userModel.createStringSet(['soccer', 'football'])),
        groups: Update.map({
          group1: Update.del(),
          'group3.role': Role.Leader,
          group4: { role: Role.Admin },
        }),
      });
      expect(params).toEqual({
        ExpressionAttributeNames: {
          '#n0': 'G0S',
          '#n1': 'name',
          '#n10': 'children',
          '#n11': 'spouse',
          '#n12': 'age',
          '#n13': 'married',
          '#n14': 'groups',
          '#n15': 'group1',
          '#n16': 'group3',
          '#n17': 'role',
          '#n18': 'group4',
          '#n19': 'created',
          '#n2': 'count',
          '#n3': 'revision',
          '#n4': 'desc',
          '#n5': 'rev',
          '#n6': 'adult',
          '#n7': 'photo',
          '#n8': 'interests',
          '#n9': 'modified',
        },
        ExpressionAttributeValues: {
          ':v0': 'kirkland.wa.usa',
          ':v1': 'new name',
          ':v10': {
            role: 3,
          },
          ':v11': 1585553302,
          ':v2': 3,
          ':v3': 1,
          ':v4': userModel.createStringSet(['soccer', 'football']),
          ':v5': userModel.createNumberSet([1585533302, 1585543302]),
          ':v6': [
            {
              adult: false,
              age: 3,
              name: 'child3',
            },
          ],
          ':v7': 1,
          ':v8': 'new spouse',
          ':v9': 2,
        },
        Key: {
          P: 'id1',
          S: 'id2',
        },
        TableName: 'MainTable',
        UpdateExpression:
          'SET #n0 = :v0, #n1 = :v1, #n2 = #n3 + :v2, #n5 = #n5 + :v3, #n7 = #n7, #n10 = list_append(:v6, #n10), #n11.#n12 = #n11.#n12 - :v7, #n11.#n1 = :v8, #n14.#n16.#n17 = :v9, #n14.#n18 = :v10, #n19 = :v11 REMOVE #n4, #n6, #n11.#n13, #n14.#n15 ADD #n9 :v5 DELETE #n8 :v4',
      });
    });
  });

  describe('model actions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('Model.get with single id', async () => {
      client.get = jest.fn((params) => request({ Item: { P: 'id1' } }));
      // TODO: should probably throw in SplitField
      const results = await userModel.get({ id: 'id1' });
      expect(results).toEqual({ id: 'id1' });
      expect(client.get).toBeCalledWith({
        Key: { P: 'id1' },
        TableName: 'MainTable',
      });
      expect(client.get).toBeCalledTimes(1);
    });

    it('Model.get no Item expect results undefined ', async () => {
      client.get = jest.fn((params) => request({}));
      const results = await userModel.get({ id: 'id1' });
      expect(results).toBeUndefined();
    });

    it('Model.get with multiple id', async () => {
      client.get = jest.fn((params) => request({ Item: { P: 'id1.id2.id3', S: 'id4' } }));
      const results = await userModel.get({ id: 'id1.id2.id3.id4' });
      expect(results).toEqual({ id: 'id1.id2.id3.id4' });
      expect(client.get).toBeCalledWith({
        Key: { P: 'id1.id2.id3', S: 'id4' },
        TableName: 'MainTable',
      });
      expect(client.get).toBeCalledTimes(1);
    });

    it('Model.get with single id', async () => {
      client.get = jest.fn((params) => request({ Item: { P: 'id1', S: 'id2' } }));
      const results = await userModel.get({ id: 'id1.id2' });
      expect(results).toEqual({ id: 'id1.id2' });
      expect(client.get).toBeCalledWith({
        Key: {
          P: 'id1',
          S: 'id2',
        },
        TableName: 'MainTable',
      });
      expect(client.get).toBeCalledTimes(1);
    });

    it('Model.get with full data', async () => {
      client.get = jest.fn((params) =>
        request({
          Item: {
            G0S: 'new york.new york.usa',
            P: 'id1',
            S: 'id2',
            adult: true,
            children: [
              {
                name: 'child1',
                age: 7,
                adult: false,
              },
              {
                name: 'child2',
                age: 10,
                adult: false,
              },
            ],
            count: 2,
            created: 1585563302,
            desc: 'user desription',
            groups: {
              group1: {
                role: 0,
              },
              group3: {
                role: 1,
              },
            },
            interests: userModel.createStringSet(['basketball', 'soccer', 'football']),
            modified: userModel.createNumberSet([1585553302, 1585563302]),
            name: 'name1',
            photo: Buffer.from('abcdefghijklmn'),
            rev: 1,
            spouse: {
              age: 40,
              married: true,
              name: 'spouse',
            },
          },
        }),
      );
      const results = await userModel.get({ id: 'id1.id2' });
      expect(results).toEqual({
        adult: true,
        children: [
          {
            adult: false,
            age: 7,
            name: 'child1',
          },
          {
            adult: false,
            age: 10,
            name: 'child2',
          },
        ],
        city: 'new york',
        count: 2,
        country: 'usa',
        created: new Date('2020-03-30T10:15:02.000Z'),
        description: 'user desription',
        groups: {
          group1: {
            role: 0,
          },
          group3: {
            role: 1,
          },
        },
        id: 'id1.id2',
        interests: userModel.createStringSet(['basketball', 'soccer', 'football']),
        modified: userModel.createNumberSet([1585553302, 1585563302]),
        name: 'name1',
        photo: Buffer.from('abcdefghijklmn'),
        revision: 1,
        spouse: {
          age: 40,
          married: true,
          name: 'spouse',
        },
        state: 'new york',
      });
      expect(client.get).toBeCalledWith({
        Key: {
          P: 'id1',
          S: 'id2',
        },
        TableName: 'MainTable',
      });
      expect(client.get).toBeCalledTimes(1);
    });

    it('Model.delete', async () => {
      client.delete = jest.fn((params) => request({ Attributes: { P: 'id1', S: 'id2' } }));
      const results = await userModel.delete({ id: 'id1.id2' });
      expect(results).toEqual({ id: 'id1.id2' });
      expect(client.delete).toBeCalledWith({
        Key: { P: 'id1', S: 'id2' },
        TableName: 'MainTable',
      });
      expect(client.delete).toBeCalledTimes(1);
    });

    it('Model.delete Attributes missing expect results undefined', async () => {
      client.delete = jest.fn((params) => request({}));
      const results = await userModel.delete({ id: 'id1.id2' });
      expect(results).toBeUndefined();
    });

    it('Model.put', async () => {
      client.put = jest.fn((params) => request({ Attributes: { P: 'id1', S: 'id2' } }));
      const results = await userModel.put({
        id: 'id1.id2',
        name: 'name1',
        revision: 1,
        adult: true,
      });
      expect(results).toEqual({
        adult: true,
        id: 'id1.id2',
        name: 'name1',
        nickname: 'none',
        revision: 1,
      });
      expect(client.put).toBeCalledWith({
        Item: {
          adult: true,
          P: 'id1',
          S: 'id2',
          name: 'name1',
          nickname: 'none',
          rev: 1,
        },
        TableName: 'MainTable',
      });
      expect(client.put).toBeCalledTimes(1);
    });

    it('Model.update min args', async () => {
      client.update = jest.fn((params) => request({ Attributes: { P: 'id1', S: 'id2' } }));
      const results = await userModel.update({
        id: 'id1.id2',
      });
      expect(results).toEqual({ id: 'id1.id2' });
      expect(client.update).toBeCalledWith({
        Key: {
          P: 'id1',
          S: 'id2',
        },
        TableName: 'MainTable',
      });
      expect(client.update).toBeCalledTimes(1);
    });

    it('Model.update Attributes missing expect results undefined', async () => {
      client.update = jest.fn((params) => request({}));
      const results = await userModel.update({
        id: 'id1.id2',
      });
      expect(results).toBeUndefined();
    });

    it('Model.update with all fields', async () => {
      client.update = jest.fn((params) =>
        request({
          Attributes: {
            P: 'id1',
            S: 'id2',
            rev: 2,
            G0S: 'hudson.wi.usa',
            created: 1585553202,
          },
        }),
      );
      const results = await userModel.update({
        id: 'id1.id2',
        name: 'new name',
        revision: Update.inc(1),
        city: 'kirkland',
        state: 'wa',
        country: 'usa',
        created: new Date(1585553302000),
      });
      expect(results).toEqual({
        id: 'id1.id2',
        revision: 2,
        city: 'hudson',
        state: 'wi',
        country: 'usa',
        created: new Date(1585553202000),
      });
      expect(client.update).toBeCalledWith({
        ExpressionAttributeNames: {
          '#n0': 'G0S',
          '#n1': 'name',
          '#n2': 'rev',
          '#n3': 'created',
        },
        ExpressionAttributeValues: {
          ':v0': 'kirkland.wa.usa',
          ':v1': 'new name',
          ':v2': 1,
          ':v3': 1585553302,
        },
        Key: {
          P: 'id1',
          S: 'id2',
        },
        TableName: 'MainTable',
        UpdateExpression: 'SET #n0 = :v0, #n1 = :v1, #n2 = #n2 + :v2, #n3 = :v3',
      });
      expect(client.update).toBeCalledTimes(1);
    });
  });
});

describe('When FieldBase', () => {
  it('expect init sets name', () => {
    const initField = Schema.string();
    initField.init('initField');
    expect(initField.name).toEqual('initField');
  });

  it('yup expect validate invalid value to throw', async () => {
    const field = Schema.number().yup(yup.number().min(1).max(2));
    await expect(field.validate(0)).rejects.toThrowError(new Error('this must be greater than or equal to 1'));
  });

  it('yup with coerce expect return value coerce', async () => {
    const field = Schema.number().coerce().yup(yup.number().min(1).max(10));
    await expect(field.validate('5' as any)).resolves.toEqual(5);
  });

  it('joi expect validate invalid value to throw', async () => {
    const field = Schema.number().joi(joi.number().min(1).max(2));
    await expect(field.validate(0)).rejects.toThrowError(new Error('"value" must be larger than or equal to 1'));
  });

  it('joi with coerce expect return value coerce', async () => {
    const field = Schema.number().joi(joi.number().min(1).max(10)).coerce();
    await expect(field.validate('5' as any)).resolves.toEqual(5);
  });

  it('regex expect validate invalid value to throw', async () => {
    const field = Schema.string().regex(/^[A-Za-z][A-Za-z0-9]*$/);
    await expect(field.validate('0f')).rejects.toThrowError(
      new Error("value must match regex: '/^[A-Za-z][A-Za-z0-9]*$/'"),
    );
  });

  it('regex expect validate to return value', async () => {
    const field = Schema.string().regex(/^[A-Za-z][A-Za-z0-9]*$/);
    await expect(field.validate('ff')).resolves.toEqual('ff');
  });

  it('validator always throw expect to throw', async () => {
    const field = Schema.string().validator((value: string) => {
      return new Promise<string | void>((resolve, reject) => {
        reject(new Error(`always throw`));
      });
    });
    await expect(field.validate('abc')).rejects.toThrowError(new Error('always throw'));
  });

  it('updateValidator with does not throw expect success', async () => {
    const field = Schema.string().updateValidator((value: ModelUpdateValue<string>) => {
      return new Promise<string | void>((resolve, reject) => {
        resolve('abc');
      });
    });
    await expect(field.validateUpdate('abc')).resolves.toEqual('abc');
  });

  it('updateValidator always throw expect to throw', async () => {
    const field = Schema.string().updateValidator((value: any) => {
      return new Promise<void>((resolve, reject) => {
        reject(new Error(`always throw`));
      });
    });
    await expect(field.validateUpdate('abc')).rejects.toThrowError(new Error('always throw'));
  });

  it('coerce expects to be set', () => {
    const field = Schema.string().coerce();
    expect(field._coerce).toEqual(true);
  });

  it('hidden expects to be set', () => {
    const field = Schema.string().hidden();
    expect(field._hidden).toEqual(true);
  });

  it('required expects to be set', () => {
    const field = Schema.string().required();
    expect(field._required).toEqual(true);
  });

  it('default expects to be set', () => {
    const field = Schema.string().default('default');
    expect(field._default).toEqual('default');
  });

  it('alias expects to be set', () => {
    const field = Schema.string().alias('alias');
    expect(field._alias).toEqual('alias');
  });

  it('constructor with alias expects alias to be set', () => {
    const field = Schema.string('alias');
    expect(field._alias).toEqual('alias');
  });

  // toTablw
  it('toTable with hidden field expect not in table data', async () => {
    const field = Schema.number().hidden();
    const tabelData: AttributeValueMap = {};
    await field.toTable('test', { test: '5' }, tabelData, {} as ModelBase);
    expect(tabelData).toEqual({});
  });

  it('toTable with coerce validator expect coerce value', async () => {
    const field = Schema.number().coerce().yup(yup.number().min(1).max(10));
    const tabelData: AttributeValueMap = {};
    await field.toTable('test', { test: '5' }, tabelData, {} as ModelBase);
    expect(tabelData).toEqual({ test: 5 });
  });

  it('toTable with coerce expect coerce value', async () => {
    const field = Schema.number().coerce();
    const tabelData: AttributeValueMap = {};
    await field.toTable('test', { test: 8 }, tabelData, {} as ModelBase);
    expect(tabelData).toEqual({ test: 8 });
  });

  // toTableUpdate
  it('toTableUpdate with hidden field expect not in table data', async () => {
    const field = Schema.number().hidden();
    const tabelData: AttributeValueMap = {};
    await field.toTableUpdate('test', { test: '5' }, tabelData, {} as ModelBase);
    expect(tabelData).toEqual({});
  });

  it('toTableUpdate with coerce validator expect coerce value', async () => {
    const field = Schema.number()
      .coerce()
      .updateValidator((value: ModelUpdateValue<number>) => {
        return new Promise<number | void>((resolve, reject) => {
          resolve(15);
        });
      });
    field.init('test');
    const tabelData: UpdateMapValue = {};
    await field.toTableUpdate('test', { test: '5' }, tabelData, {} as ModelBase);
    expect(tabelData).toEqual({ test: 15 });
  });

  it('toTableUpdate with coerce validator and undefine keep value', async () => {
    const field = Schema.number()
      .coerce()
      .updateValidator((value: ModelUpdateValue<number>) => {
        return new Promise<number | void>((resolve, reject) => {
          resolve();
        });
      });
    field.init('test');
    const tabelData: UpdateMapValue = {};
    await field.toTableUpdate('test', { test: '5' }, tabelData, {} as ModelBase);
    expect(tabelData).toEqual({ test: '5' });
  });

  it('toTableUpdate with coerce expect coerce value', async () => {
    const field = Schema.number().coerce();
    const tabelData: AttributeValueMap = {};
    await field.toTableUpdate('test', { test: 9 }, tabelData, {} as ModelBase);
    expect(tabelData).toEqual({ test: 9 });
  });

  // toTable
  it('required field missing from model expect toTable to throw', async () => {
    const field = Schema.string().required();
    field.init('test');
    await expect(field.toTable('test', {}, {}, {} as ModelBase)).rejects.toThrowError(
      new Error('Field test is required'),
    );
  });

  it('toTable with default expects default return', async () => {
    const field = Schema.string().default('default');
    const tabelData: AttributeValueMap = {};
    await field.toTable('test', {}, tabelData, {} as ModelBase);
    expect(tabelData).toEqual({ test: 'default' });
  });

  it('toTable with default function expects default return', async () => {
    const field = Schema.string().default((name, tableData, modelData, model) => {
      return name + '-default';
    });
    const tabelData: AttributeValueMap = {};
    await field.toTable('test', {}, tabelData, {} as ModelBase);
    expect(tabelData).toEqual({ test: 'test-default' });
  });
});

describe('When FieldExpression', () => {
  const field = Schema.string();
  field.init('string');

  // Condition
  it('expect path returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.path()(exp)).toEqual('#n0');
  });

  it('expect eq returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.eq('xyz').buildExpression(exp)).toEqual('#n0 = :v0');
  });

  it('expect ne returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.ne('xyz').buildExpression(exp)).toEqual('#n0 <> :v0');
  });

  it('expect lt returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.lt('xyz').buildExpression(exp)).toEqual('#n0 < :v0');
  });

  it('expect le returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.le('xyz').buildExpression(exp)).toEqual('#n0 <= :v0');
  });

  it('expect gt returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.gt('xyz').buildExpression(exp)).toEqual('#n0 > :v0');
  });

  it('expect ge returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.ge('xyz').buildExpression(exp)).toEqual('#n0 >= :v0');
  });

  it('expect between returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.between('a', 'z').buildExpression(exp)).toEqual('#n0 BETWEEN :v0 AND :v1');
  });

  it('expect in returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.in(['a', 'z']).buildExpression(exp)).toEqual('#n0 IN (:v0, :v1)');
  });

  it('expect typeOf returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.typeOf(AttributeType.String).buildExpression(exp)).toEqual('attribute_type(#n0, :v0)');
  });

  it('expect exists returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.exists().buildExpression(exp)).toEqual('attribute_exists(#n0)');
  });

  it('expect notExists returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.notExists().buildExpression(exp)).toEqual('attribute_not_exists(#n0)');
  });

  // Update
  it('expect getPath returns update expression', () => {
    const exp = new UpdateExpression();
    expect(field.getPath('path')('string', exp)).toEqual('#n0');
  });

  it('expect getPath with default returns update expression', () => {
    const exp = new UpdateExpression();
    expect(field.getPath('path', 'default')('string', exp)).toEqual('if_not_exists(#n0, :v0)');
  });

  it('expect del with default returns update expression', () => {
    const exp = new UpdateExpression();
    field.del()('string', exp);
    expect(exp.buildExpression()).toEqual('REMOVE string');
  });

  it('expect set returns update expression', () => {
    const exp = new UpdateExpression();
    field.set('setString')('string', exp);
    expect(exp.buildExpression()).toEqual('SET string = :v0');
  });

  it('expect setDefault returns update expression', () => {
    const exp = new UpdateExpression();
    field.setDefault('setString')('string', exp);
    expect(exp.buildExpression()).toEqual('SET string = if_not_exists(string, :v0)');
  });
});

describe('When FieldString', () => {
  const field = Schema.string();
  field.init('string');

  it('expect size returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.size()(exp)).toEqual('size(#n0)');
  });

  it('expect contains returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.contains('xyz').buildExpression(exp)).toEqual('contains(#n0, :v0)');
  });

  it('expect beginsWith returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.beginsWith('xyz').buildExpression(exp)).toEqual('begins_with(#n0, :v0)');
  });
});

describe('When FieldNumber', () => {
  const field = Schema.number();
  field.init('number');

  it('expect inc returns update expression', () => {
    const exp = new UpdateExpression();
    field.inc(1)('number', exp);
    expect(exp.buildExpression()).toEqual('SET number = number + :v0');
  });

  it('expect dec returns update expression', () => {
    const exp = new UpdateExpression();
    field.dec(1)('number', exp);
    expect(exp.buildExpression()).toEqual('SET number = number - :v0');
  });

  it('expect add returns update expression', () => {
    const exp = new UpdateExpression();
    field.add('number2', 1)('number', exp);
    expect(exp.buildExpression()).toEqual('SET number = #n0 + :v0');
  });

  it('expect sub returns update expression', () => {
    const exp = new UpdateExpression();
    field.sub('number2', 1)('number', exp);
    expect(exp.buildExpression()).toEqual('SET number = #n0 - :v0');
  });
});

describe('When FieldBinary', () => {
  const field = Schema.binary();
  field.init('binary');

  it('expect size returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.size()(exp)).toEqual('size(#n0)');
  });
});

describe('When FieldBoolean', () => {
  const field = Schema.boolean();
  field.init('boolean');

  it('expect boolean returns correct type', () => {
    expect(field.type).toEqual('BOOL');
    expect(field.name).toEqual('boolean');
  });
});

describe('When FieldSet', () => {
  const field = Schema.stringSet();
  field.init('set');

  it('expect stringSet returns correct type', () => {
    expect(field.type).toEqual('SS');
    expect(field.name).toEqual('set');
  });

  it('expect numberSet returns correct type', () => {
    const field1 = Schema.numberSet();
    expect(field1.type).toEqual('NS');
  });

  it('expect binarySet returns correct type', () => {
    const field1 = Schema.binarySet();
    expect(field1.type).toEqual('BS');
  });

  it('expect size returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.size()(exp)).toEqual('size(#n0)');
  });

  it('expect contains returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.contains('xyz').buildExpression(exp)).toEqual('contains(#n0, :v0)');
  });

  it('expect add returns update expression', () => {
    const exp = new UpdateExpression();
    field.add(userModel.createStringSet(['abc', 'dev']))('set', exp);
    expect(exp.buildExpression()).toEqual('ADD set :v0');
  });

  it('expect remove returns update expression', () => {
    const exp = new UpdateExpression();
    field.remove(userModel.createStringSet(['abc', 'dev']))('set', exp);
    expect(exp.buildExpression()).toEqual('DELETE set :v0');
  });
});

describe('When FieldList', () => {
  const field = Schema.list();
  field.init('list');
  it('expect size returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.size()(exp)).toEqual('size(#n0)');
  });
});

describe('When FieldListT', () => {
  const field = Schema.listT<ChildModel, 'Child'>('Child', childSchema);
  field.init('children');
  it('expect size returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.size()(exp)).toEqual('size(#n0)');
  });

  it('expect append returns update expression', () => {
    const exp = new UpdateExpression();
    field.append([{ name: 'child1', adult: false, age: 5 }])('children', exp);
    expect(exp.buildExpression()).toEqual('SET children = list_append(children, :v0)');
  });

  it('expect prepend returns update expression', () => {
    const exp = new UpdateExpression();
    field.prepend([{ name: 'child1', adult: false, age: 5 }])('children', exp);
    expect(exp.buildExpression()).toEqual('SET children = list_append(:v0, children)');
  });

  it('expect join returns update expression', () => {
    const exp = new UpdateExpression();
    field.join('stepchildren', [{ name: 'child1', adult: false, age: 5 }])('children', exp);
    expect(exp.buildExpression()).toEqual('SET children = list_append(#n0, :v0)');
  });

  it('expect delIndexes returns update expression', () => {
    const exp = new UpdateExpression();
    field.delIndexes([0, 1])('children', exp);
    expect(exp.buildExpression()).toEqual('REMOVE children[0], children[1]');
  });

  it('expect setIndexes returns update expression', () => {
    const exp = new UpdateExpression();
    field.setIndexes({ 0: { name: '0child', adult: false, age: 5 } })('children', exp);
    expect(exp.buildExpression()).toEqual('SET children[0] = :v0');
  });
});

describe('When FieldMap', () => {
  const field = Schema.map();
  field.init('map');

  it('expect size returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.size()(exp)).toEqual('size(#n0)');
  });

  it('expect map returns update expression', () => {
    const exp = new UpdateExpression();
    field.map({ map: { abc: 'yea', xyz: 'boo' } })('map', exp);
    expect(exp.buildExpression()).toEqual('SET map.#n0 = :v0');
  });
});

describe('When FieldMapT', () => {
  const field = Schema.mapT<GroupModel, 'Groups'>('Groups', groupSchema);
  field.init('groups');
  it('expect size returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.size()(exp)).toEqual('size(#n0)');
  });

  it('expect map returns update expression', () => {
    const exp = new UpdateExpression();
    field.map({ group1: { role: Role.Admin } })('groups', exp);
    expect(exp.buildExpression()).toEqual('SET groups.#n0 = :v0');
  });
});

describe('When FieldObject', () => {
  const field = Schema.object<SpouseModel, 'Spouse'>('Spouse', spouseSchema);
  field.init('spouse');

  it('expect size returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.size()(exp)).toEqual('size(#n0)');
  });

  it('expect map returns update expression', () => {
    const exp = new UpdateExpression();
    field.map({ name: 'abc' })('spouse', exp);
    expect(exp.buildExpression()).toEqual('SET spouse.#n0 = :v0');
  });
});

// FieldDate inherits from FieldBase
describe('When FieldDate', () => {
  const field = Schema.date();
  field.init('date');

  it('expect date returns correct type', () => {
    expect(field.type).toEqual('DATE');
    expect(field.name).toEqual('date');
  });

  it('toModel expect date data', async () => {
    const data: ModelData = {};
    await field.toModel('date', { date: 1585564302000 }, data, {} as ModelBase);
    expect(data).toEqual({ date: new Date(1585564302000000) });
  });

  it('toTable expect date as number', async () => {
    const data: AttributeValueMap = {};
    await field.toTable('date', { date: new Date(1585574302000000) }, data, {} as ModelBase);
    expect(data).toEqual({ date: 1585574302000 });
  });

  it('toTableUpdate expect date as number', async () => {
    const data: AttributeValueMap = {};
    await field.toTableUpdate('date', { date: new Date(1585584302000000) }, data, {} as ModelBase);
    expect(data).toEqual({ date: 1585584302000 });
  });
});

describe('When FieldHidden', () => {
  const field = Schema.hidden();
  it('expect hidden returns correct type', () => {
    expect(field._alias).toBeUndefined();
    expect(field.type).toEqual('HIDDEN');
    expect(field._hidden).toEqual(true);
  });
});

describe('When FieldComposite', () => {
  const field = Schema.composite('G0S', 3);

  it('expect composite with delim returns correct type', () => {
    const delim = Schema.composite('L0S', 2, '#');
    expect(delim.alias).toEqual('L0S');
    expect(delim.count).toEqual(2);
    expect(delim.delim).toEqual('#');
  });

  it('expect composite returns correct type', () => {
    expect(field.alias).toEqual('G0S');
    expect(field.count).toEqual(3);
    expect(field.delim).toEqual('.');
  });

  it('expect slot to return FieldCompositeSlot', () => {
    const slot = field.slot(1);
    expect(slot.slot).toEqual(1);
    expect(slot.name).toBeUndefined();
    expect(slot.composite).toBe(field);
  });

  it('slot.toModel expect existing slot to map', async () => {
    const slot = field.slot(1);
    const data: ModelData = {};
    await slot.toModel('split', { G0S: 'part1.part2.part3' }, data, {} as ModelBase);
    expect(data).toEqual({ split: 'part2' });
  });

  it('slot.toModel expect missing slot to skip', async () => {
    const slot = field.slot(2);
    const data: ModelData = {};
    await slot.toModel('split', { G0S: 'part1.part2' }, data, {} as ModelBase);
    expect(data).toEqual({});
  });

  it('slot.toTable expect fields to map to key', async () => {
    const slot2 = field.slot(2);
    const slot1 = field.slot(1);
    const data: AttributeValueMap = {};
    await slot2.toTable('split2', { split2: 'part2' }, data, {} as ModelBase);
    expect(data).toEqual({ G0S: '..part2' });
    await slot1.toTable('split1', { split1: 'part1' }, data, {} as ModelBase);
    expect(data).toEqual({ G0S: '.part1.part2' });
  });

  it('slot.toTable missing slot expect empty data', async () => {
    const slot = field.slot(1);
    const data: AttributeValueMap = {};
    await slot.toTable('split', { split1: 'part1' }, data, {} as ModelBase);
    expect(data).toEqual({});
  });

  it('slot.toTable slot is function expect empty data', async () => {
    const slot = field.slot(1);
    const data: AttributeValueMap = {};
    await slot.toTable('split', { split: () => 'value' }, data, {} as ModelBase);
    expect(data).toEqual({});
  });

  it('slot.toTableUpdate expect fields to map to key', async () => {
    const slot = field.slot(1);
    const data: AttributeValueMap = {};
    await slot.toTableUpdate('split', { split: 'part1' }, data, {} as ModelBase);
    expect(data).toEqual({ G0S: '.part1.' });
  });
});

describe('When FieldNamedComposite', () => {
  const field = Schema.namedComposite('G0S', {
    city: 0,
    state: 1,
    country: 2,
  });

  it('expect constructed with slots', () => {
    const field1 = Schema.namedComposite(
      'L0S',
      { dollar: 0, cents: 1 },
      {
        dollar: () => new FieldCompositeSlot(field, 0, 'dollar1'),
        cents: () => new FieldCompositeSlot(field, 1, 'cents1'),
      },
      '#',
    );
    expect(field1.alias).toEqual('L0S');
    expect(field1.count).toEqual(2);
    expect(field1.delim).toEqual('#');
    expect(field1.map).toEqual({ dollar: 0, cents: 1 });
    expect(Object.keys(field1.slots).length).toEqual(2);
    expect(field1.slots.dollar().name).toEqual('dollar1');
  });

  it('expect correctly constructed', () => {
    expect(field.alias).toEqual('G0S');
    expect(field.count).toEqual(3);
    expect(field.delim).toEqual('.');
    expect(field.map).toEqual({
      city: 0,
      state: 1,
      country: 2,
    });
    expect(Object.keys(field.slots).length).toEqual(3);
  });

  it('expect city slot return correct FieldCompositeSlot', () => {
    const slot = field.slot('city');
    expect(slot.name).toEqual('city');
    expect(slot.slot).toEqual(0);
  });

  it('expect 1 slot return state FieldCompositeSlot', () => {
    const slot = field.slot(1);
    expect(slot.name).toEqual('state');
    expect(slot.slot).toEqual(1);
  });

  it('expect country slot return correct FieldCompositeSlot', () => {
    const slot = field.slots.country();
    expect(slot.name).toEqual('country');
    expect(slot.slot).toEqual(2);
  });
});

describe('When FieldSplit', () => {
  const field = Schema.split(['P', 'S']);
  field.init('split');

  it('expect init correctly', () => {
    expect(field.aliases).toEqual(['P', 'S']);
    expect(field.delim).toEqual('.');
    expect(field.name).toEqual('split');
  });

  it('toModel expect join of all aliases', async () => {
    const data: ModelData = {};
    await field.toModel('split', { P: 'id1', S: 'id2' }, data, {} as ModelBase);
    expect(data).toEqual({ split: 'id1.id2' });
  });

  it('toModel expect join of single aliases', async () => {
    const data: ModelData = {};
    await field.toModel('split', { P: 'id1' }, data, {} as ModelBase);
    expect(data).toEqual({ split: 'id1' });
  });

  it('toModel expect join of first aliases', async () => {
    const data: ModelData = {};
    await field.toModel('split', { S: 'id2' }, data, {} as ModelBase);
    expect(data).toEqual({ split: 'id2' });
  });

  it('toTable expect split of all aliases', async () => {
    const data: AttributeValueMap = {};
    await field.toTable('split', { split: 'id1.id2' }, data, {} as ModelBase);
    expect(data).toEqual({ P: 'id1', S: 'id2' });
  });

  it('toTable expect split of more then number of aliases', async () => {
    const data: AttributeValueMap = {};
    await field.toTable('split', { split: 'id1.id2.id3.id4' }, data, {} as ModelBase);
    expect(data).toEqual({ P: 'id1.id2.id3', S: 'id4' });
  });

  it('toTable expect join of first aliases', async () => {
    const data: AttributeValueMap = {};
    await field.toTable('split', { split: 'id1' }, data, {} as ModelBase);
    expect(data).toEqual({ P: 'id1' });
  });

  it('toTable missing field expect empty data', async () => {
    const data: AttributeValueMap = {};
    await field.toTable('split', { split1: 'id1' }, data, {} as ModelBase);
    expect(data).toEqual({});
  });

  it('toTable not a string field expect empty data', async () => {
    const data: AttributeValueMap = {};
    await field.toTable('split', { split: 5.2 }, data, {} as ModelBase);
    expect(data).toEqual({});
  });

  it('toTableUpdate expect join of all aliases', async () => {
    const data: UpdateMapValue = {};
    await field.toTableUpdate('split', { split: 'id1.id2' }, data, {} as ModelBase);
    expect(data).toEqual({ P: 'id1', S: 'id2' });
  });

  it('toTableUpdate expect join of first aliases', async () => {
    const data: AttributeValueMap = {};
    await field.toTableUpdate('split', { split: 'id1' }, data, {} as ModelBase);
    expect(data).toEqual({ P: 'id1' });
  });
});

// 172-187,407,466,473,496,541-542,737-767
