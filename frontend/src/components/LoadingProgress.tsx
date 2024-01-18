import { CircularProgress, Grid, LinearProgress, Typography } from "@mui/material";


export interface LoadingProgressProps {
  progress: number;
}

function LoadingProgress({ progress }: LoadingProgressProps) {
  return (
    <Grid container>
      <Grid item xs={12}>
          <LinearProgress />
      </Grid>
      <Grid item xs={12} spacing={2} sx={{ 
        background: '#f7fafd', // slightly darker color
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000, // place above other content
        height: '68vh',
        padding: '20px'
      }}>
          <CircularProgress />
          <div><Typography> Generating your summary </Typography></div>
      </Grid>
    </Grid>
  )
}

export default LoadingProgress;