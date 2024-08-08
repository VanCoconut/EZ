import { Alert, Button, Card, Col, Container, Form, Modal, Row } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import API from "../../API/API"
import { UserContext } from "./UserContext"
import { UserInfo } from "../../Models/user"
import ReactMarkdown from "react-markdown"
import { useContext, useEffect, useState } from "react"
import "./style.css"

function Profile() {
    const navigate = useNavigate()
    const [userInfo, setUserInfo] = useState<UserInfo>()
    const [name, setName] = useState("")
    const [surname, setSurname] = useState("")
    const [address, setAddress] = useState("")
    const [birthdate, setBirthdate] = useState("")
    const user = useContext(UserContext)
    const [error, setError] = useState("")
    const [showDelete, setShowDelete] = useState(false)

    useEffect(() => {
        const getUser = async () => {
            try {
                const user = await API.getUserInfo()
                console.log(user)
                setUserInfo(user)
                setError("")
            } catch (error: any) {
                console.log(error)
                setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
            }
        }
        getUser()
    }, [])

    const updateProfile = async () => {
        try {
            if (user) {
                await API.updateUserInfo(user?.username, name, surname, address, birthdate)
                const u = await API.getUserInfo()
                setUserInfo(u)
                setError("")
            }
        } catch (error: any) {
            console.log(error)
            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
        }
    }

    return (
        <>
            <Container fluid>
                <Row style={{ justifyContent: "space-between" }}>
                    <Button
                        className="btnGroup dark"
                        style={{ top: "10px", left: "10px", width: "auto", marginRight: "10px" }}
                        variant="dark"
                        onClick={() => navigate("/home")}
                    >
                        <i className="bi bi-arrow-left" style={{ fontSize: "13px" }}></i> Back
                    </Button>
                </Row>
                <Row style={{ justifyContent: "center", alignItems: "center" }}>
                    <Col md={6}>
                        <Card className="functionCnt" style={{ width: 'auto', margin: '10px', cursor: "auto!important" }}>
                            <Card.Body>
                                <Card.Title>Profile</Card.Title>
                                {userInfo && (
                                    <>
                                        <Row style={{ justifyContent: "center", alignItems: "center" }}>
                                            <Col>
                                                <div>
                                                    <p><strong>Username:</strong> {userInfo.username}</p>
                                                    <p><strong>Name:</strong> {userInfo.name}</p>
                                                    <p><strong>Surname:</strong> {userInfo.surname}</p>
                                                    <p><strong>Role:</strong> {userInfo.role}</p>
                                                    <p><strong>Address:</strong> {userInfo.address ? userInfo.address : <i>Address not set</i>}</p>
                                                    <p><strong>Birthdate:</strong> {userInfo.birthdate ? userInfo.birthdate : <i>Birthdate not set</i>}</p>
                                                </div>
                                            </Col>

                                            <Col>

                                                <i className="bi bi-person profileIcon"  ></i>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col style={{ textAlign: "center" }}>
                                                <Button variant="outline-danger" onClick={() => setShowDelete(true)}>Delete account</Button>
                                            </Col>
                                        </Row>
                                    </>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card className="functionCnt" style={{ width: 'auto', margin: '10px', cursor: "auto!important" }}>
                            <Card.Body>
                                <Card.Title>Update profile</Card.Title>
                                <Form>
                                    <Form.Group className="mb-3">
                                        <Form.Control value={name} type="text" placeholder="Enter name" onChange={(event) => setName(event.target.value)} />
                                        <Form.Control value={surname} className="mt-3" type="text" placeholder="Enter surname" onChange={(event) => setSurname(event.target.value)} />
                                        <Form.Control value={address} className="mt-3" type="text" placeholder="Enter address" onChange={(event) => setAddress(event.target.value)} />
                                        <Form.Control value={birthdate} className="mt-3" type="date" placeholder="Enter birthdate" max={new Date().toISOString().split('T')[0]} onChange={(event) => setBirthdate(event.target.value)} />
                                    </Form.Group>
                                </Form>
                                <Button variant="outline-success" onClick={() => updateProfile()} >Update profile</Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
                {error && <Alert dismissible variant="danger"> <ReactMarkdown>{error}</ReactMarkdown> </Alert>}
            </Container>

            <Modal show={showDelete} onHide={() => setShowDelete(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete account</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete your account?</p>
                    <p>This action cannot be undone.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDelete(false)}>
                        Close
                    </Button>
                    <Button variant="danger" onClick={async () => {
                        try {
                            if (user) {
                                await API.deleteUser(user?.username)
                                await API.logOut()
                                navigate("/login")
                            }
                        } catch (error: any) {
                            console.log(error)
                            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
                        }
                    }}>
                        Delete account
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default Profile