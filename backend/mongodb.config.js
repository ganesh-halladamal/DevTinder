// MongoDB Memory Server for Development
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const startMemoryServer = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  console.log(`MongoDB Memory Server started at ${uri}`);
  return uri;
};

const stopMemoryServer = async () => {
  if (mongoServer) {
    await mongoServer.stop();
    console.log('MongoDB Memory Server stopped');
  }
};

module.exports = {
  startMemoryServer,
  stopMemoryServer
}; 