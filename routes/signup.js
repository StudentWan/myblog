var path = require('path');
var sha1 = require('sha1');
var express = require('express');
var router = express.Router();

var UserModel = require('../models/users');
var checkNotLogin = require('../middlewares/check').checkNotLogin;

// GET /signup 注册页
router.get('/', checkNotLogin, function (req, res, next) {
  res.render('signup');
});

// POST /signup 用户注册
router.post('/', checkNotLogin, function (req, res, next) {
  var name = req.fields.name;
  var gender = req.fields.gender;
  var bio = req.fields.bio;
  var avatar = req.files.avatar.path.split(path.sep).pop();
  var password = req.fields.password;
  var repassword = req.fields.repassword;

  //校驗參數
  try {
    if (!(name.length >= 1 && name.length <= 10)) {
      throw new Error('名字請限制在1-10個字符');
    }
    if (['m', 'f', 'x'].indexOf(gender) === -1) {
      throw new Error('性別只能是m、f或x');
    }
    if (!(bio.length >= 1 && bio.length <= 30)) {
      throw new Error('個人簡介請限制在1-30個字符');
    }
    if (!req.files.avatar.name) {
      throw new Error('沒有設置頭像');
    }
    if (password.length < 6) {
      throw new Error('密碼至少6個字符');
    }
    if (password !== repassword) {
      throw new Error('兩次輸入密碼不一致');
    }
  } catch (e) {
    req.flash('error', e.message);
    return res.redirect('/signup');
  }

  //明文密碼加密
  password = sha1(password);

  //待寫入數據庫的用戶信息
  var user = {
    name: name,
    password: password,
    gender: gender,
    bio: bio,
    avatar: avatar
  };
  //用戶信息寫入數據庫
  UserModel.create(user)
    .then(function (result) {
      //此user是插入mongodb後的值，包含_id
      user = result.ops[0];
      //將用戶信息存入session
      delete user.password; //不在session中保存密碼
      req.session.user = user;
      //寫入flash
      req.flash('success', '註冊成功');
      //跳轉到首頁
      res.redirect('/posts');
    }).catch(function (e) {
      if (e.message.match('E11000 duplicate key')) {
        req.flash('error', '用戶名已被佔用');
        return res.redirect('/signup');
      }
      next(e);
    }
    );
});

module.exports = router;