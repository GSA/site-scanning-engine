import os
import pathlib

from diagrams import Cluster, Diagram, Edge
from diagrams.aws.analytics import Athena
from diagrams.aws.compute import Fargate, Lambda
from diagrams.aws.database import DocumentDB
from diagrams.aws.integration import SQS, Eventbridge
from diagrams.aws.network import APIGateway
from diagrams.aws.storage import S3
from diagrams.generic.device import Mobile
from diagrams.generic.network import Firewall
from diagrams.programming.language import NodeJS

filename = "architecture-aws"

with Diagram("Site Scanner", show=False, filename="architecture-aws"):

    with Cluster("API"):
        api_data_gov = Firewall("api.data.gov") # not really a firewall
        api_gateway = APIGateway("API Gateway")

        with Cluster("API Logic"):
            node_api_app = NodeJS("API Logic")
            api_lambda = Lambda("API Lambda")


    with Cluster("Data and Storage"):
        documentdb = DocumentDB("DocumentDB")

        with Cluster("Cold Storage Logic"):
            document_lambda = Lambda("Lambda")
            cold_storage_node = NodeJS("Cold Storage Code")

        s3_cold_storage = S3("S3 (Cold Storage)")
        athena = Athena("Athena")


    with Cluster("Nightly Scanning"):
        cron = Eventbridge("EventBridge CRON")

        with Cluster("Producer Logic"):
            producer = Lambda("Producer Lambda")
            producer_node = NodeJS("producer code")

        queue = SQS("Consumer Queue")

        with Cluster("Lambda Consumers"):
            consumer_lambda = [Lambda("Lambda 1...n")]
            node_apps = NodeJS("Scanning Logic")


    cron >> Edge(label="triggers") >> producer >> Edge(label="publishes to") >> queue 
    queue << Edge(label="subscribes to") << consumer_lambda >> Edge(label="writes to") >> documentdb
    documentdb >> Edge(label="ttl triggers") >> document_lambda>> Edge(label="writes to") >> s3_cold_storage
    athena >> Edge(label="queries") >> s3_cold_storage
    api_data_gov >> Edge(label="manages") >> api_gateway >> Edge(label="calls") >> api_lambda >> Edge(label="reads from") >> documentdb



filename_with_extension = filename + ".png"
while not os.path.exists(filename_with_extension):
    pass

file_path = pathlib.Path(__file__).parent.absolute()
os.rename(file_path.joinpath(filename_with_extension), file_path.joinpath("images").joinpath(filename_with_extension))






    
    
