import { describe, test, expect, beforeAll,beforeEach, afterAll, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import ProductController from "../../src/controllers/productController"
import Authenticator from "../../src/routers/auth"
import ErrorHandler from "../../src/helper"
import { Product, Category } from "../../src/components/product"
const baseURL = "/ezelectronics"

//For unit tests, we need to validate the internal logic of a single component, without the need to test the interaction with other components
//For this purpose, we mock (simulate) the dependencies of the component we are testing
jest.mock("../../src/controllers/productController")
jest.mock("../../src/routers/auth")

let testProduct = new Product(1,"model", Category.SMARTPHONE,"2021-01-01","details",1);
beforeEach(() => {
    jest.clearAllMocks();
});


describe("Route unit tests", () => {
    
    describe("POST /products", () => {
            test("PRU1: It should return a 200 success code", async () => {
                
                jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                        return next()
                })
                jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce(true)
                jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                    return next();
                })
                jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                    return next();
                })
                
                const response = await request(app).post(baseURL + "/products").send(testProduct)
                expect(response.status).toBe(200)
                expect(ProductController.prototype.registerProducts).toHaveBeenCalled()
                expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate)
                })
            test("PRU2: It should fail if the user is not an Admin or Manager", async () => {
                
                jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                        return next()
                })
                jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce(true)
                jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                    return next();
                })
                jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                    return res.status(401).json({ error: "Unauthorized" });
                })
                const response = await request(app).post(baseURL + "/products").send(testProduct)
                expect(response.status).toBe(401)
            })
            test("PRU3: It should fail if not logged in", async () => {
                
                jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                        return next()
                })
                jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce(true)
                jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                    return res.status(401).json({ error: "Unauthorized" });
                })
                jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                    return next();
                })
                const response = await request(app).post(baseURL + "/products").send(testProduct)
                expect(response.status).toBe(401)
            })
    })
    describe("PATCH /products/:model", () => {
        test("PRU4: It should return a 200 success code", async () => {
            jest.setTimeout(90000);
            const inputProduct = { quantity: 2, changeDate: "2021-01-02" }
            
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                    return next()
            })
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(1)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
            const response = await request(app).patch(baseURL + "/products/model").send(inputProduct)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalled()
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith("model", inputProduct.quantity, inputProduct.changeDate)
        })
        test("PRU5: It should fail if the user is not an Admin or Manager", async () => {
            const inputProduct = { quantity: 2, changeDate: "2021-01-02" }
            
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                    return next()
            })
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(1)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })
            const response = await request(app).patch(baseURL + "/products/model").send(inputProduct)
            expect(response.status).toBe(401)
        })

        test("PRU6: It should fail if not logged in", async () => {
            const inputProduct = { quantity: 2, changeDate: "2021-01-02" }
            
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                    return next()
            })
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(1)
            
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })
            const response = await request(app).patch(baseURL + "/products/model").send(inputProduct)
            expect(response.status).toBe(401)
        })
    })
    describe("PATCH /products/:model/sell", () => {
        test("PRU7: It should return a 200 success code", async () => {
            
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                    return next()
            })
            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
            const response = await request(app).patch(baseURL + "/products/model/sell").send({sellingDate: '2021-01-01', quantity: 1})
            expect(response.status).toBe(200)
            expect(ProductController.prototype.sellProduct).toHaveBeenCalled()
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith("model", 1, '2021-01-01')
        })

        test("PRU8: It should fail if the user is not an Admin or Manager", async () => {
            
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                    return next()
            })
            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })
            const response = await request(app).patch(baseURL + "/products/model/sell").send({sellingDate: '2021-01-01', quantity: 1})
            expect(response.status).toBe(401)
        })

        test("PRU9: It should fail if not logged in", async () => {
            
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                    return next()
            })
            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })
            const response = await request(app).patch(baseURL + "/products/model/sell").send({sellingDate: '2021-01-01', quantity: 1})
            expect(response.status).toBe(401)
        })

        test("PRU10: It should fail if the quantity is not a number", async () => {
            
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                    return next()
            })
            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
            const response = await request(app).patch(baseURL + "/products/model/sell").send({sellingDate: '2021-01-01', quantity: "not a number"})
            expect(response.status).toBe(422)
        })

        test("PRU11: It should fail if the selling date is not a date", async () => {
            
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                    return next()
            })
            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
            const response = await request(app).patch(baseURL + "/products/model/sell").send({sellingDate: 'not a date', quantity: 1})
            expect(response.status).toBe(422)
        })
    })

    describe("GET /products", () => {
        test("PRU12: It returns an array of products", async () => {
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct])
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })


            const response = await request(app).get(baseURL + "/products")
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getProducts).toHaveBeenCalled()

        })
        test("PRU13: It should fail if the user is not an Admin or Manager", async () => {
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct])
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })

            const response = await request(app).get(baseURL + "/products")
            expect(response.status).toBe(401)
        })

        test("PRU14: It should fail if not logged in", async () => {
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct])
            
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })

            const response = await request(app).get(baseURL + "/products")
            expect(response.status).toBe(401)
        })
            
    })

    describe("GET /products/:grouping/:value", () => {
        test("PRU15: It returns an array of products", async () => {
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct])
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).get(baseURL + "/products").query({grouping: "category",  category: "Smartphone"})
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getProducts).toHaveBeenCalled()
        })
        test("PRU16: It should fail if the user is not an Admin or Manager", async () => {
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct])
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })

            const response = await request(app).get(baseURL + "/products/").query({grouping: "category",  category: "Smartphone"})
            expect(response.status).toBe(401)
        })

        test("PRU17: It should fail if not logged in", async () => {
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct])
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })

            const response = await request(app).get(baseURL + "/products/").query({grouping: "category",  category: "Smartphone"})
            expect(response.status).toBe(401)
        }
        )
        test("PRU18: It should fail if the grouping is not 'category' or 'model'", async () => {
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct])
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
        })
            

            const response = await request(app).get(baseURL + "/products/").query({grouping: "invalid", category: "Smartphone"})
            expect(response.status).toBe(422)
        })
        test("PRU19: It should fail if the category is not a valid category", async () => {
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct])
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
            const response = await request(app).get(baseURL + "/products/").query({grouping: "category", category: "invalid"})
            expect(response.status).toBe(422)
        })

        test("PRU20: It should fail if the model is empty", async () => {
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct])
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
            const response = await request(app).get(baseURL + "/products/").query({grouping: "model", model: ""})
            expect(response.status).toBe(422)
        })
    })

    describe("GET /products/available", () => {
        test("PRU21: It returns an array of products", async () => {
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([testProduct])
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })

            const response = await request(app).get(baseURL + "/products/available")
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalled()
        })
        test("PRU22: It should fail if not logged in", async () => {
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([testProduct])
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).send()
            })

            const response = await request(app).get(baseURL + "/products/available")
            expect(response.status).toBe(401)
        })
    })
    describe("GET /products/available/category/:category", () => {
        test("PRU23: It returns an array of products", async () => {
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([testProduct])
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            const response = await request(app).get(baseURL + "/products/available").query({grouping: "category",  category: "Smartphone"})
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalled()
        })

        test("PRU24: It should fail if not logged in", async () => {
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([testProduct])
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).send()
            })

            const response = await request(app).get(baseURL + "/products/available").query({grouping: "category",  category: "Smartphone"})
            expect(response.status).toBe(401)
        })
    })

    describe("GET /products/available/model/:model", () => {
        test("PRU25: It returns a product", async () => {
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([testProduct])
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            const response = await request(app).get(baseURL + "/products/available").query({grouping: "model", model: "model"})
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalled()
        })


        test("PRU26: It should fail if not logged in", async () => {
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([testProduct])
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).send()
            })

            const response = await request(app).get(baseURL + "/products/available").query({grouping: "model", model: "model"})
            expect(response.status).toBe(401)
        })


    })


    describe("DELETE /products", () => {
        test("PRU27: It should return a 200 success code", async () => {
            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
            const response = await request(app).delete(baseURL + "/products")
            expect(response.status).toBe(200)
            expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalled()
        })
        test("PRU28: It should fail if the user is not an Admin or Manager", async () => {
            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).send()
            })
            const response = await request(app).delete(baseURL + "/products")
            expect(response.status).toBe(401)
        })

        test("PRU29: It should fail if not logged in", async () => {   
            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).send()
            })
            const response = await request(app).delete(baseURL + "/products")
            expect(response.status).toBe(401)
        })

    })

    describe("DELETE /products/:model", () => {
        test("PRU30: It should return a 200 success code", async () => {
            
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                    return next()
            })
            jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })

            const response = await request(app).delete(baseURL + "/products/model").send(testProduct)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalled()
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith("model")
        })
        test("PRU31: It should fail if the user is not an Admin or Manager", async () => {
            
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                    return next()
            })
            jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).send()
            })
            const response = await request(app).delete(baseURL + "/products/model").send(testProduct)
            expect(response.status).toBe(401)
        })

        test("PRU32: It should fail if not logged in", async () => {
            
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                    return next()
            })
            jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true)

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).send()
            })
            const response = await request(app).delete(baseURL + "/products/model").send(testProduct)
            expect(response.status).toBe(401)
        })
    })
})


