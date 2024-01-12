import boto3
from langchain.llms.bedrock import Bedrock

from langchain.chains.llm import LLMChain
from langchain.prompts import PromptTemplate
from langchain.chains.combine_documents.stuff import StuffDocumentsChain
from langchain.schema.document import Document

from type.step import Step
from time import time

MODEL_PARAMS = {
  "temperature": 0.0, 
  "top_p": .5, 
  "max_tokens_to_sample": 2000
}

# Define prompt
prompt_template = """\n\nHuman:  Consider this text:
<text>
{text}
</text>
Please create a concise summary in narative format.

Assistiant:  Here is the concise summary:"""

class StuffIt:

  def __init__(self, client: boto3.client):
    self.bedrock_client = client

    llm = Bedrock(
      model_id="anthropic.claude-v2", 
      model_kwargs=MODEL_PARAMS,
      client=self.bedrock_client
    )

    prompt = PromptTemplate.from_template(prompt_template)
    llm_chain = LLMChain(llm=llm, prompt=prompt)

    self.stuff_chain = StuffDocumentsChain(
      llm_chain=llm_chain, 
      document_variable_name="text"
    )

  def stuff_it(self, doc: str)-> dict:
    docs = [Document(page_content=doc)]
    results: str = self.stuff_chain.run(docs)
    steps: list = self._get_steps(doc, results)
    return {"results": results, 'steps': steps}

  def _get_steps(self, input: str, results: str) -> list[Step]:
    step1: Step = Step(action='Call LLM', input=input, results=results)
    return [step1]
