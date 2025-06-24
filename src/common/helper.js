/**
 * Contains generic helper methods
 */

const _ = require("lodash");
const config = require("config");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const submissionApi = require("@topcoder-platform/topcoder-submission-api-wrapper");
const submissionApiClient = submissionApi(
  _.pick(config, [
    "AUTH0_URL",
    "AUTH0_AUDIENCE",
    "TOKEN_CACHE_TIME",
    "AUTH0_CLIENT_ID",
    "AUTH0_CLIENT_SECRET",
    "SUBMISSION_API_URL",
    "AUTH0_PROXY_SERVER_URL",
  ])
);

// review type to be ignored
const ignoredReviewTypeIds = [];

/**
 * Get Prisma client instance
 * @return {Object} Prisma client
 */
async function getPrismaClient() {
  return prisma;
}

/**
 * Get Kafka options
 * @return {Object} the Kafka options
 */
function getKafkaOptions() {
  const options = {
    connectionString: config.KAFKA_URL,
    groupId: config.KAFKA_GROUP_ID,
  };
  if (config.KAFKA_CLIENT_CERT && config.KAFKA_CLIENT_CERT_KEY) {
    options.ssl = {
      cert: config.KAFKA_CLIENT_CERT,
      key: config.KAFKA_CLIENT_CERT_KEY,
    };
  }
  return options;
}

/**
 * Get ignored review type ids
 * @returns {Array} the ignored review type ids
 */
function getIgnoredReviewTypeIds() {
  return ignoredReviewTypeIds;
}

/**
 * Fetch ignore review types
 */
async function fetchIgnoredReviewTypes() {
  const names = JSON.parse(config.IGNORED_REVIEW_TYPES);
  for (const name of names) {
    const query = {
      name,
      isActive: true,
    };
    const res = await submissionApiClient.searchReviewTypes(query);
    const totalPage = Number(res.header["x-total-pages"]);
    let result = res.body;
    if (totalPage > 1) {
      const requests = [];
      for (let i = 2; i <= totalPage; i++) {
        requests.push(
          submissionApiClient.searchReviewTypes(_.assign({ page: i }, query))
        );
      }
      const extraRes = await Promise.all(requests);
      result = _.reduce(extraRes, (ret, e) => ret.concat(e.body), result);
    }
    ignoredReviewTypeIds.push(..._.map(result, "id"));
  }
}

/**
 * Mock service to get user MM rating and volatility
 * @param {Number} userId user id
 * @returns {Object} user rating and volatility
 */
async function getUserMMRating(userId) {
  // Mock implementation - replace with actual service call
  // This simulates the old algo_rating table lookup
  const mockRatings = {
    27244033: { rating: 1200, vol: 100 },
    27244044: { rating: 1300, vol: 110 },
    27244053: { rating: 1400, vol: 120 },
  };

  return mockRatings[userId] || { rating: 1200, vol: 100 };
}

module.exports = {
  getKafkaOptions,
  getPrismaClient,
  getIgnoredReviewTypeIds,
  fetchIgnoredReviewTypes,
  getUserMMRating,
};
