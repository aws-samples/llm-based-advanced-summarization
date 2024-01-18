import { Grid, Typography } from "@mui/material";

export interface SummarizationResultsContentProp {
  results: string;
}


function SummarizationResults({ results }: SummarizationResultsContentProp) {
  return (
    <Grid item xs={12} sx={{ 
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

export default SummarizationResults;
