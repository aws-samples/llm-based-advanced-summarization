import { Step, StepLabel, Stepper } from "@mui/material";

export interface ProgressStepperProps {
  activeStep: number;
}

function ProgressStepper({ activeStep }: ProgressStepperProps) {
  return (
      <Stepper activeStep={activeStep} alternativeLabel sx={{ padding: '20px' }}>
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