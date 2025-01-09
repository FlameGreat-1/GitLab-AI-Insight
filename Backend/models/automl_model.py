import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
from tpot import TPOTClassifier
import mlflow
import mlflow.sklearn

mlflow.set_experiment("GitLab_Insight_AI_AutoML")

class GitLabInsightAutoML:
    def __init__(self, generations=100, population_size=100, cv=5, random_state=42):
        self.tpot = TPOTClassifier(generations=generations,
                                   population_size=population_size,
                                   cv=cv,
                                   random_state=random_state,
                                   verbosity=2,
                                   scoring='roc_auc')
        self.best_model = None

    def preprocess_data(self, df):
        # Assume df is a pandas DataFrame with features and target
        X = df.drop('target', axis=1)
        y = df['target']
        return train_test_split(X, y, test_size=0.2, random_state=42)

    def train_and_evaluate(self, X_train, X_test, y_train, y_test):
        with mlflow.start_run():
            # Log parameters
            mlflow.log_param("model_type", "TPOT AutoML")
            mlflow.log_param("generations", self.tpot.generations)
            mlflow.log_param("population_size", self.tpot.population_size)
            mlflow.log_param("cv", self.tpot.cv)
            
            # Fit TPOT
            self.tpot.fit(X_train, y_train)
            
            # Get the best model
            self.best_model = self.tpot.fitted_pipeline_
            
            # Make predictions
            y_pred = self.best_model.predict(X_test)
            y_prob = self.best_model.predict_proba(X_test)[:, 1]
            
            # Calculate metrics
            accuracy = self.best_model.score(X_test, y_test)
            roc_auc = roc_auc_score(y_test, y_prob)
            
            # Log metrics
            mlflow.log_metric("accuracy", accuracy)
            mlflow.log_metric("roc_auc", roc_auc)
            
            # Log best model
            mlflow.sklearn.log_model(self.best_model, "best_model")
            
            # Log feature importance if available
            if hasattr(self.best_model, 'feature_importances_'):
                feature_importance = dict(zip(X_train.columns, self.best_model.feature_importances_))
                for feature, importance in feature_importance.items():
                    mlflow.log_metric(f"feature_importance_{feature}", importance)
            
            # Print results
            print("Best pipeline:", self.tpot.fitted_pipeline_)
            print(f"Accuracy on test set: {accuracy}")
            print(f"ROC AUC Score: {roc_auc}")

    def predict(self, X):
        return self.best_model.predict(X)

    def predict_proba(self, X):
        return self.best_model.predict_proba(X)

# Usage
if __name__ == "__main__":
    # Load your data
    df = pd.read_csv("your_data.csv")
    
    # Initialize and use AutoML
    automl = GitLabInsightAutoML()
    X_train, X_test, y_train, y_test = automl.preprocess_data(df)
    automl.train_and_evaluate(X_train, X_test, y_train, y_test)

    # Make predictions on new data
    new_data = pd.read_csv("new_data.csv")
    predictions = automl.predict(new_data)
    probabilities = automl.predict_proba(new_data)
