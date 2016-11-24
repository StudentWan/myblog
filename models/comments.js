var marked = require('marked');
var Comment = require('../lib/mongo').Comment;

//將comment的content從markdown轉換爲html
Comment.plugin('contentToHtml', {
    afterFind: function(comments) {
        return comments.map(function(comment) {
            comment.content = marked(comment.content);
            return comment;
        });
    }
});

module.exports = {
    //創建一個留言
    create: function create(comment) {
        return Comment.create(comment).exec();
    },

    //通過用戶id和留言id刪除一個留言
    delCommentById: function delCommentById(commentId, author) {
        return Comment.remove({ author: author, _id: commentId }).exec();
    },

    //通過文章id獲取該文章下所有留言，按留言創建時間升序
    getComments: function getComments(postId) {
        return Comment
            .find({ postId: postId })
            .populate({ path: 'author', model: 'User' })
            .sort({ _id: 1 })
            .addCreatedAt()
            .contentToHtml()
            .exec();
    },

    //通過文章id獲取該文章下的留言數
    getCommentsCount: function getCommentsCount(postId) {
        return Comment.count({ postId: postId }).exec();
    }
};