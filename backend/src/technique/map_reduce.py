import boto3
from langchain.llms.bedrock import Bedrock
from langchain.chains.mapreduce import MapReduceChain
from langchain.text_splitter import CharacterTextSplitter
from langchain.chains import ReduceDocumentsChain, MapReduceDocumentsChain
from langchain.chains.llm import LLMChain
from langchain.prompts import PromptTemplate
from langchain.chains.combine_documents.stuff import StuffDocumentsChain

from langchain.text_splitter import RecursiveCharacterTextSplitter

from type.step import Step

# Map
MAP_TEMPLATE: str = """\n\nHuman: The following is a set of documents
<documnets>
{docs}
</documents>
Based on this list of docs, please identify the main themes.
"""

# Reduce
REDUCE_TEMPLATE = """\n\nHuman: The following is set of summaries:
<summaries>
{doc_summaries}
</summaries>
Please take these and distill them into a final, consolidated summary of the main themes in narative format. 
"""

class MapReduce:

  def __init__(self, client: boto3.client):
    self.bedrock_client = client

    model_parameter = {"temperature": 0.0, "top_p": .5, "max_tokens_to_sample": 2000}
    llm = Bedrock(
      model_id="anthropic.claude-v2", 
      model_kwargs=model_parameter,
      client=self.bedrock_client
    )

    map_prompt = PromptTemplate.from_template(MAP_TEMPLATE)
    map_chain = LLMChain(llm=llm, prompt=map_prompt)
    reduce_prompt = PromptTemplate.from_template(REDUCE_TEMPLATE)
    reduce_chain = LLMChain(llm=llm, prompt=reduce_prompt)

    # Takes a list of documents, combines them into a single string, and passes this to an LLMChain
    combine_documents_chain = StuffDocumentsChain(
      llm_chain=reduce_chain, document_variable_name="doc_summaries"
    )

    # Combines and iteravely reduces the mapped documents
    self.reduce_documents_chain = ReduceDocumentsChain(
      # This is final chain that is called.
      combine_documents_chain=combine_documents_chain,
      # If documents exceed context for `StuffDocumentsChain`
      collapse_documents_chain=combine_documents_chain,
      # The maximum number of tokens to group documents into.
      token_max=4000,
    )

    # Combining documents by mapping a chain over them, then combining results
    self.map_reduce_chain = MapReduceDocumentsChain(
      # Map chain
      llm_chain=map_chain,
      # Reduce chain
      reduce_documents_chain=self.reduce_documents_chain,
      # The variable name in the llm_chain to put the documents in
      document_variable_name="docs",
      # Return the results of the map steps in the output
      return_intermediate_steps=True,
    )

    self.text_splitter = RecursiveCharacterTextSplitter(
      chunk_size = 5000,
      chunk_overlap  = 200,
      length_function = len,
      add_start_index = True,
    )

  def map_reduce(self, doc: str) -> dict:
    split_docs = self.text_splitter.create_documents([doc])
    # Get response from LLM.
    chain_response: dict = self.map_reduce_chain.invoke(split_docs)
    # Split documents return type Document which has the value page_content.
    split_documents = [doc.page_content for doc in chain_response['input_documents']]
    # Grab remaining elements to output the steps involved in map reduce.
    intermediate_steps = chain_response['intermediate_steps']
    results = chain_response['output_text']
    steps: list[Step] = self._get_steps(doc, split_documents, intermediate_steps, results)

    return { 'results': results, 'steps': steps }

  def _get_steps(self, input:str,  split_documents: list[str], intermediate_steps: list[str], results: str) -> list[Step]:
    steps: list[Step] = []

    # Explain original document split
    num_split = len(split_documents)
    split_original_doc: Step = Step(action='Split Documents', input=input, results='Split into {} documents'.format(num_split))
    steps.append(split_original_doc)

    # Show intermediate steps. split_documents contain inputs and 
    for i, doc in enumerate(split_documents):
      intermediate_res: str = intermediate_steps[i]
      split_doc_step: Step = Step(action='Summarize split part {}'.format(i), input=doc, results=intermediate_res)
      steps.append(split_doc_step)

    # Show summarization result
    
    result_step: Step = Step(action='Map Reduce Results', input='Summarized documents chunks above.', results=results)
    steps.append(result_step)

    return steps

