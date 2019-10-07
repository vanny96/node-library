var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var GenreSchema = new Schema(
    {
        name: String,
        books: [{ type: Schema.Types.ObjectId, ref: "Book", min: 3, max: 100}]
    }
)

GenreSchema
.virtual('url')
.get(function(){
    return "/catalog/genres/" + this._id;
})

module.exports = mongoose.model("Genre", GenreSchema);