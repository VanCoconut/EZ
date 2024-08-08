import db from "../db/db";
import {Product} from "../components/product";

/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {

    /**
     * Creates a new product concept (model, with quantity defining the number of units available) in the database.
     * @param model The unique model of the product.
     * @param category The category of the product.
     * @param quantity The number of units of the new product.
     * @param details The optional details of the product.
     * @param sellingPrice The price at which one unit of the product is sold.
     * @param arrivalDate The optional date in which the product arrived.
     * @returns A Promise that resolves to nothing.
     */
    createProduct(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null) /**:Promise<void> */ {
        return new Promise<Boolean>((resolve,reject)=>{
            try{
                const sql =
                    `INSERT INTO products(model, category, ${arrivalDate ? 'arrivalDate,':''} ${details ? 'details,': ''} quantity, sellingPrice)
                    VALUES(?,?, ${arrivalDate ? '?,' : ''} ${details ? '?,': ''} ?,?)`;
                const values = [model, category, quantity, sellingPrice];
                if(details)
                    values.splice(2,0,details);
                if(arrivalDate)
                    values.splice(2,0,arrivalDate);
                db.run(sql, values, (err: Error | null)=>{
                    if(err)
                        reject(err);
                    else
                        resolve(true);
                });
            }
            catch (err){
                reject(err);
            }
        });
    }


    /**
     * Increment Model quantity by the specified amount.
     * @param model The model of the product whose sale has to be registered
     * @param quantity The amount of products added
     * @returns A Promise that resolves to 'true' if successfully modified, or to 'false' if not found.
     */
    addModels(model:string, quantity:number):Promise<Boolean>{
        return new Promise<Boolean>((resolve,reject)=>{
            try{
                const sql = `UPDATE products SET quantity=quantity+? WHERE model=?`;
                let params = [quantity,model];
                db.run(sql,params, function(err:Error|null){
                    if(err)
                        reject(err);
                    else{
                        if(this.changes>0)
                            resolve(true);
                        else
                            resolve(false);
                    }
                })
            }
            catch (err){
                reject(err);
            }
        });
    }

    /**
     * Mark a product as sold, reducing its quantity in the stock by a specified amount.
     * @param model The model of the product whose sale has to be registered
     * @param quantity The amount of products sold
     * @returns A Promise that resolves to 'true' if successfully modified, or to 'false' if not found.
     */
    sellModels(model:string, quantity:number):Promise<Boolean>{
        return new Promise<Boolean>((resolve,reject)=>{
            try{
                const sql = `UPDATE products SET quantity=quantity-? WHERE model=?`;
                db.run(sql,[quantity, model], function(err:Error|null){
                    if(err)
                        reject(err);
                    else{
                        if(this.changes>0)
                            resolve(true);
                        else
                            resolve(false);
                    }
                })
            }
            catch (err){
                reject(err);
            }
        });
    }


    /**
     * Retrieves the array of all products from the database.
     * @returns {Promise} A Promise that resolves to the array of Products returned
     */
    getAllProducts(): Promise<Product[]>{
        return new Promise<Product[]>((resolve,reject)=>{
            try{
                const sql = `SELECT * FROM products`;
                db.all(sql,[],(err:Error|null, rows:any)=>{
                    if(err)
                        reject(err);
                    else
                        resolve(rows.map((row:any)=>(new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))));
                });
            }
            catch (err){
                reject(err);
            }
        });
    }

    /**
     * Retrieves the array products by category from the database.
     * @param category Category to be used as filter
     * @returns {Promise} A Promise that resolves to the array of Products returned
     */
    getProductsByCategory(category:string): Promise<Product[]>{
        return new Promise<Product[]>((resolve,reject)=>{
            try{
                const sql = `SELECT * FROM products WHERE category=?`;
                db.all(sql,category,(err:Error|null, rows:any)=>{
                    if(err)
                        reject(err);
                    else
                        resolve(rows.map((row:any)=>(new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))));
                });
            }
            catch (err){
                reject(err);
            }
        });
    }

    /**
     * Retrieves the product of a given model from the database.
     * @param model Model of the product to be retrieved
     * @returns A Promise that resolves to the Product returned or to null if no product is found
     */
    getProductByModel(model:string): Promise<Product|null>{
        return new Promise<Product|null>((resolve,reject)=>{
            try{
                const sql = `SELECT * FROM products WHERE model=?`;
                db.get(sql,[model], (err:Error|null, row:any)=>{
                    if(err)
                        reject(err);
                    else{
                        if(row)
                            resolve(new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity));
                        else
                            resolve(null);
                    }

                });
            }
            catch (err){
                reject(err);
            }
        });
    }


    /**
     * Deletes one product, identified by its model
     * @param model The model of the product to delete
     * @returns A Promise that resolves to 'true' if successfully deleted, or to 'false' if not found.
     */
    deleteModel(model:string): Promise<boolean>{
        return new Promise<boolean>((resolve, reject)=>{
            try{
                const sql = "DELETE FROM products WHERE model=?";
                db.run(sql, [model],  function(err: Error | null){
                    if(err)
                        reject(err);
                    else{
                        if(this.changes>0)
                            resolve(true);
                        else
                            resolve(false);
                    }
                });
            }
            catch (error){
                reject(error);
            }
        });
    }


    /**
     * Deletes all products.
     * @returns A Promise that resolves to nothing if all products have been successfully deleted.
     */
    deleteAllProducts(): Promise<null> {
        return new Promise<null>((resolve,reject)=>{
            try {
                const sql = "DELETE FROM products";
                db.run(sql, [], (err: Error | null) => {
                    if (err)
                        reject(err);
                    else
                        resolve(null);
                });
            }
            catch (error){
                reject(error);
            }
        });
    }
}

export default ProductDAO;