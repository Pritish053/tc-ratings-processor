# Topcoder - Legacy Rating Processor

## Dependencies

- nodejs (v10)
- Kafka
- Informix
- Docker, Docker Compose

## Configuration

Configuration for the legacy rating processor is at `config/default.js`.
The following parameters can be set in config files or in env variables:

- LOG_LEVEL: the log level; default value: 'debug'
- KAFKA_URL: comma separated Kafka hosts; default value: 'localhost:9092'
- KAFKA_CLIENT_CERT: Kafka connection certificate, optional; default value is undefined;
    if not provided, then SSL connection is not used, direct insecure connection is used;
    if provided, it can be either path to certificate file or certificate content
- KAFKA_CLIENT_CERT_KEY: Kafka connection private key, optional; default value is undefined;
    if not provided, then SSL connection is not used, direct insecure connection is used;
    if provided, it can be either path to private key file or private key content
- KAFKA_GROUP_ID: the Kafka group id, default value is 'legacy-rating-processor'
- CHALLENGE_NOTIFICATION_EVENTS_TOPIC: challenge notification events topic name
- SUBMISSION_NOTIFICATION_AGGREGATE_TOPIC: submission notification aggregate topic name
- NOTIFICATION_AUTOPILOT_EVENTS_TOPIC: notification autopilot events topic name
- SUBMISSION_NOTIFICAION_CREATE_TOPIC: submission notification create topic name
- IGNORED_REVIEW_TYPES: an array of review type names need to be ignored for this processor, it is in JSON string format.
- AUTH0_URL: Auth0 URL, used to get TC M2M token
- AUTH0_AUDIENCE: Auth0 audience, used to get TC M2M token
- TOKEN_CACHE_TIME: Auth0 token cache time, used to get TC M2M token
- AUTH0_CLIENT_ID: Auth0 client id, used to get TC M2M token
- AUTH0_CLIENT_SECRET: Auth0 client secret, used to get TC M2M token
- AUTH0_PROXY_SERVER_URL: Proxy Auth0 URL, used to get TC M2M token
- SUBMISSION_API_URL: The Submission API URL
- ID_SEQ_COMPONENT_STATE: Sequence Name for table long_component_state
- INFORMIX: Informix database configuration parameters, It has all configuration relate to database connection(SERVER, DATABASE, HOST, PROTOCOL, PORTDB_LOCALE, USER, PASSWORD, POOL_MAX_SIZE). refer `config/default.js` for more information

generally, we only need to update INFORMIX_HOST, AUTH0, KAFKA_URL and SUBMISSION_API_URL via environment variables, see INFORMIX_HOST, KAFKA_URL and SUBMISSION_API_URL parameter in docker/sample.api.env

There is a `/health` endpoint that checks for the health of the app. This sets up an expressjs server and listens on the environment variable `PORT`. It's not part of the configuration file and needs to be passed as an environment variable

## Local Kafka setup

- `http://kafka.apache.org/quickstart` contains details to setup and manage Kafka server,
  below provides details to setup Kafka server in Linux/Mac, Windows will use bat commands in bin/windows instead
- download kafka at `https://www.apache.org/dyn/closer.cgi?path=/kafka/1.1.0/kafka_2.11-1.1.0.tgz`
- extract out the downloaded tgz file
- go to extracted directory kafka_2.11-0.11.0.1
- start ZooKeeper server:
  `bin/zookeeper-server-start.sh config/zookeeper.properties`
- use another terminal, go to same directory, start the Kafka server:
  `bin/kafka-server-start.sh config/server.properties`
- note that the zookeeper server is at localhost:2181, and Kafka server is at localhost:9092
- use another terminal, go to same directory, create the needed topics:
  `bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic challenge.notification.events`

  `bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic submission.notification.aggregate`

  `bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic notifications.autopilot.events`

- verify that the topics are created:
  `bin/kafka-topics.sh --list --zookeeper localhost:2181`,
  it should list out the created topics
- run the producer and then write some message into the console to send to the `submission.notification.aggregate` topic:
  `bin/kafka-console-producer.sh --broker-list localhost:9092 --topic notifications.autopilot.events`
  in the console, write message, one message per line:
  `{ "topic": "notifications.autopilot.events","originator": "challenge-api","timestamp": "2020-02-09T00:00:00.000Z","mime-type": "application/json","payload": { "projectId": 30054163, "phaseTypeName": "Review", "state": "End" } }`
- optionally, use another terminal, go to same directory, start a consumer to view the messages:
  `bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic notifications.autopilot.events --from-beginning`
- writing/reading messages to/from other topics are similar

## Topcoder Informix Database Setup

We will use Topcoder Informix database setup on Docker.

Go to `docker-ifx` folder and run `docker-compose up`
After the informix instance is successfully setup, you need to run the sql script `update.sql` which will modify the table and insert some test data used in testing.
You can use GUI tool to run the script, for example [DBeaver](https://dbeaver.io/)

## Local deployment

- Given the fact that the library used to access Informix DB depends on Informix Client SDK.
We will run the application on Docker using a base image with Informix Client SDK installed and properly configured.
For deployment, please refer to next section 'Local Deployment with Docker'

## Mock Api

Mock api is under `mock-api` folder. You can use command `npm run mock-api` to start the server.

## Local Deployment with Docker

To run the Legacy Processor using docker, follow the steps below

1. Make sure that Kafka, mock-api and Informix are running as per instructions above.

2. Go to `docker` folder

3. Rename the file `sample.api.env` to `api.env` And properly update the IP addresses to match your environment for the variables : KAFKA_URL, INFORMIX_HOST and SUBMISSION_API_URL( make sure to use IP address instead of hostname ( i.e localhost will not work)).Here is an example (sensitive information are removed to prevent commiting them to git repository):

    ```bash
    KAFKA_URL=192.168.31.8:9092
    INFORMIX_HOST=192.168.31.8
    SUBMISSION_API_URL=http://192.168.31.8:3001
    AUTH0_ etc
    ```

4. Once that is done, go to run the following command

    ```bash
    docker-compose up
    ```

5. When you are running the application for the first time, It will take some time initially to download the image and install the dependencies

## Verification

Refer to `Validation.md`
