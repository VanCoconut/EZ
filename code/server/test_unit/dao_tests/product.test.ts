import { describe, test, expect, beforeAll,beforeEach, afterAll, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import ProductController from "../../src/controllers/productController"
import ProductDAO from "../../src/dao/productDAO";
import CartDAO from "../../src/dao/cartDAO";
import Authenticator from "../../src/routers/auth"
import { Role, User } from "../../src/components/user"
import ErrorHandler from "../../src/helper"
import { DateError } from "../../src/utilities"
import {
    ProductNotFoundError,
    ProductAlreadyExistsError,
    ProductSoldError,
    LowProductStockError,
    IncorrectNullGrouping, IncorrectCategoryGrouping, IncorrectModelGrouping
} from "../../src/errors/productError";

import { Product, Category } from "../../src/components/product"
import { DESTRUCTION } from "dns"
import { mock } from "node:test"
import { access } from "fs"

import dayjs from 'dayjs';
import { error } from "console";
import db from "../../src/db/db";
import exp from "constants";
import {Database} from "sqlite3"
const baseURL = "/ezelectronics"


// jest.mock("../../src/dao/productDAO")
jest.mock("../../src/db/db.ts")
beforeEach(() => {
    jest.clearAllMocks();
});

const testProduct = new Product(100, "model", Category.SMARTPHONE, "2021-01-01", "details", 1 )


describe("Product DAO unit tests", () => {
    describe("createProduct", () => {
        test("PDU1: It should return true when the product is created successfully", async () => {
           jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });

            const dao = new ProductDAO();
            const result = await dao.createProduct(
                testProduct.model,
                testProduct.category,
                testProduct.quantity,
                testProduct.details,
                testProduct.sellingPrice,
                testProduct.arrivalDate
            );

            expect(result).toBe(true); 
            expect(db.run).toHaveBeenCalledTimes(1); 
            expect(db.run).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining([
                    testProduct.model,
                    testProduct.category,
                    testProduct.arrivalDate,
                    testProduct.details,
                    testProduct.quantity,
                    testProduct.sellingPrice
                ]),
                expect.any(Function)
            );
        });

        test("PDU2: It should reject with an error when the database operation fails", async () => {
            const errorMessage = "Database error";

            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error(errorMessage)); 
                return {} as Database
            });

            const dao = new ProductDAO();

            await expect(dao.createProduct(
                testProduct.model,
                testProduct.category,
                testProduct.quantity,
                testProduct.details,
                testProduct.sellingPrice,
                testProduct.arrivalDate
            )).rejects.toThrow(errorMessage); 

            expect(db.run).toHaveBeenCalledTimes(1); 
            expect(db.run).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining([
                    testProduct.model,
                    testProduct.category,
                    testProduct.arrivalDate,
                    testProduct.details,
                    testProduct.quantity,
                    testProduct.sellingPrice
                ]),
                expect.any(Function)
            );
        });

        test("PDU3: It should reject with an error when the product already exists", async () => {
            const errorMessage = "Product already exists";

            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error(errorMessage)); 
                return {} as Database
            });

            const dao = new ProductDAO();

            await expect(dao.createProduct(
                testProduct.model,
                testProduct.category,
                testProduct.quantity,
                testProduct.details,
                testProduct.sellingPrice,
                testProduct.arrivalDate
            )).rejects.toThrow(errorMessage); 

            expect(db.run).toHaveBeenCalledTimes(1); 
            expect(db.run).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining([
                    testProduct.model,
                    testProduct.category,
                    testProduct.arrivalDate,
                    testProduct.details,
                    testProduct.quantity,
                    testProduct.sellingPrice
                ]),
                expect.any(Function)
            );
        });
    });
    describe("addModels", () => {
        test("PDU4: It should return true when the quantity is increased successfully", async () => {
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback.call({ changes: 1 }, null);
                return {} as Database
            });

            const dao = new ProductDAO();
            const result = await dao.addModels(
                testProduct.model,
                3
            );

            expect(result).toBe(true); 
            expect(db.run).toHaveBeenCalledTimes(1); 
            expect(db.run).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining([
                    3,
                    testProduct.model
                ]),
                expect.any(Function)
            );
        });

        test("PDU5: It should reject with an error when the database operation fails", async () => {
            const errorMessage = "Database error";

            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error(errorMessage)); 
                return {} as Database
            });

            const dao = new ProductDAO();

            await expect(dao.addModels(
                testProduct.model,
                3
            )).rejects.toThrow(errorMessage); 

            expect(db.run).toHaveBeenCalledTimes(1); 
            expect(db.run).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining([
                    3,
                    testProduct.model
                ]),
                expect.any(Function)
            );
        });    
        
        test("PDU6: It should return false when the product is not found", async () => {
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback.call({ changes: 0 }, null);
                return {} as Database
            });

            const dao = new ProductDAO();
            const result = await dao.addModels(
                testProduct.model,
                3
            );

            expect(result).toBe(false); 
            expect(db.run).toHaveBeenCalledTimes(1); 
            expect(db.run).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining([
                    3,
                    testProduct.model
                ]),
                expect.any(Function)
            );
        });
    })

    describe("sellModels", () => {
        test("PDU7: It should return true when the quantity is decreased successfully", async () => {
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback.call({ changes: 1 }, null);
                return {} as Database
            });

            const dao = new ProductDAO();
            const result = await dao.sellModels(
                testProduct.model,
                3
            );

            expect(result).toBe(true); 
            expect(db.run).toHaveBeenCalledTimes(1); 
            expect(db.run).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining([
                    3,
                    testProduct.model
                ]),
                expect.any(Function)
            );
        });

        test("PDU8: It should reject with an error when the database operation fails", async () => {
            const errorMessage = "Database error";

            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error(errorMessage)); 
                return {} as Database
            });

            const dao = new ProductDAO();

            await expect(dao.sellModels(
                testProduct.model,
                3
            )).rejects.toThrow(errorMessage); 

            expect(db.run).toHaveBeenCalledTimes(1); 
            expect(db.run).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining([
                    3,
                    testProduct.model
                ]),
                expect.any(Function)
            );
        });    
        
        test("PDU9: It should return false when the product is not found", async () => {
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback.call({ changes: 0 }, null);
                return {} as Database
            });

            const dao = new ProductDAO();
            const result = await dao.sellModels(
                testProduct.model,
                3
            );

            expect(result).toBe(false); 
            expect(db.run).toHaveBeenCalledTimes(1); 
            expect(db.run).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining([
                    3,
                    testProduct.model
                ]),
                expect.any(Function)
            );
        });
    })

    describe("getAllProducts", () => { 
        test("PDU10: It should return an array of products", async () => {
            const products = [
                new Product(100, "model1", Category.SMARTPHONE, "2021-01-01", "details", 1),
                new Product(101, "model2", Category.LAPTOP, "2021-01-01", "details", 1)
            ];

            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, products)
                return {} as Database
            });

            const dao = new ProductDAO();
            const result = await dao.getAllProducts();

            expect(result).toEqual(products); 
            expect(db.all).toHaveBeenCalledTimes(1); 
            expect(db.all).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Array),
                expect.any(Function)

            );
        });

        test("PDU11: It should reject with an error when the database operation fails", async () => {
            const errorMessage = "Database error";

            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error(errorMessage), null);
                return {} as Database
            });

            const dao = new ProductDAO();

            await expect(dao.getAllProducts()).rejects.toThrow(errorMessage); 

            expect(db.all).toHaveBeenCalledTimes(1); 
            expect(db.all).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Array),
                expect.any(Function)

            );
        });        
    })

    describe("getProductsByCategory", () => {
        test("PDU12: It should return an array of products", async () => {
            const products = [
                new Product(100, "model1", Category.SMARTPHONE, "2021-01-01", "details", 1),
                new Product(101, "model2", Category.SMARTPHONE, "2021-01-01", "details", 1)
            ];

            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, products)
                return {} as Database
            });

            const dao = new ProductDAO();
            const result = await dao.getProductsByCategory(Category.SMARTPHONE);

            expect(result).toEqual(products); 
            expect(db.all).toHaveBeenCalledTimes(1); 
            expect(db.all).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining(Category.SMARTPHONE),
                expect.any(Function)
            );
        });

        test("PDU13: It should reject with an error when the database operation fails", async () => {
            const errorMessage = "Database error";

            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error(errorMessage),null); 
                return {} as Database
            });

            const dao = new ProductDAO();

            await expect(dao.getProductsByCategory(Category.SMARTPHONE)).rejects.toThrow(errorMessage); 

            expect(db.all).toHaveBeenCalledTimes(1); 
            expect(db.all).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining(Category.SMARTPHONE),
                expect.any(Function)
            );
        });

    })

    describe("getProductByModel", () => {
        test("PDU14: It should return a product", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, testProduct)
                return {} as Database
            });

            const dao = new ProductDAO();
            const result = await dao.getProductByModel(testProduct.model);

            expect(result).toEqual(testProduct); 
            expect(db.get).toHaveBeenCalledTimes(1); 
            expect(db.get).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining([
                    testProduct.model
                ]),
                expect.any(Function)
            );
        }); 

        test("PDU15: It should return null when the product is not found", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, undefined)
                return {} as Database
            });

            const dao = new ProductDAO();
            const result = await dao.getProductByModel(testProduct.model);

            expect(result).toBeNull(); 
            expect(db.get).toHaveBeenCalledTimes(1); 
            expect(db.get).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining([
                    testProduct.model
                ]),
                expect.any(Function)
            );
        });
    })

    describe("deleteModel", () => {
        test("PDU16: It should return true when the product is deleted successfully", async () => {
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback.call({ changes: 1 }, null)
                return {} as Database
            });

            const dao = new ProductDAO();
            const result = await dao.deleteModel(testProduct.model);

            expect(result).toBe(true); 
            expect(db.run).toHaveBeenCalledTimes(1); 
            expect(db.run).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining([
                    testProduct.model
                ]),
                expect.any(Function)
            );
        });

        test("PDU17: It should return false when the product is not found", async () => {
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback.call({ changes: 0 }, null)
                return {} as Database
            });

            const dao = new ProductDAO();
            const result = await dao.deleteModel(testProduct.model);

            expect(result).toBe(false); 
            expect(db.run).toHaveBeenCalledTimes(1); 
            expect(db.run).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining([
                    testProduct.model
                ]),
                expect.any(Function)
            );
        });
        test("PDU18: It should reject with an error when the database operation fails", async () => {
            const errorMessage = "Database error";

            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error(errorMessage)); 
                return {} as Database
            });

            const dao = new ProductDAO();

            await expect(dao.deleteModel(testProduct.model)).rejects.toThrow(errorMessage); 

            expect(db.run).toHaveBeenCalledTimes(1); 
            expect(db.run).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining([
                    testProduct.model
                ]),
                expect.any(Function)
            );
        });

    })

    describe("deleteAllProducts", () => {
        test("PDU19: It should return true when all products are deleted successfully", async () => {
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });

            const dao = new ProductDAO();
            const result = await dao.deleteAllProducts();

            expect(result).toBe(null); 
            expect(db.run).toHaveBeenCalledTimes(1); 
            expect(db.run).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Array),
                expect.any(Function)
            );
        });

        test("PDU20: It should reject with an error when the database operation fails", async () => {
            const errorMessage = "Database error";

            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error(errorMessage)); 
                return {} as Database
            });

            const dao = new ProductDAO();

            await expect(dao.deleteAllProducts()).rejects.toThrow(errorMessage); 

            expect(db.run).toHaveBeenCalledTimes(1); 
            expect(db.run).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Array),
                expect.any(Function)
            );
        })
    })     
})

