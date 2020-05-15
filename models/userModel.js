const setCurrentCollection = require("./db").setCurrentCollection;
const findOneUserByPhoneNumber = require("./db").findOneUserByPhoneNumber;
const findOneUserByUserID = require("./db").findOneUserByUserID;
const insertOne = require("./db").insertOne;
const config = require('config')

async function findOneByPhoneNumber(phoneNumber){
    setCurrentCollection(config.get("openbaseDB.userColName"));
    const user = await findOneUserByPhoneNumber(phoneNumber);
    return user;
}

async function findOneByUserID(userID){
    setCurrentCollection(config.get("openbaseDB.userColName"));
    const user = await findOneUserByUserID(userID);
    return user;
}

async function insertOneUser(userObj){
    setCurrentCollection(config.get("openbaseDB.userColName"));
    const result = await insertOne(userObj);
    return result;
}


module.exports = {
    findOneByPhoneNumber,
    findOneByUserID,
    insertOneUser
};