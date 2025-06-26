import { useContext, React } from "react"
import Box from "@mui/material/Box"
import Divider from "@mui/material/Divider"
import Paper from "@mui/material/Paper"
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { Typography } from "@mui/material";
import { GlobalDataContext } from "../data/GlobalData"

export default function AboutPage() {
    //const theme = useTheme()
    const globals = useContext(GlobalDataContext)

    const onValueChanged = (newValue) => {
        globals.setApiHost(newValue.url)
      };

    return (
        <Box
            display="flex"
            justifyContent="center">

            <Paper
                sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    m: 1,
                    width: 900
                }}
            >
                <Divider textAlign="left">TESTING</Divider>
                <Typography sx={{ mt: 3 }}>
                    The Test server can be used for testing the integration of new hazard indicators. 
                </Typography>
                <Autocomplete
                    sx={{
                        mt: 2,
                        width: 600
                    }}
                    disablePortal
                    defaultValue={options[0]}
                    id="physrisk-server"
                    onChange={(event, newValue) => {
                        onValueChanged(newValue)
                    }}
                    options={options}
                    size="small"
                    renderOption={(props, option) => (
                        <Box component="li" {...props}>

                          {option.label} ({option.url})
                        </Box>
                      )}
                    renderInput={(params) => <TextField {...params} label="Physrisk server" />}
                />
            </Paper>
        </Box>
    )
}

const BaseAPI = window.BASE_API;

const options = [
    { label: 'Production', url: "https://physrisk-api2-sandbox.apps.odh-cl1.apps.os-climate.org" },
    { label: 'Test', url: "https://physrisk-api-uat-sandbox.apps.odh-cl1.apps.os-climate.org" },
    { label: 'afs', url: `${BaseAPI}` },
    { label: 'Local', url: "http://127.0.0.1:5000" }
  ];
  
