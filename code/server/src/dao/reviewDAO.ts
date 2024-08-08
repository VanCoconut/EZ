import db from "../db/db";
import {ProductReview} from "../components/review";
import { User } from "../components/user"
import dayjs from "dayjs";
/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {
    
    addReview(model: string, user: User, score: number, comment: string){
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sql = "INSERT INTO reviews(model, user, score, date, comment) VALUES(?, ?, ?, ?,  ?)"
                db.run(sql, [model, user.username, score, dayjs().format('YYYY-MM-DD'), comment], (err: Error | null) => {
                    if (err) {
                        reject(err)
                    }
                    resolve(true)
                })
            } catch (error) {
                //console.log(error)
                reject(error)
            }

        })
    }
    /**
     * Retrieves treviewa of a given model from the database.
     * @param model Model of the product of the reviews
     * @returns A Promise that resolves to an array of Reviewa returned or to null if no reviews are found
     */
        getReviewsByModel(model:string): Promise<ProductReview[]>{
            return new Promise<ProductReview[]>((resolve,reject)=>{
                try{
                    const sql = `SELECT * FROM reviews WHERE model=?`;
                    db.all(sql,[model],(err:Error|null, rows:any)=>{
                        if(err)
                            reject(err);
                        else
                            resolve(rows.map((row:any)=>(new ProductReview(row.model, row.user, row.score, row.date, row.comment))));
                    });
                }
                catch (err){
                    //console.log(err)
                    reject(err);
                }
            });
        }

            /**
             * utility function
             * Retrieves treviewa of a given model from the database.
             * @param model Model of the product of the reviews
             * @returns A Promise that resolves to an array of Reviewa returned or to null if no reviews are found
             */

        getReviewsByModelUser(model:string,user:User): Promise<ProductReview[]>{
            return new Promise<ProductReview[]>((resolve,reject)=>{
                try{
                    const sql = `SELECT * FROM reviews WHERE model=? AND user=?`;
                    db.all(sql,[model,user.username],(err:Error|null, rows:any)=>{
                        if(err)
                            reject(err);
                        else
                            resolve(rows.map((row:any)=>(new ProductReview(row.model, row.user, row.score, row.date, row.comment))));
                    });
                }
                catch (err){
                    reject(err);
                }
            });
        }
    /**
     * Delete the review of a specific model made by the current user
     * @param model Model of the product of the reviews
     * @param user User logged-in
     * @returns A Promise that resolves to a boolean
     */
    deleteReviewByModel(model: string, user: User) {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sql = `DELETE FROM reviews WHERE model=? AND user=?`;
                db.run(sql, [model, user.username], function(err: Error | null) {
                    if (err) {
                        reject(err);
                    } else {
                        if (this.changes > 0) 
                            resolve(true);
                        else
                            resolve(false);
                    }
                });
            } catch (err) {
                //console.log(err)
                reject(err);
            }
        });
    }

      /**
     * Delete the review of a specific model made by the current user
     * @param model Model of the product of the reviews
     * @param user User logged-in
     * @returns A Promise that resolves to a boolean
     */
      deleteAllReviewsByModel(model: string) {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sql = `DELETE FROM reviews WHERE model=?`;
                db.run(sql, [model], function(err: Error | null) {
                    if (err) {
                        reject(err);
                    } else {
                        if (this.changes > 0) 
                            resolve(true);
                        else
                            resolve(false);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Delete all the reviews 
     * @returns A Promise that resolves to a boolean
     */
    deleteAllReviews() {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sql = `DELETE FROM reviews `;
                db.run(sql, function(err: Error | null) {
                    if (err) {
                        reject(err);
                    } else {
                        if (this.changes > 0) 
                            resolve(true);
                        else
                            resolve(false);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }
}

export default ReviewDAO;