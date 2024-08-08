import {beforeAll, expect, jest, test, describe, beforeEach, afterAll} from "@jest/globals";
import request from 'supertest';
import {app} from "../index";
import {cleanup} from "../src/db/cleanup";
import {Cart, ProductInCart} from "../src/components/cart";
import {Product, Category} from "../src/components/product";
import CartDAO from "../src/dao/cartDAO";
import ProductDAO from "../src/dao/productDAO";
import {Role} from "../src/components/user";

//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: Role.CUSTOMER };
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: Role.MANAGER };
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: Role.ADMIN };
//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string;
let managerCookie: string;
let adminCookie: string;

const baseURL = "/ezelectronics";
const cartURL = `${baseURL}/carts`;
jest.mock("../src/dao/cartDAO");
jest.mock("../src/dao/productDAO");

//Helper function that creates a new user in the database.
//Can be used to create a user before the tests or in the tests
//Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${baseURL}/users`)
        .send(userInfo)
        .expect(200);
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
                    reject(err);
                }
                resolve(res.header["set-cookie"][0]);
            });
    });
}

//Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable
beforeAll(async () => {
    await cleanup();
    await postUser(customer);
    customerCookie = await login(customer);
    await postUser(manager);
    managerCookie = await login(manager);
    await postUser(admin);
    adminCookie = await login(admin);
});

//After executing tests, we remove everything from our test database
afterAll(async() => {
    await cleanup();
});

// Integration tests for Cart API
describe("Cart routes integration tests", () => {

    describe(`GET ${cartURL} - getting the current cart of the logged-in user`, () => {
        const inputUser = 'customer';
        const testCart = new Cart(
            inputUser,
            false,
            "",
            200,
            [new ProductInCart("test-model", 1, Category.SMARTPHONE, 200)]
        );
        const emptyCart = new Cart(
            inputUser,
            false,
            "",
            0,
            []
        );
        beforeEach(() => {
            jest.spyOn(CartDAO.prototype, "getCurrentCart").mockReset();
            jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockReset();
        });

        test("CI3.1: should return 200 success code and the current cart", async () => {
            jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(testCart);
            jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(1);
            jest.spyOn(CartDAO.prototype, "updateTotal").mockResolvedValueOnce(true);
            jest.spyOn(CartDAO.prototype, "createCart").mockResolvedValueOnce(1);
            jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(testCart);
            const response = await request(app).get(`${cartURL}`).set('Cookie', customerCookie);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(JSON.parse(JSON.stringify(testCart)));
        });
        test("CI3.2: should return 200 success code and an empty cart", async () => {
            jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(emptyCart);
            jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(1);
            jest.spyOn(CartDAO.prototype, "updateTotal").mockResolvedValueOnce(true);
            jest.spyOn(CartDAO.prototype, "createCart").mockResolvedValueOnce(1);
            jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(emptyCart);
            const response = await request(app).get(`${cartURL}`).set('Cookie', customerCookie);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(JSON.parse(JSON.stringify(emptyCart)));
        });
        test("CI3.3: should return 401 error code if the user is not logged in", async () => {
            const response = await request(app).get(`${cartURL}`);
            expect(response.status).toBe(401);
        });

        test("CI3.4: should return 401 error code if the user is not a customer", async () => {
            const response = await request(app).get(`${cartURL}`).set('Cookie', adminCookie);
            expect(response.status).toBe(401);
        });
    });

    describe(`POST ${cartURL} - adding a product to the cart`, () => {
        const inputModel = 'test-model';
        const inputUser = 'customer';
        const inputProduct = { model: inputModel };

        beforeEach(() => {
            jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockReset();
            jest.spyOn(CartDAO.prototype, "addToCart").mockReset();
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockReset();
        });

        test("CI3.5: should return 200 success code when adding a product to the cart", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(new Product(200, inputModel, Category.SMARTPHONE, "2021-01-01", "test details", 10));
            jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(1);
            jest.spyOn(CartDAO.prototype, "getProductInCart").mockResolvedValueOnce(new ProductInCart(inputModel,1,Category.SMARTPHONE,200));
            jest.spyOn(CartDAO.prototype, "addToCart").mockResolvedValueOnce(true);

            const response = await request(app).post(cartURL).send(inputProduct).set('Cookie', customerCookie);
            expect(response.status).toBe(200);
        });
        test("CI3.6: should return 200 success code when adding a product to a new cart", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(new Product(200, inputModel, Category.SMARTPHONE, "2021-01-01", "test details", 10));
            jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(null);
            jest.spyOn(CartDAO.prototype, "createCart").mockResolvedValueOnce(1);
            jest.spyOn(CartDAO.prototype, "addToCart").mockResolvedValueOnce(true);

            const response = await request(app).post(cartURL).send(inputProduct).set('Cookie', customerCookie);
            expect(response.status).toBe(200);
        });

        test("CI3.7: should return 200 success code when updating quantity of a product to the cart", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(new Product(200, inputModel, Category.SMARTPHONE, "2021-01-01", "test details", 10));
            jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(1);
            jest.spyOn(CartDAO.prototype, "getProductInCart").mockResolvedValueOnce(new ProductInCart(inputModel,1,Category.SMARTPHONE,200));
            jest.spyOn(CartDAO.prototype, "updateProductQuantity").mockResolvedValueOnce(true);

            const response = await request(app).post(cartURL).send(inputProduct).set('Cookie', customerCookie);
            expect(response.status).toBe(200);
        });
        test("CI3.8: should return 404 error code if the product does not exist", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(null);

            const response = await request(app).post(cartURL).send(inputProduct).set('Cookie', customerCookie);
            expect(response.status).toBe(404);
        });

        test("CI3.9: should return 409 error code if the product is out of stock", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(new Product(200, inputModel, Category.SMARTPHONE, "2021-01-01", "test details", 0));

            const response = await request(app).post(cartURL).send(inputProduct).set('Cookie', customerCookie);
            expect(response.status).toBe(409);
        });

        test("CI3.10: should return 401 error code if the user is not logged in", async () => {
            const response = await request(app).post(cartURL).send(inputProduct);
            expect(response.status).toBe(401);
        });

        test("CI3.11: should return 401 error code if the user is not a customer", async () => {
            const response = await request(app).post(cartURL).send(inputProduct).set('Cookie', adminCookie);
            expect(response.status).toBe(401);
        });
    });

    describe(`PATCH ${cartURL} - simulating payment for the current cart`, () => {
        const inputUser = 'customer';

        beforeEach(() => {
            jest.spyOn(CartDAO.prototype, "checkoutCart").mockReset();
            jest.spyOn(CartDAO.prototype, "getCurrentCart").mockReset();
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockReset();
        });

        test("CI3.12: should return 200 success code when simulating payment", async () => {
            const testCart = new Cart(inputUser, false, "", 200, [new ProductInCart("test-model", 1, Category.SMARTPHONE, 200)]);
            jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(testCart);
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(new Product(200, "test-model", Category.SMARTPHONE, "2021-01-01", "test details", 10));
            jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(1);
            jest.spyOn(CartDAO.prototype, "checkoutCart").mockResolvedValueOnce(true);

            const response = await request(app).patch(cartURL).set('Cookie', customerCookie);
            expect(response.status).toBe(200);
        });

        test("CI3.13: should return 404 error code if no unpaid cart exists", async () => {
            jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(null);

            const response = await request(app).patch(cartURL).set('Cookie', customerCookie);
            expect(response.status).toBe(404);
        });

        test("CI3.14: should return 400 error code if the cart contains no product", async () => {
            const testCart = new Cart(inputUser, false, "", 200, []);
            jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(testCart);

            const response = await request(app).patch(cartURL).set('Cookie', customerCookie);
            expect(response.status).toBe(400);
        });

        test("CI3.15: should return 409 error code if at least one product in the cart is out of stock", async () => {
            const testCart = new Cart(inputUser, false, "", 200, [new ProductInCart("test-model", 1, Category.SMARTPHONE, 200)]);
            jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(testCart);
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(new Product(200, "test-model", Category.SMARTPHONE, "2021-01-01", "test details", 0));

            const response = await request(app).patch(cartURL).set('Cookie', customerCookie);
            expect(response.status).toBe(409);
        });

        test("CI3.16: should return 409 error code if at least one product quantity in the cart exceeds available quantity", async () => {
            const testCart = new Cart(inputUser, false, "", 200, [new ProductInCart("test-model", 10, Category.SMARTPHONE, 200)]);
            jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(testCart);
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(new Product(200, "test-model", Category.SMARTPHONE, "2021-01-01", "test details", 5));

            const response = await request(app).patch(cartURL).set('Cookie', customerCookie);
            expect(response.status).toBe(409);
        });

        test("CI3.17: should return 401 error code if the user is not logged in", async () => {
            const response = await request(app).patch(cartURL);
            expect(response.status).toBe(401);
        });

        test("CI3.18: should return 401 error code if the user is not a customer", async () => {
            const response = await request(app).patch(cartURL).set('Cookie', adminCookie);
            expect(response.status).toBe(401);
        });
    });

    describe(`GET ${cartURL}/history - getting the payment history of the logged-in user`, () => {
        const inputUser = 'customer';
        const testHistory = [
            new Cart(inputUser, true, "2021-01-01", 200, [new ProductInCart("test-model", 1, Category.SMARTPHONE, 200)])
        ];

        beforeEach(() => {
            jest.spyOn(CartDAO.prototype, "getPaidCarts").mockReset();
        });

        test("CI3.19: should return 200 success code and the payment history", async () => {
            jest.spyOn(CartDAO.prototype, "getPaidCarts").mockResolvedValueOnce(testHistory);

            const response = await request(app).get(`${cartURL}/history`).set('Cookie', customerCookie);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(testHistory);
        });

        test("CI3.20: should return 401 error code if the user is not logged in", async () => {
            const response = await request(app).get(`${cartURL}/history`);
            expect(response.status).toBe(401);
        });

        test("CI3.21: should return 401 error code if the user is not a customer", async () => {
            const response = await request(app).get(`${cartURL}/history`).set('Cookie', adminCookie);
            expect(response.status).toBe(401);
        });
    });

    describe(`DELETE ${cartURL}/products/:model - deleting a product from the cart`, () => {
        const inputModel = 'test-model';
        const inputUser = 'customer';

        beforeEach(() => {
            jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockReset();
            jest.spyOn(CartDAO.prototype, "getCurrentCart").mockReset();
            jest.spyOn(CartDAO.prototype, "getProductInCart").mockReset();
            jest.spyOn(CartDAO.prototype, "deleteProductFromCart").mockReset();
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockReset();
        });

        test("CI3.22: should return 200 success code when removing a product from the cart", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(new Product(200, inputModel, Category.SMARTPHONE, "2021-01-01", "test details", 10));
            jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(1);
            jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(new Cart(inputUser, false, "", 200, [new ProductInCart(inputModel, 1, Category.SMARTPHONE, 200)]));
            jest.spyOn(CartDAO.prototype, "getProductInCart").mockResolvedValueOnce(new ProductInCart(inputModel, 1, Category.SMARTPHONE, 200));
            jest.spyOn(CartDAO.prototype, "deleteProductFromCart").mockResolvedValueOnce(true);

            const response = await request(app).delete(`${cartURL}/products/${inputModel}`).set('Cookie', customerCookie);
            expect(response.status).toBe(200);
        });
        test("CI3.23: should return 200 success code when dereasing quantity of a product from the cart", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(new Product(200, inputModel, Category.SMARTPHONE, "2021-01-01", "test details", 10));
            jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(1);
            jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(new Cart(inputUser, false, "", 200, [new ProductInCart(inputModel, 1, Category.SMARTPHONE, 200)]));
            jest.spyOn(CartDAO.prototype, "getProductInCart").mockResolvedValueOnce(new ProductInCart(inputModel, 2, Category.SMARTPHONE, 200));
            jest.spyOn(CartDAO.prototype, "updateProductQuantity").mockResolvedValueOnce(true);

            const response = await request(app).delete(`${cartURL}/products/${inputModel}`).set('Cookie', customerCookie);
            expect(response.status).toBe(200);
        });
        test("CI3.24: should return 404 error code if the product is not in the cart", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(new Product(200, inputModel, Category.SMARTPHONE, "2021-01-01", "test details", 10));
            jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(1);
            jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(new Cart(inputUser, false, "", 200, []));
            jest.spyOn(CartDAO.prototype, "getProductInCart").mockResolvedValueOnce(null);

            const response = await request(app).delete(`${cartURL}/products/${inputModel}`).set('Cookie', customerCookie);
            expect(response.status).toBe(404);
        });

        test("CI3.25: should return 404 error code if there is no information about an unpaid cart for the user, or if there are no products in the cart", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(new Product(200, inputModel, Category.SMARTPHONE, "2021-01-01", "test details", 10));
            jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(null);

            const response = await request(app).delete(`${cartURL}/products/${inputModel}`).set('Cookie', customerCookie);
            expect(response.status).toBe(404);
        });

        test("CI3.26: should return 404 error code if model does not represent an existing product", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null);

            const response = await request(app).delete(`${cartURL}/products/${inputModel}`).set('Cookie', customerCookie);
            expect(response.status).toBe(404);
        });

        test("CI3.27: should return 401 error code if the user is not logged in", async () => {
            const response = await request(app).delete(`${cartURL}/products/${inputModel}`);
            expect(response.status).toBe(401);
        });

        test("CI3.28: should return 401 error code if the user is not a customer", async () => {
            const response = await request(app).delete(`${cartURL}/products/${inputModel}`).set('Cookie', adminCookie);
            expect(response.status).toBe(401);
        });
    });

    describe(`DELETE ${cartURL}/current - emptying the current cart`, () => {
        const inputUser = 'customer';

        beforeEach(() => {
            jest.spyOn(CartDAO.prototype, "getCurrentCart").mockReset();
            jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockReset();
            jest.spyOn(CartDAO.prototype, "deleteProductFromCart").mockReset();
        });

        test("CI3.29: should return 200 success code when emptying the current cart", async () => {
            const testCart = new Cart(inputUser, false, "", 200, [new ProductInCart("test-model", 1, Category.SMARTPHONE, 200)]);
            jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(testCart);
            jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(1);
            jest.spyOn(CartDAO.prototype, "deleteProductFromCart").mockResolvedValueOnce(true);

            const response = await request(app).delete(`${cartURL}/current`).set('Cookie', customerCookie);
            expect(response.status).toBe(200);
        });

        test("CI3.30: should return 404 error code if no unpaid cart exists", async () => {
            jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(null);

            const response = await request(app).delete(`${cartURL}/current`).set('Cookie', customerCookie);
            expect(response.status).toBe(404);
        });

        test("CI3.31: should return 401 error code if the user is not logged in", async () => {
            const response = await request(app).delete(`${cartURL}/current`);
            expect(response.status).toBe(401);
        });

        test("CI3.32: should return 401 error code if the user is not a customer", async () => {
            const response = await request(app).delete(`${cartURL}/current`).set('Cookie', adminCookie);
            expect(response.status).toBe(401);
        });
    });

    describe(`DELETE ${cartURL} - deleting all existing carts of all users`, () => {
        const inputUser = 'admin';

        beforeEach(() => {
            jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockReset();
        });

        test("CI3.33: should return 200 success code when deleting all existing carts", async () => {
            jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockResolvedValueOnce(true);

            const response = await request(app).delete(`${cartURL}`).set('Cookie', adminCookie);
            expect(response.status).toBe(200);
        });

        test("CI3.34: should return 401 error code if the user is not logged in", async () => {
            const response = await request(app).delete(`${cartURL}`);
            expect(response.status).toBe(401);
        });

        test("CI3.35: should return 401 error code if the user is not an admin or manager", async () => {
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
            jest.spyOn(CartDAO.prototype, "getAllCarts").mockReset();
        });

        test("CI3.36: should return 200 success code and all carts for admin user", async () => {
            jest.spyOn(CartDAO.prototype, "getAllCarts").mockResolvedValueOnce(testCarts);

            const response = await request(app).get(`${cartURL}/all`).set('Cookie', adminCookie);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(testCarts);
        });

        test("CI3.37: should return 200 success code and all carts for manager user", async () => {
            jest.spyOn(CartDAO.prototype, "getAllCarts").mockResolvedValueOnce(testCarts);

            const response = await request(app).get(`${cartURL}/all`).set('Cookie', managerCookie);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(testCarts);
        });

        test("CI3.38: should return 401 error code if the user is not logged in", async () => {
            const response = await request(app).get(`${cartURL}/all`);
            expect(response.status).toBe(401);
        });

        test("CI3.39: should return 401 error code if the user is not an admin or manager", async () => {
            const response = await request(app).get(`${cartURL}/all`).set('Cookie', customerCookie);
            expect(response.status).toBe(401);
        });
    });
});
