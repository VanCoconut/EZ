import { useState } from "react"
import { Alert, Button, Col, Container, Form, Row } from "react-bootstrap"
import './style.css'

function Login(props: any) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")
    const [surname, setSurname] = useState("")
    const [repeatPassword, setRepeatPassword] = useState("")
    const [role, setRole] = useState("Customer")
    const [newUsername, setNewUsername] = useState("")
    const [newPassword, setNewPassword] = useState("")

    const handleSubmit = (event: any) => {
        event.preventDefault();
        props.setMessage('');

        let valid = true;
        let msg = '';

        if (!username || username === '') {
            valid = false;
            msg += 'Please insert a valid username\r\n'
        }

        if (!password || password === '') {
            valid = false;
            msg += 'Please insert a valid password\r\n'
        }

        if (valid) {
            props.login(username, password);
        }
        else {
            props.setMessage(msg);
        }
    }

    const handleRegistration = (event: any) => {
        event.preventDefault()
        props.setMessage("")

        let valid = true;
        let message = ""

        if (!newUsername || newUsername === '') {
            valid = false
            message += "Please insert a valid username\r\n"
        }
        if (!name || name === '') {
            valid = false
            message += "Please insert a valid name\r\n"
        }
        if (!surname || surname === '') {
            valid = false
            message += "Please insert a valid surname\r\n"
        }
        if (!newPassword || newPassword === '') {
            valid = false
            message += "Please insert a valid password\r\n"
        }
        if (newPassword !== repeatPassword) {
            valid = false
            message += "Passwords do not match\r\n"
        }
        if (valid) {
            props.register(newUsername, name, surname, newPassword, role)
        } else {
            console.log(message)
            props.setRegistrationMessage(message)
        }
    }

    return (
        <Container fluid className="loginContainer">

            <Row className="loginTitle">
                <i className="bi bi-diagram-2">EZElectronics</i>
            </Row>
            <Row>
                <Col>
                    <Row className="loginFormContainer">
                        <h2>Login</h2>
                        {props.message ? <Alert className="error" variant='danger' onClose={() => props.setMessage('')} dismissible>{props.message}</Alert> : false}
                        <Form.Group className="form" controlId='login'>
                            <Form.Control placeholder="Username" type='email' value={username} onChange={ev => setUsername(ev.target.value)} />
                            <Form.Control className="mt-3" placeholder="Password" type='password' value={password} onChange={ev => setPassword(ev.target.value)} />
                        </Form.Group>
                        <Button variant='warning' type='submit' className='loginBtn' onClick={handleSubmit}>LOGIN</Button>
                        <hr></hr>
                    </Row>
                </Col>
                <Col >
                    <Row className="loginFormContainer">
                        <h2>Registration</h2>
                        {props.registrationMessage ? <Alert className="error" variant='danger' onClose={() => props.setRegistrationMessage('')} dismissible>{props.registrationMessage}</Alert> : false}
                        <Form.Group className="form" controlId='registration'>
                            <Form.Control className="mt-3" placeholder="Username" value={newUsername} onChange={ev => setNewUsername(ev.target.value)} />
                            <Form.Control className="mt-3" placeholder="Name" value={name} onChange={ev => setName(ev.target.value)} />
                            <Form.Control className="mt-3" placeholder="Surname" value={surname} onChange={ev => setSurname(ev.target.value)} />
                            <Form.Control className="mt-3" placeholder="Password" type='password' value={newPassword} onChange={ev => setNewPassword(ev.target.value)} />
                            <Form.Control className="mt-3" placeholder="Confirm Password" type='password' value={repeatPassword} onChange={ev => setRepeatPassword(ev.target.value)} />
                            <Form.Control className="mt-3" type="text" as="select" value={role} onChange={ev => setRole(ev.target.value)}>
                                <option value="User">Customer</option>
                                <option value="Manager">Manager</option>
                                <option value="Admin">Admin</option>
                            </Form.Control>
                        </Form.Group>
                        <Button variant='warning' type='submit' className='loginBtn' onClick={handleRegistration}>Create new Account</Button>
                        <hr></hr>
                    </Row>
                </Col>
            </Row>

        </Container>
    )
}

export { Login }