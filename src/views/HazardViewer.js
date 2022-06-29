import { useEffect, useReducer, useRef, useState } from 'react';
import Chart from '../components/Chart';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import ScatterMap from '../components/ScatterMap';
import Summary from '../components/Summary';
import { hazardMenuReducer, loadHazardMenuData, updateMenuOptions } from '../data/HazardDataAvailability.js';
import {v4 as uuidv4} from 'uuid';
import axios from 'axios';


export default function HazardViewer(props) {
  const { visible } = props
  const hazardMenuInitialState = {
    inventory: null,
    menus: ["", "", "", ""],
    menuOptions: [[""], [""], [""], [""]],
    selectedIndices: [0]
  }

  // holds both the inventory of available hazard data and the menu state
  const [hazardMenu, hazardMenuUpdate] = useReducer(hazardMenuReducer, hazardMenuInitialState);

  const [graphData, setGraphData] = useState(null);
  const data = useRef();
  const [lngLat, setLngLat] = useState(null);
  const apiHost = 'http://physrisk-api-sandbox.apps.odh-cl1.apps.os-climate.org';

  function graphDataPoint(x, y) {
    return { x, y };
  }

  const handleClick = async(e) => {
    setLngLat(e.lngLat);
  };

  useEffect(() => {
    async function fetchHazardMenuData() {
      const hazardMenuData = await loadHazardMenuData()
      hazardMenuUpdate({ type: "initialise", payload: hazardMenuData })
    }
    fetchHazardMenuData()
    }, []);

  useEffect(() => {
    async function fetchGraphData() {
      var [menuOptions, newSelectedIndices, selection] = updateMenuOptions(hazardMenu.inventory, hazardMenu.selectedIndices)
      var [hazard, model, scenario, year] = selection
      if (lngLat)
      {
        var payload = {
          "items": [
              {
                  "request_item_id": uuidv4(),
                  "event_type": hazard,
                  "longitudes": [lngLat.lng],
                  "latitudes": [lngLat.lat],
                  "year": year,
                  "scenario": scenario.id,
                  "model": model.id,
              },
          ],
        };
        var response = await axios.post(apiHost+'/api/get_hazard_data', payload);
        var curve_set = response.data.items[0].intensity_curve_set[0]
        var points = curve_set.return_periods.map((item, i) => graphDataPoint(1.0/ item, curve_set.intensities[i]));

        setGraphData(points)
    }
    }
    fetchGraphData()
    }, [hazardMenu, lngLat]);

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
              hazardMenu={hazardMenu}
              hazardMenuUpdate={hazardMenuUpdate}
              onClick={handleClick}
              visible={visible}
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
            <Chart
              title={hazardMenu.menuOptions[1][hazardMenu.selectedIndices[1]] + 
                (lngLat ? " @ (" + lngLat.lng.toFixed(4) + "\u00b0, " + lngLat.lat.toFixed(4) + "\u00b0)" : "")}
              data={graphData}
            />
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
              modelName={hazardMenu.menuOptions[1][hazardMenu.selectedIndices[1]]} 
              modelDescription={data.current ? data.current.getModelDescription(hazardMenu.menuOptions[0][hazardMenu.selectedIndices[0]],
                hazardMenu.menuOptions[1][hazardMenu.selectedIndices[1]]) : ""} 
            />
          </Paper>
        </Grid>
      </Grid>
    );
  }
