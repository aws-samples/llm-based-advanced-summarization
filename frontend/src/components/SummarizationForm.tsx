
import { useForm } from 'react-hook-form';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid'

import ArrowCircleUp from '@mui/icons-material/ArrowCircleUp';
import { ButtonBase, Typography } from '@mui/material';
import React, { Dispatch, SetStateAction } from 'react';
import APIService, { SummarizationResponse, SingleInputSummarizationRequest, MultiDocSummarizationRequest, UploadDocsResponse } from '../api/ApiService';
import { SummarizationType } from '../views/SummarizationView';


export interface SummarizationFormProps {
  activeTab: number;
  setSummarizationOutput: Dispatch<SetStateAction<string>>;
  setSteps: Dispatch<SetStateAction<any[]>>;
  method: SummarizationType;
  selectedFiles: File[];
  setSelectedFiles: Dispatch<SetStateAction<File[]>>;
  setStepperStep: Dispatch<SetStateAction<number>>;
}

export interface UploadFileInputProps {
  selectedFiles: File[];
  setSelectedFiles: Dispatch<SetStateAction<File[]>>;
  method: SummarizationType;
  inputFormRegister: any; // No typescript support for react hook form.
}

export interface PasteTextFormProps {
  inputFieldName: string;
  inputFormRegister: any; // No typescript support for react hook form.
}


interface SummarizationFormValues {
  textToSummarize?: string,
  uploadLocation?: string,
  descriptionOfDocuments?: string, 
  questions?: string[],
}


function PasteTextInput({ inputFieldName, inputFormRegister }: PasteTextFormProps) {
  return (
    <TextField
      id="outlined-multiline-flexible"
      label="Text To Summarize"
      multiline
      maxRows={16}
      minRows={16}
      sx={{ margin: '10px', padding: '10px' }}
      {...inputFormRegister(inputFieldName)}
    />
  )
}

function UploadFileInput({selectedFiles, setSelectedFiles, method, inputFormRegister }: UploadFileInputProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Helper click functions
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(selectedFiles.concat(Array.from(event.target.files)));
    }
  };
  // End helper click functions
  return (
    // <Grid container>
      <Grid container sx={{margin: '10px', padding: '10px'}}>
        <ButtonBase onClick={handleUploadClick} style={{ width: '100%', display: 'block', padding: '10px', margin: '10px' }}>
          <Grid sx={{ 
            border: 1, 
            borderColor: 'divider', 
            borderStyle:"dashed", 
            borderRadius:"4px", 
            borderWidth:"3px",
            alignItems: "center",
            justifyContent: "center",
            display: "grid",
            padding: "20px",  }}
          >
            <input type='file' ref={fileInputRef} style={{display: 'none'}} multiple onChange={handleFileChange}/>
            <Grid item xs={12} sx={{justifyContent: 'center', display: 'inline-flex', margin:'5px'}}>
              <ArrowCircleUp sx={{fontSize:'60px', color: selectedFiles.length > 0 ? "green" : "gray" }}/>
            </Grid>
            <Grid item xs={12} sx={{justifyContent: 'center', display: 'inline-flex', margin:'5px'}}>
              {
                selectedFiles.length == 0 ? 
                  <Typography>Click here to upload files.</Typography> 
                  : (
                    <ul>
                      {selectedFiles.map((file: File, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  )
              }
            </Grid>
            <Grid item xs={12} sx={{justifyContent: 'center', display: 'inline-flex', margin:'5px'}}>
              <Button variant="contained" size="small">Upload File</Button>
            </Grid>
          </Grid>
        </ButtonBase>
      {
        method == SummarizationType.MULTI_DOC && (
          <Grid item xs={12} sx={{padding: '10px'}}>
            <TextField
              id="outlined-basic"
              label="Description of Documents"
              variant="outlined"
              sx={{ padding: '5px' }}
              {...inputFormRegister('descriptionOfDocuments')}
              fullWidth
            />
            <TextField
              id="outlined-basic"
              label="Questions (comma separated)"
              variant="outlined"
              sx={{padding: '5px' }}
              {...inputFormRegister('questions')}
              fullWidth
            />
          </Grid>
        )
      }
    </Grid>
  )
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
      // Reset the files after we've uploaded them.
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

    console.log(request)
    console.log(data);

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
        <Grid item  xs={12}  sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type='submit' variant="contained">Submit</Button>
        </Grid>
      </Grid>
    </form>
  )
}

export default SummarizationForm;