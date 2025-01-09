from azureml.core import Workspace, Experiment, Environment, ScriptRunConfig
from azureml.core.model import Model
from azureml.core.webservice import AciWebservice, Webservice

class AzureMLManager:
    def __init__(self):
        self.workspace = Workspace.from_config()

    def train_model(self, model_name, script_name, data):
        experiment = Experiment(workspace=self.workspace, name=f"{model_name}_experiment")
        
        env = Environment.from_pip_requirements(f"{model_name}_env", "requirements.txt")
        
        config = ScriptRunConfig(
            source_directory=".",
            script=script_name,
            compute_target="local",
            environment=env
        )
        
        run = experiment.submit(config)
        run.wait_for_completion(show_output=True)
        
        run.register_model(model_name=model_name, model_path="outputs/model.pkl")

    def deploy_model(self, model_name):
        model = Model(self.workspace, name=model_name)
        
        inference_config = InferenceConfig(entry_script="score.py", environment=env)
        
        deployment_config = AciWebservice.deploy_configuration(
            cpu_cores=1,
            memory_gb=1,
            auth_enabled=True
        )
        
        service = Model.deploy(
            self.workspace,
            f"{model_name}_service",
            [model],
            inference_config,
            deployment_config
        )
        
        service.wait_for_deployment(show_output=True)
        print(service.get_logs())
        
        return service.scoring_uri

