import { Accordion, AccordionDetails, AccordionSummary, Grid, Typography } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


export interface SummarizationStepsProps {
  steps: SummarizationStep[];
}

export interface SummarizationStep {
  action: string;
  input: string;
  results: string;
}

function SummarizationSteps({ steps }: SummarizationStepsProps) {
  return (
    <Grid container spacing={1}>
      {steps.map((step, index) => (
        <Grid item xs={12} key={index}>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1a-content"
            >
              <Typography>{step.action}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Input:</Typography>
                    <Typography>{step.input}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Output:</Typography>
                    <Typography>{step.results}</Typography>
                  </Grid>
                </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
      ))}
    </Grid>
  )
}

export default SummarizationSteps;