# Topcoder - Legacy Rating Processor (PostgreSQL + Prisma)

A modernized version of the Topcoder Legacy Rating Processor that uses PostgreSQL with Prisma ORM instead of Informix database.

## 🏗️ Architecture Changes

This version removes all dependencies on Informix and implements:

- **PostgreSQL 16.3** as the primary database
- **Prisma ORM** for type-safe database operations
- **Transaction management** using Prisma's interactive transactions
- **Modern Node.js 18+** runtime
- **Improved error handling** and logging
- **Database migrations** for schema management

## 📋 Prerequisites

- Node.js 18.x or higher
- PostgreSQL 16.3
- Docker and Docker Compose (recommended)
- Kafka (for message processing)

## 🚀 Quick Start

### Using Docker Compose (Recommended)

1. **Clone and setup the project:**

```bash
git clone <your-repo-url>
cd legacy-rating-processor
cp docker/sample.api.env docker/api.env
```

2. **Update environment variables in `docker/api.env`:**

```env
DATABASE_URL=postgresql://postgres:password@postgres:5432/rating_processor
KAFKA_URL=localhost:9092
SUBMISSION_API_URL=http://localhost:3001
LOG_LEVEL=debug
AUTH0_URL=your_auth0_url
AUTH0_AUDIENCE=your_audience
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
```

3. **Start services:**

```bash
# Start PostgreSQL
docker-compose up postgres -d

# Wait for PostgreSQL to be ready, then setup database
npm install
npx prisma db push
npm run db:seed

# Start the processor
docker-compose up legacy-rating-processor
```

### Manual Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Setup PostgreSQL database:**

```bash
# Create database
createdb rating_processor

# Set environment variable
export DATABASE_URL="postgresql://postgres:password@localhost:5432/rating_processor"
```

3. **Setup database schema:**

```bash
# Generate Prisma client
npx prisma generate

# Apply schema to database
npx prisma db push

# Seed with test data
npm run db:seed
```

4. **Start the application:**

```bash
npm start
```

## 🗄️ Database Schema

The PostgreSQL schema includes these main tables:

### Core Tables

- **challenges** - Marathon Match challenges
- **rounds** - Challenge rounds with type and rating info
- **components** - Problem components
- **round_components** - Links rounds to components

### Rating Tables

- **algo_ratings** - User ratings by type (with history)
- **long_component_states** - User participation states
- **long_submissions** - Individual submissions
- **long_comp_results** - Final competition results

### Supporting Tables

- **id_sequences** - ID generation sequences
- **submissions** - External submission references

## 📊 Data Migration

The system maintains compatibility with existing data while providing better structure:

### Key Changes from Informix

1. **Round ID tracking**: Now uses `challengeId` and `legacyId` as primary identifiers
2. **Rating history**: `algo_ratings` table properly stores historical data
3. **Improved constraints**: Better foreign key relationships and data integrity
4. **Modern types**: Uses appropriate PostgreSQL data types

### Migration Strategy

- Challenge IDs remain the same for compatibility
- User IDs (coder_id/member_id) are preserved
- Rating calculations use the same business logic
- All timestamps are properly handled with timezone support

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/rating_processor` |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | `debug` |
| `KAFKA_URL` | Kafka broker URL | `localhost:9092` |
| `KAFKA_GROUP_ID` | Kafka consumer group ID | `legacy-rating-processor` |
| `SUBMISSION_API_URL` | Submission API endpoint | `http://localhost:3001` |
| `AUTH0_URL` | Auth0 domain URL | Required |
| `AUTH0_AUDIENCE` | Auth0 API audience | Required |
| `AUTH0_CLIENT_ID` | Auth0 client ID | Required |
| `AUTH0_CLIENT_SECRET` | Auth0 client secret | Required |

### Kafka Topics

The processor listens to these topics:

- `challenge.notification.events` - User registration events
- `submission.notification.aggregate` - Review and review summation events
- `notifications.autopilot.events` - Review end events

## 🎯 Event Processing

### 1. Registration Event (`processRegistration`)

- **Trigger**: User registers for a Marathon Match
- **Actions**:
  - Creates `long_component_state` record
  - Creates `long_comp_result` record
  - Uses challenge ID to find associated round

### 2. Review Event (`processReview`)

- **Trigger**: Submission receives a review score
- **Actions**:
  - Creates `long_submission` record
  - Updates `long_component_state` with new score and submission count
  - Links to challenge via submission API

### 3. Review Summation Event (`processReviewSummation`)

- **Trigger**: Final aggregated score is calculated
- **Actions**:
  - Updates `long_comp_result` with final scores
  - Marks user as attended
  - Records both system and initial scores

### 4. Review End Event (`processReviewEnd`)

- **Trigger**: Review phase ends for a challenge
- **Actions**:
  - Calculates final rankings based on scores
  - Updates all participants with their placement
  - Records old ratings for historical tracking

## 🧪 Testing

### Setup Test Environment

1. **Start test services:**

```bash
# Start PostgreSQL and mock API
docker-compose up postgres -d
npm run mock-api &
```

2. **Prepare test data:**

```bash
npm run db:seed
```

3. **Run tests:**

```bash
npm test
```

### Manual Testing

1. **Start Kafka producer:**

```bash
# Terminal 1: Start the processor
npm start

# Terminal 2: Start mock API
npm run mock-api

# Terminal 3: Send test events
```

2. **Test registration event:**

```bash
# Start Kafka console producer
bin/kafka-console-producer.sh --broker-list localhost:9092 --topic challenge.notification.events

# Send registration message
{"topic":"challenge.notification.events","originator":"challenge-api","timestamp":"2020-02-09T00:00:00.000Z","mime-type":"application/json","payload":{"type":"USER_REGISTRATION","data":{"challengeId":30054163,"userId":27244033}}}
```

3. **Test review event:**

```bash
# Start producer for submission topic
bin/kafka-console-producer.sh --broker-list localhost:9092 --topic submission.notification.aggregate

# Send review message
{"topic":"submission.notification.aggregate","originator":"submission-api","timestamp":"2020-02-09T00:00:00.000Z","mime-type":"application/json","payload":{"resource":"review","submissionId":"14a1b211-283b-4f9a-809f-71e200646560","typeId":"55bbb17d-aac2-45a6-89c3-a8d102863d05","score":90.12,"originalTopic":"submission.notification.create"}}
```

### Verification Queries

```sql
-- Check registration results
SELECT * FROM long_component_states WHERE coder_id = 27244033;
SELECT * FROM long_comp_results WHERE coder_id = 27244033;

-- Check review results
SELECT * FROM long_submissions WHERE long_component_state_id IN 
  (SELECT id FROM long_component_states WHERE coder_id = 27244033);

-- Check final rankings
SELECT coder_id, placed, system_point_total, old_rating 
FROM long_comp_results 
WHERE round_id = 2001 
ORDER BY placed;
```

## 🔍 Database Management

### Prisma Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Apply schema changes to database
npx prisma db push

# Create and apply migrations
npx prisma migrate dev --name description

# Reset database (⚠️ destructive)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Seed database with test data
npm run db:seed
```

### Database Queries

```bash
# Connect to PostgreSQL
psql postgresql://postgres:password@localhost:5432/rating_processor

# View all tables
\dt

# Check table structure
\d long_comp_results
```

## 🔄 Migration from Informix

### Key Differences

| Aspect | Informix (Old) | PostgreSQL (New) |
|--------|----------------|------------------|
| Database Driver | `ifxnjs` | `@prisma/client` |
| Connection Management | Manual pool | Prisma connection pool |
| Query Style | Raw SQL strings | Type-safe Prisma queries |
| Transactions | Manual begin/commit | Interactive transactions |
| ID Generation | Custom sequence tables | Prisma auto-increment + custom |
| Schema Management | Manual SQL scripts | Prisma migrations |

### Business Logic Preservation

✅ **Maintained**:

- All event processing logic
- Rating calculation algorithms  
- Ranking determination
- Score aggregation
- User registration flow

✅ **Improved**:

- Error handling and logging
- Database connection management
- Transaction safety
- Type safety with Prisma
- Better data validation

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Verify connection string
echo $DATABASE_URL
```

2. **Prisma Client Not Generated**

```bash
npx prisma generate
```

3. **Missing Test Data**

```bash
npm run db:seed
```

4. **Kafka Connection Issues**

```bash
# Check Kafka is running and accessible
telnet localhost 9092
```

### Debugging

```bash
# Enable debug logging
export LOG_LEVEL=debug

# Check database queries
# Prisma logs all queries when LOG_LEVEL=debug

# Monitor PostgreSQL logs
docker-compose logs -f postgres
```

## 📈 Performance Considerations

- **Connection Pooling**: Prisma manages connection pools automatically
- **Query Optimization**: Prisma generates optimized SQL queries
- **Transaction Efficiency**: Interactive transactions reduce roundtrips
- **Indexing**: Database indexes are defined in the Prisma schema

## 🔒 Security

- **SQL Injection Protection**: Prisma provides automatic SQL injection protection
- **Type Safety**: Compile-time type checking prevents runtime errors
- **Connection Security**: Uses secure PostgreSQL connections
- **Environment Variables**: Sensitive data stored in environment variables

## 📝 API Documentation

The processor doesn't expose HTTP endpoints but processes Kafka events. See the **Event Processing** section for details on message formats and processing logic.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes ensuring tests pass
4. Update documentation
5. Submit a pull request

### Development Setup

```bash
# Install dependencies
npm install

# Start development mode with auto-reload
npm run dev

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📄 License

This project is licensed under the terms specified in the package.json file.

## 🆘 Support

For questions or issues:

1. Check the troubleshooting section
2. Review the logs for error details
3. Open an issue in the repository
4. Contact the development team

---

**Note**: This version maintains full backward compatibility with the existing business logic while providing a modern, maintainable database layer using PostgreSQL and Prisma ORM.
