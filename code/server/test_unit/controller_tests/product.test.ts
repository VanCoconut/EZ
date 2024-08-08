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

const baseURL = "/ezelectronics"

//For unit tests, we need to validate the internal logic of a single component, without the need to test the interaction with other components
//For this purpose, we mock (simulate) the dependencies of the component we are testing
// jest.mock("../../src/controllers/productController")
// jest.mock("../../src/routers/auth")
const inputProduct = { model: "test", category: "Smartphone", quantity: 10, details: "test", sellingPrice: 100, arrivalDate: "2022-01-01" }

beforeEach(() => {
    jest.clearAllMocks();
});

describe("Controller unit tests", () => {
    describe("registerProducts", () => {
        test("PCU1: It should return true", async () => {      
            jest.spyOn(dayjs.prototype, 'isAfter').mockReturnValue(false);
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(null)
            jest.spyOn(ProductDAO.prototype, "createProduct").mockResolvedValueOnce(true)
            const controller = new ProductController()

            const response = await controller.registerProducts(inputProduct.model, inputProduct.category, inputProduct.quantity, inputProduct.details, inputProduct.sellingPrice, inputProduct.arrivalDate)
            
            expect(response).toBe(true)
            expect(dayjs.prototype.isAfter).toHaveBeenCalled()
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled()
            expect(ProductDAO.prototype.createProduct).toHaveBeenCalled()
            expect(ProductDAO.prototype.createProduct).toHaveBeenCalledWith(inputProduct.model, inputProduct.category, inputProduct.quantity, inputProduct.details, inputProduct.sellingPrice, inputProduct.arrivalDate)
        })

        test("PCU2: It should throw DateError if arrivalDate is in the future", async () => {
            jest.spyOn(dayjs.prototype, 'isAfter').mockReturnValue(true);

            const controller = new ProductController();

            // Verifica se lancia l'errore DateError
            await controller.registerProducts('model1', 'category1', 10, 'details', 100, '2030-01-01')
                .catch(err => {
                    expect(err).toBeInstanceOf(DateError);
                });
            
            expect(dayjs.prototype.isAfter).toHaveBeenCalled();
            

        });

        test("PCU3: It should throw ProductAlreadyExistsError if the product already exists", async () => {

            jest.spyOn(dayjs.prototype, 'isAfter').mockReturnValue(false);
            jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValueOnce(new Product(100, 'model1', Category.SMARTPHONE, '2022-01-01', 'details', 10));

            const controller = new ProductController();

            // Verifica se lancia l'errore ProductAlreadyExistsError
            await controller.registerProducts('model1', 'category1', 10, 'details', 100, '2022-01-01')
                .catch(err => {
                    expect(err).toBeInstanceOf(ProductAlreadyExistsError);
                });
            expect(dayjs.prototype.isAfter).toHaveBeenCalled();
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith('model1');
        });
    })
    describe("changeProductQuantity", () => {
        test("PCU4: It should return the new quantity", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(new Product(inputProduct.sellingPrice, inputProduct.model, Category.SMARTPHONE, inputProduct.arrivalDate, inputProduct.details, inputProduct.quantity))
            jest.spyOn(ProductDAO.prototype, "addModels").mockResolvedValueOnce(true)
            const quantity = 10;
            const changeDate = "2022-01-01"
            const controller = new ProductController()
            const response = await controller.changeProductQuantity(inputProduct.model, quantity, changeDate)
            expect(response).toBe(inputProduct.quantity+quantity)
        })

        test("PCU5: It should throw ProductNotFoundError if the product does not exist", async () => {
            const controller = new ProductController()
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(null)
            await controller.changeProductQuantity(inputProduct.model, 10, "2022-01-01")
                .catch(err => {
                    expect(err).toBeInstanceOf(ProductNotFoundError)
                })
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled()
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(inputProduct.model)
        })

        test("PCU6: It should throw DateError if changeDate is in the future", async () => {
            const controller = new ProductController()
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(new Product(inputProduct.sellingPrice, inputProduct.model, Category.SMARTPHONE, inputProduct.arrivalDate, inputProduct.details, inputProduct.quantity))
            jest.spyOn(dayjs.prototype, 'isAfter').mockReturnValue(true);
            await controller.changeProductQuantity(inputProduct.model, 10, "2030-01-01")
                .catch(err => {
                    expect(err).toBeInstanceOf(DateError)
                })
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled()
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(inputProduct.model)
            expect(dayjs.prototype.isAfter).toHaveBeenCalled()
        })

        test("PCU7: It should throw DateError if changeDate is before arrivalDate", async () => {
            const controller = new ProductController()
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(new Product(inputProduct.sellingPrice, inputProduct.model, Category.SMARTPHONE, inputProduct.arrivalDate, inputProduct.details, inputProduct.quantity))
            jest.spyOn(dayjs.prototype, 'isAfter').mockReturnValue(false);
            jest.spyOn(dayjs.prototype, 'isBefore').mockReturnValue(true);
            await controller.changeProductQuantity(inputProduct.model, 10, "2021-01-01")
                .catch(err => {
                    expect(err).toBeInstanceOf(DateError)
                })
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled()
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(inputProduct.model)
            expect(dayjs.prototype.isAfter).toHaveBeenCalled()
            expect(dayjs.prototype.isBefore).toHaveBeenCalled()
            expect(dayjs.prototype.isBefore).toHaveBeenCalledWith(dayjs(inputProduct.arrivalDate))
        })
    })

    describe("sellProduct", () => {
        test("PCU8: It should return true", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(new Product(inputProduct.sellingPrice, inputProduct.model, Category.SMARTPHONE, inputProduct.arrivalDate, inputProduct.details, inputProduct.quantity))
            jest.spyOn(dayjs.prototype, 'isAfter').mockReturnValue(false);
            jest.spyOn(dayjs.prototype, 'isBefore').mockReturnValue(false);
            jest.spyOn(ProductDAO.prototype, "sellModels").mockResolvedValueOnce(true)
            const controller = new ProductController()

            const response = await controller.sellProduct(inputProduct.model, inputProduct.quantity, inputProduct.arrivalDate)
            
            expect(response).toBe(true)
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled()
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(inputProduct.model)
            expect(dayjs.prototype.isAfter).toHaveBeenCalled()
            expect(dayjs.prototype.isBefore).toHaveBeenCalled()
            expect(dayjs.prototype.isBefore).toHaveBeenCalledWith(dayjs(inputProduct.arrivalDate))
            expect(ProductDAO.prototype.sellModels).toHaveBeenCalled()
            expect(ProductDAO.prototype.sellModels).toHaveBeenCalledWith(inputProduct.model, inputProduct.quantity)

        })

        test("PCU9: It should throw ProductNotFoundError if the product does not exist", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(null)
            const controller = new ProductController()

            await controller.sellProduct(inputProduct.model, inputProduct.quantity, inputProduct.arrivalDate)
                .catch(err => {
                    expect(err).toBeInstanceOf(ProductNotFoundError)
                })
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled()
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(inputProduct.model)
        })

        test("PCU10: It should throw DateError if sellingDate is in the future", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(new Product(inputProduct.sellingPrice, inputProduct.model, Category.SMARTPHONE, inputProduct.arrivalDate, inputProduct.details, inputProduct.quantity))
            jest.spyOn(dayjs.prototype, 'isAfter').mockReturnValue(true);
            const controller = new ProductController()

            await controller.sellProduct(inputProduct.model, inputProduct.quantity, "2030-01-01")
                .catch(err => {
                    expect(err).toBeInstanceOf(DateError)
                })
            expect(dayjs.prototype.isAfter).toHaveBeenCalled()
        })
        test("PCU11: It should throw DateError if sellingDate is before arrivalDate", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(new Product(inputProduct.sellingPrice, inputProduct.model, Category.SMARTPHONE, inputProduct.arrivalDate, inputProduct.details, inputProduct.quantity))
            jest.spyOn(dayjs.prototype, 'isAfter').mockReturnValue(false);
            jest.spyOn(dayjs.prototype, 'isBefore').mockReturnValue(true);
            const controller = new ProductController()

            await controller.sellProduct(inputProduct.model, inputProduct.quantity, "2021-01-01")
                .catch(err => {
                    expect(err).toBeInstanceOf(DateError)
                })
            expect(dayjs.prototype.isAfter).toHaveBeenCalled()
            expect(dayjs.prototype.isBefore).toHaveBeenCalled()
            expect(dayjs.prototype.isBefore).toHaveBeenCalledWith(dayjs(inputProduct.arrivalDate))
        })
        test("PCU12: It should throw ProductSoldError if the product is out of stock", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(new Product(inputProduct.sellingPrice, inputProduct.model, Category.SMARTPHONE, inputProduct.arrivalDate, inputProduct.details, 0))
            jest.spyOn(dayjs.prototype, 'isAfter').mockReturnValue(false);
            jest.spyOn(dayjs.prototype, 'isBefore').mockReturnValue(false);

            const controller = new ProductController()

            await controller.sellProduct(inputProduct.model, inputProduct.quantity, inputProduct.arrivalDate)
                .catch(err => {
                    expect(err).toBeInstanceOf(ProductSoldError)
                })
            expect(dayjs.prototype.isAfter).toHaveBeenCalled()
            expect(dayjs.prototype.isBefore).toHaveBeenCalled()
            expect(dayjs.prototype.isBefore).toHaveBeenCalledWith(dayjs(inputProduct.arrivalDate))
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled()
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(inputProduct.model)
        })

        test("PCU13: It should throw LowProductStockError if the quantity to sell is greater than the available quantity", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(new Product(inputProduct.sellingPrice, inputProduct.model, Category.SMARTPHONE, inputProduct.arrivalDate, inputProduct.details, 5))
            jest.spyOn(dayjs.prototype, 'isAfter').mockReturnValue(false);
            jest.spyOn(dayjs.prototype, 'isBefore').mockReturnValue(false);

            const controller = new ProductController()

            await controller.sellProduct(inputProduct.model, 10, inputProduct.arrivalDate)
                .catch(err => {
                    expect(err).toBeInstanceOf(LowProductStockError)
                })
                
            expect(dayjs.prototype.isAfter).toHaveBeenCalled()
            expect(dayjs.prototype.isBefore).toHaveBeenCalled()
            expect(dayjs.prototype.isBefore).toHaveBeenCalledWith(dayjs(inputProduct.arrivalDate))
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled()
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(inputProduct.model)
        })
    })

    describe("getProducts", () => {
        test("PCU14: It should return an array of products", async () => {
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValueOnce([new Product(inputProduct.sellingPrice, inputProduct.model, Category.SMARTPHONE, inputProduct.arrivalDate, inputProduct.details, inputProduct.quantity)])
            const controller = new ProductController()
            const response = await controller.getProducts(null, null, null)
            expect(response).toEqual([new Product(inputProduct.sellingPrice, inputProduct.model, Category.SMARTPHONE, inputProduct.arrivalDate, inputProduct.details, inputProduct.quantity)])
            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalled()
            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalledWith()
        })

        test("PCU15: It should throw IncorrectNullGrouping if grouping is null but category is not", async () => {
            const controller = new ProductController()
            await controller.getProducts(null, "Smartphone", null)
                .catch(err => {
                    expect(err).toBeInstanceOf(IncorrectNullGrouping)
                })
        })

        test("PCU16: It should throw IncorrectNullGrouping if grouping is null but model is not", async () => {
            const controller = new ProductController()
            await controller.getProducts(null, null, "model1")
                .catch(err => {
                    expect(err).toBeInstanceOf(IncorrectNullGrouping)
                })
        })

        test("PCU17: It should return an array of products filtered by category", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductsByCategory").mockResolvedValueOnce([new Product(inputProduct.sellingPrice, inputProduct.model, Category.SMARTPHONE, inputProduct.arrivalDate, inputProduct.details, inputProduct.quantity)])
            const controller = new ProductController()
            const response = await controller.getProducts("category", "Smartphone", null)
            expect(response).toEqual([new Product(inputProduct.sellingPrice, inputProduct.model, Category.SMARTPHONE, inputProduct.arrivalDate, inputProduct.details, inputProduct.quantity)])
            expect(ProductDAO.prototype.getProductsByCategory).toHaveBeenCalled()
            expect(ProductDAO.prototype.getProductsByCategory).toHaveBeenCalledWith("Smartphone")
        })

        test("PCU18: It should throw IncorrectCategoryGrouping if category is null", async () => {
            const controller = new ProductController()
            await controller.getProducts("category", null, null)
                .catch(err => {
                    expect(err).toBeInstanceOf(IncorrectCategoryGrouping)
                })
        })

        test("PCU19: It should throw IncorrectModelGrouping if model is null", async () => {
            const controller = new ProductController()
            await controller.getProducts("model", null, null)
                .catch(err => {
                    expect(err).toBeInstanceOf(IncorrectModelGrouping)
                })
        })

        test("PCU20: It should return an array with a single product filtered by model", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(new Product(inputProduct.sellingPrice, inputProduct.model, Category.SMARTPHONE, inputProduct.arrivalDate, inputProduct.details, inputProduct.quantity))
            const controller = new ProductController()
            const response = await controller.getProducts("model", null, "model1")
            expect(response).toEqual([new Product(inputProduct.sellingPrice, inputProduct.model, Category.SMARTPHONE, inputProduct.arrivalDate, inputProduct.details, inputProduct.quantity)])
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled()
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("model1")
        })

        test("PCU21: It should return all products if grouping is not category or model", async () => {
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValueOnce([new Product(inputProduct.sellingPrice, inputProduct.model, Category.SMARTPHONE, inputProduct.arrivalDate, inputProduct.details, inputProduct.quantity)])
            const controller = new ProductController()
            const response = await controller.getProducts("wrong", null, null)
            expect(response).toEqual([new Product(inputProduct.sellingPrice, inputProduct.model, Category.SMARTPHONE, inputProduct.arrivalDate, inputProduct.details, inputProduct.quantity)])
            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalled()
            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalledWith()
        })
        test("PCU22: It should return ProductNotFoundError if the product does not exist", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(null)
            const controller = new ProductController()
            await controller.getProducts("model", null, "notExistingModel")
                .catch(err => {
                    expect(err).toBeInstanceOf(ProductNotFoundError)
                })
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled()
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("notExistingModel")
        })
    })

    describe("getAvailableProducts", () => {
        test("PCU23: It should return an array of products with quantity greater than 0", async () => {
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValueOnce([new Product(inputProduct.sellingPrice, inputProduct.model, Category.SMARTPHONE, inputProduct.arrivalDate, inputProduct.details, 10)])
            const controller = new ProductController()
            const response = await controller.getAvailableProducts(null, null, null)
            expect(response).toEqual([new Product(inputProduct.sellingPrice, inputProduct.model, Category.SMARTPHONE, inputProduct.arrivalDate, inputProduct.details, 10)])
            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalled()
            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalledWith()
        })

        test("PCU24: It should return an array of products with quantity greater than 0 filtered by category", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductsByCategory").mockResolvedValueOnce([new Product(inputProduct.sellingPrice, inputProduct.model, Category.SMARTPHONE, inputProduct.arrivalDate, inputProduct.details, 10)])
            const controller = new ProductController()
            const response = await controller.getAvailableProducts("category", "Smartphone", null)
            expect(response).toEqual([new Product(inputProduct.sellingPrice, inputProduct.model, Category.SMARTPHONE, inputProduct.arrivalDate, inputProduct.details, 10)])
            expect(ProductDAO.prototype.getProductsByCategory).toHaveBeenCalled()
            expect(ProductDAO.prototype.getProductsByCategory).toHaveBeenCalledWith("Smartphone")
        })

        test("PCU25: It should return an array with a single product with quantity greater than 0 filtered by model", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(new Product(inputProduct.sellingPrice, inputProduct.model, Category.SMARTPHONE, inputProduct.arrivalDate, inputProduct.details, 10))
            const controller = new ProductController()
            const response = await controller.getAvailableProducts("model", null, "model1")
            expect(response).toEqual([new Product(inputProduct.sellingPrice, inputProduct.model, Category.SMARTPHONE, inputProduct.arrivalDate, inputProduct.details, 10)])
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled()
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("model1")
        })

    })

    describe("deleteProduct", () => {
        test("PCU26: It should return true", async () => {
            jest.spyOn(ProductDAO.prototype, "deleteModel").mockResolvedValueOnce(true)
            jest.spyOn(CartDAO.prototype, "markProductAsDeleted").mockResolvedValueOnce(true)
            const controller = new ProductController()
            const response = await controller.deleteProduct("model1")
            expect(response).toBe(true)
            expect(ProductDAO.prototype.deleteModel).toHaveBeenCalled()
            expect(ProductDAO.prototype.deleteModel).toHaveBeenCalledWith("model1")
        })

        test("PCU27: It should return ProductNotFoundError", async () => {
            jest.spyOn(ProductDAO.prototype, "deleteModel").mockResolvedValueOnce(false)
            const controller = new ProductController()
            await controller.deleteProduct("model1")
                .catch(err => {
                    expect(err).toBeInstanceOf(ProductNotFoundError)
                })
            expect(ProductDAO.prototype.deleteModel).toHaveBeenCalled()
            expect(ProductDAO.prototype.deleteModel).toHaveBeenCalledWith("model1")
        })
    })

    describe("deleteAllProducts", () =>{
        test("PCU28: It should return true", async () => {
            jest.spyOn(ProductDAO.prototype, "deleteAllProducts").mockResolvedValueOnce(null)
            jest.spyOn(CartDAO.prototype, "markAllProductAsDeleted").mockResolvedValueOnce(true)
            const controller = new ProductController()
            const response = await controller.deleteAllProducts()
            expect(response).toBe(true)
            expect(ProductDAO.prototype.deleteAllProducts).toHaveBeenCalled()
            expect(CartDAO.prototype.markAllProductAsDeleted).toHaveBeenCalled()
        })
    })
})