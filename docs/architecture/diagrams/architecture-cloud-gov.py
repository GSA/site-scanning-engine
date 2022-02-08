import os
import pathlib

from diagrams import Cluster, Diagram, Edge
from diagrams.aws.storage import S3
from diagrams.generic.network import Firewall, Switch
from diagrams.onprem.database import PostgreSQL
from diagrams.onprem.inmemory import Redis
from diagrams.programming.language import NodeJS

filename = "architecture-cloud-gov"

with Diagram("Site Scanner", show=False, filename=filename):

    with Cluster("API"):
        api_data_gov = Firewall("api.data.gov")  # not really a firewall
        router = Switch("Cloud.gov router")

        with Cluster("API Logic"):
            node_api_app = NodeJS("API Logic")

    with Cluster("Data and Storage"):
        postgres = PostgreSQL("AWS-RDS PG")

        with Cluster("Node Cold Storage"):
            cold_storage_node = NodeJS("Cold Storage Code")

        s3_cold_storage = S3("S3 (Cold Storage)")

    with Cluster("Scanning"):
        with Cluster("Configurable CRON jobs"):
            cron = [NodeJS("Nightly CRON job"), NodeJS("Weekly CRON job")]

        with Cluster("Producer Logic"):
            producer_node = NodeJS("producer code")

        with Cluster("Message Queues"):
            queue = Redis("Headless Queue")

        with Cluster("Node.js Consumers"):
            node_consumer_apps = [NodeJS("Headless Scans"), NodeJS("HTTP scans")]

    # API
    (
        api_data_gov
        >> Edge(label="manages")
        >> router
        >> Edge(label="calls")
        >> node_api_app
    )
    node_api_app >> Edge(label="queries") >> postgres

    # Data and Storage
    postgres << Edge(label="queries") << cold_storage_node
    s3_cold_storage << Edge(label="writes to") << cold_storage_node

    # Scanning
    cron >> Edge(label="triggers") >> producer_node >> Edge(label="adds to") >> queue
    queue << Edge(label="consume") << node_consumer_apps
    node_consumer_apps >> Edge(label="write to") >> postgres


filename_with_extension = filename + ".png"
while not os.path.exists(filename_with_extension):
    pass

file_path = pathlib.Path(__file__).parent.absolute()
os.rename(
    file_path.joinpath(filename_with_extension),
    file_path.joinpath("images").joinpath(filename_with_extension),
)
