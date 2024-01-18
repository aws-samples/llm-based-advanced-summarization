import { TextField } from "@mui/material";

export interface PasteTextFormProps {
  inputFieldName: string;
  inputFormRegister: any; // No typescript support for react hook form.
}

function PasteTextInput({ inputFieldName, inputFormRegister }: PasteTextFormProps) {
  return (
    <TextField
      id="outlined-multiline-flexible"
      label="Text To Summarize"
      multiline
      maxRows={16}
      minRows={16}
      sx={{ margin: '10px', padding: '10px' }}
      {...inputFormRegister(inputFieldName)}
    />
  )
}

export default PasteTextInput