import {Role, User} from "../components/user"
import UserDAO from "../dao/userDAO"
import {UserNotAdminError} from "../errors/userError";

/**
 * Represents a controller for managing users.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class UserController {
    private dao: UserDAO

    constructor() {
        this.dao = new UserDAO
    }

    /**
     * Creates a new user.
     * @param username - The username of the new user. It must not be null and it must not be already taken.
     * @param name - The name of the new user. It must not be null.
     * @param surname - The surname of the new user. It must not be null.
     * @param password - The password of the new user. It must not be null.
     * @param role - The role of the new user. It must not be null and it can only be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to true if the user has been created.
     */
    async createUser(username: string, name: string, surname: string, password: string, role: string) /**:Promise<Boolean> */ {
        return await this.dao.createUser(username, name, surname, password, role)
    }

    /**
     * Returns all users.
     * @returns A Promise that resolves to an array of users.
     */
    async getUsers() /**:Promise<User[]> */ {
        return await this.dao.getAllUsers()
    }

    /**
     * Returns all users with a specific role.
     * @param role - The role of the users to retrieve. It can only be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to an array of users with the specified role.
     */
    async getUsersByRole(role: string) /**:Promise<User[]> */ {
        return await this.dao.getUsersByRole(role);
    }

    /**
     * Returns a specific user.
     * The function has different behavior depending on the role of the user calling it:
     * - Admins can retrieve any user
     * - Other roles can only retrieve their own information
     * @param user
     * @param username - The username of the user to retrieve. The user must exist.
     * @returns A Promise that resolves to the user with the specified username.
     */
    async getUserByUsername(user: User, username: string) /**:Promise<User> */ {
        if (user.role !== Role.ADMIN) {
            if (user.username !== username) {
                throw new UserNotAdminError();
            }
            return await this.dao.getUserByUsername(username);
        }
        return await this.dao.getUserByUsername(username);
    }

    /**
     * Deletes a specific user
     * The function has different behavior depending on the role of the user calling it:
     * - Admins can delete any non-Admin user
     * - Other roles can only delete their own account
     * @param user - The usere logged in
     * @param username - The username of the user to delete. The user must exist.
     * @returns A Promise that resolves to true if the user has been deleted.
     */
    async deleteUser(user: User, username: string) /**:Promise<Boolean> */ {
        console.log("delete chiamato")
        if (user.role !== Role.ADMIN) {
            if (user.username !== username) {
                throw new UserNotAdminError();
            }
            return await this.dao.deleteUserByUsername(user.username, username);
        }
        return await this.dao.deleteUserByUsername(user.username, username);
    }

    /**
     * Deletes all non-Admin users
     * @returns A Promise that resolves to true if all non-Admin users have been deleted.
     */
    async deleteAll() {
        return await this.dao.deleteAllUsers();
    }

    /**
     * Updates the personal information of one user. The user can only update their own information.
     * @param user The user who wants to update their information
     * @param name The new name of the user
     * @param surname The new surname of the user
     * @param address The new address of the user
     * @param birthdate The new birthdate of the user
     * @param username The username of the user to update. It must be equal to the username of the user parameter.
     * @returns A Promise that resolves to the updated user
     */
    async updateUserInfo(user: User, name: string, surname: string, address: string, birthdate: string, username: string) /**:Promise<User> */ {
        if (user.role !== Role.ADMIN) {
            if (user.username !== username) {
                throw new UserNotAdminError();
            }
            return await this.dao.updateUser(user.username, name, surname, address, birthdate, username);
        }
        return await this.dao.updateUser(user.username, name, surname, address, birthdate, username);
    }
}

export default UserController