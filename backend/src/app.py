import json
from flask import Flask, request, jsonify
import boto3
from botocore.config import Config
from technique.stuff_it import StuffIt
from technique.map_reduce import MapReduce
from type.step import Step
import time

app = Flask(__name__)

# Increase the standard time out limits in boto3, because Bedrock may take a while to respond to large requests.
my_config = Config(connect_timeout=60*3, read_timeout=60*3)
bedrock_client = boto3.client(service_name='bedrock-runtime', config=my_config)

# Create the different summarization clients to be used.
stuff_it_client: StuffIt = StuffIt(bedrock_client)
map_reduce_client: MapReduce = MapReduce(bedrock_client)

@app.route('/stuff-it',  methods=['POST'])
def stuff_it():
  data: dict = request.json
  doc: str = data['textToSummarize']
  results: dict = _wrap_in_duration(doc, stuff_it_client.stuff_it)
  return jsonify(_format_results(results))

@app.route('/map-reduce', methods=['POST'])
def map_reduce():
  data: dict = request.json
  doc: str = data['textToSummarize']
  results: dict = _wrap_in_duration(doc, map_reduce_client.map_reduce)
  return jsonify(_format_results(results))


########################
# Helper functions
########################


# Flask can't jsonify objects so convert them to raw dicts beforehand
def _format_results(results: list[Step]) -> str:
  results['steps'] = [step.to_dict() for step in results['steps']]
  return results

# Helper function to wrap the function call in the number of seconds it takes to return.
def _wrap_in_duration(doc: str, func: callable) -> dict:
  start_time = time.time()
  results = func(doc)
  end_time = time.time()
  results['time'] = round(end_time - start_time, 2)
  return results