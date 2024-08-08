import dayjs from "dayjs";
import db from "../db/db";
import { User } from "../components/user";
import { Cart, ProductInCart } from "../components/cart";
import { Category, Product } from "../components/product";
import { get } from "http";

/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */

class CartDAO {
    
/**
 * Gets the cartId of the current unpaid cart of a customer.
 * @param customer - The customer for whom to get the cartId.
 * @returns - A Promise that resolves to the cartId of the current unpaid cart of the customer, or null if there is no current unpaid cart.
 */

    async getCurrentCartId(customer: string): Promise<number | null> {
        return new Promise<number | null>((resolve, reject) => {
            try {
                db.get("SELECT cartId FROM carts WHERE customer = ? AND paid = 0", [customer], (err: Error | null, cart: any) => {
                    if (err) {
                        reject(err);
                    } else if (cart === undefined) {
                        resolve(null);
                    } else {
                        resolve(cart.cartId);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Creates a new cart for a customer.
     * @param customer - The customer for whom to create the cart.
     * @returns - A Promise that resolves to the cartId of the newly created cart, or null if the cart could not be created.
     */

    async createCart(customer: string): Promise<number | null> {
        return new Promise<number | null>((resolve, reject) => {
            try {
                db.run("INSERT INTO carts (customer, paid, paymentDate, total) VALUES (?, 0, NULL, 0)", [customer], function (err: Error | null) {
                    if (err) {
                        reject(err);
                    } else {
                        const cartId = this.lastID;
                        if(this.changes>0) 
                            resolve(cartId);
                        else
                            resolve(null);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Retrieves the current cart for a specific user.
     * @param user - The user for whom to retrieve the cart.
     * @returns A Promise that resolves to the user's cart or an empty one if there is no current cart.
     */

    async getCurrentCart(customer: string): Promise<Cart | null> {
        return new Promise<Cart | null>((resolve, reject) => {
            try {
                db.get("SELECT cartId, customer, paid, paymentDate, total FROM carts WHERE customer = ? AND paid = 0", [customer], async (err: Error | null, cart: any) => {
                    if (err) {
                        reject(err);
                    } else if (!cart) {
                        resolve(null);
                    } else {
                        try {
                            db.all("SELECT model, quantity, category, price FROM carts_records WHERE cartId = ? AND deleted = 0", [cart.cartId], async (err: Error | null, products: any[]) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    let productsInCart: ProductInCart[] = [];
                                    products.forEach((prod: any) => {
                                        productsInCart.push(
                                          new ProductInCart(
                                            prod.model,
                                            prod.quantity,
                                            prod.category,
                                            prod.price
                                          )
                                        );
                                      });
                                    
                                    resolve(new Cart(
                                        cart.customer,
                                        cart.paid ? true : false,
                                        "",
                                        cart.total,
                                        productsInCart
                                    ));
                                }
                            });
                        } catch (err) {
                            reject(err);
                        }
                    }
                });
            } 
            catch (err) {
                reject(err);
            }
        });

    }   


    /**
     * Gets the product details contained in a cart, given the model of the product.
     * @param cartId - The cartId of the cart.
     * @param productModel - The model of the product.
     * @returns - A Promise that resolves to the product details contained in the cart, or null if the product is not in the cart.
     */
    async getProductInCart(cartId: number, productModel: string): Promise<ProductInCart|null> {
        return new Promise<ProductInCart | null>((resolve, reject) => {
            try{
                db.get("SELECT model, quantity, category, price FROM carts_records WHERE cartId = ? AND model = ?", [cartId, productModel], (err: Error | null, product: any) => {
                    if (err) {
                        reject(err);
                    } else if (product === undefined) {
                        resolve(null);
                    } else {
                        resolve(new ProductInCart(
                            product.model,
                            product.quantity,
                            product.category as Category,
                            product.price
                        ));
                    }
                });
            }
            catch(err){
                reject(err);
            }
        });
      }

    /**
     * Adds a product to a cart.
     * @param cartId - The cartId of the cart.
     * @param model - The model of the product.
     * @param category - The category of the product.
     * @param price - The price of the product.
     * @returns - A Promise that resolves to true if the product was added to the cart, or false if it was not.
     */
    async addToCart(cartId: number, model: string,category:string,price:number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        try{
            db.run("INSERT INTO carts_records (cartId, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)", [cartId, model, 1, category, price], function(err: Error | null) {
                if (err) {
                    reject(err);
                } else {
                    if(this.changes>0) 
                        resolve(true);
                    else
                        resolve(false);
                }
            });
        }
        catch(err){
            reject(err);
        }
    });
    }

    /**
     * Updates the quantity of a product in a cart.
     * @param cartId - The cartId of the cart.
     * @param model - The model of the product.
     * @param increment - A boolean that indicates whether the quantity should be incremented or decremented.
     * @returns - A Promise that resolves to true if the quantity was successfully updated, or false if it was not.
     */
    async updateProductQuantity(cartId: number, model: string, increment: boolean): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const operation = increment ? "quantity = quantity + 1" : "quantity = quantity - 1";
                db.run(`UPDATE carts_records SET ${operation} WHERE cartId = ? AND model = ?`, [cartId, model], function(err: Error | null) {
                    if (err) {
                        reject(err);
                    } else {
                        if (this.changes > 0) 
                            resolve(true);
                        else
                            resolve(false);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    
    /**
     * Updates the total price of a cart.
     * @param cartId - The cartId of the cart.
     * @returns - A Promise that resolves to true if the total price was successfully updated, or false if it was not.
     */
    async updateTotal(cartId: number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try{
                db.get("SELECT IFNULL(SUM(quantity * price),0) as total FROM carts_records WHERE cartId = ?", [cartId], (err: Error | null, total: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        db.run("UPDATE carts SET total = ? WHERE cartId = ?", [total.total, cartId], function(err: Error | null) {
                            if (err) {
                                reject(err);
                            } else {
                                if(this.changes>0) 
                                    resolve(true);
                                else
                                    resolve(false);
                            }
                        });
                    }
                });
            }
            catch(err){
                reject(err);
            }
        });
    }
    
    /**
     * Deletes a product from a cart.
     * @param cartId - The cartId of the cart.
     * @param model - The model of the product.
     * @returns - A Promise that resolves to true if the product was deleted from the cart, or false if it was not.
     */
    async deleteProductFromCart(cartId: number, model: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try{
                db.run("DELETE FROM carts_records WHERE cartId = ? AND model = ?", [cartId, model], function(err: Error | null) {
                    if (err) {
                        reject(err);
                    } else {
                        if(this.changes>0) 
                            resolve(true);
                        else
                            resolve(false);
                    }
                });
            }
            catch(err){
                reject(err);
            }
        });
    }

    /**
     * Checks out a cart.
     * @param cartId - The cartId of the cart.
     * @returns - A Promise that resolves to true if the cart was successfully checked out, or false if it was not.
     */

    async checkoutCart(cartId: number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try{
                db.run("UPDATE carts SET paid = 1, paymentDate = ? WHERE cartId = ?", [dayjs().format("YYYY-MM-DD"), cartId], function(err: Error | null) {
                    if (err) {
                        reject(err);
                    } else {
                        if(this.changes>0) 
                            resolve(true);
                        else
                            resolve(false);
                    }
                });
            }
            catch(err){
                reject(err);
            }
        });
    }

    /**
     * Get paid carts of the costumer specified.
     * @param customer - The customer for whom to retrieve the carts.
     * @returns - A Promise that resolves to an array of carts belonging to the customer.
     */
    async getPaidCarts(customer: string): Promise<Cart[]> {
        return new Promise<Cart[]>((resolve, reject) => {
            try {
                db.all("SELECT cartId, customer, paid, paymentDate, total FROM carts WHERE customer = ? AND paid = 1", [customer], async (err: Error | null, carts: any[]) => {
                    if (err) {
                        reject(err);
                    } else {
                        let customerCarts: Cart[] = [];
                        if (carts.length > 0){
                        for (let cart of carts) {
                            try {
                                db.all("SELECT model, quantity, category, price FROM carts_records WHERE cartId = ?", [cart.cartId], async (err: Error | null, products: any[]) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        let total=0;
                                        let productsInCart: ProductInCart[] = [];
                                        products.forEach((prod: any) => {
                                            productsInCart.push(
                                            new ProductInCart(
                                                prod.model,
                                                prod.quantity,
                                                prod.category,
                                                prod.price
                                            )
                                            );
                                        });
                                        
                                        customerCarts.push(new Cart(
                                            cart.customer,
                                            true,
                                            cart.paymentDate,
                                            cart.total,
                                            productsInCart
                                        ));
                                        if (customerCarts.length === carts.length) {
                                            resolve(customerCarts);
                                        }
                                    }
                                });
                            } catch (err) {
                                reject(err);
                            }
                        }
                    }
                        else{
                            resolve(customerCarts);
                        }
                    }
                });
            } 
            catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Deletes all carts.
     * @returns - A Promise that resolves to true if all carts were successfully deleted, or false if they were not.
     */

    async deleteAllCarts(): Promise<Boolean> {
        return new Promise<Boolean>((resolve,reject)=>{
            try {

                const sql = "DELETE FROM carts_records";
                db.run(sql, [], (err: Error | null) => {
                    if (err)
                        reject(err);
                    else{
                        const sql1 = "DELETE FROM carts";
                        db.run(sql1, [], (err: Error | null) => {
                            if (err)
                                reject(err);
                            else
                                resolve(true);
                        });
                    }
                });
            }
            catch (error){
                reject(error);
            }
        });
    }
    

    async markAllProductAsDeleted(): Promise<boolean>{
        return new Promise<boolean>((resolve,reject)=>{
            try{
                const sql = "UPDATE carts_records SET deleted = 1";
                db.run(sql,[],function(err: Error | null) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(true);
                    }
                })
            }
            catch (err){
                reject(err);
            }
        });
    }


    /**
     * Retrieves all carts in the database.
     * @returns - A Promise that resolves to an array of carts.
     */
    async getAllCarts(): Promise<Cart[]> {
        return new Promise<Cart[]>((resolve, reject) => {
            try {
                db.all("SELECT cartId, customer, paid, paymentDate, total FROM carts", [], async (err: Error | null, carts: any[]) => {
                    if (err) {
                        reject(err);
                    } else {
                        let allCarts: Cart[] = [];
                        if (carts.length > 0){
                        for (let cart of carts) {
                            try {
                                db.all("SELECT model, quantity, category, price FROM carts_records WHERE cartId = ?", [cart.cartId], (err: Error | null, products: any[]) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        let productsInCart: ProductInCart[] = [];
                                        products.forEach((prod: any) => {
                                            productsInCart.push(
                                                new ProductInCart(
                                                    prod.model,
                                                    prod.quantity,
                                                    prod.category as Category, 
                                                    prod.price
                                                )
                                            );
                                        });
                                        let bool;
                                        if(cart.paid==1){
                                            bool=true
                                        }else{
                                            bool=false
                                        }
                                        allCarts.push(new Cart(
                                            cart.customer,
                                            cart.paid ? true : false,
                                            bool ? cart.paymentDate : "" ,
                                            cart.total,
                                            productsInCart
                                        ));
                                        if (allCarts.length === carts.length) {
                                            resolve(allCarts);
                                        }
                                    }
                                });
                            } catch (err) {
                                reject(err);
                            }
                            }
                        }
                        else{
                            resolve(allCarts);
                        }
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }


    /**
     * Mark a product as deleted, in order to keep track of old carts that had it, without explicitly showing it.
     * @param model - The model of the product deleted.
     * @returns A Promise that resolves to `true` if at least one cart possessed the product, or to false if no cart had it.
     */
    async markProductAsDeleted(model: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                db.run("UPDATE carts_records SET deleted = 1 WHERE model = ?", [model], function(err: Error | null) {
                    if (err) {
                        reject(err);
                    } else {
                        if (this.changes > 0) {
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }
}

export default CartDAO;