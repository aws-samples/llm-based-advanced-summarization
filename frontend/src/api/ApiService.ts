

const SERVER = 'localhost:5000';
const UPLOAD_URL = '/upload-docs';
const STUFF_IT_URL = '/stuff-it';
const MAP_REDUCE = '/map-reduce';
const AUTO_REFINE = '/auto-refine';
const MULTI_DOC = '/multi-doc'

export interface SingleInputSummarizationRequest {
  textToSummarize?: string,
  uploadLocation?: string
}

export interface MultiDocSummarizationRequest {
  uploadLocation: string
  descriptionOfDocuments: string,
  questions: string[]
}

export interface UploadDocsRequest {
  files: File[],
}

export interface UploadDocsResponse {
  uploadLocation: string
}

export interface SummarizationStep {
  action: string;
  input: string;
  result: string;
}

export interface SummarizationResponse {
  results: string;
  steps: SummarizationStep[];
  time: string;
}

class APIService {

  static async uploadDocuments(request: UploadDocsRequest): Promise<UploadDocsResponse> {

    // Use FormData to upload the files to the server.
    const formData = new FormData();
    request.files.forEach(file => {
      formData.append('files', file);
    });

    const url: string = await this.buildUrl(SERVER, UPLOAD_URL);
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });
    return response.json();
  }

  static async stuffIt(request: SingleInputSummarizationRequest): Promise<SummarizationResponse> {
    const url: string = await this.buildUrl(SERVER, STUFF_IT_URL);
    return await this.summarizationFetch(request, url);
  }

  static async mapReduce(request: SingleInputSummarizationRequest): Promise<SummarizationResponse> {
    const url: string = await this.buildUrl(SERVER, MAP_REDUCE);
    return await this.summarizationFetch(request, url);
  }

  static async autoRefine(request: SingleInputSummarizationRequest): Promise<SummarizationResponse> {
    const url: string = await this.buildUrl(SERVER, AUTO_REFINE);
    return await this.summarizationFetch(request, url);
  }

  static async multiDoc(request: MultiDocSummarizationRequest): Promise<SummarizationResponse> {
    const url: string = await this.buildUrl(SERVER, MULTI_DOC);
    return await this.summarizationFetch(request, url);
  }

  static async summarizationFetch(request: object, url: string): Promise<SummarizationResponse> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
    return response.json();
  }

  static async buildUrl(server: string, url: string): Promise<string> {
    return `http://${server}${url}`;
  }
}

export default APIService;