import React from "react";

export const globals = {
    services: {
      apiHost: "http://physrisk-api-sandbox.apps.odh-cl1.apps.os-climate.org",
    }
  };
  
export const GlobalDataContext = React.createContext(
    globals // default value
);

