import {beforeAll, expect, jest, test} from "@jest/globals"
import request from 'supertest'
import {app} from "../index"
import {cleanup} from "../src/db/cleanup";

import {ProductReview} from "../src/components/review";
import {Role} from "../src/components/user";
import ReviewDAO from "../src/dao/reviewDAO";
import ProductDAO from "../src/dao/productDAO";
import {Category, Product} from "../src/components/product";


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
//jest.mock("../src/controllers/reviewController")
jest.mock("../src/dao/reviewDAO")
jest.mock("../src/dao/productDAO")

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


// --------------- 3.integration of reviewController.ts ---------------
// used for testing samples
const sampleProduct = new Product(100, 'test-model', Category.LAPTOP, '2003-02-01' ,'test-details', 2)
const sampleReviews = [
    new ProductReview('test-model','test-user1',1,'2001-01-01','test-comment1'),
    new ProductReview('test-model','test-user2',2,'2002-02-02','test-comment')
]
describe("Integrating 'reviewController.ts' module with 'reviewRoutes.ts'", ()=>{
    describe(`POST ${reviewsURL}/:model - adding a review to a product`, ()=>{
        const inputReview = {score:1,comment:'test-comment'}
        const inputModel = 'test-model'
        beforeEach(()=>{
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockReset()
            jest.spyOn(ReviewDAO.prototype, "getReviewsByModelUser").mockReset()
            jest.spyOn(ReviewDAO.prototype, "addReview").mockReset()
        })
        test("R3.1: should return 200 success code", async ()=>{
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(sampleProduct)
            jest.spyOn(ReviewDAO.prototype, "getReviewsByModelUser").mockResolvedValue([])
            jest.spyOn(ReviewDAO.prototype, "addReview").mockResolvedValue(true)
            const response = await request(app).post(reviewsURL+`/${inputModel}`).set("Cookie", customerCookie).send(inputReview)
            expect(response.status).toBe(200)
        })
        test("R3.2: should return 422 error code if review is wrong", async ()=>{
            let wrongInputReview = {...inputReview, score:-10};
            const response = await request(app).post(reviewsURL+`/${inputModel}`).set("Cookie", customerCookie).send(wrongInputReview)
            expect(response.status).toBe(422)
        })
        test("R3.3: should fail if user is not a customer", async ()=>{

            const response = await request(app).post(reviewsURL+`/${inputModel}`).set("Cookie", adminCookie).send(inputReview)
            expect(response.status).toBe(401)
        })
        test("R3.4: should fail if user is not logged in", async ()=>{

            const response = await request(app).post(reviewsURL+`/${inputModel}`).send(inputReview)
            expect(response.status).toBe(401)
        })
        test("R3.5: should fail if the product DAO can't find the product", async ()=>{
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null)
            jest.spyOn(ReviewDAO.prototype, "getReviewsByModelUser").mockResolvedValue([])
            jest.spyOn(ReviewDAO.prototype, "addReview").mockResolvedValue(true)
            const response = await request(app).post(reviewsURL+`/${inputModel}`).set("Cookie", customerCookie).send(inputReview)
            expect(response.status).toBe(404)
        })
        test("R3.6: should fail if the review DAO already has a review from the same user", async ()=>{
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(sampleProduct)
            jest.spyOn(ReviewDAO.prototype, "getReviewsByModelUser").mockResolvedValue(sampleReviews)
            jest.spyOn(ReviewDAO.prototype, "addReview").mockResolvedValue(true)
            const response = await request(app).post(reviewsURL+`/${inputModel}`).set("Cookie", customerCookie).send(inputReview)
            expect(response.status).toBe(409)
        })
    })
    describe(`GET ${reviewsURL}+/:model - retrieving all the reviews of a product`, ()=>{
        const inputModel = 'test-model'
        beforeEach(()=>{
            jest.spyOn(ReviewDAO.prototype, "getReviewsByModel").mockReset()
            jest.spyOn(ReviewDAO.prototype, "getReviewsByModel").mockReset()
        })
        test("R3.7: should return 200 success code",async ()=>{
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(sampleProduct)
            jest.spyOn(ReviewDAO.prototype, "getReviewsByModel").mockResolvedValue(sampleReviews)
            const response = await request(app).get(reviewsURL+`/${inputModel}`).set("Cookie", customerCookie)
            expect(response.status).toBe(200)
        })
        test("R3.8: should fail if user is not logged in", async ()=>{
            const response = await request(app).get(reviewsURL+`/${inputModel}`)
            expect(response.status).toBe(401)
        })
    })
    describe(`DELETE ${reviewsURL}+/:model - deleting the review made by a user for one product`, ()=>{
        const inputModel = 'test-model'
        beforeAll(()=>{
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockReset()
            jest.spyOn(ReviewDAO.prototype, "getReviewsByModelUser").mockReset()
            jest.spyOn(ReviewDAO.prototype, "deleteReviewByModel").mockReset()
        })
        test("R3.9: should return 200 success code",async ()=>{
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(sampleProduct)
            jest.spyOn(ReviewDAO.prototype, "getReviewsByModelUser").mockResolvedValue(sampleReviews)
            jest.spyOn(ReviewDAO.prototype, "deleteReviewByModel").mockResolvedValue(true)
            const response = await request(app).delete(reviewsURL+`/${inputModel}`).set("Cookie", customerCookie)
            expect(response.status).toBe(200)
        })
        test("R3.10: should fail if user is not a customer", async ()=>{

            const response = await request(app).delete(reviewsURL+`/${inputModel}`).set("Cookie", managerCookie)
            expect(response.status).toBe(401)
        })
        test("R3.11: should fail if user is not logged in", async ()=>{
            const response = await request(app).delete(reviewsURL+`/${inputModel}`)
            expect(response.status).toBe(401)
        })
        test("R3.12: should fail if the product DAO can't find the product", async ()=>{
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null)
            jest.spyOn(ReviewDAO.prototype, "getReviewsByModelUser").mockResolvedValue(sampleReviews)
            jest.spyOn(ReviewDAO.prototype, "deleteReviewByModel").mockResolvedValue(true)
            const response = await request(app).delete(reviewsURL+`/${inputModel}`).set("Cookie", customerCookie)
            expect(response.status).toBe(404)
        })
        test("R3.13: should fail if the review DAO cannot find a review from the same user", async ()=>{
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(sampleProduct)
            jest.spyOn(ReviewDAO.prototype, "getReviewsByModelUser").mockResolvedValue([])
            jest.spyOn(ReviewDAO.prototype, "deleteReviewByModel").mockResolvedValue(true)
            const response = await request(app).delete(reviewsURL+`/${inputModel}`).set("Cookie", customerCookie)
            expect(response.status).toBe(404)
        })
    })
    describe(`DELETE ${reviewsURL}+/:model/all - deleting all reviews of a product`, ()=>{
        const inputModel = 'test-model'
        const sampleProduct = new Product(100, 'test-model', Category.LAPTOP, '2003-02-01' ,'test-details', 2)
        beforeAll(()=>{
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockReset()
            jest.spyOn(ReviewDAO.prototype, "deleteAllReviewsByModel").mockReset()
        })
        test("R3.14: should return 200 success code", async ()=>{
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(sampleProduct)
            jest.spyOn(ReviewDAO.prototype, "deleteAllReviewsByModel").mockResolvedValue(true)
            const response = await request(app).delete(reviewsURL+`/${inputModel}/all`).set("Cookie", adminCookie)
            expect(response.status).toBe(200)
        })
        test("R3.15: should fail if user is not an admin nor a manager", async ()=>{
            const response = await request(app).delete(reviewsURL+`/${inputModel}/all`).set("Cookie", customerCookie)
            expect(response.status).toBe(401)
        })
        test("R3.16: should fail if user is not logged in", async ()=>{
            const response = await request(app).delete(reviewsURL+`/${inputModel}/all`)
            expect(response.status).toBe(401)
        })
        test("R3.17: should fail if the product DAO can't find the product", async ()=>{
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null)
            jest.spyOn(ReviewDAO.prototype, "deleteAllReviewsByModel").mockResolvedValue(true)
            const response = await request(app).delete(reviewsURL+`/${inputModel}/all`).set("Cookie", adminCookie)
            expect(response.status).toBe(404)

        })
    })
    describe(`DELETE ${reviewsURL}+/ - deleting all reviews of all products`, ()=>{
        beforeEach(()=>{
            jest.spyOn(ReviewDAO.prototype, 'deleteAllReviews').mockReset()
        })
        test("R3.18: should return 200 success code", async ()=>{
            jest.spyOn(ReviewDAO.prototype, 'deleteAllReviews').mockResolvedValue(true)
            const response = await request(app).delete(reviewsURL+'/').set("Cookie", adminCookie)
            expect(response.status).toBe(200)
        })
        test("R3.19: should fail if user is not an admin nor a manager", async ()=>{
            const response = await request(app).delete(reviewsURL+'/').set("Cookie", customerCookie)
            expect(response.status).toBe(401)
        })
        test("R3.20: should fail if user is not logged in", async ()=>{
            const response = await request(app).delete(reviewsURL+'/')
            expect(response.status).toBe(401)
        })
    })
})