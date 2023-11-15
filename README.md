## Advanced Summarization Techniques using Generative AI
### Summarize any length of text or group of documents with Amazon Bedrock

In this repo, we examine four different methods of performing summarization.  We will look at the pros and cons of each one, and suggest the best use cases for each.  This includes a system to summarize text from one long source, or from a set of multiple documents.  Here are the four methods:
  1) "stuff it" - place the whole document into a single prompt.
  2) "map reduce" - break the document into parts, summarize each part, then combine them together.
  3) "auto refine" - ask the LLM to find gaps in its own summary, and fill them.
  4) "multi-doc" - sumarize multiple documents on the bases of guidance questions.

Just want to dive in and start summarizing?  Open Examples.ipynb which shows how to use each kind of summarization.

### A brief look at the contents of this repo:
  - Examples.ipynb  Shows how to use the functions defined in the other notebooks.
  - advanced_summarize.ipynb Includes auto-refinement of summarizes for higher quality, as well as summarization for groups of documents.
  - simple_summarize.ipynb Includes two of the most simple, most common types of summarization, useful for basic tasks.
  - Data collection and cleaning.ipynb A utility notebook, for downloading and cleaning data in preparation for summarization.
  - sample texts/ a few sample documents of different lengths, already cleaned and ready to summarize.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

