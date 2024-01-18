import boto3
from technique.base_advanced_summarization import BaseAdvancedSummarization
from type.step import Step
import time

# Property of Claude 2
MAX_TOKEN_COUNT = 12000
# How many times to retry if Claude is not working.
MAX_ATTEMPTS = 30 

class MultiDoc(BaseAdvancedSummarization):

  def __init__(self, client: boto3.client, cache_responses: bool=False, debug: bool = False):
    super().__init__(client)
    self.cache_responses = cache_responses
    self.debug = debug
    self.steps: list[Step] = []

  # This function uses the three helper functions to read the documents passed in, and create a summary answer for each question passed in.
  # If the documents are longer than two pages or so, it is reccoemended that you first summaize each document.
  # docs_description is a single sentance describing what the documents are such as "The texts are a collection of product reviews for a Pickle Ball paddle."
  
  def multi_doc(self, docs: list[str], questions: list[str], docs_description: str):
    self.steps =[]
    start_time = time.time()
    answers: str = self._multi_doc(docs, questions, docs_description)
    end_time = time.time()

    return {
      'results': answers,
      'steps': self.steps,
      'time': round(end_time-start_time,2)
    }

  def _multi_doc(self, docs: list[str], questions: list[str], docs_description: str):
    #get answers from each doc for each question.
    answers = {}
    prompt2quetion_doc = {}
    prompts = []
    max_docs_to_scan = 500
    
    #build the queries to be passed into Bedrock
    for question in questions:
      for x, doc in enumerate(docs):
        if x>max_docs_to_scan:
          break #limit for testing
        
        #print ("Asking the LLM to find extract answers from this doc:",doc)
        questions_prompt = self.get_prompt(docs[x],"reporter","list", question, "",docs_description)
        prompt2quetion_doc[questions_prompt] = (question,doc) 
        prompts.append(questions_prompt)
        # Add the question prompt as a step in the calculation.
        self.add_step('Generated question prompt for input document', doc, questions_prompt)
        
    if self.debug:
      print("Starting %s worker threads."%len(prompts))

    prompts_answers = self.ask_claude_threaded(prompts)
    # save_calls(claude_cache)
    
    for question in questions:
      answers[question] = []    
    
    for prompt,answer,total_tokens,output_tokens,request_time,tokens_per_sec,query_start_time in prompts_answers:
      question,doc = prompt2quetion_doc[prompt]
      answers[question].append(answer)
      self.add_step('Generated answer for input document', doc, answer)
        
    
    current_answer_count = len(docs)
    if self.debug: 
      print("All documents have been read.  Reducing answers into the final summary...")

    #reduce this down to 5 or less docs for the final summary by combining the individual answers.
    while current_answer_count > 5:
      #summarize the answers
      prompts = []
      prompts2question = {}
      
      max_docs_to_scan = max(min(current_answer_count,8),3)
      if self.debug: 
         print("Combining %s chunks.  (Currently there are %s answers to each question.)"%(max_docs_to_scan,current_answer_count))

      for question in questions:
        #You want chunks of roughly 2K tokens
        for partial_chunks in self.grab_set_chunks(answers[question],max_docs_to_scan):
          questions_prompt = self.get_prompt(partial_chunks,"reporter_summary","list", question, " in less than 1000 tokens")
          prompts.append(questions_prompt)
          prompts2question[questions_prompt] = question
      
      if self.debug:
        print("Starting %s worker threads."%len(prompts))

      prompts_answers = self.ask_claude_threaded(prompts)
      # save_calls(claude_cache)
      
      for question in questions:
        answers[question] = []    
      for prompt,answer,total_tokens,output_tokens,request_time,tokens_per_sec,query_start_time in prompts_answers:
        answers[prompts2question[prompt]].append(answer)  
        self.add_step('Generated answer for question prompt', prompts2question[prompt], answer)      

      current_answer_count = len(answers[questions[0]])
        
    if self.debug: 
      print("Creating the final summary for each question.")

    #write the final article:
    prompts = []
    prompts2question = {}
    for question in questions:
      #print ("Asking the LLM to finalize the answer for this question:",question)
      questions_prompt = self.get_prompt(answers[question],"reporter_final","narrative", question, "")
      prompts.append(questions_prompt)
      prompts2question[questions_prompt] = question

    if self.debug:
      print("Starting %s worker threads."%len(prompts))

    prompts_answers = self.ask_claude_threaded(prompts)
    # save_calls(claude_cache)
    
    answers = {}
    for prompt,answer,total_tokens,output_tokens,request_time,tokens_per_sec,query_start_time in prompts_answers:
      answers[prompts2question[prompt]] = answer
      self.add_step('Compile answers', prompts2question[prompt], answer) 

    response: str = ''.join([f"{key}\n\n{value}" for key, value in answers.items()])
    self.add_step('Add answers', 'input is from the questions and input documents', response) 
    return response
  
  # Yield successive n-sized chunks from lst.
  # This is a helper function for the multidoc summarization function.
  def grab_set_chunks(self, lst, n):
    for i in range(0, len(lst), n):
      yield lst[i:i + n]

  def add_step(self, action: str, input: str, result: str):
    self.steps.append(Step(action=action, input=input, results=result))
  