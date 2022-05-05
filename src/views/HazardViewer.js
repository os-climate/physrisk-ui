import { useEffect, useRef, useState } from 'react';
import Chart from '../components/Chart';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import ScatterMap from '../components/ScatterMap';
import Summary from '../components/Summary';
import AssetTable from '../components/AssetTable';
import { HazardAvailability } from '../data/HazardDataAvailability.js';
import {v4 as uuidv4} from 'uuid';
import axios from 'axios';


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
  const apiHost = 'http://physrisk-api-sandbox.apps.odh-cl1.apps.os-climate.org';

  function getHazardProps()
  {
    var currentOptions = [];
    var currentIndices = [];
    setMenuOptions((current) => { currentOptions = current; return current; });
    setSelectedIndices((current) => { currentIndices = current; return current; });
    var hazard = currentOptions[0][currentIndices[0]];
    var model = currentOptions[1][currentIndices[1]];
    var scenario = currentOptions[2][currentIndices[2]];
    var year = currentOptions[3][currentIndices[3]];
    return { hazard, model, scenario, year };
  }

  const handleClick = async(e) => {
    setLngLat(e.lngLat);

    var { hazard, model, scenario, year } = getHazardProps();
    var hazardModel = data.current.getModel(hazard, model)
    var payload = {
      "items": [
          {
              "request_item_id": uuidv4(),
              "event_type": hazard,
              "longitudes": [e.lngLat.lng],
              "latitudes": [e.lngLat.lat],
              "year": year,
              "scenario": scenario,
              "model": hazardModel.id,
          },
      ],
    };
    var response = await axios.post(apiHost+'/api/get_hazard_data', payload);

    // TODO: update graph
  };

  useEffect(
    async() => {
      var response = await axios.post(apiHost+'/api/get_hazard_data_availability', {});
      data.current = new HazardAvailability(response.data.models);

      const updateMenuOptions = () => {
        var hazardOptions = data.current.getHazardTypeOptions();
        var hazard = hazardOptions[selectedIndices[0]];
        var modelOptions = data.current.getModelOptions(hazard);
        var model = modelOptions[selectedIndices[1]];
        var scenarioOptions = data.current.getScenarioOptions(hazard, model);
        var scenario = scenarioOptions[selectedIndices[2]];
        var yearOptions = data.current.getYearOptions(hazard, model, scenario);
        setMenuOptions([hazardOptions, modelOptions, scenarioOptions, yearOptions]);
      };

      updateMenuOptions();
    }, [data, selectedIndices]);

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
