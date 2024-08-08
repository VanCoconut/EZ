import { describe, test, expect, jest } from "@jest/globals";
import CartDAO from "../../src/dao/cartDAO";
import { Cart, ProductInCart } from "../../src/components/cart";
import { Category } from "../../src/components/product";
import db from "../../src/db/db";
import { Database } from "sqlite3";

jest.mock("../../src/db/db.ts");

describe('CartDAO', () => {

    describe('createCart', () => {
        test('CDU1: should create a new cart and resolve with new cart ID', async () => {
            const cartDAO = new CartDAO();
            const expectedCartId = 1;

            const mockRun = jest.spyOn(db, 'run').mockImplementation(function (sql, params, callback) {
                callback.call({ lastID: expectedCartId, changes: 1 }, null);
                return {} as Database;
            });

            const result = await cartDAO.createCart("customer");
            expect(result).toBe(expectedCartId);

            mockRun.mockRestore();
        });
    });

    describe('getCurrentCartId', () => {
        test('CDU2: should resolve into a cart ID', async () => {
            const cartDAO = new CartDAO();

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, { cartId: 1 });
                return {} as Database;
            });

            const result = await cartDAO.getCurrentCartId("username");
            expect(result).toEqual(1);

            mockDBGet.mockRestore();
        });

        test('CDU3: should resolve into null', async () => {
            const cartDAO = new CartDAO();

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, undefined);
                return {} as Database;
            });

            const result = await cartDAO.getCurrentCartId("username");
            expect(result).toBe(null);

            mockDBGet.mockRestore();
        });
    });

    describe('getCurrentCart', () => {
        test('CDU4: should return the current cart with products when there is an unpaid cart', async () => {
            const cartDAO = new CartDAO();
            const customer = "customer";
            const expectedCart = new Cart(customer, false, "", 100, [
                new ProductInCart("model1", 1, Category.SMARTPHONE, 50),
                new ProductInCart("model2", 2, Category.LAPTOP, 25)
            ]);

            const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                if (sql.includes('SELECT cartId, customer, paid, paymentDate, total FROM carts WHERE customer = ? AND paid = 0')) {
                    callback(null, {
                        cartId: 1,
                        customer: customer,
                        paid: 0,
                        paymentDate: null,
                        total: 100
                    });
                }
                return {} as Database;
            });

            const mockDBAll = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                if (sql.includes('SELECT model, quantity, category, price FROM carts_records WHERE cartId = ? AND deleted = 0')) {
                    callback(null, [
                        { model: "model1", quantity: 1, category: Category.SMARTPHONE, price: 50 },
                        { model: "model2", quantity: 2, category: Category.LAPTOP, price: 25 }
                    ]);
                }
                return {} as Database;
            });

            const result = await cartDAO.getCurrentCart(customer);
            expect(result).toEqual(expectedCart);

            mockDBGet.mockRestore();
            mockDBAll.mockRestore();
        });

        test('CDU5: should return null when there is no unpaid cart', async () => {
            const cartDAO = new CartDAO();
            const customer = "customer";

            const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                if (sql.includes('SELECT cartId, customer, paid, paymentDate, total FROM carts WHERE customer = ? AND paid = 0')) {
                    callback(null);
                }
                return {} as Database;
            });

            const result = await cartDAO.getCurrentCart(customer);
            expect(result).toEqual(null);

            mockDBGet.mockRestore();
        });

        test('CDU6: should reject when there is an error retrieving the cart', async () => {
            const cartDAO = new CartDAO();
            const customer = "customer";

            const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(new Error('Database error'), null);
                return {} as Database;
            });

            await expect(cartDAO.getCurrentCart(customer)).rejects.toThrow('Database error');

            mockDBGet.mockRestore();
        });

        test('CDU7: should reject when there is an error retrieving the products', async () => {
            const cartDAO = new CartDAO();
            const customer = "customer";

            const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, {
                    cartId: 1,
                    customer: customer,
                    paid: 0,
                    paymentDate: null,
                    total: 100
                });
                return {} as Database;
            });

            const mockDBAll = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(new Error('Database error'), null);
                return {} as Database;
            });

            await expect(cartDAO.getCurrentCart(customer)).rejects.toThrow('Database error');

            mockDBGet.mockRestore();
            mockDBAll.mockRestore();
        });
    });

    describe('getProductInCart', () => {
        test('CDU8: should return the product in the cart when it exists', async () => {
            const cartDAO = new CartDAO();
            const cartId = 1;
            const productModel = "model1";
            const expectedProduct = new ProductInCart(productModel, 2, Category.SMARTPHONE, 50);

            const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, {
                    model: productModel,
                    quantity: 2,
                    category: "Smartphone",
                    price: 50
                });
                return {} as Database;
            });

            const result = await cartDAO.getProductInCart(cartId, productModel);
            expect(result).toEqual(expectedProduct);

            mockDBGet.mockRestore();
        });

        test('CDU9: should reject when there is a database error', async () => {
            const cartDAO = new CartDAO();
            const cartId = 1;
            const productModel = "model1";

            const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(new Error('Database error'), null);
                return {} as Database;
            });

            await expect(cartDAO.getProductInCart(cartId, productModel)).rejects.toThrow('Database error');

            mockDBGet.mockRestore();
        });
    });

    describe('addToCart', () => {
        test('CDU10: should return true when correctly insert in db', async () => {
            const cartDAO = new CartDAO();
            const cartId = 1;
            const productModel = "model1";
            const category = "SMARTPHONE";
            const price = 100;

            const mockRun = jest.spyOn(db, 'run').mockImplementation(function (sql, params, callback) {
                callback.call({ changes: 1 }, null);
                return {} as Database;
            });
            const result = await cartDAO.addToCart(cartId, productModel, category, price);
            expect(result).toBe(true);

            mockRun.mockRestore();
        });

        test('CDU11: should return false when insert in db does not affect any row', async () => {
            const cartDAO = new CartDAO();
            const cartId = 1;
            const productModel = "model1";
            const category = "SMARTPHONE";
            const price = 100;

            const mockRun = jest.spyOn(db, 'run').mockImplementation(function (sql, params, callback) {
                callback.call({ changes: 0 }, null);
                return {} as Database;
            });

            const result = await cartDAO.addToCart(cartId, productModel, category, price);
            expect(result).toBe(false);

            mockRun.mockRestore();
        });

        test('CDU12: should reject when there is a database error', async () => {
            const cartDAO = new CartDAO();
            const cartId = 1;
            const productModel = "model1";
            const category = "SMARTPHONE";
            const price = 100;

            const mockRun = jest.spyOn(db, 'run').mockImplementation(function (sql, params, callback) {
                callback(new Error('Database error'));
                return {} as Database;
            });

            await expect(cartDAO.addToCart(cartId, productModel, category, price)).rejects.toThrow('Database error');

            mockRun.mockRestore();
        });
    });

    describe('updateProductQuantity', () => {
        test('CDU13: should resolve to true if the quantity was successfully incremented', async () => {
            const cartDAO = new CartDAO();
            const cartId = 1;
            const productModel = "model1";
            const increment = true;

            const mockRun = jest.spyOn(db, 'run').mockImplementation(function (sql, params, callback) {
                callback.call({ changes: 1 }, null);
                return {} as Database;
            });

            const result = await cartDAO.updateProductQuantity(cartId, productModel, increment);
            expect(result).toBe(true);

            mockRun.mockRestore();
        });

        test('CDU14: should resolve to true if the quantity was successfully decremented', async () => {
            const cartDAO = new CartDAO();
            const cartId = 1;
            const productModel = "model1";
            const increment = false;

            const mockRun = jest.spyOn(db, 'run').mockImplementation(function (sql, params, callback) {
                callback.call({ changes: 1 }, null);
                return {} as Database;
            });

            const result = await cartDAO.updateProductQuantity(cartId, productModel, increment);
            expect(result).toBe(true);

            mockRun.mockRestore();
        });

        test('CDU15: should reject when there is a database error', async () => {
            const cartDAO = new CartDAO();
            const cartId = 1;
            const productModel = "model1";
            const increment = false;

            const mockRun = jest.spyOn(db, 'run').mockImplementation(function (sql, params, callback) {
                callback(new Error('Database error'));
                return {} as Database;
            });

            await expect(cartDAO.updateProductQuantity(cartId, productModel, increment)).rejects.toThrow('Database error');

            mockRun.mockRestore();
        });
    });

    describe('updateTotal', () => {
        test('CDU16: should update the total correctly', async () => {
            const cartDAO = new CartDAO();
            const cartId = 1;
            const totalValue = 150;

            const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, { total: totalValue });
                return {} as Database;
            });

            const mockDBRun = jest.spyOn(db, 'run').mockImplementation(function (sql, params, callback) {
                callback.call({ changes: 1 }, null);
                return {} as Database;
            });

            const result = await cartDAO.updateTotal(cartId);
            expect(result).toBe(true);

            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
        });

        test('CDU17: should return false if no rows are updated', async () => {
            const cartDAO = new CartDAO();
            const cartId = 1;
            const totalValue = 150;

            const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, { total: totalValue });
                return {} as Database;
            });

            const mockDBRun = jest.spyOn(db, 'run').mockImplementation(function (sql, params, callback) {
                callback.call({ changes: 0 }, null);
                return {} as Database;
            });

            const result = await cartDAO.updateTotal(cartId);
            expect(result).toBe(false);

            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
        });

        test('CDU18: should reject if there is a database error in get', async () => {
            const cartDAO = new CartDAO();
            const cartId = 1;

            const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(new Error('Database error'), null);
                return {} as Database;
            });

            await expect(cartDAO.updateTotal(cartId)).rejects.toThrow('Database error');

            mockDBGet.mockRestore();
        });

        test('CDU19: should reject if there is a database error in run', async () => {
            const cartDAO = new CartDAO();
            const cartId = 1;
            const totalValue = 150;

            const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, { total: totalValue });
                return {} as Database;
            });

            const mockDBRun = jest.spyOn(db, 'run').mockImplementation(function (sql, params, callback) {
                callback(new Error('Database error'), null);
                return {} as Database;
            });

            await expect(cartDAO.updateTotal(cartId)).rejects.toThrow('Database error');

            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
        });
    });

    describe('deleteProductFromCart', () => {
        test('CDU20: should return true when product is successfully deleted', async () => {
            const cartDAO = new CartDAO();
            const cartId = 1;
            const model = "model1";

            const mockRun = jest.spyOn(db, 'run').mockImplementation(function (sql, params, callback) {
                callback.call({ changes: 1 }, null);
                return {} as Database;
            });

            const result = await cartDAO.deleteProductFromCart(cartId, model);
            expect(result).toBe(true);

            mockRun.mockRestore();
        });

        test('CDU21: should return false when no product is deleted', async () => {
            const cartDAO = new CartDAO();
            const cartId = 1;
            const model = "model1";

            const mockRun = jest.spyOn(db, 'run').mockImplementation(function (sql, params, callback) {
                callback.call({ changes: 0 }, null);
                return {} as Database;
            });

            const result = await cartDAO.deleteProductFromCart(cartId, model);
            expect(result).toBe(false);

            mockRun.mockRestore();
        });

        test('CDU22: should reject when there is a database error', async () => {
            const cartDAO = new CartDAO();
            const cartId = 1;
            const model = "model1";

            const mockRun = jest.spyOn(db, 'run').mockImplementation(function (sql, params, callback) {
                callback(new Error('Database error'), null);
                return {} as Database;
            });

            await expect(cartDAO.deleteProductFromCart(cartId, model)).rejects.toThrow('Database error');

            mockRun.mockRestore();
        });
    });

    describe('checkoutCart', () => {
        test('CDU23: should return true when checkout is successful', async () => {
            const cartDAO = new CartDAO();
            const cartId = 1;

            const mockRun = jest.spyOn(db, 'run').mockImplementation(function (sql, params, callback) {
                callback.call({ changes: 1 }, null);
                return {} as Database;
            });

            const result = await cartDAO.checkoutCart(cartId);
            expect(result).toBe(true);

            mockRun.mockRestore();
        });

        test('CDU24: should return false when no rows are updated', async () => {
            const cartDAO = new CartDAO();
            const cartId = 1;

            const mockRun = jest.spyOn(db, 'run').mockImplementation(function (sql, params, callback) {
                callback.call({ changes: 0 }, null);
                return {} as Database;
            });

            const result = await cartDAO.checkoutCart(cartId);
            expect(result).toBe(false);

            mockRun.mockRestore();
        });

        test('CDU25: should reject when there is a database error in checkoutCart', async () => {
            const cartDAO = new CartDAO();
            const cartId = 1;

            const mockRun = jest.spyOn(db, 'run').mockImplementation(function (sql, params, callback) {
                callback(new Error('Database error'), null);
                return {} as Database;
            });

            await expect(cartDAO.checkoutCart(cartId)).rejects.toThrow('Database error');

            mockRun.mockRestore();
        });
    });

    describe('getPaidCarts', () => {
        test('CDU26: should return paid carts with their products', async () => {
            const cartDAO = new CartDAO();
            const customer = "customer1";
            const cartsFromDb = [
                { cartId: 1, customer: customer, paid: 1, paymentDate: "2022-01-01", total: 100 },
                { cartId: 2, customer: customer, paid: 1, paymentDate: "2022-02-01", total: 200 }
            ];
            const productsFromDb = [
                [{ model: "model1", quantity: 1, category: "Smartphone", price: 50 }],
                [{ model: "model2", quantity: 2, category: "Laptop", price: 100 }]
            ];

            const expectedCarts = [
                new Cart(customer, true, "2022-01-01", 100, [
                    new ProductInCart("model1", 1, Category.SMARTPHONE, 50)
                ]),
                new Cart(customer, true, "2022-02-01", 200, [
                    new ProductInCart("model2", 2, Category.LAPTOP, 100)
                ])
            ];

            const mockDBAllCarts = jest.spyOn(db, 'all').mockImplementationOnce((sql, params, callback) => {
                callback(null, cartsFromDb);
                return {} as Database;
            });

            cartsFromDb.forEach((cart, index) => {
                jest.spyOn(db, 'all').mockImplementationOnce((sql, params, callback) => {
                    callback(null, productsFromDb[index]);
                    return {} as Database;
                });
            });

            const result = await cartDAO.getPaidCarts(customer);
            expect(result).toEqual(expectedCarts);

            jest.restoreAllMocks();
        });

        test('CDU27: should reject when there is a database error in retrieving carts', async () => {
            const cartDAO = new CartDAO();
            const customer = "customer1";

            const mockDBAllCarts = jest.spyOn(db, 'all').mockImplementationOnce((sql, params, callback) => {
                callback(new Error('Database error'), null);
                return {} as Database;
            });

            await expect(cartDAO.getPaidCarts(customer)).rejects.toThrow('Database error');

            mockDBAllCarts.mockRestore();
        });

        test('CDU28: should reject when there is a database error in retrieving products', async () => {
            const cartDAO = new CartDAO();
            const customer = "customer1";
            const cartsFromDb = [
                { cartId: 1, customer: customer, paid: 1, paymentDate: "2022-01-01", total: 100 }
            ];

            const mockDBAllCarts = jest.spyOn(db, 'all').mockImplementationOnce((sql, params, callback) => {
                callback(null, cartsFromDb);
                return {} as Database;
            });

            const mockDBAllProducts = jest.spyOn(db, 'all').mockImplementationOnce((sql, params, callback) => {
                callback(new Error('Database error'), null);
                return {} as Database;
            });

            await expect(cartDAO.getPaidCarts(customer)).rejects.toThrow('Database error');

            mockDBAllCarts.mockRestore();
            mockDBAllProducts.mockRestore();
        });
    });

    describe('deleteAllCarts', () => {
        test('CDU29: should delete all carts and resolve to true', async () => {
            const cartDAO = new CartDAO();
            
            const mockRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                if (sql.includes('DELETE FROM carts_records')) {
                    callback(null); // Simulate successful deletion from carts_records
                } else if (sql.includes('DELETE FROM carts')) {
                    callback(null); // Simulate successful deletion from carts
                }
                
                return {} as Database;
            });
        
            const result = await cartDAO.deleteAllCarts();
            console.log(result);
            expect(result).toBe(true);
        
            mockRun.mockRestore();
        });

    
        test('CDU30: should reject when there is a database error deleting from carts', async () => {
            const cartDAO = new CartDAO();
        
            const mockRun = jest.spyOn(db, 'run')
                .mockImplementationOnce((sql, params, callback) => {
                    callback(null); // Simulate successful deletion from carts_records
                    return {} as Database;
                })
                .mockImplementationOnce((sql, params, callback) => {
                    callback(new Error('Database error')); // Simulate error deleting from carts
                    return {} as Database;
                });
        
            await expect(cartDAO.deleteAllCarts()).rejects.toThrow('Database error');
        
            expect(mockRun).toHaveBeenCalledTimes(2);
            expect(mockRun).toHaveBeenCalledWith("DELETE FROM carts_records", [], expect.any(Function));
            expect(mockRun).toHaveBeenCalledWith("DELETE FROM carts", [], expect.any(Function));
        
            mockRun.mockRestore();
        });

        test('CDU31: should reject when there is a database error deleting from carts_records', async () => {
            const cartDAO = new CartDAO();
        
            const mockRun = jest.spyOn(db, 'run')
                .mockImplementationOnce((sql, params, callback) => {
                    callback(new Error('Database error')); // Simulate error deleting from carts_records
                    return {} as Database;
                });
        
            await expect(cartDAO.deleteAllCarts()).rejects.toThrow('Database error');
        
            expect(mockRun).toHaveBeenCalledTimes(1);
            expect(mockRun).toHaveBeenCalledWith("DELETE FROM carts_records", [], expect.any(Function));
        
            mockRun.mockRestore();
        });
    });

    describe('markAllProductAsDeleted', () => {
        test('CDU32: should return true when all products are marked as deleted', async () => {
            const cartDAO = new CartDAO();

            const mockRun = jest.spyOn(db, 'run').mockImplementation(function (sql, params, callback) {
                callback(null);
                return {} as Database;
            });

            const result = await cartDAO.markAllProductAsDeleted();
            expect(result).toBe(true);

            expect(mockRun).toHaveBeenCalledTimes(1);
            expect(mockRun).toHaveBeenCalledWith("UPDATE carts_records SET deleted = 1", [], expect.any(Function));

            mockRun.mockRestore();
        });

        test('CDU33: should reject when there is a database error in markAllProductAsDeleted', async () => {
            const cartDAO = new CartDAO();

            const mockRun = jest.spyOn(db, 'run').mockImplementation(function (sql, params, callback) {
                callback(new Error('Database error'));
                return {} as Database;
            });

            await expect(cartDAO.markAllProductAsDeleted()).rejects.toThrow('Database error');

            expect(mockRun).toHaveBeenCalledTimes(1);
            expect(mockRun).toHaveBeenCalledWith("UPDATE carts_records SET deleted = 1", [], expect.any(Function));

            mockRun.mockRestore();
        });
    });

    describe('getAllCarts', () => {
        test('CDU34: should return all carts with their products', async () => {
            const cartDAO = new CartDAO();
            const cartsFromDb = [
                { cartId: 1, customer: "customer1", paid: 1, paymentDate: "2022-01-01", total: 100 },
                { cartId: 2, customer: "customer2", paid: 0, paymentDate: null, total: 200 }
            ];
            const productsFromDb = [
                [{ model: "model1", quantity: 1, category: "Smartphone", price: 50 }],
                [{ model: "model2", quantity: 2, category: "Laptop", price: 100 }]
            ];

            const expectedCarts = [
                new Cart("customer1", true, "2022-01-01", 100, [
                    new ProductInCart("model1", 1, Category.SMARTPHONE, 50)
                ]),
                new Cart("customer2", false, "", 200, [
                    new ProductInCart("model2", 2, Category.LAPTOP, 100)
                ])
            ];

            const mockDBAllCarts = jest.spyOn(db, 'all').mockImplementationOnce((sql, params, callback) => {
                callback(null, cartsFromDb);
                return {} as Database;
            });

            cartsFromDb.forEach((cart, index) => {
                jest.spyOn(db, 'all').mockImplementationOnce((sql, params, callback) => {
                    callback(null, productsFromDb[index]);
                    return {} as Database;
                });
            });

            const result = await cartDAO.getAllCarts();
            expect(result).toEqual(expectedCarts);

            jest.restoreAllMocks();
        });

        test('CDU35: should reject when there is a database error in retrieving carts', async () => {
            const cartDAO = new CartDAO();

            const mockDBAllCarts = jest.spyOn(db, 'all').mockImplementationOnce((sql, params, callback) => {
                callback(new Error('Database error'), null);
                return {} as Database;
            });

            await expect(cartDAO.getAllCarts()).rejects.toThrow('Database error');

            mockDBAllCarts.mockRestore();
        });

        test('CDU36: should reject when there is a database error in retrieving products', async () => {
            const cartDAO = new CartDAO();
            const cartsFromDb = [
                { cartId: 1, customer: "customer1", paid: 1, paymentDate: "2022-01-01", total: 100 }
            ];

            const mockDBAllCarts = jest.spyOn(db, 'all').mockImplementationOnce((sql, params, callback) => {
                callback(null, cartsFromDb);
                return {} as Database;
            });

            const mockDBAllProducts = jest.spyOn(db, 'all').mockImplementationOnce((sql, params, callback) => {
                callback(new Error('Database error'), null);
                return {} as Database;
            });

            await expect(cartDAO.getAllCarts()).rejects.toThrow('Database error');

            mockDBAllCarts.mockRestore();
            mockDBAllProducts.mockRestore();
        });
    });

    describe('markProductAsDeleted', () => {
        test('CDU37: should return true when product is successfully marked as deleted', async () => {
            const cartDAO = new CartDAO();
            const model = "model1";

            const mockRun = jest.spyOn(db, 'run').mockImplementation(function (sql, params, callback) {
                callback.call({ changes: 1 }, null);
                return {} as Database;
            });

            const result = await cartDAO.markProductAsDeleted(model);
            expect(result).toBe(true);

            expect(mockRun).toHaveBeenCalledTimes(1);
            expect(mockRun).toHaveBeenCalledWith("UPDATE carts_records SET deleted = 1 WHERE model = ?", [model], expect.any(Function));

            mockRun.mockRestore();
        });

        test('CDU38: should return false when no product is marked as deleted', async () => {
            const cartDAO = new CartDAO();
            const model = "model1";

            const mockRun = jest.spyOn(db, 'run').mockImplementation(function (sql, params, callback) {
                callback.call({ changes: 0 }, null);
                return {} as Database;
            });

            const result = await cartDAO.markProductAsDeleted(model);
            expect(result).toBe(false);

            expect(mockRun).toHaveBeenCalledTimes(1);
            expect(mockRun).toHaveBeenCalledWith("UPDATE carts_records SET deleted = 1 WHERE model = ?", [model], expect.any(Function));

            mockRun.mockRestore();
        });

        test('CDU39: should reject when there is a database error in markProductAsDeleted', async () => {
            const cartDAO = new CartDAO();
            const model = "model1";

            const mockRun = jest.spyOn(db, 'run').mockImplementation(function (sql, params, callback) {
                callback(new Error('Database error'));
                return {} as Database;
            });

            await expect(cartDAO.markProductAsDeleted(model)).rejects.toThrow('Database error');

            expect(mockRun).toHaveBeenCalledTimes(1);
            expect(mockRun).toHaveBeenCalledWith("UPDATE carts_records SET deleted = 1 WHERE model = ?", [model], expect.any(Function));

            mockRun.mockRestore();
        });
    });
});
