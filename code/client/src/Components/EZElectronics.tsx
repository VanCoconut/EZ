import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ROLES, User, UserContext } from './Login/UserContext';
import { Login } from './Login/Login';
import { NavB } from './Navbar/Navbar';
import API from '../API/API';
import Homepage from './Homepage';
import Shop from './Customer/Shop';
import CurrentCart from './Customer/CurrentCart';
import CartHistory from './Customer/CartHistory';
import Stock from './Manager/Stock';
import RecordProducts from './Manager/RecordProducts';
import Profile from './Login/Profile';
import UserView from './Admin/UserView';
import CartView from './Admin/CartView';


function EZElectronics() {
    const [user, setUser] = useState<User | undefined>(undefined);
    const [loggedIn, setLoggedIn] = useState<Boolean>(true);
    const [loginMessage, setLoginMessage] = useState<String>('');
    const [registrationMessage, setRegistrationMessage] = useState<String>('')
    const [isLoaded, setIsLoaded] = useState<boolean>(false)
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const u = await API.getUserInfo()
                console.log(u)
                setUser(new User(u.username, u.name, u.surname, u.role));
                setLoggedIn(true);
                setIsLoaded(true)
                navigate("/")
            } catch {
                setLoggedIn(false);
                setUser(undefined);
                setIsLoaded(true)
            }
        };

        checkAuth();
    }, []);

    const doLogin = function (username: string, password: string) {
        API.login(username, password)
            .then((u: User) => {
                setLoggedIn(true)
                setUser(new User(u.username, u.name, u.surname, u.role))
                setIsLoaded(true)
                navigate('/')
            })
            .catch(err => {
                console.log(typeof err)
                setLoginMessage(err.error ? err.error : err.message ? err.message : typeof err === 'string' ? err : "An error occurred");
            })
    }

    const doLogOut = async () => {
        await API.logOut();
        setLoggedIn(false);
        setUser(undefined);
        setIsLoaded(false)
        navigate('/');
    }

    const register = async (username: string, name: string, surname: string, password: string, role: string) => {
        await API.register(username, name, surname, password, role);
        await doLogin(username, password);
    }



    return (
        <Container fluid style={{ padding: 0, height: "100%" }}>
            <UserContext.Provider value={user}>
                {window.location.pathname !== '/login' && <NavB logout={doLogOut}></NavB>}

                <Routes>

                    <Route path="/"
                        element={loggedIn ? <Navigate to="/home" /> : <Navigate to="/login" />}
                    />

                    <Route path="/login"
                        element={<Login login={doLogin} message={loginMessage} setMessage={setLoginMessage}
                            register={register} setRegistrationMessage={setRegistrationMessage} registrationMessage={registrationMessage} />}
                    />

                    <Route path="/home"
                        element={loggedIn ? <Homepage /> : <Navigate to="/login" />}
                    />

                    <Route path="/profile"
                        element={loggedIn && user ? <Profile /> : <Navigate to="/login" />}
                    />s

                    <Route path="/customer/shop"
                        element={(loggedIn && user && user.role === ROLES.CUSTOMER) ? <Shop /> : <Navigate to="/login" />}
                    />

                    <Route path="/customer/carts/current"
                        element={(loggedIn && user && user.role === ROLES.CUSTOMER) ? <CurrentCart /> : <Navigate to="/login" />}
                    />

                    <Route path="/customer/orders"
                        element={(loggedIn && user && user.role === ROLES.CUSTOMER) ? <CartHistory /> : <Navigate to="/login" />}
                    />

                    <Route path="/manager/products/record"
                        element={(loggedIn && user && user.role === ROLES.MANAGER) ? <RecordProducts /> : <Navigate to="/login" />}
                    />

                    <Route path="/manager/stock"
                        element={(loggedIn && user && user.role === ROLES.MANAGER) ? <Stock /> : <Navigate to="/login" />}
                    />

                    <Route path="/manager/carts"
                        element={(loggedIn && user && user.role === ROLES.MANAGER) ? <CartView /> : <Navigate to="/login" />}
                    />

                    <Route path="/admin/users"
                        element={(loggedIn && user && user.role === ROLES.ADMIN) ? <UserView /> : <Navigate to="/login" />}
                    />

                    <Route path="/admin/carts"
                        element={(loggedIn && user && user.role === ROLES.ADMIN) ? <CartView /> : <Navigate to="/login" />}
                    />

                    <Route path="/admin/stock"
                        element={(loggedIn && user && user.role === ROLES.ADMIN) ? <Stock /> : <Navigate to="/login" />}
                    />

                    <Route path="/admin/products/record"
                        element={(loggedIn && user && user.role === ROLES.ADMIN) ? <RecordProducts /> : <Navigate to="/login" />}
                    />

                </Routes>
            </UserContext.Provider>
        </Container>
    )
}



export default EZElectronics