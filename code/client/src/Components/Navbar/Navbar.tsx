import { useContext } from "react";
import { Button, Col, Container, Nav, Navbar, Row } from "react-bootstrap"
import { Link } from "react-router-dom"
import { UserContext } from "../Login/UserContext";
import './style.css'

function NavB(props: any) {
    const user = useContext(UserContext);

    return (
        <Navbar bg="warning">
            <Col className="brand">
                <i className="bi bi-shop"></i>
                EZElectronics
            </Col>
            <Col style={{ textAlign: "right" }}>
                {user ?
                    <>
                        <Col className="userInfo" style={{ textAlign: "right" }}>
                            Welcome <u><i>{user.username}</i></u>!
                            <Button variant="dark" className="logoutBtn" onClick={props.logout}>Logout</Button>
                        </Col>
                    </> :
                    null
                }
            </Col>
        </Navbar>
    )
}

export { NavB }