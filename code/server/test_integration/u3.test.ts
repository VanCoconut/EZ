import {describe, expect, jest, test} from "@jest/globals";
// @ts-ignore
import request from "supertest";
import {app} from "..";
import {cleanup} from "../src/db/cleanup";
import {Role, User} from "../src/components/user";
import {body} from "express-validator";
import userDAO from "../src/dao/userDAO";
import {UserAlreadyExistsError, UserNotFoundError} from "../src/errors/userError";
import UserDAO from "../src/dao/userDAO";


const baseURL = "/ezelectronics";

// Defining some custom users
const admin = {
    username: "admin",
    role: "Admin",
    name: "test",
    surname: "test",
    password: "test",
};
const manager = {
    username: "manager",
    role: "Manager",
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
async function getLoginToken(username: string, password: string): Promise<string> {
    const loginRequest = await request(app)
        .post(`${baseURL}/sessions`)
        .send({username: username, password: password})
        .expect(200);
    const cookies = loginRequest.headers["set-cookie"];
    expect(cookies).toHaveLength(1);
    expect(cookies[0]).toContain("connect.sid");
    return cookies[0];
}

async function createUser(userInfo: any) {
    await request(app).post(`${baseURL}/users`).send(userInfo).expect(200);
}

async function createProduct(productInfo: any, token: string) {
    await request(app)
        .post(`${baseURL}/products`)
        .set("Cookie", [token])
        .send(productInfo)
        .expect(200);
}

async function getAllUsers(token: string) {
    await request(app)
        .get(`${baseURL}/users`)
        .set("Cookie", token)
        .expect(200);
}

async function getUserByUsername(username: string, token: string) {
    await request(app)
        .get(`${baseURL}/users/${username}`)
        .set("Cookie", [token])
        .expect(200);
}
async function getUserByRole(role: string, token: string) {
    await request(app)
        .get(`${baseURL}/users/roles/${role}`)
        .set("Cookie", [token])
        .expect(200);
}
async function deleteUserByUsername(username: string, token: string) {
    await request(app)
        .delete(`${baseURL}/users/${username}`)
        .set("Cookie", [token])
        .expect(200);
}
async function deleteAllUsers(token: string) {
    await request(app)
        .delete(`${baseURL}/users`)
        .set("Cookie", [token])
        .expect(200);
}
async function modifyUser(user: object,username:string,token: string) {
    await request(app)
        .patch(`${baseURL}/users/${username}`)
        .set("Cookie", [token])
        .send(user)
        .expect(200);
}

beforeEach(async () => {
    await cleanup();
    await createUser(admin);
    await createUser(manager);
    await createUser(customer);
});

beforeAll(async () => {
    await cleanup();
});

afterAll(async () => {
    await cleanup();
});

describe("User routes integration tests", () => {
    describe("POST /user", () => {
        test("Should return 200 when creating a user", async () => {
            const token = await getLoginToken("manager", "test");
            jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
            await createUser(admin);
        });
        test("It should return 409 on duplicate user", async () => {
            await cleanup()
            await createUser(admin);
            jest.spyOn(UserDAO.prototype, "createUser").mockRejectedValueOnce(new UserAlreadyExistsError); //Mock the createUser method of the DAO
            const token = await getLoginToken("admin", "test");
            let user={ username: "admin",name: "test",surname: "test",   password: "test", role: "Admin",};
            await request(app)
                .post(`${baseURL}/users`)
                .set("Cookie", [token])
                .send(user)
                .expect(409);
        })
        test("It should return 422 on creating user", async () => {
            await cleanup()
            await createUser(admin);
            const token = await getLoginToken("admin", "test");
            let user={ username: "admin",name: "test",surname: "test",   password: "test", role: "Admin",};
            await request(app)
                .post(`${baseURL}/users`)
                .set("Cookie", [token])
                .send()
                .expect(422);
        })
    });
    describe("GET /users", () => {
        test("Should return 200 when retrieving all users", async () => {
            await cleanup()
            await createUser(admin);
            const token = await getLoginToken("admin", "test");
            console.log("Token received:", token);
            const mockUsers = [{username: "", name: "", surname: "", role: Role.ADMIN, address: "", birthdate: ""}]; // Mock user data
            jest.spyOn(UserDAO.prototype, "getAllUsers").mockResolvedValueOnce(mockUsers); // Mock the getAllUsers method of the DAO

            await getAllUsers(token);
        });
        test("Should return 401 when retrieving all users", async () => {
            await cleanup()
            await createUser(customer);
            const token = await getLoginToken("customer", "test");
            await request(app)
                .get(`${baseURL}/users`)
                .set("Cookie", token)
                .expect(401);
        });
    })
    describe("GET /users/:username", () => {
        test("Should return 422 when retrieving a user  by username", async () => {
            await cleanup()
            await createUser(admin);
            const token = await getLoginToken("admin", "test");
            let username1=12;
            await request(app)
                .get(`${baseURL}/users/${username1}`)
                .set("Cookie", [token])
                .expect(422);
        });
        test("Should return 200 when retrieving a user by username", async () => {
            await cleanup()
            await createUser(admin);
            const token = await getLoginToken("admin", "test");
            let username="admin";
            const mockUserCalled = new User("a", "", "", Role.ADMIN, "", "")
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(mockUserCalled); // Mock the getAllUsers method of the DAO
            await getUserByUsername(username,token);
        });
        test("Should return 404 when retrieving a user  by username", async () => {
            await cleanup()
            // jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRejectedValueOnce(new UserNotFoundError()); //Mock the createUser method of the DAO
            await createUser(admin);
            let adminCookie = await login(admin)
            let username="pippo";
             await request(app)
                .get(`${baseURL}/users/${username}`)
                .set("Cookie", adminCookie)
                .expect(404);
        });
        test("Should return 401 when retrieving a user  by username", async () => {
            await cleanup()
            await createUser(customer);
            const token = await getLoginToken("customer", "test");
            let username="admin";
            await request(app)
                .get(`${baseURL}/users/${username}`)
                .set("Cookie", [token])
                .expect(401);
        });
    })
    describe("GET /users/:role", () => {
        test("Should return 200 when retrieving a user by username", async () => {
            try {
                await cleanup()
                await createUser(admin);
                const token = await getLoginToken("admin", "test");
                let role="Admin";
                const mockUser = [new User("", "", "", Role.ADMIN, "", "")]
                jest.spyOn(UserDAO.prototype, "getUsersByRole").mockResolvedValueOnce(mockUser);
                await getUserByRole(role,token);
            }
            catch (err){
                console.log(err)
            }

        });
        test("Should return 401 when retrieving a user by role", async () => {
            await cleanup()
            await createUser(customer);
            const token = await getLoginToken("customer", "test");
            let role="Admin";
            await request(app)
                .get(`${baseURL}/users/roles/${role}`)
                .set("Cookie", [token])
                .expect(401);
        });
        test("Should return 422 when retrieving a user by role", async () => {
            await cleanup()
            await createUser(admin);
            const token = await getLoginToken("admin", "test");
            let role="Adn";
            await request(app)
                .get(`${baseURL}/users/roles/${role}`)
                .set("Cookie", [token])
                .expect(422);
        });
    })
    describe("DELETE /users/:username", () => {
        test("Should return 200 when deleting a user by username", async () => {
            await cleanup()
            await createUser(admin);
            const token = await getLoginToken("admin", "test");
            let username="admin";
            jest.spyOn(UserDAO.prototype, "deleteUserByUsername").mockResolvedValueOnce(true); // Mock the getAllUsers method of the DAO
            await deleteUserByUsername(username,token);
        });
        test("Should return 401 when deleting a user by username", async () => {
            await cleanup()
            await createUser(customer);
            const token = await getLoginToken("customer", "test");
            let username="admin";
            await request(app)
                .delete(`${baseURL}/users/${username}`)
                .set("Cookie", [token])
                .expect(401);
        });
        test("Should return 404 when deleting a user by username", async () => {
            await cleanup()
            await createUser(admin);
            const token = await getLoginToken("admin", "test");
            let username="pippo";
            jest.spyOn(UserDAO.prototype, "deleteUserByUsername").mockRejectedValueOnce(new UserNotFoundError()); //Mock the createUser method of the DAO
            await request(app)
                .delete(`${baseURL}/users/${username}`)
                .set("Cookie", [token])
                .expect(404);
        });
        test("Should return 422 when deleting a user by username", async () => {
            await cleanup()
            await createUser(admin);
            const token = await getLoginToken("admin", "test");
            let username=1;
            await request(app)
                .delete(`${baseURL}/users/${username}`)
                .set("Cookie", [token])
                .expect(422);
        });
    })
    describe("DELETE /users", () => {
        test("Should return 200 when deleting all users ", async () => {
            await cleanup()
            await createUser(admin);
            await createUser(customer);
            await createUser(manager);
            const token = await getLoginToken("admin", "test");
            jest.spyOn(UserDAO.prototype, "deleteAllUsers").mockResolvedValueOnce(true); // Mock the getAllUsers method of the DAO
            await deleteAllUsers(token);
        });
        test("Should return 401 when deleting all users", async () => {
            await cleanup()
            await createUser(customer);
            const token = await getLoginToken("customer", "test");
            await request(app)
                .delete(`${baseURL}/users`)
                .set("Cookie", [token])
                .expect(401);
        });
    })
    describe("PATCH /users/:username", () => {
        test("Should return 200 when modifying a user", async () => {
            await cleanup()
            await createUser(admin);
            const token = await getLoginToken("admin", "test");
            const username="admin";
            const user={
                username:"admin1",name:"admin1",surname:"admin1",address:"admin1",birthdate:"2000-01-01",}
            const mockUserUpdate = {username: "a", name: "a", surname: "", role: Role.ADMIN, address: "", birthdate: ""}; // Mock user data
            jest.spyOn(UserDAO.prototype, "updateUser").mockResolvedValueOnce(mockUserUpdate); // Mock the updateUser method of the DAO

            await modifyUser(user,username, token);
        });
        test("Should return 401 when modifying a user", async () => {
            await cleanup()
            await createUser(customer);
            const token = await getLoginToken("customer", "test");
            const username="admin";
            const user={
                username:"admin1",name:"admin1",surname:"admin1",address:"admin1",birthdate:"2000-01-01",}
            await request(app)
                .patch(`${baseURL}/users/${username}`)
                .set("Cookie", [token])
                .send(user)
                .expect(401);
        });
        test("Should return 404 when modifying a user", async () => {
            await cleanup()
            await createUser(admin);
            const token = await getLoginToken("admin", "test");
            const username="pippo";
            jest.spyOn(UserDAO.prototype, "updateUser").mockRejectedValueOnce(new UserNotFoundError()); // Mock the updateUser method of the DAO
            const user={
                username:"admin1",name:"admin1",surname:"admin1",address:"admin1",birthdate:"2000-01-01",}
            await request(app)
                .patch(`${baseURL}/users/${username}`)
                .set("Cookie", [token])
                .send(user)
                .expect(404);
        });
        test("Should return 422 when modifying a user", async () => {
            await cleanup()
            await createUser(admin);
            const token = await getLoginToken("admin", "test");
            const username="admin";
            const user={
                username:"admin1",name:"admin1",surname:"admin1",address:"admin1",birthdate:"2000-01-01",}
            await request(app)
                .patch(`${baseURL}/users/${username}`)
                .set("Cookie", [token])
                .send()
                .expect(422);
        });
    })
})
