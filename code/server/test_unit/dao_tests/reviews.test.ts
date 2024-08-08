import {describe, expect, jest, test} from "@jest/globals"
import ReviewDAO from "../../src/dao/reviewDAO";
import db from "../../src/db/db";
import {Database} from "sqlite3";
import {Role, User} from "../../src/components/user";
import {ProductReview} from "../../src/components/review";

jest.mock("../../src/db/db")
describe("testing unit 'reviewDAO.ts'", ()=>{
    const rdao = new ReviewDAO()
    beforeEach(()=>{
        jest.spyOn(db,'run').mockReset()
        jest.spyOn(db, 'all').mockReset()
    })
    describe("testing 'ReviewDAO.addReview()'", ()=>{
        const inputParams = {
            model: 'test-model',
            user:new User('test-username', 'test-name', 'test-surname', Role.CUSTOMER, 'test-address', 'test-birthdate'),
            score:0,
            comment:'test-comment'
        };
        test("RDU1: should return true", async ()=>{
            jest.spyOn(db,'run').mockImplementation((sql,params,callback)=>{
                callback(null)
                return {} as Database
            })
            const result = await rdao.addReview(inputParams.model,inputParams.user,inputParams.score, inputParams.comment)
            expect(result).toBe(true)
            expect(db.run).toHaveBeenCalled()
        })
        test("RDU2: should throw in case of sqlite errors", async ()=>{
            let err = new Error('test-error')
            jest.spyOn(db,'run').mockImplementation((sql,params,callback)=>{
                callback(err, null)
                return {} as Database
            })

            let thrown = null;
            await rdao.addReview(inputParams.model,inputParams.user,inputParams.score, inputParams.comment).catch(got=>{thrown=got})
            expect(db.run).toHaveBeenCalled()
            expect(thrown).toBe(err)
        })
        test("RDU3: should throw in case of generic errors", async ()=>{
            let err = new Error('test-error')
            jest.spyOn(db,'run').mockImplementation((sql,params,callback)=>{
                throw err
            })
            let thrown = null;
            await rdao.addReview(inputParams.model,inputParams.user,inputParams.score, inputParams.comment).catch(got=>{thrown=got})
            expect(db.run).toHaveBeenCalled()
            expect(thrown).toBe(err)
        })

    })
    describe("testing 'ReviewDAO.getReviewsByModel()'", ()=>{
        const testModel = 'test-model';
        const sampleReviews:any[] = [{
            model: 'test-model',
            user: new User('test-username', 'test-name', 'test-surname', Role.CUSTOMER, 'test-address', 'test-birthdate'),
            score: 0,
            date:'2004-04-03',
            comment: 'test-comment'
        }];
        const expectedReviews = sampleReviews.map((revw:any)=>(new ProductReview(revw.model, revw.user, revw.score, revw.date, revw.comment)))
        test("RDU4: should return array of ProductReview", async ()=>{
            jest.spyOn(db,'all').mockImplementation((sql,params,callback)=>{
                callback(null, sampleReviews)
                return {} as Database
            })
            const result = await rdao.getReviewsByModel(testModel)
            expect(result).toStrictEqual(expectedReviews)
            expect(db.all).toHaveBeenCalled()
        })
        test("RDU5: should throw in case of sqlite errors", async ()=>{
            let err = new Error('test-error')
            jest.spyOn(db,'all').mockImplementation((sql,params,callback)=>{
                callback(err, sampleReviews)
                return {} as Database
            })

            let thrown = null;
            await rdao.getReviewsByModel(testModel).catch(got=>{thrown=got})
            expect(db.all).toHaveBeenCalled()
            expect(thrown).toBe(err)
        })
        test("RDU6: should throw in case of generic errors", async ()=>{
            let err = new Error('test-error')
            jest.spyOn(db,'all').mockImplementation((sql,params,callback)=>{
                throw err;
            })

            let thrown = null;
            await rdao.getReviewsByModel(testModel).catch(got=>{thrown=got})
            expect(db.all).toHaveBeenCalled()
            expect(thrown).toBe(err)
        })
    })
    describe("testing 'ReviewDAO.getReviewsByModelUser()'", ()=>{
        const testModel = 'test-model';
        const testUser = new User('test-username', 'test-name', 'test-surname', Role.CUSTOMER, 'test-address', 'test-birthdate')
        const sampleReviews:any[] = [{
            model: 'test-model',
            user: new User('test-username', 'test-name', 'test-surname', Role.CUSTOMER, 'test-address', 'test-birthdate'),
            score: 0,
            date:'2004-04-03',
            comment: 'test-comment'
        }];
        const expectedReviews = sampleReviews.map((revw:any)=>(new ProductReview(revw.model, revw.user, revw.score, revw.date, revw.comment)))
        test("RDU7: should return array of ProductReview", async ()=>{
            jest.spyOn(db,'all').mockImplementation((sql,params,callback)=>{
                callback(null, sampleReviews)
                return {} as Database
            })
            const result = await rdao.getReviewsByModelUser(testModel, testUser)
            expect(result).toStrictEqual(expectedReviews)
            expect(db.all).toHaveBeenCalled()
        })
        test("RDU8: should throw in case of sqlite errors", async ()=>{
            let err = new Error('test-error')
            jest.spyOn(db,'all').mockImplementation((sql,params,callback)=>{
                callback(err, sampleReviews)
                return {} as Database
            })

            let thrown = null;
            await rdao.getReviewsByModelUser(testModel, testUser).catch(got=>{thrown=got})
            expect(db.all).toHaveBeenCalled()
            expect(thrown).toBe(err)
        })
        test("RDU9: should throw in case of generic errors", async ()=>{
            let err = new Error('test-error')
            jest.spyOn(db,'all').mockImplementation((sql,params,callback)=>{
                throw err;
            })

            let thrown = null;
            await rdao.getReviewsByModelUser(testModel, testUser).catch(got=>{thrown=got})
            expect(db.all).toHaveBeenCalled()
            expect(thrown).toBe(err)
        })
    })
    describe("testing 'ReviewDAO.deleteReviewByModel()'", ()=>{
        const testModel = 'test-model';
        const testUser = new User('test-username', 'test-name', 'test-surname', Role.CUSTOMER, 'test-address', 'test-birthdate')
        test("RDU10: should resolve to true", async ()=>{
            const changes = 3
            jest.spyOn(db,'run').mockImplementation((sql,params,callback)=>{
                callback.call({changes:changes},null)
                return {} as Database
            })
            const result = await rdao.deleteReviewByModel(testModel, testUser)
            expect(result).toBe(true)
            expect(db.run).toHaveBeenCalled()
        })
        test("RDU11: should resolve to false", async ()=>{
            const changes = 0
            jest.spyOn(db,'run').mockImplementation((sql,params,callback)=>{
                callback.call({changes:changes},null)
                return {} as Database
            })
            const result = await rdao.deleteReviewByModel(testModel, testUser)
            expect(result).toBe(false)
            expect(db.run).toHaveBeenCalled()
        })
        test("RDU12: should throw in case of sqlite errors", async ()=>    {
            const changes = 3
            let err = new Error('test-error')
            jest.spyOn(db,'run').mockImplementation((sql,params,callback)=>{
                callback.call({changes:changes}, err)
                return {} as Database
            })

            let thrown = null;
            await rdao.deleteReviewByModel(testModel, testUser).catch(got=>{thrown=got})
            expect(db.run).toHaveBeenCalled()
            expect(thrown).toBe(err)
        })
        test("RDU13: should throw in case of generic errors", async ()=>{
            let changes = 3
            let err = new Error('test-error')
            jest.spyOn(db,'run').mockImplementation((sql,params,callback)=>{
                throw err;
            })

            let thrown = null;
            await rdao.deleteReviewByModel(testModel, testUser).catch(got=>{thrown=got})
            expect(db.run).toHaveBeenCalled()
            expect(thrown).toBe(err)
        })
    })
    describe("testing 'ReviewDAO.deleteAllReviewsByModel()'", ()=>{
        const testModel = 'test-model';
        test("RDU14: should resolve to true", async ()=>{
            const changes = 3
            jest.spyOn(db,'run').mockImplementation((sql,params,callback)=>{
                callback.call({changes:changes},null)
                return {} as Database
            })
            const result = await rdao.deleteAllReviewsByModel(testModel)
            expect(result).toBe(true)
            expect(db.run).toHaveBeenCalled()
        })
        test("RDU15: should resolve to false", async ()=>{
            const changes = 0
            jest.spyOn(db,'run').mockImplementation((sql,params,callback)=>{
                callback.call({changes:changes},null)
                return {} as Database
            })
            const result = await rdao.deleteAllReviewsByModel(testModel)
            expect(result).toBe(false)
            expect(db.run).toHaveBeenCalled()
        })
        test("RDU16: should throw in case of sqlite errors", async ()=>    {
            const changes = 3
            let err = new Error('test-error')
            jest.spyOn(db,'run').mockImplementation((sql,params,callback)=>{
                callback.call({changes:changes}, err)
                return {} as Database
            })

            let thrown = null;
            await rdao.deleteAllReviewsByModel(testModel).catch(got=>{thrown=got})
            expect(db.run).toHaveBeenCalled()
            expect(thrown).toBe(err)
        })
        test("RDU17: should throw in case of generic errors", async ()=>{
            let changes = 3
            let err = new Error('test-error')
            jest.spyOn(db,'run').mockImplementation((sql,params,callback)=>{
                throw err;
            })

            let thrown = null;
            await rdao.deleteAllReviewsByModel(testModel).catch(got=>{thrown=got})
            expect(db.run).toHaveBeenCalled()
            expect(thrown).toBe(err)
        })
    })
    describe("testing 'ReviewDAO.deleteAllReviews()'", ()=>{
        test("RDU18: should resolve to true", async ()=>{
            const changes = 3
            jest.spyOn(db,'run').mockImplementation((sql,callback)=>{
                callback.call({changes:changes},null)
                return {} as Database
            })
            const result = await rdao.deleteAllReviews()
            expect(result).toBe(true)
            expect(db.run).toHaveBeenCalled()
        })
        test("RDU19: should resolve to false", async ()=>{
            const changes = 0
            jest.spyOn(db,'run').mockImplementation((sql,callback)=>{
                callback.call({changes:changes},null)
                return {} as Database
            })
            const result = await rdao.deleteAllReviews()
            expect(result).toBe(false)
            expect(db.run).toHaveBeenCalled()
        })
        test("RDU20: should throw in case of sqlite errors", async ()=>    {
            const changes = 3
            let err = new Error('test-error')
            jest.spyOn(db,'run').mockImplementation((sql,callback)=>{
                callback.call({changes:changes}, err)
                return {} as Database
            })

            let thrown = null;
            await rdao.deleteAllReviews().catch(got=>{thrown=got})
            expect(db.run).toHaveBeenCalled()
            expect(thrown).toBe(err)
        })
        test("RDU21: should throw in case of generic errors", async ()=>{
            let changes = 3
            let err = new Error('test-error')
            jest.spyOn(db,'run').mockImplementation((sql,callback)=>{
                throw err;
            })

            let thrown = null;
            await rdao.deleteAllReviews().catch(got=>{thrown=got})
            expect(db.run).toHaveBeenCalled()
            expect(thrown).toBe(err)
        })
    })
})