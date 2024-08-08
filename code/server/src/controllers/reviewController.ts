import { User } from "../components/user";
import ReviewDAO from "../dao/reviewDAO";
import { ProductNotFoundError, LowProductStockError } from "../errors/productError";
import { ExistingReviewError, NoReviewProductError } from "../errors/reviewError";
import ProductDAO from "../dao/productDAO";

class ReviewController {
    private dao: ReviewDAO
    private productDAO: ProductDAO;

    constructor() {
        this.dao = new ReviewDAO
        this.productDAO = new ProductDAO;
    }

    /**
     * Adds a new review for a product
     * @param model The model of the product to review
     * @param user The username of the user who made the review
     * @param score The score assigned to the product, in the range [1, 5]
     * @param comment The comment made by the user
     * @returns A Promise that resolves to nothing
     */
    async addReview(model: string, user: User, score: number, comment: string) /**:Promise<void> */ {
        if(model===""){
            throw new ProductNotFoundError;
        }else{
            let comm=comment;
            let productModel=await this.productDAO.getProductByModel(model);
            let previousReview=await this.dao.getReviewsByModelUser(model,user);
            if ( productModel === null){
                throw new ProductNotFoundError;
            }else if(previousReview.length !== 0){
                throw new ExistingReviewError;
            }else{
                return await this.dao.addReview(model,user,score,comm);
            }

        }
     }

    /**
     * Returns all reviews for a product
     * @param model The model of the product to get reviews from
     * @returns A Promise that resolves to an array of ProductReview objects
     */
    async getProductReviews(model: string) /**:Promise<ProductReview[]> */ {
        return await this.dao.getReviewsByModel(model);
    }

    /**
     * Deletes the review made by a user for a product
     * @param model The model of the product to delete the review from
     * @param user The user who made the review to delete
     * @returns A Promise that resolves to nothing
     */
    async deleteReview(model: string, user: User) /**:Promise<void> */ {
        if(model===""){
            throw new ProductNotFoundError;
        }else{ 
            let productModel=await this.productDAO.getProductByModel(model);
            let previousReview=await this.dao.getReviewsByModelUser(model,user);
            if ( productModel === null){
                throw new ProductNotFoundError;
            }else if(previousReview.length == 0){
                throw new NoReviewProductError;
            }else{
                return await this.dao.deleteReviewByModel(model,user);}
            }

    }

    /**
     * Deletes all reviews for a product
     * @param model The model of the product to delete the reviews from
     * @returns A Promise that resolves to nothing
     */
    async deleteReviewsOfProduct(model: string) /**:Promise<void> */ {
        if(model===""){
            throw new ProductNotFoundError;
        }
        else{ 
            let productModel=await this.productDAO.getProductByModel(model);
            if ( productModel === null){
                throw new ProductNotFoundError;
            }else{
                return await this.dao.deleteAllReviewsByModel(model);}
            }
        
     }

    /**
     * Deletes all reviews of all products
     * @returns A Promise that resolves to nothing
     */
    async deleteAllReviews() /**:Promise<void> */ {
        return await this.dao.deleteAllReviews();
     }
}

export default ReviewController;