import React from "react"

const UserContext = React.createContext<User | undefined>(undefined)

class User {
    username: string
    name: string
    surname: string
    role: string

    constructor(username: string, name: string, surname: string, role: string) {
        this.username = username
        this.name = name
        this.surname = surname
        this.role = role
    }
}


enum ROLES {
    MANAGER = "Manager",
    CUSTOMER = "Customer",
    ADMIN = "Admin"
}

export { UserContext, User, ROLES }