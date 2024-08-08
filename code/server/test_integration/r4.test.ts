import {beforeAll, expect, jest, test} from "@jest/globals"
import request from 'supertest'
import {app} from "../index"
import {cleanup} from "../src/db/cleanup";

import {ProductReview} from "../src/components/review";
import {Role} from "../src/components/user";
import {Category, Product} from "../src/components/product";


//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: Role.CUSTOMER }
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: Role.MANAGER }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: Role.ADMIN }
const sampleProduct = {model:'testModel', category:Category.LAPTOP, quantity:2, details:'testDetails', sellingPrice:4.5, arrivalDate:'2015-04-10'}
const sampleReview = {comment:'testComment', score:4}
//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string
let managerCookie: string
let adminCookie: string

const baseURL = "/ezelectronics"
const reviewsURL = baseURL+"/reviews"

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
const postReview = async (reviewInfo:any, model:string)=>{
    await request(app)
        .post(`${baseURL}/reviews/${model}`)
        .set("Cookie", customerCookie)
        .send(reviewInfo)
        .expect(200)
}
const deleteReviews = async ()=>{
    await request(app)
        .delete(`${baseURL}/reviews`)
        .set("Cookie", adminCookie)
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


// --------------- 3.integration of reviewDAO.ts ---------------
describe("Integrating 'reviewDAO.ts' module with 'reviewRoutes.ts'", ()=>{
    describe(`POST ${reviewsURL}/:model - adding a review to a product`, ()=>{
        beforeEach(async ()=>{
            await deleteProducts()
            await deleteReviews()
        })
        test("R4.1: should return 200 success code", async ()=>{
            await postProduct(sampleProduct)
            const response = await request(app).post(reviewsURL+`/${sampleProduct.model}`).set("Cookie", customerCookie).send(sampleReview)
            expect(response.status).toBe(200)
        })
        test("R4.2: should return 422 error code if review is wrong", async ()=>{
            await postProduct(sampleProduct)
            let wrongInputReview = {...sampleReview, score:-10};
            const response = await request(app).post(reviewsURL+`/${sampleProduct.model}`).set("Cookie", customerCookie).send(wrongInputReview)
            expect(response.status).toBe(422)
        })
        test("R4.3: should fail if user is not a customer", async ()=>{
            await postProduct(sampleProduct)
            const response = await request(app).post(reviewsURL+`/${sampleProduct.model}`).set("Cookie", adminCookie).send(sampleReview)
            expect(response.status).toBe(401)
        })
        test("R4.4: should fail if user is not logged in", async ()=>{
            await postProduct(sampleProduct)
            const response = await request(app).post(reviewsURL+`/${sampleProduct.model}`).send(sampleReview)
            expect(response.status).toBe(401)
        })
        test("R4.5: should fail if the product DAO can't find the product", async ()=>{
            const response = await request(app).post(reviewsURL+`/${sampleProduct.model}`).set("Cookie", customerCookie).send(sampleReview)
            expect(response.status).toBe(404)
        })
        test("R4.6: should fail if the review DAO already has a review from the same user", async ()=>{
            await postProduct(sampleProduct)
            await postReview(sampleReview, sampleProduct.model)
            const response = await request(app).post(reviewsURL+`/${sampleProduct.model}`).set("Cookie", customerCookie).send(sampleReview)
            expect(response.status).toBe(409)
        })
    })
    describe(`GET ${reviewsURL}+/:model - retrieving all the reviews of a product`, ()=>{
        beforeAll(async ()=>{
            await deleteProducts()
            await deleteReviews()
        })
        test("R4.7: should return 200 success code",async ()=>{
            const response = await request(app).get(reviewsURL+`/${sampleProduct.model}`).set("Cookie", customerCookie)
            expect(response.status).toBe(200)
        })
        test("R4.8: should fail if user is not logged in", async ()=>{
            const response = await request(app).get(reviewsURL+`/${sampleProduct.model}`)
            expect(response.status).toBe(401)
        })
    })
    describe(`DELETE ${reviewsURL}+/:model - deleting the review made by a user for one product`, ()=>{
        beforeEach(async ()=>{
            await deleteProducts()
            await deleteReviews()
        })
        test("R4.9: should return 200 success code",async ()=>{
            await postProduct(sampleProduct)
            await postReview(sampleReview, sampleProduct.model)
            const response = await request(app).delete(reviewsURL+`/${sampleProduct.model}`).set("Cookie", customerCookie)
            expect(response.status).toBe(200)
        })
        test("R4.10: should fail if user is not a customer", async ()=>{
            await postProduct(sampleProduct)
            await postReview(sampleReview, sampleProduct.model)

            const response = await request(app).delete(reviewsURL+`/${sampleProduct.model}`).set("Cookie", managerCookie)
            expect(response.status).toBe(401)
        })
        test("R4.11: should fail if user is not logged in", async ()=>{
            await postProduct(sampleProduct)
            await postReview(sampleReview, sampleProduct.model)

            const response = await request(app).delete(reviewsURL+`/${sampleProduct.model}`)
            expect(response.status).toBe(401)
        })
        test("R4.12: should fail if the product DAO can't find the product", async ()=>{
            await postProduct(sampleProduct)
            await postReview(sampleReview, sampleProduct.model)

            const response = await request(app).delete(reviewsURL+`/wrongModel`).set("Cookie", customerCookie)
            expect(response.status).toBe(404)
        })
        test("R4.13: should fail if the review DAO cannot find a review from the same user", async ()=>{
            await postProduct(sampleProduct)
            const response = await request(app).delete(reviewsURL+`/${sampleProduct.model}`).set("Cookie", customerCookie)
            expect(response.status).toBe(404)
        })
    })
    describe(`DELETE ${reviewsURL}+/:model/all - deleting all reviews of a product`, ()=>{
        beforeEach(async ()=>{
            await deleteProducts()
            await deleteReviews()
        })
        test("R4.14: should return 200 success code", async ()=>{
            await postProduct(sampleProduct)
            await postReview(sampleReview, sampleProduct.model)
            const response = await request(app).delete(reviewsURL+`/${sampleProduct.model}/all`).set("Cookie", adminCookie)
            expect(response.status).toBe(200)
        })
        test("R4.15: should fail if user is not an admin nor a manager", async ()=>{
            await postProduct(sampleProduct)
            await postReview(sampleReview, sampleProduct.model)

            const response = await request(app).delete(reviewsURL+`/${sampleProduct.model}/all`).set("Cookie", customerCookie)
            expect(response.status).toBe(401)
        })
        test("R4.16: should fail if user is not logged in", async ()=>{
            await postProduct(sampleProduct)
            await postReview(sampleReview, sampleProduct.model)

            const response = await request(app).delete(reviewsURL+`/${sampleProduct.model}/all`)
            expect(response.status).toBe(401)
        })
        test("R4.17: should fail if the product DAO can't find the product", async ()=>{
            await postProduct(sampleProduct)
            await postReview(sampleReview, sampleProduct.model)

            const response = await request(app).delete(reviewsURL+`/wrongModel/all`).set("Cookie", adminCookie)
            expect(response.status).toBe(404)
        })
    })
    describe(`DELETE ${reviewsURL}+/ - deleting all reviews of all products`, ()=>{
        beforeEach(async ()=>{
            await deleteProducts()
            await deleteReviews()
        })
        test("R4.18: should return 200 success code", async ()=>{
            await postProduct(sampleProduct)
            await postReview(sampleReview, sampleProduct.model)

            const response = await request(app).delete(reviewsURL+'/').set("Cookie", adminCookie)
            expect(response.status).toBe(200)
        })
        test("R4.19: should fail if user is not an admin nor a manager", async ()=>{
            await postProduct(sampleProduct)
            await postReview(sampleReview, sampleProduct.model)

            const response = await request(app).delete(reviewsURL+'/').set("Cookie", customerCookie)
            expect(response.status).toBe(401)
        })
        test("R4.20: should fail if user is not logged in", async ()=>{
            await postProduct(sampleProduct)
            await postReview(sampleReview, sampleProduct.model)

            const response = await request(app).delete(reviewsURL+'/')
            expect(response.status).toBe(401)
        })
    })
})