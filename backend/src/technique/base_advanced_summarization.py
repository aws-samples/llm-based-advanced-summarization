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

# Property of Claude 2
MAX_TOKEN_COUNT = 12000
# How many times to retry if Claude is not working.
MAX_ATTEMPTS = 30 

MAIN_PROMPT = """\n\nHuman:  I am going to give you a text{{GUIDANCE_1}}.  This text is extracted from a larger document.  Here is the text:

<text>
{{TEXT}}
</text>
{{GUIDANCE_2}}
{{STYLE}}{{REQUEST}}{{FORMAT}}{{GUIDANCE_3}}
\nAssistant:  Here is what you asked for:
"""

MERGE_PROMPT = """\n\nHuman:  Here are a number of related summaries:

{{TEXT}}
Please merge these summaries into a highly detailed single summary in {{FORMAT}} format, preserving as much detail as possible, using less than 1000 tokens.
\nAssistant:  Here is what you asked for:
"""

# This is inserted into the prompt template above, in the {{GUIDANCE_2}} section.
GUIDANCE_PROMPT = """
Here is the additional guidance:
<guidance>
{{GUIDANCE}}
</guidance>
"""

# This prompt asks the LLM to be a newpaper reporter, extracting facts from a document to be used in a later report.  Good for summarizing factual sets of documents.
REPORTER_PROMPT = """\n\nHuman:  You are a newspaper reporter, collecting facts to be used in writing an article later.  Consider this source text:
<text>
{{TEXT}}
</text>
{{DOCS_DESCRIPTION}}  Please create a {{FORMAT}} of all the relevant facts from this text which will be useful in answering the question "{{GUIDANCE}}".  To make your list as clear as possible, do not use and pronouns or ambigious phrases.  For example, use a company's name rather than saying "the company" or they.
\nAssistant:  Here is the {{FORMAT}} of relevant facts:
"""

REPORTER_SUMMARY_PROMPT = """\n\nHuman:  You are a newspaper reporter, collecting facts to be used in writing an article later.  Consider these notes, each one derived from a different source text:
{{TEXT}}
Please create a {{FORMAT}} of all the relevant facts and trends from these notes which will be useful in answering the question "{{GUIDANCE}}"{{STYLE}}.  To make your list as clear as possible, do not use and pronouns or ambigious phrases.  For example, use a company's name rather than saying "the company" or "they".
\nAssistant:  Here is the list of relevant facts:

"""

REPORTER_FINAL_PROMPT = """\n\nHuman:  You are a newspaper reporter, writing an article based on facts that were collected and summarized earlier.  Consider these summaries:
{{TEXT}}
Each summary is a collection of facts extracted from a number of source reports.  Each source report was written by an AWS team talking about their interactions with their individual customer.  Please create a {{FORMAT}} of all the relevant trends and details from these summaries which will be useful in answering the question "{{GUIDANCE}}".
\nAssistant:  Here is the narrative:

"""

anthropic_client = Anthropic()

class BaseAdvancedSummarization:

  def __init__(self, client: boto3.client):
    self.MAIN_PROMPT = MAIN_PROMPT
    self.MERGE_PROMPT = MERGE_PROMPT
    self.GUIDANCE_PROMPT = GUIDANCE_PROMPT
    self.REPORTER_PROMPT = REPORTER_PROMPT
    self.REPORTER_SUMMARY_PROMPT = REPORTER_SUMMARY_PROMPT
    self.REPORTER_FINAL_PROMPT = REPORTER_FINAL_PROMPT

    self.bedrock: boto3.Client = client

  def count_tokens(self, text: str) -> int:
    return anthropic_client.count_tokens(text)
  
  def get_chunks(self, full_text: str, overlap: bool = True) -> list[str]:
    # Following testing, it was found that chunks should be 2000 tokens, 
    # or 25% of the doc, whichever is shorter. max chunk size in tokens
    chunk_length_tokens = 2000
    # A paragraph is about 200 words, which is about 260 tokens on average
    # we'll overlap our chunks by a paragraph to provide cohesion to the final summaries.
    overlap_tokens = 260 if overlap else 0
    # Anything this short doesn't need to be chunked further.
    min_chunk_length = 260 + overlap_tokens*2
    #grab basic info about the text to be chunked.
    char_count = len(full_text)
    word_count = len(full_text.split(" "))#rough estimate
    token_count = self.count_tokens(full_text)
    token_per_charater = token_count/char_count
    #don't chunk tiny texts
    if token_count <= min_chunk_length:
      if self.debug:
        print("Text is too small to be chunked further")
      return [full_text]
    
    if self.debug:
      print ("Chunk DEBUG mode is on, information about the text and chunking will be printed out.")
      print ("Estimated character count:",char_count)
      print ("Estimated word count:",word_count)
      print ("Estimated token count:",token_count)
      print ("Estimated tokens per character:",token_per_charater)

      print("Full text tokens: ", self.count_tokens(full_text))
      print("How many times bigger than max context window: ",round(self.count_tokens(full_text)/MAX_TOKEN_COUNT,2))

    # If the text is shorter, use smaller chunks
    if (token_count/4<chunk_length_tokens):
      overlap_tokens = int((overlap_tokens / chunk_length_tokens) * int(token_count / 4))
      chunk_length_tokens = int(token_count / 4)
        
      if self.debug: 
        print("Short doc detected:")
        print("New chunk length:",chunk_length_tokens)
        print("New overlap length:",overlap_tokens)

    #Convert to charaters for easy slicing using our approximate tokens per character for this text.
    overlap_chars = int(overlap_tokens/token_per_charater)
    chunk_length_chars = int(chunk_length_tokens/token_per_charater)

    # Iterate and create the chunks from the full text.
    chunks = []
    start_chunk = 0
    end_chunk = chunk_length_chars + overlap_chars

    last_chunk = False
    while not last_chunk:
      # The last chunk may not be the full length.
      if end_chunk>=char_count:
        end_chunk=char_count
        last_chunk=True

      chunks.append(full_text[start_chunk:end_chunk])
      
      #move our slice location
      if start_chunk == 0:
        start_chunk += chunk_length_chars - overlap_chars
      else:
        start_chunk += chunk_length_chars
      
      end_chunk = start_chunk + chunk_length_chars + 2 * overlap_chars

    if self.debug:
      print ("Created %s chunks."%len(chunks))

    return chunks
  
  ##############
  # GET PROMPT
  # text should be a single string of the raw text to be sent to the gen ai model.
  # prompt_type must be "summary" or "interrogate" or "answers"
  #   -summary means summarize the text
  #   -interrogate means look at the text and ask questions about what is missing
  #   -answers means looking at the test, provide only details that may help answer the questions according to the Guidance.
  #   -merge_answers takes a summary as text, and merges in the facts in the guidance section
  #   -merge_summaries takes 2 or more summaries and merges them together.  The summaries to be merged must be in list format for best results.
  #   -reporter - like a new reporter, extract details that help answer the guidance questions
  #   -reporter_summary - like a news reporter looking at a bunch of notes, create a list summary.  Intended as an intermediate step. 
  #   reporter_final - generative a narrative based on the reporter_summary outputs.
  # format_type must be "narrative" or "list"
  # manual_guidance Extra instructions to guide the process, usually from the user.
  # style_guide TBD
  
  # Note that merge_summaries is handled differntly than all other options because it iteratively adds in multiple texts.
  ###############

  def get_prompt(self, text: str,prompt_type: str, format_type: str, manual_guidance: str, style_guide: str, docs_description: str="") -> str:
    
    # Answers mode is a bit different, so handle that first.
    if prompt_type == "answers":
      format_type = "in list format, using less than 1000 tokens.  "
      prompt_type = "Please provide a list of any facts from the text that could be relevant to answering the questions from the guidance section "
      guidance_1 = " and some guidance"
      guidance_2 = self.GUIDANCE_PROMPT.replace("{{GUIDANCE}}",manual_guidance)
      guidance_3 = "You should ignore any questions that can not be answered by this text."
    elif prompt_type == "reporter":
      return self.REPORTER_PROMPT.replace("{{TEXT}}",text).replace("{{FORMAT}}",format_type).replace("{{GUIDANCE}}",manual_guidance).replace("{{DOCS_DESCRIPTION}}",docs_description)
    elif prompt_type == "reporter_summary":
      summaries_text = ""
      for x,summary in enumerate(text):
          summaries_text += "<note_%s>\n%s</note_%s>\n"%(x+1,summary,x+1)
      final_prompt = self.REPORTER_SUMMARY_PROMPT.replace("{{TEXT}}",summaries_text).replace("{{FORMAT}}",format_type).replace("{{GUIDANCE}}",manual_guidance).replace("{{STYLE}}",style_guide)
      return final_prompt
    elif prompt_type == "reporter_final":
      summaries_text = ""
      for x,summary in enumerate(text):
        summaries_text += "<summary_%s>\n%s</summary_%s>\n"%(x+1,summary,x+1)
      final_prompt = self.REPORTER_FINAL_PROMPT.replace("{{TEXT}}",summaries_text).replace("{{FORMAT}}",format_type).replace("{{GUIDANCE}}",manual_guidance)
      return final_prompt
    elif prompt_type == "merge_summaries":
        summaries_text = ""
        for x,summary in enumerate(text):
          summaries_text += "<summary_%s>\n%s</summary_%s>\n"%(x+1,summary,x+1)
        final_prompt = self.MERGE_PROMPT.replace("{{TEXT}}",summaries_text).replace("{{FORMAT}}",format_type)
        return final_prompt
        
    elif prompt_type == "merge_answers":
      prompt_type = "The text is a good summary which may lack a few details.  However, the additional information found in the guidance section can be used to make the summary even better.  Starting with the text, please use the details in the guidance section to make the text more detailed.  The new summary shoud use less than 1000 tokens.  "
      format_type = ""
      guidance_1 = " and some guidance"
      guidance_2 = self.GUIDANCE_PROMPT.replace("{{GUIDANCE}}",manual_guidance)
      guidance_3 = "You should ignore any comments in the guidance section indicating that answers could not be found."
    else:
      #Based on the options passed in, grab the correct text to eventually use to build the prompt.
      #select the correct type of output format desired, list or summary.  Note that list for interrogate prompts is empty because the request for list is built into that prompt.
      if prompt_type == "interrogate" and format_type != "list":
        raise ValueError("Only list format is supported for interrogate prompts.")
      if format_type == "list":
        if prompt_type == "interrogate":
          format_type = ""#already in the prompt so no format needed.
        else:
          format_type = "in list format, using less than 1000 tokens."
      elif format_type == "narrative":
        format_type = "in narrative format, using less than 1000 tokens."
      else:
        raise ValueError("format_type must be 'narrative' or 'list'.")

      #select the correct prompt type language
      if prompt_type == "summary":
        prompt_type = "Please provide a highly detailed summary of this text "
      elif prompt_type == "interrogate":
        prompt_type = "This text is a summary that lacks detail.  Please provide a list of the top 10 most important questions about this text that can not be answered by the text."
      else:
        raise ValueError("prompt_type must be 'summary' or 'interrogate'.")

      if manual_guidance == "":
        guidance_1 = ""
        guidance_2 = ""
        guidance_3 = ""
      else:
        guidance_1 = " and some guidance"
        guidance_2 = self.GUIDANCE_PROMPT.replace("{{GUIDANCE}}",manual_guidance)
        guidance_3 = "  As much as possible, also follow the guidance from the guidance section above.  You should ignore guidance that does not seem relevant to this text."
    
    style_guide = ""
    final_prompt = self.MAIN_PROMPT.replace("{{TEXT}}",text).replace("{{GUIDANCE_1}}",guidance_1).replace("{{GUIDANCE_2}}",guidance_2).replace("{{GUIDANCE_3}}",guidance_3).replace("{{STYLE}}",style_guide).replace("{{REQUEST}}",prompt_type).replace("{{FORMAT}}",format_type)
    return final_prompt
  
   #############
  # Send a prompt to Bedrock, and return the response.  Debug is used to see exactly what is being sent to and from Bedrock.
  # TODO:  Add error checking and retry on hitting the throttling limit.
  #############
  def ask_claude(self, prompt_text: str):

    # Usually, the prompt will have "human" and "assistant" tags already.  These are required, so if they are not there, add them in.
    if not "Assistant:" in prompt_text:
      prompt_text = "\n\nHuman:"+prompt_text+"\n\Assistant: "
        
    promt_json = {
      "prompt": prompt_text,
      "max_tokens_to_sample": 3000,
      "temperature": 0.7,
      "top_k": 250,
      "top_p": 0.7,
      "stop_sequences": ["\n\nHuman:"]
    }

    body = json.dumps(promt_json)
    
    # #returned cashed results, if any
    # if body in claude_cache:
    #   return claude_cache[body]
    
    if self.debug: 
      print("sending:",prompt_text)

    modelId = 'anthropic.claude-v2'
    accept = 'application/json'
    contentType = 'application/json'
    
    start_time = time.time()
    attempt = 1
    while True:
      try:
        query_start_time = time.time()
        response = self.bedrock.invoke_model(body=body, modelId=modelId, accept=accept, contentType=contentType)
        response_body = json.loads(response.get('body').read())

        raw_results = response_body.get("completion").strip()

        #strip out HTML tags that Claude sometimes adds, such as <text>
        results = re.sub('<[^<]+?>', '', raw_results)
        request_time = round(time.time()-start_time,2)
        if self.debug:
          print("Recieved:",results)
          print("request time (sec):",request_time)
        total_tokens = self.count_tokens(prompt_text+raw_results)
        output_tokens = self.count_tokens(raw_results)
        tokens_per_sec = round(total_tokens/request_time,2)
        break
      except Exception as e:
        print("Error with calling Bedrock: "+str(e))
        attempt+=1
        if attempt>MAX_ATTEMPTS:
          print("Max attempts reached!")
          results = str(e)
          request_time = -1
          total_tokens = -1
          output_tokens = -1
          tokens_per_sec = -1
          break
        
        # Retry in 10 seconds
        else:
          time.sleep(10)

    # # Store in cache only if it was not an error:
    # if request_time>0:
    #   claude_cache[body] = (prompt_text,results,total_tokens,output_tokens,request_time,tokens_per_sec,query_start_time)
    
    return(prompt_text,results,total_tokens,output_tokens,request_time,tokens_per_sec,query_start_time)
  
  # Threaded function for queue processing.
  def thread_request(self, q, result):
    while not q.empty():
      # Fetch new work from the Queue
      work = q.get()
      thread_start_time = time.time()
      try:
        data = self.ask_claude(work[1])
        # Store data back at correct index
        result[work[0]] = data 
      except Exception as e:
        error_time = time.time()
        print('Error with prompt!',str(e))
        result[work[0]] = (
          work[1],
          str(e), 
          self.count_tokens(work[1]),
          0,
          round(error_time-thread_start_time,2),
          0,
          thread_start_time
        )
      
      # Signal to the queue that task has been processed
      q.task_done()
    return True
  
  ###
  # Call ask_claude, but multi-threaded.
  # Returns a dict of the prompts and responces.
  ###
  def ask_claude_threaded(self, prompts: list[str]):
    q = Queue(maxsize=0)
    num_theads = min(50, len(prompts))
    
    #Populating Queue with tasks
    results = [{} for x in prompts];
    # Load up the queue with the promts to fetch and the index for each job (as a tuple):
    for i in range(len(prompts)):
      # Need the index and the url in each queue item.
      q.put((i,prompts[i]))
        
    #Starting worker threads on queue processing
    for i in range(num_theads):
      worker = Thread(target=self.thread_request, args=(q,results))
      # Setting threads as "daemon" allows main program to exit eventually even if these dont finish correctly.
      worker.setDaemon(True)
      worker.start()

    #now we wait until the queue has been processed
    q.join()

    if self.debug:
       print('All tasks completed.')
    return results
  

  # This function itterates through a list of chunks, summarizes them, then merges those summaries together into one.
  # chunks_already_summarized is used when the chunks passed in are chunks resulting from summerizing docs.
  # If the chunks are taken from a source document directly, chunks_already_summarized should be set to False.
  def generate_summary_from_chunks(self, chunks, prompt_options,DEBUG=False, chunks_already_summarized=False):
    partial_summaries = {}
    if not chunks_already_summarized:#chunks are from a source doc, so summarize them.
      partial_summaries_prompts = []
      partial_summaries_prompt2chunk = {}
      for x,chunk in enumerate(chunks):
        #if DEBUG: print ("Working on chunk",x+1,end = '')
        start_chunk_time = time.time()
        #note that partial summaries are always done in list format to maximize information captured.
        custom_prompt = self.get_prompt(chunk,prompt_options['prompt_type'],'list', prompt_options['manual_guidance'], prompt_options['style_guide'])
        partial_summaries_prompts.append(custom_prompt)
        partial_summaries_prompt2chunk[custom_prompt]=chunk
      
      partial_summaries_results = self.ask_claude_threaded(partial_summaries_prompts)
      for prompt_text,results,total_tokens,output_tokens,request_time,tokens_per_sec,query_start_time in partial_summaries_results:
        partial_summaries[partial_summaries_prompt2chunk[prompt_text]] = results

      if DEBUG: 
        print ("Partial summary chunks done!")
        print ("Creating joint summary...")

    else:
      for chunk in chunks:
        partial_summaries[chunk] = chunk
      if DEBUG: 
        print ("Summarized chunks detected!")
        print ("Creating joint summary...")
            
    summaries_list = []
    summaries_list_token_count = 0
    for chunk in chunks:
      summaries_list.append(partial_summaries[chunk]) 
      summaries_list_token_count += self.count_tokens(partial_summaries[chunk])
        
    if DEBUG: 
      print("Chunk summaries token count:",summaries_list_token_count)
    
    #check to see if the joint summary is too long.  If it is, recursivly itterate down.
    #we do this, rather than chunking again, so that summaries are not split.
    #it needs to be under 3000 tokens in order to be helpful to the summary (4000 is an expiremental number and may need to be adjusted.)
    #this may be higher than the 2000 used for text originally, because this data is in list format.
    recombine_token_target = 3000
    #summaries_list_token_count = recombine_token_target+1 #set this to target+1 so that we do at least one recombonation for shorter documents.
    while summaries_list_token_count>recombine_token_target:
      if DEBUG: 
        print("Starting reduction loop to merge chunks.  Total token count is %s"%summaries_list_token_count)

      new_summaries_list = []
      summaries_list_token_count = 0
      temp_summary_group = []
      temp_summary_group_token_length = 0
      for summary in summaries_list:
        if temp_summary_group_token_length + self.count_tokens(summary) > recombine_token_target:
          #the next summary added would push us over the edge, so summarize the current list, and then add it.
          #note that partial summaries are always done in list format to maximize information captured.
          if DEBUG: print("Reducing %s partial summaries into one..."%(len(temp_summary_group)))
          custom_prompt = self.get_prompt(temp_summary_group,"merge_summaries","list", prompt_options['manual_guidance'], prompt_options['style_guide'])
          temp_summary = self.ask_claude(custom_prompt)[1]
          new_summaries_list.append(temp_summary)
          summaries_list_token_count+= self.count_tokens(temp_summary)
          temp_summary_group = []
          temp_summary_group_token_length = 0
        
        temp_summary_group.append(summary)
        temp_summary_group_token_length+= self.count_tokens(summary)
        
        #summarize whever extra summaries are still in the temp list
        if len(temp_summary_group)>1:
          if DEBUG: 
            print("Starting final reduction of %s partial summaries into one..."%(len(temp_summary_group)))

          custom_prompt = self.get_prompt(temp_summary_group,"merge_summaries","list", prompt_options['manual_guidance'], prompt_options['style_guide'])
          temp_summary = self.ask_claude(custom_prompt)[1]
          new_summaries_list.append(temp_summary)
          summaries_list_token_count+= self.count_tokens(temp_summary)
        elif len(temp_summary_group)==1:
          if DEBUG: 
            print("Tacking on an extra partial summary")
            
          new_summaries_list.append(temp_summary_group[0])
          summaries_list_token_count+= self.count_tokens(temp_summary_group[0])
            
        summaries_list = new_summaries_list
        
    if DEBUG: 
      print ("Final merge of summary chunks, merging %s summaries."%(len(summaries_list)))

    custom_prompt = self.get_prompt(summaries_list,"merge_summaries",prompt_options['format_type'], prompt_options['manual_guidance'], prompt_options['style_guide'])
    full_summary = self.ask_claude(custom_prompt)[1]
    
    return full_summary
  