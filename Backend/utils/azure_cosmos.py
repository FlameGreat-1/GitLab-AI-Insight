from azure.cosmos import CosmosClient, PartitionKey

class CosmosDBManager:
    def __init__(self, endpoint, key, database_name):
        self.client = CosmosClient(endpoint, key)
        self.database = self.client.create_database_if_not_exists(id=database_name)

    def create_container(self, container_name, partition_key):
        return self.database.create_container_if_not_exists(
            id=container_name, 
            partition_key=PartitionKey(path=partition_key)
        )

    def insert_item(self, container_name, item):
        container = self.database.get_container_client(container_name)
        return container.upsert_item(item)

    def query_items(self, container_name, query, params=None):
        container = self.database.get_container_client(container_name)
        return list(container.query_items(query=query, parameters=params))
