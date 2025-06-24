/**
 * The ID generator service for PostgreSQL with Prisma
 */
const Mutex = require('async-mutex').Mutex
const { PrismaClient } = require('@prisma/client')
const logger = require('./logger')

/**
 * Main class of IDGenerator
 */
class IDGenerator {
  /**
   * Constructor
   * @param {String} seqName sequence name
   */
  constructor (seqName) {
    this.seqName = seqName
    this._availableId = 0
    this.mutex = new Mutex()
    this.prisma = new PrismaClient()
  }

  /**
   * Get next id
   * @returns {Number} next id
   */
  async getNextId () {
    const release = await this.mutex.acquire()
    try {
      logger.debug('Getting nextId')
      --this._availableId
      logger.debug(`this._availableId = ${this._availableId}`)

      if (this._availableId <= 0) {
        const [nextId, availableId] = await this.getNextBlock()
        await this.updateNextBlock(nextId + availableId + 1)

        // Only set to this's properties after successful update
        this._nextId = nextId
        this._availableId = availableId
      }

      logger.debug(`this._availableId = ${this._availableId}`)
      return ++this._nextId
    } finally {
      release()
    }
  }

  /**
   * Fetch next block from id_sequences
   * @returns {Array} [nextId, availableId]
   * @private
   */
  async getNextBlock () {
    const sequence = await this.prisma.idSequence.findUnique({
      where: { name: this.seqName }
    })

    if (sequence) {
      return [sequence.nextBlockStart - 1, sequence.blockSize]
    } else {
      // Create default sequence if not exists
      const newSequence = await this.prisma.idSequence.create({
        data: {
          name: this.seqName,
          nextBlockStart: 1001,
          blockSize: 100
        }
      })
      return [newSequence.nextBlockStart - 1, newSequence.blockSize]
    }
  }

  /**
   * Update id_sequence
   * @param {Number} nextStart next start id
   * @private
   */
  async updateNextBlock (nextStart) {
    await this.prisma.idSequence.upsert({
      where: { name: this.seqName },
      update: { nextBlockStart: nextStart },
      create: {
        name: this.seqName,
        nextBlockStart: nextStart,
        blockSize: 100
      }
    })
  }

  /**
   * Close the database connection
   */
  async close () {
    await this.prisma.$disconnect()
  }
}

module.exports = IDGenerator
