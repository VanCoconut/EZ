import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"

const routePath = "/ezelectronics"
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const secondCustomer = { username: "customer2", name: "customer2", surname: "customer2", password: "customer2", role: "Customer" }
const prod1 = { model: "model", category: "Smartphone", quantity: 10, details: "details", sellingPrice: 1000, arrivalDate: "2022-01-01" }
const prod2 = { model: "model2", category: "Laptop", quantity: 10, details: "details", sellingPrice: 1000, arrivalDate: "2022-01-01" }
const prod3 = { model: "modelNew", category: "Appliance", quantity: 10, details: "details", sellingPrice: 1000 }
const prodEmpty = { model: "empty", category: "Smartphone", quantity: 1, details: "details", sellingPrice: 1000, arrivalDate: "2022-01-01" }
let customerCookie: string
let managerCookie: string
let adminCookie: string
let secondCustomerCookie: string

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

const createProduct = async (product: any, cookie: string) => {
    await request(app).post(`${routePath}/products`).set("Cookie", cookie).send(product).expect(200)
}

describe("Tests for Review Routes", () => {
    beforeAll(async () => {
        await cleanup()
        //The cleanup function may not finish in time for the next operation, leading to potential issues
        //We wait 15 seconds before writing to the database, ensuring that the test suite contains what we need
        await new Promise(resolve => setTimeout(resolve, 15000))
        //We create all 4 users we need and then log them in
        await postUser(customer)
        await postUser(manager)
        await postUser(admin)
        await postUser(secondCustomer)
        customerCookie = await login(customer)
        managerCookie = await login(manager)
        adminCookie = await login(admin)
        secondCustomerCookie = await login(secondCustomer)
        //We create the products we need
        await createProduct(prod1, managerCookie)
        await createProduct(prod2, managerCookie)
        await createProduct(prod3, managerCookie)
    })

    afterAll(async () => {
        await cleanup()
    })

    describe("1. POST /reviews/:model", () => {
        test("1.1 It should add a new review for a product", async () => {
            //After purchasing a product, we leave a review for it
            //We then get all reviews for the product and look for the one left by the customer, expecting it to exist and to have been made in the current date
            await request(app).post(`${routePath}/carts`).set("Cookie", customerCookie).send({ model: "model" }).expect(200)
            await request(app).patch(`${routePath}/carts`).set("Cookie", customerCookie).expect(200)
            let review = { score: 5, comment: "product review" }
            await request(app).post(`${routePath}/reviews/model`).set("Cookie", customerCookie).send(review).expect(200)
            let reviews = await request(app).get(`${routePath}/reviews/model`).set("Cookie", customerCookie).expect(200)
            let productReview = reviews.body.find((r: any) => r.user === "customer" && r.model === "model")
            expect(productReview.model).toEqual("model")
            expect(productReview.user).toEqual("customer")
            expect(productReview.score).toEqual(5)
            expect(productReview.comment).toEqual("product review")
            let today = new Date().toISOString().split("T")[0]
            expect(productReview.date).toEqual(today)
        })

        test("1.2 It should return a 401 error when called by a user who is not a customer, or is not logged in", async () => {
            await request(app).post(`${routePath}/reviews/model`).set("Cookie", managerCookie).send({ score: 5, comment: "product review" }).expect(401)
            await request(app).post(`${routePath}/reviews/model`).set("Cookie", adminCookie).send({ score: 5, comment: "product review" }).expect(401)
            await request(app).post(`${routePath}/reviews/model`).send({ score: 5, comment: "product review" }).expect(401)
        })

        test("1.3 It should return a 422 error if the input parameters are wrong", async () => {
            await request(app).post(`${routePath}/reviews/model`).set("Cookie", customerCookie).send({ score: 5 }).expect(422)
            await request(app).post(`${routePath}/reviews/model`).set("Cookie", customerCookie).send({ comment: "product review" }).expect(422)
            await request(app).post(`${routePath}/reviews/model`).set("Cookie", customerCookie).send({ score: 0, comment: "product review" }).expect(422)
            await request(app).post(`${routePath}/reviews/model`).set("Cookie", customerCookie).send({ score: 6, comment: "product review" }).expect(422)
            await request(app).post(`${routePath}/reviews/model`).set("Cookie", customerCookie).send({ score: 5, comment: "" }).expect(422)
        })

        test("1.4 It should return a 409 error if the user has already reviewed the product", async () => {
            //We know that the customer has already reviewed the product, so we try to review it again and expect an error
            await request(app).post(`${routePath}/reviews/model`).set("Cookie", customerCookie).send({ score: 5, comment: "product review" }).expect(409)
        })

        test("1.5 It should return a 404 error if the product does not exist", async () => {
            await request(app).post(`${routePath}/reviews/nonexistent`).set("Cookie", customerCookie).send({ score: 5, comment: "product review" }).expect(404)
        })
    })

    describe("2. GET /reviews/:model", () => {
        test("2.1 It should return the reviews of a product", async () => {
            //We know that there is only one review for one product, so we get the reviews for that product and expect to find the review we left (all three roles should get the same response)
            //In case of a second product with no reviews, we expect an empty array
            let reviews = await request(app).get(`${routePath}/reviews/model`).set("Cookie", customerCookie).expect(200)
            expect(reviews.body.length).toEqual(1)
            let productReview = reviews.body[0]
            expect(productReview.model).toEqual("model")
            expect(productReview.user).toEqual("customer")
            expect(productReview.score).toEqual(5)
            expect(productReview.comment).toEqual("product review")
            let today = new Date().toISOString().split("T")[0]
            expect(productReview.date).toEqual(today)
            let revs = await request(app).get(`${routePath}/reviews/model2`).set("Cookie", customerCookie).expect(200)
            expect(revs.body.length).toEqual(0)
            revs = await request(app).get(`${routePath}/reviews/model`).set("Cookie", managerCookie).expect(200)
            expect(revs.body.length).toEqual(1)
            expect(revs.body).toEqual(reviews.body)
            let rs = await request(app).get(`${routePath}/reviews/model`).set("Cookie", adminCookie).expect(200)
            expect(rs.body.length).toEqual(1)
            expect(rs.body).toEqual(reviews.body)
        })

        test("2.2 It should return a 401 error when called by a user who is not logged in", async () => {
            await request(app).get(`${routePath}/reviews/model`).expect(401)
        })

        test("2.3 It should return a 404 error if the product does not exist", async () => {
            await request(app).get(`${routePath}/reviews/nonexistent`).set("Cookie", customerCookie).expect(404)
        })
    })

    describe("3. DELETE /reviews/:model", () => {
        test("3.1 It should delete a review made by a customer", async () => {
            //We delete the review we left for the product and then get the reviews for the product, expecting an empty array
            await request(app).delete(`${routePath}/reviews/model`).set("Cookie", customerCookie).expect(200)
            let reviews = await request(app).get(`${routePath}/reviews/model`).set("Cookie", customerCookie).expect(200)
            expect(reviews.body.length).toEqual(0)
        })

        test("3.2 It should return a 401 error when called by a user who is not a customer, or is not logged in", async () => {
            await request(app).delete(`${routePath}/reviews/model`).set("Cookie", managerCookie).expect(401)
            await request(app).delete(`${routePath}/reviews/model`).set("Cookie", adminCookie).expect(401)
            await request(app).delete(`${routePath}/reviews/model`).expect(401)
        })

        test("3.3 It should return a 404 error if the user has not reviewed the product", async () => {
            //Since we have already deleted the review, we try to delete it again and expect an error
            await request(app).delete(`${routePath}/reviews/model`).set("Cookie", customerCookie).expect(404)
        })

        test("3.4 It should return a 404 error if the product does not exist", async () => {
            await request(app).delete(`${routePath}/reviews/nonexistent`).set("Cookie", customerCookie).expect(404)
        })
    })

    describe("4. DELETE /reviews/:model/all", () => {
        test("4.1 It should delete all reviews of a product", async () => {
            //We leave a review for the product and then delete all reviews for it
            await request(app).delete(`${routePath}/reviews`).set("Cookie", managerCookie).expect(200)
            let reviews = await request(app).get(`${routePath}/reviews/model`).set("Cookie", customerCookie).expect(200)
            expect(reviews.body.length).toEqual(0)
            await request(app).post(`${routePath}/reviews/model`).set("Cookie", customerCookie).send({ score: 5, comment: "product review" }).expect(200)
            reviews = await request(app).get(`${routePath}/reviews/model`).set("Cookie", customerCookie).expect(200)
            expect(reviews.body.length).toEqual(1)
            await request(app).delete(`${routePath}/reviews/model/all`).set("Cookie", adminCookie).expect(200)
            reviews = await request(app).get(`${routePath}/reviews/model`).set("Cookie", customerCookie).expect(200)
            expect(reviews.body.length).toEqual(0)
        })

        test("4.2 It should return a 401 error when called by a customer, or a user who is not logged in", async () => {
            await request(app).delete(`${routePath}/reviews/model/all`).set("Cookie", customerCookie).expect(401)
            await request(app).delete(`${routePath}/reviews/model/all`).expect(401)
        })

        test("4.3 It should return a 404 error if the product does not exist", async () => {
            await request(app).delete(`${routePath}/reviews/nonexistent/all`).set("Cookie", adminCookie).expect(404)
        })
    })

    describe("5. DELETE /reviews", () => {
        test("5.1 It should delete all reviews", async () => {
            //We create reviews for two separate products and then delete all reviews
            await request(app).post(`${routePath}/reviews/model`).set("Cookie", customerCookie).send({ score: 5, comment: "product review" }).expect(200)
            await request(app).post(`${routePath}/reviews/model2`).set("Cookie", customerCookie).send({ score: 5, comment: "product review" }).expect(200)
            let reviews = await request(app).get(`${routePath}/reviews/model`).set("Cookie", customerCookie).expect(200)
            let reviews2 = await request(app).get(`${routePath}/reviews/model2`).set("Cookie", customerCookie).expect(200)
            expect(reviews.body.length).toEqual(1)
            expect(reviews2.body.length).toEqual(1)
            await request(app).delete(`${routePath}/reviews`).set("Cookie", adminCookie).expect(200)
            reviews = await request(app).get(`${routePath}/reviews/model`).set("Cookie", customerCookie).expect(200)
            reviews2 = await request(app).get(`${routePath}/reviews/model2`).set("Cookie", customerCookie).expect(200)
            expect(reviews.body.length).toEqual(0)
            expect(reviews2.body.length).toEqual(0)
        })

        test("5.2 It should return a 401 error when called by a user who is a customer, or is not logged in", async () => {
            await request(app).delete(`${routePath}/reviews`).set("Cookie", customerCookie).expect(401)
            await request(app).delete(`${routePath}/reviews`).expect(401)
        })
    })
})