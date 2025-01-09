import json
from datetime import datetime

class AnalyticsResultStorage:
    def __init__(self, file_path='analytics_results.json'):
        self.file_path = file_path

    def save_results(self, results):
        timestamp = datetime.now().isoformat()
        data = {
            'timestamp': timestamp,
            'results': results
        }
        with open(self.file_path, 'w') as f:
            json.dump(data, f)

    def get_latest_results(self):
        try:
            with open(self.file_path, 'r') as f:
                data = json.load(f)
            return data
        except FileNotFoundError:
            return None
