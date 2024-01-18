
import { useForm } from 'react-hook-form';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid'
import { Dispatch, SetStateAction } from 'react';
import APIService from '../api/ApiService';
import { SummarizationType } from '../types/SummarizationType';
import { SummarizationResponse, UploadDocsResponse } from '../types/APIResponses';
import { MultiDocSummarizationRequest, SingleInputSummarizationRequest } from '../types/APIRequests';
import UploadFileInput from './UploadFileInput';
import PasteTextInput from './PasteTextInput';

export interface SummarizationFormProps {
  activeTab: number;
  setSummarizationOutput: Dispatch<SetStateAction<string>>;
  setSteps: Dispatch<SetStateAction<any[]>>;
  method: SummarizationType;
  selectedFiles: File[];
  setSelectedFiles: Dispatch<SetStateAction<File[]>>;
  setStepperStep: Dispatch<SetStateAction<number>>;
}


interface SummarizationFormValues {
  textToSummarize?: string,
  uploadLocation?: string,
  descriptionOfDocuments?: string, 
  questions?: string[],
}


function SummarizationForm({ activeTab, setSummarizationOutput, setSteps, method, selectedFiles, setSelectedFiles, setStepperStep }: SummarizationFormProps) {

  const { register, handleSubmit }  = useForm<SummarizationFormValues>({
    defaultValues: {
      textToSummarize: '',
      uploadLocation: ''
    }
  });

  const onFormSubmit = async (data: SummarizationFormValues) => {

    // We'll make 2 API calls here. First one is to upload the files and create a location for them. 
    // In the future, it could be nice to retrieve them if the request fails for a different reason for retries.
    if (selectedFiles.length > 0) {
      const uploadResponse: UploadDocsResponse  = await APIService.uploadDocuments({files: selectedFiles});
      data.uploadLocation = uploadResponse.uploadLocation;
    }

    // Multi doc is handled differently than the rest. Handle it separately and short circuit.
    if (method == SummarizationType.MULTI_DOC) {
      const multiDocRequest: MultiDocSummarizationRequest = {
        uploadLocation: data.uploadLocation ? data.uploadLocation : '',
        descriptionOfDocuments: data.descriptionOfDocuments ? data.descriptionOfDocuments : '',
        questions: data.questions ? data.questions : []
      }
      const multiDocResponse: SummarizationResponse = await APIService.multiDoc(multiDocRequest);
      setSummarizationOutput(multiDocResponse.results);
      setSteps(multiDocResponse.steps);
      setSelectedFiles([]); // Reset the files after we've summarized them.
      return;
    }
    

    const request: SingleInputSummarizationRequest = {
      textToSummarize: data.textToSummarize,
      uploadLocation: data.uploadLocation
    };

    let response: SummarizationResponse;
    switch (method) {
      case SummarizationType.STUFF_IT:
        response = await APIService.stuffIt(request);
        break;
      case SummarizationType.MAP_REDUCE:
        response = await APIService.mapReduce(request);
        break;
      case SummarizationType.AUTO_REFINE:
        response = await APIService.autoRefine(request);
        break;
      default:
        response = await APIService.stuffIt(request);
        // do nothing
    }
    
    setSummarizationOutput(response.results);
    setSteps(response.steps);
    // Reset the files after we've used them
    setSelectedFiles([]); 
    setStepperStep(1);
    return;
  }
  
  return (
    <form noValidate onSubmit={handleSubmit(onFormSubmit)}> 
      <Grid container spacing={18} sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Grid item xs={12}>
          <FormControl fullWidth size="small">
            {activeTab === 0 && <PasteTextInput inputFieldName={'textToSummarize'} inputFormRegister={register} />}
            {activeTab === 1 && <UploadFileInput selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} method={method} inputFormRegister={register} />}
          </FormControl>
        </Grid>
        <Grid item  xs={12}  spacing={8} sx={{ display: 'flex', justifyContent: 'space-between', margin: '8px' }}>
          <Button variant="outlined">Clear Input</Button>
          <Button type='submit' variant="contained">Submit</Button>
        </Grid>
      </Grid>
    </form>
  )
}

export default SummarizationForm;