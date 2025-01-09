from pyspark.sql import SparkSession
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import StructType, StructField, StringType, TimestampType
from Backend.config import config
import logging

logger = logging.getLogger(__name__)

class SparkStreamProcessor:
    def __init__(self):
        self.spark = SparkSession.builder \
            .appName(config.SPARK_APP_NAME) \
            .master(config.SPARK_MASTER) \
            .getOrCreate()

    def process_stream(self):
        # Define the schema for the GitLab events
        event_schema = StructType([
            StructField("type", StringType(), True),
            StructField("data", StringType(), True),
            StructField("timestamp", TimestampType(), True)
        ])

        # Create a streaming DataFrame representing the stream of input lines from Kafka
        df = self.spark \
            .readStream \
            .format("kafka") \
            .option("kafka.bootstrap.servers", config.KAFKA_BOOTSTRAP_SERVERS) \
            .option("subscribe", config.KAFKA_TOPIC) \
            .load()

        # Parse the JSON data
        parsed_df = df.select(from_json(col("value").cast("string"), event_schema).alias("event"))

        # Extract fields from the parsed data
        events_df = parsed_df.select(
            col("event.type").alias("event_type"),
            col("event.data").alias("event_data"),
            col("event.timestamp").alias("event_timestamp")
        )

        # Perform streaming analysis (example: count events by type in a 1-minute window)
        event_counts = events_df \
            .groupBy(
                events_df.event_type,
                F.window(events_df.event_timestamp, "1 minute")
            ) \
            .count()

        # Start the streaming query
        query = event_counts \
            .writeStream \
            .outputMode("complete") \
            .format("console") \
            .start()

        query.awaitTermination()

    def stop(self):
        self.spark.stop()


class SparkProcessor:
    def __init__(self):
        self.spark = SparkSession.builder \
            .appName(config.SPARK_APP_NAME) \
            .master(config.SPARK_MASTER) \
            .config("spark.executor.memory", config.SPARK_EXECUTOR_MEMORY) \
            .config("spark.executor.cores", config.SPARK_EXECUTOR_CORES) \
            .config("spark.executor.instances", config.SPARK_EXECUTOR_INSTANCES) \
            .getOrCreate()
