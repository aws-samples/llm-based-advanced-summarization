import json
from flask import Flask, request, jsonify
import boto3
from botocore.config import Config
from technique.stuff_it import StuffIt
from technique.map_reduce import MapReduce
from technique.auto_refine import AutoRefine
from technique.multi_doc import MultiDoc
from type.step import Step
import time
import pickle
import os
import uuid

UPLOAD_FOLDER = 'documents'
# This demo only allows txt files. You could upload anything you want, you just have to normalize
# it into text first.
ALLOWED_EXTENSIONS = {'txt'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Every time you startup the server, delete the old documents folder and recreate it.
if not os.path.exists(UPLOAD_FOLDER):
  os.makedirs(UPLOAD_FOLDER)

# Increase the standard time out limits in boto3, because Bedrock may take a while to respond to large requests.
my_config = Config(connect_timeout=60*3, read_timeout=60*3)
bedrock_client = boto3.client(service_name='bedrock-runtime', config=my_config)

# Create the different summarization clients to be used.
stuff_it_client: StuffIt = StuffIt(bedrock_client)
map_reduce_client: MapReduce = MapReduce(bedrock_client)
multi_doc_client: MultiDoc = MultiDoc(bedrock_client)

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

@app.route('/auto-refine', methods=['POST'])
def auto_refine():
  data: dict = request.json
  doc: str = data['textToSummarize']

  prompt_options = {}
  prompt_options['prompt_type'] = "summary"
  prompt_options['format_type'] = "narrative"
  prompt_options['manual_guidance'] = ""
  prompt_options['style_guide'] = ""

  # Because auto_refine uses recursion, it's easier to reinitialize the object each call 
  # so that the steps are reset at the API call level.
  auto_refine_client: AutoRefine = AutoRefine(bedrock_client)

  results: dict = auto_refine_client.auto_refine(doc, prompt_options, AUTO_REFINE=True)
  return jsonify(_format_results(results))

@app.route('/multi-doc', methods=['POST'])
def multi_doc():
  data: dict = request.json
  file_location: list[str] = data['uploadLocation']
  description_of_documents: str = data['descriptionOfDocuments']
  questions_about_docs: list[str] = data['questionsAboutDocs']

  docs: list[str] = _get_docs_from_filepath(file_location)
  results: dict = multi_doc_client.multi_doc(docs, questions_about_docs, description_of_documents)

  return jsonify(_format_results(results))

#####
# Reads in files from uploaded doc list, pickles them and then 
# returns the path to the file to be used in subsequent calls.
#####
@app.route('/upload-docs', methods=['POST'])
def upload_many_docs():
  if 'file' not in request.files:
    return jsonify({ 'error': 'No file uploaded' })
  
  files = request.files.getlist("file")
  
  documents: list[str] = []

  for file in files:
    if file.filename == '':
      return jsonify({ 'error': 'No file selected' })
    
    if file: 
      text_data: str = file.read().decode('utf-8')
      documents.append(text_data)
  
  result_path: str = _write_docs_to_file(documents)
  return jsonify({ 'file_path': result_path })




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

def _get_docs_from_filepath(path: str) -> list[str]:
  docs: list[str] = []
  with open(path, 'rb') as file:
    docs = pickle.load(file)
  return docs

def _write_docs_to_file(docs: list[str]) -> str:
  # Define a unique name for the pickled files.
  filename = str(uuid.uuid4()) + '.pkl'
  path = f'{UPLOAD_FOLDER}/{filename}'
  with open(path, 'wb') as f:
    pickle.dump(docs, f)
  return path