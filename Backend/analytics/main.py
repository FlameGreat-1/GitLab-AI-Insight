import grpc
from concurrent import futures
import analytics_service_pb2
import analytics_service_pb2_grpc
from network_analysis import DeveloperCollaborationAnalyzer
from sentiment_analysis import TeamMoraleAnalyzer
from code_quality_prediction import CodeQualityPredictor

class AnalyticsServicer(analytics_service_pb2_grpc.AnalyticsServiceServicer):
    def __init__(self):
        self.collaboration_analyzer = DeveloperCollaborationAnalyzer()
        self.morale_analyzer = TeamMoraleAnalyzer()
        self.quality_predictor = CodeQualityPredictor()

    def AnalyzeCollaboration(self, request, context):
        results = self.collaboration_analyzer.run_analysis()
        return analytics_service_pb2.CollaborationResponse(
            communities=results['communities'],
            key_developers=results['key_developers']
        )

    def AnalyzeTeamMorale(self, request, context):
        results = self.morale_analyzer.run_analysis()
        return analytics_service_pb2.TeamMoraleResponse(
            average_sentiment=results['average_sentiment']
        )

    def PredictCodeQuality(self, request, context):
        quality = self.quality_predictor.predict(request.file_content)
        return analytics_service_pb2.CodeQualityResponse(quality_score=quality)

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    analytics_service_pb2_grpc.add_AnalyticsServiceServicer_to_server(AnalyticsServicer(), server)
    server.add_insecure_port('[::]:50053')
    server.start()
    server.wait_for_termination()

if __name__ == '__main__':
    serve()
