from abc import ABC, abstractmethod
import joblib
import optuna
from sklearn.model_selection import train_test_split
from utils.model_versioning import ModelVersioning
from sklearn.metrics import classification_report, roc_auc_score, mean_absolute_error
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class BaseModel(ABC):
    def __init__(self, name):
        self.name = name
        self.model = None
        self.preprocessor = None
        self.version = None
        self.versioning = ModelVersioning()


    @abstractmethod
    def create_preprocessor(self):
        pass

    @abstractmethod
    def create_model(self, trial):
        pass

    def prepare_data(self, df, target):
        X = df.drop(columns=[target])
        y = df[target]
        return train_test_split(X, y, test_size=0.2, random_state=42)

    def objective(self, trial, X_train, y_train, X_test, y_test):
        model = self.create_model(trial)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        return self.get_metric(y_test, y_pred)

    @abstractmethod
    def get_metric(self, y_true, y_pred):
        pass

    def train(self, df, target):
        X_train, X_test, y_train, y_test = self.prepare_data(df, target)
        self.preprocessor = self.create_preprocessor()
        
        X_train_processed = self.preprocessor.fit_transform(X_train)
        X_test_processed = self.preprocessor.transform(X_test)

        study = optuna.create_study(direction='maximize')
        study.optimize(lambda trial: self.objective(trial, X_train_processed, y_train, X_test_processed, y_test), n_trials=100)

        best_params = study.best_params
        logger.info(f"Best hyperparameters for {self.name}: {best_params}")

        self.model = self.create_model(best_params)
        self.model.fit(X_train_processed, y_train)

        y_pred = self.model.predict(X_test_processed)
        self.evaluate(y_test, y_pred)

    @abstractmethod
    def evaluate(self, y_true, y_pred):
        pass

    def save(self, path):
        joblib.dump({'model': self.model, 'preprocessor': self.preprocessor}, f"{path}/{self.name}.joblib")
        logger.info(f"Model {self.name} saved to {path}/{self.name}.joblib")

    def load(self, path):
        loaded = joblib.load(f"{path}/{self.name}.joblib")
        self.model = loaded['model']
        self.preprocessor = loaded['preprocessor']
        logger.info(f"Model {self.name} loaded from {path}/{self.name}.joblib")

    def predict(self, X):
        X_processed = self.preprocessor.transform(X)
        return self.model.predict(X_processed)
    
    def explain(self, X):
        explainer = shap.TreeExplainer(self.model)
        shap_values = explainer.shap_values(self.preprocessor.transform(X))
        return shap_values


    def save(self, path):
        performance_metric = self.get_metric(self.y_test, self.predict(self.X_test))
        self.version = self.versioning.new_version(self.name, performance_metric)
        joblib.dump({
            'model': self.model,
            'preprocessor': self.preprocessor,
            'version': self.version
        }, f"{path}/{self.name}_v{self.version}.joblib")
        logger.info(f"Model {self.name} version {self.version} saved to {path}/{self.name}_v{self.version}.joblib")


    def load(self, path):
        latest_version = self.versioning.get_latest_version(self.name)
        if latest_version is None:
            raise ValueError(f"No saved model found for {self.name}")
        
        loaded = joblib.load(f"{path}/{self.name}_v{latest_version}.joblib")
        self.model = loaded['model']
        self.preprocessor = loaded['preprocessor']
        self.version = loaded['version']
        logger.info(f"Model {self.name} version {self.version} loaded from {path}/{self.name}_v{self.version}.joblib")

