const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const cache = require('../models/cache');
const config = require('config')
const uuidToHex = require('uuid-to-hex');
const uuidv4 = require('uuid/v4');
const database = require("../models/db");

var WXBizDataCrypt = require('./WXBizDataCrypt')

const QcloudSms = require("qcloudsms_js");

exports.allowIfLoggedin = async (req, res, next) => {
  try {
    const userId = res.locals.loggedInUserId;
    if (!userId)
      return res.status(401).json({
        error: "You need to be logged in to access this route"
      });
    req.userId = userId;
    next();
  } catch (error) {
    next(error);
  }
}

exports.checkAccessToken = async  (req, res, next) => {
  if (req.headers["x-access-token"]) {
    try {
      const accessToken = req.headers["x-access-token"];
      const { userId, exp } = await jwt.verify(accessToken, config.get("jwtScrectKey"));
      // If token has expired
      if (exp < Date.now().valueOf() / 1000) {
        return res.status(401).json({
          error: "JWT token has expired, please login to obtain a new one"
        });
      }
      //res.locals.loggedInUser = await User.findById(userId);
      res.locals.loggedInUserId = userId;
      next();
    } catch (error) {
      res.status(401).send({msg:`Invalid jwt token: ${error.message}`, code:"-1"});
      return;
      //next(error);
    }
  } else {
    res.status(401).send({msg:"请求需要在header中设置x-access-token", code:"-1"});
    return;
    //next();
  }
}

exports.signup = async (req, res) => {

  const { name, password, smscode, email, organization, favoriteList, phoneNumber } = req.body

  if (!name.trim()) {
    const ret_dict = {
      msg: "姓名(name)字段不能为空!",
      code: "-1"
    }
    res.status(200).send(ret_dict);
    return;
  }

  const pwdPattern = /^\w{6,14}$/;
  if (!password || !password.match(pwdPattern)) {
    const ret_dict = {
      msg: "Invalid 密码: password必须由至少6个数字,字母和下划线字符组成!",
      code: "-1"
    }
    res.status(200).send(ret_dict);
    return;
  }

  const phonePattern = /^1[3|4|5|7|8][0-9]{9}$/;
  if (!phoneNumber || !phoneNumber.match(phonePattern)) {
    const ret_dict = {
      msg: "Invalid 手机号码: phoneNumber是无效的手机号!",
      code: "-1"
    }
    res.status(200).send(ret_dict);
    return;
  }
  const oneResult = await User.findOneByPhoneNumber(phoneNumber);
  if (oneResult) {
    const ret_dict = {
      msg: "Invalid 手机号码: phoneNumber已被注册!",
      code: "-1"
    }
    res.status(200).send(ret_dict);
    return;
  }

  const smscodePattern = /^\d{6}$/;
  if (!smscode || !smscode.match(smscodePattern)) {
    const ret_dict = {
      msg: "Invalid 短信验证码: smscode无效!",
      code: "-1"
    }
    res.status(200).send(ret_dict);
    return;
  }
  
  //console.log("signup pass parameter checking !!")

  try {
    cache.getCache().exists(`smscode:${phoneNumber}:${smscode}`, (err, reply) => {
      //console.log(`signup getCache error: ${err}, replay: ${reply}`);
      if (reply === 1) {
        cache.getCache().del(`smscode:${phoneNumber}:${smscode}`);
        const toSaveUser = { "name": name, "password": password, "phoneNumber": phoneNumber };
        if (email) {
          toSaveUser["email"] = email;
        }
        if (organization) {
          toSaveUser["organization"] = organization;
        }
        if (favoriteList) {
          toSaveUser["favoriteList"] = favoriteList;
        }
        toSaveUser["roleList"] = ["2"]; //signup guest has reviewer role.
        toSaveUser["id"] = uuidToHex(uuidv4());
        console.log(`signup insertOneUser ${toSaveUser}`);
        User.insertOneUser(toSaveUser);
        const accessToken = jwt.sign({ userId: toSaveUser["id"] }, config.get("jwtScrectKey"), {
          expiresIn: "1d"
        });
        const ret_dict = {
          data: toSaveUser,
          accessToken,
          code: "0"
        }
        res.status(200).send(ret_dict);
        return;
      } else {
        const ret_dict = {
          msg: "Invalid 短信验证码: smscode过期了，10分钟!",
          code: "-1"
        }
        res.status(200).send(ret_dict);
        return;
      }
    });
  } catch (error) {
    res.status(500).send(error);
    return;
  }
}

exports.login = async (req, res) => {
  try {
    const appID = "腾讯小程序appID";
    const appSecret = "小程序appSecret";
    const { jsCode, iv, encryptedData } = req.body;

    const { data } = await axios.get(`小程序请求地址${appSecret}${jsCode}`)

    if (!data.session_key) {
      console.log(data);
      res.status(400).send(data);
      return;
    }
    const pc = new WXBizDataCrypt(appID, data.session_key);

    //{phoneNumber, purePhoneNumber, countryCode}
    const decryptedData = pc.decryptData(encryptedData, iv);
    console.log(decryptedData)
    if (!decryptedData.purePhoneNumber) {
      console.log(decryptedData);
      res.status(400).send(decryptedData);
      return;
    }
    const user = await User.findOneByPhoneNumber(decryptedData.purePhoneNumber);

    if (!user) {
      const ret_dict = {
        data: { phoneNumber: decryptedData.purePhoneNumber },
        code: "0"
      }
      res.status(200).send(ret_dict);
      return;
    } else {
      //const validPassword = await validatePassword(password, user.password);
      //if (!validPassword) return next(new Error('Password is not correct'))
      const accessToken = jwt.sign({ userId: user.id }, config.get("jwtScrectKey"), {
        expiresIn: "1d"
      });
      //await User.findByIdAndUpdate(user._id, { accessToken })
      const ret_dict = {
        data: { email: user.email, roleList: user.roleList, id: user.id, phoneNumber: user.phoneNumber, photo: user.photo, name: user.name, favoriteList: user.favoriteList },
        accessToken,
        code: "0"
      }
      res.status(200).send(ret_dict);
      return;
    }
  } catch (error) {
    res.status(500).send(error);
    return;
  }
}

exports.getUsers = async (req, res, next) => {
  const users = await User.find({});
  res.status(200).json({
    data: users
  });
}

exports.getUser = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) return next(new Error('User does not exist'));
    res.status(200).json({
      data: user
    });
  } catch (error) {
    next(error)
  }
}

exports.updateUser = async (req, res, next) => {
  try {
    const { role } = req.body
    const userId = req.params.userId;
    await User.findByIdAndUpdate(userId, { role });
    const user = await User.findById(userId)
    res.status(200).json({
      data: user
    });
  } catch (error) {
    next(error)
  }
}

exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    await User.findByIdAndDelete(userId);
    res.status(200).json({
      data: null,
      message: 'User has been deleted'
    });
  } catch (error) {
    next(error)
  }
}

exports.smscode = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    const phonePattern = /^1[3|4|5|7|8][0-9]{9}$/;
    if (!phoneNumber || !phoneNumber.match(phonePattern)) {
      const ret_dict = {
        msg: "Invalid 手机号码: phoneNumber是无效的手机号!",
        code: "-1"
      }
      res.status(200).send(ret_dict);
      return;
    }

    const prefix = "smscode"
    const smscode = generateNewValidSMSCode();

    // 实例化 QcloudSms
    const qcloudsms = QcloudSms(config.get("smsTencent.appID"), config.get("smsTencent.appKey"));
    // 设置请求回调处理, 这里只是演示，用户需要自定义相应处理回调
    function callback(err, request, resData) {
      if (err) {
        console.log("err: ", err);
        res.status(400).send(err);
        return;
      } else {
        console.log("request data: ", request.req);
        console.log("response data: ", resData);
        // set a 10 minutes expired cache.
        cache.getCache().set(`${prefix}:${phoneNumber}:${smscode}`, `${phoneNumber}:${smscode}`, 'EX', 10 * 60);
        const ret_dict = {
          data: resData,
          code: "0"
        }
        res.status(200).send(ret_dict);
        return;
      }
    }
    const ssender = qcloudsms.SmsSingleSender();
    const params = [smscode, "10"];
    ssender.sendWithParam("86", phoneNumber, config.get("smsTencent.templateID"),
      params, "", "", "", callback);
  } catch (error) {
    res.status(500).send(error);
    return;
  }
}

exports.getRandomAttributeSPOList = async (req, res) => {
  try {
    const userID = req.userId;
    database.setCurrentCollection(config.get("openbaseDB.attributeSPOColName"));
    const spoArray = await database.findRandomAttributeSPOs();
    const ret_dict = {
      data: spoArray,
      code: "0"
    }
    res.status(200).send(ret_dict);
  } catch (error) {
    res.status(500).send(error);
  }
}

exports.getRandomRelationshipSPOList = async (req, res) => {
  try {
    const userID = req.userId;
    database.setCurrentCollection(config.get("openbaseDB.relationshipSPOColName"));
    const spoArray = await database.findRandomRelationshipSPOs();
    const ret_dict = {
      data: spoArray,
      code: "0"
    }
    res.status(200).send(ret_dict);
  } catch (error) {
    res.status(500).send(error);
  }
}

exports.labelWrongSPO = async (req, res) => {
  try {
    const { assembledObj } = req.body;
    const userID = req.userId;
    const timeStamp = Date.now();
    const status = "unfinished";
    assembledObj["userID"] = userID;
    assembledObj["timeStamp"] = timeStamp;
    if (assembledObj["type"] === "relationship") {
      assembledObj["status"] = "finished";
    } else {
      assembledObj["status"] = status;
    }
    database.setCurrentCollection(config.get("openbaseDB.reviewedSPOColName"));
    const insert_result = await database.insertOneLabledSPO(assembledObj);
    const inc_result = await database.incrementUserReviewedSPOCount(userID, 1);
    console.log(inc_result);
    const ret_dict = {
      data: insert_result,
      code: "0"
    }
    res.status(200).send(ret_dict);
  } catch (error) {
    res.status(500).send(error);
  }
}

exports.labelRightSPO = async (req, res) => {
  try {
    const { assembledObj } = req.body;
    const userID = req.userId;
    const inc_result = await database.incrementUserReviewedSPOCount(userID, 1);
    console.log(inc_result);
    const ret_dict = {
      data: inc_result,
      code: "0"
    }
    res.status(200).send(ret_dict);
  } catch (error) {
    res.status(500).send(error);
  }
}

exports.getWrongUnfinishedSPOList = async (req, res) => {
  try {
    const userID = req.userId;
    const pageNumber = parseInt(req.query.pageNumber) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5;
    database.setCurrentCollection(config.get("openbaseDB.reviewedSPOColName"));
    const totalCount = await database.getUnfinishedSPOTotalCntByUserId(userID);
    const unfinishedSPOList = await database.findUnfinishedSPOPaginationResultByUserId(userID, pageNumber, pageSize);
    const ret_dict = {
      data: unfinishedSPOList,
      pageNumber,
      pageSize,
      totalCount,
      code: "0"
    }
    res.status(200).send(ret_dict);
  } catch (error) {
    res.status(500).send(error);
  }
}

exports.userStats = async (req, res) => {
  const userID = req.userId;
  const user = await User.findOneByUserID(userID);
  let correctedCnt = 0;
  if ("correctedSPOCount" in user){
    correctedCnt = user.correctedSPOCount;
  }
  let reviewCnt = 0;
  if ("reviewedSPOCount" in user){
    reviewCnt = user.reviewedSPOCount;
  }
  const tUserCnt = await database.totalUserCount();
  let reviewRankedBeforeUserCnt = tUserCnt;
  if (reviewCnt > 0){
    reviewRankedBeforeUserCnt = await database.userRankedBeforeCount(reviewCnt, "reviewedSPOCount");
  }
  let correctedRankedBeforeUserCnt = tUserCnt;
  if (correctedCnt > 0){
    correctedRankedBeforeUserCnt = await database.userRankedBeforeCount(reviewCnt, "correctedSPOCount");
  }
  const rankRatio = (reviewRankedBeforeUserCnt*1.0 / tUserCnt) * 0.4 + (correctedRankedBeforeUserCnt*1.0 / tUserCnt) * 0.6;

  const ret_dict = {
    data: {"reviewedSPOCount":reviewCnt, "correctedSPOCount":correctedCnt, "rankRatio":1.0 - rankRatio},
    code: "0"
  }
  res.status(200).send(ret_dict);
  return;
}

exports.correctedSPO = async (req, res) => {
  try {
    const userID = req.userId;
    const { assembledObj } = req.body;
    if(!("subject" in assembledObj) || !("propertyName" in assembledObj) || !("object" in assembledObj) || !("type" in assembledObj) || !("_id" in assembledObj)){
      const ret_dict = {
        msg: "Invalid 请求body: 至少需要包含下面4个字段: subject, propertyName, object, type, _id!",
        code: "-1"
      }
      res.status(200).send(ret_dict);
      return;
    }

    if("userID" in assembledObj){
      if(assembledObj["userID"] !== userID){
        const ret_dict = {
          msg: "Invalid 请求body: userID字段和当前用户登录的ID不符合!",
          code: "-1"
        }
        res.status(200).send(ret_dict);
        return;
      }
    }

    if(!("ignored" in assembledObj)){
      const ret_dict = {
        msg: "Invalid 请求body: 需要包含ignored字段!",
        code: "-1"
      }
      res.status(200).send(ret_dict);
      return;
    }

    if (assembledObj["ignored"] === true){
      database.setCurrentCollection(config.get("openbaseDB.reviewedSPOColName"));
      const result = await database.deleteOne(assembledObj["_id"]);
      const ret_dict = {
        data: result,
        code: "0"
      }
      res.status(200).send(ret_dict);
      return;
    }else{
      const updatedObj = {};
      updatedObj["_id"] = assembledObj["_id"];
      updatedObj["subject"] = assembledObj["subject"];
      updatedObj["propertyName"] = assembledObj["propertyName"];
      updatedObj["object"] = assembledObj["object"];
      updatedObj["type"] = assembledObj["type"];
      updatedObj["userID"] = userID;
      updatedObj["timeStamp"] = Date.now();
      updatedObj["status"] = "finished";
      database.setCurrentCollection(config.get("openbaseDB.reviewedSPOColName"));
      const result = await database.updateOne(updatedObj);
      const inc_Result = await database.incrementUserCorrectedSPOCount(userID, 1);
      console.log(inc_Result);
      const ret_dict = {
        data: result,
        code: "0"
      }
      res.status(200).send(ret_dict);
      return;
    }

  } catch (error) {
    res.status(500).send(error);
  }
}

function generateNewValidSMSCode() {
  const length = 6;
  let smscode = '';
  const possible = '0123456789';
  for (let i = 0; i < length; i++) {
    smscode += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return smscode;
  //   cache.getCache().exists(smscode, (err, reply) => {
  //     if (reply === 1) {

  //     }
  //   });
}
