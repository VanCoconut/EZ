import {test, jest, expect} from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import ReviewController from "../../src/controllers/reviewController";
import Authenticator from "../../src/routers/auth";
import ErrorHandler from "../../src/helper"
import {ProductReview} from "../../src/components/review";

const baseURL = "/ezelectronics"
const reviewsURL = baseURL+"/reviews"

// MOCKED MODULES
jest.mock("../../src/controllers/reviewController")
jest.mock("../../src/routers/auth")
jest.mock("../../src/helper")

describe("Testing unit 'reviewsRoutes.ts'", ()=>{
    describe(`POST ${reviewsURL}/:model - adding a review to a product`, ()=>{
        const inputReview = {score:1,comment:'test-comment'}
        const inputModel = 'test-model'
        const inputUser = 'test-user'
        beforeEach(()=>{
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockReset()
            jest.spyOn(ReviewController.prototype, "addReview").mockReset()
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockReset()
            jest.spyOn(Authenticator.prototype, "isCustomer").mockReset()
        })
        test("RRU1: should return 200 success code", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce(true)

            const response = await request(app).post(reviewsURL+`/${inputModel}`).send(inputReview)
            expect(response.status).toBe(200)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalled()
            expect(ErrorHandler.prototype.validateRequest).toHaveBeenCalled()
            expect(ReviewController.prototype.addReview).toHaveBeenCalled()
            expect(ReviewController.prototype.addReview).toHaveBeenCalledWith(inputModel, inputUser, inputReview.score, inputReview.comment)
        })
        test("RRU2: should return 422 error code if review is wrong", async ()=>{
            let wrongInputReview = {...inputReview, score:-10};
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation(jest.requireActual<typeof import("../../src/helper")>("../../src/helper").default.prototype.validateRequest)
            jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce(true)

            const response = await request(app).post(reviewsURL+`/${inputModel}`).send(wrongInputReview)
            expect(response.status).toBe(422)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalled()
            expect(ErrorHandler.prototype.validateRequest).toHaveBeenCalled()
            expect(ReviewController.prototype.addReview).not.toHaveBeenCalled()
            expect(ReviewController.prototype.addReview).not.toHaveBeenCalledWith(inputModel, inputUser, inputReview.score, inputReview.comment)
        })
        test("RRU3: should fail if user is not a customer", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))

            const response = await request(app).post(reviewsURL+`/${inputModel}`).send(inputReview)
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalled()
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled()
            expect(ReviewController.prototype.addReview).not.toHaveBeenCalled()
        })
        test("RRU4: should fail if user is not logged in", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthenticated" }))

            const response = await request(app).post(reviewsURL+`/${inputModel}`).send(inputReview)
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
            expect(Authenticator.prototype.isCustomer).not.toHaveBeenCalled()
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled()
            expect(ReviewController.prototype.addReview).not.toHaveBeenCalled()
        })
        test("RRU5: should catch errors/exceptions thrown in 'controller.addReview()'", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ReviewController.prototype, "addReview").mockImplementation(()=>{throw new Error('test-error')})

            const response = await request(app).post(reviewsURL+`/${inputModel}`).send(inputReview)
            expect(response.status).not.toBe(200)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalled()
            expect(ErrorHandler.prototype.validateRequest).toHaveBeenCalled()
            expect(ReviewController.prototype.addReview).toHaveBeenCalled()
            expect(ReviewController.prototype.addReview).toHaveBeenCalledWith(inputModel, inputUser, inputReview.score, inputReview.comment)
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
            jest.spyOn(ErrorHandler.prototype,"validateRequest").mockReset()
            jest.spyOn(ReviewController.prototype,"getProductReviews").mockReset()
        })
        test("RRU6: should return 200 success code",async ()=>{
            jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementationOnce((req: any, res: any, next: () => any) => next())
            jest.spyOn(ErrorHandler.prototype,"validateRequest").mockImplementationOnce((req: any, res: any, next: () => any) => next())
            jest.spyOn(ReviewController.prototype,"getProductReviews").mockResolvedValueOnce(testReviews)

            const response = await request(app).get(reviewsURL+`/${inputModel}`)
            expect(response.status).toBe(200)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
            expect(ErrorHandler.prototype.validateRequest).toHaveBeenCalled()
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalled()
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith(inputModel)
        })
        test("RRU7: should fail if user is not logged in", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthenticated" }))

            const response = await request(app).get(reviewsURL+`/${inputModel}`)
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled()
            expect(ReviewController.prototype.getProductReviews).not.toHaveBeenCalled()
        })
        test("RRU8: should catch errors/exceptions thrown in 'controller.getProductReviews()'", async ()=>{
            let err = new Error("test-error")
            jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementationOnce((req: any, res: any, next: () => any) => next())
            jest.spyOn(ErrorHandler.prototype,"validateRequest").mockImplementationOnce((req: any, res: any, next: () => any) => next())
            jest.spyOn(ReviewController.prototype,"getProductReviews").mockImplementation(()=>{throw err})

            const response = await request(app).get(reviewsURL+`/${inputModel}`)
            expect(response.status).not.toBe(200)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
            expect(ErrorHandler.prototype.validateRequest).toHaveBeenCalled()
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalled()
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith(inputModel)
            expect(ReviewController.prototype.getProductReviews).toThrow(err)
        })
    })
    describe(`DELETE ${reviewsURL}+/:model - deleting the review made by a user for one product`, ()=>{
        const inputModel = 'test-model'
        const inputUser = 'test-user'
        beforeEach(()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockReset()
            jest.spyOn(Authenticator.prototype, "isCustomer").mockReset()
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockReset()
            jest.spyOn(ReviewController.prototype, "deleteReview").mockReset()
        })
        test("RRU9: should return 200 success code",async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce(true)

            const response = await request(app).delete(reviewsURL+`/${inputModel}`)
            expect(response.status).toBe(200)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalled()
            expect(ErrorHandler.prototype.validateRequest).toHaveBeenCalled()
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalled()
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith(inputModel,inputUser)
        })
        test("RRU10: should fail if user is not a customer", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))
            const response = await request(app).delete(reviewsURL+`/${inputModel}`)
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalled()
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled()
            expect(ReviewController.prototype.deleteReview).not.toHaveBeenCalled()
            expect(ReviewController.prototype.deleteReview).not.toHaveBeenCalledWith(inputModel,inputUser)
        })
        test("RRU11: should fail if user is not logged in", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))
            const response = await request(app).delete(reviewsURL+`/${inputModel}`)
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
            expect(Authenticator.prototype.isCustomer).not.toHaveBeenCalled()
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled()
            expect(ReviewController.prototype.deleteReview).not.toHaveBeenCalled()
            expect(ReviewController.prototype.deleteReview).not.toHaveBeenCalledWith(inputModel,inputUser)
        })
        test("RRU12: should catch errors/exceptions thrown in 'controller.deleteReview()'", async ()=>{
            let err = new Error("test-error")
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ReviewController.prototype, "deleteReview").mockImplementation(()=>{throw err})

            const response = await request(app).delete(reviewsURL+`/${inputModel}`)
            expect(response.status).not.toBe(200)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalled()
            expect(ErrorHandler.prototype.validateRequest).toHaveBeenCalled()
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalled()
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith(inputModel,inputUser)
            expect(ReviewController.prototype.deleteReview).toThrow(err)
        })
    })
    describe(`DELETE ${reviewsURL}+/:model/all - deleting all reviews of a product`, ()=>{
        const inputModel = 'test-model'
        beforeEach(()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockReset()
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockReset()
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockReset()
            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockReset()
        })
        test("RRU13: should return 200 success code", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce(true)

            const response = await request(app).delete(reviewsURL+`/${inputModel}/all`)
            expect(response.status).toBe(200)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalled()
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalled()
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(inputModel)
        })
        test("RRU14: should fail if user is not an admin nor a manager", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))
            const response = await request(app).delete(reviewsURL+`/${inputModel}/all`)
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalled()
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled()
            expect(ReviewController.prototype.deleteReviewsOfProduct).not.toHaveBeenCalled()
        })
        test("RRU15: should fail if user is not logged in", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))
            const response = await request(app).delete(reviewsURL+`/${inputModel}/all`)
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
            expect(Authenticator.prototype.isAdminOrManager).not.toHaveBeenCalled()
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled()
            expect(ReviewController.prototype.deleteReviewsOfProduct).not.toHaveBeenCalled()
        })
        test("RRU16: should catch errors/exceptions thrown in 'controller.deleteReviewsOfProduct()'", async ()=>{
            let err = new Error('test-error')
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockImplementation(()=>{throw err})

            const response = await request(app).delete(reviewsURL+`/${inputModel}/all`)
            expect(response.status).not.toBe(200)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalled()
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalled()
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(inputModel)
            expect(ReviewController.prototype.deleteReviewsOfProduct).toThrow(err)
        })
    })
    describe(`DELETE ${reviewsURL}+/ - deleting all reviews of all products`, ()=>{
        beforeEach(()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockReset()
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockReset()
            jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockReset()
        })
        test("RRU17: should return 200 success code", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValueOnce(true)

            const response = await request(app).delete(reviewsURL+'/')
            expect(response.status).toBe(200)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalled()
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled()
            expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalled()
            expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledWith()
        })
        test("RRU18: should fail if user is not an admin nor a manager", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))
            const response = await request(app).delete(reviewsURL+'/')
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalled()
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled()
            expect(ReviewController.prototype.deleteAllReviews).not.toHaveBeenCalled()
        })
        test("RRU19: should fail if user is not logged in", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))
            const response = await request(app).delete(reviewsURL+'/')
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
            expect(Authenticator.prototype.isAdminOrManager).not.toHaveBeenCalled()
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled()
            expect(ReviewController.prototype.deleteAllReviews).not.toHaveBeenCalled()
        })
        test("RRU20: should catch errors/exceptions thrown in 'controller.deleteReviewsOfProduct()'", async ()=>{
            let err = new Error('test-error')
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockImplementation(()=>{throw err})

            const response = await request(app).delete(reviewsURL+'/')
            expect(response.status).not.toBe(200)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled()
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalled()
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled()
            expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalled()
            expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledWith()
            expect(ReviewController.prototype.deleteAllReviews).toThrow(err)
        })
    })
})




