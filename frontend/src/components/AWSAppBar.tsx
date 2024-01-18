import { AppBar, Toolbar, Typography } from "@mui/material";

function AWSAppBar() {
  return (
    <AppBar position="static" style={{ backgroundColor: '#1d1d1d' }}>
      <Toolbar variant="dense" >
        <img src="/src/assets/logo.svg" alt="Logo" style={{ height: '20px', marginRight: '10px' }} />
        <Typography variant="h6" color="inherit" component="div">
          Advanced Summarization Demo
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default AWSAppBar;