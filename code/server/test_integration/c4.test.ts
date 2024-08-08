import { describe, test, expect, beforeAll, beforeEach, afterEach, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"
import { Product, Category } from "../src/components/product"
import { Role } from "../src/components/user";

const routePath = "/ezelectronics" // Base route path for the API

// Default user information. We use them to create users and evaluate the returned values
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: Role.ADMIN }
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: Role.CUSTOMER }
const anotherCustomer = { username: "anotherCustomer", name: "anotherCustomer", surname: "anotherCustomer", password: "anotherCustomer", role: Role.CUSTOMER }
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: Role.MANAGER }
const product = new Product(200, "iPhone 13", Category.SMARTPHONE, "2021-01-01", "details", 10)
// Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string
let managerCookie: string
let adminCookie: string
let tokenanotherCustomer: string

// Helper function that creates a new user in the database.
// Can be used to create a user before the tests or in the tests
// Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

const postProduct = async (productInfo:any)=>{
    await request(app)
        .post(`${routePath}/products`)
        .set("Cookie", adminCookie)
        .send(productInfo)
        .expect(200)
}

const postProductCart = async (productInfo:any)=>{
    request(app)
        .post(`${routePath}/carts`)
        .set('Cookie', customerCookie)
        .send({ model: "iPhone 13" })
        .expect(200)
}

const deleteProducts = async()=>{
    await request(app)
        .delete(`${routePath}/products`)
        .set("Cookie", adminCookie)
}

const deleteCarts = async()=>{
    await request(app)
        .delete(`${routePath}/carts`)
        .set("Cookie", adminCookie)
}
// Helper function that logs in a user and returns the cookie
// Can be used to log in a user before the tests or in the tests
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}

// Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable
beforeAll(async () => {
    await cleanup()
    await postUser(customer)
    customerCookie = await login(customer)
    await postUser(manager)
    managerCookie = await login(manager)
    await postUser(admin)
    adminCookie = await login(admin)
    await postUser(anotherCustomer)
    tokenanotherCustomer = await login(anotherCustomer)
})

// After executing tests, we remove everything from our test database
afterAll(async() => {
    await cleanup()
})

describe("Cart routes integration tests", () => {
    describe("GET /carts - getting the carts", () => {
        beforeEach(async ()=>{
            await deleteProducts()
            await deleteCarts()
        })
        test("CI4.1: Should return a success code 200 and the current cart of the logged-in user", async () => {
            // Add a product to the database
            const product = new Product(200, "iPhone 13", Category.SMARTPHONE, "2021-01-01", "details", 10)
            await request(app)
                .post(`${routePath}/products`)
                .set('Cookie', managerCookie)
                .send(product)
                .expect(200)

            // Add the product to the customer's cart
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: "iPhone 13" })
                .expect(200)

            // Get the current cart
            const response = await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)
            
            const cart = response.body
            expect(cart.customer).toBe("customer")
            expect(cart.paid).toBe(false)
            expect(cart.paymentDate).toBe("")
            expect(cart.total).toBe(200)
            expect(cart.products.length).toBe(1)
            expect(cart.products[0].model).toBe("iPhone 13")
            expect(cart.products[0].category).toBe("Smartphone")
            expect(cart.products[0].quantity).toBe(1)
            expect(cart.products[0].price).toBe(200)
        })

        test("CI4.2: Should return an empty Cart object if there is no unpaid cart", async () => {
            const response = await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)
            const cart = response.body
        })

        test("CI4.3: Should return an error code 401 if the user is not logged in", async () => {
            await request(app)
                .get(`${routePath}/carts`)
                .expect(401)
        })

        test("CI4.4: Should return an error code 401 if the user is not a Customer", async () => {
            await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', managerCookie)
                .expect(401)
        })
    })

    describe("POST /carts", () => {
        beforeEach(async ()=>{
            await deleteProducts()
            await deleteCarts()
        })
        test("CI4.5: Should add a product to the current cart of the logged-in customer", async () => {
            // Add a product to the database
            const product = new Product(200, "iPhone 13", Category.SMARTPHONE, "2021-01-01", "details", 10)
            await request(app)
                .post(`${routePath}/products`)
                .set('Cookie', managerCookie)
                .send(product)
                .expect(200)

            // Add the product to the customer's cart
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: "iPhone 13" })
                .expect(200)

            // Verify that the product was added correctly
            const response = await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)
            
            const cart = response.body
            expect(cart.customer).toBe("customer")
            expect(cart.paid).toBe(false)
            expect(cart.paymentDate).toBe("")
            expect(cart.total).toBe(200)
            expect(cart.products.length).toBe(1)
            expect(cart.products[0].model).toBe("iPhone 13")
            expect(cart.products[0].category).toBe("Smartphone")
            expect(cart.products[0].quantity).toBe(1)
            expect(cart.products[0].price).toBe(200)
        })

        test("CI4.6: Should return an error 404 if the model does not represent an existing product", async () => {
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: "NonExistingModel" })
                .expect(404)
        })

        test("CI4.7: Should return an error 409 if the product has available quantity 0", async () => {
            // Add a product to the database with quantity 1
            const product = new Product(200, "iPhone 13", Category.SMARTPHONE, "2021-01-01", "details", 1)
            await request(app)
                .post(`${routePath}/products`)
                .set('Cookie', managerCookie)
                .send(product)
                .expect(200)
        
            // Add the product to the customer's cart the first time
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: "iPhone 13" })
                .expect(200)
            
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)
            // Try to add the same product again to the customer's cart
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: "iPhone 13" })
                .expect(409)
        })

        test("CI4.8: Should increase the product quantity in the cart if already present", async () => {
            // Add a product to the database
            const product = new Product(200, "iPhone 13", Category.SMARTPHONE, "2021-01-01", "details", 10)
            await request(app)
                .post(`${routePath}/products`)
                .set('Cookie', managerCookie)
                .send(product)
                .expect(200)

            // Add the product to the customer's cart
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: "iPhone 13" })
                .expect(200)

            // Add the same product again to the customer's cart
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: "iPhone 13" })
                .expect(200)

            // Verify that the product quantity was updated correctly
            const response = await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)
            
            const cart = response.body
            expect(cart.customer).toBe("customer")
            expect(cart.paid).toBe(false)
            expect(cart.paymentDate).toBe("")
            expect(cart.total).toBe(400) // 200 * 2
            expect(cart.products.length).toBe(1)
            expect(cart.products[0].model).toBe("iPhone 13")
            expect(cart.products[0].category).toBe("Smartphone")
            expect(cart.products[0].quantity).toBe(2)
            expect(cart.products[0].price).toBe(200)
        })
        test("CI4.9: Should return an error 401 if the user is not logged in", async () => {
            await request(app)
                .post(`${routePath}/carts`)
                .send({ model: "iPhone 13" })
                .expect(401)
        })

        test("CI4.10: Should return an error 401 if the user is not a Customer", async () => {
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', adminCookie)
                .send({ model: "iPhone 13" })
                .expect(401)
        })
    })

    describe("PATCH /carts", () => {
        beforeEach(async ()=>{
            await deleteProducts()
            await deleteCarts()
        })
        test("CI4.11: Should simulate the payment for the current cart of the logged-in customer", async () => {
            // Add a product to the database
            const product = new Product(200, "iPhone 13", Category.SMARTPHONE, "2021-01-01", "details", 10)
            await request(app)
                .post(`${routePath}/products`)
                .set('Cookie', managerCookie)
                .send(product)
                .expect(200)

            // Add the product to the customer's cart
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: "iPhone 13" })
                .expect(200)

            // Simulate the payment
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)
        })

        test("CI4.12: Should return an error 404 if there are no unpaid cart information in the database", async () => {
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(404)
        })

        test("CI4.13: Should return an error 400 if there are unpaid cart information but the cart contains no products", async () => {
            const product = new Product(200, "iPhone 13", Category.SMARTPHONE, "2021-01-01", "details", 10)
            await request(app)
                .post(`${routePath}/products`)
                .set('Cookie', managerCookie)
                .send(product)
                .expect(200)

            // Add the product to the customer's cart
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: "iPhone 13" })
                .expect(200)
            
            await request(app)
                .delete(`${routePath}/carts/products/iPhone 13`)
                .set('Cookie', customerCookie)
                .expect(200)

            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(400)
        })

        test("CI4.14: Should return an error 409 if at least one product in the cart has available quantity 0", async () => {
            // Add a product to the database with quantity 1
            const product = new Product(200, "iPhone 13", Category.SMARTPHONE, "2021-01-01", "details", 1)
            await request(app)
                .post(`${routePath}/products`)
                .set('Cookie', managerCookie)
                .send(product)
                .expect(200)
        
            // Add the product to anotherCustomer's cart
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', tokenanotherCustomer)
                .send({ model: "iPhone 13" })
                .expect(200)

            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: "iPhone 13" })
                .expect(200)
            // Simulate the payment to empty the stock
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', tokenanotherCustomer)
                .expect(200)
            
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(409)
        })
        test("CI4.15: Should return an error 409 if at least one product in the cart has quantity greater than the available quantity in the warehouse", async () => {
            // Add a product to the database with quantity 1
            const product = new Product(200, "iPhone 13", Category.SMARTPHONE, "2021-01-01", "details", 1)
            await request(app)
                .post(`${routePath}/products`)
                .set('Cookie', managerCookie)
                .send(product)
                .expect(200)

            // Add the product to the customer's cart
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: "iPhone 13" })
                .expect(200)

            // Add the product to the customer's cart again
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: "iPhone 13" })
                .expect(200)
            // Simulate the payment
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(409)
        })

        test("CI4.16: Should return an error 401 if the user is not logged in", async () => {
            await request(app)
                .patch(`${routePath}/carts`)
                .expect(401)
        })

        test("CI4.17: Should return an error 401 if the user is not a Customer", async () => {
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', adminCookie)
                .expect(401)
        })
    })

    describe("GET /carts/history", () => {
        beforeEach(async ()=>{
            await deleteProducts()
            await deleteCarts()
        })
        test("CI4.18: Should return success code 200 and the history of the paid carts of the logged-in user", async () => {
            // Add products to the database
            const product = new Product(100, "iPhone 13", Category.SMARTPHONE, "2021-01-01", "details", 10)
            const product1 = new Product(150, "iPhone 14", Category.APPLIANCE, "2021-01-01", "details", 10)
            await request(app)
                .post(`${routePath}/products`)
                .set('Cookie', managerCookie)
                .send(product)
                .expect(200)

            await request(app)
                .post(`${routePath}/products`)
                .set('Cookie', managerCookie)
                .send(product1)
                .expect(200)
            // Add the product to the customer's cart

            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: "iPhone 13" })
                .expect(200)
    
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: "iPhone 14" })
                .expect(200)
            // Simulate the payment
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)
    
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: "iPhone 13" })
                .expect(200)
    
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: "iPhone 14" })
                .expect(200)
            // Simulate the payment
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)
            // Get the history of paid carts
            const response = await request(app)
                .get(`${routePath}/carts/history`)
                .set('Cookie', customerCookie)
                .expect(200)
    
            const history = response.body
            expect(history).toHaveLength(2)
            expect(history[0].customer).toBe("customer")
            expect(history[0].paid).toBe(true)
            expect(history[0].paymentDate).toBeDefined()
            expect(history[0].total).toBe(250)
            expect(history[0].products).toHaveLength(2)
            expect(history[0].products[0].model).toBe("iPhone 13")
            expect(history[0].products[0].category).toBe("Smartphone")
            expect(history[0].products[0].quantity).toBe(1)
            expect(history[0].products[0].price).toBe(100)
        })
    
        test("CI4.19: Should return an error 401 if the user is not logged in", async () => {
            await request(app)
                .get(`${routePath}/carts/history`)
                .expect(401)
        })
    
        test("CI4.20: Should return an error 401 if the user is not a Customer", async () => {
            await request(app)
                .get(`${routePath}/carts/history`)
                .set('Cookie', managerCookie)
                .expect(401)
        })
    })

    describe("DELETE /carts/products/:model", () => {
        beforeEach(async ()=>{
            await deleteProducts()
            await deleteCarts()
        })
        test("CI4.21: Should remove an instance of a product from the current cart of the logged-in user", async () => {
            // Add a product to the database
            const product = new Product(200, "iPhone 13", Category.SMARTPHONE, "2021-01-01", "details", 10)
            await request(app)
                .post(`${routePath}/products`)
                .set('Cookie', managerCookie)
                .send(product)
                .expect(200)
    
            // Add the product to the customer's cart
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: "iPhone 13" })
                .expect(200)
    
            // Remove an instance of the product from the cart
            await request(app)
                .delete(`${routePath}/carts/products/iPhone 13`)
                .set('Cookie', customerCookie)
                .expect(200)
    
            // Verify that the product quantity was reduced correctly
            const response = await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)
            
            const cart = response.body
            expect(cart.customer).toBe("customer")
            expect(cart.paid).toBe(false)
            expect(cart.paymentDate).toBe("")
            expect(cart.total).toBe(0)
            expect(cart.products.length).toBe(0)
        })
    
        test("CI4.22: Should return an error 404 if the model represents a product that is not in the cart", async () => {
            await request(app)
                .delete(`${routePath}/carts/products/NonExistingModel`)
                .set('Cookie', customerCookie)
                .expect(404)
        })
    
        test("CI4.23: Should return an error 404 if there are no unpaid cart information for the user", async () => {
            await request(app)
                .delete(`${routePath}/carts/products/iPhone 13`)
                .set('Cookie', customerCookie)
                .expect(404)
        })
        test("CI4.24: Should return an error 404 if the unpaid cart is empty", async () => {
            // Add a product to the database
            const product = new Product(200, "iPhone 13", Category.SMARTPHONE, "2021-01-01", "details", 10)
            await request(app)
                .post(`${routePath}/products`)
                .set('Cookie', managerCookie)
                .send(product)
                .expect(200)
    
            // Add the product to the customer's cart
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: "iPhone 13" })
                .expect(200)
    
            // Remove an instance of the product from the cart
            await request(app)
                .delete(`${routePath}/carts/products/iPhone 13`)
                .set('Cookie', customerCookie)
                .expect(200)
    
            await request(app)
                .delete(`${routePath}/carts/products/iPhone 13`)
                .set('Cookie', customerCookie)
                .expect(404)
        })
        test("CI4.25: Should return an error 404 if the model does not represent an existing product", async () => {
            await request(app)
                .delete(`${routePath}/carts/products/NonExistingModel`)
                .set('Cookie', customerCookie)
                .expect(404)
        })
    
        test("CI4.26: Should return an error 401 if the user is not logged in", async () => {
            await request(app)
                .delete(`${routePath}/carts/products/iPhone 13`)
                .expect(401)
        })
    
        test("CI4.27: Should return an error 401 if the user is not a Customer", async () => {
            await request(app)
                .delete(`${routePath}/carts/products/iPhone 13`)
                .set('Cookie', adminCookie)
                .expect(401)
        })
    })

    describe("DELETE /carts/current", () => {
        beforeEach(async ()=>{
            await deleteProducts()
            await deleteCarts()
        })
        test("CI4.28: Should empty the current cart of the logged-in user", async () => {
            // Add a product to the database
            const product = new Product(200, "iPhone 13", Category.SMARTPHONE, "2021-01-01", "details", 10)
            await request(app)
                .post(`${routePath}/products`)
                .set('Cookie', managerCookie)
                .send(product)
                .expect(200)
    
            // Add the product to the customer's cart
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: "iPhone 13" })
                .expect(200)
    
            // Empty the current cart
            await request(app)
                .delete(`${routePath}/carts/current`)
                .set('Cookie', customerCookie)
                .expect(200)
    
            // Verify that the cart is empty
            const response = await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)
            
            const cart = response.body
            expect(cart.customer).toBe("customer")
            expect(cart.paid).toBe(false)
            expect(cart.paymentDate).toBe("")
            expect(cart.total).toBe(0)
            expect(cart.products.length).toBe(0)
        })
    
        test("CI4.29: Should return an error 404 if there are no unpaid cart information for the user", async () => {
            await request(app)
                .delete(`${routePath}/carts/current`)
                .set('Cookie', customerCookie)
                .expect(404)
        })
    
        test("CI4.30: Should return an error 401 if the user is not logged in", async () => {
            await request(app)
                .delete(`${routePath}/carts/current`)
                .expect(401)
        })
    
        test("CI4.31: Should return an error 401 if the user is not a Customer", async () => {
            await request(app)
                .delete(`${routePath}/carts/current`)
                .set('Cookie', adminCookie)
                .expect(401)
        })
    })

    describe("DELETE /carts", () => {
        beforeEach(async ()=>{
            await deleteProducts()
            await deleteCarts()
        })
        test("CI4.32: Should delete all existing carts of all users, including those that have been paid", async () => {
            const tokenanotherCustomer = await login(customer)
    
            // Add products to the database
            const product1 = new Product(200, "iPhone 13", Category.SMARTPHONE, "2021-01-01", "details", 10)
            const product2 = new Product(200, "iPhone 14", Category.SMARTPHONE, "2021-01-01", "details", 10)
            await request(app)
                .post(`${routePath}/products`)
                .set('Cookie', managerCookie)
                .send(product1)
                .expect(200)
            await request(app)
                .post(`${routePath}/products`)
                .set('Cookie', managerCookie)
                .send(product2)
                .expect(200)
    
            // Add the products to the customers' carts
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: "iPhone 13" })
                .expect(200)
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', tokenanotherCustomer)
                .send({ model: "iPhone 14" })
                .expect(200)
    
            // Simulate the payment for one of the carts
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)
    
            // Verify that the carts exist
            let response = await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)
            let cart = response.body
            expect(cart.products.length).toBe(0) // Paid cart
    
            response = await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', tokenanotherCustomer)
                .expect(200)
                

    
            // Delete all carts
            await request(app)
                .delete(`${routePath}/carts`)
                .set('Cookie', adminCookie)
                .expect(200)
    
            // Verify that there are no more carts
            response = await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)
            cart = response.body
            expect(cart.products.length).toBe(0)
    
            response = await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', tokenanotherCustomer)
                .expect(200)
            cart = response.body
            expect(cart.products.length).toBe(0)
        })
    
        test("CI4.33: Should delete all existing carts of all users, performed by the manager", async () => {
            const tokenanotherCustomer = await login(customer)
            // Add products to the database
            const product1 = new Product(200, "iPhone 13", Category.SMARTPHONE, "2021-01-01", "details", 10)
            const product2 = new Product(200, "iPhone 14", Category.SMARTPHONE, "2021-01-01", "details", 10)
            await request(app)
                .post(`${routePath}/products`)
                .set('Cookie', managerCookie)
                .send(product1)
                .expect(200)
            await request(app)
                .post(`${routePath}/products`)
                .set('Cookie', managerCookie)
                .send(product2)
                .expect(200)
    
            // Add the products to the customers' carts
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: "iPhone 13" })
                .expect(200)
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', tokenanotherCustomer)
                .send({ model: "iPhone 14" })
                .expect(200)
    
            // Simulate the payment for one of the carts
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)
    
            // Verify that the carts exist
            let response = await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)
            let cart = response.body
            expect(cart.products.length).toBe(0) // Paid cart
    
            response = await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', tokenanotherCustomer)
                .expect(200)
            cart = response.body
    
            // Delete all carts
            await request(app)
                .delete(`${routePath}/carts`)
                .set('Cookie', managerCookie)
                .expect(200)
    
            // Verify that there are no more carts
            response = await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)
            cart = response.body
            expect(cart.products.length).toBe(0)
    
            response = await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', tokenanotherCustomer)
                .expect(200)
            cart = response.body
            expect(cart.products.length).toBe(0)
        })
    
        test("CI4.34: Should return an error 401 if the user is not logged in", async () => {
            await request(app)
                .delete(`${routePath}/carts`)
                .expect(401)
        })
    
        test("CI4.35: Should return an error 401 if the user is not an Admin or a Manager", async () => {
            await request(app)
                .delete(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(401)
        })
    })

    describe("GET /carts/all", () => {
        beforeEach(async ()=>{
            await deleteProducts()
            await deleteCarts()
        })
        test("CI4.36: Should return success code 200 and all carts of all users", async () => {
            const tokenanotherCustomer = await login(customer) 
    
            // Add products to the database
            const product1 = new Product(200, "iPhone 13", Category.SMARTPHONE, "2021-01-01", "details", 10)
            const product2 = new Product(200, "iPhone 14", Category.SMARTPHONE, "2021-01-01", "details", 10)
            await request(app)
                .post(`${routePath}/products`)
                .set('Cookie', managerCookie)
                .send(product1)
                .expect(200)
            await request(app)
                .post(`${routePath}/products`)
                .set('Cookie', managerCookie)
                .send(product2)
                .expect(200)
    
            // Add the products to the customers' carts
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .send({ model: "iPhone 13" })
                .expect(200)
            await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', tokenanotherCustomer)
                .send({ model: "iPhone 14" })
                .expect(200)
    
            // Simulate the payment for one of the carts
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie)
                .expect(200)
    
            // Get all carts
            const response = await request(app)
                .get(`${routePath}/carts/all`)
                .set('Cookie', adminCookie)
                .expect(200)
    
            const carts = response.body
            expect(carts.length).toBeGreaterThan(0)
        })
    
        test("CI4.37: Should return an error 401 if the user is not logged in", async () => {
            await request(app)
                .get(`${routePath}/carts/all`)
                .expect(401)
        })
    
        test("CI4.38: Should return an error 401 if the user is not an Admin or a Manager", async () => {
            await request(app)
                .get(`${routePath}/carts/all`)
                .set('Cookie', customerCookie)
                .expect(401)
        })
    })
})
