import { TextField } from "@mui/material";
import { SummarizationType } from "../types/SummarizationType";

const methods: string[] = [
  SummarizationType.STUFF_IT.toString(),
  SummarizationType.MAP_REDUCE.toString(),
  SummarizationType.AUTO_REFINE.toString(),
  SummarizationType.MULTI_DOC.toString()
]

export interface MethodSelectorProps {
  setMethod: (method: SummarizationType) => void;
} 

function MethodSelector({ setMethod }: MethodSelectorProps) {

  const handleMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMethod(event.target.value as SummarizationType);
  };

  return (
    <TextField select defaultValue={methods[0]} SelectProps={{native: true}} onChange={handleMethodChange} label="Summarization Method">
      { 
        methods.map((method: string) => <option key={method} value={method}>{method}</option>) 
      }
    </TextField>
  )
}

export default MethodSelector;