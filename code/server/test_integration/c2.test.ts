import { beforeAll, expect, jest, test, describe, beforeEach, afterAll } from "@jest/globals";
import request from 'supertest';
import { app } from "../index";
import { cleanup } from "../src/db/cleanup";
import { Cart, ProductInCart } from "../src/components/cart";
import { Category } from "../src/components/product";
import { Role } from "../src/components/user";
import CartController from "../src/controllers/cartController";
import { ProductNotFoundError, ProductSoldError, LowProductStockError } from "../src/errors/productError";
import { CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError, EmptyCartError } from "../src/errors/cartError";

// Default user information
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: Role.CUSTOMER };
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: Role.MANAGER };
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: Role.ADMIN };

// Cookies for the users
let customerCookie: string;
let managerCookie: string;
let adminCookie: string;

const baseURL = "/ezelectronics";
const cartURL = `${baseURL}/carts`;

jest.mock("../src/controllers/cartController");

// Helper function that creates a new user in the database
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${baseURL}/users`)
        .send(userInfo)
        .expect(200);
};

// Helper function that logs in a user and returns the cookie
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${baseURL}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err);
                }
                resolve(res.header["set-cookie"][0]);
            });
    });
};

// Before executing tests, we remove everything from our test database, create users and log in as each, saving the cookies in corresponding variables
beforeAll(async () => {
    await cleanup();
    await postUser(customer);
    customerCookie = await login(customer);
    await postUser(manager);
    managerCookie = await login(manager);
    await postUser(admin);
    adminCookie = await login(admin);
});

// After executing tests, we remove everything from our test database
afterAll(async() => {
    await cleanup();
});

describe("Cart routes integration tests", () => {
    describe(`GET ${cartURL} - getting the current cart of the logged-in user`, () => {
        const inputUser = 'test-user';
        const testCart = {
            customer: inputUser,
            products: [{ model: "test-model", category: Category.SMARTPHONE, quantity: 1, price: 200 }],
            total: 200,
            paid: false,
            paymentDate: ""
        };

        beforeEach(() => {
            jest.spyOn(CartController.prototype, "getCart").mockReset();
        });

        test("CI2.1: should return 200 success code and the current cart", async () => {
            jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(testCart);

            const response = await request(app).get(`${cartURL}`).set('Cookie', customerCookie);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(testCart);
        });

        test("CI2.2: should return 401 error code if the user is not logged in", async () => {
            const response = await request(app).get(`${cartURL}`);
            expect(response.status).toBe(401);
        });

        test("CI2.3: should return 401 error code if the user is not a customer", async () => {
            const response = await request(app).get(`${cartURL}`).set('Cookie', adminCookie);
            expect(response.status).toBe(401);
        });
    });

    describe(`POST ${cartURL} - adding a product to the cart`, () => {
        const inputModel = 'test-model';
        const inputUser = 'test-user';
        const inputProduct = { model: inputModel };

        beforeEach(() => {
            jest.spyOn(CartController.prototype, "addToCart").mockReset();
        });

        test("CI2.4: should return 200 success code when adding a product to the cart", async () => {
            jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true);

            const response = await request(app).post(`${cartURL}`).send(inputProduct).set('Cookie', customerCookie);
            expect(response.status).toBe(200);
        });

        test("CI2.5: should return 404 error code if the product does not exist", async () => {
            jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new ProductNotFoundError());

            const response = await request(app).post(`${cartURL}`).send({ model: "NonExistingModel" }).set('Cookie', customerCookie);
            expect(response.status).toBe(404);
        });

        test("CI2.6: should return 409 error code if the product is out of stock", async () => {
            jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new ProductSoldError());

            const response = await request(app).post(`${cartURL}`).send(inputProduct).set('Cookie', customerCookie);
            expect(response.status).toBe(409);
        });

        test("CI2.7: should return 401 error code if the user is not logged in", async () => {
            const response = await request(app).post(`${cartURL}`).send(inputProduct);
            expect(response.status).toBe(401);
        });

        test("CI2.8: should return 401 error code if the user is not a customer", async () => {
            const response = await request(app).post(`${cartURL}`).send(inputProduct).set('Cookie', adminCookie);
            expect(response.status).toBe(401);
        });
    });

    describe(`PATCH ${cartURL} - simulating payment for the current cart`, () => {
        const inputUser = 'test-user';

        beforeEach(() => {
            jest.spyOn(CartController.prototype, "checkoutCart").mockReset();
        });

        test("CI2.9: should return 200 success code when simulating payment", async () => {
            jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValueOnce(true);

            const response = await request(app).patch(`${cartURL}`).set('Cookie', customerCookie);
            expect(response.status).toBe(200);
        });

        test("CI2.10: should return 404 error code if no unpaid cart exists", async () => {
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new CartNotFoundError());

            const response = await request(app).patch(`${cartURL}`).set('Cookie', customerCookie);
            expect(response.status).toBe(404);
        });

        test("CI2.11: should return 400 error code if the cart contains no product", async () => {
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new EmptyCartError());

            const response = await request(app).patch(`${cartURL}`).set('Cookie', customerCookie);
            expect(response.status).toBe(400);
        });

        test("CI2.12: should return 409 error code if at least one product in the cart is out of stock", async () => {
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new ProductSoldError());

            const response = await request(app).patch(`${cartURL}`).set('Cookie', customerCookie);
            expect(response.status).toBe(409);
        });

        test("CI2.13: should return 409 error code if at least one product quantity in the cart exceeds available quantity", async () => {
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new LowProductStockError());

            const response = await request(app).patch(`${cartURL}`).set('Cookie', customerCookie);
            expect(response.status).toBe(409);
        });

        test("CI2.14: should return 401 error code if the user is not logged in", async () => {
            const response = await request(app).patch(`${cartURL}`);
            expect(response.status).toBe(401);
        });

        test("CI2.15: should return 401 error code if the user is not a customer", async () => {
            const response = await request(app).patch(`${cartURL}`).set('Cookie', adminCookie);
            expect(response.status).toBe(401);
        });
    });

    describe(`GET ${cartURL}/history - getting the payment history of the logged-in user`, () => {
        const inputUser = 'test-user';
        const testHistory = [
            {
                customer: inputUser,
                products: [{ model: "test-model", category: Category.SMARTPHONE, quantity: 1, price: 200 }],
                total: 200,
                paid: true,
                paymentDate: "2021-01-01"
            }
        ];

        beforeEach(() => {
            jest.spyOn(CartController.prototype, "getCustomerCarts").mockReset();
        });

        test("CI2.16: should return 200 success code and the payment history", async () => {
            jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValueOnce(testHistory);

            const response = await request(app).get(`${cartURL}/history`).set('Cookie', customerCookie);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(testHistory);
        });

        test("CI2.17: should return 401 error code if the user is not logged in", async () => {
            const response = await request(app).get(`${cartURL}/history`);
            expect(response.status).toBe(401);
        });

        test("CI2.18: should return 401 error code if the user is not a customer", async () => {
            const response = await request(app).get(`${cartURL}/history`).set('Cookie', adminCookie);
            expect(response.status).toBe(401);
        });
    });

    describe(`DELETE ${cartURL}/products/:model - deleting a product from the cart`, () => {
        const inputModel = 'test-model';
        const inputUser = 'test-user';

        beforeEach(() => {
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockReset();
        });

        test("CI2.19: should return 200 success code when removing a product from the cart", async () => {
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValueOnce(true);

            const response = await request(app).delete(`${cartURL}/products/${inputModel}`).set('Cookie', customerCookie);
            expect(response.status).toBe(200);
        });

        test("CI2.20: should return 404 error code if the product is not in the cart", async () => {
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new ProductNotInCartError());

            const response = await request(app).delete(`${cartURL}/products/${inputModel}`).set('Cookie', customerCookie);
            expect(response.status).toBe(404);
        });

        test("CI2.21: should return 404 error code if there is no information about an unpaid cart for the user, or if there are no products in the cart", async () => {
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new CartNotFoundError());

            const response = await request(app).delete(`${cartURL}/products/${inputModel}`).set('Cookie', customerCookie);
            expect(response.status).toBe(404);
        });

        test("CI2.22: should return 404 error code if model does not represent an existing product", async () => {
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new ProductNotFoundError());

            const response = await request(app).delete(`${cartURL}/products/NonExistingModel`).set('Cookie', customerCookie);
            expect(response.status).toBe(404);
        });

        test("CI2.23: should return 401 error code if the user is not logged in", async () => {
            const response = await request(app).delete(`${cartURL}/products/${inputModel}`);
            expect(response.status).toBe(401);
        });

        test("CI2.24: should return 401 error code if the user is not a customer", async () => {
            const response = await request(app).delete(`${cartURL}/products/${inputModel}`).set('Cookie', adminCookie);
            expect(response.status).toBe(401);
        });
    });

    describe(`DELETE ${cartURL}/current - emptying the current cart`, () => {
        const inputUser = 'test-user';

        beforeEach(() => {
            jest.spyOn(CartController.prototype, "clearCart").mockReset();
        });

        test("CI2.25: should return 200 success code when emptying the current cart", async () => {
            jest.spyOn(CartController.prototype, "clearCart").mockResolvedValueOnce();

            const response = await request(app).delete(`${cartURL}/current`).set('Cookie', customerCookie);
            expect(response.status).toBe(200);
        });

        test("CI2.26: should return 404 error code if no unpaid cart exists", async () => {
            jest.spyOn(CartController.prototype, "clearCart").mockRejectedValueOnce(new CartNotFoundError());

            const response = await request(app).delete(`${cartURL}/current`).set('Cookie', customerCookie);
            expect(response.status).toBe(404);
        });

        test("CI2.27: should return 401 error code if the user is not logged in", async () => {
            const response = await request(app).delete(`${cartURL}/current`);
            expect(response.status).toBe(401);
        });

        test("CI2.28: should return 401 error code if the user is not a customer", async () => {
            const response = await request(app).delete(`${cartURL}/current`).set('Cookie', adminCookie);
            expect(response.status).toBe(401);
        });
    });

    describe(`DELETE ${cartURL} - deleting all existing carts of all users`, () => {
        beforeEach(() => {
            jest.spyOn(CartController.prototype, "deleteAllCarts").mockReset();
        });

        test("CI2.29: should return 200 success code when deleting all existing carts", async () => {
            jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValueOnce(true);

            const response = await request(app).delete(`${cartURL}`).set('Cookie', adminCookie);
            expect(response.status).toBe(200);
        });

        test("CI2.30: should return 401 error code if the user is not logged in", async () => {
            const response = await request(app).delete(`${cartURL}`);
            expect(response.status).toBe(401);
        });

        test("CI2.31: should return 401 error code if the user is not an admin or manager", async () => {
            const response = await request(app).delete(`${cartURL}`).set('Cookie', customerCookie);
            expect(response.status).toBe(401);
        });
    });

    describe(`GET ${cartURL}/all - getting all carts of all users`, () => {
        const inputAdmin = 'admin-user';
        const inputManager = 'manager-user';

        const testCarts = [
            new Cart("user1", true, "2024-05-02", 200, [new ProductInCart("iPhone 13", 1, Category.SMARTPHONE, 200)]),
            new Cart("user2", false, "", 300, [new ProductInCart("iPhone 14", 2, Category.SMARTPHONE, 150)]),
        ];

        beforeEach(() => {
            jest.spyOn(CartController.prototype, "getAllCarts").mockReset();
        });

        test("CI2.32: should return 200 success code and all carts for admin user", async () => {
            jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce(testCarts);

            const response = await request(app).get(`${cartURL}/all`).set('Cookie', adminCookie);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(testCarts);
        });

        test("CI2.33: should return 200 success code and all carts for manager user", async () => {
            jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce(testCarts);

            const response = await request(app).get(`${cartURL}/all`).set('Cookie', managerCookie);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(testCarts);
        });

        test("CI2.34: should return 401 error code if the user is not logged in", async () => {
            const response = await request(app).get(`${cartURL}/all`);
            expect(response.status).toBe(401);
        });

        test("CI2.35: should return 401 error code if the user is not an admin or manager", async () => {
            const response = await request(app).get(`${cartURL}/all`).set('Cookie', customerCookie);
            expect(response.status).toBe(401);
        });
    });
});
