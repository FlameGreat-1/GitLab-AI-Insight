
from pydantic import BaseModel
import pandas as pd
from models.issue_predictor import IssuePredictor
from models.mr_time_estimator import MRTimeEstimator
from models.commit_impact_predictor import CommitImpactPredictor
from Backend.config import MODEL_SAVE_PATH
from fastapi import FastAPI, HTTPException, Depends
from fastapi_jwt_auth import AuthJWT
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
import redis.asyncio as redis
import os
from utils.logging_config import setup_logging

app = FastAPI()


# Load models
issue_predictor = IssuePredictor()
issue_predictor.load(MODEL_SAVE_PATH)

mr_time_estimator = MRTimeEstimator()
mr_time_estimator.load(MODEL_SAVE_PATH)

commit_impact_predictor = CommitImpactPredictor()
commit_impact_predictor.load(MODEL_SAVE_PATH)

class IssueInput(BaseModel):
    title: str
    description: str
    created_at: str
    commit_count: int
    mr_count: int

class MRInput(BaseModel):
    title: str
    description: str
    created_at: str
    commit_count: int
    related_issue_count: int

class CommitInput(BaseModel):
    message: str
    authored_date: str
    committed_date: str
    related_mr_count: int
    related_issue_count: int


# Setup Redis for rate limiting
@app.on_event("startup")
async def startup():
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    r = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
    await FastAPILimiter.init(r)

# JWT Auth configuration
class Settings(BaseModel):
    authjwt_secret_key: str = os.getenv("JWT_SECRET_KEY")

@AuthJWT.load_config
def get_config():
    return Settings()

# Add login endpoint
@app.post("/login")
def login(username: str, password: str, Authorize: AuthJWT = Depends()):
    if username == "admin" and password == "password":  # Replace with actual auth logic
        access_token = Authorize.create_access_token(subject=username)
        return {"access_token": access_token}
    raise HTTPException(status_code=401, detail="Invalid username or password")

@app.post("/predict_issue_state")
@limiter.limit("10/minute")
async def predict_issue_state(issue: IssueInput, Authorize: AuthJWT = Depends()):
    Authorize.jwt_required()
    try:
        df = pd.DataFrame([issue.dict()])
        prediction = issue_predictor.predict(df)
        return {"predicted_state": prediction[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/estimate_mr_time")
async def estimate_mr_time(mr: MRInput):
    try:
        df = pd.DataFrame([mr.dict()])
        prediction = mr_time_estimator.predict(df)
        return {"estimated_time_to_merge": prediction[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict_commit_impact")
async def predict_commit_impact(commit: CommitInput):
    try:
        df = pd.DataFrame([commit.dict()])
        prediction = commit_impact_predictor.predict(df)
        return {"predicted_impact_score": prediction[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    setup_logging()

    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)




from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
from ml_models.lstm_model import GitLabInsightLSTMAdvanced
from Backend.config import config
from utils.data_validator import validate_data

app = FastAPI()

model = GitLabInsightLSTMAdvanced(lookback=config.LOOKBACK)
model.load_model(config.MODEL_SAVE_PATH)

class PredictionInput(BaseModel):
    data: list

class PredictionOutput(BaseModel):
    prediction: float
    is_anomaly: bool

@app.post("/predict", response_model=PredictionOutput)
async def predict(input: PredictionInput):
    try:
        df = pd.DataFrame(input.data)
        validate_data(df)
        
        X = model.preprocess_data(df)
        prediction = model.predict(X)
        is_anomaly = model.detect_anomalies(np.array([prediction]))[0]
        
        return PredictionOutput(prediction=prediction, is_anomaly=is_anomaly)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config.API_HOST, port=config.API_PORT)


from fastapi import FastAPI, BackgroundTasks
from advanced_analytics import run_advanced_analytics

app = FastAPI()

@app.post("/run-advanced-analytics")
async def trigger_advanced_analytics(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_advanced_analytics)
    return {"message": "Advanced analytics job started"}

@app.get("/advanced-analytics-results")
async def get_advanced_analytics_results():
    # Implement a method to retrieve the latest results from a database or file
    pass


from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter
import strawberry
import grpc
from data_service_pb2_grpc import DataServiceStub
from model_service_pb2_grpc import ModelServiceStub
from analytics_service_pb2_grpc import AnalyticsServiceStub
import data_service_pb2
import model_service_pb2
import analytics_service_pb2

app = FastAPI()

# Set up gRPC clients
data_channel = grpc.insecure_channel('data_service:50051')
model_channel = grpc.insecure_channel('model_service:50052')
analytics_channel = grpc.insecure_channel('analytics_service:50053')

data_client = DataServiceStub(data_channel)
model_client = ModelServiceStub(model_channel)
analytics_client = AnalyticsServiceStub(analytics_channel)

@strawberry.type
class Issue:
    id: int
    title: str
    description: str
    state: str
    created_at: str
    updated_at: str

@strawberry.type
class MergeRequest:
    id: int
    title: str
    description: str
    state: str
    created_at: str
    merged_at: str

@strawberry.type
class Commit:
    id: str
    message: str
    author_name: str
    committed_date: str

@strawberry.type
class CollaborationAnalysis:
    communities: int
    key_developers: list[str]

@strawberry.type
class TeamMoraleAnalysis:
    average_sentiment: float

@strawberry.type
class CodeQualityPrediction:
    quality_score: float

@strawberry.type
class Query:
    @strawberry.field
    def issues(self, limit: int = 10) -> list[Issue]:
        response = data_client.FetchIssues(data_service_pb2.FetchRequest(limit=limit))
        return [Issue(**issue) for issue in response.issues]

    @strawberry.field
    def merge_requests(self, limit: int = 10) -> list[MergeRequest]:
        response = data_client.FetchMergeRequests(data_service_pb2.FetchRequest(limit=limit))
        return [MergeRequest(**mr) for mr in response.merge_requests]

    @strawberry.field
    def commits(self, limit: int = 10) -> list[Commit]:
        response = data_client.FetchCommits(data_service_pb2.FetchRequest(limit=limit))
        return [Commit(**commit) for commit in response.commits]

    @strawberry.field
    def analyze_collaboration(self) -> CollaborationAnalysis:
        response = analytics_client.AnalyzeCollaboration(analytics_service_pb2.CollaborationRequest())
        return CollaborationAnalysis(
            communities=response.communities,
            key_developers=response.key_developers
        )

    @strawberry.field
    def analyze_team_morale(self) -> TeamMoraleAnalysis:
        response = analytics_client.AnalyzeTeamMorale(analytics_service_pb2.TeamMoraleRequest())
        return TeamMoraleAnalysis(average_sentiment=response.average_sentiment)

@strawberry.type
class Mutation:
    @strawberry.mutation
    def predict_issue_state(self, issue_data: str) -> str:
        response = model_client.PredictIssueState(model_service_pb2.IssuePredictionRequest(issue_data=issue_data))
        return response.predicted_state

    @strawberry.mutation
    def estimate_mr_time(self, mr_data: str) -> float:
        response = model_client.EstimateMRTime(model_service_pb2.MRTimeEstimationRequest(mr_data=mr_data))
        return response.estimated_time

    @strawberry.mutation
    def predict_commit_impact(self, commit_data: str) -> float:
        response = model_client.PredictCommitImpact(model_service_pb2.CommitImpactPredictionRequest(commit_data=commit_data))
        return response.predicted_impact

    @strawberry.mutation
    def predict_code_quality(self, file_content: str) -> CodeQualityPrediction:
        response = analytics_client.PredictCodeQuality(analytics_service_pb2.CodeQualityRequest(file_content=file_content))
        return CodeQualityPrediction(quality_score=response.quality_score)

schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_app = GraphQLRouter(schema)

app.include_router(graphql_app, prefix="/graphql")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

    
