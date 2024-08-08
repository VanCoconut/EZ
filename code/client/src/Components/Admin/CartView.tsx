import { useContext, useEffect, useState } from "react"
import { Alert, Button, Card, Col, Container, ListGroup, Modal, Row, Toast, ToastContainer } from "react-bootstrap"
import API from "../../API/API"
import { useNavigate } from "react-router-dom"
import { Cart, ProductInCart } from "../../Models/cart"
import { ROLES, UserContext } from "../Login/UserContext"
import ReactMarkdown from "react-markdown"

function CartView() {
    const [carts, setCarts] = useState<Cart[]>([])
    const [currentCart, setCurrentCart] = useState<Cart>()
    const [showDelete, setShowDelete] = useState<boolean>(false)
    const [deleteToast, setDeleteToast] = useState<boolean>(false)
    const [error, setError] = useState<string>("")
    const navigate = useNavigate()
    const user = useContext(UserContext)

    useEffect(() => {
        const getCartHistory = async () => {
            try {
                const carts = await API.getAllCarts()
                console.log(carts)
                setCarts(carts)
                setError("")
            } catch (error: any) {
                console.log(error)
                setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
            }
        }
        getCartHistory()
    }, [])

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
                    <Col className="mt-2" style={{ textAlign: "center" }}>
                        <span className="title" style={{ color: "green" }}>Cart view</span>
                        {carts.length === 0 && <Alert variant="info">There are no carts yet</Alert>}
                        {carts.length > 0 && <>
                            <ListGroup className="exListCnt mt-3" as="ol">
                                {carts.map((cart, index) => (
                                    <ListGroup.Item key={index} as="li" action className="exDescrList" onClick={() => setCurrentCart(cart)}>
                                        <Row>
                                            <Col className="ms-2" sm>
                                                <div className="fw-bold">Customer: {cart.customer} - Order: {cart.paymentDate} - {cart.products.length} product(s)</div>
                                            </Col>
                                            <Col sm>
                                                <div className="fw-bold">Total: {cart.total}€</div>
                                            </Col>
                                        </Row>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </>}
                    </Col>
                </Row>
                {user && carts.length > 0 && <Row style={{ justifyContent: "center" }}>
                    <Button variant="danger" style={{ width: "auto" }} onClick={() => setShowDelete(true)} >Delete all carts</Button>
                </Row>}
                <Row>
                    {currentCart && (
                        <>
                            <Row style={{ justifyContent: "center" }}>
                                {currentCart.products.map((product: ProductInCart) =>
                                    <Card key={product.model} style={{ width: 'auto', margin: '10px' }}>
                                        <Card.Body style={{ display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <div>
                                                    <Card.Title>{product.model}</Card.Title>
                                                    <Card.Subtitle className="mb-2 text-muted">{product.category}</Card.Subtitle>
                                                    <Card.Text>
                                                        Price: {product.price} €
                                                        <br />
                                                        Quantity in cart: {product.quantity} units
                                                    </Card.Text>
                                                </div>
                                                <i className={`bi ${product.category === "Smartphone" ? "bi-phone-fill" : product.category === "Laptop" ? "bi-laptop-fill" : "bi-house-gear-fill"} functIcon`} style={{ color: product.category === "Smartphone" ? "green" : product.category === "Laptop" ? "gold" : "cyan" }}></i>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                )}
                            </Row>
                        </>
                    )}
                </Row>
            </Container>

            <Modal show={showDelete} onHide={() => setShowDelete(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete all carts</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete all carts?</p>
                    <p>This action cannot be undone.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDelete(false)}>Close</Button>
                    <Button variant="danger" onClick={async () => {
                        try {
                            await API.deleteAllCarts()
                            setDeleteToast(true)
                            setShowDelete(false)
                            setTimeout(() => {
                                setDeleteToast(false)
                                navigate("/home")
                            }, 3000)
                            setError("")
                        } catch (error: any) {
                            console.log(error)
                            setShowDelete(false)
                            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
                        }
                    }}>Delete</Button>
                </Modal.Footer>
            </Modal>

            {deleteToast && <ToastContainer position="top-center">
                <Toast className="toast notSaved">
                    <Toast.Body>All carts have been deleted</Toast.Body>
                </Toast>
            </ToastContainer>}

            {error && <Alert variant="danger">
                <ReactMarkdown>{error}</ReactMarkdown>
            </Alert>}
        </>
    )
}

export default CartView