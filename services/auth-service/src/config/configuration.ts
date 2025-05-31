export default () => {
  // Debug logging for MongoDB configuration
  console.log('\n--- Auth Service Configuration Debug ---');
  console.log('MongoDB Configuration:');
  console.log('AUTH_DB_URI:', process.env.AUTH_DB_URI ? '[PROVIDED]' : '[NOT PROVIDED]');
  
  const config = {
    port: parseInt(process.env.AUTH_SERVICE_PORT || '3000', 10),
    jwt: {
      secret: process.env.AUTH_SERVICE_JWT_SECRET || 'your-secret-key',
      expiresIn: process.env.AUTH_SERVICE_JWT_EXPIRES_IN || '1h',
    },
    mongodb: {
      uri: process.env.AUTH_DB_URI || 'mongodb://localhost:27017',
    },
  };

  console.log('\nService Configuration:');
  console.log('AUTH_SERVICE_PORT:', process.env.AUTH_SERVICE_PORT, '(using:', config.port, ')');
  
  console.log('\nFinal MongoDB URI:', config.mongodb.uri.replace(/:([^:@]+)@/, ':[PASSWORD]@'));
  console.log('----------------------------------------\n');

  return config;
};