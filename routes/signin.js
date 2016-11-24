var sha1 = require('sha1');
var express = require('express');
var router = express.Router();

var UserModel = require('../models/users');
var checkNotLogin = require('../middlewares/check').checkNotLogin;

// GET /signin 登录页
router.get('/', checkNotLogin, function(req, res, next) {
  res.render('signin');
});

// POST /signin 用户登录
router.post('/', checkNotLogin, function(req, res, next) {
  var name = req.fields.name;
  var password = req.fields.password;

  UserModel.getUserByName(name)
    .then(function(user) {
      if(!user) {
        req.flash('error', '用戶不存在');
        return res.redirect('back');
      }

      //檢查密碼是否匹配
      if(sha1(password) !== user.password) {
        req.flash('err', '用戶名或密碼錯誤');
        return res.redirect('back');
      }
      req.flash('success', '登錄成功');
      //用戶信息寫入session
      delete user.password;
      req.session.user = user; //不在session中保存用戶密碼
      res.redirect('/posts');
    })
    .catch(next);
});

module.exports = router;