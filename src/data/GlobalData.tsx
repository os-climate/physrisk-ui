import React, { useState } from "react";
import axios from "axios";

//const baseUrl = "http://127.0.0.1:5000"
const baseUrl = "https://physrisk-api2-sandbox.apps.odh-cl1.apps.os-climate.org" 
axios.defaults.baseURL = baseUrl

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
      services: { apiHost: baseUrl }
    }
  }

  const [state, setState] = useState(initState());

  return (
    <GlobalDataContext.Provider value={state}>
      {props.children}
    </GlobalDataContext.Provider>
  )
}

