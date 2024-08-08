import {describe, test, expect, beforeAll, afterAll, jest} from "@jest/globals"

import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
// @ts-ignore
import crypto from "crypto"
import db from "../../src/db/db"
import {Database} from "sqlite3"
import {User, Role} from "../../src/components/user";
import {NothingToChange, UserAlreadyExistsError, UserIsAdminError, UserNotFoundError} from "../../src/errors/userError";

jest.mock("crypto")
jest.mock("../../src/db/db.ts")

describe("Dao unit tests", () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });
    test("It should resolve true createUser", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });
        const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
            return (Buffer.from("salt"))
        })
        const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
            return Buffer.from("hashedPassword")
        })
        const result = await userDAO.createUser("username", "name", "surname", "password", "role")
        expect(result).toBe(true)
        mockRandomBytes.mockRestore()
        mockDBRun.mockRestore()
        mockScrypt.mockRestore()
    })

    test("It should resolve UserAlreadyExistsError, createUser", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("UNIQUE constraint failed: users.username"))
            return {} as Database
        });

        const result = userDAO.createUser("username", "name", "surname", "password", "role")
        await expect(result).rejects.toThrow(UserAlreadyExistsError);

        mockDBRun.mockRestore()

    })

    test("It should resolve into a user by user", async () => {
        const userDAO = new UserDAO();
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {
                username: "username",
                name: "name",
                surname: "surname",
                role: Role.ADMIN,
                address: "address",
                birthdate: "birthdate"
            });
            return {} as Database;
        });

        const mockUser = new User("username", "name", "surname", Role.ADMIN, "address", "birthdate");

        const result = await userDAO.getUserByUsername("username");

        expect(result).toEqual(mockUser); // Use toEqual to compare object properties

        mockDBGet.mockRestore();
    });

    test("It should resolve into a UserNotFoundError by user", async () => {
        const userDAO = new UserDAO();
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        jest.setTimeout(10000);
        // Assicura che il metodo lanci l'eccezione `UserNotFoundError`
        await expect(userDAO.getUserByUsername("username")).rejects.toThrow(UserNotFoundError);

        mockDBGet.mockRestore();
    });

    test("It should resolve into a list of users get Users", async () => {
        const userDAO = new UserDAO();
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [{
                username: "username",
                name: "name",
                surname: "surname",
                role: Role.ADMIN,
                address: "address",
                birthdate: "birthdate"
            },
                {
                    username: "username",
                    name: "name",
                    surname: "surname",
                    role: Role.ADMIN,
                    address: "address",
                    birthdate: "birthdate"
                }]);
            return {} as Database;
        });

        const mockUsersList = [new User("username", "name", "surname", Role.ADMIN, "address", "birthdate"),
            new User("username", "name", "surname", Role.ADMIN, "address", "birthdate"),];

        jest.spyOn(userDAO, "getAllUsers").mockResolvedValueOnce(mockUsersList);

        const result = await userDAO.getAllUsers();

        expect(result).toEqual(mockUsersList); // Use toEqual to compare object properties

        mockDBAll.mockRestore();
    });

// test("It should not resolve into a list of users; UserNotFoundError", async () => {
//     const userDAO = new UserDAO();
//     const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
//         callback(null, null);
//         return {} as Database;
//     });
//
//     const mockUsersList = [];
//
//     await expect(userDAO.getAllUsers()).rejects.toThrow(UserNotFoundError);
//
//     mockDBAll.mockRestore();
// });

    test("It should resolve into a list of users by role", async () => {
        const userDAO = new UserDAO();
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [{
                username: "username",
                name: "name",
                surname: "surname",
                role: Role.ADMIN,
                address: "address",
                birthdate: "birthdate"
            },
                {
                    username: "username",
                    name: "name",
                    surname: "surname",
                    role: Role.ADMIN,
                    address: "address",
                    birthdate: "birthdate"
                }]);
            return {} as Database;
        });

        const mockUsersList = [new User("username", "name", "surname", Role.ADMIN, "address", "birthdate"),
            new User("username", "name", "surname", Role.ADMIN, "address", "birthdate"),];

        const result = await userDAO.getUsersByRole(Role.ADMIN);

        expect(result).toEqual(mockUsersList); // Use toEqual to compare object properties

        mockDBAll.mockRestore();
    });

// test("It should not resolve into a list of users by role; UserNotFoundError", async () => {
//     const userDAO = new UserDAO();
//     const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
//         callback(null, null);
//         return {} as Database;
//     });
//
//     const mockUsersList = [];
//
//     await expect(userDAO.getAllUsers()).rejects.toThrow(UserNotFoundError);
//
//     mockDBAll.mockRestore();
// });

    test("It should resolve true, deleteUserByUsername", async () => {
        const userDAO = new UserDAO()
        // Mock di getUserByUsername
        jest.spyOn(userDAO, "getUserByUsername").mockResolvedValueOnce(new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate"));
        const mockDBRun = jest.spyOn(db, "run").mockImplementation(function (sql, params, callback) {
            callback.call({changes: 1}, null);
            return {} as Database;
        });
        const result = await userDAO.deleteUserByUsername("username", "username")
        expect(result).toBe(true)
        mockDBRun.mockRestore()
    })

// test("It should resolve NothingToChange, deleteUserByUsername", async () => {
//     const userDAO = new UserDAO();
//     // Mock di getUserByUsername
//     jest.spyOn(userDAO, "getUserByUsername").mockResolvedValueOnce(new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate"));
//     // Mock di db.run
//     const mockDBRun = jest.spyOn(db, "run").mockImplementation(function (sql, params, callback) {
//         callback.call({changes: 0}, null);
//         return {} as Database;
//     });
//     await expect(userDAO.deleteUserByUsername("logUsername", "username")).rejects.toThrow(NothingToChange);
//     mockDBRun.mockRestore();
// });

    test("It should resolve UserIsAdminError, deleteUserByUsername", async () => {
        const userDAO = new UserDAO();
        // Mock di getUserByUsername
        jest.spyOn(userDAO, "getUserByUsername").mockResolvedValueOnce(new User("username", "name", "surname", Role.ADMIN, "address", "birthdate"));
        // Mock di db.run
        const mockDBRun = jest.spyOn(db, "run").mockImplementation(function (sql, params, callback) {
            callback.call(null, null);
            return {} as Database;
        });
        await expect(userDAO.deleteUserByUsername("logUsername", "username")).rejects.toThrow(UserIsAdminError);
        mockDBRun.mockRestore();
    });

    test("It should resolve UserNotFoundError, deleteUserByUsername", async () => {
        const userDAO = new UserDAO();
        // Mock di getUserByUsername
        jest.spyOn(userDAO, "getUserByUsername").mockRejectedValueOnce(new UserNotFoundError());
        // Mock di db.run
        const mockDBRun = jest.spyOn(db, "run").mockImplementation(function (sql, params, callback) {
            callback.call(null, null);
            return {} as Database;
        });
        await expect(userDAO.deleteUserByUsername("logUsername", "username")).rejects.toThrow(UserNotFoundError);
        mockDBRun.mockRestore();
    });

    test("It should resolve true, deleteAllUsers", async () => {
        const userDAO = new UserDAO();
        const mockDBRun = jest.spyOn(db, "run").mockImplementation(function (sql, params, callback) {
            callback.call({changes: 1}, null);
            return {} as Database;
        });

        const result = await userDAO.deleteAllUsers();

        expect(result).toBe(true);

        mockDBRun.mockRestore();
    });

// test("It should resolve NothingToChange, deleteAllUsers", async () => {
//     const userDAO = new UserDAO();
//
//     const mockDBRun = jest.spyOn(db, "run").mockImplementation(function (sql, params, callback) {
//         callback.call({changes: 0}, null);
//         return {} as Database;
//     });
//     await expect(userDAO.deleteAllUsers()).rejects.toThrow(NothingToChange);
//     mockDBRun.mockRestore();
// });

    test("It should resolve the updated user", async () => {
        const userDAO = new UserDAO();
        jest.spyOn(userDAO, "getUserByUsername").mockResolvedValueOnce(new User("username", "oldName", "surname", Role.ADMIN, "address", "birthdate"));
        const mockDBRun = jest.spyOn(db, "run").mockImplementation(function (sql, params, callback) {
            callback.call({changes: 1}, null); // Imposta il contesto del callback con changes
            return {} as Database;
        });
        const mockUserLogged = new User("username", "oldName", "surname", Role.ADMIN, "address", "birthdate");
        const mockUserUpd = new User("username", "newName", "surname", Role.ADMIN, "address", "birthdate");
        const mockUserToUpd = "username";
        const result = await userDAO.updateUser(mockUserLogged.username, mockUserUpd.name, mockUserUpd.surname, mockUserUpd.address, mockUserUpd.birthdate, mockUserToUpd);
        expect(result).toEqual(mockUserUpd);
        mockDBRun.mockRestore();
    });

    test("It should resolve UserIsAdminError,updateUser", async () => {
        const userDAO = new UserDAO();
        jest.spyOn(userDAO, "getUserByUsername").mockResolvedValueOnce(new User("username", "oldName", "surname", Role.ADMIN, "address", "birthdate"));
        const mockDBRun = jest.spyOn(db, "run").mockImplementation(function (sql, params, callback) {
            callback.call({changes: 1}, null); // Imposta il contesto del callback con changes
            return {} as Database;
        });
        const mockUserLogged = new User("username", "oldName", "surname", Role.ADMIN, "address", "birthdate");
        const mockUserUpd = new User("username", "newName", "surname", Role.ADMIN, "address", "birthdate");
        const mockUserToUpd = "differentUsername";
        const result = userDAO.updateUser(mockUserLogged.username, mockUserUpd.name, mockUserUpd.surname, mockUserUpd.address, mockUserUpd.birthdate, mockUserToUpd);
        await expect(result).rejects.toThrow(UserIsAdminError);
        mockDBRun.mockRestore();
    });

// test("It should resolve NothingToChange,updateUser", async () => {
//     const userDAO = new UserDAO();
//     jest.spyOn(userDAO, "getUserByUsername").mockResolvedValueOnce(new User("username", "oldName", "surname", Role.ADMIN, "address", "birthdate"));
//     const mockDBRun = jest.spyOn(db, "run").mockImplementation(function (sql, params, callback) {
//         callback.call({changes: 0}, null); // Imposta il contesto del callback con changes
//         return {} as Database;
//     });
//     const mockUserLogged = new User("username", "oldName", "surname", Role.ADMIN, "address", "birthdate");
//     const mockUserUpd = new User("username", "oldName", "surname", Role.ADMIN, "address", "birthdate");
//     const mockUserToUpd = "username";
//     const result = userDAO.updateUser(mockUserLogged.username, mockUserUpd.name, mockUserUpd.surname, mockUserUpd.address, mockUserUpd.birthdate, mockUserToUpd);
//     await expect(result).rejects.toThrow(NothingToChange);
//     mockDBRun.mockRestore();
// });

    test("It should resolve UserNotFoundError, updateUser", async () => {
        const userDAO = new UserDAO();
        jest.spyOn(userDAO, "getUserByUsername").mockRejectedValueOnce(new UserNotFoundError());
        const mockDBRun = jest.spyOn(db, "run").mockImplementation(function (sql, params, callback) {
            callback.call({changes: 0}, null); // Imposta il contesto del callback con changes
            return {} as Database;
        });
        const mockUserLogged = new User("username", "oldName", "surname", Role.ADMIN, "address", "birthdate");
        const mockUserUpd = new User("username", "oldName", "surname", Role.ADMIN, "address", "birthdate");
        const mockUserToUpd = "username";
        const result = userDAO.updateUser(mockUserLogged.username, mockUserUpd.name, mockUserUpd.surname, mockUserUpd.address, mockUserUpd.birthdate, mockUserToUpd)
        await expect(result).rejects.toThrow(UserNotFoundError);
        mockDBRun.mockRestore();
    });
})