/**
 * Basic test suite for the PostgreSQL migration
 */

/* global describe, it, before, after */

const { expect } = require('chai')
const DatabaseService = require('../src/services/DatabaseService')
const ProcessorService = require('../src/services/ProcessorService')

describe('Legacy Rating Processor - PostgreSQL Migration', () => {
  let dbService

  before(async () => {
    dbService = new DatabaseService()
  })

  after(async () => {
    await dbService.close()
  })

  describe('DatabaseService', () => {
    it('should connect to PostgreSQL database', async () => {
      // Test basic connectivity
      const result = await dbService.prisma.$queryRaw`SELECT 1 as test`
      expect(result[0].test).to.equal(1)
    })

    it('should get MM round id for existing challenge', async () => {
      const roundId = await dbService.getMMRoundId(30054163)
      expect(roundId).to.equal(2001)
    })

    it('should return null for non-existent challenge', async () => {
      const roundId = await dbService.getMMRoundId(99999999)
      expect(roundId).to.equal(null)
    })

    it('should get component id for existing round', async () => {
      const componentId = await dbService.getComponentId(2001)
      expect(componentId).to.equal(2001)
    })

    it('should get rated indicator for existing round', async () => {
      const ratedInd = await dbService.getRatedInd(2001)
      expect(ratedInd).to.equal(0)
    })

    it('should get user MM rating', async () => {
      const rating = await dbService.getUserMMRating(27244033)
      expect(rating).to.have.property('rating')
      expect(rating).to.have.property('vol')
      expect(rating.rating).to.be.a('number')
      expect(rating.vol).to.be.a('number')
    })
  })

  describe('ProcessorService', () => {
    it('should process registration event', async () => {
      const payload = {
        data: {
          challengeId: 30054163,
          userId: 27244099 // New test user
        }
      }

      // Should not throw error
      await ProcessorService.processRegistration(payload)

      // Verify data was created
      const componentState =
        await dbService.prisma.longComponentState.findFirst({
          where: {
            challengeId: 30054163,
            coderId: 27244099
          }
        })
      expect(componentState).to.not.equal(null)

      const compResult = await dbService.prisma.longCompResult.findFirst({
        where: {
          challengeId: 30054163,
          coderId: 27244099
        }
      })
      expect(compResult).to.not.equal(null)
      expect(compResult.attended).to.equal('N')
    })

    it('should ignore registration for non-existent challenge', async () => {
      const payload = {
        data: {
          challengeId: 99999999,
          userId: 27244099
        }
      }

      // Should not throw error but should ignore
      await ProcessorService.processRegistration(payload)
    })
  })

  describe('Transaction Handling', () => {
    it('should handle database transactions correctly', async () => {
      const testValue = Math.random()

      await dbService.executeInTransaction(async () => {
        // This should work within transaction
        await dbService.prisma.idSequence.upsert({
          where: { name: 'TEST_SEQ' },
          update: { nextBlockStart: testValue },
          create: {
            name: 'TEST_SEQ',
            nextBlockStart: testValue,
            blockSize: 100
          }
        })
      })

      // Verify the transaction was committed
      const sequence = await dbService.prisma.idSequence.findUnique({
        where: { name: 'TEST_SEQ' }
      })
      expect(sequence.nextBlockStart).to.equal(testValue)
    })
  })

  describe('ID Generation', () => {
    it('should generate unique IDs', async () => {
      const IDGenerator = require('../src/common/IdGenerator')
      const idGen = new IDGenerator('TEST_COMPONENT_SEQ')

      const id1 = await idGen.getNextId()
      const id2 = await idGen.getNextId()

      expect(id1).to.be.a('number')
      expect(id2).to.be.a('number')
      expect(id2).to.equal(id1 + 1)

      await idGen.close()
    })
  })
})

// Additional integration tests
describe('Event Processing Integration', () => {
  it('should have all required processing functions', async () => {
    // Test that all required functions exist and are callable
    expect(ProcessorService.processRegistration).to.be.a('function')
    expect(ProcessorService.processReview).to.be.a('function')
    expect(ProcessorService.processReviewSummation).to.be.a('function')
    expect(ProcessorService.processReviewEnd).to.be.a('function')
  })
})
