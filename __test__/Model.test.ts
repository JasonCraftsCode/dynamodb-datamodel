import { AWSError, Request } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import * as yup from 'yup';

import { BinaryValue, StringSetValue, NumberSetValue, AttributeType } from '../src/Common';
import { Model, Schema } from '../src/Model';
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
  range?: number | UpdateNumber;
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
  range: Schema.number().yup(yup.number().integer().positive()),
};

const userModel = new Model<UserKey, UserModel>({
  schema: userSchema,
  table: table as TableBase,
});

describe('Validate Model with Table and Indexes', () => {
  describe('model params', () => {
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
        //range: -1,
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

// 6-408,458,508-509,563-571,576,581,586,591,596,601-631,638-644,651-660

describe('When FieldExpression', () => {
  const field = Schema.string();
  field.init('string');

  it('expect path returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.path()(exp)).toEqual('#n0');
  });

  it('expect size returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.size()(exp)).toEqual('size(#n0)');
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

describe('When FieldSet', () => {
  const field = Schema.stringSet();
  field.init('set');

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

describe('When FieldBinary', () => {
  const field = Schema.binary();
  field.init('binary');

  it('expect size returns condition expression', () => {
    const exp = new ExpressionAttributes();
    expect(field.size()(exp)).toEqual('size(#n0)');
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

describe('When Schema', () => {
  it('expect map returns correct type', () => {
    const field = Schema.map();
    expect(field.type).toEqual('M');
  });

  it('expect list returns correct type', () => {
    const field = Schema.list();
    expect(field.type).toEqual('L');
  });

  it('expect binarySet returns correct type', () => {
    const field = Schema.binarySet();
    expect(field.type).toEqual('BS');
  });

  it('expect composite returns correct type', () => {
    const field = Schema.composite('G0S', 3);
    expect(field.alias).toEqual('G0S');
    expect(field.count).toEqual(3);
    expect(field.delim).toEqual('.');
  });
});
