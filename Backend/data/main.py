import grpc
from concurrent import futures
import data_service_pb2
import data_service_pb2_grpc
from data_fetcher import DataFetcher

class DataServicer(data_service_pb2_grpc.DataServiceServicer):
    def __init__(self):
        self.data_fetcher = DataFetcher()

    def FetchIssues(self, request, context):
        issues = self.data_fetcher.fetch_issues(limit=request.limit)
        return data_service_pb2.IssuesResponse(issues=[
            data_service_pb2.Issue(
                id=issue.id,
                title=issue.title,
                description=issue.description,
                state=issue.state,
                created_at=str(issue.created_at),
                updated_at=str(issue.updated_at)
            ) for issue in issues
        ])

    def FetchMergeRequests(self, request, context):
        mrs = self.data_fetcher.fetch_merge_requests(limit=request.limit)
        return data_service_pb2.MergeRequestsResponse(merge_requests=[
            data_service_pb2.MergeRequest(
                id=mr.id,
                title=mr.title,
                description=mr.description,
                state=mr.state,
                created_at=str(mr.created_at),
                merged_at=str(mr.merged_at) if mr.merged_at else None
            ) for mr in mrs
        ])

    def FetchCommits(self, request, context):
        commits = self.data_fetcher.fetch_commits(limit=request.limit)
        return data_service_pb2.CommitsResponse(commits=[
            data_service_pb2.Commit(
                id=commit.id,
                message=commit.message,
                author_name=commit.author_name,
                committed_date=str(commit.committed_date)
            ) for commit in commits
        ])

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    data_service_pb2_grpc.add_DataServiceServicer_to_server(DataServicer(), server)
    server.add_insecure_port('[::]:50051')
    server.start()
    server.wait_for_termination()

if __name__ == '__main__':
    serve()
