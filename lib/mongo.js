var config = require('config-lite');
var Mongolass = require('mongolass');
var mongolass = new Mongolass();
mongolass.connect(config.mongodb);

var moment = require('moment');
var objectIdToTimestamp = require('objectid-to-timestamp');

exports.User = mongolass.model('User', {
    name: { type: 'string' },
    password: { type: 'string' },
    avatar: { type: 'string' },
    gender: { type: 'string', enum: ['m', 'f', 'x'] },
    bio: { type: 'string' }
});
exports.User.index({ name: 1 }, { unique: true}).exec();

exports.Post = mongolass.model('Post', {
    author: { type: Mongolass.Types.ObjectId },
    title: { type: 'string' },
    content: { type: 'string' },
    pv: { type: 'number' }
});
exports.Post.index({ author: 1, _id: -1 }).exec();//按創建時間降序查看用戶的文章列表

exports.Comment = mongolass.model('Comment', {
    author: { type: Mongolass.Types.ObjectId },
    content: { type: 'string' },
    postId: { type: Mongolass.Types.ObjectId }
});
exports.Post.index({ postId: 1, _id: 1 }).exec();//通過文章id獲取該文章下所有留言，按留言創建時間升序
exports.Post.index({ author: 1, _id: 1 }).exec();//通過用戶id和留言id刪除一個留言

//根據id生成創建時間created_at
mongolass.plugin('addCreatedAt', {
    afterFind: function(results) {
        return results.map(function(item) {
            item.created_at = moment(objectIdToTimestamp(item._id)).format('YYYY-MM-DD HH:mm');
            return item;
        })
    },
    afterFindOne: function(result) {
        if(result) {
            result.created_at = moment(objectIdToTimestamp(result._id)).format('YYYY-MM-DD HH:mm');
        }
        return result;
    }
})