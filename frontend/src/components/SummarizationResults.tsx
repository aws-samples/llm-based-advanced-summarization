import { Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import SummarizationSteps from './SummarizationSteps';

export interface SummarizationResultsProps {
  // activeTab: string;
  summarizationOutput: string;
  steps: any[];
  resultsOrStepsActiveTab: number;
}

export interface SummarizationStepsProps {
  results: string[];
}

export interface SummarizationResultsContentProp {
  results: string;
}


function SummarizationResultsContent({ results }: SummarizationResultsContentProp) {
  return (
    <Grid item xs={12} sx={{ 
      // bottom: 0,
      // right: 0,
      background: '#f7fafd', // slightly darker color
      display: 'flex',
      alignItems: 'left',
      justifyContent: 'left',
      zIndex: 1000, // place above other content
      height: '68vh',
      padding: '20px'
    }}>
      <p> <Typography>{ results } </Typography></p>
    </Grid>
  )
}

function SummarizationResults({ summarizationOutput, steps, resultsOrStepsActiveTab }: SummarizationResultsProps) {
  return (
    <div>
      { resultsOrStepsActiveTab == 0 && <SummarizationResultsContent  results={summarizationOutput} /> }
      { resultsOrStepsActiveTab == 1 && <SummarizationSteps steps={steps} /> }
    </div>
  )
}

export default SummarizationResults;