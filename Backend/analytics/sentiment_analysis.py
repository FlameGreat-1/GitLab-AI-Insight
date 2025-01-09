from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from data.data_fetcher import DataFetcher
from utils.preprocessing import preprocess_text
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import logging

logger = logging.getLogger(__name__)

class TeamMoraleAnalyzer:
    def __init__(self):
        self.data_fetcher = DataFetcher()
        self.analyzer = SentimentIntensityAnalyzer()

    def analyze_sentiment(self, text):
        return self.analyzer.polarity_scores(text)['compound']

    def analyze_commit_messages(self):
        commits = self.data_fetcher.fetch_commits()
        sentiments = [self.analyze_sentiment(preprocess_text(commit['message'])) for commit in commits]
        return pd.DataFrame({'sentiment': sentiments, 'type': 'commit'})

    def analyze_issue_comments(self):
        issues = self.data_fetcher.fetch_issues()
        sentiments = []
        for issue in issues:
            for comment in issue['comments']:
                sentiment = self.analyze_sentiment(preprocess_text(comment['body']))
                sentiments.append(sentiment)
        return pd.DataFrame({'sentiment': sentiments, 'type': 'issue_comment'})

    def visualize_sentiment(self, df):
        plt.figure(figsize=(10, 6))
        sns.boxplot(x='type', y='sentiment', data=df)
        plt.title("Sentiment Distribution by Type")
        plt.savefig("sentiment_distribution.png")
        logger.info("Sentiment visualization saved as sentiment_distribution.png")

    def run_analysis(self):
        commit_sentiments = self.analyze_commit_messages()
        issue_sentiments = self.analyze_issue_comments()
        all_sentiments = pd.concat([commit_sentiments, issue_sentiments])
        
        self.visualize_sentiment(all_sentiments)
        
        average_sentiment = all_sentiments['sentiment'].mean()
        logger.info(f"Average team sentiment: {average_sentiment}")
        
        return {
            "average_sentiment": average_sentiment,
            "commit_sentiment": commit_sentiments['sentiment'].mean(),
            "issue_comment_sentiment": issue_sentiments['sentiment'].mean()
        }
