import { useState } from 'react';
import Grid from '@mui/material/Grid';
import SummarizationForm from '../components/SummarizationForm';
import SummarizationResults from '../components/SummarizationResults';
import ProgressStepper from '../components/ProgressStepper';
import CustomTabs from '../components/CustomTabs';
import { SummarizationType } from '../types/SummarizationType';
import SummarizationStep from '../types/SummarizationStep';
import MethodSelector from '../components/MethodSelector';
import AWSAppBar from '../components/AWSAppBar';

const textOrFileTabs = [
  { name: "Paste Text", value: "text" },
  { name: "Upload File", value: "file" },
];

const resultsOrStepsTabs = [
  { name: "Results", value: "results" },
  { name: "Steps", value: "steps" }
];


function SummarizationView() {

  const [textOrFileActiveTab, setTextOrFileActiveTab] = useState<number>(0);
  const [resultsOrStepsActiveTab, setResultsOrStepsActiveTab] = useState<number>(0);
  const [stepperStep, setStepperStep] = useState<number>(0);
  const [summarizationOutput, setSummarizationOutput] = useState<string>('');
  const [summarizationStep, setSummarizationStep] = useState<SummarizationStep[]>([]);
  const [method, setMethod] = useState<SummarizationType>(SummarizationType.STUFF_IT);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  return (
      <Grid container alignItems="stretch" >
        <Grid item xs={12} sx={{padding: '8px'}}>
          <AWSAppBar />
        </Grid>
        <Grid item xs={4} sx={{ justifyContent: 'center', display: 'flex', flexDirection: 'column', verticalAlign: "bottom" }}> 
          <MethodSelector setMethod={setMethod}/>
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