import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"

const routePath = "/ezelectronics"
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
let customerCookie: string
let managerCookie: string
let adminCookie: string

const postUser = async (userInfo: any) => {
    await request(app).post(`${routePath}/users`).send(userInfo).expect(200)
}

const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app).post(`${routePath}/sessions`).send(userInfo).expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}



describe("Tests for Product Routes", () => {
    beforeAll(async () => {
        await cleanup()
        //The cleanup function may not finish in time for the next operation, leading to potential issues
        //We wait 15 seconds before writing to the database, ensuring that the test suite contains what we need
        await new Promise(resolve => setTimeout(resolve, 15000))
        //We create one user for each role and log them in
        await postUser(customer)
        await postUser(manager)
        await postUser(admin)
        customerCookie = await login(customer)
        managerCookie = await login(manager)
        adminCookie = await login(admin)
    })

    afterAll(async () => {
        await cleanup()
    })

    describe("1. POST /products", () => {
        test("1.1 It should return 200 and create a new product when called by a Manager or an Admin", async () => {
            //We have each user create a product, then we check if the products are in the database
            let product = { model: "model", category: "Smartphone", quantity: 10, details: "details", sellingPrice: 1000, arrivalDate: "2022-01-01" }
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product)
                .expect(200)
            let secondProduct = { model: "model2", category: "Laptop", quantity: 20, details: "details", sellingPrice: 2000, arrivalDate: "2022-01-01" }
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(secondProduct)
                .expect(200)
            let products = await request(app).get(`${routePath}/products`).set("Cookie", managerCookie).expect(200)
            expect(products.body.length).toBe(2)
            expect(products.body[0].model).toBe("model")
            expect(products.body[1].model).toBe("model2")
            expect(products.body[0].category).toBe("Smartphone")
            expect(products.body[1].category).toBe("Laptop")
            expect(products.body[0].quantity).toBe(10)
            expect(products.body[1].quantity).toBe(20)
            expect(products.body[0].details).toBe("details")
            expect(products.body[1].details).toBe("details")
            expect(products.body[0].sellingPrice).toBe(1000)
            expect(products.body[1].sellingPrice).toBe(2000)
            expect(products.body[0].arrivalDate).toBe("2022-01-01")
            expect(products.body[1].arrivalDate).toBe("2022-01-01")
        })

        test("1.2 It should return 422 for wrong input parameters", async () => {
            await request(app).post(`${routePath}/products`).set("Cookie", managerCookie).send({ model: "", category: "Smartphone", quantity: 10, details: "details", sellingPrice: 1000, arrivalDate: "2022-01-01" }).expect(422)
            await request(app).post(`${routePath}/products`).set("Cookie", managerCookie).send({ model: "modelWrong", category: "", quantity: 10, details: "details", sellingPrice: 1000, arrivalDate: "2022-01-01" }).expect(422)
            await request(app).post(`${routePath}/products`).set("Cookie", managerCookie).send({ model: "modelWrong", category: "Wrong", quantity: 10, details: "details", sellingPrice: 1000, arrivalDate: "2022-01-01" }).expect(422)
            await request(app).post(`${routePath}/products`).set("Cookie", managerCookie).send({ model: "modelWrong", category: "Smartphone", quantity: 0, details: "details", sellingPrice: 1000, arrivalDate: "2022-01-01" }).expect(422)
            await request(app).post(`${routePath}/products`).set("Cookie", managerCookie).send({ model: "modelWrong", category: "Smartphone", quantity: -1, details: "details", sellingPrice: 1000, arrivalDate: "2022-01-01" }).expect(422)
            await request(app).post(`${routePath}/products`).set("Cookie", managerCookie).send({ model: "modelWrong", category: "Smartphone", quantity: "a", details: "details", sellingPrice: 1000, arrivalDate: "2022-01-01" }).expect(422)
            await request(app).post(`${routePath}/products`).set("Cookie", managerCookie).send({ model: "modelWrong", category: "Smartphone", quantity: 10, details: "details", sellingPrice: 0, arrivalDate: "2022-01-01" }).expect(422)
            await request(app).post(`${routePath}/products`).set("Cookie", managerCookie).send({ model: "modelWrong", category: "Smartphone", quantity: 10, details: "details", sellingPrice: -1, arrivalDate: "2022-01-01" }).expect(422)
            await request(app).post(`${routePath}/products`).set("Cookie", managerCookie).send({ model: "modelWrong", category: "Smartphone", quantity: 10, details: "details", sellingPrice: "a", arrivalDate: "2022-01-01" }).expect(422)
            await request(app).post(`${routePath}/products`).set("Cookie", managerCookie).send({ model: "modelWrong", category: "Smartphone", quantity: 10, details: "details", sellingPrice: 1000, arrivalDate: "2022-01-32" }).expect(422)
            await request(app).post(`${routePath}/products`).set("Cookie", managerCookie).send({ model: "modelWrong", category: "Smartphone", quantity: 10, details: "details", sellingPrice: 1000, arrivalDate: "01-01-2024" }).expect(422)

        })

        test("1.3 It should return 409 for a model that already exists", async () => {
            let product = { model: "model", category: "Smartphone", quantity: 10, details: "details", sellingPrice: 1000, arrivalDate: "2022-01-01" }
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product)
                .expect(409)
        })

        test("1.4 It should return 401 when called by a customer", async () => {
            let product = { model: "modelNew", category: "Smartphone", quantity: 10, details: "details", sellingPrice: 1000, arrivalDate: "2022-01-01" }
            await request(app).post(`${routePath}/products`).set("Cookie", customerCookie).send(product).expect(401)
        })

        test("1.5 It should return 401 when not logged in", async () => {
            let product = { model: "modelNew", category: "Smartphone", quantity: 10, details: "details", sellingPrice: 1000, arrivalDate: "2022-01-01" }
            await request(app).post(`${routePath}/products`).send(product).expect(401)
        })

        test("1.6 It should return 400 if the arrival date is after the current date", async () => {
            let product = { model: "modelNew", category: "Smartphone", quantity: 10, details: "details", sellingPrice: 1000, arrivalDate: "2124-01-01" }
            await request(app).post(`${routePath}/products`).set("Cookie", managerCookie).send(product).expect(400)
        })

        test("1.7 It should create a product with the current date if the arrival date is not provided", async () => {
            //We get the current date and create a product without an arrival date
            //The new product should be created with the current date as the arrival date
            let today = new Date().toISOString().split('T')[0]
            let product = { model: "modelNew", category: "Smartphone", quantity: 10, details: "details", sellingPrice: 1000 }
            await request(app).post(`${routePath}/products`).set("Cookie", managerCookie).send(product).expect(200)
            let products = await request(app).get(`${routePath}/products`).set("Cookie", managerCookie).expect(200)
            expect(products.body.length).toBe(3)
            let newProd = products.body.find((p: any) => p.model === "modelNew")
            expect(newProd.arrivalDate).toBe(today)
            expect(newProd.model).toBe("modelNew")
            expect(newProd.category).toBe("Smartphone")
            expect(newProd.quantity).toBe(10)
            expect(newProd.details).toBe("details")
            expect(newProd.sellingPrice).toBe(1000)
        })
    })

    describe("2. PATCH /products/:model", () => {
        test("2.1 It should increase the quantity of a product when called by a Manager or an Admin", async () => {
            //We increase the quantity of a product (with each role) and then retrieve the list of products. The model's quantity should be updated
            //The two possible date scenarios are covered: the quantity is updated even if the date is not provided and the current date is considered
            await request(app).patch(`${routePath}/products/model`).set("Cookie", managerCookie).send({ quantity: 5 }).expect(200)
            let products = await request(app).get(`${routePath}/products`).set("Cookie", managerCookie).expect(200)
            let product = products.body.find((p: any) => p.model === "model")
            expect(product.quantity).toBe(15)
            await request(app).patch(`${routePath}/products/model`).set("Cookie", adminCookie).send({ quantity: 10, changeDate: "2022-02-01" }).expect(200)
            products = await request(app).get(`${routePath}/products`).set("Cookie", managerCookie).expect(200)
            product = products.body.find((p: any) => p.model === "model")
            expect(product.quantity).toBe(25)
        })

        test("2.2 It should return 422 for wrong input parameters", async () => {
            await request(app).patch(`${routePath}/products/model`).set("Cookie", managerCookie).send({ quantity: "a" }).expect(422)
            await request(app).patch(`${routePath}/products/model`).set("Cookie", managerCookie).send({ quantity: 0 }).expect(422)
            await request(app).patch(`${routePath}/products/model`).set("Cookie", managerCookie).send({ quantity: -1 }).expect(422)
            await request(app).patch(`${routePath}/products/model`).set("Cookie", managerCookie).send({ quantity: 1, changeDate: "date" }).expect(422)
            await request(app).patch(`${routePath}/products/model`).set("Cookie", managerCookie).send({ quantity: 1, changeDate: "2022-02-32" }).expect(422)
            await request(app).patch(`${routePath}/products/model`).set("Cookie", managerCookie).send({ quantity: 1, changeDate: "01-01-2024" }).expect(422)
        })

        test("2.3 It should return 404 for a product that does not exist", async () => {
            await request(app).patch(`${routePath}/products/nonexistent`).set("Cookie", managerCookie).send({ quantity: 5 }).expect(404)
        })

        test("2.4 It should return 401 when called by a customer", async () => {
            await request(app).patch(`${routePath}/products/model`).set("Cookie", customerCookie).send({ quantity: 5 }).expect(401)
        })

        test("2.5 It should return 401 when not logged in", async () => {
            await request(app).patch(`${routePath}/products/model`).send({ quantity: 5 }).expect(401)
        })

        test("2.6 It should return 400 if the change date is after the current date or before the arrival date", async () => {
            //We know when the product was created so we set a date before its creation, expecting an error
            //The same is done for a date after the current date
            await request(app).patch(`${routePath}/products/model`).set("Cookie", managerCookie).send({ quantity: 5, changeDate: "2122-01-01" }).expect(400)
            await request(app).patch(`${routePath}/products/model`).set("Cookie", managerCookie).send({ quantity: 5, changeDate: "2020-01-01" }).expect(400)
        })
    })

    describe("3. PATCH /products/:model/sell", () => {
        test("3.1 It should decrease the quantity of a product when called by a Manager or an Admin", async () => {
            //Just like in the test for quantity increase, we test both roles and the two possible date scenarios
            await request(app).patch(`${routePath}/products/model/sell`).set("Cookie", managerCookie).send({ quantity: 5 }).expect(200)
            let products = await request(app).get(`${routePath}/products`).set("Cookie", managerCookie).expect(200)
            let product = products.body.find((p: any) => p.model === "model")
            expect(product.quantity).toBe(20)
            await request(app).patch(`${routePath}/products/model/sell`).set("Cookie", adminCookie).send({ quantity: 10, sellingDate: "2022-02-01" }).expect(200)
            products = await request(app).get(`${routePath}/products`).set("Cookie", managerCookie).expect(200)
            product = products.body.find((p: any) => p.model === "model")
            expect(product.quantity).toBe(10)
        })

        test("3.2 It should return 422 for wrong input parameters", async () => {
            await request(app).patch(`${routePath}/products/model/sell`).set("Cookie", managerCookie).send({ quantity: "a" }).expect(422)
            await request(app).patch(`${routePath}/products/model/sell`).set("Cookie", managerCookie).send({ quantity: 0 }).expect(422)
            await request(app).patch(`${routePath}/products/model/sell`).set("Cookie", managerCookie).send({ quantity: -1 }).expect(422)
            await request(app).patch(`${routePath}/products/model/sell`).set("Cookie", managerCookie).send({ quantity: 1, sellingDate: "date" }).expect(422)
            await request(app).patch(`${routePath}/products/model/sell`).set("Cookie", managerCookie).send({ quantity: 1, sellingDate: "2022-02-32" }).expect(422)
            await request(app).patch(`${routePath}/products/model/sell`).set("Cookie", managerCookie).send({ quantity: 1, sellingDate: "01-01-2024" }).expect(422)
        })

        test("3.3 It should return 404 for a product that does not exist", async () => {
            await request(app).patch(`${routePath}/products/nonexistent/sell`).set("Cookie", managerCookie).send({ quantity: 5 }).expect(404)
        })

        test("3.4 It should return 401 when called by a customer", async () => {
            await request(app).patch(`${routePath}/products/model/sell`).set("Cookie", customerCookie).send({ quantity: 5 }).expect(401)
        })

        test("3.5 It should return 401 when not logged in", async () => {
            await request(app).patch(`${routePath}/products/model/sell`).send({ quantity: 5 }).expect(401)
        })

        test("3.6 It should return 400 if the selling date is after the current date or before the arrival date", async () => {
            //Just like in the test for quantity increase, we test both a date set in the future and before the product was created
            await request(app).patch(`${routePath}/products/model/sell`).set("Cookie", managerCookie).send({ quantity: 5, sellingDate: "2122-01-01" }).expect(400)
            await request(app).patch(`${routePath}/products/model/sell`).set("Cookie", managerCookie).send({ quantity: 5, sellingDate: "2020-01-01" }).expect(400)
        })

        test("3.7 It should return 409 if the product is out of stock", async () => {
            //We create a new product with a quantity of 1, then we sell it twice, expecting an error the second time
            await request(app).post(`${routePath}/products`).set("Cookie", managerCookie).send({ model: "model3", category: "Smartphone", quantity: 1, details: "details", sellingPrice: 1000, arrivalDate: "2022-01-01" }).expect(200)
            await request(app).patch(`${routePath}/products/model3/sell`).set("Cookie", managerCookie).send({ quantity: 1 }).expect(200)
            await request(app).patch(`${routePath}/products/model3/sell`).set("Cookie", managerCookie).send({ quantity: 1 }).expect(409)
        })

        test("3.8 It should return 409 if the quantity to sell is greater than the available quantity", async () => {
            //We know that the product has a quantity of 10, so we try to sell 11 units, expecting an error
            await request(app).patch(`${routePath}/products/model/sell`).set("Cookie", managerCookie).send({ quantity: 11 }).expect(409)
        })
    })

    describe("4. GET /products", () => {
        test("4.1 It should return all products when called by a Manager or an Admin", async () => {
            //The products we have created are four in total, so we check if the response contains all of them
            let products = await request(app).get(`${routePath}/products`).set("Cookie", managerCookie).expect(200)
            expect(products.body.length).toBe(4)
            expect(products.body[0].model).toBe("model")
            expect(products.body[1].model).toBe("model2")
            expect(products.body[2].model).toBe("modelNew")
            expect(products.body[3].model).toBe("model3")
            expect(products.body[0].category).toBe("Smartphone")
            expect(products.body[1].category).toBe("Laptop")
            expect(products.body[2].category).toBe("Smartphone")
            expect(products.body[3].category).toBe("Smartphone")
            expect(products.body[0].quantity).toBe(10)
            expect(products.body[1].quantity).toBe(20)
            expect(products.body[2].quantity).toBe(10)
            expect(products.body[3].quantity).toBe(0)
            let prods = await request(app).get(`${routePath}/products`).set("Cookie", adminCookie).expect(200)
            expect(prods.body.length).toBe(4)
            expect(prods.body).toEqual(products.body)
        })

        test("4.2 It should return only the products of one category when the query parameters ask for it", async () => {
            //The products we have created are three Smartphones and one Laptop, so the responses should be consistent with this
            let products = await request(app).get(`${routePath}/products?grouping=category&category=Smartphone`).set("Cookie", managerCookie).expect(200)
            expect(products.body.length).toBe(3)
            expect(products.body[0].model).toBe("model")
            expect(products.body[1].model).toBe("modelNew")
            expect(products.body[2].model).toBe("model3")
            expect(products.body[0].category).toBe("Smartphone")
            expect(products.body[1].category).toBe("Smartphone")
            expect(products.body[2].category).toBe("Smartphone")
            let prods = await request(app).get(`${routePath}/products?grouping=category&category=Smartphone`).set("Cookie", adminCookie).expect(200)
            expect(prods.body.length).toBe(3)
            expect(prods.body).toEqual(products.body)
            products = await request(app).get(`${routePath}/products?grouping=category&category=Laptop`).set("Cookie", managerCookie).expect(200)
            expect(products.body.length).toBe(1)
            expect(products.body[0].model).toBe("model2")
            expect(products.body[0].category).toBe("Laptop")
            prods = await request(app).get(`${routePath}/products?grouping=category&category=Laptop`).set("Cookie", adminCookie).expect(200)
            expect(prods.body.length).toBe(1)
            expect(prods.body).toEqual(products.body)
            products = await request(app).get(`${routePath}/products?grouping=category&category=Appliance`).set("Cookie", managerCookie).expect(200)
            expect(products.body.length).toBe(0)
            prods = await request(app).get(`${routePath}/products?grouping=category&category=Appliance`).set("Cookie", adminCookie).expect(200)
            expect(prods.body.length).toBe(0)
            expect(prods.body).toEqual(products.body)
            //We also check for a category that does not exist, expecting an error
            products = await request(app).get(`${routePath}/products?grouping=category&category=Wrong`).set("Cookie", managerCookie).expect(422)

        })

        test("4.3 It should return only the products of one model when the query parameters ask for it", async () => {
            //We check for a specific model, expecting only one product to be returned
            let products = await request(app).get(`${routePath}/products?grouping=model&model=model`).set("Cookie", managerCookie).expect(200)
            expect(products.body.length).toBe(1)
            expect(products.body[0].model).toBe("model")
            expect(products.body[0].category).toBe("Smartphone")
            expect(products.body[0].quantity).toBe(10)
            expect(products.body[0].details).toBe("details")
            expect(products.body[0].sellingPrice).toBe(1000)
            expect(products.body[0].arrivalDate).toBe("2022-01-01")
            let prods = await request(app).get(`${routePath}/products?grouping=model&model=model`).set("Cookie", adminCookie).expect(200)
            expect(prods.body.length).toBe(1)
            expect(prods.body).toEqual(products.body)
            //We also check for a non-existent model, expecting an error
            products = await request(app).get(`${routePath}/products?grouping=model&model=none`).set("Cookie", managerCookie).expect(404)
        })

        test("4.4 It should return 401 when called by a customer or when not logged in", async () => {
            await request(app).get(`${routePath}/products`).set("Cookie", customerCookie).expect(401)
            await request(app).get(`${routePath}/products`).expect(401)
        })

        test("4.5 It should return 422 for wrong query parameters", async () => {
            await request(app).get(`${routePath}/products?grouping=wrong`).set("Cookie", managerCookie).expect(422)
            await request(app).get(`${routePath}/products?grouping=category&category=Smartphone&model=model`).set("Cookie", managerCookie).expect(422)
            await request(app).get(`${routePath}/products?grouping=category`).set("Cookie", managerCookie).expect(422)
            await request(app).get(`${routePath}/products?grouping=model&category=Smartphone&model=model`).set("Cookie", managerCookie).expect(422)
            await request(app).get(`${routePath}/products?grouping=model`).set("Cookie", managerCookie).expect(422)
            await request(app).get(`${routePath}/products?grouping=model&category=Smartphone`).set("Cookie", managerCookie).expect(422)
            await request(app).get(`${routePath}/products?grouping=category&model=model`).set("Cookie", adminCookie).expect(422)
            await request(app).get(`${routePath}/products?grouping=&model=&category=`).set("Cookie", adminCookie).expect(422)
            await request(app).get(`${routePath}/products?grouping=category&category=null&model=model`).set("Cookie", adminCookie).expect(422)
            await request(app).get(`${routePath}/products?grouping=category&category=&model=model`).set("Cookie", adminCookie).expect(422)
        })
    })

    describe("5. GET /products/available", () => {
        test("5.1 It should return all available products when called by a logged in user", async () => {
            //All user roles can call this route so the response should be the same for all of them
            let products = await request(app).get(`${routePath}/products/available`).set("Cookie", managerCookie).expect(200)
            expect(products.body.length).toBe(3)
            expect(products.body[0].model).toBe("model")
            expect(products.body[1].model).toBe("model2")
            expect(products.body[2].model).toBe("modelNew")
            expect(products.body[0].category).toBe("Smartphone")
            expect(products.body[1].category).toBe("Laptop")
            expect(products.body[2].category).toBe("Smartphone")
            expect(products.body[0].quantity).toBe(10)
            expect(products.body[1].quantity).toBe(20)
            expect(products.body[2].quantity).toBe(10)
            let prods = await request(app).get(`${routePath}/products/available`).set("Cookie", adminCookie).expect(200)
            expect(prods.body.length).toBe(3)
            expect(prods.body).toEqual(products.body)
            let prs = await request(app).get(`${routePath}/products/available`).set("Cookie", customerCookie).expect(200)
            expect(prs.body.length).toBe(3)
            expect(prs.body).toEqual(products.body)
        })

        test("5.2 It should return only the available products of one category when the query parameters ask for it", async () => {
            //We check for each category, expecting the correct products to be returned for each role
            let products = await request(app).get(`${routePath}/products/available?grouping=category&category=Smartphone`).set("Cookie", managerCookie).expect(200)
            expect(products.body.length).toBe(2)
            expect(products.body[0].model).toBe("model")
            expect(products.body[1].model).toBe("modelNew")
            expect(products.body[0].category).toBe("Smartphone")
            expect(products.body[1].category).toBe("Smartphone")
            expect(products.body[0].quantity).toBe(10)
            expect(products.body[1].quantity).toBe(10)
            let prods = await request(app).get(`${routePath}/products/available?grouping=category&category=Smartphone`).set("Cookie", adminCookie).expect(200)
            expect(prods.body.length).toBe(2)
            expect(prods.body).toEqual(products.body)
            let prs = await request(app).get(`${routePath}/products/available?grouping=category&category=Smartphone`).set("Cookie", customerCookie).expect(200)
            expect(prs.body.length).toBe(2)
            expect(prs.body).toEqual(products.body)
            products = await request(app).get(`${routePath}/products/available?grouping=category&category=Laptop`).set("Cookie", managerCookie).expect(200)
            expect(products.body.length).toBe(1)
            expect(products.body[0].model).toBe("model2")
            expect(products.body[0].category).toBe("Laptop")
            expect(products.body[0].quantity).toBe(20)
            prods = await request(app).get(`${routePath}/products/available?grouping=category&category=Laptop`).set("Cookie", adminCookie).expect(200)
            expect(prods.body.length).toBe(1)
            expect(prods.body).toEqual(products.body)
            prs = await request(app).get(`${routePath}/products/available?grouping=category&category=Laptop`).set("Cookie", customerCookie).expect(200)
            expect(prs.body.length).toBe(1)
            expect(prs.body).toEqual(products.body)
            products = await request(app).get(`${routePath}/products/available?grouping=category&category=Appliance`).set("Cookie", managerCookie).expect(200)
            expect(products.body.length).toBe(0)
            prods = await request(app).get(`${routePath}/products/available?grouping=category&category=Appliance`).set("Cookie", adminCookie).expect(200)
            expect(prods.body.length).toBe(0)
            expect(prods.body).toEqual(products.body)
            prs = await request(app).get(`${routePath}/products/available?grouping=category&category=Appliance`).set("Cookie", customerCookie).expect(200)
            expect(prs.body.length).toBe(0)
            expect(prs.body).toEqual(products.body)
            products = await request(app).get(`${routePath}/products/available?grouping=category&category=Wrong`).set("Cookie", managerCookie).expect(422)
        })

        test("5.3 It should return only the available products of one model when the query parameters ask for it", async () => {
            //We check for each model, expecting the correct product to be returned for each role
            let products = await request(app).get(`${routePath}/products/available?grouping=model&model=model`).set("Cookie", managerCookie).expect(200)
            expect(products.body.length).toBe(1)
            expect(products.body[0].model).toBe("model")
            expect(products.body[0].category).toBe("Smartphone")
            expect(products.body[0].quantity).toBe(10)
            let prods = await request(app).get(`${routePath}/products/available?grouping=model&model=model`).set("Cookie", adminCookie).expect(200)
            expect(prods.body.length).toBe(1)
            expect(prods.body).toEqual(products.body)
            let prs = await request(app).get(`${routePath}/products/available?grouping=model&model=model`).set("Cookie", customerCookie).expect(200)
            expect(prs.body.length).toBe(1)
            expect(prs.body).toEqual(products.body)
            let empty = await request(app).get(`${routePath}/products/available?grouping=model&model=model3`).set("Cookie", managerCookie).expect(200)
            expect(empty.body.length).toBe(0)
            await request(app).get(`${routePath}/products/available?grouping=model&model=none`).set("Cookie", managerCookie).expect(404)
        })

        test("5.4 It should return 401 when not logged in", async () => {
            await request(app).get(`${routePath}/products/available`).expect(401)
        })

        test("5.5 It should return 422 for wrong query parameters", async () => {
            await request(app).get(`${routePath}/products/available?grouping=wrong`).set("Cookie", managerCookie).expect(422)
            await request(app).get(`${routePath}/products/available?grouping=category&category=Smartphone&model=model`).set("Cookie", managerCookie).expect(422)
            await request(app).get(`${routePath}/products/available?grouping=category`).set("Cookie", managerCookie).expect(422)
            await request(app).get(`${routePath}/products/available?grouping=model&category=Smartphone&model=model`).set("Cookie", managerCookie).expect(422)
            await request(app).get(`${routePath}/products/available?grouping=model`).set("Cookie", managerCookie).expect(422)
            await request(app).get(`${routePath}/products/available?grouping=model&category=Smartphone`).set("Cookie", managerCookie).expect(422)
            await request(app).get(`${routePath}/products/available?grouping=category&model=model`).set("Cookie", adminCookie).expect(422)
        })
    })

    describe("6. DELETE /products/:model", () => {
        test("6.1 It should delete a product when called by a Manager or an Admin", async () => {
            //We delete two product models, check that the database contains only two products, and then check that the deleted products are not found
            await request(app).delete(`${routePath}/products/model3`).set("Cookie", managerCookie).expect(200)
            await request(app).delete(`${routePath}/products/modelNew`).set("Cookie", adminCookie).expect(200)
            let products = await request(app).get(`${routePath}/products`).set("Cookie", managerCookie).expect(200)
            expect(products.body.length).toBe(2)
            expect(products.body[0].model).toBe("model")
            expect(products.body[1].model).toBe("model2")
            await request(app).get(`${routePath}/products/model/model3`).set("Cookie", managerCookie).expect(404)
            await request(app).get(`${routePath}/products/model/modelNew`).set("Cookie", adminCookie).expect(404)
        })

        test("6.2 It should return 404 for a product that does not exist", async () => {
            await request(app).delete(`${routePath}/products/nonexistent`).set("Cookie", managerCookie).expect(404)
        })

        test("6.3 It should return 401 when called by a customer or when not logged in", async () => {
            await request(app).delete(`${routePath}/products/model`).set("Cookie", customerCookie).expect(401)
            await request(app).delete(`${routePath}/products/model`).expect(401)
        })
    })

    describe("7. DELETE /products", () => {
        test("7.1 It should delete all products when called by an Admin or a Manager", async () => {
            //We first delete all products as an admin, then we check that the database is empty
            //After creating two products, we delete all products as a manager and check that the database is empty
            await request(app).delete(`${routePath}/products`).set("Cookie", adminCookie).expect(200)
            let products = await request(app).get(`${routePath}/products`).set("Cookie", managerCookie).expect(200)
            expect(products.body.length).toBe(0)
            await request(app).post(`${routePath}/products`).set("Cookie", managerCookie).send({ model: "model", category: "Smartphone", quantity: 10, details: "details", sellingPrice: 1000, arrivalDate: "2022-01-01" }).expect(200)
            await request(app).post(`${routePath}/products`).set("Cookie", managerCookie).send({ model: "model2", category: "Laptop", quantity: 20, details: "details", sellingPrice: 2000, arrivalDate: "2022-01-01" }).expect(200)
            await request(app).delete(`${routePath}/products`).set("Cookie", managerCookie).expect(200)
            products = await request(app).get(`${routePath}/products`).set("Cookie", managerCookie).expect(200)
            expect(products.body.length).toBe(0)
        })

        test("7.2 It should return 401 when called by a customer or when not logged in", async () => {
            await request(app).delete(`${routePath}/products`).set("Cookie", customerCookie).expect(401)
            await request(app).delete(`${routePath}/products`).expect(401)
        })
    })
})