import { Grid, Typography } from "@mui/material";

export interface SummarizationResultsContentProp {
  results: string;
  time: string;
}


function SummarizationResults({ results, time }: SummarizationResultsContentProp) {

  const formattedResults: JSX.Element[] = results.split('\n').map((line, index) => (
    <span key={index}>
      {line}
      <br />
    </span>
  ));

  return (
    <Grid container sx={{ background: '#f7fafd', padding:'20px' }}>
      <Grid item xs={12}>
        <Typography variant="h6">Status: Success Time: {time} </Typography>
      </Grid>
      <Grid item xs={12} sx={{ 
        background: '#f7fafd', // slightly darker color
        display: 'flex',
        alignItems: 'left',
        justifyContent: 'left',
        zIndex: 1000, // place above other content
        height: '100%',
        overflow: 'auto',
        border: '1px solid #ccc'
      }}>
        <Typography  component={'span'}>{ formattedResults } </Typography>
      </Grid>
    </Grid>
  )
}

export default SummarizationResults;
