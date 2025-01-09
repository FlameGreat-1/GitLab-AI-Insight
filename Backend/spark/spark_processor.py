from pyspark.sql import SparkSession
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import StructType, StructField, StringType, TimestampType
from Backend.config import config
import logging

logger = logging.getLogger(__name__)

class SparkProcessor:
    def __init__(self):
        self.spark = SparkSession.builder \
            .appName(config.SPARK_APP_NAME) \
            .master(config.SPARK_MASTER) \
            .getOrCreate()

    def process_batch(self, df):
        # Define the schema for the GitLab events
        event_schema = StructType([
            StructField("type", StringType(), True),
            StructField("data", StringType(), True),
            StructField("timestamp", TimestampType(), True)
        ])

        # Parse the JSON data
        parsed_df = df.select(from_json(col("value").cast("string"), event_schema).alias("event"))

        # Extract fields from the parsed data
        events_df = parsed_df.select(
            col("event.type").alias("event_type"),
            col("event.data").alias("event_data"),
            col("event.timestamp").alias("event_timestamp")
        )

     # Apply validation
        validated_df = events_df.filter(self.validate_event(col("event_type"), col("event_data")))


        # Perform analysis (example: count events by type)
        event_counts = events_df.groupBy("event_type").count()

        # Show results
        event_counts.show()

        # You can add more complex analysis here

    @staticmethod
    @udf(returnType=BooleanType())
    def validate_event(event_type, event_data):
        # Implement your validation logic here
        if event_type not in ['issue', 'merge_request', 'commit']:
            return False
        if not event_data or not isinstance(event_data, dict):
            return False
        return True

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
