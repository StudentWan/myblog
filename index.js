var events = require('events');
var path = require('path');
var express = require('express');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var flash = require('connect-flash');
var config = require('config-lite');
var routes = require('./routes');
var pkg = require('./package');
var winston = require('winston');
var expressWinston = require('express-winston');
const emitter = new events.EventEmitter();
emitter.setMaxListeners(0);

var app = express();

//设置模板目录和引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//设置静态文件目录
app.use(express.static(path.join(__dirname, 'public')));
//session中间件
app.use(session({
    name: config.session.key,//设置cookie中保存session id 的字段名称
    secret: config.session.secret,//通过设置secret来计算hash值并存在cookie中，使产生的signedCookie防篡改
    cookie: {
        maxAge: config.session.maxAge//过期时间，过期后cookie中的session id 自动删除
    },
    store: new MongoStore({//将session存储到mongodb
        url: config.mongodb//mongodb地址
    })
}));

//flash中间件，用来显示通知
app.use(flash());

//處理表單及文件上傳的中間件
app.use(require('express-formidable')({
    uploadDir: path.join(__dirname, 'public/img'),//上傳文件目錄
    keepExtentions:true//保留後綴
}));

//设置模板全局常量
 app.locals.blog = {
    title: '無火的餘灰',
    description: pkg.description
};

//添加模板必需的三个变量
app.use(function (req, res, next) {
    res.locals.user = req.session.user;
    res.locals.success = req.flash('success').toString();
    res.locals.error = req.flash('error').toString();
    next();
});

//正常請求的日誌
app.use(expressWinston.logger({
    transports: [
        new winston.transports.Console({
            json: true,
            colorize: true
        }),
        new winston.transports.File({
            filename: 'logs/success.log'
        })
    ]
}));
//路由
routes(app);
//錯誤請求的日誌
app.use(expressWinston.errorLogger({
    transports: [
        new winston.transports.Console({
            json: true,
            colorize: true
        }),
        new winston.transports.File({
            filename: 'logs/error.log'
        })
    ]
}));

//error page
app.use(function(err, req, res, next) {
    res.render('error', {
        error: err
    });
});
app.listen(config.port, function() {
    console.log(pkg.name + ' listening on port ' + config.port);
});
