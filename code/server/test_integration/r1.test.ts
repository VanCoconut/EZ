import {test, jest, expect, beforeAll} from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import db from "../src/db/db"

import ReviewController from "../src/controllers/reviewController";
import Authenticator from "../src/routers/auth";
import ErrorHandler from "../src/helper"
import {ProductReview} from "../src/components/review";

const baseURL = "/ezelectronics"
const reviewsURL = baseURL+"/reviews"

jest.mock("../src/controllers/reviewController")
jest.mock("../src/routers/auth")


// ============================== TOP-DOWN TESTING ==============================
// testing all module integrating them with a top-down approach,
// starting with 'reviewRoutes.ts' as the highest

// --------------- 1.integration of helper.ts ---------------
describe("Integrating 'helper.ts' module with 'reviewRoutes.ts'", ()=>{
    describe(`POST ${reviewsURL}/:model - adding a review to a product`, ()=>{
        const inputReview = {score:1,comment:'test-comment'}
        const inputModel = 'test-model'
        const inputUser = 'test-user'
        beforeEach(()=>{
            jest.spyOn(ReviewController.prototype, "addReview").mockReset()
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockReset()
            jest.spyOn(Authenticator.prototype, "isCustomer").mockReset()
        })
        test("RI1.1: should return 200 success code", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce(true)

            const response = await request(app).post(reviewsURL+`/${inputModel}`).send(inputReview)
            expect(response.status).toBe(200)
        })
        test("RI1.2: should return 422 error code if review is wrong", async ()=>{
            let wrongInputReview = {...inputReview, score:-10};
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce(true)

            const response = await request(app).post(reviewsURL+`/${inputModel}`).send(wrongInputReview)
            expect(response.status).toBe(422)
        })
        test("RI1.3: should fail if user is not a customer", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))

            const response = await request(app).post(reviewsURL+`/${inputModel}`).send(inputReview)
            expect(response.status).toBe(401)
        })
        test("RI1.4: should fail if user is not logged in", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthenticated" }))

            const response = await request(app).post(reviewsURL+`/${inputModel}`).send(inputReview)
            expect(response.status).toBe(401)
        })
        test("RI1.5: should catch errors/exceptions thrown in 'controller.addReview()'", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ReviewController.prototype, "addReview").mockImplementation(()=>{throw new Error('test-error')})

            const response = await request(app).post(reviewsURL+`/${inputModel}`).send(inputReview)
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
            jest.spyOn(Authenticator.prototype,"isLoggedIn").mockReset()
            jest.spyOn(ReviewController.prototype,"getProductReviews").mockReset()
        })
        test("RI1.6: should return 200 success code",async ()=>{
            jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementationOnce((req: any, res: any, next: () => any) => next())
            jest.spyOn(ReviewController.prototype,"getProductReviews").mockResolvedValueOnce(testReviews)

            const response = await request(app).get(reviewsURL+`/${inputModel}`)
            expect(response.status).toBe(200)
        })
        test("RI1.7: should fail if user is not logged in", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthenticated" }))

            const response = await request(app).get(reviewsURL+`/${inputModel}`)
            expect(response.status).toBe(401)
        })
        test("RI1.8: should catch errors/exceptions thrown in 'controller.getProductReviews()'", async ()=>{
            let err = new Error("test-error")
            jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementationOnce((req: any, res: any, next: () => any) => next())
            jest.spyOn(ReviewController.prototype,"getProductReviews").mockImplementation(()=>{throw err})

            const response = await request(app).get(reviewsURL+`/${inputModel}`)
            expect(response.status).not.toBe(200)
            expect(ReviewController.prototype.getProductReviews).toThrow(err)
        })
    })
    describe(`DELETE ${reviewsURL}+/:model - deleting the review made by a user for one product`, ()=>{
        const inputModel = 'test-model'
        const inputUser = 'test-user'
        beforeEach(()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockReset()
            jest.spyOn(Authenticator.prototype, "isCustomer").mockReset()
            jest.spyOn(ReviewController.prototype, "deleteReview").mockReset()
        })
        test("RI1.9: should return 200 success code",async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce(true)

            const response = await request(app).delete(reviewsURL+`/${inputModel}`)
            expect(response.status).toBe(200)
        })
        test("RI1.10: should fail if user is not a customer", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))
            const response = await request(app).delete(reviewsURL+`/${inputModel}`)
            expect(response.status).toBe(401)
        })
        test("RI1.11: should fail if user is not logged in", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))
            const response = await request(app).delete(reviewsURL+`/${inputModel}`)
            expect(response.status).toBe(401)
        })
        test("RI1.12: should catch errors/exceptions thrown in 'controller.deleteReview()'", async ()=>{
            let err = new Error("test-error")
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ReviewController.prototype, "deleteReview").mockImplementation(()=>{throw err})

            const response = await request(app).delete(reviewsURL+`/${inputModel}`)
            expect(response.status).not.toBe(200)
            expect(ReviewController.prototype.deleteReview).toThrow(err)
        })
    })
    describe(`DELETE ${reviewsURL}+/:model/all - deleting all reviews of a product`, ()=>{
        const inputModel = 'test-model'
        beforeEach(()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockReset()
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockReset()
            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockReset()
        })
        test("RI1.13: should return 200 success code", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce(true)

            const response = await request(app).delete(reviewsURL+`/${inputModel}/all`)
            expect(response.status).toBe(200)
        })
        test("RI1.14: should fail if user is not an admin nor a manager", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))
            const response = await request(app).delete(reviewsURL+`/${inputModel}/all`)
            expect(response.status).toBe(401)
        })
        test("RI1.15: should fail if user is not logged in", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))
            const response = await request(app).delete(reviewsURL+`/${inputModel}/all`)
            expect(response.status).toBe(401)
        })
        test("RI1.16: should catch errors/exceptions thrown in 'controller.deleteReviewsOfProduct()'", async ()=>{
            let err = new Error('test-error')
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockImplementation(()=>{throw err})

            const response = await request(app).delete(reviewsURL+`/${inputModel}/all`)
            expect(response.status).not.toBe(200)
            expect(ReviewController.prototype.deleteReviewsOfProduct).toThrow(err)
        })
    })
    describe(`DELETE ${reviewsURL}+/ - deleting all reviews of all products`, ()=>{
        beforeEach(()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockReset()
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockReset()
            jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockReset()
        })
        test("RI1.17: should return 200 success code", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValueOnce(true)

            const response = await request(app).delete(reviewsURL+'/')
            expect(response.status).toBe(200)
        })
        test("RI1.18: should fail if user is not an admin nor a manager", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))
            const response = await request(app).delete(reviewsURL+'/')
            expect(response.status).toBe(401)
        })
        test("RI1.19: should fail if user is not logged in", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))
            const response = await request(app).delete(reviewsURL+'/')
            expect(response.status).toBe(401)
        })
        test("RI1.20: should catch errors/exceptions thrown in 'controller.deleteReviewsOfProduct()'", async ()=>{
            let err = new Error('test-error')
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockImplementation(()=>{throw err})

            const response = await request(app).delete(reviewsURL+'/')
            expect(response.status).not.toBe(200)
            expect(ReviewController.prototype.deleteAllReviews).toThrow(err)
        })
    })
})


