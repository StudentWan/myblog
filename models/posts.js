var marked = require('marked');
var Post = require('../lib/mongo').Post;
var CommentModel = require('./comments');

//給post添加留言數commentsCount
Post.plugin('addCommentsCount', {
    afterFind: function(posts) {
        return Promise.all(posts.map(function (post) {
            return CommentModel.getCommentsCount(post._id).then(function(commentsCount) {
                post.commentsCount = commentsCount;
                return post;
            });
        }));
    },

    afterFindOne: function(post) {
        if(post) {
            return CommentModel.getCommentsCount(post._id).then(function(count) {
                post.commentsCount = count;
                return post;
            });
        }
}
});
//將post的content從markdown轉換爲html
Post.plugin('contentToHtml', {
    afterFind: function(posts) {
        return posts.map(function(post) {
            post.content = marked(post.content);
            return post
        });
    },
    afterFindOne: function(post) {
            if(post) {
                post.content = marked(post.content);
            }
            return post;
        }
    });

module.exports = {
    //創建一篇文章
    create: function create(post) {
        return Post.create(post).exec();
    },

    //通過文章id獲取一篇文章
    getPostById: function getPostById(postId) {
        return Post
            .findOne({ _id: postId })
            .populate({ path: 'author', model: 'User' })
            .addCreatedAt()
            .addCommentsCount()
            .contentToHtml()
            .exec();
    },

    //按創建時間降序獲取所有用戶文章或某個特定用戶的所有文章
    getPosts: function getPosts(author) {
        var query = {};
        if(author) {
            query.author = author;
        }

        return Post
            .find(query)
            .populate({ path: 'author', model: 'User' })
            .sort({ _id: -1 })
            .addCreatedAt()
            .addCommentsCount()
            .contentToHtml()
            .exec();
    },

    //通過文章id給pv加1
    incPv: function incPv(postId) {
        return Post
            .update({ _id: postId }, { $inc: { pv: 1 } })
            .exec();        
    },

    getRawPostById: function getRawPostById(postId) {
        return Post
            .findOne({ _id: postId })
            .populate({ path: 'author', model: 'User' })
            .exec();
    },

    //通過用戶id和文章id更新一篇文章
    updatePostById: function updatePostById(postId, author, data) {
        return Post.update({ author: author, _id: postId }, {$set: data}).exec();
    },   

    //通過用戶id和文章id刪除一篇文章
    delPostById: function delPostById(postId, author) {
        return Post.remove({ author: author, _id: postId }).exec();
    }
}