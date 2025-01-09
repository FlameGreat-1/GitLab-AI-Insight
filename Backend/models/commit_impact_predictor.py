from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from lightgbm import LGBMRegressor
from .base_model import BaseModel
from sklearn.metrics import mean_absolute_error, mean_squared_error
import numpy as np
import logging

logger = logging.getLogger(__name__)

class CommitImpactPredictor(BaseModel):
    def __init__(self):
        super().__init__("commit_impact_predictor")

    def create_preprocessor(self):
        numeric_features = ['message_length', 'time_to_commit', 'related_mr_count', 'related_issue_count']
        categorical_features = ['day_of_week', 'month', 'is_weekend']
        text_features = ['message']

        numeric_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])

        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
            ('onehot', OneHotEncoder(handle_unknown='ignore'))
        ])

        text_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='constant', fill_value='')),
            ('tfidf', TfidfVectorizer(max_features=1000, stop_words='english'))
        ])

        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_features),
                ('cat', categorical_transformer, categorical_features),
                ('text', text_transformer, text_features)
            ])

        return preprocessor

    def create_model(self, trial):
        return LGBMRegressor(
            n_estimators=trial.suggest_int('n_estimators', 100, 1000),
            max_depth=trial.suggest_int('max_depth', 3, 10),
            learning_rate=trial.suggest_loguniform('learning_rate', 1e-3, 1.0),
            num_leaves=trial.suggest_int('num_leaves', 20, 100),
            min_child_samples=trial.suggest_int('min_child_samples', 1, 100),
            random_state=42
        )

    def get_metric(self, y_true, y_pred):
        return -mean_absolute_error(y_true, y_pred)  # Negative because Optuna maximizes

    def evaluate(self, y_true, y_pred):
        mae = mean_absolute_error(y_true, y_pred)
        mse = mean_squared_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        logger.info("\nEvaluation Metrics for Commit Impact Predictor:")
        logger.info(f"Mean Absolute Error: {mae}")
        logger.info(f"Mean Squared Error: {mse}")
        logger.info(f"Root Mean Squared Error: {rmse}")
