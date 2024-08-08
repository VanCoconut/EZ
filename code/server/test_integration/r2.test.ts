import {beforeAll, expect, jest, test} from "@jest/globals"
import request from 'supertest'
import {app} from "../index"
import {cleanup} from "../src/db/cleanup";

import ReviewController from "../src/controllers/reviewController";
import {ProductReview} from "../src/components/review";
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
const reviewsURL = baseURL+"/reviews"
jest.mock("../src/controllers/reviewController")

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

describe("Integrating 'auth.ts' module with 'reviewRoutes.ts'", ()=>{
    describe(`POST ${reviewsURL}/:model - adding a review to a product`, ()=>{
        const inputReview = {score:1,comment:'test-comment'}
        const inputModel = 'test-model'
        const inputUser = 'test-user'
        beforeEach(()=>{
            jest.spyOn(ReviewController.prototype, "addReview").mockReset()
        })
        test("RI2.1: should return 200 success code", async ()=>{

            jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce(true)

            const response = await request(app).post(reviewsURL+`/${inputModel}`).set("Cookie", customerCookie).send(inputReview)
            expect(response.status).toBe(200)
        })
        test("RI2.2: should return 422 error code if review is wrong", async ()=>{
            let wrongInputReview = {...inputReview, score:-10};

            jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce(true)

            const response = await request(app).post(reviewsURL+`/${inputModel}`).set("Cookie", customerCookie).send(wrongInputReview)
            expect(response.status).toBe(422)
        })
        test("RI2.3: should fail if user is not a customer", async ()=>{

            const response = await request(app).post(reviewsURL+`/${inputModel}`).set("Cookie", adminCookie).send(inputReview)
            expect(response.status).toBe(401)
        })
        test("RI2.4: should fail if user is not logged in", async ()=>{

            const response = await request(app).post(reviewsURL+`/${inputModel}`).send(inputReview)
            expect(response.status).toBe(401)
        })
        test("RI2.5: should catch errors/exceptions thrown in 'controller.addReview()'", async ()=>{
            jest.spyOn(ReviewController.prototype, "addReview").mockImplementation(()=>{throw new Error('test-error')})

            const response = await request(app).post(reviewsURL+`/${inputModel}`).set("Cookie", customerCookie).send(inputReview)
            expect(response.status).not.toBe(200)
            expect(ReviewController.prototype.addReview).toThrow()
        })
    })
    describe(`GET ${reviewsURL}+/:model - retrieving all the reviews of a product`, ()=>{
        const testReviews = [
            new ProductReview('test-model','test-user1',1,'2001-01-01','test-comment1'),
            new ProductReview('test-model','test-user2',2,'2002-02-02','test-comment')
        ]
        const inputModel = 'test-model'
        beforeEach(()=>{
            jest.spyOn(ReviewController.prototype,"getProductReviews").mockReset()
        })
        test("RI2.6: should return 200 success code",async ()=>{
            jest.spyOn(ReviewController.prototype,"getProductReviews").mockResolvedValueOnce(testReviews)

            const response = await request(app).get(reviewsURL+`/${inputModel}`).set("Cookie", customerCookie)
            expect(response.status).toBe(200)
        })
        test("RI2.7: should fail if user is not logged in", async ()=>{

            const response = await request(app).get(reviewsURL+`/${inputModel}`)
            expect(response.status).toBe(401)
        })
        test("RI2.8: should catch errors/exceptions thrown in 'controller.getProductReviews()'", async ()=>{
            let err = new Error("test-error")
            jest.spyOn(ReviewController.prototype,"getProductReviews").mockImplementation(()=>{throw err})

            const response = await request(app).get(reviewsURL+`/${inputModel}`).set("Cookie", customerCookie)
            expect(response.status).not.toBe(200)
            expect(ReviewController.prototype.getProductReviews).toThrow(err)
        })
    })
    describe(`DELETE ${reviewsURL}+/:model - deleting the review made by a user for one product`, ()=>{
        const inputModel = 'test-model'
        const inputUser = 'test-user'
        beforeEach(()=>{
            jest.spyOn(ReviewController.prototype, "deleteReview").mockReset()
        })
        test("RI2.9: should return 200 success code",async ()=>{
            jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce(true)

            const response = await request(app).delete(reviewsURL+`/${inputModel}`).set("Cookie", customerCookie)
            expect(response.status).toBe(200)
        })
        test("RI2.10: should fail if user is not a customer", async ()=>{

            const response = await request(app).delete(reviewsURL+`/${inputModel}`).set("Cookie", managerCookie)
            expect(response.status).toBe(401)
        })
        test("RI2.11: should fail if user is not logged in", async ()=>{
            const response = await request(app).delete(reviewsURL+`/${inputModel}`)
            expect(response.status).toBe(401)
        })
        test("RI2.12: should catch errors/exceptions thrown in 'controller.deleteReview()'", async ()=>{
            let err = new Error("test-error")
            jest.spyOn(ReviewController.prototype, "deleteReview").mockImplementation(()=>{throw err})

            const response = await request(app).delete(reviewsURL+`/${inputModel}`).set("Cookie", customerCookie)
            expect(response.status).not.toBe(200)
            expect(ReviewController.prototype.deleteReview).toThrow(err)
        })
    })
    describe(`DELETE ${reviewsURL}+/:model/all - deleting all reviews of a product`, ()=>{
        const inputModel = 'test-model'
        beforeEach(()=>{
            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockReset()
        })
        test("RI2.13: should return 200 success code", async ()=>{
            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce(true)

            const response = await request(app).delete(reviewsURL+`/${inputModel}/all`).set("Cookie", adminCookie)
            expect(response.status).toBe(200)
        })
        test("RI2.14: should fail if user is not an admin nor a manager", async ()=>{
            const response = await request(app).delete(reviewsURL+`/${inputModel}/all`).set("Cookie", customerCookie)
            expect(response.status).toBe(401)
        })
        test("RI2.15: should fail if user is not logged in", async ()=>{
            const response = await request(app).delete(reviewsURL+`/${inputModel}/all`)
            expect(response.status).toBe(401)
        })
        test("RI2.16: should catch errors/exceptions thrown in 'controller.deleteReviewsOfProduct()'", async ()=>{
            let err = new Error('test-error')
            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockImplementation(()=>{throw err})

            const response = await request(app).delete(reviewsURL+`/${inputModel}/all`).set("Cookie", adminCookie)
            expect(response.status).not.toBe(200)
            expect(ReviewController.prototype.deleteReviewsOfProduct).toThrow(err)
        })
    })
    describe(`DELETE ${reviewsURL}+/ - deleting all reviews of all products`, ()=>{
        beforeEach(()=>{
            jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockReset()
        })
        test("RI2.17: should return 200 success code", async ()=>{
            jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValueOnce(true)

            const response = await request(app).delete(reviewsURL+'/').set("Cookie", adminCookie)
            expect(response.status).toBe(200)
        })
        test("RI2.18: should fail if user is not an admin nor a manager", async ()=>{
            const response = await request(app).delete(reviewsURL+'/').set("Cookie", customerCookie)
            expect(response.status).toBe(401)
        })
        test("RI2.19: should fail if user is not logged in", async ()=>{
            const response = await request(app).delete(reviewsURL+'/')
            expect(response.status).toBe(401)
        })
        test("RI2.20: should catch errors/exceptions thrown in 'controller.deleteReviewsOfProduct()'", async ()=>{
            let err = new Error('test-error')
            jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockImplementation(()=>{throw err})

            const response = await request(app).delete(reviewsURL+'/').set("Cookie", adminCookie)
            expect(response.status).not.toBe(200)
            expect(ReviewController.prototype.deleteAllReviews).toThrow(err)
        })
    })
})
