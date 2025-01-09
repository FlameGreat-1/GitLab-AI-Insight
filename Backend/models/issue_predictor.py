from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from lightgbm import LGBMClassifier
from .base_model import BaseModel
from sklearn.metrics import classification_report, roc_auc_score
import logging

logger = logging.getLogger(__name__)

class IssuePredictor(BaseModel):
    def __init__(self):
        super().__init__("issue_predictor")

    def create_preprocessor(self):
        numeric_features = ['title_length', 'description_length', 'time_to_update', 'commit_count', 'mr_count']
        categorical_features = ['day_of_week', 'month', 'is_weekend']
        text_features = ['title', 'description']

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
                ('text_title', text_transformer, ['title']),
                ('text_desc', text_transformer, ['description'])
            ])

        return preprocessor

    def create_model(self, trial):
        return LGBMClassifier(
            n_estimators=trial.suggest_int('n_estimators', 100, 1000),
            max_depth=trial.suggest_int('max_depth', 3, 10),
            learning_rate=trial.suggest_loguniform('learning_rate', 1e-3, 1.0),
            num_leaves=trial.suggest_int('num_leaves', 20, 100),
            min_child_samples=trial.suggest_int('min_child_samples', 1, 100),
            random_state=42
        )

    def get_metric(self, y_true, y_pred):
        return roc_auc_score(y_true, y_pred)

    def evaluate(self, y_true, y_pred):
        logger.info("\nClassification Report for Issue Predictor:")
        logger.info(classification_report(y_true, y_pred))
        logger.info(f"ROC AUC Score: {roc_auc_score(y_true, y_pred)}")
