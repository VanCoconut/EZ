class ProductReview {
    id: number
    model: string
    user: string
    score: number
    date: string
    comment: string

    constructor(id: number, model: string, user: string, score: number, date: string, comment: string) {
        this.id = id
        this.model = model
        this.user = user
        this.score = score
        this.date = date
        this.comment = comment
    }
}

export { ProductReview }