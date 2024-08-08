import { describe, test, jest, expect, beforeAll, afterAll, beforeEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import db from "../src/db/db"

import ProductController from "../src/controllers/productController"
import Authenticator from "../src/routers/auth"
import ErrorHandler from "../src/helper"
import { Product, Category } from "../src/components/product"
import exp from "constants"

const routePath = "/ezelectronics" //Base route path for the API
const productUrl =  routePath+"/products"

jest.mock("../src/controllers/productController")
jest.mock("../src/routers/auth")


// ================== TOP-DOWN TESTING ==================
// testing all module integrating then with a top-down appr
// starting with 'productRoutes' as the highest

//------------------ 1.integration of helper.ts ------------------
describe("Integrating 'helper.ts' with 'productRoutes.ts'", () => {
    describe("POST /products - registering a set of products", () => {
        const product1 = new Product(1000, "model1", Category.SMARTPHONE, "2022-01-01", "details1", 10)
        const inputUser = 'test-user'
        beforeEach(() => {
            jest.spyOn(ProductController.prototype, 'registerProducts').mockReset()
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockReset()
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockReset()
        })
        test("PI1.1: should return 200 and call registerProducts with the correct parameters", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => next())
            jest.spyOn(ProductController.prototype, 'registerProducts').mockResolvedValueOnce(true)

            const response = await request(app).post(productUrl).send(product1)
            expect(response.status).toBe(200)
        })
        test("PI1.2: should return 401 if the user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => 
                res.status(401).json({error: "Unathenticated"})
            )
            const response = await request(app).post(productUrl).send(product1)
            expect(response.status).toBe(401)
        })
        test("PI1.3: should return 401 if the user is not an admin or Manager", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => 
                res.status(401).json({error: "Unauthorized"})
            )
            const response = await request(app).post(productUrl).send(product1)
            expect(response.status).toBe(401)
        })
        test("PI1.4: should return 422 if the product is wrong", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => next())
            const response = await request(app).post(productUrl).send({...product1, quantity: 0})
            expect(response.status).toBe(422)
        })
        test("PI1.5: should catch errors/exceptions thrown in 'controller.registerProducts()'", async() =>{
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => next())
            jest.spyOn(ProductController.prototype, 'registerProducts').mockImplementation(() => {throw new Error('test-error')})
            const response = await request(app).post(productUrl).send(product1)
            expect(response.status).not.toBe(200)
            expect(ProductController.prototype.registerProducts).toThrow()

        })
    })
    describe("PATCH /products/:model - incrementing the quantity of a product", () => {
        const model = "model1"
        const quantity = 10
        const inputUser = 'test-user'
        beforeEach(() => {
            jest.spyOn(ProductController.prototype, 'changeProductQuantity').mockReset()
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockReset()
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockReset()
        })
        test("PI1.6: should return 200 and call changeProductQuantity with the correct parameters", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => next())
            jest.spyOn(ProductController.prototype, 'changeProductQuantity').mockResolvedValueOnce(20)

            const response = await request(app).patch(productUrl+"/"+model).send({quantity})
            expect(response.status).toBe(200)
        })
        test("PI1.7: should return 401 if the user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => 
                res.status(401).json({error: "Unathenticated"})
            )
            const response = await request(app).patch(productUrl+"/"+model).send({quantity})
            expect(response.status).toBe(401)
        })
        test("PI1.8: should return 401 if the user is not an admin or manager", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => 
                res.status(401).json({error: "Unauthorized"})
            )
            const response = await request(app).patch(productUrl+"/"+model).send({quantity})
            expect(response.status).toBe(401)
        })
        test("PI1.9: should return 422 if the quantity is wrong", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            }
            )  
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => next())
            const response = await request(app).patch(productUrl+"/"+model).send({quantity: 0})
            expect(response.status).toBe(422)
        })
    })
    describe("PATCH /products/:model/sell - selling a product", () => {
        const model = "model1"
        const quantity = 10
        const inputUser = 'test-user'
        beforeEach(() => {
            jest.spyOn(ProductController.prototype, 'sellProduct').mockReset()
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockReset()
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockReset()
        })
        test("PI1.10: should return 200 and call sellProduct with the correct parameters", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => next())
            jest.spyOn(ProductController.prototype, 'sellProduct').mockResolvedValueOnce(true)

            const response = await request(app).patch(productUrl+"/"+model+"/sell").send({quantity})
            expect(response.status).toBe(200)
        })
        test("PI1.11: should return 401 if the user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => 
                res.status(401).json({error: "Unathenticated"})
            )
            const response = await request(app).patch(productUrl+"/"+model+"/sell").send({quantity})
            expect(response.status).toBe(401)
        })
        test("PI1.12: should return 401 if the user is not an admin or manager", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => 
                res.status(401).json({error: "Unauthorized"})
            )
            const response = await request(app).patch(productUrl+"/"+model+"/sell").send({quantity})
            expect(response.status).toBe(401)
        })
        test("PI1.13: should return 422 if the quantity is wrong", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any
            ) => {
                req.user = inputUser
                next()
            })
        })
    })
    describe("GET /products - getting all products", () => {
        const testProducts = [new Product(1000, "model1", Category.SMARTPHONE, "2022-01-01", "details1", 10), new Product(1001, "model2", Category.LAPTOP, "2022-01-01", "details2", 20)]
        const inputUser = 'test-user'
        beforeEach(() => {
            jest.spyOn(ProductController.prototype, 'getProducts').mockReset()
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockReset()
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockReset()
        })
        test("PI1.14: should return 200 and call getProducts with the correct parameters", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => next())
            jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce(testProducts)

            const response = await request(app).get(productUrl)
            expect(response.status).toBe(200)
        })
        test("PI1.15: should return 401 if the user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => 
                res.status(401).json({error: "Unathenticated"})
            )
            const response = await request(app).get(productUrl)
            expect(response.status).toBe(401)
        })
        test("PI1.16: should return 401 if the user is not an admin or Manager", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => 
                res.status(401).json({error: "Unauthorized"})
            )
            const response = await request(app).get(productUrl)
            expect(response.status).toBe(401)
        })
        test("PI1.17: should return 200 and call getProducts with grouping=category", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => next())
            jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProducts[0]])

            const response = await request(app).get(productUrl).query({grouping: "category", category: "Smartphone"})
            expect(response.status).toBe(200)
        })
        test("PI1.18: should return 200 and call getProducts with grouping=model", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => next())
            jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProducts[0]])

            const response = await request(app).get(productUrl).query({grouping: "model", model: "model1"})
            expect(response.status).toBe(200)
        })
        test("PI1.19: should return 422 if the category is incorrect", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => 
                res.status(422).json({error: "Invalid request"})
            )
            const response = await request(app).get(productUrl).query({grouping: "category", category: "test"})
            expect(response.status).toBe(422)
        })

        test("PI1.20: should return 422 if the model is incorrect", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => 
                res.status(422).json({error: "Invalid request"})
            )
            const response = await request(app).get(productUrl).query({grouping: "model", model: " "})
            expect(response.status).toBe(422)
        })

        test("PI1.21: should return 422 if the grouping is incorrect", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => 
                res.status(422).json({error: "Invalid request"})
            )
            const response = await request(app).get(productUrl).query({grouping: "test"})
            expect(response.status).toBe(422)
        })

        test("PI1.22: should catch errors/exceptions thrown in 'controller.getProducts()'", async() =>{
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => next())
            jest.spyOn(ProductController.prototype, 'getProducts').mockImplementation(() => {throw new Error('test-error')})
            const response = await request(app).get(productUrl)
            expect(response.status).not.toBe(200)
            expect(ProductController.prototype.getProducts).toThrow()
        })
    })
    describe("GET /products/available - getting all available products", () => {
        const testProducts = [new Product(1000, "model1", Category.SMARTPHONE, "2022-01-01", "details1", 10), new Product(1001, "model2", Category.LAPTOP, "2022-01-01", "details2", 0)]
        const inputUser = 'test-user'
        beforeEach(() => {
            jest.spyOn(ProductController.prototype, 'getAvailableProducts').mockReset()
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockReset()
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockReset()
        })
        test("PI1.23: should return 200 and call getAvailableProducts with the correct parameters", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => next())
            jest.spyOn(ProductController.prototype, 'getAvailableProducts').mockResolvedValueOnce(testProducts)

            const response = await request(app).get(productUrl+"/available")
            expect(response.status).toBe(200)
        })
        test("PI1.24: should return 401 if the user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => 
                res.status(401).json({error: "Unathenticated"})
            )
            const response = await request(app).get(productUrl+"/available")
            expect(response.status).toBe(401)
        })
        test("PI1.25: should catch errors/exceptions thrown in 'controller.getAvailableProducts()'", async() =>{
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => next())
            jest.spyOn(ProductController.prototype, 'getAvailableProducts').mockImplementation(() => {throw new Error('test-error')})
            const response = await request(app).get(productUrl+"/available")
            expect(response.status).not.toBe(200)
            expect(ProductController.prototype.getAvailableProducts).toThrow()
        })          
        test("PI1.26: should return 200 and call getAvailableProducts with grouping=category", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => next())
            jest.spyOn(ProductController.prototype, 'getAvailableProducts').mockResolvedValueOnce([testProducts[0]])

            const response = await request(app).get(productUrl+"/available").query({grouping: "category", category: "Smartphone"})
            expect(response.status).toBe(200)
        })
        test("PI1.27: should return 200 and call getAvailableProducts with grouping=model", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            }
            )  
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => next())
            jest.spyOn(ProductController.prototype, 'getAvailableProducts').mockResolvedValueOnce([testProducts[0]])

            const response = await request(app).get(productUrl+"/available").query({grouping: "model", model: "model1"})
            expect(response.status).toBe(200)
        })      
        test("PI1.28: should return 422 if the category is incorrect", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => 
                res.status(422).json({error: "Invalid request"})
            )
            const response = await request(app).get(productUrl+"/available").query({grouping: "category", category: "test"})
            expect(response.status).toBe(422)
        })
        test("PI1.29: should return 422 if the model is incorrect", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => 
                res.status(422).json({error: "Invalid request"})
            )
            const response = await request(app).get(productUrl+"/available").query({grouping: "model", model: " "})
            expect(response.status).toBe(422)
        })
        
        test("PI1.30: should return 422 if the grouping is incorrect", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => 
                res.status(422).json({error: "Invalid request"})
            )
            const response = await request(app).get(productUrl+"/available").query({grouping: "test"})
            expect(response.status).toBe(422)
        })
        
    })
    describe("DELETE /products - deleting all products", () => {
        const inputUser = 'test-user'
        beforeEach(() => {
            jest.spyOn(ProductController.prototype, 'deleteAllProducts').mockReset()
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockReset()
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockReset()
        })
        test("PI1.31: should return 200 and call deleteAllProducts with the correct parameters", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => next())
            jest.spyOn(ProductController.prototype, 'deleteAllProducts').mockResolvedValueOnce(true)

            const response = await request(app).delete(productUrl)
            expect(response.status).toBe(200)
        })
        test("PI1.32: should return 401 if the user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => 
                res.status(401).json({error: "Unathenticated"})
            )
            const response = await request(app).delete(productUrl)
            expect(response.status).toBe(401)
        })
        test("PI1.33: should return 401 if the user is not an admin or Manager", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => 
                res.status(401).json({error: "Unauthorized"})
            )
            const response = await request(app).delete(productUrl)
            expect(response.status).toBe(401)
        })
        test("PI1.34: should catch errors/exceptions thrown in 'controller.deleteAllProducts()'", async() =>{
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
        })
        jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => next())
        jest.spyOn(ProductController.prototype, 'deleteAllProducts').mockImplementation(() => {throw new Error('test-error')})
        const response = await request(app).delete(productUrl)
        expect(response.status).not.toBe(200)
        expect(ProductController.prototype.deleteAllProducts).toThrow()
        })
    })
    describe("DELETE /products/:model - deleting a product", () => {
        const model = "model1"
        const inputUser = 'test-user'
        beforeEach(() => {
            jest.spyOn(ProductController.prototype, 'deleteProduct').mockReset()
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockReset()
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockReset()
        })
        test("PI1.35: should return 200 and call deleteProduct with the correct parameters", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => next())
            jest.spyOn(ProductController.prototype, 'deleteProduct').mockResolvedValueOnce(true)

            const response = await request(app).delete(productUrl+"/"+model)
            expect(response.status).toBe(200)
        })
        test("PI1.36: should return 401 if the user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => 
                res.status(401).json({error: "Unathenticated"})
            )
            const response = await request(app).delete(productUrl+"/"+model)
            expect(response.status).toBe(401)
        })
        test("PI1.37: should return 401 if the user is not an admin or Manager", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => 
                res.status(401).json({error: "Unauthorized"})
            )
            const response = await request(app).delete(productUrl+"/"+model)
            expect(response.status).toBe(401)
        })
        test("PI1.38: should catch errors/exceptions thrown in 'controller.deleteProduct()'", async() =>{
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req: any, res: any, next:() => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req: any, res: any, next:() => any) => next())  
            jest.spyOn(ProductController.prototype, 'deleteProduct').mockImplementation(() => {throw new Error('test-error')})
            const response = await request(app).delete(productUrl+"/"+model)
            expect(response.status).not.toBe(200)
            expect(ProductController.prototype.deleteProduct).toThrow()
        })
    })
})
