import { Card, Container, Row } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import { ROLES, UserContext } from "./Login/UserContext"
import { useContext, useEffect } from "react"
import "./style.css"

function Homepage() {
    const navigate = useNavigate()
    const user = useContext(UserContext)

    useEffect(() => {
        console.log(user)
    })

    return (
        <>
            <Container fluid>
                <Row style={{ textAlign: "center", margin: 0, padding: 0 }}>
                    <span className="adminTitle">Homepage</span>
                </Row>
                <Row style={{ justifyContent: 'center', margin: 0, padding: 0, alignItems: "center", height: "100%" }}>
                    {user && <Card className="functionCnt" onClick={() => navigate("/profile")} style={{ width: 'auto', margin: '10px' }}>
                        <Card.Body style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <Card.Title>Profile</Card.Title>
                                <br />
                                <div>
                                    <i className="bi bi-person functIcon"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>}
                    {user && user.role === ROLES.CUSTOMER && <Card className="functionCnt" onClick={() => navigate("/customer/shop")} style={{ width: 'auto', margin: '10px' }}>
                        <Card.Body style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <Card.Title>Shop</Card.Title>
                                <br />
                                <div>
                                    <i className="bi bi-shop functIcon"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>}
                    {user && user.role === ROLES.CUSTOMER && <Card className="functionCnt" onClick={() => navigate("/customer/carts/current")} style={{ width: 'auto', margin: '10px' }}>
                        <Card.Body style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <Card.Title>View cart</Card.Title>
                                <br />
                                <div>
                                    <i className="bi bi-cart-check-fill functIcon"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>}
                    {user && user.role === ROLES.CUSTOMER && <Card className="functionCnt" onClick={() => navigate("/customer/orders")} style={{ width: 'auto', margin: '10px' }}>
                        <Card.Body style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <Card.Title>View past orders</Card.Title>
                                <br />
                                <div>
                                    <i className="bi bi-card-list functIcon"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>}
                    {user && (user.role === ROLES.MANAGER) && <Card className="functionCnt" onClick={() => navigate("/manager/products/record")} style={{ width: "auto", margin: "10px" }}>
                        <Card.Body style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <Card.Title>Record new products</Card.Title>
                                <br />
                                <div>
                                    <i className="bi bi-truck functIcon"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>}
                    {user && user.role === ROLES.MANAGER && <Card className="functionCnt" onClick={() => navigate("/manager/stock")} style={{ width: "auto", margin: "10px" }}>
                        <Card.Body style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <Card.Title>View stock</Card.Title>
                                <br />
                                <div>
                                    <i className="bi bi-clipboard functIcon"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>}
                    {user && user.role === ROLES.MANAGER && <Card className="functionCnt" onClick={() => navigate("/manager/carts")} style={{ width: "auto", margin: "10px" }}>
                        <Card.Body style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <Card.Title>Manage carts</Card.Title>
                                <br />
                                <div>
                                    <i className="bi bi-cart functIcon"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>}
                    {user && user.role === ROLES.ADMIN && <Card className="functionCnt" onClick={() => navigate("/admin/users")} style={{ width: "auto", margin: "10px" }}>
                        <Card.Body style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <Card.Title>Manage users</Card.Title>
                                <br />
                                <div>
                                    <i className="bi bi-people functIcon"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>}
                    {user && user.role === ROLES.ADMIN && <Card className="functionCnt" onClick={() => navigate("/admin/carts")} style={{ width: "auto", margin: "10px" }}>
                        <Card.Body style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <Card.Title>Manage carts</Card.Title>
                                <br />
                                <div>
                                    <i className="bi bi-cart functIcon"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>}
                    {user && user.role === ROLES.ADMIN && <Card className="functionCnt" onClick={() => navigate("/admin/stock")} style={{ width: "auto", margin: "10px" }}>
                        <Card.Body style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <Card.Title>View stock</Card.Title>
                                <br />
                                <div>
                                    <i className="bi bi-clipboard functIcon"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>}
                    {user && (user.role === ROLES.ADMIN) && <Card className="functionCnt" onClick={() => navigate("/admin/products/record")} style={{ width: "auto", margin: "10px" }}>
                        <Card.Body style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <Card.Title>Record new products</Card.Title>
                                <br />
                                <div>
                                    <i className="bi bi-truck functIcon"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>}
                </Row>
            </Container>
        </>
    )
}

export default Homepage