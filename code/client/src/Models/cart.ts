import { Category, Product } from "./product"

/**
 * Represents a shopping cart.
 */
class Cart {
    id: number
    customer: string
    paid: boolean
    paymentDate: string
    total: number
    products: ProductInCart[]

    /**
     * Creates a new instance of the Cart class.
     * @param id - The unique identifier of the cart.
     * @param customer - The username of the customer who owns the cart.
     * @param paid - A boolean value indicating whether the cart has been paid for.
     * @param paymentDate - The date the cart was paid for. This is null if the cart has not been paid for.
     * @param total - The total amount of the cart. It corresponds to the sum of the prices of all the products in the cart and is equal to 0 until the cart is paid for.
     * @param products - The products in the cart.
     */
    constructor(id: number, customer: string, paid: boolean, paymentDate: string, total: number, products: ProductInCart[]) {
        this.id = id
        this.customer = customer
        this.paid = paid
        this.paymentDate = paymentDate
        this.total = total
        this.products = products
    }
}

class ProductInCart {
    model: string
    quantity: number
    category: Category
    price: number

    constructor(model: string, quantity: number, category: Category, price: number) {
        this.model = model
        this.quantity = quantity
        this.category = category
        this.price = price
    }
}

export { Cart, ProductInCart }
