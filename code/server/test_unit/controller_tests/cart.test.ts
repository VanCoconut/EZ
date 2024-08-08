import { test, expect, beforeEach, describe, jest } from "@jest/globals";
import CartDAO from "../../src/dao/cartDAO";
import ProductDAO from "../../src/dao/productDAO";
import CartController from "../../src/controllers/cartController";
import { Cart, ProductInCart } from "../../src/components/cart";
import { Product, Category } from "../../src/components/product";
import { CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError, EmptyCartError } from "../../src/errors/cartError";
import { ProductNotFoundError, ProductSoldError, LowProductStockError } from "../../src/errors/productError";
import { User, Role } from "../../src/components/user";

jest.mock("../../src/dao/cartDAO");
jest.mock("../../src/dao/productDAO");
let cartController: CartController;
let mockCartDAO: CartDAO;
let mockProductDAO: ProductDAO;
let user: User;

describe('CartController', () => {
    beforeEach(() => {
        cartController = new CartController();
        mockCartDAO = (cartController as any).cartDAO;
        mockProductDAO = (cartController as any).productDAO;
        user = new User("testUser", "Test", "User", Role.CUSTOMER, "indirizzo", "2000-01-01");
        jest.clearAllMocks();
    });

    describe('addToCart', () => {
        test('CCU1: should throw ProductNotFoundError when product is not found', async () => {
            jest.spyOn(mockProductDAO, 'getProductByModel').mockResolvedValue(null);
            await expect(cartController.addToCart(user, "product1")).rejects.toThrow(ProductNotFoundError);
        });

        test('CCU2: should throw ProductSoldError when product quantity is 0', async () => {
            const product = new Product(100, "product1", Category.SMARTPHONE, null, null, 0);
            jest.spyOn(mockProductDAO, 'getProductByModel').mockResolvedValue(product);
            await expect(cartController.addToCart(user, "product1")).rejects.toThrow(ProductSoldError);
        });

        test('CCU3: should create a new cart and add product when no current cart exists', async () => {
            const product = new Product(100, "product1", Category.SMARTPHONE, null, null, 10);
            jest.spyOn(mockProductDAO, 'getProductByModel').mockResolvedValue(product);
            jest.spyOn(mockCartDAO, 'getCurrentCartId').mockResolvedValue(null);
            jest.spyOn(mockCartDAO, 'createCart').mockResolvedValue(1);
            jest.spyOn(mockCartDAO, 'addToCart').mockResolvedValue(true);

            const result = await cartController.addToCart(user, "product1");
            expect(result).toBe(true);
        });

        test('CCU4: should update product quantity in existing cart when product is already in cart', async () => {
            const product = new Product(100, "product1", Category.SMARTPHONE, null, null, 10);
            jest.spyOn(mockProductDAO, 'getProductByModel').mockResolvedValue(product);
            jest.spyOn(mockCartDAO, 'getCurrentCartId').mockResolvedValue(1);
            jest.spyOn(mockCartDAO, 'getProductInCart').mockResolvedValue({ model: "product1", quantity: 1, category: Category.SMARTPHONE, price: 100 });
            jest.spyOn(mockCartDAO, 'updateProductQuantity').mockResolvedValue(true);

            const result = await cartController.addToCart(user, "product1");
            expect(result).toBe(true);
        });

        test('CCU5: should add product to existing cart when product is not already in cart', async () => {
            const product = new Product(100, "product1", Category.SMARTPHONE, null, null, 10);
            jest.spyOn(mockProductDAO, 'getProductByModel').mockResolvedValue(product);
            jest.spyOn(mockCartDAO, 'getCurrentCartId').mockResolvedValue(1);
            jest.spyOn(mockCartDAO, 'getProductInCart').mockResolvedValue(null);
            jest.spyOn(mockCartDAO, 'addToCart').mockResolvedValue(true);

            const result = await cartController.addToCart(user, "product1");
            expect(result).toBe(true);
        });
    });

    describe('getCart', () => {
        test('CCU6: should create a new cart when no current cart exists', async () => {
            const empty = new Cart(user.username, false, "", 0, []);
            jest.spyOn(mockCartDAO, 'getCurrentCart').mockResolvedValue(null);
            jest.spyOn(mockCartDAO, 'getCurrentCartId').mockResolvedValue(null);
            jest.spyOn(mockCartDAO, 'createCart').mockResolvedValue(1);
            jest.spyOn(mockCartDAO, 'getCurrentCart').mockResolvedValue(empty);

            const result = await cartController.getCart(user);
            expect(result).toBe(empty);
        });

        test('CCU7: should return the current cart when it exists', async () => {
            const mockCart = new Cart(user.username, false, "", 100, [
                new ProductInCart("model1", 1, Category.SMARTPHONE, 50),
                new ProductInCart("model2", 2, Category.LAPTOP, 25)
            ]);
            jest.spyOn(mockCartDAO, 'getCurrentCart').mockResolvedValue(mockCart);
            jest.spyOn(mockCartDAO, 'getCurrentCartId').mockResolvedValue(1);
            jest.spyOn(mockCartDAO, 'updateTotal').mockResolvedValue(true);

            const result = await cartController.getCart(user);
            expect(result).toBe(mockCart);
        });
    });

    describe('checkoutCart', () => {
        test('CCU8: should throw CartNotFoundError when no current cart exists', async () => {
            jest.spyOn(mockCartDAO, 'getCurrentCart').mockResolvedValue(null);

            await expect(cartController.checkoutCart(user)).rejects.toThrow(CartNotFoundError);
        });

        test('CCU9: should throw EmptyCartError when the cart is empty', async () => {
            const emptyCart = new Cart(user.username, false, "", 0, []);
            jest.spyOn(mockCartDAO, 'getCurrentCart').mockResolvedValue(emptyCart);

            await expect(cartController.checkoutCart(user)).rejects.toThrow(EmptyCartError);
        });

        test('CCU10: should throw ProductSoldError when a product in the cart is out of stock', async () => {
            const cartWithProducts = new Cart(user.username, false, "", 100, [
                new ProductInCart("model1", 1, Category.SMARTPHONE, 50)
            ]);
            jest.spyOn(mockCartDAO, 'getCurrentCart').mockResolvedValue(cartWithProducts);
            jest.spyOn(mockProductDAO, 'getProductByModel').mockResolvedValue(new Product(50, "model1", Category.SMARTPHONE, null, null, 0));

            await expect(cartController.checkoutCart(user)).rejects.toThrow(ProductSoldError);
        });

        test('CCU11: should throw LowProductStockError when a product quantity in the cart is more than in stock', async () => {
            const cartWithProducts = new Cart(user.username, false, "", 100, [
                new ProductInCart("model1", 10, Category.SMARTPHONE, 50)
            ]);
            jest.spyOn(mockCartDAO, 'getCurrentCart').mockResolvedValue(cartWithProducts);
            jest.spyOn(mockProductDAO, 'getProductByModel').mockResolvedValue(new Product(50, "model1", Category.SMARTPHONE, null, null, 5));

            await expect(cartController.checkoutCart(user)).rejects.toThrow(LowProductStockError);
        });

        test('CCU12: should checkout cart successfully when all conditions are met', async () => {
            const cartWithProducts = new Cart(user.username, false, "", 100, [
                new ProductInCart("model1", 1, Category.SMARTPHONE, 50)
            ]);
            jest.spyOn(mockCartDAO, 'getCurrentCart').mockResolvedValue(cartWithProducts);
            jest.spyOn(mockProductDAO, 'getProductByModel').mockResolvedValue(new Product(50, "model1", Category.SMARTPHONE, null, null, 10));
            jest.spyOn(mockCartDAO, 'getCurrentCartId').mockResolvedValue(1);
            jest.spyOn(mockProductDAO, 'sellModels').mockResolvedValue(true);
            jest.spyOn(mockCartDAO, 'checkoutCart').mockResolvedValue(true);

            const result = await cartController.checkoutCart(user);
            expect(result).toBe(true);
        });
    });

    describe('getCustomerCarts', () => {
        test('CCU13: should return paid carts for the user', async () => {
            const expectedCarts = [
                new Cart(user.username, true, "2024-01-01", 100, [
                    new ProductInCart("model1", 1, Category.SMARTPHONE, 50),
                    new ProductInCart("model2", 2, Category.LAPTOP, 25)
                ]),
                new Cart(user.username, true, "2024-02-01", 200, [
                    new ProductInCart("model3", 1, Category.APPLIANCE, 100)
                ])
            ];

            jest.spyOn(mockCartDAO, 'getPaidCarts').mockResolvedValue(expectedCarts);

            const result = await cartController.getCustomerCarts(user);
            expect(result).toEqual(expectedCarts);
        });

        test('CCU14: should return an empty array when there are no paid carts', async () => {
            jest.spyOn(mockCartDAO, 'getPaidCarts').mockResolvedValue([]);

            const result = await cartController.getCustomerCarts(user);
            expect(result).toEqual([]);
        });
    });

    describe('removeProductFromCart', () => {
        test('CCU15: should throw ProductNotFoundError when product is not found', async () => {
            jest.spyOn(mockProductDAO, 'getProductByModel').mockResolvedValue(null);

            await expect(cartController.removeProductFromCart(user, "product1")).rejects.toThrow(ProductNotFoundError);
        });

        test('CCU16: should throw CartNotFoundError when no current cart exists', async () => {
            jest.spyOn(mockProductDAO, 'getProductByModel').mockResolvedValue(new Product(50, "product1", Category.SMARTPHONE, null, null, 10));
            jest.spyOn(mockCartDAO, 'getCurrentCartId').mockResolvedValue(null);

            await expect(cartController.removeProductFromCart(user, "product1")).rejects.toThrow(CartNotFoundError);
        });

        test('CCU17: should throw CartNotFoundError when current cart is empty', async () => {
            jest.spyOn(mockProductDAO, 'getProductByModel').mockResolvedValue(new Product(50, "product1", Category.SMARTPHONE, null, null, 10));
            jest.spyOn(mockCartDAO, 'getCurrentCartId').mockResolvedValue(1);
            jest.spyOn(mockCartDAO, 'getCurrentCart').mockResolvedValue(new Cart(user.username, false, "", 0, []));

            await expect(cartController.removeProductFromCart(user, "product1")).rejects.toThrow(CartNotFoundError);
        });

        test('CCU18: should throw ProductNotInCartError when product is not in the cart', async () => {
            jest.spyOn(mockProductDAO, 'getProductByModel').mockResolvedValue(new Product(50, "product1", Category.SMARTPHONE, null, null, 10));
            jest.spyOn(mockCartDAO, 'getCurrentCartId').mockResolvedValue(1);
            jest.spyOn(mockCartDAO, 'getCurrentCart').mockResolvedValue(new Cart(user.username, false, "", 0, [new ProductInCart("product2", 1, Category.LAPTOP, 50)]));
            jest.spyOn(mockCartDAO, 'getProductInCart').mockResolvedValue(null);

            await expect(cartController.removeProductFromCart(user, "product1")).rejects.toThrow(ProductNotInCartError);
        });

        test('CCU19: should update product quantity in cart when quantity is greater than 1', async () => {
            jest.spyOn(mockProductDAO, 'getProductByModel').mockResolvedValue(new Product(50, "product1", Category.SMARTPHONE, null, null, 10));
            jest.spyOn(mockCartDAO, 'getCurrentCartId').mockResolvedValue(1);
            jest.spyOn(mockCartDAO, 'getCurrentCart').mockResolvedValue(new Cart(user.username, false, "", 0, [new ProductInCart("product1", 2, Category.SMARTPHONE, 50)]));
            jest.spyOn(mockCartDAO, 'getProductInCart').mockResolvedValue(new ProductInCart("product1", 2, Category.SMARTPHONE, 50));
            jest.spyOn(mockCartDAO, 'updateProductQuantity').mockResolvedValue(true);

            const result = await cartController.removeProductFromCart(user, "product1");
            expect(result).toBe(true);
        });

        test('CCU20: should delete product from cart when quantity is 1', async () => {
            jest.spyOn(mockProductDAO, 'getProductByModel').mockResolvedValue(new Product(50, "product1", Category.SMARTPHONE, null, null, 10));
            jest.spyOn(mockCartDAO, 'getCurrentCartId').mockResolvedValue(1);
            jest.spyOn(mockCartDAO, 'getCurrentCart').mockResolvedValue(new Cart(user.username, false, "", 0, [new ProductInCart("product1", 1, Category.SMARTPHONE, 50)]));
            jest.spyOn(mockCartDAO, 'getProductInCart').mockResolvedValue(new ProductInCart("product1", 1, Category.SMARTPHONE, 50));
            jest.spyOn(mockCartDAO, 'deleteProductFromCart').mockResolvedValue(true);

            const result = await cartController.removeProductFromCart(user, "product1");
            expect(result).toBe(true);
        });
    });

    describe('clearCart', () => {
        test('CCU21: should throw CartNotFoundError when no current cart exists', async () => {
            jest.spyOn(mockCartDAO, 'getCurrentCart').mockResolvedValue(null);

            await expect(cartController.clearCart(user)).rejects.toThrow(CartNotFoundError);
        });

        test('CCU22: should clear the cart by deleting all products', async () => {
            const cartWithProducts = new Cart(user.username, false, "", 100, [
                new ProductInCart("model1", 1, Category.SMARTPHONE, 50),
                new ProductInCart("model2", 2, Category.LAPTOP, 25)
            ]);
            jest.spyOn(mockCartDAO, 'getCurrentCart').mockResolvedValue(cartWithProducts);
            jest.spyOn(mockCartDAO, 'getCurrentCartId').mockResolvedValue(1);
            const mockDeleteProductFromCart = jest.spyOn(mockCartDAO, 'deleteProductFromCart').mockResolvedValue(true);

            await cartController.clearCart(user);

            expect(mockCartDAO.getCurrentCart).toHaveBeenCalledWith(user.username);
            expect(mockCartDAO.getCurrentCartId).toHaveBeenCalledWith(user.username);
            expect(mockDeleteProductFromCart).toHaveBeenCalledTimes(cartWithProducts.products.length);
            expect(mockDeleteProductFromCart).toHaveBeenCalledWith(1, "model1");
            expect(mockDeleteProductFromCart).toHaveBeenCalledWith(1, "model2");
        });
    });

    describe('deleteAllCarts', () => {
        test('CCU23: should delete all carts and return true', async () => {
            jest.spyOn(mockCartDAO, 'deleteAllCarts').mockResolvedValue(true);

            const result = await cartController.deleteAllCarts();
            expect(result).toBe(true);
            expect(mockCartDAO.deleteAllCarts).toHaveBeenCalled();
        });

        test('CCU24: should handle errors thrown by deleteAllCarts', async () => {
            jest.spyOn(mockCartDAO, 'deleteAllCarts').mockRejectedValue(new Error('Database error'));

            await expect(cartController.deleteAllCarts()).rejects.toThrow('Database error');
            expect(mockCartDAO.deleteAllCarts).toHaveBeenCalled();
        });
    });

    describe('getAllCarts', () => {
        test('CCU25: should return all carts', async () => {
            const expectedCarts = [
                new Cart("customer1", false, "", 100, [
                    new ProductInCart("model1", 1, Category.SMARTPHONE, 50),
                    new ProductInCart("model2", 2, Category.LAPTOP, 25)
                ]),
                new Cart("customer2", true, "2024-01-01", 200, [
                    new ProductInCart("model3", 1, Category.APPLIANCE, 100)
                ])
            ];

            jest.spyOn(mockCartDAO, 'getAllCarts').mockResolvedValue(expectedCarts);

            const result = await cartController.getAllCarts();
            expect(result).toEqual(expectedCarts);
            expect(mockCartDAO.getAllCarts).toHaveBeenCalled();
        });

        test('CCU26: should return an empty array when there are no carts', async () => {
            jest.spyOn(mockCartDAO, 'getAllCarts').mockResolvedValue([]);

            const result = await cartController.getAllCarts();
            expect(result).toEqual([]);
            expect(mockCartDAO.getAllCarts).toHaveBeenCalled();
        });

        test('CCU27: should handle errors thrown by getAllCarts', async () => {
            jest.spyOn(mockCartDAO, 'getAllCarts').mockRejectedValue(new Error('Database error'));

            await expect(cartController.getAllCarts()).rejects.toThrow('Database error');
            expect(mockCartDAO.getAllCarts).toHaveBeenCalled();
        });
    });
});
