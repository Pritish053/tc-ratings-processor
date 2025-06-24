/**
 * Database Service using Prisma ORM
 * This service replaces all Informix database operations
 */

const { PrismaClient } = require('@prisma/client')
const logger = require('../common/logger')

class DatabaseService {
  constructor () {
    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty'
    })
  }

  /**
   * Get MM challenge round id by challenge id
   * @param {Number} challengeId challenge id
   * @returns {Number} round id
   */
  async getMMRoundId (challengeId) {
    try {
      const challenge = await this.prisma.challenge.findUnique({
        where: { id: challengeId },
        include: {
          rounds: {
            where: {
              typeId: 13 // Marathon Match round type
            },
            take: 1
          }
        }
      })

      if (!challenge || challenge.rounds.length === 0) {
        return null
      }

      return challenge.rounds[0].id
    } catch (error) {
      logger.error('Error getting MM round id:', error)
      throw error
    }
  }

  /**
   * Get component id by round id
   * @param {Number} roundId round id
   * @returns {Number} component id
   */
  async getComponentId (roundId) {
    try {
      const roundComponent = await this.prisma.roundComponent.findFirst({
        where: { roundId },
        include: { component: true }
      })

      if (!roundComponent) {
        throw new Error('Failed to fetch component id from database.')
      }

      return roundComponent.componentId
    } catch (error) {
      logger.error('Error getting component id:', error)
      throw error
    }
  }

  /**
   * Get rated indicator by round id
   * @param {Number} roundId round id
   * @returns {Number} rated indicator
   */
  async getRatedInd (roundId) {
    try {
      const round = await this.prisma.round.findUnique({
        where: { id: roundId },
        select: { ratedInd: true }
      })

      if (!round) {
        throw new Error('Failed to fetch rated index from database.')
      }

      return round.ratedInd
    } catch (error) {
      logger.error('Error getting rated indicator:', error)
      throw error
    }
  }

  /**
   * Get long component state detail
   * @param {Number} roundId round id
   * @param {Number} memberId member id
   * @returns {Object} long component state detail
   */
  async getLongComponentStateDetail (roundId, memberId) {
    try {
      const componentState = await this.prisma.longComponentState.findFirst({
        where: {
          roundId,
          coderId: memberId
        },
        select: {
          id: true,
          submissionNumber: true
        }
      })

      if (!componentState) {
        throw new Error(
          'Failed to fetch long component state detail from database.'
        )
      }

      return {
        longComponentStateId: componentState.id,
        submissionNumber: componentState.submissionNumber
      }
    } catch (error) {
      logger.error('Error getting long component state detail:', error)
      throw error
    }
  }

  /**
   * Get submission initial score
   * @param {Number} submissionId submission id
   * @returns {Number} submission initial score
   */
  async getSubmissionInitialScore (submissionId) {
    try {
      const submission = await this.prisma.submission.findUnique({
        where: { legacySubmissionId: submissionId },
        select: { initialScore: true }
      })

      if (!submission) {
        throw new Error(
          'Failed to fetch submission initial score from database.'
        )
      }

      return submission.initialScore || 0
    } catch (error) {
      logger.error('Error getting submission initial score:', error)
      throw error
    }
  }

  /**
   * Get MM challenge result
   * @param {Number} roundId round id
   * @returns {Array} mm challenge result
   */
  async getMMResult (roundId) {
    try {
      const results = await this.prisma.longCompResult.findMany({
        where: { roundId },
        select: {
          coderId: true,
          attended: true,
          systemPointTotal: true
        }
      })

      return results.map((result) => ({
        point: result.attended === 'N' ? 0 : result.systemPointTotal || 0,
        coderId: result.coderId
      }))
    } catch (error) {
      logger.error('Error getting MM result:', error)
      throw error
    }
  }

  /**
   * Get user MM rating (mocked service)
   * @param {Number} coderId coder id
   * @returns {Object} user MM rating
   */
  async getUserMMRating (coderId) {
    try {
      // Mock rating service - in real implementation, this would call an external service
      const rating = await this.prisma.algoRating.findFirst({
        where: {
          coderId,
          ratingTypeId: 3 // Marathon Match rating type
        },
        select: {
          rating: true,
          vol: true
        }
      })

      if (rating) {
        return {
          rating: rating.rating,
          vol: rating.vol
        }
      }

      // Return default values if no rating found
      return {
        rating: 1200, // Default rating
        vol: 100 // Default volatility
      }
    } catch (error) {
      logger.error('Error getting user MM rating:', error)
      throw error
    }
  }

  /**
   * Create long component state
   * @param {Object} data component state data
   */
  async createLongComponentState (data) {
    try {
      return await this.prisma.longComponentState.create({
        data: {
          roundId: data.round_id,
          challengeId: data.challenge_id,
          coderId: data.coder_id,
          componentId: data.component_id,
          statusId: data.status_id,
          submissionNumber: data.submission_number || 0,
          exampleSubmissionNumber: data.example_submission_number || 0
        }
      })
    } catch (error) {
      logger.error('Error creating long component state:', error)
      throw error
    }
  }

  /**
   * Create long comp result
   * @param {Object} data result data
   */
  async createLongCompResult (data) {
    try {
      return await this.prisma.longCompResult.create({
        data: {
          coderId: data.coder_id,
          roundId: data.round_id,
          challengeId: data.challenge_id,
          attended: data.attended || 'N',
          placed: data.placed || 0,
          ratedInd: data.rated_ind,
          advanced: data.advanced || 'N'
        }
      })
    } catch (error) {
      logger.error('Error creating long comp result:', error)
      throw error
    }
  }

  /**
   * Update long component state
   * @param {Object} updateData data to update
   * @param {Object} whereClause where condition
   */
  async updateLongComponentState (updateData, whereClause) {
    try {
      const updateFields = {}

      if (updateData.points !== undefined) {
        updateFields.points = updateData.points
      }
      if (updateData.submission_number !== undefined) {
        updateFields.submissionNumber = updateData.submission_number
      }

      return await this.prisma.longComponentState.update({
        where: {
          id: whereClause.long_component_state_id
        },
        data: updateFields
      })
    } catch (error) {
      logger.error('Error updating long component state:', error)
      throw error
    }
  }

  /**
   * Update long comp result
   * @param {Object} updateData data to update
   * @param {Object} whereClause where condition
   */
  async updateLongCompResult (updateData, whereClause) {
    try {
      const updateFields = {}

      if (updateData.system_point_total !== undefined) {
        updateFields.systemPointTotal = updateData.system_point_total
      }
      if (updateData.point_total !== undefined) {
        updateFields.pointTotal = updateData.point_total
      }
      if (updateData.attended !== undefined) {
        updateFields.attended = updateData.attended
      }
      if (updateData.placed !== undefined) {
        updateFields.placed = updateData.placed
      }
      if (updateData.old_rating !== undefined) {
        updateFields.oldRating = updateData.old_rating
      }
      if (updateData.old_vol !== undefined) {
        updateFields.oldVol = updateData.old_vol
      }

      const where = {}
      if (whereClause.round_id && whereClause.coder_id) {
        where.coderId_roundId_challengeId = {
          coderId: whereClause.coder_id,
          roundId: whereClause.round_id,
          challengeId: whereClause.challenge_id || whereClause.round_id // fallback
        }
      }

      return await this.prisma.longCompResult.update({
        where,
        data: updateFields
      })
    } catch (error) {
      logger.error('Error updating long comp result:', error)
      throw error
    }
  }

  /**
   * Create long submission
   * @param {Object} data submission data
   */
  async createLongSubmission (data) {
    try {
      return await this.prisma.longSubmission.create({
        data: {
          longComponentStateId: data.long_component_state_id,
          roundId: data.round_id,
          submissionNumber: data.submission_number,
          example: data.example || 0,
          openTime: BigInt(data.open_time),
          submitTime: BigInt(data.submit_time),
          submissionPoints: data.submission_points,
          languageId: data.language_id || 9
        }
      })
    } catch (error) {
      logger.error('Error creating long submission:', error)
      throw error
    }
  }

  /**
   * Begin database transaction
   */
  async beginTransaction () {
    // Prisma handles transactions differently - we'll use interactive transactions
    return this.prisma
  }

  /**
   * Commit transaction (no-op for Prisma interactive transactions)
   */
  async commitTransaction () {
    // No-op for Prisma - transactions are auto-committed
  }

  /**
   * Rollback transaction (no-op for Prisma interactive transactions)
   */
  async rollbackTransaction () {
    // No-op for Prisma - transactions are auto-rolled back on error
  }

  /**
   * Close database connection
   */
  async close () {
    await this.prisma.$disconnect()
  }

  /**
   * Execute operations in a transaction
   * @param {Function} operations async function containing operations
   */
  async executeInTransaction (operations) {
    return await this.prisma.$transaction(async (prisma) => {
      // Pass the transaction client to operations
      const originalPrisma = this.prisma
      this.prisma = prisma
      try {
        const result = await operations()
        return result
      } finally {
        this.prisma = originalPrisma
      }
    })
  }
}

module.exports = DatabaseService
