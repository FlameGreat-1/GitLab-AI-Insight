import networkx as nx
import community
import matplotlib.pyplot as plt
from data.data_fetcher import DataFetcher
from utils.preprocessing import preprocess_text
import logging

logger = logging.getLogger(__name__)

class DeveloperCollaborationAnalyzer:
    def __init__(self):
        self.data_fetcher = DataFetcher()
        self.G = nx.Graph()

    def build_collaboration_network(self):
        # Fetch data from GitLab
        commits = self.data_fetcher.fetch_commits()
        merge_requests = self.data_fetcher.fetch_merge_requests()

        # Build network from commits
        for commit in commits:
            author = commit['author_name']
            for file in commit['changed_files']:
                self.G.add_edge(author, file)

        # Build network from merge requests
        for mr in merge_requests:
            author = mr['author']['username']
            reviewers = [r['username'] for r in mr['reviewers']]
            for reviewer in reviewers:
                self.G.add_edge(author, reviewer)

        logger.info(f"Built collaboration network with {self.G.number_of_nodes()} nodes and {self.G.number_of_edges()} edges")

    def analyze_communities(self):
        partition = community.best_partition(self.G)
        modularity = community.modularity(partition, self.G)
        logger.info(f"Detected {len(set(partition.values()))} communities with modularity {modularity}")
        return partition

    def identify_key_developers(self):
        centrality = nx.eigenvector_centrality(self.G)
        key_developers = sorted(centrality, key=centrality.get, reverse=True)[:10]
        logger.info(f"Top 10 key developers: {key_developers}")
        return key_developers

    def visualize_network(self, partition):
        pos = nx.spring_layout(self.G)
        plt.figure(figsize=(12, 8))
        nx.draw(self.G, pos, node_color=list(partition.values()), with_labels=True)
        plt.title("Developer Collaboration Network")
        plt.savefig("developer_collaboration_network.png")
        logger.info("Network visualization saved as developer_collaboration_network.png")

    def run_analysis(self):
        self.build_collaboration_network()
        partition = self.analyze_communities()
        key_developers = self.identify_key_developers()
        self.visualize_network(partition)
        return {
            "communities": len(set(partition.values())),
            "key_developers": key_developers
        }
