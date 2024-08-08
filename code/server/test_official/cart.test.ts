import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"

const routePath = "/ezelectronics"
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const secondCustomer = { username: "customer2", name: "customer2", surname: "customer2", password: "customer2", role: "Customer" }
const prod1 = { model: "model", category: "Smartphone", quantity: 10, details: "details", sellingPrice: 1000, arrivalDate: "2022-01-01" }
const prod2 = { model: "model2", category: "Laptop", quantity: 10, details: "details", sellingPrice: 1000, arrivalDate: "2022-01-01" }
const prod3 = { model: "modelNew", category: "Appliance", quantity: 10, details: "details", sellingPrice: 1000 }
const prodEmpty = { model: "empty", category: "Smartphone", quantity: 1, details: "details", sellingPrice: 1000, arrivalDate: "2022-01-01" }
let customerCookie: string
let managerCookie: string
let adminCookie: string
let secondCustomerCookie: string

const postUser = async (userInfo: any) => {
    await request(app).post(`${routePath}/users`).send(userInfo).expect(200)
}

const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app).post(`${routePath}/sessions`).send(userInfo).expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}

const createProduct = async (product: any, cookie: string) => {
    await request(app).post(`${routePath}/products`).set("Cookie", cookie).send(product).expect(200)
}

describe("Tests for Cart Routes", () => {
    beforeAll(async () => {
        await cleanup()
        //The cleanup function may not finish in time for the next operation, leading to potential issues
        //We wait 15 seconds before writing to the database, ensuring that the test suite contains what we need
        await new Promise(resolve => setTimeout(resolve, 15000))
        //We create all 4 users we need and then log them in
        await postUser(customer)
        await postUser(manager)
        await postUser(admin)
        await postUser(secondCustomer)
        customerCookie = await login(customer)
        managerCookie = await login(manager)
        adminCookie = await login(admin)
        secondCustomerCookie = await login(secondCustomer)
        //We create 4 products and sell one of them to ensure one product is not available
        await createProduct(prod1, managerCookie)
        await createProduct(prod2, managerCookie)
        await createProduct(prod3, managerCookie)
        await createProduct(prodEmpty, managerCookie)
        await request(app).patch(`${routePath}/products/empty/sell`).set("Cookie", managerCookie).send({ quantity: 1, sellingDate: "2022-01-01" }).expect(200)
    })

    afterAll(async () => {
        await cleanup()
    })

    describe("1. POST /carts", () => {
        test("1.1 It should create a new cart when a customer does not have one", async () => {
            //We know that the customer does not have a cart so there should be only one product after adding it
            await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie).send({ model: "model" }).expect(200)
            let cart = await request(app).get(`${routePath}/carts`).set("Cookie", customerCookie).expect(200)
            expect(cart.body.customer).toEqual("customer")
            expect(cart.body.paid).toBeFalsy()
            expect(cart.body.paymentDate).toBeFalsy()
            expect(cart.body.total).toEqual(1000)
            expect(cart.body.products.length).toEqual(1)
            expect(cart.body.products[0].model).toEqual("model")
            expect(cart.body.products[0].quantity).toEqual(1)
            expect(cart.body.products[0].price).toEqual(1000)
        })

        test("1.2 It should increase the quantity of a product in the cart if it is already there", async () => {
            //The cart contains one unit of the product we added before, so adding another one should increase the quantity to 2 and the total cost
            await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie).send({ model: "model" }).expect(200)
            let cart = await request(app).get(`${routePath}/carts`).set("Cookie", customerCookie).expect(200)
            expect(cart.body.products.length).toEqual(1)
            expect(cart.body.products[0].quantity).toEqual(2)
            expect(cart.body.total).toEqual(2000)
        })

        test("1.3 It should add a new product to the cart if it is not already there", async () => {
            //The cart contains two units of the first product so we add a new product model.
            //The total cost should increase and the new product should be added to the cart
            await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie).send({ model: "model2" }).expect(200)
            let cart = await request(app).get(`${routePath}/carts`).set("Cookie", customerCookie).expect(200)
            expect(cart.body.products.length).toEqual(2)
            expect(cart.body.products[1].model).toEqual("model2")
            expect(cart.body.products[1].quantity).toEqual(1)
            expect(cart.body.total).toEqual(3000)
        })

        test("1.4 It should return a 401 error when called by a user who is not a customer or is not logged in", async () => {
            await request(app).post(`${routePath}/carts`).set("Cookie", managerCookie).send({ model: "model" }).expect(401)
            await request(app).post(`${routePath}/carts`).set("Cookie", adminCookie).send({ model: "model" }).expect(401)
            await request(app).post(`${routePath}/carts`).send({ model: "model" }).expect(401)
        })

        test("1.5 It should return a 404 error when the product to add does not exist", async () => {
            await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie).send({ model: "model3" }).expect(404)
        })

        test("1.6 It should return a 422 error when the product is not provided or is an empty string", async () => {
            await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie).send({ model: "" }).expect(422)
            await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie).send({}).expect(422)
        })

        test("1.7 It should return a 409 error when the requested product is not available", async () => {
            //The product "empty" was made unavailable before the tests so we should get a 409 error
            await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie).send({ model: "empty" }).expect(409)
        })
    })

    describe("2. GET /carts", () => {
        test("2.1 It should return the cart of the logged in customer", async () => {
            //The cart contains two products, one with a quantity of 2 and the other with a quantity of 1
            let cart = await request(app).get(`${routePath}/carts`).set("Cookie", customerCookie).expect(200)
            expect(cart.body.customer).toEqual("customer")
            expect(cart.body.paid).toBeFalsy()
            expect(cart.body.paymentDate).toBeNull()
            expect(cart.body.total).toEqual(3000)
            expect(cart.body.products.length).toEqual(2)
            expect(cart.body.products[0].model).toEqual("model")
            expect(cart.body.products[0].quantity).toEqual(2)
            expect(cart.body.products[0].price).toEqual(1000)
            expect(cart.body.products[1].model).toEqual("model2")
            expect(cart.body.products[1].quantity).toEqual(1)
            expect(cart.body.products[1].price).toEqual(1000)
        })

        test("2.2 It should return an empty cart object if the customer does not have a cart", async () => {
            //The second customer never had a cart so the response should be an empty cart object
            let cart = await request(app).get(`${routePath}/carts`).set("Cookie", secondCustomerCookie).expect(200)
            expect(cart.body.customer).toEqual("customer2")
            expect(cart.body.paid).toBeFalsy()
            expect(cart.body.paymentDate).toBeFalsy()
            expect(cart.body.total).toEqual(0)
            expect(cart.body.products.length).toEqual(0)
        })

        test("2.3 It should return a 401 error when called by a user who is not a customer or is not logged in", async () => {
            await request(app).get(`${routePath}/carts`).set("Cookie", managerCookie).expect(401)
            await request(app).get(`${routePath}/carts`).set("Cookie", adminCookie).expect(401)
            await request(app).get(`${routePath}/carts`).expect(401)
        })
    })

    describe("3. PATCH /carts", () => {
        test("3.1 It should checkout the cart of the logged in customer. The available quantity of products in the cart should be reduced", async () => {
            //We pay for the current cart
            let today = new Date().toISOString().split("T")[0]
            await request(app).patch(`${routePath}/carts`).set("Cookie", customerCookie).expect(200)
            //We get the cart history of the customer: there should be only one paid cart (the one we just paid for) and its information should be as expected
            let carts = await request(app).get(`${routePath}/carts/history`).set("Cookie", customerCookie).expect(200)
            expect(carts.body.length).toEqual(1)
            expect(carts.body[0].customer).toEqual("customer")
            expect(carts.body[0].paid).toBeTruthy()
            expect(carts.body[0].paymentDate).toEqual(today)
            expect(carts.body[0].total).toEqual(3000)
            expect(carts.body[0].products.length).toEqual(2)
            //We retrieve the information about the two products that were in the cart, their quantity should be reduced by the quantity in the cart
            let model = await request(app).get(`${routePath}/products/?grouping=model&model=model`).set("Cookie", managerCookie).expect(200)
            expect(model.body[0].quantity).toEqual(8)
            let model2 = await request(app).get(`${routePath}/products/?grouping=model&model=model2`).set("Cookie", managerCookie).expect(200)
            expect(model2.body[0].quantity).toEqual(9)
        })

        test("3.2 It should return a 401 error when called by a user who is not a customer or is not logged in", async () => {
            await request(app).patch(`${routePath}/carts`).set("Cookie", managerCookie).expect(401)
            await request(app).patch(`${routePath}/carts`).set("Cookie", adminCookie).expect(401)
            await request(app).patch(`${routePath}/carts`).expect(401)
        })

        test("3.3 It should return an error if the customer does not have a cart", async () => {
            //The second customer never had a cart so we should get an error. The error code can be either 400 or 404
            let res = await request(app).patch(`${routePath}/carts`).set("Cookie", secondCustomerCookie)
            let errorStatus = res.status === 400 || res.status === 404
            expect(errorStatus).toBeTruthy()
        })

        test("3.4 It should return a 400 error if the cart is empty", async () => {
            //We add and then remove a product from the cart so that a cart (if present in the database) contains no products
            //The error code may be either 400 or 404
            await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie).send({ model: "model" }).expect(200)
            await request(app).delete(`${routePath}/carts/products/model`).set("Cookie", customerCookie).expect(200)
            let res = await request(app).patch(`${routePath}/carts`).set("Cookie", customerCookie)
            let errorStatus = res.status === 400 || res.status === 404
            expect(errorStatus).toBeTruthy()
        })

        test("3.5 It should return a 409 error if the cart contains a product that is not available", async () => {
            //We increase the quantity of the previously unavailable product so that it can be added to the cart
            //We then sell the product so that it is no longer available, and try to checkout the cart expecting an error
            await request(app).patch(`${routePath}/products/empty`).set("Cookie", managerCookie).send({ quantity: 2 }).expect(200)
            await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie).send({ model: "empty" }).expect(200)
            await request(app).patch(`${routePath}/products/empty/sell`).set("Cookie", managerCookie).send({ quantity: 2 }).expect(200)
            await request(app).patch(`${routePath}/carts`).set("Cookie", customerCookie).expect(409)
        })

        test("3.6 It should return a 409 error if the cart contains a product that is not available in the requested quantity", async () => {
            //We increase the quantity of the product so that it can be added to the cart again (it was set to 0 in the previous test)
            //We add a second unit of the product to the cart (it was not removed before so it's still there)
            //We sell the product again so that it is no longer available in the requested quantity, and try to checkout the cart expecting an error
            await request(app).patch(`${routePath}/products/empty`).set("Cookie", managerCookie).send({ quantity: 1 }).expect(200)
            await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie).send({ model: "empty" }).expect(200)
            await request(app).patch(`${routePath}/products/empty/sell`).set("Cookie", managerCookie).send({ quantity: 1 }).expect(200)
            await request(app).patch(`${routePath}/carts`).set("Cookie", customerCookie).expect(409)
        })
    })

    describe("4. GET /carts/history", () => {
        test("4.1 It should return the history of the logged in customer's paid carts. The current cart should not be present in the list", async () => {
            //We expect the current cart to not be present in the array, since the route returns only paid carts
            let carts = await request(app).get(`${routePath}/carts/history`).set("Cookie", customerCookie).expect(200)
            expect(carts.body.length).toEqual(1)
            expect(carts.body[0].customer).toEqual("customer")
            expect(carts.body[0].paid).toBeTruthy()
            expect(carts.body[0].paymentDate).not.toBeNull()
            expect(carts.body[0].total).toEqual(3000)
            expect(carts.body[0].products.length).toEqual(2)
        })

        test("4.2 It should return an empty array if the customer does not have any paid carts", async () => {
            //The second customer never checked out a cart so the array should be empty
            let carts = await request(app).get(`${routePath}/carts/history`).set("Cookie", secondCustomerCookie).expect(200)
            expect(carts.body.length).toEqual(0)
        })

        test("4.3 It should return a 401 error when called by a user who is not a customer or is not logged in", async () => {
            await request(app).get(`${routePath}/carts/history`).set("Cookie", managerCookie).expect(401)
            await request(app).get(`${routePath}/carts/history`).set("Cookie", adminCookie).expect(401)
            await request(app).get(`${routePath}/carts/history`).expect(401)
        })
    })

    describe("5. DELETE /carts/products/:model", () => {
        test("5.1 It should remove a product from the cart of the logged in customer. The total cost of the cart should be reduced", async () => {
            //The current cart of the customer contains two units of a product added in previous tests, we check that it's still the case
            //We remove one unit of the product and check that the quantity and total cost of the cart have been updated
            let cart = await request(app).get(`${routePath}/carts`).set("Cookie", customerCookie).expect(200)
            expect(cart.body.products.length).toEqual(1)
            expect(cart.body.products[0].model).toEqual("empty")
            expect(cart.body.products[0].quantity).toEqual(2)
            expect(cart.body.total).toEqual(2000)
            await request(app).delete(`${routePath}/carts/products/empty`).set("Cookie", customerCookie).expect(200)
            cart = await request(app).get(`${routePath}/carts`).set("Cookie", customerCookie).expect(200)
            expect(cart.body.products.length).toEqual(1)
            expect(cart.body.products[0].model).toEqual("empty")
            expect(cart.body.products[0].quantity).toEqual(1)
            expect(cart.body.total).toEqual(1000)
        })

        test("5.2 It should return a 401 error when called by a user who is not a customer or is not logged in", async () => {
            await request(app).delete(`${routePath}/carts/products/empty`).set("Cookie", managerCookie).expect(401)
            await request(app).delete(`${routePath}/carts/products/empty`).set("Cookie", adminCookie).expect(401)
            await request(app).delete(`${routePath}/carts/products/empty`).expect(401)
        })

        test("5.3 It should return a 404 error if the product to remove is not present in the cart", async () => {
            //We know that the cart contains only one product model so trying to remove another product should return a 404 error
            await request(app).delete(`${routePath}/carts/products/model`).set("Cookie", customerCookie).expect(404)
        })

        test("5.4 It should return a 404 error if the product to remove does not exist", async () => {
            await request(app).delete(`${routePath}/carts/products/model3`).set("Cookie", customerCookie).expect(404)
        })

        test("5.5 It should return a 404 error if the customer does not have a cart, or the cart is empty", async () => {
            //We first try to remove a product from the cart of the second customer, who never had a cart
            //We then remove the last product from the cart of the first customer then try to remove it again
            await request(app).delete(`${routePath}/carts/products/model`).set("Cookie", secondCustomerCookie).expect(404)
            await request(app).delete(`${routePath}/carts/products/empty`).set("Cookie", customerCookie).expect(200)
            await request(app).delete(`${routePath}/carts/products/empty`).set("Cookie", customerCookie).expect(404)
        })
    })

    describe("6. DELETE /carts/current", () => {
        test("6.1 It should clear the cart of the logged in customer", async () => {
            //We first add two products to the cart of the current customer, since it was emptied in the previous test
            //We check that it's not empty, we clear it and then retrieve it again, expecting an empty array and a total cost of 0
            await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie).send({ model: "model" }).expect(200)
            await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie).send({ model: "model2" }).expect(200)
            let cart = await request(app).get(`${routePath}/carts`).set("Cookie", customerCookie).expect(200)
            expect(cart.body.products.length).toEqual(2)
            expect(cart.body.total).toEqual(2000)
            await request(app).delete(`${routePath}/carts/current`).set("Cookie", customerCookie).expect(200)
            cart = await request(app).get(`${routePath}/carts`).set("Cookie", customerCookie).expect(200)
            expect(cart.body.products.length).toEqual(0)
            expect(cart.body.total).toEqual(0)
        })

        test("6.2 It should return a 401 error when called by a user who is not a customer or is not logged in", async () => {
            await request(app).delete(`${routePath}/carts/current`).set("Cookie", managerCookie).expect(401)
            await request(app).delete(`${routePath}/carts/current`).set("Cookie", adminCookie).expect(401)
            await request(app).delete(`${routePath}/carts/current`).expect(401)
        })

        test("6.3 It should return a 404 error if the customer does not have a cart", async () => {
            //Since the second customer does not have a cart, we should get a 404 error
            await request(app).delete(`${routePath}/carts/current`).set("Cookie", secondCustomerCookie).expect(404)
        })
    })

    describe("7. GET /carts/all", () => {
        test("7.1 It should return all carts of all customers, including unpaid ones", async () => {
            //We expect only one cart to be returned, the one we paid for in a previous test
            //Empty carts are not considered for this route, so the current (empty) cart of the first customer is not counted
            let res = await request(app).get(`${routePath}/carts/all`).set("Cookie", managerCookie).expect(200)
            let carts = res.body.filter((cart: any) => cart.products.length > 0)
            expect(carts.length).toEqual(1)
            expect(carts[0].customer).toEqual("customer")
            expect(carts[0].paid).toBeTruthy()
            expect(carts[0].paymentDate).not.toBeNull()
            expect(carts[0].total).toEqual(3000)
            expect(carts[0].products.length).toEqual(2)
            //After creating a new cart for the second customer, we expect two carts to be returned
            await request(app).post(`${routePath}/carts`).set("Cookie", secondCustomerCookie).send({ model: "model" }).expect(200)
            res = await request(app).get(`${routePath}/carts/all`).set("Cookie", managerCookie).expect(200)
            carts = res.body.filter((cart: any) => cart.products.length > 0)
            expect(carts.length).toEqual(2)
            expect(carts[1].customer).toEqual("customer2")
            let notPaid = carts[1].paid === null || carts[1].paid === undefined || carts[1].paid === false || carts[1].paid === 0 || carts[1].paid === "false" || carts[1].paid === "0"
            expect(notPaid).toBeTruthy();
            expect(carts[1].paymentDate).toBeNull()
            expect(carts[1].total).toEqual(1000)
            expect(carts[1].products.length).toEqual(1)
        })

        test("7.2 It should return a 401 error when called by a user who is a customer, or is not logged in", async () => {
            await request(app).get(`${routePath}/carts/all`).set("Cookie", customerCookie).expect(401)
            await request(app).get(`${routePath}/carts/all`).expect(401)
        })
    })

    describe("8. DELETE /carts", () => {
        test("8.1 It should delete all carts of all customers", async () => {
            //After deleting all carts, we try to retrieve them and expect an empty array
            await request(app).delete(`${routePath}/carts`).set("Cookie", managerCookie).expect(200)
            let carts = await request(app).get(`${routePath}/carts/all`).set("Cookie", managerCookie).expect(200)
            expect(carts.body.length).toEqual(0)
        })

        test("8.2 It should return a 401 error when called by a user who is a customer, or is not logged in", async () => {
            await request(app).delete(`${routePath}/carts`).set("Cookie", customerCookie).expect(401)
            await request(app).delete(`${routePath}/carts`).expect(401)
        })
    })
})