import { useEffect, useRef, useState } from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import ScatterMap from '../components/ScatterMap';
import Stack from '@mui/material/Stack';
import AssetTable from '../components/AssetTable';
import { HazardAvailability } from '../data/HazardDataAvailability.js';
import axios from 'axios';

export default function AssetViewer() {
  const menus = [];
  const [menuOptions, setMenuOptions] = useState([[], [], [], []]);
  const data = useRef();
  const [selectedIndices, setSelectedIndices] = useState([0, 0, 0, 0]);
  const apiHost = 'http://physrisk-api-sandbox.apps.odh-cl1.apps.os-climate.org';
  const [ jsonData, setJsonData ] = useState({"items": []});

  const uploadFile = (event) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = JSON.parse(event.target.result);
      if (content.items) {
        setJsonData(content);
      }
      else {
        // TODO: improve validation (JSON schema?) & error handling
        setJsonData({"items": [{"asset_class": "Invalid file; no asset items found."}]});
      }
    }
    reader.readAsText(event.target.files[0]);
  }

  function getAssetProps()
  {
    var currentOptions = [];
    var currentIndices = [];
    setMenuOptions((current) => { currentOptions = current; return current; });
    setSelectedIndices((current) => { currentIndices = current; return current; });
    var hazard = currentOptions[0][currentIndices[0]];
    return { hazard };
  }

  useEffect(
    async() => {
      var response = await axios.post(apiHost+'/api/get_hazard_data_availability', {});
      data.current = new HazardAvailability(response.data.models);

      const updateMenuOptions = () => {
        var hazardOptions = data.current.getHazardTypeOptions();
        setMenuOptions([]);
        //setMenuOptions([hazardOptions]);
      };

      updateMenuOptions();
    }, [data, selectedIndices]);

  const handleClick = async(e) => {
    // This is currently a no-op.
    // There are no plans for an effect as of writing.
    return
  };

  return (
    <Grid container spacing={3}>
      {/* Map */}
      <Grid item xs={12} md={12} lg={12}>
        <Paper
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <ScatterMap 
            menus={menus}
            menuOptions={menuOptions}
            onClick={handleClick}
            selectedIndices={selectedIndices}
            setSelectedIndices={setSelectedIndices}
            assetData={jsonData}
          />
        </Paper>
      </Grid>
      {/* Asset table */}
      <Grid item xs={12} md={12} lg={12}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <Stack spacing={2} direction="row">
          <Button
              variant="text"
              component="label"
          >
            Upload File
            <input
              type="file"
              multiple={false}
              accept=".json,application/json"
              onChange={uploadFile}
              hidden
            >
            </input>
          </Button>
          </Stack>
          <AssetTable data={jsonData}/>
        </Paper>
      </Grid>
    </Grid>
    );
  }
