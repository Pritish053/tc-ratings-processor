/**
 * Test configuration - overrides for testing
 */

module.exports = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/rating_processor',
  
  // Auth0 - mock values for testing
  AUTH0_URL: 'https://test.auth0.com',
  AUTH0_AUDIENCE: 'https://api.test.com',
  AUTH0_CLIENT_ID: 'test_client_id',
  AUTH0_CLIENT_SECRET: 'test_client_secret',
  
  // Other test overrides
  LOG_LEVEL: 'warn', // Less verbose during tests
  SUBMISSION_API_URL: 'http://localhost:3001'
}
