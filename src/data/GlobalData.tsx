import React, { useEffect, useState } from "react"
import axios from "axios"

declare global {
    interface Window {
        BASE_API: string
        MAP_PROVIDER: string
        MAPBOX_ACCESS_TOKEN: string
        GOOGLE_MAPS_API_KEY: string
        GOOGLE_MAPS_MAP_ID: string
    }
}

const baseUrl = `${window.BASE_API}`
//const baseUrl = "http://0.0.0.0:8000"

axios.defaults.baseURL = baseUrl

interface Services {
    apiHost: string
}

interface Globals {
    authRequired: boolean
    inventorySources: string[]
    mapProvider: string
    removeToken(): void
    services: Services
    setApiHost(apiHost: string): void
    setMapProvider(provider: string): void
    setToken(token: string, refreshToken: string): void
    token: string
}

export const globals: Globals = {
    authRequired: false,
    inventorySources: [],
    mapProvider: window.MAP_PROVIDER ?? "mapbox",
    removeToken: () => {},
    services: { apiHost: "" },
    setApiHost: (apiHost: string) => {},
    setMapProvider: (_provider: string) => {},
    setToken: (token: string, refreshToken: string) => {},
    token: "",
}

export const GlobalDataContext = React.createContext(globals)

// Module-level so they survive re-renders and are shared across any concurrent requests
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

export const GlobalDataContextProvider = (props: any) => {
    const setApiHost = (apiHost: string) => {
        setState({ ...state, services: { apiHost: apiHost } })
    }

    const setMapProvider = (provider: string) => {
        localStorage.setItem("map_provider", provider)
        setState((prev) => ({ ...prev, mapProvider: provider }))
    }

    const getStoredToken = () => {
        const userToken = localStorage.getItem("token")
        if (userToken) {
            axios.defaults.headers.common["Authorization"] =
                "Bearer " + userToken
        }
        return userToken ?? ""
    }

    const setToken = (token: string, refreshToken: string) => {
        localStorage.setItem("token", token)
        localStorage.setItem("refresh_token", refreshToken)
        axios.defaults.headers.common["Authorization"] = "Bearer " + token
        setState({ ...state, token: token, authRequired: false })
    }

    const removeToken = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("refresh_token")
        delete axios.defaults.headers.common["Authorization"]
        setState({ ...state, token: "" })
    }

    const initState = () => {
        return {
            authRequired: false,
            inventorySources: ["embedded", "hazard"],
            mapProvider:
                localStorage.getItem("map_provider") ??
                window.MAP_PROVIDER ??
                "mapbox",
            token: getStoredToken(),
            removeToken: removeToken,
            setApiHost: setApiHost,
            setMapProvider: setMapProvider,
            setToken: setToken,
            services: { apiHost: baseUrl },
        }
    }

    const [state, setState] = useState(initState())

    useEffect(() => {
        const interceptorId = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const original = error.config as any
                // Skip if not a 401, already retried, or this is the refresh call itself
                if (error.response?.status !== 401 || original._retry) {
                    return Promise.reject(error)
                }
                original._retry = true

                if (isRefreshing) {
                    // Queue concurrent 401s to retry once the refresh completes
                    return new Promise((resolve) => {
                        refreshQueue.push((token) => {
                            original.headers["Authorization"] =
                                "Bearer " + token
                            resolve(axios(original))
                        })
                    })
                }

                isRefreshing = true
                try {
                    const storedRefreshToken =
                        localStorage.getItem("refresh_token") ?? ""
                    const { data } = await axios.post("/auth/refresh", {}, {
                        _retry: true,
                        headers: {
                            Authorization: "Bearer " + storedRefreshToken,
                        },
                    } as any)
                    const newToken: string = data.access_token
                    const newRefreshToken: string = data.refresh_token
                    localStorage.setItem("token", newToken)
                    localStorage.setItem("refresh_token", newRefreshToken)
                    axios.defaults.headers.common["Authorization"] =
                        "Bearer " + newToken
                    setState((prev) => ({ ...prev, token: newToken }))
                    refreshQueue.forEach((cb) => cb(newToken))
                    refreshQueue = []
                    original.headers["Authorization"] = "Bearer " + newToken
                    return axios(original)
                } catch {
                    localStorage.removeItem("token")
                    localStorage.removeItem("refresh_token")
                    delete axios.defaults.headers.common["Authorization"]
                    setState((prev) => ({
                        ...prev,
                        token: "",
                        authRequired: true,
                    }))
                    refreshQueue = []
                    return Promise.reject(error)
                } finally {
                    isRefreshing = false
                }
            }
        )
        return () => {
            axios.interceptors.response.eject(interceptorId)
        }
    }, []) // setState is a stable reference — safe with empty deps

    return (
        <GlobalDataContext.Provider value={state}>
            {props.children}
        </GlobalDataContext.Provider>
    )
}
