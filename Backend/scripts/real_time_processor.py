from spark.spark_streaming import SparkStreamProcessor
import logging

logger = logging.getLogger(__name__)

def start_real_time_processing():
    processor = SparkStreamProcessor()
    try:
        logger.info("Starting real-time processing...")
        processor.process_stream()
    except KeyboardInterrupt:
        logger.info("Stopping real-time processing...")
    finally:
        processor.stop()

if __name__ == "__main__":
    start_real_time_processing()
