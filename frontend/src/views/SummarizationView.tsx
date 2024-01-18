import { useState } from 'react';
import Grid from '@mui/material/Grid';
import SummarizationForm from '../components/SummarizationForm';
import SummarizationResults from '../components/SummarizationResults';
import ProgressStepper from '../components/ProgressStepper';
import CustomTabs from '../components/CustomTabs';
import { TextField } from '@mui/material';
import { SummarizationType } from '../types/SummarizationType';
import SummarizationStep from '../types/SummarizationStep';

const textOrFileTabs = [
  { name: "Paste Text", value: "text" },
  { name: "Upload File", value: "file" },
];

const resultsOrStepsTabs = [
  { name: "Results", value: "results" },
  { name: "Steps", value: "steps" }
];

const methods: string[] = [
  SummarizationType.STUFF_IT.toString(),
    SummarizationType.MAP_REDUCE.toString(),
    SummarizationType.AUTO_REFINE.toString(),
    SummarizationType.MULTI_DOC.toString()
]


function SummarizationView() {

  const [textOrFileActiveTab, setTextOrFileActiveTab] = useState<number>(0);
  const [resultsOrStepsActiveTab, setResultsOrStepsActiveTab] = useState<number>(0);
  const [stepperStep, setStepperStep] = useState<number>(0);
  const [summarizationOutput, setSummarizationOutput] = useState<string>('');
  const [summarizationStep, setSummarizationStep] = useState<SummarizationStep[]>([]);
  const [method, setMethod] = useState<SummarizationType>(SummarizationType.STUFF_IT);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMethod(event.target.value as SummarizationType);
  };

  return (
      <Grid container alignItems="stretch" >
        <Grid item xs={4} sx={{ justifyContent: 'center', display: 'flex', flexDirection: 'column', verticalAlign: "bottom" }}> 
          <TextField select defaultValue={methods[0]} SelectProps={{native: true}} onChange={handleMethodChange} label="Summarization Method">
            {
              methods.map((method: string) => <option key={method} value={method}>{method}</option>)
            }
          </TextField>
        </Grid>
        <Grid item xs={8}> 
          <ProgressStepper activeStep={stepperStep}/>
        </Grid>
        <Grid item xs={4} sx={{ border: '1px solid #ddd' }}>
          <CustomTabs 
            initialValue={textOrFileActiveTab} 
            onChange={setTextOrFileActiveTab} 
            tabs={textOrFileTabs}
          />
          <SummarizationForm 
            activeTab={textOrFileActiveTab} 
            setSummarizationOutput={setSummarizationOutput} 
            setSteps={setSummarizationStep} 
            method={method} 
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
            setStepperStep={setStepperStep}
          />
        </Grid>
        <Grid item xs={8} sx={{ border: '1px solid #ddd' }}>
          <CustomTabs 
            initialValue={resultsOrStepsActiveTab} 
            onChange={setResultsOrStepsActiveTab} 
            tabs={resultsOrStepsTabs}
          />
           <SummarizationResults 
              summarizationOutput={summarizationOutput} 
              steps={summarizationStep}
              resultsOrStepsActiveTab={resultsOrStepsActiveTab}
            />
        </Grid>
      </Grid>
  )
}

export default SummarizationView;