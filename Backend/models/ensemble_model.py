import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from lightgbm import LGBMClassifier
from xgboost import XGBClassifier
from sklearn.ensemble import VotingClassifier, StackingClassifier
from sklearn.metrics import classification_report, roc_auc_score
import mlflow
import mlflow.sklearn

# Set up MLflow
mlflow.set_experiment("GitLab_Insight_AI_Ensemble")

class GitLabInsightEnsemble:
    def __init__(self):
        self.ensemble_model = None
        self.feature_names = None

    def preprocess_data(self, df):
        # Assume df is a pandas DataFrame with features and target
        # Separate features and target
        X = df.drop('target', axis=1)
        y = df['target']

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Define preprocessing steps
        numeric_features = X.select_dtypes(include=['int64', 'float64']).columns
        categorical_features = X.select_dtypes(include=['object', 'bool']).columns

        numeric_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])

        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
            ('onehot', OneHotEncoder(handle_unknown='ignore'))
        ])

        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_features),
                ('cat', categorical_transformer, categorical_features)
            ])

        # Fit preprocessor
        X_train_processed = preprocessor.fit_transform(X_train)
        X_test_processed = preprocessor.transform(X_test)

        self.feature_names = (numeric_features.tolist() + 
                              preprocessor.named_transformers_['cat']
                              .named_steps['onehot']
                              .get_feature_names(categorical_features).tolist())

        return X_train_processed, X_test_processed, y_train, y_test

    def build_ensemble(self):
        # Define base models
        rf = RandomForestClassifier(n_estimators=100, random_state=42)
        gb = GradientBoostingClassifier(n_estimators=100, random_state=42)
        lgbm = LGBMClassifier(n_estimators=100, random_state=42)
        xgb = XGBClassifier(n_estimators=100, random_state=42)

        # Create voting classifier
        voting_clf = VotingClassifier(
            estimators=[('rf', rf), ('gb', gb), ('lgbm', lgbm), ('xgb', xgb)],
            voting='soft'
        )

        # Create stacking classifier
        stacking_clf = StackingClassifier(
            estimators=[('rf', rf), ('gb', gb), ('lgbm', lgbm)],
            final_estimator=xgb,
            cv=5
        )

        # Final ensemble combining voting and stacking
        self.ensemble_model = VotingClassifier(
            estimators=[('voting', voting_clf), ('stacking', stacking_clf)],
            voting='soft'
        )

    def train_and_evaluate(self, X_train, X_test, y_train, y_test):
        with mlflow.start_run():
            # Log parameters
            mlflow.log_param("model_type", "Ensemble (Voting + Stacking)")
            
            # Train the model
            self.ensemble_model.fit(X_train, y_train)
            
            # Make predictions
            y_pred = self.ensemble_model.predict(X_test)
            y_prob = self.ensemble_model.predict_proba(X_test)[:, 1]
            
            # Calculate metrics
            accuracy = self.ensemble_model.score(X_test, y_test)
            roc_auc = roc_auc_score(y_test, y_prob)
            
            # Log metrics
            mlflow.log_metric("accuracy", accuracy)
            mlflow.log_metric("roc_auc", roc_auc)
            
            # Log model
            mlflow.sklearn.log_model(self.ensemble_model, "ensemble_model")
            
            # Log feature importance
            feature_importance = self.get_feature_importance()
            for feature, importance in feature_importance.items():
                mlflow.log_metric(f"feature_importance_{feature}", importance)
            
            # Print classification report
            print(classification_report(y_test, y_pred))
            print(f"ROC AUC Score: {roc_auc}")

    def get_feature_importance(self):
        # Get feature importance from the Random Forest model in the voting classifier
        rf_model = self.ensemble_model.named_estimators_['voting'].named_estimators_['rf']
        importance = rf_model.feature_importances_
        feature_importance = dict(zip(self.feature_names, importance))
        return dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))

    def predict(self, X):
        return self.ensemble_model.predict(X)

    def predict_proba(self, X):
        return self.ensemble_model.predict_proba(X)

# Usage
if __name__ == "__main__":
    # Load your data
    df = pd.read_csv("your_data.csv")
    
    # Initialize and use the ensemble
    ensemble = GitLabInsightEnsemble()
    X_train, X_test, y_train, y_test = ensemble.preprocess_data(df)
    ensemble.build_ensemble()
    ensemble.train_and_evaluate(X_train, X_test, y_train, y_test)

    # Make predictions on new data
    new_data = pd.read_csv("new_data.csv")
    predictions = ensemble.predict(new_data)
    probabilities = ensemble.predict_proba(new_data)
