import { useContext, useEffect, useState } from "react"
import { Alert, Button, ButtonGroup, Card, Col, Container, Dropdown, Form, Modal, Offcanvas, Row, Tab, Tabs, Toast, ToastContainer } from "react-bootstrap"
import API from "../../API/API"
import { useNavigate } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import { Product } from "../../Models/product"
import { ROLES, UserContext } from "../Login/UserContext"
import { ProductReview } from "../../Models/review"
import { Rating } from "@smastrom/react-rating"

function Stock() {
    const [products, setProducts] = useState<Product[]>([])
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [quantityIncrease, setQuantityIncrease] = useState(0)
    const [quantitySold, setQuantitySold] = useState(0)
    const [changeDate, setChangeDate] = useState("")
    const [error, setError] = useState("")
    const navigate = useNavigate()
    const [models, setModels] = useState<string[]>([])
    const [filterCategory, setFilterCategory] = useState<string>("")
    const [filterModel, setFilterModel] = useState<string>("")
    const [showDelete, setShowDelete] = useState(false)
    const [deleteAll, setDeleteAll] = useState(false)
    const [showReviews, setShowReviews] = useState(false)
    const [reviews, setReviews] = useState<ProductReview[]>([])
    const [currentModel, setCurrentModel] = useState<string>("")
    const [averageRating, setAverageRating] = useState<number>(0)
    const [deleteReviews, setDeleteReviews] = useState(false)
    const [deleteAllReviews, setDeleteAllReviews] = useState(false)
    const [updateToast, setUpdateToast] = useState(false)
    const [sellToast, setSellToast] = useState(false)
    const [deleteToast, setDeleteToast] = useState(false)
    const [deleteAllToast, setDeleteAllToast] = useState(false)
    const [reviewsToast, setReviewsToast] = useState(false)
    const [allReviewsToast, setAllReviewsToast] = useState(false)
    const [availableCategory, setAvailableCategory] = useState<string>("")
    const [availableModel, setAvailableModel] = useState<string>("")
    const [available, setAvailable] = useState(false)
    const user = useContext(UserContext)

    useEffect(() => {
        try {
            API.getProducts(null, null, null).then((prods: Product[] | any) => {
                setProducts(prods)
                let m: string[] = []
                prods.forEach((p: Product) => {
                    if (!m.includes(p.model)) m.push(p.model)
                })
                setModels(m)
                setError("")
            }).catch((err: any) => {
                console.log(err)
                setError(err.error ? err.error : err.message ? err.message : typeof err === 'string' ? err : "An error occurred")
            })
        } catch (error: any) {
            console.log(error)
            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
        }
    }, [])

    useEffect(() => {
        const getReviews = async () => {
            try {
                if (!currentModel) return
                const reviews = await API.getProductReviews(currentModel)
                let avg = 0
                reviews.forEach((r: ProductReview) => {
                    avg += r.score
                })
                avg = avg / reviews.length
                setAverageRating(avg)
                setReviews(reviews)
                setError("")
            } catch (err: any) {
                console.log(err)
                setError(err.error ? err.error : err.message ? err.message : typeof err === 'string' ? err : "An error occurred")
            }
        }

        getReviews()
    }, [currentModel])

    const recordQuantityIncrease = async (model: string) => {
        try {
            await API.changeProductQuantity(model, quantityIncrease, changeDate)
            let updatedProducts = await API.getProducts(null, null, null)
            setProducts(updatedProducts)
            setCurrentProduct(null)
            setShowModal(false)
            setQuantityIncrease(0)
            setQuantitySold(0)
            setUpdateToast(true)
            setChangeDate("")
            setTimeout(() => {
                setUpdateToast(false)
            }, 3000)
            setError("")
        } catch (error: any) {
            console.log(error)
            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
        }
    }

    const recordQuantitySold = async (model: string) => {
        try {
            await API.sellProduct(model, quantitySold, changeDate)
            let updatedProducts = await API.getProducts(null, null, null)
            setProducts(updatedProducts)
            setCurrentProduct(null)
            setShowModal(false)
            setQuantityIncrease(0)
            setQuantitySold(0)
            setSellToast(true)
            setChangeDate("")
            setTimeout(() => {
                setSellToast(false)
            }, 3000)
            setError("")
        } catch (error: any) {
            console.log(error)
            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
        }
    }

    const handleCategoryChange = async (eventKey: any) => {
        try {
            setFilterCategory(eventKey)
            setFilterModel("")
            setAvailableCategory("")
            setAvailableModel("")
            setAvailable(false)
            let pr = await API.getProducts("category", eventKey, null)
            setProducts(pr)
            setError("")
        } catch (error: any) {
            console.log(error)
            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
        }
    }

    const handleModelChange = async (eventKey: any) => {
        try {
            setFilterModel(eventKey)
            setFilterCategory("")
            setAvailableCategory("")
            setAvailableModel("")
            setAvailable(false)
            let pr = await API.getProducts("model", null, eventKey)
            console.log(pr)
            setProducts(pr)
            setError("")
        } catch (error: any) {
            console.log(error)
            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
        }
    }

    const handleAvailableCategoryChange = async (eventKey: any) => {
        try {
            setAvailableCategory(eventKey)
            setAvailableModel("")
            setAvailable(true)
            setFilterCategory("")
            setFilterModel("")
            let pr = await API.getAvailableProducts("category", eventKey, null)
            setProducts(pr)
            setError("")
        } catch (error: any) {
            console.log(error)
            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
        }
    }

    const handleAvailableModelChange = async (eventKey: any) => {
        try {
            setAvailableModel(eventKey)
            setAvailableCategory("")
            setAvailable(true)
            setFilterCategory("")
            setFilterModel("")
            let pr = await API.getAvailableProducts("model", null, eventKey)
            console.log(pr)
            setProducts(pr)
            setError("")
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
                        <span className="title" style={{ color: "gray" }}>Product Stock</span>
                    </Col>
                </Row>
                <Row style={{ margin: 0, padding: 0 }} className="justify-content-center" >
                    <ButtonGroup style={{ display: "flex", width: "auto" }} >
                        <Button variant="outline-secondary" style={{ width: "auto" }} onClick={() => {
                            setFilterCategory("")
                            setFilterModel("")
                            setAvailableCategory("")
                            setAvailableModel("")
                            setAvailable(false)
                            API.getProducts(null, null, null).then((products: Product[]) => {
                                setProducts(products)
                            }).catch((err: any) => {
                                console.log(err)
                                setError(err.error ? err.error : err.message ? err.message : typeof err === 'string' ? err : "An error occurred")
                            })
                        }} >
                            View all products
                        </Button>
                        <Dropdown onSelect={handleCategoryChange} style={{ width: "auto" }} >
                            <Dropdown.Toggle variant="outline-secondary" id="dropdown-cat">
                                <i className="bi bi-funnel"></i>Filter by Category
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item eventKey="Smartphone">Smartphone</Dropdown.Item>
                                <Dropdown.Item eventKey="Laptop">Laptop</Dropdown.Item>
                                <Dropdown.Item eventKey="Appliance">Appliance</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                        <Dropdown onSelect={handleModelChange} style={{ width: "auto" }}>
                            <Dropdown.Toggle variant="outline-secondary" id="dropdown-mod">
                                <i className="bi bi-funnel"></i>Filter by Model
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                {models.map(m => <Dropdown.Item eventKey={m}>{m}</Dropdown.Item>)}
                            </Dropdown.Menu>
                        </Dropdown>
                        <Button variant="danger" style={{ width: "auto" }} onClick={() => setDeleteAll(true)} >Delete all products</Button>
                        <Button variant="danger" style={{ width: "auto" }} onClick={() => setDeleteAllReviews(true)} >Delete all reviews</Button>

                    </ButtonGroup>
                </Row>
                {!available && <Row style={{ margin: 0, padding: 0 }} className="justify-content-center">
                    <Col sm md lg className="mt-2" style={{ textAlign: "center" }}>
                        {(!filterCategory && !filterModel) && <span className="title" style={{ color: "gray" }}>No filters active</span>}
                        {filterCategory && <span className="title" style={{ color: "green" }}>Filtering by category: <b>{filterCategory}</b></span>}
                        {filterModel && <span className="title" style={{ color: "green" }}>Filtering by model: <b>{filterModel}</b></span>}
                    </Col>
                </Row>}
                <Row style={{ margin: 0, padding: 0 }} className="justify-content-center" >
                    <ButtonGroup style={{ display: "flex", width: "auto" }} >
                        <Button variant="outline-secondary" style={{ width: "auto" }} onClick={() => {
                            setAvailableCategory("")
                            setAvailableModel("")
                            setFilterCategory("")
                            setFilterModel("")
                            setAvailable(true)
                            API.getAvailableProducts(null, null, null).then((products: Product[]) => {
                                setProducts(products)
                            }).catch((err: any) => {
                                console.log(err)
                                setError(err.error ? err.error : err.message ? err.message : typeof err === 'string' ? err : "An error occurred")
                            })
                        }} >
                            View available products
                        </Button>
                        <Dropdown onSelect={handleAvailableCategoryChange} style={{ width: "auto" }} >
                            <Dropdown.Toggle variant="outline-secondary" id="dropdown-cat">
                                <i className="bi bi-funnel"></i>Filter by Category (available)
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item eventKey="Smartphone">Smartphone</Dropdown.Item>
                                <Dropdown.Item eventKey="Laptop">Laptop</Dropdown.Item>
                                <Dropdown.Item eventKey="Appliance">Appliance</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                        <Dropdown onSelect={handleAvailableModelChange} style={{ width: "auto" }}>
                            <Dropdown.Toggle variant="outline-secondary" id="dropdown-mod">
                                <i className="bi bi-funnel"></i>Filter by Model (available)
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                {models.map(m => <Dropdown.Item eventKey={m}>{m}</Dropdown.Item>)}
                            </Dropdown.Menu>
                        </Dropdown>
                    </ButtonGroup>
                    {available && <Row style={{ margin: 0, padding: 0 }} className="justify-content-center">
                        <Col sm md lg className="mt-2" style={{ textAlign: "center" }}>
                            {(!availableCategory && !availableModel) && <span className="title" style={{ color: "gray" }}>Viewing all available products</span>}
                            {availableCategory && <span className="title" style={{ color: "green" }}>Filtering available products by category: <b>{filterCategory}</b></span>}
                            {availableModel && <span className="title" style={{ color: "green" }}>Filtering available products by model: <b>{filterModel}</b></span>}
                        </Col>
                    </Row>}
                </Row>
                <Row>
                    {products.length === 0 && <Row style={{ justifyContent: 'center', margin: 0, padding: 0 }}>
                        <Card className="functionCnt" style={{ width: 'auto', margin: '10px' }}>
                            <Card.Body style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <div>
                                        <Card.Title>No products</Card.Title>
                                        <Card.Text>
                                            There are no products in the stock at the moment.
                                        </Card.Text>
                                    </div>
                                    <i className="bi bi-emoji-tear functIcon" style={{ color: "cyan" }}></i>
                                </div>
                            </Card.Body>
                        </Card>
                    </Row>}
                    {products.length > 0 && <Row style={{ margin: 0, padding: 0 }} className="justify-content-center">
                        {products.map((product: Product) => <Card key={product.model} style={{ width: 'auto', margin: '10px' }}>
                            <Card.Body style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <div>
                                        <Card.Title>{product.model}</Card.Title>
                                        <Card.Subtitle className="mb-2 text-muted">{product.category}</Card.Subtitle>
                                        <Card.Text>
                                            Price: {product.sellingPrice} €
                                            <br />
                                            Arrival Date: {product.arrivalDate}
                                            <br />
                                            Quantity in stock: {product.quantity}
                                        </Card.Text>
                                    </div>
                                    <i className={`bi ${product.category === "Smartphone" ? "bi-phone-fill" : product.category === "Laptop" ? "bi-laptop-fill" : "bi-house-gear-fill"} functIcon`} style={{ color: product.category === "Smartphone" ? "green" : product.category === "Laptop" ? "gold" : "cyan" }}></i>
                                </div>
                                <Button variant="outline-info" onClick={() => {
                                    setCurrentProduct(product)
                                    setShowModal(true)
                                }}>Product operations</Button>
                                <Button variant="outline-success" onClick={() => {
                                    setCurrentModel(product.model)
                                    setShowReviews(true)
                                }}>See product reviews</Button>
                                <Button variant="danger" onClick={() => {
                                    setCurrentProduct(product)
                                    setShowDelete(true)
                                }} >Delete product</Button>
                            </Card.Body>
                        </Card>)}
                    </Row>}
                </Row>
                {error && <Alert variant="danger">
                    <ReactMarkdown>{error}</ReactMarkdown>
                </Alert>}
            </Container>

            {currentProduct && <Modal show={showModal} onHide={() => {
                setError("")
                setShowModal(false)
            }}>
                <Modal.Header closeButton>
                    <Modal.Title>Product Operations</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Tabs defaultActiveKey="record" id="productOperations" className="mb-3">
                        <Tab eventKey="record" title="Record new arrivals">
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Current quantity: {currentProduct?.quantity}</Form.Label>
                                    <Form.Control className="mt-3" type="number" placeholder="Enter quantity increase" onChange={(event) => setQuantityIncrease(parseInt(event.target.value))} />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Arrival date</Form.Label>
                                    <Form.Control value={changeDate} className="mt-3" type="date" placeholder="Enter arrival date" max={new Date().toISOString().split('T')[0]} onChange={(event) => setChangeDate(event.target.value)} />
                                </Form.Group>
                            </Form>
                            <Button variant="outline-success" onClick={() => recordQuantityIncrease(currentProduct.model)} >Record quantity increase</Button>
                        </Tab>
                        <Tab eventKey="sell" title="Sell">
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Current quantity: {currentProduct?.quantity}</Form.Label>
                                    <Form.Control className="mt-3" type="number" placeholder="Enter quantity sold" onChange={(event) => setQuantitySold(parseInt(event.target.value))} />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Selling date</Form.Label>
                                    <Form.Control value={changeDate} className="mt-3" type="date" placeholder="Enter arrival date" max={new Date().toISOString().split('T')[0]} onChange={(event) => setChangeDate(event.target.value)} />
                                </Form.Group>
                            </Form>
                            <Button variant="outline-success" onClick={() => recordQuantitySold(currentProduct?.model)} >Record quantity sold</Button>
                        </Tab>
                    </Tabs>
                    {error && <Alert variant="danger">
                        <ReactMarkdown>{error}</ReactMarkdown>
                    </Alert>}
                </Modal.Body>
            </Modal>}
            {currentProduct && <Modal show={showDelete} onHide={() => {
                setError("")
                setShowDelete(false)
            }}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete product</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="danger">
                        Are you sure you want to delete the product {currentProduct.model}?
                        This action cannot be undone!
                    </Alert>
                    <Button variant="outline-danger" onClick={async () => {
                        try {
                            await API.deleteProduct(currentProduct.model)
                            let updatedProducts = await API.getProducts(null, null, null)
                            setProducts(updatedProducts)
                            setCurrentProduct(null)
                            setDeleteToast(true)
                            setTimeout(() => {
                                setDeleteToast(false)
                            }, 3000)
                            setShowDelete(false)
                        } catch (error: any) {
                            console.log(error)
                            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
                        }
                    }} >Delete product</Button>
                    <Button variant="outline-secondary" onClick={() => setShowDelete(false)} >Cancel</Button>
                </Modal.Body>
            </Modal>}
            <Modal show={deleteAll} onHide={() => {
                setError("")
                setDeleteAll(false)
            }}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete all products</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="danger">
                        Are you sure you want to delete all products?
                        This action cannot be undone!
                    </Alert>
                    <Button variant="outline-danger" onClick={async () => {
                        try {
                            await API.deleteAllProducts()
                            setProducts([])
                            setDeleteAll(false)
                            setDeleteAllToast(true)
                            setTimeout(() => {
                                setDeleteAllToast(false)
                            }, 3000)
                        } catch (error: any) {
                            console.log(error)
                            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
                        }
                    }} >Delete all products</Button>
                    <Button variant="outline-secondary" onClick={() => setDeleteAll(false)} >Cancel</Button>
                </Modal.Body>
            </Modal>
            {currentModel && <Offcanvas show={showReviews} onHide={() => {
                setError("")
                setShowReviews(false)
            }}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Reviews of {currentModel}</Offcanvas.Title>
                    {reviews.length > 0 && <Button variant="danger" onClick={() => setDeleteReviews(true)} >Delete reviews </Button>}
                </Offcanvas.Header>
                <Offcanvas.Body>
                    {reviews.length === 0 && <Alert variant="info">There are no reviews for this product yet</Alert>}
                    {reviews.length > 0 &&
                        <>
                            <h5>Average score: <Rating value={averageRating} style={{ width: "250px" }} readOnly /> </h5>
                            {reviews.map((review: ProductReview) => <Card key={review.id} style={{ width: 'auto', margin: '10px' }}>
                                <Card.Body style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <div>
                                            <Card.Title>{review.comment}</Card.Title>
                                            <Card.Subtitle className="mb-2 text-muted">Rating: <Rating value={review.score} style={{ width: "150px" }} readOnly /> </Card.Subtitle>
                                            <Card.Text>
                                                By: {review.user}
                                                <br />
                                                Date: {review.date}

                                            </Card.Text>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>)}
                        </>}
                </Offcanvas.Body>
            </Offcanvas>}
            {currentModel && <Modal show={deleteReviews} onHide={() => {
                setError("")
                setDeleteReviews(false)
            }}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete reviews</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="danger">
                        Are you sure you want to delete all reviews of {currentModel}?
                        This action cannot be undone!
                    </Alert>
                    <Button variant="outline-danger" onClick={async () => {
                        try {
                            await API.deleteReviewsOfProduct(currentModel)
                            setReviews([])
                            setDeleteReviews(false)
                            setCurrentModel("")
                            setReviewsToast(true)
                            setTimeout(() => {
                                setReviewsToast(false)
                            }, 3000)
                        } catch (error: any) {
                            console.log(error)
                            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
                        }
                    }} >Delete all reviews</Button>
                    <Button variant="outline-secondary" onClick={() => setDeleteReviews(false)} >Cancel</Button>
                </Modal.Body>
            </Modal>}
            <Modal show={deleteAllReviews} onHide={() => {
                setError("")
                setDeleteAllReviews(false)
            }}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete all reviews</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="danger">
                        Are you sure you want to delete all reviews?
                        This action cannot be undone!
                    </Alert>
                    <Button variant="outline-danger" onClick={async () => {
                        try {
                            await API.deleteAllReviews()
                            setReviews([])
                            setDeleteAllReviews(false)
                            setAllReviewsToast(true)
                            setTimeout(() => {
                                setAllReviewsToast(false)
                            }, 3000)
                        } catch (error: any) {
                            console.log(error)
                            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
                        }
                    }} >Delete all reviews</Button>
                    <Button variant="outline-secondary" onClick={() => setDeleteAllReviews(false)} >Cancel</Button>
                </Modal.Body>
            </Modal>

            {updateToast && <ToastContainer position="top-center">
                <Toast className="toast saved">
                    <Toast.Body>Product quantity updated successfully</Toast.Body>
                </Toast>
            </ToastContainer>}

            {sellToast && <ToastContainer position="top-center">
                <Toast className="toast saved">
                    <Toast.Body>Product sold successfully</Toast.Body>
                </Toast>
            </ToastContainer>}

            {deleteToast && <ToastContainer position="top-center">
                <Toast className="toast notSaved">
                    <Toast.Body>Product deleted successfully</Toast.Body>
                </Toast>
            </ToastContainer>}

            {deleteAllToast && <ToastContainer position="top-center">
                <Toast className="toast notSaved">
                    <Toast.Body>All products deleted successfully</Toast.Body>
                </Toast>
            </ToastContainer>}

            {reviewsToast && <ToastContainer position="top-center">
                <Toast className="toast notSaved">
                    <Toast.Body>Reviews deleted successfully</Toast.Body>
                </Toast>
            </ToastContainer>}

            {allReviewsToast && <ToastContainer position="top-center">
                <Toast className="toast notSaved">
                    <Toast.Body>All reviews deleted successfully</Toast.Body>
                </Toast>
            </ToastContainer>}
        </>
    )
}

export default Stock