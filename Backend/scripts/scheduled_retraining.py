import schedule
import time
from ml_models.lstm_model import GitLabInsightLSTMAdvanced
from data.data_fetcher import DataFetcher
from Backend.config import config

def retrain_model():
    logger = logging.getLogger(__name__)
    logger.info("Starting scheduled model retraining")

    try:
        # Fetch new data
        data_fetcher = DataFetcher()
        new_data = data_fetcher.fetch_latest_data()

        # Load existing model
        model = GitLabInsightLSTMAdvanced(lookback=config.LOOKBACK)
        model.load_model(config.MODEL_SAVE_PATH)

        # Retrain model
        X_train, X_test, y_train, y_test = model.preprocess_data(new_data)
        model.train_and_evaluate(X_train, X_test, y_train, y_test, 
                                 epochs=config.EPOCHS, batch_size=config.BATCH_SIZE)

        # Save updated model
        model.save_model(config.MODEL_SAVE_PATH)

        logger.info("Model retraining completed successfully")
    except Exception as e:
        logger.error(f"Error during model retraining: {str(e)}")

def start_scheduled_retraining(interval_hours=24):
    schedule.every(interval_hours).hours.do(retrain_model)
    
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    start_scheduled_retraining()
