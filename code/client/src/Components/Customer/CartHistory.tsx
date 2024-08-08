import { useContext, useEffect, useState } from "react"
import { Alert, Button, Card, Col, Container, Form, ListGroup, Modal, Row, Toast, ToastContainer } from "react-bootstrap"
import API from "../../API/API"
import { useNavigate } from "react-router-dom"
import { Rating } from '@smastrom/react-rating'
import '@smastrom/react-rating/style.css'
import { Cart, ProductInCart } from "../../Models/cart"
import ReactMarkdown from "react-markdown"
import { UserContext } from "../Login/UserContext"

function CartHistory() {
    const [carts, setCarts] = useState<Cart[]>([])
    const [currentCart, setCurrentCart] = useState<Cart>()
    const [showModal, setShowModal] = useState<boolean>(false)
    const [currentModel, setCurrentModel] = useState<string>("")
    const [comment, setComment] = useState<string>("")
    const [rating, setRating] = useState<number>(0)
    const [error, setError] = useState<string>("")
    const [deleteModal, setDeleteModal] = useState<boolean>(false)
    const [reviewToast, setReviewToast] = useState<boolean>(false)
    const [deleteToast, setDeleteToast] = useState<boolean>(false)
    const user = useContext(UserContext)
    const navigate = useNavigate()

    useEffect(() => {
        const getCartHistory = async () => {
            try {
                const carts = await API.getCustomerCarts()
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

    useEffect(() => {
        const getReviews = async () => {
            try {
                if (!currentModel) return
                const reviews = await API.getProductReviews(currentModel)
                if (!reviews) {
                    setShowModal(true)
                    return
                }
                if (reviews.filter((rev: any) => rev.user === user?.username).length > 0) {
                    setShowModal(false)
                    setDeleteModal(true)
                } else {
                    setShowModal(true)
                }
                setError("")
            } catch (error: any) {
                console.log(error)
                setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
            }
        }

        getReviews()
    }, [currentModel])

    const submitReview = async () => {
        try {
            await API.addReview(currentModel, rating, comment)
            setShowModal(false)
            setCurrentModel("")
            setReviewToast(true)
            setTimeout(() => {
                setReviewToast(false)
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
                    <Col className="mt-2" style={{ textAlign: "center" }}>
                        <span className="title" style={{ color: "green" }}>Cart history</span>
                        {carts.length === 0 && <Alert variant="info">You have no past orders</Alert>}
                        {carts.length > 0 && <>
                            <ListGroup className="exListCnt mt-3" as="ol">
                                {carts.map((cart, index) => (
                                    <ListGroup.Item key={index} as="li" action className="exDescrList" onClick={() => setCurrentCart(cart)}>
                                        <Row>
                                            <Col className="ms-2" sm>
                                                <div className="fw-bold">Order: {cart.paymentDate} - {cart.products.length} product(s)</div>
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
                                            <Button variant="outline-info" onClick={() => {
                                                setCurrentModel(product.model)
                                            }} >Add a review for this product</Button>
                                        </Card.Body>
                                    </Card>
                                )}
                            </Row>
                        </>
                    )}
                </Row>
                {error && <Alert variant="danger"><ReactMarkdown>{error}</ReactMarkdown></Alert>}
            </Container>

            {currentModel && <Modal show={showModal} onHide={() => {
                setError("")
                setShowModal(false)
                setCurrentModel("")
            }}>
                <Modal.Header closeButton>
                    <Modal.Title>Review <strong>{currentModel}</strong></Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label>Review</Form.Label>
                            <Form.Control as="textarea" placeholder="Write your review here" onChange={(event) => setComment(event.target.value)} />
                        </Form.Group>
                        <Form.Label>Rating</Form.Label>
                        <Rating value={rating} onChange={setRating} style={{ width: "200px" }} />
                        <Button variant="primary" onClick={() => submitReview()} >
                            Submit review
                        </Button>
                    </Form>
                    {error && <Alert variant="danger"><ReactMarkdown>{error}</ReactMarkdown></Alert>}
                </Modal.Body>
            </Modal>}

            {currentModel && <Modal show={deleteModal} onHide={() => {
                setError("")
                setDeleteModal(false)
                setCurrentModel("")
            }}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete review <strong>{currentModel}</strong></Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="info">You have already reviewed this product. Do you want to delete your review?</Alert>
                    <Button variant="danger" onClick={() => {
                        try {
                            API.deleteProductReview(currentModel)
                            setDeleteModal(false)
                            setCurrentModel("")
                            setDeleteToast(true)
                            setTimeout(() => {
                                setDeleteToast(false)
                            }, 3000)
                            setError("")
                        } catch (error: any) {
                            console.log(error)
                            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
                        }
                    }} >
                        Delete review
                    </Button>
                </Modal.Body>
            </Modal>}
            {reviewToast && <ToastContainer position="top-center">
                <Toast className="toast saved">
                    <Toast.Body>Your review has been saved successfully!
                    </Toast.Body>
                </Toast>
            </ToastContainer>}
            {deleteToast && <ToastContainer position="top-center">
                <Toast className="toast notSaved">
                    <Toast.Body>Your review has been deleted successfully!
                    </Toast.Body>
                </Toast>
            </ToastContainer>
            }
        </>
    )
}

export default CartHistory