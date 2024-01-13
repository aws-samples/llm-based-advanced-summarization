import { Step, StepLabel, Stepper } from "@mui/material";


function ProgressStepper() {
  return (
      <Stepper activeStep={0} alternativeLabel sx={{ padding: '20px' }}>
        <Step>
          <StepLabel>Enter your input</StepLabel>
        </Step>
        <Step>
          <StepLabel>View Results</StepLabel>
        </Step>
    </Stepper>
  )
}

export default ProgressStepper;