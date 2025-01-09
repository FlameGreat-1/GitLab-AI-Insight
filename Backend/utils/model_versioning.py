import os
import json
from datetime import datetime

class ModelVersioning:
    def __init__(self, version_file='model_versions.json'):
        self.version_file = version_file
        self.versions = self._load_versions()

    def _load_versions(self):
        if os.path.exists(self.version_file):
            with open(self.version_file, 'r') as f:
                return json.load(f)
        return {}

    def _save_versions(self):
        with open(self.version_file, 'w') as f:
            json.dump(self.versions, f, indent=2)

    def new_version(self, model_name, performance_metric):
        if model_name not in self.versions:
            self.versions[model_name] = []
        
        version = len(self.versions[model_name]) + 1
        self.versions[model_name].append({
            'version': version,
            'timestamp': datetime.now().isoformat(),
            'performance_metric': performance_metric
        })
        self._save_versions()
        return version

    def get_latest_version(self, model_name):
        if model_name in self.versions and self.versions[model_name]:
            return self.versions[model_name][-1]['version']
        return None
