/**
 * Represents a review given by a customer to a purchased product
 */
class ProductReview {
    model: string
    user: string
    score: number
    date: string
    comment: string

    /**
     * Creates a new instance of the ProductReview class.
     * @param model The model of the reviewed product
     * @param user The username of the user who wrote the review
     * @param score The score assigned to the product, from 1 to 5
     * @param date The date in which the product was reviewed
     * @param comment The comment left by the customer
     */
    constructor(model: string, user: string, score: number, date: string, comment: string) {
        this.model = model
        this.user = user
        this.score = score
        this.date = date
        this.comment = comment
    }
}

export { ProductReview }