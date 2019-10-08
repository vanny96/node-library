var Genre = require('../model/genre');
var Book = require('../model/book');
var async = require('async');

const validator = require('express-validator');

// Display list of all Genre.
exports.genre_list = function(req, res, next) {
    Genre.find()
         .sort([['name', 'ascending']])
         .exec(function(err, data){
             if(err) {return next(err)};
             res.render('genrelist', {title: 'Genre List', genrelist: data});
         })
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
              .exec(callback);
        },

        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id })
              .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genredetails', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books } );
    });
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genreform', {title: 'Genre Form'})
};

// Handle Genre create on POST.
exports.genre_create_post = [
   // Validate that the name field is not empty.
  validator.body('name', 'Genre name required').isLength({ min: 1 }).trim(),
  
  // Sanitize (escape) the name field.
  validator.sanitizeBody('name').escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {

    // Extract the validation errors from a request.
    const errors = validator.validationResult(req);

    // Create a genre object with escaped and trimmed data.
    var genre = new Genre(
      { name: req.body.name }
    );


    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('genreform', { title: 'Create Genre', genre: genre, errors: errors.array()});
      return;
    }
    else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      Genre.findOne({ 'name': req.body.name })
        .exec( function(err, found_genre) {
           if (err) { return next(err); }

           if (found_genre) {
             // Genre exists, redirect to its detail page.
             res.redirect(found_genre.url);
           }
           else {

             genre.save(function (err) {
               if (err) { return next(err); }
               // Genre saved. Redirect to genre detail page.
               res.redirect(genre.url);
             });

           }

         });
    }
  }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {

  async.parallel({
    genre: function(callback){
      Genre.findById(req.params.id)
      .exec(callback)
    },

    books: function(callback){
      Book.find({genre: req.params.id}, 'title description')
          .exec(callback)
    }
  }, function (err, result) {
      if(err){return next(err)}
      res.render('genredelete', {title: 'Delete Genre', genre: result.genre, books: result.books})
    }
  )  
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
  async.parallel({
    genre: function(callback){
      Genre.findById(req.params.id)
      .exec(callback)
    },

    books: function(callback){
      Book.find({genre: req.params.id}, 'title description')
          .exec(callback)
    }
  }, function(err, results){
    if(err) {return next(err)}

    if(results.books.length > 0){
      res.render('genredelete', {title: 'Delete Genre', genre: result.genre, books: result.books});
      return;
    } else {
      Genre.deleteOne(results.genre, function(error){
        if(error) throw error;

        res.redirect('/catalog/genres');
      })
    }
  })
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {
    Genre.findById(req.params.id)
    .exec(function(err, result){
      if(err) {return next(err)}

      if(result == null){
        var err = new Error('Book not found');
        err.status = 404;
        return next(err);
      }

      res.render('genreform', {title: 'Genre Update', genre: result});
    })
};

// Handle Genre update on POST.
exports.genre_update_post = [
   // Validate that the name field is not empty.
   validator.body('name', 'Genre name required').isLength({ min: 1 }).trim(),
  
   // Sanitize (escape) the name field.
   validator.sanitizeBody('name').escape(),

  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validator.validationResult(req);

    var genre = new Genre(
      { 
        name: req.body.name,
        _id: req.params.id 
      }
    );

    if(!errors.isEmpty()){
      res.render('genreform', {title: 'Genre Update', genre: genre, errors: errors.array()});
    }

    Genre.findByIdAndUpdate(genre.id, genre)
    .exec(function(err, result){
      if(err) {return next(err)}

      res.redirect(result.url);
    })
  }
];