from data.data_fetcher import DataFetcher
from data.data_processor import DataProcessor
from models.issue_predictor import IssuePredictor
from models.mr_time_estimator import MRTimeEstimator
from models.commit_impact_predictor import CommitImpactPredictor
from Backend.config import MODEL_SAVE_PATH
import logging
import os

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def train_models():
    # Ensure model save directory exists
    os.makedirs(MODEL_SAVE_PATH, exist_ok=True)

    # Fetch data
    data_fetcher = DataFetcher()
    issues_df = data_fetcher.fetch_issues()
    mrs_df = data_fetcher.fetch_merge_requests()
    commits_df = data_fetcher.fetch_commits()

    # Process data
    data_processor = DataProcessor()
    processed_issues = data_processor.process_issues(issues_df)
    processed_mrs = data_processor.process_merge_requests(mrs_df)
    processed_commits = data_processor.process_commits(commits_df)

    # Train Issue Predictor
    issue_predictor = IssuePredictor()
    issue_predictor.train(processed_issues, target='state')
    issue_predictor.save(MODEL_SAVE_PATH)

    # Train MR Time Estimator
    mr_time_estimator = MRTimeEstimator()
    mr_time_estimator.train(processed_mrs, target='time_to_merge')
    mr_time_estimator.save(MODEL_SAVE_PATH)

    # Train Commit Impact Predictor
    # Assuming we have a 'impact_score' column in our commits data
    # This could be derived from various factors like number of files changed, lines added/deleted, etc.
    commit_impact_predictor = CommitImpactPredictor()
    commit_impact_predictor.train(processed_commits, target='impact_score')
    commit_impact_predictor.save(MODEL_SAVE_PATH)

if __name__ == "__main__":
    train_models()







""" 
Modify the train.py script to use Azure ML:




from utils.azure_ml import AzureMLManager

def train_models():
    azure_ml = AzureMLManager()
    
    # Train Issue Predictor
    azure_ml.train_model("issue_predictor", "train_issue_predictor.py", processed_issues)
    
    # Train MR Time Estimator
    azure_ml.train_model("mr_time_estimator", "train_mr_estimator.py", processed_mrs)
    
    # Train Commit Impact Predictor
    azure_ml.train_model("commit_impact_predictor", "train_commit_predictor.py", processed_commits)


"""

