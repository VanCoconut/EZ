const CART_NOT_FOUND = "Cart not found"
const PRODUCT_IN_CART = "Product already in cart"
const PRODUCT_NOT_IN_CART = "Product not in cart"
const WRONG_USER_CART = "Cart belongs to another user"
const EMPTY_CART = "Cart is empty"

/**
 * Represents an error that occurs when a cart is not found.
 */
class CartNotFoundError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = CART_NOT_FOUND
        this.customCode = 404
    }
}

/**
 * Represents an error that occurs when a product is already in a cart.
 */
class ProductInCartError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = PRODUCT_IN_CART
        this.customCode = 409
    }
}

/**
 * Represents an error that occurs when a product is not in a cart.
 */
class ProductNotInCartError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = PRODUCT_NOT_IN_CART
        this.customCode = 404
    }
}

/**
 * Represents an error that occurs when a cart belongs to another user.
 */
class WrongUserCartError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = WRONG_USER_CART
        this.customCode = 403
    }
}

/**
 * Represents an error that occurs when a cart is empty.
 */
class EmptyCartError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = EMPTY_CART
        this.customCode = 400
    }
}

export { CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError, EmptyCartError }