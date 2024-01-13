import Grid from '@mui/material/Grid';

export interface SummarizationResultsProps {
  // activeTab: string;
  summarizationOutput: string;
  steps: any[];
}

function SummarizationResults({ summarizationOutput, steps }: SummarizationResultsProps) {
  return (
    <Grid item xs={12} sx={{ 
      // bottom: 0,
      // right: 0,
      background: '#f7fafd', // slightly darker color
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000, // place above other content
      height: '68vh'
    }}>
      <h1> { summarizationOutput } </h1>
    </Grid>
  )
}

export default SummarizationResults;