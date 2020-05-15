const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/signup', userController.signup);

router.post('/login', userController.login);

router.post('/smscode', userController.smscode);

router.get('/randomAttributeSPOList', userController.checkAccessToken, userController.allowIfLoggedin,userController.getRandomAttributeSPOList);

router.get('/randomRelationshipSPOList', userController.checkAccessToken, userController.allowIfLoggedin,userController.getRandomRelationshipSPOList);

router.post('/labelWrongSPO', userController.checkAccessToken, userController.allowIfLoggedin,userController.labelWrongSPO);

router.post('/labelRightSPO', userController.checkAccessToken, userController.allowIfLoggedin,userController.labelRightSPO);

// /api/wrongUnfinisedSPOList?pageNumber=1&pageSize=5
router.get('/wrongUnfinisedSPOList', userController.checkAccessToken, userController.allowIfLoggedin,userController.getWrongUnfinishedSPOList);

router.post('/correctedSPO', userController.checkAccessToken, userController.allowIfLoggedin,userController.correctedSPO);

router.get('/userStats', userController.checkAccessToken, userController.allowIfLoggedin, userController.userStats);

//router.get('/users', userController.allowIfLoggedin,  userController.getUsers);

//router.put('/user/:userId', userController.allowIfLoggedin,  userController.updateUser);

//router.delete('/user/:userId', userController.allowIfLoggedin,  userController.deleteUser);

//router.get('/userInfo', userController.checkAccessToken, userController.allowIfLoggedin, userController.getUser);

module.exports = router;