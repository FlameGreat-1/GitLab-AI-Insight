import schedule
import time
from data.data_fetcher import DataFetcher
from data.data_processor import DataProcessor
from models.issue_predictor import IssuePredictor
from models.mr_time_estimator import MRTimeEstimator
from models.commit_impact_predictor import CommitImpactPredictor
from Backend.config import MODEL_SAVE_PATH, PERFORMANCE_THRESHOLD

def check_and_retrain():
    data_fetcher = DataFetcher()
    data_processor = DataProcessor()

    # Check and retrain Issue Predictor
    issues_df = data_fetcher.fetch_issues()
    processed_issues = data_processor.process_issues(issues_df)
    issue_predictor = IssuePredictor()
    issue_predictor.load(MODEL_SAVE_PATH)
    current_performance = issue_predictor.get_metric(processed_issues['state'], issue_predictor.predict(processed_issues.drop('state', axis=1)))
    
    if current_performance < PERFORMANCE_THRESHOLD:
        issue_predictor.train(processed_issues, target='state')
        issue_predictor.save(MODEL_SAVE_PATH)

    # Repeat similar process for MR Time Estimator and Commit Impact Predictor
    # ...

def start_monitoring(interval_hours=24):
    schedule.every(interval_hours).hours.do(check_and_retrain)
    
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    start_monitoring()
