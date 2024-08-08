import { describe, test, jest, expect, beforeEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import CartController from "../src/controllers/cartController"
import Authenticator from "../src/routers/auth"
import { Category } from "../src/components/product"
import { ProductNotFoundError, ProductSoldError, LowProductStockError } from "../src/errors/productError"
import { CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError, EmptyCartError } from "../src/errors/cartError"
import {Cart, ProductInCart} from "../src/components/cart"

const baseURL = "/ezelectronics"
const cartURL = `${baseURL}/carts`

jest.mock("../src/controllers/cartController")
jest.mock("../src/routers/auth")

describe("Cart routes integration tests", () => {
    describe(`GET ${cartURL} - getting the current cart of the logged-in user`, () => {
        const inputUser = 'test-user'
        const testCart = {
            customer: inputUser,
            products: [{ model: "test-model", category: Category.SMARTPHONE, quantity: 1, price: 200 }],
            total: 200,
            paid: false,
            paymentDate: ""
        }

        beforeEach(() => {
            jest.spyOn(CartController.prototype, "getCart").mockReset()
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockReset()
            jest.spyOn(Authenticator.prototype, "isCustomer").mockReset()
        })

        test("CI1.1: should return 200 success code and the current cart", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(testCart)

            const response = await request(app).get(`${cartURL}`).set('Cookie', 'test-cookie')
            expect(response.status).toBe(200)
            expect(response.body).toEqual(testCart)
        })

        test("CI1.2: should return 401 error code if the user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthenticated" }))

            const response = await request(app).get(`${cartURL}`)
            expect(response.status).toBe(401)
        })

        test("CI1.3: should return 401 error code if the user is not a customer", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))

            const response = await request(app).get(`${cartURL}`).set('Cookie', 'test-cookie')
            expect(response.status).toBe(401)
        })
    })

    describe(`POST ${cartURL} - adding a product to the cart`, () => {
        const inputModel = 'test-model'
        const inputUser = 'test-user'
        const inputProduct = { model: inputModel }

        beforeEach(() => {
            jest.spyOn(CartController.prototype, "addToCart").mockReset()
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockReset()
            jest.spyOn(Authenticator.prototype, "isCustomer").mockReset()
        })

        test("CI1.4: should return 200 success code when adding a product to the cart", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true)

            const response = await request(app).post(`${cartURL}`).send(inputProduct).set('Cookie', 'test-cookie')
            expect(response.status).toBe(200)
        })

        test("CI1.5: should return 404 error code if the product does not exist", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new ProductNotFoundError())

            const response = await request(app).post(`${cartURL}`).send({ model: "NonExistingModel" }).set('Cookie', 'test-cookie')
            expect(response.status).toBe(404)
        })

        test("CI1.6: should return 409 error code if the product is out of stock", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new ProductSoldError())

            const response = await request(app).post(`${cartURL}`).send(inputProduct).set('Cookie', 'test-cookie')
            expect(response.status).toBe(409)
        })

        test("CI1.7: should return 401 error code if the user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthenticated" }))

            const response = await request(app).post(`${cartURL}`).send(inputProduct)
            expect(response.status).toBe(401)
        })

        test("CI1.8: should return 401 error code if the user is not a customer", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))

            const response = await request(app).post(`${cartURL}`).send(inputProduct).set('Cookie', 'test-cookie')
            expect(response.status).toBe(401)
        })
    })

    describe(`PATCH ${cartURL} - simulating payment for the current cart`, () => {
        const inputUser = 'test-user';
    
        beforeEach(() => {
            jest.spyOn(CartController.prototype, "checkoutCart").mockReset();
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockReset();
            jest.spyOn(Authenticator.prototype, "isCustomer").mockReset();
        });
    
        test("CI1.9: should return 200 success code when simulating payment", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next());
            jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValueOnce(true);
    
            const response = await request(app).patch(`${cartURL}`).set('Cookie', 'test-cookie');
            expect(response.status).toBe(200);
        });
    
        test("CI1.10: should return 404 error code if no unpaid cart exists", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next());
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new CartNotFoundError());
    
            const response = await request(app).patch(`${cartURL}`).set('Cookie', 'test-cookie');
            expect(response.status).toBe(404);
        });
    
        test("CI1.11: should return 400 error code if the cart contains no product", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next());
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new EmptyCartError());
    
            const response = await request(app).patch(`${cartURL}`).set('Cookie', 'test-cookie');
            expect(response.status).toBe(400);
        });
    
        test("CI1.12: should return 409 error code if at least one product in the cart is out of stock", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next());
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new ProductSoldError());
    
            const response = await request(app).patch(`${cartURL}`).set('Cookie', 'test-cookie');
            expect(response.status).toBe(409);
        });
    
        test("CI1.13: should return 409 error code if at least one product quantity in the cart exceeds available quantity", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next());
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new LowProductStockError());
    
            const response = await request(app).patch(`${cartURL}`).set('Cookie', 'test-cookie');
            expect(response.status).toBe(409);
        });
    
        test("CI1.14: should return 401 error code if the user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthenticated" }));
    
            const response = await request(app).patch(`${cartURL}`);
            expect(response.status).toBe(401);
        });
    
        test("CI1.15: should return 401 error code if the user is not a customer", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next());
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }));
    
            const response = await request(app).patch(`${cartURL}`).set('Cookie', 'test-cookie');
            expect(response.status).toBe(401);
        });
    });

    describe(`GET ${cartURL}/history - getting the payment history of the logged-in user`, () => {
        const inputUser = 'test-user'
        const testHistory = [
            {
                customer: inputUser,
                products: [{ model: "test-model", category: Category.SMARTPHONE, quantity: 1, price: 200 }],
                total: 200,
                paid: true,
                paymentDate: "2021-01-01"
            }
        ]

        beforeEach(() => {
            jest.spyOn(CartController.prototype, "getCustomerCarts").mockReset()
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockReset()
            jest.spyOn(Authenticator.prototype, "isCustomer").mockReset()
        })

        test("CI1.16: should return 200 success code and the payment history", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValueOnce(testHistory)

            const response = await request(app).get(`${cartURL}/history`).set('Cookie', 'test-cookie')
            expect(response.status).toBe(200)
            expect(response.body).toEqual(testHistory)
        })

        test("CI1.17: should return 401 error code if the user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthenticated" }))

            const response = await request(app).get(`${cartURL}/history`)
            expect(response.status).toBe(401)
        })

        test("CI1.18: should return 401 error code if the user is not a customer", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))

            const response = await request(app).get(`${cartURL}/history`).set('Cookie', 'test-cookie')
            expect(response.status).toBe(401)
        })
    })

    describe(`DELETE ${cartURL}/products/:model - deleting a product from the cart`, () => {
        const inputModel = 'test-model';
        const inputUser = 'test-user';
    
        beforeEach(() => {
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockReset();
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockReset();
            jest.spyOn(Authenticator.prototype, "isCustomer").mockReset();
        });
    
        test("CI1.19: should return 200 success code when removing a product from the cart", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next());
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValueOnce(true);
    
            const response = await request(app).delete(`${cartURL}/products/${inputModel}`).set('Cookie', 'test-cookie');
            expect(response.status).toBe(200);
        });
    
        test("CI1.20: should return 404 error code if the product is not in the cart", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next());
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new ProductNotInCartError());
    
            const response = await request(app).delete(`${cartURL}/products/${inputModel}`).set('Cookie', 'test-cookie');
            expect(response.status).toBe(404);
        });
    
        test("CI1.21: should return 404 error code if there is no information about an unpaid cart for the user, or if there are no products in the cart", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next());
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new CartNotFoundError());
    
            const response = await request(app).delete(`${cartURL}/products/${inputModel}`).set('Cookie', 'test-cookie');
            expect(response.status).toBe(404);
        });
    
        test("CI1.22: should return 404 error code if model does not represent an existing product", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next());
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new ProductNotFoundError());
    
            const response = await request(app).delete(`${cartURL}/products/NonExistingModel`).set('Cookie', 'test-cookie');
            expect(response.status).toBe(404);
        });
    
        test("CI1.23: should return 401 error code if the user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthenticated" }));
    
            const response = await request(app).delete(`${cartURL}/products/${inputModel}`);
            expect(response.status).toBe(401);
        });
    
        test("CI1.24: should return 401 error code if the user is not a customer", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next());
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }));
    
            const response = await request(app).delete(`${cartURL}/products/${inputModel}`).set('Cookie', 'test-cookie');
            expect(response.status).toBe(401);
        });
    });

    describe(`DELETE ${cartURL}/current - emptying the current cart`, () => {
        const inputUser = 'test-user'

        beforeEach(() => {
            jest.spyOn(CartController.prototype, "clearCart").mockReset()
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockReset()
            jest.spyOn(Authenticator.prototype, "isCustomer").mockReset()
        })

        test("CI1.25: should return 200 success code when emptying the current cart", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(CartController.prototype, "clearCart").mockResolvedValueOnce()

            const response = await request(app).delete(`${cartURL}/current`).set('Cookie', 'test-cookie')
            expect(response.status).toBe(200)
        })

        test("CI1.26: should return 404 error code if no unpaid cart exists", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser
                next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(CartController.prototype, "clearCart").mockRejectedValueOnce(new CartNotFoundError())

            const response = await request(app).delete(`${cartURL}/current`).set('Cookie', 'test-cookie')
            expect(response.status).toBe(404)
        })

        test("CI1.27: should return 401 error code if the user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthenticated" }))

            const response = await request(app).delete(`${cartURL}/current`)
            expect(response.status).toBe(401)
        })

        test("CI1.28: should return 401 error code if the user is not a customer", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))

            const response = await request(app).delete(`${cartURL}/current`).set('Cookie', 'test-cookie')
            expect(response.status).toBe(401)
        })
    })

    describe(`DELETE ${cartURL} - deleting all existing carts of all users`, () => {
        const inputUser = 'test-user';

        beforeEach(() => {
            jest.spyOn(CartController.prototype, "deleteAllCarts").mockReset();
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockReset();
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockReset();
        });

        test("CI1.29: should return 200 success code when deleting all existing carts", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputUser;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: () => any) => next());
            jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValueOnce(true);

            const response = await request(app).delete(`${cartURL}`).set('Cookie', 'test-cookie');
            expect(response.status).toBe(200);
        });

        test("CI1.30: should return 401 error code if the user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthenticated" }));

            const response = await request(app).delete(`${cartURL}`);
            expect(response.status).toBe(401);
        });

        test("CI1.31: should return 401 error code if the user is not an admin or manager", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next());
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }));

            const response = await request(app).delete(`${cartURL}`).set('Cookie', 'test-cookie');
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
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockReset();
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockReset();
        });
    
        test("CI1.32: should return 200 success code and all carts for admin user", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputAdmin;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: () => any) => next());
            jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce(testCarts);
    
            const response = await request(app).get(`${cartURL}/all`).set('Cookie', 'admin-cookie');
            expect(response.status).toBe(200);
            expect(response.body).toEqual(testCarts);
        });
    
        test("CI1.33: should return 200 success code and all carts for manager user", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = inputManager;
                next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: () => any) => next());
            jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce(testCarts);
    
            const response = await request(app).get(`${cartURL}/all`).set('Cookie', 'manager-cookie');
            expect(response.status).toBe(200);
            expect(response.body).toEqual(testCarts);
        });
    
        test("CI1.34: should return 401 error code if the user is not logged in", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthenticated" }));
    
            const response = await request(app).get(`${cartURL}/all`);
            expect(response.status).toBe(401);
        });
    
        test("CI1.35: should return 401 error code if the user is not an admin or manager", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = "customer-user";
                next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }));
    
            const response = await request(app).get(`${cartURL}/all`).set('Cookie', 'customer-cookie');
            expect(response.status).toBe(401);
        });
    });
})
