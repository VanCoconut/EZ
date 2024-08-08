import {beforeAll, afterAll, beforeEach, describe, expect, jest, test} from "@jest/globals"
import request from 'supertest'
import {app} from "../index"
import {cleanup} from "../src/db/cleanup";

import {Role} from "../src/components/user";
import {Category, Product} from "../src/components/product";
import exp from "constants";


//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: Role.CUSTOMER }
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: Role.MANAGER }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: Role.ADMIN }
const sampleProduct = {model:'testModel', category:Category.LAPTOP, quantity:2, details:'testDetails', sellingPrice:4.5, arrivalDate:'2015-04-10'}

//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string
let managerCookie: string
let adminCookie: string

const baseURL = "/ezelectronics"
const productsURL = baseURL+"/products"

//Helper function that creates a new user in the database.
//Can be used to create a user before the tests or in the tests
//Is an implicit test because it checks if the return code is successful



const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${baseURL}/users`)
        .send(userInfo)
        .expect(200)
}
const postProduct = async (productInfo:any)=>{
    await request(app)
        .post(`${baseURL}/products`)
        .set("Cookie", adminCookie)
        .send(productInfo)
        .expect(200)
}
const deleteProducts = async()=>{
    await request(app)
        .delete(`${baseURL}/products`)
        .set("Cookie", adminCookie)
}
const sellProduct = async (model:string, quantity:number)=>{
    await request(app)
        .patch(`${productsURL}/${model}/sell`)
        .set("Cookie", adminCookie)
        .send({quantity:quantity})
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

// --------------- 3.integration of productDAO.ts ---------------
describe("Integrating 'auth.ts' module with 'productDAO.ts' module", () => {
    describe(`POST ${productsURL}`, () => {
        beforeEach(async () => {
            await deleteProducts()
        })
        test("PI4.1: It should return 200 when the request is successful", async () => {
            const response = await request(app)
                .post(productsURL)
                .set("Cookie", adminCookie)
                .send(sampleProduct)
            expect(response.status).toBe(200)
        })
        test("PI4.2: It should return 401 when the request is unauthorized", async () => {
            const response = await request(app)
                .post(productsURL)
                .send(sampleProduct)
            expect(response.status).toBe(401)
        })
        test("PI4.3: It should return 401 when the request is made by a customer", async () => {
            const response = await request(app)
                .post(productsURL)
                .set("Cookie", customerCookie)
                .send(sampleProduct)
            expect(response.status).toBe(401)
        })
        test("PI4.4: It should return 409 if the product already exists", async () => {
            await postProduct(sampleProduct)
            const response = await request(app)
                .post(productsURL)
                .set("Cookie", adminCookie)
                .send(sampleProduct)
            expect(response.status).toBe(409)
        })
        test("PI4.5: It should return 422 if one parameter is invalid", async () => {
            const response = await request(app)
                .post(productsURL)
                .set("Cookie", adminCookie)
                .send({...sampleProduct, quantity: -1})
            expect(response.status).toBe(422)
        })
    })

    describe(`PATCH ${productsURL}/:model - change the quantity of a product`, () => {
        beforeEach(async () => {
            await deleteProducts()
            await postProduct(sampleProduct)
        })
        test("PI4.6: It should return 200 when the request is successful", async () => {
            const response = await request(app)
                .patch(`${productsURL}/${sampleProduct.model}`)
                .set("Cookie", adminCookie)
                .send({quantity: 3})
            expect(response.status).toBe(200)
        })
        test("PI4.7: It should return 401 when the request is unauthorized", async () => {
            const response = await request(app)
                .patch(`${productsURL}/${sampleProduct.model}`)
                .send({quantity: 3})
            expect(response.status).toBe(401)
        })
        test("PI4.8: It should return 401 when the request is made by a customer", async () => {
            const response = await request(app)
                .patch(`${productsURL}/${sampleProduct.model}`)
                .set("Cookie", customerCookie)
                .send({quantity: 3})
            expect(response.status).toBe(401)
        })
        test("PI4.9: It should return 404 if the product does not exist", async () => {
            const response = await request(app)
                .patch(`${productsURL}/nonexistent`)
                .set("Cookie", adminCookie)
                .send({quantity: 3})
            expect(response.status).toBe(404)
        })
        test("PI4.10: It should return 422 if one parameter is invalid", async () => {
            const response = await request(app)
                .patch(`${productsURL}/${sampleProduct.model}`)
                .set("Cookie", adminCookie)
                .send({quantity: -1})
            expect(response.status).toBe(422)
        })
    })
    describe('PATCH /products/:model/sell - sell a product', () => {
        beforeEach(async () => {
            await deleteProducts()
            await postProduct(sampleProduct)
        })
        test("PI4.11: It should return 200 when the request is successful", async () => {
            const response = await request(app)
                .patch(`${productsURL}/${sampleProduct.model}/sell`)
                .set("Cookie", adminCookie)
                .send({quantity: 1})
            expect(response.status).toBe(200)
        })
        test("PI4.12: It should return 401 when the request is unauthorized", async () => {
            const response = await request(app)
                .patch(`${productsURL}/${sampleProduct.model}/sell`)
                .send({quantity: 1})
            expect(response.status).toBe(401)
        })
        test("PI4.13: It should return 401 when the request is made by a customer", async () => {
            const response = await request(app)
                .patch(`${productsURL}/${sampleProduct.model}/sell`)
                .set("Cookie", customerCookie)
                .send({quantity: 1})
            expect(response.status).toBe(401)
        })
        test("PI4.14: It should return 404 if the product does not exist", async () => {
            const response = await request(app)
                .patch(`${productsURL}/nonexistent/sell`)
                .set("Cookie", adminCookie)
                .send({quantity: 1})
            expect(response.status).toBe(404)
        })
        test("PI4.15: It should return 422 if one parameter is invalid", async () => {
            const response = await request(app)
                .patch(`${productsURL}/${sampleProduct.model}/sell`)
                .set("Cookie", adminCookie)
                .send({quantity: -3})
            expect(response.status).toBe(422)
        })
    })

    describe(`GET ${productsURL} - get all products`, () => {
        beforeEach(async () => {
            await deleteProducts()
            await postProduct(sampleProduct)
            await postProduct({...sampleProduct, model: 'testModel2', category: Category.SMARTPHONE})
        })
        test("PI4.16: It should return 200 when the request is successful", async () => {
            const response = await request(app)
                .get(productsURL)
                .set("Cookie", adminCookie)

            expect(response.status).toBe(200)
        })
        test("PI4.17: It should return 401 when the request is unauthorized", async () => {
            const response = await request(app)
                .get(productsURL)
            expect(response.status).toBe(401)
        })
        test("PI4.18: It should return 401 when the request is made by a customer", async () => {
            const response = await request(app)
                .get(productsURL)
                .set("Cookie", customerCookie)
            expect(response.status).toBe(401)
        })
        test("PI4.19: Should return 200 success code if the grouping is 'category'", async () => {
            const response = await request(app)
                .get(productsURL)
                .query({grouping: "category", category: "Smartphone"})
                .set("Cookie", adminCookie)
                

            expect(response.status).toBe(200)
            expect(response.body.length).toBe(1)
        })
        test("PI4.20: Should return 200 success code if the grouping is 'model'", async () => {
            const response = await request(app)
                .get(`${productsURL}`)
                .query({grouping: "model", model: "testModel"})
                .set("Cookie", adminCookie)
            expect(response.status).toBe(200)
            expect(response.body.length).toBe(1)
        })
        test("PI4.21: Should return 422 if the grouping is invalid", async () => {
            const response = await request(app)
                .get(`${productsURL}`)
                .query({grouping: "invalid", category: "testModel"})
                .set("Cookie", adminCookie)
            expect(response.status).toBe(422)
        })
        test("PI4.22: Should return 422 if the category is invalid", async () => {
            const response = await request(app)
                .get(`${productsURL}`)
                .query({grouping: "category", category: "invalid"})
                .set("Cookie", adminCookie)
            expect(response.status).toBe(422)
        })
        test("PI4.23: Should return 422 if the model is invalid", async () => {
            const response = await request(app)
                .get(`${productsURL}`)
                .query({grouping: "model", model: ""})
                .set("Cookie", adminCookie)
            expect(response.status).toBe(422)
        })
        test("PI4.24: It should return 404 if the product does not exist", async () => {
            const response = await request(app)
                .get(`${productsURL}`)
                .query({grouping: "model", model: "nonexistent"})
                .set("Cookie", adminCookie)
            expect(response.status).toBe(404)
        })
    })
    describe(`GET ${productsURL}/available - get all available products`, () => {
        beforeEach(async () => {
            await deleteProducts()
            await postProduct(sampleProduct)
            await postProduct({...sampleProduct, model: 'testModel2', category: Category.SMARTPHONE, quantity: 1})
            await sellProduct('testModel2', 1)
        })
        test("PI4.25: It should return 200 when the request is successful", async () => {
            const response = await request(app)
                .get(`${productsURL}/available`)
                .set("Cookie", adminCookie)
            expect(response.status).toBe(200)
            expect(response.body.length).toBe(1)
        })
        test("PI4.26: It should return 401 when the request is unauthorized", async () => {
            const response = await request(app)
                .get(`${productsURL}/available`)
            expect(response.status).toBe(401)
        })
        test("PI4.27: Should return 200 success code if the grouping is 'category'", async () => {
            const response = await request(app)
                .get(`${productsURL}/available`)
                .query({grouping: "category", category: "Laptop"})
                .set("Cookie", adminCookie)
            expect(response.status).toBe(200)
            expect(response.body.length).toBe(1)
        })
        test("PI4.28: Should return 200 success code if the grouping is 'model'", async () => {
            const response = await request(app)
                .get(`${productsURL}/available`)
                .query({grouping: "model", model: "testModel"})
                .set("Cookie", adminCookie)
            expect(response.status).toBe(200)
            expect(response.body.length).toBe(1)
        })
        test("PI4.29: Should return 422 if the grouping is invalid", async () => {
            const response = await request(app)
                .get(`${productsURL}/available`)
                .query({grouping: "invalid", category: "testModel"})
                .set("Cookie", adminCookie)
            expect(response.status).toBe(422)
        })
        test("PI4.30: Should return 422 if the category is invalid", async () => {
            const response = await request(app)
                .get(`${productsURL}/available`)
                .query({grouping: "category", category: "invalid"})
                .set("Cookie", adminCookie)
            expect(response.status).toBe(422)
        })
        test("PI4.31: Should return 422 if the model is invalid", async () => {
            const response = await request(app)
                .get(`${productsURL}/available`)
                .query({grouping: "model", model: ""})
                .set("Cookie", adminCookie)
            expect(response.status).toBe(422)
        })
        test("PI4.32: It should return 404 if the product does not exist", async () => {
            const response = await request(app)
                .get(`${productsURL}/available`)
                .query({grouping: "model", model: "nonexistent"})
                .set("Cookie", adminCookie)
            expect(response.status).toBe(404)
        })
    })
    describe(`DELETE ${productsURL} - delete all products`, () => {
        beforeEach(async () => {
            await deleteProducts()
            await postProduct(sampleProduct)
        })
        test("PI4.33: It should return 200 when the request is successful", async () => {
            const response = await request(app)
                .delete(productsURL)
                .set("Cookie", adminCookie)
            expect(response.status).toBe(200)
        })
        test("PI4.34: It should return 401 when the request is unauthorized", async () => {
            const response = await request(app)
                .delete(productsURL)
            expect(response.status).toBe(401)
        })
        test("PI4.35: It should return 401 when the request is made by a customer", async () => {
            const response = await request(app)
                .delete(productsURL)
                .set("Cookie", customerCookie)
            expect(response.status).toBe(401)
        })
    })
    describe(`DELETE ${productsURL}/:model - delete a product`, () => {
        beforeEach(async () => {
            await deleteProducts()
            await postProduct(sampleProduct)
        })
        test("PI4.36: It should return 200 when the request is successful", async () => {
            const response = await request(app)
                .delete(`${productsURL}/${sampleProduct.model}`)
                .set("Cookie", adminCookie)
            expect(response.status).toBe(200)
        })
        test("PI4.37: It should return 401 when the request is unauthorized", async () => {
            const response = await request(app)
                .delete(`${productsURL}/${sampleProduct.model}`)
            expect(response.status).toBe(401)
        })
        test("PI4.38: It should return 401 when the request is made by a customer", async () => {
            const response = await request(app)
                .delete(`${productsURL}/${sampleProduct.model}`)
                .set("Cookie", customerCookie)
            expect(response.status).toBe(401)
        })
        test("PI4.39: It should return 404 if the product does not exist", async () => {
            const response = await request(app)
                .delete(`${productsURL}/nonexistent`)
                .set("Cookie", adminCookie)
            expect(response.status).toBe(404)
        })
    })  

    

})

