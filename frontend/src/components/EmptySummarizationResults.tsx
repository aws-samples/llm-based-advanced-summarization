import { Grid, Typography } from "@mui/material";

export interface EmptySummarizationResults {
  results: string;
}


function EmptySummarizationResults() {
  return (
    <Grid item xs={12} sx={{ 
      background: '#f7fafd', // slightly darker color
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000, // place above other content
      height: '68vh',
      padding: '20px'
    }}>
      <p> <Typography> Fill out the form on the left to see your generated content here </Typography></p>
    </Grid>
  )
}

export default EmptySummarizationResults;
