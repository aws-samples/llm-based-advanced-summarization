
import { useForm } from 'react-hook-form';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid'

import ArrowCircleUp from '@mui/icons-material/ArrowCircleUp';
import { Typography } from '@mui/material';
import { Dispatch, SetStateAction } from 'react';


export interface SummarizationFormProps {
  activeTab: number;
  setSummarizationOutput: Dispatch<SetStateAction<string>>;
  setSteps: Dispatch<SetStateAction<any[]>>;
}

export interface PasteTextFormProps {
  inputFieldName: string;
  inputFormRegister: any; // No typescript support for reach hook form.
}


interface SummarizationFormValues {
  inputType: string,
  textToSummarize: string,
  inputLocation: string
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

function UploadFileInput() {
  return (
    <Grid sx={{margin: '10px', padding: '10px'}}>
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
        <Grid item xs={12} sx={{justifyContent: 'center', display: 'inline-flex', margin:'5px'}}>
          <ArrowCircleUp sx={{fontSize:'60px', color:"gray"}}/>
        </Grid>
        <Grid item xs={12} sx={{justifyContent: 'center', display: 'inline-flex', margin:'5px'}}>
          <Typography>Drag and Drop File Here</Typography>
        </Grid>
        <Grid item xs={12} sx={{justifyContent: 'center', display: 'inline-flex', margin:'5px'}}>
          <Button variant="contained" size="small">Upload File</Button>
        </Grid>
      </Grid>
    </Grid>
  )
}


function SummarizationForm({ activeTab, setSummarizationOutput, setSteps }: SummarizationFormProps) {


  const { register, handleSubmit }  = useForm<SummarizationFormValues>({
    defaultValues: {
      inputType: activeTab,
      textToSummarize: '',
      inputLocation: ''
    }
  });

  const onFormSubmit = (data: SummarizationFormValues) => {
    console.log(data);
    setSummarizationOutput(data.textToSummarize);
    setSteps([]);
    
  }
  
  return (
    <form noValidate onSubmit={handleSubmit(onFormSubmit)}> 
      <Grid container spacing={18} sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Grid item xs={12}>
          <FormControl fullWidth size="small">
            {activeTab === 0 && <PasteTextInput inputFieldName={'textToSummarize'} inputFormRegister={register} />}
            {activeTab === 1 && <UploadFileInput />}
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