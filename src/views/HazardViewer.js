import { useEffect, useRef, useState } from 'react';
import Chart from '../components/Chart';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import ScatterMap from '../components/ScatterMap';
import Summary from '../components/Summary';
import AssetTable from '../components/AssetTable';
import { inventory, HazardAvailability } from '../data/HazardDataAvailability.js';

export default function HazardViewer() {
  
  const menus = [
    {
      name: "Hazard type",
      size: "medium"
    },
    {
      name: "Model",
      size: "small"
    },
    {
      name: "Scenario",
      size: "small"
    },
    {
      name: "Year",
      size: "small"
    },
  ];

  const [menuOptions, setMenuOptions] = useState([[], [], [], []])  
  const data = useRef();
  const [selectedIndices, setSelectedIndices] = useState([0, 0, 0, 0]);
  const [lngLat, setLngLat] = useState(null);
  
  const fetchData = async(request_id, json) => 
  {
    const response = await fetch("http://physrisk-api-sandbox.apps.odh-cl1.apps.os-climate.org/api/get_hazard_data", { 
        method: 'POST',
        body: json });
    const data = await response.json();
    // update graph here
  }

  const handleClick = (e) => {
    setLngLat(e.lngLat)
    const request = {
      "items": [
          {
              "request_item_id": "test_inundation",
              "event_type": "RiverineInundation",
              "longitudes": [69.4787],
              "latitudes": [34.556],
              "year": 2080,
              "scenario": "rcp8p5",
              "model": "MIROC-ESM-CHEM",
          }
      ],
    }
    //fetchData("get_hazard_data", JSON.stringify(request))
  };
  
  useEffect(
     () => {
      data.current = new HazardAvailability(JSON.stringify(inventory));
    }, [])

  useEffect(
    () => {
      const updateMenuOptions = () => {
        var hazardOptions = data.current.getHazardTypeOptions();
        var hazard = hazardOptions[selectedIndices[0]]
        var modelOptions = data.current.getModelOptions(hazard);
        var model = modelOptions[selectedIndices[1]]
        var scenarioOptions = data.current.getScenarioOptions(hazard, model);
        var scenario = scenarioOptions[selectedIndices[2]]
        var yearOptions = data.current.getYearOptions(hazard, model, scenario)
        setMenuOptions([hazardOptions, modelOptions, scenarioOptions, yearOptions])
      }
      updateMenuOptions()
    }, [data, selectedIndices])

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
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={8} lg={9}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 240,
            }}
          >
            <Chart title={menuOptions[1][selectedIndices[1]] + 
                (lngLat ? " @ (" + lngLat.lng.toFixed(4) + "\u00b0, " + lngLat.lat.toFixed(4) + "\u00b0)" : "")} />
          </Paper>
        </Grid>
        {/* Summary */}
        <Grid item xs={12} md={4} lg={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 240,
            }}
          >
            <Summary 
              modelName={menuOptions[1][selectedIndices[1]]} 
              modelDescription={data.current ? data.current.getModelDescription(menuOptions[0][selectedIndices[0]],
                menuOptions[1][selectedIndices[1]]) : ""} 
            />
          </Paper>
        </Grid>
        {/* Asset table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <AssetTable />
          </Paper>
        </Grid>
      </Grid>
    );
  }
  
