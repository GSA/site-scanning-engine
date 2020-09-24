from diagrams import Diagram, Cluster, Edge
from diagrams.aws.analytics import Athena
from diagrams.aws.compute import Fargate, Lambda
from diagrams.aws.database import Dynamodb
from diagrams.aws.integration import Eventbridge, SQS
from diagrams.aws.network import APIGateway
from diagrams.aws.storage import S3
from diagrams.generic.network import Firewall
from diagrams.generic.device import Mobile
from diagrams.programming.language import NodeJS


with Diagram("Site Scanner", show=False):

    with Cluster("API"):
        api_data_gov = Firewall("api.data.gov") # not really a firewall
        api_gateway = APIGateway("API Gateway")

        with Cluster("API Logic"):
            node_api_app = NodeJS("API Logic")
            api_lambda = Lambda("API Lambda")


    with Cluster("Data and Storage"):
        dynamo = Dynamodb("DynamoDB")

        with Cluster("Cold Storage Logic"):
            dynamo_lambda = Lambda("Lambda")
            cold_storage_node = NodeJS("Cold Storage Code")

        s3_cold_storage = S3("S3 (Cold Storage)")
        athena = Athena("Athena")


    with Cluster("Nightly Scanning"):
        cron = Eventbridge("EventBridge CRON")

        with Cluster("Producer Logic"):
            producer = Lambda("Producer Lambda")
            producer_node = NodeJS("producer code")

        queue = SQS("Consumer Queue")

        with Cluster("Serverless Fargate Cluster"):
            fargate = [Fargate("Fargate 1...n")]
            node_apps = NodeJS("Scanning Logic")

    



    cron >> Edge(label="triggers") >> producer >> Edge(label="publishes to") >> queue 
    queue << Edge(label="subscribes to") << fargate >> Edge(label="writes to") >> dynamo 
    dynamo >> Edge(label="ttl triggers") >> dynamo_lambda >> Edge(label="writes to") >> s3_cold_storage
    athena >> Edge(label="queries") >> s3_cold_storage
    api_data_gov >> Edge(label="manages") >> api_gateway >> Edge(label="calls") >> api_lambda >> Edge(label="reads from") >> dynamo
    Mobile(label="The Public") >> Edge(label="calls") >> api_data_gov
    
    
