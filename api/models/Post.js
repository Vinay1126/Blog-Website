const { SchemaType } = require('mongoose');
const { mongoose } = require('mongoose');
const { Schema, model } = mongoose;

const PostScehma = new Schema({
    title: String,
    summary: String,
    content: String,
    cover: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
}, {
    timestamps: true,
})

const PostModel = model('Post', PostScehma)

module.exports = PostModel