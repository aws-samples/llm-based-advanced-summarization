import * as React from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

export interface CustomTabsProps {
  initialValue: number;
  onChange: (newValue: number) => void;
  tabs: { name: string; value: string }[];
}

function a11yProps(index: number) {
  return {
    id: `custom-tab-${index}`,
    'aria-controls': `custom-tabpanel-${index}`,
  };
}

function CustomTabs(props: CustomTabsProps) {
  const [value, setValue] = React.useState(props.initialValue);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    props.onChange(newValue);
    event.preventDefault()
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="Custom Tabs">
          {props.tabs.map((tab, index) => (
            <Tab key={index} label={tab.name} {...a11yProps(index)} />
          ))}
        </Tabs>
      </Box>
    </Box>
  );
}

export default CustomTabs;
