import { useContext, useEffect, useState } from 'react';
import axios from "axios";
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Typography from '@mui/material/Typography';
import { GlobalDataContext } from "../data/GlobalData"

type Props = {
  open: boolean;
  handleClose: any;
  fullScreen: boolean;
  setToken: any;
}

const LoginDialog = ({ open, handleClose, fullScreen }: Props) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState("");
  const globals = useContext(GlobalDataContext)
  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const config = {
    headers: { Authorization: 'Bearer ' + globals.token }
  };

  const [loginForm, setloginForm] = useState({
    email: "",
    password: ""
  })

  useEffect(() => {
    async function fetchProfile() {
      try {
        const profile: any = await axios.post("/api/profile", {}, (globals.token == "") ? {} : config)
        setLoggedInUser(profile.data.id)
      }
      catch (error) {
        console.log(error)
      }
    }
    if (open) {
      fetchProfile()
    }
  }, [open])

  function logInOut(event: any) {
    event.preventDefault()
    if (loggedInUser) {
      axios.post(
        "/api/logout", {}, (globals.token == "") ? {} : config
      )
        .then(() => {
          setLoggedInUser("")
          globals.removeToken()
        })
    }
    else {
      axios.post(
        "/api/token",
        {
          email: loginForm.email,
          password: loginForm.password
        }
      )
        .then((response) => {
          globals.setToken(response.data.access_token)
          setLoggedInUser(loginForm.email)
        }).catch((error) => {
          if (error.response) {
            console.log(error.response)
            console.log(error.response.status)
            console.log(error.response.headers)
          }
          setLoggedInUser("")
        })
    }
  }

  return (
    <Dialog open={open} onClose={handleClose}
      fullScreen={fullScreen}>
      <form action="" onSubmit={logInOut}>
        <DialogTitle>Account</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 1 }}>
            {loggedInUser ? "Logged in as user '" + loggedInUser + "'" : ""}
          </Typography>
          {!loggedInUser ?
            (
              <div>
                <TextField
                  autoFocus
                  margin="dense"
                  id="name"
                  label="Username (email address)"
                  value={loginForm.email}
                  onChange={(e) => setloginForm({ email: e.target.value, password: loginForm.password })}
                  fullWidth
                />
                <FormControl variant="outlined" fullWidth sx={{ mt: 1 }}>
                  <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
                  <OutlinedInput
                    id="outlined-adornment-password"
                    type={showPassword ? 'text' : 'password'}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                    label="Password"
                    value={loginForm.password}
                    onChange={(e) => setloginForm({ email: loginForm.email, password: e.target.value })}
                  />
                </FormControl>
              </div>
            )
            : null
          }
        </DialogContent>
        <DialogActions>
          <Button type="submit" color="primary">
            {loggedInUser ? "Logout" : "Login"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default LoginDialog;