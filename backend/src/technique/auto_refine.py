from anthropic import Anthropic
import pickle
import os
import re
import json
from queue import Queue
from threading import Thread
import boto3
import time
from queue import Queue
from threading import Thread

from technique.base_advanced_summarization import BaseAdvancedSummarization
from type.step import Step

# Property of Claude 2
MAX_TOKEN_COUNT = 12000
# How many times to retry if Claude is not working.
MAX_ATTEMPTS = 30 

anthropic_client = Anthropic()

class AutoRefine(BaseAdvancedSummarization):

  def __init__(self, client: boto3.client, cache_responses: bool=False, debug: bool = False):
    super().__init__(client)
    self.cache_responses = cache_responses
    self.debug = debug

    # Because these steps are more complicated, we collect them as we go. After each call to auto_refine, we reset the steps
    # before returning.
    self.steps: list[Step] = []
  
  #######
  # This function uses the three helper functions in super class, as well as the generate_summary_from_chunks above, to iteratively generate high quality summaries.
  # AUTO_REFINE, if true, has the LLM generate a list of questions, and then recursivly calls this function with those questions for guidance.
  # ALREADY_CHUNKED_AND_SUMMED, if true, means that this is being called using a list of summarized documents which should not be chunked or summarized further.
  #######
  def auto_refine(self, full_text: str, prompt_options: dict, AUTO_REFINE: bool =True, ALREADY_CHUNKED_AND_SUMMED: bool=False):
    # Capture total duration.
    start_time = time.time()
    #first break this document into chunks
    chunks = []        
    
    if ALREADY_CHUNKED_AND_SUMMED:
      chunks = full_text
    else:
      chunks = self.get_chunks(full_text)
      self.add_step('Chunking up document', full_text, 'Chunked into {} chunks'.format(len(chunks)))
        
    if self.debug:
      if prompt_options['prompt_type'] == "answers":
        print ("Generating answers using %s chunks."%(len(chunks)))
      else:
        print ("Generating a new combined summary for %s chunks."%(len(chunks)))
      if ALREADY_CHUNKED_AND_SUMMED:
        print ("Input has already been chunked and summarized, skipping initial chunking.")
        
    first_summary = self.generate_summary_from_chunks(chunks,prompt_options, chunks_already_summarized=ALREADY_CHUNKED_AND_SUMMED)
    self.add_step('Generated summary from chunks', 'Input # {} chunks'.format(len(chunks)), first_summary)
    
    if self.debug and AUTO_REFINE: 
      print ("First summary:")
      print (first_summary)
        
    if AUTO_REFINE: 
      if self.debug: 
        print ("Asking the LLM to find weaknesses in this summary...")
      #now that we have a rough summary, let's grab some questions about it.
      questions_prompt = self.get_prompt(first_summary,"interrogate","list", "", "")
      questions_list = self.ask_claude(questions_prompt)[1]
      self.add_step('Generated questions from summary', first_summary, 'Questions from LLM:\n{}'.format(questions_list))

      if self.debug: 
        print ("Questions from the LLM:")
        print (questions_list)
            
      original_guidance = prompt_options['manual_guidance']
      original_prompt_type = prompt_options['prompt_type']
      prompt_options['manual_guidance'] = prompt_options['manual_guidance'] + questions_list
      prompt_options['prompt_type'] = "answers"
      add_details = self.auto_refine(full_text, prompt_options,AUTO_REFINE=False, ALREADY_CHUNKED_AND_SUMMED=ALREADY_CHUNKED_AND_SUMMED)
      self.add_step('Adding details to summary based on Question list', prompt_options['manual_guidance'], add_details)

      if self.debug: 
        print("Additional Details:")
        print (add_details)
        print("Merging details into original summary...")
      
      prompt_options['manual_guidance'] = original_guidance + add_details
      prompt_options['prompt_type'] = "merge_answers"
      custom_prompt = self.get_prompt(first_summary,prompt_options['prompt_type'],prompt_options['format_type'], prompt_options['manual_guidance'], prompt_options['style_guide'])
      final_summary = self.ask_claude(custom_prompt)[1]
      self.add_step('Creating final summary from original guidance + questions', first_summary, final_summary)
      
      #return this back to the original to prevent weird errors between calls of this function.
      prompt_options['manual_guidance'] = original_guidance
      prompt_options['prompt_type'] = original_prompt_type

      response = {
        'results': final_summary,
        'steps': self.steps,
        'time': round(time.time() - start_time, 2)
      }

      return response
    
    else:
      response = {
        'results': first_summary,
        'steps': self.steps,
        'time': round(time.time() - start_time, 2)
      }
      self.add_step('Returning summary from sub refinement call', 'Chunks of size {}'.format(len(chunks)), first_summary)
      return first_summary
    
  def add_step(self, action: str, input: str, result: str):
    self.steps.append(Step(action=action, input=input, results=result))

    