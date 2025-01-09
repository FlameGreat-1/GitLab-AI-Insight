import pandas as pd
import numpy as np
from utils.preprocessing import preprocess_text

class DataProcessor:
    @staticmethod
    def process_issues(df):
        df['title'] = df['title'].apply(preprocess_text)
        df['description'] = df['description'].apply(preprocess_text)
        df['title_length'] = df['title'].apply(len)
        df['description_length'] = df['description'].apply(len)
        df['time_to_update'] = (df['updated_at'] - df['created_at']).dt.total_seconds() / 3600
        df['day_of_week'] = df['created_at'].dt.dayofweek
        df['month'] = df['created_at'].dt.month
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        return df

    @staticmethod
    def process_merge_requests(df):
        df['title'] = df['title'].apply(preprocess_text)
        df['description'] = df['description'].apply(preprocess_text)
        df['title_length'] = df['title'].apply(len)
        df['description_length'] = df['description'].apply(len)
        df['time_to_merge'] = (df['merged_at'] - df['created_at']).dt.total_seconds() / 3600
        df['day_of_week'] = df['created_at'].dt.dayofweek
        df['month'] = df['created_at'].dt.month
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        return df

    @staticmethod
    def process_commits(df):
        df['message'] = df['message'].apply(preprocess_text)
        df['message_length'] = df['message'].apply(len)
        df['time_to_commit'] = (df['committed_date'] - df['authored_date']).dt.total_seconds() / 3600
        df['day_of_week'] = df['authored_date'].dt.dayofweek
        df['month'] = df['authored_date'].dt.month
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        return df


from spark.spark_processor import SparkProcessor
from data.kafka_consumer import GitLabEventConsumer
import logging

logger = logging.getLogger(__name__)

class DataProcessor:
    def __init__(self):
        self.consumer = GitLabEventConsumer('gitlab_processor')
        self.spark_processor = SparkProcessor()

    def process_events(self):
        # Consume events from Kafka
        events = self.consumer.consume_events()

        # Process events using Spark
        df = self.spark_processor.spark.createDataFrame(events)
        self.spark_processor.process_batch(df)

    def close(self):
        self.consumer.close()
        self.spark_processor.stop()
