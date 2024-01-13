import { useState } from 'react';
import Grid from '@mui/material/Grid';
import SummarizationForm from '../components/SummarizationForm';
import Typography from '@mui/material/Typography';
import { Button } from '@mui/material';
import SummarizationResults from '../components/SummarizationResults';
import ProgressStepper from '../components/ProgressStepper';
import CustomTabs from '../components/CustomTabs';

export enum SummarizationType {
  STUFF_IT = "Stuff It",
  MAP_REDUCE = "Map Reduce",
  AUTO_REFINE = "Auto Refine",
  MULTI_DOC = "Multi Doc"
}

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
  const [summarizationOutput, setSummarizationOutput] = useState<string>('');
  const [summarizationStep, setSummarizationStep] = useState<any[]>([]);

  return (
      <Grid container alignItems="stretch" >
        <Grid item xs={4} sx={{ justifyContent: 'center', verticalAlign: "bottom" }}> 
          <h2><Typography sx={{fontSize: 24}}>Summarization: Stuff-It</Typography></h2>
        </Grid>
        <Grid item xs={8}> 
          <ProgressStepper />
        </Grid>
        <Grid item xs={4} sx={{ border: '1px solid #ddd' }}>
          <CustomTabs initialValue={textOrFileActiveTab} onChange={setTextOrFileActiveTab} tabs={textOrFileTabs}/>
          <SummarizationForm activeTab={textOrFileActiveTab} setSummarizationOutput={setSummarizationOutput} setSteps={setSummarizationStep}/>
        </Grid>
        <Grid item xs={8} sx={{ border: '1px solid #ddd' }}>
          <CustomTabs initialValue={resultsOrStepsActiveTab} onChange={setResultsOrStepsActiveTab} tabs={resultsOrStepsTabs}/>
          <SummarizationResults summarizationOutput={summarizationOutput} steps={summarizationStep} />
        </Grid>
      </Grid>
  )
}

export default SummarizationView;