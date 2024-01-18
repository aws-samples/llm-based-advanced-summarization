import SummarizationStep from "./SummarizationStep";

export interface UploadDocsResponse {
  uploadLocation: string
}

export interface SummarizationResponse {
  results: string;
  steps: SummarizationStep[];
  time: string;
}