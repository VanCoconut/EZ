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