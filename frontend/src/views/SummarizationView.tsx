import { useState } from 'react';
import Grid from '@mui/material/Grid';
import InputFormContainer from '../containers/InputFormContainer';
import ResultsContainer from '../containers/ResultsContainer';
import ProgressStepper from '../components/ProgressStepper';
import CustomTabs from '../components/CustomTabs';
import { SummarizationType } from '../types/SummarizationType';
import SummarizationStep from '../types/SummarizationStep';
import MethodSelector from '../components/MethodSelector';
import AWSAppBar from '../components/AWSAppBar';
import { Button } from '@mui/material';

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
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [time, setTime] = useState<string>('');

  const clearResults = () => {
    setStepperStep(0)
    setSummarizationOutput('')
    setSummarizationStep([])
  }

  return (
      <Grid container sx={{ height: '80vh' }} >
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
          <InputFormContainer 
            activeTab={textOrFileActiveTab} 
            setSummarizationOutput={setSummarizationOutput} 
            setSteps={setSummarizationStep} 
            method={method} 
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
            setStepperStep={setStepperStep}
            setLoadingProgress={setLoadingProgress}
            setTime={setTime}
          />
        </Grid>
        <Grid item xs={8} sx={{ border: '1px solid #ddd' }}>
          <Grid container>
            <Grid item xs={6} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
              <CustomTabs 
                initialValue={resultsOrStepsActiveTab} 
                onChange={setResultsOrStepsActiveTab} 
                tabs={resultsOrStepsTabs}
              />
            </Grid>
            <Grid item xs={6} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', verticalAlign: 'center', height: 'auto', padding:'8px'}}>
              <Button variant='outlined' size="small" onClick={clearResults}>Clear Results</Button>
            </Grid>
          </Grid>
           <ResultsContainer 
              summarizationOutput={summarizationOutput} 
              steps={summarizationStep}
              resultsOrStepsActiveTab={resultsOrStepsActiveTab}
              progress={loadingProgress}
              time={time}
            />
        </Grid>
      </Grid>
  )
}

export default SummarizationView;