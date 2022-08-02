import React from "react";
import { Marker } from "mapbox-gl";

const CoordinatesInput = (props) => {
  const [lng, setLng] = React.useState(42);
  const [lat, setLat] = React.useState(54);
  React.useEffect(() => {
    setTimeout(() => {
      setLat(-6);
      setLng(47);
    }, 2000);
  }, []);
  const change = (e) => {
    setLng(e.target.value);
  };
  return (
    <React.Fragment>
      <div style={{ position: "absolute", right: 0 }}>
        <form>
          <input
            name=""
            type="text"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="latitude"
          />
          <div style={{ transform: "scale(2)", display: "inline-block" }}>
            &nbsp;/&nbsp;
          </div>
          <input
            name=""
            type="text"
            value={lng}
            onChange={(e) => {
              console.log("changeLng");
              setLng(e.target.value);
            }}
            placeholder="longitude"
          />
          <input
            name=""
            type="button"
            onClick={() => {
              if (props.markerRef.current) {
                props.markerRef.current.remove(props.map.current);
              }
              const marker = new Marker()
                .setLngLat([lat, lng])
                .addTo(props.map.current);
		
              props.markerRef.current = marker;
		props.map.current.flyTo({ center: [lat, lng], essential: true });
		let e = {lngLat:{lng:parseInt(lng),lat:parseInt(lat)}};
		props.onClick(e)
            }}
            value=">"
          />
        </form>
      </div>
    </React.Fragment>
  );
};

export default CoordinatesInput;
