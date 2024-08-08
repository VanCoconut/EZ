import { useState } from "react"
import { Alert, Button, Card, Col, Container, Form, Row, Toast, ToastContainer } from "react-bootstrap"
import API from "../../API/API"
import ReactMarkdown from "react-markdown"
import { useNavigate } from "react-router-dom"
import { Category, Product } from "../../Models/product"

function RecordProducts() {
    const navigate = useNavigate()
    const [model, setModel] = useState("")
    const [category, setCategory] = useState("Smartphone")
    const [quantity, setQuantity] = useState(0)
    const [sellingPrice, setSellingPrice] = useState(0)
    const [details, setDetails] = useState("")
    const [arrivalDate, setArrivalDate] = useState("")
    const [error, setError] = useState("")
    const [toast, setToast] = useState(false)

    const recordNewProducts = async () => {
        try {
            const product = new Product(sellingPrice, model, category === "Smartphone" ? Category.SMARTPHONE : category === "Laptop" ? Category.LAPTOP : Category.APPLIANCE, arrivalDate, details, quantity)
            await API.registerProducts(product)
            setToast(true)
            setModel("")
            setQuantity(0)
            setSellingPrice(0)
            setDetails("")
            setArrivalDate("")
            setTimeout(() => {
                setToast(false)
            }, 3000)
            setError("")
        } catch (error: any) {
            console.log(error)
            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
        }
    }

    return (
        <>
            <Container fluid>
                <Row>
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
                        <span className="title" style={{ color: "gray" }}>Record Products</span>
                    </Col>
                </Row>
                <Row>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label className="title">Record new products</Form.Label>
                            <Form.Control type="text" value={model} placeholder="Enter model" onChange={(event) => setModel(event.target.value)} />
                            <Form.Control className="mt-3" type="text" as="select" value={category} onChange={ev => setCategory(ev.target.value)}>
                                <option value="Smartphone">Smartphone</option>
                                <option value="Laptop">Laptop</option>
                                <option value="Appliance">Appliance</option>
                            </Form.Control>
                            <Form.Control value={quantity} className="mt-3" type="number" placeholder="Enter quantity" onChange={(event) => setQuantity(parseInt(event.target.value))} />
                            <Form.Control value={sellingPrice} className="mt-3" type="number" placeholder="Enter selling price" onChange={(event) => setSellingPrice(parseFloat(event.target.value))} />
                            <Form.Control value={details} className="mt-3" type="text" as="textarea" placeholder="Enter details" onChange={(event) => setDetails(event.target.value)} />
                            <Form.Control value={arrivalDate} className="mt-3" type="date" placeholder="Enter arrival date" max={new Date().toISOString().split('T')[0]} onChange={(event) => setArrivalDate(event.target.value)} />
                        </Form.Group>
                    </Form>
                </Row>
                <Row style={{ justifyContent: "center" }}>
                    <Col sm md lg>
                        <Card style={{ width: "auto", margin: "10px" }} >
                            <Card.Body style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <div>
                                        <Card.Title>Product recap</Card.Title>
                                        {model && <Card.Subtitle className="mb-2 text-muted">Product model: {model} - {category}</Card.Subtitle>}
                                        {!model && <Card.Subtitle className="mb-2 text-muted">No product model set yet</Card.Subtitle>}
                                        <Card.Text>
                                            Price: {sellingPrice} €
                                            <br />
                                            Recorded quantity: {quantity} units
                                            <br />
                                            Additional details: {details}
                                            <br />
                                            Arrival date: {arrivalDate}
                                        </Card.Text>
                                    </div>
                                    <i className={`bi ${category === "Smartphone" ? "bi-phone-fill" : category === "Laptop" ? "bi-laptop-fill" : "bi-house-gear-fill"} functIcon`} style={{ color: category === "Smartphone" ? "green" : category === "Laptop" ? "gold" : "cyan" }}></i>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col sm md lg>
                        <Button variant="outline-success" onClick={() => recordNewProducts()} >
                            Record product
                        </Button>
                    </Col>
                </Row>
                <Row>
                    {error && <Alert variant="danger">
                        <ReactMarkdown>{error}</ReactMarkdown>
                    </Alert>}
                </Row>
            </Container>

            {toast && <ToastContainer position="top-center">
                <Toast className="toast saved">
                    <Toast.Body>Product successfully recorded</Toast.Body>
                </Toast>
            </ToastContainer>}
        </>
    )
}

export default RecordProducts