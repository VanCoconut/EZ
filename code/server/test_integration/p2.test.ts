import {beforeAll, afterAll, beforeEach, describe, expect, jest, test} from "@jest/globals"
import request from 'supertest'
import {app} from "../index"
import {cleanup} from "../src/db/cleanup";

import ProductController from "../src/controllers/productController";
import { Product, Category } from "../src/components/product"
import {Role, User} from "../src/components/user";

//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: Role.CUSTOMER }
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: Role.MANAGER }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: Role.ADMIN }
//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string
let managerCookie: string
let adminCookie: string

const baseURL = "/ezelectronics"
const productURL = baseURL+"/products"
jest.mock("../src/controllers/productController.ts")

//Helper function that creates a new user in the database.
//Can be used to create a user before the tests or in the tests
//Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${baseURL}/users`)
        .send(userInfo)
        .expect(200)
}

//Helper function that logs in a user and returns the cookie
//Can be used to log in a user before the tests or in the tests
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${baseURL}/sessions`)
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

//Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable
beforeAll(async () => {
    await cleanup()
    await postUser(customer)
    customerCookie = await login(customer)
    await postUser(manager)
    managerCookie = await login(manager)
    await postUser(admin)
    adminCookie = await login(admin)
})

//After executing tests, we remove everything from our test database
afterAll(async () => {
    await cleanup()
})

// --------------- 2.integration of auth.ts ---------------
describe("Integrating 'auth.ts' module with 'productController.ts' module", () => {
    describe(`POST ${productURL}- adding a new set of products`, () => {
        const inputProduct = new Product(1000, "model1", Category.SMARTPHONE, "2022-01-01", "details1", 10)
        beforeEach(() => {
            jest.spyOn(ProductController.prototype, 'registerProducts').mockReset()
        })
        test("PI2.1: should return 200 success code", async () => {
            jest.spyOn(ProductController.prototype, 'registerProducts').mockResolvedValueOnce(true)

            const response = await request(app).post(productURL).set('Cookie', adminCookie).send(inputProduct)
            expect(response.status).toBe(200)
        })
        test("PI2.2: should return 422 error code if the quantity is less than 1", async () => {
            jest.spyOn(ProductController.prototype, 'registerProducts').mockImplementation(()=>{throw new Error('test-error')})

            const response = await request(app).post(productURL).set('Cookie', adminCookie).send({...inputProduct, quantity: 0})
            expect(response.status).toBe(422)
        })
        test("PI2.3: should fail if the user is not an admin or a manager", async () => {
            const response = await request(app).post(productURL).set('Cookie', customerCookie).send({inputProduct})
            expect(response.status).toBe(401)
        })
        test("PI2.4: should fail if the user is not logged in", async () => {
            const response = await request(app).post(productURL).send({inputProduct})
            expect(response.status).toBe(401)
        })
        test("PI2.5: should catch errors/exceptions thrown in 'controller.registerProducts'", async () => {
            jest.spyOn(ProductController.prototype, 'registerProducts').mockImplementation(()=>{throw new Error('test-error')})

            const response = await request(app).post(productURL).set('Cookie', adminCookie).send(inputProduct)
            expect(response.status).not.toBe(200)
            expect(ProductController.prototype.registerProducts).toThrow()
        })
    })
    describe(`PATCH ${productURL}/:model- changing the quantity of a product`, () => {
        const inputModel = "MacBook Pro"
        const inputQuantity = 20

        beforeEach(() => {
            jest.spyOn(ProductController.prototype, 'changeProductQuantity').mockReset()
        })
        test("PI2.6: should return 200 success code", async () => {
            jest.spyOn(ProductController.prototype, 'changeProductQuantity').mockResolvedValueOnce(30)

            const response = await request(app).patch(`${productURL}/${inputModel}`).set('Cookie', adminCookie).send({quantity: inputQuantity})
            expect(response.status).toBe(200)
        })
        test("PI2.7: should return 422 error code if the quantity is less than 1", async () => {
            jest.spyOn(ProductController.prototype, 'changeProductQuantity').mockImplementation(()=>{throw new Error('test-error')})

            const response = await request(app).patch(`${productURL}/${inputModel}`).set('Cookie', adminCookie).send({quantity: 0})
            expect(response.status).toBe(422)
        })
        test("PI2.8: should fail if the user is not an admin or a manager", async () => {
            const response = await request(app).patch(`${productURL}/${inputModel}`).set('Cookie', customerCookie).send({quantity: inputQuantity})
            expect(response.status).toBe(401)
        })
        test("PI2.9: should fail if the user is not logged in", async () => {
            const response = await request(app).patch(`${productURL}/${inputModel}`).send({quantity: inputQuantity})
            expect(response.status).toBe(401)
        })
        test("PI2.10: should catch errors/exceptions thrown in 'controller.changeProductQuantity'", async () => {
            jest.spyOn(ProductController.prototype, 'changeProductQuantity').mockImplementation(()=>{throw new Error('test-error')})

            const response = await request(app).patch(`${productURL}/${inputModel}`).set('Cookie', adminCookie).send({quantity: inputQuantity})
            expect(response.status).not.toBe(200)
            expect(ProductController.prototype.changeProductQuantity).toThrow()
        })
    })

    describe(`PATCH ${productURL}/:model/sell - selling a product`, () => {
        const inputModel = "MacBook Pro"
        const inputQuantity = 10

        beforeEach(() => {
            jest.spyOn(ProductController.prototype, 'sellProduct').mockReset()
        })
        test("PI2.11: should return 200 success code", async () => {
            jest.spyOn(ProductController.prototype, 'sellProduct').mockResolvedValueOnce(true)

            const response = await request(app).patch(`${productURL}/${inputModel}/sell`).set('Cookie', adminCookie).send({quantity: inputQuantity})
            expect(response.status).toBe(200)
        })
        test("PI2.12: should return 422 error code if the quantity is less than 1", async () => {
            jest.spyOn(ProductController.prototype, 'sellProduct').mockImplementation(()=>{throw new Error('test-error')})

            const response = await request(app).patch(`${productURL}/${inputModel}/sell`).set('Cookie', adminCookie).send({quantity: 0})
            expect(response.status).toBe(422)
        })
        test("PI2.13: should fail if the user is not an admin or a manager", async () => {
            const response = await request(app).patch(`${productURL}/${inputModel}/sell`).set('Cookie', customerCookie).send({quantity: inputQuantity})
            expect(response.status).toBe(401)
        })
        test("PI2.14: should fail if the user is not logged in", async () => {
            const response = await request(app).patch(`${productURL}/${inputModel}/sell`).send({quantity: inputQuantity})
            expect(response.status).toBe(401)
        })
        test("PI2.15: should catch errors/exceptions thrown in 'controller.sellProduct'", async () => {
            jest.spyOn(ProductController.prototype, 'sellProduct').mockImplementation(()=>{throw new Error('test-error')})

            const response = await request(app).patch(`${productURL}/${inputModel}/sell`).set('Cookie', adminCookie).send({quantity: inputQuantity})
            expect(response.status).not.toBe(200)
            expect(ProductController.prototype.sellProduct).toThrow()
        })
    })  
    describe(`GET ${productURL} - getting all products`, () => {
        beforeEach(() => {
            jest.spyOn(ProductController.prototype, 'getProducts').mockReset()
        })
        test("PI2.16: should return 200 success code", async () => {
            jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([new Product(1000, "model1", Category.SMARTPHONE, "2022-01-01", "details1", 10)])

            const response = await request(app).get(productURL).set('Cookie', adminCookie)
            expect(response.status).toBe(200)
        })
        test("PI2.17: should return 200 and call getProducts with grouping=category", async () => {
            jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([new Product(1000, "model1", Category.SMARTPHONE, "2022-01-01", "details1", 10)])

            const response = await request(app).get(productURL).query({grouping: "category", category:"Smartphone"}).set('Cookie', adminCookie)
            expect(response.status).toBe(200)
        })
        test("PI2.18: should return 200 and call getProducts with grouping=model", async () => {
            jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([new Product(1000, "model1", Category.SMARTPHONE, "2022-01-01", "details1", 10)])

            const response = await request(app).get(productURL).query({grouping: "model", model:"model1"}).set('Cookie', adminCookie)
            expect(response.status).toBe(200)
        })

        test("PI2.19: should return 422 if the category is incorrect" , async () => {
            jest.spyOn(ProductController.prototype, 'getProducts').mockImplementation(()=>{throw new Error('test-error')})

            const response = await request(app).get(productURL).query({grouping: "category", category:"test"}).set('Cookie', adminCookie)
            expect(response.status).toBe(422)
        })
        test("PI2.20: should return 422 if the model is incorrect" , async () => {
            jest.spyOn(ProductController.prototype, 'getProducts').mockImplementation(()=>{throw new Error('test-error')})

            const response = await request(app).get(productURL).query({grouping: "model", model:""}).set('Cookie', adminCookie)
            expect(response.status).toBe(422)
        })

        test("PI2.21: should return 422 if the grouping is incorrect" , async () => {
            jest.spyOn(ProductController.prototype, 'getProducts').mockImplementation(()=>{throw new Error('test-error')})

            const response = await request(app).get(productURL).query({grouping: "test"}).set('Cookie', adminCookie)
            expect(response.status).toBe(422)
        })
        test("PI2.22: should fail if the user is not logged in", async () => {
            const response = await request(app).get(productURL)
            expect(response.status).toBe(401)
        })
        test("PI2.23: should catch errors/exceptions thrown in 'controller.getProducts'", async () => {
            jest.spyOn(ProductController.prototype, 'getProducts').mockImplementation(()=>{throw new Error('test-error')})

            const response = await request(app).get(productURL).set('Cookie', adminCookie)
            expect(response.status).not.toBe(200)
            expect(ProductController.prototype.getProducts).toThrow()
        })
    })
    describe(`GET ${productURL}/available - getting all available products`, () => {
        beforeEach(() => {
            jest.spyOn(ProductController.prototype, 'getAvailableProducts').mockReset()
        })
        test("PI2.24: should return 200 success code", async () => {
            jest.spyOn(ProductController.prototype, 'getAvailableProducts').mockResolvedValueOnce([new Product(1000, "model1", Category.SMARTPHONE, "2022-01-01", "details1", 10)])

            const response = await request(app).get(`${productURL}/available`).set('Cookie', adminCookie)
            expect(response.status).toBe(200)
        })
        test("PI2.25: should return 200 and call getProducts with grouping=category", async () => {
            jest.spyOn(ProductController.prototype, 'getAvailableProducts').mockResolvedValueOnce([new Product(1000, "model1", Category.SMARTPHONE, "2022-01-01", "details1", 10)])

            const response = await request(app).get(`${productURL}/available`).query({grouping: "category", category:"Smartphone"}).set('Cookie', adminCookie)
            expect(response.status).toBe(200)
        })
        test("PI2.26: should return 200 and call getProducts with grouping=model", async () => {
            jest.spyOn(ProductController.prototype, 'getAvailableProducts').mockResolvedValueOnce([new Product(1000, "model1", Category.SMARTPHONE, "2022-01-01", "details1", 10)])

            const response = await request(app).get(`${productURL}/available`).query({grouping: "model", model:"model1"}).set('Cookie', adminCookie)
            expect(response.status).toBe(200)
        })  
        test("PI2.27: should return 422 if the category is incorrect" , async () => {
            jest.spyOn(ProductController.prototype, 'getAvailableProducts').mockImplementation(()=>{throw new Error('test-error')})

            const response = await request(app).get(`${productURL}/available`).query({grouping: "category", category:"test"}).set('Cookie', adminCookie)
            expect(response.status).toBe(422)
        })
        test("PI2.28: should return 422 if the model is incorrect" , async () => {
            jest.spyOn(ProductController.prototype, 'getAvailableProducts').mockImplementation(()=>{throw new Error('test-error')})

            const response = await request(app).get(`${productURL}/available`).query({grouping: "model", model:""}).set('Cookie', adminCookie)
            expect(response.status).toBe(422)
        })
        test("PI2.29: should return 422 if the grouping is incorrect" , async () => {
            jest.spyOn(ProductController.prototype, 'getAvailableProducts').mockImplementation(()=>{throw new Error('test-error')})

            const response = await request(app).get(`${productURL}/available`).query({grouping: "test"}).set('Cookie', adminCookie)
            expect(response.status).toBe(422)
        })
        test("PI2.30: should fail if the user is not logged in", async () => {
            const response = await request(app).get(`${productURL}/available`)
            expect(response.status).toBe(401)
        })
        test("PI2.31: should catch errors/exceptions thrown in 'controller.getAvailableProducts'", async () => {
            jest.spyOn(ProductController.prototype, 'getAvailableProducts').mockImplementation(()=>{throw new Error('test-error')})

            const response = await request(app).get(`${productURL}/available`).set('Cookie', adminCookie)
            expect(response.status).not.toBe(200)
            expect(ProductController.prototype.getAvailableProducts).toThrow()
        })
    })  
    describe(`DELETE ${productURL}/:model - deleting a product`, () => {
        const inputModel = "MacBook Pro"

        beforeEach(() => {
            jest.spyOn(ProductController.prototype, 'deleteProduct').mockReset()
        })
        test("PI2.32: should return 200 success code", async () => {
            jest.spyOn(ProductController.prototype, 'deleteProduct').mockResolvedValueOnce(true)

            const response = await request(app).delete(`${productURL}/${inputModel}`).set('Cookie', adminCookie)
            expect(response.status).toBe(200)
        })
        test("PI2.33: should fail if the user is not an admin or a manager", async () => {
            const response = await request(app).delete(`${productURL}/${inputModel}`).set('Cookie', customerCookie)
            expect(response.status).toBe(401)
        })
        test("PI2.34: should fail if the user is not logged in", async () => {
            const response = await request(app).delete(`${productURL}/${inputModel}`)
            expect(response.status).toBe(401)
        })
        test("PI2.35: should catch errors/exceptions thrown in 'controller.deleteProduct'", async () => {
            jest.spyOn(ProductController.prototype, 'deleteProduct').mockImplementation(()=>{throw new Error('test-error')})

            const response = await request(app).delete(`${productURL}/${inputModel}`).set('Cookie', adminCookie)
            expect(response.status).not.toBe(200)
            expect(ProductController.prototype.deleteProduct).toThrow()
        })
    })
    describe(`DELETE ${productURL} - deleting all products`, () => {
        beforeEach(() => {
            jest.spyOn(ProductController.prototype, 'deleteAllProducts').mockReset()
        })
        test("PI2.36: should return 200 success code", async () => {
            jest.spyOn(ProductController.prototype, 'deleteAllProducts').mockResolvedValueOnce(true)

            const response = await request(app).delete(productURL).set('Cookie', adminCookie)
            expect(response.status).toBe(200)
        })
        test("PI2.37: should fail if the user is not an admin or a manager", async () => {
            const response = await request(app).delete(productURL).set('Cookie', customerCookie)
            expect(response.status).toBe(401)
        })
        test("PI2.38: should fail if the user is not logged in", async () => {
            const response = await request(app).delete(productURL)
            expect(response.status).toBe(401)
        })
        test("PI2.39: should catch errors/exceptions thrown in 'controller.deleteAllProducts'", async () => {
            jest.spyOn(ProductController.prototype, 'deleteAllProducts').mockImplementation(()=>{throw new Error('test-error')})

            const response = await request(app).delete(productURL).set('Cookie', adminCookie)
            expect(response.status).not.toBe(200)
            expect(ProductController.prototype.deleteAllProducts).toThrow()
        })
    })
})