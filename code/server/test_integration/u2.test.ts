import {expect, jest, test} from "@jest/globals"
import request from 'supertest'
import {app} from "../index"

import Authenticator from "../src/routers/auth";
import UserController from "../src/controllers/userController";
import {Role, User} from "../src/components/user";

const baseURL = "/ezelectronics"
const usersURL = baseURL+"/users"

jest.mock("../src/controllers/userController")
jest.mock("../src/routers/auth")

const admin = {
    username: "admin",
    role: "Admin",
    name: "test",
    surname: "test",
    password: "test",
};

const customer = {
    username: "customer",
    role: "Customer",
    name: "test",
    surname: "test",
    password: "test",
};


// ============================== TOP-DOWN TESTING ==============================
// testing all module integrating them with a top-down approach,
// starting with 'reviewRoutes.ts' as the highest

// --------------- 1.integration of helper.ts ---------------
describe("Integrating 'helper.ts' module with 'reviewRoutes.ts'", ()=>{
    describe(`POST ${usersURL}/users - adding a review to a product`, ()=>{
        const inputReview = {score:1,comment:'test-comment'}
        const inputModel = 'test-model'
        const inputUser = 'test-user'
        beforeEach(()=>{
            jest.spyOn(UserController.prototype, "deleteUser").mockReset()
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockReset()
            jest.spyOn(Authenticator.prototype, "isCustomer").mockReset()
        })
        test("should return 200 success code", async ()=>{
           jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true)
            let user={ username: "admin",name: "test",surname: "test",   password: "test", role: "Admin",};
            const response = await request(app).post(usersURL).send(user)
            expect(response.status).toBe(200)
        })
        test("should return 422 error code if review is wrong", async ()=>{
            jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true)
            const response = await request(app).post(usersURL).send()
            expect(response.status).toBe(422)
        })
    })
    describe(`GET ${usersURL} - retrieving all `, ()=>{

        beforeEach(()=>{
            jest.spyOn(Authenticator.prototype,"isAdmin").mockReset()
            jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce([])
        })
        test("should return 200 success code",async ()=>{
            jest.spyOn(Authenticator.prototype,"isAdmin").mockImplementationOnce((req: any, res: any, next: () => any) => {
                req.user = admin
                next()
            })
            jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce([])

            const response = await request(app).get(usersURL)
            expect(response.status).toBe(200)
        })
        test("should fail if user is not logged in", async ()=>{
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementationOnce((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthenticated" }))
            const response = await request(app).get(usersURL)
            expect(response.status).toBe(401)
        })
    })
    describe(`GET ${usersURL}+/:username - get one `, ()=>{
        const inputModel = 'test-model'
        const inputUser = 'test-user'
        beforeEach(()=>{
            jest.spyOn(Authenticator.prototype, "isAdmin").mockReset()
            jest.spyOn(UserController.prototype, "getUserByUsername").mockReset()
        })
        test("should return 200 success code",async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = admin
                next()
            })
            let user = new User(  "admin", "test", "test", Role.ADMIN, "test",null)
            jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(user)
            const response = await request(app).get(usersURL+`/admin`)
            expect(response.status).toBe(200)
        })
        test("should fail if user is not logged", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))
            let username="admin";
            const response = await request(app).get(usersURL+`/admin`)
            expect(response.status).toBe(401)
        })
    })
    describe(`GET ${usersURL}+/roles/:role - get one `, ()=>{
        beforeEach(()=>{
            jest.spyOn(Authenticator.prototype, "isAdmin").mockReset()
            jest.spyOn(UserController.prototype, "getUsersByRole").mockReset()
        })
        test("should return 200 success code",async ()=>{
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req: any, res: any, next: () => any) => {
                req.user = admin
                next()
            })
            let user = new User(  "admin", "test", "test", Role.ADMIN, "test",null)
            jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce([user])
            const response = await request(app).get(usersURL+`/roles/Admin`)
            expect(response.status).toBe(200)
        })
        test("should fail if user is not logged", async ()=>{
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))
            let username="admin";
            const response = await request(app).get(usersURL+`/roles/admin`)
            expect(response.status).toBe(401)
        })
    })
    describe(`DELETE ${usersURL}+/:username - deleting `, ()=>{
        beforeEach(()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockReset()
            jest.spyOn(UserController.prototype, "deleteUser").mockReset()
        })
        test("should return 200 success code", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true)
            let username="admin";
            const response = await request(app).delete(usersURL+`/${username}`)
            expect(response.status).toBe(200)
        })

        test("should fail if user is not an admin", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))
            let username="admin";
            const response = await request(app).delete(usersURL+`/${username}`)
            expect(response.status).toBe(401)
        })
    })
    describe(`DELETE ${usersURL}+/ - deleting all reviews `, ()=>{
        beforeEach(()=>{
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockReset()
            jest.spyOn(UserController.prototype, "deleteUser").mockReset()
        })
        test("should return 200 success code", async ()=>{
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req: any, res: any, next: () => any) => next())
            jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce(true)

            const response = await request(app).delete(usersURL+'/')
            expect(response.status).toBe(200)
        })
        test("should fail if user is not an admin", async ()=>{
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))
            const response = await request(app).delete(usersURL+'/')
            expect(response.status).toBe(401)
        })
    })
    describe(`PATCH ${usersURL}+/ - patch all reviews `, ()=>{
        beforeEach(()=>{
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockReset()
            jest.spyOn(UserController.prototype, "updateUserInfo").mockReset()
        })
        test("should return 200 success code", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => next())
            let user = new User(  "admin", "test", "test", Role.ADMIN, "test","2001-01-01")
            jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(user)

            const response = await request(app).patch(usersURL+'/admin').send(user)
            expect(response.status).toBe(200)
        })
        test("should fail if user is not an admin", async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: () => any) => res.status(401).json({ error: "Unauthorized" }))
            const response = await request(app).patch(usersURL+'/admin')
            expect(response.status).toBe(401)
        })
    })

})


