


import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # LSTM model parameters
    LOOKBACK = 60
    LSTM_UNITS = 50
    DROPOUT_RATE = 0.2
    BATCH_SIZE = 32
    EPOCHS = 100

    DATABASE_URL = os.getenv('DATABASE_URL')
    GITLAB_TOKEN = os.getenv('GITLAB_TOKEN')
    GITLAB_URL = os.getenv('GITLAB_URL', 'https://gitlab.com')

    # Data parameters
    DATA_FILE = os.getenv('DATA_FILE', 'your_timeseries_data.csv')

    # MLflow parameters
    MLFLOW_TRACKING_URI = os.getenv('MLFLOW_TRACKING_URI', 'http://localhost:5000')
    MLFLOW_EXPERIMENT_NAME = os.getenv('MLFLOW_EXPERIMENT_NAME', 'GitLab_Insight_AI_LSTM_Advanced')

    # Model persistence
    MODEL_SAVE_PATH = os.getenv('MODEL_SAVE_PATH', 'saved_models')

    # API parameters
    API_HOST = os.getenv('API_HOST', '0.0.0.0')
    API_PORT = int(os.getenv('API_PORT', 8000))

     # Kafka configurations
    KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
    KAFKA_TOPIC = os.getenv('KAFKA_TOPIC', 'gitlab_events')

    # Spark configurations
    SPARK_MASTER = os.getenv('SPARK_MASTER', 'local[*]')
    SPARK_APP_NAME = os.getenv('SPARK_APP_NAME', 'GitLabInsightAI')
    # Spark configurations for scalability
    SPARK_EXECUTOR_MEMORY = os.getenv('SPARK_EXECUTOR_MEMORY', '4g')
    SPARK_EXECUTOR_CORES = int(os.getenv('SPARK_EXECUTOR_CORES', '2'))
    SPARK_EXECUTOR_INSTANCES = int(os.getenv('SPARK_EXECUTOR_INSTANCES', '2'))

    # Kafka security configurations
    KAFKA_SECURITY_PROTOCOL = os.getenv('KAFKA_SECURITY_PROTOCOL', 'SASL_SSL')
    KAFKA_SASL_MECHANISM = os.getenv('KAFKA_SASL_MECHANISM', 'PLAIN')
    KAFKA_SASL_USERNAME = os.getenv('KAFKA_SASL_USERNAME', 'your-username')
    KAFKA_SASL_PASSWORD = os.getenv('KAFKA_SASL_PASSWORD', 'your-password')




config = Config()
