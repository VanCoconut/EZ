import {test, expect, jest} from "@jest/globals"
import UserController from "../../src/controllers/userController"
import {Role, User} from "../../src/components/user";
import {
    NothingToChange,
    UserAlreadyExistsError,
    UserIsAdminError,
    UserNotAdminError,
    UserNotFoundError
} from "../../src/errors/userError";
import UserDAO from "../../src/dao/userDAO";


jest.mock("../../src/dao/userDAO")

describe("Controller unit tests", () => {
    describe("POST USER", () => {
        beforeEach(() => {
            jest.resetAllMocks();
        });
        test("It should return true", async () => {
            const testUser = { //Define a test user object
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            }
            jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
            const controller = new UserController(); //Create a new instance of the controller
            //Call the createUser method of the controller with the test user object
            const response = await controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);

            //Check if the createUser method of the DAO has been called once with the correct parameters
            expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
                testUser.name,
                testUser.surname,
                testUser.password,
                testUser.role);
            expect(response).toBe(true); //Check if the response is true
        });

        test("It should resolve UserAlreadyExistsError, createUser", async () => {
            const testUser = { //Define a test user object
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            }
            jest.spyOn(UserDAO.prototype, "createUser").mockRejectedValueOnce(new UserAlreadyExistsError); //Mock the createUser method of the DAO
            const controller = new UserController(); //Create a new instance of the controller
            //Call the createUser method of the controller with the test user object
            const response = controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);

            //Check if the createUser method of the DAO has been called once with the correct parameters
            expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
                testUser.name,
                testUser.surname,
                testUser.password,
                testUser.role);
            await expect(response).rejects.toThrow(UserAlreadyExistsError);
        });
    })
    describe("GET ALL USERS", () => {
        beforeEach(() => {
            jest.resetAllMocks();
        });

        test("It should return a list of users", async () => {
            const mockUsers = [{username: "", name: "", surname: "", role: Role.ADMIN, address: "", birthdate: ""}]; // Mock user data

            jest.spyOn(UserDAO.prototype, "getAllUsers").mockResolvedValueOnce(mockUsers); // Mock the getAllUsers method of the DAO

            const controller = new UserController(); // Create a new instance of the controller

            const response = await controller.getUsers(); // Call the getUsers method of the controller

            expect(UserDAO.prototype.getAllUsers).toHaveBeenCalledTimes(1); // Check if the getAllUsers method of the DAO has been called once
            expect(UserDAO.prototype.getAllUsers).toHaveBeenCalledWith(); // Check if the getAllUsers method of the DAO has been called with no parameters
            const normalizedResponse = Array.isArray(response) ? response : [response];
            expect(Array.isArray(normalizedResponse)).toBe(true); // Check if the response is an array
            response.forEach(user => {
                expect(response).toBeInstanceOf(Array);
            });
        });

// test("It should return UserNotFoundError, a list of users", async () => {
//     const mockUsers = [{username: "", name: "", surname: "", role: Role.ADMIN, address: "", birthdate: ""}]; // Mock user data
//
//     jest.spyOn(UserDAO.prototype, "getAllUsers").mockRejectedValueOnce(new UserNotFoundError); // Mock the getAllUsers method of the DAO
//
//     const controller = new UserController(); // Create a new instance of the controller
//
//     const response =  controller.getUsers(); // Call the getUsers method of the controller
//
//     expect(UserDAO.prototype.getAllUsers).toHaveBeenCalledTimes(1); // Check if the getAllUsers method of the DAO has been called once
//     expect(UserDAO.prototype.getAllUsers).toHaveBeenCalledWith(); // Check if the getAllUsers method of the DAO has been called with no parameters
//     await expect(response).rejects.toThrow(UserNotFoundError);
//
// });
    })
    describe("GET USER BY ROLE", () => {
        beforeEach(() => {
            jest.resetAllMocks();
        });

        test("It should return a list of users by Role", async () => {

            const mockUser = [new User("", "", "", Role.ADMIN, "", "")]

            const mockRole = Role.ADMIN

            jest.spyOn(UserDAO.prototype, "getUsersByRole").mockResolvedValueOnce(mockUser); // Mock the getAllUsers method of the DAO

            const controller = new UserController(); // Create a new instance of the controller

            const response = await controller.getUsersByRole(mockRole); // Call the getUsers method of the controller

            expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1); // Check if the getAllUsers method of the DAO has been called once
            expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledWith(mockRole); // Check if the getAllUsers method of the DAO has been called with no parameters
            const normalizedResponse = Array.isArray(response) ? response : [response];
            expect(Array.isArray(normalizedResponse)).toBe(true); // Check if the response is an array
            response.forEach(user => {
                expect(user).toBeInstanceOf(User);
                expect(user).toHaveProperty('role', Role.ADMIN);
            });
        });

// test("It should return UserNotFoundError, a list of users by Role", async () => {
//
//     const mockUser = [new User("", "", "", Role.ADMIN, "", "")]
//
//     const mockRole = Role.ADMIN
//
//     jest.spyOn(UserDAO.prototype, "getUsersByRole").mockRejectedValueOnce(new UserNotFoundError); // Mock the getAllUsers method of the DAO
//
//     const controller = new UserController(); // Create a new instance of the controller
//
//     const response =  controller.getUsersByRole(mockRole); // Call the getUsers method of the controller
//
//     expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1); // Check if the getAllUsers method of the DAO has been called once
//     expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledWith(mockRole); // Check if the getAllUsers method of the DAO has been called with no parameters
//     await expect(response).rejects.toThrow(UserNotFoundError);
// });
    })
    describe("GET USER BY USNAME", () => {
        beforeEach(() => {
            jest.resetAllMocks();
        });

        test("It should return a user by its username", async () => {
            const mockUserCaller = new User("a", "", "", Role.ADMIN, "", "")

            const mockUserCalled = new User("a", "", "", Role.ADMIN, "", "")

            const mockUsername = "a"

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(mockUserCalled); // Mock the getAllUsers method of the DAO

            const controller = new UserController(); // Create a new instance of the controller

            const response = await controller.getUserByUsername(mockUserCaller, mockUsername); // Call the getUsers method of the controller
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1); // Check if the getAllUsers method of the DAO has been called once
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(mockUsername); // Check if the getAllUsers method of the DAO has been called with no parameters
            expect(response).toBeInstanceOf(User);
            expect(response).toHaveProperty('username', "a");
        });

        test("It should not return a user by its username, UserNotAdminError", async () => {
            const mockUserCaller = new User("a", "", "", Role.CUSTOMER, "", "")

            const mockUserCalled = new User("b", "", "", Role.ADMIN, "", "")

            const mockUsername = "b"

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(mockUserCalled); // Mock the getAllUsers method of the DAO

            const controller = new UserController(); // Create a new instance of the controller

            const response = await expect(controller.getUserByUsername(mockUserCaller, mockUsername))
                .rejects.toThrow(UserNotAdminError); // Call the getUsers method of the controller
        });

        test("It should return UserNotFoundError, a user by its username", async () => {
            const mockUserCaller = new User("a", "", "", Role.CUSTOMER, "", "")

            const mockUserCalled = new User("b", "", "", Role.ADMIN, "", "")

            const mockUsername = "a"

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRejectedValueOnce(new UserNotFoundError); // Mock the getAllUsers method of the DAO

            const controller = new UserController(); // Create a new instance of the controller

            const response = await expect(controller.getUserByUsername(mockUserCaller, mockUsername))
                .rejects.toThrow(UserNotFoundError); // Call the getUsers method of the controller
        });
    })
    describe("DELETE USER", () => {
        beforeEach(() => {
            jest.resetAllMocks();
        });

        test("It should delete a user by its username", async () => {
            const mockUser = {username: "a", name: "", surname: "", role: Role.CUSTOMER, address: "", birthdate: ""} // Mock user data

            const mockUsername = "a"

            jest.spyOn(UserDAO.prototype, "deleteUserByUsername").mockResolvedValueOnce(true); // Mock the getAllUsers method of the DAO

            const controller = new UserController(); // Create a new instance of the controller

            const response = await controller.deleteUser(mockUser, mockUsername); // Call the getUsers method of the controller
            expect(UserDAO.prototype.deleteUserByUsername).toHaveBeenCalledTimes(1); // Check if the getAllUsers method of the DAO has been called once
            expect(UserDAO.prototype.deleteUserByUsername).toHaveBeenCalledWith(mockUser.username, mockUsername); // Check if the getAllUsers method of the DAO has been called with no parameters
            expect(response).toBe(true);
        });

        test("It should not delete a user by its username cause he's not an Admin", async () => {
            const mockUser = {username: "a", name: "", surname: "", role: Role.CUSTOMER, address: "", birthdate: ""} // Mock user data

            const mockUsername = "b"

            jest.spyOn(UserDAO.prototype, "deleteUserByUsername").mockResolvedValueOnce(false); // Mock the getAllUsers method of the DAO

            const controller = new UserController(); // Create a new instance of the controller

            const response = await expect(controller.deleteUser(mockUser, mockUsername))
                .rejects.toThrow(UserNotAdminError); // Call the getUsers method of the controller
        });

// test("It should resolve NothingToChange, delete user by username", async () => {
//     const mockUser = {username: "a", name: "", surname: "", role: Role.ADMIN, address: "", birthdate: ""} // Mock user data
//
//     const mockUsername = "b"
//
//     jest.spyOn(UserDAO.prototype, "deleteUserByUsername").mockRejectedValueOnce(new NothingToChange); // Mock the getAllUsers method of the DAO
//
//     const controller = new UserController(); // Create a new instance of the controller
//
//     const response = await expect(controller.deleteUser(mockUser, mockUsername))
//         .rejects.toThrow(NothingToChange); // Call the getUsers method of the controller
// });

        test("It should resolve UserIsAdminError, delete user by username", async () => {
            const mockUser = {username: "a", name: "", surname: "", role: Role.ADMIN, address: "", birthdate: ""} // Mock user data

            const mockUsername = "b"

            jest.spyOn(UserDAO.prototype, "deleteUserByUsername").mockRejectedValueOnce(new UserIsAdminError); // Mock the getAllUsers method of the DAO

            const controller = new UserController(); // Create a new instance of the controller

            const response = await expect(controller.deleteUser(mockUser, mockUsername))
                .rejects.toThrow(UserIsAdminError); // Call the getUsers method of the controller
        });

        test("It should resolve UserNotFoundError, delete user by username", async () => {
            const mockUser = {username: "a", name: "", surname: "", role: Role.ADMIN, address: "", birthdate: ""} // Mock user data

            const mockUsername = "b"

            jest.spyOn(UserDAO.prototype, "deleteUserByUsername").mockRejectedValueOnce(new UserNotFoundError); // Mock the getAllUsers method of the DAO

            const controller = new UserController(); // Create a new instance of the controller

            const response = await expect(controller.deleteUser(mockUser, mockUsername))
                .rejects.toThrow(UserNotFoundError); // Call the getUsers method of the controller
        });
    })
    describe("DELETE ALL USER", () => {
        beforeEach(() => {
            jest.resetAllMocks();
        });

        test("It should delete all the users", async () => {

            jest.spyOn(UserDAO.prototype, "deleteAllUsers").mockResolvedValueOnce(true); // Mock the getAllUsers method of the DAO

            const controller = new UserController(); // Create a new instance of the controller

            const response = await controller.deleteAll(); // Call the getUsers method of the controller
            expect(UserDAO.prototype.deleteAllUsers).toHaveBeenCalledTimes(1); // Check if the getAllUsers method of the DAO has been called once
            expect(UserDAO.prototype.deleteAllUsers).toHaveBeenCalledWith(); // Check if the getAllUsers method of the DAO has been called with no parameters
            expect(response).toBe(true);
        });

// test("It should resolve NothingToChange, delete all users", async () => {
//
//     jest.spyOn(UserDAO.prototype, "deleteAllUsers").mockRejectedValueOnce(new NothingToChange); // Mock the getAllUsers method of the DAO
//
//     const controller = new UserController(); // Create a new instance of the controller
//
//     const response =  controller.deleteAll(); // Call the getUsers method of the controller
//     expect(UserDAO.prototype.deleteAllUsers).toHaveBeenCalledTimes(1); // Check if the getAllUsers method of the DAO has been called once
//     expect(UserDAO.prototype.deleteAllUsers).toHaveBeenCalledWith(); // Check if the getAllUsers method of the DAO has been called with no parameters
//     await expect(response).rejects.toThrow(NothingToChange)
// });
    })
    describe("PATCH USER", () => {
        beforeEach(() => {
            jest.resetAllMocks(); // Pulizia di tutti i mock tra i test
        });

        test("It should update user info", async () => {
            const mockUser = {username: "a", name: "", surname: "", role: Role.ADMIN, address: "", birthdate: ""}; // Mock user data
            const mockUserUpdate = {username: "a", name: "a", surname: "", role: Role.ADMIN, address: "", birthdate: ""}; // Mock user data

            jest.spyOn(UserDAO.prototype, "updateUser").mockResolvedValueOnce(mockUserUpdate); // Mock the updateUser method of the DAO

            const controller = new UserController(); // Create a new instance of the controller

            const response = await controller.updateUserInfo(mockUser, mockUser.name, mockUser.surname, mockUser.address, mockUser.birthdate, mockUser.username); // Call the updateUserInfo method of the controller

            expect(UserDAO.prototype.updateUser).toHaveBeenCalledTimes(1); // Check if the updateUser method of the DAO has been called once
            expect(UserDAO.prototype.updateUser).toHaveBeenCalledWith(mockUser.username, mockUser.name, mockUser.surname, mockUser.address, mockUser.birthdate, mockUser.username); // Check if the updateUser method of the DAO has been called with correct parameters
            expect(response).toBe(mockUserUpdate);
        });

        test("It should not update user info, UserNotAdminError", async () => {
            const mockUser = {username: "a", name: "", surname: "", role: Role.CUSTOMER, address: "", birthdate: ""}; // Mock user data
            const mockUsername = "f";

            jest.spyOn(UserDAO.prototype, "updateUser").mockResolvedValueOnce(mockUser); // Mock the updateUser method of the DAO

            const controller = new UserController(); // Create a new instance of the controller

            await expect(controller.updateUserInfo(
                mockUser, mockUser.name, mockUser.surname, mockUser.address, mockUser.birthdate, mockUsername))
                .rejects.toThrow(UserNotAdminError); // Call the updateUserInfo method of the controller
        });

        test("It should not update user info, UserNotFoundError", async () => {
            const mockUser = {username: "a", name: "", surname: "", role: Role.ADMIN, address: "", birthdate: ""}; // Mock user data
            const mockUsername = "f";

            jest.spyOn(UserDAO.prototype, "updateUser").mockRejectedValueOnce(new UserNotFoundError()); // Mock the updateUser method of the DAO

            const controller = new UserController(); // Create a new instance of the controller

            await expect(controller.updateUserInfo(
                mockUser, mockUser.name, mockUser.surname, mockUser.address, mockUser.birthdate, mockUsername))
                .rejects.toThrow(UserNotFoundError); // Call the updateUserInfo method of the controller
        });

        test("It should not update user info, UserIsAdminError", async () => {
            const mockUser = {username: "a", name: "", surname: "", role: Role.ADMIN, address: "", birthdate: ""}; // Mock user data
            const mockUsername = "f";

            jest.spyOn(UserDAO.prototype, "updateUser").mockRejectedValueOnce(new UserIsAdminError()); // Mock the updateUser method of the DAO

            const controller = new UserController(); // Create a new instance of the controller

            await expect(controller.updateUserInfo(
                mockUser, mockUser.name, mockUser.surname, mockUser.address, mockUser.birthdate, mockUsername))
                .rejects.toThrow(UserIsAdminError); // Call the updateUserInfo method of the controller
        });
    });


// test("It should not update user info, NothingToChange", async () => {
//     const mockUser = {username: "a", name: "", surname: "", role: Role.ADMIN, address: "", birthdate: ""} // Mock user data
//
//     const mockUsername = "f"
//
//     jest.spyOn(UserDAO.prototype, "updateUser").mockRejectedValueOnce(new NothingToChange); // Mock the getAllUsers method of the DAO
//
//     const controller = new UserController(); // Create a new instance of the controller
//
//
//     const response = await expect(controller.updateUserInfo(
//         mockUser, mockUser.name, mockUser.surname, mockUser.address, mockUser.birthdate,mockUsername))
//         .rejects.toThrow(NothingToChange); // Call the getUsers method of the controller
// });

})