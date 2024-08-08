# EZElectronics Full API Specifications

This document lists all the expected behaviors for the APIs that compose the EZElectronics application.

Request parameters, request body content, and optional query parameters must be validated when handling a request; this can be done in two ways:

- in the different functions inside the `controllers` module
  Example:
  ```javascript
     async createUser(username: string, name: string, surname: string, password: string, role: string): Promise<boolean> {
        if(!username || !name || !surname || !password || !role) throw new WrongParametersError() //example error with the correct error code
        if(username.length === 0 || name.length === 0 || surname.length === 0 || password.length === 0 || role.length === 0) throw new WrongParametersError()
        if(role !== "Manager" || role !== "Customer") thow new WrongParametersError()
        const ret: any = await this.dao.createUser(username, name, surname, password, role)
        return ret
    }
  ```
- using middlewares directly when calling the routes in the `routers` module (preferred option for simplicity)
  Example:
  ```javascript
  this.router.post(
    "/",
    body("username").isString().isLength({ min: 1 }), //the request body must contain an attribute named "username", the attribute must be a non-empty string
    body("surname").isString().isLength({ min: 1 }), //the request body must contain an attribute named "surname", the attribute must be a non-empty string
    body("name").isString().isLength({ min: 1 }), //the request body must contain an attribute named "name", the attribute must be a non-empty string
    body("password").isString().isLength({ min: 1 }), //the request body must contain an attribute named "password", the attribute must be a non-empty string
    body("role").isString().isIn(["Manager", "Customer"]), //the request body must contain an attribute named "role", the attribute must be a string and its value must be one of the two allowed options
    this.errorHandler.validateRequest, //middleware defined in `helper.ts`, checks the result of all the evaluations performed above and returns a 422 error if at least one fails or continues if there are no issues
    (req: any, res: any, next: any) =>
      this.controller
        .createUser(
          req.body.username,
          req.body.name,
          req.body.surname,
          req.body.password,
          req.body.role
        )
        .then(() => res.status(200).end())
        .catch((err) => {
          next(err);
        })
  );
  ```

The different middlewares that can be used when calling a route are:

- The validators defined by [express-validator](https://express-validator.github.io/docs): these validators can check the body of a request, its request parameters, its cookies, its header, and its optional query parameters. It is possible to check whether an attribute is an integer, an email, a string, a numeric value, and more.
- The function `ErrorHandler.validateRequest()` defined inside `helper.ts`. This function can be placed after a chain of validators to return an error code in case at least one constraint is not respected.
- The function `isLoggedIn()` defined inside `routers/auth.ts`. This function can be used to define a route that requires authentication: if the route is accessed without setting cookies that correspond to a logged in user it returns a 401 error.
- The functions `isCustomer()`, `isManager()`, `isAdmin()`, and `isAdminOrManager()` defined inside `routers/auth.ts`. These functions check whether a logged in user has a specific role, returning 401 if a user with a different role tries to access a route.

## API List

For all constraints on request parameters and request body content, always assume a 422 error in case one constraint is not satisfied.
For all access constraints, always assume a 401 error in case the access rule is not satisfied.
For all success scenarios, always assume a 200 status code for the API response.
Specific error scenarios will have their corresponding error code.

### Access APIs

#### POST `ezelectronics/sessions`

Allows login for a user with the provided credentials.

- Request Parameters: None
- Request Body Content: An object having as attributes:
  - `username`: a string that must not be empty
  - `password`: a string that must not be empty
  - Example: `{username: "MarioRossi", password: "MarioRossi"}`
- Response Body Content: A **User** object that represents the logged in user
  - Example: `{username: "Mario Rossi", name: "Mario", surname: "Rossi", role: "Customer"}`
- Access Constraints: None
- Additional Constraints:
  - Returns a 401 error if the username does not exist
  - Returns a 401 error if the password provided does not match the one in the database

#### DELETE `ezelectronics/sessions/current`

Performs logout for the currently logged in user.

- Request Parameters: None
- Request Body Content: None
- Response Body Content: None
- Access Constraints: Can only be called by a logged in User

#### GET `ezelectronics/sessions/current`

Retrieves information about the currently logged in user.

- Request Parameters: None
- Request Body Content: None
- Response Body Content: A **User** object that represents the logged in user
  - Example: `{username: "Mario Rossi", name: "Mario", surname: "Rossi", role: "Customer"}`
- Access Constraints: Can only be called by a logged in User

### User APIs

#### POST `ezelectronics/users`

Creates a new user with the provided information.

- Request Parameters: None
- Request Body Content: An object with the following attributes:
  - `username`: a string that must not be empty
  - `name`: a string that must not be empty
  - `surname`: a string that must not be empty
  - `password`: a string that must not be empty
  - `role`: a string whose value can only be one of ["Customer", "Manager", "Admin"]
- Response Body Content: None
- Access Constraints: None
- Additional Constraints:
  - It should return a 409 error when `username` represents a user that is already in the database

#### GET `ezelectronics/users`

Returns the list of all users.

- Request Parameters: None
- Request Body Content: None
- Response Body Content: An array of **User** objects where each one represents a user present in the database
  - Example: `[{username: "Mario Rossi", name: "Mario", surname: "Rossi", role: "Customer", address: "...", birthdate: ".."}, {username: "Giuseppe Verdi", name: "Giuseppe", surname: "Verdi", role: "Customer", address: "...", birthdate: ".."}, {username: "Admin", name: "admin", surname: "admin", role: "Manager", address: "...", birthdate: ".."}]`
- Access Constraints: Can only be called by a logged in user whose role is Admin

#### GET `ezelectronics/users/roles/:role`

Returns the list of all users with a specific role.

- Request Parameters: Example `ezelectronics/users/role/Customer`
  - `role`: a string whose value can only be one of ["Customer", "Manager", "Admin"]
- Request Body Content: None
- Response Body Content: An array of **User** objects where each one represents a user present in the database with the specified role
  - Example: `[{username: "Mario Rossi", name: "Mario", surname: "Rossi", role: "Customer", address: "...", birthdate: ".."}]`
- Access Constraints: Can only be called by a logged in user whose role is Admin

#### GET `ezelectronics/users/:username`

Returns a single user with a specific username. Admins can see the information of any user, other user types can only see their own information.

- Request Parameters: Example: `ezelectronics/users/Admin`
  - `username`: a string that must not be empty
- Request Body Content: None
- Response Body Content: A **User** object representing the requested user
  - Example: `{username: "Admin", name: "admin", surname: "admin", role: "Manager", address: null, birthdate: null}`
- Access Constraints: Can only be called by a logged in User
- Additional Constraints:
  - It should return a 404 error when `username` represents a user that does not exist in the database
  - It should return a 401 error when `username` is not equal to the username of the logged user calling the route, and the user calling the route is not an Admin

#### DELETE `ezelectronics/users/:username`

Deletes a specific user, identified by the username, from the database. Admins can delete any non-Admin user and themselves, but cannot delete other Admins, other user types can only delete themselves.

- Request Parameters: Example: `ezelectronics/users/Admin`
  - `username`: a string that must not be empty
- Request Body Content: None
- Response Body Content: None
- Access Constraints: Can only be called by a logged in User
- Additional Constraints:
  - It should return a 404 error when `username` represents a user that does not exist in the database
  - It should return a 401 error when `username` is not equal to the username of the logged user calling the route, and the user calling the route is not an Admin
  - It should return a 401 error when the calling user is an Admin and `username` represents a different Admin user

#### DELETE `ezelectronics/users`

Deletes all non-Admin users from the database.

- Request Parameters: None
- Request Body Content: None
- Response Body Content: None
- Access Constraints: Can only be called by a logged in user whose role is Admin

#### PATCH `ezelectronics/users/:username`

Updates the personal information of a single user, identified by the username. Customers and Managers can only update their personal information, Admins can update the information of any non-Admin user. It is possible to change only name, surname, address, and birthdate; role and access information (username, password) cannot be changed (not even by Admins).

- Request Parameters: Example: `ezelectronics/users/Admin`
  - `username`: a string that must not be empty
- Request Body Content: An object with the following attributes:
  - `name`: a string that must not be empty
  - `surname`: a string that must not be empty
  - `address`: a string that must not be empty
  - `birthdate`: a string that represents a date in the format **YYYY-MM-DD**. It must not be empty
  - Example: `{name: "admin", surname: "admin", address: "Corso Duca degli Abruzzi 129, Torino", birthdate: "01/01/1970"}`
- Response Body Content: A **User** object representing the updated user
  - Example: `{username: "Admin", name: "admin", surname: "admin", role: "Manager", address: "Corso Duca degli Abruzzi 129, Torino", birthdate: "01/01/1970"}`
- Access Constraints: Can only be called by a logged in User
- Additional Constraints:
  - It should return a 404 error when `username` represents a user that does not exist in the database
  - It should return a 401 error when `username` does not correspond to the username of the logged in user
  - It should return a 400 error when `birthdate` is after the current date
  - It should return a 401 error when `username` is not equal to the username of the logged user calling the route, and the user calling the route is not an Admin

### Product APIs

#### POST `ezelectronics/products`

Registers the arrival of a set of products that have the same model. It can only be used to register the first arrival of a new model (e.g. the first time a shipment of iPhone 13 models arrives in the shop), subsequent arrivals use a different API.

- Request Parameters: None
- Request Body Content: An object with the following parameters:
  - `model`: a string that must not be empty
  - `category`: a string whose value can only be one of ["Smartphone", "Laptop", "Appliance"]
  - `quantity`: an integer value that must be greater than 0. Represents the instances of the product that have arrived (e.g. 5 distinct iPhone 13 all count as a single arrival)
  - `details`: a string that can be empty
  - `sellingPrice`: a floating point number whose value is greater than 0. Represents the price at which a single instance of the product is sold to customers.
  - `arrivalDate`: an optional string that represents a date. If present, it must be in the format **YYYY-MM-DD**. If absent, then the current date is used as the arrival date for the product, in the same format.
  - Example: `{model: "iPhone 13", category: "Smartphone", quantity: 5, details: "", sellingPrice: 200, arrivalDate: "2024-01-01"}`
- Response Body Content: None
- Access Constraints: Can only be called by a logged in user whose role is either Admin or Manager
- Additional Constraints:
  - It should return a 409 error if `model` represents an already existing set of products in the database
  - It should return a 400 error when `arrivalDate` is after the current date

#### PATCH `ezelectronics/products/:model`

Increases the available quantity of a set of products. The API is used when a new shipment of an already registered product arrives in the shop.

- Request Parameters: Example: `ezelectronics/products/iPhone13`
  - `model`: a string that represents the model of a product. It cannot be empty
- Request Body Content: An object with the following parameters:
  - `quantity`: an integer value that must be higher than 0. It represents the amount of product instances that have arrived in the shop; this quantity must be added to the existing product quantity in the stock, it does not replace the existing quantity.
  - `changeDate`: an optional string that represents a date. If present, it must be in the format **YYYY-MM-DD**. If absent, then the current date is used as the date for the quantity change, in the same format.
  - Example: `{quantity: 3}`
- Response Body Content: an integer that represents the new quantity of available products
  - Example `{quantity: 8}`
- Access Constraints: Can only be called by a logged in user whose role is either Admin or Manager
- Additional Constraints:
  - It should return a 404 error if `model` does not represent a product in the database
  - It should return a 400 error if `changeDate` is after the current date
  - It should return a 400 error if `changeDate` is before the product's `arrivalDate`

#### PATCH `ezelectronics/products/:model/sell`

Records a product's sale, reducing its quantity in the stock by a specified amount. This API represents a scenario where a Customer purchases a product in the shop and a Manager needs to update the stock at the counter, it is not called after an online purchase through a cart.

- Request Parameters: Example: `ezelectronics/products/iPhone13/sell`
  - `model`: a string that represents the model of a product. It cannot be empty
- Request Body Content: An object with the following parameters:
  - `sellingDate`: an optional string that represents a date. If present, it must be in the format **YYYY-MM-DD**. If absent, then the current date is used as the selling date for the product, in the same format.
  - `quantity`: an integer value that must be greater than 0. It represents the amount of product instances that have been sold, the available quantity in the stock must be reduced by this amount
  - Example: `{sellingDate: "2024-01-02", quantity: 2}`
- Response Body Content: None
- Access Constraints: Can only be called by a logged in user whose role is either Admin or Manager
- Additional Constraints:
  - It should return a 404 error if `model` does not represent a product in the database
  - It should return a 400 error if `sellingDate` is after the current date
  - It should return a 400 error if `sellingDate` is before the product's `arrivalDate`
  - It should return a 409 error if `model` represents a product whose available quantity is 0
  - It should return a 409 error if the available quantity of `model` is lower than the requested `quantity`

#### GET `ezelectronics/products`

Returns all products present in the database, with optional filtering by either category or model.

- Request Parameters: None
- Request Body Content: None
- Response Body Content: An array of **Product** objects, each one representing a product in the database.
  - Example: `[{sellingPrice: 200, model: "iPhone 13", category: "Smartphone", details: "", arrivalDate: "2024-01-01", quantity: 8}]`
- Access Constraints: Can only be called by a logged in user whose role is either Admin or Manager
- Optional Query Parameters:
  - `grouping`: a string that can either be null, `category`, or `model`. It represents the possible filtering options of the API
    - If `null`, then the other two query parameters must also be null. In this case, it returns all products in the database
    - If `category`, then the `category` parameter cannot be null and `model` must be null. In this case, it returns all products in the database that have the requested category.
    - If `model`, then the `model` parameter cannot be null and `model` must be null. In this case, it returns the information of the requested model.
  - `category`: a string that can either be null or one of ["Smartphone", "Laptop", "Appliance"]
  - `model`: a string that can be null but, if present, cannot be empty
- Additional Constraints:
  - It should return a 422 error if `grouping` is null and any of `category` or `model` is not null
  - It should return a 422 error if `grouping` is `category` and `category` is null OR `model` is not null
  - It should return a 422 error if `grouping` is `model` and `model` is null OR `category` is not null
  - It should return a 404 error if `model` does not represent a product in the database (only when `grouping` is `model`)

#### GET `ezelectronics/products/available`

Returns all products in the database that are available (their quantity is more than 0), with optional filtering by either category or model.

- Request Parameters: None
- Request Body Content: None
- Response Body Content:An array of **Product** objects, each one representing a product in the database.
  - Example: `[{sellingPrice: 200, model: "iPhone 13", category: "Smartphone", details: "", arrivalDate: "2024-01-01", quantity: 8}]`
- Access Constraints: Can only be called by a logged in User
- Optional Query Parameters:
  - `grouping`: a string that can either be null, `category`, or `model`. It represents the possible filtering options of the API
    - If `null`, then the other two query parameters must also be null. In this case, it returns all products in the database
    - If `category`, then the `category` parameter cannot be null and `model` must be null. In this case, it returns all products in the database that have the requested category.
    - If `model`, then the `model` parameter cannot be null and `model` must be null. In this case, it returns the information of the requested model.
  - `category`: a string that can either be null or one of ["Smartphone", "Laptop", "Appliance"]
  - `model`: a string that can be null but, if present, cannot be empty
- Additional Constraints:
  - It should return a 422 error if `grouping` is null and any of `category` or `model` is not null
  - It should return a 422 error if `grouping` is `category` and `category` is null OR `model` is not null
  - It should return a 422 error if `grouping` is `model` and `model` is null OR `category` is not null
  - It should return a 404 error if `model` does not represent a product in the database (only when `grouping` is `model`)

#### DELETE `ezelectronics/products/:model`

Deletes one product from the database, removing it from the shop and making it not available anymore.

- Request Parameter: Example: `ezelectronics/products/iPhone13`
  - `model`: a string that represents the model of a product. It cannot be empty
- Request Body Content: None
- Response Body Content: None
- Access Constraints: Can only be called by a logged in user whose role is either Admin or Manager
- Additional Constraints:
  - It should return a 404 error if `model` does not represent a product in the database

#### DELETE `ezelectronics/products`

Deletes all products from the database.

- Request Parameters: None
- Request Body Content: None
- Response Body Content: None
- Access Constraints: Can only be called by a logged in user whose role is either Admin or Manager

### Cart APIs

#### GET `ezelectronics/carts`

Returns the current cart of the logged in user. The total cost of the cart needs to be equal to the total cost of its products, keeping in mind the quantity of each product. There can be at most one _unpaid_ cart per customer in the database at any moment.

- Request Parameters: None
- Request Body Content: None
- Response Body Content: A **Cart** object that represents the cart of the currently logged in user.
  - Example: `{customer: "Mario Rossi", paid: false, paymentDate: null, total: 200, products: [{model: "iPhone 13", category: "Smartphone", quantity: 1, price: 200}]}`
- Access Constraints: Can only be called by a logged in user whose role is Customer
- Additional Constraints:
  - It should return an empty Cart object if there is no information about an unpaid cart in the database, or if there is an unpaid cart with no products. Example: `{customer: "Mario Rossi", paid: false, paymentDate: null, total: 0, products: []}`

#### POST `ezelectronics/carts`

Adds a product instance, identified by the model, to the current cart of the logged in user. In case there is no information about the current _unpaid_ cart of the user, the information should be inserted in the database, together with the information about the product. In case there is information about the cart, then two scenarios can happen, depending on the product to add: if there is already at least one instance of the product in the cart, its amount is increased by one; if there are no instances of the product in the cart, its information is added. The total cost of the cart should be updated with the cost of the product instance.

- Request Parameters: None
- Request Body Content: An object with the following parameters:
  - `model`: a string that cannot be empty
  - Example: `{model: "iPhone13"}`
- Response Body Content: None
- Access Constraints: Can only be called by a logged in user whose role is Customer
- Additional Constraints:
  - It should return a 404 error if `model` does not represent an existing product
  - It should return a 409 error if `model` represents a product whose available quantity is 0

#### PATCH `ezelectronics/carts`

Simulates payment for the current cart of the logged in user. The payment date of the cart is set to the current date, in format **YYYY-MM-DD**. The available quantity of products in the cart is reduced by the specified amount. We assume that payment is always successful, and that an order is handled by the store right after checkout.

- Request Parameters: None
- Request Body Content: None
- Response Body Content: None
- Access Constraints: Can only be called by a logged in user whose role is Customer
- Additional Constraints:
  - It should return a 404 error if there is no information about an _unpaid_ cart in the database
  - It should return a 400 error if there is information about an _unpaid_ cart but the cart contains no product
  - It should return a 409 error if there is at least one product in the cart whose available quantity in the stock is 0
  - It should return a 409 error if there is at least one product in the cart whose quantity is higher than the available quantity in the stock

#### GET `ezelectronics/carts/history`

Returns the history of the carts that have been paid for by the current user.
The current cart, if present, is not included in the list.

- Request Parameters: None
- Request Body Content: None
- Response Body Content: An array of **Cart** objects that represents the history of past orders made by the currently logged in user.
  - Example: `[{customer: "Mario Rossi", paid: true, paymentDate: 2024-05-02, total: 200, products: [{model: "iPhone 13", category: "Smartphone", quantity: 1, price: 200}]}]`
- Access Constraints: Can only be called by a logged in user whose role is Customer

#### DELETE `ezelectronics/carts/products/:model`

Removes an instance of a product from the current cart of the logged in user, reducing its quantity in the cart by one. The total cost of the cart must be reduced by the cost of one product instance.

- Request Parameters: Example: `ezelectronics/carts/products/iPhone3`
  - `model`: a string that cannot be empty
- Request Body Content: None
- Response Body Content: None
- Access Constraints: Can only be called by a logged in user whose role is Customer
- Additional Constraints:
  - It should return a 404 error if `model` represents a product that is not in the cart
  - It should return a 404 error if there is no information about an _unpaid_ cart for the user, or if there is such information but there are no products in the cart
  - It should return a 404 error if `model` does not represent an existing product

#### DELETE `ezelectronics/carts/current`

Empties the current cart by deleting all of its products. The total cost of the cart must be set to 0.

- Request Parameters: None
- Request Body Content: None
- Response Body Content: None
- Access Constraints: Can only be called by a logged in user whose role is Customer
- Additional Constraints:
  - It should return a 404 error if there is no information about an _unpaid_ cart for the user

#### DELETE `ezelectronics/carts`

Deletes all existing carts of all users, both current and past.

- Request Parameters: None
- Request Body Content: None
- Response Body Content: None
- Access Constraints: Can only be called by a logged in user whose role is either Admin or Manager

#### GET `ezelectronics/carts/all`

Returns all carts of all users, both current and past.

- Request Parameters: None
- Request Body Content: None
- Response Body Content: An array of **Cart** objects that represents the carts of all customers in the database
  - Example: `[{customer: "Mario Rossi", paid: true, paymentDate: 2024-05-02, total: 200, products: [{model: "iPhone 13", category: "Smartphone", quantity: 1, price: 200}]}]`
- Access Constraints: Can only be called by a logged in user whose role is either Admin or Manager

### Review APIs

#### POST `ezelectronics/reviews/:model`

Adds a new review by a single customer to a product. A customer can leave at most one review for each product model. The current date is used as the date for the review, in format **YYYY-MM-DD**.

- Request Parameters: Example: `ezelectronics/reviews/iPhone13`
  - `model`: a string that cannot be empty
- Request Body Content: An object with the following parameters:
  - `score`: an integer whose value must be between 1 and 5
  - `comment`: a string that cannot be null
  - Example: `{score: 5, comment: "A very cool smartphone!}`
- Response Body Content: None
- Access Constraints: Can only be called by a logged in user whose role is Customer
- Additional Constraints:
  - It should return a 404 error if `model` does not represent an existing product in the database
  - It should return a 409 error if there is an existing review for the product made by the customer

#### GET `ezelectronics/reviews/:model`

Returns all reviews made for a specific product.

- Request Parameters: Example: `ezelectronics/reviews/iPhone13`
  - `model`: a string that cannot be empty
- Request Body Content: None
- Response Body Content: an array of **Review** objects that represents all reviews assigned to a specific product
  - Example: `[{model: "iPhone13", user: "Mario Rossi", score: 5, date: "2024-05-02", comment: "A very cool smartphone!"}]`
- Access Constraints: Can only be called by a logged in User

#### DELETE `ezelectronics/reviews/:model`

Deletes the review made by the current user for a specific product. It does not allow the deletion of a review made by another user for the product.

- Request Parameters: Example: `ezelectronics/reviews/iPhone13`
- Request Body Content: None
- Response Body Content: None
- Access Constraints: Can only be called by a logged in user whose role is Customer
- Additional Constraints:
  - It should return a 404 error if `model` does not represent an existing product in the database
  - It should return a 404 error if the current user does not have a review for the product identified by `model`

#### DELETE `ezelectronics/reviews/:model/all`

Deletes all reviews of a specific product.

- Request Parameters: Example: `ezelectronics/reviews/iPhone13/all`
- Request Body Content: None
- Response Body Content: None
- Access Constraints: Can only be called by a logged in user whose role is either Admin or Manager
- Additional Constraints:
  - It should return a 404 error if `model` does not represent an existing product in the database

#### DELETE `ezelectronics/reviews`

Deletes all reviews of all existing products.

- Request Parameters: None
- Request Body Content: None
- Response Body Content: None
- Access Constraints: Can only be called by a logged in user whose role is either Admin or Manager
