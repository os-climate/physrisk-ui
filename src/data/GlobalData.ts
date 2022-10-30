import React from "react";

export const globals = {
    services: {
      apiHost: "http://physrisk-api-sandbox.apps.odh-cl1.apps.os-climate.org",
      //apiHost: "http://127.0.0.1:5000"
    }
  };
  
export const GlobalDataContext = React.createContext(
    globals // default value
);

