from analytics.network_analysis import DeveloperCollaborationAnalyzer
from analytics.sentiment_analysis import TeamMoraleAnalyzer
from analytics.code_quality_prediction import CodeQualityPredictor
from analytics.result_storage import AnalyticsResultStorage
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_advanced_analytics():
    logger.info("Starting advanced analytics")

    # Network Analysis
    collaboration_analyzer = DeveloperCollaborationAnalyzer()
    collaboration_results = collaboration_analyzer.run_analysis()
    logger.info(f"Collaboration analysis results: {collaboration_results}")

    # Sentiment Analysis
    morale_analyzer = TeamMoraleAnalyzer()
    morale_results = morale_analyzer.run_analysis()
    logger.info(f"Team morale analysis results: {morale_results}")

    # Code Quality Prediction
    quality_predictor = CodeQualityPredictor()
    quality_results = quality_predictor.run_analysis()
    logger.info(f"Code quality prediction results: {quality_results}")

    return {
        "collaboration": collaboration_results,
        "team_morale": morale_results,
        "code_quality": quality_results
    }

     # Save results
    storage = AnalyticsResultStorage()
    storage.save_results(results)

    logger.info("Advanced analytics completed and results saved")
    return results




if __name__ == "__main__":
    run_advanced_analytics()
