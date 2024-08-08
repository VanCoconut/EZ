import { useEffect, useState } from "react"
import { Alert, Button, ButtonGroup, Card, Col, Container, Dropdown, Offcanvas, Row, Toast, ToastContainer } from "react-bootstrap"
import API from "../../API/API"
import { useNavigate } from "react-router-dom"
import { Product } from "../../Models/product"
import "./style.css"
import { ProductReview } from "../../Models/review"
import { Rating } from "@smastrom/react-rating"
import ReactMarkdown from "react-markdown"

function Shop() {
    const [products, setProducts] = useState<Product[]>([])
    const [models, setModels] = useState<string[]>([])
    const [filterCategory, setFilterCategory] = useState<string>("")
    const [filterModel, setFilterModel] = useState<string>("")
    const [showReviews, setShowReviews] = useState<boolean>(false)
    const [reviews, setReviews] = useState<ProductReview[]>([])
    const [currentModel, setCurrentModel] = useState<string>("")
    const [averageRating, setAverageRating] = useState<number>(0)
    const [addToast, setAddToast] = useState<boolean>(false)
    const [error, setError] = useState<string>("")
    const navigate = useNavigate()

    useEffect(() => {
        const getProducts = async () => {
            try {
                const pr = await API.getAvailableProducts(null, null, null)
                let m: string[] = []
                pr.forEach((p: Product) => {
                    if (!m.includes(p.model)) m.push(p.model)
                })
                setProducts(pr)
                setModels(m)
                setError("")
            } catch (error: any) {
                console.log(error)
                setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
            }
        }
        getProducts()
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
            } catch (error: any) {
                console.log(error)
                setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
            }
        }

        getReviews()
    }, [currentModel])

    const handleCategoryChange = async (eventKey: any) => {
        try {
            setFilterCategory(eventKey)
            setFilterModel("")
            let pr = await API.getAvailableProducts("category", eventKey, null)
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
            let pr = await API.getAvailableProducts("model", null, eventKey)
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
                    <Button
                        className="btnGroup light"
                        style={{ top: "10px", right: "10px", width: "auto", marginLeft: "10px" }}
                        variant="success"
                        onClick={() => navigate("/customer/carts/current")}
                    >
                        Go to Cart <i className="bi bi-cart" style={{ fontSize: "13px" }}></i>
                    </Button>
                </Row>
                <Row style={{ margin: 0, padding: 0 }}>
                    <Col sm md lg className="mt-2" style={{ textAlign: "center" }}>
                        <span className="title">Shop</span>
                    </Col>
                </Row>
                <Row>
                    {products.length === 0 && <Row style={{ justifyContent: 'center', margin: 0, padding: 0 }}>
                        <Card className="functionCnt" style={{ width: 'auto', margin: '10px' }}>
                            <Card.Body style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <div>
                                        <Card.Title>No products</Card.Title>
                                        <Card.Text>
                                            There are no products available for purchase at the moment. We are sorry for the inconvenience
                                        </Card.Text>
                                    </div>
                                    <i className="bi bi-emoji-tear functIcon" style={{ color: "cyan" }}></i>
                                </div>
                            </Card.Body>
                        </Card>
                    </Row>}
                    {products.length > 0 &&
                        <>
                            <Row style={{ margin: 0, padding: 0 }} className="justify-content-center">
                                <ButtonGroup style={{ display: "flex", width: "auto" }}>
                                    <Button variant="outline-secondary" onClick={() => {
                                        setFilterCategory("")
                                        setFilterModel("")
                                        API.getAvailableProducts(null, null, null).then((products: Product[]) => {
                                            setProducts(products)
                                        }).catch((error: any) => {
                                            console.log(error)
                                            setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
                                        })
                                    }} >
                                        View all products
                                    </Button>
                                    <Dropdown onSelect={handleCategoryChange} >
                                        <Dropdown.Toggle variant="outline-secondary" id="dropdown-cat">
                                            <i className="bi bi-funnel"></i>Filter by Category
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            <Dropdown.Item eventKey="Smartphone">Smartphone</Dropdown.Item>
                                            <Dropdown.Item eventKey="Laptop">Laptop</Dropdown.Item>
                                            <Dropdown.Item eventKey="Appliance">Appliance</Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                    <Dropdown onSelect={handleModelChange}>
                                        <Dropdown.Toggle variant="outline-secondary" id="dropdown-mod">
                                            <i className="bi bi-funnel"></i>Filter by Model
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            {models.map(m => <Dropdown.Item eventKey={m}>{m}</Dropdown.Item>)}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </ButtonGroup>
                            </Row>
                            <Row style={{ margin: 0, padding: 0 }} className="justify-content-center">
                                <Col sm md lg className="mt-2" style={{ textAlign: "center" }}>
                                    {(!filterCategory && !filterModel) && <span className="title" style={{ color: "gray" }}>No filters active</span>}
                                    {filterCategory && <span className="title" style={{ color: "green" }}>Filtering by category: <b>{filterCategory}</b></span>}
                                    {filterModel && <span className="title" style={{ color: "green" }}>Filtering by model: <b>{filterModel}</b></span>}
                                </Col>
                            </Row>


                            <Row style={{ margin: 0, padding: 0 }} className="justify-content-center">
                                {products.map((product: Product) => <Card key={product.model} style={{ width: 'auto', margin: '10px' }}>
                                    <Card.Body style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <div>
                                                <Card.Title>{product.model}</Card.Title>
                                                <Card.Subtitle className="mb-2 text-muted">{product.category}</Card.Subtitle>
                                                <Card.Text>
                                                    Price: {product.sellingPrice} €
                                                    <br />
                                                    {product.details && <>Details: {product.details}</>}
                                                </Card.Text>
                                            </div>
                                            <i className={`bi ${product.category === "Smartphone" ? "bi-phone-fill" : product.category === "Laptop" ? "bi-laptop-fill" : "bi-house-gear-fill"} functIcon`} style={{ color: product.category === "Smartphone" ? "green" : product.category === "Laptop" ? "gold" : "cyan" }}></i>
                                        </div>
                                        <Button variant="outline-info" onClick={async () => {
                                            try {
                                                await API.addToCart(product.model)
                                                setAddToast(true)
                                                setTimeout(() => setAddToast(false), 3000)
                                                setError("")
                                            } catch (error: any) {
                                                console.log(error)
                                                setError(error.error ? error.error : error.message ? error.message : typeof error === 'string' ? error : "An error occurred")
                                            }
                                        }} >Add product to cart</Button>
                                        <Button variant="outline-success" onClick={() => {
                                            setCurrentModel(product.model)
                                            setShowReviews(true)
                                        }} >See product reviews</Button>
                                    </Card.Body>
                                </Card>)}
                            </Row>
                        </>}
                </Row>
                {error && <Alert variant="danger"><ReactMarkdown>{error}</ReactMarkdown></Alert>}
            </Container>

            <Offcanvas show={showReviews} onHide={() => setShowReviews(false)} style={{ width: "30%" }} >
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Product Reviews</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    {reviews.length === 0 && <Alert variant="info">There are no reviews for this product yet</Alert>}
                    {reviews.length > 0 &&
                        <>
                            <h3>Product: {currentModel}</h3>
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
            </Offcanvas>

            {addToast && <ToastContainer position="top-center">
                <Toast className="toast saved">
                    <Toast.Body>The product has been successfully added to your cart</Toast.Body>
                </Toast>
            </ToastContainer>}
        </>
    )
}

export default Shop