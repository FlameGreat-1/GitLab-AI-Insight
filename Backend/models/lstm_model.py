import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.metrics import mean_squared_error, mean_absolute_error
from sklearn.model_selection import RandomizedSearchCV
from keras.wrappers.scikit_learn import KerasRegressor
import matplotlib.pyplot as plt
import mlflow
import mlflow.keras
from pyod.models.iforest import IForest

mlflow.set_experiment("GitLab_Insight_AI_LSTM_Advanced")

class GitLabInsightLSTMAdvanced:
    def __init__(self, lookback=60):
        self.lookback = lookback
        self.model = None
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.anomaly_detector = IForest(contamination=0.1, random_state=42)

    def create_dataset(self, dataset, lookback=60):
        X, y = [], []
        for i in range(len(dataset) - lookback):
            feature = dataset[i:i+lookback]
            target = dataset[i+lookback]
            X.append(feature)
            y.append(target)
        return np.array(X), np.array(y)

    def add_time_features(self, df):
        df['day_of_week'] = df['date'].dt.dayofweek
        df['month'] = df['date'].dt.month
        df['quarter'] = df['date'].dt.quarter
        df['year'] = df['date'].dt.year
        return df

    def preprocess_data(self, df):
        # Assume df is a pandas DataFrame with a 'date' column and a target column
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        df = self.add_time_features(df)

        features = ['target', 'day_of_week', 'month', 'quarter', 'year']
        values = df[features].values
        scaled_values = self.scaler.fit_transform(values)
        
        X, y = self.create_dataset(scaled_values, self.lookback)
        
        train_size = int(len(X) * 0.8)
        X_train, X_test = X[:train_size], X[train_size:]
        y_train, y_test = y[:train_size, 0], y[train_size:, 0]  # Only predict the target variable
        
        return X_train, X_test, y_train, y_test

    def build_model(self, input_shape):
        model = Sequential([
            LSTM(units=50, return_sequences=True, input_shape=input_shape),
            Dropout(0.2),
            LSTM(units=50, return_sequences=True),
            Dropout(0.2),
            LSTM(units=50),
            Dropout(0.2),
            Dense(units=1)
        ])
        model.compile(optimizer=Adam(), loss='mean_squared_error')
        return model

    def create_model(self, lstm_units=50, dropout_rate=0.2):
        model = Sequential([
            LSTM(units=lstm_units, return_sequences=True, input_shape=(self.lookback, 5)),
            Dropout(dropout_rate),
            LSTM(units=lstm_units, return_sequences=True),
            Dropout(dropout_rate),
            LSTM(units=lstm_units),
            Dropout(dropout_rate),
            Dense(units=1)
        ])
        model.compile(optimizer=Adam(), loss='mean_squared_error')
        return model

    def hyperparameter_tuning(self, X_train, y_train):
        model = KerasRegressor(build_fn=self.create_model, verbose=0)
        
        param_dist = {
            'lstm_units': [30, 50, 70, 100],
            'dropout_rate': [0.1, 0.2, 0.3],
            'batch_size': [16, 32, 64],
            'epochs': [50, 100, 150]
        }
        
        random_search = RandomizedSearchCV(estimator=model, param_distributions=param_dist, 
                                           n_iter=10, cv=3, verbose=2, random_state=42, n_jobs=-1)
        
        random_search_result = random_search.fit(X_train, y_train)
        return random_search_result.best_params_

    def train_and_evaluate(self, X_train, X_test, y_train, y_test, epochs=100, batch_size=32):
        with mlflow.start_run():
            # Hyperparameter tuning
            best_params = self.hyperparameter_tuning(X_train, y_train)
            mlflow.log_params(best_params)
            
            # Build and train the model with best parameters
            self.model = self.create_model(lstm_units=best_params['lstm_units'], 
                                           dropout_rate=best_params['dropout_rate'])
            
            early_stopping = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
            
            history = self.model.fit(
                X_train, y_train,
                epochs=best_params['epochs'],
                batch_size=best_params['batch_size'],
                validation_split=0.1,
                callbacks=[early_stopping],
                verbose=1
            )
            
            # Evaluate the model
            train_loss = self.model.evaluate(X_train, y_train, verbose=0)
            test_loss = self.model.evaluate(X_test, y_test, verbose=0)
            
            # Make predictions
            train_predict = self.model.predict(X_train)
            test_predict = self.model.predict(X_test)
            
            # Inverse transform predictions (only for the target variable)
            train_predict = self.scaler.inverse_transform(np.concatenate([train_predict, np.zeros((len(train_predict), 4))], axis=1))[:, 0]
            y_train_inv = self.scaler.inverse_transform(np.concatenate([y_train.reshape(-1, 1), np.zeros((len(y_train), 4))], axis=1))[:, 0]
            test_predict = self.scaler.inverse_transform(np.concatenate([test_predict, np.zeros((len(test_predict), 4))], axis=1))[:, 0]
            y_test_inv = self.scaler.inverse_transform(np.concatenate([y_test.reshape(-1, 1), np.zeros((len(y_test), 4))], axis=1))[:, 0]
            
            # Calculate RMSE and MAE
            train_rmse = np.sqrt(mean_squared_error(y_train_inv, train_predict))
            test_rmse = np.sqrt(mean_squared_error(y_test_inv, test_predict))
            train_mae = mean_absolute_error(y_train_inv, train_predict)
            test_mae = mean_absolute_error(y_test_inv, test_predict)
            
            # Log metrics
            mlflow.log_metric("train_loss", train_loss)
            mlflow.log_metric("test_loss", test_loss)
            mlflow.log_metric("train_rmse", train_rmse)
            mlflow.log_metric("test_rmse", test_rmse)
            mlflow.log_metric("train_mae", train_mae)
            mlflow.log_metric("test_mae", test_mae)
            
            # Log model
            mlflow.keras.log_model(self.model, "lstm_model")
            
            # Plot training history
            plt.figure(figsize=(10, 6))
            plt.plot(history.history['loss'], label='Train Loss')
            plt.plot(history.history['val_loss'], label='Validation Loss')
            plt.title('Model Training History')
            plt.ylabel('Loss')
            plt.xlabel('Epoch')
            plt.legend()
            plt.savefig("training_history.png")
            mlflow.log_artifact("training_history.png")
            
            # Plot predictions
            plt.figure(figsize=(10, 6))
            plt.plot(y_test_inv, label='Actual')
            plt.plot(test_predict, label='Predicted')
            plt.title('LSTM Predictions vs Actual')
            plt.ylabel('Value')
            plt.xlabel('Time Step')
            plt.legend()
            plt.savefig("predictions.png")
            mlflow.log_artifact("predictions.png")
            
            # Anomaly detection
            self.anomaly_detector.fit(y_test_inv.reshape(-1, 1))
            anomaly_labels = self.anomaly_detector.labels_
            anomaly_scores = self.anomaly_detector.decision_scores_
            
            # Plot anomalies
            plt.figure(figsize=(10, 6))
            plt.plot(y_test_inv, label='Actual')
            plt.scatter(np.where(anomaly_labels == 1)[0], y_test_inv[anomaly_labels == 1], color='red', label='Anomaly')
            plt.title('Anomaly Detection in GitLab Activities')
            plt.ylabel('Value')
            plt.xlabel('Time Step')
            plt.legend()
            plt.savefig("anomalies.png")
            mlflow.log_artifact("anomalies.png")
            
            # Log anomaly detection results
            mlflow.log_metric("num_anomalies", np.sum(anomaly_labels))
            mlflow.log_metric("anomaly_ratio", np.mean(anomaly_labels))
            
            # Print results
            print(f"Train Loss: {train_loss}")
            print(f"Test Loss: {test_loss}")
            print(f"Train RMSE: {train_rmse}")
            print(f"Test RMSE: {test_rmse}")
            print(f"Train MAE: {train_mae}")
            print(f"Test MAE: {test_mae}")
            print(f"Number of anomalies detected: {np.sum(anomaly_labels)}")
            print(f"Anomaly ratio: {np.mean(anomaly_labels):.2%}")

    def predict(self, X):
        # Ensure X is in the correct shape
        X = np.array(X).reshape((1, self.lookback, 5))
        
        # Make prediction
        prediction = self.model.predict(X)
        
        # Inverse transform the prediction
        return self.scaler.inverse_transform(np.concatenate([prediction, np.zeros((len(prediction), 4))], axis=1))[0, 0]

    def predict_sequence(self, start_sequence, n_future_steps):
        """
        Predict a sequence of future values
        
        :param start_sequence: The initial sequence to start predictions from
        :param n_future_steps: Number of future steps to predict
        :return: Array of predicted values
        """
        curr_sequence = start_sequence[-self.lookback:].reshape((1, self.lookback, 5))
        predicted_values = []

        for _ in range(n_future_steps):
            predicted_value = self.model.predict(curr_sequence)[0]
            predicted_values.append(predicted_value)
            curr_sequence = np.roll(curr_sequence, -1, axis=1)
            curr_sequence[0, -1, 0] = predicted_value
            # Update time features for the next step
            curr_sequence[0, -1, 1:] = self.get_next_time_features(curr_sequence[0, -2, 1:])

        return self.scaler.inverse_transform(np.concatenate([np.array(predicted_values), np.zeros((len(predicted_values), 4))], axis=1))[:, 0]

    def get_next_time_features(self, current_features):
        # Implement logic to get the next time step's features
        # This is a simplified version and may need to be adjusted based on your specific requirements
        day_of_week = (current_features[0] + 1) % 7
        month = current_features[1]
        quarter = current_features[2]
        year = current_features[3]
        
        if day_of_week == 0:  # New month
            month = (month % 12) + 1
            if month == 1:  # New year
                year += 1
            quarter = ((month - 1) // 3) + 1
        
        return np.array([day_of_week, month, quarter, year])

    def detect_anomalies(self, data):
        """
        Detect anomalies in the given data
        
        :param data: Array of values to check for anomalies
        :return: Boolean array indicating anomalies (True) and normal points (False)
        """
        return self.anomaly_detector.predict(data.reshape(-1, 1))
    
    def save_model(self, path):
        os.makedirs(path, exist_ok=True)
        self.model.save(os.path.join(path, 'lstm_model.h5'))
        joblib.dump(self.scaler, os.path.join(path, 'scaler.joblib'))
        joblib.dump(self.anomaly_detector, os.path.join(path, 'anomaly_detector.joblib'))
        self.logger.info(f"Model saved to {path}")

    def load_model(self, path):
        self.model = load_model(os.path.join(path, 'lstm_model.h5'))
        self.scaler = joblib.load(os.path.join(path, 'scaler.joblib'))
        self.anomaly_detector = joblib.load(os.path.join(path, 'anomaly_detector.joblib'))
        self.logger.info(f"Model loaded from {path}")


# Usage
if __name__ == "__main__":
    # Load your time series data
    df = pd.read_csv("your_timeseries_data.csv")
    df['date'] = pd.to_datetime(df['date'])

    # Initialize and use LSTM model
    lstm_model = GitLabInsightLSTMAdvanced(lookback=60)
    X_train, X_test, y_train, y_test = lstm_model.preprocess_data(df)
    
    # Train and evaluate the model
    lstm_model.train_and_evaluate(X_train, X_test, y_train, y_test)

    # Make a single prediction
    last_sequence = X_test[-1]
    next_value_prediction = lstm_model.predict(last_sequence)
    print(f"Next value prediction: {next_value_prediction}")

    # Predict future sequence
    future_sequence = lstm_model.predict_sequence(last_sequence, n_future_steps=30)
    print(f"Future sequence prediction: {future_sequence}")

    # Detect anomalies in the test set
    y_test_inv = lstm_model.scaler.inverse_transform(np.concatenate([y_test.reshape(-1, 1), np.zeros((len(y_test), 4))], axis=1))[:, 0]
    anomalies = lstm_model.detect_anomalies(y_test_inv)
    print(f"Number of anomalies detected: {np.sum(anomalies)}")
    print(f"Anomaly ratio: {np.mean(anomalies):.2%}")

    # Visualize anomalies
    plt.figure(figsize=(12, 6))
    plt.plot(y_test_inv, label='Actual')
    plt.scatter(np.where(anomalies)[0], y_test_inv[anomalies], color='red', label='Anomaly')
    plt.title('Anomalies in GitLab Activities')
    plt.xlabel('Time Step')
    plt.ylabel('Activity Value')
    plt.legend()
    plt.show()

    # Example of how to use the model for ongoing monitoring
    def monitor_gitlab_activity(new_data):
        # Preprocess new data
        new_data = lstm_model.add_time_features(new_data)
        new_data_scaled = lstm_model.scaler.transform(new_data[['target', 'day_of_week', 'month', 'quarter', 'year']].values)
        
        # Make prediction
        prediction = lstm_model.predict(new_data_scaled[-lstm_model.lookback:])
        
        # Check for anomaly
        is_anomaly = lstm_model.detect_anomalies(np.array([prediction]))[0]
        
        if is_anomaly:
            print(f"ALERT: Anomaly detected! Predicted value: {prediction}")
        else:
            print(f"Normal activity. Predicted value: {prediction}")

    # Simulate new incoming data
    new_data = df.iloc[-lstm_model.lookback:].copy()
    new_data['date'] = pd.date_range(start=new_data['date'].iloc[-1] + pd.Timedelta(days=1), periods=1, freq='D')
    new_data['target'] = np.random.rand() * 100  # Replace with actual new data

    monitor_gitlab_activity(new_data)

