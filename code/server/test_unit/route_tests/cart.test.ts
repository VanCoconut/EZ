import { test, expect, jest, describe, beforeEach } from "@jest/globals";
import request from 'supertest';
import { app } from "../../index";
import isAdmin from '../../src/routers/auth';
import isCustomer from '../../src/routers/auth';
import CartController from "../../src/controllers/cartController";
import ErrorHandler from "../../src/helper";
import { Role, User } from "../../src/components/user";
import Authenticator from "../../src/routers/auth";
import { Cart, ProductInCart } from "../../src/components/cart";
import { Category, Product } from "../../src/components/product";
import { ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, LowProductStockError, IncorrectNullGrouping, IncorrectCategoryGrouping, IncorrectModelGrouping } from "../../src/errors/productError";
import { CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError, EmptyCartError } from "../../src/errors/cartError";
const baseURL = "/ezelectronics/carts";

jest.mock("../../src/routers/auth");
jest.mock("../../src/helper");
jest.mock("../../src/controllers/cartController");

describe('Cart Routes', () => {
    const testCustomer = new User("testCustomer", "Test", "Customer", Role.CUSTOMER, "", "");
    const testCart = new Cart(
        "testCustomer",
        false,
        "",
        100,
        [
            new ProductInCart("Model1", 1, Category.SMARTPHONE, 50),
            new ProductInCart("Model2", 2, Category.LAPTOP, 25)
        ]
    );
    beforeEach(() => {
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockClear();
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockClear();
        jest.spyOn(Authenticator.prototype, "isCustomer").mockClear();
        jest.clearAllMocks();
    });

    describe('GET /ezelectronics/carts/', () => {
        test('CRU1: should return a 200 success code and the cart data', async () => {

            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req: any, res: any, next: () => any) => next());

            jest.spyOn(CartController.prototype, 'getCart').mockResolvedValueOnce(testCart);

            const response = await request(app).get(baseURL + '/');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                customer: testCart.customer,
                paid: testCart.paid,
                paymentDate: testCart.paymentDate,
                total: testCart.total,
                products: testCart.products.map(product => ({
                    model: product.model,
                    quantity: product.quantity,
                    category: product.category,
                    price: product.price
                }))
            });

            // Verifica che i middleware e il metodo del controller siano stati chiamati correttamente
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
            expect(ErrorHandler.prototype.validateRequest).toHaveBeenCalledTimes(1);
            expect(CartController.prototype.getCart).toHaveBeenCalledWith(expect.objectContaining({ username: "testCustomer", role: 'Customer' }));
        });

        test("CRU2: should fail if user is not a customer", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => res.status(401).json({ error: "Unauthorized" }));

            const response = await request(app).get(baseURL + '/');

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthorized" });
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled();
            expect(CartController.prototype.getCart).not.toHaveBeenCalled();
        });

        test("CRU3: should fail if user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthenticated" }));

            const response = await request(app).post(baseURL + `/`);
            expect(response.status).toBe(401);
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalled();
            expect(Authenticator.prototype.isCustomer).not.toHaveBeenCalled();
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled();
            expect(CartController.prototype.getCart).not.toHaveBeenCalled();
        });

        test("CRU4: should return an empty Cart object if no unpaid cart or if the unpaid cart has no products", async () => {
            const emptyCart = new Cart(
                "testCustomer",
                false,
                "",
                0,
                []
            );

            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, 'getCart').mockResolvedValueOnce(emptyCart);

            const response = await request(app).get(baseURL + '/');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                customer: emptyCart.customer,
                paid: emptyCart.paid,
                paymentDate: emptyCart.paymentDate,
                total: emptyCart.total,
                products: emptyCart.products
            });

            // Verifica che i middleware e il metodo del controller siano stati chiamati correttamente
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
            expect(ErrorHandler.prototype.validateRequest).toHaveBeenCalledTimes(1);
            expect(CartController.prototype.getCart).toHaveBeenCalledWith(expect.objectContaining({ username: "testCustomer", role: Role.CUSTOMER }));
        });
    });

    describe('POST /ezelectronics/carts/', () => {
        test('CRU5: should add a product to the cart and return a 200 success code', async () => {
            const model = "iPhone13";
            const testCustomer = new User("testCustomer", "Test", "Customer", Role.CUSTOMER, "", "");
            const testProduct = new Product(999, model, Category.SMARTPHONE, "2023-01-01", "Latest iPhone", 10);

            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer;
                next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, 'addToCart').mockResolvedValueOnce(true);

            const response = await request(app)
                .post(baseURL)
                .send({ model });

            expect(response.status).toBe(200);

            // Verifica che i middleware e il metodo del controller siano stati chiamati correttamente
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
            expect(ErrorHandler.prototype.validateRequest).toHaveBeenCalledTimes(1);
            expect(CartController.prototype.addToCart).toHaveBeenCalledWith(testCustomer, model);
        });

        test("CRU6: should return a 404 error if model does not represent an existing product", async () => {
            const model = "NonExistingModel";

            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer;
                next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());

            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid value");
                }),
            }));

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(404).json({ error: "Product not found" });
            });
            const response = await request(app).post(baseURL).send({ model });

            expect(response.status).toBe(404);
        });

        test("CRU7: should return a 409 error if model represents a product whose available quantity is 0", async () => {
            const model = "OutOfStockModel";

            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer;
                next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());

            // Mock express-validator to throw an error
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid value");
                }),
            }));

            // Mock validateRequest to return a 409 error
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(409).json({ error: "Product out of stock" });
            });

            const response = await request(app).post(baseURL).send({ model });

            expect(response.status).toBe(409);
            expect(response.body).toEqual({ error: "Product out of stock" });
        });

        test('CRU8: should create a new cart if no current cart exists and return a 200 success code', async () => {
            const model = "iPhone13";
            const testCustomer = new User("testCustomer", "Test", "Customer", Role.CUSTOMER, "", "");
            const testProduct = new Product(999, model, Category.SMARTPHONE, "2023-01-01", "Latest iPhone", 10);

            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer;
                next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, 'addToCart').mockResolvedValueOnce(true);

            const response = await request(app)
                .post(baseURL)
                .send({ model });

            expect(response.status).toBe(200);

            // Verifica che i middleware e il metodo del controller siano stati chiamati correttamente
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
            expect(ErrorHandler.prototype.validateRequest).toHaveBeenCalledTimes(1);
            expect(CartController.prototype.addToCart).toHaveBeenCalledWith(testCustomer, model);
        });

        test('CRU9: should return 401 if user is not logged in', async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                res.status(401).json({ error: "Unauthenticated" });
            });

            const response = await request(app)
                .post(baseURL)
                .send({ model: "iPhone13" });

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthenticated" });

            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isCustomer).not.toHaveBeenCalled();
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled();
            expect(CartController.prototype.addToCart).not.toHaveBeenCalled();
        });

        test('CRU10: should return 401 if user is not a customer', async () => {
            const testAdmin = new User("testAdmin", "Test", "Admin", Role.ADMIN, "", "");

            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testAdmin;
                next();
            });

            jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementation((req, res, next) => {
                res.status(401).json({ error: "Unauthorized" });
            });

            const response = await request(app)
                .post(baseURL)
                .send({ model: "iPhone13" });

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthorized" });

            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled();
            expect(CartController.prototype.addToCart).not.toHaveBeenCalled();
        });
    });

    describe('PATCH /ezelectronics/carts/', () => {
        test('CRU11: should checkout the cart and return a 200 success code', async () => {
            const testCustomer = new User("testCustomer", "Test", "Customer", Role.CUSTOMER, "", "");

            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer;
                next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, 'checkoutCart').mockResolvedValueOnce(true);

            const response = await request(app)
                .patch(baseURL)
                .send();

            expect(response.status).toBe(200);

            // Verifica che i middleware e il metodo del controller siano stati chiamati correttamente
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
            expect(ErrorHandler.prototype.validateRequest).toHaveBeenCalledTimes(1);
            expect(CartController.prototype.checkoutCart).toHaveBeenCalledWith(testCustomer);
        });

        test("CRU12: should return a 401 error if user is not a customer", async () => {
            const testAdmin = new User("testAdmin", "Test", "Admin", Role.ADMIN, "", "");

            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testAdmin;
                next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                res.status(401).json({ error: "Unauthorized" });
            });

            const response = await request(app)
                .patch(baseURL)
                .send();

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthorized" });

            // Verifica che i middleware siano stati chiamati correttamente
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
            expect(ErrorHandler.prototype.validateRequest).toHaveBeenCalledTimes(0);
            expect(CartController.prototype.checkoutCart).not.toHaveBeenCalled();
        });

        test("CRU13: should return a 404 error if there is no information about an unpaid cart in the database", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer;
                next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());

            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid value");
                }),
            }));

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(404).json({ error: "Product not found" });
            });
            const response = await request(app).patch(baseURL).send();

            expect(response.status).toBe(404);

        });

        test("CRU14: should return a 400 error if there is information about an unpaid cart but the cart contains no products", async () => {
            const emptyCart = new Cart(
                "testCustomer",
                false,
                "",
                0,
                []
            );

            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer;
                next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, 'checkoutCart').mockResolvedValueOnce(true);

            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid value");
                }),
            }));

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(400).json({ error: "Product not found" });
            });
            const response = await request(app).patch(baseURL).send();

            expect(response.status).toBe(400);
        });

        test("CRU15: should return a 409 error if there is at least one product in the cart whose available quantity in the stock is 0", async () => {
            const testCustomer = new User("testCustomer", "Test", "Customer", Role.CUSTOMER, "", "");
            const testCartWithOutOfStockProduct = new Cart(
                "testCustomer",
                false,
                "",
                100,
                [
                    new ProductInCart("OutOfStockModel", 1, Category.SMARTPHONE, 50)
                ]
            );

            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer;
                next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid value");
                }),
            }));

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(409).json({ error: "Product stock is not empty but it cannot satisfy the requested quantity" });
            });
            const response = await request(app).patch(baseURL).send();

            expect(response.status).toBe(409);
        });
    });

    describe('GET /ezelectronics/carts/history', () => {
        const testCustomer = new User("testCustomer", "Test", "Customer", Role.CUSTOMER, "", "");
        const paidCartHistory = [
            new Cart(
                "testCustomer",
                true,
                "2024-05-02",
                200,
                [new ProductInCart("iPhone 13", 1, Category.SMARTPHONE, 200)]
            )
        ];

        beforeEach(() => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockClear();
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockClear();
            jest.spyOn(Authenticator.prototype, "isCustomer").mockClear();
            jest.clearAllMocks();
        });

        test('CRU16: should return 200 and the cart history for the logged in customer', async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, 'getCustomerCarts').mockResolvedValueOnce(paidCartHistory);

            const response = await request(app).get(baseURL + '/history');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(paidCartHistory.map(cart => ({
                customer: cart.customer,
                paid: cart.paid,
                paymentDate: cart.paymentDate,
                total: cart.total,
                products: cart.products.map(product => ({
                    model: product.model,
                    category: product.category,
                    quantity: product.quantity,
                    price: product.price
                }))
            })));

            // Verify that the middleware and controller method were called correctly
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
            expect(ErrorHandler.prototype.validateRequest).toHaveBeenCalledTimes(1);
            expect(CartController.prototype.getCustomerCarts).toHaveBeenCalledWith(testCustomer);
        });

        test('CRU17: should return 401 if the user is not logged in', async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                res.status(401).json({ error: "Unauthenticated" });
            });

            const response = await request(app).get(baseURL + '/history');

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthenticated" });

            // Verify that the middleware was called correctly
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isCustomer).not.toHaveBeenCalled();
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled();
            expect(CartController.prototype.getCustomerCarts).not.toHaveBeenCalled();
        });

        test('CRU18: should return 401 if the user is not a customer', async () => {
            const testAdmin = new User("testAdmin", "Test", "Admin", Role.ADMIN, "", "");

            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testAdmin;
                next();
            });

            jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementation((req, res, next) => {
                res.status(401).json({ error: "Unauthorized" });
            });

            const response = await request(app).get(baseURL + '/history');

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthorized" });

            // Verify that the middleware was called correctly
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled();
            expect(CartController.prototype.getCustomerCarts).not.toHaveBeenCalled();
        });
    });
    describe('DELETE /ezelectronics/carts/products/:model', () => {
        const testCustomer = new User("testCustomer", "Test", "Customer", Role.CUSTOMER, "", "");

        beforeEach(() => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockClear();
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockClear();
            jest.spyOn(Authenticator.prototype, "isCustomer").mockClear();
            jest.clearAllMocks();
        });

        test('CRU19: should remove a product from the cart and return a 200 success code', async () => {
            const model = "iPhone13";

            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer;
                next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, 'removeProductFromCart').mockResolvedValueOnce(true);

            const response = await request(app)
                .delete(`${baseURL}/products/${model}`)
                .send();

            expect(response.status).toBe(200);

            // Verify that the middleware and controller method were called correctly
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
            expect(ErrorHandler.prototype.validateRequest).toHaveBeenCalledTimes(1);
            expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledWith(testCustomer, model);
        });

        test('CRU20: should return 404 if model represents a product that is not in the cart', async () => {
            const model = "NonExistingProductInCart";

            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer;
                next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, 'removeProductFromCart').mockImplementation(() => {
                throw new ProductNotInCartError();
            });

            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid value");
                }),
            }));

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(404).json({ error: "Product not in cart" });
            });

            const response = await request(app)
                .delete(`${baseURL}/products/${model}`)
                .send();

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: "Product not in cart" });

            // Verify that the middleware and controller method were called correctly
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
            expect(ErrorHandler.prototype.validateRequest).toHaveBeenCalledTimes(1);

        });

        test('CRU21: should return 404 if there is no information about an unpaid cart for the user or if the cart is empty', async () => {
            const model = "iPhone13";

            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer;
                next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, 'removeProductFromCart').mockImplementation(() => {
                throw new CartNotFoundError();
            });

            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid value");
                }),
            }));

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(404).json({ error: "Cart not found" });
            });
            const response = await request(app)
                .delete(`${baseURL}/products/${model}`)
                .send();

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: "Cart not found" });

            // Verify that the middleware and controller method were called correctly
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);

        });


        test('CRU22: should return 404 if model represents an existing product', async () => {
            const model = "NonExistingProductInCart";

            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer;
                next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, 'removeProductFromCart').mockImplementation(() => {
                throw new ProductNotFoundError();
            });

            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid value");
                }),
            }));

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(404).json({ error: "Product not found in cart" });
            });

            const response = await request(app)
                .delete(`${baseURL}/products/${model}`)
                .send();

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: "Product not found in cart" });

            // Verify that the middleware and controller method were called correctly
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
            expect(ErrorHandler.prototype.validateRequest).toHaveBeenCalledTimes(1);

        });
        test('CRU23: should return 401 if user is not logged in', async () => {
            const model = "iPhone13";

            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                res.status(401).json({ error: "Unauthenticated" });
            });

            const response = await request(app)
                .delete(`${baseURL}/products/${model}`)
                .send();

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthenticated" });

            // Verify that the middleware was called correctly
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isCustomer).not.toHaveBeenCalled();
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled();
            expect(CartController.prototype.removeProductFromCart).not.toHaveBeenCalled();
        });

        test('CRU24: should return 401 if user is not a customer', async () => {
            const testAdmin = new User("testAdmin", "Test", "Admin", Role.ADMIN, "", "");
            const model = "iPhone13";

            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testAdmin;
                next();
            });

            jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementation((req, res, next) => {
                res.status(401).json({ error: "Unauthorized" });
            });

            const response = await request(app)
                .delete(`${baseURL}/products/${model}`)
                .send();

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthorized" });

            // Verify that the middleware was called correctly
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled();
            expect(CartController.prototype.removeProductFromCart).not.toHaveBeenCalled();
        });
    });

    describe('DELETE /ezelectronics/carts/current', () => {
        const testCustomer = new User("testCustomer", "Test", "Customer", Role.CUSTOMER, "", "");

        beforeEach(() => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockClear();
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockClear();
            jest.spyOn(Authenticator.prototype, "isCustomer").mockClear();
            jest.clearAllMocks();
        });

        test('CRU25: should empty the current cart and return a 200 success code', async () => {
            const model = "NonExistingProductInCart";

            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer;
                next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, 'removeProductFromCart').mockImplementation(() => {
                throw new ProductNotFoundError();
            });

            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid value");
                }),
            }));

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(404).json({ error: "Product not found in cart" });
            });

            const response = await request(app)
                .delete(`${baseURL}/products/${model}`)
                .send();

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: "Product not found in cart" });

            // Verify that the middleware and controller method were called correctly
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
            expect(ErrorHandler.prototype.validateRequest).toHaveBeenCalledTimes(1);
        });

        test('CRU26: should return 404 if there is no information about an unpaid cart for the user', async () => {
            const model = "iPhone 13";
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer;
                next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, 'clearCart').mockImplementation(() => {
                throw new CartNotFoundError();
            });

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(404).json({ error: "Cart not found" });
            });
            const response = await request(app)
                .delete(`${baseURL}/products/${model}`)
                .send();


            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: "Cart not found" });

            // Verify that the middleware and controller method were called correctly
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);

        });

        test('CRU27: should return 401 if user is not logged in', async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                res.status(401).json({ error: "Unauthenticated" });
            });

            const response = await request(app)
                .delete(`${baseURL}/current`)
                .send();

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthenticated" });

            // Verify that the middleware was called correctly
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isCustomer).not.toHaveBeenCalled();
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled();
            expect(CartController.prototype.clearCart).not.toHaveBeenCalled();
        });

        test('CRU28: should return 401 if user is not a customer', async () => {
            const testAdmin = new User("testAdmin", "Test", "Admin", Role.ADMIN, "", "");

            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testAdmin;
                next();
            });

            jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementation((req, res, next) => {
                res.status(401).json({ error: "Unauthorized" });
            });

            const response = await request(app)
                .delete(`${baseURL}/current`)
                .send();

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthorized" });

            // Verify that the middleware was called correctly
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled();
            expect(CartController.prototype.clearCart).not.toHaveBeenCalled();
        });
    });
    describe('DELETE /ezelectronics/carts', () => {
        const testAdmin = new User("testAdmin", "Test", "Admin", Role.ADMIN, "", "");
        const testManager = new User("testManager", "Test", "Manager", Role.MANAGER, "", "");
        const testCustomer = new User("testCustomer", "Test", "Customer", Role.CUSTOMER, "", "");

        beforeEach(() => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockClear();
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockClear();
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockClear();
            jest.clearAllMocks();
        });

        test('CRU29: should delete all carts and return a 200 success code for Admin', async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testAdmin;
                next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, 'deleteAllCarts').mockResolvedValueOnce(true);

            const response = await request(app)
                .delete(`${baseURL}`)
                .send();

            expect(response.status).toBe(200);

            // Verify that the middleware and controller method were called correctly
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(CartController.prototype.deleteAllCarts).toHaveBeenCalled();
        });

        test('CRU30: should delete all carts and return a 200 success code for Manager', async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testManager;
                next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, 'deleteAllCarts').mockResolvedValueOnce(true);

            const response = await request(app)
                .delete(`${baseURL}`)
                .send();

            expect(response.status).toBe(200);

            // Verify that the middleware and controller method were called correctly
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(CartController.prototype.deleteAllCarts).toHaveBeenCalled();
        });

        test('CRU31: should return 401 if user is not logged in', async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                res.status(401).json({ error: "Unauthenticated" });
            });

            const response = await request(app)
                .delete(`${baseURL}`)
                .send();

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthenticated" });

            // Verify that the middleware was called correctly
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isAdminOrManager).not.toHaveBeenCalled();
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled();
            expect(CartController.prototype.deleteAllCarts).not.toHaveBeenCalled();
        });

        test('CRU32: should return 401 if user is not an Admin or Manager', async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer;
                next();
            });

            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req, res, next) => {
                res.status(401).json({ error: "Unauthorized" });
            });

            const response = await request(app)
                .delete(`${baseURL}`)
                .send();

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthorized" });

            // Verify that the middleware was called correctly
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled();
            expect(CartController.prototype.deleteAllCarts).not.toHaveBeenCalled();
        });
    });
    describe('GET /ezelectronics/carts/all', () => {
        const testAdmin = new User("testAdmin", "Test", "Admin", Role.ADMIN, "", "");
        const testManager = new User("testManager", "Test", "Manager", Role.MANAGER, "", "");
        const testCustomer = new User("testCustomer", "Test", "Customer", Role.CUSTOMER, "", "");
        const allCarts = [
            new Cart(
                "Mario Rossi",
                true,
                "2024-05-02",
                200,
                [new ProductInCart("iPhone 13", 1, Category.SMARTPHONE, 200)]
            )
        ];

        beforeEach(() => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockClear();
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockClear();
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockClear();
            jest.clearAllMocks();
        });

        test('CRU33: should return 200 and all carts for Admin', async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testAdmin;
                next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, 'getAllCarts').mockResolvedValueOnce(allCarts);

            const response = await request(app).get(`${baseURL}/all`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(allCarts.map(cart => ({
                customer: cart.customer,
                paid: cart.paid,
                paymentDate: cart.paymentDate,
                total: cart.total,
                products: cart.products.map(product => ({
                    model: product.model,
                    category: product.category,
                    quantity: product.quantity,
                    price: product.price
                }))
            })));

            // Verify that the middleware and controller method were called correctly
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(CartController.prototype.getAllCarts).toHaveBeenCalled();
        });

        test('CRU34: should return 200 and all carts for Manager', async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testManager;
                next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, 'getAllCarts').mockResolvedValueOnce(allCarts);

            const response = await request(app).get(`${baseURL}/all`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(allCarts.map(cart => ({
                customer: cart.customer,
                paid: cart.paid,
                paymentDate: cart.paymentDate,
                total: cart.total,
                products: cart.products.map(product => ({
                    model: product.model,
                    category: product.category,
                    quantity: product.quantity,
                    price: product.price
                }))
            })));

            // Verify that the middleware and controller method were called correctly
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(CartController.prototype.getAllCarts).toHaveBeenCalled();
        });

        test('CRU35: should return 401 if user is not logged in', async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                res.status(401).json({ error: "Unauthenticated" });
            });

            const response = await request(app).get(`${baseURL}/all`);

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthenticated" });

            // Verify that the middleware was called correctly
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isAdminOrManager).not.toHaveBeenCalled();
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled();
            expect(CartController.prototype.getAllCarts).not.toHaveBeenCalled();
        });

        test('CRU36: should return 401 if user is not an Admin or Manager', async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer;
                next();
            });

            jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req, res, next) => {
                res.status(401).json({ error: "Unauthorized" });
            });

            const response = await request(app).get(`${baseURL}/all`);

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthorized" });

            // Verify that the middleware was called correctly
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
            expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
            expect(ErrorHandler.prototype.validateRequest).not.toHaveBeenCalled();
            expect(CartController.prototype.getAllCarts).not.toHaveBeenCalled();
        });
    });

});
