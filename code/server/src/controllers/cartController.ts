import { ProductNotFoundError, ProductSoldError, LowProductStockError } from "../errors/productError";
import { User } from "../components/user";
import CartDAO from "../dao/cartDAO";
import ProductDAO from "../dao/productDAO";
import { EmptyCartError, CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError } from "../errors/cartError";
import { UserNotCustomerError } from "../errors/userError";
import { create } from "domain";
import dayjs from "dayjs";
import { log } from "console";

/**
 * Represents a controller for managing shopping carts.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class CartController {
    private cartDAO: CartDAO;
    private productDAO: ProductDAO;

    constructor() {
        this.cartDAO = new CartDAO;
        this.productDAO = new ProductDAO;
    }

    /**
     * Adds a product to the user's cart. If the product is already in the cart, the quantity should be increased by 1.
     * If the product is not in the cart, it should be added with a quantity of 1.
     * If there is no current unpaid cart in the database, then a new cart should be created.
     * @param user - The user to whom the product should be added.
     * @param productId - The model of the product to add.
     * @returns A Promise that resolves to `true` if the product was successfully added.
     */

    async addToCart(user: User, product: string)/*: Promise<Boolean>*/ {        
        let productModel = await this.productDAO.getProductByModel(product);
        if ( productModel === null){
            throw new ProductNotFoundError;
        }
        else if (productModel.quantity === 0) {
            throw new ProductSoldError;
        }
        else {
            const cartId = await this.cartDAO.getCurrentCartId(user.username);
            const cart = await this.cartDAO.getCurrentCart(user.username);
            if (cartId === null) {
                
                const newCartId = await this.cartDAO.createCart(user.username);
                
                const result =  await this.cartDAO.addToCart(newCartId, productModel.model, productModel.category, productModel.sellingPrice);
                await this.cartDAO.updateTotal(cartId);
                return result;
            }
            else {
                if (await this.cartDAO.getProductInCart(cartId, productModel.model) !== null) {
                    const result = await this.cartDAO.updateProductQuantity(cartId, productModel.model,true);
                    await this.cartDAO.updateTotal(cartId);
                    return result;
                }
                else {
                    const result = await this.cartDAO.addToCart(cartId, productModel.model, productModel.category, productModel.sellingPrice);
                    await this.cartDAO.updateTotal(cartId);
                    return result;
                }
                }
        }       
     }


    /**
     * Retrieves the current cart for a specific user.
     * @param user - The user for whom to retrieve the cart.
     * @returns A Promise that resolves to the user's cart or an empty one if there is no current cart.
     */
    async getCart(user: User)/*: Cart*/ { 
        const cart = await this.cartDAO.getCurrentCart(user.username);
        const cartId = await this.cartDAO.getCurrentCartId(user.username);
        await this.cartDAO.updateTotal(cartId);
        if (cart === null) {
            const cart= await this.cartDAO.createCart(user.username);
            return this.cartDAO.getCurrentCart(user.username);
        }
        else {
            const cart = await this.cartDAO.getCurrentCart(user.username);
            return cart; 
        }
    }

    /**
     * Checks out the user's cart. We assume that payment is always successful, there is no need to implement anything related to payment.
     * @param user - The user whose cart should be checked out.
     * @returns A Promise that resolves to `true` if the cart was successfully checked out.
     * 
     */
    async checkoutCart(user: User) /**Promise<Boolean> */ {
        const cart = await this.cartDAO.getCurrentCart(user.username);
        if (cart === null) {
            throw new CartNotFoundError;
        }
        else if (cart.products.length === 0) {
            throw new EmptyCartError;
        }
        else {
            for (const productInCart of cart.products) {
                const productInStock = await this.productDAO.getProductByModel(productInCart.model);
                if (productInStock.quantity === 0) {
                    throw new ProductSoldError;
                }
                else if (productInCart.quantity > productInStock.quantity) {
                    throw new LowProductStockError;
                }
            }
            const cartId = await this.cartDAO.getCurrentCartId(user.username);
            await this.cartDAO.updateTotal(cartId);
            for (const productInCart of cart.products) {
                await this.productDAO.sellModels(productInCart.model, productInCart.quantity);
            }
            return await this.cartDAO.checkoutCart(cartId);
        }
    }

    /**
     * Retrieves all paid carts for a specific customer.
     * @param user - The customer for whom to retrieve the carts.
     * @returns A Promise that resolves to an array of carts belonging to the customer.
     * Only the carts that have been checked out should be returned, the current cart should not be included in the result.
     */
    async getCustomerCarts(user: User) /**Promise<Cart[]> */{

        return await this.cartDAO.getPaidCarts(user.username);
    }

    /**
     * Removes one product unit from the current cart. In case there is more than one unit in the cart, only one should be removed.
     * @param user The user who owns the cart.
     * @param product The model of the product to remove.
     * @returns A Promise that resolves to `true` if the product was successfully removed.
     */
    async removeProductFromCart(user: User, product: string) /**Promise<Boolean> */ { 
        const productModel = await this.productDAO.getProductByModel(product);
        
        if (productModel === null) {
            throw new ProductNotFoundError;
        }
        const cartId = await this.cartDAO.getCurrentCartId(user.username);
        if ((cartId === null) || ((await this.cartDAO.getCurrentCart(user.username)).products.length === 0)){
            throw new CartNotFoundError;
        }
        else {
            const productInCart = await this.cartDAO.getProductInCart(cartId, product);
            if (productInCart === null) {
                throw new ProductNotInCartError;
            }
            else {
                if (productInCart.quantity > 1) {
                    return await this.cartDAO.updateProductQuantity(cartId, product, false);
                }
                else {
                    return await this.cartDAO.deleteProductFromCart(cartId, product);
                }
            }
        }
    }


    /**
     * Removes all products from the current cart.
     * @param user - The user who owns the cart.
     * @returns A Promise that resolves to `true` if the cart was successfully cleared.
     */
    async clearCart(user: User)/*:Promise<Boolean> */ {

        const cart = await this.cartDAO.getCurrentCart(user.username);
        if (cart === null || cart.products.length === 0){
            throw new CartNotFoundError;
        }
        else {
            const cartId = await this.cartDAO.getCurrentCartId(user.username);
            for (const productInCart of cart.products) {
                await this.cartDAO.deleteProductFromCart(cartId, productInCart.model);
            }
        }
     }

    /**
     * Deletes all carts of all users.
     * @returns A Promise that resolves to `true` if all carts were successfully deleted.
     */
    async deleteAllCarts() /**Promise<Boolean> */ { 
       return await this.cartDAO.deleteAllCarts();

    }

    /**
     * Retrieves all carts in the database.
     * @returns A Promise that resolves to an array of carts.
     */
    async getAllCarts() /*:Promise<Cart[]> */ { 
        return await this.cartDAO.getAllCarts();
    }
}

export default CartController