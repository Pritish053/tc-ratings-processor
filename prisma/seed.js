/**
 * Prisma seed file - Seeds the database with test data
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main () {
  console.log('🌱 Seeding database...')

  // Create test challenge
  const challenge = await prisma.challenge.upsert({
    where: { id: 30054163 },
    update: {},
    create: {
      id: 30054163,
      legacyId: 30054163,
      name: 'Test Marathon Match Challenge',
      statusId: 1,
      categoryId: 37,
      createUser: 132456,
      createDate: new Date('2018-12-01T12:00:00Z'),
      modifyUser: 132456,
      modifyDate: new Date('2018-12-01T12:00:00Z'),
      directProjectId: null
    }
  })

  // Create test round
  const round = await prisma.round.upsert({
    where: { id: 2001 },
    update: {},
    create: {
      id: 2001,
      challengeId: 30054163,
      name: 'Test Round 2001',
      typeId: 13, // Marathon Match round type
      ratedInd: 0,
      createDate: new Date('2018-12-01T12:00:00Z')
    }
  })

  // Create test component
  const component = await prisma.component.upsert({
    where: { id: 2001 },
    update: {},
    create: {
      id: 2001,
      problemId: 2001,
      resultTypeId: 1,
      methodName: 'test method',
      className: 'test class'
    }
  })

  // Create round component relationship
  await prisma.roundComponent.upsert({
    where: {
      roundId_componentId_divisionId: {
        roundId: 2001,
        componentId: 2001,
        divisionId: 100
      }
    },
    update: {},
    create: {
      roundId: 2001,
      componentId: 2001,
      divisionId: 100
    }
  })

  // Create test algo ratings
  const testUsers = [27244033, 27244044, 27244053, 27244064]
  const baseRating = 1200

  for (let i = 0; i < testUsers.length; i++) {
    await prisma.algoRating.upsert({
      where: {
        coderId_ratingTypeId: {
          coderId: testUsers[i],
          ratingTypeId: 3 // Marathon Match rating type
        }
      },
      update: {},
      create: {
        coderId: testUsers[i],
        rating: baseRating + i * 100,
        vol: 100 + i * 10,
        ratingTypeId: 3
      }
    })
  }

  // Create test submissions data
  await prisma.submission.upsert({
    where: { id: '14a1b211-283b-4f9a-809f-71e200646560' },
    update: {},
    create: {
      id: '14a1b211-283b-4f9a-809f-71e200646560',
      challengeId: 30054163,
      memberId: 27244033,
      legacySubmissionId: 2001,
      created: new Date('2018-02-16T00:00:00Z'),
      initialScore: 90.12
    }
  })

  await prisma.submission.upsert({
    where: { id: '14a1b211-283b-4f9a-809f-71e200646561' },
    update: {},
    create: {
      id: '14a1b211-283b-4f9a-809f-71e200646561',
      challengeId: 30054163,
      memberId: 27244044,
      legacySubmissionId: 2002,
      created: new Date('2018-02-16T00:00:00Z'),
      initialScore: 85.5
    }
  })

  // Create some existing long component states for testing
  await prisma.longComponentState.upsert({
    where: {
      roundId_coderId_componentId: {
        roundId: 2001,
        coderId: 27244044,
        componentId: 2001
      }
    },
    update: {},
    create: {
      roundId: 2001,
      challengeId: 30054163,
      coderId: 27244044,
      componentId: 2001,
      statusId: 150,
      submissionNumber: 0,
      exampleSubmissionNumber: 0
    }
  })

  await prisma.longComponentState.upsert({
    where: {
      roundId_coderId_componentId: {
        roundId: 2001,
        coderId: 27244053,
        componentId: 2001
      }
    },
    update: {},
    create: {
      roundId: 2001,
      challengeId: 30054163,
      coderId: 27244053,
      componentId: 2001,
      statusId: 150,
      submissionNumber: 2,
      exampleSubmissionNumber: 0,
      points: 98
    }
  })

  // Create long comp results for testing
  await prisma.longCompResult.upsert({
    where: {
      coderId_roundId_challengeId: {
        coderId: 27244044,
        roundId: 2001,
        challengeId: 30054163
      }
    },
    update: {},
    create: {
      coderId: 27244044,
      roundId: 2001,
      challengeId: 30054163,
      attended: 'N',
      placed: 0,
      ratedInd: 0,
      advanced: 'N'
    }
  })

  await prisma.longCompResult.upsert({
    where: {
      coderId_roundId_challengeId: {
        coderId: 27244053,
        roundId: 2001,
        challengeId: 30054163
      }
    },
    update: {},
    create: {
      coderId: 27244053,
      roundId: 2001,
      challengeId: 30054163,
      attended: 'Y',
      placed: 0,
      ratedInd: 0,
      advanced: 'N',
      systemPointTotal: 99
    }
  })

  // Create ID sequence for testing
  await prisma.idSequence.upsert({
    where: { name: 'COMPONENT_STATE_SEQ' },
    update: {},
    create: {
      name: 'COMPONENT_STATE_SEQ',
      nextBlockStart: 100001,
      blockSize: 100
    }
  })

  console.log('✅ Database seeded successfully!')
  console.log('📊 Created test data:')
  console.log(`   - Challenge: ${challenge.id} (${challenge.name})`)
  console.log(`   - Round: ${round.id} (${round.name})`)
  console.log(`   - Component: ${component.id}`)
  console.log(`   - Users with ratings: ${testUsers.join(', ')}`)
  console.log('   - Test submissions: 2')
  console.log('   - Component states: 2')
  console.log('   - Comp results: 2')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
