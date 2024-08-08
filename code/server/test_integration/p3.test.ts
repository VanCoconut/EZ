import {beforeAll, afterAll, beforeEach, describe, expect, jest, test} from "@jest/globals"
import request from 'supertest'
import {app} from "../index"
import {cleanup} from "../src/db/cleanup";

import {Role} from "../src/components/user";
import ProductDAO from "../src/dao/productDAO";
import CartDAO from "../src/dao/cartDAO";
import {Category, Product} from "../src/components/product";
import dayjs from "dayjs";

//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: Role.CUSTOMER }
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: Role.MANAGER }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: Role.ADMIN }
//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string
let managerCookie: string
let adminCookie: string

const baseURL = "/ezelectronics"
const productURL = baseURL+"/products"
jest.mock("../src/dao/productDAO")


//Helper function that creates a new user in the database.
//Can be used to create a user before the tests or in the tests
//Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${baseURL}/users`)
        .send(userInfo)
        .expect(200)
}

//Helper function that logs in a user and returns the cookie
//Can be used to log in a user before the tests or in the tests
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${baseURL}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}

//Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable
beforeAll(async () => {
    await cleanup()
    await postUser(customer)
    customerCookie = await login(customer)
    await postUser(manager)
    managerCookie = await login(manager)
    await postUser(admin)
    adminCookie = await login(admin)
})

//After executing tests, we remove everything from our test database
afterAll(async () => {
    await cleanup()
})
// --------------- 3.integration of productController.ts ---------------
// used for testing samples
const inputProduct = new Product(1000, "model1", Category.SMARTPHONE, "2022-01-01", "details1", 10)
describe("Integrating 'auth.ts' module with 'productController.ts' module", () => {
    describe(`POST ${productURL} - register a new set of products`, () => {
        
        beforeEach(() => {
            jest.spyOn(ProductDAO.prototype, "createProduct").mockReset()
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockReset()
            jest.spyOn(dayjs.prototype, "isAfter").mockReset()
        })
        test("PI3.1: Should return 200 success code", async () => {
            jest.spyOn(ProductDAO.prototype, "createProduct").mockResolvedValue(true)
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null)
            jest.spyOn(dayjs.prototype, "isAfter").mockReturnValue(false)
            await request(app)
                .post(productURL)
                .send(inputProduct)
                .set('Cookie', adminCookie)
                .expect(200)
        })
        test("PI3.2: Should return 401 error code if the user is not logged in", async () => {
            await request(app)
                .post(productURL)
                .send(inputProduct)
                .expect(401)
        })
        test("PI3.3: Should return 401 error code if the user is not an admin or manager", async () => {
            await request(app)
                .post(productURL)
                .send(inputProduct)
                .set('Cookie', customerCookie)
                .expect(401)
        })
        test("PI3.4: Should return 400 error code if the selling date is in the future", async () => {
            jest.spyOn(ProductDAO.prototype, "createProduct").mockResolvedValue(true)
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null)
            jest.spyOn(dayjs.prototype, "isAfter").mockReturnValue(true)
            await request(app)
                .post(productURL)
                .send(inputProduct)
                .set('Cookie', adminCookie)
                .expect(400)
        })
        test("PI3.5: Should return 409 error code if  the product already exists", async () => {
            jest.spyOn(ProductDAO.prototype, "createProduct").mockResolvedValue(false)
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(inputProduct)
            jest.spyOn(dayjs.prototype, "isAfter").mockReturnValue(false)
            await request(app)
                .post(productURL)
                .send(inputProduct)
                .set('Cookie', adminCookie)
                .expect(409)
        })
        test("PI3.6: Should return 422 error code if the quantity is negative", async () => {
            jest.spyOn(ProductDAO.prototype, "createProduct").mockResolvedValue(true)
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null)
            jest.spyOn(dayjs.prototype, "isAfter").mockReturnValue(false)
            await request(app)
                .post(productURL)
                .send({...inputProduct, quantity: -1})
                .set('Cookie', adminCookie)
                .expect(422)
        })  
    })
    describe(`PATCH ${productURL}/:model - change the quantity of a product`, () => {
        beforeEach(() => {
            jest.spyOn(ProductDAO.prototype, "addModels").mockReset()
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockReset()
            jest.spyOn(dayjs.prototype, "isAfter").mockReset()
            jest.spyOn(dayjs.prototype, "isBefore").mockReset()
        })
        test("PI3.7: Should return 200 success code", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(new Product(1000, "model1", Category.SMARTPHONE, "2022-01-01", "details1", 10))
            jest.spyOn(dayjs.prototype, "isAfter").mockReturnValue(false)
            jest.spyOn(dayjs.prototype, "isBefore").mockReturnValue(false)
            jest.spyOn(ProductDAO.prototype, "addModels").mockResolvedValue(true)

            await request(app)
                .patch(`${productURL}/model1`)
                .send({ quantity: 5 })
                .set('Cookie', adminCookie)
                .expect(200)
        })
        test("PI3.8: Should return 400 error code if the change date is before arrivalDate", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue({...inputProduct, arrivalDate: "2022-01-01"})
            jest.spyOn(dayjs.prototype, "isAfter").mockReturnValue(false)
            jest.spyOn(dayjs.prototype, "isBefore").mockReturnValue(true)
            jest.spyOn(ProductDAO.prototype, "addModels").mockResolvedValue(true)

            await request(app)
                .patch(`${productURL}/model1`)
                .send({ quantity: 5, changeDate: "2021-01-02" })
                .set('Cookie', adminCookie)
                .expect(400)
        })
        test("PI3.9: Should return 400 error code if the change date is in the future", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue({...inputProduct, arrivalDate: "2022-01-01"})
            jest.spyOn(dayjs.prototype, "isAfter").mockReturnValue(true)
            jest.spyOn(dayjs.prototype, "isBefore").mockReturnValue(false)
            jest.spyOn(ProductDAO.prototype, "addModels").mockResolvedValue(true)

            await request(app)
                .patch(`${productURL}/model1`)
                .send({ quantity: 5, changeDate: "2025-01-02" })
                .set('Cookie', adminCookie)
                .expect(400)
        })
        test("PI3.10: Should return 404 error code if the product does not exist", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null)
            jest.spyOn(dayjs.prototype, "isAfter").mockReturnValue(false)
            jest.spyOn(dayjs.prototype, "isBefore").mockReturnValue(false)
            jest.spyOn(ProductDAO.prototype, "addModels").mockResolvedValue(true)

            await request(app)
                .patch(`${productURL}/model9`)
                .send({ quantity: 5 })
                .set('Cookie', adminCookie)
                .expect(404)
        })
        test("PI3.11: Should return 401 error code if the user is not logged in", async () => {
            await request(app)
                .patch(`${productURL}/model1`)
                .send({ quantity: 5 })
                .expect(401)
        })  
        test("PI3.12: Should return 401 error code if the user is not an admin or manager", async () => {   
            await request(app)
                .patch(`${productURL}/model1`)
                .send({ quantity: 5 })
                .set('Cookie', customerCookie)
                .expect(401)
        })
    })
    describe('PATCH /products/:model/sell - sell a product', () => {
        beforeEach(() => {
            jest.spyOn(ProductDAO.prototype, "sellModels").mockReset()
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockReset()
            jest.spyOn(dayjs.prototype, "isAfter").mockReset()
            jest.spyOn(dayjs.prototype, "isBefore").mockReset()
        })
        test("PI3.13: Should return 200 success code", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(new Product(1000, "model1", Category.SMARTPHONE, "2022-01-01", "details1", 10))
            jest.spyOn(dayjs.prototype, "isAfter").mockReturnValue(false)
            jest.spyOn(dayjs.prototype, "isBefore").mockReturnValue(false)
            jest.spyOn(ProductDAO.prototype, "sellModels").mockResolvedValue(true)

            await request(app)
                .patch(`${productURL}/model1/sell`)
                .send({ quantity: 5 })
                .set('Cookie', adminCookie)
                .expect(200)
        })
        test("PI3.14: Should return 400 error code if the selling date is before arrivalDate", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue({...inputProduct, arrivalDate: "2022-01-01"})
            jest.spyOn(dayjs.prototype, "isAfter").mockReturnValue(false)
            jest.spyOn(dayjs.prototype, "isBefore").mockReturnValue(true)
            jest.spyOn(ProductDAO.prototype, "sellModels").mockResolvedValue(true)

            await request(app)
                .patch(`${productURL}/model1/sell`)
                .send({ quantity: 5, sellingDate: "2021-01-02" })
                .set('Cookie', adminCookie)
                .expect(400)
        })
        test("PI3.15: Should return 400 error code if the selling date is in the future", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue({...inputProduct, arrivalDate: "2022-01-01"})
            jest.spyOn(dayjs.prototype, "isAfter").mockReturnValue(true)
            jest.spyOn(dayjs.prototype, "isBefore").mockReturnValue(false)
            jest.spyOn(ProductDAO.prototype, "sellModels").mockResolvedValue(true)

            await request(app)
                .patch(`${productURL}/model1/sell`)
                .send({ quantity: 5, sellingDate: "2025-01-02" })
                .set('Cookie', adminCookie)
                .expect(400)
        })
        test("PI3.16: Should return 404 error code if the product does not exist", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null)
            jest.spyOn(dayjs.prototype, "isAfter").mockReturnValue(false)
            jest.spyOn(dayjs.prototype, "isBefore").mockReturnValue(false)
            jest.spyOn(ProductDAO.prototype, "sellModels").mockResolvedValue(true)

            await request(app)
                .patch(`${productURL}/model9/sell`)
                .send({ quantity: 5 })
                .set('Cookie', adminCookie)
                .expect(404)
        })  
        test("PI3.17: Should return 401 error code if the user is not logged in", async () => {
            await request(app)
                .patch(`${productURL}/model1/sell`)
                .send({ quantity: 5 })
                .expect(401)
        })
        test("PI3.18: Should return 401 error code if the user is not an admin or manager", async () => {
            await request(app)
                .patch(`${productURL}/model1/sell`)
                .send({ quantity: 5 })
                .set('Cookie', customerCookie)
                .expect(401)
        })
        test("PI3.19: Should return 409 error code if the product is already sold", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue({...inputProduct, quantity: 0})
            jest.spyOn(dayjs.prototype, "isAfter").mockReturnValue(false)
            jest.spyOn(dayjs.prototype, "isBefore").mockReturnValue(false)

            await request(app)
                .patch(`${productURL}/model1/sell`)
                .send({ quantity: 5 })
                .set('Cookie', adminCookie)
                .expect(409)
        })
        test("PI3.20: Should return 409 error code if the product has low stock", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue({...inputProduct, quantity: 5})
            jest.spyOn(dayjs.prototype, "isAfter").mockReturnValue(false)
            jest.spyOn(dayjs.prototype, "isBefore").mockReturnValue(false)

            await request(app)
                .patch(`${productURL}/model1/sell`)
                .send({ quantity: 10 })
                .set('Cookie', adminCookie)
                .expect(409)
        })  
    })
    describe(`GET ${productURL} - get all products`, () => {
        beforeEach(() => {
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockReset()
            jest.spyOn(ProductDAO.prototype, "getProductsByCategory").mockReset()
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockReset()
        })
        test("PI3.21: Should return 200 success code", async () => {
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValue([inputProduct])

            await request(app)
                .get(productURL)
                .set('Cookie', adminCookie)
                .expect(200)
        })
        test("PI3.22: Should return 200 success code if the grouping is 'category'", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductsByCategory").mockResolvedValue([inputProduct])

            await request(app)
                .get(productURL)
                .set('Cookie', adminCookie)
                .query({grouping: "category", category: "Smartphone" })
                .expect(200)
        })
        test("PI3.23: Should return 200 success code if the grouping is 'model'", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(inputProduct)

            await request(app)
                .get(productURL)
                .set('Cookie', adminCookie)
                .query({grouping: "model", model: "model1" })
                .expect(200)
        })
        test("PI3.24: Should return 401 error code if the user is not logged in", async () => {
            await request(app)
                .get(productURL)
                .expect(401)
        })
        test("PI3.25: Should return 401 error code if the user is not an admin or manager", async () => {
            await request(app)
                .get(productURL)
                .set('Cookie', customerCookie)
                .expect(401)
        })
        test("PI3.26: Should return 422 error code if the category is incorrect", async () => {
            await request(app)
                .get(productURL)
                .query({grouping: "category", category: "invalid"})
                .set('Cookie', adminCookie)
                .expect(422)
        })
        test("PI3.27: Should return 422 error code if the model is incorrect", async () => {
            await request(app)
                .get(productURL)
                .query({ grouping: "model", model: "" })
                .set('Cookie', adminCookie)
                .expect(422)
        })
        test("PI3.28: should return 422 if the grouping is incorrect", async () => {
            await request(app)
                .get(productURL)
                .query({ grouping: "incorrect" })
                .set('Cookie', adminCookie)
                .expect(422)
        })
        test("PI3.29: should return 404 if the product does not exist", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null)

            await request(app)
                .get(productURL)
                .query({ grouping: "model", model: "model9" })
                .set('Cookie', adminCookie)
                .expect(404)
        })
    })
    describe(`GET ${productURL}/available - get all available products`, () => {
        beforeEach(() => {
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockReset()
            jest.spyOn(ProductDAO.prototype, "getProductsByCategory").mockReset()
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockReset()
        })
        test("PI3.30: Should return 200 success code", async () => {
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValue([inputProduct])

            await request(app)
                .get(`${productURL}/available`)
                .set('Cookie', adminCookie)
                .expect(200)
        })
        test("PI3.31: Should return 200 success code if the grouping is 'category'", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductsByCategory").mockResolvedValue([inputProduct])

            await request(app)
                .get(`${productURL}/available`)
                .set('Cookie', adminCookie)
                .query({grouping: "category", category: "Smartphone" })
                .expect(200)
        })
        test("PI3.32: Should return 200 success code if the grouping is 'model'", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(inputProduct)

            await request(app)
                .get(`${productURL}/available`)
                .set('Cookie', adminCookie)
                .query({grouping: "model", model: "model1" })
                .expect(200)
        })
        test("PI3.33: Should return 401 error code if the user is not logged in", async () => {
            await request(app)
                .get(`${productURL}/available`)
                .expect(401)
        })
        test("PI3.34: Should return 422 error code if the category is incorrect", async () => {
            await request(app)
                .get(`${productURL}/available`)
                .set('Cookie', adminCookie)
                .query({grouping: "category", category: "incorrect" })
                .expect(422)
        })
        test("PI3.35: Should return 422 error code if the model is incorrect", async () => {
            await request(app)
                .get(`${productURL}/available`)
                .set('Cookie', adminCookie)
                .query({grouping: "model", model: "" })
                .expect(422)    
        })
        test("PI3.36: Should return 422 error code if the grouping is incorrect", async () => {
            await request(app)
                .get(`${productURL}/available`)
                .set('Cookie', adminCookie)
                .query({grouping: "incorrect" })
                .expect(422)
        })
        test("PI3.37: Should return 404 error code if the product does not exist", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null)

            await request(app)
                .get(`${productURL}/available`)
                .set('Cookie', adminCookie)
                .query({grouping: "model", model: "model9" })
                .expect(404)
        })

    })
    describe(`DELETE ${productURL} - delete all products`, () => {
        beforeEach(() => {
            jest.spyOn(ProductDAO.prototype, "deleteAllProducts").mockReset()
            jest.spyOn(CartDAO.prototype, "markAllProductAsDeleted").mockReset()
        })
        test("PI3.38: Should return 200 success code", async () => {
            jest.spyOn(ProductDAO.prototype, "deleteAllProducts").mockResolvedValue(null)
            jest.spyOn(CartDAO.prototype, "markAllProductAsDeleted").mockResolvedValue(true)

            await request(app)
                .delete(productURL)
                .set('Cookie', adminCookie)
                .expect(200)
        })
        test("PI3.39: Should return 401 error code if the user is not logged in", async () => {
            await request(app)
                .delete(productURL)
                .expect(401)
        })
        test("PI3.40: Should return 401 error code if the user is not an admin or a manager", async () => {
            await request(app)
                .delete(productURL)
                .set('Cookie', customerCookie)
                .expect(401)
        })
    })
    describe(`DELETE ${productURL}/:model - delete a product`, () => {
        beforeEach(() => {
            jest.spyOn(ProductDAO.prototype, "deleteModel").mockReset()
            jest.spyOn(CartDAO.prototype, "markProductAsDeleted").mockReset()
        })
        test("PI3.41: Should return 200 success code", async () => {
            jest.spyOn(ProductDAO.prototype, "deleteModel").mockResolvedValue(true)
            jest.spyOn(CartDAO.prototype, "markProductAsDeleted").mockResolvedValue(true)

            await request(app)
                .delete(`${productURL}/model1`)
                .set('Cookie', adminCookie)
                .expect(200)
        })
        test("PI3.42: Should return 401 error code if the user is not logged in", async () => {
            await request(app)
                .delete(`${productURL}/model1`)
                .expect(401)
        })
        test("PI3.43: Should return 401 error code if the user is not an admin or a manager", async () => {
            await request(app)
                .delete(`${productURL}/model1`)
                .set('Cookie', customerCookie)
                .expect(401)
        }) 
        test("PI3.44: Should return 404 error code if the product does not exist", async () => {
            jest.spyOn(ProductDAO.prototype, "deleteModel").mockResolvedValue(false)
            jest.spyOn(CartDAO.prototype, "markProductAsDeleted").mockResolvedValue(true)

            await request(app)
                .delete(`${productURL}/model9`)
                .set('Cookie', adminCookie)
                .expect(404)
        })
    })
})