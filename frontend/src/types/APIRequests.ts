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