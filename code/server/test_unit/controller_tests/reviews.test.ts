import {expect, jest, test} from "@jest/globals"
import {Role, User} from "../../src/components/user";
import ReviewDAO from "../../src/dao/reviewDAO";
import ProductDAO from "../../src/dao/productDAO";
import {Category, Product} from "../../src/components/product";
import {ProductReview} from "../../src/components/review";
import ReviewController from "../../src/controllers/reviewController";
import {ProductNotFoundError} from "../../src/errors/productError";
import {ExistingReviewError, NoReviewProductError} from "../../src/errors/reviewError";

jest.mock("../../src/dao/reviewDAO")
jest.mock("../../src/dao/productDAO")

describe("testing unit 'reviewController.ts'", ()=>{
    const reviewController = new ReviewController()
    describe("testing method 'ReviewController.addReview()'", ()=>{
        beforeEach(()=>{
            jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockReset()
            jest.spyOn(ReviewDAO.prototype, 'getReviewsByModelUser').mockReset()
            jest.spyOn(ReviewDAO.prototype, 'addReview').mockReset()
        })
        const inputParams = {
            model: 'test-model',
            user:new User('test-username', 'test-name', 'test-surname', Role.CUSTOMER, 'test-address', 'test-birthdate'),
            score:0,
            comment:'test-comment'
        }
        const sampleProduct = new Product(1,'test-model',Category.SMARTPHONE,'2023-09-02', 'test-details', 3)
        test("RCU1: should resolve to true", async ()=>{
            jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(sampleProduct)
            jest.spyOn(ReviewDAO.prototype, 'getReviewsByModelUser').mockResolvedValue([])
            jest.spyOn(ReviewDAO.prototype, 'addReview').mockResolvedValue(true)

            const result = await reviewController.addReview(inputParams.model, inputParams.user, inputParams.score, inputParams.comment)
            expect(result).toBe(true)
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled()
            expect(ReviewDAO.prototype.getReviewsByModelUser).toHaveBeenCalled()
            expect(ReviewDAO.prototype.addReview).toHaveBeenCalled()
            expect(ReviewDAO.prototype.addReview).toHaveBeenCalledWith(inputParams.model, inputParams.user, inputParams.score, inputParams.comment)
        })
        test("RCU2: should throw 'ProductNotFoundError' in case of model=\"\"", async ()=>{
            const wrongInput = {...inputParams, model:""}

            let thrown = null
            try{
                await reviewController.addReview(wrongInput.model, wrongInput.user, wrongInput.score, wrongInput.comment)
            }
            catch (err){
                thrown = err
            }
            expect(thrown).toBeInstanceOf(ProductNotFoundError)
            expect(ProductDAO.prototype.getProductByModel).not.toHaveBeenCalled()
            expect(ReviewDAO.prototype.getReviewsByModelUser).not.toHaveBeenCalled()
            expect(ReviewDAO.prototype.addReview).not.toHaveBeenCalled()
        })
        test("RCU3: should throw 'ProductNotFoundError' in case of model not found in the db", async ()=>{
            jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(null)
            jest.spyOn(ReviewDAO.prototype, 'getReviewsByModelUser').mockResolvedValue([])

            let thrown = null
            try{
                await reviewController.addReview(inputParams.model, inputParams.user, inputParams.score, inputParams.comment)
            }
            catch (err){
                thrown = err
            }

            expect(thrown).toBeInstanceOf(ProductNotFoundError)
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled()
            expect(ReviewDAO.prototype.getReviewsByModelUser).toHaveBeenCalled()
            expect(ReviewDAO.prototype.addReview).not.toHaveBeenCalled()
        })
        test("RCU4: should throw 'ExistingReviewError' in case of review already existing", async ()=>{
            const existingReview = new ProductReview('test-model', 'test-user', 2, '2008-07-10', 'test-comment')
            jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(sampleProduct)
            jest.spyOn(ReviewDAO.prototype, 'getReviewsByModelUser').mockResolvedValue([existingReview])

            let thrown = null
            try{
                await reviewController.addReview(inputParams.model, inputParams.user, inputParams.score, inputParams.comment)
            }
            catch (err){
                thrown = err
            }

            expect(thrown).toBeInstanceOf(ExistingReviewError)
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled()
            expect(ReviewDAO.prototype.getReviewsByModelUser).toHaveBeenCalled()
            expect(ReviewDAO.prototype.addReview).not.toHaveBeenCalled()
        })
    })
    describe("testing method 'ReviewController.getProductReviews()'", ()=>{
        beforeEach(()=>{
            jest.spyOn(ReviewDAO.prototype, 'getReviewsByModel').mockReset()
        })
        const inputModel = 'test-model'
        const sampleReviews: ProductReview[] = []
        test("RCU5: should return the array of reviews associated with the model", async ()=>{
            jest.spyOn(ReviewDAO.prototype, 'getReviewsByModel').mockResolvedValue(sampleReviews)
            const result = await reviewController.getProductReviews(inputModel)
            expect(result).toBe(sampleReviews)
        })
    })
    describe("testing method 'ReviewController.deleteReview()'", ()=>{
        const inputParams ={
            model:'test-model',
            user: new User('test-username', 'test-name', 'test-surname', Role.CUSTOMER, 'test-address', '2005-06-04')
        }
        beforeEach(()=>{
            jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockReset()
            jest.spyOn(ReviewDAO.prototype, 'getReviewsByModelUser').mockReset()
            jest.spyOn(ReviewDAO.prototype, 'deleteReviewByModel').mockReset()
        })
        const sampleProduct = new Product(1,'test-model',Category.SMARTPHONE,'2023-09-02', 'test-details', 3)
        const sampleReview = new ProductReview('test-model', 'test-user', 2, '2008-07-10', 'test-comment')
        test("RCU6: should resolve to true", async ()=>{
            jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(sampleProduct)
            jest.spyOn(ReviewDAO.prototype, 'getReviewsByModelUser').mockResolvedValue([sampleReview])
            jest.spyOn(ReviewDAO.prototype, 'deleteReviewByModel').mockResolvedValue(true)
            const response = await reviewController.deleteReview(inputParams.model, inputParams.user)
            expect(response).toBe(true)
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled()
            expect(ReviewDAO.prototype.getReviewsByModelUser).toHaveBeenCalled()
            expect(ReviewDAO.prototype.deleteReviewByModel).toHaveBeenCalled()
            expect(ReviewDAO.prototype.deleteReviewByModel).toHaveBeenCalledWith(inputParams.model, inputParams.user)
        })
        test("RCU7: should throw 'ProductNotFoundError' in case of model=\"\"", async ()=>{
            const wrongInputParams = {...inputParams, model:""}
            jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(sampleProduct)
            jest.spyOn(ReviewDAO.prototype, 'getReviewsByModelUser').mockResolvedValue([sampleReview])

            let thrown = null
            try{
                await reviewController.deleteReview(wrongInputParams.model, wrongInputParams.user)
            }
            catch (err){
                thrown = err
            }
            expect(thrown).toBeInstanceOf(ProductNotFoundError)
            expect(ProductDAO.prototype.getProductByModel).not.toHaveBeenCalled()
            expect(ReviewDAO.prototype.getReviewsByModelUser).not.toHaveBeenCalled()
            expect(ReviewDAO.prototype.deleteReviewByModel).not.toHaveBeenCalled()
        })
        test("RCU8: should throw 'ProductNotFoundError' in case of model not found in the db", async ()=>{
            jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(null)
            jest.spyOn(ReviewDAO.prototype, 'getReviewsByModelUser').mockResolvedValue([sampleReview])

            let thrown = null
            try{
                await reviewController.deleteReview(inputParams.model, inputParams.user)
            }
            catch (err){
                thrown = err
            }
            expect(thrown).toBeInstanceOf(ProductNotFoundError)
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled()
            expect(ReviewDAO.prototype.getReviewsByModelUser).toHaveBeenCalled()
            expect(ReviewDAO.prototype.deleteReviewByModel).not.toHaveBeenCalled()
        })
        test("RCU9: should throw 'NoReviewProductError' in case of model not found in the db", async ()=>{
            jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(sampleProduct)
            jest.spyOn(ReviewDAO.prototype, 'getReviewsByModelUser').mockResolvedValue([])

            let thrown = null
            try{
                await reviewController.deleteReview(inputParams.model, inputParams.user)
            }
            catch (err){
                thrown = err
            }
            expect(thrown).toBeInstanceOf(NoReviewProductError)
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled()
            expect(ReviewDAO.prototype.getReviewsByModelUser).toHaveBeenCalled()
            expect(ReviewDAO.prototype.deleteReviewByModel).not.toHaveBeenCalled()
        })
    })
    describe("testing method 'ReviewController.deleteAllReviewsByModel()'", ()=>{
        const inputModel = 'test-model'
        const sampleProduct = new Product(1,'test-model',Category.SMARTPHONE,'2023-09-02', 'test-details', 3)
        beforeEach(()=>{
            jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockReset()
            jest.spyOn(ReviewDAO.prototype, 'deleteAllReviewsByModel').mockReset()
        })
        test("RCU10: should resolve to true", async ()=>{
            jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(sampleProduct)
            jest.spyOn(ReviewDAO.prototype, 'deleteAllReviewsByModel').mockResolvedValue(true)
            const response = await reviewController.deleteReviewsOfProduct(inputModel)
            expect(response).toBe(true)
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled()
            expect(ReviewDAO.prototype.deleteAllReviewsByModel).toHaveBeenCalled()
            expect(ReviewDAO.prototype.deleteAllReviewsByModel).toHaveBeenCalledWith(inputModel)
        })
        test("RCU11: should throw 'ProductNotFoundError' in case of model=\"\"", async ()=>{
            jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(sampleProduct)

            let thrown = null
            try{
                await reviewController.deleteReviewsOfProduct("")
            }
            catch (err){
                thrown = err
            }

            expect(thrown).toBeInstanceOf(ProductNotFoundError)
            expect(ProductDAO.prototype.getProductByModel).not.toHaveBeenCalled()
            expect(ReviewDAO.prototype.deleteAllReviewsByModel).not.toHaveBeenCalled()
        })
        test("RCU12: should throw 'ProductNotFoundError' in case of model not found in the db", async ()=>{
            jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(null)

            let thrown = null
            try{
                await reviewController.deleteReviewsOfProduct(inputModel)
            }
            catch (err){
                thrown = err
            }

            expect(thrown).toBeInstanceOf(ProductNotFoundError)
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled()
            expect(ReviewDAO.prototype.deleteAllReviewsByModel).not.toHaveBeenCalled()
        })
    })
    describe("testing method 'ReviewController.deleteAllReviews()'", ()=>{
        beforeEach(()=>{
            jest.spyOn(ReviewDAO.prototype, 'deleteAllReviews').mockReset()
        })
        test("RCU13: should return the array of reviews associated with the model", async ()=>{
            jest.spyOn(ReviewDAO.prototype, 'deleteAllReviews').mockResolvedValue(true)
            const result = await reviewController.deleteAllReviews()
            expect(result).toBe(true)
        })
    })
})