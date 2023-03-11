import React, { useState } from "react";
import axios from "axios";

axios.defaults.baseURL = "https://physrisk-api2-sandbox.apps.odh-cl1.apps.os-climate.org"

interface Services {
  apiHost: string
}

interface Globals {
  inventorySources: string[];
  removeToken(): void,
  services: Services,
  setToken(token: string): void,
  token: string
}

export const globals: Globals = {
  inventorySources: [],
  removeToken: () => {},
  services: { apiHost: "" },
  setToken: (token: string) => {},
  token: ""
};

export const GlobalDataContext = React.createContext(
    globals
);

export const GlobalDataContextProvider = (props: any) => {

  const getStoredToken = () => {
    const userToken = localStorage.getItem("token");
    return userToken ? userToken : "" 
  }
  
  const setToken = (token: string) => {
    localStorage.setItem("token", token);
    setState({...state, token: token})
  }

  const removeToken = () => {
    localStorage.removeItem("token");
    setState({...state, token: ""})
  }

  const initState = () => 
  { 
    return {
      inventorySources: [ "embedded", "hazard" ],
      token: getStoredToken(),
      removeToken: removeToken,
      setToken: setToken,
      services: { apiHost: "https://physrisk-api2-sandbox.apps.odh-cl1.apps.os-climate.org" } // "https://physrisk-api2-sandbox.apps.odh-cl1.apps.os-climate.org" or "http://127.0.0.1:5000"
    }
  }

  const [state, setState] = useState(initState());

  return (
    <GlobalDataContext.Provider value={state}>
      {props.children}
    </GlobalDataContext.Provider>
  )
}

