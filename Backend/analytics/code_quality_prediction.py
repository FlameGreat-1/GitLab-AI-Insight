import subprocess
import json
from data.data_fetcher import DataFetcher
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import logging

logger = logging.getLogger(__name__)

class CodeQualityPredictor:
    def __init__(self):
        self.data_fetcher = DataFetcher()
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)

    def get_code_metrics(self, file_content):
        # Use pylint to get code metrics
        result = subprocess.run(['pylint', '--output-format=json', '-'], input=file_content, 
                                text=True, capture_output=True)
        return json.loads(result.stdout)

    def prepare_data(self):
        files = self.data_fetcher.fetch_repository_files()
        X, y = [], []
        for file in files:
            if file['name'].endswith('.py'):
                content = self.data_fetcher.fetch_file_content(file['path'])
                metrics = self.get_code_metrics(content)
                if metrics:
                    X.append({
                        'lines_of_code': metrics[0]['message-count'],
                        'error_count': sum(1 for m in metrics if m['type'] in ('error', 'warning', 'convention')),
                        'complexity': metrics[0].get('complexity', {}).get('average', 0)
                    })
                    y.append(10 - metrics[0]['score'])  # Convert pylint score to a "needs improvement" score
        return X, y

    def train_model(self):
        X, y = self.prepare_data()
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        self.model.fit(X_train, y_train)
        
        y_pred = self.model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        logger.info(f"Model trained. MSE: {mse}, R2: {r2}")
        
        joblib.dump(self.model, 'code_quality_model.joblib')
        logger.info("Model saved as code_quality_model.joblib")

    def predict_quality(self, file_content):
        metrics = self.get_code_metrics(file_content)
        if not metrics:
            return None
        
        X = [{
            'lines_of_code': metrics[0]['message-count'],
            'error_count': sum(1 for m in metrics if m['type'] in ('error', 'warning', 'convention')),
            'complexity': metrics[0].get('complexity', {}).get('average', 0)
        }]
        
        quality_score = self.model.predict(X)[0]
        return 10 - quality_score  # Convert back to a 0-10 scale where 10 is best

    def run_analysis(self):
        self.train_model()
        
        # Predict quality for a sample of files
        sample_files = self.data_fetcher.fetch_repository_files(limit=10)
        quality_predictions = {}
        for file in sample_files:
            if file['name'].endswith('.py'):
                content = self.data_fetcher.fetch_file_content(file['path'])
                quality = self.predict_quality(content)
                if quality is not None:
                    quality_predictions[file['path']] = quality
        
        logger.info(f"Predicted quality for {len(quality_predictions)} files")
        return quality_predictions
