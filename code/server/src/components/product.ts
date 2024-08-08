/**
 * Represents a product offered by the online store.
 */
class Product {
    sellingPrice: number;
    model: string;
    category: Category;
    arrivalDate: string | null;
    details: string | null;
    quantity: number


    /**
     * Creates a new instance of the Product class.
     * @param sellingPrice The price at which a single product unit is sold.
     * @param model The unique model of the product
     * @param category The category of the product. It can only be one of the three allowed types ("Smartphone", "Laptop", "Appliance")
     * @param arrivalDate The date in which the first units of the product arrived at the store
     * @param details The optional details of the product
     * @param quantity The available quantity of the product (number of units). If it is 0, the product is out of stock.
     */
    constructor(sellingPrice: number, model: string, category: Category, arrivalDate: string | null, details: string | null, quantity: number) {
        this.sellingPrice = sellingPrice;
        this.model = model;
        this.category = category;
        this.arrivalDate = arrivalDate;
        this.details = details;
        this.quantity = quantity;
    }
}

/**
 * Represents the category of a product. The values present in this enum are the only valid values for the category of a product.
 */
enum Category {
    SMARTPHONE = "Smartphone",
    LAPTOP = "Laptop",
    APPLIANCE = "Appliance",
}

export { Product, Category }