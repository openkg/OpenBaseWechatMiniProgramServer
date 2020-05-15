const MongoClient = require("mongodb").MongoClient;
const Mongo = require("mongodb");
const assert = require('assert');
const config = require('config');

let _db;
let _colName;

// Use connect method to connect to the server
async function testDBConnection() {
    try {
        const dbClient = await MongoClient.connect(url, { useUnifiedTopology: true });
        console.log("Connected successfully to server");
        const db = dbClient.db(dbName);
        //--------------------------------------------------------------------------------
        // insert documents
        //const result = await insertDocuments(db);
        //console.log(result.result);
        //-------------------------------------------------------------------------------
        // find documents
        // const docArray = await findDocuments(db);
        // console.log(docArray);
        //--------------------------------------------------------------------------------
        // update documents
        //const result = await updateDocuments(db);
        //console.log(result.result)
        //--------------------------------------------------------------------------------------
        // remove documents
        //const result = await removeDocuments(db);
        //console.log(result.result)
        //---------------------------------------------------------------------------------
        //const result = await getDbStats(db);
        //console.log(result)
        //-------------------------------------------------------------------------------------
        const docArray = await findDocumentsPaginationResult(db, 6, 5);
        console.log(docArray);


        // clean up connection resource
        dbClient.close();
    } catch (error) {
        console.log(`DB Connection Error: ${error.message}`);
        process.exit(1)
    }
}

async function insertDocuments(db) {
    try {
        const collection = db.collection('myTestCol');
        const result = await collection.insertOne({ name: "Mike Bloomberg", age: 35 })
        return result
    } catch (error) {
        console.log(`DB insert documents Error: ${error.message}`);
        process.exit(1)
    }
}

async function findDocuments(db) {
    try {
        const collection = db.collection("myTestCol");
        const result = collection.find({ age: 35 }).toArray();
        return result
    } catch (error) {
        console.log(`DB find documents Error: ${error.message}`);
        process.exit(1)
    }
}

async function updateDocuments(db) {
    try {
        const collection = db.collection("myTestCol");
        const result = collection.updateOne({ name: "Jack Jones" }, { $set: { age: 30 } });
        return result
    } catch (error) {
        console.log(`DB update documents Error: ${error.message}`);
        process.exit(1)
    }
}

async function removeDocuments(db) {
    try {
        const collection = db.collection("myTestCol");
        const result = collection.deleteOne({ name: "Jack Jones" });
        return result
    } catch (error) {
        console.log(`DB remove documents Error: ${error.message}`);
        process.exit(1)
    }
}

async function getDbStats(db) {
    try {
        const result = await db.command({ 'dbStats': 1 })
        return result
    } catch (error) {
        console.log(`DB get status Error: ${error.message}`);
        process.exit(1)
    }
}

async function findAllDocumentsCount() {
    try {
        const collection = _db.collection(_colName);
        const result = await collection.estimatedDocumentCount();
        return result
    } catch (error) {
        console.log(`DB findRandomFiveDocuments result Error: ${error.message}`);
        process.exit(1)
    }
}

async function findAllDocumentsCountWithID(search_id) {
    // search_id could be @name or @id or _id !
    try {
        const collection = _db.collection(_colName);
        const name_cnt = await collection.count({"@name":search_id});
        if (name_cnt <= 0){
            const atID_cnt = await collection.count({"@id":search_id});
            if (atID_cnt <= 0){
                const o_id = new Mongo.ObjectID(search_id)
                const underScoreID_cnt = await collection.count({"_id":o_id});
                return underScoreID_cnt;
            }else{
                return atID_cnt;
            }
        }else{
            return name_cnt;
        }
    } catch (error) {
        console.log(`DB findRandomFiveDocuments result Error: ${error.message}`);
        process.exit(1)
    }
}

async function findDocumentsPaginationResult(pageNumber, pageSize) {
    try {
        const collection = _db.collection(_colName);
        const result = await collection.find({}).skip((pageNumber - 1) * pageSize).limit(pageSize).toArray();
        return result
    } catch (error) {
        console.log(`DB findDocuments with Pagination result Error: ${error.message}`);
        process.exit(1)
    }
}

async function findDocumentsPaginationResultWithID(search_id, pageNumber, pageSize) {
    try {
        const collection = _db.collection(_colName);
        const name_docArray = await collection.find({ "@name": search_id }).skip((pageNumber - 1) * pageSize).limit(pageSize).toArray();
        if (name_docArray.length <= 0){
            const atID_docArray = await collection.find({ "@id": search_id }).skip((pageNumber - 1) * pageSize).limit(pageSize).toArray();
            if (atID_docArray.length <= 0){
                const o_id = new Mongo.ObjectID(search_id)
                const underScoreID_docArray = await collection.find({ "_id": o_id }).skip((pageNumber - 1) * pageSize).limit(pageSize).toArray();
                return underScoreID_docArray;
            }else{
                return atID_docArray;
            }
        }else{
            return name_docArray;
        }
        
    } catch (error) {
        console.log(`DB findDocuments with Pagination result Error: ${error.message}`);
        process.exit(1)
    }
}

async function findOneUserByPhoneNumber(phoneNumber){
    try {
        const collection = _db.collection(_colName);
        const foundUser = await collection.findOne({ "phoneNumber": phoneNumber });
        return foundUser;
    } catch (error) {
        console.log(`DB findUserByPhoneNumber result Error: ${error.message}`);
        process.exit(1)
    }
}

async function findOneUserByUserID(userID){
    try {
        const collection = _db.collection(_colName);
        const foundUser = await collection.findOne({ "id": userID });
        return foundUser;
    } catch (error) {
        console.log(`DB findOneUserByUserID result Error: ${error.message}`);
        process.exit(1)
    }
}

async function insertOne(userObj){
    try {
        const collection = _db.collection(_colName);
        const result = await collection.insertOne(userObj);
        return result;
    } catch (error) {
        console.log(`DB insertOne result Error: ${error.message}`);
        process.exit(1)
    }
}

async function deleteOne(underScoreID){
    try {
        const collection = _db.collection(_colName);
        const result = await collection.remove({_id: new Mongo.ObjectID(underScoreID)});
        return result;
    } catch (error) {
        console.log(`DB deleteOne result Error: ${error.message}`);
        process.exit(1)
    }
}

async function updateOne(updatedObj){
    try {
        const collection = _db.collection(_colName);
        updatedObj["_id"] = new Mongo.ObjectID(updatedObj["_id"]);
        const result = await collection.replaceOne({_id: updatedObj["_id"]}, updatedObj);
        return result;
    } catch (error) {
        console.log(`DB updateOne result Error: ${error.message}`);
        process.exit(1)
    }
}


function initDb(connUrl,dbName,colName,callback) {
    if (_db) {
        console.warn("Trying to init DB again!");
        return callback(null, _db);
    }
    //client.connect(url, { useUnifiedTopology: true }, connected);
    MongoClient.connect(connUrl, { useUnifiedTopology: true }, connected)

    function connected(err, client) {
        if (err) {
            return callback(err);
        }
        console.log("DB initialized - connected to: " + connUrl.split("//")[1]);
        _db = client.db(dbName);
        _colName = colName;
        return callback(null, _db);
    }
}

async function findRandomAttributeSPOs(){
    try {
        const collection = _db.collection(_colName);
        const attributeSPOArray = await collection.aggregate([ { $sample: { size: 1 } } ]).toArray();
        let retSPOArray = [];
        const enCol =  _db.collection(config.get("openbaseDB.entityColName"));
        for(let spo of attributeSPOArray){
            assembledObj = {}; 
            const subObj = await enCol.findOne({"@id":spo["@id"]})
            assembledObj["subject"] = subObj;
            assembledObj["propertyName"] = spo["propertyName"];
            assembledObj["object"] = subObj[assembledObj["propertyName"]][0]["@value"];
            assembledObj["type"] = "attribute";
            retSPOArray.push(assembledObj);
        }
        return retSPOArray;
    } catch (error) {
        console.log(`DB findRandomAttributeSPOs result Error: ${error.message}`);
        process.exit(1)
    }
}

async function incrementUserReviewedSPOCount(userID, delta){
    try {
        const userCol =  _db.collection(config.get("openbaseDB.userColName"));
        const result = await userCol.update({"id": userID},{$inc:{reviewedSPOCount:delta}});
        return result;
    } catch (error) {
        console.log(`DB incrementUserReviewedSPOCount result Error: ${error.message}`);
        process.exit(1)
    }
}

async function findRandomRelationshipSPOs(){
    try {
        const collection = _db.collection(_colName);
        const relationshipSPOArray = await collection.aggregate([ { $sample: { size: 1 } } ]).toArray();
        let retSPOArray = [];
        const enCol = _db.collection(config.get("openbaseDB.entityColName"));
        for(let spo of relationshipSPOArray){
            assembledObj = {};
            const subObj = await enCol.findOne({"@id":spo["@id"]})
            assembledObj["subject"] = subObj;
            assembledObj["propertyName"] = spo["propertyName"];
            const objObj = await enCol.findOne({"appID":subObj[assembledObj["propertyName"]][0]["@refer"]});
            assembledObj["object"] = objObj;
            assembledObj["type"] = "relationship";
            retSPOArray.push(assembledObj);
        }
        return retSPOArray;
    } catch (error) {
        console.log(`DB findRandomRelationshipSPOs result Error: ${error.message}`);
        process.exit(1)
    }
}

async function insertOneLabledSPO(assembledObj){
    try {
        const collection = _db.collection(_colName);
        const targetDocCount = await collection.count({"type":assembledObj["type"],"userID":assembledObj["userID"], "subject.@id":assembledObj["subject"]["@id"], "propertyName":assembledObj["propertyName"], "status":"unfinished"});
        if (targetDocCount <= 0){
            const result = await collection.update({"type":assembledObj["type"],"userID":assembledObj["userID"], "subject.@id":assembledObj["subject"]["@id"], "propertyName":assembledObj["propertyName"], "status":"unfinished"}, assembledObj, {upsert: true});
            return result;
        }else{
            return null;
        }
    } catch (error) {
        console.log(`DB insertOneLabledSPO result Error: ${error.message}`);
        process.exit(1)
    }
}

async function findUnfinishedSPOPaginationResultByUserId(userID, pageNumber, pageSize){
    try {
        const collection = _db.collection(_colName);
        const unfinishedSPOArray = await collection.find({"userID":userID,"type":"attribute", "status":"unfinished"}).skip((pageNumber - 1) * pageSize).limit(pageSize).toArray();
        return unfinishedSPOArray;
    } catch (error) {
        console.log(`DB findUnfinishedSPOByUserId result Error: ${error.message}`);
        process.exit(1)
    }
}

async function getUnfinishedSPOTotalCntByUserId(userID){
    try {
        const collection = _db.collection(_colName);
        const unfinishedSPOCnt = await collection.count({"userID":userID,"type":"attribute", "status":"unfinished"});
        return unfinishedSPOCnt;
    } catch (error) {
        console.log(`DB findUnfinishedSPOTotalCntByUserId result Error: ${error.message}`);
        process.exit(1)
    }
}

async function incrementUserCorrectedSPOCount(userID, delta){
    try {
        const userCol =  _db.collection(config.get("openbaseDB.userColName"));
        const result = await userCol.update({"id": userID},{$inc:{correctedSPOCount:delta}});
        return result;
    } catch (error) {
        console.log(`DB incrementUserCorrectedSPOCount result Error: ${error.message}`);
        process.exit(1)
    }
}

async function totalUserCount(){
    try {
        const userCol =  _db.collection(config.get("openbaseDB.userColName"));
        const tUserCnt = await userCol.count({});
        return tUserCnt;
    } catch (error) {
        console.log(`DB totalUserCount result Error: ${error.message}`);
        process.exit(1)
    }
}

async function userRankedBeforeCount(threshhold, fieldKey){
    try {
        const userCol =  _db.collection(config.get("openbaseDB.userColName"));
        const tUserCnt = await userCol.count({fieldKey: {$gte: threshhold}});
        return tUserCnt;
    } catch (error) {
        console.log(`DB userRankedBeforeCount result Error: ${error.message}`);
        process.exit(1)
    }
}

function getDb() {
    assert.ok(_db, "Db has not been initialized. Please called init first.");
    return _db;
}

function setCurrentCollection(col){
    _colName = col;
}

module.exports = {
    findOneUserByPhoneNumber,
    insertOne,
    initDb,
    setCurrentCollection,
    findRandomAttributeSPOs,
    findRandomRelationshipSPOs,
    insertOneLabledSPO,
    findUnfinishedSPOPaginationResultByUserId,
    getUnfinishedSPOTotalCntByUserId,
    deleteOne,
    updateOne,
    incrementUserReviewedSPOCount,
    incrementUserCorrectedSPOCount,
    totalUserCount,
    userRankedBeforeCount,
    findOneUserByUserID
};