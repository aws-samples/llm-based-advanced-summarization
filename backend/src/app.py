import json
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
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

# Create a location to upload documents.
UPLOAD_FOLDER: str = 'documents'
if not os.path.exists(UPLOAD_FOLDER):
  os.makedirs(UPLOAD_FOLDER)

app = Flask(__name__)

cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


# Increase the standard time out limits in boto3, because Bedrock may take a while to respond to large requests.
my_config = Config(connect_timeout=60*3, read_timeout=60*3)
bedrock_client = boto3.client(service_name='bedrock-runtime', config=my_config)

# Create the different summarization clients to be used.
stuff_it_client: StuffIt = StuffIt(bedrock_client)
map_reduce_client: MapReduce = MapReduce(bedrock_client)
multi_doc_client: MultiDoc = MultiDoc(bedrock_client)

@app.route('/stuff-it',  methods=['POST'])
@cross_origin()
def stuff_it():
  data: dict = request.json
  doc: str = _get_doc_from_request(data)

  if not doc: 
    return jsonify({'error': 'No text to summarize provided'})
  
  results: dict = _wrap_in_duration(doc, stuff_it_client.stuff_it)
  return jsonify(_format_results(results))

@app.route('/map-reduce', methods=['POST'])
@cross_origin()
def map_reduce():
  data: dict = request.json
  doc: str = _get_doc_from_request(data)
  
  if not doc: 
    return jsonify({'error': 'No text to summarize provided'})
  
  results: dict = _wrap_in_duration(doc, map_reduce_client.map_reduce)
  return jsonify(_format_results(results))

@app.route('/auto-refine', methods=['POST'])
@cross_origin()
def auto_refine():
  data: dict = request.json
  doc: str = _get_doc_from_request(data)
  
  if not doc: 
    return jsonify({'error': 'No text to summarize provided'})

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
@cross_origin()
def multi_doc():
  data: dict = request.json
  file_location: list[str] = data['uploadLocation']
  description_of_documents: str = data['descriptionOfDocuments']
  questions_about_docs: list[str] = data['questions'].split(',') if data['questions'] != '' else ['']

  docs: list[str] = _get_docs_from_filepath(file_location)
  results: dict = multi_doc_client.multi_doc(docs, questions_about_docs, description_of_documents)

  return jsonify(_format_results(results))

#####
# Reads in files from uploaded doc list, pickles them and then 
# returns the path to the file to be used in subsequent calls.
#####
@app.route('/upload-docs', methods=['POST'])
@cross_origin()
def upload_many_docs():
  if 'files' not in request.files:
    return jsonify({ 'error': 'No file uploaded' })
  
  files = request.files.getlist("files")
  
  documents: list[str] = []

  for file in files:
    if file.filename == '':
      return jsonify({ 'error': 'No file selected' })
    
    if file: 
      text_data: str = file.read().decode('utf-8')
      documents.append(text_data)
  
  result_path: str = _write_docs_to_file(documents)
  return jsonify({ 'uploadLocation': result_path })


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

def _get_doc_from_request(request: dict) -> str:
  if 'uploadLocation' in request and request['uploadLocation'] != '':
    file_location: str = request['uploadLocation']
    return _get_docs_from_filepath(file_location)[-1] # In case there's multiple docs, just use the last one one.
  elif 'textToSummarize' in request:
    return request['textToSummarize']
  else: 
    return None