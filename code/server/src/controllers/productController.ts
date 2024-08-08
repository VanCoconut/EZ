import ProductDAO from "../dao/productDAO";
import dayjs from "dayjs";
import {
    ProductNotFoundError,
    ProductAlreadyExistsError,
    ProductSoldError,
    LowProductStockError,
    IncorrectNullGrouping, IncorrectCategoryGrouping, IncorrectModelGrouping
} from "../errors/productError";
import {DateError} from "../utilities";
import CartDAO from "../dao/cartDAO";


/**
 * Represents a controller for managing products.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class ProductController {
    private dao: ProductDAO
    private cartDao: CartDAO

    constructor() {
        this.dao = new ProductDAO
        this.cartDao = new CartDAO
    }

    /**
     * Registers a new product concept (model, with quantity defining the number of units available) in the database.
     * @param model The unique model of the product.
     * @param category The category of the product.
     * @param quantity The number of units of the new product.
     * @param details The optional details of the product.
     * @param sellingPrice The price at which one unit of the product is sold.
     * @param arrivalDate The optional date in which the product arrived.
     * @returns A Promise that resolves to nothing.
     */
    async registerProducts(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null) /**:Promise<void> */ {
        let arrDate = arrivalDate;
        if(!arrDate)
            arrDate = dayjs().format('YYYY-MM-DD');
        else if(dayjs(arrDate).isAfter(dayjs()))
            throw new DateError;
        if(await this.dao.getProductByModel(model))
            throw new ProductAlreadyExistsError;
        return await this.dao.createProduct(model, category, quantity, details, sellingPrice, arrDate);
    }

    /**
     * Increases the available quantity of a product through the addition of new units.
     * @param model The model of the product to increase.
     * @param quantity The number of product units to add. This number must be added to the existing quantity, it is not a new total.
     * @param changeDate The optional date in which the change occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */
    async changeProductQuantity(model: string, quantity: number, changeDate: string | null) /**:Promise<number> */ {
        let prod = await this.dao.getProductByModel(model);
        if(!prod)
            throw new ProductNotFoundError;
        if(changeDate){
            let cd = dayjs(changeDate);
            if(cd.isAfter(dayjs()))
                throw new DateError;
            if(prod.arrivalDate && cd.isBefore(dayjs(prod.arrivalDate)))
                throw new DateError;
        }
        await this.dao.addModels(model,quantity);
        return quantity+prod.quantity;
    }

    /**
     * Decreases the available quantity of a product through the sale of units.
     * @param model The model of the product to sell
     * @param quantity The number of product units that were sold.
     * @param sellingDate The optional date in which the sale occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */
    async sellProduct(model: string, quantity: number, sellingDate: string | null) /**:Promise<Boolean> */ {
        let prod = await this.dao.getProductByModel(model);
        if(!prod)
            throw new ProductNotFoundError;
        if(sellingDate){
            let sd = dayjs(sellingDate);
            if(sd.isAfter(dayjs()))
                throw new DateError;
            if(prod.arrivalDate && sd.isBefore(dayjs(prod.arrivalDate)))
                throw new DateError;
        }
        if(prod.quantity===0)
            throw new ProductSoldError;
        if(prod.quantity<quantity)
            throw new LowProductStockError;
        return await this.dao.sellModels(model,quantity);
    }

    /**
     * Returns all products in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
    async getProducts(grouping: string | null, category: string | null, model: string | null) /**Promise<Product[]> */ {
        if(grouping===null){
            if(category || model){
                throw new IncorrectNullGrouping;
            }
            else
                return await this.dao.getAllProducts();
        }
        else if(grouping==='category'){
            if(category && !model)
                return await this.dao.getProductsByCategory(category);
            else
                throw new IncorrectCategoryGrouping;
        }
        else if(grouping==='model'){
            if(model && !category){
                const products = [await this.dao.getProductByModel(model)]
                if (products[0]===null)
                    throw new ProductNotFoundError;
                else
                    return products;
            }
            else
                throw new IncorrectModelGrouping;
        }
        else{
            return await this.dao.getAllProducts();
        }
    }

    /**
     * Returns all available products (with a quantity above 0) in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
    async getAvailableProducts(grouping: string | null, category: string | null, model: string | null) /**:Promise<Product[]> */ {
        let retrieved = await this.getProducts(grouping, category, model);
        if(!Array.isArray(retrieved))
            retrieved = [retrieved];
        return retrieved.filter((prd:any)=>(prd.quantity>0));
    }

    /**
     * Deletes all products.
     * @returns A Promise that resolves to `true` if all products have been successfully deleted.
     */
    async deleteAllProducts() /**:Promise <Boolean> */ {
        await this.dao.deleteAllProducts();
        return await this.cartDao.markAllProductAsDeleted();
    }


    /**
     * Deletes one product, identified by its model
     * @param model The model of the product to delete
     * @returns A Promise that resolves to `true` if the product has been successfully deleted.
     */
    async deleteProduct(model: string) /**:Promise <Boolean> */ {
        if(await this.dao.deleteModel(model)){
            await this.cartDao.markProductAsDeleted(model);
            return true;
        }
        else
            throw new ProductNotFoundError;
    }

}

export default ProductController;