var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;
var Post = require

var PostSchema = Schema({
  post_id: {
    type: String
  },
  shortcode: String,
  tag_id: String,
  tag_name: String,
  text: String,
  display_url: String,
  thumbnail_url: String,
  is_video: Boolean,
  timestamp: Number
});
PostSchema.plugin(mongoosePaginate);



module.exports = mongoose.model('Post', PostSchema);
module.exports.fetchPoems = function(post, callback) {

  post.find({}, function(err, resp) {

    if (err) {
      return callback(err, null);
    }
    return callback(null, resp);

  });

}