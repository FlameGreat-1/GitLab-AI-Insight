from confluent_kafka import Consumer, KafkaError
import json
from Backend.config import config
import logging

logger = logging.getLogger(__name__)

class GitLabEventConsumer:
    def __init__(self, group_id):
        self.consumer = Consumer({
            'bootstrap.servers': config.KAFKA_BOOTSTRAP_SERVERS,
            'group.id': group_id,
            'auto.offset.reset': 'earliest'
        })
        self.consumer.subscribe([config.KAFKA_TOPIC])

    def consume_events(self, num_messages=1000):
        events = []
        try:
            while len(events) < num_messages:
                msg = self.consumer.poll(1.0)
                if msg is None:
                    continue
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        logger.info('Reached end of partition')
                    else:
                        logger.error(f'Error: {msg.error()}')
                else:
                    event = json.loads(msg.value().decode('utf-8'))
                    events.append(event)
        except Exception as e:
            logger.error(f'Error consuming events: {str(e)}')
        finally:
            self.consumer.close()
        return events

    def close(self):
        self.consumer.close()
