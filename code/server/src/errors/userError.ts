const USER_NOT_FOUND = "The user does not exist"
const USER_NOT_MANAGER = "This operation can be performed only by a manager"
const USER_ALREADY_EXISTS = "The username already exists"
const USER_NOT_CUSTOMER = "This operation can be performed only by a customer"
const USER_NOT_ADMIN = "This operation can be performed only by an admin"
const USER_IS_ADMIN = "Admins cannot be deleted"
const UNAUTHORIZED_USER = "You cannot access the information of other users"
const NOTHING_TO_CHANGE = "Nothing has been changed"

/**
 * Represents an error that occurs when a user is not found.
 */
class UserNotFoundError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = USER_NOT_FOUND
        this.customCode = 404
    }
}

class NothingToChange extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = NOTHING_TO_CHANGE
        this.customCode = 500
    }
}

/**
 * Represents an error that occurs when a user is not a manager.
 */
class UserNotManagerError extends Error {
    customMessage: String;
    customCode: Number;

    constructor() {
        super()
        this.customMessage = USER_NOT_MANAGER
        this.customCode = 401
    }
}

/**
 * Represents an error that occurs when a user is not a customer.
 */
class UserNotCustomerError extends Error {
    customMessage: String;
    customCode: Number;

    constructor() {
        super()
        this.customMessage = USER_NOT_CUSTOMER
        this.customCode = 401
    }
}



/**
 * Represents an error that occurs when a username is already in use.
 */
class UserAlreadyExistsError extends Error {
    customMessage: String;
    customCode: Number;

    constructor() {
        super()
        this.customMessage = USER_ALREADY_EXISTS
        this.customCode = 409
    }
}

class UserNotAdminError extends Error {
    customMessage: String;
    customCode: Number;

    constructor() {
        super()
        this.customMessage = USER_NOT_ADMIN
        this.customCode = 401
    }
}

class UserIsAdminError extends Error {
    customMessage: String;
    customCode: Number;

    constructor() {
        super()
        this.customMessage = USER_IS_ADMIN
        this.customCode = 401
    }
}

class UnauthorizedUserError extends Error {
    customMessage: String;
    customCode: Number;

    constructor() {
        super()
        this.customMessage = UNAUTHORIZED_USER
        this.customCode = 401
    }
}

export { NothingToChange,UserNotFoundError, UserNotManagerError, UserNotCustomerError, UserAlreadyExistsError, UserNotAdminError, UserIsAdminError, UnauthorizedUserError }