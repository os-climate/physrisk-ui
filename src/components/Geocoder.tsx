import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
//import match from 'autosuggest-highlight/match';
//import parse from 'autosuggest-highlight/parse';
import SearchIcon from '@mui/icons-material/Search';
import throttle from 'lodash/throttle';
import { InputAdornment } from '@mui/material';

interface PlaceType {
  feature: any;
  label: string;
}

type Props = {
  apiKey: string;
  onSelect: (param: any) => void;
}

export default function Geocoder({ apiKey, onSelect }: Props) {
  const [value, setValue] = React.useState<PlaceType | null>(null);
  const [inputValue, setInputValue] = React.useState('');
  const [options, setOptions] = React.useState<readonly any[]>([]);

  const fetch = React.useMemo(
    () =>
      throttle(
        (
          request: { input: string },
          callback: (err: any, res: any, searchTime: Date) => void,
        ) => {

          // first check if simple latitude and longitude
          const matches = request.input.match(
            /^[ ]*(?:latitude: )?(-?\d+\.?\d*)[, ]+(?:longitude: )?(-?\d+\.?\d*)[ ]*$/i
          )

          if (!matches)
          {
            search("https://api.mapbox.com", "mapbox.places", apiKey, request.input, callback, undefined)
            return
          }

          function coordinateFeature(lng: number, lat: number) {
            return {
                center: [lng, lat],
                geometry: {
                    type: "Point",
                    coordinates: [lng, lat],
                },
                place_name: "latitude: " + lat + ", longitude: " + lng,
                place_type: ["coordinate"],
                properties: {},
                type: "Feature",
            }
          }
      
          const coord1 = Number(matches[1])
          const coord2 = Number(matches[2])
          const geocodes = []

          if (coord1 < -90 || coord1 > 90) {
              // must be lng, lat
              geocodes.push(coordinateFeature(coord1, coord2))
          }

          if (coord2 < -90 || coord2 > 90) {
              // must be lat, lng
              geocodes.push(coordinateFeature(coord2, coord1))
          }

          if (geocodes.length === 0) {
              // else could be either lng, lat or lat, lng
              geocodes.push(coordinateFeature(coord1, coord2))
              geocodes.push(coordinateFeature(coord2, coord1))
          }

          callback(null, { features: geocodes }, new Date())
        }
      ),
    [],
  );

  React.useEffect(() => {
    let active = true;

    if (inputValue === '') {
      setOptions(value ? [value] : []);
      return undefined;
    }

    fetch({ input: inputValue }, (err: any, res: any, searchTime: Date) => {
      if (active) {
        let newOptions: readonly any[] = [];

        if (!err && res && res.features) { 
          const options =
            res.features
              .map((feature: any) => ({
                feature: feature,
                label: feature.place_name,
              }))
              .filter((feature: any) => feature.label)
        
          newOptions = [...newOptions, ...options];
        }
        else if (value) {
          newOptions = [value];
        }

        setOptions(newOptions);
      }
    });

    return () => {
      active = false;
    };
  }, [value, inputValue, fetch]);

  return (
    <Autocomplete
      id="mapbox-geocoder"
      sx={{ width: 240 }}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.label
      }
      filterOptions={(x) => x}
      options={options}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={value}
      onChange={(event: any, newValue: any | null) => {
        setOptions(newValue ? [newValue, ...options] : options);
        setValue(newValue);
        onSelect(newValue)
      }}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      renderInput={(params) => (
        <TextField {...params} label="" variant="standard" fullWidth
        InputProps={{ ...params.InputProps,
          startAdornment: (<InputAdornment position="start">
            <SearchIcon color="action" />
          </InputAdornment> ),
          disableUnderline: true,
          style: {fontSize: 14}
        }}
        />
      )}
      renderOption={(props, option) => {
        const parts = [{ text: option.label, highlight: false }]

        return (
          <li {...props}>
            <Grid container alignItems="center">
              <Grid item xs>
                {parts.map((part, index) => (
                  <span
                    key={index}
                    style={{
                      fontWeight: part.highlight ? 700 : 400,
                      fontSize: 14
                    }}
                  >
                    {part.text}
                  </span>
                ))}
              </Grid>
            </Grid>
          </li>
        );
      }}
    />
  );
}

export async function search(
  endpoint: string,
  source: string,
  accessToken: string,
  query: string,
  onResult: (err: any, res: Response | null, searchTime: Date) => void,
  proximity?: {longitude: number; latitude: number},
  country?: string,
  bbox?: number[],
  types?: string,
  limit?: number,
  autocomplete?: boolean,
  language?: string
) {
  const searchTime = new Date();
  try {
    const baseUrl = `${endpoint}/geocoding/v5/${source}/${query}.json`;
    // Don't send empty query params to Mapbox geocoding api.
    const searchParams = {
      ...(isNotNil(accessToken) && {access_token: accessToken}),
      ...(isNotNil(proximity) && {
        proximity:
          proximity && Object.keys(proximity).length === 2
            ? `${proximity.longitude},${proximity.latitude}`
            : null,
      }),
      ...(isNotNil(bbox) && {
        bbox: bbox && bbox.length > 0 ? bbox.join(',') : null,
      }),

      ...(isNotNil(types) && {
        types,
      }),
      ...(isNotNil(country) && {
        country,
      }),
      ...(isNotNil(limit) && {
        limit,
      }),
      ...(isNotNil(autocomplete) && {
        autocomplete,
      }),
      ...(isNotNil(language) && {
        language,
      }),
    };
    const url = `${baseUrl}?${toUrlString(searchParams)}`;
    const res = await fetch(url);
    const data = await res.json();
    onResult(null, data, searchTime);
    return {err: null, res, searchTime};
  } catch (err) {
    onResult(err, null, searchTime);
    return {err, res: null, searchTime};
  }
}

function toUrlString(params: any) {
  return Object.keys(params)
    .map(
      (key) => encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
    )
    .join('&');
}

function isNotNil(value: unknown) {
  return value !== undefined && value !== null;
}