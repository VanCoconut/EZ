import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"

const routePath = "/ezelectronics"
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" }
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
let managerCookie: string
let customerCookie: string
let adminCookie: string

const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
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

describe("Tests for User Routes", () => {
    beforeAll(async () => {
        await cleanup()
        //The cleanup function may not finish in time for the next operation, leading to potential issues
        //We wait 15 seconds before writing to the database, ensuring that the test suite contains what we need
        await new Promise(resolve => setTimeout(resolve, 15000))

        //We create an admin and perform login to have a corresponding cookie
        await postUser(admin)
        adminCookie = await login(admin)
    })

    afterAll(async () => {
        await cleanup()
    })

    describe("1. POST /users", () => {
        test("1.1 It should create a new user", async () => {
            //After creating a new user, we retrieve all users and check that the newly created user is among them
            await request(app)
                .post(`${routePath}/users`)
                .send(manager)
                .expect(200)
                .then(async () => {
                    await request(app)
                        .get(`${routePath}/users`)
                        .set("Cookie", adminCookie)
                        .expect(200)
                        .then((res) => {
                            expect(res.body.length).toBe(2)
                            let managerRes = res.body.find((user: any) => user.username === "manager")
                            expect(managerRes).toBeDefined()
                            expect(managerRes.role).toBe("Manager")
                            expect(managerRes.name).toBe("manager")
                            expect(managerRes.surname).toBe("manager")
                        })
                })
        })

        test("1.2 It should return a 422 error if at least one parameter is empty", async () => {
            //We send requests with wrong parameters and expect a 422 error
            let emptyUsername = await request(app).post(`${routePath}/users`).send({ username: "", name: "test", surname: "test", password: "test" })
            let emptyName = await request(app).post(`${routePath}/users`).send({ username: "test", name: "", surname: "test", password: "test" })
            let emptySurname = await request(app).post(`${routePath}/users`).send({ username: "test", name: "test", surname: "", password: "test" })
            let emptyPassword = await request(app).post(`${routePath}/users`).send({ username: "test", name: "test", surname: "test", password: "" })
            expect(emptyUsername.status).toBe(422)
            expect(emptyName.status).toBe(422)
            expect(emptySurname.status).toBe(422)
            expect(emptyPassword.status).toBe(422)
        })

        test("1.3 It should return a 422 error if the role is not one of 'Manager', 'Customer', 'Admin'", async () => {
            //We send a role that is not among the allowed ones and expect an error
            let wrongRole = await request(app).post(`${routePath}/users`).send({ username: "test", name: "test", surname: "test", password: "test", role: "wrong" })
            expect(wrongRole.status).toBe(422)
        })

        test("1.4 It should return a 409 error if the username is already in use", async () => {
            //We first create a new user and then try to create the same user again, expecting an error
            await request(app).post(`${routePath}/users`).send(customer)
            let duplicateUsername = await request(app).post(`${routePath}/users`).send(customer)
            expect(duplicateUsername.status).toBe(409)
        })
    })

    describe("2. GET /users", () => {
        test("2.1 It should return all users", async () => {
            //We retrieve all users as an admin.
            //The previous operations created an admin, a manager, and a customer. We expect all three of them (and only them) to exist in the database
            await request(app)
                .get(`${routePath}/users`)
                .set("Cookie", adminCookie)
                .expect(200)
                .then(async (res) => {
                    expect(res.body.length).toBe(3)
                    let managerRes = res.body.find((user: any) => user.username === "manager")
                    let adminRes = res.body.find((user: any) => user.username === "admin")
                    let customerRes = res.body.find((user: any) => user.username === "customer")
                    expect(managerRes).toBeDefined()
                    expect(adminRes).toBeDefined()
                    expect(customerRes).toBeDefined()
                    expect(managerRes.role).toBe("Manager")
                    expect(adminRes.role).toBe("Admin")
                    expect(customerRes.role).toBe("Customer")
                    expect(managerRes.name).toBe("manager")
                    expect(adminRes.name).toBe("admin")
                    expect(customerRes.name).toBe("customer")
                    expect(managerRes.surname).toBe("manager")
                    expect(adminRes.surname).toBe("admin")
                    expect(customerRes.surname).toBe("customer")
                })
        })

        test("2.2 It should return a 401 error if called by a user who is not an admin or is not logged in", async () => {
            //Authentication check for all roles that are not allowed
            let unloggedRes = await request(app).get(`${routePath}/users`)
            managerCookie = await login(manager)
            let managerRes = await request(app).get(`${routePath}/users`).set("Cookie", managerCookie)
            expect(unloggedRes.status).toBe(401)
            expect(managerRes.status).toBe(401)
            customerCookie = await login(customer)
            await request(app).get(`${routePath}/users`).set("Cookie", customerCookie).expect(401)
        })
    })

    describe("3. GET /users/roles/:role", () => {
        test("3.1 It should return all users of a specific role", async () => {
            //Just like for the previous route, the database should contain one user for each role
            let admins = await request(app).get(`${routePath}/users/roles/Admin`).set("Cookie", adminCookie)
            let managers = await request(app).get(`${routePath}/users/roles/Manager`).set("Cookie", adminCookie)
            let customers = await request(app).get(`${routePath}/users/roles/Customer`).set("Cookie", adminCookie)
            expect(admins.status).toBe(200)
            expect(managers.status).toBe(200)
            expect(customers.status).toBe(200)
            expect(admins.body.length).toBe(1)
            expect(managers.body.length).toBe(1)
            expect(customers.body.length).toBe(1)
        })

        test("3.2 It should return a 401 error if called by a user who is not an admin or is not logged in", async () => {
            //Authentication checks: all roles that are not allowed should return 401
            let unloggedRes = await request(app).get(`${routePath}/users/roles/Admin`)
            managerCookie = await login(manager)
            let managerRes = await request(app).get(`${routePath}/users/roles/Admin`).set("Cookie", managerCookie)
            expect(unloggedRes.status).toBe(401)
            expect(managerRes.status).toBe(401)
            customerCookie = await login(customer)
            await request(app).get(`${routePath}/users/roles/Admin`).set("Cookie", customerCookie).expect(401)
        })

        test("3.3 It should return a 422 error if the role is not one of 'Manager', 'Customer', 'Admin'", async () => {
            let wrongRole = await request(app).get(`${routePath}/users/roles/wrong`).set("Cookie", adminCookie)
            expect(wrongRole.status).toBe(422)
        })
    })

    describe("4. GET /users/:username", () => {
        test("4.1 It should return the user with the specified username when called by said user", async () => {
            //The operation is repeated for all three roles, expecting each user to be able to retrieve their information
            customerCookie = await login(customer)
            let customerRes = await request(app).get(`${routePath}/users/customer`).set("Cookie", customerCookie)
            expect(customerRes.status).toBe(200)
            expect(customerRes.body.username).toBe("customer")
            expect(customerRes.body.name).toBe("customer")
            expect(customerRes.body.surname).toBe("customer")
            expect(customerRes.body.role).toBe("Customer")
            let managerRes = await request(app).get(`${routePath}/users/manager`).set("Cookie", managerCookie)
            expect(managerRes.status).toBe(200)
            expect(managerRes.body.username).toBe("manager")
            expect(managerRes.body.name).toBe("manager")
            expect(managerRes.body.surname).toBe("manager")
            expect(managerRes.body.role).toBe("Manager")
            let adminRes = await request(app).get(`${routePath}/users/admin`).set("Cookie", adminCookie)
            expect(adminRes.status).toBe(200)
            expect(adminRes.body.username).toBe("admin")
            expect(adminRes.body.name).toBe("admin")
            expect(adminRes.body.surname).toBe("admin")
        })

        test("4.2 It should return the user with the specified username when called by an admin", async () => {
            //The information should also be returned if the user calling is an admin
            let customerRes = await request(app).get(`${routePath}/users/customer`).set("Cookie", adminCookie)
            expect(customerRes.status).toBe(200)
            expect(customerRes.body.username).toBe("customer")
            expect(customerRes.body.name).toBe("customer")
            expect(customerRes.body.surname).toBe("customer")
            expect(customerRes.body.role).toBe("Customer")
            let managerRes = await request(app).get(`${routePath}/users/manager`).set("Cookie", adminCookie)
            expect(managerRes.status).toBe(200)
            expect(managerRes.body.username).toBe("manager")
            expect(managerRes.body.name).toBe("manager")
            expect(managerRes.body.surname).toBe("manager")
            expect(managerRes.body.role).toBe("Manager")
            let adminRes = await request(app).get(`${routePath}/users/admin`).set("Cookie", adminCookie)
            expect(adminRes.status).toBe(200)
            expect(adminRes.body.username).toBe("admin")
            expect(adminRes.body.name).toBe("admin")
            expect(adminRes.body.surname).toBe("admin")
            expect(adminRes.body.role).toBe("Admin")
        })

        test("4.3 It should return a 404 error if the requested user does not exist", async () => {
            //This user was never created, so we expect an error
            let wrongUser = await request(app).get(`${routePath}/users/wrong`).set("Cookie", adminCookie)
            expect(wrongUser.status).toBe(404)
        })

        test("4.4 It should return a 401 error when called by a user who is neither an Admin nor the requested user", async () => {
            //In this case we have a manager trying to get information about a customer; it is not possible and should return an error
            let wrongUsername = await request(app)
                .get(`${routePath}/users/customer`)
                .set("Cookie", managerCookie)
            expect(wrongUsername.status).toBe(401)
        })

        test("4.5 It should return a 401 error when called by a user who is not logged in", async () => {
            let unloggedRes = await request(app).get(`${routePath}/users/customer`)
            expect(unloggedRes.status).toBe(401)
        })
    })

    describe("5. DELETE /users/:username", () => {
        test("5.1 It should delete the user with the specified username when called by said user", async () => {
            //We remove the customer from the database and then try to retrieve their information as an admin. 
            //The user does not exist anymore so we expect an error
            let customerRes = await request(app).delete(`${routePath}/users/customer`).set("Cookie", customerCookie)
            expect(customerRes.status).toBe(200)
            await request(app)
                .get(`${routePath}/users/customer`)
                .set("Cookie", adminCookie)
                .expect(404)
        })

        test("5.2 It should delete the user with the specified username when called by an admin", async () => {
            //We first create the customer again, which is allowed because the account was deleted
            //We delete the customer as an admin, and then expect an error after the cancellation
            await postUser(customer)
            let customerRes = await request(app).delete(`${routePath}/users/customer`).set("Cookie", adminCookie)
            expect(customerRes.status).toBe(200)
            await request(app)
                .get(`${routePath}/users/customer`)
                .set("Cookie", adminCookie)
                .expect(404)
        })

        test("5.3 It should return a 404 error if the requested user does not exist", async () => {
            let wrongUser = await request(app).delete(`${routePath}/users/wrong`).set("Cookie", adminCookie)
            expect(wrongUser.status).toBe(404)
        })

        test("5.4 It should return a 401 error when called by a user who is neither an Admin nor the requested user", async () => {
            //We recreate the customer (to avoid a 404 error) and then try to delete their account as a manager, expecting an error
            await postUser(customer)
            let wrongUsername = await request(app)
                .delete(`${routePath}/users/customer`)
                .set("Cookie", managerCookie)
            expect(wrongUsername.status).toBe(401)
        })

        test("5.5 It should return a 401 error when called by a user who is not logged in", async () => {
            let unloggedRes = await request(app).delete(`${routePath}/users/customer`)
            expect(unloggedRes.status).toBe(401)
        })

        test("5.6 It should return a 401 error when called by an Admin and the user to delete is another Admin", async () => {
            //We create a second admin and try to delete them with the first one, expecting an error
            let secondAdmin = { username: "secondAdmin", name: "secondAdmin", surname: "secondAdmin", password: "secondAdmin", role: "Admin" }
            await postUser(secondAdmin)
            let secondAdminRes = await request(app)
                .delete(`${routePath}/users/secondAdmin`)
                .set("Cookie", adminCookie)
            expect(secondAdminRes.status).toBe(401)
        })
    })

    describe("6. DELETE /users", () => {
        test("6.1 It should delete all non-Admin users when called by an Admin", async () => {
            //We delete all users except the two admins, and then check that users of other roles are not present
            let deleteAllRes = await request(app).delete(`${routePath}/users`).set("Cookie", adminCookie)
            expect(deleteAllRes.status).toBe(200)
            let usersRes = await request(app).get(`${routePath}/users`).set("Cookie", adminCookie)
            expect(usersRes.body.length).toBe(2)
            expect(usersRes.body[0].role).toBe("Admin")
            expect(usersRes.body.filter((user: any) => user.role === "Customer").length).toBe(0)
            expect(usersRes.body.filter((user: any) => user.role === "Manager").length).toBe(0)
        })

        test("6.2 It should return a 401 error when called by a user who is neither logged in nor an Admin", async () => {
            let managerRes = await request(app).delete(`${routePath}/users`).set("Cookie", managerCookie)
            expect(managerRes.status).toBe(401)
            let unloggedRes = await request(app).delete(`${routePath}/users`)
            expect(unloggedRes.status).toBe(401)
        })
    })

    describe("7 PATCH /users/:username", () => {
        test("7.1 It should update the information of the user with the specified username when called by said user", async () => {
            //We create a customer account (every non-admin was deleted) and then update their information
            //The updated information is checked and we expect it to be correct
            await postUser(customer)
            let customerCookie = await login(customer)
            let updatedCustomer = { name: "updated", surname: "updated", address: "test address", birthdate: "1970-01-01" }
            let updateRes = await request(app)
                .patch(`${routePath}/users/customer`)
                .set("Cookie", customerCookie)
                .send(updatedCustomer)
            expect(updateRes.status).toBe(200)
            let customerRes = await request(app).get(`${routePath}/users/customer`).set("Cookie", customerCookie)
            expect(customerRes.body.name).toBe("updated")
            expect(customerRes.body.surname).toBe("updated")
            expect(customerRes.body.address).toBe("test address")
            expect(customerRes.body.birthdate).toBe("1970-01-01")
        })

        test("7.2 It should update the information of the user with the specified username when called by an Admin", async () => {
            //The same operation should be allowed for an admin
            let updatedCustomer = { name: "updated again", surname: "updated again", address: "new test address", birthdate: "1970-01-02" }
            let updateRes = await request(app)
                .patch(`${routePath}/users/customer`)
                .set("Cookie", adminCookie)
                .send(updatedCustomer)
            expect(updateRes.status).toBe(200)
            let customerRes = await request(app).get(`${routePath}/users/customer`).set("Cookie", adminCookie)
            expect(customerRes.body.name).toBe("updated again")
            expect(customerRes.body.surname).toBe("updated again")
            expect(customerRes.body.address).toBe("new test address")
            expect(customerRes.body.birthdate).toBe("1970-01-02")
        })

        test("7.3 It should return a 404 error if the requested user does not exist", async () => {
            let wrongUser = await request(app).patch(`${routePath}/users/wrong`).set("Cookie", adminCookie).send({ name: "test", surname: "test", address: "test", birthdate: "1970-01-01" })
            expect(wrongUser.status).toBe(404)
        })

        test("7.4 It should return a 422 error if at least one parameter is empty", async () => {
            //The input parameters should not be empty, otherwise an error is returned
            let emptyName = await request(app).patch(`${routePath}/users/customer`).set("Cookie", adminCookie).send({ name: "", surname: "test", address: "test", birthdate: "1970-01-01" })
            let emptySurname = await request(app).patch(`${routePath}/users/customer`).set("Cookie", adminCookie).send({ name: "test", surname: "", address: "test", birthdate: "1970-01-01" })
            let emptyAddress = await request(app).patch(`${routePath}/users/customer`).set("Cookie", adminCookie).send({ name: "test", surname: "test", address: "", birthdate: "1970-01-01" })
            let emptyBirthdate = await request(app).patch(`${routePath}/users/customer`).set("Cookie", adminCookie).send({ name: "test", surname: "test", address: "test", birthdate: "" })
            expect(emptyName.status).toBe(422)
            expect(emptySurname.status).toBe(422)
            expect(emptyAddress.status).toBe(422)
            expect(emptyBirthdate.status).toBe(422)
        })

        test("7.5 It should return a 422 error if the birthdate is not a date or is not in the format 'YYYY-MM-DD', and a 400 error if it is not in the past", async () => {
            let wrongDate = await request(app).patch(`${routePath}/users/customer`).set("Cookie", adminCookie).send({ name: "test", surname: "test", address: "test", birthdate: "test" })
            let wrongFormat = await request(app).patch(`${routePath}/users/customer`).set("Cookie", adminCookie).send({ name: "test", surname: "test", address: "test", birthdate: "01-01-1970" })
            let futureDate = await request(app).patch(`${routePath}/users/customer`).set("Cookie", adminCookie).send({ name: "test", surname: "test", address: "test", birthdate: "2070-01-01" })
            expect(wrongDate.status).toBe(422)
            expect(wrongFormat.status).toBe(422)
            expect(futureDate.status).toBe(400)
        })

        test("7.6 It should return a 401 error when called by a user who is neither an Admin nor the requested user", async () => {
            let wrongUsername = await request(app)
                .patch(`${routePath}/users/customer`)
                .set("Cookie", managerCookie)
                .send({ name: "test", surname: "test", address: "test", birthdate: "1970-01-01" })
            expect(wrongUsername.status).toBe(401)
        })

        test("7.7 It should return a 401 error when called by a user who is not logged in", async () => {
            let unloggedRes = await request(app).patch(`${routePath}/users/customer`)
            expect(unloggedRes.status).toBe(401)
        })


    })
})

describe("Tests for Authentication Routes", () => {
    beforeAll(async () => {
        cleanup()
        await new Promise(resolve => setTimeout(resolve, 15000));
        await postUser(manager)
    })

    afterAll(() => {
        cleanup()
    })

    describe("1 POST /sessions", () => {
        test("1.1 It should do login when receiving correct credentials", async () => {
            let loginRes = await request(app)
                .post(`${routePath}/sessions`)
                .send({ username: "manager", password: "manager" })
            expect(loginRes.status).toBe(200)
            expect(loginRes.body.username).toBe("manager")
            expect(loginRes.body.name).toBe("manager")
            expect(loginRes.body.surname).toBe("manager")
            expect(loginRes.body.role).toBe("Manager")
        })

        test("1.2 It should return a 401 error when receiving wrong credentials", async () => {
            let wrongPassword = await request(app)
                .post(`${routePath}/sessions`)
                .send({ username: "manager", password: "wrong" })
            let wrongUsername = await request(app)
                .post(`${routePath}/sessions`)
                .send({ username: "wrong", password: "manager" })
            expect(wrongPassword.status).toBe(401)
            expect(wrongUsername.status).toBe(401)
        })
    })

    describe("2 DELETE /sessions", () => {
        test("2.1 It should do logout when called by a logged in user", async () => {
            let loginRes = await login(manager)
            let logoutRes = await request(app)
                .delete(`${routePath}/sessions/current`)
                .set("Cookie", loginRes)
            expect(logoutRes.status).toBe(200)
        })

        test("2.2 It should return a 401 error when called by a user who is not logged in", async () => {
            let logoutRes = await request(app)
                .delete(`${routePath}/sessions/current`)
            expect(logoutRes.status).toBe(401)
        })
    })

    describe("3 GET /sessions", () => {
        test("3.1 It should return information of the current logged user", async () => {
            let loginRes = await login(manager)
            let sessionRes = await request(app)
                .get(`${routePath}/sessions/current`)
                .set("Cookie", loginRes)
            expect(sessionRes.status).toBe(200)
            expect(sessionRes.body.username).toBe("manager")
            expect(sessionRes.body.name).toBe("manager")
            expect(sessionRes.body.surname).toBe("manager")
            expect(sessionRes.body.role).toBe("Manager")
        })

        test("3.2 It should return a 401 error when called by a user who is not logged in", async () => {
            let sessionRes = await request(app)
                .get(`${routePath}/sessions/current`)
            expect(sessionRes.status).toBe(401)
        })
    })
})