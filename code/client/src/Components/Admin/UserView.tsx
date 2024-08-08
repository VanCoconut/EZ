import { Alert, Button, ButtonGroup, Card, Col, Container, Dropdown, Form, Modal, Row, Toast, ToastContainer } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import API from "../../API/API"
import { UserContext } from "../Login/UserContext"
import { UserInfo } from "../../Models/user"
import ReactMarkdown from "react-markdown"
import { useContext, useEffect, useState } from "react"
import "../style.css"

function UserView() {
    const navigate = useNavigate()
    const user = useContext(UserContext)
    const [users, setUsers] = useState<UserInfo[]>([])
    const [showDelete, setShowDelete] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null)
    const [error, setError] = useState("")
    const [filterRole, setFilterRole] = useState<string>("")
    const [show, setShow] = useState(false)
    const [display, setDisplay] = useState(false)
    const [displayedUser, setDisplayedUser] = useState<UserInfo | null>(null)
    const [toast, setToast] = useState(false)
    const [allToast, setAllToast] = useState(false)
    const [edit, showEdit] = useState(false)
    const [name, setName] = useState("")
    const [surname, setSurname] = useState("")
    const [address, setAddress] = useState("")
    const [birthdate, setBirthdate] = useState("")

    useEffect(() => {
        API.getAllUsers()
            .then((users: UserInfo[]) => {
                setUsers(users)
                setError("")
            })
            .catch((error: any) => {
                console.log(error)
                setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
            })
    }, [])

    const fetchUser = async (uname: string) => {
        try {
            console.log(uname)
            let us = await API.getUserByUsername(uname)
            setSelectedUser(us)
            setShowDelete(true)
            setError("")
        } catch (error: any) {
            console.log(error)
            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
        }
    }

    const showUser = async (uname: string) => {
        try {
            console.log(uname)
            let us = await API.getUserByUsername(uname)
            setDisplayedUser(us)
            setDisplay(true)
            setError("")
        } catch (error: any) {
            console.log(error)
            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
        }
    }

    const editUser = async (uname: string) => {
        try {
            console.log(uname)
            let us = await API.getUserByUsername(uname)
            setSelectedUser(us)
            setName(us.name)
            setSurname(us.surname)
            setAddress(us.address)
            setBirthdate(us.birthdate)
            showEdit(true)
            setError("")
        } catch (error: any) {
            console.log(error)
            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
        }
    }

    const handleRoleChange = async (eventKey: any) => {
        setFilterRole(eventKey)
        await API.getUsersByRole(eventKey).then((us: UserInfo[]) => {
            setError("")
            setUsers(us)
        }).catch((error: any) => {
            console.log(error)
            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
        })
    }

    const updateProfile = async () => {
        try {
            if (selectedUser) {
                await API.updateUserInfo(selectedUser?.username, name, surname, address, birthdate)
                setSelectedUser(null)
                setName("")
                setSurname("")
                setAddress("")
                setBirthdate("")
                let us = await API.getAllUsers()
                setUsers(us)
                showEdit(false)
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
                <Row>
                    <Col style={{ textAlign: "center" }}>
                        <span className="title" style={{ color: "gray" }}>Manage users</span>
                    </Col>
                </Row>
                <Row style={{ margin: 0, padding: 0 }} className="justify-content-center">
                    <ButtonGroup style={{ display: "flex", width: "auto" }}>
                        <Button variant="outline-secondary" onClick={() => {
                            setFilterRole("")
                            API.getAllUsers().then((us: UserInfo[]) => {
                                setError("")
                                setUsers(us)
                            }).catch((error: any) => {
                                console.log(error)
                                setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
                            })
                        }} >
                            View all users
                        </Button>
                        <Dropdown onSelect={handleRoleChange} >
                            <Dropdown.Toggle variant="outline-secondary" id="dropdown-cat">
                                <i className="bi bi-funnel"></i>Show users of a specific role
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item eventKey="Customer">Customer</Dropdown.Item>
                                <Dropdown.Item eventKey="Manager">Manager</Dropdown.Item>
                                <Dropdown.Item eventKey="Admin">Admin</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                        <Button variant="danger" onClick={() => setShow(true)} >Delete all non-Admin users</Button>
                    </ButtonGroup>

                </Row>
                <Row style={{ justifyContent: "center", alignItems: "center" }}>
                    <Col sm md lg className="mt-2" style={{ textAlign: "center" }}>
                        {(!filterRole) && <span className="title" style={{ color: "gray" }}>No filters active</span>}
                        {filterRole && <span className="title" style={{ color: "green" }}>Filtering by role: <b>{filterRole}</b></span>}
                    </Col>
                </Row>
                <Row style={{ justifyContent: "center", alignItems: "center" }}>
                    {users.map((u: UserInfo) => <Card key={u.username} className="functionCnt" style={{ width: 'auto', margin: '10px' }}>
                        <Card.Body>
                            <Card.Title> {u.username}</Card.Title>
                            {u && (
                                <>
                                    <Row style={{ justifyContent: "center", alignItems: "center" }}>
                                        <Col>
                                            <strong>Role:</strong> {u.role}
                                        </Col>
                                        <Col>
                                            <i className="bi bi-person functIcon"  ></i>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col style={{ textAlign: "center" }}>
                                            <Button variant="outline-info" onClick={() => showUser(u.username)} >Display user information</Button>
                                            <Button variant="outline-info" onClick={() => editUser(u.username)}>Edit user information</Button>
                                            <Button variant="outline-danger" onClick={() => {
                                                fetchUser(u.username)
                                            }} >Delete user</Button>
                                        </Col>
                                    </Row>
                                </>
                            )}
                        </Card.Body>
                    </Card>)}
                </Row>
                {error && <Alert variant="danger"> <ReactMarkdown>{error}</ReactMarkdown> </Alert>}
            </Container>
            {selectedUser && <Modal show={edit} onHide={() => {
                setError("")
                showEdit(false)
            }}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit user information</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>User Details</p>
                    <p><strong>Username:</strong> {selectedUser?.username}</p>
                    <p><strong>Role:</strong> {selectedUser?.role}</p>
                    <p><strong>Name:</strong> {selectedUser?.name}</p>
                    <p><strong>Surname:</strong> {selectedUser?.surname}</p>
                    <p><strong>Address:</strong> {selectedUser?.address}</p>
                    <p><strong>Birthdate:</strong> {selectedUser?.birthdate}</p>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Control value={name} type="text" placeholder="Enter name" onChange={(event) => setName(event.target.value)} />
                            <Form.Control value={surname} className="mt-3" type="text" placeholder="Enter surname" onChange={(event) => setSurname(event.target.value)} />
                            <Form.Control value={address} className="mt-3" type="text" placeholder="Enter address" onChange={(event) => setAddress(event.target.value)} />
                            <Form.Control value={birthdate} className="mt-3" type="date" placeholder="Enter birthdate" max={new Date().toISOString().split('T')[0]} onChange={(event) => setBirthdate(event.target.value)} />
                        </Form.Group>
                    </Form>
                    <Button variant="outline-success" onClick={() => updateProfile()} >Update profile</Button>
                    <p>Are you sure you want to edit the account of user <strong>{selectedUser?.username}</strong>?</p>
                    <p>This action cannot be undone.</p>
                    {error && <Alert variant="danger"> <ReactMarkdown>{error}</ReactMarkdown> </Alert>}
                </Modal.Body>
            </Modal>}

            {selectedUser && <Modal show={showDelete} onHide={() => {
                setError("")
                setShowDelete(false)
            }}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete account</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>User Details</p>
                    <p><strong>Username:</strong> {selectedUser?.username}</p>
                    <p><strong>Role:</strong> {selectedUser?.role}</p>
                    <p><strong>Name:</strong> {selectedUser?.name}</p>
                    <p><strong>Surname:</strong> {selectedUser?.surname}</p>
                    <p><strong>Address:</strong> {selectedUser?.address}</p>
                    <p><strong>Birthdate:</strong> {selectedUser?.birthdate}</p>
                    <p>Are you sure you want to delete the account of user <strong>{selectedUser?.username}</strong>?</p>
                    <p>This action cannot be undone.</p>
                    {error && <Alert variant="danger"> <ReactMarkdown>{error}</ReactMarkdown> </Alert>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDelete(false)}>
                        Close
                    </Button>
                    <Button variant="danger" onClick={async () => {
                        try {
                            if (user) {
                                await API.deleteUser(selectedUser.username)
                                const us = await API.getAllUsers()
                                setUsers(us)
                                setSelectedUser(null)
                                setShowDelete(false)
                                setToast(true)
                                setTimeout(() => {
                                    setToast(false)
                                }, 3000)
                                setError("")
                            }
                        } catch (error: any) {
                            console.log(error)
                            setShowDelete(false)
                            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
                        }
                    }}>
                        Delete account
                    </Button>
                </Modal.Footer>
            </Modal>}
            <Modal show={show} onHide={() => {
                setError("")
                setShow(false)
            }}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete all non-Admin users</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete all users that are not Admins?</p>
                    <p>This action cannot be undone.</p>
                    {error && <Alert variant="danger"> <ReactMarkdown>{error}</ReactMarkdown> </Alert>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShow(false)}>
                        Close
                    </Button>
                    <Button variant="danger" onClick={async () => {
                        try {
                            if (user) {
                                await API.deleteAllUsers()
                                const us = await API.getAllUsers()
                                setUsers(us)
                                setShow(false)
                                setAllToast(true)
                                setTimeout(() => {
                                    setAllToast(false)
                                }, 3000)
                                setError("")
                            }
                        } catch (error: any) {
                            console.log(error)
                            setShow(false)
                            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
                        }
                    }}>
                        Delete all non-Admin users
                    </Button>
                </Modal.Footer>
            </Modal>
            {displayedUser && <Modal show={display} onHide={() => { setDisplayedUser(null); setDisplay(false) }}>
                <Modal.Header closeButton>
                    <Modal.Title>User information</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>User Details</p>
                    <p><strong>Username:</strong> {displayedUser?.username}</p>
                    <p><strong>Role:</strong> {displayedUser?.role}</p>
                    <p><strong>Name:</strong> {displayedUser?.name}</p>
                    <p><strong>Surname:</strong> {displayedUser?.surname}</p>
                    <p><strong>Address:</strong> {displayedUser?.address}</p>
                    <p><strong>Birthdate:</strong> {displayedUser?.birthdate}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => { setDisplayedUser(null); setDisplay(false) }}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>}
            {toast && <ToastContainer position="top-center">
                <Toast className="toast notSaved">
                    <Toast.Body>User deleted successfully</Toast.Body>
                </Toast>
            </ToastContainer>}
            {allToast && <ToastContainer position="top-center">
                <Toast className="toast notSaved">
                    <Toast.Body>All non-Admin users deleted successfully</Toast.Body>
                </Toast>
            </ToastContainer>}
        </>
    )
}

export default UserView