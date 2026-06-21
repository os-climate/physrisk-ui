import { useContext, useState } from "react"
import axios from "axios"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import InputAdornment from "@mui/material/InputAdornment"
import TextField from "@mui/material/TextField"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import Typography from "@mui/material/Typography"
import Visibility from "@mui/icons-material/Visibility"
import VisibilityOff from "@mui/icons-material/VisibilityOff"
import { GlobalDataContext } from "../data/GlobalData"

type Props = {
    open: boolean
    handleClose: any
    fullScreen: boolean
}

const LoginDialog = ({ open, handleClose, fullScreen }: Props) => {
    const globals = useContext(GlobalDataContext)
    const [apiKey, setApiKey] = useState("")
    const [showApiKey, setShowApiKey] = useState(false)
    const [error, setError] = useState("")
    const loggedIn = globals.token !== ""

    function logInOut(event: React.FormEvent) {
        event.preventDefault()
        if (loggedIn) {
            axios.post("/auth/logout", {}).finally(() => {
                globals.removeToken()
            })
        } else {
            setError("")
            axios
                .post(
                    "/auth/token",
                    {},
                    { headers: { Authorization: "Bearer " + apiKey } }
                )
                .then((response) => {
                    globals.setToken(
                        response.data.access_token,
                        response.data.refresh_token
                    )
                    setApiKey("")
                })
                .catch(() => {
                    setError("Invalid API key")
                })
        }
    }

    return (
        <Dialog open={open} onClose={handleClose} fullScreen={fullScreen}>
            <form onSubmit={logInOut}>
                <DialogTitle>Account</DialogTitle>
                <DialogContent>
                    {loggedIn ? (
                        <Typography variant="body1">
                            Authenticated with API key
                        </Typography>
                    ) : (
                        <TextField
                            autoFocus
                            margin="dense"
                            label="API Key"
                            type={showApiKey ? "text" : "password"}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            fullWidth
                            error={!!error}
                            helperText={error}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle API key visibility"
                                            onClick={() =>
                                                setShowApiKey((v) => !v)
                                            }
                                            edge="end"
                                        >
                                            {showApiKey ? (
                                                <VisibilityOff />
                                            ) : (
                                                <Visibility />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button type="submit" color="primary">
                        {loggedIn ? "Logout" : "Login"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}

export default LoginDialog
