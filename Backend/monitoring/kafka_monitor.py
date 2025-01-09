from confluent_kafka.admin import AdminClient
from confluent_kafka import KafkaException
import logging
from Backend.config import config

logger = logging.getLogger(__name__)

class KafkaMonitor:
    def __init__(self):
        self.admin_client = AdminClient({'bootstrap.servers': config.KAFKA_BOOTSTRAP_SERVERS})

    def check_topic_health(self, topic=config.KAFKA_TOPIC):
        try:
            topic_metadata = self.admin_client.list_topics(topic=topic, timeout=10)
            if topic not in topic_metadata.topics:
                logger.error(f"Topic {topic} does not exist")
                return False
            return True
        except KafkaException as ke:
            logger.error(f"Kafka error while checking topic health: {str(ke)}")
            return False

    def check_broker_health(self):
        try:
            cluster_metadata = self.admin_client.list_topics(timeout=10)
            if not cluster_metadata.brokers:
                logger.error("No active brokers found")
                return False
            return True
        except KafkaException as ke:
            logger.error(f"Kafka error while checking broker health: {str(ke)}")
            return False
