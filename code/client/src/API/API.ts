import { User } from "../Components/Login/UserContext";
import { Product } from "../Models/product";
import { UserInfo } from "../Models/user";


const baseURL = "http://localhost:3001/ezelectronics/"

/** ------------------- Access APIs ------------------------ */

async function login(username: string, password: string) {
    let response = await fetch(baseURL + "sessions", {
        method: 'POST',
        credentials: "include",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username, password: password },)
    })
    if (response.ok) {
        const user = await response.json()
        return user
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message

        throw new Error("Something went wrong")
    }
}

async function logOut() {
    await fetch(baseURL + 'sessions/current', { method: 'DELETE', credentials: "include" });
}

async function getUserInfo() {
    const response = await fetch(baseURL + 'sessions/current', { credentials: "include" })
    if (response.ok) {
        const user = await response.json()
        return user;
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message
        throw new Error("Error. Please reload the page")
    }
}

/** ------------------- User APIs ------------------------ */


async function register(username: string, name: string, surname: string, password: string, role: string) {
    let response = await fetch(baseURL + "users", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username, name: name, surname: surname, password: password, role: role },)
    })
    if (response.ok) {
        return
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message

        throw new Error("Something went wrong")
    }
}

async function getUserByUsername(username: string) {
    const response = await fetch(baseURL + "users/" + username, { credentials: "include" })
    if (response.ok) {
        const user = await response.json()
        return new UserInfo(user.username, user.name, user.surname, user.role, user.address, user.birthdate)
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message
        throw new Error("Error. Please reload the page")
    }
}

async function updateUserInfo(username: string, name: string, surname: string, address: string, birthdate: string) {
    const response = await fetch(baseURL + "users/" + username, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name, surname: surname, address: address, birthdate: birthdate },),
        credentials: "include"
    })
    if (response.ok) {
        return
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message

        throw new Error("Something went wrong")
    }
}

async function deleteUser(username: string) {
    let response = await fetch(baseURL + "users/" + username, {
        method: 'DELETE',
        credentials: "include"
    })
    if (response.ok) {
        return
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message

        throw new Error("Something went wrong")
    }
}

async function getAllUsers() {
    const response = await fetch(baseURL + "users", { credentials: "include" })
    if (response.ok) {
        const users = await response.json()
        return users
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message
        throw new Error("Error. Please reload the page")
    }

}

async function getUsersByRole(role: string) {
    const response = await fetch(baseURL + "users/roles/" + role, { credentials: "include" })
    if (response.ok) {
        const users = await response.json()
        return users
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message
        throw new Error("Error. Please reload the page")
    }

}

async function deleteAllUsers() {
    let response = await fetch(baseURL + "users", {
        method: 'DELETE',
        credentials: "include"
    })
    if (response.ok) {
        return
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message
        throw "Something went wrong"
    }
}

/** ------------------- Product APIs ------------------------ */

async function registerProducts(productInfo: Product) {
    let response = await fetch(baseURL + "products", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ model: productInfo.model, category: productInfo.category, details: productInfo.details, sellingPrice: productInfo.sellingPrice, quantity: productInfo.quantity, arrivalDate: productInfo.arrivalDate })
    })

    if (response.ok) {
        return
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message

        throw "Something went wrong"
    }
}

async function changeProductQuantity(model: string, quantity: number, changeDate: string | null) {
    let response = await fetch(baseURL + "products/" + model, {
        method: 'PATCH',
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ quantity: quantity, changeDate: changeDate })
    })
    if (response.ok) {
        const quantity = await response.json()
        return quantity
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message

        throw "Something went wrong"
    }
}

async function sellProduct(model: string, quantity: number, sellingDate: string | null) {
    let response = await fetch(baseURL + "products/" + model + "/sell", {
        method: 'PATCH',
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ quantity: quantity, sellingDate: sellingDate })
    })
    if (response.ok) {
        return
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message

        throw "Something went wrong"
    }
}

async function getProducts(grouping: string | null, category: string | null, model: string | null) {
    let url = baseURL + "products"
    if (grouping || category || model) {
        url += "?"
        if (grouping)
            url += "grouping=" + grouping + "&"
        if (category)
            url += "category=" + category + "&"
        if (model)
            url += "model=" + model + "&"
    }
    const response = await fetch(url, { credentials: "include" })
    if (response.ok) {
        const products = await response.json()
        return products
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message
    }
}

async function getAvailableProducts(grouping: string | null, category: string | null, model: string | null) {
    let url = baseURL + "products/available"
    if (grouping || category || model) {
        url += "?"
        if (grouping)
            url += "grouping=" + grouping + "&"
        if (category)
            url += "category=" + category + "&"
        if (model)
            url += "model=" + model + "&"
    }
    const response = await fetch(url, { credentials: "include" })
    if (response.ok) {
        const products = await response.json()
        return products
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message

        throw new Error("Error. Please reload the page")
    }
}

async function deleteAllProducts() {
    let response = await fetch(baseURL + "products", {
        method: 'DELETE',
        credentials: "include"
    })
    if (response.ok) {
        return
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message

        throw "Something went wrong"
    }
}

async function deleteProduct(model: string) {
    let response = await fetch(baseURL + "products/" + model, {
        method: 'DELETE',
        credentials: "include"
    })
    if (response.ok) {
        return
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message
        throw "Something went wrong"
    }

}

/** ------------------- Cart APIs ------------------------ */

async function getCart() {
    const response = await fetch(baseURL + "carts", { credentials: "include" })
    if (response.ok) {
        const cart = await response.json()
        return cart
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message
        throw new Error("Error. Please reload the page")
    }
}

async function addToCart(model: string) {
    let response = await fetch(baseURL + "carts", {
        method: 'POST',
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ model: model })
    })
    if (response.ok) {
        return
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message

        throw "Something went wrong"
    }
}

async function checkoutCart() {
    let response = await fetch(baseURL + "carts/", {
        method: 'PATCH',
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        }
    })
    if (response.ok) {
        return
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message

        throw "Something went wrong"
    }
}

async function getCustomerCarts() {
    const response = await fetch(baseURL + "carts/history", { credentials: "include" })
    if (response.ok) {
        const carts = await response.json()
        return carts
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message
        throw new Error("Error. Please reload the page")
    }
}

async function removeProductFromCart(model: string) {
    let response = await fetch(baseURL + "carts/products/" + model, {
        method: 'DELETE',
        credentials: "include"
    })
    if (response.ok) {
        return
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message

        throw "Something went wrong"
    }
}

async function clearCart() {
    let response = await fetch(baseURL + "carts/current", {
        method: 'DELETE',
        credentials: "include"
    })
    if (response.ok) {
        return
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message

        throw "Something went wrong"
    }
}

async function deleteAllCarts() {
    let response = await fetch(baseURL + "carts", {
        method: 'DELETE',
        credentials: "include"
    })
    if (response.ok) {
        return
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message

        throw "Something went wrong"
    }
}

async function getAllCarts() {
    const response = await fetch(baseURL + "carts/all", { credentials: "include" })
    if (response.ok) {
        const carts = await response.json()
        return carts
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message
        throw new Error("Error. Please reload the page")
    }

}

/** ------------------- Review APIs ------------------------ */

async function addReview(model: string, score: number, comment: string) {
    let response = await fetch(baseURL + "reviews/" + model, {
        method: 'POST',
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ score: score, comment: comment })
    })
    if (response.ok) {
        return
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message
        throw "Something went wrong"
    }
}

async function getProductReviews(model: string) {
    const response = await fetch(baseURL + "reviews/" + model, { credentials: "include" })
    if (response.ok) {
        const reviews = await response.json()
        return reviews
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message
        throw new Error("Error. Please reload the page")
    }
}

async function deleteProductReview(model: string) {
    let response = await fetch(baseURL + "reviews/" + model, {
        method: 'DELETE',
        credentials: "include"
    })
    if (response.ok) {
        return
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message
        throw "Something went wrong"
    }
}

async function deleteReviewsOfProduct(model: string) {
    let response = await fetch(baseURL + "reviews/" + model + "/all", {
        method: 'DELETE',
        credentials: "include"
    })
    if (response.ok) {
        return
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message
        throw "Something went wrong"
    }

}

async function deleteAllReviews() {
    let response = await fetch(baseURL + "reviews", {
        method: 'DELETE',
        credentials: "include"
    })
    if (response.ok) {
        return
    } else {
        const errDetail = await response.json();
        if (errDetail.error)
            throw errDetail.error
        if (errDetail.message)
            throw errDetail.message
        throw "Something went wrong"
    }
}

const API = {
    login, logOut, getUserInfo,
    register, getUserByUsername, updateUserInfo, deleteUser, getAllUsers, getUsersByRole, deleteAllUsers,
    registerProducts, changeProductQuantity, sellProduct, getProducts, getAvailableProducts, deleteAllProducts, deleteProduct,
    getCart, addToCart, checkoutCart, getCustomerCarts, removeProductFromCart, clearCart, deleteAllCarts, getAllCarts,
    addReview, getProductReviews, deleteProductReview, deleteReviewsOfProduct, deleteAllReviews
}
export default API