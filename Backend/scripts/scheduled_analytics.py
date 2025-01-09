import schedule
import time
from advanced_analytics import run_advanced_analytics
import logging

logger = logging.getLogger(__name__)

def scheduled_analytics_job():
    logger.info("Starting scheduled advanced analytics job")
    run_advanced_analytics()

def start_scheduled_analytics(interval_hours=24):
    schedule.every(interval_hours).hours.do(scheduled_analytics_job)
    
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    start_scheduled_analytics()
