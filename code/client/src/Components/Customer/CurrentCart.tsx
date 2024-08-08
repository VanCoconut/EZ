import { useEffect, useState } from "react"
import { Alert, Button, Card, Col, Container, Modal, Row, Toast, ToastContainer } from "react-bootstrap"
import API from "../../API/API"
import { useNavigate } from "react-router-dom"
import "./style.css"
import { Cart, ProductInCart } from "../../Models/cart"
import ReactMarkdown from "react-markdown"

function CurrentCart() {
    const [cart, setCart] = useState<Cart>()
    const [showModal, setShowModal] = useState(false)
    const [removeToast, setRemoveToast] = useState(false)
    const [allToast, setAllToast] = useState(false)
    const [checkoutToast, setCheckoutToast] = useState(false)
    const [error, setError] = useState<string>("")
    const navigate = useNavigate()

    useEffect(() => {
        const getCart = async () => {
            try {
                const cart = await API.getCart()
                console.log(cart)
                setCart(cart)
                setError("")
            } catch (error: any) {
                console.log(error)
                setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
            }
        }
        getCart()
    }, [])

    const checkoutCart = async () => {
        setShowModal(true)
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
                    <Button
                        className="btnGroup light"
                        style={{ top: "10px", right: "10px", width: "auto", marginLeft: "10px" }}
                        variant="success"
                        onClick={() => checkoutCart()}
                        disabled={!cart || cart.products.length <= 0}
                    >
                        Checkout <i className="bi bi-cart" style={{ fontSize: "13px" }}></i>
                    </Button>
                </Row>
                <Row style={{ margin: 0, padding: 0 }}>
                    <Col sm md lg className="mt-2" style={{ textAlign: "center" }}>
                        <span className="title">Cart</span>
                    </Col>
                </Row>
                <Row>
                    {!cart || (cart && cart.products.length === 0) &&
                        <Row style={{ justifyContent: 'center', margin: 0, padding: 0 }}>
                            <Card className="functionCnt" style={{ width: 'auto', margin: '10px' }}>
                                <Card.Body style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <div>
                                            <Card.Title>Your cart is empty</Card.Title>
                                            <Card.Text>
                                                You can add products to your cart by clicking the "Add to cart" button on the product page
                                            </Card.Text>
                                        </div>
                                        <i className="bi bi-emoji-tear functIcon" style={{ color: "cyan" }}></i>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Row>}
                    {cart && cart.products.length > 0 && <>
                        <Row style={{ justifyContent: 'center', margin: 0, padding: 0 }}>
                            {cart.products.map((product: ProductInCart) => <Card key={product.model} style={{ width: 'auto', margin: '10px' }}>
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
                                    <Button variant="outline-danger" onClick={async () => {
                                        API.removeProductFromCart(product.model).then(async () => {
                                            API.getCart().then((c: Cart) => {
                                                setRemoveToast(true)
                                                setTimeout(() => setRemoveToast(false), 3000)
                                                setCart(c)
                                                setError("")
                                            }).catch((error: any) => {
                                                console.log(error)
                                                setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
                                            })
                                        }).catch((error: any) => {
                                            console.log(error)
                                            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
                                        })
                                    }} >Remove one unit from cart</Button>
                                </Card.Body>
                            </Card>)}
                        </Row>
                    </>}
                    {cart && cart.products.length > 0 && showModal && <Modal show={showModal} onHide={() => {
                        setShowModal(false)
                    }}>
                        <Modal.Header>
                            <Modal.Title>Cart Recap</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            Total products: <b>{cart.products.reduce((acc, product) => acc + product.quantity, 0)}</b>
                            <br />
                            Total cost: <b>{cart.total} €</b>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowModal(false)}>
                                Close
                            </Button>
                            <Button variant="danger" onClick={() => API.clearCart().then(() => {
                                API.getCart().then((c: Cart) => {
                                    setCart(c)
                                    setAllToast(true)
                                    setTimeout(() => setAllToast(false), 3000)
                                    setError("")
                                }).catch((error: any) => {
                                    console.log(error)
                                    setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
                                })
                                setShowModal(false)
                            }).catch((error: any) => {
                                console.log(error)
                                setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
                            })
                            } >Clear the cart</Button>
                            <Button variant="primary" onClick={() => API.checkoutCart().then(() => {
                                setCheckoutToast(true)
                                setShowModal(false)
                                setTimeout(() => {
                                    setCheckoutToast(false)
                                    navigate("/home")
                                }, 3000)
                                setError("")
                            }).catch((error: any) => {
                                console.log(error)
                                setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
                            })} >
                                Checkout cart
                            </Button>
                        </Modal.Footer>
                    </Modal>}
                </Row>
                {error && <Alert variant="danger"><ReactMarkdown>{error}</ReactMarkdown></Alert>}
            </Container>

            {removeToast && <ToastContainer position="top-center">
                <Toast className="toast notSaved">
                    <Toast.Body>One product has been removed from the cart</Toast.Body>
                </Toast>
            </ToastContainer>}

            {allToast && <ToastContainer position="top-center">
                <Toast className="toast notSaved">
                    <Toast.Body>The cart has been cleared</Toast.Body>
                </Toast>
            </ToastContainer>}

            {checkoutToast && <ToastContainer position="top-center">
                <Toast className="toast saved">
                    <Toast.Body>The cart has been checked out</Toast.Body>
                </Toast>
            </ToastContainer>}
        </>
    )
}

export default CurrentCart