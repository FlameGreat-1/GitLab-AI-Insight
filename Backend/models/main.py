import grpc
from concurrent import futures
import model_service_pb2
import model_service_pb2_grpc
from issue_predictor import IssuePredictor
from mr_time_estimator import MRTimeEstimator
from commit_impact_predictor import CommitImpactPredictor

class ModelServicer(model_service_pb2_grpc.ModelServiceServicer):
    def __init__(self):
        self.issue_predictor = IssuePredictor()
        self.mr_time_estimator = MRTimeEstimator()
        self.commit_impact_predictor = CommitImpactPredictor()

    def PredictIssueState(self, request, context):
        prediction = self.issue_predictor.predict(request.issue_data)
        return model_service_pb2.IssuePredictionResponse(predicted_state=prediction)

    def EstimateMRTime(self, request, context):
        estimation = self.mr_time_estimator.estimate(request.mr_data)
        return model_service_pb2.MRTimeEstimationResponse(estimated_time=estimation)

    def PredictCommitImpact(self, request, context):
        impact = self.commit_impact_predictor.predict(request.commit_data)
        return model_service_pb2.CommitImpactPredictionResponse(predicted_impact=impact)

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    model_service_pb2_grpc.add_ModelServiceServicer_to_server(ModelServicer(), server)
    server.add_insecure_port('[::]:50052')
    server.start()
    server.wait_for_termination()

if __name__ == '__main__':
    serve()
