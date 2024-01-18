
import { useForm } from 'react-hook-form';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid'
import { Dispatch, SetStateAction } from 'react';
import APIService from '../api/ApiService';
import { SummarizationType } from '../types/SummarizationType';
import { SummarizationResponse, UploadDocsResponse } from '../types/APIResponses';
import { MultiDocSummarizationRequest, SingleInputSummarizationRequest } from '../types/APIRequests';
import UploadFileInput from '../components/UploadFileInput';
import PasteTextInput from '../components/PasteTextInput';

export interface SummarizationFormProps {
  activeTab: number;
  setSummarizationOutput: Dispatch<SetStateAction<string>>;
  setSteps: Dispatch<SetStateAction<any[]>>;
  method: SummarizationType;
  selectedFiles: File[];
  setSelectedFiles: Dispatch<SetStateAction<File[]>>;
  setStepperStep: Dispatch<SetStateAction<number>>;
  setLoadingProgress: Dispatch<SetStateAction<number>>;
}


interface SummarizationFormValues {
  textToSummarize?: string,
  uploadLocation?: string,
  descriptionOfDocuments?: string, 
  questions?: string,
}


function InputFormContainer({ activeTab, setSummarizationOutput, setSteps, method, selectedFiles, setSelectedFiles, setStepperStep, setLoadingProgress }: SummarizationFormProps) {

  const { register, handleSubmit, reset }  = useForm<SummarizationFormValues>({
    defaultValues: {
      textToSummarize: '',
      uploadLocation: ''
    }
  });

  const onFormSubmit = async (data: SummarizationFormValues) => {

    setLoadingProgress(50)

    // We'll make 2 API calls here. First one is to upload the files and create a location for them. 
    // In the future, it could be nice to retrieve them if the request fails for a different reason for retries.
    if (selectedFiles.length > 0) {
      const uploadResponse: UploadDocsResponse  = await APIService.uploadDocuments({files: selectedFiles});
      data.uploadLocation = uploadResponse.uploadLocation;
    }

    let response: SummarizationResponse;

    // Multi doc is handled differently than the rest. Handle it separately and short circuit.
    if (method == SummarizationType.MULTI_DOC) {
      const multiDocRequest: MultiDocSummarizationRequest = {
        uploadLocation: data.uploadLocation ? data.uploadLocation : '',
        descriptionOfDocuments: data.descriptionOfDocuments ? data.descriptionOfDocuments : '',
        questions: data.questions ? data.questions : ''
      }
      response = await APIService.multiDoc(multiDocRequest);
    } else {
      // Create request that's shared between all the other summarization types.
      const request: SingleInputSummarizationRequest = {
        textToSummarize: data.textToSummarize,
        uploadLocation: data.uploadLocation
      };
  
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
      }
    }
    
    setSummarizationOutput(response.results);
    setSteps(response.steps);
    setStepperStep(1);

    // Set loading progress back to zero so state updates when you clear the input.
    setLoadingProgress(0)

    return;
  }

  const onInputCleared = async () => {
    setSelectedFiles([]);
    setStepperStep(0);
    
    reset({ 
      textToSummarize: '',
      questions: '',
      descriptionOfDocuments: '',
      uploadLocation: ''
    })
  }
  
  return (
    <form noValidate onSubmit={handleSubmit(onFormSubmit)}> 
      <Grid container spacing={18} sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Grid item xs={12}>
          {/* Based on the tab selected, we'll display either the past text  */}
          <FormControl fullWidth size="medium">
            {
              activeTab === 0 && (
                <PasteTextInput inputFieldName={'textToSummarize'} inputFormRegister={register} />
              )
            }
            {
              activeTab === 1 && (
                <UploadFileInput 
                  selectedFiles={selectedFiles}  
                  setSelectedFiles={setSelectedFiles} 
                  method={method} 
                  inputFormRegister={register} 
                />
              )
            }
          </FormControl>
        </Grid>
        <Grid item  xs={12}  spacing={8} sx={{ display: 'flex', justifyContent: 'space-between', margin: '8px' }}>
          <Button variant="outlined" onClick={onInputCleared}>Clear Input</Button>
          <Button type='submit' variant="contained">Submit</Button>
        </Grid>
      </Grid>
    </form>
  )
}

export default InputFormContainer;