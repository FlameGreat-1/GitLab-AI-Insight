import numpy as np
from sklearn.metrics import mean_squared_error
import logging
from ml_models.lstm_model import GitLabInsightLSTMAdvanced
from data.data_fetcher import DataFetcher
from Backend.config import config

class PerformanceMonitor:
    def __init__(self, model, threshold=0.1):
        self.model = model
        self.threshold = threshold
        self.logger = logging.getLogger(__name__)

    def check_performance(self):
        try:
            # Fetch recent data
            data_fetcher = DataFetcher()
            recent_data = data_fetcher.fetch_recent_data()

            # Preprocess data
            X, y = self.model.preprocess_data(recent_data)

            # Make predictions
            predictions = self.model.predict_sequence(X[0], len(y))

            # Calculate RMSE
            rmse = np.sqrt(mean_squared_error(y, predictions))

            # Check if RMSE exceeds threshold
            if rmse > self.threshold:
                self.alert(f"Model performance degraded. RMSE: {rmse}")
            else:
                self.logger.info(f"Model performance is good. RMSE: {rmse}")

        except Exception as e:
            self.logger.error(f"Error in performance check: {str(e)}")

    def alert(self, message):
        # In a real-world scenario, this could send an email, Slack message, etc.
        self.logger.warning(f"ALERT: {message}")

def start_monitoring(interval_hours=1):
    model = GitLabInsightLSTMAdvanced(lookback=config.LOOKBACK)
    model.load_model(config.MODEL_SAVE_PATH)
    monitor = PerformanceMonitor(model)

    schedule.every(interval_hours).hours.do(monitor.check_performance)
    
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    start_monitoring()
