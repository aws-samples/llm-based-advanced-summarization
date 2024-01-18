import { ArrowCircleUp } from "@mui/icons-material";
import { Button, ButtonBase, Grid, TextField, Typography } from "@mui/material";
import { SummarizationType } from "../types/SummarizationType";
import React, { Dispatch, SetStateAction } from "react";

export interface UploadFileInputProps {
  selectedFiles: File[];
  setSelectedFiles: Dispatch<SetStateAction<File[]>>;
  method: SummarizationType;
  inputFormRegister: any; // No typescript support for react hook form.
}

function UploadFileInput({selectedFiles, setSelectedFiles, method, inputFormRegister }: UploadFileInputProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Helper click functions
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(selectedFiles.concat(Array.from(event.target.files)));
    }
  };
  // End helper click functions
  return (
    // <Grid container>
      <Grid container sx={{margin: '10px', padding: '10px'}}>
        <ButtonBase onClick={handleUploadClick} style={{ width: '100%', display: 'block', padding: '10px', margin: '10px' }}>
          <Grid sx={{ 
            border: 1, 
            borderColor: 'divider', 
            borderStyle:"dashed", 
            borderRadius:"4px", 
            borderWidth:"3px",
            alignItems: "center",
            justifyContent: "center",
            display: "grid",
            padding: "20px",  }}
          >
            <input type='file' ref={fileInputRef} style={{display: 'none'}} multiple onChange={handleFileChange}/>
            <Grid item xs={12} sx={{justifyContent: 'center', display: 'inline-flex', margin:'5px'}}>
              <ArrowCircleUp sx={{fontSize:'60px', color: selectedFiles.length > 0 ? "green" : "gray" }}/>
            </Grid>
            <Grid item xs={12} sx={{justifyContent: 'center', display: 'inline-flex', margin:'5px'}}>
              {
                selectedFiles.length == 0 ? 
                  <Typography>Click here to upload files.</Typography> 
                  : (
                    <ul>
                      {selectedFiles.map((file: File, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  )
              }
            </Grid>
            <Grid item xs={12} sx={{justifyContent: 'center', display: 'inline-flex', margin:'5px'}}>
              <Button variant="contained" size="small">Upload File</Button>
            </Grid>
          </Grid>
        </ButtonBase>
      {
        method == SummarizationType.MULTI_DOC && (
          <Grid item xs={12} sx={{padding: '10px'}}>
            <TextField
              id="outlined-basic"
              label="Description of Documents"
              variant="outlined"
              sx={{ padding: '5px' }}
              {...inputFormRegister('descriptionOfDocuments')}
              fullWidth
            />
            <TextField
              id="outlined-basic"
              label="Questions (comma separated)"
              variant="outlined"
              sx={{padding: '5px' }}
              {...inputFormRegister('questions')}
              fullWidth
            />
          </Grid>
        )
      }
    </Grid>
  )
}

export default UploadFileInput;