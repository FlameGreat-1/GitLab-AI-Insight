from confluent_kafka import Producer, KafkaException
import json
from Backend.config import config
import logging


logger = logging.getLogger(__name__)

class GitLabEventProducer:
    def __init__(self):
        self.producer = Producer({
            'bootstrap.servers': config.KAFKA_BOOTSTRAP_SERVERS,
            'client.id': 'gitlab_event_producer'
        })

    def delivery_report(self, err, msg):
        if err is not None:
            logger.error(f'Message delivery failed: {err}')
        else:
            logger.info(f'Message delivered to {msg.topic()} [{msg.partition()}]')

    def produce_event(self, event_type, event_data):
        try:
            event = {
                'type': event_type,
                'data': event_data
            }
            self.producer.produce(
                config.KAFKA_TOPIC,
                key=event_type,
                value=json.dumps(event),
                callback=self.delivery_report
            )
            self.producer.flush()
        except Exception as e:
            logger.error(f'Error producing event: {str(e)}')

    def produce_event(self, event_type, event_data):
        try:
            event = {
                'type': event_type,
                'data': event_data
            }
            self.producer.produce(
                config.KAFKA_TOPIC,
                key=event_type,
                value=json.dumps(event),
                callback=self.delivery_report
            )
            self.producer.flush()
        except KafkaException as ke:
            logger.error(f'Kafka error while producing event: {str(ke)}')
            # Implement retry logic or alert system here
        except Exception as e:
            logger.error(f'Unexpected error producing event: {str(e)}')
            # Implement fallback or alert system here


    def close(self):
        self.producer.flush()
