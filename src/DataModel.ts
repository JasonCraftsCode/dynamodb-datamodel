export class Model {
  constructor() {

  }

  // Validate data going into storage
  validateModel(data, options) {
  }

  // Validate data comming out of storage
  validateStorage(data, options) {
  }

  // Map data from model into storage 
  mapToStorage(data, options) {

  }
  
  // Map data from storage into model
  mapToModel(data, options) {

  }


  // DynamoDb input param and result helpers
  putParams(data, options) {

  }
  parsePut(result) {

  }
  
  getParams(key, options) {

  }
  parseGet(result) {

  }

  updateParams(data, options) {

  }
  parseUpdate(result) {

  }

  queryParams(data, options) {

  }
  parseQuery(result) {

  }


  // DynamoDb query/mutate helpers, does the following:
  //  - validate model data
  //  - maps data from model to storage
  //  - get params
  //  - calls dynamodb API
  //  - validate storage data
  //  - maps data from storage to model
  async put(dynamodb, data, options) {

  }

  async get(dynamodb, data, options) {
    
  }
}