/**
 * Contains generic helper methods
 */

const _ = require('lodash')
const config = require('config')
const ifxnjs = require('ifxnjs')

const Pool = ifxnjs.Pool
const pool = Promise.promisifyAll(new Pool())
pool.setMaxPoolSize(config.get('INFORMIX.POOL_MAX_SIZE'))

const submissionApi = require('@topcoder-platform/topcoder-submission-api-wrapper')
const submissionApiClient = submissionApi(_.pick(config, [
  'AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET', 'SUBMISSION_API_URL', 'AUTH0_PROXY_SERVER_URL']))

// review type to be ignored
const ignoredReviewTypeIds = []

/**
 * Get Informix connection using the configured parameters
 * @return {Object} Informix connection
 */
async function getInformixConnection () {
  // construct the connection string from the configuration parameters.
  const connectionString = 'SERVER=' + config.get('INFORMIX.SERVER') +
                           ';DATABASE=' + config.get('INFORMIX.DATABASE') +
                           ';HOST=' + config.get('INFORMIX.HOST') +
                           ';Protocol=' + config.get('INFORMIX.PROTOCOL') +
                           ';SERVICE=' + config.get('INFORMIX.PORT') +
                           ';DB_LOCALE=' + config.get('INFORMIX.DB_LOCALE') +
                           ';UID=' + config.get('INFORMIX.USER') +
                           ';PWD=' + config.get('INFORMIX.PASSWORD')
  const conn = await pool.openAsync(connectionString)
  return Promise.promisifyAll(conn)
}

/**
 * Get Kafka options
 * @return {Object} the Kafka options
 */
function getKafkaOptions () {
  const options = { connectionString: config.KAFKA_URL, groupId: config.KAFKA_GROUP_ID }
  if (config.KAFKA_CLIENT_CERT && config.KAFKA_CLIENT_CERT_KEY) {
    options.ssl = { cert: config.KAFKA_CLIENT_CERT, key: config.KAFKA_CLIENT_CERT_KEY }
  }
  return options
}

/**
 * Get ignored review type ids
 * @returns {Array} the ignored review type ids
 */
function getIgnoredReviewTypeIds () {
  return ignoredReviewTypeIds
}

/**
 * Fetch ignore review types
 */
async function fetchIgnoredReviewTypes () {
  const names = JSON.parse(config.IGNORED_REVIEW_TYPES)
  for (const name of names) {
    const query = {
      name,
      isActive: true
    }
    const res = await submissionApiClient.searchReviewTypes(query)
    const totalPage = Number(res.header['x-total-pages'])
    let result = res.body
    if (totalPage > 1) {
      const requests = []
      for (let i = 2; i <= totalPage; i++) {
        requests.push(submissionApiClient.searchReviewTypes(_.assign({ page: i }, query)))
      }
      const extraRes = await Promise.all(requests)
      result = _.reduce(extraRes, (ret, e) => ret.concat(e.body), result)
    }
    ignoredReviewTypeIds.push(..._.map(result, 'id'))
  }
}

module.exports = {
  getKafkaOptions,
  getInformixConnection,
  getIgnoredReviewTypeIds,
  fetchIgnoredReviewTypes
}
