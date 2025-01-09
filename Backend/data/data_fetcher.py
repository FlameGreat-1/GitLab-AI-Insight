import pandas as pd
from sqlalchemy import create_engine
from Backend.config import DATABASE_URL, COSMOS_ENDPOINT, COSMOS_KEY, KAFKA_ENABLED
from utils.tracing import tracer
from utils.azure_cosmos import CosmosDBManager
from .kafka_producer import GitLabEventProducer
import logging

logger = logging.getLogger(__name__)

class DataFetcher:
    def __init__(self):
        self.engine = create_engine(DATABASE_URL)
        self.cosmos_manager = CosmosDBManager(COSMOS_ENDPOINT, COSMOS_KEY, "gitlab_insights")
        if KAFKA_ENABLED:
            self.producer = GitLabEventProducer()

    @tracer.start_as_current_span("fetch_issues")
    def fetch_issues(self):
        query = """
        SELECT i.id, i.title, i.description, i.state, i.created_at, i.updated_at,
               COUNT(DISTINCT c.id) as commit_count,
               COUNT(DISTINCT mr.id) as mr_count
        FROM issues i
        LEFT JOIN commits c ON c.authored_date BETWEEN i.created_at AND i.updated_at
        LEFT JOIN merge_requests mr ON mr.created_at BETWEEN i.created_at AND i.updated_at
        GROUP BY i.id, i.title, i.description, i.state, i.created_at, i.updated_at
        """
        return pd.read_sql(query, self.engine)

    @tracer.start_as_current_span("fetch_merge_requests")
    def fetch_merge_requests(self):
        query = """
        SELECT mr.id, mr.title, mr.description, mr.state, mr.created_at, mr.merged_at,
               COUNT(DISTINCT c.id) as commit_count,
               COUNT(DISTINCT i.id) as related_issue_count,
               ARRAY_AGG(DISTINCT r.username) as reviewers
        FROM merge_requests mr
        LEFT JOIN commits c ON c.id = ANY(mr.commit_ids)
        LEFT JOIN issues i ON i.id = ANY(mr.closes_issues)
        LEFT JOIN reviewers r ON r.merge_request_id = mr.id
        GROUP BY mr.id, mr.title, mr.description, mr.state, mr.created_at, mr.merged_at
        """
        return pd.read_sql(query, self.engine)

    @tracer.start_as_current_span("fetch_commits")
    def fetch_commits(self):
        query = """
        SELECT c.id, c.message, c.authored_date, c.committed_date, c.author_name,
               ARRAY_AGG(DISTINCT f.filename) as changed_files,
               COUNT(DISTINCT mr.id) as related_mr_count,
               COUNT(DISTINCT i.id) as related_issue_count
        FROM commits c
        LEFT JOIN commit_files f ON f.commit_id = c.id
        LEFT JOIN merge_requests mr ON c.id = ANY(mr.commit_ids)
        LEFT JOIN issues i ON c.id = ANY(i.related_commit_ids)
        GROUP BY c.id, c.message, c.authored_date, c.committed_date, c.author_name
        """
        return pd.read_sql(query, self.engine)

    @tracer.start_as_current_span("fetch_repository_files")
    def fetch_repository_files(self, limit=None):
        query = f"""
        SELECT f.id, f.filename, f.path, f.content
        FROM repository_files f
        {'LIMIT ' + str(limit) if limit else ''}
        """
        return pd.read_sql(query, self.engine)

    @tracer.start_as_current_span("fetch_file_content")
    def fetch_file_content(self, file_path):
        query = """
        SELECT content
        FROM repository_files
        WHERE path = %s
        """
        result = pd.read_sql(query, self.engine, params=(file_path,))
        return result['content'].iloc[0] if not result.empty else None

    @tracer.start_as_current_span("fetch_issues_cosmos")
    def fetch_issues_cosmos(self):
        issues = self.cosmos_manager.query_items("issues", "SELECT * FROM c")
        return pd.DataFrame(issues)

    @tracer.start_as_current_span("fetch_merge_requests_cosmos")
    def fetch_merge_requests_cosmos(self):
        merge_requests = self.cosmos_manager.query_items("merge_requests", "SELECT * FROM c")
        return pd.DataFrame(merge_requests)

    @tracer.start_as_current_span("fetch_commits_cosmos")
    def fetch_commits_cosmos(self):
        commits = self.cosmos_manager.query_items("commits", "SELECT * FROM c")
        return pd.DataFrame(commits)

    @tracer.start_as_current_span("fetch_and_produce_events")
    def fetch_and_produce_events(self):
        if not KAFKA_ENABLED:
            logger.warning("Kafka is not enabled. Skipping event production.")
            return

        # Fetch events from GitLab API
        # This is a placeholder - implement actual GitLab API calls here
        events = [
            {"type": "issue", "data": {"id": 1, "title": "New issue"}},
            {"type": "merge_request", "data": {"id": 1, "title": "New MR"}},
            {"type": "commit", "data": {"id": "abc123", "message": "New commit"}}
        ]

        # Produce events to Kafka
        for event in events:
            self.producer.produce_event(event['type'], event['data'])

        logger.info(f"Produced {len(events)} events to Kafka")

    def close(self):
        if KAFKA_ENABLED:
            self.producer.close()

