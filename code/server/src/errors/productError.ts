const PRODUCT_NOT_FOUND = "Product not found"
const PRODUCT_ALREADY_EXISTS = "The product already exists"
const PRODUCT_SOLD = "Product already sold, stock is empty"
const LOW_PRODUCT_STOCK = "Product stock is not empty but it cannot satisfy the requested quantity"
const INCORRECT_GROUPING_NULL = "Grouping format is incorrect: if 'grouping' is set to null, then both 'category' and 'model' must be set to null";
const INCORRECT_GROUPING_CATEGORY = "Grouping format is incorrect: if 'grouping' is set to 'category', then 'category' must be set to a non-null string and 'model' must be set to null";
const INCORRECT_GROUPING_MODEL = "Grouping format is incorrect: if 'grouping' is set to 'model', then 'model' must be set to a non-null string and 'category' must be set to null";

/**
 * Represents an error that occurs when a product is not found.
 */
class ProductNotFoundError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = PRODUCT_NOT_FOUND
        this.customCode = 404
    }
}

/**
 * Represents an error that occurs when a product id already exists.
 */
class ProductAlreadyExistsError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = PRODUCT_ALREADY_EXISTS
        this.customCode = 409
    }
}

/**
 * Represents an error that occurs when a product is already sold.
 */
class ProductSoldError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = PRODUCT_SOLD
        this.customCode = 409
    }
}


// MY ERROR CLASSES

class LowProductStockError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = LOW_PRODUCT_STOCK
        this.customCode = 409
    }
}

class IncorrectNullGrouping extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = INCORRECT_GROUPING_NULL
        this.customCode = 422
    }
}

class IncorrectCategoryGrouping extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = INCORRECT_GROUPING_CATEGORY
        this.customCode = 422
    }
}

class IncorrectModelGrouping extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = INCORRECT_GROUPING_MODEL
        this.customCode = 422
    }
}

export { ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, LowProductStockError , IncorrectNullGrouping, IncorrectCategoryGrouping, IncorrectModelGrouping}