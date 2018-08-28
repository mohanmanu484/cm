var express = require('express');
const Post = require('../models/Post');
const fs = require('fs');

const Response = require('../models/Response')
const promise = require('promise');
var bodyParser = require('body-parser');
var Client = require('node-rest-client').Client;
var mongoosePaginate = require('mongoose-paginate');
var cron = require('node-cron');

// create application/json parser
var jsonParser = bodyParser.json({
  limit: '10mb'
});

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({
  limit: '100mb',
  extended: false
});
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Express'
  });
});

cron.schedule('0-59 * * * *', function() {
  fetchFromInstaAndinsert(null);
});

router.get('/api/posts', function(req, res, next) {

  var query = {};
  var limit = Number(req.query.limit) || 10;
  var offset = Number(req.query.offset) || 0;
  var options = {
    sort: {
      timestamp: -1
    },
    offset: offset,
    limit: limit
  };

  Post.paginate(query, options).then(function(result) {

    res.json(new Response(result.docs, null, 200));
  }).catch(function(err) {
    return res.json(new Response(null, err, 400));
  });

  return;



  Post.find({}, function(err, resp) {
    if (err) {
      return res.json(new Response(null, err, 400));
    }
    res.json(new Response(resp, null, 200));
  });
});

router.post('/api/posts', urlencodedParser, function(req, res) {

  fetchFromInstaAndinsert(res);
});


function fetchFromInstaAndinsert(res) {
  var client = new Client();

  var args = {
    requestConfig: {
      timeout: 5000, //request timeout in milliseconds
      noDelay: true, //Enable/disable the Nagle algorithm
      keepAlive: true, //Enable/disable keep-alive functionalityidle socket.
      keepAliveDelay: 1000 //and optionally set the initial delay before the first keepalive probe is sent
    },
    responseConfig: {
      timeout: 5000 //response timeout
    }
  };

  // direct way
  client.get("https://www.instagram.com/explore/tags/cricket/?__a=1", args, function(data, response) {

    //console.log(data);
    console.log(response);
    var respArr = parseData(data);



    //  let rawdata = fs.readFileSync('/home/mohang/Documents/mohan/memes/memes/routes/pojo.json');
    //  var arr = JSON.parse(rawdata);
    //  return res.json(respArr);


    var bulk = Post.collection.initializeOrderedBulkOp();

    respArr.forEach(function(item) {
      bulk.find({
        post_id: item.post_id
      }).upsert().updateOne(item);
    });
    bulk.execute(function(err, resp) {
      if (res) {
        if (err) {
          return res.json(err);
        }
        res.json(resp);
      }
      console.log(resp);
    });

  });
}



function parseData(body) {

  var data = body.graphql.hashtag

  var resp = [];

  var edges = data.edge_hashtag_to_media.edges;

  edges.forEach(function(edge) {
    var post = {};

    post.tag_id = body.graphql.hashtag.id;
    post.tag_name = body.graphql.hashtag.name;
    post.display_url = edge.node.display_url;
    post.post_id = edge.node.id;
    console.log(post.postId);
    post.thumbnail_url = edge.node.thumbnail_src;
    post.is_video = edge.node.is_video;
    post.timestamp = edge.node.taken_at_timestamp;
    var caption = edge.node.edge_media_to_caption;
    var textEdges = edge.node.edge_media_to_caption.edges[0];
    if (textEdges) {
      post.text = textEdges.node.text;
    }

    resp.push(post);
  });

  var topEdges = data.edge_hashtag_to_top_posts.edges;
  topEdges.forEach(function(edge) {
    var post = {};

    post.tag_id = body.graphql.hashtag.id;
    post.tag_name = body.graphql.hashtag.name;
    post.display_url = edge.node.display_url;
    post.post_id = edge.node.id;
    console.log(post.postId);
    post.thumbnail_url = edge.node.thumbnail_src;
    post.is_video = edge.node.is_video;
    post.timestamp = edge.node.taken_at_timestamp;
    post.text = edge.node.edge_media_to_caption.edges[0].node.text;
    resp.push(post);
  });
  return resp;
}

function update(post) {

  return new Promise(function(reject, resolve) {

    Post.updateOne({
      post_id: post.post_id
    }, post, {
      upsert: true,
      new: true,
      multi: true
    }, function(err, newPost) {

      if (err) {
        console.log("err for " + newPost);
        return reject(err);
      }
      //  console.log("sucess for " + newPost);
      resolve(newPost);

    })
  });



}







module.exports = router;